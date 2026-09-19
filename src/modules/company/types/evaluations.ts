export interface CompetencyScore {
  key: string;
  name: string;
  description: string;
  score: number; // 1 to 5
}

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

  // 6 Competencies
  punctualityScore: number; // 1-5
  attendanceScore: number; // 1-5
  productivityScore: number; // 1-5
  teamworkScore: number; // 1-5
  customerServiceScore: number; // 1-5
  goalsScore: number; // 1-5

  averageScore: number; // Calculated average

  // Qualitative notes (Support & Development focus)
  strengths: string[];
  growthAreas: string[];
  developmentPlan: string;
  goalsAchieved: string;
  comments: string;
  status: "completada" | "borrador";
}

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

