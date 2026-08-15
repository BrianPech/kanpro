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

export interface Applicant {
  id: string;
  name: string;
  headline: string;
  avatar: string;
  location: string;
  elapsedTime: string;
  status: "Pendiente" | "En revisión" | "Preseleccionado" | "Contratado" | "Descartado";
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
}

interface ApplicationsQueryData {
  vacancies: { id: string; title: string }[];
  applicants: Applicant[];
}

export function useApplicationsInbox() {
  const queryClient = useQueryClient();
  const [selectedVacancyId, setSelectedVacancyId] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [userId, setUserId] = React.useState<string>("");

  const supabase = React.useMemo(() => createClient(), []);

  const queryKey = ["company-applications", selectedVacancyId || "all"];

  const { data, isLoading, refetch } = useQuery<ApplicationsQueryData>({
    queryKey,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      setUserId(user.id);

      const vacList = await companyService.getVacancies(user.id);
      const apps = await companyService.getApplications(user.id);

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
            skills = Array.isArray(profile.skills) ? profile.skills : String(profile.skills).split(",");
          }

          const appDateStr = app.applied_at || app.created_at;
          const date = appDateStr ? new Date(appDateStr) : new Date();
          const diffMs = Date.now() - date.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

          let elapsedTime = "Hace poco";
          if (diffDays > 0) {
            elapsedTime = `Hace ${diffDays}d`;
          } else if (diffHours > 0) {
            elapsedTime = `Hace ${diffHours}h`;
          }

          const savedNotes = typeof window !== "undefined" ? localStorage.getItem(`kanpro_notes_${app.id}`) || "" : "";
          const savedRating = typeof window !== "undefined" ? Number(localStorage.getItem(`kanpro_rating_${app.id}`)) || 5 : 5;

          return {
            id: app.id,
            name: profile.full_name || "Profesional K'anPro",
            headline: profile.headline || "Candidato",
            avatar: profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
            location: profile.location || "Local",
            elapsedTime,
            status: app.status,
            rating: savedRating,
            internalRating: savedRating,
            internalNotes: savedNotes,
            reviewsCount: 5,
            bio: profile.bio || "Sin biografía disponible.",
            experiences,
            education,
            skills,
            phone: profile.phone || "",
            email: profile.email || "",
            vacancyTitle: app.vacancies?.title || "Vacante",
            vacancyId: app.vacancy_id,
            candidateId: profile.id || "",
            portfolio: [
              {
                image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop",
                title: "Código Limpio",
              },
              {
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop",
                title: "UI Portal",
              },
            ],
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

  // Selected applicant details
  const selectedApplicant = React.useMemo(() => {
    return applicants.find((app) => app.id === selectedId) || null;
  }, [applicants, selectedId]);

  // Status mutation with optimistic updates
  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: Applicant["status"] }) => {
      if (!id.startsWith("mock-")) {
        await companyService.updateApplicationStatus(id, newStatus);
      }
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
    await statusMutation.mutateAsync({ id, newStatus });
  };

  // WhatsApp helper
  const getWhatsAppLink = (applicant: Applicant) => {
    if (!applicant.phone) return "";
    const cleanPhone = applicant.phone.replace(/[^0-9]/g, "");
    const message = `Hola ${applicant.name}, te saludamos de parte de K'anPro. Hemos visto tu postulación para la vacante de "${applicant.vacancyTitle}" y nos encantaría agendar una entrevista contigo. ¿Tienes disponibilidad esta semana?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Create contact notification and register connection in db
  const handleContactApplicant = async (applicant: Applicant) => {
    try {
      if (applicant.id.startsWith("mock-")) return;

      const supabase = createClient();

      const { error: connError } = await (supabase.from as any)("connections").insert({
        candidate_id: applicant.candidateId,
        recruiter_id: userId,
        vacancy_id: applicant.vacancyId,
        status: "contacted",
        initiated_by: "recruiter",
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

      const { error } = await (supabase.rpc as any)("notify_candidate_contact", {
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

  // Notes & Rating update handlers
  const handleUpdateNotes = (id: string, notes: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`kanpro_notes_${id}`, notes);
      }
      queryClient.setQueryData<ApplicationsQueryData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          applicants: old.applicants.map((app) =>
            app.id === id ? { ...app, internalNotes: notes } : app
          ),
        };
      });
      toast.success("Nota interna guardada");
    } catch (e) {
      console.error("Error saving internal note:", e);
    }
  };

  const handleUpdateRating = (id: string, rating: number) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`kanpro_rating_${id}`, String(rating));
      }
      queryClient.setQueryData<ApplicationsQueryData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          applicants: old.applicants.map((app) =>
            app.id === id ? { ...app, internalRating: rating, rating } : app
          ),
        };
      });
      toast.success(`Puntuación asignada: ${rating} ★`);
    } catch (e) {
      console.error("Error saving rating:", e);
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
    getWhatsAppLink,
    handleContactApplicant,
    handleUpdateNotes,
    handleUpdateRating,
    handleExportCSV,
    reloadData: refetch,
  };
}
