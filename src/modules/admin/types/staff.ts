export type AdminSubRole =
  | "super_admin"
  | "ops_admin"
  | "content_admin"
  | "verification_admin"
  | "support";

export type AdminStaffStatus = "active" | "inactive" | "suspended";

export type AdminPermissionKey =
  | "manage_users"
  | "manage_companies"
  | "verify_documents"
  | "manage_vacancies"
  | "analytics_access"
  | "system_settings";

export interface PermissionDefinition {
  key: AdminPermissionKey;
  label: string;
  description: string;
  category: "Usuarios" | "Empresas" | "Contenido" | "Sistema";
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: "manage_users",
    label: "Gestión de Usuarios",
    description: "Crear, editar, activar o suspender perfiles de candidatos.",
    category: "Usuarios",
  },
  {
    key: "manage_companies",
    label: "Gestión de Empresas",
    description: "Aprobar perfiles de empresas, validar RFC y asignar créditos.",
    category: "Empresas",
  },
  {
    key: "verify_documents",
    label: "Verificación de Expedientes",
    description: "Revisar y dictaminar documentos del expediente digital (INE, CURP, Cédula).",
    category: "Usuarios",
  },
  {
    key: "manage_vacancies",
    label: "Moderación de Vacantes",
    description: "Publicar, pausar, destacar o eliminar vacantes del portal.",
    category: "Contenido",
  },
  {
    key: "analytics_access",
    label: "Reportes y Métricas",
    description: "Visualizar tableros de analítica, conversiones e métricas del sistema.",
    category: "Sistema",
  },
  {
    key: "system_settings",
    label: "Configuración del Sistema",
    description: "Modificar variables del sistema, plantillas de correo y roles de acceso.",
    category: "Sistema",
  },
];

export const SUB_ROLE_LABELS: Record<AdminSubRole, { label: string; badgeClass: string; defaultPermissions: AdminPermissionKey[] }> = {
  super_admin: {
    label: "Super Administrador",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    defaultPermissions: ["manage_users", "manage_companies", "verify_documents", "manage_vacancies", "analytics_access", "system_settings"],
  },
  ops_admin: {
    label: "Admin de Operaciones",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    defaultPermissions: ["manage_users", "manage_companies", "manage_vacancies", "analytics_access"],
  },
  content_admin: {
    label: "Admin de Contenido",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    defaultPermissions: ["manage_vacancies", "analytics_access"],
  },
  verification_admin: {
    label: "Agente de Verificación",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    defaultPermissions: ["verify_documents", "manage_users", "manage_companies"],
  },
  support: {
    label: "Soporte Técnico",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    defaultPermissions: ["manage_users", "verify_documents"],
  },
};

export interface AdminStaffItem {
  id: string;
  profileId: string;
  name: string;
  email: string;
  whatsappNumber: string;
  subRole: AdminSubRole;
  department: string;
  permissions: AdminPermissionKey[];
  status: AdminStaffStatus;
  notes?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
