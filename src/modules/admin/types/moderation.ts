export type ReportReason =
  | "cobro_dinero"
  | "vacante_falsa"
  | "discriminacion"
  | "suplantacion"
  | "condiciones_abusivas";

export type ReportStatus = "pending" | "reviewed" | "action_taken" | "dismissed";

export interface VacancyReportItem {
  id: string;
  vacancyId: string;
  vacancyTitle: string;
  vacancyCategory: string;
  companyId: string;
  companyName: string;
  companyRfc?: string;
  companyIsVerified: boolean;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

export const REASON_CONFIG: Record<ReportReason, { label: string; badgeClass: string; icon: string }> = {
  cobro_dinero: {
    label: "Piden dinero / Cobro indebido",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-bold",
    icon: "💰",
  },
  vacante_falsa: {
    label: "Vacante engañosa / Fraude",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold",
    icon: "⚠️",
  },
  discriminacion: {
    label: "Discriminación u oferta ilícita",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold",
    icon: "🚫",
  },
  suplantacion: {
    label: "Suplantación de identidad",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold",
    icon: "🎭",
  },
  condiciones_abusivas: {
    label: "Condiciones abusivas",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium",
    icon: "⚖️",
  },
};

export const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; badgeClass: string }> = {
  pending: {
    label: "Pendiente de Revisión",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold animate-pulse",
  },
  reviewed: {
    label: "En Revisión",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium",
  },
  action_taken: {
    label: "Sanción Aplicada",
    badgeClass: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 font-bold",
  },
  dismissed: {
    label: "Desestimado",
    badgeClass: "border-border/40 bg-muted/40 text-muted-foreground font-normal",
  },
};
