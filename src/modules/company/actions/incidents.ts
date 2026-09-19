"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  LaborIncident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "../types/incidents";

export interface CreateIncidentInput {
  employeeId?: string | null;
  employeeName: string;
  jobTitle?: string;
  department?: string;
  category: IncidentCategory;
  categoryLabel?: string;
  title: string;
  description: string;
  incidentDate?: string;
  severity?: IncidentSeverity;
  responsibleSupervisor?: string;
  evidenceUrl?: string;
  evidenceFileName?: string;
  evidenceType?: "documento" | "foto" | "receta_medica" | "acta_administrativa";
  status?: IncidentStatus;
}

export interface UpdateIncidentStatusInput {
  incidentId: string;
  status: IncidentStatus;
  resolutionNotes?: string;
}

const CATEGORY_DEFAULT_LABELS: Record<IncidentCategory, string> = {
  falta_injustificada: "Falta Injustificada",
  retardo: "Retardo de Turno",
  accidente: "Accidente de Trabajo (ST-7)",
  queja: "Queja / Reporte de Conducta",
  permiso: "Permiso Especial",
  suspension: "Suspensión Administrativa",
  incumplimiento: "Acta Administrativa / Incumplimiento",
  reconocimiento: "⭐ Reconocimiento / Desempeño Destacado",
  incapacidad: "Incapacidad Médica (IMSS)",
  otro: "Otra Incidencia",
};

/**
 * Registra una nueva incidencia laboral o reconocimiento formal
 */
export async function createIncidentAction(input: CreateIncidentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicia sesión para registrar la incidencia." };
  }

  let finalEmployeeName = input.employeeName.trim();
  let finalJobTitle = input.jobTitle?.trim() || "Colaborador K'anPro";
  let finalDepartment = input.department?.trim() || "Operaciones";
  let avatarUrl: string | null = null;
  let validEmployeeId: string | null = null;

  // Si se proveyó un employeeId válido de la plantilla, obtenemos datos reales
  if (input.employeeId && input.employeeId.trim()) {
    const { data: employee } = await supabase
      .from("company_employees")
      .select("id, full_name, job_title, department, avatar_url")
      .eq("id", input.employeeId)
      .eq("company_id", user.id)
      .maybeSingle();

    if (employee) {
      validEmployeeId = employee.id;
      finalEmployeeName = employee.full_name || finalEmployeeName;
      finalJobTitle = employee.job_title || finalJobTitle;
      finalDepartment = employee.department || finalDepartment;
      avatarUrl = employee.avatar_url;
    }
  }

  const category = input.category;
  const categoryLabel = input.categoryLabel?.trim() || CATEGORY_DEFAULT_LABELS[category] || "Incidencia Laboral";
  const incidentDate = input.incidentDate || new Date().toISOString().split("T")[0];
  const severity = input.severity || "media";
  const status = input.status || (category === "reconocimiento" ? "resuelto" : "pendiente");

  const insertPayload = {
    company_id: user.id,
    employee_id: validEmployeeId,
    employee_name: finalEmployeeName,
    job_title: finalJobTitle,
    department: finalDepartment,
    category,
    category_label: categoryLabel,
    title: input.title.trim(),
    description: input.description.trim(),
    incident_date: incidentDate,
    severity,
    responsible_supervisor: input.responsibleSupervisor?.trim() || "Recursos Humanos",
    evidence_url: input.evidenceUrl || null,
    evidence_file_name: input.evidenceFileName || null,
    evidence_type: input.evidenceType || null,
    status,
  };

  const { data, error } = await supabase
    .from("company_incidents")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("Error creating incident:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/incidents");
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/company/payroll");

  const mappedIncident: LaborIncident = {
    id: data.id,
    employeeId: data.employee_id || "",
    employeeName: data.employee_name,
    avatarUrl,
    jobTitle: data.job_title || "Colaborador",
    department: data.department || "Operaciones",
    category: data.category as IncidentCategory,
    categoryLabel: data.category_label || categoryLabel,
    title: data.title,
    description: data.description,
    incidentDate: data.incident_date,
    severity: data.severity as IncidentSeverity,
    evidenceUrl: data.evidence_url || undefined,
    evidenceFileName: data.evidence_file_name || undefined,
    evidenceType: (data.evidence_type as any) || undefined,
    responsibleSupervisor: data.responsible_supervisor || "Recursos Humanos",
    status: data.status as IncidentStatus,
    resolutionNotes: data.resolution_notes || undefined,
    createdAt: new Date(data.created_at).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  return { success: true, incident: mappedIncident };
}

/**
 * Actualiza la resolución o estatus de una incidencia laboral
 */
export async function updateIncidentStatusAction(input: UpdateIncidentStatusInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { data, error } = await supabase
    .from("company_incidents")
    .update({
      status: input.status,
      resolution_notes: input.resolutionNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.incidentId)
    .eq("company_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating incident status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/incidents");
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/company/payroll");

  return { success: true, record: data };
}

/**
 * Elimina una incidencia laboral
 */
export async function deleteIncidentAction(incidentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("company_incidents")
    .delete()
    .eq("id", incidentId)
    .eq("company_id", user.id);

  if (error) {
    console.error("Error deleting incident:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/incidents");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Obtiene todas las incidencias de la empresa desde la base de datos
 */
export async function getCompanyIncidentsAction(): Promise<{
  success: boolean;
  incidents: LaborIncident[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, incidents: [], error: "No autorizado." };
  }

  // Obtenemos incidencias y empleados para cruzar fotos si existen
  const [incidentsRes, employeesRes] = await Promise.all([
    supabase
      .from("company_incidents")
      .select("*")
      .eq("company_id", user.id)
      .order("incident_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("company_employees")
      .select("id, avatar_url")
      .eq("company_id", user.id),
  ]);

  if (incidentsRes.error) {
    console.error("Error fetching company incidents:", incidentsRes.error);
    return { success: false, incidents: [], error: incidentsRes.error.message };
  }

  const avatarMap = new Map<string, string | null>();
  (employeesRes.data || []).forEach((e) => {
    if (e.id && e.avatar_url) avatarMap.set(e.id, e.avatar_url);
  });

  const incidents: LaborIncident[] = (incidentsRes.data || []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id || "",
    employeeName: row.employee_name,
    avatarUrl: row.employee_id ? avatarMap.get(row.employee_id) || null : null,
    jobTitle: row.job_title || "Colaborador",
    department: row.department || "Operaciones",
    category: row.category as IncidentCategory,
    categoryLabel: row.category_label || CATEGORY_DEFAULT_LABELS[row.category as IncidentCategory] || "Incidencia Laboral",
    title: row.title,
    description: row.description,
    incidentDate: row.incident_date,
    severity: row.severity as IncidentSeverity,
    evidenceUrl: row.evidence_url || undefined,
    evidenceFileName: row.evidence_file_name || undefined,
    evidenceType: (row.evidence_type as any) || undefined,
    responsibleSupervisor: row.responsible_supervisor || "Recursos Humanos",
    status: row.status as IncidentStatus,
    resolutionNotes: row.resolution_notes || undefined,
    createdAt: new Date(row.created_at).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

  return { success: true, incidents };
}
