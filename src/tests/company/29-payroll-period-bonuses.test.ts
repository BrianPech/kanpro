import { describe, expect, test } from "vitest";
import { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import {
  evaluatePeriodBonuses,
  partitionIncidentsByCutoff,
  resolvePayrollPeriodWithCutoff,
} from "@/modules/company/strategies/payroll-period-bonuses.engine";

describe("Tarea 4: Periodicidad de nómina, fecha de corte y bonos de puntualidad/asistencia", () => {
  test("bono de puntualidad cancelado por retardo según el config", () => {
    const result = evaluatePeriodBonuses({
      incidents: [
        { category: "retardo", status: "aprobado", incident_date: "2026-11-18" },
      ],
      attendance: [],
      monthlySalary: 15000,
      refDateISO: "2026-11-22",
      config: {
        payrollPeriodicity: "quincenal",
        incidentCutoffDay: 15,
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
      },
    });

    expect(result.timezone).toBe(BUSINESS_TIME_ZONE);
    expect(result.punctualityBonus.status).toBe("cancelled_full");
    expect(result.punctualityBonus.finalAmount).toBe(0);
    // Un retardo no cancela el bono de asistencia (10% de 7500 = 750)
    expect(result.attendanceBonus.status).toBe("full");
    expect(result.attendanceBonus.finalAmount).toBe(750);
    expect(result.totalBonuses).toBe(750);
  });

  test("bono de asistencia cancelado por falta injustificada; incapacidad IMSS no lo cancela por falta", () => {
    const conFalta = evaluatePeriodBonuses({
      incidents: [
        { category: "falta_injustificada", status: "aprobado", incident_date: "2026-11-18" },
      ],
      attendance: [],
      monthlySalary: 15000,
      refDateISO: "2026-11-22",
      config: {
        payrollPeriodicity: "quincenal",
        incidentCutoffDay: 15,
        attendanceBonus: {
          enabled: true,
          amount: 600,
          type: "fixed",
          cancelledBy: ["falta_injustificada"],
        },
      },
    });
    expect(conFalta.attendanceBonus.status).toBe("cancelled_full");
    expect(conFalta.attendanceBonus.finalAmount).toBe(0);

    const conImss = evaluatePeriodBonuses({
      incidents: [
        { category: "incapacidad", status: "aprobado", incident_date: "2026-11-18" },
      ],
      attendance: [],
      monthlySalary: 15000,
      refDateISO: "2026-11-22",
      config: {
        payrollPeriodicity: "quincenal",
        incidentCutoffDay: 15,
        attendanceBonus: {
          enabled: true,
          amount: 600,
          type: "fixed",
          cancelledBy: ["falta_injustificada"],
        },
      },
    });
    expect(conImss.attendanceBonus.status).toBe("full");
    expect(conImss.attendanceBonus.finalAmount).toBe(600);
  });

  test("cancelación parcial de bono según el config", () => {
    const result = evaluatePeriodBonuses({
      incidents: [
        { category: "retardo", status: "aprobado", incident_date: "2026-11-18" },
      ],
      attendance: [],
      monthlySalary: 15000,
      refDateISO: "2026-11-22",
      config: {
        payrollPeriodicity: "quincenal",
        incidentCutoffDay: 15,
        punctualityBonus: {
          enabled: true,
          amount: 800,
          type: "fixed",
          cancelledBy: ["falta_injustificada"],
          partialCancelBy: ["retardo"],
          partialCancelPercentage: 50,
        },
      },
    });

    expect(result.punctualityBonus.status).toBe("cancelled_partial");
    expect(result.punctualityBonus.reductionPercentage).toBe(50);
    expect(result.punctualityBonus.finalAmount).toBe(400);
  });

  test("incidencias después de la fecha de corte → van al siguiente periodo", () => {
    // Quincena 2 de noviembre (16..30), corte en el día 12 de cada quincena -> 27 de noviembre
    const period = resolvePayrollPeriodWithCutoff({
      refDateISO: "2026-11-22",
      config: { payrollPeriodicity: "quincenal", incidentCutoffDay: 12 },
    });
    expect(period.startDate).toBe("2026-11-16");
    expect(period.cutoffDate).toBe("2026-11-27");
    expect(period.endDate).toBe("2026-11-30");

    const partitioned = partitionIncidentsByCutoff(
      [
        { category: "retardo", status: "aprobado", incident_date: "2026-11-25" },
        { category: "retardo", status: "aprobado", incident_date: "2026-11-29" },
      ],
      period
    );
    expect(partitioned.inCurrentPeriod).toHaveLength(1);
    expect(partitioned.deferredToNextPeriod).toHaveLength(1);

    // El retardo del 29-nov (después del corte 27-nov) NO cancela el bono del periodo actual
    const bonuses = evaluatePeriodBonuses({
      incidents: [
        { category: "retardo", status: "aprobado", incident_date: "2026-11-29" },
      ],
      attendance: [],
      monthlySalary: 15000,
      refDateISO: "2026-11-22",
      config: {
        payrollPeriodicity: "quincenal",
        incidentCutoffDay: 12,
        punctualityBonus: {
          enabled: true,
          amount: 500,
          type: "fixed",
          cancelledBy: ["retardo"],
        },
      },
    });

    expect(bonuses.inCurrentPeriodCount).toBe(0);
    expect(bonuses.deferredToNextPeriodCount).toBe(1);
    expect(bonuses.punctualityBonus.status).toBe("full");
    expect(bonuses.punctualityBonus.finalAmount).toBe(500);
  });
});
