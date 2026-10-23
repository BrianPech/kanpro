import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CheckInDirectClientView } from "./checkin-direct-client-view";

export const metadata: Metadata = {
  title: "Checador QR de Asistencia | K'anPro",
  description:
    "Registro oficial de asistencia y control de jornada para colaboradores en sucursales.",
};

interface CheckInPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckInPage({ searchParams }: CheckInPageProps) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeEmployee = null;
  let companyName: string | undefined = undefined;

  // Resolve query parameters
  const branchParam =
    (resolvedParams.b as string) ||
    (resolvedParams.branch as string) ||
    (resolvedParams.branchName as string) ||
    undefined;

  const companyParam =
    (resolvedParams.c as string) ||
    (resolvedParams.company as string) ||
    (resolvedParams.companyId as string) ||
    undefined;

  const tokenParam =
    (resolvedParams.t as string) ||
    (resolvedParams.token as string) ||
    (resolvedParams.tokenVersion as string) ||
    undefined;

  if (user) {
    // 1. Search by employee_id = user.id
    const { data: empById } = await supabase
      .from("company_employees")
      .select("id, company_id, full_name, email, job_title, avatar_url, status")
      .eq("employee_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (empById) {
      activeEmployee = empById;
    } else if (user.email) {
      // 2. Search by email = user.email
      const { data: empByEmail } = await supabase
        .from("company_employees")
        .select("id, company_id, full_name, email, job_title, avatar_url, status")
        .eq("email", user.email)
        .eq("status", "active")
        .maybeSingle();

      if (empByEmail) {
        activeEmployee = empByEmail;
      }
    }

    // Attempt to resolve company name from profile if available
    if (activeEmployee?.company_id) {
      const { data: comp } = await supabase
        .from("company_profiles")
        .select("company_name")
        .eq("id", activeEmployee.company_id)
        .maybeSingle();

      if (comp?.company_name) {
        companyName = comp.company_name;
      }
    }
  }

  // Construct raw query string for redirects
  const queryString = new URLSearchParams();
  for (const [key, val] of Object.entries(resolvedParams)) {
    if (typeof val === "string") {
      queryString.set(key, val);
    }
  }
  const rawUrl = `/checkin?${queryString.toString()}`;

  return (
    <CheckInDirectClientView
      user={user ? { id: user.id, email: user.email } : null}
      employee={activeEmployee}
      branchParam={branchParam}
      companyParam={companyName || companyParam}
      tokenParam={tokenParam}
      rawUrl={rawUrl}
    />
  );
}
