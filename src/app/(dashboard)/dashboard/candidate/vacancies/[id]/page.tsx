import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CandidateVacancyDetailView,
  type CandidateReviewProfile,
  type CompanyDetails,
  type VacancyDetailData,
} from "@/modules/candidate/components/candidate-vacancy-detail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EmbeddedCandidateResume {
  headline: string | null;
  bio: string | null;
}

export default async function CandidateVacancyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: vacancy, error: vacError } = await supabase
    .from("vacancies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (vacError || !vacancy) {
    notFound();
  }

  const [
    { data: company },
    { data: profileRow },
    { data: savedRecord },
    { data: applicationRecord },
  ] = await Promise.all([
    supabase
      .from("company_directory")
      .select(
        "id, company_name, logo_url, industry, description, contact_phone, website_url, verification_status"
      )
      .eq("id", vacancy.company_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select(
        "full_name, email, whatsapp_number, location, candidate_profiles ( headline, bio )"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("saved_vacancies")
      .select("id")
      .eq("candidate_id", user.id)
      .eq("vacancy_id", id)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("id, status")
      .eq("candidate_id", user.id)
      .eq("vacancy_id", id)
      .maybeSingle(),
  ]);

  const rawResume = profileRow?.candidate_profiles as
    | EmbeddedCandidateResume
    | EmbeddedCandidateResume[]
    | null
    | undefined;
  const resume = Array.isArray(rawResume) ? rawResume[0] ?? null : rawResume ?? null;

  const candidateProfile: CandidateReviewProfile = {
    fullName:
      profileRow?.full_name ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null),
    email: profileRow?.email || user.email || null,
    whatsappNumber:
      profileRow?.whatsapp_number ||
      (typeof user.user_metadata?.whatsapp_number === "string"
        ? user.user_metadata.whatsapp_number
        : null),
    headline: resume?.headline ?? null,
    bio: resume?.bio ?? null,
  };

  return (
    <CandidateVacancyDetailView
      vacancy={vacancy as unknown as VacancyDetailData}
      company={(company as CompanyDetails | null) ?? null}
      initialIsSaved={Boolean(savedRecord)}
      initialApplication={
        applicationRecord
          ? { id: applicationRecord.id, status: applicationRecord.status }
          : null
      }
      candidateLocation={profileRow?.location ?? null}
      candidateProfile={candidateProfile}
    />
  );
}
