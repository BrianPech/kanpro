"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { EmployeeDocument, EmployeeDossier } from "../types/employee-dossier";
import { companyTenantService } from "../services/company-tenant.service";
import { getEmployeeDossierById } from "../services/company-dossier";

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

  const file = formData.get("file") as File | null;
  const employeeId = formData.get("employeeId") as string | null;
  const candidateId = formData.get("candidateId") as string | null;
  const title = (formData.get("title") as string | null)?.trim();
  const docType = (formData.get("docType") as string | null)?.trim() || "comprobante_estudios";

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

  try {
    const targetOwnerId = candidateId || employeeId || user.id;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `dossiers/${targetOwnerId}/${Date.now()}_${safeName}`;

    // 1. Subida real a Supabase Storage en el bucket 'profile_documents'
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

    // 2. Obtener URL del archivo
    const { data: publicUrlData } = supabase.storage
      .from("profile_documents")
      .getPublicUrl(storagePath);

    const fileUrl = publicUrlData.publicUrl;

    // 3. Registrar metadatos en tabla profile_documents si se dispone de owner válido
    let docId = `doc-${Date.now()}`;
    if (candidateId) {
      const { data: insertedDoc } = await supabase
        .from("profile_documents")
        .insert({
          owner_id: candidateId,
          doc_type: "work_certificate",
          file_name: file.name,
          file_url: fileUrl,
          file_size_bytes: file.size,
          status: "approved",
        })
        .select("id")
        .maybeSingle();

      if (insertedDoc?.id) {
        docId = insertedDoc.id;
      }
    }

    revalidatePath("/dashboard/company/employees");

    const createdDoc: EmployeeDocument = {
      id: docId,
      docType: docType as EmployeeDocument["docType"],
      title,
      fileName: file.name,
      fileUrl,
      fileSizeBytes: file.size,
      uploadedAt: new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
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
