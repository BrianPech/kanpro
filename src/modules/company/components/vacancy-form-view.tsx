"use client";

import * as React from "react";
import { VacancyWizardContainer } from "./wizard/vacancy-wizard-container";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { type VacancyWizardValues } from "../schemas/vacancy-wizard.schema";

interface VacancyFormViewProps {
  userId: string;
  vacancyId?: string;
}

export function VacancyFormView({ userId, vacancyId }: VacancyFormViewProps) {
  const [initialValues, setInitialValues] = React.useState<Partial<VacancyWizardValues> | null>(null);
  const [loading, setLoading] = React.useState<boolean>(!!vacancyId);

  React.useEffect(() => {
    if (!vacancyId) return;

    async function loadVacancyData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("vacancies")
          .select("*")
          .eq("id", vacancyId!)
          .single();

        if (error) throw error;

        if (data) {
          const v = data as any;
          setInitialValues({
            title: v.title || "",
            category: v.category || "Alimentos y Bebidas",
            employment_type: v.employment_type || "Tiempo Completo",
            shift_schedule: v.shift_schedule || "Matutino (Mañana)",
            positions_available: v.positions_available || 1,
            location: v.location || "Mérida, Yucatán",
            zone: v.zone || "Centro Mérida",
            salary_min: v.salary_min ?? null,
            salary_max: v.salary_max ?? null,
            payment_frequency: v.payment_frequency || "quincenal",
            benefits: Array.isArray(v.benefits) ? v.benefits : [],
            description: v.description || "",
            experience_required: v.experience_required || "Sin experiencia previa",
            education_level: v.education_level || "Indistinto",
            skills: Array.isArray(v.skills) ? v.skills : [],
            contact_phone: v.contact_phone || "",
            contact_email: v.contact_email || "",
            preferred_contact_method: v.preferred_contact_method || "whatsapp",
            is_active: v.is_active ?? true,
          });
        }
      } catch (err) {
        console.error("Error loading vacancy for editing:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVacancyData();
  }, [vacancyId]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-36 rounded-md" />
        </div>
        <Card className="bg-card border border-border/60 rounded-2xl p-5 shadow-xs space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
        </Card>
        <Card className="bg-card border border-border/60 rounded-3xl p-8 shadow-xs space-y-6">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
        </Card>
      </div>
    );
  }

  return (
    <VacancyWizardContainer
      userId={userId}
      initialValues={initialValues || undefined}
      isEditing={!!vacancyId}
      vacancyId={vacancyId}
    />
  );
}
