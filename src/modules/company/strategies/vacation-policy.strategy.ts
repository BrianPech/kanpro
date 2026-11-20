/**
 * Política de días de vacaciones por año de servicio.
 * Permite políticas personalizadas por empresa (nunca por debajo de la LFT).
 */
export interface VacationPolicyStrategy {
  getDaysForYear(yearNumber: number): number;
}

/**
 * Art. 76 LFT ("Vacaciones Dignas", vigente desde 2023):
 * 1→12, 2→14, 3→16, 4→18, 5→20, 6-10→22, 11-15→24, 16-20→26, 21-25→28, 26-30→30, 31+→32.
 */
export class LftVacationPolicy implements VacationPolicyStrategy {
  private static readonly FIRST_YEARS = [12, 14, 16, 18, 20];
  // Techo superior (inclusive) de cada bloque de 5 años a partir del año 6.
  private static readonly BLOCKS: ReadonlyArray<readonly [number, number]> = [
    [10, 22],
    [15, 24],
    [20, 26],
    [25, 28],
    [30, 30],
  ];
  private static readonly MAX_DAYS = 32;

  getDaysForYear(yearNumber: number): number {
    if (yearNumber <= 0) return 0;
    if (yearNumber <= LftVacationPolicy.FIRST_YEARS.length) {
      return LftVacationPolicy.FIRST_YEARS[yearNumber - 1];
    }
    const block = LftVacationPolicy.BLOCKS.find(([maxYear]) => yearNumber <= maxYear);
    return block ? block[1] : LftVacationPolicy.MAX_DAYS;
  }
}

export const DEFAULT_VACATION_POLICY: VacationPolicyStrategy = new LftVacationPolicy();
