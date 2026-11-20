export type LeaveApprovalMode = "single_step" | "two_step";
export type LeaveApprovalStatus = "pendiente" | "visto_bueno" | "aprobada" | "rechazada";
export type LeaveApprovalActor = "area_leader" | "hr";
export type LeaveApprovalDecision = "aprobada" | "rechazada";

export interface LeaveApprovalOutcome {
  status: LeaveApprovalStatus;
  isFinal: boolean;
}

/**
 * Define quién puede resolver una solicitud y en qué estatus queda tras cada decisión.
 */
export interface LeaveApprovalStrategy {
  readonly mode: LeaveApprovalMode;
  decide(
    current: LeaveApprovalStatus,
    actor: LeaveApprovalActor,
    decision: LeaveApprovalDecision
  ): LeaveApprovalOutcome;
}

function assertOpen(current: LeaveApprovalStatus): void {
  if (current === "aprobada" || current === "rechazada") {
    throw new Error("La solicitud ya fue resuelta.");
  }
}

/** Comportamiento actual: RH responde directo. */
export class SingleStepApproval implements LeaveApprovalStrategy {
  readonly mode = "single_step" as const;

  decide(
    current: LeaveApprovalStatus,
    actor: LeaveApprovalActor,
    decision: LeaveApprovalDecision
  ): LeaveApprovalOutcome {
    assertOpen(current);
    if (actor !== "hr") {
      throw new Error("Solo Recursos Humanos puede resolver esta solicitud.");
    }
    return { status: decision, isFinal: true };
  }
}

/** Vo.Bo. del líder de área → aprobación final de RH. */
export class TwoStepApproval implements LeaveApprovalStrategy {
  readonly mode = "two_step" as const;

  decide(
    current: LeaveApprovalStatus,
    actor: LeaveApprovalActor,
    decision: LeaveApprovalDecision
  ): LeaveApprovalOutcome {
    assertOpen(current);

    if (actor === "area_leader") {
      if (current !== "pendiente") {
        throw new Error("El líder de área ya emitió su Vo.Bo. para esta solicitud.");
      }
      return decision === "aprobada"
        ? { status: "visto_bueno", isFinal: false }
        : { status: "rechazada", isFinal: true };
    }

    if (current !== "visto_bueno") {
      throw new Error("Falta el Vo.Bo. del líder de área antes de la aprobación de RH.");
    }
    return { status: decision, isFinal: true };
  }
}

/** Selecciona la estrategia según la configuración de la empresa; default: un paso. */
export function resolveLeaveApprovalStrategy(
  mode?: LeaveApprovalMode | null
): LeaveApprovalStrategy {
  return mode === "two_step" ? new TwoStepApproval() : new SingleStepApproval();
}
