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
  CheckCircle2,
  MapPin,
  Crosshair,
  Loader2,
  Sparkles
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { GEO_CONFIG } from "@/config/geo";
import { candidateProfileService } from "../services/candidate-profile";
import { FormLocationSelector } from "@/components/form";
import { toast } from "sonner";

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
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [savedCount, setSavedCount] = React.useState<number>(0);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState<boolean>(true);

  // Location & Radar States
  const [city, setCity] = React.useState<string>("Mérida");
  const [zone, setZone] = React.useState<string>("Centro Mérida");
  const [locationStatus, setLocationStatus] = React.useState<string>("");
  const [isLocating, setIsLocating] = React.useState<boolean>(false);
  const [isSavingLocation, setIsSavingLocation] = React.useState<boolean>(false);

  // Logout modal state
  const [isLogoutOpen, setIsLogoutOpen] = React.useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean>(false);

  // Fetch candidate profile and saved jobs count securely & concurrently from Supabase on mount
  React.useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCandidateEmail(user.email || "candidato@kanpro.mx");
          
          // Optimized parallel query to database
          const [profile, count] = await Promise.all([
            candidateProfileService.getProfile(user.id),
            candidateProfileService.getSavedVacanciesCount(user.id)
          ]);

          setSavedCount(count);

          if (profile) {
            if (profile.full_name) setCandidateName(profile.full_name);
            if (profile.whatsapp_number) setCandidatePhone(profile.whatsapp_number);
            if (profile.experience_summary) setCandidateBio(profile.experience_summary);
            if (profile.skills) setCandidateSkills(profile.skills);
            if (profile.avatar_url) {
              setHasAvatar(true);
              setAvatarUrl(profile.avatar_url);
            }

            if (profile.location && profile.location.includes(" - ")) {
              setLocationStatus(profile.location);
              const [locCity, locZone] = profile.location.split(" - ");
              if (GEO_CONFIG[locCity]) {
                setCity(locCity);
                setZone(locZone);
              }
            } else if (profile.location) {
              setLocationStatus(profile.location);
            }
          }
        }
      } catch (err) {
        console.error("Error loading candidate profile:", err);
        toast.error("No se pudo cargar tu perfil desde la base de datos");
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
  }, []);

  // Save Location Handler
  const handleSaveLocation = async () => {
    if (!city || !zone) {
      toast.error("Por favor selecciona ciudad y zona.");
      return;
    }

    setIsSavingLocation(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no encontrada.");

      const locationStr = await candidateProfileService.updateLocation(user.id, city, zone);

      setLocationStatus(locationStr);
      toast.success("¡Ubicación guardada con éxito!", {
        description: `Tu Radar K'anPro usará ${locationStr} para conectarte con vacantes cercanas.`
      });
    } catch (err: any) {
      toast.error("Error al guardar ubicación", { description: err.message || "Ocurrió un error inesperado." });
    } finally {
      setIsSavingLocation(false);
    }
  };

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

  const handleSignOut = () => {
    setIsLoggingOut(true);
    window.location.href = "/auth/logout";
  };

  const availableCities = React.useMemo(() => {
    const keys = Object.keys(GEO_CONFIG);
    if (city && !keys.includes(city)) {
      return [city, ...keys];
    }
    return keys;
  }, [city]);

  const availableZones = React.useMemo(() => {
    if (!city) return [];
    const configZones = Object.keys(GEO_CONFIG[city]?.zones || {});
    if (zone && !configZones.includes(zone)) {
      return [zone, ...configZones];
    }
    return configZones;
  }, [city, zone]);

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-4 pb-28 md:pb-8 space-y-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">

      
      {/* 1. Top Custom Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] sm:text-[30px] font-[800] text-[#1f2732] dark:text-fiord-50 tracking-[-0.5px]">
          Perfil y Configuración
        </h1>
        <button
          onClick={() => router.push("/dashboard/candidate/discovery")}
          aria-label="Buscar"
          className="md:hidden w-[50px] h-[50px] bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <Search className="w-6 h-6 stroke-[2]" />
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoadingProfile ? (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[22px] border border-[#ebeef3] dark:border-zinc-800 flex items-center gap-5 shadow-2xs animate-pulse">
          <div className="w-[64px] h-[64px] rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-4 w-60 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
      ) : (
        /* 2. Card 1: User Summary (Public Profile Box) */
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-[22px] border border-[#ebeef3] dark:border-zinc-800 flex items-center gap-5 shadow-2xs">
          <div className="w-[64px] h-[64px] rounded-full bg-[#ebeef3] dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={candidateName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[26px] font-[800] text-[#1f2732] dark:text-zinc-100">
                {initialLetter}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px] truncate">
              {candidateName}
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#5c7c9b] dark:text-zinc-400 font-medium truncate mt-0.5">
              {candidateEmail}
            </p>
          </div>
        </div>
      )}

      {/* 3. Card 2: Dynamic Profile Completion Callout Card */}
      <div className="p-6 bg-[#1f2732] dark:bg-fiord-950 rounded-[24px] text-white flex items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-[50px] h-[50px] rounded-full bg-[#2f3c4b] flex items-center justify-center shrink-0">
            {completionPercentage === 100 ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <Star className="w-7 h-7 fill-[#aabccf] text-[#aabccf]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-white leading-tight">
              {completionPercentage === 100 ? "¡Perfil al 100%!" : `Perfil al ${completionPercentage}%`}
            </h3>
            <p className="text-[13px] sm:text-[14px] text-[#d2dbe5]/90 leading-[1.35] mt-1 line-clamp-2">
              {completionSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/candidate/profile/edit")}
          className="shrink-0 px-4 py-2.5 bg-[#2f3c4b] hover:bg-[#344558] rounded-[14px] border border-white/20 text-white text-[12px] sm:text-[13px] font-bold transition-all cursor-pointer active:scale-95"
        >
          {completionPercentage === 100 ? "Editar >" : "Completar >"}
        </button>
      </div>

      {/* 3.1 Expediente Digital & Verification Callout */}
      <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100 leading-tight">
              Expediente Digital y Documentación
            </h3>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 font-medium leading-snug mt-1">
              Sube tus 8 documentos obligatorios (INE, CURP, Teléfono) y 8 méritos opcionales para certificar tu perfil.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard/candidate/documents")}
          className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-[14px] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
        >
          Gestionar &gt;
        </button>
      </div>

      {/* 4. Location & Radar Geográfico Section */}
      <div className="space-y-3">
        <FormLocationSelector
          value={locationStatus}
          cityValue={city}
          zoneValue={zone}
          onChange={({ city: newCity, zone: newZone, locationStr }) => {
            setCity(newCity);
            setZone(newZone);
            setLocationStatus(locationStr);
          }}
        />

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            onClick={handleSaveLocation}
            disabled={isSavingLocation}
            className="w-full sm:w-auto h-11 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white text-xs sm:text-sm font-bold px-7 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 transition-all"
          >
            {isSavingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin text-white/80" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Guardar y Activar Radar</span>
          </Button>
        </div>
      </div>

      {/* 4. Grouped Settings Section 1 (Work Info & CV) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 divide-y divide-[#ebeef3] dark:divide-zinc-800 shadow-2xs overflow-hidden">
        <SettingsRow
          icon={<BadgeCheck className="w-[25px] h-[25px] text-[#3e546d] dark:text-zinc-300 stroke-[1.8]" />}
          title="Información laboral pública"
          onClick={() => router.push("/dashboard/candidate/profile/edit")}
        />
        <SettingsRow
          icon={<FileText className="w-[25px] h-[25px] text-[#3e546d] dark:text-zinc-300 stroke-[1.8]" />}
          title="Mi CV y Documentos"
          onClick={() => router.push("/dashboard/candidate/documents")}
        />
        <SettingsRow
          icon={<Bookmark className="w-[25px] h-[25px] text-[#3e546d] dark:text-zinc-300 stroke-[1.8]" />}
          title="Mis postulaciones guardadas"
          badgeCount={savedCount > 0 ? savedCount : undefined}
          onClick={() => router.push("/dashboard/candidate/profile/saved")}
        />
      </div>

      {/* 5. Grouped Settings Section 2 (Preferences) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 divide-y divide-[#ebeef3] dark:divide-zinc-800 shadow-2xs overflow-hidden">
        <SettingsRow
          icon={<Bell className="w-[25px] h-[25px] text-[#3e546d] dark:text-zinc-300 stroke-[1.8]" />}
          title="Alertas de empleo"
          onClick={() => router.push("/dashboard/candidate/profile/preferences")}
        />
        <SettingsRow
          icon={<Lock className="w-[25px] h-[25px] text-[#3e546d] dark:text-zinc-300 stroke-[1.8]" />}
          title="Privacidad y Seguridad"
          onClick={() => {}}
        />
        <SettingsRow
          icon={<HelpCircle className="w-[25px] h-[25px] text-[#3e546d] dark:text-zinc-300 stroke-[1.8]" />}
          title="Centro de Ayuda y Soporte"
          onClick={() => {}}
        />
      </div>

      {/* 6. Grouped Settings Section 3 (System settings) */}
      <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 divide-y divide-[#ebeef3] dark:divide-zinc-800 shadow-2xs overflow-hidden">
        <SettingsRow
          icon={<Globe className="w-[25px] h-[25px] text-[#3e546d] dark:text-zinc-300 stroke-[1.8]" />}
          title="Idioma"
          trailingText="Español"
          showChevron={false}
          onClick={() => {}}
        />
        <SettingsRow
          icon={<LogOut className="w-[25px] h-[25px] text-rose-500 stroke-[1.8]" />}
          title="Cerrar Sesión"
          titleColor="text-rose-500"
          showChevron={false}
          onClick={() => setIsLogoutOpen(true)}
        />
      </div>

      {/* 7. Logout Confirmation Dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-[20px] font-bold text-[#1f2732] dark:text-zinc-50">
              Cerrar Sesión
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#3e546d] dark:text-zinc-400 leading-relaxed">
              ¿Estás seguro de que deseas cerrar sesión en K'anPro Candidatos?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-4 border-t border-[#ebeef3] dark:border-zinc-800">
            <Button
              variant="ghost"
              onClick={() => setIsLogoutOpen(false)}
              className="text-[#5c7c9b] font-bold text-sm h-11 px-5 hover:bg-[#f5f7fa]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-[14px] px-6 h-11"
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
      className="p-5 flex items-center justify-between hover:bg-[#f5f7fa]/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="shrink-0">{icon}</div>
        <span className={`text-[16px] sm:text-[17px] font-bold tracking-[-0.2px] truncate ${titleColor}`}>
          {title}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {badgeCount !== undefined && (
          <span className="px-2.5 py-1 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 text-[12px] font-extrabold rounded-[12px]">
            {badgeCount}
          </span>
        )}
        {trailingText && (
          <span className="text-[14px] font-bold text-[#5c7c9b] dark:text-zinc-400">
            {trailingText}
          </span>
        )}
        {showChevron && (
          <ChevronRight className="w-5.5 h-5.5 text-[#7d99b3] group-hover:translate-x-0.5 transition-transform" />
        )}
      </div>
    </div>
  );
}
