-- Migration: 20261121180000_normalize_employee_base_salary_monthly.sql
-- Description: Normaliza company_employees.base_salary_monthly a equivalente mensual
-- según payment_frequency (quincenal×2, semanal×30/7, catorcenal×30/14).

UPDATE public.company_employees
SET base_salary_monthly = CASE lower(coalesce(payment_frequency, 'quincenal'))
  WHEN 'quincenal' THEN ROUND(base_salary_monthly * 2, 2)
  WHEN 'semanal' THEN ROUND((base_salary_monthly * 30.0) / 7.0, 2)
  WHEN 'catorcenal' THEN ROUND((base_salary_monthly * 30.0) / 14.0, 2)
  ELSE base_salary_monthly
END
WHERE base_salary_monthly IS NOT NULL
  AND base_salary_monthly > 0
  AND lower(coalesce(payment_frequency, 'quincenal')) IN ('quincenal', 'semanal', 'catorcenal');
