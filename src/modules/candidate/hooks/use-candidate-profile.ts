"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileSchema, type CandidateProfileFormValues, type ExperienceItem } from "../schemas/candidate.schema";
import { candidateProfileService } from "../services/candidate-profile";

export function useCandidateProfile() {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [experience, setExperience] = React.useState<ExperienceItem[]>([]);
  const [portfolioLinks, setPortfolioLinks] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState("");
  const [portfolioInput, setPortfolioInput] = React.useState("");

  const form = useForm<CandidateProfileFormValues>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      full_name: "",
      headline: "",
      experience_summary: "",
      whatsapp_number: "",
      location: "",
      skills: [],
      experience: [],
      portfolio_links: [],
    },
  });

  // Get current user on mount
  React.useEffect(() => {
    const supabase = createClient();
    async function fetchUserAndProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const profile = await candidateProfileService.getProfile(user.id);
          if (profile) {
            const parsedExperience: ExperienceItem[] = Array.isArray(profile.experience)
              ? (profile.experience as unknown as ExperienceItem[])
              : [];

            const parsedSkills: string[] = Array.isArray(profile.skills)
              ? profile.skills
              : [];

            const parsedPortfolioLinks: string[] = Array.isArray(profile.portfolio_links)
              ? (profile.portfolio_links as unknown as string[])
              : [];

            form.reset({
              full_name: profile.full_name || "",
              headline: profile.headline || "",
              experience_summary: profile.experience_summary || "",
              whatsapp_number: profile.whatsapp_number || "",
              location: profile.location || "",
              skills: parsedSkills,
              experience: parsedExperience,
              portfolio_links: parsedPortfolioLinks,
            });

            setSkills(parsedSkills);
            setExperience(parsedExperience);
            setPortfolioLinks(parsedPortfolioLinks);
          }
        }
      } catch (error: unknown) {
        console.error("Error loading candidate profile:", error);
        toast.error("No se pudo cargar la información del perfil");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserAndProfile();
  }, [form]);

  // Sync skills, experience, and portfolio links with React Hook Form
  React.useEffect(() => {
    form.setValue("skills", skills, { shouldValidate: true });
  }, [skills, form]);

  React.useEffect(() => {
    form.setValue("experience", experience, { shouldValidate: true });
  }, [experience, form]);

  React.useEffect(() => {
    form.setValue("portfolio_links", portfolioLinks, { shouldValidate: true });
  }, [portfolioLinks, form]);

  // Skills management
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info("Esta habilidad ya está agregada");
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Portfolio Links management
  const addPortfolioLink = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      toast.error("Por favor, ingresa un enlace de portafolio válido");
      return;
    }
    if (portfolioLinks.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      toast.info("Este enlace ya está agregado");
      return;
    }
    setPortfolioLinks((prev) => [...prev, trimmed]);
    setPortfolioInput("");
  };

  const removePortfolioLink = (linkToRemove: string) => {
    setPortfolioLinks((prev) => prev.filter((l) => l !== linkToRemove));
  };

  // Experience management
  const addExperience = (item: ExperienceItem) => {
    setExperience((prev) => [...prev, item]);
    toast.success("Experiencia laboral agregada");
  };

  const removeExperience = (indexToRemove: number) => {
    setExperience((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success("Experiencia laboral eliminada");
  };

  const updateExperience = (indexToUpdate: number, updatedItem: ExperienceItem) => {
    setExperience((prev) =>
      prev.map((item, idx) => (idx === indexToUpdate ? updatedItem : item))
    );
    toast.success("Experiencia laboral actualizada");
  };

  const onSubmit = async (values: CandidateProfileFormValues) => {
    if (!userId) {
      toast.error("Debes iniciar sesión para guardar los datos");
      return;
    }

    setIsSubmitting(true);
    try {
      await candidateProfileService.updateProfile(userId, values);
      toast.success("¡Perfil actualizado con éxito!");
    } catch (error: unknown) {
      console.error("Error updating candidate profile:", error);
      const errMsg = error instanceof Error ? error.message : "Error al actualizar el perfil";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isLoading,
    isSubmitting,
    skills,
    experience,
    portfolioLinks,
    skillInput,
    portfolioInput,
    setSkillInput,
    setPortfolioInput,
    addSkill,
    removeSkill,
    addPortfolioLink,
    removePortfolioLink,
    addExperience,
    removeExperience,
    updateExperience,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
