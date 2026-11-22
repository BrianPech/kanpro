import { describe, expect, test, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  WORK_RULES_PRESETS,
  CompanyWorkRulesPanel,
} from "@/modules/company/components/settings/company-work-rules-panel";
import { IncidentsView } from "@/modules/company/components/incidents-view";
import { PayrollView } from "@/modules/company/components/payroll-view";
import { parseCompanyWorkRulesConfig } from "@/modules/company/strategies/company-policies.parser";
import { getMexicoDateISO } from "@/lib/formatters";

vi.mock("@/modules/company/actions/settings", () => ({
  updatePayrollImpactConfigAction: vi.fn(async () => ({ success: true })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard/company/payroll",
}));

describe("Tarea 5: UI Reglas de mi empresa, Panel Impacto en Nómina y Desglose en Nómina", () => {
  test("CompanyWorkRulesPanel renderiza los 3 presets y las 4 secciones", () => {
    expect(WORK_RULES_PRESETS.map((p) => p.id)).toEqual([
      "estandar",
      "flexible",
      "estricta",
    ]);

    const html = renderToStaticMarkup(
      React.createElement(CompanyWorkRulesPanel, {
        companyId: "comp-qa-reglas",
        initialPayrollImpactConfig: null,
        initialLeaveApprovalMode: "single_step",
      })
    );

    expect(html).toContain("Estándar (LFT)");
    expect(html).toContain("Flexible");
    expect(html).toContain("Estricta");
    expect(html).toContain("Valores propuestos, a confirmar con RH");
    expect(html).toContain("1. Puntualidad y retardos");
    expect(html).toContain("2. Faltas, aclaraciones y séptimo día");
    expect(html).toContain("3. Incapacidades IMSS, permisos, vacaciones y horas extra");
    expect(html).toContain("4. Periodicidad de nómina, corte y bonos");
  });

  test("IncidentsView muestra el panel Impacto en Nómina con retardos acumulados y faltas equivalentes", () => {
    const todayISO = getMexicoDateISO();

    const html = renderToStaticMarkup(
      React.createElement(IncidentsView, {
        payrollImpactConfig: WORK_RULES_PRESETS[0].patch,
        initialIncidents: [
          {
            id: "inc-1",
            employeeId: "emp-qa-1",
            employeeName: "qa-reglas-Carlos",
            jobTitle: "Cocinero",
            department: "Cocina",
            category: "retardo",
            categoryLabel: "Retardo",
            title: "Retardo 1",
            description: "Llegó 12 min tarde",
            incidentDate: todayISO,
            severity: "baja",
            responsibleSupervisor: "RH",
            status: "aprobado",
            createdAt: `${todayISO}T12:00:00Z`,
          },
          {
            id: "inc-2",
            employeeId: "emp-qa-1",
            employeeName: "qa-reglas-Carlos",
            jobTitle: "Cocinero",
            department: "Cocina",
            category: "retardo",
            categoryLabel: "Retardo",
            title: "Retardo 2",
            description: "Llegó 15 min tarde",
            incidentDate: todayISO,
            severity: "baja",
            responsibleSupervisor: "RH",
            status: "aprobado",
            createdAt: `${todayISO}T12:00:00Z`,
          },
          {
            id: "inc-3",
            employeeId: "emp-qa-1",
            employeeName: "qa-reglas-Carlos",
            jobTitle: "Cocinero",
            department: "Cocina",
            category: "retardo",
            categoryLabel: "Retardo",
            title: "Retardo 3",
            description: "Llegó 18 min tarde",
            incidentDate: todayISO,
            severity: "baja",
            responsibleSupervisor: "RH",
            status: "aprobado",
            createdAt: `${todayISO}T12:00:00Z`,
          },
        ],
      })
    );

    expect(html).toContain("Impacto en Nómina");
    expect(html).toContain("qa-reglas-Carlos");
    expect(html).toContain("3 retardo(s) → 1 falta(s) equiv.");
    expect(html).toContain("Impacta nómina");
  });

  test("PayrollView muestra desglose '3 retardos → 1 falta' y badge 'absorbida por asistencia'", () => {
    const html = renderToStaticMarkup(
      React.createElement(PayrollView, {
        payrollSummary: {
          periodId: "per-qa-1",
          periodName: "2ª Quincena Noviembre 2026",
          periodType: "quincenal",
          startDate: "2026-11-16",
          endDate: "2026-11-30",
          payoutDate: "2026-11-30",
          status: "borrador",
          totalGross: 7500,
          totalOvertime: 0,
          totalBonuses: 0,
          totalDeductions: 583,
          totalNet: 6917,
          employeesCount: 1,
          employees: [
            {
              id: "pay-emp-1",
              employeeId: "emp-qa-1",
              employeeName: "qa-reglas-Carlos",
              jobTitle: "Cocinero",
              department: "Cocina",
              baseSalaryPeriod: 7500,
              daysWorked: 14,
              overtimeHours: 0,
              overtimePay: 0,
              punctualityBonus: 0,
              attendanceBonus: 0,
              performanceBonus: 0,
              unjustifiedAbsences: 1,
              absenceDeductions: 583,
              lateArrivals: 0,
              delayDeductions: 0,
              imssDeduction: 0,
              isrEstimated: 0,
              incidentDelays: 3,
              absenceEquivalents: 1,
              delayAbsenceEquivalents: 1,
              delayConversionDeduction: 583,
              delaysPerAbsenceRule: 3,
              delayDeductionDaysRule: 1,
              absorbedIncidentsCount: 1,
              totalPerceptions: 7500,
              totalDeductions: 583,
              netPayEstimated: 6917,
            },
          ],
        },
      })
    );

    expect(html).toContain("3 retardos → 1 falta (−$583)");
    expect(html).toContain("1 absorbida por asistencia");
  });

  test("presets generan configs válidos al pasar por parseCompanyWorkRulesConfig", () => {
    for (const preset of WORK_RULES_PRESETS) {
      const parsed = parseCompanyWorkRulesConfig(preset.patch);
      expect(parsed.toleranceMinutes).toBe(preset.patch.toleranceMinutes);
      expect(parsed.delaysPerAbsence).toBe(preset.patch.delaysPerAbsence);
      expect(parsed.delayDeductionDays).toBe(preset.patch.delayDeductionDays);
      expect(parsed.resetPeriod).toBe(preset.patch.resetPeriod);
    }
  });
});
