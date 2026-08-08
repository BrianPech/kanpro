"use client";

import * as React from "react";
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
}

export function useApplicationsInbox() {
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [vacancies, setVacancies] = React.useState<{ id: string; title: string }[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string>("");

  const supabase = React.useMemo(() => createClient(), []);

  // Load vacancies and applications
  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }
      setUserId(user.id);

      // Fetch vacancies
      const vacList = await companyService.getVacancies(user.id);
      setVacancies(vacList || []);

      // Fetch applications
      const apps = await companyService.getApplications(user.id);
      
      if (apps && apps.length > 0) {
        // Map database applications to Applicant format
        const mapped: Applicant[] = apps.map((app: any) => {
          const profile = app.candidate || {};
          
          // Parse experience
          let experiences: Experience[] = [];
          if (profile.experience && Array.isArray(profile.experience)) {
            experiences = profile.experience as Experience[];
          }
          
          // Parse education
          let education: Education[] = [];
          if (profile.education && Array.isArray(profile.education)) {
            education = profile.education as Education[];
          }

          // Parse skills
          let skills: string[] = [];
          if (profile.skills) {
            skills = Array.isArray(profile.skills) ? profile.skills : String(profile.skills).split(",");
          }

          // Determine elapsed time
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

          return {
            id: app.id,
            name: profile.full_name || "Profesional K'anPro",
            headline: profile.headline || "Candidato",
            avatar: profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
            location: profile.location || "Local",
            elapsedTime,
            status: app.status,
            rating: 5,
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
                title: "Código Limpio"
              },
              {
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop",
                title: "UI Portal"
              }
            ]
          };
        });
        
        setApplicants(mapped);
        if (mapped.length > 0) {
          setSelectedId(mapped[0].id);
        }
      } else {
        setApplicants([]);
        setSelectedId(null);
      }
    } catch (error: any) {
      console.error("Error loading applications details:", error?.message || error);
      console.error("Error details:", JSON.stringify(error));
      toast.error("Error al cargar postulaciones");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected applicant details
  const selectedApplicant = React.useMemo(() => {
    return applicants.find((app) => app.id === selectedId) || null;
  }, [applicants, selectedId]);

  // Update status action
  const handleUpdateStatus = async (id: string, newStatus: Applicant["status"]) => {
    try {
      if (!id.startsWith("mock-")) {
        await companyService.updateApplicationStatus(id, newStatus);
      }
      
      setApplicants((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );

      toast.success(`Postulación actualizada: ${newStatus}`, {
        description: `Se ha marcado la postulación como "${newStatus}".`
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Error al actualizar el estado de la postulación");
    }
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

      // 1. Register the connection to unmask the candidate's phone
      const { error: connError } = await supabase.from("connections").insert({
        candidate_id: applicant.candidateId,
        recruiter_id: userId,
        vacancy_id: applicant.vacancyId,
        status: 'contacted',
        initiated_by: 'recruiter'
      });

      if (connError) {
        console.error("Error creating connection in db:", connError);
      }

      // Fetch company name
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("company_name")
        .eq("id", userId)
        .single();

      const companyName = companyProfile?.company_name || "Empresa";

      // Trigger candidate contact notification via RPC
      const { error } = await supabase.rpc("notify_candidate_contact", {
        p_candidate_id: applicant.candidateId,
        p_vacancy_title: applicant.vacancyTitle,
        p_company_name: companyName,
      });

      if (error) {
        console.error("Error creating contact notification:", error);
      }

      // 2. Reload the applications so that the phone number gets unmasked in the UI
      await loadData();
    } catch (err) {
      console.error("Error executing handleContactApplicant:", err);
    }
  };

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
    reloadData: loadData,
  };
}
