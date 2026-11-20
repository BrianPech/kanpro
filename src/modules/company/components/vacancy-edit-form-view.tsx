"use client";

import * as React from "react";
import { VacancyFormView } from "./vacancy-form-view";
import type { VacancyRow } from "../repositories/vacancies.repository";
import type { VacancyWizardCompanyPrefill } from "../services/company-vacancies";

interface VacancyEditFormViewProps {
  userId: string;
  vacancyId: string;
  initialVacancy?: VacancyRow | null;
  companyPrefill?: VacancyWizardCompanyPrefill | null;
}

export function VacancyEditFormView({
  userId,
  vacancyId,
  initialVacancy,
  companyPrefill,
}: VacancyEditFormViewProps) {
  return (
    <VacancyFormView
      userId={userId}
      vacancyId={vacancyId}
      initialVacancy={initialVacancy}
      companyPrefill={companyPrefill}
    />
  );
}
