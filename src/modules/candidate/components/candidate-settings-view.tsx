"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Briefcase01Icon,
  File01Icon,
  FilterHorizontalIcon,
  Location01Icon,
  Settings01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  candidateProfileService,
  formatCandidateAddress,
  getCandidateInitials,
  type CandidateProfileData,
} from "../services/candidate-profile";

type HugeIconType = typeof Location01Icon;

interface ProfileNavigationCardProps {
  href: string;
  icon: HugeIconType;
  title: string;
  description: React.ReactNode;
}

function ProfileNavigationCard({
  href,
  icon,
  title,
  description,
}: ProfileNavigationCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[100px] w-full items-center gap-4 rounded-[16px] border border-border bg-background p-6 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className="flex size-[48px] shrink-0 items-center justify-center rounded-[8px] bg-muted text-foreground"
        aria-hidden="true"
      >
        <HugeiconsIcon icon={icon} size={24} strokeWidth={1.75} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 break-words">
        <p className="text-[16px] font-normal leading-[22px] text-foreground">
          {title}
        </p>
        <div className="text-[14px] font-normal leading-[19px] text-muted-foreground">
          {description}
        </div>
      </div>

      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={24}
        strokeWidth={1.75}
        aria-hidden="true"
        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </Link>
  );
}

export function CandidateSettingsView() {
  const [profile, setProfile] = React.useState<CandidateProfileData | null>(null);
  const [fallbackEmail, setFallbackEmail] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadProfile() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          setIsLoading(false);
          return;
        }

        setFallbackEmail(user.email || "");
        const data = await candidateProfileService.getProfile(user.id);
        if (!active) return;
        setProfile(data);
      } catch (err) {
        console.error("Error loading candidate profile:", err);
        if (active) {
          setLoadError("No pudimos cargar tu información. Intenta recargar la página.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const displayName = profile?.full_name?.trim() || "Candidato";
  const displayEmail = profile?.email?.trim() || fallbackEmail;
  // shortcut: profiles table has no username column yet; derive handle from email local-part until username is added
  const displayHandle = displayEmail.includes("@")
    ? `@${displayEmail.split("@")[0]}`
    : null;
  const initials = getCandidateInitials(profile?.full_name, displayEmail);
  const address = formatCandidateAddress(profile);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Encabezado */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Mi perfil
          </h1>
          <Link
            href="/dashboard/candidate/settings"
            aria-label="Configuración"
            className="md:hidden -mr-2 inline-flex size-[48px] shrink-0 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Settings01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </div>
        <p className="hidden text-[16px] font-normal leading-[22px] text-muted-foreground md:block">
          Gestiona tu información y mantén tu perfil al día.
        </p>
      </header>

      {loadError && (
        <div
          role="alert"
          className="rounded-[16px] border border-destructive/30 bg-error px-4 py-3 text-[14px] leading-[19px] text-error-foreground"
        >
          {loadError}
        </div>
      )}

      {/* Card de identidad del candidato (móvil 218:384 + desktop 437:12335) */}
      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Cargando perfil"
          className="flex min-h-[100px] w-full items-center gap-6 rounded-[16px] border border-border bg-background p-6"
        >
          <Skeleton className="size-[80px] shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-56" />
          </div>
          <div className="hidden w-[264px] shrink-0 flex-col gap-2 md:flex">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      ) : (
        <Link
          href="/dashboard/candidate/profile/edit"
          className="group flex min-h-[100px] w-full items-center gap-4 rounded-[16px] border border-border bg-background p-6 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:gap-6"
        >
          <Avatar className="size-[80px] shrink-0 rounded-full after:hidden">
            {profile?.avatar_url && (
              <AvatarImage
                src={profile.avatar_url}
                alt={displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="rounded-full bg-muted text-[28px] font-bold leading-[39px] text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-2 break-words">
            <p className="text-[20px] font-semibold leading-[28px] text-foreground">
              {displayName}
            </p>
            {displayHandle && (
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                {displayHandle}
              </p>
            )}
            {displayEmail && (
              <p className="truncate text-[14px] font-normal leading-[19px] text-muted-foreground md:text-[16px] md:leading-[22px] md:text-foreground">
                {displayEmail}
              </p>
            )}
          </div>

          <div className="hidden w-[264px] shrink-0 flex-col gap-2 break-words md:flex">
            <p className="text-[16px] font-normal leading-[22px] text-foreground">
              Datos personales
            </p>
            <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
              Nombre, nacimiento y contacto
            </p>
          </div>

          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={24}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </Link>
      )}

      {/* Vista móvil (Figma 218:384): sección Tu información en card agrupada */}
      <section
        aria-labelledby="perfil-movil-tu-informacion"
        className="flex flex-col gap-4 md:hidden"
      >
        <h2
          id="perfil-movil-tu-informacion"
          className="text-[16px] font-normal leading-[22px] text-foreground"
        >
          Tu información
        </h2>

        <div className="divide-y divide-border overflow-hidden rounded-[16px] border border-border bg-background">
          {[
            {
              href: "/dashboard/candidate/profile/cv",
              icon: File01Icon,
              title: "Mi currículum",
              subtitle: "Tu información profesional en texto",
            },
            {
              href: "/dashboard/candidate/documents",
              icon: File01Icon,
              title: "Mis documentos",
              subtitle: "CV en PDF y documentos de identidad",
            },
            {
              href: "/dashboard/candidate/profile/preferences",
              icon: FilterHorizontalIcon,
              title: "Preferencias de empleo",
              subtitle: "Puestos de interés, sueldo y modalidad",
            },
          ].map((row) => (
            <Link
              key={row.href}
              href={row.href}
              className="group flex min-h-[72px] w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={row.icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                  {row.title}
                </p>
                <p className="text-[12px] font-medium leading-[17px] text-muted-foreground">
                  {row.subtitle}
                </p>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Vista escritorio (Figma 437:12335): dos columnas */}
      <div className="hidden w-full grid-cols-1 items-start gap-6 md:grid lg:grid-cols-2">
        {/* Columna izquierda: Tu información */}
        <section
          aria-labelledby="perfil-tu-informacion"
          className="flex min-w-0 flex-col gap-4"
        >
          <h2
            id="perfil-tu-informacion"
            className="text-[20px] font-semibold leading-[28px] text-foreground"
          >
            Tu información
          </h2>

          {isLoading ? (
            <div className="flex min-h-[100px] w-full items-center gap-4 rounded-[16px] border border-border bg-background p-6">
              <Skeleton className="size-[48px] shrink-0 rounded-[8px]" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ) : (
            <ProfileNavigationCard
              href="/dashboard/candidate/profile/edit"
              icon={Location01Icon}
              title="Tu dirección"
              description={
                address.line1 || address.line2 ? (
                  <>
                    {address.line1 && <p>{address.line1}</p>}
                    {address.line2 && <p>{address.line2}</p>}
                  </>
                ) : (
                  <p>Agrega tu domicilio para recibir vacantes cercanas</p>
                )
              }
            />
          )}

          <aside
            aria-label="Información sobre datos recuperados de la INE"
            className="flex w-full flex-col items-start gap-4 rounded-[16px] border border-border bg-background p-6"
          >
            <HugeiconsIcon
              icon={Shield01Icon}
              size={24}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-foreground"
            />
            <p className="text-[16px] font-normal leading-[22px] text-foreground">
              Tus datos, en un solo lugar
            </p>
            <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
              Tu nombre, fecha de nacimiento y dirección se recuperaron de tu INE
              durante el registro. Puedes revisarlos y corregirlos.
            </p>
          </aside>
        </section>

        {/* Columna derecha: Tu información profesional */}
        <section
          aria-labelledby="perfil-info-profesional"
          className="flex min-w-0 flex-col gap-4"
        >
          <h2
            id="perfil-info-profesional"
            className="text-[20px] font-semibold leading-[28px] text-foreground"
          >
            Tu información profesional
          </h2>

          <ProfileNavigationCard
            href="/dashboard/candidate/profile/cv"
            icon={Briefcase01Icon}
            title="Mi currículum"
            description="Experiencia, estudios y habilidades en texto"
          />

          <ProfileNavigationCard
            href="/dashboard/candidate/documents"
            icon={File01Icon}
            title="Mis documentos"
            description="Tu CV en PDF y documentos de identidad"
          />

          <ProfileNavigationCard
            href="/dashboard/candidate/profile/preferences"
            icon={FilterHorizontalIcon}
            title="Preferencias de empleo"
            description="Puestos, zonas, sueldo y modalidad"
          />
        </section>
      </div>
    </div>
  );
}
