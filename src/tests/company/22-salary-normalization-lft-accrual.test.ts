import { describe, test, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getMexicoDateISO } from "@/lib/formatters";
import {
  calculateLFTVacationDays,
  calculateVacationPremium,
} from "@/modules/company/utils/vacation-calculator";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import type { EmployeeDossier } from "@/modules/company/types/employee-dossier";

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

function subtractMonthsFromISO(baseIso: string, monthsToSubtract: number): string {
  const [y, m, d] = baseIso.split("-").map(Number);
  const totalMonths = y * 12 + (m - 1) - monthsToSubtract;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const safeDay = Math.min(d, 28);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

describe("B4 + M5: Normalización salarial a equivalente mensual, prima vacacional y devengado proporcional LFT", () => {
  test("Prima vacacional con sueldo quincenal $11,000 y 14 días = $2,566.67 (salario diario $733.33)", () => {
    const byPeriodic = calculateVacationPremium(11000, 14, 0.25, "quincenal");
    const byMonthly = calculateVacationPremium(22000, 14);

    expect(byPeriodic.dailySalary).toBe(733.33);
    expect(byPeriodic.premiumAmount).toBe(2566.67);
    expect(byMonthly.dailySalary).toBe(733.33);
    expect(byMonthly.premiumAmount).toBe(2566.67);
  });

  test("Devengado proporcional LFT: hoy -> 0, 6 meses -> 6, 12 meses -> 12, fecha inválida -> 0", () => {
    const todayIso = getMexicoDateISO();

    const dayZero = calculateLFTVacationDays(todayIso);
    expect(dayZero.yearsOfService).toBe(0);
    expect(dayZero.totalDaysAccrued).toBe(0);
    expect(dayZero.currentYearEntitlement).toBe(12);

    const sixMonths = calculateLFTVacationDays(subtractMonthsFromISO(todayIso, 6));
    expect(sixMonths.yearsOfService).toBe(0);
    expect(sixMonths.totalDaysAccrued).toBe(6);
    expect(sixMonths.currentYearEntitlement).toBe(12);

    const twelveMonths = calculateLFTVacationDays(subtractMonthsFromISO(todayIso, 12));
    expect(twelveMonths.yearsOfService).toBe(1);
    expect(twelveMonths.totalDaysAccrued).toBe(12);
    expect(twelveMonths.currentYearEntitlement).toBe(14);

    const invalid = calculateLFTVacationDays("fecha-invalida");
    expect(invalid.yearsOfService).toBe(0);
    expect(invalid.totalDaysAccrued).toBe(0);
    expect(invalid.currentYearEntitlement).toBe(0);
  });

  test("CompanyEmployeeService.createEmployee y registerDirectEmployee normalizan quincenal $11,000 -> base_salary_monthly $22,000", async () => {
    const capturedCreates: Array<Record<string, unknown>> = [];
    const mockCreateSupabase = {
      from: vi.fn((table: string) => {
        if (table === "company_employees") {
          return {
            insert: vi.fn((payload: Record<string, unknown>) => {
              capturedCreates.push(payload);
              return {
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "emp-created-1", ...payload },
                    error: null,
                  }),
                })),
              };
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    await CompanyEmployeeService.createEmployee(mockCreateSupabase, "comp-1", {
      full_name: "qa-semana2c-Ana",
      job_title: "Cocinera",
      department: "Cocina",
      base_salary_monthly: 11000,
      payment_frequency: "quincenal",
    });

    expect(capturedCreates[0]?.base_salary_monthly).toBe(22000);
    expect(capturedCreates[0]?.payment_frequency).toBe("quincenal");

    const capturedDirect: Array<Record<string, unknown>> = [];
    const mockDirectAdmin = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          };
        }
        if (table === "company_employees") {
          return {
            insert: vi.fn((payload: Record<string, unknown>) => {
              capturedDirect.push(payload);
              return {
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "emp-direct-1", ...payload },
                    error: null,
                  }),
                })),
              };
            }),
          };
        }
        return {};
      }),
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-direct-1" } },
            error: null,
          }),
          deleteUser: vi.fn(),
        },
      },
    } as unknown as SupabaseClient<Database>;

    await CompanyEmployeeService.registerDirectEmployee(mockDirectAdmin, "comp-1", {
      full_name: "qa-semana2c-Ana",
      email: "qa-semana2c-ana@test.kanpro.local",
      password: "Password123!",
      confirm_password: "Password123!",
      force_password_change: true,
      job_title: "Cocinera",
      base_salary_monthly: 11000,
      payment_frequency: "quincenal",
    });

    expect(capturedDirect[0]?.base_salary_monthly).toBe(22000);
    expect(capturedDirect[0]?.payment_frequency).toBe("quincenal");
  });

  test("EmployeeDossierView muestra etiqueta dinámica 'Salario Bruto Quincenal' y '$11,000 MXN'", () => {
    const dossier: EmployeeDossier = {
      id: "emp-1",
      fullName: "qa-semana2c-Ana",
      avatarUrl: null,
      email: "ana@test.kanpro.local",
      phone: "+529991112233",
      emergencyContact: { name: "No especificado", phone: "No especificado", relationship: "No especificado" },
      rfc: "Pendiente",
      curp: "Pendiente",
      nss: "Pendiente",
      birthDate: "No especificado",
      address: "No especificado",
      nationality: "Mexicana",
      jobTitle: "Cocinera",
      department: "Cocina",
      branchName: "Sucursal Principal",
      hireDate: "2024-11-21",
      yearsOfServiceFormatted: "2 años",
      contractType: "indeterminado",
      contractTypeLabel: "Contrato Tiempo Indeterminado",
      contractStartDate: "2024-11-21",
      baseSalaryMonthly: 22000,
      dailyIntegratedSalary: 733.33,
      paymentFrequency: "quincenal",
      workSchedule: "Lunes a Viernes",
      status: "activo",
      documents: [],
      positionHistory: [
        {
          id: "ph-1",
          jobTitle: "Cocinera",
          department: "Cocina",
          startDate: "2024-11-21",
          endDate: "Actual",
          salary: 11000,
        },
      ],
      vacationBalance: {
        hireDate: "2024-11-21",
        yearsOfService: 2,
        totalDaysAccruedLFT: 14,
        daysTaken: 0,
        daysPendingApproval: 0,
        daysAvailable: 14,
        nextPeriodDate: "Ciclo 2027",
      },
      vacationRequests: [],
      performanceReviews: [],
      attendanceSummary: {
        punctualityRate: 100,
        totalDaysPresent: 0,
        totalLateArrivals: 0,
        totalAbsences: 0,
        totalOvertimeHours: 0,
      },
    };

    const html = renderToStaticMarkup(React.createElement(EmployeeDossierView, { dossier }));
    expect(html).toContain("Salario Bruto Quincenal");
    expect(html).not.toContain("Salario Bruto Mensual");
    expect(html).toContain("$11,000");
  });
});
