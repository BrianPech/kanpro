import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  RequestDocumentAccessInput,
  RespondDocumentAccessInput,
  GetAuthorizedDocumentsInput,
  GetCandidateCvDocumentInput,
} from "../schemas/document-access.schema";

export interface AuthorizedDocumentItem {
  id: string;
  doc_type: string;
  file_name: string | null;
  file_url: string | null;
  status: string;
  created_at: string;
}

export interface AuthorizedCandidateDocumentsResponse {
  authorized: boolean;
  documents: AuthorizedDocumentItem[];
}

export interface CandidateCvResponse {
  hasUploadedCv: boolean;
  cvUrl: string | null;
  fileName: string | null;
  uploadedAt: string | null;
}

export interface RequestDocumentAccessResponse {
  success: boolean;
  requestId?: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
}

export class CompanyDocumentAccessService {
  /**
   * Envía una solicitud de acceso al expediente confidencial del candidato.
   */
  static async requestDocumentAccess(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: RequestDocumentAccessInput
  ): Promise<RequestDocumentAccessResponse> {
    // 1. Verificar si ya existe una solicitud para esta postulación
    const { data: existingRequest } = await supabase
      .from("document_access_requests")
      .select("id, status")
      .eq("company_id", companyId)
      .eq("application_id", input.applicationId)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === "approved") {
        return {
          success: true,
          requestId: existingRequest.id,
          message: "La documentación ya fue autorizada por el candidato.",
          status: "approved",
        };
      }
      if (existingRequest.status === "pending") {
        return {
          success: true,
          requestId: existingRequest.id,
          message: "Ya existe una solicitud pendiente enviada al candidato.",
          status: "pending",
        };
      }
    }

    // 2. Insertar nueva solicitud
    const { data: inserted, error } = await supabase
      .from("document_access_requests")
      .insert({
        company_id: companyId,
        candidate_id: input.candidateId,
        application_id: input.applicationId,
        requested_documents: input.requestedDocuments,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("Error creating document access request:", error);
      throw new Error("No se pudo enviar la solicitud de documentos.");
    }

    // 3. Obtener nombre de la empresa para la notificación
    const { data: companyProfile } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", companyId)
      .maybeSingle();

    const companyName = companyProfile?.company_name || "La empresa";

    // 4. Registrar notificación in-app para el candidato
    await supabase.from("notifications").insert({
      user_id: input.candidateId,
      title: "Solicitud de Documentos de Contratación",
      description: `${companyName} solicita tu autorización para revisar tus documentos (INE, CURP, RFC) para tu proceso de contratación.`,
      type: "document_request",
    });

    return {
      success: true,
      requestId: inserted.id,
      status: "pending",
    };
  }

  /**
   * Procesa la respuesta (aprobación o rechazo) dada por el candidato.
   */
  static async respondDocumentAccess(
    supabase: SupabaseClient<Database>,
    candidateId: string,
    input: RespondDocumentAccessInput
  ): Promise<{ success: boolean }> {
    const nowIso = new Date().toISOString();
    const updatePayload = {
      status: input.status,
      approved_at: input.status === "approved" ? nowIso : null,
      rejected_at: input.status === "rejected" ? nowIso : null,
    };

    const { error } = await supabase
      .from("document_access_requests")
      .update(updatePayload)
      .eq("id", input.requestId)
      .eq("candidate_id", candidateId);

    if (error) {
      console.error("Error responding to document access request:", error);
      throw new Error("No se pudo actualizar la respuesta.");
    }

    return { success: true };
  }

  /**
   * Consulta el estado de la solicitud de documentos para una postulación.
   */
  static async getDocumentAccessStatus(
    supabase: SupabaseClient<Database>,
    applicationId: string,
    companyId?: string
  ): Promise<Database["public"]["Tables"]["document_access_requests"]["Row"] | null> {
    let query = supabase
      .from("document_access_requests")
      .select("*")
      .eq("application_id", applicationId);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error) {
      console.error("Error fetching document access status:", error);
      return null;
    }

    return data;
  }

  /**
   * Obtiene los documentos autorizados con signed URLs temporales de Storage.
   */
  static async getAuthorizedCandidateDocuments(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: GetAuthorizedDocumentsInput
  ): Promise<AuthorizedCandidateDocumentsResponse> {
    // 1. Verificar autorización activa para la empresa
    const { data: accessReq } = await supabase
      .from("document_access_requests")
      .select("status")
      .eq("application_id", input.applicationId)
      .eq("company_id", companyId)
      .eq("status", "approved")
      .maybeSingle();

    if (!accessReq) {
      return {
        authorized: false,
        documents: [],
      };
    }

    // 2. Obtener documentos del expediente del candidato
    const { data: docs } = await supabase
      .from("profile_documents")
      .select("id, doc_type, file_url, file_name, status, created_at")
      .eq("owner_id", input.candidateId);

    const docList = docs || [];

    // 3. Generar signed URLs temporales (15 minutos / 900s)
    const documentsWithSignedUrls: AuthorizedDocumentItem[] = await Promise.all(
      docList.map(async (doc) => {
        let signedUrl = doc.file_url;

        if (doc.file_url && !doc.file_url.startsWith("http")) {
          try {
            const { data: signedData } = await supabase.storage
              .from("profile_documents")
              .createSignedUrl(doc.file_url, 900);

            if (signedData?.signedUrl) {
              signedUrl = signedData.signedUrl;
            }
          } catch {
            // En caso de fallo de firmado en tests, conservar ruta original
          }
        }

        return {
          id: doc.id,
          doc_type: doc.doc_type,
          file_name: doc.file_name,
          file_url: signedUrl,
          status: doc.status,
          created_at: doc.created_at,
        };
      })
    );

    return {
      authorized: true,
      documents: documentsWithSignedUrls,
    };
  }

  /**
   * Recupera el CV del candidato con URL firmada para evaluación técnica.
   */
  static async getCandidateCvDocument(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: GetCandidateCvDocumentInput
  ): Promise<CandidateCvResponse> {
    try {
      // 1. Validar explícitamente que exista una postulación activa en applications
      // donde applications.id === input.applicationId, applications.candidate_id === input.candidateId
      // y la vacante pertenezca a la empresa (vacancies.company_id === companyId o recruiter_id === companyId).
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select(`
          id,
          candidate_id,
          vacancies (
            company_id,
            recruiter_id
          )
        `)
        .eq("id", input.applicationId)
        .eq("candidate_id", input.candidateId)
        .maybeSingle();

      if (appError || !application) {
        return {
          hasUploadedCv: false,
          cvUrl: null,
          fileName: null,
          uploadedAt: null,
        };
      }

      const vacancy = Array.isArray(application.vacancies)
        ? application.vacancies[0]
        : application.vacancies;

      if (!vacancy || (vacancy.company_id !== companyId && vacancy.recruiter_id !== companyId)) {
        return {
          hasUploadedCv: false,
          cvUrl: null,
          fileName: null,
          uploadedAt: null,
        };
      }

      // 2. Consulta directa en profile_documents utilizando únicamente el cliente autenticado supabase
      const { data: cvDoc } = await supabase
        .from("profile_documents")
        .select("id, doc_type, file_name, file_url, created_at")
        .eq("owner_id", input.candidateId)
        .eq("doc_type", "cv")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (!cvDoc || !cvDoc.file_url) {
        return {
          hasUploadedCv: false,
          cvUrl: null,
          fileName: null,
          uploadedAt: null,
        };
      }

      let signedUrl = cvDoc.file_url;
      if (!cvDoc.file_url.startsWith("http")) {
        try {
          const { data: signedData } = await supabase.storage
            .from("profile_documents")
            .createSignedUrl(cvDoc.file_url, 3600);

          if (signedData?.signedUrl) {
            signedUrl = signedData.signedUrl;
          }
        } catch {
          // Fallback si Storage genera error
        }
      }

      return {
        hasUploadedCv: true,
        cvUrl: signedUrl,
        fileName: cvDoc.file_name || "Curriculum_Vitae.pdf",
        uploadedAt: cvDoc.created_at || null,
      };
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
}
