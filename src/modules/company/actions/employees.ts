"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  getInvitationByToken,
  acceptEmployeeInvitation,
} from "@/modules/auth/services/employee-invitations";
import {
  companyEmployeeSchema,
  terminateEmployeeSchema,
  reactivateEmployeeSchema,
  updateEmployeeStartDateSchema,
  hireCandidateSchema,
  registerDirectEmployeeSchema,
  assignEmployeeDepartmentSchema,
  type CompanyEmployeeFormValues,
  type HireCandidateInput,
  type RegisterDirectEmployeeValues,
  type AssignEmployeeDepartmentValues,
} from "../schemas/employee.schema";
import {
  createEmployeeInvitationSchema,
  acceptEmployeeInvitationSchema,
  bulkEmployeeImportSchema,
  type CreateEmployeeInvitationValues,
  type BulkEmployeeImportRow,
} from "../schemas/employee-invitation.schema";
import {
  CompanyEmployeeService,
  type CompanyEmployeeRow,
  type EmployeeInvitationRow,
} from "../services/company-service";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type CreateCompanyEmployeeActionResult =
  | {
      success: true;
      data: CompanyEmployeeRow;
      employee: CompanyEmployeeRow;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      employee?: undefined;
    };

type CreateInvitationActionResult =
  | {
      success: true;
      data: {
        employee: CompanyEmployeeRow;
        invitation: EmployeeInvitationRow;
        rawToken: string;
      };
      employee: CompanyEmployeeRow;
      invitation: EmployeeInvitationRow;
      rawToken: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      employee?: undefined;
      invitation?: undefined;
      rawToken?: undefined;
    };

type ResendInvitationActionResult =
  | {
      success: true;
      data: { rawToken: string };
      rawToken: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      rawToken?: undefined;
    };

type HireCandidateActionResult =
  | {
      success: true;
      data: { employeeRecordId: string; folio: string };
      employeeId: string;
      folio: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      employeeId?: undefined;
      folio?: undefined;
    };

interface AcceptInvitationActionResult extends ActionResponse<void> {
  message?: string;
}

export type BulkImportActionResult =
  | {
      success: true;
      data: {
        imported: number;
        failed: number;
        errors: { email: string; error: string }[];
        createdTokens: { email: string; full_name: string; rawToken: string }[];
      };
      imported: number;
      failed: number;
      errors: { email: string; error: string }[];
      createdTokens: { email: string; full_name: string; rawToken: string }[];
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      imported?: undefined;
      failed?: undefined;
      errors?: undefined;
      createdTokens?: undefined;
    };

/**
 * Registra directamente un nuevo colaborador en la plantilla de la empresa autenticada.
 */
export async function createCompanyEmployeeAction(
  data: CompanyEmployeeFormValues
): Promise<CreateCompanyEmployeeActionResult> {
  const parsed = companyEmployeeSchema.safeParse(data);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de colaborador inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const employee = await CompanyEmployeeService.createEmployee(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: employee,
      employee,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo registrar el colaborador en la base de datos.";
    return { success: false, error: message };
  }
}

/**
 * Actualiza los datos de un colaborador existente de la empresa.
 */
export async function updateCompanyEmployeeAction(
  employeeId: string,
  data: Partial<CompanyEmployeeFormValues>
): Promise<ActionResponse<void>> {
  if (!employeeId || employeeId.trim().length === 0) {
    return { success: false, error: "Identificador de colaborador inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    await CompanyEmployeeService.updateEmployee(
      supabase,
      user.id,
      employeeId,
      data
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo actualizar la información del colaborador.";
    return { success: false, error: message };
  }
}

/**
 * Da de baja a un colaborador registrando el motivo.
 */
export async function terminateCompanyEmployeeAction(
  employeeId: string,
  reason: string,
  notes?: string
): Promise<ActionResponse<void>> {
  const parsed = terminateEmployeeSchema.safeParse({
    employeeId,
    reason,
    notes,
  });

  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de baja de colaborador inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    await CompanyEmployeeService.terminateEmployee(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo registrar la baja del colaborador.";
    return { success: false, error: message };
  }
}

/**
 * Reactiva a un colaborador en estado de baja a estado activo.
 */
export async function reactivateCompanyEmployeeAction(
  employeeId: string
): Promise<ActionResponse<void>> {
  const parsed = reactivateEmployeeSchema.safeParse({ employeeId });
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Identificador de colaborador inválido.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    await CompanyEmployeeService.reactivateEmployee(
      supabase,
      user.id,
      parsed.data.employeeId
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo reactivar al colaborador.";
    return { success: false, error: message };
  }
}

/**
 * Actualiza la fecha oficial de inicio laboral del colaborador.
 */
export async function updateEmployeeStartDate(
  employeeId: string,
  startDate: string
): Promise<ActionResponse<void>> {
  const parsed = updateEmployeeStartDateSchema.safeParse({ employeeId, startDate });
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Fecha de inicio o identificador inválido.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    await CompanyEmployeeService.updateEmployeeStartDate(
      supabase,
      user.id,
      parsed.data.employeeId,
      parsed.data.startDate
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo actualizar la fecha de ingreso.";
    return { success: false, error: message };
  }
}

/**
 * Asigna o actualiza el área o departamento de un colaborador.
 */
export async function assignEmployeeDepartmentAction(
  rawInput: AssignEmployeeDepartmentValues
): Promise<ActionResponse<{ employeeId: string; department: string | null }>> {
  const parsed = assignEmployeeDepartmentSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de asignación de área inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    const targetDepartment = parsed.data.department?.trim() || null;
    await CompanyEmployeeService.assignEmployeeDepartment(
      supabase,
      user.id,
      parsed.data.employeeId,
      targetDepartment
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company/areas");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: {
        employeeId: parsed.data.employeeId,
        department: targetDepartment,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo asignar el área al colaborador.";
    return { success: false, error: message };
  }
}

/**
 * Alias de compatibilidad hacia atrás para terminateCompanyEmployeeAction
 */
export async function terminateEmployee(
  employeeId: string,
  reason: string,
  notes?: string
): Promise<ActionResponse<void>> {
  return terminateCompanyEmployeeAction(employeeId, reason, notes);
}

/**
 * Alias de compatibilidad hacia atrás para reactivateCompanyEmployeeAction
 */
export async function reactivateEmployee(
  employeeId: string
): Promise<ActionResponse<void>> {
  return reactivateCompanyEmployeeAction(employeeId);
}

/**
 * Genera una invitación de colaborador y pre-registra al empleado en estado 'pending'.
 */
export async function createEmployeeInvitationAction(
  data: CreateEmployeeInvitationValues
): Promise<CreateInvitationActionResult> {
  const parsed = createEmployeeInvitationSchema.safeParse(data);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de invitación inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const result = await CompanyEmployeeService.createEmployeeInvitation(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
      employee: result.employee,
      invitation: result.invitation,
      rawToken: result.rawToken,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo generar la invitación.";
    return { success: false, error: message };
  }
}

/**
 * Importa por lotes colaboradores a partir de registros validados y genera invitaciones.
 */
export async function bulkImportEmployeesAction(
  rows: BulkEmployeeImportRow[]
): Promise<BulkImportActionResult> {
  const parsed = bulkEmployeeImportSchema.safeParse(rows);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de importación masiva inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const results = await CompanyEmployeeService.bulkImportEmployees(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: results,
      ...results,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al procesar la importación masiva.";
    return { success: false, error: message };
  }
}

/**
 * Consulta la lista de invitaciones activas o históricas creadas por la empresa.
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

  return CompanyEmployeeService.getCompanyInvitations(supabase, user.id);
}

/**
 * Reenvía una invitación emitiendo un nuevo token y extendiendo su caducidad.
 */
export async function resendEmployeeInvitationAction(
  invitationId: string
): Promise<ResendInvitationActionResult> {
  if (!invitationId || invitationId.trim().length === 0) {
    return { success: false, error: "Identificador de invitación inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const result = await CompanyEmployeeService.resendEmployeeInvitation(
      supabase,
      user.id,
      invitationId
    );

    revalidatePath("/dashboard/company/employees");

    return {
      success: true,
      data: result,
      rawToken: result.rawToken,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo reenviar la invitación.";
    return { success: false, error: message };
  }
}

/**
 * Cancela una invitación pendiente e invalida el registro del colaborador.
 */
export async function cancelEmployeeInvitationAction(
  invitationId: string
): Promise<ActionResponse<void>> {
  if (!invitationId || invitationId.trim().length === 0) {
    return { success: false, error: "Identificador de invitación inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    await CompanyEmployeeService.cancelEmployeeInvitation(
      supabase,
      user.id,
      invitationId
    );

    revalidatePath("/dashboard/company/employees");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo cancelar la invitación.";
    return { success: false, error: message };
  }
}

/**
 * Consulta pública de una invitación por token para la pantalla de bienvenida / aceptación.
 */
export async function getInvitationByTokenAction(rawToken: string) {
  return getInvitationByToken(rawToken);
}

/**
 * Acepta una invitación y vincula la cuenta de un nuevo usuario a la empresa.
 * Requiere sesión activa del usuario y vincula inmutablemente su sesión auth (user.id).
 */
export async function acceptEmployeeInvitationAction(rawInput: {
  rawToken: string;
  email: string;
  userId?: string;
}): Promise<AcceptInvitationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Debes iniciar sesión para aceptar la invitación." };
  }

  const parsed = acceptEmployeeInvitationSchema.safeParse({
    rawToken: rawInput.rawToken,
    email: rawInput.email,
    userId: user.id, // Forzar ID inmutable de la sesión autenticada en el servidor
  });

  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de aceptación de invitación inválidos.";
    return { success: false, error: errorMsg };
  }

  try {
    const result = await acceptEmployeeInvitation(parsed.data);
    return { success: true, message: result.message };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al aceptar la invitación.";
    return { success: false, error: message };
  }
}

/**
 * Contrata formalmente a un candidato a partir de una postulación.
 * Actualiza la postulación a 'Contratado', registra al empleado en plantilla,
 * genera el contrato laboral y notifica al colaborador.
 */
export async function hireCandidateAction(
  rawInput: HireCandidateInput
): Promise<HireCandidateActionResult> {
  const parsed = hireCandidateSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de contratación de candidato inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const result = await CompanyEmployeeService.hireCandidate(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/applications");
    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company/contracts");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/candidate/applications");

    return {
      success: true,
      data: result,
      employeeId: result.employeeRecordId,
      folio: result.folio,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al procesar la contratación del candidato.";
    return { success: false, error: message };
  }
}

/**
 * Registra directamente un colaborador creando sus credenciales de acceso de forma administrativa.
 */
export async function registerDirectEmployeeAction(
  data: RegisterDirectEmployeeValues
): Promise<ActionResponse<{ employee: CompanyEmployeeRow; userId: string }>> {
  const parsed = registerDirectEmployeeSchema.safeParse(data);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de registro inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  // Verificar que el usuario tenga rol de empresa activa antes de usar privilegios administrativos
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "company" || profile.status === "suspended") {
    return {
      success: false,
      error: "Acceso denegado: Solo empresas activas pueden registrar colaboradores directamente.",
    };
  }

  try {
    const adminClient = createAdminClient();
    const result = await CompanyEmployeeService.registerDirectEmployee(
      adminClient,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al registrar colaborador.";
    return { success: false, error: message };
  }
}

