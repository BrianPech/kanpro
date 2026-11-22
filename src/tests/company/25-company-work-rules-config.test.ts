import { describe, expect, test } from "vitest";
import { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import {
  DEFAULT_COMPANY_WORK_RULES_CONFIG,
  FELIPE_INVARIANTS,
  parseCompanyWorkRulesConfig,
  safeParseCompanyWorkRulesConfig,
} from "@/modules/company/strategies/company-policies.parser";
import { LftPolicyViolationError } from "@/modules/company/types/company-policies";

describe("Tarea 0: Reglas de mi empresa — CompanyWorkRulesConfig", () => {
  test("NULL, undefined o no-objeto retornan defaults LFT con BUSINESS_TIME_ZONE", () => {
    expect(parseCompanyWorkRulesConfig(null)).toEqual(DEFAULT_COMPANY_WORK_RULES_CONFIG);
    expect(parseCompanyWorkRulesConfig(undefined)).toEqual(DEFAULT_COMPANY_WORK_RULES_CONFIG);
    expect(parseCompanyWorkRulesConfig("invalido")).toEqual(DEFAULT_COMPANY_WORK_RULES_CONFIG);
    expect(parseCompanyWorkRulesConfig([])).toEqual(DEFAULT_COMPANY_WORK_RULES_CONFIG);
    expect(parseCompanyWorkRulesConfig(42)).toEqual(DEFAULT_COMPANY_WORK_RULES_CONFIG);

    const parsed = parseCompanyWorkRulesConfig(null);
    expect(parsed.timezone).toBe(BUSINESS_TIME_ZONE);
    expect(parsed.timezone).toBe("America/Cancun");
    expect(parsed.delaysPerAbsence).toBe(3);
    expect(parsed.vacationRules.premiumPercentage).toBe(25);
    expect(parsed.overtimeRules.requiresPriorAuthorization).toBe(true);
    expect(parsed.overtimeRules.doubleRateMultiplier).toBe(2);
    expect(parsed.overtimeRules.tripleRateMultiplier).toBe(3);
    expect(parsed.invariants).toEqual(FELIPE_INVARIANTS);
  });

  test("campos con tipos o rangos inválidos caen individualmente a defaults LFT", () => {
    const parsed = parseCompanyWorkRulesConfig({
      delaysPerAbsence: 0,
      delayDeductionDays: 2,
      toleranceMinutes: 500,
      resetPeriod: "anual",
      seventhDayMode: "invalido",
      earlyDepartureMode: "desconocido",
      compTimeMode: 123,
      payrollPeriodicity: "diaria",
      incidentCutoffDay: 99,
      hourlyLeaveRules: {
        enabled: "si",
        minIncrementMinutes: 10,
        maxHoursPerDay: 24,
        monthlyCapHours: -5,
      },
      punctualityBonus: {
        enabled: "si",
        amount: -100,
        type: "crypto",
        cancelledBy: ["retardo", "inventada"],
      },
    });

    expect(parsed.delaysPerAbsence).toBe(DEFAULT_COMPANY_WORK_RULES_CONFIG.delaysPerAbsence);
    expect(parsed.earlyDepartureMode).toBe(DEFAULT_COMPANY_WORK_RULES_CONFIG.earlyDepartureMode);
    expect(parsed.compTimeMode).toBe(DEFAULT_COMPANY_WORK_RULES_CONFIG.compTimeMode);
    expect(parsed.payrollPeriodicity).toBe(DEFAULT_COMPANY_WORK_RULES_CONFIG.payrollPeriodicity);
    expect(parsed.incidentCutoffDay).toBe(DEFAULT_COMPANY_WORK_RULES_CONFIG.incidentCutoffDay);
    expect(parsed.hourlyLeaveRules).toEqual(DEFAULT_COMPANY_WORK_RULES_CONFIG.hourlyLeaveRules);
    expect(parsed.punctualityBonus).toEqual({
      enabled: false,
      amount: 0,
      type: "fixed",
      cancelledBy: ["retardo"],
    });
  });

  test("config parcial se mezcla con defaults LFT y respeta valores superiores a LFT", () => {
    const parsed = parseCompanyWorkRulesConfig({
      toleranceMinutes: 10,
      delaysPerAbsence: 4,
      delayDeductionDays: 0.5,
      resetPeriod: "semanal",
      earlyDepartureMode: "retardo_equivalente",
      compTimeMode: "banco_horas",
      seventhDayMode: "completo",
      clarificationWindowDays: 5,
      scope: {
        uniformTolerance: false,
        jobTitles: ["Recepcionista", "Recepcionista", " Cocinero "],
        shifts: ["Nocturno"],
        branches: ["Cancún Zona Hotelera"],
      },
      imssComplement: {
        enabled: true,
        complementPercentage: 40,
        coverFirstThreeDays: true,
      },
      leaveCatalogue: {
        permiso_sin_goce: {
          paid: false,
          payPercentage: 0,
          affectsSeventhDay: true,
          affectsVacationPremium: false,
          affectsBonuses: true,
          maxDaysPerYear: 10,
        },
      },
      vacationRules: {
        daysByYearOverrides: { 1: 15, 2: 18 },
        premiumPercentage: 35,
        allowCarryOver: true,
        maxCarryOverDays: 5,
      },
      hourlyLeaveRules: {
        enabled: true,
        minIncrementMinutes: 30,
        maxHoursPerDay: 2,
        monthlyCapHours: 6,
      },
      overtimeRules: {
        requiresPriorAuthorization: true,
        doubleRateMultiplier: 2,
        tripleRateMultiplier: 3,
        maxDoubleHoursPerWeek: 9,
      },
      payrollPeriodicity: "catorcenal",
      incidentCutoffDay: 12,
      punctualityBonus: {
        enabled: true,
        amount: 500,
        type: "fixed",
        cancelledBy: ["retardo", "falta_injustificada"],
      },
      attendanceBonus: {
        enabled: true,
        amount: 10,
        type: "percentage",
        cancelledBy: ["falta_injustificada"],
      },
    });

    expect(parsed.toleranceMinutes).toBe(10);
    expect(parsed.delaysPerAbsence).toBe(4);
    expect(parsed.delayDeductionDays).toBe(0.5);
    expect(parsed.earlyDepartureMode).toBe("retardo_equivalente");
    expect(parsed.compTimeMode).toBe("banco_horas");
    expect(parsed.scope.jobTitles).toEqual(["Recepcionista", "Cocinero"]);
    expect(parsed.imssComplement).toEqual({
      enabled: true,
      complementPercentage: 40,
      coverFirstThreeDays: true,
      countsAsAbsence: false,
      paidAsOrdinarySalary: false,
    });
    expect(parsed.leaveCatalogue.permiso_sin_goce.maxDaysPerYear).toBe(10);
    expect(parsed.leaveCatalogue.permiso_con_goce).toEqual(
      DEFAULT_COMPANY_WORK_RULES_CONFIG.leaveCatalogue.permiso_con_goce
    );
    expect(parsed.vacationRules).toEqual({
      daysByYearOverrides: { 1: 15, 2: 18 },
      premiumPercentage: 35,
      allowCarryOver: true,
      maxCarryOverDays: 5,
    });
    expect(parsed.payrollPeriodicity).toBe("catorcenal");
    expect(parsed.incidentCutoffDay).toBe(12);
    expect(parsed.punctualityBonus.enabled).toBe(true);
    expect(parsed.attendanceBonus.type).toBe("percentage");
  });

  test("guardrail LFT: rechaza vacaciones menores al Art. 76, prima < 25% y horas extra menores a LFT", () => {
    expect(() =>
      parseCompanyWorkRulesConfig({
        vacationRules: { daysByYearOverrides: { 1: 10 } },
      })
    ).toThrow(LftPolicyViolationError);

    const lowYear6 = safeParseCompanyWorkRulesConfig({
      vacationRules: { daysByYearOverrides: { 6: 20 } },
    });
    expect(lowYear6.success).toBe(false);
    if (!lowYear6.success) {
      expect(lowYear6.violations[0]).toContain("Art. 76 LFT");
    }

    const lowPremium = safeParseCompanyWorkRulesConfig({
      vacationRules: { premiumPercentage: 20 },
    });
    expect(lowPremium.success).toBe(false);
    if (!lowPremium.success) {
      expect(lowPremium.violations[0]).toContain("Art. 80 LFT");
    }

    const lowOvertime = safeParseCompanyWorkRulesConfig({
      overtimeRules: {
        doubleRateMultiplier: 1.5,
        tripleRateMultiplier: 2.5,
        maxDoubleHoursPerWeek: 12,
      },
    });
    expect(lowOvertime.success).toBe(false);
    if (!lowOvertime.success) {
      expect(lowOvertime.violations).toHaveLength(3);
    }

    const lowPaternity = safeParseCompanyWorkRulesConfig({
      leaveCatalogue: { paternidad: { maxDaysPerYear: 3 } },
    });
    expect(lowPaternity.success).toBe(false);
    if (!lowPaternity.success) {
      expect(lowPaternity.violations[0]).toContain("Art. 132 XXVII Bis LFT");
    }
  });

  test("invariantes de Felipe: incapacidad IMSS, permiso con goce íntegro y séptimo día", () => {
    const imssAsAbsence = safeParseCompanyWorkRulesConfig({
      imssComplement: { countsAsAbsence: true },
    });
    expect(imssAsAbsence.success).toBe(false);

    const imssAsSalary = safeParseCompanyWorkRulesConfig({
      imssComplement: { paidAsOrdinarySalary: true },
    });
    expect(imssAsSalary.success).toBe(false);

    const unpaidConGoce = safeParseCompanyWorkRulesConfig({
      leaveCatalogue: {
        permiso_con_goce: { paid: false, payPercentage: 50 },
      },
    });
    expect(unpaidConGoce.success).toBe(false);
    if (!unpaidConGoce.success) {
      expect(unpaidConGoce.violations.length).toBeGreaterThanOrEqual(2);
    }

    const brokenSeventhDay = safeParseCompanyWorkRulesConfig({
      invariants: { seventhDayEarnedByWorkedDays: false },
    });
    expect(brokenSeventhDay.success).toBe(false);
  });
});
