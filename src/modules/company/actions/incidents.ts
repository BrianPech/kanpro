"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { companyTenantService } from "../services/company-tenant.service";
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  deleteIncidentSchema,
  incidentReferenceSchema,
  prepareEvidenceUploadSchema,
  type PrepareEvidenceUploadInput,
  type CreateIncidentInput,
  type UpdateIncidentStatusInput,
  type DeleteIncidentInput,
} from "../schemas/incidents.schema";
import {
  CompanyIncidentsService,
  type IncidentRow,
} from "../services/company-incidents";
import {
  IncidentEvidenceService,
  type EvidenceUploadTarget,
} from "../services/incident-evidence.service";
import { IncidentActaService } from "../services/incident-acta.service";
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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyIncidentsService(supabase);
    const incident = await service.createIncident(companyScopeId, parsed.data);

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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyIncidentsService(supabase);
    const record = await service.updateIncidentStatus(companyScopeId, parsed.data);

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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyIncidentsService(supabase);
    await service.deleteIncident(companyScopeId, parsed.data.incidentId);

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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyIncidentsService(supabase);
    const incidents = await service.getCompanyIncidents(companyScopeId);

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

/**
 * Prepara la subida directa de una evidencia a Storage (valida tipo y tamaño en servidor)
 */
export async function prepareIncidentEvidenceUploadAction(
  rawInput: PrepareEvidenceUploadInput
): Promise<ActionResponse<EvidenceUploadTarget>> {
  const parsed = prepareEvidenceUploadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Archivo inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const target = await new IncidentEvidenceService(supabase).createUploadTarget(
      companyScopeId,
      parsed.data
    );
    return { success: true, data: target };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al preparar la evidencia.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Devuelve una URL temporal para abrir la evidencia de una incidencia
 */
export async function getIncidentEvidenceUrlAction(
  incidentId: string
): Promise<ActionResponse<{ url: string }>> {
  const parsed = incidentReferenceSchema.safeParse({ incidentId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "ID de incidencia inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const url = await new IncidentEvidenceService(supabase).getEvidenceUrl(
      companyScopeId,
      parsed.data.incidentId
    );
    return { success: true, data: { url } };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al abrir la evidencia.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Genera el Acta Administrativa en PDF (base64) de una incidencia
 */
export async function generateActaAdministrativaAction(
  incidentId: string
): Promise<ActionResponse<{ fileName: string; base64: string }>> {
  const parsed = incidentReferenceSchema.safeParse({ incidentId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "ID de incidencia inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const { fileName, pdf } = await new IncidentActaService(supabase).generate(
      companyScopeId,
      parsed.data.incidentId
    );
    return { success: true, data: { fileName, base64: Buffer.from(pdf).toString("base64") } };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al generar el acta.";
    return { success: false, error: errorMsg };
  }
}
