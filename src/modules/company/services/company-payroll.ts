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
  FortnightPeriodInfo,
} from "../utils/payroll-calculator";
import type {
  AdjustBonusesInput,
  DispersePayrollInput,
  UpdateEmployeeBankDetailsInput,
  ClosePayrollPeriodInput,
  StampPayrollPeriodInput,
  StampPayrollItemInput,
} from "../schemas/payroll.schema";
import { PacStampingService } from "./pac-stamping-service";

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
          timbrada_at,
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

      const clabeAccount = emp.clabe_account?.trim();
      const hasValidClabe = Boolean(clabeAccount && /^\d{18}$/.test(clabeAccount));
      const bankName = hasValidClabe ? (emp.bank_name?.trim() || "Banco Registrado") : undefined;
      const bankAccount = hasValidClabe && bankName && clabeAccount
        ? { bankName, clabe: clabeAccount }
        : undefined;

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
        bankAccount,
        hasValidBankDetails: hasValidClabe,
        cfdi: savedItem?.cfdi_uuid
          ? {
              uuid: savedItem.cfdi_uuid,
              status: (savedItem.cfdi_status as "pendiente" | "timbrado" | "error" | "cancelado") || "timbrado",
              xml: savedItem.cfdi_xml || undefined,
              stampDate: savedItem.cfdi_stamp_date || undefined,
              satSeal: savedItem.cfdi_sat_seal || undefined,
              pacRfc: savedItem.cfdi_pac_rfc || undefined,
              qrCode: savedItem.cfdi_qr_code || undefined,
            }
          : undefined,
      });

      sumGross += totalPerceptions;
      sumOvertime += overtimePay;
      sumBonuses += (punctualityBonus + attendanceBonus + performanceBonus);
      sumDeductions += totalDeductions;
      sumNet += netPayEstimated;
    }

    const currentStatus = (savedPayroll?.status as "borrador" | "calculada" | "dispersada" | "pagada" | "timbrada") || "calculada";

    const summary: PayrollPeriodSummary = {
      periodId: savedPayroll?.id || `payroll-${periodInfo.startDate}`,
      periodName: periodInfo.periodName,
      periodType: periodInfo.periodType,
      startDate: periodInfo.startDate,
      endDate: periodInfo.endDate,
      payoutDate: periodInfo.payoutDate,
      status: currentStatus,
      timbradaAt: savedPayroll?.timbrada_at || null,
      timbradosCount: payrollEmployees.filter((e) => e.cfdi?.status === "timbrado").length,
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
          employees_count: input.employees?.length ?? 1,
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

  /**
   * Timbra fiscalmente todos los recibos de una nómina quincenal mediante PAC (SAT CFDI 4.0)
   */
  async stampPayrollPeriod(
    companyId: string,
    input: StampPayrollPeriodInput
  ): Promise<{ stampedCount: number; payrollId: string }> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    // 1. Obtener datos de la empresa y la nómina
    const [companyRes, payrollRes, itemsRes] = await Promise.all([
      this.supabase
        .from("company_profiles")
        .select("id, company_name, legal_name, rfc, fiscal_address")
        .eq("id", companyId)
        .single(),
      this.supabase
        .from("company_payrolls")
        .select("id, start_date, end_date, payout_date, period_name, status")
        .eq("id", input.payrollId)
        .eq("company_id", companyId)
        .single(),
      this.supabase
        .from("company_payroll_items")
        .select("*")
        .eq("payroll_id", input.payrollId)
        .eq("company_id", companyId),
    ]);

    if (companyRes.error || !companyRes.data) {
      throw new Error("Perfil de empresa fiscal no encontrado.");
    }
    if (payrollRes.error || !payrollRes.data) {
      throw new Error("Periodo de nómina no encontrado.");
    }

    const company = companyRes.data;
    const payroll = payrollRes.data;
    const items = itemsRes.data || [];

    if (items.length === 0) {
      throw new Error("No hay recibos de colaboradores para timbrar en este periodo.");
    }

    // 2. Extraer metadatos fiscales de colaboradores (RFC, CURP, NSS)
    const empIds = items.map((it) => it.employee_id);
    const { data: employeesData } = await this.supabase
      .from("company_employees")
      .select("id, rfc, curp, bank_name, clabe_account")
      .in("id", empIds);

    const empMetaMap = new Map((employeesData || []).map((e) => [e.id, e]));

    let stampedCount = 0;
    const nowIso = new Date().toISOString();

    // 3. Timbrar cada recibo individual mediante PAC
    for (const item of items) {
      const empMeta = empMetaMap.get(item.employee_id);
      const rfcReceptor = empMeta?.rfc?.trim() || "XAXX010101000";

      const stampResult = await PacStampingService.stampPayrollReceipt({
        folio: item.id.substring(0, 8).toUpperCase(),
        serie: "NOM",
        fechaEmision: nowIso.replace(/\.\d{3}Z$/, ""),
        fechaPago: payroll.payout_date,
        fechaInicioPeriodo: payroll.start_date,
        fechaFinPeriodo: payroll.end_date,
        emisor: {
          rfc: company.rfc?.trim() || "KAN180101XYZ",
          nombre: company.legal_name || company.company_name || "EMPRESA PATRONAL",
          regimenFiscal: "601",
          lugarExpedicion: (company.fiscal_address?.match(/\b\d{5}\b/) || ["77500"])[0],
        },
        receptor: {
          rfc: rfcReceptor,
          curp: empMeta?.curp || undefined,
          nombre: item.employee_name,
          codigoPostal: "77500",
          regimenFiscal: "605",
          numEmpleado: item.employee_id.substring(0, 6),
          departamento: item.department || "Operaciones",
          puesto: item.job_title || "General",
          fechaInicioRelaboral: payroll.start_date,
          banco: item.bank_name || undefined,
          clabe: item.clabe || empMeta?.clabe_account || undefined,
        },
        conceptos: {
          diasTrabajados: Number(item.days_worked) || 15,
          sueldoBasePeriodo: Number(item.base_salary_period),
          horasExtras: Number(item.overtime_hours),
          importeHorasExtras: Number(item.overtime_pay),
          bonoPuntualidad: Number(item.punctuality_bonus),
          bonoAsistencia: Number(item.attendance_bonus),
          bonoDesempeno: Number(item.performance_bonus),
          descuentoFaltas: Number(item.absence_deductions),
          descuentoRetardos: Number(item.delay_deductions),
          retencionImss: Number(item.imss_deduction),
          retencionIsr: Number(item.isr_estimated),
          totalPercepciones: Number(item.total_perceptions),
          totalDeducciones: Number(item.total_deductions),
          netoAPagar: Number(item.net_pay),
        },
      });

      // Actualizar recibo con timbre SAT
      await this.supabase
        .from("company_payroll_items")
        .update({
          cfdi_uuid: stampResult.uuid,
          cfdi_status: "timbrado",
          cfdi_xml: stampResult.xml,
          cfdi_stamp_date: stampResult.stampDate,
          cfdi_sat_seal: stampResult.satSeal,
          cfdi_pac_rfc: stampResult.pacRfc,
          cfdi_qr_code: stampResult.qrCode,
          updated_at: nowIso,
        })
        .eq("id", item.id)
        .eq("company_id", companyId);

      stampedCount++;
    }

    // 4. Actualizar estado de la nómina a 'timbrada'
    await this.supabase
      .from("company_payrolls")
      .update({
        status: "timbrada",
        timbrada_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", input.payrollId)
      .eq("company_id", companyId);

    return { stampedCount, payrollId: input.payrollId };
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
