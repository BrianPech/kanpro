"use client";

import * as React from "react";
import { VacancyFormView } from "./vacancy-form-view";
import type { VacancyRow } from "../repositories/vacancies.repository";

interface VacancyEditFormViewProps {
  userId: string;
  vacancyId: string;
  initialVacancy?: VacancyRow | null;
}

export function VacancyEditFormView({
  userId,
  vacancyId,
  initialVacancy,
}: VacancyEditFormViewProps) {
  return (
    <VacancyFormView
      userId={userId}
      vacancyId={vacancyId}
      initialVacancy={initialVacancy}
    />
  );
}
