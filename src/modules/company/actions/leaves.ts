"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  respondToLeaveRequestSchema,
  createCompanyLeaveSchema,
  type RespondToLeaveRequestInput,
  type CreateCompanyLeaveInput,
} from "../schemas/leaves.schema";
import {
  CompanyLeavesService,
  type CompanyLeaveRow,
} from "../services/company-leaves";

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
 * Server Action: Company HR approves or rejects an employee vacation/leave request.
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

  try {
    const service = new CompanyLeavesService(supabase);
    const result = await service.respondToLeaveRequest(user.id, parsed.data);

    revalidatePath("/dashboard/company/leaves");
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

  try {
    const service = new CompanyLeavesService(supabase);
    const result = await service.createCompanyLeave(user.id, parsed.data);

    revalidatePath("/dashboard/company/leaves");
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
