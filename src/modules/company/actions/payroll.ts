"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PayrollEmployeeItem } from "../types/payroll";
import { getFortnightPeriodInfo } from "../utils/payroll-calculator";

export interface AdjustBonusesInput {
  employeeId: string;
  punctualityBonus: number;
  attendanceBonus: number;
  performanceBonus: number;
  startDate?: string;
  endDate?: string;
}

export interface DispersePayrollInput {
  periodName: string;
  startDate: string;
  endDate: string;
  payoutDate: string;
  periodType?: "semanal" | "quincenal" | "mensual";
  totalGross: number;
  totalOvertime: number;
  totalBonuses: number;
  totalDeductions: number;
  totalNet: number;
  employees: PayrollEmployeeItem[];
}

/**
 * Ajusta y persiste los bonos de un colaborador en la pre-nómina
 */
export async function adjustEmployeeBonusesAction(input: AdjustBonusesInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  const periodInfo = getFortnightPeriodInfo();
  const startDate = input.startDate || periodInfo.startDate;
  const endDate = input.endDate || periodInfo.endDate;

  // 1. Obtener o crear el registro maestro de nómina
  let { data: payroll } = await supabase
    .from("company_payrolls")
    .select("id")
    .eq("company_id", user.id)
    .eq("start_date", startDate)
    .eq("end_date", endDate)
    .maybeSingle();

  if (!payroll) {
    const { data: newPayroll, error: createError } = await supabase
      .from("company_payrolls")
      .insert({
        company_id: user.id,
        period_name: periodInfo.periodName,
        period_type: periodInfo.periodType,
        start_date: startDate,
        end_date: endDate,
        payout_date: periodInfo.payoutDate,
        status: "borrador",
      })
      .select("id")
      .single();

    if (createError || !newPayroll) {
      return { success: false, error: createError?.message || "No se pudo inicializar la nómina." };
    }
    payroll = newPayroll;
  }

  // 2. Obtener datos del colaborador
  const { data: employee } = await supabase
    .from("company_employees")
    .select("full_name, job_title, department, base_salary_monthly, bank_name, clabe_account")
    .eq("id", input.employeeId)
    .single();

  if (!employee) {
    return { success: false, error: "Colaborador no encontrado." };
  }

  const monthly = Number(employee.base_salary_monthly) || 8500;
  const baseSalaryPeriod = Math.round(monthly / 2);

  // 3. Upsert del item de nómina
  const { error: itemError } = await supabase
    .from("company_payroll_items")
    .upsert(
      {
        payroll_id: payroll.id,
        company_id: user.id,
        employee_id: input.employeeId,
        employee_name: employee.full_name,
        job_title: employee.job_title,
        department: employee.department,
        base_salary_period: baseSalaryPeriod,
        punctuality_bonus: input.punctualityBonus,
        attendance_bonus: input.attendanceBonus,
        performance_bonus: input.performanceBonus,
        bank_name: employee.bank_name || "BBVA México",
        clabe: employee.clabe_account || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payroll_id,employee_id" }
    );

  if (itemError) {
    return { success: false, error: itemError.message };
  }

  revalidatePath("/dashboard/company/payroll");
  revalidatePath("/dashboard/company");

  return { success: true };
}

/**
 * Aprueba y procesa la dispersión formal de la nómina
 */
export async function disperseCompanyPayrollAction(input: DispersePayrollInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  // 1. Guardar o actualizar registro maestro con status 'pagada'
  let payrollId: string;
  const { data: existingPayroll } = await supabase
    .from("company_payrolls")
    .select("id")
    .eq("company_id", user.id)
    .eq("start_date", input.startDate)
    .eq("end_date", input.endDate)
    .maybeSingle();

  const nowIso = new Date().toISOString();

  if (existingPayroll) {
    payrollId = existingPayroll.id;
    await supabase
      .from("company_payrolls")
      .update({
        status: "pagada",
        dispersed_at: nowIso,
        total_gross: input.totalGross,
        total_overtime: input.totalOvertime,
        total_bonuses: input.totalBonuses,
        total_deductions: input.totalDeductions,
        total_net: input.totalNet,
        employees_count: input.employees.length,
        updated_at: nowIso,
      })
      .eq("id", payrollId);
  } else {
    const { data: newPayroll, error: insertError } = await supabase
      .from("company_payrolls")
      .insert({
        company_id: user.id,
        period_name: input.periodName,
        period_type: input.periodType || "quincenal",
        start_date: input.startDate,
        end_date: input.endDate,
        payout_date: input.payoutDate,
        status: "pagada",
        dispersed_at: nowIso,
        total_gross: input.totalGross,
        total_overtime: input.totalOvertime,
        total_bonuses: input.totalBonuses,
        total_deductions: input.totalDeductions,
        total_net: input.totalNet,
        employees_count: input.employees.length,
      })
      .select("id")
      .single();

    if (insertError || !newPayroll) {
      return { success: false, error: insertError?.message || "Error al crear la orden de dispersión." };
    }
    payrollId = newPayroll.id;
  }

  // 2. Guardar el desglose de cada colaborador
  const itemsPayload = input.employees.map((emp) => ({
    payroll_id: payrollId,
    company_id: user.id,
    employee_id: emp.employeeId,
    employee_name: emp.employeeName,
    job_title: emp.jobTitle,
    department: emp.department,
    base_salary_period: emp.baseSalaryPeriod,
    days_worked: emp.daysWorked,
    overtime_hours: emp.overtimeHours,
    overtime_pay: emp.overtimePay,
    punctuality_bonus: emp.punctualityBonus,
    attendance_bonus: emp.attendanceBonus,
    performance_bonus: emp.performanceBonus,
    unjustified_absences: emp.unjustifiedAbsences,
    absence_deductions: emp.absenceDeductions,
    late_arrivals: emp.lateArrivals,
    delay_deductions: emp.delayDeductions,
    imss_deduction: emp.imssDeduction,
    isr_estimated: emp.isrEstimated,
    total_perceptions: emp.totalPerceptions,
    total_deductions: emp.totalDeductions,
    net_pay: emp.netPayEstimated,
    bank_name: emp.bankAccount?.bankName || null,
    clabe: emp.bankAccount?.clabe || null,
    updated_at: nowIso,
  }));

  const { error: upsertItemsError } = await supabase
    .from("company_payroll_items")
    .upsert(itemsPayload, { onConflict: "payroll_id,employee_id" });

  if (upsertItemsError) {
    console.error("Error guardando ítems de dispersión:", upsertItemsError);
  }

  revalidatePath("/dashboard/company/payroll");
  revalidatePath("/dashboard/company");

  return { success: true, payrollId };
}

/**
 * Actualiza los datos de cuenta bancaria de un colaborador
 */
export async function updateEmployeeBankDetailsAction(
  employeeId: string,
  bankName: string,
  clabeAccount: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("company_employees")
    .update({
      bank_name: bankName.trim(),
      clabe_account: clabeAccount.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .eq("company_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/payroll");
  revalidatePath("/dashboard/company/employees");

  return { success: true };
}
