import { describe, test, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  calculateVacationPremium,
  calculateVacationExpiration,
  validateSpecialLeavePolicyDays,
  SPECIAL_LEAVE_POLICIES,
} from "@/modules/company/utils/vacation-calculator";
import {
  CompanyLeavesService,
  parseLeaveApprovalMode,
} from "@/modules/company/services/company-leaves";
import type {
  LeavesRepository,
  CompanyLeaveRow,
} from "@/modules/company/repositories/leaves.repository";
import { buildConstanciaVacacionesPdf } from "@/modules/company/utils/constancia-vacaciones-pdf";
import { LeaveCertificateService } from "@/modules/company/services/leave-certificate.service";
import { computeDepartmentOverlaps } from "@/modules/company/components/leaves/company-leaves-view";
import type { VacationRequest } from "@/modules/company/types/employee-dossier";

function buildLeaveRow(overrides: Partial<CompanyLeaveRow> = {}): CompanyLeaveRow {
  return {
    id: "leave-12345678",
    company_id: "comp-A",
    employee_id: "emp-1",
    candidate_id: "cand-1",
    request_type: "vacaciones",
    start_date: "2026-10-05",
    end_date: "2026-10-09",
    total_working_days: 5,
    reason: "Vacaciones anuales",
    status: "pendiente",
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("Parte 3B: aprobación en 2 pasos, políticas especiales, prima vacacional, vencimientos y constancia PDF", () => {
  test("parseLeaveApprovalMode: devuelve single_step por defecto y two_step cuando está configurado", () => {
    expect(parseLeaveApprovalMode(null)).toBe("single_step");
    expect(parseLeaveApprovalMode({})).toBe("single_step");
    expect(parseLeaveApprovalMode({ approvalMode: "two_step" })).toBe("two_step");
  });

  test("CompanyLeavesService con TwoStepApproval: Vo.Bo. del líder -> aprobación final de RH", async () => {
    let currentRow = buildLeaveRow({ status: "pendiente" });
    const notifications: Array<{ user_id: string; type: string }> = [];

    const fakeRepo: LeavesRepository = {
      create: vi.fn(async (_c, payload) => buildLeaveRow(payload as Partial<CompanyLeaveRow>)),
      getById: vi.fn(async () => currentRow),
      respond: vi.fn(async (_c, _id, payload) => {
        currentRow = { ...currentRow, ...payload } as CompanyLeaveRow;
        return currentRow;
      }),
      listByCompany: vi.fn(async () => [currentRow]),
      listByEmployeeAndPeriod: vi.fn(async () => []),
      listPending: vi.fn(async () => [currentRow]),
      balanceUsedDays: vi.fn(async () => 0),
    };

    const client = {
      from: vi.fn((table: string) => {
        if (table === "notifications") {
          return {
            insert: vi.fn(async (notif: { user_id: string; type: string }) => {
              notifications.push(notif);
              return { error: null };
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const service = new CompanyLeavesService(client, fakeRepo, "two_step");

    // 1. RH intenta aprobar sin Vo.Bo. del líder -> debe fallar
    await expect(
      service.respondToLeaveRequest("comp-A", {
        requestId: currentRow.id,
        decision: "aprobada",
        actor: "hr",
      })
    ).rejects.toThrow(/Vo\.Bo\./);

    // 2. Líder de área otorga Vo.Bo. -> pasa a visto_bueno
    const voboRes = await service.respondToLeaveRequest("comp-A", {
      requestId: currentRow.id,
      decision: "aprobada",
      actor: "area_leader",
    });
    expect(voboRes.leave.status).toBe("visto_bueno");
    expect(voboRes.leave.reviewed_by).toBe("Líder de Área (Vo.Bo.)");
    expect(notifications.at(-1)?.type).toBe("leave_visto_bueno");

    // 3. RH otorga aprobación final -> pasa a aprobada
    const hrRes = await service.respondToLeaveRequest("comp-A", {
      requestId: currentRow.id,
      decision: "aprobada",
      actor: "hr",
    });
    expect(hrRes.leave.status).toBe("aprobada");
    expect(hrRes.leave.reviewed_by).toBe("Recursos Humanos");
    expect(notifications.at(-1)?.type).toBe("leave_approved");
  });

  test("Políticas especiales: valida topes de días económicos (3), matrimonio (5), paternidad (5) y luto (5)", () => {
    expect(SPECIAL_LEAVE_POLICIES.dias_economicos.maxDaysPerRequest).toBe(3);
    expect(SPECIAL_LEAVE_POLICIES.matrimonio.maxDaysPerRequest).toBe(5);
    expect(SPECIAL_LEAVE_POLICIES.paternidad.maxDaysPerRequest).toBe(5);
    expect(SPECIAL_LEAVE_POLICIES.luto.maxDaysPerRequest).toBe(5);

    expect(() => validateSpecialLeavePolicyDays("dias_economicos", 3)).not.toThrow();
    expect(() => validateSpecialLeavePolicyDays("dias_economicos", 4)).toThrow(/máximo de 3/);

    expect(() => validateSpecialLeavePolicyDays("matrimonio", 5)).not.toThrow();
    expect(() => validateSpecialLeavePolicyDays("matrimonio", 6)).toThrow(/máximo de 5/);

    expect(() => validateSpecialLeavePolicyDays("paternidad", 6)).toThrow(/máximo de 5/);
    expect(() => validateSpecialLeavePolicyDays("luto", 6)).toThrow(/máximo de 5/);
    expect(() => validateSpecialLeavePolicyDays("vacaciones", 20)).not.toThrow();
  });

  test("CompanyLeavesService.createCompanyLeave: bloquea traslapes de fechas y topes de política especial", async () => {
    const fakeRepo: LeavesRepository = {
      create: vi.fn(async (_c, payload) => buildLeaveRow(payload as Partial<CompanyLeaveRow>)),
      respond: vi.fn(),
      listByCompany: vi.fn(async () => []),
      listByEmployeeAndPeriod: vi.fn(async () => [
        buildLeaveRow({
          id: "existing-1",
          start_date: "2026-11-02",
          end_date: "2026-11-06",
          status: "aprobada",
        }),
      ]),
      listPending: vi.fn(async () => []),
      balanceUsedDays: vi.fn(async () => 0),
    };

    const client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "emp-1",
                  full_name: "Roberto Díaz",
                  email: "roberto@hotel.mx",
                  employee_id: "cand-1",
                },
                error: null,
              }),
            }),
          }),
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    const service = new CompanyLeavesService(client, fakeRepo);

    // Excede 3 días económicos (lunes a viernes = 5 días)
    await expect(
      service.createCompanyLeave("comp-A", {
        employeeId: "emp-1",
        requestType: "dias_economicos",
        startDate: "2026-10-05",
        endDate: "2026-10-09",
      })
    ).rejects.toThrow(/máximo de 3/);

    // Traslape con ausencia activa 2026-11-02 al 2026-11-06
    await expect(
      service.createCompanyLeave("comp-A", {
        employeeId: "emp-1",
        requestType: "vacaciones",
        startDate: "2026-11-04",
        endDate: "2026-11-05",
      })
    ).rejects.toThrow(/traslapa con las fechas seleccionadas/);
  });

  test("Prima vacacional (Art. 80 LFT 25%) y vencimiento (Art. 81 / 516 LFT)", () => {
    const premium = calculateVacationPremium(15000, 12);
    expect(premium.dailySalary).toBe(500);
    expect(premium.vacationBaseAmount).toBe(6000);
    expect(premium.premiumRate).toBe(0.25);
    expect(premium.premiumAmount).toBe(1500);

    const expiration = calculateVacationExpiration("2025-03-15", "2026-04-10");
    expect(expiration.completedYears).toBe(1);
    expect(expiration.lastAnniversaryDate).toBe("2026-03-15");
    expect(expiration.enjoymentWindowEndDate).toBe("2026-09-15"); // +6 meses Art. 81
    expect(expiration.prescriptionEndDate).toBe("2027-09-15"); // +18 meses Art. 516
    expect(expiration.nextAnniversaryDate).toBe("2027-03-15");
    expect(expiration.isExpired).toBe(false);
  });

  test("computeDepartmentOverlaps: detecta solapamientos por área para el calendario corporativo", () => {
    const baseReq: VacationRequest = {
      id: "r1",
      employeeId: "e1",
      employeeName: "Ana",
      department: "Cocina",
      requestType: "vacaciones",
      typeLabel: "Vacaciones LFT",
      startDate: "2026-11-02",
      endDate: "2026-11-06",
      totalWorkingDays: 5,
      status: "aprobada",
      requestedAt: "Hoy",
    };

    const groups = computeDepartmentOverlaps([
      baseReq,
      {
        ...baseReq,
        id: "r2",
        employeeId: "e2",
        employeeName: "Luis",
        startDate: "2026-11-05",
        endDate: "2026-11-07",
        status: "visto_bueno",
      },
      {
        ...baseReq,
        id: "r3",
        employeeId: "e3",
        employeeName: "Sofía",
        department: "Recepción",
        startDate: "2026-11-10",
        endDate: "2026-11-12",
      },
    ]);

    const cocina = groups.find((g) => g.department === "Cocina");
    const recepcion = groups.find((g) => g.department === "Recepción");
    expect(cocina?.hasConflict).toBe(true);
    expect(recepcion?.hasConflict).toBe(false);
  });

  test("Constancia Oficial de Disfrute de Vacaciones PDF: genera PDF válido y exige estatus aprobada", async () => {
    const rawPdf = buildConstanciaVacacionesPdf({
      folio: "LEAVE123",
      companyName: "Hoteles Caribe S.A. de C.V.",
      issuedOn: "20 nov 2026",
      employeeName: "Roberto Díaz",
      jobTitle: "Recepcionista",
      department: "Recepción",
      hireDate: "15 mar 2024",
      formattedSeniority: "2 años",
      requestTypeLabel: "Vacaciones Anuales LFT",
      legalBasis: "Art. 76 LFT",
      startDate: "5 oct 2026",
      endDate: "9 oct 2026",
      totalWorkingDays: 5,
      totalDaysAccruedLFT: 14,
      daysRemainingAfterLeave: 9,
      vacationPremiumRateLabel: "25% mínimo conforme al Art. 80 LFT",
      vacationPremiumAmountLabel: "$625 MXN",
      reviewedBy: "Recursos Humanos",
      reviewedAt: "2 oct 2026",
      reason: "Descanso anual",
    });

    const text = Buffer.from(rawPdf).toString("latin1");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("CONSTANCIA OFICIAL DE DISFRUTE DE VACACIONES");
    expect(text).toContain("Articulo 81");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);

    const makeClient = (status: string) =>
      ({
        from: vi.fn((table: string) => {
          if (table === "company_leaves") {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: buildLeaveRow({ status }),
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "company_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { company_name: "Hoteles Caribe", legal_name: null },
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
                  maybeSingle: async () => ({
                    data: {
                      id: "emp-1",
                      full_name: "Roberto Díaz",
                      job_title: "Recepcionista",
                      department: "Recepción",
                      hire_date: "2024-03-15",
                      base_salary_monthly: 15000,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      }) as unknown as SupabaseClient<Database>;

    const pendingCertService = new LeaveCertificateService(makeClient("pendiente"));
    await expect(
      pendingCertService.generateForCompany("comp-A", "leave-12345678")
    ).rejects.toThrow(/solo puede generarse para solicitudes aprobadas/);

    const approvedCertService = new LeaveCertificateService(makeClient("aprobada"));
    const generated = await approvedCertService.generateForCompany(
      "comp-A",
      "leave-12345678"
    );
    expect(generated.fileName).toBe("constancia-vacaciones-LEAVE-12.pdf");
    expect(Buffer.from(generated.pdf).toString("latin1")).toContain("Roberto Díaz");
  });
});
