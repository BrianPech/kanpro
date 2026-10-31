export type CompanyModuleKey =
  | "dashboard"
  | "vacancies"
  | "applications"
  | "employees"
  | "areas"
  | "profile"
  | "verification"
  | "settings"
  | "attendance"
  | "leaves"
  | "incidents"
  | "contracts"
  | "evaluations"
  | "payroll"
  | "reports";

export interface CompanyModuleDefinition {
  key: CompanyModuleKey;
  label: string;
  description: string;
  week: 1 | 2 | 3 | 4;
  routePrefixes: string[];
  alwaysEnabled?: boolean;
}

export interface DemoRolloutConfig {
  activePhase: 1 | 2 | 3 | 4;
  enabledModules: CompanyModuleKey[];
}

export const COMPANY_MODULES: readonly CompanyModuleDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard General",
    description: "Vista principal y métricas operativas de la empresa",
    week: 1,
    routePrefixes: ["/dashboard/company"],
    alwaysEnabled: true,
  },
  {
    key: "vacancies",
    label: "Publicación de Vacantes",
    description: "Creación, edición y gestión de ofertas laborales",
    week: 1,
    routePrefixes: ["/dashboard/company/vacancies"],
  },
  {
    key: "applications",
    label: "Postulantes & Selección (ATS)",
    description: "Pipeline de candidatos, entrevistas y radar de talento",
    week: 1,
    routePrefixes: ["/dashboard/company/applications", "/dashboard/company/radar"],
  },
  {
    key: "employees",
    label: "Plantilla de Personal",
    description: "Directorio de empleados, altas, invitaciones y expedientes",
    week: 1,
    routePrefixes: ["/dashboard/company/employees"],
  },
  {
    key: "areas",
    label: "Áreas & Departamentos",
    description: "Estructura organizacional y catálogo de departamentos",
    week: 1,
    routePrefixes: ["/dashboard/company/areas"],
  },
  {
    key: "profile",
    label: "Perfil Corporativo",
    description: "Datos comerciales, sucursales y logotipo de la empresa",
    week: 1,
    routePrefixes: ["/dashboard/company/profile"],
    alwaysEnabled: true,
  },
  {
    key: "verification",
    label: "Sello de Verificación",
    description: "Expediente fiscal y validación de certeza laboral",
    week: 1,
    routePrefixes: ["/dashboard/company/verification"],
    alwaysEnabled: true,
  },
  {
    key: "settings",
    label: "Configuración de Cuenta",
    description: "Preferencias, notificaciones y seguridad de la empresa",
    week: 1,
    routePrefixes: ["/dashboard/company/settings"],
    alwaysEnabled: true,
  },
  {
    key: "attendance",
    label: "Asistencia & Checador QR",
    description: "Control horario, entradas/salidas y retardos en tiempo real",
    week: 2,
    routePrefixes: ["/dashboard/company/attendance"],
  },
  {
    key: "leaves",
    label: "Vacaciones & Permisos LFT",
    description: "Solicitudes de descanso y días disponibles por antigüedad",
    week: 2,
    routePrefixes: ["/dashboard/company/leaves"],
  },
  {
    key: "incidents",
    label: "Incidencias Laborales",
    description: "Registro de faltas, incapacidades y actas administrativas",
    week: 2,
    routePrefixes: ["/dashboard/company/incidents"],
  },
  {
    key: "contracts",
    label: "Contratos Digitales & Bajas",
    description: "Generación de contratos laborales, firmas y renovaciones",
    week: 3,
    routePrefixes: ["/dashboard/company/contracts"],
  },
  {
    key: "evaluations",
    label: "Evaluaciones 360 & NOM-035",
    description: "Evaluaciones de desempeño, competencias y clima laboral",
    week: 3,
    routePrefixes: ["/dashboard/company/evaluations"],
  },
  {
    key: "payroll",
    label: "Nómina & Recibos CFDI",
    description: "Cálculo de periodos salariales, deducciones y timbrado",
    week: 4,
    routePrefixes: ["/dashboard/company/payroll"],
  },
  {
    key: "reports",
    label: "Centro de Reportes Ejecutivos",
    description: "Exportaciones avanzadas a Excel y CSV de toda la operación",
    week: 4,
    routePrefixes: ["/dashboard/company/reports"],
  },
] as const;

export const DEMO_PHASES: readonly {
  phase: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    phase: 1,
    title: "Semana 1 • Reclutamiento y Personal",
    subtitle: "Fase Inicial (Core)",
    description: "Vacantes, postulantes (ATS), plantilla de empleados, áreas y perfil corporativo.",
  },
  {
    phase: 2,
    title: "Semana 2 • Operaciones y Asistencia",
    subtitle: "+ Control Horario",
    description: "Desbloquea checador QR, vacaciones/permisos LFT e incidencias laborales.",
  },
  {
    phase: 3,
    title: "Semana 3 • Contratos y Desempeño",
    subtitle: "+ Gestión Legal y 360",
    description: "Desbloquea contratos digitales con firma electrónica y evaluaciones 360.",
  },
  {
    phase: 4,
    title: "Semana 4 • Nómina y Analítica Total",
    subtitle: "Plataforma Completa",
    description: "Desbloquea prenómina/CFDI y el centro de reportes ejecutivos.",
  },
] as const;

export function getModulesForPhase(phase: 1 | 2 | 3 | 4): CompanyModuleKey[] {
  return COMPANY_MODULES.filter((m) => m.week <= phase).map((m) => m.key);
}

export const DEFAULT_DEMO_ROLLOUT: DemoRolloutConfig = {
  activePhase: 1,
  enabledModules: getModulesForPhase(1),
};

export function normalizeDemoRollout(raw: unknown): DemoRolloutConfig {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_DEMO_ROLLOUT;
  }

  const record = raw as Record<string, unknown>;
  const rawPhase = Number(record.activePhase);
  const activePhase: 1 | 2 | 3 | 4 =
    rawPhase === 1 || rawPhase === 2 || rawPhase === 3 || rawPhase === 4
      ? rawPhase
      : 1;

  const validKeys = new Set<string>(COMPANY_MODULES.map((m) => m.key));
  const alwaysOnKeys = COMPANY_MODULES.filter((m) => m.alwaysEnabled).map((m) => m.key);

  if (Array.isArray(record.enabledModules)) {
    const filtered = record.enabledModules.filter(
      (item): item is CompanyModuleKey => typeof item === "string" && validKeys.has(item)
    );
    const merged = Array.from(new Set<CompanyModuleKey>([...alwaysOnKeys, ...filtered]));
    return { activePhase, enabledModules: merged };
  }

  return {
    activePhase,
    enabledModules: getModulesForPhase(activePhase),
  };
}

export function resolveModuleFromPath(urlOrPath: string): CompanyModuleDefinition | undefined {
  const cleanPath = urlOrPath.split("?")[0]?.split("#")[0] || "";
  if (!cleanPath.startsWith("/dashboard/company")) {
    return undefined;
  }
  if (cleanPath === "/dashboard/company" || cleanPath === "/dashboard/company/") {
    return COMPANY_MODULES.find((m) => m.key === "dashboard");
  }

  return COMPANY_MODULES.find(
    (m) =>
      m.key !== "dashboard" &&
      m.routePrefixes.some(
        (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
      )
  );
}

export function isCompanyRouteAllowed(
  urlOrPath: string,
  enabledModules?: readonly string[]
): boolean {
  if (!enabledModules || enabledModules.length === 0) {
    return true;
  }
  const mod = resolveModuleFromPath(urlOrPath);
  if (!mod || mod.alwaysEnabled) {
    return true;
  }
  return enabledModules.includes(mod.key);
}

export function getLockedModuleBadge(
  urlOrPath: string,
  enabledModules?: readonly string[]
): string | null {
  if (isCompanyRouteAllowed(urlOrPath, enabledModules)) {
    return null;
  }
  const mod = resolveModuleFromPath(urlOrPath);
  return mod ? `Semana ${mod.week}` : "Próximamente";
}
