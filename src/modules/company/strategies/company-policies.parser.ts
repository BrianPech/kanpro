import { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import {
  DEFAULT_PAYROLL_IMPACT_CONFIG,
  parsePayrollImpactConfig,
} from "./incident-payroll-impact.strategy";
import { DEFAULT_VACATION_POLICY } from "./vacation-policy.strategy";
import type { IncidentCategory } from "../types/incidents";
import {
  LftPolicyViolationError,
  type AttendanceBonusConfig,
  type BonusAmountType,
  type CompanyWorkRulesConfig,
  type CompTimeMode,
  type EarlyDepartureMode,
  type FelipeInvariants,
  type HourlyLeaveRulesConfig,
  type ImssComplementConfig,
  type LeaveCatalogueConfig,
  type LeaveCatalogueKey,
  type LeaveRuleConfig,
  type OvertimeRulesConfig,
  type PayrollPeriodicity,
  type VacationRulesConfig,
} from "../types/company-policies";

export const FELIPE_INVARIANTS: FelipeInvariants = Object.freeze({
  imssDisabilityCountsAsAbsence: false,
  imssDisabilityPaidAsOrdinarySalary: false,
  paidLeavePaidInFull: true,
  seventhDayEarnedByWorkedDays: true,
});

const DEFAULT_LEAVE_CATALOGUE: LeaveCatalogueConfig = {
  vacaciones: {
    paid: true,
    payPercentage: 100,
    affectsSeventhDay: false,
    affectsVacationPremium: false,
    affectsBonuses: false,
    maxDaysPerYear: null,
  },
  permiso_con_goce: {
    paid: true,
    payPercentage: 100,
    affectsSeventhDay: false,
    affectsVacationPremium: false,
    affectsBonuses: false,
    maxDaysPerYear: null,
  },
  permiso_sin_goce: {
    paid: false,
    payPercentage: 0,
    affectsSeventhDay: true,
    affectsVacationPremium: false,
    affectsBonuses: true,
    maxDaysPerYear: null,
  },
  dias_economicos: {
    paid: true,
    payPercentage: 100,
    affectsSeventhDay: false,
    affectsVacationPremium: false,
    affectsBonuses: false,
    maxDaysPerYear: 5,
  },
  matrimonio: {
    paid: true,
    payPercentage: 100,
    affectsSeventhDay: false,
    affectsVacationPremium: false,
    affectsBonuses: false,
    maxDaysPerYear: 5,
  },
  paternidad: {
    paid: true,
    payPercentage: 100,
    affectsSeventhDay: false,
    affectsVacationPremium: false,
    affectsBonuses: false,
    maxDaysPerYear: 5,
  },
  maternidad: {
    paid: true,
    payPercentage: 100,
    affectsSeventhDay: false,
    affectsVacationPremium: false,
    affectsBonuses: false,
    maxDaysPerYear: 84,
  },
  luto: {
    paid: true,
    payPercentage: 100,
    affectsSeventhDay: false,
    affectsVacationPremium: false,
    affectsBonuses: false,
    maxDaysPerYear: 3,
  },
};

export const DEFAULT_COMPANY_WORK_RULES_CONFIG: CompanyWorkRulesConfig = {
  ...DEFAULT_PAYROLL_IMPACT_CONFIG,
  timezone: BUSINESS_TIME_ZONE,
  earlyDepartureMode: "descuento_proporcional",
  compTimeMode: "tiempo_por_tiempo",
  imssComplement: {
    enabled: false,
    complementPercentage: 0,
    coverFirstThreeDays: false,
    countsAsAbsence: false,
    paidAsOrdinarySalary: false,
  },
  leaveCatalogue: DEFAULT_LEAVE_CATALOGUE,
  vacationRules: {
    daysByYearOverrides: {},
    premiumPercentage: 25,
    allowCarryOver: false,
    maxCarryOverDays: 0,
  },
  hourlyLeaveRules: {
    enabled: true,
    minIncrementMinutes: 60,
    maxHoursPerDay: 4,
    monthlyCapHours: 8,
  },
  overtimeRules: {
    requiresPriorAuthorization: true,
    doubleRateMultiplier: 2,
    tripleRateMultiplier: 3,
    maxDoubleHoursPerWeek: 9,
  },
  payrollPeriodicity: "quincenal",
  incidentCutoffDay: 15,
  punctualityBonus: {
    enabled: false,
    amount: 0,
    type: "fixed",
    cancelledBy: ["retardo", "falta_injustificada", "suspension"],
  },
  attendanceBonus: {
    enabled: false,
    amount: 0,
    type: "fixed",
    cancelledBy: ["falta_injustificada", "suspension"],
  },
  invariants: FELIPE_INVARIANTS,
};

const VALID_EARLY_DEPARTURE_MODES = new Set<EarlyDepartureMode>([
  "descuento_proporcional",
  "retardo_equivalente",
  "solo_registro",
]);

const VALID_COMP_TIME_MODES = new Set<CompTimeMode>([
  "ninguno",
  "tiempo_por_tiempo",
  "banco_horas",
]);

const VALID_PERIODICITIES = new Set<PayrollPeriodicity>([
  "semanal",
  "catorcenal",
  "quincenal",
  "mensual",
]);

const VALID_BONUS_TYPES = new Set<BonusAmountType>(["fixed", "percentage"]);

const VALID_INCIDENT_CATEGORIES = new Set<IncidentCategory>([
  "falta_injustificada",
  "retardo",
  "accidente",
  "queja",
  "permiso",
  "suspension",
  "incumplimiento",
  "reconocimiento",
  "incapacidad",
  "otro",
]);

const PAID_LEAVE_KEYS = new Set<LeaveCatalogueKey>([
  "vacaciones",
  "permiso_con_goce",
  "dias_economicos",
  "matrimonio",
  "paternidad",
  "maternidad",
  "luto",
]);

const LEAVE_KEYS: readonly LeaveCatalogueKey[] = [
  "vacaciones",
  "permiso_con_goce",
  "permiso_sin_goce",
  "dias_economicos",
  "matrimonio",
  "paternidad",
  "maternidad",
  "luto",
];

function isPlainObject(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw);
}

function isFiniteNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

function parseIntInRange(raw: unknown, min: number, max: number, fallback: number): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= min && raw <= max) {
    return raw;
  }
  return fallback;
}

function parseNumberInRange(raw: unknown, min: number, max: number, fallback: number): number {
  if (isFiniteNumber(raw) && raw >= min && raw <= max) {
    return raw;
  }
  return fallback;
}

function parseImssComplement(
  raw: unknown,
  violations: string[]
): ImssComplementConfig {
  const defaults = DEFAULT_COMPANY_WORK_RULES_CONFIG.imssComplement;
  if (!isPlainObject(raw)) return { ...defaults };

  if (raw.countsAsAbsence === true) {
    violations.push("Invariante IMSS: una incapacidad IMSS nunca puede contar como falta.");
  }
  if (raw.paidAsOrdinarySalary === true) {
    violations.push("Invariante IMSS: una incapacidad IMSS nunca se paga como salario ordinario.");
  }

  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
    complementPercentage: parseNumberInRange(
      raw.complementPercentage,
      0,
      100,
      defaults.complementPercentage
    ),
    coverFirstThreeDays:
      typeof raw.coverFirstThreeDays === "boolean"
        ? raw.coverFirstThreeDays
        : defaults.coverFirstThreeDays,
    countsAsAbsence: false,
    paidAsOrdinarySalary: false,
  };
}

function parseLeaveRule(
  key: LeaveCatalogueKey,
  raw: unknown,
  violations: string[]
): LeaveRuleConfig {
  const defaults = DEFAULT_LEAVE_CATALOGUE[key];
  if (!isPlainObject(raw)) return { ...defaults };

  const isPaidLeave = PAID_LEAVE_KEYS.has(key);
  if (isPaidLeave) {
    if (raw.paid === false) {
      violations.push(
        `Invariante permiso con goce: "${key}" debe otorgarse con goce de sueldo.`
      );
    }
    if (isFiniteNumber(raw.payPercentage) && raw.payPercentage < 100) {
      violations.push(
        `Invariante permiso con goce: "${key}" debe pagarse íntegro al 100% (recibido ${raw.payPercentage}%).`
      );
    }
  }

  let maxDaysPerYear = defaults.maxDaysPerYear;
  if (raw.maxDaysPerYear === null) {
    maxDaysPerYear = null;
  } else if (typeof raw.maxDaysPerYear === "number" && Number.isInteger(raw.maxDaysPerYear) && raw.maxDaysPerYear >= 1) {
    maxDaysPerYear = raw.maxDaysPerYear;
  }

  if (key === "paternidad" && maxDaysPerYear !== null && maxDaysPerYear < 5) {
    violations.push(
      `Art. 132 XXVII Bis LFT: el permiso de paternidad (${maxDaysPerYear} días) no puede ser menor a 5 días laborables.`
    );
  }
  if (key === "maternidad" && maxDaysPerYear !== null && maxDaysPerYear < 84) {
    violations.push(
      `Art. 170 II LFT: la incapacidad por maternidad (${maxDaysPerYear} días) no puede ser menor a 84 días (12 semanas).`
    );
  }

  return {
    paid: isPaidLeave ? true : typeof raw.paid === "boolean" ? raw.paid : defaults.paid,
    payPercentage: isPaidLeave
      ? 100
      : parseNumberInRange(raw.payPercentage, 0, 100, defaults.payPercentage),
    affectsSeventhDay:
      typeof raw.affectsSeventhDay === "boolean"
        ? raw.affectsSeventhDay
        : defaults.affectsSeventhDay,
    affectsVacationPremium:
      typeof raw.affectsVacationPremium === "boolean"
        ? raw.affectsVacationPremium
        : defaults.affectsVacationPremium,
    affectsBonuses:
      typeof raw.affectsBonuses === "boolean" ? raw.affectsBonuses : defaults.affectsBonuses,
    maxDaysPerYear,
  };
}

function parseLeaveCatalogue(raw: unknown, violations: string[]): LeaveCatalogueConfig {
  const source = isPlainObject(raw) ? raw : {};
  const result = {} as LeaveCatalogueConfig;
  for (const key of LEAVE_KEYS) {
    result[key] = parseLeaveRule(key, source[key], violations);
  }
  return result;
}

function parseVacationRules(raw: unknown, violations: string[]): VacationRulesConfig {
  const defaults = DEFAULT_COMPANY_WORK_RULES_CONFIG.vacationRules;
  if (!isPlainObject(raw)) {
    return { ...defaults, daysByYearOverrides: {} };
  }

  if (isFiniteNumber(raw.premiumPercentage) && raw.premiumPercentage < 25) {
    violations.push(
      `Art. 80 LFT: la prima vacacional (${raw.premiumPercentage}%) no puede ser menor al 25%.`
    );
  }

  const overrides: Record<number, number> = {};
  if (isPlainObject(raw.daysByYearOverrides)) {
    for (const [yearKey, daysVal] of Object.entries(raw.daysByYearOverrides)) {
      const year = Number(yearKey);
      if (!Number.isInteger(year) || year < 1 || !isFiniteNumber(daysVal)) continue;
      const minLftDays = DEFAULT_VACATION_POLICY.getDaysForYear(year);
      if (daysVal < minLftDays) {
        violations.push(
          `Art. 76 LFT: los días de vacaciones para el año ${year} (${daysVal}) no pueden ser menores al mínimo legal (${minLftDays}).`
        );
        continue;
      }
      if (Number.isInteger(daysVal) && daysVal <= 365) {
        overrides[year] = daysVal;
      }
    }
  }

  return {
    daysByYearOverrides: overrides,
    premiumPercentage: parseNumberInRange(
      raw.premiumPercentage,
      25,
      500,
      defaults.premiumPercentage
    ),
    allowCarryOver:
      typeof raw.allowCarryOver === "boolean" ? raw.allowCarryOver : defaults.allowCarryOver,
    maxCarryOverDays: parseIntInRange(raw.maxCarryOverDays, 0, 365, defaults.maxCarryOverDays),
  };
}

function parseHourlyLeaveRules(raw: unknown): HourlyLeaveRulesConfig {
  const defaults = DEFAULT_COMPANY_WORK_RULES_CONFIG.hourlyLeaveRules;
  if (!isPlainObject(raw)) return { ...defaults };

  const increment = raw.minIncrementMinutes;
  const minIncrementMinutes =
    increment === 15 || increment === 30 || increment === 60
      ? increment
      : defaults.minIncrementMinutes;

  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
    minIncrementMinutes,
    maxHoursPerDay: parseNumberInRange(raw.maxHoursPerDay, 1, 8, defaults.maxHoursPerDay),
    monthlyCapHours: parseNumberInRange(raw.monthlyCapHours, 0, 40, defaults.monthlyCapHours),
  };
}

function parseOvertimeRules(raw: unknown, violations: string[]): OvertimeRulesConfig {
  const defaults = DEFAULT_COMPANY_WORK_RULES_CONFIG.overtimeRules;
  if (!isPlainObject(raw)) return { ...defaults };

  if (isFiniteNumber(raw.doubleRateMultiplier) && raw.doubleRateMultiplier < 2) {
    violations.push(
      `Art. 67 LFT: el multiplicador de horas extra dobles (${raw.doubleRateMultiplier}x) no puede ser menor a 2x.`
    );
  }
  if (isFiniteNumber(raw.tripleRateMultiplier) && raw.tripleRateMultiplier < 3) {
    violations.push(
      `Art. 68 LFT: el multiplicador de horas extra triples (${raw.tripleRateMultiplier}x) no puede ser menor a 3x.`
    );
  }
  if (isFiniteNumber(raw.maxDoubleHoursPerWeek) && raw.maxDoubleHoursPerWeek > 9) {
    violations.push(
      `Art. 66/68 LFT: las horas extra dobles semanales (${raw.maxDoubleHoursPerWeek}h) no pueden exceder 9 horas antes de pagarse al triple.`
    );
  }

  return {
    requiresPriorAuthorization:
      typeof raw.requiresPriorAuthorization === "boolean"
        ? raw.requiresPriorAuthorization
        : defaults.requiresPriorAuthorization,
    doubleRateMultiplier: parseNumberInRange(
      raw.doubleRateMultiplier,
      2,
      10,
      defaults.doubleRateMultiplier
    ),
    tripleRateMultiplier: parseNumberInRange(
      raw.tripleRateMultiplier,
      3,
      10,
      defaults.tripleRateMultiplier
    ),
    maxDoubleHoursPerWeek: parseIntInRange(
      raw.maxDoubleHoursPerWeek,
      0,
      9,
      defaults.maxDoubleHoursPerWeek
    ),
  };
}

function parseBonusConfig(
  raw: unknown,
  defaults: AttendanceBonusConfig
): AttendanceBonusConfig {
  if (!isPlainObject(raw)) {
    return { ...defaults, cancelledBy: [...defaults.cancelledBy] };
  }

  let cancelledBy = [...defaults.cancelledBy];
  if (Array.isArray(raw.cancelledBy)) {
    const valid = raw.cancelledBy.filter(
      (item): item is IncidentCategory =>
        typeof item === "string" && VALID_INCIDENT_CATEGORIES.has(item as IncidentCategory)
    );
    cancelledBy = Array.from(new Set(valid));
  }

  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
    amount: parseNumberInRange(raw.amount, 0, 1_000_000, defaults.amount),
    type:
      typeof raw.type === "string" && VALID_BONUS_TYPES.has(raw.type as BonusAmountType)
        ? (raw.type as BonusAmountType)
        : defaults.type,
    cancelledBy,
  };
}

function validateInvariantsObject(raw: unknown, violations: string[]): void {
  if (!isPlainObject(raw)) return;
  if (raw.imssDisabilityCountsAsAbsence === true) {
    violations.push("Invariante IMSS: imssDisabilityCountsAsAbsence debe ser false.");
  }
  if (raw.imssDisabilityPaidAsOrdinarySalary === true) {
    violations.push("Invariante IMSS: imssDisabilityPaidAsOrdinarySalary debe ser false.");
  }
  if (raw.paidLeavePaidInFull === false) {
    violations.push("Invariante permiso con goce: paidLeavePaidInFull debe ser true.");
  }
  if (raw.seventhDayEarnedByWorkedDays === false) {
    violations.push("Invariante séptimo día: seventhDayEarnedByWorkedDays debe ser true.");
  }
}

/**
 * Lee y valida `company_profiles.payroll_impact_config` (jsonb).
 * - NULL o tipo no-objeto → defaults LFT.
 * - Parcial → mezcla campo a campo con defaults LFT.
 * - Valor explícitamente por debajo de la LFT o que viole invariantes → lanza `LftPolicyViolationError`.
 */
export function parseCompanyWorkRulesConfig(raw: unknown): CompanyWorkRulesConfig {
  const base = parsePayrollImpactConfig(raw);
  const source = isPlainObject(raw) ? raw : {};
  const violations: string[] = [];

  validateInvariantsObject(source.invariants, violations);
  const imssComplement = parseImssComplement(source.imssComplement, violations);
  const leaveCatalogue = parseLeaveCatalogue(source.leaveCatalogue, violations);
  const vacationRules = parseVacationRules(source.vacationRules, violations);
  const overtimeRules = parseOvertimeRules(source.overtimeRules, violations);

  if (violations.length > 0) {
    throw new LftPolicyViolationError(violations);
  }

  return {
    ...base,
    timezone: BUSINESS_TIME_ZONE,
    earlyDepartureMode:
      typeof source.earlyDepartureMode === "string" &&
      VALID_EARLY_DEPARTURE_MODES.has(source.earlyDepartureMode as EarlyDepartureMode)
        ? (source.earlyDepartureMode as EarlyDepartureMode)
        : DEFAULT_COMPANY_WORK_RULES_CONFIG.earlyDepartureMode,
    compTimeMode:
      typeof source.compTimeMode === "string" &&
      VALID_COMP_TIME_MODES.has(source.compTimeMode as CompTimeMode)
        ? (source.compTimeMode as CompTimeMode)
        : DEFAULT_COMPANY_WORK_RULES_CONFIG.compTimeMode,
    imssComplement,
    leaveCatalogue,
    vacationRules,
    hourlyLeaveRules: parseHourlyLeaveRules(source.hourlyLeaveRules),
    overtimeRules,
    payrollPeriodicity:
      typeof source.payrollPeriodicity === "string" &&
      VALID_PERIODICITIES.has(source.payrollPeriodicity as PayrollPeriodicity)
        ? (source.payrollPeriodicity as PayrollPeriodicity)
        : DEFAULT_COMPANY_WORK_RULES_CONFIG.payrollPeriodicity,
    incidentCutoffDay: parseIntInRange(
      source.incidentCutoffDay,
      1,
      31,
      DEFAULT_COMPANY_WORK_RULES_CONFIG.incidentCutoffDay
    ),
    punctualityBonus: parseBonusConfig(
      source.punctualityBonus,
      DEFAULT_COMPANY_WORK_RULES_CONFIG.punctualityBonus
    ),
    attendanceBonus: parseBonusConfig(
      source.attendanceBonus,
      DEFAULT_COMPANY_WORK_RULES_CONFIG.attendanceBonus
    ),
    invariants: FELIPE_INVARIANTS,
  };
}

export type SafeParseCompanyWorkRulesResult =
  | { success: true; data: CompanyWorkRulesConfig }
  | { success: false; error: string; violations: string[] };

/** Versión no lanzadora del parser para Server Actions y validaciones de formulario. */
export function safeParseCompanyWorkRulesConfig(
  raw: unknown
): SafeParseCompanyWorkRulesResult {
  try {
    return { success: true, data: parseCompanyWorkRulesConfig(raw) };
  } catch (error) {
    if (error instanceof LftPolicyViolationError) {
      return {
        success: false,
        error: error.message,
        violations: error.violations,
      };
    }
    const message = error instanceof Error ? error.message : "Configuración inválida.";
    return { success: false, error: message, violations: [message] };
  }
}
