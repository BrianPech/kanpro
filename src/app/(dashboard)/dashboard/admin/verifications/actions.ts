"use server";

import type { createClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";

export interface ProfileDocumentItem {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  status: string;
  createdAt: string;
}

type ProfileDocumentRow = Database["public"]["Tables"]["profile_documents"]["Row"];

async function batchToAdminDocumentItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  docs: ProfileDocumentRow[]
): Promise<ProfileDocumentItem[]> {
  if (!docs || docs.length === 0) {
    return [];
  }

  const nonHttpPaths = docs
    .map((d) => d.file_url)
    .filter((url): url is string => Boolean(url) && !url.startsWith("http://") && !url.startsWith("https://"));

  const uniquePaths = Array.from(new Set(nonHttpPaths));
  const signedUrlsMap = new Map<string, string>();

  if (uniquePaths.length > 0) {
    const { data, error } = await supabase.storage
      .from("profile_documents")
      .createSignedUrls(uniquePaths, 600);

    if (!error && data) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item?.signedUrl) {
          if (item.path) {
            signedUrlsMap.set(item.path, item.signedUrl);
          }
          if (uniquePaths[i]) {
            signedUrlsMap.set(uniquePaths[i], item.signedUrl);
          }
        }
      }
    }
  }

  return docs.map((doc) => {
    const path = doc.file_url;
    const isHttp = Boolean(path && (path.startsWith("http://") || path.startsWith("https://")));
    const signedUrl = isHttp ? (path || "") : (path ? signedUrlsMap.get(path) || "" : "");

    return {
      id: doc.id,
      docType: doc.doc_type,
      fileName: doc.file_name,
      fileUrl: signedUrl,
      fileSizeBytes: doc.file_size_bytes || undefined,
      status: doc.status || "pending",
      createdAt: doc.created_at
        ? new Date(doc.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
        : "Reciente",
    };
  });
}

export interface PendingCompanyItem {
  id: string;
  companyName: string;
  legalName?: string;
  rfc: string;
  entityType?: string;
  fiscalAddress?: string;
  addressDetails?: string;
  industry: string;
  companySize?: string;
  operationHours?: string;
  websiteUrl?: string;
  imssPatronalRegistry?: string;
  repseRegistry?: string;
  legalRepName?: string;
  verificationStatus: "pending" | "approved" | "rejected" | "requires_revision";
  isVerified: boolean;
  contactEmail: string;
  contactPhone: string;
  dbUploadedDocuments: ProfileDocumentItem[];
  documents: {
    rfcConstanciaUrl?: string;
    imssRegistryUrl?: string;
    repseUrl?: string;
    legalRepIdUrl?: string;
    proofOfAddressUrl?: string;
    actaConstitutivaUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PendingCandidateItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  candidateType: "profesional" | "tecnico" | "operativo";
  specializationArea?: string;
  yearsExperience?: number;
  cedulaProfesional?: string;
  rfc?: string;
  curp?: string;
  headline?: string;
  bio?: string;
  preferredZone?: string;
  tradeDescription?: string;
  skills?: string[];
  isVerified: boolean;
  dbUploadedDocuments: ProfileDocumentItem[];
  documents: {
    cedulaUrl?: string;
    ineUrl?: string;
    curpDocUrl?: string;
    cvUrl?: string;
    portfolioUrl?: string;
  };
  createdAt: string;
}

/**
 * Genera una URL firmada o pública desde Supabase Storage para un archivo.
 */
export async function getSignedDocumentUrl(bucket: string, path: string): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
  return data?.signedUrl || "";
}

/**
 * Consulta la lista de empresas para auditoría de expediente fiscal y legal desde Supabase (incluyendo profile_documents).
 */
export async function getCompanyVerifications(): Promise<PendingCompanyItem[]> {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });

  const { data: companies, error } = await supabase
    .from("company_profiles")
    .select("*, profiles ( id, email, whatsapp_number, is_verified )")
    .order("created_at", { ascending: false });

  if (error || !companies || companies.length === 0) {
    return [];
  }

  const companyIds = companies.map((c) => c.id);
  const companyIdList = companyIds.join(",");

  // Consulta por lote de Profile Documents (soporta company_id y registros legacy con company_id NULL)
  const { data: dbDocs } = await supabase
    .from("profile_documents")
    .select("*")
    .not("file_url", "like", "dossiers/%")
    .or(
      `company_id.in.(${companyIdList}),and(owner_id.in.(${companyIdList}),company_id.is.null)`
    );

  const companyDocsMap = new Map<string, ProfileDocumentItem[]>();
  if (dbDocs && dbDocs.length > 0) {
    const signedDocs = await batchToAdminDocumentItems(supabase, dbDocs);
    for (let i = 0; i < dbDocs.length; i++) {
      const doc = dbDocs[i];
      const signedDoc = signedDocs[i];
      const mapKey = doc.company_id || doc.owner_id;
      const existing = companyDocsMap.get(mapKey) || [];
      existing.push(signedDoc);
      companyDocsMap.set(mapKey, existing);
    }
  }

  return companies.map((c) => {
    const p = (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) as {
      id: string;
      email: string;
      whatsapp_number: string;
      is_verified: boolean;
    } | null | undefined;
    const uploadedDocs = companyDocsMap.get(c.id) || [];

    // Helper map for legacy slots
    const docMap = new Map(uploadedDocs.map((d) => [d.docType, d.fileUrl]));

    return {
      id: c.id,
      companyName: c.company_name,
      legalName: c.legal_name || undefined,
      rfc: c.rfc || "Sin RFC registrado",
      entityType: (c.entity_type as string) || undefined,
      fiscalAddress: c.fiscal_address || undefined,
      addressDetails: c.address_details || undefined,
      industry: c.industry || "General",
      companySize: c.company_size || undefined,
      operationHours: c.operation_hours || undefined,
      websiteUrl: c.website_url || undefined,
      imssPatronalRegistry: c.imss_patronal_registry || undefined,
      repseRegistry: c.repse_registry || undefined,
      legalRepName: c.legal_rep_name || undefined,
      verificationStatus: (c.verification_status as PendingCompanyItem["verificationStatus"]) || "pending",
      isVerified: p?.is_verified || false,
      contactEmail: c.corporate_email || p?.email || "Sin correo",
      contactPhone: c.contact_phone || p?.whatsapp_number || "Sin teléfono",
      dbUploadedDocuments: uploadedDocs,
      documents: {
        rfcConstanciaUrl: docMap.get("constancia_situacion_fiscal"),
        imssRegistryUrl: docMap.get("imss_registry"),
        repseUrl: docMap.get("repse"),
        legalRepIdUrl: docMap.get("legal_rep_id"),
        proofOfAddressUrl: docMap.get("proof_of_address"),
        actaConstitutivaUrl: docMap.get("acta_constitutiva"),
      },
      createdAt: c.created_at
        ? new Date(c.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Reciente",
      updatedAt: c.updated_at || new Date().toISOString(),
    };
  });
}

/**
 * Consulta el expediente completo de una empresa específica por su ID.
 */
export async function getCompanyVerificationById(companyId: string): Promise<PendingCompanyItem | null> {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });

  const [companyRes, dbDocsRes] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("*, profiles ( id, email, whatsapp_number, is_verified )")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("profile_documents")
      .select("*")
      .not("file_url", "like", "dossiers/%")
      .or(`company_id.eq.${companyId},and(owner_id.eq.${companyId},company_id.is.null)`),
  ]);

  const company = companyRes.data;
  if (companyRes.error || !company) {
    return null;
  }

  const p = (Array.isArray(company.profiles) ? company.profiles[0] : company.profiles) as {
    id: string;
    email: string;
    whatsapp_number: string;
    is_verified: boolean;
  } | null | undefined;

  const dbDocs = dbDocsRes.data || [];
  const uploadedDocs = dbDocs.length > 0
    ? await batchToAdminDocumentItems(supabase, dbDocs)
    : [];

  const docMap = new Map(uploadedDocs.map((d) => [d.docType, d.fileUrl]));

  return {
    id: company.id,
    companyName: company.company_name,
    legalName: company.legal_name || undefined,
    rfc: company.rfc || "Sin RFC registrado",
    entityType: (company.entity_type as string) || undefined,
    fiscalAddress: company.fiscal_address || undefined,
    addressDetails: company.address_details || undefined,
    industry: company.industry || "General",
    companySize: company.company_size || undefined,
    operationHours: company.operation_hours || undefined,
    websiteUrl: company.website_url || undefined,
    imssPatronalRegistry: company.imss_patronal_registry || undefined,
    repseRegistry: company.repse_registry || undefined,
    legalRepName: company.legal_rep_name || undefined,
    verificationStatus: (company.verification_status as PendingCompanyItem["verificationStatus"]) || "pending",
    isVerified: p?.is_verified || false,
    contactEmail: company.corporate_email || p?.email || "Sin correo",
    contactPhone: company.contact_phone || p?.whatsapp_number || "Sin teléfono",
    dbUploadedDocuments: uploadedDocs,
    documents: {
      rfcConstanciaUrl: docMap.get("constancia_situacion_fiscal"),
      imssRegistryUrl: docMap.get("imss_registry"),
      repseUrl: docMap.get("repse"),
      legalRepIdUrl: docMap.get("legal_rep_id"),
      proofOfAddressUrl: docMap.get("proof_of_address"),
      actaConstitutivaUrl: docMap.get("acta_constitutiva"),
    },
    createdAt: company.created_at
      ? new Date(company.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Reciente",
    updatedAt: company.updated_at || new Date().toISOString(),
  };
}

/**
 * Consulta el expediente completo de un candidato específico por su ID.
 */
export async function getCandidateVerificationById(candidateId: string): Promise<PendingCandidateItem | null> {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });

  const [candidateRes, privateProfileRes, dbDocsRes] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("*, profiles ( id, full_name, email, whatsapp_number, is_verified )")
      .eq("id", candidateId)
      .maybeSingle(),
    supabase
      .from("candidate_private_profiles")
      .select("id, curp, rfc, cedula_profesional")
      .eq("id", candidateId)
      .maybeSingle(),
    supabase
      .from("profile_documents")
      .select("*")
      .eq("owner_id", candidateId),
  ]);

  const candidate = candidateRes.data;
  if (candidateRes.error || !candidate) {
    return null;
  }

  const profile = (Array.isArray(candidate.profiles) ? candidate.profiles[0] : candidate.profiles) as {
    id: string;
    full_name: string;
    email: string;
    whatsapp_number: string;
    is_verified: boolean;
  } | null | undefined;

  const privateProfile = privateProfileRes.data;
  const dbDocs = dbDocsRes.data || [];
  const uploadedDocs = dbDocs.length > 0
    ? await batchToAdminDocumentItems(supabase, dbDocs)
    : [];

  const docMap = new Map(uploadedDocs.map((d) => [d.docType, d.fileUrl]));

  return {
    id: candidate.id,
    fullName: profile?.full_name || "Candidato K’anPro",
    email: profile?.email || "Sin correo",
    phone: profile?.whatsapp_number || "Sin teléfono",
    candidateType: (candidate.candidate_type as PendingCandidateItem["candidateType"]) || "operativo",
    specializationArea: candidate.specialization_area || undefined,
    yearsExperience: candidate.years_experience || undefined,
    cedulaProfesional: privateProfile?.cedula_profesional || undefined,
    rfc: privateProfile?.rfc || undefined,
    curp: privateProfile?.curp || undefined,
    headline: candidate.headline || undefined,
    bio: candidate.bio || undefined,
    preferredZone: candidate.preferred_zone || undefined,
    tradeDescription: candidate.trade_description || undefined,
    skills: Array.isArray(candidate.skills) ? (candidate.skills as string[]) : undefined,
    isVerified: profile?.is_verified || false,
    dbUploadedDocuments: uploadedDocs,
    documents: {
      cedulaUrl: docMap.get("cedula_profesional"),
      curpDocUrl: docMap.get("curp"),
      cvUrl: docMap.get("cv"),
      ineUrl: docMap.get("ine_passport"),
      portfolioUrl: Array.isArray(candidate.portfolio_links) ? (candidate.portfolio_links[0] as string) : undefined,
    },
    createdAt: candidate.created_at
      ? new Date(candidate.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Reciente",
  };
}

/**
 * Consulta la lista de candidatos para auditoría de expedientes profesionales desde Supabase (incluyendo profile_documents).
 */
export async function getCandidateVerifications(): Promise<PendingCandidateItem[]> {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });

  const { data: candidateProfiles, error } = await supabase
    .from("candidate_profiles")
    .select("*, profiles ( id, full_name, email, whatsapp_number, is_verified )")
    .order("created_at", { ascending: false });

  if (error || !candidateProfiles || candidateProfiles.length === 0) {
    return [];
  }

  const candidateIds = candidateProfiles.map((c) => c.id);

  const [{ data: privateProfiles }, { data: dbDocs }] = await Promise.all([
    supabase
      .from("candidate_private_profiles")
      .select("id, curp, rfc, cedula_profesional")
      .in("id", candidateIds),
    supabase
      .from("profile_documents")
      .select("*")
      .in("owner_id", candidateIds),
  ]);

  const privateProfileMap = new Map((privateProfiles || []).map((profile) => [profile.id, profile]));

  const candidateDocsMap = new Map<string, ProfileDocumentItem[]>();
  if (dbDocs && dbDocs.length > 0) {
    const signedDocs = await batchToAdminDocumentItems(supabase, dbDocs);
    for (let i = 0; i < dbDocs.length; i++) {
      const doc = dbDocs[i];
      const signedDoc = signedDocs[i];
      const existing = candidateDocsMap.get(doc.owner_id) || [];
      existing.push(signedDoc);
      candidateDocsMap.set(doc.owner_id, existing);
    }
  }

  return candidateProfiles.map((c) => {
    const p = (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) as {
      id: string;
      full_name: string;
      email: string;
      whatsapp_number: string;
      is_verified: boolean;
    } | null | undefined;
    const privateProfile = privateProfileMap.get(c.id);
    const uploadedDocs = candidateDocsMap.get(c.id) || [];
    const docMap = new Map(uploadedDocs.map((d) => [d.docType, d.fileUrl]));

    return {
      id: c.id,
      fullName: p?.full_name || "Candidato K’anPro",
      email: p?.email || "Sin correo",
      phone: p?.whatsapp_number || "Sin teléfono",
      candidateType: (c.candidate_type as PendingCandidateItem["candidateType"]) || "operativo",
      specializationArea: c.specialization_area || undefined,
      yearsExperience: c.years_experience || undefined,
      cedulaProfesional: privateProfile?.cedula_profesional || undefined,
      rfc: privateProfile?.rfc || undefined,
      curp: privateProfile?.curp || undefined,
      headline: c.headline || undefined,
      bio: c.bio || undefined,
      preferredZone: c.preferred_zone || undefined,
      tradeDescription: c.trade_description || undefined,
      skills: Array.isArray(c.skills) ? (c.skills as string[]) : undefined,
      isVerified: p?.is_verified || false,
      dbUploadedDocuments: uploadedDocs,
      documents: {
        cedulaUrl: docMap.get("cedula_profesional"),
        curpDocUrl: docMap.get("curp"),
        cvUrl: docMap.get("cv"),
        ineUrl: docMap.get("ine_passport"),
        portfolioUrl: Array.isArray(c.portfolio_links) ? (c.portfolio_links[0] as string) : undefined,
      },
      createdAt: c.created_at
        ? new Date(c.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Reciente",
    };
  });
}

/**
 * Dictamina la verificación de expediente de una empresa en Supabase.
 */
export async function reviewCompanyVerification(
  companyId: string,
  newStatus: "approved" | "rejected" | "requires_revision",
  notes?: string
) {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });

  const isVerified = newStatus === "approved";

  // 1. Update company_profiles status
  const { error: companyErr } = await supabase
    .from("company_profiles")
    .update({
      verification_status: newStatus === "requires_revision" ? "pending" : newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (companyErr) {
    throw new Error(`Error al actualizar estado en empresa: ${companyErr.message}`);
  }

  if (isVerified) {
    const { data: documents } = await supabase.from("profile_documents").select("status").eq("owner_id", companyId);
    if (!documents?.length || documents.some((document) => document.status !== "approved")) {
      throw new Error("Aprueba cada documento cargado antes de otorgar la insignia.");
    }
  }

  // 2. Update profile is_verified badge
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      is_verified: isVerified,
    })
    .eq("id", companyId);

  if (profileErr) {
    throw new Error(`Error al actualizar badge en perfil: ${profileErr.message}`);
  }

  // 3. Send notification to company
  const titleText = isVerified
    ? " Expediente Fiscal Aprobado"
    : newStatus === "requires_revision"
    ? " Subsanación de Expediente Requerida"
    : " Dictamen de Expediente Reanudado";

  const messageText = notes
    ? notes.trim()
    : isVerified
    ? "Su empresa ha sido verificada satisfactoriamente. Se ha otorgado la insignia de Empresa Verificada K’anPro."
    : "Por favor revise la documentación adjunta en su perfil empresarial para completar su validación.";

  await supabase.from("notifications").insert({
    user_id: companyId,
    type: "verification_update",
    title: titleText,
    description: messageText,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard/admin/verifications");
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

/**
 * Dictamina la verificación de expediente de un candidato en Supabase.
 */
export async function reviewCandidateVerification(
  candidateId: string,
  isVerified: boolean,
  notes?: string
) {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      is_verified: isVerified,
    })
    .eq("id", candidateId);

  if (profileErr) {
    throw new Error(`Error al dictaminar candidato: ${profileErr.message}`);
  }

  if (isVerified) {
    const { data: documents } = await supabase.from("profile_documents").select("status").eq("owner_id", candidateId);
    if (!documents?.length || documents.some((document) => document.status !== "approved")) {
      throw new Error("Aprueba cada documento cargado antes de verificar el expediente.");
    }
  }

  // Send notification to candidate
  const titleText = isVerified
    ? " Expediente Digital Verificado"
    : " Notificación sobre Expediente Digital";

  const messageText = notes
    ? notes.trim()
    : isVerified
    ? "Su expediente profesional y documentos han sido auditados y aprobados con éxito."
    : "Por favor revise los documentos cargados en su perfil de candidato.";

  await supabase.from("notifications").insert({
    user_id: candidateId,
    type: "verification_update",
    title: titleText,
    description: messageText,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard/admin/verifications");
  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function reviewProfileDocument(
  documentId: string,
  status: "approved" | "rejected",
  notes?: string
) {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });
  const { error } = await supabase
    .from("profile_documents")
    .update({ status, rejection_reason: status === "rejected" ? notes?.trim() || "Documento rechazado por el equipo de verificación." : null, updated_at: new Date().toISOString() })
    .eq("id", documentId);
  if (error) throw new Error(`No fue posible dictaminar el documento: ${error.message}`);
  revalidatePath("/dashboard/admin/verifications");
  return { success: true };
}
