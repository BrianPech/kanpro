import { createClient } from "@/lib/supabase/server";
import {
  EmployeeDossier,
  VacationRequest,
  EmployeeDocument,
  PositionHistoryItem,
  PerformanceReview,
} from "../types/employee-dossier";
import { calculateLFTVacationDays } from "../utils/vacation-calculator";

// Mock employee database for fallback and rich 360 preview
export async function getEmployeeDossierById(
  employeeId: string
): Promise<EmployeeDossier | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let companyName = "Mi Empresa";
  if (user) {
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.company_name) {
      companyName = profile.company_name;
    }
  }

  // Base hire date 2 years ago for sample
  const hireDate = "2024-03-15";
  const seniority = calculateLFTVacationDays(hireDate);

  const sampleDossier: EmployeeDossier = {
    id: employeeId,
    candidateId: `cand-${employeeId}`,
    fullName:
      employeeId === "emp-002"
        ? "Mariana Silva"
        : employeeId === "emp-003"
        ? "Alejandro Ruiz"
        : "Carlos Mendoza",
    avatarUrl: null,
    email: "carlos.mendoza@email.com",
    phone: "+52 984 123 4567",
    emergencyContact: {
      name: "Laura Patricia Mendoza (Esposa)",
      phone: "+52 984 987 6543",
      relationship: "Cónyuge",
    },
    rfc: "MEMC920415HQ8",
    curp: "MEMC920415HQRNNR02",
    nss: "12984712093",
    birthDate: "1992-04-15",
    address: "Calle 38 Nte Mz 45 Lt 12, Col. Zazil-Ha, Playa del Carmen, Q.R.",
    nationality: "Mexicana",

    // Job & Contract
    jobTitle: "Supervisor de Mantenimiento",
    department: "Operaciones & Mantenimiento",
    branchName: `Sucursal Principal • ${companyName}`,
    hireDate,
    yearsOfServiceFormatted: seniority.formattedSeniority,
    contractType: "indeterminado",
    contractTypeLabel: "Contrato por Tiempo Indeterminado (Planta)",
    contractStartDate: hireDate,
    contractEndDate: null,
    baseSalaryMonthly: 18500,
    dailyIntegratedSalary: 678.5, // SDI para IMSS
    paymentFrequency: "quincenal",
    workSchedule: "Lunes a Viernes 08:00 - 17:00 (Sábados 09:00 - 13:00)",
    status: "activo",

    // Documents
    documents: [
      {
        id: "doc-1",
        docType: "ine",
        title: "Identificación Oficial (INE)",
        fileName: "INE_Frente_Reverso_CarlosM.pdf",
        fileUrl: "/assets/docs/ine_sample.pdf",
        fileSizeBytes: 1240000,
        uploadedAt: "15 Mar 2024",
        status: "validado",
      },
      {
        id: "doc-2",
        docType: "rfc_sat",
        title: "Constancia de Situación Fiscal (SAT)",
        fileName: "CSF_SAT_CarlosMendoza.pdf",
        fileUrl: "/assets/docs/csf_sample.pdf",
        fileSizeBytes: 890000,
        uploadedAt: "15 Mar 2024",
        status: "validado",
      },
      {
        id: "doc-3",
        docType: "comprobante_domicilio",
        title: "Comprobante de Domicilio CFE",
        fileName: "Recibo_CFE_Reciente.pdf",
        fileUrl: "/assets/docs/cfe_sample.pdf",
        fileSizeBytes: 620000,
        uploadedAt: "10 Jun 2026",
        status: "validado",
      },
      {
        id: "doc-4",
        docType: "contrato_laboral",
        title: "Contrato Laboral Indeterminado Firmado",
        fileName: "Contrato_Laboral_Planta_KanPro.pdf",
        fileUrl: "/assets/docs/contrato_sample.pdf",
        fileSizeBytes: 2450000,
        uploadedAt: "15 Mar 2024",
        status: "validado",
      },
      {
        id: "doc-5",
        docType: "nss",
        title: "Número de Seguridad Social (IMSS)",
        fileName: "Comprobante_NSS_Oficial.pdf",
        fileUrl: "/assets/docs/nss_sample.pdf",
        fileSizeBytes: 430000,
        uploadedAt: "15 Mar 2024",
        status: "validado",
      },
    ],

    // Position history
    positionHistory: [
      {
        id: "pos-1",
        jobTitle: "Supervisor de Mantenimiento",
        department: "Operaciones",
        startDate: "01 Ene 2025",
        endDate: "Actual",
        salary: 18500,
        promotionReason: "Promoción por alto desempeño y certificación técnica.",
      },
      {
        id: "pos-2",
        jobTitle: "Técnico en Mantenimiento General",
        department: "Operaciones",
        startDate: "15 Mar 2024",
        endDate: "31 Dic 2024",
        salary: 14000,
        promotionReason: "Ingreso inicial a la empresa.",
      },
    ],

    // Vacation Balance
    vacationBalance: {
      hireDate,
      yearsOfService: seniority.yearsOfService,
      totalDaysAccruedLFT: seniority.currentYearEntitlement, // 14 días (año 2)
      daysTaken: 6,
      daysPendingApproval: 0,
      daysAvailable: seniority.currentYearEntitlement - 6, // 8 días
      nextPeriodDate: "15 Mar 2027",
    },

    // Vacation Requests
    vacationRequests: [
      {
        id: "req-1",
        employeeId,
        employeeName: "Carlos Mendoza",
        department: "Operaciones",
        requestType: "vacaciones",
        typeLabel: "Vacaciones Ordinarias LFT",
        startDate: "2026-05-10",
        endDate: "2026-05-15",
        totalWorkingDays: 6,
        reason: "Descanso familiar anual.",
        status: "aprobada",
        requestedAt: "02 May 2026",
        reviewedAt: "03 May 2026",
        reviewedBy: "Recursos Humanos",
      },
      {
        id: "req-2",
        employeeId,
        employeeName: "Carlos Mendoza",
        department: "Operaciones",
        requestType: "vacaciones",
        typeLabel: "Vacaciones Ordinarias LFT",
        startDate: "2026-09-10",
        endDate: "2026-09-15",
        totalWorkingDays: 5,
        reason: "Viaje familiar programado.",
        status: "pendiente",
        requestedAt: "Hoy, 10:20 AM",
      },
    ],

    // Performance Reviews
    performanceReviews: [
      {
        id: "rev-1",
        period: "Q1 2026 - Evaluación Trimestral de Operaciones",
        evaluationDate: "05 Abr 2026",
        evaluatorName: "Ing. Fernando Morales (Gerente de Planta)",
        score: 4.8,
        strengths: [
          "Excelente puntualidad y liderazgo de equipo.",
          "Resolución rápida de incidencias electromecánicas.",
          "Apego estricto a las normas de seguridad laboral.",
        ],
        growthAreas: ["Optimizar los tiempos de reporte administrativo."],
        goalsMet: "Cumplimiento del 98% del plan de mantenimiento preventivo.",
        generalComments:
          "Colaborador con alto sentido de compromiso. Candidato a líder de zona.",
      },
    ],

    attendanceSummary: {
      punctualityRate: 97,
      totalDaysPresent: 48,
      totalLateArrivals: 2,
      totalAbsences: 0,
      totalOvertimeHours: 6.5,
    },
  };

  return sampleDossier;
}

// Fetch all company vacation and leave requests
export async function getCompanyVacationRequests(): Promise<{
  companyName: string;
  requests: VacationRequest[];
  stats: {
    pendingCount: number;
    approvedThisMonth: number;
    employeesOnLeaveToday: number;
    averageVacationBalance: number;
  };
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let companyName = "Mi Empresa";
  if (user) {
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.company_name) companyName = profile.company_name;
  }

  const sampleRequests: VacationRequest[] = [
    {
      id: "vreq-101",
      employeeId: "emp-001",
      employeeName: "Carlos Mendoza",
      department: "Operaciones",
      requestType: "vacaciones",
      typeLabel: "Vacaciones LFT",
      startDate: "2026-09-10",
      endDate: "2026-09-15",
      totalWorkingDays: 5,
      reason: "Viaje familiar programado a Oaxaca.",
      status: "pendiente",
      requestedAt: "Hoy, 09:15 AM",
    },
    {
      id: "vreq-102",
      employeeId: "emp-002",
      employeeName: "Mariana Silva",
      department: "Alimentos y Bebidas",
      requestType: "vacaciones",
      typeLabel: "Vacaciones LFT",
      startDate: "2026-09-20",
      endDate: "2026-09-25",
      totalWorkingDays: 5,
      reason: "Descanso anual por aniversario.",
      status: "pendiente",
      requestedAt: "Ayer, 16:40 PM",
    },
    {
      id: "vreq-103",
      employeeId: "emp-003",
      employeeName: "Alejandro Ruiz",
      department: "Cocina & Producción",
      requestType: "permiso_con_goce",
      typeLabel: "Permiso con Goce de Sueldo",
      startDate: "2026-08-28",
      endDate: "2026-08-29",
      totalWorkingDays: 2,
      reason: "Trámite de titulación profesional.",
      status: "aprobada",
      requestedAt: "20 Ago 2026",
      reviewedAt: "21 Ago 2026",
      reviewedBy: "Recursos Humanos",
    },
    {
      id: "vreq-104",
      employeeId: "emp-004",
      employeeName: "Sofía Morales",
      department: "Front Desk",
      requestType: "vacaciones",
      typeLabel: "Vacaciones LFT",
      startDate: "2026-08-15",
      endDate: "2026-08-22",
      totalWorkingDays: 6,
      reason: "Periodo vacacional.",
      status: "aprobada",
      requestedAt: "01 Ago 2026",
      reviewedAt: "02 Ago 2026",
      reviewedBy: "Recursos Humanos",
    },
  ];

  return {
    companyName,
    requests: sampleRequests,
    stats: {
      pendingCount: 2,
      approvedThisMonth: 2,
      employeesOnLeaveToday: 1,
      averageVacationBalance: 9.4,
    },
  };
}
