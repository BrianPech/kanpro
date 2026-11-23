import { beforeEach, describe, expect, test, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  BUSINESS_TIME_ZONE,
  fromMonthlyEquivalentSalary,
  getMexicoDateISO,
} from "@/lib/formatters";
import { getEmployeeDossierById } from "@/modules/company/services/company-dossier";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { getCompanyReportsData } from "@/modules/company/services/company-reports";
import { CandidateLeavesService } from "@/modules/candidate/services/candidate-leaves";
import { CompanyWorkRulesPanel } from "@/modules/company/components/settings/company-work-rules-panel";
import { IncidentsView } from "@/modules/company/components/incidents-view";
import { EmployeeDossierView } from "@/modules/company/components/dossier/employee-dossier-view";
import { resolvePayrollPeriodWithCutoff } from "@/modules/company/strategies/payroll-period-bonuses.engine";

const mockState = vi.hoisted(() => ({
  supabase: null as unknown as SupabaseClient<Database>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockState.supabase),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard/company",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/modules/company/actions/settings", () => ({
  updatePayrollImpactConfigAction: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/modules/company/actions/dossier", () => ({
  requestDossierEmployeeCorrectionAction: vi.fn(),
  uploadDossierEmployeeDocumentAction: vi.fn(),
  updateEmployeeDossierProfileAction: vi.fn(),
}));

vi.mock("@/modules/company/utils/dossier-exporter", () => ({
  exportEmployeeDossierPdf: vi.fn(),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  TabsList: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  TabsTrigger: ({ children }: { children: React.ReactNode }) => React.createElement("button", null, children),
  TabsContent: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

interface ChainResult {
  data: unknown;
  error: null;
  count?: number;
}

function makeChain(rows: unknown[], singleRow: unknown = null) {
  const resultList: ChainResult = { data: rows, error: null, count: rows.length };
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    in: () => chain,
    or: () => chain,
    gte: () => chain,
    lte: () => chain,
    not: () => chain,
    is: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: singleRow, error: null }),
    single: async () => ({ data: singleRow, error: null }),
    then: (resolve: (val: ChainResult) => void) => resolve(resultList),
  };
  return chain;
}

function yearsAgoISO(years: number): string {
  const [yStr, mStr, dStr] = getMexicoDateISO().split("-");
  const y = Number(yStr) - years;
  const d = String(Math.min(28, Number(dStr))).padStart(2, "0");
  return `${y}-${mStr}-${d}`;
}

describe("Bloque 2: Integración Reglas de mi empresa en Expediente 360, Dashboard/Reportes, UI Config, Candidato e Incidencias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Punto 5: getEmployeeDossierById calcula vacaciones/prima desde config y métricas reales de company_attendance", async () => {
    const hireDate = yearsAgoISO(1);
    const customConfig = {
      timezone: BUSINESS_TIME_ZONE,
      vacationRules: {
        daysByYearOverrides: { 1: 18 },
        premiumPercentage: 40,
        allowCarryOver: true,
        maxCarryOverDays: 6,
      },
      overtimeRules: {
        requiresPriorAuthorization: true,
        doubleRateMultiplier: 2,
        tripleRateMultiplier: 3,
        maxDoubleHoursPerWeek: 9,
      },
    };

    const empRow = {
      id: "emp-qa-reglas-5",
      company_id: "comp-qa-reglas",
      employee_id: "cand-qa-reglas-5",
      full_name: "qa-reglas-Sofía",
      job_title: "Recepcionista",
      department: "Recepción",
      hire_date: hireDate,
      base_salary_monthly: 15000,
      payment_frequency: "quincenal",
      email: "qa-reglas-sofia@example.com",
      phone: "+529980001122",
      rfc: "SORE900101XXX",
      curp: "SORE900101MYNRRA01",
      nss: "12345678901",
      work_schedule: "Lunes a Sábado",
      avatar_url: null,
      emergency_contact: null,
      status: "active",
      termination_date: null,
      termination_reason: null,
      created_at: `${hireDate}T12:00:00.000Z`,
    };

    const attendanceRows = [
      { status: "presente", overtime_hours: 2, overtime_status: "autorizado" },
      { status: "presente", overtime_hours: 3, overtime_status: "pendiente" }, // no autorizada: se ignora
      { status: "retardo", overtime_hours: 1, overtime_status: "autorizado" },
      { status: "falta_injustificada", overtime_hours: 0, overtime_status: "ninguno" },
    ];

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "company_profiles") {
          return makeChain([], {
            company_name: "qa-reglas-Resort",
            legal_name: "qa-reglas-Resort S.A.",
            payroll_impact_config: customConfig,
          });
        }
        if (table === "company_employees") {
          return makeChain([empRow], empRow);
        }
        if (table === "company_attendance") {
          return makeChain(attendanceRows, null);
        }
        return makeChain([], null);
      }),
    } as unknown as SupabaseClient<Database>;

    const dossier = await getEmployeeDossierById(supabase, "emp-qa-reglas-5", "comp-qa-reglas");
    expect(dossier).not.toBeNull();
    expect(dossier!.vacationBalance.totalDaysAccruedLFT).toBe(18);
    expect(dossier!.vacationBalance.daysAvailable).toBe(18);
    expect(dossier!.vacationBalance.premiumPercentage).toBe(40);
    // 15000 / 30 * 18 * 0.40 = 3600
    expect(dossier!.vacationBalance.estimatedVacationPremiumMxn).toBe(3600);

    expect(dossier!.attendanceSummary).toEqual({
      totalDaysPresent: 3,
      totalLateArrivals: 1,
      totalAbsences: 1,
      totalOvertimeHours: 3,
      punctualityRate: 67,
    });

    const html = renderToStaticMarkup(
      React.createElement(EmployeeDossierView, { dossier: dossier! })
    );
    expect(html).toContain("40%");
    expect(html).toContain("3,600");
  });

  test("Punto 6: Dashboard y Reportes aplican periodicidad, cutoffDaysBeforeEnd y fromMonthlyEquivalentSalary", async () => {
    const companyConfig = {
      timezone: BUSINESS_TIME_ZONE,
      payrollPeriodicity: "semanal" as const,
      cutoffDaysBeforeEnd: 2 as const,
      vacationRules: {
        daysByYearOverrides: { 1: 16 },
        premiumPercentage: 35,
      },
    };
    const todayISO = getMexicoDateISO();
    const expectedPeriod = resolvePayrollPeriodWithCutoff({
      refDateISO: todayISO,
      config: companyConfig,
    });

    mockState.supabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: "comp-qa-reglas" } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "company_members") {
          return makeChain([], null);
        }
        if (table === "company_profiles") {
          return makeChain([], {
            id: "comp-qa-reglas",
            company_name: "qa-reglas-Grupo",
            legal_name: "qa-reglas-Grupo S.A.",
            rfc: "QARG900101XXX",
            fiscal_address: "Cancún",
            payroll_impact_config: companyConfig,
            subscription_plan: "pro",
            subscription_status: "active",
            subscription_period_end: null,
            credits_available: 10,
            profiles: [{ is_early_access: true }],
          });
        }
        if (table === "company_employees") {
          return makeChain([
            {
              id: "emp-qa-reglas-6",
              employee_id: null,
              full_name: "qa-reglas-Luis",
              department: "Cocina",
              job_title: "Chef",
              status: "active",
              base_salary_monthly: 15000,
              hire_date: yearsAgoISO(1),
              created_at: `${yearsAgoISO(1)}T12:00:00.000Z`,
              candidate: null,
            },
          ]);
        }
        return makeChain([], null);
      }),
    } as unknown as SupabaseClient<Database>;

    const dashboard = await getCompanyDashboardData("comp-qa-reglas");
    expect(dashboard.payrollSummary.frequency).toBe("semanal");
    expect(dashboard.payrollSummary.cutoffDate).toBe(expectedPeriod.cutoffDate);
    expect(dashboard.payrollSummary.paymentDate).toBe(expectedPeriod.endDate);
    expect(dashboard.payrollSummary.estimatedTotal).toBe(
      fromMonthlyEquivalentSalary(15000, "semanal")
    );

    const reports = await getCompanyReportsData();
    const payrollReport = reports.reports.find((r) => r.id === "costos_nomina");
    expect(payrollReport).toBeDefined();
    expect(payrollReport?.description).toContain(`semanal, corte ${expectedPeriod.cutoffDate}`);
    const row = payrollReport?.data[0] as Record<string, unknown>;
    expect(row.frecuencia).toBe("semanal");
    expect(row.sueldo_quincenal).toBe(Math.round(fromMonthlyEquivalentSalary(15000, "semanal")));
    expect(row.sueldo_diario).toBe(500);
  });

  test("Punto 7: CompanyWorkRulesPanel renderiza selector de corte (0..3 días) y Luto por evento (mín. 3 LFT)", () => {
    const html = renderToStaticMarkup(
      React.createElement(CompanyWorkRulesPanel, {
        companyId: "comp-qa-reglas",
        initialPayrollImpactConfig: {
          timezone: BUSINESS_TIME_ZONE,
          cutoffDaysBeforeEnd: 2,
          leaveCatalogue: {
            luto: {
              paid: true,
              payPercentage: 100,
              affectsSeventhDay: false,
              affectsVacationPremium: false,
              affectsBonuses: false,
              maxDaysPerYear: null,
              maxDaysPerEvent: 5,
            },
          },
        },
        initialLeaveApprovalMode: "single_step",
      })
    );

    expect(html).toContain('id="cutoff-days-before-end"');
    expect(html).toContain("Corte de incidencias (días antes del fin)");
    expect(html).toContain('id="luto-days-event"');
    expect(html).toContain('min="3"');
    expect(html).toContain('value="5"');
  });

  test("Punto 8: Portal del Candidato aplica vacaciones, prima y tope de luto desde payroll_impact_config", async () => {
    const hireDate = yearsAgoISO(1);
    const customConfig = {
      timezone: BUSINESS_TIME_ZONE,
      vacationRules: {
        daysByYearOverrides: { 1: 18 },
        premiumPercentage: 40,
      },
      leaveCatalogue: {
        luto: {
          paid: true,
          payPercentage: 100,
          affectsSeventhDay: false,
          affectsVacationPremium: false,
          affectsBonuses: false,
          maxDaysPerYear: null,
          maxDaysPerEvent: 4,
        },
      },
    };

    const insertLeaveFn = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: { id: "leave-qa-1" }, error: null })),
      })),
    }));

    const buildCandidateSupabase = (lutoMaxDaysPerEvent: number) =>
      ({
        from: vi.fn((table: string) => {
          if (table === "company_contracts") {
            return makeChain(
              [
                {
                  id: "cont-qa-1",
                  company_id: "comp-qa-reglas",
                  employee_id: "emp-qa-reglas-8",
                  job_title: "Mesero",
                  department: "Alimentos",
                  start_date: hireDate,
                  status: "vigente",
                  company: {
                    id: "comp-qa-reglas",
                    company_name: "qa-reglas-Bistró",
                    legal_name: "qa-reglas-Bistró S.A.",
                    logo_url: null,
                    payroll_impact_config: {
                      ...customConfig,
                      leaveCatalogue: {
                        luto: {
                          ...customConfig.leaveCatalogue.luto,
                          maxDaysPerEvent: lutoMaxDaysPerEvent,
                        },
                      },
                    },
                  },
                },
              ],
              { start_date: hireDate }
            );
          }
          if (table === "company_employees") {
            return makeChain([], {
              id: "emp-qa-reglas-8",
              company_id: "comp-qa-reglas",
              job_title: "Mesero",
              department: "Alimentos",
              hire_date: hireDate,
              base_salary_monthly: 15000,
              company: {
                id: "comp-qa-reglas",
                company_name: "qa-reglas-Bistró",
                legal_name: "qa-reglas-Bistró S.A.",
                logo_url: null,
                payroll_impact_config: customConfig,
              },
            });
          }
          if (table === "company_profiles") {
            return makeChain([], {
              payroll_impact_config: {
                ...customConfig,
                leaveCatalogue: {
                  luto: {
                    ...customConfig.leaveCatalogue.luto,
                    maxDaysPerEvent: lutoMaxDaysPerEvent,
                  },
                },
              },
            });
          }
          if (table === "company_leaves") {
            return {
              ...makeChain([], null),
              insert: insertLeaveFn,
            };
          }
          if (table === "profiles") {
            return makeChain([], { full_name: "qa-reglas-Elena" });
          }
          if (table === "notifications") {
            return { insert: vi.fn(async () => ({ error: null })) };
          }
          return makeChain([], null);
        }),
      }) as unknown as SupabaseClient<Database>;

    const leavesData = await CandidateLeavesService.getCandidateLeavesData(
      buildCandidateSupabase(4),
      "user-cand-qa-8"
    );
    expect(leavesData.hasActiveEmployment).toBe(true);
    expect(leavesData.balance?.totalDaysAccruedLFT).toBe(18);
    expect(leavesData.balance?.vacationPremiumRate).toBe(0.4);
    expect(leavesData.balance?.vacationPremiumEstimatedAmount).toBe(3600);

    // 2026-10-12 (lun) al 2026-10-15 (jue) son 4 días hábiles: con límite 3 debe fallar, con 4 debe permitirse.
    await expect(
      CandidateLeavesService.submitLeaveRequest(buildCandidateSupabase(3), "user-cand-qa-8", {
        companyId: "comp-qa-reglas",
        requestType: "luto",
        startDate: "2026-10-12",
        endDate: "2026-10-15",
        reason: "Fallecimiento de familiar directo",
      })
    ).rejects.toThrow("máximo de 3 día(s)");

    const allowed = await CandidateLeavesService.submitLeaveRequest(
      buildCandidateSupabase(4),
      "user-cand-qa-8",
      {
        companyId: "comp-qa-reglas",
        requestType: "luto",
        startDate: "2026-10-12",
        endDate: "2026-10-15",
        reason: "Fallecimiento de familiar directo",
      }
    );
    expect(allowed.success).toBe(true);
    expect(insertLeaveFn).toHaveBeenCalledTimes(1);
  });

  test("Punto 9: IncidentsView muestra descuento estimado en MXN y efecto en bonos de puntualidad/asistencia", () => {
    const todayISO = getMexicoDateISO();
    const config = {
      timezone: BUSINESS_TIME_ZONE,
      delaysPerAbsence: 3,
      delayDeductionDays: 1,
      resetPeriod: "quincenal" as const,
      seventhDayMode: "proporcional" as const,
      payrollPeriodicity: "quincenal" as const,
      cutoffDaysBeforeEnd: 0 as const,
      punctualityBonus: {
        enabled: true,
        amount: 5,
        type: "percentage" as const,
        cancelledBy: ["retardo"],
        partialCancelBy: [],
        partialCancelPercentage: 0,
      },
      attendanceBonus: {
        enabled: true,
        amount: 5,
        type: "percentage" as const,
        cancelledBy: ["falta_injustificada"],
        partialCancelBy: ["retardo"],
        partialCancelPercentage: 50,
      },
    };
    const period = resolvePayrollPeriodWithCutoff({ refDateISO: todayISO, config });

    const html = renderToStaticMarkup(
      React.createElement(IncidentsView, {
        payrollImpactConfig: config,
        employees: [
          {
            id: "emp-qa-reglas-9",
            fullName: "qa-reglas-Carlos",
            jobTitle: "Cocinero",
            department: "Cocina",
            baseSalaryMonthly: 15000,
          },
        ],
        initialIncidents: [1, 2, 3].map((idx) => ({
          id: `inc-qa-reglas-9-${idx}`,
          employeeId: "emp-qa-reglas-9",
          employeeName: "qa-reglas-Carlos",
          jobTitle: "Cocinero",
          department: "Cocina",
          category: "retardo" as const,
          categoryLabel: "Retardo",
          title: `Retardo ${idx}`,
          description: "Retardo de prueba",
          incidentDate: period.startDate,
          severity: "baja" as const,
          responsibleSupervisor: "RH",
          status: "aprobado" as const,
          createdAt: `${period.startDate}T12:00:00Z`,
        })),
      })
    );

    expect(html).toContain("qa-reglas-Carlos");
    expect(html).toContain("3 retardo(s) → 1 falta(s) equiv.");
    // 15000 / 30 = 500/día; proporcional 1 + 1/6 día = 583 MXN
    expect(html).toContain("Descuento est.: -$583 MXN");
    // 5% de 7500 (quincena) = 375
    expect(html).toContain("Bono puntualidad: cancelado (-$375 MXN)");
    // 50% de 375 = 188 -> pérdida 187
    expect(html).toContain("Bono asistencia: parcial -50% (-$187 MXN)");
  });
});
