import { createClient } from "@/lib/supabase/server";
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

export interface CompanyPayrollDataResult {
  summary: PayrollPeriodSummary;
  companyName: string;
}

/**
 * Obtiene la pre-nómina en tiempo real calculada con colaboradores reales de Supabase,
 * cruzando asistencias, horas extras e incidencias del periodo quincenal.
 */
export async function getCompanyPayrollData(
  refDate = new Date()
): Promise<CompanyPayrollDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const periodInfo: FortnightPeriodInfo = getFortnightPeriodInfo(refDate);

  if (!user) {
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

  // 1. Consultas en paralelo
  const [
    companyRes,
    employeesRes,
    savedPayrollRes,
    attendanceRes,
  ] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("id, company_name, legal_name, rfc")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
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
      .eq("company_id", user.id)
      .in("status", ["active", "onboarding"])
      .order("full_name", { ascending: true }),
    supabase
      .from("company_payrolls")
      .select(`
        id,
        status,
        dispersed_at,
        company_payroll_items (*)
      `)
      .eq("company_id", user.id)
      .eq("start_date", periodInfo.startDate)
      .eq("end_date", periodInfo.endDate)
      .maybeSingle(),
    supabase
      .from("company_attendance")
      .select("*")
      .eq("company_id", user.id)
      .gte("work_date", periodInfo.startDate)
      .lte("work_date", periodInfo.endDate),
  ]);

  const companyName = companyRes.data?.company_name || companyRes.data?.legal_name || "Mi Empresa";
  const activeEmployees = employeesRes.data || [];
  const attendanceRecords = attendanceRes.data || [];

  // Mapear asistencias por colaborador
  const attendanceByEmp = new Map<string, any[]>();
  attendanceRecords.forEach((att) => {
    const list = attendanceByEmp.get(att.employee_id) || [];
    list.push(att);
    attendanceByEmp.set(att.employee_id, list);
  });

  // Mapear items guardados previamente si existen
  const savedItemsMap = new Map<string, any>();
  const savedPayroll = savedPayrollRes.data;
  if (savedPayroll && Array.isArray(savedPayroll.company_payroll_items)) {
    savedPayroll.company_payroll_items.forEach((item: any) => {
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

    // Asistencias del periodo
    const empAtt = attendanceByEmp.get(emp.id) || [];
    const unjustifiedAbsences = empAtt.filter((a) => a.status === "falta_injustificada").length;
    const lateArrivals = empAtt.filter((a) => a.status === "retardo").length;

    // Horas extras autorizadas
    let overtimeHours = 0;
    let overtimePay = 0;
    empAtt.forEach((a) => {
      if (a.overtime_status === "autorizado" && Number(a.overtime_hours) > 0) {
        const hours = Number(a.overtime_hours);
        overtimeHours += hours;
        overtimePay += calculateOvertimePay(monthlySalary, hours, a.overtime_rate_type || "doble");
      }
    });

    const daysWorked = Math.max(0, 15 - unjustifiedAbsences);

    // Bonificaciones (usar guardadas si existen, o cálculo automático según asistencia)
    const defaultPunctuality = lateArrivals === 0 ? Math.round(baseSalaryPeriod * 0.05) : 0;
    const defaultAttendance = unjustifiedAbsences === 0 ? Math.round(baseSalaryPeriod * 0.05) : 0;

    const punctualityBonus = savedItem?.punctuality_bonus !== undefined
      ? Number(savedItem.punctuality_bonus)
      : defaultPunctuality;
    const attendanceBonus = savedItem?.attendance_bonus !== undefined
      ? Number(savedItem.attendance_bonus)
      : defaultAttendance;
    const performanceBonus = savedItem?.performance_bonus !== undefined
      ? Number(savedItem.performance_bonus)
      : 0;

    // Deducciones
    const absenceDeductions = calculateAbsenceDeduction(monthlySalary, unjustifiedAbsences);
    const delayDeductions = lateArrivals * 100; // Deducción estimada por retardos
    const imssDeduction = calculateIMSSWorkerShare(monthlySalary);

    // Base gravable para ISR
    const taxablePerceptions = baseSalaryPeriod + overtimePay + punctualityBonus + attendanceBonus + performanceBonus;
    const isrEstimated = calculateMexicanISR(taxablePerceptions);

    const totalPerceptions = taxablePerceptions;
    const totalDeductions = absenceDeductions + delayDeductions + imssDeduction + isrEstimated;
    const netPayEstimated = Math.max(0, totalPerceptions - totalDeductions);

    // Datos bancarios
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
