import { createClient } from "@/lib/supabase/client";

export type CandidateDocumentType =
  | "ine_passport"
  | "proof_of_address"
  | "cv"
  | "work_certificate"
  | "recommendation_letter"
  | "course_certificate"
  | "cedula_profesional"
  | "titulo_profesional"
  | "work_photo";

export interface CandidateDocument {
  id: string;
  doc_type: CandidateDocumentType;
  file_name: string;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at?: string;
}

const BUCKET = "profile_documents";

export const candidateDocumentsService = {
  /**
   * Retrieves all verified & pending documents for a candidate
   */
  async list(userId: string): Promise<CandidateDocument[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profile_documents")
      .select("id, doc_type, file_name, file_url, status, rejection_reason, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[candidateDocumentsService] Error fetching documents:", error.message || error);
      return [];
    }
    return (data ?? []) as CandidateDocument[];
  },

  /**
   * Uploads a document to Supabase Storage and records it in `profile_documents`
   */
  async upload(userId: string, docType: CandidateDocumentType, file: File, allowMultiple = false) {
    if (file.size > 10 * 1024 * 1024) throw new Error("El archivo no puede superar 10 MB.");
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Formato no permitido. Carga un PDF, JPG, PNG o WEBP.");
    }

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${docType}_${Date.now()}_${safeName}`;

    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
    });
    if (uploadError) throw uploadError;

    // 2. Check previous if single-item document type
    let previous = null;
    if (!allowMultiple) {
      const { data: prevDoc } = await supabase
        .from("profile_documents")
        .select("id, file_url")
        .eq("owner_id", userId)
        .eq("doc_type", docType)
        .maybeSingle();
      previous = prevDoc;
    }

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

    let resultId = "";
    if (previous) {
      const { error: updateError } = await supabase
        .from("profile_documents")
        .update(payload)
        .eq("id", previous.id);
      if (updateError) throw updateError;
      resultId = previous.id;

      // Clean up previous storage file
      if (previous.file_url && previous.file_url !== path && !previous.file_url.startsWith("http")) {
        await supabase.storage.from(BUCKET).remove([previous.file_url]);
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("profile_documents")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) throw insertError;
      resultId = inserted.id;
    }

    return { ...payload, id: resultId };
  },

  /**
   * Deletes a document from Supabase Storage and `profile_documents` table
   */
  async delete(documentId: string, filePath?: string | null) {
    const supabase = createClient();

    // 1. If filePath is provided, remove from storage bucket
    if (filePath && !filePath.startsWith("http")) {
      await supabase.storage.from(BUCKET).remove([filePath]);
    }

    // 2. Delete row from table
    const { error } = await supabase
      .from("profile_documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      console.error("[candidateDocumentsService] Error deleting document record:", error);
      throw error;
    }
  },

  /**
   * Generates a signed URL for secure preview of private documents
   */
  async getSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!filePath) return null;
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn("[candidateDocumentsService] Could not generate signed URL:", error);
      return null;
    }

    return data.signedUrl;
  },

  /**
   * Uploads candidate profile photo to the `avatars` bucket and updates `profiles.avatar_url`
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (file.size > 5 * 1024 * 1024) throw new Error("La fotografía no puede superar 5 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Formato de imagen inválido. Usa JPG, PNG o WEBP.");
    }

    const supabase = createClient();
    const fileExt = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) throw updateError;
    return publicUrl;
  }
};
