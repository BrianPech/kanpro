import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CandidateVacancyDetailView } from '@/modules/candidate/components/candidate-vacancy-detail-view';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateVacancyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch vacancy
  const { data: vacancy, error: vacError } = await supabase
    .from('vacancies')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (vacError || !vacancy) {
    notFound();
  }

  // 3. Parallel fetch: company profile, candidate location, saved state, application state, similar vacancies
  const [
    { data: company },
    { data: candidateProfile },
    { data: savedRecord },
    { data: applicationRecord },
    { data: similarVacancies },
  ] = await Promise.all([
    supabase
      .from('company_directory')
      .select('id, company_name, logo_url, industry, description, contact_phone, website_url, verification_status')
      .eq('id', vacancy.company_id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('location')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('saved_vacancies')
      .select('id')
      .eq('candidate_id', user.id)
      .eq('vacancy_id', id)
      .maybeSingle(),
    supabase
      .from('applications')
      .select('id, status')
      .eq('candidate_id', user.id)
      .eq('vacancy_id', id)
      .maybeSingle(),
    supabase
      .from('vacancies')
      .select('id, title, location, zone, salary_min, salary_max, employment_type, category, created_at, company_id')
      .neq('id', id)
      .or('is_active.eq.true,status.eq.Activa,status.eq.published')
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  return (
    <CandidateVacancyDetailView
      vacancy={vacancy as any}
      company={company as any}
      similarVacancies={(similarVacancies || []) as any}
      initialIsSaved={!!savedRecord}
      initialApplication={applicationRecord ? { id: applicationRecord.id, status: applicationRecord.status } : null}
      candidateLocation={candidateProfile?.location || null}
    />
  );
}
