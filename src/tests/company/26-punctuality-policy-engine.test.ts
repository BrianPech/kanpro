import { describe, expect, test } from "vitest";
import { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import {
  calculatePeriodDelayAccumulation,
  getResetPeriodKey,
  resolveEffectiveTolerance,
} from "@/modules/company/strategies/punctuality-policy.engine";
import type { EligibleIncidentCandidate } from "@/modules/company/strategies/incident-payroll-impact.strategy";

function makeDelays(dates: string[]): EligibleIncidentCandidate[] {
  return dates.map((incident_date) => ({
    category: "retardo",
    status: "aprobado",
    incident_date,
  }));
}

describe("Tarea 1: Puntualidad, acumulación de retardos, reinicio y salidas anticipadas", () => {
  test("acumulación: 2 retardos → 0 faltas, 3 → 1, 5 → 1, 6 → 2; sin multa fija de $100", () => {
    const config = {
      delaysPerAbsence: 3,
      delayDeductionDays: 1,
      resetPeriod: "quincenal",
      seventhDayMode: "ninguno",
    };

    const r2 = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-11-16", "2026-11-17"]),
      attendance: [],
      monthlySalary: 15000,
      config,
      targetDateISO: "2026-11-22",
    });
    expect(r2.timezone).toBe(BUSINESS_TIME_ZONE);
    expect(r2.absenceEquivalents).toBe(0);
    expect(r2.delayDeduction).toBe(0);
    expect(r2.fixedFineAmount).toBe(0);

    const r3 = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-11-16", "2026-11-17", "2026-11-18"]),
      attendance: [],
      monthlySalary: 15000,
      config,
      targetDateISO: "2026-11-22",
    });
    expect(r3.absenceEquivalents).toBe(1);
    expect(r3.delayDeduction).toBe(500);
    expect(r3.fixedFineAmount).toBe(0);

    const r5 = calculatePeriodDelayAccumulation({
      incidents: makeDelays([
        "2026-11-16",
        "2026-11-17",
        "2026-11-18",
        "2026-11-19",
        "2026-11-20",
      ]),
      attendance: [],
      monthlySalary: 15000,
      config,
      targetDateISO: "2026-11-22",
    });
    expect(r5.absenceEquivalents).toBe(1);
    expect(r5.delayDeduction).toBe(500);

    const r6 = calculatePeriodDelayAccumulation({
      incidents: makeDelays([
        "2026-11-16",
        "2026-11-17",
        "2026-11-18",
        "2026-11-19",
        "2026-11-20",
        "2026-11-21",
      ]),
      attendance: [],
      monthlySalary: 15000,
      config,
      targetDateISO: "2026-11-22",
    });
    expect(r6.absenceEquivalents).toBe(2);
    expect(r6.delayDeduction).toBe(1000);
  });

  test("salario diario proviene del salario mensual normalizado (nunca quincenal / 30) y soporta medio día", () => {
    const result = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-11-16", "2026-11-17", "2026-11-18"]),
      attendance: [],
      monthlySalary: 0,
      salaryInput: { amount: 7500, paymentFrequency: "quincenal" },
      config: {
        delaysPerAbsence: 3,
        delayDeductionDays: 0.5,
        seventhDayMode: "ninguno",
      },
      targetDateISO: "2026-11-22",
    });

    expect(result.dailySalary).toBe(500);
    expect(result.absenceEquivalents).toBe(0.5);
    expect(result.delayDeduction).toBe(250);
  });

  test("reinicio del conteo al cambiar de periodo (semanal, catorcenal, quincenal, mensual)", () => {
    // Quincenal: 2 en Q1 + 2 en Q2 => solo 2 en Q2 (0 faltas)
    const quincenal = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-11-05", "2026-11-10", "2026-11-17", "2026-11-20"]),
      attendance: [],
      monthlySalary: 15000,
      config: { resetPeriod: "quincenal", delaysPerAbsence: 3 },
      targetDateISO: "2026-11-22",
    });
    expect(quincenal.delayIncidentsInPeriod).toBe(2);
    expect(quincenal.delaysFromOtherPeriods).toBe(2);
    expect(quincenal.absenceEquivalents).toBe(0);

    // Semanal: 2026-11-15 es domingo (semana anterior), 2026-11-16..22 es la semana actual
    expect(getResetPeriodKey("2026-11-15", "semanal")).not.toBe(
      getResetPeriodKey("2026-11-16", "semanal")
    );
    const semanal = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-11-13", "2026-11-15", "2026-11-16"]),
      attendance: [],
      monthlySalary: 15000,
      config: { resetPeriod: "semanal", delaysPerAbsence: 3 },
      targetDateISO: "2026-11-22",
    });
    expect(semanal.delayIncidentsInPeriod).toBe(1);
    expect(semanal.delaysFromOtherPeriods).toBe(2);

    // Catorcenal: cambia de bloque cada 14 días desde el ancla
    expect(getResetPeriodKey("2026-11-08", "catorcenal", "2026-11-09")).not.toBe(
      getResetPeriodKey("2026-11-09", "catorcenal", "2026-11-09")
    );
    expect(getResetPeriodKey("2026-11-09", "catorcenal", "2026-11-09")).toBe(
      getResetPeriodKey("2026-11-22", "catorcenal", "2026-11-09")
    );

    // Mensual: octubre no se mezcla con noviembre
    const mensual = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-10-28", "2026-10-30", "2026-11-02"]),
      attendance: [],
      monthlySalary: 15000,
      config: { resetPeriod: "mensual", delaysPerAbsence: 3 },
      targetDateISO: "2026-11-22",
    });
    expect(mensual.delayIncidentsInPeriod).toBe(1);
    expect(mensual.delaysFromOtherPeriods).toBe(2);
  });

  test("mismo día ya contado en asistencia → excluido; distinto día → incluido", () => {
    const result = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"]),
      attendance: [{ work_date: "2026-11-17", status: "retardo" }],
      monthlySalary: 15000,
      config: { delaysPerAbsence: 3, resetPeriod: "quincenal", seventhDayMode: "ninguno" },
      targetDateISO: "2026-11-22",
    });

    expect(result.delaysAbsorbedByAttendance).toBe(1);
    expect(result.delayIncidentsInPeriod).toBe(3);
    expect(result.absenceEquivalents).toBe(1);
  });

  test("salida anticipada y tiempo compensable según modo configurado", () => {
    // 1. descuento_proporcional sin compensación: salario mensual 24000 -> diario 800 -> hora 100 -> 120 min = $200
    const prop = calculatePeriodDelayAccumulation({
      incidents: [],
      attendance: [],
      monthlySalary: 24000,
      config: {
        earlyDepartureMode: "descuento_proporcional",
        compTimeMode: "ninguno",
      },
      targetDateISO: "2026-11-22",
      earlyDepartures: [{ work_date: "2026-11-18", minutes: 120, compensatedMinutes: 60 }],
    });
    expect(prop.uncompensatedEarlyMinutes).toBe(120);
    expect(prop.earlyDepartureDeduction).toBe(200);

    // 2. descuento_proporcional con tiempo_por_tiempo: 60 min compensados -> 60 min netos = $100
    const comp = calculatePeriodDelayAccumulation({
      incidents: [],
      attendance: [],
      monthlySalary: 24000,
      config: {
        earlyDepartureMode: "descuento_proporcional",
        compTimeMode: "tiempo_por_tiempo",
      },
      targetDateISO: "2026-11-22",
      earlyDepartures: [{ work_date: "2026-11-18", minutes: 120, compensatedMinutes: 60 }],
    });
    expect(comp.uncompensatedEarlyMinutes).toBe(60);
    expect(comp.earlyDepartureDeduction).toBe(100);

    // 3. retardo_equivalente: 2 retardos + 1 salida anticipada = 3 retardos -> 1 falta
    const equiv = calculatePeriodDelayAccumulation({
      incidents: makeDelays(["2026-11-16", "2026-11-17"]),
      attendance: [],
      monthlySalary: 15000,
      config: {
        delaysPerAbsence: 3,
        delayDeductionDays: 1,
        seventhDayMode: "ninguno",
        earlyDepartureMode: "retardo_equivalente",
        compTimeMode: "tiempo_por_tiempo",
      },
      targetDateISO: "2026-11-22",
      earlyDepartures: [{ work_date: "2026-11-18", minutes: 45, compensatedMinutes: 0 }],
    });
    expect(equiv.earlyDepartureDelayEquivalents).toBe(1);
    expect(equiv.totalDelaysInPeriod).toBe(3);
    expect(equiv.absenceEquivalents).toBe(1);
    expect(equiv.earlyDepartureDeduction).toBe(0);

    // 4. solo_registro: sin equivalentes ni descuento
    const recordOnly = calculatePeriodDelayAccumulation({
      incidents: [],
      attendance: [],
      monthlySalary: 24000,
      config: { earlyDepartureMode: "solo_registro" },
      targetDateISO: "2026-11-22",
      earlyDepartures: [{ work_date: "2026-11-18", minutes: 120 }],
    });
    expect(recordOnly.earlyDepartureDelayEquivalents).toBe(0);
    expect(recordOnly.earlyDepartureDeduction).toBe(0);
    expect(recordOnly.totalDeduction).toBe(0);
  });

  test("tolerancia efectiva según scope (uniforme vs puestos/turnos/sucursales)", () => {
    const uniform = resolveEffectiveTolerance(
      {
        toleranceMinutes: 10,
        scope: { uniformTolerance: true, jobTitles: [], shifts: [], branches: [] },
      },
      { jobTitle: "Cocinero" }
    );
    expect(uniform.appliesTolerance).toBe(true);
    expect(uniform.toleranceMinutes).toBe(10);

    const segmentedConfig = {
      toleranceMinutes: 15,
      scope: {
        uniformTolerance: false,
        jobTitles: ["Recepcionista"],
        shifts: ["Nocturno"],
        branches: ["Cancún Centro"],
      },
    };
    expect(
      resolveEffectiveTolerance(segmentedConfig, { jobTitle: " recepcionista " }).toleranceMinutes
    ).toBe(15);
    expect(
      resolveEffectiveTolerance(segmentedConfig, { shift: "Nocturno" }).toleranceMinutes
    ).toBe(15);
    expect(
      resolveEffectiveTolerance(segmentedConfig, {
        jobTitle: "Mesero",
        shift: "Matutino",
        branch: "Playa del Carmen",
      })
    ).toEqual({
      appliesTolerance: false,
      toleranceMinutes: 0,
      timezone: BUSINESS_TIME_ZONE,
    });
  });
});
