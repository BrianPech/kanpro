import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  LaborIncident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "../types/incidents";
import type {
  CreateIncidentInput,
  UpdateIncidentStatusInput,
} from "../schemas/incidents.schema";

export const CATEGORY_DEFAULT_LABELS: Record<IncidentCategory, string> = {
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

export type IncidentRow = Database["public"]["Tables"]["company_incidents"]["Row"];
export type IncidentInsert = Database["public"]["Tables"]["company_incidents"]["Insert"];
export type IncidentUpdate = Database["public"]["Tables"]["company_incidents"]["Update"];

export class CompanyIncidentsService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async createIncident(
    companyId: string,
    input: CreateIncidentInput
  ): Promise<LaborIncident> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    let finalEmployeeName = input.employeeName.trim();
    let finalJobTitle = input.jobTitle?.trim() || "Colaborador K'anPro";
    let finalDepartment = input.department?.trim() || "Operaciones";
    let avatarUrl: string | null = null;
    let validEmployeeId: string | null = null;

    if (input.employeeId && input.employeeId.trim()) {
      const { data: employee } = await this.supabase
        .from("company_employees")
        .select("id, full_name, job_title, department, avatar_url")
        .eq("id", input.employeeId)
        .eq("company_id", companyId)
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
    const categoryLabel =
      input.categoryLabel?.trim() || CATEGORY_DEFAULT_LABELS[category] || "Incidencia Laboral";
    const incidentDate = input.incidentDate || new Date().toISOString().split("T")[0];
    const severity = input.severity || "media";
    const status = input.status || (category === "reconocimiento" ? "resuelto" : "pendiente");

    const insertPayload: IncidentInsert = {
      company_id: companyId,
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

    const { data, error } = await this.supabase
      .from("company_incidents")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Error al crear la incidencia laboral.");
    }

    return this.mapIncidentRow(data, avatarUrl, categoryLabel);
  }

  async updateIncidentStatus(
    companyId: string,
    input: UpdateIncidentStatusInput
  ): Promise<IncidentRow> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const updatePayload: IncidentUpdate = {
      status: input.status,
      resolution_notes: input.resolutionNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("company_incidents")
      .update(updatePayload)
      .eq("id", input.incidentId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Incidencia no encontrada o no autorizada.");
    }

    return data;
  }

  async deleteIncident(companyId: string, incidentId: string): Promise<void> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const { error, count } = await this.supabase
      .from("company_incidents")
      .delete({ count: "exact" })
      .eq("id", incidentId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(error.message);
    }

    if (count === 0) {
      throw new Error("Incidencia no encontrada o no autorizada.");
    }
  }

  async getCompanyIncidents(companyId: string): Promise<LaborIncident[]> {
    if (!companyId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("company_incidents")
      .select(`
        *,
        company_employees (
          avatar_url
        )
      `)
      .eq("company_id", companyId)
      .order("incident_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row) => {
      const emp = Array.isArray(row.company_employees)
        ? row.company_employees[0]
        : row.company_employees;
      const avatarUrl = emp?.avatar_url || null;
      const defaultCategoryLabel =
        CATEGORY_DEFAULT_LABELS[row.category as IncidentCategory] || "Incidencia Laboral";
      return this.mapIncidentRow(row, avatarUrl, row.category_label || defaultCategoryLabel);
    });
  }

  private mapIncidentRow(
    row: IncidentRow,
    avatarUrl: string | null,
    categoryLabel: string
  ): LaborIncident {
    return {
      id: row.id,
      employeeId: row.employee_id || "",
      employeeName: row.employee_name,
      avatarUrl,
      jobTitle: row.job_title || "Colaborador",
      department: row.department || "Operaciones",
      category: row.category as IncidentCategory,
      categoryLabel: row.category_label || categoryLabel,
      title: row.title,
      description: row.description,
      incidentDate: row.incident_date,
      severity: row.severity as IncidentSeverity,
      evidenceUrl: row.evidence_url || undefined,
      evidenceFileName: row.evidence_file_name || undefined,
      evidenceType: (row.evidence_type as LaborIncident["evidenceType"]) || undefined,
      responsibleSupervisor: row.responsible_supervisor || "Recursos Humanos",
      status: row.status as IncidentStatus,
      resolutionNotes: row.resolution_notes || undefined,
      createdAt: new Date(row.created_at).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  }
}
