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
