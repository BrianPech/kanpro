"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyService } from "../services/company-service";
import { createClient } from "@/lib/supabase/client";

export interface Experience {
  role: string;
  period: string;
  company: string;
  description: string;
}

export interface Education {
  degree: string;
  period: string;
  institution: string;
  description?: string;
}

export interface InterviewDetails {
  date: string;
  time?: string;
  modality: "presencial" | "virtual";
  locationOrLink: string;
  notes?: string;
  scheduledAt?: string;
  status?: "pending" | "confirmed" | "rescheduled" | "cancelled" | "completed";
  candidateResponseNotes?: string;
  proposedDate?: string;
  proposedTime?: string;
  respondedAt?: string;
}

export interface Applicant {
  id: string;
  name: string;
  headline: string;
  avatar: string;
  location: string;
  elapsedTime: string;
  status: "Pendiente" | "En revisión" | "Preseleccionado" | "Entrevista" | "Contratado" | "Descartado";
  interview?: InterviewDetails | null;
  rating: number;
  reviewsCount: number;
  bio: string;
  experiences: Experience[];
  education?: Education[];
  skills: string[];
  portfolio?: { image: string; title: string }[];
  phone: string;
  email?: string;
  vacancyTitle: string;
  vacancyId: string;
  candidateId: string;
  internalRating?: number;
  internalNotes?: string;
  isEarlyAccess?: boolean;
}

interface ApplicationsQueryData {
  vacancies: { id: string; title: string }[];
  applicants: Applicant[];
}

/**
 * Valida si una transición de estatus en el inbox es permitida directamente.
 * La transición a 'Contratado' está estrictamente prohibida vía actualización directa
 * y exige pasar por el asistente oficial de contratación (HireCandidateWizardModal).
 */
export function validateApplicationStatusTransition(newStatus: Applicant["status"]): {
  allowed: boolean;
  message?: string;
} {
  if (newStatus === "Contratado") {
    return {
      allowed: false,
      message:
        "Para contratar al candidato debes utilizar el asistente de contratación oficial (Formalizar Contratación) para generar su expediente de colaborador y contrato laboral.",
    };
  }
  return { allowed: true };
}

export function useApplicationsInbox(options?: { companyId?: string }) {
  const queryClient = useQueryClient();
  // Helper to read initial vacancy_id from URL query string if present
  const getInitialVacancyId = () => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get("vacancy_id") || params.get("vacancyId") || "all";
      } catch {}
    }
    return "all";
  };

  const [selectedVacancyId, setSelectedVacancyIdState] = React.useState<string>(getInitialVacancyId);

  // Sync when URL query string changes (e.g. back/forward navigation or link click)
  React.useEffect(() => {
    const handleUrlChange = () => {
      const urlId = getInitialVacancyId();
      if (urlId !== selectedVacancyId) {
        setSelectedVacancyIdState(urlId);
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, [selectedVacancyId]);

  const setSelectedVacancyId = React.useCallback((id: string) => {
    setSelectedVacancyIdState(id);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (id === "all") {
          url.searchParams.delete("vacancy_id");
          url.searchParams.delete("vacancyId");
        } else {
          url.searchParams.set("vacancy_id", id);
          url.searchParams.delete("vacancyId");
        }
        window.history.replaceState({}, "", url.toString());
      } catch {}
    }
  }, []);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [userId, setUserId] = React.useState<string>("");

  const supabase = React.useMemo(() => createClient(), []);

  // Fetch current user id safely without updating state inside queryFn
  React.useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted && user) {
        setUserId(user.id);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const queryKey = ["company-applications", options?.companyId || "default"];

  const { data, isLoading, refetch } = useQuery<ApplicationsQueryData>({
    queryKey,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const targetCompanyId = options?.companyId || user.id;

      const [vacList, apps] = await Promise.all([
        companyService.getVacancies(targetCompanyId).catch(() => []),
        companyService.getApplications(targetCompanyId).catch(() => []),
      ]);

      const normalizeStatus = (rawStatus: string): Applicant["status"] => {
        const s = (rawStatus || "").toLowerCase().trim();
        if (s === "pendiente" || s === "applied" || s === "pending") return "Pendiente";
        if (s === "en revisión" || s === "en revision" || s === "reviewing" || s === "in_review") return "En revisión";
        if (s === "preseleccionado" || s === "pre-seleccionado" || s === "shortlisted") return "Preseleccionado";
        if (s === "entrevista" || s === "interview" || s === "interviewing") return "Entrevista";
        if (s === "contratado" || s === "hired" || s === "accepted") return "Contratado";
        if (s === "descartado" || s === "rejected" || s === "discarded") return "Descartado";
        return "Pendiente";
      };

      let mapped: Applicant[] = [];
      if (apps && apps.length > 0) {
        mapped = apps.map((app: any) => {
          const profile = app.candidate || {};

          let experiences: Experience[] = [];
          if (profile.experience && Array.isArray(profile.experience)) {
            experiences = profile.experience as Experience[];
          }

          let education: Education[] = [];
          if (profile.education && Array.isArray(profile.education)) {
            education = profile.education as Education[];
          }

          let skills: string[] = [];
          if (profile.skills) {
            if (Array.isArray(profile.skills)) {
              skills = profile.skills.map((s: any) => String(s || "").trim()).filter(Boolean);
            } else if (typeof profile.skills === "string") {
              skills = (profile.skills as string).split(",").map((s: string) => s.trim()).filter(Boolean);
            }
          }

          const appDateStr = app.applied_at || app.updated_at;
          let elapsedTime = "Hace poco";
          if (appDateStr) {
            const date = new Date(appDateStr);
            if (!isNaN(date.getTime())) {
              const diffMs = Date.now() - date.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              if (diffDays > 0) {
                elapsedTime = `Hace ${diffDays}d`;
              } else if (diffHours > 0) {
                elapsedTime = `Hace ${diffHours}h`;
              }
            }
          }

          const serverNotes = app.notes || "";
          const serverRating = typeof app.rating === "number" && app.rating > 0 ? app.rating : 5;
          const serverInterview = app.interview_details || null;

          let currentNotes = serverNotes;
          let currentRating = serverRating;
          let currentInterview: InterviewDetails | null = serverInterview;

          const vacTitle = app.vacancies?.title || (Array.isArray(app.vacancies) ? app.vacancies[0]?.title : null) || "Vacante";
          const vacId = app.vacancy_id || app.vacancies?.id || "";

          return {
            id: app.id || `app-${Math.random().toString(36).slice(2)}`,
            name: profile.full_name || "Profesional K'anPro",
            headline: profile.headline || "Candidato",
            avatar: profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
            location: profile.location || "Local",
            elapsedTime,
            status: normalizeStatus(app.status),
            interview: currentInterview,
            rating: currentRating,
            internalRating: currentRating,
            internalNotes: currentNotes,
            reviewsCount: 5,
            bio: profile.bio || "Sin biografía disponible.",
            experiences,
            education,
            skills,
            phone: profile.phone || "",
            email: profile.email || "",
            vacancyTitle: vacTitle,
            vacancyId: vacId,
            candidateId: profile.id || app.candidate_id || "",
            isEarlyAccess: profile.is_early_access ?? true,
            portfolio: Array.isArray(profile.portfolio_links)
              ? profile.portfolio_links.map((link: any, idx: number) => ({
                  title: typeof link === "string" ? `Enlace ${idx + 1}` : link?.title || `Proyecto ${idx + 1}`,
                  image: typeof link === "string" ? link : link?.url || "",
                }))
              : [],
          };
        });
      }

      return {
        vacancies: vacList || [],
        applicants: mapped,
      };
    },
  });

  const applicants = data?.applicants || [];
  const vacancies = data?.vacancies || [];

  // Auto-select first applicant if none selected or if selected is missing
  React.useEffect(() => {
    if (applicants.length > 0 && (!selectedId || !applicants.some((a) => a.id === selectedId))) {
      setSelectedId(applicants[0].id);
    }
  }, [applicants, selectedId]);

  // Supabase Realtime subscription for live incoming notifications
  React.useEffect(() => {
    if (!userId) return;

    const channelSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(`company-applications-live-${userId}-${channelSuffix}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new?: { title?: string; description?: string; type?: string } }) => {
          queryClient.invalidateQueries({ queryKey: ["company-applications"] });
          toast.info(payload.new?.title || "¡Nueva postulación recibida en tiempo real!", {
            description: payload.new?.description || "Un candidato acaba de postularse a una de tus vacantes.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, queryClient]);

  // Selected applicant details
  const selectedApplicant = React.useMemo(() => {
    return applicants.find((app) => app.id === selectedId) || null;
  }, [applicants, selectedId]);

  // Status mutation with optimistic updates
  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: Applicant["status"] }) => {
      await companyService.updateApplicationStatus(id, newStatus);
      return { id, newStatus };
    },
    onMutate: async ({ id, newStatus }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<ApplicationsQueryData>(queryKey);

      if (previousData) {
        queryClient.setQueryData<ApplicationsQueryData>(queryKey, {
          ...previousData,
          applicants: previousData.applicants.map((app) =>
            app.id === id ? { ...app, status: newStatus } : app
          ),
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      console.error("Error updating application status:", err);
      toast.error("Error al actualizar el estado de la postulación");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["company-applications"] });
    },
    onSuccess: (result, variables) => {
      toast.success(`Postulación actualizada: ${variables.newStatus}`, {
        description: `Se ha marcado la postulación como "${variables.newStatus}".`,
      });
    },
  });

  const handleUpdateStatus = async (id: string, newStatus: Applicant["status"]) => {
    const validation = validateApplicationStatusTransition(newStatus);
    if (!validation.allowed) {
      toast.warning("Asistente de contratación requerido", {
        description: validation.message,
      });
      return;
    }
    await statusMutation.mutateAsync({ id, newStatus });
  };

  const handleScheduleInterview = async (
    id: string,
    interviewData: InterviewDetails
  ) => {
    // Optimistic update
    queryClient.setQueryData<ApplicationsQueryData>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        applicants: old.applicants.map((a) =>
          a.id === id ? { ...a, status: "Entrevista", interview: interviewData } : a
        ),
      };
    });

    try {
      await companyService.updateApplicationInterview(id, interviewData);
      toast.success("Entrevista agendada exitosamente");
    } catch (err) {
      console.error("Error saving interview to DB:", err);
      toast.error("Error al registrar la cita en la base de datos");
    }
  };

  // WhatsApp helper with dynamic contextual messages per stage
  const getWhatsAppLink = (applicant: Applicant) => {
    if (!applicant.phone) return "";
    const cleanPhone = applicant.phone.replace(/[^0-9]/g, "");
    
    let message = "";
    if (applicant.status === "Entrevista" && applicant.interview) {
      const modalityStr = applicant.interview.modality === "presencial"
        ? `presencial en: ${applicant.interview.locationOrLink}`
        : `por videollamada: ${applicant.interview.locationOrLink}`;
      message = `¡Hola ${applicant.name}! Te confirmamos tu cita para entrevista para la vacante "${applicant.vacancyTitle}" programada el día ${applicant.interview.date} a las ${applicant.interview.time || ''} (${modalityStr}). Favor de confirmar tu asistencia. ¡Éxito!`;
    } else if (applicant.status === "Preseleccionado") {
      message = `¡Hola ${applicant.name}! Te saludamos de parte del equipo de selección de K'anPro. Has sido preseleccionado para la vacante de "${applicant.vacancyTitle}". Nos gustaría coordinar una entrevista contigo. ¿Qué horario te queda mejor?`;
    } else if (applicant.status === "Contratado") {
      message = `¡Felicidades ${applicant.name}! Nos complace informarte que has sido seleccionado para la vacante "${applicant.vacancyTitle}". Pronto nos comunicaremos para la firma de contrato y bienvenida.`;
    } else {
      message = `Hola ${applicant.name}, te saludamos de parte de K'anPro. Hemos visto tu postulación para la vacante de "${applicant.vacancyTitle}" y nos interesa conocer más sobre tu experiencia. ¿Tienes disponibilidad para platicar?`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Create contact notification and register connection in db
  const handleContactApplicant = async (applicant: Applicant) => {
    try {
      const supabase = createClient();

      const { error: connError } = await supabase.from("connections").insert({
        candidate_id: applicant.candidateId,
        recruiter_id: userId,
        vacancy_id: applicant.vacancyId || null,
        status: "contacted",
        initiated_by: "company",
      });

      if (connError) {
        console.error("Error creating connection in db:", connError);
      }

      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("company_name")
        .eq("id", userId)
        .single();

      const companyName = companyProfile?.company_name || "Empresa";

      const { error } = await supabase.rpc("notify_candidate_contact", {
        p_candidate_id: applicant.candidateId,
        p_vacancy_title: applicant.vacancyTitle,
        p_company_name: companyName,
      });

      if (error) {
        console.error("Error creating contact notification:", error);
      }

      queryClient.invalidateQueries({ queryKey: ["company-applications"] });
    } catch (err) {
      console.error("Error executing handleContactApplicant:", err);
    }
  };

  // Notes & Rating update handlers with database persistence
  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      // Optimistic update
      queryClient.setQueryData<ApplicationsQueryData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          applicants: old.applicants.map((app) =>
            app.id === id ? { ...app, internalNotes: notes } : app
          ),
        };
      });

      await companyService.updateApplicationNotes(id, notes);
      toast.success("Nota interna guardada en base de datos");
    } catch (e) {
      console.error("Error saving internal note:", e);
      toast.error("No se pudo guardar la nota en la base de datos");
    }
  };

  const handleUpdateRating = async (id: string, rating: number) => {
    try {
      // Optimistic update
      queryClient.setQueryData<ApplicationsQueryData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          applicants: old.applicants.map((app) =>
            app.id === id ? { ...app, internalRating: rating, rating } : app
          ),
        };
      });

      await companyService.updateApplicationRating(id, rating);
      toast.success(`Puntuación guardada: ${rating} ★`);
    } catch (e) {
      console.error("Error saving rating:", e);
      toast.error("No se pudo guardar la calificación en la base de datos");
    }
  };

  // Export filtered applicants list to CSV
  const handleExportCSV = React.useCallback((applicantsToExport: Applicant[]) => {
    if (!applicantsToExport || applicantsToExport.length === 0) {
      toast.error("No hay postulantes disponibles para exportar");
      return;
    }

    const headers = [
      "Nombre Candidato",
      "Puesto Postulado",
      "Estado Postulación",
      "Ubicación",
      "Teléfono / WhatsApp",
      "Email",
      "Puntuación Interna",
      "Notas Privadas Reclutador",
      "Fecha Antigüedad",
    ];

    const rows = applicantsToExport.map((app) => [
      `"${app.name.replace(/"/g, '""')}"`,
      `"${app.vacancyTitle.replace(/"/g, '""')}"`,
      `"${app.status}"`,
      `"${app.location.replace(/"/g, '""')}"`,
      `"${app.phone}"`,
      `"${app.email || ""}"`,
      `"${app.internalRating || app.rating || 5}"`,
      `"${(app.internalNotes || "").replace(/"/g, '""')}"`,
      `"${app.elapsedTime}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Postulantes_KanPro_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("¡Reporte CSV exportado exitosamente!");
  }, []);

  return {
    applicants,
    vacancies,
    selectedVacancyId,
    setSelectedVacancyId,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    selectedApplicant,
    isLoading,
    handleUpdateStatus,
    handleScheduleInterview,
    getWhatsAppLink,
    handleContactApplicant,
    handleUpdateNotes,
    handleUpdateRating,
    handleExportCSV,
    reloadData: refetch,
  };
}
