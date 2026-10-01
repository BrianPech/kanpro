import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  PayrollPeriodSummary,
  PayrollEmployeeItem,
} from "../types/payroll";
import {
  getFortnightPeriodInfo,
  calculateMexicanISR,
  calculateIMSSWorkerShare,
  calculateOvertimePay,
  calculateAbsenceDeduction,
  generateValidClabe,
  FortnightPeriodInfo,
} from "../utils/payroll-calculator";
import type {
  AdjustBonusesInput,
  DispersePayrollInput,
  UpdateEmployeeBankDetailsInput,
  ClosePayrollPeriodInput,
} from "../schemas/payroll.schema";

export type PayrollRow = Database["public"]["Tables"]["company_payrolls"]["Row"];
export type PayrollInsert = Database["public"]["Tables"]["company_payrolls"]["Insert"];
export type PayrollItemRow = Database["public"]["Tables"]["company_payroll_items"]["Row"];
export type PayrollItemInsert = Database["public"]["Tables"]["company_payroll_items"]["Insert"];
export type AttendanceRow = Database["public"]["Tables"]["company_attendance"]["Row"];

export interface CompanyPayrollDataResult {
  summary: PayrollPeriodSummary;
  companyName: string;
}

export class CompanyPayrollService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Obtiene la pre-nómina en tiempo real calculada con colaboradores reales de Supabase,
   * cruzando asistencias, horas extras e incidencias del periodo quincenal.
   */
  async getCompanyPayrollData(
    companyId: string,
    refDate = new Date()
  ): Promise<CompanyPayrollDataResult> {
    const periodInfo: FortnightPeriodInfo = getFortnightPeriodInfo(refDate);

    if (!companyId) {
      return this.buildEmptyPayrollResult(periodInfo);
    }

    const [
      companyRes,
      employeesRes,
      savedPayrollRes,
      attendanceRes,
    ] = await Promise.all([
      this.supabase
        .from("company_profiles")
        .select("id, company_name, legal_name, rfc")
        .eq("id", companyId)
        .maybeSingle(),
      this.supabase
        .from("company_employees")
        .select(`
          id,
          employee_id,
          full_name,
          job_title,
          department,
          avatar_url,
          base_salary_monthly,
          payment_frequency,
          status,
          rfc,
          curp,
          bank_name,
          clabe_account
        `)
        .eq("company_id", companyId)
        .in("status", ["active", "onboarding"])
        .order("full_name", { ascending: true }),
      this.supabase
        .from("company_payrolls")
        .select(`
          id,
          status,
          dispersed_at,
          company_payroll_items (*)
        `)
        .eq("company_id", companyId)
        .eq("start_date", periodInfo.startDate)
        .eq("end_date", periodInfo.endDate)
        .maybeSingle(),
      this.supabase
        .from("company_attendance")
        .select("*")
        .eq("company_id", companyId)
        .gte("work_date", periodInfo.startDate)
        .lte("work_date", periodInfo.endDate),
    ]);

    const companyName = companyRes.data?.company_name || companyRes.data?.legal_name || "Mi Empresa";
    const activeEmployees = employeesRes.data || [];
    const attendanceRecords: AttendanceRow[] = attendanceRes.data || [];

    const attendanceByEmp = new Map<string, AttendanceRow[]>();
    attendanceRecords.forEach((att) => {
      const list = attendanceByEmp.get(att.employee_id) || [];
      list.push(att);
      attendanceByEmp.set(att.employee_id, list);
    });

    const savedItemsMap = new Map<string, PayrollItemRow>();
    const savedPayroll = savedPayrollRes.data;
    if (savedPayroll && Array.isArray(savedPayroll.company_payroll_items)) {
      savedPayroll.company_payroll_items.forEach((item) => {
        savedItemsMap.set(item.employee_id, item);
      });
    }

    const payrollEmployees: PayrollEmployeeItem[] = [];
    let sumGross = 0;
    let sumOvertime = 0;
    let sumBonuses = 0;
    let sumDeductions = 0;
    let sumNet = 0;

    for (const emp of activeEmployees) {
      const savedItem = savedItemsMap.get(emp.id);
      const monthlySalary = Number(emp.base_salary_monthly) || 8500;
      const isWeekly = emp.payment_frequency === "semanal";
      const baseSalaryPeriod = Math.round(isWeekly ? (monthlySalary / 30) * 7 : monthlySalary / 2);

      const empAtt = attendanceByEmp.get(emp.id) || [];
      const unjustifiedAbsences = empAtt.filter((a) => a.status === "falta_injustificada").length;
      const lateArrivals = empAtt.filter((a) => a.status === "retardo").length;

      let overtimeHours = 0;
      let overtimePay = 0;
      empAtt.forEach((a) => {
        if (a.overtime_status === "autorizado" && Number(a.overtime_hours) > 0) {
          const hours = Number(a.overtime_hours);
          overtimeHours += hours;
          const rate = a.overtime_rate_type === "triple" ? "triple" : "doble";
          overtimePay += calculateOvertimePay(monthlySalary, hours, rate);
        }
      });

      const daysWorked = Math.max(0, 15 - unjustifiedAbsences);
      const defaultPunctuality = lateArrivals === 0 ? Math.round(baseSalaryPeriod * 0.05) : 0;
      const defaultAttendance = unjustifiedAbsences === 0 ? Math.round(baseSalaryPeriod * 0.05) : 0;

      const punctualityBonus = savedItem?.punctuality_bonus !== undefined && savedItem?.punctuality_bonus !== null
        ? Number(savedItem.punctuality_bonus)
        : defaultPunctuality;
      const attendanceBonus = savedItem?.attendance_bonus !== undefined && savedItem?.attendance_bonus !== null
        ? Number(savedItem.attendance_bonus)
        : defaultAttendance;
      const performanceBonus = savedItem?.performance_bonus !== undefined && savedItem?.performance_bonus !== null
        ? Number(savedItem.performance_bonus)
        : 0;

      const absenceDeductions = calculateAbsenceDeduction(monthlySalary, unjustifiedAbsences);
      const delayDeductions = lateArrivals * 100;
      const imssDeduction = calculateIMSSWorkerShare(monthlySalary);

      const taxablePerceptions = baseSalaryPeriod + overtimePay + punctualityBonus + attendanceBonus + performanceBonus;
      const isrEstimated = calculateMexicanISR(taxablePerceptions);

      const totalPerceptions = taxablePerceptions;
      const totalDeductions = absenceDeductions + delayDeductions + imssDeduction + isrEstimated;
      const netPayEstimated = Math.max(0, totalPerceptions - totalDeductions);

      const bankName = emp.bank_name || "BBVA México";
      const clabe = emp.clabe_account || generateValidClabe(emp.id);

      payrollEmployees.push({
        id: savedItem?.id || `pay-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.full_name || "Colaborador",
        jobTitle: emp.job_title || "Puesto General",
        department: emp.department || "Operaciones",
        avatarUrl: emp.avatar_url,
        baseSalaryPeriod,
        daysWorked,
        overtimeHours,
        overtimePay,
        punctualityBonus,
        attendanceBonus,
        performanceBonus,
        unjustifiedAbsences,
        absenceDeductions,
        lateArrivals,
        delayDeductions,
        imssDeduction,
        isrEstimated,
        totalPerceptions,
        totalDeductions,
        netPayEstimated,
        bankAccount: {
          bankName,
          clabe,
        },
      });

      sumGross += totalPerceptions;
      sumOvertime += overtimePay;
      sumBonuses += (punctualityBonus + attendanceBonus + performanceBonus);
      sumDeductions += totalDeductions;
      sumNet += netPayEstimated;
    }

    const currentStatus = (savedPayroll?.status as "borrador" | "calculada" | "pagada") || "calculada";

    const summary: PayrollPeriodSummary = {
      periodId: savedPayroll?.id || `payroll-${periodInfo.startDate}`,
      periodName: periodInfo.periodName,
      periodType: periodInfo.periodType,
      startDate: periodInfo.startDate,
      endDate: periodInfo.endDate,
      payoutDate: periodInfo.payoutDate,
      status: currentStatus,
      totalGross: sumGross,
      totalOvertime: sumOvertime,
      totalBonuses: sumBonuses,
      totalDeductions: sumDeductions,
      totalNet: sumNet,
      employeesCount: payrollEmployees.length,
      employees: payrollEmployees,
    };

    return { summary, companyName };
  }

  /**
   * Ajusta y persiste los bonos de un colaborador en la pre-nómina
   */
  async adjustEmployeeBonuses(
    companyId: string,
    input: AdjustBonusesInput
  ): Promise<{ payrollId: string }> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const periodInfo = getFortnightPeriodInfo();
    const startDate = input.startDate || periodInfo.startDate;
    const endDate = input.endDate || periodInfo.endDate;

    let { data: payroll } = await this.supabase
      .from("company_payrolls")
      .select("id")
      .eq("company_id", companyId)
      .eq("start_date", startDate)
      .eq("end_date", endDate)
      .maybeSingle();

    if (!payroll) {
      const { data: newPayroll, error: createError } = await this.supabase
        .from("company_payrolls")
        .insert({
          company_id: companyId,
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
        throw new Error(createError?.message || "No se pudo inicializar la nómina.");
      }
      payroll = newPayroll;
    }

    const { data: employee, error: empErr } = await this.supabase
      .from("company_employees")
      .select("full_name, job_title, department, base_salary_monthly, bank_name, clabe_account")
      .eq("id", input.employeeId)
      .eq("company_id", companyId)
      .single();

    if (empErr || !employee) {
      throw new Error("Colaborador no encontrado o no pertenece a tu empresa.");
    }

    const monthly = Number(employee.base_salary_monthly) || 8500;
    const baseSalaryPeriod = Math.round(monthly / 2);

    const { error: itemError } = await this.supabase
      .from("company_payroll_items")
      .upsert(
        {
          payroll_id: payroll.id,
          company_id: companyId,
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
      throw new Error(itemError.message);
    }

    return { payrollId: payroll.id };
  }

  /**
   * Aprueba y procesa la dispersión formal de la nómina
   */
  async disperseCompanyPayroll(
    companyId: string,
    input: DispersePayrollInput
  ): Promise<{ payrollId: string }> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    let payrollId: string;
    const { data: existingPayroll } = await this.supabase
      .from("company_payrolls")
      .select("id")
      .eq("company_id", companyId)
      .eq("start_date", input.startDate)
      .eq("end_date", input.endDate)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    if (existingPayroll) {
      payrollId = existingPayroll.id;
      const { error: updateErr } = await this.supabase
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
        .eq("id", payrollId)
        .eq("company_id", companyId);

      if (updateErr) {
        throw new Error(updateErr.message);
      }
    } else {
      const { data: newPayroll, error: insertError } = await this.supabase
        .from("company_payrolls")
        .insert({
          company_id: companyId,
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
        throw new Error(insertError?.message || "Error al crear la orden de dispersión.");
      }
      payrollId = newPayroll.id;
    }

    const itemsPayload: PayrollItemInsert[] = input.employees.map((emp) => ({
      payroll_id: payrollId,
      company_id: companyId,
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

    const { error: upsertItemsError } = await this.supabase
      .from("company_payroll_items")
      .upsert(itemsPayload, { onConflict: "payroll_id,employee_id" });

    if (upsertItemsError) {
      throw new Error(upsertItemsError.message);
    }

    return { payrollId };
  }

  /**
   * Actualiza los datos de cuenta bancaria de un colaborador
   */
  async updateEmployeeBankDetails(
    companyId: string,
    input: UpdateEmployeeBankDetailsInput
  ): Promise<void> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const { error, count } = await this.supabase
      .from("company_employees")
      .update({
        bank_name: input.bankName.trim(),
        clabe_account: input.clabeAccount.trim(),
        updated_at: new Date().toISOString(),
      }, { count: "exact" })
      .eq("id", input.employeeId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(error.message);
    }

    if (count === 0) {
      throw new Error("Colaborador no encontrado o no pertenece a tu empresa.");
    }
  }

  /**
   * Cierra formalmente un periodo de nómina
   */
  async closePayrollPeriod(
    companyId: string,
    input: ClosePayrollPeriodInput
  ): Promise<PayrollRow> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const { data, error } = await this.supabase
      .from("company_payrolls")
      .update({
        status: "pagada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.payrollId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Nómina no encontrada o no autorizada para cierre.");
    }

    return data;
  }

  private buildEmptyPayrollResult(periodInfo: FortnightPeriodInfo): CompanyPayrollDataResult {
    return {
      companyName: "K'anPro Solutions",
      summary: {
        periodId: `payroll-${periodInfo.startDate}`,
        periodName: periodInfo.periodName,
        periodType: periodInfo.periodType,
        startDate: periodInfo.startDate,
        endDate: periodInfo.endDate,
        payoutDate: periodInfo.payoutDate,
        status: "borrador",
        totalGross: 0,
        totalOvertime: 0,
        totalBonuses: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeesCount: 0,
        employees: [],
      },
    };
  }
}

/**
 * Función helper de consulta de nómina inyectando el cliente Supabase
 */
export async function getCompanyPayrollData(
  supabase: SupabaseClient<Database>,
  companyId: string,
  refDate = new Date()
): Promise<CompanyPayrollDataResult> {
  const service = new CompanyPayrollService(supabase);
  return service.getCompanyPayrollData(companyId, refDate);
}
