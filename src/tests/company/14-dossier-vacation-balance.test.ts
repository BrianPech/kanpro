import { describe, test, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getMexicoDateISO } from "@/lib/formatters";
import { getEmployeeDossierById } from "@/modules/company/services/company-dossier";
import { CompanyLeavesService } from "@/modules/company/services/company-leaves";
import type { LeavesRepository, CompanyLeaveRow } from "@/modules/company/repositories/leaves.repository";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/modules/company/actions/dossier", () => ({
  uploadDossierDocumentAction: vi.fn(),
}));

vi.mock("@/modules/company/utils/dossier-exporter", () => ({
  exportDossierToPrintableDocument: vi.fn(),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  TabsList: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  TabsTrigger: ({ children }: { children: React.ReactNode }) => React.createElement("button", null, children),
  TabsContent: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

import { EmployeeDossierView } from "@/modules/company/components/dossier/employee-dossier-view";

function buildDossierSupabaseMock(options: {
  hireDate: string;
  leaves: Array<{
    id: string;
    company_id: string;
    employee_id: string | null;
    candidate_id: string | null;
    request_type: string;
    start_date: string;
    end_date: string;
    total_working_days: number;
    reason: string | null;
    status: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    rejection_reason: string | null;
    created_at: string;
  }>;
}) {
  const empRow = {
    id: "emp-ana-uuid",
    company_id: "comp-A",
    employee_id: "cand-ana-uuid",
    full_name: "qa-semana2c-Ana",
    job_title: "Cocinera Senior",
    department: "Cocina",
    hire_date: options.hireDate,
    base_salary_monthly: 11000,
    payment_frequency: "quincenal",
    email: "ana@empresa.test",
    phone: "+529991112233",
    rfc: "AANA900101XXX",
    curp: "AANA900101MYNRRA01",
    nss: null,
    work_schedule: "Lunes a Viernes (Jornada LFT)",
    avatar_url: null,
    emergency_contact: null,
    status: "active",
    termination_date: null,
    termination_reason: null,
    created_at: `${options.hireDate}T12:00:00.000Z`,
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

  return {
    from: vi.fn((table: string) => {
      if (table === "company_profiles") {
        return makeChain([], { company_name: "Hotel Caribe", legal_name: "Hotel Caribe S.A." });
      }
      if (table === "company_employees") {
        return makeChain([empRow], empRow);
      }
      if (table === "company_leaves") {
        return makeChain(options.leaves, options.leaves[0] || null);
      }
      if (table === "company_evaluations" || table === "company_contracts" || table === "profile_documents") {
        return makeChain([], null);
      }
      return makeChain([], null);
    }),
  } as unknown as SupabaseClient<Database>;
}

function getTwoYearsAgoISO(refDate: Date = new Date()): string {
  const [yStr, mStr, dStr] = getMexicoDateISO(refDate).split("-");
  const y = Number(yStr) - 2;
  const d = String(Math.min(28, Number(dStr))).padStart(2, "0");
  return `${y}-${mStr}-${d}`;
}

describe("B2: Balance de vacaciones en Expediente Digital 360 y validación en servidor", () => {
  test("Derecho 14 + solicitud aprobada de 3 días (07-09 dic 2026) -> tomados 3, disponible 11, 1 solicitud", async () => {
    const supabase = buildDossierSupabaseMock({
      hireDate: getTwoYearsAgoISO(),
      leaves: [
        {
          id: "leave-1",
          company_id: "comp-A",
          employee_id: "emp-ana-uuid",
          candidate_id: "cand-ana-uuid",
          request_type: "vacaciones",
          start_date: "2026-12-07",
          end_date: "2026-12-09",
          total_working_days: 3,
          reason: "Descanso decembrino",
          status: "aprobada",
          reviewed_at: "2026-11-21T12:00:00.000Z",
          reviewed_by: "Recursos Humanos",
          rejection_reason: null,
          created_at: "2026-11-20T12:00:00.000Z",
        },
      ],
    });

    const dossier = await getEmployeeDossierById(supabase, "emp-ana-uuid", "comp-A");
    expect(dossier).not.toBeNull();
    expect(dossier!.vacationBalance.totalDaysAccruedLFT).toBe(14);
    expect(dossier!.vacationBalance.daysTaken).toBe(3);
    expect(dossier!.vacationBalance.daysPendingApproval).toBe(0);
    expect(dossier!.vacationBalance.daysAvailable).toBe(11);
    expect(dossier!.vacationRequests).toHaveLength(1);
    expect(dossier!.vacationRequests[0].totalWorkingDays).toBe(3);
    expect(dossier!.vacationRequests[0].status).toBe("aprobada");

    const html = renderToStaticMarkup(React.createElement(EmployeeDossierView, { dossier: dossier! }));
    expect(html).not.toContain("Sin solicitudes de vacaciones");
    expect(html).toContain("3 días");
    expect(html).toContain("11 días");
    expect(html).toContain("2026-12-07");
  });

  test("Solicitud pendiente o visto_bueno reduce el saldo disponible sin sumar a días tomados", async () => {
    const supabase = buildDossierSupabaseMock({
      hireDate: getTwoYearsAgoISO(),
      leaves: [
        {
          id: "leave-pending",
          company_id: "comp-A",
          employee_id: "emp-ana-uuid",
          candidate_id: "cand-ana-uuid",
          request_type: "vacaciones",
          start_date: "2026-12-14",
          end_date: "2026-12-15",
          total_working_days: 2,
          reason: "Pendiente de RH",
          status: "visto_bueno",
          reviewed_at: null,
          reviewed_by: "Líder de Área (Vo.Bo.)",
          rejection_reason: null,
          created_at: "2026-11-21T12:00:00.000Z",
        },
      ],
    });

    const dossier = await getEmployeeDossierById(supabase, "emp-ana-uuid", "comp-A");
    expect(dossier!.vacationBalance.daysTaken).toBe(0);
    expect(dossier!.vacationBalance.daysPendingApproval).toBe(2);
    expect(dossier!.vacationBalance.daysAvailable).toBe(12);
    expect(dossier!.vacationRequests).toHaveLength(1);
  });

  test("Sin solicitudes -> tomados 0, disponible 14, arreglo vacío", async () => {
    const supabase = buildDossierSupabaseMock({
      hireDate: getTwoYearsAgoISO(),
      leaves: [],
    });

    const dossier = await getEmployeeDossierById(supabase, "emp-ana-uuid", "comp-A");
    expect(dossier!.vacationBalance.totalDaysAccruedLFT).toBe(14);
    expect(dossier!.vacationBalance.daysTaken).toBe(0);
    expect(dossier!.vacationBalance.daysAvailable).toBe(14);
    expect(dossier!.vacationRequests).toEqual([]);
  });

  test("CompanyLeavesService.createCompanyLeave valida saldo disponible de vacaciones en servidor", async () => {
    const fakeRepo: LeavesRepository = {
      create: vi.fn(async (_c, payload) => ({ ...payload, id: "leave-x" } as CompanyLeaveRow)),
      respond: vi.fn(),
      listByCompany: vi.fn(async () => []),
      listByEmployeeAndPeriod: vi.fn(async () => []),
      listPending: vi.fn(async () => []),
      balanceUsedDays: vi.fn(async () => 12),
      balanceCommittedDays: vi.fn(async () => 12),
    };

    const client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "emp-ana-uuid",
                  full_name: "qa-semana2c-Ana",
                  email: "ana@empresa.test",
                  employee_id: "cand-ana-uuid",
                  hire_date: getTwoYearsAgoISO(),
                  created_at: `${getTwoYearsAgoISO()}T00:00:00.000Z`,
                },
                error: null,
              }),
            }),
          }),
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    const service = new CompanyLeavesService(client, fakeRepo);

    // 14 total - 12 committed = 2 available; requesting 3 working days must fail on server
    await expect(
      service.createCompanyLeave("comp-A", {
        employeeId: "emp-ana-uuid",
        requestType: "vacaciones",
        startDate: "2026-12-07",
        endDate: "2026-12-09",
      })
    ).rejects.toThrow(/Saldo de vacaciones insuficiente/);
  });

  test("Nocturno 19:00-23:59 Cancún (00:00-04:59 UTC del día siguiente) mantiene 2 años cumplidos y 14 días LFT", async () => {
    vi.useFakeTimers();
    try {
      // 2026-11-22T02:30:00.000Z = 2026-11-21 21:30 America/Cancun
      vi.setSystemTime(new Date("2026-11-22T02:30:00.000Z"));
      const hireDate = getTwoYearsAgoISO();
      expect(hireDate).toBe("2024-11-21");

      const supabase = buildDossierSupabaseMock({
        hireDate,
        leaves: [],
      });

      const dossier = await getEmployeeDossierById(supabase, "emp-ana-uuid", "comp-A");
      expect(dossier).not.toBeNull();
      expect(dossier!.vacationBalance.yearsOfService).toBe(2);
      expect(dossier!.vacationBalance.totalDaysAccruedLFT).toBe(14);
      expect(dossier!.vacationBalance.daysAvailable).toBe(14);
    } finally {
      vi.useRealTimers();
    }
  });
});
