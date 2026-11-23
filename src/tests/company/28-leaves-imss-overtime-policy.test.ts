import { describe, expect, test } from "vitest";
import { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import { LftPolicyViolationError } from "@/modules/company/types/company-policies";
import {
  calculateImssDisabilityPayrollEffect,
  evaluateHourlyLeave,
  evaluateLeavePolicyEffect,
  evaluateOvertimePolicy,
  resolveCompanyVacationPolicy,
} from "@/modules/company/strategies/leaves-imss-overtime-policy.engine";

describe("Tarea 3: Incapacidad IMSS, catálogo de permisos, vacaciones, horas y tiempo extra", () => {
  test("incapacidad IMSS → nunca cuenta como falta ni se paga como salario ordinario", () => {
    const monthlySalary = 15000; // $500 diarios

    const sinComplemento = calculateImssDisabilityPayrollEffect({
      capture: {
        folio: "IMSS-QA-REGLAS-001",
        daysCovered: 5,
        branch: "enfermedad_general",
        startDate: "2026-11-18",
      },
      monthlySalary,
    });

    expect(sinComplemento.timezone).toBe(BUSINESS_TIME_ZONE);
    expect(sinComplemento.countsAsAbsence).toBe(false);
    expect(sinComplemento.paidAsOrdinarySalary).toBe(false);
    expect(sinComplemento.ordinarySalaryPaid).toBe(0);
    expect(sinComplemento.absenceDeduction).toBe(0);
    expect(sinComplemento.imssSubsidyHandledByImss).toBe(true);
    expect(sinComplemento.companyComplementPay).toBe(0);

    const conComplemento = calculateImssDisabilityPayrollEffect({
      capture: {
        folio: "IMSS-QA-REGLAS-002",
        daysCovered: 5,
        branch: "enfermedad_general",
        startDate: "2026-11-18",
      },
      monthlySalary,
      config: {
        imssComplement: {
          enabled: true,
          complementPercentage: 40,
          coverFirstThreeDays: true,
        },
      },
    });
    // Primeros 3 días al 40% (3 * 500 * 0.40 = 600) + 2 días restantes al 40% (2 * 500 * 0.40 = 400) = 1000
    expect(conComplemento.ordinarySalaryPaid).toBe(0);
    expect(conComplemento.absenceDeduction).toBe(0);
    expect(conComplemento.companyComplementPay).toBe(1000);
  });

  test("permiso con goce → se paga íntegro (100%)", () => {
    const monthlySalary = 15000; // $500 diarios

    const permisoConGoce = evaluateLeavePolicyEffect({
      requestType: "permiso_con_goce",
      days: 2,
      monthlySalary,
    });
    expect(permisoConGoce.paid).toBe(true);
    expect(permisoConGoce.payPercentage).toBe(100);
    expect(permisoConGoce.paidAmount).toBe(1000);
    expect(permisoConGoce.unpaidDeduction).toBe(0);
    expect(permisoConGoce.affectsSeventhDay).toBe(false);

    const paternidad = evaluateLeavePolicyEffect({
      requestType: "paternidad",
      days: 5,
      monthlySalary,
    });
    expect(paternidad.paid).toBe(true);
    expect(paternidad.paidAmount).toBe(2500);
    expect(paternidad.exceedsAnnualLimit).toBe(false);
  });

  test("permiso sin goce → afecta séptimo día, prima y bonos según config", () => {
    const monthlySalary = 15000; // $500 diarios

    const afectaTodo = evaluateLeavePolicyEffect({
      requestType: "permiso_sin_goce",
      days: 1,
      monthlySalary,
      config: {
        seventhDayMode: "proporcional",
        leaveCatalogue: {
          permiso_sin_goce: {
            paid: false,
            payPercentage: 0,
            affectsSeventhDay: true,
            affectsVacationPremium: true,
            affectsBonuses: true,
            maxDaysPerYear: null,
          },
        },
      },
    });
    expect(afectaTodo.paid).toBe(false);
    expect(afectaTodo.paidAmount).toBe(0);
    expect(afectaTodo.unpaidDeduction).toBe(583); // 500 * 1.1666
    expect(afectaTodo.affectsSeventhDay).toBe(true);
    expect(afectaTodo.affectsVacationPremium).toBe(true);
    expect(afectaTodo.affectsBonuses).toBe(true);

    const soloDia = evaluateLeavePolicyEffect({
      requestType: "permiso_sin_goce",
      days: 1,
      monthlySalary,
      config: {
        leaveCatalogue: {
          permiso_sin_goce: {
            paid: false,
            payPercentage: 0,
            affectsSeventhDay: false,
            affectsVacationPremium: false,
            affectsBonuses: false,
            maxDaysPerYear: null,
          },
        },
      },
    });
    expect(soloDia.unpaidDeduction).toBe(500);
    expect(soloDia.affectsSeventhDay).toBe(false);
    expect(soloDia.affectsVacationPremium).toBe(false);
    expect(soloDia.affectsBonuses).toBe(false);
  });

  test("vacaciones por debajo del Art. 76 LFT → rechazadas; superiores → aceptadas", () => {
    expect(() =>
      resolveCompanyVacationPolicy({
        vacationRules: { daysByYearOverrides: { 1: 8 } },
      })
    ).toThrow(LftPolicyViolationError);

    const valid = resolveCompanyVacationPolicy({
      vacationRules: {
        daysByYearOverrides: { 1: 14 },
        premiumPercentage: 30,
      },
    });
    expect(valid.strategy.getDaysForYear(1)).toBe(14);
    expect(valid.strategy.getDaysForYear(2)).toBe(14);
    expect(valid.strategy.getDaysForYear(3)).toBe(16);
    expect(valid.premiumPercentage).toBe(30);
  });

  test("permisos por horas y horas extras con o sin autorización previa", () => {
    const hourlyOk = evaluateHourlyLeave({
      requestedMinutes: 75,
      alreadyUsedHoursThisMonth: 2,
      config: { hourlyLeaveRules: { enabled: true, minIncrementMinutes: 30, maxHoursPerDay: 4, monthlyCapHours: 8 } },
    });
    expect(hourlyOk).toEqual({ allowed: true, billedHours: 1.5 });

    const hourlyOverCap = evaluateHourlyLeave({
      requestedMinutes: 120,
      alreadyUsedHoursThisMonth: 7,
      config: { hourlyLeaveRules: { enabled: true, minIncrementMinutes: 60, maxHoursPerDay: 4, monthlyCapHours: 8 } },
    });
    expect(hourlyOverCap.allowed).toBe(false);

    // Salario mensual 24000 -> diario 800 -> hora 100
    const strictOvertime = evaluateOvertimePolicy({
      entries: [
        { work_date: "2026-11-18", hours: 4, authorized: false },
        { work_date: "2026-11-19", hours: 11, authorized: true },
      ],
      monthlySalary: 24000,
      config: {
        overtimeRules: {
          requiresPriorAuthorization: true,
          doubleRateMultiplier: 2,
          tripleRateMultiplier: 3,
          maxDoubleHoursPerWeek: 9,
        },
      },
    });
    expect(strictOvertime.timezone).toBe(BUSINESS_TIME_ZONE);
    expect(strictOvertime.unauthorizedHoursExcluded).toBe(4);
    expect(strictOvertime.doubleHours).toBe(9);
    expect(strictOvertime.tripleHours).toBe(2);
    expect(strictOvertime.doublePay).toBe(1800); // 9 * 100 * 2
    expect(strictOvertime.triplePay).toBe(600); // 2 * 100 * 3
    expect(strictOvertime.totalOvertimePay).toBe(2400);

    const openOvertime = evaluateOvertimePolicy({
      entries: [{ work_date: "2026-11-18", hours: 4, authorized: false }],
      monthlySalary: 24000,
      config: { overtimeRules: { requiresPriorAuthorization: false } },
    });
    expect(openOvertime.unauthorizedHoursExcluded).toBe(0);
    expect(openOvertime.authorizedHoursPaid).toBe(4);
    expect(openOvertime.totalOvertimePay).toBe(800);

    // 12h en la misma semana (con config por defecto): 9 a 2x ($1,800) + 3 a 3x ($900) = $2,700
    const sameWeekTwelve = evaluateOvertimePolicy({
      entries: [
        { work_date: "2026-10-05", hours: 6, authorized: true },
        { work_date: "2026-10-08", hours: 6, authorized: true },
      ],
      monthlySalary: 24000,
    });
    expect(sameWeekTwelve.doubleHours).toBe(9);
    expect(sameWeekTwelve.tripleHours).toBe(3);
    expect(sameWeekTwelve.totalOvertimePay).toBe(2700);

    // 6h semana 1 + 6h semana 2: cada semana bajo el tope de 9h -> 12h a 2x ($2,400)
    const twoWeeksTwelve = evaluateOvertimePolicy({
      entries: [
        { work_date: "2026-10-05", hours: 6, authorized: true },
        { work_date: "2026-10-12", hours: 6, authorized: true },
      ],
      monthlySalary: 24000,
    });
    expect(twoWeeksTwelve.doubleHours).toBe(12);
    expect(twoWeeksTwelve.tripleHours).toBe(0);
    expect(twoWeeksTwelve.totalOvertimePay).toBe(2400);
  });
});
