import type {
  LeavesRepository,
  CompanyLeaveRow,
} from "../repositories/leaves.repository";

const ACTIVE_STATUSES = ["pendiente", "visto_bueno", "aprobada"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Servicio de dominio: detecta traslapes de ausencias de un colaborador.
 */
export class LeaveOverlapService {
  constructor(private readonly leaves: LeavesRepository) {}

  async findOverlaps(
    companyId: string,
    employeeId: string,
    startDate: string,
    endDate: string,
    options: { excludeLeaveId?: string } = {}
  ): Promise<CompanyLeaveRow[]> {
    if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate) || startDate > endDate) {
      throw new Error("Rango de fechas inválido para validar solapamiento.");
    }

    const leaves = await this.leaves.listByEmployeeAndPeriod(
      companyId,
      employeeId,
      startDate,
      endDate
    );

    return leaves.filter(
      (leave) =>
        leave.id !== options.excludeLeaveId &&
        ACTIVE_STATUSES.includes(leave.status) &&
        leave.start_date <= endDate &&
        leave.end_date >= startDate
    );
  }

  async hasOverlap(
    companyId: string,
    employeeId: string,
    startDate: string,
    endDate: string,
    options: { excludeLeaveId?: string } = {}
  ): Promise<boolean> {
    const overlaps = await this.findOverlaps(companyId, employeeId, startDate, endDate, options);
    return overlaps.length > 0;
  }
}
