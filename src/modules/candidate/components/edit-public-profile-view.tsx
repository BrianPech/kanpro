"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CallIcon,
  Camera01Icon,
  Loading03Icon,
  Location01Icon,
  Mail01Icon,
  PencilEdit02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  candidateProfileService,
  getCandidateInitials,
} from "../services/candidate-profile";
import { candidateDocumentsService } from "../services/candidate-documents";

interface EditPublicProfileViewProps {
  onBack?: () => void;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function EditPublicProfileView({ onBack }: EditPublicProfileViewProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [userId, setUserId] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active || !user) return;
        setUserId(user.id);
        setEmail(user.email || "");

        const profile = await candidateProfileService.getProfile(user.id);
        if (!active || !profile) return;

        const { firstName: fn, lastName: ln } = splitFullName(
          profile.full_name || ""
        );
        setFirstName(fn);
        setLastName(ln);
        setEmail(profile.email || user.email || "");
        setPhone(profile.whatsapp_number || "");
        setCity(profile.location || "");
        setAvatarUrl(profile.avatar_url || null);
      } catch (err) {
        console.error("Error loading personal data:", err);
        if (active) {
          setFormError("No pudimos cargar tus datos personales.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const fullNameCombined = [firstName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(" ");
  const initials = getCandidateInitials(fullNameCombined, email);

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) return;

    setIsUploadingPhoto(true);
    try {
      const nextUrl = await candidateDocumentsService.uploadAvatar(userId, file);
      setAvatarUrl(nextUrl);
      toast.success("Foto de perfil actualizada");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo subir la fotografía";
      toast.error(msg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || isSaving) return;

    if (!firstName.trim()) {
      setFormError("Ingresa tu nombre antes de guardar.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await candidateProfileService.updateProfile(userId, {
        full_name: fullNameCombined,
        whatsapp_number: phone.trim(),
        location: city.trim(),
        avatar_url: avatarUrl,
      });
      toast.success("Cambios guardados");
      router.refresh();
    } catch (err) {
      console.error("Error updating personal data:", err);
      setFormError("No pudimos guardar tus cambios. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.push("/dashboard/candidate/profile");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col gap-6 pb-8 md:min-h-0">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver a Mi perfil"
            className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Datos personales
          </h1>
        </div>
        <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
          Actualiza cómo podemos contactarte.
        </p>
      </header>

      {isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <Skeleton className="size-[80px] rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          <Skeleton className="h-[56px] w-full rounded-[8px]" />
          <Skeleton className="h-[56px] w-full rounded-[8px]" />
          <Skeleton className="h-[56px] w-full rounded-[8px]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
          {/* Foto de perfil */}
          <div className="flex items-center gap-6">
            <Avatar className="size-[80px] shrink-0 rounded-full after:hidden">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={fullNameCombined || "Foto de perfil"}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="rounded-full bg-muted text-[24px] font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-start gap-1">
              <p className="text-[16px] font-normal leading-[22px] text-foreground">
                Foto de perfil
              </p>
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[48px] cursor-pointer items-center gap-3 rounded-[8px] px-1 text-[14px] font-semibold text-primary transition-colors hover:underline disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={isUploadingPhoto ? Loading03Icon : Camera01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={isUploadingPhoto ? "animate-spin" : undefined}
                />
                <span>
                  {isUploadingPhoto ? "Subiendo…" : "Cambiar foto"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                aria-label="Seleccionar foto de perfil"
              />
            </div>
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="personal-first-name"
              className="text-[12px] font-semibold leading-[17px] text-foreground"
            >
              Nombre
            </label>
            <div className="flex h-[56px] w-full items-center gap-3 rounded-[8px] border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
              <HugeiconsIcon
                icon={UserCircleIcon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <input
                id="personal-first-name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tu nombre"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Apellidos */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="personal-last-name"
              className="text-[12px] font-semibold leading-[17px] text-foreground"
            >
              Apellidos
            </label>
            <div className="flex h-[56px] w-full items-center gap-3 rounded-[8px] border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
              <HugeiconsIcon
                icon={UserCircleIcon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <input
                id="personal-last-name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tus apellidos"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Correo de acceso (pertenece a Configuración) */}
          <Link
            href="/dashboard/candidate/settings"
            className="group flex min-h-[64px] w-full items-center gap-4 border-b border-border py-2 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Mail01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Correo de acceso
              </p>
              <p className="truncate text-[12px] font-medium leading-[17px] text-muted-foreground">
                {email || "Configura tu correo"}
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

          {/* Teléfono */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="personal-phone"
              className="text-[12px] font-semibold leading-[17px] text-foreground"
            >
              Teléfono
            </label>
            <div className="flex h-[56px] w-full items-center gap-3 rounded-[8px] border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
              <HugeiconsIcon
                icon={CallIcon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <input
                id="personal-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 998 000 0000"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Ciudad */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="personal-city"
              className="text-[12px] font-semibold leading-[17px] text-foreground"
            >
              Ciudad
            </label>
            <div className="flex h-[56px] w-full items-center gap-3 rounded-[8px] border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
              <HugeiconsIcon
                icon={Location01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <input
                id="personal-city"
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cancún, Quintana Roo"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-[14px] leading-[19px] text-destructive">
              {formError}
            </p>
          )}

          {/* CTA único al alcance del pulgar */}
          <div className="sticky bottom-0 mt-auto bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
            <button
              type="submit"
              disabled={isSaving}
              aria-busy={isSaving}
              className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={isSaving ? Loading03Icon : PencilEdit02Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className={isSaving ? "animate-spin" : undefined}
              />
              <span>{isSaving ? "Guardando…" : "Guardar cambios"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
