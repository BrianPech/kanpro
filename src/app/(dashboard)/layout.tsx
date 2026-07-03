import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardTopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch candidate/company profile details
  const { data: profile } = await supabase
    .from("profiles")
    .select("location, role")
    .eq("id", user.id)
    .single();

  if (profile) {
    const role = profile.role;
    const location = profile.location || "";
    const hasLocation = location.includes(" - ");

    // Only redirect candidate or company roles if they haven't completed onboarding
    if ((role === "candidate" || role === "company") && !hasLocation) {
      redirect("/onboarding");
    }
  } else {
    // If profile is missing entirely, redirect to onboarding to ensure profile creation
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {children}
    </div>
  );
}
