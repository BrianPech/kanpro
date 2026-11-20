import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type CompanyLeaveRow = Database["public"]["Tables"]["company_leaves"]["Row"];
export type CompanyLeaveInsert = Database["public"]["Tables"]["company_leaves"]["Insert"];
export type CompanyLeaveUpdate = Database["public"]["Tables"]["company_leaves"]["Update"];

/**
 * Contrato de acceso a datos para vacaciones y permisos con aislamiento estricto por empresa.
 */
export interface LeavesRepository {
  create(companyId: string, payload: CompanyLeaveInsert): Promise<CompanyLeaveRow>;
  respond(
    companyId: string,
    requestId: string,
    payload: CompanyLeaveUpdate
  ): Promise<CompanyLeaveRow>;
  listByCompany(companyId: string): Promise<CompanyLeaveRow[]>;
  listByEmployeeAndPeriod(
    companyId: string,
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<CompanyLeaveRow[]>;
  listPending(companyId: string): Promise<CompanyLeaveRow[]>;
  balanceUsedDays(companyId: string, employeeId: string): Promise<number>;
}

/**
 * Implementación Supabase del repositorio de vacaciones y permisos usando cliente autenticado con RLS.
 */
export class SupabaseLeavesRepository implements LeavesRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(
    companyId: string,
    payload: CompanyLeaveInsert
  ): Promise<CompanyLeaveRow> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const { data, error } = await this.supabase
      .from("company_leaves")
      .insert({ ...payload, company_id: companyId })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "No se pudo registrar la solicitud.");
    }

    return data;
  }

  async respond(
    companyId: string,
    requestId: string,
    payload: CompanyLeaveUpdate
  ): Promise<CompanyLeaveRow> {
    if (!companyId || !requestId) {
      throw new Error("Identificador de empresa y solicitud requeridos.");
    }

    const { data: leave, error: fetchErr } = await this.supabase
      .from("company_leaves")
      .select(
        `
        id,
        company_id,
        employee_id,
        candidate_id,
        request_type,
        start_date,
        end_date,
        total_working_days
      `
      )
      .eq("id", requestId)
      .eq("company_id", companyId)
      .single();

    if (fetchErr || !leave) {
      throw new Error(
        "No se encontró la solicitud de vacaciones o no pertenece a tu empresa."
      );
    }

    const safePayload: CompanyLeaveUpdate = { ...payload };
    delete safePayload.company_id;

    const { data: updatedLeave, error: updateErr } = await this.supabase
      .from("company_leaves")
      .update(safePayload)
      .eq("id", requestId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (updateErr || !updatedLeave) {
      throw new Error(
        updateErr?.message ||
          "Error al registrar la resolución en la base de datos."
      );
    }

    return updatedLeave;
  }

  async listByCompany(companyId: string): Promise<CompanyLeaveRow[]> {
    if (!companyId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("company_leaves")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        error.message || "No se pudieron cargar las solicitudes de vacaciones."
      );
    }

    return data ?? [];
  }

  async listByEmployeeAndPeriod(
    companyId: string,
    employeeId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<CompanyLeaveRow[]> {
    if (!companyId || !employeeId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("company_leaves")
      .select("*")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .lte("start_date", periodEnd)
      .gte("end_date", periodStart)
      .order("start_date", { ascending: true });

    if (error) {
      throw new Error(
        error.message || "No se pudieron cargar los permisos del periodo."
      );
    }

    return data ?? [];
  }

  async listPending(companyId: string): Promise<CompanyLeaveRow[]> {
    if (!companyId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("company_leaves")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "pendiente")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        error.message || "No se pudieron cargar las solicitudes pendientes."
      );
    }

    return data ?? [];
  }

  async balanceUsedDays(
    companyId: string,
    employeeId: string
  ): Promise<number> {
    if (!companyId || !employeeId) {
      return 0;
    }

    const { data, error } = await this.supabase
      .from("company_leaves")
      .select("total_working_days")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("request_type", "vacaciones")
      .eq("status", "aprobada");

    if (error) {
      throw new Error(
        error.message || "No se pudo consultar el saldo de días disfrutados."
      );
    }

    return (data ?? []).reduce(
      (total, row) => total + (Number(row.total_working_days) || 0),
      0
    );
  }
}
