export type TicketCategory =
  | "cuenta_acceso"
  | "pagos_creditos"
  | "verificacion_documentos"
  | "vacantes_postulaciones"
  | "fallo_tecnico";

export type TicketPriority = "urgente" | "alta" | "media" | "baja";

export type TicketStatus = "abierto" | "en_proceso" | "resuelto" | "cerrado";

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isInternalNote: boolean;
  message: string;
  createdAt: string;
}

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "candidate" | "company" | "admin";
  userPhone?: string;
  userAvatar?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedToId?: string;
  assignedToName?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  messagesCount?: number;
}

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  cuenta_acceso: "Acceso y Cuenta",
  pagos_creditos: "Pagos y Créditos",
  verificacion_documentos: "Expediente y Verificación",
  vacantes_postulaciones: "Vacantes y Postulaciones",
  fallo_tecnico: "Incidencia Técnica",
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; badgeClass: string }> = {
  urgente: {
    label: "Urgente",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-bold animate-pulse",
  },
  alta: {
    label: "Alta",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold",
  },
  media: {
    label: "Media",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium",
  },
  baja: {
    label: "Baja",
    badgeClass: "border-border/40 bg-muted/40 text-muted-foreground font-normal",
  },
};

export const STATUS_CONFIG: Record<TicketStatus, { label: string; badgeClass: string }> = {
  abierto: {
    label: "Abierto",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold",
  },
  en_proceso: {
    label: "En Atención",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold",
  },
  resuelto: {
    label: "Resuelto",
    badgeClass: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 font-semibold",
  },
  cerrado: {
    label: "Cerrado",
    badgeClass: "border-border/40 bg-muted/40 text-muted-foreground font-medium",
  },
};
