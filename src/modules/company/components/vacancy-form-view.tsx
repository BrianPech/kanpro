"use client";

import * as React from "react";
import { VacancyWizardContainer } from "./wizard/vacancy-wizard-container";
import { type VacancyWizardValues } from "../schemas/vacancy-wizard.schema";
import type { VacancyRow } from "../repositories/vacancies.repository";
import type { VacancyWizardCompanyPrefill } from "../services/company-vacancies";

interface VacancyFormViewProps {
  userId: string;
  vacancyId?: string;
  initialVacancy?: VacancyRow | null;
  companyPrefill?: VacancyWizardCompanyPrefill | null;
}

function normalizePaymentFrequency(
  value: string | null | undefined
): VacancyWizardValues["payment_frequency"] {
  if (value === "semanal" || value === "quincenal" || value === "mensual") {
    return value;
  }
  return "quincenal";
}

function normalizeContactMethod(
  value: string | null | undefined
): VacancyWizardValues["preferred_contact_method"] {
  if (value === "whatsapp" || value === "platform" || value === "both") {
    return value;
  }
  return "whatsapp";
}

function mapVacancyToWizardValues(
  vacancy: VacancyRow
): Partial<VacancyWizardValues> {
  return {
    title: vacancy.title || "",
    category: vacancy.category || "Alimentos y Bebidas",
    employment_type: vacancy.employment_type || "Tiempo Completo",
    shift_schedule: vacancy.shift_schedule || "Matutino (Mañana)",
    positions_available: vacancy.positions_available || 1,
    location: vacancy.location || "Mérida, Yucatán",
    zone: vacancy.zone || "Centro Mérida",
    salary_min: vacancy.salary_min ?? null,
    salary_max: vacancy.salary_max ?? null,
    payment_frequency: normalizePaymentFrequency(vacancy.payment_frequency),
    benefits: Array.isArray(vacancy.benefits) ? vacancy.benefits : [],
    description: vacancy.description || "",
    experience_required:
      vacancy.experience_required || "Sin experiencia previa",
    education_level: vacancy.education_level || "Indistinto",
    skills: Array.isArray(vacancy.skills) ? vacancy.skills : [],
    contact_phone: vacancy.contact_phone || "",
    contact_email: vacancy.contact_email || "",
    preferred_contact_method: normalizeContactMethod(
      vacancy.preferred_contact_method
    ),
    is_active: vacancy.is_active ?? true,
  };
}

export function VacancyFormView({
  userId,
  vacancyId,
  initialVacancy,
  companyPrefill,
}: VacancyFormViewProps) {
  const initialValues = React.useMemo(
    () => (initialVacancy ? mapVacancyToWizardValues(initialVacancy) : undefined),
    [initialVacancy]
  );

  return (
    <VacancyWizardContainer
      userId={userId}
      initialValues={initialValues}
      companyPrefill={companyPrefill}
      isEditing={!!vacancyId}
      vacancyId={vacancyId}
    />
  );
}
