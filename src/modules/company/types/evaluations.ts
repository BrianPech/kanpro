export interface CompetencyScore {
  key: string;
  name: string;
  description: string;
  score: number; // 1 to 5
}

export type EvaluatorRelation = "autoevaluacion" | "jefe_directo" | "par" | "subordinado";

export type NineBoxQuadrantType =
  | "estrella"
  | "alto_potencial"
  | "enigma"
  | "alto_desempeno"
  | "clave"
  | "en_desarrollo"
  | "pilar_solido"
  | "efectivo"
  | "riesgo";

export interface EmployeeEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl?: string | null;
  jobTitle: string;
  department: string;
  period: string; // e.g. "Q2 2026 - Evaluación de Desempeño"
  evaluationDate: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluatorRelation?: EvaluatorRelation;

  // 6 Competencies
  punctualityScore: number; // 1-5
  attendanceScore: number; // 1-5
  productivityScore: number; // 1-5
  teamworkScore: number; // 1-5
  customerServiceScore: number; // 1-5
  goalsScore: number; // 1-5

  averageScore: number; // Calculated average (Desempeño)

  // Matriz 9-Box
  potentialScore?: number; // 1-5 (Potencial de Liderazgo y Crecimiento)
  nineBoxQuadrant?: NineBoxQuadrantType | string;

  // Qualitative notes (Support & Development focus)
  strengths: string[];
  growthAreas: string[];
  developmentPlan: string;
  goalsAchieved: string;
  comments: string;
  status: "completada" | "borrador";
}

/**
 * Calcula el cuadrante de la Matriz 9-Box en función de Desempeño y Potencial
 */
export function calculateNineBoxQuadrant(
  performanceScore: number,
  potentialScore: number
): NineBoxQuadrantType {
  const isHighPerf = performanceScore >= 3.8;
  const isMedPerf = performanceScore >= 2.8 && performanceScore < 3.8;

  const isHighPot = potentialScore >= 3.8;
  const isMedPot = potentialScore >= 2.8 && potentialScore < 3.8;

  if (isHighPot) {
    if (isHighPerf) return "estrella";
    if (isMedPerf) return "alto_potencial";
    return "enigma";
  }

  if (isMedPot) {
    if (isHighPerf) return "alto_desempeno";
    if (isMedPerf) return "clave";
    return "en_desarrollo";
  }

  // Low Potential
  if (isHighPerf) return "pilar_solido";
  if (isMedPerf) return "efectivo";
  return "riesgo";
}

export interface NineBoxQuadrantMeta {
  key: NineBoxQuadrantType;
  title: string;
  shortTitle: string;
  description: string;
  recommendation: string;
  badgeClass: string;
  potLevel: "alto" | "medio" | "bajo";
  perfLevel: "alto" | "medio" | "bajo";
}

export const NINE_BOX_QUADRANTS: Record<NineBoxQuadrantType, NineBoxQuadrantMeta> = {
  estrella: {
    key: "estrella",
    title: "Estrellas / Futuros Líderes",
    shortTitle: "Estrella",
    description: "Máximo rendimiento y alto potencial de impacto organizacional.",
    recommendation: "Plan de sucesión inmediato, retención crítica y roles estratégicos.",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    potLevel: "alto",
    perfLevel: "alto",
  },
  alto_potencial: {
    key: "alto_potencial",
    title: "Alto Potencial / Crecimiento",
    shortTitle: "Alto Potencial",
    description: "Gran capacidad intelectual y liderazgo, con desempeño sólido en consolidación.",
    recommendation: "Proyectos desafiantes, mentoría ejecutiva y coaching de enfoque.",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    potLevel: "alto",
    perfLevel: "medio",
  },
  enigma: {
    key: "enigma",
    title: "Enigma / Diamante en Bruto",
    shortTitle: "Enigma",
    description: "Muy alto potencial pero desempeño inconsistente o reciente en la posición.",
    recommendation: "Diagnóstico de causas raíz, clarificación de expectativas y reubicación si aplica.",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    potLevel: "alto",
    perfLevel: "bajo",
  },
  alto_desempeno: {
    key: "alto_desempeno",
    title: "Alto Desempeño / Especialista",
    shortTitle: "Alto Desempeño",
    description: "Excelente ejecutor y experto en su área con potencial medio de gestión.",
    recommendation: "Reconocimiento continuo, autonomía técnica y desarrollo como referente experto.",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    potLevel: "medio",
    perfLevel: "alto",
  },
  clave: {
    key: "clave",
    title: "Profesional Clave / Núcleo",
    shortTitle: "Clave / Núcleo",
    description: "El motor operativo constante de la empresa. Desempeño y potencial estables.",
    recommendation: "Capacitación continua, rotación lateral y planes de carrera horizontales.",
    badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    potLevel: "medio",
    perfLevel: "medio",
  },
  en_desarrollo: {
    key: "en_desarrollo",
    title: "Dilema / En Desarrollo",
    shortTitle: "En Desarrollo",
    description: "Potencial promedio pero resultados por debajo de lo esperado.",
    recommendation: "Plan de mejora de desempeño (PIP) con metas cuantitativas a 60 días.",
    badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    potLevel: "medio",
    perfLevel: "bajo",
  },
  pilar_solido: {
    key: "pilar_solido",
    title: "Pilar Sólido / Confiable",
    shortTitle: "Pilar Sólido",
    description: "Rendimiento sobresaliente en su puesto actual, pero cómodo sin buscar ascenso.",
    recommendation: "Conservar en la posición, incentivar con bonos por metas y evitar sobrecarga.",
    badgeClass: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    potLevel: "bajo",
    perfLevel: "alto",
  },
  efectivo: {
    key: "efectivo",
    title: "Efectivo / Promedio",
    shortTitle: "Efectivo",
    description: "Cumple con las responsabilidades básicas sin destacar en potencial o entrega.",
    recommendation: "Mantener estándares mínimos y motivar con objetivos a corto plazo.",
    badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    potLevel: "bajo",
    perfLevel: "medio",
  },
  riesgo: {
    key: "riesgo",
    title: "Riesgo / Acción Inmediata",
    shortTitle: "Riesgo",
    description: "Bajo rendimiento crónico y bajo potencial demostrado en el rol.",
    recommendation: "Plan de acción correctiva de 30 días o desvinculación consensuada conforme a LFT.",
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
    potLevel: "bajo",
    perfLevel: "bajo",
  },
};

export type Nom035RiskLevel = "nulo" | "bajo" | "medio" | "alto" | "muy_alto";
export type Nom035GuideType = "guia_i" | "guia_ii" | "guia_iii";

export interface Nom035Survey {
  id: string;
  employeeId?: string | null;
  employeeName: string;
  jobTitle?: string | null;
  department?: string | null;
  guideType: Nom035GuideType;
  surveyDate: string;
  environmentScore: number;
  activityFactorsScore: number;
  timeOrganizationScore: number;
  leadershipRelationsScore: number;
  organizationalClimateScore: number;
  totalScore: number;
  riskLevel: Nom035RiskLevel;
  actionPlan?: string | null;
  status: "borrador" | "completada";
}

export interface Nom035Metrics {
  totalSurveys: number;
  averageTotalScore: number;
  overallRiskLevel: Nom035RiskLevel;
  riskCounts: Record<Nom035RiskLevel, number>;
  dimensionAverages: {
    environment: number;
    activityFactors: number;
    timeOrganization: number;
    leadershipRelations: number;
    organizationalClimate: number;
  };
}

