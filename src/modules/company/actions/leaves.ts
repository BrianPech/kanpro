"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { companyTenantService } from "../services/company-tenant.service";
import {
  respondToLeaveRequestSchema,
  createCompanyLeaveSchema,
  leaveReferenceSchema,
  type RespondToLeaveRequestInput,
  type CreateCompanyLeaveInput,
} from "../schemas/leaves.schema";
import {
  CompanyLeavesService,
  type CompanyLeaveRow,
} from "../services/company-leaves";
import { LeaveCertificateService } from "../services/leave-certificate.service";
import type { LeaveApprovalMode } from "../strategies/leave-approval.strategy";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RespondToLeaveActionResult extends ActionResponse<CompanyLeaveRow> {
  message?: string;
}

interface CreateCompanyLeaveActionResult extends ActionResponse<{ leaveId: string; message: string }> {
  message?: string;
  leaveId?: string;
}

/**
 * Server Action: Company HR or Area Leader approves/V.o.B.o. or rejects an employee vacation/leave request.
 * Persists status in public.company_leaves and alerts employee via in-app notification.
 */
export async function respondToCompanyLeaveAction(
  rawInput: RespondToLeaveRequestInput
): Promise<RespondToLeaveActionResult> {
  const parsed = respondToLeaveRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Parámetros de resolución de solicitud inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyLeavesService(supabase);
    const result = await service.respondToLeaveRequest(companyScopeId, parsed.data);

    revalidatePath("/dashboard/company/leaves");
    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/candidate/leaves");
    revalidatePath("/dashboard/candidate");

    return {
      success: true,
      data: result.leave,
      message: result.message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al resolver solicitud.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Company HR directly creates/registers a leave for an employee.
 */
export async function createCompanyLeaveAction(
  rawInput: CreateCompanyLeaveInput
): Promise<CreateCompanyLeaveActionResult> {
  const parsed = createCompanyLeaveSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de solicitud inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyLeavesService(supabase);
    const result = await service.createCompanyLeave(companyScopeId, parsed.data);

    revalidatePath("/dashboard/company/leaves");
    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/candidate/leaves");

    return {
      success: true,
      data: { leaveId: result.leaveId, message: result.message },
      message: result.message,
      leaveId: result.leaveId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al registrar permiso.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Updates company leave approval mode ('single_step' | 'two_step').
 */
export async function updateCompanyLeaveApprovalModeAction(
  mode: LeaveApprovalMode
): Promise<ActionResponse<{ mode: LeaveApprovalMode }>> {
  if (mode !== "single_step" && mode !== "two_step") {
    return { success: false, error: "Modo de aprobación inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  const { error } = await supabase
    .from("company_profiles")
    .update({ leave_approval_config: { approvalMode: mode } })
    .eq("id", companyScopeId);

  if (error) {
    return { success: false, error: error.message || "No se pudo guardar el modo de aprobación." };
  }

  revalidatePath("/dashboard/company/leaves");
  return { success: true, data: { mode } };
}

/**
 * Server Action: Generates official vacation/leave enjoyment certificate PDF (base64) for company HR.
 */
export async function generateCompanyLeaveCertificateAction(
  requestId: string
): Promise<ActionResponse<{ fileName: string; base64: string }>> {
  const parsed = leaveReferenceSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "ID de solicitud inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const { fileName, pdf } = await new LeaveCertificateService(supabase).generateForCompany(
      companyScopeId,
      parsed.data.requestId
    );
    return {
      success: true,
      data: { fileName, base64: Buffer.from(pdf).toString("base64") },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "No se pudo generar la constancia.";
    return { success: false, error: errorMsg };
  }
}
