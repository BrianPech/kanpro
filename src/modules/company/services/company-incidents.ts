import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getMexicoDateISO, formatMexicoDateShort } from "@/lib/formatters";
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
import { resolveEmployeeUserId } from "./employee-user-resolver";
import {
  SupabaseIncidentsRepository,
  type IncidentsRepository,
  type IncidentRow,
  type IncidentInsert,
  type IncidentUpdate,
} from "../repositories/incidents.repository";

export type { IncidentRow, IncidentInsert, IncidentUpdate };

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

/** Distingue rutas de Storage de URLs http o data URIs heredadas. */
export function isStorageEvidencePath(value: string | null | undefined): value is string {
  return Boolean(value) && !/^(data:|https?:)/i.test(value as string);
}

export class CompanyIncidentsService {
  private readonly repository: IncidentsRepository;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    repository?: IncidentsRepository
  ) {
    this.repository = repository ?? new SupabaseIncidentsRepository(supabase);
  }

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
    let employeeContact: { employee_id?: string | null; email?: string | null } | null = null;

    if (input.employeeId && input.employeeId.trim()) {
      const { data: employee } = await this.supabase
        .from("company_employees")
        .select("id, full_name, job_title, department, avatar_url, employee_id, email")
        .eq("id", input.employeeId)
        .eq("company_id", companyId)
        .maybeSingle();

      if (employee) {
        validEmployeeId = employee.id;
        finalEmployeeName = employee.full_name || finalEmployeeName;
        finalJobTitle = employee.job_title || finalJobTitle;
        finalDepartment = employee.department || finalDepartment;
        avatarUrl = employee.avatar_url;
        employeeContact = { employee_id: employee.employee_id, email: employee.email };
      }
    }

    if (isStorageEvidencePath(input.evidenceUrl) && !input.evidenceUrl.startsWith(`${companyId}/`)) {
      throw new Error("La evidencia no pertenece a tu empresa.");
    }

    const category = input.category;
    const categoryLabel =
      input.categoryLabel?.trim() ||
      CATEGORY_DEFAULT_LABELS[category] ||
      "Incidencia Laboral";
    const incidentDate = input.incidentDate || getMexicoDateISO();
    const severity = input.severity || "media";
    const status =
      input.status || (category === "reconocimiento" ? "resuelto" : "pendiente");

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
      responsible_supervisor:
        input.responsibleSupervisor?.trim() || "Recursos Humanos",
      evidence_url: input.evidenceUrl || null,
      evidence_file_name: input.evidenceFileName || null,
      evidence_type: input.evidenceType || null,
      status,
    };

    const data = await this.repository.create(companyId, insertPayload);
    const notifiedAt = employeeContact
      ? await this.notifyEmployee(data, employeeContact)
      : null;

    return this.mapIncidentRow(
      notifiedAt ? { ...data, notified_at: notifiedAt } : data,
      avatarUrl,
      categoryLabel
    );
  }

  /**
   * Avisa al colaborador en su portal. Es de mejor esfuerzo: la incidencia ya quedó registrada.
   */
  private async notifyEmployee(
    incident: IncidentRow,
    employee: { employee_id?: string | null; email?: string | null }
  ): Promise<string | null> {
    try {
      const userId = await resolveEmployeeUserId(this.supabase, employee);
      if (!userId) {
        return null;
      }

      const isRecognition = incident.category === "reconocimiento";
      const { error } = await this.supabase.from("notifications").insert({
        user_id: userId,
        title: isRecognition
          ? "¡Recibiste un reconocimiento!"
          : "Nueva incidencia en tu expediente",
        description: isRecognition
          ? `${incident.title}. Consúltalo en tu portal.`
          : `${incident.category_label || "Incidencia"}: ${incident.title}. Revísala y, si lo deseas, registra tu descargo.`,
        type: "incident_notified",
      });
      if (error) {
        throw new Error(error.message);
      }

      const notifiedAt = `${getMexicoDateISO()}T12:00:00.000Z`;
      await this.repository.markNotified(incident.company_id, incident.id, notifiedAt);
      return notifiedAt;
    } catch (error) {
      console.error("Error notifying employee of incident:", error);
      return null;
    }
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
      updated_at: `${getMexicoDateISO()}T12:00:00.000Z`,
    };

    return this.repository.updateStatus(
      companyId,
      input.incidentId,
      updatePayload
    );
  }

  async deleteIncident(companyId: string, incidentId: string): Promise<void> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    await this.repository.delete(companyId, incidentId);
  }

  async getCompanyIncidents(companyId: string): Promise<LaborIncident[]> {
    if (!companyId) {
      return [];
    }

    const data = await this.repository.listByCompany(companyId);

    return data.map((row) => {
      const emp = Array.isArray(row.company_employees)
        ? row.company_employees[0]
        : row.company_employees;
      const avatarUrl = emp?.avatar_url || null;
      const defaultCategoryLabel =
        CATEGORY_DEFAULT_LABELS[row.category as IncidentCategory] ||
        "Incidencia Laboral";
      return this.mapIncidentRow(
        row,
        avatarUrl,
        row.category_label || defaultCategoryLabel
      );
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
      evidenceType:
        (row.evidence_type as LaborIncident["evidenceType"]) || undefined,
      responsibleSupervisor: row.responsible_supervisor || "Recursos Humanos",
      status: row.status as IncidentStatus,
      resolutionNotes: row.resolution_notes || undefined,
      createdAt: formatMexicoDateShort(row.created_at),
      notifiedAt: row.notified_at ? formatMexicoDateShort(row.notified_at) : undefined,
      acknowledgedAt: row.acknowledged_at ? formatMexicoDateShort(row.acknowledged_at) : undefined,
      employeeStatement: row.employee_statement || undefined,
      employeeStatementAt: row.employee_statement_at
        ? formatMexicoDateShort(row.employee_statement_at)
        : undefined,
    };
  }
}
