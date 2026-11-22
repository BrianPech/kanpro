import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type IncidentRow = Database["public"]["Tables"]["company_incidents"]["Row"];
export type IncidentInsert = Database["public"]["Tables"]["company_incidents"]["Insert"];
export type IncidentUpdate = Database["public"]["Tables"]["company_incidents"]["Update"];

export type IncidentRowWithEmployee = IncidentRow & {
  company_employees?:
    | { avatar_url: string | null }
    | Array<{ avatar_url: string | null }>
    | null;
};

/**
 * Contrato de acceso a datos para incidencias laborales con aislamiento estricto por empresa.
 */
export interface IncidentsRepository {
  create(companyId: string, payload: IncidentInsert): Promise<IncidentRow>;
  updateStatus(
    companyId: string,
    incidentId: string,
    payload: IncidentUpdate
  ): Promise<IncidentRow>;
  delete(companyId: string, incidentId: string): Promise<void>;
  getById(companyId: string, incidentId: string): Promise<IncidentRow | null>;
  markNotified(companyId: string, incidentId: string, notifiedAt: string): Promise<void>;
  listByCompany(companyId: string): Promise<IncidentRowWithEmployee[]>;
  listByEmployeeAndPeriod(
    companyId: string,
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IncidentRow[]>;
  listByPeriod(
    companyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IncidentRow[]>;
  expireOverdueClarifications?(
    companyId: string,
    now?: Date
  ): Promise<IncidentRow[]>;
}

/**
 * Implementación Supabase del repositorio de incidencias usando cliente autenticado con RLS.
 */
export class SupabaseIncidentsRepository implements IncidentsRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(companyId: string, payload: IncidentInsert): Promise<IncidentRow> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const { data, error } = await this.supabase
      .from("company_incidents")
      .insert({ ...payload, company_id: companyId })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Error al crear la incidencia laboral.");
    }

    return data;
  }

  async updateStatus(
    companyId: string,
    incidentId: string,
    payload: IncidentUpdate
  ): Promise<IncidentRow> {
    if (!companyId || !incidentId) {
      throw new Error("Identificador de empresa e incidencia requeridos.");
    }

    const safePayload: IncidentUpdate = { ...payload };
    delete safePayload.company_id;

    const { data, error } = await this.supabase
      .from("company_incidents")
      .update(safePayload)
      .eq("id", incidentId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Incidencia no encontrada o no autorizada.");
    }

    return data;
  }

  async delete(companyId: string, incidentId: string): Promise<void> {
    if (!companyId || !incidentId) {
      throw new Error("ID de empresa requerido.");
    }

    const { error, count } = await this.supabase
      .from("company_incidents")
      .delete({ count: "exact" })
      .eq("id", incidentId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(error.message || "No se pudo eliminar la incidencia.");
    }

    if (count === 0) {
      throw new Error("Incidencia no encontrada o no autorizada.");
    }
  }

  async listByCompany(companyId: string): Promise<IncidentRowWithEmployee[]> {
    if (!companyId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("company_incidents")
      .select(
        `
        *,
        company_employees (
          avatar_url
        )
      `
      )
      .eq("company_id", companyId)
      .order("incident_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "No se pudieron cargar las incidencias.");
    }

    return (data ?? []) as IncidentRowWithEmployee[];
  }

  async listByEmployeeAndPeriod(
    companyId: string,
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IncidentRow[]> {
    if (!companyId || !employeeId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("company_incidents")
      .select("*")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .gte("incident_date", periodStart)
      .lte("incident_date", periodEnd)
      .order("incident_date", { ascending: true });

    if (error) {
      throw new Error(
        error.message || "No se pudieron cargar las incidencias del periodo."
      );
    }

    return data ?? [];
  }

  async getById(companyId: string, incidentId: string): Promise<IncidentRow | null> {
    if (!companyId || !incidentId) {
      return null;
    }

    const { data, error } = await this.supabase
      .from("company_incidents")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", incidentId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "No se pudo cargar la incidencia.");
    }

    return data ?? null;
  }

  async markNotified(
    companyId: string,
    incidentId: string,
    notifiedAt: string
  ): Promise<void> {
    if (!companyId || !incidentId) {
      throw new Error("Identificador de empresa e incidencia requeridos.");
    }

    const { error } = await this.supabase
      .from("company_incidents")
      .update({ notified_at: notifiedAt })
      .eq("id", incidentId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(error.message || "No se pudo registrar la notificación.");
    }
  }

  async listByPeriod(
    companyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IncidentRow[]> {
    if (!companyId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("company_incidents")
      .select("*")
      .eq("company_id", companyId)
      .gte("incident_date", periodStart)
      .lte("incident_date", periodEnd);

    if (error) {
      throw new Error(
        error.message || "No se pudieron cargar las incidencias del periodo."
      );
    }

    return data ?? [];
  }

  async expireOverdueClarifications(
    companyId: string,
    now: Date = new Date()
  ): Promise<IncidentRow[]> {
    if (!companyId) {
      return [];
    }

    if (typeof this.supabase.rpc === "function") {
      try {
        const { data, error } = await this.supabase.rpc(
          "expire_overdue_clarification_incidents",
          { p_company_id: companyId }
        );
        if (!error && Array.isArray(data)) {
          return data as IncidentRow[];
        }
      } catch {
        // Fallback a actualización directa en entornos sin RPC desplegado
      }
    }

    const nowIso = now.toISOString();
    const { data: overdue, error: fetchError } = await this.supabase
      .from("company_incidents")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "por_aclarar")
      .not("clarification_deadline", "is", null)
      .lte("clarification_deadline", nowIso);

    if (fetchError || !overdue || overdue.length === 0) {
      return [];
    }

    const updatedRows: IncidentRow[] = [];
    for (const row of overdue) {
      const nextCategory = row.category === "retardo" ? "retardo" : "falta_injustificada";
      const nextCategoryLabel =
        nextCategory === "retardo"
          ? row.category_label || "Retardo de Turno"
          : "Falta Injustificada";
      const defaultNote =
        nextCategory === "retardo"
          ? "Plazo de aclaración vencido sin justificante; retardo aplicado automáticamente."
          : "Plazo de aclaración vencido sin justificante; marcada automáticamente como falta injustificada.";

      const updated = await this.updateStatus(companyId, row.id, {
        category: nextCategory,
        category_label: nextCategoryLabel,
        status: "aprobado",
        resolution_notes: row.resolution_notes?.trim() || defaultNote,
        updated_at: nowIso,
      });
      updatedRows.push(updated);
    }

    return updatedRows;
  }
}
