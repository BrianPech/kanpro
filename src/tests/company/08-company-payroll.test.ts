import { describe, test, expect, vi } from "vitest";
import {
  adjustBonusesSchema,
  dispersePayrollSchema,
  updateEmployeeBankDetailsSchema,
  closePayrollPeriodSchema,
} from "@/modules/company/schemas/payroll.schema";
import {
  MexicanCLABE,
  MexicanPayrollEngine,
  generateValidClabe,
  calculateMexicanISR,
  calculateIMSSWorkerShare,
  calculateOvertimePay,
  calculateAbsenceDeduction,
} from "@/modules/company/utils/payroll-calculator";
import {
  BankLayoutFactory,
  generateBankDispersalLayout,
} from "@/modules/company/utils/bank-layout-generator";
import {
  CompanyPayrollService,
  type PayrollRow,
  type PayrollItemRow,
} from "@/modules/company/services/company-payroll";
import type { PayrollEmployeeItem } from "@/modules/company/types/payroll";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Fase 17: Módulo de Nómina - Patrón Schema -> Handler -> Service y Motores de Dominio", () => {
  describe("1. Validación de Esquemas Zod (payroll.schema.ts)", () => {
    test("adjustBonusesSchema: Acepta bonos no negativos y rechaza valores negativos", () => {
      const valid = {
        employeeId: "emp-1",
        punctualityBonus: 500,
        attendanceBonus: 500,
        performanceBonus: 1000,
        startDate: "2026-10-01",
        endDate: "2026-10-15",
      };
      expect(adjustBonusesSchema.safeParse(valid).success).toBe(true);

      const negative = {
        ...valid,
        punctualityBonus: -100,
      };
      expect(adjustBonusesSchema.safeParse(negative).success).toBe(false);
    });

    test("dispersePayrollSchema: Valida desglose completo y rechaza nómina sin colaboradores", () => {
      const validEmployee: PayrollEmployeeItem = {
        id: "pay-emp-1",
        employeeId: "emp-1",
        employeeName: "Juan Pérez",
        jobTitle: "Recepcionista",
        department: "Recepción",
        avatarUrl: null,
        baseSalaryPeriod: 6000,
        daysWorked: 15,
        overtimeHours: 2,
        overtimePay: 150,
        punctualityBonus: 300,
        attendanceBonus: 300,
        performanceBonus: 0,
        unjustifiedAbsences: 0,
        absenceDeductions: 0,
        lateArrivals: 0,
        delayDeductions: 0,
        imssDeduction: 160,
        isrEstimated: 450,
        totalPerceptions: 6750,
        totalDeductions: 610,
        netPayEstimated: 6140,
        bankAccount: {
          bankName: "BBVA México",
          clabe: "012180001234567897",
        },
      };

      const validPayload = {
        periodName: "1ª Quincena Octubre 2026",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        payoutDate: "2026-10-15",
        totalGross: 6750,
        totalOvertime: 150,
        totalBonuses: 600,
        totalDeductions: 610,
        totalNet: 6140,
        employees: [validEmployee],
      };

      expect(dispersePayrollSchema.safeParse(validPayload).success).toBe(true);

      const emptyEmployees = {
        ...validPayload,
        employees: [],
      };
      expect(dispersePayrollSchema.safeParse(emptyEmployees).success).toBe(false);
    });

    test("updateEmployeeBankDetailsSchema: Valida CLABE de 18 dígitos y rechaza longitudes incorrectas", () => {
      const valid = {
        employeeId: "emp-1",
        bankName: "Banorte",
        clabeAccount: "072180001234567895",
      };
      expect(updateEmployeeBankDetailsSchema.safeParse(valid).success).toBe(true);

      const shortClabe = {
        ...valid,
        clabeAccount: "072180001234",
      };
      expect(updateEmployeeBankDetailsSchema.safeParse(shortClabe).success).toBe(false);

      const alphaClabe = {
        ...valid,
        clabeAccount: "07218000123456789A",
      };
      expect(updateEmployeeBankDetailsSchema.safeParse(alphaClabe).success).toBe(false);
    });

    test("closePayrollPeriodSchema: Valida ID no vacío", () => {
      expect(closePayrollPeriodSchema.safeParse({ payrollId: "pay-1" }).success).toBe(true);
      expect(closePayrollPeriodSchema.safeParse({ payrollId: "" }).success).toBe(false);
    });
  });

  describe("2. Motores de Dominio y Patrones de Diseño (POO, Strategy & Factory)", () => {
    test("MexicanCLABE Value Object: Valida, extrae componentes y verifica dígito de control", () => {
      const validClabeStr = generateValidClabe("colaborador-123", "012");
      expect(validClabeStr.length).toBe(18);

      const clabeObj = new MexicanCLABE(validClabeStr);
      expect(clabeObj.getValue()).toBe(validClabeStr);
      expect(clabeObj.getBankCode()).toBe("012");
      expect(clabeObj.getPlaza()).toBe("180");
      expect(clabeObj.getAccountNumber().length).toBe(11);
      expect(clabeObj.getCheckDigit().length).toBe(1);

      // CLABE inválida con dígito incorrecto debe lanzar error en construcción
      const badClabe = validClabeStr.slice(0, 17) + (validClabeStr.charAt(17) === "9" ? "0" : "9");
      expect(() => new MexicanCLABE(badClabe)).toThrow("CLABE interbancaria inválida");
    });

    test("MexicanPayrollEngine: Encapsula cálculo de ISR, IMSS, horas extras y ausencias", () => {
      const engine = new MexicanPayrollEngine();

      // Cálculo de periodo
      const period = engine.getFortnightPeriod(new Date("2026-10-05"));
      expect(period.periodType).toBe("quincenal");
      expect(period.startDate).toBe("2026-10-01");
      expect(period.endDate).toBe("2026-10-15");

      // Retención ISR Quincenal Art. 96
      const isr = engine.calculateISR(10000);
      expect(isr).toBeGreaterThan(0);
      expect(isr).toBe(calculateMexicanISR(10000));

      // Cuota obrera IMSS
      const imss = engine.calculateIMSS(15000);
      expect(imss).toBeGreaterThan(0);
      expect(imss).toBe(calculateIMSSWorkerShare(15000));

      // Horas extras dobles y triples
      const otDouble = engine.calculateOvertime(12000, 4, "doble");
      const otTriple = engine.calculateOvertime(12000, 4, "triple");
      expect(otTriple).toBe(Math.round(otDouble * 1.5));
      expect(otDouble).toBe(calculateOvertimePay(12000, 4, "doble"));

      // Deducción por faltas injustificadas
      const absenceDeduction = engine.calculateAbsence(12000, 2);
      expect(absenceDeduction).toBe(calculateAbsenceDeduction(12000, 2));
    });

    test("BankLayoutFactory y Strategies: Genera layouts BBVA, Banorte, STP y Universal CSV", () => {
      const sampleEmployees: PayrollEmployeeItem[] = [
        {
          id: "p1",
          employeeId: "e1",
          employeeName: "Ana López",
          jobTitle: "Cajera",
          department: "Finanzas",
          baseSalaryPeriod: 5000,
          daysWorked: 15,
          overtimeHours: 0,
          overtimePay: 0,
          punctualityBonus: 250,
          attendanceBonus: 250,
          performanceBonus: 0,
          unjustifiedAbsences: 0,
          absenceDeductions: 0,
          lateArrivals: 0,
          delayDeductions: 0,
          imssDeduction: 120,
          isrEstimated: 300,
          totalPerceptions: 5500,
          totalDeductions: 420,
          netPayEstimated: 5080,
          bankAccount: {
            bankName: "BBVA México",
            clabe: "012180001234567897",
          },
        },
      ];

      // BBVA Strategy
      const bbvaLayout = generateBankDispersalLayout(sampleEmployees, "1ª Qna Octubre 2026", "bbva");
      expect(bbvaLayout.fileName).toContain("BBVA");
      expect(bbvaLayout.content).toContain("40\t012180001234567897");

      // Banorte Strategy
      const banorteLayout = generateBankDispersalLayout(sampleEmployees, "1ª Qna Octubre 2026", "banorte");
      expect(banorteLayout.fileName).toContain("BANORTE");
      expect(banorteLayout.content).toContain("00001|012180001234567897|5080.00|01|NOMINA|ANA LÓPEZ");

      // STP Strategy
      const stpLayout = generateBankDispersalLayout(sampleEmployees, "1ª Qna Octubre 2026", "stp", "KAN180101XYZ");
      expect(stpLayout.fileName).toContain("STP");
      expect(stpLayout.content).toContain('"90646","012180001234567897","Ana López",5080.00');

      // Universal CSV Strategy
      const csvLayout = generateBankDispersalLayout(sampleEmployees, "1ª Qna Octubre 2026", "csv_universal");
      expect(csvLayout.fileName).toContain("DISPERSION_BANCARIA");
      expect(csvLayout.content.startsWith("\uFEFF")).toBe(true);
      expect(csvLayout.content).toContain('"Ana López"');
    });

    test("generateBankDispersalLayout: Excluye colaboradores sin cuenta CLABE válida e impide dispersión sin cuentas", () => {
      const validEmployee: PayrollEmployeeItem = {
        id: "p1",
        employeeId: "e1",
        employeeName: "Ana López",
        jobTitle: "Cajera",
        department: "Finanzas",
        baseSalaryPeriod: 5000,
        daysWorked: 15,
        overtimeHours: 0,
        overtimePay: 0,
        punctualityBonus: 250,
        attendanceBonus: 250,
        performanceBonus: 0,
        unjustifiedAbsences: 0,
        absenceDeductions: 0,
        lateArrivals: 0,
        delayDeductions: 0,
        imssDeduction: 120,
        isrEstimated: 300,
        totalPerceptions: 5500,
        totalDeductions: 420,
        netPayEstimated: 5080,
        bankAccount: {
          bankName: "BBVA México",
          clabe: "012180001234567897",
        },
      };

      const invalidEmployee: PayrollEmployeeItem = {
        ...validEmployee,
        id: "emp-no-bank",
        employeeName: "Juan Sin Banco",
        bankAccount: undefined,
      };

      // Si mezclamos uno válido y uno inválido, solo incluye el válido
      const mixedResult = generateBankDispersalLayout(
        [validEmployee, invalidEmployee],
        "1ª Qna Octubre 2026",
        "bbva"
      );
      expect(mixedResult.includedCount).toBe(1);
      expect(mixedResult.skippedCount).toBe(1);
      expect(mixedResult.content).toContain("ANA LÓPEZ");
      expect(mixedResult.content).not.toContain("JUAN SIN BANCO");

      // Si ningún colaborador tiene CLABE válida, lanza error estricto
      expect(() =>
        generateBankDispersalLayout([invalidEmployee], "1ª Qna Octubre 2026", "bbva")
      ).toThrow("No hay colaboradores con cuenta CLABE interbancaria válida");
    });
  });

  describe("3. CompanyPayrollService (Lógica de Negocio y Aislamiento Multi-tenant)", () => {
    function createMockSupabaseForPayroll(initialState?: {
      employees?: Array<{
        id: string;
        company_id: string;
        full_name: string;
        job_title?: string | null;
        department?: string | null;
        base_salary_monthly?: number | null;
        payment_frequency?: string | null;
        status?: string;
        bank_name?: string | null;
        clabe_account?: string | null;
      }>;
      payrolls?: PayrollRow[];
      payrollItems?: PayrollItemRow[];
    }) {
      const employees = [...(initialState?.employees || [])];
      const payrolls = [...(initialState?.payrolls || [])];
      const payrollItems = [...(initialState?.payrollItems || [])];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((field: string, val: string) => ({
                  maybeSingle: vi.fn(async () => {
                    return { data: { id: val, company_name: "Hoteles Caribe S.A. de C.V." }, error: null };
                  }),
                })),
              })),
            };
          }

          if (table === "company_employees") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  in: vi.fn(() => ({
                    order: vi.fn(async () => {
                      const found = employees.filter(
                        (e) => (e as Record<string, unknown>)[fieldA] === valA
                      );
                      return { data: found, error: null };
                    }),
                  })),
                  single: vi.fn(async () => {
                    const found = employees.find(
                      (e) => (e as Record<string, unknown>)[fieldA] === valA
                    );
                    return found ? { data: found, error: null } : { data: null, error: { message: "Not found" } };
                  }),
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    single: vi.fn(async () => {
                      const found = employees.find(
                        (e) =>
                          (e as Record<string, unknown>)[fieldA] === valA &&
                          (e as Record<string, unknown>)[fieldB] === valB
                      );
                      return found ? { data: found, error: null } : { data: null, error: { message: "Not found" } };
                    }),
                  })),
                })),
              })),
              update: vi.fn((updateData: Record<string, unknown>, opts?: { count?: string }) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = employees.findIndex(
                      (e) =>
                        (e as Record<string, unknown>)[fieldA] === valA &&
                        (e as Record<string, unknown>)[fieldB] === valB
                    );
                    if (idx === -1) return { error: null, count: 0 };
                    employees[idx] = { ...employees[idx], ...updateData };
                    return { error: null, count: 1 };
                  }),
                })),
              })),
            };
          }

          if (table === "company_attendance") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    lte: vi.fn(async () => {
                      return { data: [], error: null };
                    }),
                  })),
                })),
              })),
            };
          }

          if (table === "company_payrolls") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    maybeSingle: vi.fn(async () => {
                      const found = payrolls.find(
                        (p) =>
                          (p as Record<string, unknown>)[fieldA] === valA &&
                          (p as Record<string, unknown>)[fieldB] === valB
                      );
                      return { data: found || null, error: null };
                    }),
                    eq: vi.fn((fieldC: string, valC: string) => ({
                      maybeSingle: vi.fn(async () => {
                        const found = payrolls.find(
                          (p) =>
                            (p as Record<string, unknown>)[fieldA] === valA &&
                            (p as Record<string, unknown>)[fieldB] === valB &&
                            (p as Record<string, unknown>)[fieldC] === valC
                        );
                        return { data: found || null, error: null };
                      }),
                    })),
                  })),
                })),
              })),
              insert: vi.fn((payload: Database["public"]["Tables"]["company_payrolls"]["Insert"]) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const row: PayrollRow = {
                      id: `pay-${Date.now()}`,
                      company_id: payload.company_id,
                      period_name: payload.period_name,
                      period_type: payload.period_type || "quincenal",
                      start_date: payload.start_date,
                      end_date: payload.end_date,
                      payout_date: payload.payout_date,
                      status: payload.status || "borrador",
                      dispersed_at: payload.dispersed_at || null,
                      timbrada_at: payload.timbrada_at || null,
                      total_gross: payload.total_gross || 0,
                      total_overtime: payload.total_overtime || 0,
                      total_bonuses: payload.total_bonuses || 0,
                      total_deductions: payload.total_deductions || 0,
                      total_net: payload.total_net || 0,
                      employees_count: payload.employees_count || 0,
                      notes: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
                    payrolls.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              update: vi.fn((updateData: Database["public"]["Tables"]["company_payrolls"]["Update"]) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                      single: vi.fn(async () => {
                        const idx = payrolls.findIndex(
                          (p) => (p as Record<string, unknown>)[fieldA] === valA
                        );
                        if (idx === -1) return { data: null, error: { message: "Not found" } };
                        payrolls[idx] = { ...payrolls[idx], ...updateData };
                        return { data: payrolls[idx], error: null };
                      }),
                    })),
                  })),
                })),
              })),
            };
          }

          if (table === "company_payroll_items") {
            return {
              upsert: vi.fn(async (payload: unknown) => {
                const items = Array.isArray(payload) ? payload : [payload];
                items.forEach((item) => {
                  const idx = payrollItems.findIndex(
                    (pi) =>
                      pi.payroll_id === item.payroll_id && pi.employee_id === item.employee_id
                  );
                  if (idx >= 0) {
                    payrollItems[idx] = { ...payrollItems[idx], ...item };
                  } else {
                    payrollItems.push(item as PayrollItemRow);
                  }
                });
                return { error: null };
              }),
            };
          }

          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, payrolls, payrollItems, employees };
    }

    test("getCompanyPayrollData: Genera pre-nómina con colaboradores y totales", async () => {
      const { client } = createMockSupabaseForPayroll({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-A",
            full_name: "Rosa Flores",
            base_salary_monthly: 12000,
            job_title: "Supervisora",
            department: "Operaciones",
            payment_frequency: "quincenal",
            status: "active",
          },
        ],
      });

      const service = new CompanyPayrollService(client);
      const result = await service.getCompanyPayrollData("comp-A", new Date("2026-10-05"));

      expect(result.companyName).toBe("Hoteles Caribe S.A. de C.V.");
      expect(result.summary.employeesCount).toBe(1);
      expect(result.summary.employees[0].employeeName).toBe("Rosa Flores");
      expect(result.summary.employees[0].baseSalaryPeriod).toBe(6000);
      expect(result.summary.totalNet).toBeGreaterThan(0);
    });

    test("adjustEmployeeBonuses: Ajusta bonos y rechaza empleados de otra empresa (Multi-tenant check)", async () => {
      const { client, payrollItems } = createMockSupabaseForPayroll({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-A",
            full_name: "Rosa Flores",
            base_salary_monthly: 12000,
          },
        ],
      });

      const service = new CompanyPayrollService(client);

      const res = await service.adjustEmployeeBonuses("comp-A", {
        employeeId: "emp-1",
        punctualityBonus: 500,
        attendanceBonus: 500,
        performanceBonus: 1000,
        startDate: "2026-10-01",
        endDate: "2026-10-15",
      });

      expect(res.payrollId).toBeDefined();
      expect(payrollItems.length).toBe(1);
      expect(payrollItems[0].performance_bonus).toBe(1000);

      // Empresa B intenta ajustar bonos de colaborador de Empresa A
      await expect(
        service.adjustEmployeeBonuses("comp-B", {
          employeeId: "emp-1",
          punctualityBonus: 500,
          attendanceBonus: 500,
          performanceBonus: 1000,
        })
      ).rejects.toThrow("Colaborador no encontrado o no pertenece a tu empresa.");
    });

    test("disperseCompanyPayroll: Marca nómina como pagada y guarda desglose de dispersión", async () => {
      const { client, payrolls, payrollItems } = createMockSupabaseForPayroll();
      const service = new CompanyPayrollService(client);

      const employeeItem: PayrollEmployeeItem = {
        id: "pay-1",
        employeeId: "emp-1",
        employeeName: "Carlos Vega",
        jobTitle: "Recepcionista",
        department: "Recepción",
        baseSalaryPeriod: 5000,
        daysWorked: 15,
        overtimeHours: 0,
        overtimePay: 0,
        punctualityBonus: 250,
        attendanceBonus: 250,
        performanceBonus: 0,
        unjustifiedAbsences: 0,
        absenceDeductions: 0,
        lateArrivals: 0,
        delayDeductions: 0,
        imssDeduction: 120,
        isrEstimated: 300,
        totalPerceptions: 5500,
        totalDeductions: 420,
        netPayEstimated: 5080,
        bankAccount: {
          bankName: "BBVA",
          clabe: "012180001234567897",
        },
      };

      const res = await service.disperseCompanyPayroll("comp-A", {
        periodName: "1ª Qna Octubre 2026",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        payoutDate: "2026-10-15",
        totalGross: 5500,
        totalOvertime: 0,
        totalBonuses: 500,
        totalDeductions: 420,
        totalNet: 5080,
        employees: [employeeItem],
      });

      expect(res.payrollId).toBeDefined();
      expect(payrolls.length).toBe(1);
      expect(payrolls[0].status).toBe("pagada");
      expect(payrolls[0].total_net).toBe(5080);
      expect(payrollItems.length).toBe(1);
    });

    test("updateEmployeeBankDetails: Actualiza cuenta CLABE y rechaza colaboradores de otra empresa", async () => {
      const { client, employees } = createMockSupabaseForPayroll({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-A",
            full_name: "Carlos Vega",
            bank_name: null,
            clabe_account: null,
          },
        ],
      });

      const service = new CompanyPayrollService(client);

      // Empresa B intenta modificar empleado de Empresa A (Multi-tenant check)
      await expect(
        service.updateEmployeeBankDetails("comp-B", {
          employeeId: "emp-1",
          bankName: "Banorte",
          clabeAccount: "072180001234567895",
        })
      ).rejects.toThrow("Colaborador no encontrado o no pertenece a tu empresa.");

      // Empresa A actualiza exitosamente
      await service.updateEmployeeBankDetails("comp-A", {
        employeeId: "emp-1",
        bankName: "Banorte",
        clabeAccount: "072180001234567895",
      });

      expect(employees[0].bank_name).toBe("Banorte");
      expect(employees[0].clabe_account).toBe("072180001234567895");
    });

    test("Cálculo con sueldo $0 no aplica fallback artificial de $8,500", async () => {
      expect(calculateIMSSWorkerShare(0)).toBe(0);
      expect(calculateMexicanISR(0)).toBe(0);
      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "comp-zero", company_name: "Empresa Cero", legal_name: null, rfc: null },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "company_employees") {
            return {
              select: () => ({
                eq: () => ({
                  in: () => ({
                    order: async () => ({
                      data: [
                        {
                          id: "emp-zero",
                          employee_id: null,
                          full_name: "Empleado Sin Sueldo",
                          job_title: "Ayudante",
                          department: "Operaciones",
                          avatar_url: null,
                          base_salary_monthly: 0,
                          payment_frequency: "quincenal",
                          status: "active",
                          rfc: null,
                          curp: null,
                          bank_name: null,
                          clabe_account: null,
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "company_payrolls") {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
                  }),
                }),
              }),
            };
          }
          if (table === "company_attendance") {
            return {
              select: () => ({
                eq: () => ({
                  gte: () => ({
                    lte: async () => ({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const service = new CompanyPayrollService(client);
      const result = await service.getCompanyPayrollData("comp-zero");
      expect(result.summary.employees[0]?.baseSalaryPeriod).toBe(0);
      expect(result.summary.employees[0]?.netPayEstimated).toBe(0);
    });
  });
});
