import { describe, expect, test } from "vitest";
import { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import {
  calculateAbsenceAndDisciplinaryImpact,
  calculateSeventhDayEntitlement,
} from "@/modules/company/strategies/absence-disciplinary-policy.engine";
import { safeParseCompanyWorkRulesConfig } from "@/modules/company/strategies/company-policies.parser";
import { computeClarificationDeadline } from "@/modules/company/strategies/incident-payroll-impact.strategy";
import { calculateAbsenceDeduction } from "@/modules/company/utils/payroll-calculator";

describe("Tarea 2: Faltas, séptimo día, por_aclarar y suspensiones disciplinarias", () => {
  test("falta injustificada con séptimo día completo, proporcional (1.1666) y ninguno", () => {
    const monthlySalary = 15000; // $500 diarios

    expect(calculateAbsenceDeduction(monthlySalary, 1, "ninguno")).toBe(500);
    expect(calculateAbsenceDeduction(monthlySalary, 1, "proporcional")).toBe(
      Math.round(500 * 1.1666)
    );
    expect(calculateAbsenceDeduction(monthlySalary, 1, "completo")).toBe(1000);

    const baseIncident = [
      {
        category: "falta_injustificada" as const,
        status: "aprobado",
        incident_date: "2026-11-18",
      },
    ];

    const ninguno = calculateAbsenceAndDisciplinaryImpact({
      incidents: baseIncident,
      attendance: [],
      monthlySalary,
      config: { seventhDayMode: "ninguno" },
    });
    expect(ninguno.timezone).toBe(BUSINESS_TIME_ZONE);
    expect(ninguno.absenceDeduction).toBe(500);

    const proporcional = calculateAbsenceAndDisciplinaryImpact({
      incidents: baseIncident,
      attendance: [],
      monthlySalary,
      config: { seventhDayMode: "proporcional" },
    });
    expect(proporcional.absenceDeduction).toBe(583);

    const completo = calculateAbsenceAndDisciplinaryImpact({
      incidents: baseIncident,
      attendance: [],
      monthlySalary,
      config: { seventhDayMode: "completo" },
    });
    expect(completo.absenceDeduction).toBe(1000);
  });

  test("por_aclarar → falta_injustificada al vencer la ventana sin justificante", () => {
    const deadline = computeClarificationDeadline("2026-11-15", 3); // vence 2026-11-18 23:59:59-05:00
    const afterDeadline = new Date("2026-11-19T12:00:00-05:00");

    const result = calculateAbsenceAndDisciplinaryImpact({
      incidents: [
        {
          category: "permiso",
          status: "por_aclarar",
          incident_date: "2026-11-15",
          clarification_deadline: deadline,
          evidence_url: null,
        },
      ],
      attendance: [],
      monthlySalary: 15000,
      config: { seventhDayMode: "ninguno" },
      now: afterDeadline,
    });

    expect(result.expiredToAbsenceCount).toBe(1);
    expect(result.unjustifiedAbsencesCount).toBe(1);
    expect(result.absenceDeduction).toBe(500);
  });

  test("falta en por_aclarar con justificante entregado a tiempo → no se descuenta", () => {
    const deadline = computeClarificationDeadline("2026-11-15", 3);
    const afterDeadline = new Date("2026-11-20T12:00:00-05:00");

    const result = calculateAbsenceAndDisciplinaryImpact({
      incidents: [
        {
          category: "permiso",
          status: "por_aclarar",
          incident_date: "2026-11-15",
          clarification_deadline: deadline,
          evidence_url: "comp-1/receta-qa-reglas.pdf",
          justified_at: "2026-11-17T10:00:00-05:00",
        },
      ],
      attendance: [],
      monthlySalary: 15000,
      config: { seventhDayMode: "proporcional" },
      now: afterDeadline,
    });

    expect(result.justifiedOnTimeCount).toBe(1);
    expect(result.expiredToAbsenceCount).toBe(0);
    expect(result.unjustifiedAbsencesCount).toBe(0);
    expect(result.totalDeduction).toBe(0);
  });

  test("suspensión disciplinaria y falta administrativa según el modo configurado y guardrail Art. 423 LFT", () => {
    const monthlySalary = 15000; // $500 diarios
    const suspensionIncident = [
      {
        category: "suspension" as const,
        status: "aprobado",
        incident_date: "2026-11-18",
      },
      {
        category: "incumplimiento" as const,
        status: "aprobado",
        incident_date: "2026-11-19",
      },
    ];

    const conGoce = calculateAbsenceAndDisciplinaryImpact({
      incidents: suspensionIncident,
      attendance: [],
      monthlySalary,
      config: {
        disciplinaryRules: {
          suspensionMode: "con_goce",
          administrativeFaultMode: "con_goce",
        },
      },
    });
    expect(conGoce.suspensionDeduction).toBe(0);
    expect(conGoce.administrativeFaultDeduction).toBe(0);

    const soloDia = calculateAbsenceAndDisciplinaryImpact({
      incidents: suspensionIncident,
      attendance: [],
      monthlySalary,
      config: {
        seventhDayMode: "proporcional",
        disciplinaryRules: {
          suspensionMode: "sin_goce_solo_dia",
          administrativeFaultMode: "sin_goce_solo_dia",
        },
      },
    });
    expect(soloDia.suspensionDeduction).toBe(500);
    expect(soloDia.administrativeFaultDeduction).toBe(500);
    expect(soloDia.totalDeduction).toBe(1000);

    const conSeptimo = calculateAbsenceAndDisciplinaryImpact({
      incidents: suspensionIncident,
      attendance: [],
      monthlySalary,
      config: {
        seventhDayMode: "proporcional",
        disciplinaryRules: {
          suspensionMode: "sin_goce_con_septimo",
          administrativeFaultMode: "con_goce",
        },
      },
    });
    expect(conSeptimo.suspensionDeduction).toBe(583);
    expect(conSeptimo.administrativeFaultDeduction).toBe(0);

    // Guardrail LFT Art. 423 frac. X: suspensión > 8 días rechazada
    const invalidSuspension = safeParseCompanyWorkRulesConfig({
      disciplinaryRules: { maxSuspensionDays: 10 },
    });
    expect(invalidSuspension.success).toBe(false);
    if (!invalidSuspension.success) {
      expect(invalidSuspension.violations[0]).toContain("Art. 423 frac. X LFT");
    }
  });

  test("séptimo día se gana con los días trabajados e incapacidad IMSS nunca cuenta como falta", () => {
    expect(
      calculateSeventhDayEntitlement({
        workedDays: 6,
        scheduledWorkDays: 6,
        seventhDayMode: "proporcional",
      })
    ).toEqual({ earnedRatio: 1, lostSeventhDayRatio: 0 });

    expect(
      calculateSeventhDayEntitlement({
        workedDays: 5,
        scheduledWorkDays: 6,
        seventhDayMode: "proporcional",
      })
    ).toEqual({ earnedRatio: 0.8333, lostSeventhDayRatio: 0.1667 });

    const imssResult = calculateAbsenceAndDisciplinaryImpact({
      incidents: [
        {
          category: "incapacidad",
          status: "aprobado",
          incident_date: "2026-11-18",
        },
      ],
      attendance: [],
      monthlySalary: 15000,
    });
    expect(imssResult.imssDisabilitiesExcluded).toBe(1);
    expect(imssResult.unjustifiedAbsencesCount).toBe(0);
    expect(imssResult.totalDeduction).toBe(0);
  });
});
