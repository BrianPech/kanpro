"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  User, 
  Star, 
  BadgeCheck, 
  FileText, 
  Bookmark, 
  Bell, 
  Lock, 
  HelpCircle, 
  Globe, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function CandidateSettingsView() {
  const router = useRouter();
  const supabase = createClient();

  // Profile States
  const [candidateName, setCandidateName] = React.useState<string>("Candidato K'anPro");
  const [candidateEmail, setCandidateEmail] = React.useState<string>("candidato@kanpro.mx");
  const [candidatePhone, setCandidatePhone] = React.useState<string>("");
  const [candidateBio, setCandidateBio] = React.useState<string>("");
  const [candidateSkills, setCandidateSkills] = React.useState<string[]>([]);
  const [hasAvatar, setHasAvatar] = React.useState<boolean>(false);
  const [savedCount, setSavedCount] = React.useState<number>(0);

  // Logout modal state
  const [isLogoutOpen, setIsLogoutOpen] = React.useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean>(false);

  // Fetch candidate profile from Supabase on mount
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCandidateEmail(user.email || "candidato@kanpro.mx");
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, whatsapp_number, experience_summary, skills, avatar_url")
            .eq("id", user.id)
            .single();

          if (profile) {
            if (profile.full_name) setCandidateName(profile.full_name);
            if (profile.whatsapp_number) setCandidatePhone(profile.whatsapp_number);
            if (profile.experience_summary) setCandidateBio(profile.experience_summary);
            if (profile.skills) setCandidateSkills(profile.skills);
            if (profile.avatar_url) setHasAvatar(true);
          }
        }
      } catch (err) {
        console.error("Error loading candidate profile:", err);
      }
    }

    loadProfile();
  }, [supabase]);

  // Calculate dynamic completion percentage (0 - 100%)
  const completionPercentage = React.useMemo(() => {
    let score = 0;
    if (candidateName.trim() && candidateName !== "Candidato K'anPro") score += 20;
    if (candidateEmail.trim()) score += 15;
    if (candidatePhone.trim()) score += 20;
    if (candidateBio.trim()) score += 20;
    if (candidateSkills.length > 0) score += 15;
    if (hasAvatar) score += 10;
    return Math.min(score, 100);
  }, [candidateName, candidateEmail, candidatePhone, candidateBio, candidateSkills, hasAvatar]);

  // Contextual completion subtitle
  const completionSubtitle = React.useMemo(() => {
    if (!candidateBio.trim() && !candidatePhone.trim()) {
      return "Completa tu biografía y WhatsApp para recibir llamadas 3x más rápido.";
    } else if (!candidateBio.trim()) {
      return "Agrega tu biografía para destacar tus aptitudes ante los reclutadores.";
    } else if (!candidatePhone.trim()) {
      return "Ingresa tu número de WhatsApp para contacto directo con las empresas.";
    } else if (candidateSkills.length === 0) {
      return "Añade tus habilidades principales para aparecer en más búsquedas de empleo.";
    } else if (!hasAvatar) {
      return "Sube tu foto de perfil para transmitir mayor confianza a los empleadores.";
    } else {
      return "¡Excelente! Tu perfil está 100% completo y listo para postulaciones instantáneas.";
    }
  }, [candidateBio, candidatePhone, candidateSkills, hasAvatar]);

  const initialLetter = candidateName ? candidateName.trim()[0].toUpperCase() : "C";

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-4 pb-24 md:pb-4 space-y-5 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* 1. Top Custom Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] sm:text-[24px] font-[800] text-[#1f2732] dark:text-fiord-50 tracking-[-0.5px]">
          Perfil
        </h1>
        <button
          onClick={() => router.push("/dashboard/candidate/discovery")}
          aria-label="Buscar"
          className="md:hidden w-[44px] h-[44px] bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <Search className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* 2. Card 1: User Summary (Public Profile Box) */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-[20px] border border-[#ebeef3] dark:border-zinc-800 flex items-center gap-4 shadow-2xs">
        <div className="w-[56px] h-[56px] rounded-full bg-[#ebeef3] dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <span className="text-[22px] font-[800] text-[#1f2732] dark:text-zinc-100">
            {initialLetter}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px] truncate">
            {candidateName}
          </h2>
          <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 font-medium truncate mt-0.5">
            {candidateEmail}
          </p>
        </div>
      </div>

      {/* 3. Card 2: Dynamic Profile Completion Callout Card */}
      <div className="p-5 bg-[#1f2732] dark:bg-fiord-950 rounded-[20px] text-white flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-[44px] h-[44px] rounded-full bg-[#2f3c4b] flex items-center justify-center shrink-0">
            {completionPercentage === 100 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <Star className="w-6 h-6 fill-[#aabccf] text-[#aabccf]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-white leading-tight">
              {completionPercentage === 100 ? "¡Perfil al 100%!" : `Perfil al ${completionPercentage}%`}
            </h3>
            <p className="text-[12px] text-[#d2dbe5]/90 leading-[1.3] mt-1 line-clamp-2">
              {completionSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/candidate/profile/edit")}
          className="shrink-0 px-3 py-2 bg-[#2f3c4b] hover:bg-[#344558] rounded-[12px] border border-white/20 text-white text-[11px] font-bold transition-all cursor-pointer active:scale-95"
        >
          {completionPercentage === 100 ? "Editar >" : "Completar >"}
        </button>
      </div>

      {/* 4. Grouped Settings Section 1 (Work Info & CV) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-[#ebeef3] dark:border-zinc-800 divide-y divide-[#ebeef3] dark:divide-zinc-800 shadow-2xs overflow-hidden">
        <SettingsRow
          icon={<BadgeCheck className="w-[22px] h-[22px] text-[#3e546d] dark:text-zinc-300 stroke-[1.75]" />}
          title="Información laboral pública"
          onClick={() => router.push("/dashboard/candidate/profile/edit")}
        />
        <SettingsRow
          icon={<FileText className="w-[22px] h-[22px] text-[#3e546d] dark:text-zinc-300 stroke-[1.75]" />}
          title="Mi CV"
          onClick={() => router.push("/dashboard/candidate/profile/cv")}
        />
        <SettingsRow
          icon={<Bookmark className="w-[22px] h-[22px] text-[#3e546d] dark:text-zinc-300 stroke-[1.75]" />}
          title="Mis postulaciones guardadas"
          badgeCount={savedCount > 0 ? savedCount : undefined}
          onClick={() => router.push("/dashboard/candidate/profile/saved")}
        />
      </div>

      {/* 5. Grouped Settings Section 2 (Preferences) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-[#ebeef3] dark:border-zinc-800 divide-y divide-[#ebeef3] dark:divide-zinc-800 shadow-2xs overflow-hidden">
        <SettingsRow
          icon={<Bell className="w-[22px] h-[22px] text-[#3e546d] dark:text-zinc-300 stroke-[1.75]" />}
          title="Alertas de empleo"
          onClick={() => router.push("/dashboard/candidate/profile/preferences")}
        />
        <SettingsRow
          icon={<Lock className="w-[22px] h-[22px] text-[#3e546d] dark:text-zinc-300 stroke-[1.75]" />}
          title="Privacidad y Seguridad"
          onClick={() => {}}
        />
        <SettingsRow
          icon={<HelpCircle className="w-[22px] h-[22px] text-[#3e546d] dark:text-zinc-300 stroke-[1.75]" />}
          title="Centro de Ayuda y Soporte"
          onClick={() => {}}
        />
      </div>

      {/* 6. Grouped Settings Section 3 (System settings) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-[#ebeef3] dark:border-zinc-800 divide-y divide-[#ebeef3] dark:divide-zinc-800 shadow-2xs overflow-hidden">
        <SettingsRow
          icon={<Globe className="w-[22px] h-[22px] text-[#3e546d] dark:text-zinc-300 stroke-[1.75]" />}
          title="Idioma"
          trailingText="Español"
          showChevron={false}
          onClick={() => {}}
        />
        <SettingsRow
          icon={<LogOut className="w-[22px] h-[22px] text-rose-500 stroke-[1.75]" />}
          title="Cerrar Sesión"
          titleColor="text-rose-500"
          showChevron={false}
          onClick={() => setIsLogoutOpen(true)}
        />
      </div>

      {/* 7. Logout Confirmation Dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[24px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-50">
              Cerrar Sesión
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#3e546d] dark:text-zinc-400 leading-relaxed">
              ¿Estás seguro de que deseas cerrar sesión en K'anPro Candidatos?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-4 border-t border-[#ebeef3] dark:border-zinc-800">
            <Button
              variant="ghost"
              onClick={() => setIsLogoutOpen(false)}
              className="text-[#5c7c9b] font-bold text-xs hover:bg-[#f5f7fa]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-[12px] px-4 py-2"
            >
              {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/** Settings Row Component */
function SettingsRow({
  icon,
  title,
  titleColor = "text-[#1f2732] dark:text-zinc-100",
  trailingText,
  badgeCount,
  showChevron = true,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  titleColor?: string;
  trailingText?: string;
  badgeCount?: number;
  showChevron?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 flex items-center justify-between hover:bg-[#f5f7fa]/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="shrink-0">{icon}</div>
        <span className={`text-[14.5px] font-[600] tracking-[-0.2px] truncate ${titleColor}`}>
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badgeCount !== undefined && (
          <span className="px-2 py-0.5 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold rounded-[10px]">
            {badgeCount}
          </span>
        )}
        {trailingText && (
          <span className="text-[13px] font-bold text-[#5c7c9b] dark:text-zinc-400">
            {trailingText}
          </span>
        )}
        {showChevron && (
          <ChevronRight className="w-5 h-5 text-[#7d99b3] group-hover:translate-x-0.5 transition-transform" />
        )}
      </div>
    </div>
  );
}
