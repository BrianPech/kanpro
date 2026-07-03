import * as React from "react";
import { redirect } from "next/navigation";
import { Sparkles, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPlatformStats } from "@/modules/admin/components/admin-platform-stats";
import { AdminProfilesManager } from "./profiles-manager";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Authenticate user securely on the server
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch user details to enforce admin permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  // 3. Query all registered candidate and company profiles from Supabase
  const { data: dbProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, location, skills, is_validated, avatar_url")
    .order("created_at", { ascending: false });

  const profiles = dbProfiles || [];

  return (
    <div className="flex-1 overflow-y-auto w-full p-6 md:p-10 lg:p-12 max-w-[1440px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Consola de Administración Central
            </Badge>
          </div>
          <h2 className="text-[32px] md:text-[48px] font-bold text-foreground tracking-tight leading-none flex items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
            Consola de Auditoría
          </h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground mt-2 max-w-xl">
            Control de calidad, sello de verificación y aprobación de perfiles de candidatos y empresas.
          </p>
        </div>
      </section>

      {/* Metric Cards */}
      <AdminPlatformStats />

      {/* Profiles Directory Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary shrink-0" />
          <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
            Directorio de Perfiles & Aprobaciones
          </h3>
        </div>

        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] p-6 shadow-xs">
          <AdminProfilesManager initialProfiles={profiles} />
        </Card>
      </section>

    </div>
  );
}
