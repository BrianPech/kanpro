import { createClient } from "@/lib/supabase/server";
import {
  CompanyReportsData,
  ReportsExecutiveKPIs,
  QuickInsight,
  ReportDefinition,
} from "../types/reports";
import { calculateLFTVacationDays } from "../utils/vacation-calculator";

export async function getCompanyReportsData(): Promise<CompanyReportsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Baseline empty fallback
  const emptyResult: CompanyReportsData = {
    companyName: "Mi Empresa",
    kpis: {
      activeEmployees: 0,
      totalEmployees: 0,
      retentionRate: 100,
      totalMonthlyPayroll: 0,
      averageSalary: 0,
      totalAccruedVacationDays: 0,
      totalContractsCount: 0,
      totalEvaluationsCount: 0,
      evaluationsAverageScore: 0,
    },
    insights: [],
    reports: [],
    departments: [],
  };

  if (!user) {
    return emptyResult;
  }

  // Fetch all related entities from Supabase in parallel
  const [
    companyProfileRes,
    employeesRes,
    contractsRes,
    evaluationsRes,
    vacanciesRes,
  ] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("company_name, legal_name, rfc, fiscal_address")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("company_employees")
      .select(`
        id,
        employee_id,
        full_name,
        phone,
        email,
        avatar_url,
        job_title,
        department,
        employee_code,
        rfc,
        curp,
        nss,
        hire_date,
        base_salary_monthly,
        payment_frequency,
        work_schedule,
        status,
        termination_date,
        termination_reason,
        created_at
      `)
      .eq("company_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("company_contracts")
      .select(`
        id,
        folio,
        job_title,
        department,
        contract_type,
        template_type,
        start_date,
        end_date,
        salary,
        payment_frequency,
        company_signed,
        employee_signed,
        status,
        company_employees (
          id,
          full_name
        )
      `)
      .eq("company_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("company_evaluations")
      .select(`
        id,
        employee_name,
        job_title,
        department,
        period,
        evaluation_date,
        evaluator_name,
        average_score,
        punctuality_score,
        attendance_score,
        productivity_score,
        teamwork_score,
        customer_service_score,
        goals_score,
        status,
        created_at
      `)
      .eq("company_id", user.id)
      .order("evaluation_date", { ascending: false }),
    supabase
      .from("vacancies")
      .select(`
        id,
        title,
        category,
        location,
        zone,
        salary_min,
        salary_max,
        status,
        is_active,
        created_at,
        applications (
          id,
          status
        )
      `)
      .eq("company_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const companyName =
    companyProfileRes.data?.company_name ||
    companyProfileRes.data?.legal_name ||
    "Mi Empresa";

  const rawEmployees = employeesRes.data || [];
  const rawContracts = contractsRes.data || [];
  const rawEvaluations = evaluationsRes.data || [];
  const rawVacancies = vacanciesRes.data || [];

  const totalEmployees = rawEmployees.length;
  const activeEmployees = rawEmployees.filter(
    (e: any) => e.status !== "terminated"
  );
  const activeCount = activeEmployees.length;
  const retentionRate =
    totalEmployees > 0
      ? Math.round((activeCount / totalEmployees) * 100)
      : 100;

  // Extract unique departments
  const departmentSet = new Set<string>();
  activeEmployees.forEach((e: any) => {
    if (e.department?.trim()) {
      departmentSet.add(e.department.trim());
    }
  });
  const departments = Array.from(departmentSet).sort();

  // 1. Payroll Calculations
  let totalMonthlyPayroll = 0;
  activeEmployees.forEach((e: any) => {
    totalMonthlyPayroll += Number(e.base_salary_monthly) || 0;
  });
  const averageSalary =
    activeCount > 0 ? Math.round(totalMonthlyPayroll / activeCount) : 0;

  // 2. Vacation & LFT Seniority Calculations
  let totalAccruedVacationDays = 0;
  let totalEstimatedVacationLiability = 0;

  const processedEmployees = activeEmployees.map((e: any) => {
    const hireDateStr = e.hire_date || e.created_at;
    const lft = calculateLFTVacationDays(hireDateStr);
    const monthlySalary = Number(e.base_salary_monthly) || 0;
    const dailySalary = Math.round(monthlySalary / 30);
    const vacationDays = lft.currentYearEntitlement;
    const vacationLiability = vacationDays * dailySalary;
    const primaVacacional = Math.round(vacationLiability * 0.25);

    totalAccruedVacationDays += vacationDays;
    totalEstimatedVacationLiability += vacationLiability + primaVacacional;

    return {
      ...e,
      lft,
      dailySalary,
      vacationDays,
      vacationLiability,
      primaVacacional,
    };
  });

  // 3. Contracts Calculation
  const now = new Date();
  const processedContracts = rawContracts.map((c: any) => {
    const emp = Array.isArray(c.company_employees)
      ? c.company_employees[0]
      : c.company_employees;
    const isIndeterminado = c.template_type === "indeterminado" || !c.end_date;
    let daysRemaining = 999;
    if (!isIndeterminado && c.end_date) {
      const diffMs = new Date(c.end_date).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      ...c,
      employeeName: emp?.full_name || "Colaborador",
      isIndeterminado,
      daysRemaining,
    };
  });

  // 4. Evaluations Calculation
  let sumEvalScores = 0;
  rawEvaluations.forEach((ev: any) => {
    sumEvalScores += Number(ev.average_score) || 0;
  });
  const evaluationsAverageScore =
    rawEvaluations.length > 0
      ? Number((sumEvalScores / rawEvaluations.length).toFixed(1))
      : 0;

  // KPIs Summary
  const kpis: ReportsExecutiveKPIs = {
    activeEmployees: activeCount,
    totalEmployees,
    retentionRate,
    totalMonthlyPayroll,
    averageSalary,
    totalAccruedVacationDays,
    totalContractsCount: rawContracts.length,
    totalEvaluationsCount: rawEvaluations.length,
    evaluationsAverageScore,
  };

  // 5. Build Dynamic Quick Insights (100% Real Data)
  const insights: QuickInsight[] = [];

  // Insight 1: Seniority / Retention
  if (processedEmployees.length > 0) {
    const mostSenior = [...processedEmployees].sort(
      (a, b) => b.lft.yearsOfService - a.lft.yearsOfService
    )[0];

    insights.push({
      id: "qi-seniority",
      question: "¿Cuál es el colaborador con mayor antigüedad en la empresa?",
      category: "Talento & Retención",
      headline: `${mostSenior.full_name} lidera la antigüedad de la plantilla`,
      metric: mostSenior.lft.formattedSeniority,
      metricSubtitle: `${mostSenior.vacationDays} días de vacaciones por ley`,
      badge: `${retentionRate}% Retención`,
      explanation: `Ingresó el ${mostSenior.hire_date || "inicio de operaciones"} desempeñándose como ${mostSenior.job_title} en ${mostSenior.department}. La tasa de retención global de la empresa es del ${retentionRate}%.`,
      linkHref: `/dashboard/company/employees`,
      linkLabel: "Ver Plantilla de Colaboradores",
    });
  } else {
    insights.push({
      id: "qi-seniority-empty",
      question: "¿Cuál es el nivel de retención de personal?",
      category: "Talento & Retención",
      headline: "Sin colaboradores activos registrados",
      metric: "0 colab.",
      metricSubtitle: "Plantilla en formación",
      badge: "Inicial",
      explanation:
        "Registra o invita a tus colaboradores para consultar métricas de antigüedad y rotación de personal.",
      linkHref: "/dashboard/company/employees?action=new",
      linkLabel: "+ Registrar Colaborador",
    });
  }

  // Insight 2: Vacation Liability (LFT)
  insights.push({
    id: "qi-vacations",
    question: "¿Cuál es el pasivo laboral en vacaciones acumuladas (LFT)?",
    category: "Vacaciones LFT",
    headline: `${totalAccruedVacationDays} días de vacaciones ganadas en la plantilla`,
    metric: `${totalAccruedVacationDays} días`,
    metricSubtitle: `Saldo global acumulado`,
    badge: `Art. 76 LFT`,
    explanation: `Calculado bajo la reforma de Vacaciones Dignas. El pasivo vacacional estimado equivale a $${totalEstimatedVacationLiability.toLocaleString("es-MX")} MXN (incluyendo el 25% de prima vacacional de ley).`,
    linkHref: `/dashboard/company/employees`,
    linkLabel: "Ver Detalle por Colaborador",
  });

  // Insight 3: Payroll & Department Breakdown
  if (totalMonthlyPayroll > 0) {
    // Find department with largest headcount
    const deptCounts: Record<string, { count: number; total: number }> = {};
    activeEmployees.forEach((e: any) => {
      const d = e.department || "Operaciones";
      if (!deptCounts[d]) deptCounts[d] = { count: 0, total: 0 };
      deptCounts[d].count++;
      deptCounts[d].total += Number(e.base_salary_monthly) || 0;
    });

    const topDept = Object.entries(deptCounts).sort(
      (a, b) => b[1].total - a[1].total
    )[0];

    insights.push({
      id: "qi-payroll",
      question: "¿Cuál es la masa salarial mensual y el área con mayor costo?",
      category: "Finanzas & Nómina",
      headline: `$${totalMonthlyPayroll.toLocaleString("es-MX")} MXN en dispersión mensual bruta`,
      metric: `$${totalMonthlyPayroll.toLocaleString("es-MX")}`,
      metricSubtitle: `Promedio: $${averageSalary.toLocaleString("es-MX")} / colab`,
      badge: `${activeCount} Sueldos Activos`,
      explanation: topDept
        ? `El departamento de ${topDept[0]} representa el mayor volumen con $${topDept[1].total.toLocaleString("es-MX")} MXN mensuales distribuidos en ${topDept[1].count} puesto(s).`
        : "Masa salarial calculada con base en los salarios mensuales vigentes.",
      linkHref: `/dashboard/company`,
      linkLabel: "Ver Tablero Financiero",
    });
  } else {
    insights.push({
      id: "qi-payroll-empty",
      question: "¿Cuál es el costo salarial estimado de la empresa?",
      category: "Finanzas & Nómina",
      headline: "Sin salarios asignados en la plantilla",
      metric: "$0 MXN",
      metricSubtitle: "0 colaboradores con sueldo base",
      badge: "Por Asignar",
      explanation:
        "Define los salarios base mensuales en el expediente de cada colaborador para calcular el presupuesto.",
      linkHref: `/dashboard/company/employees`,
      linkLabel: "Configurar Sueldos",
    });
  }

  // Insight 4: Contracts Expiration
  const expiringContracts = processedContracts.filter(
    (c: any) => !c.isIndeterminado && c.daysRemaining <= 30
  );
  if (expiringContracts.length > 0) {
    insights.push({
      id: "qi-contracts-expiring",
      question: "¿Qué contratos requieren renovación o vencen este mes?",
      category: "Contratos & Legal",
      headline: `${expiringContracts.length} contrato(s) por vencer en los próximos 30 días`,
      metric: `${expiringContracts.length} contratos`,
      metricSubtitle: `Atención requerida`,
      badge: "Alerta Legal",
      badgeColor: "text-amber-600 bg-amber-500/10",
      explanation: `Hay contratos con fecha límite establecida que requieren evaluación para extensión a tiempo indeterminado (planta LFT) o finiquito laboral.`,
      linkHref: `/dashboard/company/contracts`,
      linkLabel: "Revisar Contratos",
    });
  } else {
    insights.push({
      id: "qi-contracts-ok",
      question: "¿Cuál es el estatus de los contratos laborales de la empresa?",
      category: "Contratos & Legal",
      headline:
        rawContracts.length > 0
          ? `${rawContracts.length} contrato(s) registrados y al día`
          : "Sin contratos con fecha de vencimiento inmediata",
      metric: `${rawContracts.length}`,
      metricSubtitle: "Contratos vigentes",
      badge: "Al Día",
      badgeColor: "text-emerald-600 bg-emerald-500/10",
      explanation:
        rawContracts.length > 0
          ? "Todos los colaboradores cuentan con contratos vigentes sin vencimientos críticos en los próximos 30 días."
          : "Puedes generar contratos laborales formales con firma electrónica desde el módulo de Contratos.",
      linkHref: `/dashboard/company/contracts`,
      linkLabel: "Ir a Contratos",
    });
  }

  // Insight 5: Performance 360 Evaluations
  if (rawEvaluations.length > 0) {
    const topEval = [...rawEvaluations].sort(
      (a, b) => Number(b.average_score) - Number(a.average_score)
    )[0];

    insights.push({
      id: "qi-evaluations",
      question: "¿Cuál es el desempeño global de la plantilla en las Evaluaciones 360?",
      category: "Desempeño & Competencias",
      headline: `${evaluationsAverageScore} / 5.0 es el promedio de desempeño general`,
      metric: `${evaluationsAverageScore} ★`,
      metricSubtitle: `${rawEvaluations.length} evaluaciones registradas`,
      badge: evaluationsAverageScore >= 4 ? "Excelente" : "Satisfactorio",
      explanation: `${topEval.employee_name} destaca con un promedio de ${topEval.average_score} en el periodo "${topEval.period}" para el área de ${topEval.department || "Operaciones"}.`,
      linkHref: `/dashboard/company/evaluations`,
      linkLabel: "Ver Evaluaciones 360",
    });
  } else {
    insights.push({
      id: "qi-evaluations-empty",
      question: "¿Cómo consultar el promedio de desempeño de la empresa?",
      category: "Desempeño & Competencias",
      headline: "Sin evaluaciones 360 registradas aún",
      metric: "N/A",
      metricSubtitle: "0 evaluaciones",
      badge: "Pendiente",
      explanation:
        "Aplica cuestionarios de 6 competencias para evaluar la productividad, puntualidad y trabajo en equipo de tus colaboradores.",
      linkHref: `/dashboard/company/evaluations`,
      linkLabel: "Realizar Nueva Evaluación",
    });
  }

  // 6. Build Official HR Reports Datasets
  const reports: ReportDefinition[] = [
    // Report 1: Censo de Plantilla
    {
      id: "censo_plantilla",
      title: "1. Censo de Plantilla & Directorio Activo",
      category: "talento",
      categoryLabel: "Talento & Plantilla",
      description:
        "Directorio oficial consolidado con RFC, CURP, NSS, datos de contacto, departamento, sueldo y fecha de contratación.",
      recommendedFrequency: "Mensual / Auditoría IMSS",
      recordCount: rawEmployees.length,
      columns: [
        { key: "codigo", label: "Cód. Empleado" },
        { key: "nombre", label: "Nombre Completo" },
        { key: "puesto", label: "Puesto de Trabajo" },
        { key: "departamento", label: "Departamento" },
        { key: "estatus", label: "Estatus" },
        { key: "fecha_ingreso", label: "Fecha de Ingreso", format: "date" },
        { key: "salario_mensual", label: "Sueldo Mensual", format: "currency" },
        { key: "frecuencia", label: "Frecuencia Pago" },
        { key: "rfc", label: "RFC" },
        { key: "curp", label: "CURP" },
        { key: "nss", label: "NSS" },
        { key: "telefono", label: "Teléfono" },
        { key: "email", label: "Correo Electrónico" },
      ],
      data: rawEmployees.map((e: any, idx: number) => ({
        codigo: e.employee_code || `EMP-${String(idx + 1).padStart(3, "0")}`,
        nombre: e.full_name,
        puesto: e.job_title || "Colaborador",
        departamento: e.department || "Operaciones",
        estatus: e.status === "terminated" ? "Baja" : "Activo",
        fecha_ingreso: e.hire_date || e.created_at?.split("T")[0] || "No reg.",
        salario_mensual: Number(e.base_salary_monthly) || 0,
        frecuencia: e.payment_frequency || "Quincenal",
        rfc: e.rfc || "No registrado",
        curp: e.curp || "No registrado",
        nss: e.nss || "No registrado",
        telefono: e.phone || "No registrado",
        email: e.email || "No registrado",
      })),
    },

    // Report 2: Vacaciones LFT
    {
      id: "vacaciones_lft",
      title: "2. Reporte de Vacaciones & Saldos LFT",
      category: "talento",
      categoryLabel: "Talento & Plantilla",
      description:
        "Cálculo legal bajo la Reforma de Vacaciones Dignas (Art. 76 LFT), antigüedad exacta, pasivo laboral y prima vacacional del 25%.",
      recommendedFrequency: "Mensual / Cierre Contable",
      recordCount: processedEmployees.length,
      columns: [
        { key: "nombre", label: "Colaborador" },
        { key: "puesto", label: "Puesto" },
        { key: "departamento", label: "Departamento" },
        { key: "fecha_ingreso", label: "Fecha de Ingreso", format: "date" },
        { key: "antiguedad", label: "Antigüedad LFT" },
        { key: "dias_ley", label: "Días por Ley (Art. 76)", format: "number" },
        { key: "salario_diario", label: "Salario Diario", format: "currency" },
        {
          key: "pasivo_vacaciones",
          label: "Pasivo Estimado",
          format: "currency",
        },
        {
          key: "prima_vacacional",
          label: "Prima Vacacional (25%)",
          format: "currency",
        },
      ],
      data: processedEmployees.map((e: any) => ({
        nombre: e.full_name,
        puesto: e.job_title || "Colaborador",
        departamento: e.department || "Operaciones",
        fecha_ingreso: e.hire_date || e.created_at?.split("T")[0] || "No reg.",
        antiguedad: e.lft.formattedSeniority,
        dias_ley: e.vacationDays,
        salario_diario: e.dailySalary,
        pasivo_vacaciones: e.vacationLiability,
        prima_vacacional: e.primaVacacional,
      })),
    },

    // Report 3: Contratos & Vigencias
    {
      id: "contratos_vigencias",
      title: "3. Reporte de Contratos Laborales & Vigencias",
      category: "legal",
      categoryLabel: "Contratos & Legal",
      description:
        "Relación de contratos registrados en Supabase, folios oficiales, tipos de jornada, vigencias y firmas electrónicas patronal/trabajador.",
      recommendedFrequency: "Quincenal / Cierre Contractual",
      recordCount: processedContracts.length,
      columns: [
        { key: "folio", label: "Folio Oficial" },
        { key: "colaborador", label: "Colaborador" },
        { key: "puesto", label: "Puesto" },
        { key: "departamento", label: "Departamento" },
        { key: "tipo_contrato", label: "Tipo de Contrato" },
        { key: "fecha_inicio", label: "Fecha Inicio", format: "date" },
        { key: "fecha_fin", label: "Fecha Vencimiento" },
        { key: "dias_restantes", label: "Días Restantes", format: "number" },
        { key: "salario", label: "Salario Pactado", format: "currency" },
        { key: "firma_empresa", label: "Firma Patrón" },
        { key: "firma_colaborador", label: "Firma Trabajador" },
        { key: "estatus", label: "Estatus" },
      ],
      data: processedContracts.map((c: any) => ({
        folio: c.folio || `CTR-${c.id.slice(0, 6).toUpperCase()}`,
        colaborador: c.employeeName,
        puesto: c.job_title || "Colaborador",
        departamento: c.department || "Operaciones",
        tipo_contrato: c.contract_type || "Determinado",
        fecha_inicio: c.start_date || "No reg.",
        fecha_fin: c.isIndeterminado ? "Indeterminado" : c.end_date,
        dias_restantes: c.isIndeterminado ? 999 : c.daysRemaining,
        salario: Number(c.salary) || 0,
        firma_empresa: c.company_signed ? "Firmado" : "Pendiente",
        firma_colaborador: c.employee_signed ? "Firmado" : "Pendiente",
        estatus: c.status || "vigente",
      })),
    },

    // Report 4: Masa Salarial & Nómina
    {
      id: "costos_nomina",
      title: "4. Masa Salarial & Desglose Presupuestal de Nómina",
      category: "finanzas",
      categoryLabel: "Nómina & Costos",
      description:
        "Estimación y desglose de nómina bruta por colaborador, sueldo diario integrado, montos quincenales y distribución departamental.",
      recommendedFrequency: "Quincenal / Dispersión Bancaria",
      recordCount: activeEmployees.length,
      columns: [
        { key: "colaborador", label: "Colaborador" },
        { key: "departamento", label: "Departamento" },
        { key: "puesto", label: "Puesto" },
        { key: "frecuencia", label: "Frecuencia" },
        {
          key: "sueldo_mensual",
          label: "Sueldo Mensual Bruto",
          format: "currency",
        },
        {
          key: "sueldo_quincenal",
          label: "Estimado Quincenal",
          format: "currency",
        },
        { key: "sueldo_diario", label: "Sueldo Diario", format: "currency" },
      ],
      data: activeEmployees.map((e: any) => {
        const monthly = Number(e.base_salary_monthly) || 0;
        return {
          colaborador: e.full_name,
          departamento: e.department || "Operaciones",
          puesto: e.job_title || "Colaborador",
          frecuencia: e.payment_frequency || "Quincenal",
          sueldo_mensual: monthly,
          sueldo_quincenal: Math.round(monthly / 2),
          sueldo_diario: Math.round(monthly / 30),
        };
      }),
    },

    // Report 5: Evaluaciones 360
    {
      id: "evaluaciones_desempeno",
      title: "5. Evaluaciones de Desempeño 360 & Competencias",
      category: "evaluaciones",
      categoryLabel: "Desempeño & Reclutamiento",
      description:
        "Desglose de las 6 competencias clave evaluadas: puntualidad, asistencia, productividad, trabajo en equipo, atención y cumplimiento de metas.",
      recommendedFrequency: "Trimestral / Semestral",
      recordCount: rawEvaluations.length,
      columns: [
        { key: "colaborador", label: "Colaborador" },
        { key: "puesto", label: "Puesto" },
        { key: "departamento", label: "Departamento" },
        { key: "periodo", label: "Periodo" },
        { key: "fecha", label: "Fecha Evaluación", format: "date" },
        { key: "evaluador", label: "Evaluador" },
        { key: "promedio", label: "Promedio (1-5)", format: "number" },
        { key: "puntualidad", label: "Puntualidad" },
        { key: "asistencia", label: "Asistencia" },
        { key: "productividad", label: "Productividad" },
        { key: "equipo", label: "Trabajo Equipo" },
        { key: "servicio", label: "Servicio" },
        { key: "metas", label: "Metas" },
        { key: "estatus", label: "Estatus" },
      ],
      data: rawEvaluations.map((ev: any) => ({
        colaborador: ev.employee_name,
        puesto: ev.job_title || "Colaborador",
        departamento: ev.department || "Operaciones",
        periodo: ev.period,
        fecha: ev.evaluation_date,
        evaluador: ev.evaluator_name,
        promedio: Number(ev.average_score) || 0,
        puntualidad: Number(ev.punctuality_score) || 0,
        asistencia: Number(ev.attendance_score) || 0,
        productividad: Number(ev.productivity_score) || 0,
        equipo: Number(ev.teamwork_score) || 0,
        servicio: Number(ev.customer_service_score) || 0,
        metas: Number(ev.goals_score) || 0,
        estatus: ev.status,
      })),
    },

    // Report 6: Vacantes & Atracción
    {
      id: "vacantes_atraccion",
      title: "6. Atracción de Talento, Vacantes & Postulaciones",
      category: "evaluaciones",
      categoryLabel: "Desempeño & Reclutamiento",
      description:
        "Métricas de reclutamiento por oferta laboral: postulaciones recibidas, candidatos en revisión, contratados y tasa de conversión.",
      recommendedFrequency: "Mensual / Por Campaña",
      recordCount: rawVacancies.length,
      columns: [
        { key: "vacante", label: "Título de Vacante" },
        { key: "categoria", label: "Categoría" },
        { key: "ubicacion", label: "Ubicación" },
        { key: "sueldo_min", label: "Sueldo Mín", format: "currency" },
        { key: "sueldo_max", label: "Sueldo Máx", format: "currency" },
        { key: "estatus", label: "Estatus Vacante" },
        { key: "total_apps", label: "Postulantes", format: "number" },
        { key: "en_revision", label: "En Revisión", format: "number" },
        { key: "contratados", label: "Contratados", format: "number" },
        { key: "conversion", label: "Tasa Éxito" },
      ],
      data: rawVacancies.map((v: any) => {
        const apps = v.applications || [];
        const totalApps = apps.length;
        const inReview = apps.filter(
          (a: any) =>
            a.status === "En revisión" ||
            a.status === "Pendiente" ||
            a.status === "Nuevo"
        ).length;
        const hired = apps.filter(
          (a: any) => a.status === "Contratado" || a.status === "Aceptado"
        ).length;
        const conversion =
          totalApps > 0 ? `${Math.round((hired / totalApps) * 100)}%` : "0%";

        return {
          vacante: v.title,
          categoria: v.category || "General",
          ubicacion: v.zone || v.location || "Presencial",
          sueldo_min: v.salary_min || 0,
          sueldo_max: v.salary_max || 0,
          estatus: v.is_active ? "Activa" : v.status || "Cerrada",
          total_apps: totalApps,
          en_revision: inReview,
          contratados: hired,
          conversion,
        };
      }),
    },
  ];

  return {
    companyName,
    kpis,
    insights,
    reports,
    departments,
  };
}
