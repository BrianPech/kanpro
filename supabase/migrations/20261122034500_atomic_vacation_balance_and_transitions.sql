-- Migration: 20261122034500_atomic_vacation_balance_and_transitions.sql
-- Description: Residuo #4 (auditoría hallazgo #10):
--   1. Filtra días de vacaciones comprometidos/tomados al ciclo anual actual (America/Cancun).
--   2. Garantiza saldo 0 si la fecha de ingreso es futura o igual a hoy.
--   3. Valida transiciones de estado y saldo de vacaciones de forma atómica con pg_advisory_xact_lock
--      para evitar sobregiro ante solicitudes o aprobaciones concurrentes.

-- 1. Tabla Art. 76 LFT (Vacaciones Dignas) en SQL -----------------------------
CREATE OR REPLACE FUNCTION public.lft_vacation_days_for_year(p_year integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_year IS NULL OR p_year <= 0 THEN 0
    WHEN p_year = 1 THEN 12
    WHEN p_year = 2 THEN 14
    WHEN p_year = 3 THEN 16
    WHEN p_year = 4 THEN 18
    WHEN p_year = 5 THEN 20
    WHEN p_year BETWEEN 6 AND 10 THEN 22
    WHEN p_year BETWEEN 11 AND 15 THEN 24
    WHEN p_year BETWEEN 16 AND 20 THEN 26
    WHEN p_year BETWEEN 21 AND 25 THEN 28
    WHEN p_year BETWEEN 26 AND 30 THEN 30
    ELSE 32
  END;
$$;

-- 2. Índice para consultas de saldo por ciclo anual ---------------------------
CREATE INDEX IF NOT EXISTS idx_company_leaves_cycle_lookup
  ON public.company_leaves (company_id, employee_id, request_type, status, start_date);

-- 3. Trigger atómico de transiciones y saldo vacacional -----------------------
CREATE OR REPLACE FUNCTION public.enforce_company_leave_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp_id uuid := NEW.employee_id;
  v_cand_id uuid := NEW.candidate_id;
  v_hire_date date;
  v_contract_start date;
  v_today date := (now() AT TIME ZONE 'America/Cancun')::date;
  v_age interval;
  v_completed_years integer := 0;
  v_completed_months integer := 0;
  v_accrued integer := 0;
  v_cycle_start date;
  v_committed integer := 0;
  v_approval_mode text := 'single_step';
  v_lock_key text;
BEGIN
  -- Resolver identidad canónica del colaborador para serializar concurrencia
  IF v_emp_id IS NOT NULL THEN
    SELECT
      COALESCE(e.hire_date, (e.created_at AT TIME ZONE 'America/Cancun')::date),
      COALESCE(v_cand_id, e.employee_id)
    INTO v_hire_date, v_cand_id
    FROM public.company_employees e
    WHERE e.id = v_emp_id
      AND e.company_id = NEW.company_id
    LIMIT 1;
  ELSIF v_cand_id IS NOT NULL THEN
    SELECT
      e.id,
      COALESCE(e.hire_date, (e.created_at AT TIME ZONE 'America/Cancun')::date)
    INTO v_emp_id, v_hire_date
    FROM public.company_employees e
    WHERE e.employee_id = v_cand_id
      AND e.company_id = NEW.company_id
    ORDER BY e.created_at DESC
    LIMIT 1;
  END IF;

  -- Serializar todas las inserciones y actualizaciones de este colaborador en esta transacción
  v_lock_key := 'company_leaves_integrity:' || NEW.company_id::text || ':' || COALESCE(v_emp_id::text, v_cand_id::text, NEW.id::text);
  PERFORM pg_advisory_xact_lock(hashtext(v_lock_key));

  -- A) Validar transiciones de estado en UPDATE
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status IN ('aprobada', 'rechazada') THEN
      RAISE EXCEPTION 'La solicitud ya fue resuelta (%) y no puede cambiar de estado.', OLD.status
        USING ERRCODE = 'P0001';
    END IF;

    IF OLD.status = 'visto_bueno' AND NEW.status = 'pendiente' THEN
      RAISE EXCEPTION 'Transición de estado inválida de visto_bueno a pendiente.'
        USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(cp.leave_approval_config->>'approvalMode', 'single_step')
    INTO v_approval_mode
    FROM public.company_profiles cp
    WHERE cp.id = NEW.company_id
    LIMIT 1;

    IF v_approval_mode = 'two_step' AND OLD.status = 'pendiente' AND NEW.status = 'aprobada' THEN
      RAISE EXCEPTION 'Falta el Vo.Bo. del líder de área antes de la aprobación de RH.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- B) Validar saldo de vacaciones en el ciclo anual actual para solicitudes activas
  IF NEW.request_type = 'vacaciones'
     AND NEW.status IN ('pendiente', 'visto_bueno', 'aprobada') THEN
    IF v_cand_id IS NOT NULL THEN
      SELECT c.start_date
      INTO v_contract_start
      FROM public.company_contracts c
      WHERE c.company_id = NEW.company_id
        AND c.candidate_id = v_cand_id
        AND c.status <> 'cancelado'
      ORDER BY c.created_at DESC
      LIMIT 1;

      IF v_hire_date IS NULL THEN
        v_hire_date := v_contract_start;
      END IF;
    END IF;

    IF v_hire_date IS NULL OR v_today <= v_hire_date THEN
      v_accrued := 0;
      v_cycle_start := v_today;
    ELSE
      v_age := age(v_today, v_hire_date);
      v_completed_years := GREATEST(0, EXTRACT(YEAR FROM v_age)::integer);
      v_completed_months := GREATEST(0, EXTRACT(MONTH FROM v_age)::integer);

      IF v_completed_years = 0 THEN
        v_accrued := FLOOR((12 * v_completed_months)::numeric / 12)::integer;
      ELSE
        v_accrued := public.lft_vacation_days_for_year(v_completed_years);
      END IF;

      v_cycle_start := (v_hire_date + make_interval(years => v_completed_years))::date;
    END IF;

    SELECT COALESCE(SUM(l.total_working_days), 0)::integer
    INTO v_committed
    FROM public.company_leaves l
    WHERE l.company_id = NEW.company_id
      AND l.request_type = 'vacaciones'
      AND l.status IN ('pendiente', 'visto_bueno', 'aprobada')
      AND l.start_date >= v_cycle_start
      AND (TG_OP = 'INSERT' OR l.id <> NEW.id)
      AND (
        (v_emp_id IS NOT NULL AND l.employee_id = v_emp_id)
        OR (v_cand_id IS NOT NULL AND l.candidate_id = v_cand_id)
      );

    IF v_committed + NEW.total_working_days > v_accrued THEN
      RAISE EXCEPTION 'Saldo de vacaciones insuficiente. Disponible: % día(s), solicitado: % día(s).',
        GREATEST(0, v_accrued - v_committed),
        NEW.total_working_days
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_company_leave_integrity ON public.company_leaves;
CREATE TRIGGER trg_enforce_company_leave_integrity
  BEFORE INSERT OR UPDATE ON public.company_leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_company_leave_integrity();
