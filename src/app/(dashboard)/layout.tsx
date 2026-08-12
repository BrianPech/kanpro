import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImpersonationProvider } from "@/components/impersonation-provider";

export default async function DashboardTopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen bg-background font-sans"
      style={{ "--font-sans": "var(--font-geist-sans)" } as React.CSSProperties}
    >
      <ImpersonationProvider>{children}</ImpersonationProvider>
    </div>
  );
}
