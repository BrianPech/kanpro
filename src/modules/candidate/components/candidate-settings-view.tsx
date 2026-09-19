"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  FileText, 
  Bookmark, 
  Bell, 
  Lock, 
  HelpCircle, 
  Globe, 
  LogOut, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Mail,
  MessageCircle,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  // Support modal state
  const [isSupportOpen, setIsSupportOpen] = React.useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = React.useState<boolean>(false);

  // Logout modal state
  const [isLogoutOpen, setIsLogoutOpen] = React.useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean>(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("soporte@kanpro.mx");
    setCopiedEmail(true);
    toast.success("Correo copiado al portapapeles: soporte@kanpro.mx");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Fetch candidate profile and saved jobs count securely & concurrently from Supabase on mount
  React.useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCandidateEmail(user.email || "candidato@kanpro.mx");
          
          // Parallel query to database
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

  const initialLetter = candidateName ? candidateName.trim()[0].toUpperCase() : "C";

  const handleSignOut = () => {
    setIsLoggingOut(true);
    window.location.href = "/auth/logout";
  };

  return (
    <div className="flex-1 min-h-full bg-transparent px-3 sm:px-6 lg:px-8 pt-2 pb-24 space-y-5 max-w-5xl mx-auto w-full animate-in fade-in duration-200">

      {/* 1. Profile Completion Alert (Using shadcn/ui Alert component above user card) */}
      {completionPercentage < 100 && (
        <Alert className="border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Sparkles className="size-4.5" />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <AlertTitle className="text-sm font-semibold text-foreground">
                  Perfil al {completionPercentage}%
                </AlertTitle>
                <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary px-1.5 py-0">
                  Completa tus datos
                </Badge>
              </div>

              <AlertDescription className="text-xs text-muted-foreground leading-normal">
                Añade tu información laboral y documentos para aumentar tus posibilidades de contratación.
              </AlertDescription>

              <div className="flex items-center gap-3 pt-0.5 max-w-md">
                <Progress value={completionPercentage} className="h-1.5 flex-1 rounded-full" />
                <span className="text-xs font-semibold text-foreground shrink-0">{completionPercentage}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end shrink-0 sm:self-center">
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/dashboard/candidate/profile/edit")}
              className="h-8 px-4 text-xs font-medium rounded-lg cursor-pointer shadow-xs"
            >
              Completar
            </Button>
          </div>
        </Alert>
      )}

      {/* 2. Header Profile Card (Style matching reference) */}
      {isLoadingProfile ? (
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 flex items-center gap-4 shadow-xs">
          <Skeleton className="size-14 sm:size-16 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <Avatar className="size-14 sm:size-16 ring-1 ring-border/50 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={candidateName} />}
              <AvatarFallback className="text-lg sm:text-xl font-bold bg-muted text-foreground">
                {initialLetter}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {candidateName}
                </h2>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-medium px-1.5 py-0">
                  Candidato
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {candidateEmail}
              </p>
              {candidatePhone && (
                <p className="text-[11px] text-muted-foreground/70 truncate">
                  WhatsApp: {candidatePhone}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/candidate/profile/edit")}
            className="h-8 px-3.5 text-xs font-medium rounded-lg shrink-0 cursor-pointer"
          >
            Editar Perfil
          </Button>
        </div>
      )}

      {/* SECTION 1: Account / Cuenta & Perfil */}
      <div className="space-y-1.5">
        <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground/80 px-1">
          Cuenta y Perfil
        </h3>
        <div className="rounded-2xl border border-border/60 bg-card shadow-xs divide-y divide-border/60 overflow-hidden">
          <SettingsSectionRow
            icon={<User className="size-5 text-foreground" />}
            title="Información laboral pública"
            onClick={() => router.push("/dashboard/candidate/profile/edit")}
          />
          <SettingsSectionRow
            icon={<ShieldCheck className="size-5 text-foreground" />}
            title="Expediente Digital"
            trailingText="Verificación"
            onClick={() => router.push("/dashboard/candidate/documents")}
          />
          <SettingsSectionRow
            icon={<Bookmark className="size-5 text-foreground" />}
            title="Mis postulaciones guardadas"
            badgeCount={savedCount > 0 ? savedCount : undefined}
            onClick={() => router.push("/dashboard/candidate/profile/saved")}
          />
        </div>
      </div>

      {/* SECTION 2: Preferences & Seguridad */}
      <div className="space-y-1.5">
        <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground/80 px-1">
          Preferencias y Seguridad
        </h3>
        <div className="rounded-2xl border border-border/60 bg-card shadow-xs divide-y divide-border/60 overflow-hidden">
          <SettingsSectionRow
            icon={<Bell className="size-5 text-foreground" />}
            title="Alertas de empleo"
            onClick={() => router.push("/dashboard/candidate/profile/preferences")}
          />
          <SettingsSectionRow
            icon={<Lock className="size-5 text-foreground" />}
            title="Seguridad y Contraseña"
            onClick={() => router.push("/dashboard/candidate/settings")}
          />
          <SettingsSectionRow
            icon={<Globe className="size-5 text-foreground" />}
            title="Idioma"
            trailingText="Español"
            onClick={() => {
              toast.info("Idioma de la plataforma", {
                description: "K'anPro está configurado actualmente en Español (Latinoamérica)."
              });
            }}
          />
        </div>
      </div>

      {/* SECTION 3: Support & Soporte */}
      <div className="space-y-1.5">
        <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground/80 px-1">
          Soporte y Cuenta
        </h3>
        <div className="rounded-2xl border border-border/60 bg-card shadow-xs divide-y divide-border/60 overflow-hidden">
          <SettingsSectionRow
            icon={<HelpCircle className="size-5 text-foreground" />}
            title="Centro de Ayuda y Soporte"
            onClick={() => setIsSupportOpen(true)}
          />
          <SettingsSectionRow
            icon={<LogOut className="size-5 text-destructive" />}
            title="Cerrar Sesión"
            titleColor="text-destructive font-medium"
            onClick={() => setIsLogoutOpen(true)}
          />
        </div>
      </div>

      {/* Help & Support Dialog */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-5 sm:p-6 space-y-3.5 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <HelpCircle className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Centro de Ayuda y Soporte
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              ¿Tienes dudas o necesitas asistencia con tu cuenta o postulaciones? Nuestro equipo está listo para ayudarte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* Contact Channels */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Canales de Atención Directa
              </span>

              {/* WhatsApp Support */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MessageCircle className="size-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">WhatsApp de Soporte</h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">+52 999 123 4567 • Lun a Vie 9:00 - 18:00</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0">
                    En línea
                  </Badge>
                </div>
                <a
                  href={`https://wa.me/529991234567?text=${encodeURIComponent("Hola Soporte K'anPro, necesito ayuda con mi cuenta de candidato.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                    <MessageCircle className="size-3.5" />
                    <span>Escribir por WhatsApp</span>
                    <ExternalLink className="size-3" />
                  </Button>
                </a>
              </div>

              {/* Email Support */}
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Correo de Soporte</h4>
                    <p className="text-xs font-semibold text-foreground truncate">
                      soporte@kanpro.mx
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyEmail}
                    className="h-7 px-2 text-xs font-medium rounded-md cursor-pointer"
                  >
                    {copiedEmail ? <Check className="size-3 text-emerald-500 mr-1" /> : <Copy className="size-3 mr-1" />}
                    <span>{copiedEmail ? "Copiado" : "Copiar"}</span>
                  </Button>
                  <a href="mailto:soporte@kanpro.mx?subject=Soporte%20K'anPro%20Candidato">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2 rounded-md cursor-pointer"
                      aria-label="Abrir cliente de correo"
                    >
                      <ExternalLink className="size-3" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Preguntas Frecuentes
              </span>
              <div className="space-y-1.5">
                <div className="p-2.5 bg-muted/50 rounded-xl border border-border/40 space-y-0.5">
                  <h5 className="text-xs font-medium text-foreground">
                    ¿Cómo me postulo a una vacante?
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ingresa a la sección de Explorar o Inicio, haz clic en la oferta de tu interés y presiona &quot;Postularme ahora&quot;.
                  </p>
                </div>
                <div className="p-2.5 bg-muted/50 rounded-xl border border-border/40 space-y-0.5">
                  <h5 className="text-xs font-medium text-foreground">
                    ¿Cómo validar mis documentos?
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Dirígete a &quot;Mi CV y Documentos&quot; para cargar tu identificación oficial (INE) y CURP para obtener verificación.
                  </p>
                </div>
                <div className="p-2.5 bg-muted/50 rounded-xl border border-border/40 space-y-0.5">
                  <h5 className="text-xs font-medium text-foreground">
                    ¿Cómo activar las alertas de empleo?
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    En la opción &quot;Alertas de empleo&quot; selecciona tus sectores preferidos, zonas y rango salarial deseado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSupportOpen(false)}
              className="w-full text-xs font-medium rounded-lg cursor-pointer"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card p-5 space-y-3">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg font-bold text-foreground">
              Cerrar Sesión
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              ¿Estás seguro de que deseas cerrar sesión en K&apos;anPro Candidatos?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogoutOpen(false)}
              className="text-xs font-medium rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="text-xs font-medium rounded-lg"
            >
              {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/** Settings Section Row Component matching the reference style */
function SettingsSectionRow({
  icon,
  title,
  titleColor = "text-foreground font-medium",
  trailingText,
  badgeCount,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  titleColor?: string;
  trailingText?: string;
  badgeCount?: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="px-4 py-3.5 sm:px-5 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="shrink-0">{icon}</div>
        <span className={cn("text-sm sm:text-base tracking-tight truncate", titleColor)}>
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {badgeCount !== undefined && (
          <Badge variant="secondary" className="font-semibold text-[11px] px-2 py-0.5">
            {badgeCount}
          </Badge>
        )}
        {trailingText && (
          <span className="text-xs sm:text-sm text-muted-foreground">
            {trailingText}
          </span>
        )}
        <ArrowRight className="size-4 text-muted-foreground/70 group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
      </div>
    </div>
  );
}
