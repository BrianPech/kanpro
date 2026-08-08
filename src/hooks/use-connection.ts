import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface InitiateConnectionParams {
  candidateId: string;
  vacancyId?: string | null;
  initiatedBy: "candidate" | "company";
}

export function useConnection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateWhatsAppConnection = async ({
    candidateId,
    vacancyId = null,
    initiatedBy,
  }: InitiateConnectionParams): Promise<string> => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // 1. Obtener la sesión del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debe iniciar sesión para poder contactar.");
      }

      let recruiterId = "";
      let targetCandidateId = candidateId;

      // 2. Determinar los IDs según quién inicia la conexión
      if (initiatedBy === "company") {
        recruiterId = user.id;
      } else {
        // Si inicia el candidato, se requiere una vacante para obtener el ID de la empresa
        if (!vacancyId) {
          throw new Error("Debe especificar una vacante para postularse.");
        }
        
        // Obtener la vacante para recuperar el ID del reclutador propietario
        const { data: vacancy, error: vacError } = await supabase
          .from("vacancies")
          .select("recruiter_id")
          .eq("id", vacancyId)
          .single();

        if (vacError || !vacancy) {
          throw new Error("No se encontró la vacante especificada en la base de datos.");
        }
        
        recruiterId = vacancy.recruiter_id;
        targetCandidateId = user.id;
      }

      // 3. Paso A: Registrar la conexión en la base de datos (clic a WhatsApp)
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
        throw new Error(`Error al registrar la conexión: ${insertError.message}`);
      }

      // 4. Paso B: Consultar perfil en la tabla profiles
      const { data: profile, error: selectError } = await supabase
        .from("profiles")
        .select("full_name, whatsapp_number")
        .eq("id", targetCandidateId)
        .single();

      if (selectError || !profile) {
        throw new Error(`No se pudo obtener el contacto: ${selectError?.message || "Perfil no encontrado"}`);
      }

      const targetPhone = (profile as any)?.phone || profile.whatsapp_number;
      if (!targetPhone) {
        throw new Error("El candidato no tiene registrado un número telefónico de contacto.");
      }

      // 5. Paso C: Construir el mensaje según plantilla
      let message = "";
      if (initiatedBy === "company") {
        message = `¡Hola ${profile.full_name}! Vi tu perfil verificado en K’anPro y me interesó tu perfil. ¿Podríamos conversar sobre una oportunidad?`;
      } else {
        const candidateProfileLink = `${window.location.origin}/discovery?candidate=${targetCandidateId}`;
        message = `¡Hola! Vi la vacante que publicaron en K’anPro. Te adjunto mi perfil digital: ${candidateProfileLink}`;
      }

      // Limpiar el número de teléfono y generar URL universal de WhatsApp
      const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      // 6. Paso D: Abrir en pestaña nueva si el entorno lo permite
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      return whatsappUrl;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado al conectar.");
      throw err;
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
