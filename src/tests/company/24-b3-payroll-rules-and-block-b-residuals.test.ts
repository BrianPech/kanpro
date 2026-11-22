import { describe, test, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getMexicoDateISO } from "@/lib/formatters";
import { calculateAbsenceDeduction } from "@/modules/company/utils/payroll-calculator";
import {
  computeClarificationDeadline,
  DEFAULT_PAYROLL_IMPACT_CONFIG,
  DelayAccumulationImpact,
  filterPayrollEligibleIncidents,
  isClarificationExpired,
  parsePayrollImpactConfig,
  partitionPayrollIncidents,
  resolveExpiredClarificationIncident,
} from "@/modules/company/strategies/incident-payroll-impact.strategy";
import { CompanyPayrollService } from "@/modules/company/services/company-payroll";
import { CompanyIncidentsService } from "@/modules/company/services/company-incidents";
import type {
  IncidentsRepository,
  IncidentRow,
} from "@/modules/company/repositories/incidents.repository";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import {
  createEmployeeInvitationSchema,
  bulkEmployeeImportRowSchema,
} from "@/modules/company/schemas/employee-invitation.schema";
import {
  calculateLFTVacationDays,
  calculateVacationPremium,
  filterLeavesInCurrentCycle,
  getCurrentVacationCycleWindow,
} from "@/modules/company/utils/vacation-calculator";
import { getEmployeeDossierById } from "@/modules/company/services/company-dossier";
import { CompanyLeavesService } from "@/modules/company/services/company-leaves";
import type {
  CompanyLeaveRow,
  LeavesRepository,
} from "@/modules/company/repositories/leaves.repository";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  DialogContent: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) => React.createElement("h2", null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) => React.createElement("p", null, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

vi.mock("@/modules/company/actions/leaves", () => ({
  createCompanyLeaveAction: vi.fn(),
}));

import { VacationRequestModal } from "@/modules/company/components/leaves/vacation-request-modal";

function buildIncidentRow(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: "inc-qa-1",
    company_id: "comp-A",
    employee_id: "emp-1",
    employee_name: "qa-semana2c-Ana",
    job_title: "Supervisora",
    department: "Operaciones",
    category: "retardo",
    category_label: "Retardo de Turno",
    title: "Retardo",
    description: "Llegó tarde al turno.",
    incident_date: "2026-10-05",
    severity: "baja",
    responsible_supervisor: "RH",
    evidence_url: null,
    evidence_file_name: null,
    evidence_type: null,
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
  attendance?: Array<{
    employee_id: string;
    work_date: string;
    status: string;
    overtime_status?: string | null;
    overtime_hours?: number | null;
    overtime_rate_type?: string | null;
  }>;
  monthlySalary?: number;
}) {
  const { payrollImpactConfig = null, attendance = [], monthlySalary = 12000 } = options;
  return {
    from: vi.fn((table: string) => {
      if (table === "company_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "comp-A",
                  company_name: "qa-semana2c-Hotel",
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
                      full_name: "qa-semana2c-Ana",
                      job_title: "Supervisora",
                      department: "Operaciones",
                      avatar_url: null,
                      base_salary_monthly: monthlySalary,
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
      return {};
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("B3 (1-3): Reglas de retardos, séptimo día, sin multa ilegal de $100 y estado por_aclarar", () => {
  test("DelayAccumulationImpact: 2→0, 3→1, 5→1, 6→2 y soporte para medio día (0.5)", () => {
    const salary = 12000;
    const fullDay = new DelayAccumulationImpact(3, 1, "proporcional");

    expect(fullDay.calculate({ monthlySalary: salary, count: 2 }).absenceEquivalents).toBe(0);
    expect(fullDay.calculate({ monthlySalary: salary, count: 2 }).deduction).toBe(0);
    expect(fullDay.calculate({ monthlySalary: salary, count: 3 }).absenceEquivalents).toBe(1);
    expect(fullDay.calculate({ monthlySalary: salary, count: 5 }).absenceEquivalents).toBe(1);
    expect(fullDay.calculate({ monthlySalary: salary, count: 6 }).absenceEquivalents).toBe(2);

    const halfDay = new DelayAccumulationImpact(3, 0.5, "ninguno");
    expect(halfDay.calculate({ monthlySalary: salary, count: 3 }).absenceEquivalents).toBe(0.5);
    expect(halfDay.calculate({ monthlySalary: salary, count: 3 }).deduction).toBe(200);
    expect(halfDay.calculate({ monthlySalary: salary, count: 6 }).absenceEquivalents).toBe(1);
    expect(halfDay.calculate({ monthlySalary: salary, count: 6 }).deduction).toBe(400);
  });

  test("parsePayrollImpactConfig: NULL/inválido → default, parcial → mezcla validada", () => {
    expect(parsePayrollImpactConfig(null)).toEqual(DEFAULT_PAYROLL_IMPACT_CONFIG);
    expect(parsePayrollImpactConfig("invalido")).toEqual(DEFAULT_PAYROLL_IMPACT_CONFIG);
    expect(parsePayrollImpactConfig([])).toEqual(DEFAULT_PAYROLL_IMPACT_CONFIG);
    expect(
      parsePayrollImpactConfig({
        delaysPerAbsence: -2,
        delayDeductionDays: 2,
        toleranceMinutes: 999,
        resetPeriod: "bimestral",
        seventhDayMode: "doble",
        clarificationWindowDays: 0,
        scope: { uniformTolerance: "no", jobTitles: [123, ""] },
        recognitionBonusDays: -5,
        effectiveFrom: "2026-99-99-bad",
      })
    ).toEqual(DEFAULT_PAYROLL_IMPACT_CONFIG);

    const partial = parsePayrollImpactConfig({
      delaysPerAbsence: 4,
      delayDeductionDays: 0.5,
      toleranceMinutes: 10,
      resetPeriod: "semanal",
      seventhDayMode: "completo",
      clarificationWindowDays: 2,
      scope: {
        uniformTolerance: false,
        jobTitles: ["Cocinero", "Cocinero", " Mesero "],
        shifts: ["Matutino"],
        branches: ["Cancún Centro"],
      },
      effectiveFrom: "2026-12-01",
    });

    expect(partial).toEqual({
      delaysPerAbsence: 4,
      delayDeductionDays: 0.5,
      toleranceMinutes: 10,
      resetPeriod: "semanal",
      seventhDayMode: "completo",
      clarificationWindowDays: 2,
      scope: {
        uniformTolerance: false,
        jobTitles: ["Cocinero", "Mesero"],
        shifts: ["Matutino"],
        branches: ["Cancún Centro"],
      },
      recognitionBonusDays: 1,
      effectiveFrom: "2026-12-01",
    });
  });

  test("calculateAbsenceDeduction soporta proporcional (1.1666), completo (+1 día) y ninguno (1.0)", () => {
    const monthlySalary = 12000; // $400 diarios
    expect(calculateAbsenceDeduction(monthlySalary, 1)).toBe(467);
    expect(calculateAbsenceDeduction(monthlySalary, 1, "proporcional")).toBe(467);
    expect(calculateAbsenceDeduction(monthlySalary, 1, "ninguno")).toBe(400);
    expect(calculateAbsenceDeduction(monthlySalary, 1, "completo")).toBe(800);
    expect(calculateAbsenceDeduction(monthlySalary, 2, "completo")).toBe(1200);
    expect(calculateAbsenceDeduction(monthlySalary, 0, "completo")).toBe(0);
  });

  test("filterPayrollEligibleIncidents: mismo día en asistencia → excluida, distinto día → incluida, pendiente/por_aclarar → excluida", () => {
    const incidents = [
      { category: "retardo" as const, status: "aprobado", incident_date: "2026-10-02" },
      { category: "retardo" as const, status: "aprobado", incident_date: "2026-10-03" },
      { category: "retardo" as const, status: "pendiente", incident_date: "2026-10-04" },
      { category: "falta_injustificada" as const, status: "por_aclarar", incident_date: "2026-10-05" },
    ];
    const attendance = [{ work_date: "2026-10-02", status: "retardo" }];

    const eligible = filterPayrollEligibleIncidents(incidents, attendance);
    expect(eligible.map((i) => i.incident_date)).toEqual(["2026-10-03"]);

    const partitioned = partitionPayrollIncidents(incidents, attendance);
    expect(partitioned.eligible.map((i) => i.incident_date)).toEqual(["2026-10-03"]);
    expect(partitioned.absorbedByAttendance.map((i) => i.incident_date)).toEqual(["2026-10-02"]);
  });

  test("getCompanyPayrollData: 3 retardos 'aprobado' solo-incidencia → absenceEquivalents=1, daysWorked=14, sin multa de $100", async () => {
    const refDate = new Date("2026-10-10T18:00:00.000Z");
    const repo: IncidentsRepository = {
      create: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(async () => null),
      markNotified: vi.fn(async () => undefined),
      listByCompany: vi.fn(async () => []),
      listByEmployeeAndPeriod: vi.fn(async () => []),
      listByPeriod: vi.fn(async () => [
        buildIncidentRow({ id: "d1", category: "retardo", incident_date: "2026-10-02", status: "aprobado" }),
        buildIncidentRow({ id: "d2", category: "retardo", incident_date: "2026-10-04", status: "aprobado" }),
        buildIncidentRow({ id: "d3", category: "retardo", incident_date: "2026-10-06", status: "aprobado" }),
      ]),
    };

    const service = new CompanyPayrollService(buildPayrollClient({}), repo);
    const { summary } = await service.getCompanyPayrollData("comp-A", refDate);
    const emp = summary.employees[0];

    expect(emp.absenceEquivalents).toBe(1);
    expect(emp.delayAbsenceEquivalents).toBe(1);
    expect(emp.unjustifiedAbsences).toBe(1);
    expect(emp.daysWorked).toBe(14);
    expect(emp.delayDeductions).toBe(0);
    expect(emp.absenceDeductions).toBe(calculateAbsenceDeduction(12000, 1, "proporcional"));
    expect(emp.incidentDelays).toBe(3);
  });

  test("Decisión 5: retardos en asistencia NO cobran multa fija ilegal de $100 y registran absorción", async () => {
    const refDate = new Date("2026-10-10T18:00:00.000Z");
    const repo: IncidentsRepository = {
      create: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(async () => null),
      markNotified: vi.fn(async () => undefined),
      listByCompany: vi.fn(async () => []),
      listByEmployeeAndPeriod: vi.fn(async () => []),
      listByPeriod: vi.fn(async () => [
        buildIncidentRow({ id: "d1", category: "retardo", incident_date: "2026-10-02", status: "aprobado" }),
      ]),
    };

    const service = new CompanyPayrollService(
      buildPayrollClient({
        attendance: [
          { employee_id: "emp-1", work_date: "2026-10-02", status: "retardo" },
          { employee_id: "emp-1", work_date: "2026-10-03", status: "retardo" },
        ],
      }),
      repo
    );

    const { summary } = await service.getCompanyPayrollData("comp-A", refDate);
    const emp = summary.employees[0];

    expect(emp.lateArrivals).toBe(2);
    expect(emp.delayDeductions).toBe(0);
    expect(emp.absorbedIncidentsCount).toBe(1);
    expect(emp.punctualityBonus).toBe(0);
  });

  test("Estado por_aclarar: calcula fecha límite en America/Cancun y transiciona a falta_injustificada aprobada al vencer", async () => {
    const deadline = computeClarificationDeadline("2026-10-05", 3);
    // 2026-10-08 23:59:59 America/Cancun (UTC-5) = 2026-10-09T04:59:59.000Z
    expect(deadline).toBe("2026-10-09T04:59:59.000Z");

    const pendingClarification = buildIncidentRow({
      id: "inc-clarify-1",
      category: "otro",
      status: "por_aclarar",
      incident_date: "2026-10-05",
      clarification_deadline: deadline,
    });

    const beforeDeadline = new Date("2026-10-08T20:00:00.000Z");
    const afterDeadline = new Date("2026-10-09T05:00:00.000Z");

    expect(isClarificationExpired(pendingClarification, beforeDeadline)).toBe(false);
    expect(isClarificationExpired(pendingClarification, afterDeadline)).toBe(true);

    const resolved = resolveExpiredClarificationIncident(pendingClarification, afterDeadline);
    expect(resolved.status).toBe("aprobado");
    expect(resolved.category).toBe("falta_injustificada");
    expect(resolved.resolution_notes).toContain("falta injustificada");

    // Verificar en CompanyIncidentsService.expireOverdueClarifications
    const updateStatus = vi.fn(async (_c, _id, payload) => ({
      ...pendingClarification,
      ...payload,
    }));
    const repo: IncidentsRepository = {
      create: vi.fn(async (_c, payload) => buildIncidentRow(payload as Partial<IncidentRow>)),
      updateStatus,
      delete: vi.fn(),
      getById: vi.fn(async () => pendingClarification),
      markNotified: vi.fn(async () => undefined),
      listByCompany: vi.fn(async () => [pendingClarification]),
      listByEmployeeAndPeriod: vi.fn(async () => []),
      listByPeriod: vi.fn(async () => [pendingClarification]),
    };

    const companyClient = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { payroll_impact_config: { clarificationWindowDays: 2 } },
              error: null,
            }),
          }),
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    const incService = new CompanyIncidentsService(companyClient, repo);
    const created = await incService.createIncident("comp-A", {
      employeeName: "qa-semana2c-Ana",
      category: "falta_injustificada",
      title: "Ausencia sin aviso",
      description: "Pendiente de justificante médico",
      incidentDate: "2026-10-05",
      status: "por_aclarar",
    });
    expect(created.status).toBe("por_aclarar");
    expect(created.clarificationDeadline).toBe("2026-10-08T04:59:59.000Z");

    const expiredRows = await incService.expireOverdueClarifications("comp-A", afterDeadline);
    expect(expiredRows).toHaveLength(1);
    expect(updateStatus).toHaveBeenCalledWith(
      "comp-A",
      "inc-clarify-1",
      expect.objectContaining({
        status: "aprobado",
        category: "falta_injustificada",
      })
    );

    // Y en nómina, ya vencida se descuenta automáticamente como falta injustificada
    const payrollService = new CompanyPayrollService(buildPayrollClient({}), repo);
    const { summary } = await payrollService.getCompanyPayrollData("comp-A", afterDeadline);
    expect(summary.employees[0].unjustifiedAbsences).toBe(1);
    expect(summary.employees[0].absenceDeductions).toBe(calculateAbsenceDeduction(12000, 1, "proporcional"));
  });
});

describe("Residuos Block B (2-4): Normalización en invitaciones, fallback modal = 0, ciclo vacacional y concurrencia", () => {
  test("Residuo 2: invitación quincenal $11,000 → base_salary_monthly $22,000, prima $2,566.67, y created_by = user.id en segunda empresa", async () => {
    const parsedInv = createEmployeeInvitationSchema.safeParse({
      full_name: "qa-semana2c-Invitada",
      email: "qa-semana2c-inv@test.kanpro.local",
      position: "Cocinera",
      salary: 11000,
      payment_frequency: "quincenal",
    });
    expect(parsedInv.success).toBe(true);

    const parsedBulk = bulkEmployeeImportRowSchema.safeParse({
      full_name: "qa-semana2c-Masiva",
      email: "qa-semana2c-bulk@test.kanpro.local",
      position: "Cocinera",
      salary: 11000,
      payment_frequency: "quincenal",
    });
    expect(parsedBulk.success).toBe(true);

    const insertedEmployees: Array<Record<string, unknown>> = [];
    const insertedInvitations: Array<Record<string, unknown>> = [];
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "employee_invitations") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
            insert: vi.fn((payload: Record<string, unknown>) => {
              // Simula constraint FK 23503: created_by debe ser un userId en profiles, nunca companyId de una 2ª empresa
              if (payload.created_by === "comp-segunda-empresa") {
                return {
                  select: () => ({
                    single: async () => ({
                      data: null,
                      error: { code: "23503", message: "violates foreign key constraint employee_invitations_created_by_fkey" },
                    }),
                  }),
                };
              }
              insertedInvitations.push(payload);
              return {
                select: () => ({
                  single: async () => ({ data: { id: "inv-1", ...payload }, error: null }),
                }),
                error: null,
              };
            }),
          };
        }
        if (table === "company_employees") {
          return {
            insert: vi.fn((payload: Record<string, unknown>) => {
              insertedEmployees.push(payload);
              return {
                select: () => ({
                  single: async () => ({ data: { id: `emp-${insertedEmployees.length}`, ...payload }, error: null }),
                }),
              };
            }),
            delete: () => ({ eq: async () => ({ error: null }) }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const invRes = await CompanyEmployeeService.createEmployeeInvitation(
      mockClient,
      "comp-segunda-empresa",
      {
        full_name: "qa-semana2c-Invitada",
        email: "qa-semana2c-inv@test.kanpro.local",
        position: "Cocinera",
        salary: 11000,
        payment_frequency: "quincenal",
        contract_type: "tiempo_indeterminado",
        department: "Cocina",
      },
      "user-owner-real-id"
    );

    expect(invRes.employee.base_salary_monthly).toBe(22000);
    expect(invRes.employee.payment_frequency).toBe("quincenal");
    expect(invRes.invitation.created_by).toBe("user-owner-real-id");

    const premium = calculateVacationPremium(Number(invRes.employee.base_salary_monthly), 14);
    expect(premium.dailySalary).toBe(733.33);
    expect(premium.premiumAmount).toBe(2566.67);

    const bulkRes = await CompanyEmployeeService.bulkImportEmployees(
      mockClient,
      "comp-segunda-empresa",
      [
        {
          full_name: "qa-semana2c-Masiva",
          email: "qa-semana2c-bulk@test.kanpro.local",
          position: "Cocinera",
          salary: 11000,
          payment_frequency: "quincenal",
          contract_type: "tiempo_indeterminado",
          department: "Cocina",
        },
      ],
      "user-owner-real-id"
    );

    expect(bulkRes.imported).toBe(1);
    expect(bulkRes.failed).toBe(0);
    expect(insertedEmployees[1]?.base_salary_monthly).toBe(22000);
    expect(insertedEmployees[1]?.payment_frequency).toBe("quincenal");
    expect(insertedInvitations[1]?.created_by).toBe("user-owner-real-id");
  });

  test("Residuo 3: VacationRequestModal usa fallback 0 días (no 12) cuando el empleado no tiene hireDate", () => {
    const html = renderToStaticMarkup(
      React.createElement(VacationRequestModal, {
        isOpen: true,
        onOpenChange: () => {},
        employees: [
          {
            id: "emp-no-hire-date",
            fullName: "qa-semana2c-SinFecha",
            department: "Operaciones",
            hireDate: null,
          },
        ],
      })
    );

    expect(html).toContain("0 días LFT");
    expect(html).not.toContain("12 días LFT");
  });

  test("Residuo 4a: hire_date futura devuelve 0 días (sin regalar 11 días por préstamo de meses)", () => {
    const future = calculateLFTVacationDays("2027-06-15", "2026-11-21");
    expect(future.yearsOfService).toBe(0);
    expect(future.monthsOfService).toBe(0);
    expect(future.daysOfService).toBe(0);
    expect(future.totalDaysAccrued).toBe(0);
    expect(future.currentYearEntitlement).toBe(0);

    // Incluso 1 día en el futuro
    const tomorrow = calculateLFTVacationDays("2026-11-22", "2026-11-21");
    expect(tomorrow.totalDaysAccrued).toBe(0);
    expect(tomorrow.monthsOfService).toBe(0);

    // Mismo día de ingreso: 0 devengados
    const sameDay = calculateLFTVacationDays("2026-11-21", "2026-11-21");
    expect(sameDay.totalDaysAccrued).toBe(0);

    // Ventana de ciclo nula para fecha futura
    expect(getCurrentVacationCycleWindow("2027-06-15", "2026-11-21")).toBeNull();
  });

  test("Residuo 4b: empleado año 3 con 12 días tomados en años anteriores → saldo del ciclo actual completo (16 días)", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-21T18:00:00.000Z"));
      const hireDate = "2023-10-01"; // 3 años cumplidos -> 16 días LFT, ciclo 2026-10-01..2027-10-01

      const cycleWindow = getCurrentVacationCycleWindow(hireDate, "2026-11-21");
      expect(cycleWindow).toEqual({
        cycleStartDate: "2026-10-01",
        cycleEndDate: "2027-10-01",
        completedYears: 3,
      });

      const historicalLeaves = [
        {
          id: "leave-y1",
          company_id: "comp-A",
          employee_id: "emp-y3",
          candidate_id: "cand-y3",
          request_type: "vacaciones",
          start_date: "2024-11-04",
          end_date: "2024-11-16",
          total_working_days: 12,
          reason: "Año 1",
          status: "aprobada",
          reviewed_at: "2024-11-01T12:00:00.000Z",
          reviewed_by: "Recursos Humanos",
          rejection_reason: null,
          created_at: "2024-10-20T12:00:00.000Z",
        },
        {
          id: "leave-y2",
          company_id: "comp-A",
          employee_id: "emp-y3",
          candidate_id: "cand-y3",
          request_type: "vacaciones",
          start_date: "2025-11-03",
          end_date: "2025-11-17",
          total_working_days: 14,
          reason: "Año 2",
          status: "aprobada",
          reviewed_at: "2025-11-01T12:00:00.000Z",
          reviewed_by: "Recursos Humanos",
          rejection_reason: null,
          created_at: "2025-10-20T12:00:00.000Z",
        },
      ];

      expect(filterLeavesInCurrentCycle(historicalLeaves, hireDate, "2026-11-21")).toEqual([]);

      const empRow = {
        id: "emp-y3",
        company_id: "comp-A",
        employee_id: "cand-y3",
        full_name: "qa-semana2c-Veterano",
        job_title: "Chef",
        department: "Cocina",
        hire_date: hireDate,
        base_salary_monthly: 22000,
        payment_frequency: "quincenal",
        email: "vet@empresa.test",
        phone: "+529991112233",
        rfc: "VETM900101XXX",
        curp: "VETM900101MYNRRA01",
        nss: null,
        work_schedule: "Lunes a Viernes",
        avatar_url: null,
        emergency_contact: null,
        status: "active",
        termination_date: null,
        termination_reason: null,
        created_at: `${hireDate}T12:00:00.000Z`,
      };

      const makeChain = (rows: unknown[], singleRow: unknown = null) => {
        const chain: Record<string, unknown> = {
          select: () => chain,
          eq: () => chain,
          or: () => chain,
          order: () => chain,
          limit: () => chain,
          in: () => chain,
          maybeSingle: async () => ({ data: singleRow, error: null }),
          single: async () => ({ data: singleRow, error: null }),
          then: (resolve: (val: { data: unknown[]; error: null }) => void) =>
            resolve({ data: rows, error: null }),
        };
        return chain;
      };

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "company_profiles") {
            return makeChain([], { company_name: "Hotel Caribe", legal_name: "Hotel Caribe S.A." });
          }
          if (table === "company_employees") {
            return makeChain([empRow], empRow);
          }
          if (table === "company_leaves") {
            return makeChain(historicalLeaves, historicalLeaves[0]);
          }
          return makeChain([], null);
        }),
      } as unknown as SupabaseClient<Database>;

      const dossier = await getEmployeeDossierById(supabase, "emp-y3", "comp-A");
      expect(dossier).not.toBeNull();
      expect(dossier!.vacationBalance.yearsOfService).toBe(3);
      expect(dossier!.vacationBalance.totalDaysAccruedLFT).toBe(16);
      expect(dossier!.vacationBalance.daysTaken).toBe(0);
      expect(dossier!.vacationBalance.daysAvailable).toBe(16);
      // El historial completo sigue visible en la lista de solicitudes
      expect(dossier!.vacationRequests).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  test("Residuo 4c: dos solicitudes simultáneas por el saldo completo → solo una se aprueba", async () => {
    const todayIso = getMexicoDateISO();
    const [y, m, d] = todayIso.split("-").map(Number);
    const hireDate = `${y - 1}-${String(m).padStart(2, "0")}-${String(Math.min(28, d)).padStart(2, "0")}`; // 1 año cumplido = 12 días

    const store: CompanyLeaveRow[] = [];
    // Simula el lock transaccional de Postgres (pg_advisory_xact_lock en trg_enforce_company_leave_integrity)
    let lockTail: Promise<void> = Promise.resolve();
    const withAtomicLock = async <T>(fn: () => Promise<T>): Promise<T> => {
      const prev = lockTail;
      let release!: () => void;
      lockTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await prev;
      try {
        return await fn();
      } finally {
        release();
      }
    };

    const cycleWindow = getCurrentVacationCycleWindow(hireDate)!;
    const accrued = calculateLFTVacationDays(hireDate).totalDaysAccrued;
    expect(accrued).toBe(12);

    const atomicRepo: LeavesRepository = {
      create: async (companyId, payload) =>
        withAtomicLock(async () => {
          const committed = store
            .filter(
              (l) =>
                l.company_id === companyId &&
                l.employee_id === payload.employee_id &&
                l.request_type === "vacaciones" &&
                ["pendiente", "visto_bueno", "aprobada"].includes(l.status) &&
                l.start_date >= cycleWindow.cycleStartDate
            )
            .reduce((sum, l) => sum + l.total_working_days, 0);

          if (committed + payload.total_working_days > accrued) {
            throw new Error(
              `Saldo de vacaciones insuficiente. Disponible: ${Math.max(0, accrued - committed)} día(s), solicitado: ${payload.total_working_days} día(s).`
            );
          }

          const row: CompanyLeaveRow = {
            id: `leave-atomic-${store.length + 1}`,
            company_id: companyId,
            employee_id: payload.employee_id ?? null,
            candidate_id: payload.candidate_id ?? null,
            incident_id: payload.incident_id ?? null,
            request_type: payload.request_type,
            start_date: payload.start_date,
            end_date: payload.end_date,
            total_working_days: payload.total_working_days,
            reason: payload.reason ?? null,
            status: payload.status ?? "aprobada",
            reviewed_at: payload.reviewed_at ?? null,
            reviewed_by: payload.reviewed_by ?? null,
            rejection_reason: payload.rejection_reason ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          store.push(row);
          return row;
        }),
      respond: vi.fn(),
      listByCompany: vi.fn(async () => store),
      listByEmployeeAndPeriod: vi.fn(async () => []),
      listPending: vi.fn(async () => []),
      balanceUsedDays: vi.fn(async () => 0),
      balanceCommittedDays: vi.fn(async () => 0),
    };

    const client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "emp-atomic-1",
                  full_name: "qa-semana2c-Concurrente",
                  email: "conc@test.kanpro.local",
                  employee_id: "cand-atomic-1",
                  hire_date: hireDate,
                  created_at: `${hireDate}T12:00:00.000Z`,
                },
                error: null,
              }),
            }),
          }),
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    const service = new CompanyLeavesService(client, atomicRepo);

    // Dos solicitudes concurrentes por los 12 días completos (lunes a sábado × 2 semanas = 12 días hábiles cada una)
    const outcomes = await Promise.allSettled([
      service.createCompanyLeave("comp-A", {
        employeeId: "emp-atomic-1",
        requestType: "vacaciones",
        startDate: "2026-12-07",
        endDate: "2026-12-19",
      }),
      service.createCompanyLeave("comp-A", {
        employeeId: "emp-atomic-1",
        requestType: "vacaciones",
        startDate: "2027-01-04",
        endDate: "2027-01-16",
      }),
    ]);

    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o) => o.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(String((rejected[0] as PromiseRejectedResult).reason)).toMatch(/Saldo de vacaciones insuficiente/);
    expect(store).toHaveLength(1);
  });
});
