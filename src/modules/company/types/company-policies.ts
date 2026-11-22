import type { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import type {
  DelayDeductionDays,
  DelayResetPeriod,
  PayrollImpactConfig,
  PayrollImpactScope,
  SeventhDayMode,
} from "../strategies/incident-payroll-impact.strategy";
import type { IncidentCategory } from "./incidents";

export type {
  DelayDeductionDays,
  DelayResetPeriod,
  PayrollImpactConfig,
  PayrollImpactScope,
  SeventhDayMode,
};

export type EarlyDepartureMode =
  | "descuento_proporcional"
  | "retardo_equivalente"
  | "solo_registro";

export type CompTimeMode =
  | "ninguno"
  | "tiempo_por_tiempo"
  | "banco_horas";

export type PayrollPeriodicity =
  | "semanal"
  | "catorcenal"
  | "quincenal"
  | "mensual";

export type BonusAmountType = "fixed" | "percentage";

export type LeaveCatalogueKey =
  | "vacaciones"
  | "permiso_con_goce"
  | "permiso_sin_goce"
  | "dias_economicos"
  | "matrimonio"
  | "paternidad"
  | "maternidad"
  | "luto";

/**
 * Complemento voluntario de la empresa sobre subsidios por incapacidad IMSS.
 * Invariante de Felipe: una incapacidad IMSS nunca cuenta como falta ni se paga como salario ordinario.
 */
export interface ImssComplementConfig {
  enabled: boolean;
  /** Porcentaje adicional cubierto por la empresa (0-100). */
  complementPercentage: number;
  /** Si la empresa cubre voluntariamente los primeros 3 días de enfermedad general. */
  coverFirstThreeDays: boolean;
  readonly countsAsAbsence: false;
  readonly paidAsOrdinarySalary: false;
}

export interface LeaveRuleConfig {
  paid: boolean;
  /** Porcentaje de salario pagado durante el permiso (100 para con goce, 0 para sin goce). */
  payPercentage: number;
  affectsSeventhDay: boolean;
  affectsVacationPremium: boolean;
  affectsBonuses: boolean;
  maxDaysPerYear: number | null;
  /** Tope de días hábiles por evento (ej. Luto Art. 132 fracc. XXIX LFT: mín. 3 por evento). */
  maxDaysPerEvent?: number | null;
}

export type LeaveCatalogueConfig = Record<LeaveCatalogueKey, LeaveRuleConfig>;

export interface VacationRulesConfig {
  /** Overrides por año de servicio; nunca menores al Art. 76 LFT. */
  daysByYearOverrides: Record<number, number>;
  /** Prima vacacional en porcentaje; mínimo legal 25% (Art. 80 LFT). */
  premiumPercentage: number;
  allowCarryOver: boolean;
  maxCarryOverDays: number;
}

export interface HourlyLeaveRulesConfig {
  enabled: boolean;
  minIncrementMinutes: 15 | 30 | 60;
  maxHoursPerDay: number;
  monthlyCapHours: number;
}

export interface OvertimeRulesConfig {
  requiresPriorAuthorization: boolean;
  /** Mínimo 2x (Art. 67 LFT). */
  doubleRateMultiplier: number;
  /** Mínimo 3x (Art. 68 LFT). */
  tripleRateMultiplier: number;
  /** Máximo 9h semanales al doble antes de pasar a triple (Art. 66/68 LFT). */
  maxDoubleHoursPerWeek: number;
}

export interface AttendanceBonusConfig {
  enabled: boolean;
  amount: number;
  type: BonusAmountType;
  /** Incidencias que cancelan el bono por completo (100%). */
  cancelledBy: IncidentCategory[];
  /** Incidencias que reducen el bono de forma parcial. */
  partialCancelBy: IncidentCategory[];
  /** Porcentaje de reducción cuando ocurre una incidencia en `partialCancelBy` (0-100). */
  partialCancelPercentage: number;
}

export type DisciplinaryPayMode =
  | "con_goce"
  | "sin_goce_solo_dia"
  | "sin_goce_con_septimo";

export interface DisciplinaryRulesConfig {
  /** Forma de pago/descuento para faltas administrativas (incumplimiento / acta). */
  administrativeFaultMode: DisciplinaryPayMode;
  /** Forma de pago/descuento para suspensiones disciplinarias (Art. 423 frac. X LFT). */
  suspensionMode: DisciplinaryPayMode;
  /** Máximo de días por suspensión disciplinaria (LFT Art. 423 frac. X: máximo 8 días). */
  maxSuspensionDays: number;
}

export interface FelipeInvariants {
  readonly imssDisabilityCountsAsAbsence: false;
  readonly imssDisabilityPaidAsOrdinarySalary: false;
  readonly paidLeavePaidInFull: true;
  readonly seventhDayEarnedByWorkedDays: true;
}

export type CutoffDaysBeforeEnd = 0 | 1 | 2 | 3;

export interface CompanyWorkRulesConfig extends PayrollImpactConfig {
  timezone: typeof BUSINESS_TIME_ZONE;
  earlyDepartureMode: EarlyDepartureMode;
  compTimeMode: CompTimeMode;
  imssComplement: ImssComplementConfig;
  leaveCatalogue: LeaveCatalogueConfig;
  vacationRules: VacationRulesConfig;
  hourlyLeaveRules: HourlyLeaveRulesConfig;
  overtimeRules: OvertimeRulesConfig;
  payrollPeriodicity: PayrollPeriodicity;
  incidentCutoffDay: number;
  /** Días antes del fin del periodo para el corte de incidencias (0 = fin del periodo, 1–3 = adelantado). */
  cutoffDaysBeforeEnd: CutoffDaysBeforeEnd;
  punctualityBonus: AttendanceBonusConfig;
  attendanceBonus: AttendanceBonusConfig;
  disciplinaryRules: DisciplinaryRulesConfig;
  readonly invariants: FelipeInvariants;
}

/** Error lanzado cuando una política propuesta viola la LFT o las invariantes del modelo. */
export class LftPolicyViolationError extends Error {
  readonly violations: string[];

  constructor(violations: string[]) {
    super(`Configuración rechazada por incumplir LFT o invariantes: ${violations.join(" | ")}`);
    this.name = "LftPolicyViolationError";
    this.violations = violations;
  }
}
