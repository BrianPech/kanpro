import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import crypto from "crypto";
import type { CompanyProfileFormValues } from "../schemas/company.schema";
import type {
  CompanyEmployeeFormValues,
  TerminateEmployeeInput,
  HireCandidateInput,
} from "../schemas/employee.schema";
import type {
  CreateEmployeeInvitationValues,
  BulkEmployeeImportRow,
} from "../schemas/employee-invitation.schema";
import type {
  CreateContractInput,
  RenewContractInput,
  SignContractInput,
} from "../schemas/contracts.schema";

export type CompanyEmployeeRow = Database["public"]["Tables"]["company_employees"]["Row"];
export type CompanyEmployeeInsert = Database["public"]["Tables"]["company_employees"]["Insert"];
export type CompanyEmployeeUpdate = Database["public"]["Tables"]["company_employees"]["Update"];
export type CompanyContractRow = Database["public"]["Tables"]["company_contracts"]["Row"];
export type CompanyContractInsert = Database["public"]["Tables"]["company_contracts"]["Insert"];
export type CompanyContractUpdate = Database["public"]["Tables"]["company_contracts"]["Update"];
export type EmployeeInvitationRow = Database["public"]["Tables"]["employee_invitations"]["Row"];

export interface PublicInvitationCompanyProfile {
  id: string;
  company_name: string;
  logo_url?: string | null;
  industry?: string | null;
  fiscal_address?: string | null;
}

export interface PublicInvitationData {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  position: string;
  salary?: number | null;
  hire_date?: string | null;
  contract_type?: string | null;
  status: string;
  expires_at: string;
  accepted_at?: string | null;
  company_profiles?: PublicInvitationCompanyProfile | null;
}

function splitCsv(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export class CompanyEmployeeService {
  /**
   * Crea un nuevo registro de colaborador en company_employees garantizando multitenancy.
   */
  public static async createEmployee(
    supabase: SupabaseClient<Database>,
    companyId: string,
    val: CompanyEmployeeFormValues
  ): Promise<CompanyEmployeeRow> {
    const payload: CompanyEmployeeInsert = {
      company_id: companyId,
      full_name: val.full_name.trim(),
      job_title: val.job_title.trim(),
      department: val.department?.trim() || "Operaciones",
      employee_code: val.employee_code?.trim() || null,
      phone: val.phone?.trim() || null,
      email: val.email?.toLowerCase().trim() || null,
      hire_date: val.hire_date || new Date().toISOString().split("T")[0],
      base_salary_monthly: val.base_salary_monthly ?? null,
      payment_frequency: val.payment_frequency || "quincenal",
      work_schedule: val.work_schedule?.trim() || null,
      rfc: val.rfc?.toUpperCase().trim() || null,
      curp: val.curp?.toUpperCase().trim() || null,
      nss: val.nss?.trim() || null,
      notes: val.notes?.trim() || null,
      status: "active",
    };

    const { data: inserted, error } = await supabase
      .from("company_employees")
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || "No se pudo registrar el colaborador en la base de datos.");
    }

    return inserted;
  }

  /**
   * Actualiza los datos de un colaborador activo perteneciente a la empresa.
   */
  public static async updateEmployee(
    supabase: SupabaseClient<Database>,
    companyId: string,
    employeeId: string,
    data: Partial<CompanyEmployeeFormValues>
  ): Promise<void> {
    const updatePayload: CompanyEmployeeUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (data.full_name !== undefined) updatePayload.full_name = data.full_name.trim();
    if (data.job_title !== undefined) updatePayload.job_title = data.job_title.trim();
    if (data.department !== undefined) updatePayload.department = data.department.trim();
    if (data.employee_code !== undefined) updatePayload.employee_code = data.employee_code?.trim() || null;
    if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null;
    if (data.email !== undefined) updatePayload.email = data.email?.toLowerCase().trim() || null;
    if (data.hire_date !== undefined) updatePayload.hire_date = data.hire_date || null;
    if (data.base_salary_monthly !== undefined) updatePayload.base_salary_monthly = data.base_salary_monthly;
    if (data.payment_frequency !== undefined) updatePayload.payment_frequency = data.payment_frequency;
    if (data.work_schedule !== undefined) updatePayload.work_schedule = data.work_schedule?.trim() || null;
    if (data.rfc !== undefined) updatePayload.rfc = data.rfc?.toUpperCase().trim() || null;
    if (data.curp !== undefined) updatePayload.curp = data.curp?.toUpperCase().trim() || null;
    if (data.nss !== undefined) updatePayload.nss = data.nss?.trim() || null;
    if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;

    const { error } = await supabase
      .from("company_employees")
      .update(updatePayload)
      .eq("id", employeeId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("No se pudo actualizar la información del colaborador.");
    }
  }

  /**
   * Da de baja a un colaborador registrando motivo y fecha.
   */
  public static async terminateEmployee(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: TerminateEmployeeInput
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0];

    const { data: updatedEmployee, error } = await supabase
      .from("company_employees")
      .update({
        status: "terminated",
        termination_reason: input.reason,
        termination_date: today,
        notes: input.notes ? input.notes.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.employeeId)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();

    if (!updatedEmployee) {
      // Fallback a tabla applications si corresponde a una postulación histórica
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: appErr } = await (supabase.from as any)("applications")
        .update({
          status: "Baja",
          notes: `Motivo de baja: ${input.reason}. ${input.notes ? `Detalles: ${input.notes}` : ""}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.employeeId);

      if (appErr && error) {
        throw new Error("No se pudo registrar la baja del colaborador.");
      }
    }
  }

  /**
   * Reactiva a un colaborador dado de baja.
   */
  public static async reactivateEmployee(
    supabase: SupabaseClient<Database>,
    companyId: string,
    employeeId: string
  ): Promise<void> {
    const { data: updatedEmployee, error } = await supabase
      .from("company_employees")
      .update({
        status: "active",
        termination_reason: null,
        termination_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();

    if (!updatedEmployee) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: appErr } = await (supabase.from as any)("applications")
        .update({
          status: "Contratado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", employeeId);

      if (appErr && error) {
        throw new Error("No se pudo reactivar al colaborador.");
      }
    }
  }

  /**
   * Actualiza la fecha de inicio laboral de un colaborador.
   */
  public static async updateEmployeeStartDate(
    supabase: SupabaseClient<Database>,
    companyId: string,
    employeeId: string,
    startDate: string
  ): Promise<void> {
    const { data: updatedEmployee } = await supabase
      .from("company_employees")
      .update({
        hire_date: startDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();

    if (!updatedEmployee) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)("applications")
        .update({
          notes: startDate ? `Inicio de labores: ${startDate}` : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", employeeId);
    }
  }

  /**
   * Contrata formalmente a un candidato desde su postulación.
   */
  public static async hireCandidate(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: HireCandidateInput
  ): Promise<{ employeeRecordId: string; folio: string }> {
    // 1. Verificar postulación y vacante
    const { data: app, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        candidate_id,
        vacancy_id,
        vacancies (
          id,
          title,
          company_id,
          recruiter_id
        ),
        candidate:candidate_profiles (
          id,
          profiles (
            id,
            full_name,
            whatsapp_number,
            email,
            avatar_url
          )
        )
      `)
      .eq("id", input.applicationId)
      .single();

    if (appError || !app) {
      throw new Error("No se encontró la postulación a contratar.");
    }

    const vacancy = Array.isArray(app.vacancies) ? app.vacancies[0] : app.vacancies;
    if (!vacancy || (vacancy.company_id !== companyId && vacancy.recruiter_id !== companyId)) {
      throw new Error("No tienes permisos para contratar candidatos para esta vacante.");
    }

    const now = new Date().toISOString();

    // 2. Actualizar estado de postulación a 'Contratado'
    const { error: updateAppErr } = await supabase
      .from("applications")
      .update({
        status: "Contratado",
        hired_at: now,
        updated_at: now,
      })
      .eq("id", input.applicationId);

    if (updateAppErr) {
      throw new Error("No se pudo actualizar el estado de la postulación.");
    }

    // 3. Extraer datos de perfil
    const candidateProfile = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
    const baseProfile = candidateProfile?.profiles
      ? (Array.isArray(candidateProfile.profiles) ? candidateProfile.profiles[0] : candidateProfile.profiles)
      : null;

    const fullName = baseProfile?.full_name || "Colaborador K'anPro";
    const phone = baseProfile?.whatsapp_number || null;
    const email = baseProfile?.email || null;
    const avatarUrl = baseProfile?.avatar_url || null;

    // 4. Upsert colaborador en company_employees
    const { data: existingEmp } = await supabase
      .from("company_employees")
      .select("id")
      .eq("company_id", companyId)
      .eq("employee_id", input.candidateId)
      .maybeSingle();

    let employeeRecordId: string;

    if (existingEmp) {
      const { data: updatedEmp } = await supabase
        .from("company_employees")
        .update({
          job_title: input.jobTitle.trim(),
          department: input.department.trim(),
          hire_date: input.startDate,
          base_salary_monthly: input.salary,
          payment_frequency: input.paymentFrequency || "quincenal",
          status: "active",
          updated_at: now,
        })
        .eq("id", existingEmp.id)
        .select("id")
        .single();

      employeeRecordId = updatedEmp?.id || existingEmp.id;
    } else {
      const { data: insertedEmp, error: insEmpErr } = await supabase
        .from("company_employees")
        .insert({
          company_id: companyId,
          employee_id: input.candidateId,
          full_name: fullName,
          phone,
          email,
          avatar_url: avatarUrl,
          job_title: input.jobTitle.trim(),
          department: input.department.trim(),
          hire_date: input.startDate,
          base_salary_monthly: input.salary,
          payment_frequency: input.paymentFrequency || "quincenal",
          status: "active",
        })
        .select("id")
        .single();

      if (insEmpErr || !insertedEmp) {
        throw new Error(insEmpErr?.message || "No se pudo registrar al colaborador en la plantilla.");
      }
      employeeRecordId = insertedEmp.id;
    }

    // 5. Generar contrato formal
    const templateTypeLabels: Record<string, string> = {
      indeterminado: "Contrato por Tiempo Indeterminado (Planta)",
      determinado: "Contrato por Tiempo Determinado",
      periodo_prueba: "Periodo de Prueba (90 días)",
      obra_determinada: "Contrato por Obra Determinada",
    };
    const contractTypeLabel = templateTypeLabels[input.templateType] || "Contrato Laboral Formal";
    const folio = input.contractFolio || `KAN-CTR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const { error: contractErr } = await supabase
      .from("company_contracts")
      .insert({
        company_id: companyId,
        employee_id: employeeRecordId,
        candidate_id: input.candidateId,
        application_id: input.applicationId,
        folio,
        job_title: input.jobTitle.trim(),
        department: input.department.trim(),
        contract_type: contractTypeLabel,
        template_type: input.templateType || "indeterminado",
        start_date: input.startDate,
        salary: input.salary,
        payment_frequency: input.paymentFrequency || "quincenal",
        company_signed: true,
        company_signature_url: input.signatureData || null,
        employee_signed: false,
        status: "vigente",
      });

    if (contractErr) {
      console.error("Error saving employment contract during hiring:", contractErr);
    }

    // 6. Notificación para el candidato
    const { data: compProfile } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", companyId)
      .maybeSingle();

    const companyName = compProfile?.company_name || "La empresa";

    await supabase.from("notifications").insert({
      user_id: input.candidateId,
      title: "¡Felicidades! Has sido contratado",
      description: `${companyName} te ha contratado formalmente para el puesto de "${input.jobTitle}". ¡Mucho éxito en tu nueva etapa laboral!`,
      type: "hired",
    });

    return { employeeRecordId, folio };
  }

  /**
   * Crea una invitación para un colaborador e inserta el registro en estado pending.
   */
  public static async createEmployeeInvitation(
    supabase: SupabaseClient<Database>,
    companyId: string,
    val: CreateEmployeeInvitationValues
  ): Promise<{
    employee: CompanyEmployeeRow;
    invitation: EmployeeInvitationRow;
    rawToken: string;
  }> {
    // 1. Validar que no haya invitación activa duplicada
    const { data: existingInvitation } = await supabase
      .from("employee_invitations")
      .select("id, status")
      .eq("company_id", companyId)
      .ilike("email", val.email.trim())
      .in("status", ["pending", "sent"])
      .maybeSingle();

    if (existingInvitation) {
      throw new Error("Ya existe una invitación pendiente enviada a este correo electrónico.");
    }

    // 2. Insertar empleado temporal en estado pending
    const employeePayload: CompanyEmployeeInsert = {
      company_id: companyId,
      full_name: val.full_name.trim(),
      job_title: val.position.trim(),
      department: val.department?.trim() || "Operaciones",
      employee_code: val.employee_code?.trim() || null,
      phone: val.phone?.trim() || null,
      email: val.email.toLowerCase().trim(),
      hire_date: val.hire_date || new Date().toISOString().split("T")[0],
      base_salary_monthly: val.salary ?? null,
      work_schedule: val.work_schedule?.trim() || null,
      notes: val.notes?.trim() || null,
      status: "pending",
    };

    const { data: insertedEmployee, error: empError } = await supabase
      .from("company_employees")
      .insert(employeePayload)
      .select()
      .single();

    if (empError || !insertedEmployee) {
      throw new Error(empError?.message || "No se pudo registrar el colaborador en plantilla.");
    }

    // 3. Generar token criptográfico
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Crear registro de invitación
    const invitationPayload = {
      company_id: companyId,
      employee_id: insertedEmployee.id,
      email: val.email.toLowerCase().trim(),
      full_name: val.full_name.trim(),
      position: val.position.trim(),
      salary: val.salary ?? null,
      hire_date: val.hire_date || new Date().toISOString().split("T")[0],
      contract_type: val.contract_type || "tiempo_indeterminado",
      status: "sent",
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: companyId,
    };

    const { data: insertedInvitation, error: invError } = await supabase
      .from("employee_invitations")
      .insert(invitationPayload)
      .select()
      .single();

    if (invError || !insertedInvitation) {
      await supabase.from("company_employees").delete().eq("id", insertedEmployee.id);
      throw new Error(invError?.message || "No se pudo generar la invitación.");
    }

    return {
      employee: insertedEmployee,
      invitation: insertedInvitation,
      rawToken,
    };
  }

  /**
   * Importación masiva de colaboradores con generación de tokens.
   */
  public static async bulkImportEmployees(
    supabase: SupabaseClient<Database>,
    companyId: string,
    rows: BulkEmployeeImportRow[]
  ): Promise<{
    imported: number;
    failed: number;
    errors: { email: string; error: string }[];
    createdTokens: { email: string; full_name: string; rawToken: string }[];
  }> {
    if (!rows || rows.length === 0) {
      throw new Error("No se proporcionaron registros para importar.");
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[],
      createdTokens: [] as { email: string; full_name: string; rawToken: string }[],
    };

    const today = new Date().toISOString().split("T")[0];
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const row of rows) {
      try {
        const email = row.email.toLowerCase().trim();
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        const { data: emp, error: empErr } = await supabase
          .from("company_employees")
          .insert({
            company_id: companyId,
            full_name: row.full_name.trim(),
            job_title: row.position.trim(),
            department: row.department?.trim() || "Operaciones",
            phone: row.phone?.trim() || null,
            email,
            hire_date: row.hire_date || today,
            base_salary_monthly: row.salary ?? null,
            status: "pending",
          })
          .select("id")
          .single();

        if (empErr || !emp) throw empErr || new Error("Error creando registro");

        const { error: invErr } = await supabase
          .from("employee_invitations")
          .insert({
            company_id: companyId,
            employee_id: emp.id,
            email,
            full_name: row.full_name.trim(),
            position: row.position.trim(),
            salary: row.salary ?? null,
            hire_date: row.hire_date || today,
            contract_type: row.contract_type || "tiempo_indeterminado",
            status: "sent",
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_by: companyId,
          });

        if (invErr) throw invErr;

        results.imported++;
        results.createdTokens.push({
          email,
          full_name: row.full_name.trim(),
          rawToken,
        });
      } catch (err: unknown) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : "Error al procesar fila";
        results.errors.push({
          email: row.email,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  /**
   * Obtiene la lista de invitaciones emitidas por la empresa.
   */
  public static async getCompanyInvitations(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<Array<EmployeeInvitationRow & { status: string }>> {
    const { data, error } = await supabase
      .from("employee_invitations")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("No se pudieron cargar las invitaciones.");
    }

    const now = new Date();
    return (data || []).map((inv) => {
      let currentStatus = inv.status;
      if (currentStatus === "sent" || currentStatus === "pending") {
        if (new Date(inv.expires_at) < now) {
          currentStatus = "expired";
        }
      }
      return { ...inv, status: currentStatus };
    });
  }

  /**
   * Reenvía una invitación refrescando el token y expiración.
   */
  public static async resendEmployeeInvitation(
    supabase: SupabaseClient<Database>,
    companyId: string,
    invitationId: string
  ): Promise<{ rawToken: string }> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("employee_invitations")
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt,
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("No se pudo reenviar la invitación.");
    }

    return { rawToken };
  }

  /**
   * Cancela una invitación pendiente y actualiza el colaborador placeholder.
   */
  public static async cancelEmployeeInvitation(
    supabase: SupabaseClient<Database>,
    companyId: string,
    invitationId: string
  ): Promise<void> {
    const { data: inv, error: findErr } = await supabase
      .from("employee_invitations")
      .select("id, employee_id")
      .eq("id", invitationId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (findErr || !inv) {
      throw new Error("Invitación no encontrada.");
    }

    await supabase
      .from("employee_invitations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (inv.employee_id) {
      await supabase
        .from("company_employees")
        .update({
          status: "terminated",
          termination_reason: "Invitación cancelada por la empresa",
          updated_at: new Date().toISOString(),
        })
        .eq("id", inv.employee_id);
    }
  }

  /**
   * Consulta pública de una invitación por token hash (utiliza adminClient para enlace público).
   */
  public static async getInvitationByToken(
    adminClient: SupabaseClient<Database>,
    rawToken: string
  ): Promise<
    | {
        status: "valid";
        invitation: PublicInvitationData;
        error?: undefined;
      }
    | {
        status: "already_accepted" | "cancelled" | "expired";
        invitation: PublicInvitationData;
        error: string;
      }
    | {
        status: "invalid" | "not_found";
        invitation?: undefined;
        error: string;
      }
  > {
    if (!rawToken || rawToken.trim().length < 10) {
      return { status: "invalid", error: "Enlace de invitación inválido." };
    }

    const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");

    const { data: rawInvitation, error } = await adminClient
      .from("employee_invitations")
      .select(`
        id,
        company_id,
        email,
        full_name,
        position,
        salary,
        hire_date,
        contract_type,
        status,
        expires_at,
        accepted_at,
        company_profiles (
          id,
          company_name,
          logo_url,
          industry,
          fiscal_address
        )
      `)
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !rawInvitation) {
      return { status: "not_found", error: "La invitación no existe o el enlace ha caducado." };
    }

    const companyProfile = Array.isArray(rawInvitation.company_profiles)
      ? rawInvitation.company_profiles[0]
      : rawInvitation.company_profiles;

    const invitation: PublicInvitationData = {
      ...rawInvitation,
      company_profiles: companyProfile || null,
    };

    if (invitation.status === "accepted") {
      return {
        status: "already_accepted",
        invitation,
        error: "Esta invitación ya ha sido aceptada previamente.",
      };
    }

    if (invitation.status === "cancelled") {
      return {
        status: "cancelled",
        invitation,
        error: "Esta invitación fue cancelada por la empresa.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt || invitation.status === "expired") {
      return {
        status: "expired",
        invitation,
        error: "Esta invitación ha expirado. Solicita a tu empresa un nuevo enlace de invitación.",
      };
    }

    return {
      status: "valid",
      invitation,
    };
  }

  /**
   * Acepta una invitación vinculando la cuenta de usuario con la empresa.
   */
  public static async acceptEmployeeInvitation(
    adminClient: SupabaseClient<Database>,
    input: { rawToken: string; userId: string; email: string }
  ): Promise<{ success: boolean; message?: string }> {
    const tokenHash = crypto.createHash("sha256").update(input.rawToken.trim()).digest("hex");

    const { data: invitation, error: invError } = await adminClient
      .from("employee_invitations")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (invError || !invitation) {
      throw new Error("Invitación no encontrada o token inválido.");
    }

    if (invitation.status === "accepted") {
      return { success: true, message: "Invitación ya aceptada previamente." };
    }

    const now = new Date().toISOString();

    // 1. Vincular registro en company_employees
    if (invitation.employee_id) {
      await adminClient
        .from("company_employees")
        .update({
          employee_id: input.userId,
          status: "active",
          updated_at: now,
        })
        .eq("id", invitation.employee_id);
    } else {
      await adminClient
        .from("company_employees")
        .update({
          employee_id: input.userId,
          status: "active",
          updated_at: now,
        })
        .eq("company_id", invitation.company_id)
        .ilike("email", input.email.toLowerCase().trim());
    }

    // 2. Marcar invitación como aceptada
    await adminClient
      .from("employee_invitations")
      .update({
        status: "accepted",
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", invitation.id);

    // 3. Notificación a la empresa
    await adminClient.from("notifications").insert({
      user_id: invitation.company_id,
      title: "Colaborador se ha unido",
      description: `${invitation.full_name} ha completado su registro y se incorporó a tu plantilla activa.`,
      type: "employee_joined",
    });

    return { success: true };
  }
}

export class CompanyContractService {
  /**
   * Crea un contrato de trabajo formal en company_contracts.
   */
  public static async createContract(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: CreateContractInput
  ): Promise<{ contractId: string; folio: string }> {
    const folio =
      input.folio || `KAN-CTR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const initialStatus =
      input.status ||
      (input.companySigned && input.employeeSigned ? "vigente" : "en_firma");

    const payload: CompanyContractInsert = {
      company_id: companyId,
      employee_id: input.employeeId || null,
      candidate_id: input.candidateId || null,
      application_id: input.applicationId || null,
      folio,
      job_title: input.jobTitle.trim(),
      department: input.department.trim(),
      contract_type: input.contractType,
      template_type: input.templateType,
      start_date: input.startDate,
      end_date:
        input.templateType === "indeterminado" || !input.endDate
          ? null
          : input.endDate,
      salary: input.salary,
      payment_frequency: input.paymentFrequency || "quincenal",
      company_signed: Boolean(input.companySigned),
      company_signature_url: input.companySignatureUrl || null,
      employee_signed: Boolean(input.employeeSigned),
      employee_signature_url: input.employeeSignatureUrl || null,
      status: initialStatus,
      notes: input.notes || null,
    };

    const { data: inserted, error } = await supabase
      .from("company_contracts")
      .insert(payload)
      .select("id, folio")
      .single();

    if (error || !inserted) {
      throw new Error("No se pudo registrar el contrato en la base de datos.");
    }

    return { contractId: inserted.id, folio: inserted.folio };
  }

  /**
   * Renueva o convierte un contrato existente.
   */
  public static async renewContract(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: RenewContractInput
  ): Promise<void> {
    const isIndeterminado = input.templateType === "indeterminado";

    const { error } = await supabase
      .from("company_contracts")
      .update({
        template_type: input.templateType,
        contract_type: input.contractType,
        end_date: isIndeterminado ? null : input.endDate,
        status: "vigente",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.contractId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("No se pudo renovar el contrato en la base de datos.");
    }
  }

  /**
   * Registra la firma digital en un contrato.
   */
  public static async signContract(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: SignContractInput
  ): Promise<void> {
    const updates: CompanyContractUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (input.signerRole === "representante_legal") {
      updates.company_signed = true;
      updates.company_signature_url = input.signatureUrl;
    } else {
      updates.employee_signed = true;
      updates.employee_signature_url = input.signatureUrl;
    }

    if (input.isNowFullySigned) {
      updates.status = "vigente";
    }

    const { error } = await supabase
      .from("company_contracts")
      .update(updates)
      .eq("id", input.contractId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("No se pudo registrar la firma digital en el contrato.");
    }
  }

  /**
   * Elimina un contrato garantizando que pertenezca a la empresa.
   */
  public static async deleteContract(
    supabase: SupabaseClient<Database>,
    companyId: string,
    contractId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("company_contracts")
      .delete()
      .eq("id", contractId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("No se pudo eliminar el contrato.");
    }
  }
}

// Compatibilidad con perfiles de empresa y vacantes previas
export const companyService = {
  employee: CompanyEmployeeService,
  contract: CompanyContractService,

  async updateProfile(userId: string, profile: CompanyProfileFormValues, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();
    const finalLocation = profile.location || "Mérida";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyPayload: any = {
      company_name: profile.company_name,
      legal_name: profile.legal_name || null,
      industry: profile.industry || "General",
      fiscal_address: finalLocation || profile.address_details || "Mérida, Yucatán",
      website_url: profile.website || null,
      logo_url: profile.logo_url || null,
      banner_url: profile.banner_url || null,
      description: profile.description || null,
      contact_phone: profile.phone || null,
      company_size: profile.company_size || null,
      address_details: profile.address_details || null,
      operation_hours: profile.operation_hours || null,
      social_links: {
        instagram: profile.instagram_url || null,
        facebook: profile.facebook_url || null,
        has_transport: profile.has_transport,
        benefit_canteen: profile.benefit_canteen,
        benefit_tips: profile.benefit_tips,
        benefit_imss: profile.benefit_imss,
        benefit_uniforms: profile.benefit_uniforms,
        benefit_growth: profile.benefit_growth,
      },
      updated_at: new Date().toISOString(),
    };

    if (profile.rfc && profile.rfc.trim() !== "") {
      companyPayload.rfc = profile.rfc.toUpperCase().trim();
    }
    if (profile.fiscal_regime) {
      companyPayload.entity_type = profile.fiscal_regime;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileUpdates: any = {
      full_name: profile.company_name,
      avatar_url: profile.logo_url || null,
      location: finalLocation,
      whatsapp_number: profile.phone || null,
      updated_at: new Date().toISOString(),
    };

    const [baseRes, updateRes] = await Promise.all([
      supabase.from("profiles").update(profileUpdates).eq("id", userId),
      supabase.from("company_profiles").update(companyPayload).eq("id", userId).select("id"),
    ]);

    if (baseRes.error) throw baseRes.error;
    if (updateRes.error) throw updateRes.error;

    if (!updateRes.data || updateRes.data.length === 0) {
      const { error: upsertErr } = await supabase.from("company_profiles").upsert({
        id: userId,
        rfc: profile.rfc?.toUpperCase().trim() || "XAXX010101000",
        ...companyPayload,
      });

      if (upsertErr) throw upsertErr;
    }
  },

  async getVacancies(companyId: string, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();
    const { data, error } = await supabase
      .from("vacancies")
      .select("*")
      .or(`company_id.eq.${companyId},recruiter_id.eq.${companyId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createVacancy(companyId: string, vacancy: any, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("vacancies") as any).insert({
      company_id: companyId,
      recruiter_id: companyId,
      title: vacancy.title,
      description: vacancy.description || vacancy.requirements || "",
      requirements: vacancy.requirements || vacancy.description || "",
      modality: vacancy.modality,
      location: vacancy.location || vacancy.zone || null,
      zone: vacancy.zone || vacancy.location || null,
      category: vacancy.category || null,
      seniority: vacancy.seniority || null,
      contract_type: vacancy.contract_type || null,
      employment_type: vacancy.employment_type || null,
      application_deadline: vacancy.application_deadline || null,
      benefits: splitCsv(vacancy.benefits),
      salary_min: vacancy.salary_min && !isNaN(Number(vacancy.salary_min)) ? Number(vacancy.salary_min) : null,
      salary_max: vacancy.salary_max && !isNaN(Number(vacancy.salary_max)) ? Number(vacancy.salary_max) : null,
      currency: vacancy.currency || "USD",
      skills: splitCsv(vacancy.skills),
      status: "Activa",
      is_active: true,
    });

    if (error) throw error;
  },

  async updateVacancyStatus(vacancyId: string, status: string, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();
    const { error } = await supabase
      .from("vacancies")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", vacancyId);

    if (error) throw error;
  },

  async getApplications(companyId: string, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();

    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        notes,
        rating,
        interview_details,
        scheduled_interview_at,
        interview_status,
        hired_at,
        applied_at,
        updated_at,
        vacancy_id,
        vacancies!inner (
          id,
          title,
          company_id
        ),
        candidate:candidate_profiles (
          id,
          headline,
          bio,
          skills,
          experience,
          education,
          profiles (
            id,
            full_name,
            location,
            avatar_url,
            email,
            whatsapp_number
          )
        )
      `)
      .eq("vacancies.company_id", companyId)
      .order("applied_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((app) => {
      const candidateObj = app.candidate;
      const candidateProfile = Array.isArray(candidateObj) ? candidateObj[0] : candidateObj;
      const baseProfile = candidateProfile?.profiles
        ? (Array.isArray(candidateProfile.profiles) ? candidateProfile.profiles[0] : candidateProfile.profiles)
        : null;

      const vacObj = app.vacancies;
      const vacancy = Array.isArray(vacObj) ? vacObj[0] : vacObj;

      const rawInterview =
        typeof app.interview_details === "object" && app.interview_details !== null
          ? (app.interview_details as Record<string, unknown>)
          : null;

      const interviewData = rawInterview
        ? {
            ...rawInterview,
            status: app.interview_status || (rawInterview.status as string) || "pending",
            scheduledInterviewAt: app.scheduled_interview_at || null,
          }
        : null;

      return {
        ...app,
        notes: app.notes || "",
        rating: app.rating ?? 5,
        interview_details: interviewData,
        scheduled_interview_at: app.scheduled_interview_at || null,
        interview_status: app.interview_status || (rawInterview?.status as string) || null,
        hired_at: app.hired_at || null,
        vacancies: vacancy || { id: app.vacancy_id, title: "Vacante", company_id: companyId },
        candidate: {
          id: candidateProfile?.id || "",
          full_name: baseProfile?.full_name || "Profesional K'anPro",
          location: baseProfile?.location || "Local",
          avatar_url: baseProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
          email: baseProfile?.email || "",
          headline: candidateProfile?.headline || "Candidato",
          bio: candidateProfile?.bio || "Sin biografía disponible.",
          phone: baseProfile?.whatsapp_number || "",
          skills: candidateProfile?.skills || [],
          experience: candidateProfile?.experience || [],
          education: candidateProfile?.education || [],
        },
      };
    });
  },

  async updateApplicationStatus(applicationId: string, status: string, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();
    const { error } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
  },

  async updateApplicationNotes(applicationId: string, notes: string, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();
    const { error } = await supabase
      .from("applications")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
  },

  async updateApplicationRating(applicationId: string, rating: number, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();
    const { error } = await supabase
      .from("applications")
      .update({ rating, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateApplicationInterview(applicationId: string, interviewDetails: any, injectedSupabase?: SupabaseClient<Database>) {
    const supabase = injectedSupabase || (await import("@/lib/supabase/client")).createClient();

    let scheduledDateTime: string | null = null;
    if (interviewDetails?.date) {
      const timeStr = interviewDetails?.time || "10:00";
      try {
        scheduledDateTime = new Date(`${interviewDetails.date}T${timeStr}:00`).toISOString();
      } catch {
        scheduledDateTime = null;
      }
    }

    const { error } = await supabase
      .from("applications")
      .update({
        interview_details: {
          ...interviewDetails,
          status: interviewDetails?.status || "pending",
        },
        scheduled_interview_at: scheduledDateTime,
        interview_status: interviewDetails?.status || "pending",
        status: "Entrevista",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) throw error;
  },
};
