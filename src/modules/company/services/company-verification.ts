import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import {
  MAX_DOCUMENT_BYTES,
  optimizeImageForStorage,
} from "@/lib/storage/optimize-upload";

export type CompanyDocType =
  | "acta_constitutiva"
  | "constancia_situacion_fiscal"
  | "legal_rep_id"
  | "legal_power";

export interface CompanyVerificationDoc {
  id?: string;
  doc_type: CompanyDocType;
  file_url: string;
  file_name: string;
  file_size_bytes?: number;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at?: string;
}

export interface CompanyVerificationData {
  legal_name: string;
  company_name: string;
  rfc: string;
  fiscal_address: string;
  industry: string;
  legal_rep_name: string;
  corporate_email: string;
  contact_phone: string;
  entity_type?: "persona_moral" | "persona_fisica";
  fiscal_regime?: "persona_moral" | "persona_fisica";
  terms_accepted: boolean;
  terms_accepted_at?: string | null;
  verification_status: "pending" | "approved" | "rejected" | "unsubmitted";
  rejection_reason?: string | null;
  documents: Record<CompanyDocType, CompanyVerificationDoc | null>;
}

export const companyVerificationService = {
  async getSignedDocumentUrl(filePath: string): Promise<string | null> {
    const supabase = createClient();
    if (!filePath) return null;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }

    const { data, error } = await supabase.storage
      .from("profile_documents")
      .createSignedUrl(filePath, 600);

    if (error || !data?.signedUrl) {
      console.error("Error creating signed URL for verification document:", error);
      return null;
    }

    return data.signedUrl;
  },

  async saveVerificationData(
    userId: string,
    data: Partial<CompanyVerificationData>,
    submitForReview = false
  ) {
    const supabase = createClient();

    // 1. Update company_profiles
    const companyPayload: Database["public"]["Tables"]["company_profiles"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (data.legal_name !== undefined) companyPayload.legal_name = data.legal_name;
    if (data.company_name !== undefined) companyPayload.company_name = data.company_name;
    if (data.rfc !== undefined) companyPayload.rfc = data.rfc;
    if (data.fiscal_address !== undefined) companyPayload.fiscal_address = data.fiscal_address;
    if (data.industry !== undefined) companyPayload.industry = data.industry;
    if (data.legal_rep_name !== undefined) companyPayload.legal_rep_name = data.legal_rep_name;
    if (data.corporate_email !== undefined) companyPayload.corporate_email = data.corporate_email;
    if (data.contact_phone !== undefined) companyPayload.contact_phone = data.contact_phone;
    if (data.entity_type !== undefined || data.fiscal_regime !== undefined) {
      companyPayload.entity_type = (data.entity_type ||
        data.fiscal_regime) as Database["public"]["Tables"]["company_profiles"]["Update"]["entity_type"];
    }

    if (submitForReview) {
      companyPayload.verification_status = "pending";
    }

    const { error: companyErr } = await supabase
      .from("company_profiles")
      .update(companyPayload)
      .eq("id", userId);

    if (companyErr) throw companyErr;

    // 2. Sync base profiles location & contact phone if provided
    const profilesPayload: Database["public"]["Tables"]["profiles"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    if (data.company_name) profilesPayload.full_name = data.company_name;
    if (data.fiscal_address) profilesPayload.location = data.fiscal_address;
    if (data.contact_phone) profilesPayload.whatsapp_number = data.contact_phone;
    if (data.terms_accepted) profilesPayload.terms_accepted_at = new Date().toISOString();

    await supabase
      .from("profiles")
      .update(profilesPayload)
      .eq("id", userId);
  },

  async unlockForEditing(userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("company_profiles")
      .update({
        verification_status: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  },

  async uploadDocument(
    userId: string,
    docType: CompanyDocType,
    rawFile: File
  ): Promise<CompanyVerificationDoc> {
    const supabase = createClient();

    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(rawFile.type)) {
      throw new Error("Formato no permitido. Carga un PDF, JPG, PNG o WEBP.");
    }

    const { file } = await optimizeImageForStorage(rawFile, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.82,
    });

    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new Error(
        "El archivo no puede superar 2 MB. Si es un PDF escaneado, comprímelo antes de subir."
      );
    }

    const ext =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "application/pdf" ? "pdf" : "webp");
    const filePath = `${userId}/${docType}.${ext}`;

    // 1. Upload to Supabase Storage bucket 'profile_documents'
    const { error: uploadErr } = await supabase.storage
      .from("profile_documents")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      throw new Error(
        uploadErr.message || "Error al subir el archivo al servidor."
      );
    }

    // Keep the storage path, never a public URL. Administrators receive a
    // short-lived signed URL from the server when inspecting the document.
    const fileUrl = filePath;

    // 3. Check if document record already exists in profile_documents table
    const { data: existingDoc } = await supabase
      .from("profile_documents")
      .select("id, file_url")
      .eq("owner_id", userId)
      .eq("doc_type", docType)
      .maybeSingle();

    const docPayload = {
      owner_id: userId,
      doc_type: docType,
      file_url: fileUrl,
      file_name: file.name,
      file_size_bytes: file.size,
      status: "pending" as const,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    };

    let docId = existingDoc?.id;

    if (existingDoc?.id) {
      const { error: updateErr } = await supabase
        .from("profile_documents")
        .update(docPayload)
        .eq("id", existingDoc.id);

      if (updateErr) throw updateErr;

      if (
        existingDoc.file_url &&
        existingDoc.file_url !== filePath &&
        !existingDoc.file_url.startsWith("http")
      ) {
        await supabase.storage
          .from("profile_documents")
          .remove([existingDoc.file_url]);
      }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("profile_documents")
        .insert({
          ...docPayload,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      docId = inserted.id;
    }

    return {
      id: docId,
      doc_type: docType,
      file_url: fileUrl,
      file_name: file.name,
      file_size_bytes: file.size,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  },

  async deleteDocument(userId: string, docType: CompanyDocType, docId?: string) {
    const supabase = createClient();

    let fileUrl: string | null = null;

    if (docId) {
      const { data: docData } = await supabase
        .from("profile_documents")
        .select("file_url")
        .eq("id", docId)
        .eq("owner_id", userId)
        .maybeSingle();

      fileUrl = docData?.file_url || null;

      const { error } = await supabase
        .from("profile_documents")
        .delete()
        .eq("id", docId)
        .eq("owner_id", userId);

      if (error) throw error;
    } else {
      const { data: docData } = await supabase
        .from("profile_documents")
        .select("file_url")
        .eq("owner_id", userId)
        .eq("doc_type", docType)
        .maybeSingle();

      fileUrl = docData?.file_url || null;

      const { error } = await supabase
        .from("profile_documents")
        .delete()
        .eq("owner_id", userId)
        .eq("doc_type", docType);

      if (error) throw error;
    }

    // Remove physical file object from Supabase Storage
    if (fileUrl) {
      const parts = fileUrl.split("/profile_documents/");
      const storagePath = fileUrl.startsWith("http") ? (parts.length > 1 ? parts[1] : null) : fileUrl;
      if (storagePath) {
        await supabase.storage.from("profile_documents").remove([decodeURIComponent(storagePath)]);
      }
    }
  },
};
