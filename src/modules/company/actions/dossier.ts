"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { BUSINESS_TIME_ZONE } from "@/lib/formatters";
import type { Database } from "@/types/supabase";
import type { EmployeeDocument, EmployeeDossier } from "../types/employee-dossier";
import {
  companyTenantService,
  isValidUuid,
} from "../services/company-tenant.service";
import {
  getEmployeeDossierById,
  mapDbDocumentTypeToDossierDocType,
} from "../services/company-dossier";

type DbDocumentType = Database["public"]["Enums"]["document_type"];

const VALID_DB_DOCUMENT_TYPES = new Set<DbDocumentType>([
  "ine_passport",
  "curp",
  "constancia_situacion_fiscal",
  "proof_of_address",
  "cv",
  "cedula_profesional",
  "titulo_profesional",
  "acta_constitutiva",
  "legal_power",
  "legal_rep_id",
  "imss_registry",
  "repse",
  "operating_license",
  "work_certificate",
  "recommendation_letter",
  "course_certificate",
  "work_photo",
]);

const DOSSIER_TO_DB_DOCUMENT_TYPE: Record<EmployeeDocument["docType"], DbDocumentType> = {
  ine: "ine_passport",
  curp: "curp",
  rfc_sat: "constancia_situacion_fiscal",
  nss: "imss_registry",
  comprobante_domicilio: "proof_of_address",
  contrato_laboral: "work_certificate",
  carta_antecedentes: "recommendation_letter",
  examen_medico: "work_certificate",
  comprobante_estudios: "titulo_profesional",
};

function resolveDbDocumentType(rawDocType: string | null | undefined): DbDocumentType {
  const normalized = rawDocType?.trim() || "";
  if (VALID_DB_DOCUMENT_TYPES.has(normalized as DbDocumentType)) {
    return normalized as DbDocumentType;
  }
  if (normalized in DOSSIER_TO_DB_DOCUMENT_TYPE) {
    return DOSSIER_TO_DB_DOCUMENT_TYPE[normalized as EmployeeDocument["docType"]];
  }
  return "work_certificate";
}

function resolveUiDocumentType(
  dbDocType: DbDocumentType,
  rawDocType: string | null | undefined
): EmployeeDocument["docType"] {
  const normalized = rawDocType?.trim() || "";
  if (normalized in DOSSIER_TO_DB_DOCUMENT_TYPE) {
    return normalized as EmployeeDocument["docType"];
  }
  return mapDbDocumentTypeToDossierDocType(dbDocType);
}

export type UploadDossierDocumentResult =
  | { success: true; data: EmployeeDocument }
  | { success: false; error: string };

export type GetEmployeeDossierResult =
  | { success: true; data: EmployeeDossier }
  | { success: false; error: string };

function getOptionalAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return undefined;
  }
}

/**
 * Obtiene el expediente completo 360 del colaborador (incluyendo documentos de perfil,
 * contratos, CURP/RFC y métricas laborales) validando el tenant de la empresa activa.
 */
export async function getEmployeeDossierDetailsAction(
  employeeId: string
): Promise<GetEmployeeDossierResult> {
  if (!employeeId || !employeeId.trim()) {
    return { success: false, error: "Identificador de colaborador inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const { companyId } = await companyTenantService.resolveActiveCompanyScope(
      user.id,
      supabase
    );
    const adminClient = getOptionalAdminClient();
    const dossier = await getEmployeeDossierById(
      supabase,
      employeeId.trim(),
      companyId,
      adminClient
    );

    if (!dossier) {
      return { success: false, error: "Expediente de colaborador no encontrado." };
    }

    return { success: true, data: dossier };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al cargar el expediente del colaborador.";
    return { success: false, error: message };
  }
}

/**
 * Carga un documento real a la bóveda de Supabase Storage e indexa su registro
 * en profile_documents para el expediente 360 del colaborador.
 */
export async function uploadDossierDocumentAction(
  formData: FormData
): Promise<UploadDossierDocumentResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const scope = await companyTenantService.resolveAuthorizedCompanyScope(
    user.id,
    supabase,
    ["owner", "admin"]
  );
  if (!scope) {
    return {
      success: false,
      error: "No tienes permisos de administrador para subir documentos en esta empresa.",
    };
  }

  const file = formData.get("file") as File | null;
  const employeeId = (formData.get("employeeId") as string | null)?.trim() || "";
  const candidateId = (formData.get("candidateId") as string | null)?.trim() || "";
  const title = (formData.get("title") as string | null)?.trim();
  const rawDocType = (formData.get("docType") as string | null)?.trim() || "comprobante_estudios";
  const dbDocType = resolveDbDocumentType(rawDocType);
  const uiDocType = resolveUiDocumentType(dbDocType, rawDocType);

  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: "No se proporcionó un archivo válido para cargar." };
  }

  if (!title) {
    return { success: false, error: "El título o nombre del documento es obligatorio." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "El tamaño máximo permitido para documentos es 2 MB." };
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Formato no permitido. Solo se admiten archivos PDF o imágenes (JPG, PNG, WEBP).",
    };
  }

  if (!isValidUuid(employeeId)) {
    return { success: false, error: "Identificador de colaborador inválido." };
  }

  if (candidateId && !isValidUuid(candidateId)) {
    return { success: false, error: "Identificador de candidato inválido." };
  }

  try {
    // 1. Verificar pertenencia del colaborador a la empresa activa
    const { data: employeeRecord, error: empLookupError } = await supabase
      .from("company_employees")
      .select("id, employee_id, company_id")
      .eq("company_id", scope.companyId)
      .or(`id.eq.${employeeId},employee_id.eq.${employeeId}`)
      .maybeSingle();

    if (empLookupError || !employeeRecord) {
      return {
        success: false,
        error: "El colaborador no pertenece a la empresa activa.",
      };
    }

    if (
      candidateId &&
      employeeRecord.employee_id &&
      employeeRecord.employee_id !== candidateId
    ) {
      return {
        success: false,
        error: "El candidato no corresponde al colaborador seleccionado.",
      };
    }

    const verifiedOwnerId = employeeRecord.employee_id || candidateId || null;
    const targetOwnerId = verifiedOwnerId || employeeRecord.id;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `dossiers/${scope.companyId}/${targetOwnerId}/${Date.now()}_${safeName}`;

    // 2. Subida real a Supabase Storage en el bucket privado 'profile_documents'
    const { error: uploadError } = await supabase.storage
      .from("profile_documents")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: "Error al almacenar el archivo en la bóveda digital de Supabase." };
    }

    // 3. Generar URL firmada temporal en lugar de getPublicUrl() sobre bucket privado
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("profile_documents")
      .createSignedUrl(storagePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Storage signed URL error:", signedUrlError);
      return { success: false, error: "No se pudo generar una URL firmada para el documento." };
    }

    const fileUrl = signedUrlData.signedUrl;

    // 4. Registrar metadatos en tabla profile_documents propagando cualquier error de inserción
    let docId = `doc-${Date.now()}`;
    if (verifiedOwnerId) {
      const { data: insertedDoc, error: insertError } = await supabase
        .from("profile_documents")
        .insert({
          owner_id: verifiedOwnerId,
          company_id: scope.companyId,
          doc_type: dbDocType,
          file_name: file.name,
          file_url: storagePath,
          file_size_bytes: file.size,
          status: "approved",
        })
        .select("id")
        .maybeSingle();

      if (insertError || !insertedDoc?.id) {
        await supabase.storage
          .from("profile_documents")
          .remove([storagePath])
          .catch(() => undefined);
        return {
          success: false,
          error: insertError?.message || "No se pudo indexar el documento en el expediente.",
        };
      }

      docId = insertedDoc.id;
    }

    revalidatePath("/dashboard/company/employees");

    const createdDoc: EmployeeDocument = {
      id: docId,
      docType: uiDocType,
      title,
      fileName: file.name,
      fileUrl,
      fileSizeBytes: file.size,
      uploadedAt: new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: BUSINESS_TIME_ZONE,
      }),
      status: "validado",
    };

    return {
      success: true,
      data: createdDoc,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido al indexar el documento.";
    return { success: false, error: message };
  }
}
