import { calculateAbsenceDeduction } from "../utils/payroll-calculator";
import type { IncidentCategory } from "../types/incidents";

export interface PayrollImpactConfig {
  /** Retardos que equivalen a una falta injustificada. */
  delaysPerAbsence: number;
  /** Días de salario que se pagan como bono por cada reconocimiento. */
  recognitionBonusDays: number;
}

export const DEFAULT_PAYROLL_IMPACT_CONFIG: PayrollImpactConfig = {
  delaysPerAbsence: 3,
  recognitionBonusDays: 1,
};

export interface PayrollImpact {
  deduction: number;
  bonus: number;
  /** Faltas equivalentes que se descuentan (faltas reales o acumuladas por retardos). */
  absenceEquivalents: number;
}

export interface PayrollImpactInput {
  monthlySalary: number;
  /** Incidencias vigentes de esa categoría en el periodo. */
  count: number;
}

export interface IncidentPayrollImpactStrategy {
  calculate(input: PayrollImpactInput): PayrollImpact;
}

const NO_IMPACT: PayrollImpact = { deduction: 0, bonus: 0, absenceEquivalents: 0 };

function deductionFor(monthlySalary: number, absences: number): PayrollImpact {
  return {
    deduction: calculateAbsenceDeduction(monthlySalary, absences),
    bonus: 0,
    absenceEquivalents: absences,
  };
}

export class UnjustifiedAbsenceImpact implements IncidentPayrollImpactStrategy {
  calculate({ monthlySalary, count }: PayrollImpactInput): PayrollImpact {
    return deductionFor(monthlySalary, count);
  }
}

export class DelayAccumulationImpact implements IncidentPayrollImpactStrategy {
  constructor(private readonly delaysPerAbsence: number) {
    if (!Number.isInteger(delaysPerAbsence) || delaysPerAbsence < 1) {
      throw new Error("Los retardos por falta deben ser un entero mayor o igual a 1.");
    }
  }

  calculate({ monthlySalary, count }: PayrollImpactInput): PayrollImpact {
    return deductionFor(monthlySalary, Math.floor(count / this.delaysPerAbsence));
  }
}

export class NoDeductionImpact implements IncidentPayrollImpactStrategy {
  calculate(): PayrollImpact {
    return { ...NO_IMPACT };
  }
}

export class RecognitionBonusImpact implements IncidentPayrollImpactStrategy {
  constructor(private readonly bonusDays: number) {}

  calculate({ monthlySalary, count }: PayrollImpactInput): PayrollImpact {
    if (monthlySalary <= 0 || count <= 0 || this.bonusDays <= 0) return { ...NO_IMPACT };
    return {
      ...NO_IMPACT,
      bonus: Math.round((monthlySalary / 30) * this.bonusDays * count),
    };
  }
}

/** Resuelve la estrategia de impacto en nómina por categoría. */
export function resolvePayrollImpactStrategy(
  category: IncidentCategory,
  config: PayrollImpactConfig = DEFAULT_PAYROLL_IMPACT_CONFIG
): IncidentPayrollImpactStrategy {
  switch (category) {
    case "falta_injustificada":
      return new UnjustifiedAbsenceImpact();
    case "retardo":
      return new DelayAccumulationImpact(config.delaysPerAbsence);
    case "reconocimiento":
      return new RecognitionBonusImpact(config.recognitionBonusDays);
    default:
      // incapacidad, permiso y demás categorías: sin deducción automática.
      return new NoDeductionImpact();
  }
}

export interface PayrollImpactIncident {
  category: IncidentCategory;
  status: string;
}

/** Totaliza el impacto de las incidencias de un empleado; las rechazadas no cuentan. */
export function calculateIncidentsPayrollImpact(
  incidents: PayrollImpactIncident[],
  monthlySalary: number,
  config: PayrollImpactConfig = DEFAULT_PAYROLL_IMPACT_CONFIG
): PayrollImpact {
  const counts = new Map<IncidentCategory, number>();
  for (const incident of incidents) {
    if (incident.status === "rechazado") continue;
    counts.set(incident.category, (counts.get(incident.category) ?? 0) + 1);
  }

  return Array.from(counts.entries()).reduce<PayrollImpact>(
    (total, [category, count]) => {
      const impact = resolvePayrollImpactStrategy(category, config).calculate({
        monthlySalary,
        count,
      });
      return {
        deduction: total.deduction + impact.deduction,
        bonus: total.bonus + impact.bonus,
        absenceEquivalents: total.absenceEquivalents + impact.absenceEquivalents,
      };
    },
    { ...NO_IMPACT }
  );
}
