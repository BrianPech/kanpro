import { describe, expect, test, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { CompanyPayrollService } from "@/modules/company/services/company-payroll";
import { calculateEarlyDepartureMinutes } from "@/modules/company/services/company-attendance";
import { CompanyLeavesService } from "@/modules/company/services/company-leaves";
import { PayrollView } from "@/modules/company/components/payroll-view";
import {
  parseCompanyWorkRulesConfig,
  safeParseCompanyWorkRulesConfig,
} from "@/modules/company/strategies/company-policies.parser";
import { resolvePayrollPeriodWithCutoff } from "@/modules/company/strategies/payroll-period-bonuses.engine";
import type {
  IncidentRow,
  IncidentsRepository,
} from "@/modules/company/repositories/incidents.repository";
import type {
  CompanyLeaveRow,
  LeavesRepository,
} from "@/modules/company/repositories/leaves.repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard/company/payroll",
}));

function buildIncident(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: "inc-qa-reglas-1",
    company_id: "comp-A",
    employee_id: "emp-1",
    employee_name: "qa-reglas-Ana",
    job_title: "Supervisora",
    department: "Operaciones",
    category: "incapacidad",
    category_label: "Incapacidad Médica (IMSS)",
    title: "Incapacidad IMSS",
    description: "Folio IMSS",
    incident_date: "2026-10-05",
    severity: "media",
    responsible_supervisor: "RH",
    evidence_url: null,
    evidence_file_name: null,
    evidence_type: "receta_medica",
    status: "aprobado",
    clarification_deadline: null,
    resolution_notes: null,
    created_at: "2026-10-05T15:00:00.000Z",
    updated_at: "2026-10-05T15:00:00.000Z",
    notified_at: null,
    acknowledged_at: null,
    employee_statement: null,
    employee_statement_at: null,
    folio_imss: null,
    dias_amparados: null,
    ramo_imss: null,
    complemento_empresa: null,
    ...overrides,
  };
}

function buildPayrollClient(options: {
  payrollImpactConfig?: unknown;
  leaves?: Array<Record<string, unknown>>;
  attendance?: Array<Record<string, unknown>>;
}) {
  const { payrollImpactConfig = null, leaves = [], attendance = [] } = options;
  return {
    from: vi.fn((table: string) => {
      if (table === "company_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "comp-A",
                  company_name: "qa-reglas-Hoteles",
                  legal_name: null,
                  rfc: null,
                  payroll_impact_config: payrollImpactConfig,
                },
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
                      id: "emp-1",
                      employee_id: null,
                      full_name: "qa-reglas-Ana",
                      job_title: "Supervisora",
                      department: "Operaciones",
                      avatar_url: null,
                      base_salary_monthly: 15000, // $500 diarios
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
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
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
                lte: async () => ({ data: attendance, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "company_leaves") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                lte: () => ({
                  gte: async () => ({ data: leaves, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    }),
  } as unknown as SupabaseClient<Database>;
}

function buildIncidentsRepo(incidents: IncidentRow[]): IncidentsRepository {
  return {
    create: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(async () => null),
    markNotified: vi.fn(async () => undefined),
    listByCompany: vi.fn(async () => []),
    listByEmployeeAndPeriod: vi.fn(async () => []),
    listByPeriod: vi.fn(async () => incidents),
  };
}

describe("Bloque 1: Integración de Reglas de mi empresa en Nómina, Asistencia, Incidencias y Permisos", () => {
  test("cutoffDaysBeforeEnd (0..3) y luto Art. 132 fracc. XXIX LFT (>= 3 por evento)", () => {
    const defaultCfg = parseCompanyWorkRulesConfig(null);
    expect(defaultCfg.cutoffDaysBeforeEnd).toBe(0);
    expect(defaultCfg.leaveCatalogue.luto.maxDaysPerEvent).toBe(3);
    expect(defaultCfg.leaveCatalogue.luto.maxDaysPerYear).toBeNull();

    const defaultPeriod = resolvePayrollPeriodWithCutoff({ refDateISO: "2026-10-10" });
    expect(defaultPeriod.cutoffDate).toBe("2026-10-15"); // fin de periodo

    const advancedPeriod = resolvePayrollPeriodWithCutoff({
      refDateISO: "2026-10-10",
      config: { payrollPeriodicity: "quincenal", cutoffDaysBeforeEnd: 2 },
    });
    expect(advancedPeriod.cutoffDate).toBe("2026-10-13");

    const badLuto = safeParseCompanyWorkRulesConfig({
      leaveCatalogue: { luto: { maxDaysPerEvent: 2 } },
    });
    expect(badLuto.success).toBe(false);
    if (!badLuto.success) {
      expect(badLuto.violations[0]).toContain("Art. 132 fracc. XXIX LFT");
    }

    const generousLuto = parseCompanyWorkRulesConfig({
      leaveCatalogue: { luto: { maxDaysPerEvent: 5 } },
    });
    expect(generousLuto.leaveCatalogue.luto.maxDaysPerEvent).toBe(5);
  });

  test("Nómina: incapacidad IMSS reduce salario ordinario sin falta, suma complemento y evita doble conteo vía incident_id", async () => {
    const imssIncident = buildIncident({
      id: "inc-imss-1",
      category: "incapacidad",
      incident_date: "2026-10-05",
      folio_imss: "IMSS-QA-901",
      dias_amparados: 3,
      ramo_imss: "enfermedad_general",
      complemento_empresa: 450,
    });

    const linkedLeave = {
      id: "leave-imss-1",
      employee_id: "emp-1",
      request_type: "incapacidad_imss",
      start_date: "2026-10-05",
      end_date: "2026-10-07",
      total_working_days: 3,
      status: "aprobada",
      incident_id: "inc-imss-1",
    };

    const client = buildPayrollClient({
      payrollImpactConfig: {
        cutoffDaysBeforeEnd: 0,
        punctualityBonus: { enabled: false, amount: 0, type: "fixed", cancelledBy: [] },
        attendanceBonus: { enabled: false, amount: 0, type: "fixed", cancelledBy: [] },
      },
      leaves: [linkedLeave],
    });
    const service = new CompanyPayrollService(client, buildIncidentsRepo([imssIncident]));

    const { summary } = await service.getCompanyPayrollData(
      "comp-A",
      new Date("2026-10-10T18:00:00.000Z")
    );
    const emp = summary.employees[0];

    expect(emp.unjustifiedAbsences).toBe(0);
    expect(emp.absenceDeductions).toBe(0);
    expect(emp.imssDisabilityDays).toBe(3);
    expect(emp.imssComplementPay).toBe(450);
    expect(emp.daysWorked).toBe(12); // 15 - 3 días subsidiados por IMSS
    expect(emp.baseSalaryPeriod).toBe(6000); // 12 días ordinarios * $500
    expect(emp.totalPerceptions).toBe(6450); // 6000 ordinario + 450 complemento IMSS
  });

  test("Nómina y PayrollView: incidencias tras fecha de corte se difieren y muestran 'pasa(n) al siguiente periodo'", async () => {
    const postCutoffDelay = buildIncident({
      id: "inc-delay-post",
      category: "retardo",
      incident_date: "2026-10-14", // posterior al corte 2026-10-13
      status: "aprobado",
    });

    const client = buildPayrollClient({
      payrollImpactConfig: {
        cutoffDaysBeforeEnd: 2, // corte 2026-10-13
        punctualityBonus: { enabled: true, amount: 500, type: "fixed", cancelledBy: ["retardo"] },
        attendanceBonus: { enabled: false, amount: 0, type: "fixed", cancelledBy: [] },
      },
    });
    const service = new CompanyPayrollService(client, buildIncidentsRepo([postCutoffDelay]));

    const { summary } = await service.getCompanyPayrollData(
      "comp-A",
      new Date("2026-10-10T18:00:00.000Z")
    );
    const emp = summary.employees[0];

    expect(summary.cutoffDate).toBe("2026-10-13");
    expect(emp.deferredIncidentsCount).toBe(1);
    expect(emp.incidentDelays).toBe(0);
    expect(emp.punctualityBonus).toBe(500); // retardo posterior al corte no cancela el bono actual

    const html = renderToStaticMarkup(React.createElement(PayrollView, { payrollSummary: summary }));
    expect(html).toContain("1 pasa(n) al siguiente periodo");
  });

  test("Asistencia: calculateEarlyDepartureMinutes calcula minutos de salida anticipada", () => {
    expect(calculateEarlyDepartureMinutes("17:00", "16:15")).toBe(45);
    expect(calculateEarlyDepartureMinutes("17:00", "17:30")).toBe(0);
  });

  test("Vacaciones y Permisos: respeta luto 3 días default vs 5 configurable y persiste incident_id", async () => {
    const createdPayloads: Array<Record<string, unknown>> = [];
    const fakeLeavesRepo: LeavesRepository = {
      create: vi.fn(async (_c, payload) => {
        createdPayloads.push(payload as Record<string, unknown>);
        return {
          id: "leave-qa-1",
          company_id: "comp-A",
          employee_id: payload.employee_id ?? null,
          candidate_id: payload.candidate_id ?? null,
          incident_id: payload.incident_id ?? null,
          request_type: payload.request_type,
          start_date: payload.start_date,
          end_date: payload.end_date,
          total_working_days: payload.total_working_days,
          reason: payload.reason ?? null,
          status: "aprobada",
          reviewed_at: null,
          reviewed_by: null,
          rejection_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CompanyLeaveRow;
      }),
      respond: vi.fn(),
      listByCompany: vi.fn(async () => []),
      listByEmployeeAndPeriod: vi.fn(async () => []),
      listPending: vi.fn(async () => []),
      balanceUsedDays: vi.fn(async () => 0),
    };

    const buildLeavesSupabase = (payrollImpactConfig: unknown) =>
      ({
        from: vi.fn((table: string) => {
          if (table === "company_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { payroll_impact_config: payrollImpactConfig },
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
                  eq: () => ({
                    single: async () => ({
                      data: {
                        id: "emp-1",
                        full_name: "qa-reglas-Ana",
                        email: "qa-reglas-ana@kanpro.local",
                        employee_id: null,
                        hire_date: "2024-01-01",
                        created_at: "2024-01-01T00:00:00Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      }) as unknown as SupabaseClient<Database>;

    const defaultSvc = new CompanyLeavesService(buildLeavesSupabase(null), fakeLeavesRepo);
    await expect(
      defaultSvc.createCompanyLeave("comp-A", {
        employeeId: "emp-1",
        requestType: "luto",
        startDate: "2026-10-05",
        endDate: "2026-10-09", // 5 días > 3 default LFT
      })
    ).rejects.toThrow(/máximo de 3/);

    const generousSvc = new CompanyLeavesService(
      buildLeavesSupabase({ leaveCatalogue: { luto: { maxDaysPerEvent: 5 } } }),
      fakeLeavesRepo
    );
    const res = await generousSvc.createCompanyLeave("comp-A", {
      employeeId: "emp-1",
      requestType: "luto",
      startDate: "2026-10-05",
      endDate: "2026-10-09",
      incidentId: "11111111-1111-4111-8111-111111111111",
    });

    expect(res.workingDays).toBe(5);
    expect(createdPayloads[0]?.incident_id).toBe("11111111-1111-4111-8111-111111111111");
  });
});
