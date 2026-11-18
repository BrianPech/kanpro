import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface InitiateConnectionParams {
  candidateId?: string | null;
  vacancyId?: string | null;
  companyPhone?: string | null;
  vacancyTitle?: string | null;
  initiatedBy: "candidate" | "company";
}

/**
 * Normaliza un número telefónico para formato internacional WhatsApp (E.164).
 * Evita duplicar el código de país (52/521) cuando ya está incluido y antepone '52'
 * a números mexicanos de 10 dígitos.
 */
export function formatWhatsAppPhone(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, "");
  if (!clean) return "";

  if (clean.startsWith("5252") && clean.length === 14) {
    clean = clean.slice(2);
  }
  if (clean.startsWith("521") && clean.length === 13) {
    return `52${clean.slice(3)}`;
  }
  if (clean.startsWith("52") && clean.length === 12) {
    return clean;
  }
  if (clean.length === 10) {
    return `52${clean}`;
  }
  return clean;
}

/**
 * Construye una URL universal de WhatsApp (wa.me) con mensaje codificado.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Lógica pura de resolución y registro de conexión de WhatsApp.
 * Desacoplada del ciclo de vida de React para testing directo e inyección de cliente.
 */
export async function executeWhatsAppConnection(
  supabase: ReturnType<typeof createClient>,
  {
    candidateId,
    vacancyId = null,
    companyPhone = null,
    vacancyTitle = null,
    initiatedBy,
  }: InitiateConnectionParams
): Promise<string> {
  // 1. Obtener la sesión del usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debe iniciar sesión para poder contactar.");
  }

  let recruiterId = "";
  let targetCandidateId = "";
  let targetPhone = "";
  let message = "";

  // 2. Flujo según quién inicia el contacto
  if (initiatedBy === "company") {
    recruiterId = user.id;
    targetCandidateId = candidateId || "";

    if (!targetCandidateId) {
      throw new Error("Debe especificar el candidato a contactar.");
    }

    // Consultar datos del perfil del candidato
    const { data: profile, error: selectError } = await supabase
      .from("profiles")
      .select("full_name, whatsapp_number")
      .eq("id", targetCandidateId)
      .maybeSingle();

    if (selectError || !profile) {
      throw new Error(
        `No se pudo obtener el contacto: ${selectError?.message || "Perfil no encontrado"}`
      );
    }

    if (!profile.whatsapp_number) {
      throw new Error("El candidato no tiene registrado un número telefónico de contacto.");
    }

    targetPhone = profile.whatsapp_number;
    const candidateName = profile.full_name || "candidato";
    message = `¡Hola ${candidateName}! Vi tu perfil verificado en K’anPro y me interesó tu perfil. ¿Podríamos conversar sobre una oportunidad?`;
  } else {
    // initiatedBy === "candidate"
    targetCandidateId = user.id;

    if (!vacancyId) {
      throw new Error("Debe especificar una vacante para contactar a la empresa.");
    }

    // Obtener la vacante para determinar el reclutador/empresa propietaria y datos de contacto
    const { data: vacancy, error: vacError } = await supabase
      .from("vacancies")
      .select("id, title, recruiter_id, company_id, contact_phone")
      .eq("id", vacancyId)
      .maybeSingle();

    if (vacError || !vacancy) {
      throw new Error("No se encontró la vacante especificada en la base de datos.");
    }

    recruiterId = vacancy.recruiter_id || vacancy.company_id;

    // Jerarquía de fallback para obtener el teléfono de contacto de la empresa:
    // 1. companyPhone recibido como parámetro
    // 2. vacancies.contact_phone
    // 3. company_profiles.contact_phone
    // 4. profiles.whatsapp_number del reclutador
    let resolvedPhone = companyPhone?.trim() || vacancy.contact_phone?.trim() || null;

    if (!resolvedPhone && vacancy.company_id) {
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("contact_phone")
        .eq("id", vacancy.company_id)
        .maybeSingle();

      if (companyProfile?.contact_phone?.trim()) {
        resolvedPhone = companyProfile.contact_phone.trim();
      }
    }

    if (!resolvedPhone && recruiterId) {
      const { data: recruiterProfile } = await supabase
        .from("profiles")
        .select("whatsapp_number")
        .eq("id", recruiterId)
        .maybeSingle();

      if (recruiterProfile?.whatsapp_number?.trim()) {
        resolvedPhone = recruiterProfile.whatsapp_number.trim();
      }
    }

    if (!resolvedPhone) {
      throw new Error("La empresa no tiene registrado un número de WhatsApp de contacto en esta vacante.");
    }

    targetPhone = resolvedPhone;
    const resolvedTitle = vacancyTitle || vacancy.title || "la vacante";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://kanpro.mx";
    const candidateProfileLink = `${origin}/discovery?candidate=${targetCandidateId}`;
    message = `¡Hola! Vi la vacante de "${resolvedTitle}" en K’anPro y me interesa postularme. Te comparto mi perfil digital: ${candidateProfileLink}`;
  }

  // 3. Registrar la conexión en la base de datos
  const { error: insertError } = await supabase
    .from("connections")
    .insert({
      candidate_id: targetCandidateId,
      recruiter_id: recruiterId,
      vacancy_id: vacancyId,
      initiated_by: initiatedBy,
      status: "contacted",
    });

  if (insertError) {
    console.warn("No se pudo registrar la conexión en connections:", insertError.message);
  }

  // 4. Construir URL de WhatsApp y abrir en ventana nueva si aplica
  const whatsappUrl = buildWhatsAppUrl(targetPhone, message);

  if (typeof window !== "undefined") {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return whatsappUrl;
}

export function useConnection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateWhatsAppConnection = async (
    params: InitiateConnectionParams
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      return await executeWhatsAppConnection(supabase, params);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Ocurrió un error inesperado al conectar.";
      console.error("useConnection error:", errMsg);
      setError(errMsg);
      throw err instanceof Error ? err : new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateWhatsAppConnection,
    loading,
    error,
  };
}
