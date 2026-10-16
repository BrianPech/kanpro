import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureLiveSupabase,
  getAdminClient,
  createTestCompanyUser,
  createAuthenticatedClient,
  cleanupTestUsers,
  generateTestEmail,
} from "./helpers/test-client";
import { CompanyEmployeeService, CompanyContractService } from "@/modules/company/services/company-service";
import { CompanyPayrollService } from "@/modules/company/services/company-payroll";

describe("[REAL INTEGRATION] 07 - Company Contracts & Mexican Payroll Engine with Real PostgreSQL", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();

  let companyA: { id: string; email: string; companyName: string };
  let companyB: { id: string; email: string; companyName: string };

  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  let payrollServiceA: CompanyPayrollService;

  let employee1Id: string;
  let contract1Id: string;
  let contractFolio: string;
  let payrollId: string;

  const passwordA = "CompA-Pay-2026!";
  const passwordB = "CompB-Pay-2026!";

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Create two real companies
    companyA = await createTestCompanyUser({
      email: generateTestEmail("comp-pay-a"),
      password: passwordA,
      companyName: "Grupo Corporativo Gastronómico S.A.",
    });
    usersToCleanup.push(companyA.id);

    companyB = await createTestCompanyUser({
      email: generateTestEmail("comp-pay-b"),
      password: passwordB,
      companyName: "Operadora Rivierenses S.A.",
    });
    usersToCleanup.push(companyB.id);

    // 2. Authenticate
    const authA = await createAuthenticatedClient(companyA.email, passwordA);
    clientA = authA.client;

    const authB = await createAuthenticatedClient(companyB.email, passwordB);
    clientB = authB.client;

    payrollServiceA = new CompanyPayrollService(clientA);

    // 3. Register real employee for Company A
    const emp = await CompanyEmployeeService.createEmployee(clientA, companyA.id, {
      full_name: "Alejandro Morales Canché",
      job_title: "Chef Ejecutivo de Especialidades",
      department: "Alimentos y Bebidas",
      employee_code: "CHEF-001",
      email: generateTestEmail("chef-morales"),
      phone: "9983456789",
      work_schedule: "09:00 - 18:00",
      base_salary_monthly: 36000,
      payment_frequency: "quincenal",
      rfc: "MOCA900101XYZ",
      curp: "MOCA900101HQRRNS01",
      nss: "12345678901",
    });
    employee1Id = emp.id;
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  it("1. should generate a formal employment contract in PostgreSQL via CompanyContractService", async () => {
    const contractResult = await CompanyContractService.createContract(clientA, companyA.id, {
      employeeId: employee1Id,
      jobTitle: "Chef Ejecutivo de Especialidades",
      department: "Alimentos y Bebidas",
      contractType: "indeterminado",
      templateType: "indeterminado",
      startDate: "2026-10-01",
      salary: 36000,
      paymentFrequency: "quincenal",
      companySigned: false,
      employeeSigned: false,
      notes: "Contrato por tiempo indeterminado conforme a la Ley Federal del Trabajo.",
    });

    expect(contractResult.contractId).toBeDefined();
    expect(contractResult.folio).toBeDefined();
    expect(contractResult.folio).toMatch(/^KAN-CTR-/);

    contract1Id = contractResult.contractId;
    contractFolio = contractResult.folio;

    // Verify directly in PostgreSQL via Admin client
    const { data: dbContract } = await admin
      .from("company_contracts")
      .select("*")
      .eq("id", contract1Id)
      .single();

    expect(dbContract).not.toBeNull();
    expect(dbContract?.company_id).toBe(companyA.id);
    expect(dbContract?.employee_id).toBe(employee1Id);
    expect(dbContract?.salary).toBe(36000);
    expect(dbContract?.status).toBe("en_firma");
    expect(dbContract?.company_signed).toBe(false);
    expect(dbContract?.employee_signed).toBe(false);
  });

  it("2. should sign the contract digitally and transition status to 'vigente'", async () => {
    // Step A: Company representative signs
    await CompanyContractService.signContract(clientA, companyA.id, {
      contractId: contract1Id,
      signerRole: "representante_legal",
      signatureUrl: "https://kanpro.storage.local/signatures/comp-sig-01.png",
      isNowFullySigned: false,
    });

    let { data: step1 } = await admin
      .from("company_contracts")
      .select("company_signed, employee_signed, status")
      .eq("id", contract1Id)
      .single();

    expect(step1?.company_signed).toBe(true);
    expect(step1?.employee_signed).toBe(false);

    // Step B: Employee signs and contract becomes fully executed
    await CompanyContractService.signContract(clientA, companyA.id, {
      contractId: contract1Id,
      signerRole: "trabajador",
      signatureUrl: "https://kanpro.storage.local/signatures/emp-sig-01.png",
      isNowFullySigned: true,
    });

    let { data: step2 } = await admin
      .from("company_contracts")
      .select("company_signed, employee_signed, status, company_signature_url, employee_signature_url")
      .eq("id", contract1Id)
      .single();

    expect(step2?.company_signed).toBe(true);
    expect(step2?.employee_signed).toBe(true);
    expect(step2?.status).toBe("vigente");
    expect(step2?.company_signature_url).toContain("comp-sig-01.png");
    expect(step2?.employee_signature_url).toContain("emp-sig-01.png");
  });

  it("3. should calculate real fortnight Mexican payroll in real time via CompanyPayrollService", async () => {
    // Calculate payroll data for current reference date
    const refDate = new Date("2026-10-15T12:00:00Z");
    const result = await payrollServiceA.getCompanyPayrollData(companyA.id, refDate);

    expect(result).toBeDefined();
    expect(result.companyName).toBe(companyA.companyName);
    expect(result.summary.employeesCount).toBeGreaterThanOrEqual(1);

    const empPayrollItem = result.summary.employees.find((e) => e.employeeId === employee1Id);
    expect(empPayrollItem).toBeDefined();

    // Base salary monthly is 36,000 -> Fortnightly base is 18,000 MXN
    expect(empPayrollItem?.baseSalaryPeriod).toBe(18000);

    // Deductions calculated: IMSS worker share and ISR
    expect(empPayrollItem?.imssDeduction).toBeGreaterThan(0);
    expect(empPayrollItem?.isrEstimated).toBeGreaterThan(0);

    // Mathematical integrity check: Net Pay = Perceptions - Deductions
    const perceptions = empPayrollItem!.totalPerceptions;
    const deductions = empPayrollItem!.totalDeductions;
    const net = empPayrollItem!.netPayEstimated;

    expect(net).toBe(perceptions - deductions);
  });

  it("4. should persist employee bonuses and generate company_payroll_items in PostgreSQL", async () => {
    const adjustResult = await payrollServiceA.adjustEmployeeBonuses(companyA.id, {
      employeeId: employee1Id,
      punctualityBonus: 750,
      attendanceBonus: 750,
      performanceBonus: 1500,
      startDate: "2026-10-01",
      endDate: "2026-10-15",
    });

    expect(adjustResult.payrollId).toBeDefined();
    payrollId = adjustResult.payrollId;

    // Verify in PostgreSQL: company_payrolls and company_payroll_items
    const { data: dbPayroll } = await admin
      .from("company_payrolls")
      .select("*")
      .eq("id", payrollId)
      .single();

    expect(dbPayroll).not.toBeNull();
    expect(dbPayroll?.company_id).toBe(companyA.id);
    expect(dbPayroll?.start_date).toBe("2026-10-01");
    expect(dbPayroll?.end_date).toBe("2026-10-15");

    const { data: dbItems } = await admin
      .from("company_payroll_items")
      .select("*")
      .eq("payroll_id", payrollId)
      .eq("employee_id", employee1Id);

    expect(dbItems).toBeDefined();
    expect(dbItems!.length).toBe(1);

    const item = dbItems![0];
    expect(item.punctuality_bonus).toBe(750);
    expect(item.attendance_bonus).toBe(750);
    expect(item.performance_bonus).toBe(1500);
    expect(item.base_salary_period).toBe(18000);
  });

  it("5. should disperse the payroll period and record status 'pagada' in PostgreSQL", async () => {
    const disperseResult = await payrollServiceA.disperseCompanyPayroll(companyA.id, {
      startDate: "2026-10-01",
      endDate: "2026-10-15",
      payoutDate: "2026-10-15",
      periodName: "1ra Quincena Octubre 2026",
      periodType: "quincenal",
      totalGross: 21000,
      totalNet: 17500,
      totalDeductions: 3500,
      totalBonuses: 3000,
      totalOvertime: 0,
      employees: [
        {
          employeeId: employee1Id,
          employeeName: "Alejandro Morales Canché",
          jobTitle: "Chef Ejecutivo de Especialidades",
          department: "Alimentos y Bebidas",
          baseSalaryPeriod: 18000,
          daysWorked: 15,
          overtimeHours: 0,
          overtimePay: 0,
          punctualityBonus: 750,
          attendanceBonus: 750,
          performanceBonus: 1500,
          unjustifiedAbsences: 0,
          absenceDeductions: 0,
          lateArrivals: 0,
          delayDeductions: 0,
          imssDeduction: 600,
          isrEstimated: 2900,
          totalPerceptions: 21000,
          totalDeductions: 3500,
          netPayEstimated: 17500,
        },
      ],
    });

    expect(disperseResult.payrollId).toBe(payrollId);

    // Verify status in PostgreSQL
    const { data: disbursedDb } = await admin
      .from("company_payrolls")
      .select("status, dispersed_at, total_gross, total_net")
      .eq("id", payrollId)
      .single();

    expect(disbursedDb?.status).toBe("pagada");
    expect(disbursedDb?.dispersed_at).not.toBeNull();
    expect(disbursedDb?.total_gross).toBe(21000);
    expect(disbursedDb?.total_net).toBe(17500);
  });

  it("6. should enforce strict PostgreSQL RLS isolation on contracts and payroll against Company B", async () => {
    // Company B attempts to read Company A's contracts
    const { data: contractsB, error: conErrB } = await clientB
      .from("company_contracts")
      .select("*")
      .eq("id", contract1Id);

    expect(conErrB).toBeNull();
    expect(contractsB).toEqual([]);

    // Company B attempts to read Company A's payroll
    const { data: payrollB, error: payErrB } = await clientB
      .from("company_payrolls")
      .select("*")
      .eq("id", payrollId);

    expect(payErrB).toBeNull();
    expect(payrollB).toEqual([]);

    // Company B attempts to read Company A's payroll items
    const { data: itemsB, error: itemsErrB } = await clientB
      .from("company_payroll_items")
      .select("*")
      .eq("payroll_id", payrollId);

    expect(itemsErrB).toBeNull();
    expect(itemsB).toEqual([]);

    // Company B attempts an unauthorized UPDATE on Company A's contract
    const { data: hackedCon } = await clientB
      .from("company_contracts")
      .update({ salary: 1 })
      .eq("id", contract1Id)
      .select();

    expect(hackedCon).toEqual([]);

    // Company B attempts an unauthorized UPDATE on Company A's payroll
    const { data: hackedPay } = await clientB
      .from("company_payrolls")
      .update({ total_net: 999999 })
      .eq("id", payrollId)
      .select();

    expect(hackedPay).toEqual([]);

    // Verify contract and payroll remain unchanged in PostgreSQL
    const { data: checkCon } = await admin
      .from("company_contracts")
      .select("salary")
      .eq("id", contract1Id)
      .single();
    expect(checkCon?.salary).toBe(36000);

    const { data: checkPay } = await admin
      .from("company_payrolls")
      .select("total_net")
      .eq("id", payrollId)
      .single();
    expect(checkPay?.total_net).toBe(17500);
  });
});
