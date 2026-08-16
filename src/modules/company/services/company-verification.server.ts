import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  CompanyDocType,
  CompanyVerificationData,
  CompanyVerificationDoc,
} from "./company-verification";

export async function getCompanyVerificationServerData(): Promise<{
  companyId: string;
  verificationData: CompanyVerificationData;
} | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: baseProfile } = await supabase
    .from("profiles")
    .select("email, full_name, location, whatsapp_number, terms_accepted_at")
    .eq("id", user.id)
    .single();

  const { data: companyProfile } = await supabase
    .from("company_profiles")
    .select(
      "company_name, legal_name, rfc, fiscal_address, industry, legal_rep_name, corporate_email, contact_phone, verification_status, entity_type"
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: docsData } = await supabase
    .from("profile_documents")
    .select("*")
    .eq("owner_id", user.id);

  const docsMap: Record<CompanyDocType, CompanyVerificationDoc | null> = {
    acta_constitutiva: null,
    constancia_situacion_fiscal: null,
    legal_rep_id: null,
    legal_power: null,
  };

  if (docsData) {
    docsData.forEach((doc: any) => {
      if (
        [
          "acta_constitutiva",
          "constancia_situacion_fiscal",
          "legal_rep_id",
          "legal_power",
        ].includes(doc.doc_type)
      ) {
        docsMap[doc.doc_type as CompanyDocType] = {
          id: doc.id,
          doc_type: doc.doc_type,
          file_url: doc.file_url,
          file_name: doc.file_name,
          file_size_bytes: doc.file_size_bytes,
          status: doc.status || "pending",
          rejection_reason: doc.rejection_reason,
          created_at: doc.created_at,
        };
      }
    });
  }

  const rawStatus = (companyProfile as any)?.verification_status;
  const normalizedStatus = rawStatus ? rawStatus : "unsubmitted";

  const verificationData: CompanyVerificationData = {
    legal_name: companyProfile?.legal_name || "",
    company_name: companyProfile?.company_name || baseProfile?.full_name || "",
    rfc: companyProfile?.rfc || "",
    fiscal_address: companyProfile?.fiscal_address || (baseProfile as any)?.location || "",
    industry: companyProfile?.industry || "",
    legal_rep_name: companyProfile?.legal_rep_name || "",
    corporate_email: companyProfile?.corporate_email || baseProfile?.email || "",
    contact_phone: companyProfile?.contact_phone || baseProfile?.whatsapp_number || "",
    fiscal_regime: (companyProfile?.entity_type as any) || "persona_moral",
    entity_type: (companyProfile?.entity_type as any) || "persona_moral",
    terms_accepted: !!baseProfile?.terms_accepted_at,
    terms_accepted_at: baseProfile?.terms_accepted_at || null,
    verification_status: normalizedStatus as any,
    documents: docsMap,
  };

  return {
    companyId: user.id,
    verificationData,
  };
}
