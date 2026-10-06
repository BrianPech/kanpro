"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  adjustBonusesSchema,
  dispersePayrollSchema,
  updateEmployeeBankDetailsSchema,
  closePayrollPeriodSchema,
  type AdjustBonusesInput,
  type DispersePayrollInput,
  type UpdateEmployeeBankDetailsInput,
  type ClosePayrollPeriodInput,
} from "../schemas/payroll.schema";
import {
  CompanyPayrollService,
  type PayrollRow,
} from "../services/company-payroll";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AdjustBonusesActionResult extends ActionResponse<{ payrollId: string }> {
  payrollId?: string;
}

interface DispersePayrollActionResult extends ActionResponse<{ payrollId: string }> {
  payrollId?: string;
}

interface UpdateBankDetailsActionResult extends ActionResponse<{ employeeId: string }> {
  employeeId?: string;
}

interface ClosePayrollPeriodActionResult extends ActionResponse<PayrollRow> {
  payroll?: PayrollRow;
}

/**
 * Ajusta y persiste los bonos de un colaborador en la pre-nómina
 */
export async function adjustEmployeeBonusesAction(
  rawInput: AdjustBonusesInput
): Promise<AdjustBonusesActionResult> {
  const parsed = adjustBonusesSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de ajuste de bonos inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    const service = new CompanyPayrollService(supabase);
    const result = await service.adjustEmployeeBonuses(user.id, parsed.data);

    revalidatePath("/dashboard/company/payroll");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
      payrollId: result.payrollId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al ajustar bonos.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Aprueba y procesa la dispersión formal de la nómina
 */
export async function disperseCompanyPayrollAction(
  rawInput: DispersePayrollInput
): Promise<DispersePayrollActionResult> {
  const parsed = dispersePayrollSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de dispersión de nómina inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyPayrollService(supabase);
    const result = await service.disperseCompanyPayroll(user.id, parsed.data);

    revalidatePath("/dashboard/company/payroll");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
      payrollId: result.payrollId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al dispersar nómina.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Actualiza los datos de cuenta bancaria de un colaborador
 */
export async function updateEmployeeBankDetailsAction(
  employeeId: string,
  bankName: string,
  clabeAccount: string
): Promise<UpdateBankDetailsActionResult> {
  const parsed = updateEmployeeBankDetailsSchema.safeParse({
    employeeId,
    bankName,
    clabeAccount,
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos bancarios inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyPayrollService(supabase);
    await service.updateEmployeeBankDetails(user.id, parsed.data);

    revalidatePath("/dashboard/company/payroll");
    revalidatePath("/dashboard/company/employees");

    return {
      success: true,
      data: { employeeId: parsed.data.employeeId },
      employeeId: parsed.data.employeeId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al actualizar datos bancarios.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Cierra formalmente un periodo de nómina
 */
export async function closePayrollPeriodAction(
  rawInput: ClosePayrollPeriodInput
): Promise<ClosePayrollPeriodActionResult> {
  const parsed = closePayrollPeriodSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de cierre de periodo inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyPayrollService(supabase);
    const payroll = await service.closePayrollPeriod(user.id, parsed.data);

    revalidatePath("/dashboard/company/payroll");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: payroll,
      payroll,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al cerrar periodo de nómina.";
    return { success: false, error: errorMsg };
  }
}
