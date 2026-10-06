"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  requestDocumentAccessSchema,
  respondDocumentAccessSchema,
  getDocumentAccessStatusSchema,
  getAuthorizedDocumentsSchema,
  getCandidateCvDocumentSchema,
  type RequestDocumentAccessInput,
  type RespondDocumentAccessInput,
} from "../schemas/document-access.schema";
import {
  CompanyDocumentAccessService,
  type AuthorizedCandidateDocumentsResponse,
  type CandidateCvResponse,
} from "../services/company-document-access";

type RequestDocumentAccessActionResult =
  | {
      success: true;
      data: { requestId?: string; status: "pending" | "approved" | "rejected"; message?: string };
      requestId?: string;
      status: "pending" | "approved" | "rejected";
      message?: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      requestId?: undefined;
      status?: undefined;
      message?: undefined;
    };

type RespondDocumentAccessActionResult =
  | { success: true; error?: undefined }
  | { success: false; error: string };

/**
 * Sends a document access request from a company to a candidate for hiring purposes.
 */
export async function requestDocumentAccess(
  applicationId: string,
  candidateId: string,
  requestedDocuments: string[] = ["curp", "rfc", "ine"]
): Promise<RequestDocumentAccessActionResult> {
  const parsed = requestDocumentAccessSchema.safeParse({
    applicationId,
    candidateId,
    requestedDocuments,
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de solicitud inválidos.";
    return { success: false, error: errorMsg };
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
    const result = await CompanyDocumentAccessService.requestDocumentAccess(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/applications");

    return {
      success: true,
      data: {
        requestId: result.requestId,
        status: result.status,
        message: result.message,
      },
      requestId: result.requestId,
      status: result.status,
      message: result.message,
    };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "No se pudo enviar la solicitud de documentos.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Responds to a document access request (for candidate use).
 */
export async function respondDocumentAccessRequest(
  requestId: string,
  status: "approved" | "rejected"
): Promise<RespondDocumentAccessActionResult> {
  const parsed = respondDocumentAccessSchema.safeParse({
    requestId,
    status,
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de respuesta inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    await CompanyDocumentAccessService.respondDocumentAccess(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/candidate/applications");
    revalidatePath("/dashboard/company/applications");

    return { success: true };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "No se pudo actualizar la respuesta.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Gets document access status for a specific application.
 */
export async function getDocumentAccessStatus(applicationId: string) {
  const parsed = getDocumentAccessStatusSchema.safeParse({ applicationId });
  if (!parsed.success) {
    return null;
  }

  const supabase = await createClient();
  return await CompanyDocumentAccessService.getDocumentAccessStatus(
    supabase,
    parsed.data.applicationId
  );
}

/**
 * Retrieves authorized candidate documents with signed preview URLs if access was approved.
 */
export async function getAuthorizedCandidateDocuments(
  applicationId: string,
  candidateId: string
): Promise<AuthorizedCandidateDocumentsResponse> {
  const parsed = getAuthorizedDocumentsSchema.safeParse({
    applicationId,
    candidateId,
  });

  if (!parsed.success) {
    return { authorized: false, documents: [] };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, documents: [] };
  }

  return await CompanyDocumentAccessService.getAuthorizedCandidateDocuments(
    supabase,
    user.id,
    parsed.data
  );
}

/**
 * Retrieves the candidate's uploaded CV file (if available) with a signed URL for company evaluation.
 */
export async function getCandidateCvDocument(
  applicationId: string,
  candidateId: string
): Promise<CandidateCvResponse> {
  const parsed = getCandidateCvDocumentSchema.safeParse({
    applicationId,
    candidateId,
  });

  if (!parsed.success) {
    return {
      hasUploadedCv: false,
      cvUrl: null,
      fileName: null,
      uploadedAt: null,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        hasUploadedCv: false,
        cvUrl: null,
        fileName: null,
        uploadedAt: null,
      };
    }

    return await CompanyDocumentAccessService.getCandidateCvDocument(
      supabase,
      user.id,
      parsed.data
    );
  } catch (error) {
    console.error("Error retrieving candidate CV document:", error);
    return {
      hasUploadedCv: false,
      cvUrl: null,
      fileName: null,
      uploadedAt: null,
    };
  }
}
