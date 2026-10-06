"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  deleteIncidentSchema,
  type CreateIncidentInput,
  type UpdateIncidentStatusInput,
  type DeleteIncidentInput,
} from "../schemas/incidents.schema";
import {
  CompanyIncidentsService,
  type IncidentRow,
} from "../services/company-incidents";
import type { LaborIncident } from "../types/incidents";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateIncidentActionResult extends ActionResponse<LaborIncident> {
  incident?: LaborIncident;
}

interface UpdateIncidentActionResult extends ActionResponse<IncidentRow> {
  record?: IncidentRow;
}

interface DeleteIncidentActionResult extends ActionResponse<{ id: string }> {
  id?: string;
}

interface GetCompanyIncidentsActionResult extends ActionResponse<LaborIncident[]> {
  incidents: LaborIncident[];
}

/**
 * Registra una nueva incidencia laboral o reconocimiento formal
 */
export async function createIncidentAction(
  rawInput: CreateIncidentInput
): Promise<CreateIncidentActionResult> {
  const parsed = createIncidentSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de incidencia inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicia sesión para registrar la incidencia." };
  }

  try {
    const service = new CompanyIncidentsService(supabase);
    const incident = await service.createIncident(user.id, parsed.data);

    revalidatePath("/dashboard/company/incidents");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/company/payroll");

    return {
      success: true,
      data: incident,
      incident,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al registrar incidencia.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Actualiza la resolución o estatus de una incidencia laboral
 */
export async function updateIncidentStatusAction(
  rawInput: UpdateIncidentStatusInput
): Promise<UpdateIncidentActionResult> {
  const parsed = updateIncidentStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de actualización inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyIncidentsService(supabase);
    const record = await service.updateIncidentStatus(user.id, parsed.data);

    revalidatePath("/dashboard/company/incidents");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/company/payroll");

    return {
      success: true,
      data: record,
      record,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al actualizar incidencia.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Elimina una incidencia laboral
 */
export async function deleteIncidentAction(
  rawIncidentId: string
): Promise<DeleteIncidentActionResult> {
  const parsed = deleteIncidentSchema.safeParse({ incidentId: rawIncidentId });
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "ID de incidencia inválido.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyIncidentsService(supabase);
    await service.deleteIncident(user.id, parsed.data.incidentId);

    revalidatePath("/dashboard/company/incidents");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: { id: parsed.data.incidentId },
      id: parsed.data.incidentId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al eliminar incidencia.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Obtiene todas las incidencias de la empresa desde la base de datos
 */
export async function getCompanyIncidentsAction(): Promise<GetCompanyIncidentsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, incidents: [], error: "No autorizado." };
  }

  try {
    const service = new CompanyIncidentsService(supabase);
    const incidents = await service.getCompanyIncidents(user.id);

    return {
      success: true,
      data: incidents,
      incidents,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener incidencias.";
    return { success: false, incidents: [], error: errorMsg };
  }
}
