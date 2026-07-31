import { createClient } from "@/lib/supabase/client";

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
  terms_accepted: boolean;
  terms_accepted_at?: string | null;
  verification_status: "pending" | "approved" | "rejected" | "unsubmitted";
  rejection_reason?: string | null;
  documents: Record<CompanyDocType, CompanyVerificationDoc | null>;
}

export const companyVerificationService = {
  async saveVerificationData(
    userId: string,
    data: Partial<CompanyVerificationData>,
    submitForReview = false
  ) {
    const supabase = createClient();

    // 1. Update company_profiles
    const companyPayload: any = {
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

    if (submitForReview) {
      companyPayload.verification_status = "pending";
    }

    const { error: companyErr } = await supabase
      .from("company_profiles")
      .update(companyPayload)
      .eq("id", userId);

    if (companyErr) throw companyErr;

    // 2. Update terms acceptance on base profiles if needed
    if (data.terms_accepted) {
      const nowStr = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({ terms_accepted_at: nowStr, updated_at: nowStr })
        .eq("id", userId);
    }
  },

  async uploadDocument(
    userId: string,
    docType: CompanyDocType,
    file: File
  ): Promise<CompanyVerificationDoc> {
    const supabase = createClient();

    // Clean filename
    const sanitizeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${userId}/${docType}_${Date.now()}_${sanitizeName}`;

    // 1. Upload to Supabase Storage bucket 'profile_documents'
    const { error: uploadErr } = await supabase.storage
      .from("profile_documents")
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      throw new Error(
        uploadErr.message || "Error al subir el archivo al servidor."
      );
    }

    // 2. Get Public or Signed URL
    const { data: urlData } = supabase.storage
      .from("profile_documents")
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl || filePath;

    // 3. Check if document record already exists in profile_documents table
    const { data: existingDoc } = await supabase
      .from("profile_documents")
      .select("id")
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

    if (docId) {
      const { error } = await supabase
        .from("profile_documents")
        .delete()
        .eq("id", docId)
        .eq("owner_id", userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("profile_documents")
        .delete()
        .eq("owner_id", userId)
        .eq("doc_type", docType);

      if (error) throw error;
    }
  },
};
