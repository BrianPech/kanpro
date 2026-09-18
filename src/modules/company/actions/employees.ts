"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { Database } from "@/types/supabase";
import {
  companyEmployeeSchema,
  type CompanyEmployeeFormValues,
} from "../schemas/employee.schema";
import {
  createEmployeeInvitationSchema,
  type CreateEmployeeInvitationValues,
  type BulkEmployeeImportRow,
} from "../schemas/employee-invitation.schema";

type CompanyEmployeeUpdate = Database["public"]["Tables"]["company_employees"]["Update"];

/**
 * Creates a new employee record directly under the authenticated company.
 */
export async function createCompanyEmployeeAction(data: CompanyEmployeeFormValues) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const parsed = companyEmployeeSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Datos de colaborador inválidos.";
    throw new Error(firstError);
  }

  const val = parsed.data;

  const payload = {
    company_id: user.id,
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
    status: "active" as const,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("company_employees")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error("Error creating direct company employee:", insertError);
    throw new Error(insertError.message || "No se pudo registrar el colaborador en la base de datos.");
  }

  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company");

  return { success: true, employee: inserted };
}

/**
 * Updates an existing direct employee's details.
 */
export async function updateCompanyEmployeeAction(
  employeeId: string,
  data: Partial<CompanyEmployeeFormValues>
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

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
    .eq("company_id", user.id);

  if (error) {
    console.error("Error updating company employee:", error);
    throw new Error("No se pudo actualizar la información del colaborador.");
  }

  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Terminates an employee relationship with a documented reason.
 */
export async function terminateCompanyEmployeeAction(
  employeeId: string,
  reason: string,
  notes?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const today = new Date().toISOString().split("T")[0];

  // 1. Try updating in company_employees
  const { data: updatedEmployee, error } = await supabase
    .from("company_employees")
    .update({
      status: "terminated",
      termination_reason: reason,
      termination_date: today,
      notes: notes ? notes.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .eq("company_id", user.id)
    .select("id")
    .maybeSingle();

  // 2. Fallback to applications table if it was an application record
  if (!updatedEmployee) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("applications")
      .update({
        status: "Baja",
        notes: `Motivo de baja: ${reason}. ${notes ? `Detalles: ${notes}` : ""}`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId);
  }

  if (error && !updatedEmployee) {
    console.error("Error terminating employee:", error);
    throw new Error("No se pudo registrar la baja del colaborador.");
  }

  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Reactivates a terminated employee back to active status.
 */
export async function reactivateCompanyEmployeeAction(employeeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  // 1. Try company_employees
  const { data: updatedEmployee, error } = await supabase
    .from("company_employees")
    .update({
      status: "active",
      termination_reason: null,
      termination_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .eq("company_id", user.id)
    .select("id")
    .maybeSingle();

  // 2. Fallback to applications
  if (!updatedEmployee) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("applications")
      .update({
        status: "Contratado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId);
  }

  if (error && !updatedEmployee) {
    console.error("Error reactivating employee:", error);
    throw new Error("No se pudo reactivar al colaborador.");
  }

  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Updates the employment start date for an employee.
 */
export async function updateEmployeeStartDate(employeeId: string, startDate: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicia sesión para continuar.");
  }

  // 1. Try company_employees
  const { data: updatedEmployee } = await supabase
    .from("company_employees")
    .update({
      hire_date: startDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .eq("company_id", user.id)
    .select("id")
    .maybeSingle();

  // 2. Fallback to applications
  if (!updatedEmployee) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("applications")
      .update({
        notes: startDate ? `Inicio de labores: ${startDate}` : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId);
  }

  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Backward compatibility alias for terminateCompanyEmployeeAction
 */
export async function terminateEmployee(
  employeeId: string,
  reason: string,
  notes?: string
) {
  return terminateCompanyEmployeeAction(employeeId, reason, notes);
}

/**
 * Backward compatibility alias for reactivateCompanyEmployeeAction
 */
export async function reactivateEmployee(employeeId: string) {
  return reactivateCompanyEmployeeAction(employeeId);
}

/**
 * Creates an employee invitation and pre-registers a pending employee record.
 */
export async function createEmployeeInvitationAction(data: CreateEmployeeInvitationValues) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const parsed = createEmployeeInvitationSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Datos de invitación inválidos.";
    throw new Error(firstError);
  }

  const val = parsed.data;

  // 1. Check if an active/pending invitation already exists for this email
  const { data: existingInvitation } = await supabase
    .from("employee_invitations")
    .select("id, status")
    .eq("company_id", user.id)
    .ilike("email", val.email.trim())
    .in("status", ["pending", "sent"])
    .maybeSingle();

  if (existingInvitation) {
    throw new Error("Ya existe una invitación pendiente enviada a este correo electrónico.");
  }

  // 2. Insert employee placeholder with status 'pending'
  const employeePayload = {
    company_id: user.id,
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
    status: "pending" as const,
  };

  const { data: insertedEmployee, error: empError } = await supabase
    .from("company_employees")
    .insert(employeePayload)
    .select()
    .single();

  if (empError) {
    console.error("Error creating pending company employee:", empError);
    throw new Error(empError.message || "No se pudo registrar el colaborador en plantilla.");
  }

  // 3. Generate secure cryptographic token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // 4. Insert invitation record
  const invitationPayload = {
    company_id: user.id,
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
    created_by: user.id,
  };

  const { data: insertedInvitation, error: invError } = await supabase
    .from("employee_invitations")
    .insert(invitationPayload)
    .select()
    .single();

  if (invError) {
    console.error("Error creating employee invitation:", invError);
    await supabase.from("company_employees").delete().eq("id", insertedEmployee.id);
    throw new Error(invError.message || "No se pudo generar la invitación.");
  }

  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company");

  return {
    success: true,
    employee: insertedEmployee,
    invitation: insertedInvitation,
    rawToken,
  };
}

/**
 * Bulk imports employees from validated records and generates invitations.
 */
export async function bulkImportEmployeesAction(rows: BulkEmployeeImportRow[]) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

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

      // 1. Insert employee record with status 'pending'
      const { data: emp, error: empErr } = await supabase
        .from("company_employees")
        .insert({
          company_id: user.id,
          full_name: row.full_name.trim(),
          job_title: row.position.trim(),
          department: row.department?.trim() || "Operaciones",
          phone: row.phone?.trim() || null,
          email: email,
          hire_date: row.hire_date || today,
          base_salary_monthly: row.salary ?? null,
          status: "pending",
        })
        .select("id")
        .single();

      if (empErr) throw empErr;

      // 2. Insert invitation record
      const { error: invErr } = await supabase
        .from("employee_invitations")
        .insert({
          company_id: user.id,
          employee_id: emp.id,
          email: email,
          full_name: row.full_name.trim(),
          position: row.position.trim(),
          salary: row.salary ?? null,
          hire_date: row.hire_date || today,
          contract_type: row.contract_type || "tiempo_indeterminado",
          status: "sent",
          token_hash: tokenHash,
          expires_at: expiresAt,
          created_by: user.id,
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

  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company");

  return results;
}

/**
 * Retrieves all invitations created by the current company.
 */
export async function getCompanyInvitationsAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado.");
  }

  const { data, error } = await supabase
    .from("employee_invitations")
    .select(`
      id,
      company_id,
      employee_id,
      email,
      full_name,
      position,
      salary,
      hire_date,
      contract_type,
      status,
      expires_at,
      accepted_at,
      created_at
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching company invitations:", error);
    throw new Error("No se pudieron cargar las invitaciones.");
  }

  const now = new Date();
  const processed = (data || []).map((inv) => {
    let currentStatus = inv.status;
    if (currentStatus === "sent" || currentStatus === "pending") {
      if (new Date(inv.expires_at) < now) {
        currentStatus = "expired";
      }
    }
    return { ...inv, status: currentStatus };
  });

  return processed;
}

/**
 * Resends an invitation with a refreshed token and expiry date.
 */
export async function resendEmployeeInvitationAction(invitationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado.");
  }

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
    .eq("company_id", user.id);

  if (error) {
    console.error("Error resending employee invitation:", error);
    throw new Error("No se pudo reenviar la invitación.");
  }

  revalidatePath("/dashboard/company/employees");

  return { success: true, rawToken };
}

/**
 * Cancels a pending invitation and updates the employee record.
 */
export async function cancelEmployeeInvitationAction(invitationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado.");
  }

  const { data: inv } = await supabase
    .from("employee_invitations")
    .select("id, employee_id")
    .eq("id", invitationId)
    .eq("company_id", user.id)
    .single();

  if (!inv) throw new Error("Invitación no encontrada.");

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

  revalidatePath("/dashboard/company/employees");

  return { success: true };
}

/**
 * Retrieves public invitation details by rawToken for the onboarding acceptance page.
 */
export async function getInvitationByTokenAction(rawToken: string) {
  if (!rawToken || rawToken.trim().length < 10) {
    return { status: "invalid" as const, error: "Enlace de invitación inválido." };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
  const adminClient = createAdminClient();

  const { data: invitation, error } = await adminClient
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

  if (error || !invitation) {
    return { status: "not_found" as const, error: "La invitación no existe o el enlace ha caducado." };
  }

  if (invitation.status === "accepted") {
    return {
      status: "already_accepted" as const,
      invitation,
      error: "Esta invitación ya ha sido aceptada previamente.",
    };
  }

  if (invitation.status === "cancelled") {
    return {
      status: "cancelled" as const,
      invitation,
      error: "Esta invitación fue cancelada por la empresa.",
    };
  }

  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);

  if (now > expiresAt || invitation.status === "expired") {
    return {
      status: "expired" as const,
      invitation,
      error: "Esta invitación ha expirado. Solicita a tu empresa un nuevo enlace de invitación.",
    };
  }

  return {
    status: "valid" as const,
    invitation,
  };
}

/**
 * Accepts an employee invitation and links the user's new account to the company.
 */
export async function acceptEmployeeInvitationAction({
  rawToken,
  userId,
  email,
}: {
  rawToken: string;
  userId: string;
  email: string;
}) {
  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
  const adminClient = createAdminClient();

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

  // 1. Link company_employees
  if (invitation.employee_id) {
    await adminClient
      .from("company_employees")
      .update({
        employee_id: userId,
        status: "active",
        updated_at: now,
      })
      .eq("id", invitation.employee_id);
  } else {
    await adminClient
      .from("company_employees")
      .update({
        employee_id: userId,
        status: "active",
        updated_at: now,
      })
      .eq("company_id", invitation.company_id)
      .ilike("email", email.toLowerCase().trim());
  }

  // 2. Mark invitation accepted
  await adminClient
    .from("employee_invitations")
    .update({
      status: "accepted",
      accepted_at: now,
      updated_at: now,
    })
    .eq("id", invitation.id);

  // 3. Insert notification for the company
  await adminClient.from("notifications").insert({
    user_id: invitation.company_id,
    title: "Colaborador se ha unido",
    description: `${invitation.full_name} ha completado su registro y se incorporó a tu plantilla activa.`,
    type: "employee_joined",
  });

  return { success: true };
}

export interface HireCandidateInput {
  applicationId: string;
  candidateId: string;
  jobTitle: string;
  department: string;
  templateType: string;
  startDate: string;
  salary: number;
  paymentFrequency?: string;
  contractFolio?: string;
  signatureData?: string;
}

/**
 * Server Action: Formally hires a candidate from a job application.
 * Atomically updates application status to 'Contratado',
 * upserts the employee in company_employees,
 * generates an official company contract record in company_contracts,
 * and delivers an in-app congratulations notification to the candidate.
 */
export async function hireCandidateAction(input: HireCandidateInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  // 1. Fetch application and associated vacancy
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
  if (!vacancy || (vacancy.company_id !== user.id && vacancy.recruiter_id !== user.id)) {
    throw new Error("No tienes permisos para contratar candidatos para esta vacante.");
  }

  const now = new Date().toISOString();

  // 2. Update application status to 'Contratado'
  const { error: updateAppErr } = await supabase
    .from("applications")
    .update({
      status: "Contratado",
      hired_at: now,
      updated_at: now,
    })
    .eq("id", input.applicationId);

  if (updateAppErr) {
    console.error("Error updating application status:", updateAppErr);
    throw new Error("No se pudo actualizar el estado de la postulación.");
  }

  // 3. Extract candidate details for company_employees
  const candidateProfile = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
  const baseProfile = candidateProfile?.profiles
    ? (Array.isArray(candidateProfile.profiles) ? candidateProfile.profiles[0] : candidateProfile.profiles)
    : {};

  const fullName = baseProfile.full_name || "Colaborador K'anPro";
  const phone = baseProfile.whatsapp_number || null;
  const email = baseProfile.email || null;
  const avatarUrl = baseProfile.avatar_url || null;

  // 4. Upsert employee in company_employees
  const { data: existingEmp } = await supabase
    .from("company_employees")
    .select("id")
    .eq("company_id", user.id)
    .eq("employee_id", input.candidateId)
    .maybeSingle();

  let employeeRecordId: string;

  if (existingEmp) {
    const { data: updatedEmp, error: updEmpErr } = await supabase
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

    if (updEmpErr) {
      console.error("Error updating existing employee record:", updEmpErr);
    }
    employeeRecordId = updatedEmp?.id || existingEmp.id;
  } else {
    const { data: insertedEmp, error: insEmpErr } = await supabase
      .from("company_employees")
      .insert({
        company_id: user.id,
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

    if (insEmpErr) {
      console.error("Error creating company employee upon hiring:", insEmpErr);
      throw new Error(insEmpErr.message || "No se pudo registrar al colaborador en la plantilla.");
    }
    employeeRecordId = insertedEmp.id;
  }

  // 5. Generate and register formal contract in company_contracts
  const templateTypeLabels: Record<string, string> = {
    indeterminado: "Contrato por Tiempo Indeterminado (Planta)",
    determinado: "Contrato por Tiempo Determinado",
    periodo_prueba: "Periodo de Prueba (90 días)",
    obra_determinada: "Contrato por Obra Determinada",
  };
  const contractTypeLabel = templateTypeLabels[input.templateType] || "Contrato Laboral Formal";
  const folio = input.contractFolio || `KAN-CTR-2026-${Math.floor(100 + Math.random() * 900)}`;

  const { error: contractErr } = await supabase
    .from("company_contracts")
    .insert({
      company_id: user.id,
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
    console.error("Error saving employment contract:", contractErr);
  }

  // 6. Deliver platform notification to candidate
  const { data: compProfile } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("id", user.id)
    .maybeSingle();

  const companyName = compProfile?.company_name || "La empresa";

  await supabase.from("notifications").insert({
    user_id: input.candidateId,
    title: "¡Felicidades! Has sido contratado",
    description: `${companyName} te ha contratado formalmente para el puesto de "${input.jobTitle}". ¡Mucho éxito en tu nueva etapa laboral!`,
    type: "hired",
  });

  // 7. Revalidate relevant routes
  revalidatePath("/dashboard/company/applications");
  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company/contracts");
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/candidate/applications");

  return {
    success: true,
    employeeId: employeeRecordId,
    folio,
  };
}

