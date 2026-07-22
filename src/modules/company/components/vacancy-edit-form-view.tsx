"use client";

import * as React from "react";
import { VacancyFormView } from "./vacancy-form-view";

interface VacancyEditFormViewProps {
  userId: string;
  vacancyId: string;
}

export function VacancyEditFormView({ userId, vacancyId }: VacancyEditFormViewProps) {
  return <VacancyFormView userId={userId} vacancyId={vacancyId} />;
}
