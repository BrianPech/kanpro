import { createClient } from "@/lib/supabase/client";

export type CandidateDocumentType =
  | "ine_passport"
  | "proof_of_address"
  | "cv"
  | "work_certificate"
  | "recommendation_letter"
  | "course_certificate";

export interface CandidateDocument {
  id: string;
  doc_type: CandidateDocumentType;
  file_name: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
}

const BUCKET = "profile_documents";

export const candidateDocumentsService = {
  async list(userId: string): Promise<CandidateDocument[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profile_documents")
      .select("id, doc_type, file_name, status, rejection_reason")
      .eq("owner_id", userId);
    if (error) throw error;
    return (data ?? []) as CandidateDocument[];
  },

  async upload(userId: string, docType: CandidateDocumentType, file: File) {
    if (file.size > 10 * 1024 * 1024) throw new Error("El archivo no puede superar 10 MB.");
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Formato no permitido. Carga un PDF, JPG, PNG o WEBP.");
    }
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${docType}_${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) throw uploadError;

    const { data: previous, error: previousError } = await supabase
      .from("profile_documents")
      .select("id, file_url")
      .eq("owner_id", userId)
      .eq("doc_type", docType)
      .maybeSingle();
    if (previousError) throw previousError;

    const payload = {
      owner_id: userId,
      doc_type: docType,
      file_url: path,
      file_name: file.name,
      file_size_bytes: file.size,
      status: "pending" as const,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    };
    const { error } = previous
      ? await supabase.from("profile_documents").update(payload).eq("id", previous.id)
      : await supabase.from("profile_documents").insert(payload);
    if (error) throw error;

    if (previous?.file_url && !previous.file_url.startsWith("http")) {
      await supabase.storage.from(BUCKET).remove([previous.file_url]);
    }
    return { ...payload, id: previous?.id ?? "" };
  },
};
