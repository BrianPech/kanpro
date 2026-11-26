"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Loading03Icon,
  LockPasswordIcon,
  Logout01Icon,
  Mail01Icon,
  Notification02Icon,
  QrCodeIcon,
  Shield01Icon,
  SmartPhone01Icon,
  UserCircleIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { AccountSecurityService } from "@/modules/account/services/account-security-service";

interface CandidateSettingsClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

type SettingsView =
  | "main"
  | "password"
  | "deleteAccount"
  | "deleted"
  | "twoFactorEnroll"
  | "twoFactorVerify";

type SettingsOverlay = "email" | "sessions" | null;
type ConfirmDialogType = "revokeSessions" | "signOut" | "disableTwoFactor" | null;

interface TotpEnrollmentState {
  factorId: string;
  qrCode: string;
  secret: string;
}

const DELETE_CONFIRMATION_PHRASE = "ELIMINAR MI CUENTA";

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[12px] font-semibold leading-[17px] text-foreground"
      >
        {label}
      </label>
      <div className="flex h-[56px] w-full items-center gap-3 rounded-[8px] border border-input bg-background pl-4 pr-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
        <HugeiconsIcon
          icon={LockPasswordIcon}
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="shrink-0 text-muted-foreground"
        />
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={
            visible
              ? `Ocultar ${label.toLowerCase()}`
              : `Mostrar ${label.toLowerCase()}`
          }
          className="inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HugeiconsIcon
            icon={visible ? ViewOffIcon : ViewIcon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

export function CandidateSettingsClient({
  user,
}: CandidateSettingsClientProps) {
  const router = useRouter();
  const securityService = React.useMemo(() => new AccountSecurityService(), []);

  const [view, setView] = React.useState<SettingsView>("main");
  const [activeOverlay, setActiveOverlay] =
    React.useState<SettingsOverlay>(null);
  const [statusBanner, setStatusBanner] = React.useState<string | null>(null);

  // Password form state (Figma 335:2819)
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  // Email sheet state (Figma 335:2870 & 335:2892)
  const [newEmail, setNewEmail] = React.useState("");
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);
  const [emailStep, setEmailStep] = React.useState<"form" | "confirm">("form");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [isSavingEmail, setIsSavingEmail] = React.useState(false);

  // Contextual confirmation dialogs (Figma 335:3114, 335:3126, 335:3138)
  const [confirmDialog, setConfirmDialog] =
    React.useState<ConfirmDialogType>(null);
  const [isConfirmBusy, setIsConfirmBusy] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  // Delete account state (Figma 335:2997 & 335:3025)
  const [deleteReason, setDeleteReason] = React.useState("");
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

  // 2FA TOTP state (Figma 335:3044, 335:3073, 335:3094, 335:3138)
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = React.useState(false);
  const [verifiedTotpFactorId, setVerifiedTotpFactorId] = React.useState<
    string | null
  >(null);
  const [totpEnrollment, setTotpEnrollment] =
    React.useState<TotpEnrollmentState | null>(null);
  const [isEnrollingTotp, setIsEnrollingTotp] = React.useState(false);
  const [totpEnrollError, setTotpEnrollError] = React.useState<string | null>(
    null
  );
  const [totpCode, setTotpCode] = React.useState("");
  const [totpVerifyError, setTotpVerifyError] = React.useState<string | null>(
    null
  );
  const [isVerifyingTotp, setIsVerifyingTotp] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    securityService
      .getMFAFactors()
      .then((data) => {
        if (cancelled) return;
        const verifiedFactor = data?.totp?.find(
          (factor) => factor.status === "verified"
        );
        setIsTwoFactorEnabled(Boolean(verifiedFactor));
        setVerifiedTotpFactorId(verifiedFactor?.id ?? null);
      })
      .catch(() => {
        // Keep default disabled state if factor lookup fails
      });
    return () => {
      cancelled = true;
    };
  }, [securityService]);

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (isSavingPassword) return;

    if (!currentPassword.trim()) {
      setPasswordError("Ingresa tu contraseña actual.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Usa al menos 8 caracteres para tu nueva contraseña.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmación debe coincidir con la nueva contraseña.");
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);
    try {
      await securityService.updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setView("main");
      setStatusBanner("Contraseña actualizada");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la contraseña.";
      setPasswordError(msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingEmail) return;

    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("Ingresa un correo electrónico válido.");
      return;
    }

    setIsSavingEmail(true);
    setEmailError(null);
    try {
      await securityService.updateEmail(trimmed);
      setPendingEmail(trimmed);
      setNewEmail("");
      setEmailStep("confirm");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo solicitar el cambio de correo.";
      setEmailError(msg);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const openConfirmDialog = (dialog: Exclude<ConfirmDialogType, null>) => {
    setActiveOverlay(null);
    setConfirmError(null);
    setConfirmDialog(dialog);
  };

  const handleConfirmAction = async () => {
    if (isConfirmBusy || !confirmDialog) return;
    setIsConfirmBusy(true);
    setConfirmError(null);

    try {
      if (confirmDialog === "revokeSessions") {
        await securityService.revokeOtherSessions();
        setConfirmDialog(null);
        setStatusBanner("Otras sesiones cerradas");
        return;
      }

      if (confirmDialog === "signOut") {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) {
          throw new Error(
            error.message || "No se pudo cerrar la sesión. Intenta de nuevo."
          );
        }
        window.location.href = "/login";
        return;
      }

      if (confirmDialog === "disableTwoFactor") {
        let factorId = verifiedTotpFactorId;
        if (!factorId) {
          const data = await securityService.getMFAFactors();
          factorId =
            data?.totp?.find((factor) => factor.status === "verified")?.id ??
            null;
        }
        if (!factorId) {
          throw new Error(
            "No se encontró un factor activo para desactivar."
          );
        }
        await securityService.unenrollTOTP(factorId);
        setIsTwoFactorEnabled(false);
        setVerifiedTotpFactorId(null);
        setConfirmDialog(null);
        setStatusBanner("Verificación desactivada");
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo completar la acción. Intenta de nuevo.";
      setConfirmError(msg);
    } finally {
      setIsConfirmBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      isDeletingAccount ||
      deleteConfirmation.trim() !== DELETE_CONFIRMATION_PHRASE
    ) {
      return;
    }
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await securityService.requestAccountDeletion(
        deleteReason.trim() || undefined
      );
      setDeleteReason("");
      setDeleteConfirmation("");
      setView("deleted");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo registrar tu solicitud de eliminación.";
      setDeleteError(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const startTwoFactorEnrollment = async () => {
    setStatusBanner(null);
    setTotpEnrollError(null);
    setTotpVerifyError(null);
    setTotpCode("");
    setView("twoFactorEnroll");
    setIsEnrollingTotp(true);
    try {
      const data = await securityService.enrollTOTP();
      setTotpEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo iniciar la configuración de verificación en dos pasos.";
      setTotpEnrollError(msg);
      setTotpEnrollment(null);
    } finally {
      setIsEnrollingTotp(false);
    }
  };

  const cancelTwoFactorEnrollment = () => {
    const pendingFactorId = totpEnrollment?.factorId;
    setTotpEnrollment(null);
    setTotpEnrollError(null);
    setTotpVerifyError(null);
    setTotpCode("");
    setView("main");
    if (pendingFactorId) {
      securityService.unenrollTOTP(pendingFactorId).catch(() => {
        // Ignore cleanup errors for unverified factor
      });
    }
  };

  const handleCopyTotpSecret = async () => {
    if (!totpEnrollment?.secret) return;
    try {
      await navigator.clipboard.writeText(totpEnrollment.secret);
      toast.success("Clave copiada");
    } catch {
      toast.error("No se pudo copiar la clave.");
    }
  };

  const handleVerifyTotp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isVerifyingTotp || !totpEnrollment) return;

    const cleanCode = totpCode.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setTotpVerifyError("Ingresa los 6 dígitos de tu app de autenticación.");
      return;
    }

    setIsVerifyingTotp(true);
    setTotpVerifyError(null);
    try {
      await securityService.verifyTOTP(totpEnrollment.factorId, cleanCode);
      setIsTwoFactorEnabled(true);
      setVerifiedTotpFactorId(totpEnrollment.factorId);
      setTotpEnrollment(null);
      setTotpCode("");
      setView("main");
      setStatusBanner("Verificación activada");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "El código no es válido o venció. Intenta con el más reciente.";
      setTotpVerifyError(msg);
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  /* ==================== SUBVISTA: CUENTA DESACTIVADA (Figma 335:3025) ==================== */
  if (view === "deleted") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col justify-between gap-6 pb-8 md:min-h-[540px]">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-12 text-center">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={64}
            strokeWidth={1.5}
            aria-hidden="true"
            className="text-primary"
          />
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Cuenta desactivada
          </h1>
          <p className="text-[16px] font-medium leading-[22px] text-foreground">
            Registramos tu solicitud de eliminación.
          </p>
          <p className="max-w-[360px] text-[14px] font-normal leading-[20px] text-muted-foreground">
            Ya no puedes acceder a tu cuenta. La eliminación de la información
            seguirá el proceso aplicable.
          </p>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
          {/* Full reload to /login clears authenticated dashboard state */}
          <a
            href="/login"
            className="inline-flex min-h-[56px] w-full items-center justify-center rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ir a Empezar
          </a>
        </div>
      </div>
    );
  }

  /* ==================== SUBVISTA: ELIMINAR MI CUENTA (Figma 335:2997) ==================== */
  if (view === "deleteAccount") {
    const canDelete =
      deleteConfirmation.trim() === DELETE_CONFIRMATION_PHRASE &&
      !isDeletingAccount;

    return (
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col justify-between gap-6 pb-8 md:min-h-0">
        <div className="flex flex-col gap-6">
          <div className="flex h-[48px] items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setView("main");
                }}
                aria-label="Volver a Configuración de cuenta"
                className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
              <span className="text-[14px] font-normal leading-[19px] text-foreground">
                Mi cuenta
              </span>
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={!canDelete}
              aria-busy={isDeletingAccount}
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-destructive px-5 text-[14px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isDeletingAccount && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="animate-spin"
                />
              )}
              <span>{isDeletingAccount ? "Eliminando…" : "Eliminar"}</span>
            </button>
          </div>

          <header className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
              Eliminar mi cuenta
            </h1>
            <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
              Tu perfil se desactivará y se registrará tu solicitud de
              eliminación.
            </p>
          </header>

          <p className="text-[14px] font-normal leading-[20px] text-foreground">
            Perderás el acceso a tu historial y a tus postulaciones activas.
          </p>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-delete-reason"
                className="text-[12px] font-semibold leading-[17px] text-foreground"
              >
                Motivo (opcional)
              </label>
              <input
                id="settings-delete-reason"
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Cuéntanos por qué"
                className="h-[56px] w-full rounded-[8px] border border-input bg-background px-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-normal leading-[20px] text-foreground">
                Para confirmar, escribe exactamente:{" "}
                <strong className="font-semibold">
                  {DELETE_CONFIRMATION_PHRASE}
                </strong>
              </p>
              <label
                htmlFor="settings-delete-confirm"
                className="text-[12px] font-semibold leading-[17px] text-foreground"
              >
                Confirmación
              </label>
              <input
                id="settings-delete-confirm"
                type="text"
                autoComplete="off"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={DELETE_CONFIRMATION_PHRASE}
                className="h-[56px] w-full rounded-[8px] border border-input bg-background px-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Puedes cancelar para conservar tu cuenta.
              </p>
            </div>

            {deleteError && (
              <p
                role="alert"
                className="text-[14px] font-normal leading-[19px] text-destructive"
              >
                {deleteError}
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setView("main");
            }}
            className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Cancelar</span>
          </button>
        </div>
      </div>
    );
  }

  /* ==================== SUBVISTA: 2FA PASO 1 — VINCULAR (Figma 335:3044) ==================== */
  if (view === "twoFactorEnroll") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col justify-between gap-6 pb-8 md:min-h-0">
        <div className="flex flex-col gap-6">
          <div className="flex h-[48px] items-center gap-2">
            <button
              type="button"
              onClick={cancelTwoFactorEnrollment}
              aria-label="Volver a Configuración de cuenta"
              className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
            <span className="text-[14px] font-normal leading-[19px] text-foreground">
              Mi cuenta
            </span>
          </div>

          <header className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
              Verificación en dos pasos
            </h1>
            <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
              Protege tu cuenta con un código de tu app de autenticación.
            </p>
          </header>

          <div className="flex flex-col gap-5">
            <h2 className="text-[16px] font-semibold leading-[22px] text-foreground">
              1. Agrega Kanpro a tu autenticador
            </h2>

            <div className="mx-auto flex size-[160px] items-center justify-center rounded-[16px] border border-border bg-background p-3">
              {isEnrollingTotp ? (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={32}
                  strokeWidth={1.75}
                  aria-label="Generando código QR"
                  className="animate-spin text-muted-foreground"
                />
              ) : totpEnrollment?.qrCode ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={totpEnrollment.qrCode}
                  alt="Código QR para vincular Kanpro con tu app de autenticación"
                  className="size-full object-contain"
                />
              ) : (
                <HugeiconsIcon
                  icon={QrCodeIcon}
                  size={48}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="text-muted-foreground"
                />
              )}
            </div>

            <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
              Escanea el QR o copia la clave para agregarla manualmente desde
              este teléfono.
            </p>

            <button
              type="button"
              onClick={handleCopyTotpSecret}
              disabled={!totpEnrollment?.secret || isEnrollingTotp}
              className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-border bg-background px-4 text-[14px] font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Copiar clave</span>
            </button>

            {totpEnrollError && (
              <div className="flex flex-col gap-2">
                <p
                  role="alert"
                  className="text-[14px] font-normal leading-[19px] text-destructive"
                >
                  {totpEnrollError}
                </p>
                <button
                  type="button"
                  onClick={startTwoFactorEnrollment}
                  className="inline-flex min-h-[48px] w-fit cursor-pointer items-center justify-center rounded-[8px] border border-border px-4 text-[14px] font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="button"
            onClick={() => {
              setTotpVerifyError(null);
              setView("twoFactorVerify");
            }}
            disabled={!totpEnrollment || isEnrollingTotp}
            className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ya tengo mi código
          </button>
        </div>
      </div>
    );
  }

  /* ==================== SUBVISTA: 2FA PASO 2 — CÓDIGO (Figma 335:3073) ==================== */
  if (view === "twoFactorVerify") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col justify-between gap-6 pb-8 md:min-h-0">
        <div className="flex flex-col gap-6">
          <div className="flex h-[48px] items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTotpVerifyError(null);
                setView("twoFactorEnroll");
              }}
              aria-label="Volver al código QR"
              className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
            <span className="text-[14px] font-normal leading-[19px] text-foreground">
              Verificación en dos pasos
            </span>
          </div>

          <header className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
              Confirma la vinculación
            </h1>
            <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
              Ingresa el código que aparece en tu app de autenticación.
            </p>
          </header>

          <form
            id="candidate-totp-verify-form"
            onSubmit={handleVerifyTotp}
            className="flex flex-col gap-5"
          >
            <h2 className="text-[16px] font-semibold leading-[22px] text-foreground">
              2. Verifica el código de tu app
            </h2>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-totp-code"
                className="text-[12px] font-semibold leading-[17px] text-foreground"
              >
                Código de 6 dígitos
              </label>
              <input
                id="settings-totp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="000 000"
                className="h-[56px] w-full rounded-[8px] border border-input bg-background px-4 text-[16px] tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Usa el código más reciente. Si cambia, vuelve a escribirlo.
              </p>
            </div>

            {totpVerifyError && (
              <p
                role="alert"
                className="text-[14px] font-normal leading-[19px] text-destructive"
              >
                {totpVerifyError}
              </p>
            )}
          </form>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="submit"
            form="candidate-totp-verify-form"
            disabled={isVerifyingTotp}
            aria-busy={isVerifyingTotp}
            className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isVerifyingTotp && (
              <HugeiconsIcon
                icon={Loading03Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="animate-spin"
              />
            )}
            <span>
              {isVerifyingTotp ? "Activando…" : "Activar verificación"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  /* ==================== SUBVISTA: CAMBIA TU CONTRASEÑA (Figma 335:2819) ==================== */
  if (view === "password") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col justify-between gap-6 pb-8 md:min-h-0">
        <div className="flex flex-col gap-6">
          <div className="flex h-[48px] items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPasswordError(null);
                setView("main");
              }}
              aria-label="Volver a Configuración de cuenta"
              className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
            <span className="text-[14px] font-normal leading-[19px] text-foreground">
              Mi cuenta
            </span>
          </div>

          <header className="flex flex-col gap-2">
            <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
              Cambia tu contraseña
            </h1>
            <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
              Usa una contraseña que solo tú conozcas.
            </p>
          </header>

          <form
            id="candidate-password-form"
            onSubmit={handlePasswordSubmit}
            className="flex flex-col gap-5"
          >
            <PasswordField
              id="settings-current-password"
              label="Contraseña actual"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Tu contraseña actual"
              autoComplete="current-password"
            />

            <PasswordField
              id="settings-new-password"
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Crea una contraseña"
              autoComplete="new-password"
            />

            <PasswordField
              id="settings-confirm-password"
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
            />

            <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
              Usa al menos 8 caracteres. La confirmación debe coincidir con la
              nueva contraseña.
            </p>

            {passwordError && (
              <p
                role="alert"
                className="text-[14px] font-normal leading-[19px] text-destructive"
              >
                {passwordError}
              </p>
            )}
          </form>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="submit"
            form="candidate-password-form"
            disabled={isSavingPassword}
            aria-busy={isSavingPassword}
            className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={isSavingPassword ? Loading03Icon : LockPasswordIcon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className={isSavingPassword ? "animate-spin" : undefined}
            />
            <span>
              {isSavingPassword ? "Guardando…" : "Guardar contraseña"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  /* ==================== VISTA PRINCIPAL: CONFIGURACIÓN DE CUENTA (Figma 335:2738, 335:2851, 335:2937, 335:3094) ==================== */
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[600px] flex-col justify-between gap-6 pb-8 md:min-h-0">
      <div className="flex flex-col gap-6">
        {/* Encabezado volver a Mi cuenta (móvil) */}
        <div className="flex h-[48px] items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => router.push("/dashboard/candidate/profile")}
            aria-label="Volver a Mi cuenta"
            className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
          <span className="text-[14px] font-normal leading-[19px] text-foreground">
            Mi cuenta
          </span>
        </div>

        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Configuración de cuenta
          </h1>
          <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
            Administra tu acceso y privacidad.
          </p>
        </header>

        {/* Tarjeta de cambio de correo pendiente (Figma 335:2892) */}
        {pendingEmail && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3 rounded-[16px] bg-muted p-4"
          >
            <HugeiconsIcon
              icon={Mail01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-primary"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Cambio de correo pendiente
              </p>
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Revisa tu nuevo correo para confirmar el cambio.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col divide-y divide-border">
          {/* 1. Contraseña */}
          <button
            type="button"
            onClick={() => {
              setStatusBanner(null);
              setView("password");
            }}
            className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={LockPasswordIcon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Contraseña
              </p>
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Actualiza tu contraseña de acceso
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </button>

          {/* 2. Correo electrónico */}
          <button
            type="button"
            onClick={() => {
              setEmailError(null);
              setNewEmail("");
              setEmailStep("form");
              setActiveOverlay("email");
            }}
            className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Mail01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Correo electrónico
              </p>
              <p className="truncate text-[13px] font-normal leading-[18px] text-muted-foreground">
                {user.email || "Sin correo registrado"}
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </button>

          {/* 3. Verificación en dos pasos */}
          <button
            type="button"
            onClick={() => {
              if (isTwoFactorEnabled) {
                openConfirmDialog("disableTwoFactor");
              } else {
                void startTwoFactorEnrollment();
              }
            }}
            className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Shield01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className={
                isTwoFactorEnabled
                  ? "shrink-0 text-primary"
                  : "shrink-0 text-foreground"
              }
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Verificación en dos pasos
              </p>
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                {isTwoFactorEnabled ? "Activada" : "Desactivada"}
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </button>

          {/* 4. Sesiones activas */}
          <button
            type="button"
            onClick={() => setActiveOverlay("sessions")}
            className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={SmartPhone01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-primary"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Sesiones activas
              </p>
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Gestiona tus accesos
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </button>

          {/* 5. Alertas de empleo */}
          <Link
            href="/dashboard/candidate/profile/preferences"
            className="group flex min-h-[76px] w-full items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Notification02Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Alertas de empleo
              </p>
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Activadas · Resumen diario
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

          {/* 6. Privacidad y cuenta */}
          <button
            type="button"
            onClick={() => {
              setStatusBanner(null);
              setDeleteError(null);
              setDeleteConfirmation("");
              setView("deleteAccount");
            }}
            className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={UserCircleIcon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Privacidad y cuenta
              </p>
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Tus datos y solicitud de eliminación
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </button>

          {/* 7. Cerrar sesión */}
          <button
            type="button"
            onClick={() => openConfirmDialog("signOut")}
            className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Logout01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                Cerrar sesión
              </p>
              <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                Salir de este dispositivo
              </p>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </button>
        </div>
      </div>

      {/* Confirmación inline (Figma 335:2851, 335:2937, 335:3094) */}
      {statusBanner && (
        <div
          role="status"
          aria-live="polite"
          className="sticky bottom-0 flex min-h-[60px] w-full items-center gap-3 rounded-[16px] bg-muted pl-4 pr-2"
        >
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={22}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 text-primary"
          />
          <span className="flex-1 text-[14px] font-medium text-foreground">
            {statusBanner}
          </span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Cerrar aviso"
            className="inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      {/* Sheets: Cambiar/Confirmar correo (335:2870, 335:2892), 2FA activo, Sesiones activas (335:2912) */}
      <Sheet
        open={activeOverlay !== null}
        onOpenChange={(open) => !open && setActiveOverlay(null)}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto w-full max-w-[460px] max-h-[calc(100dvh-64px)] overflow-y-auto rounded-t-[24px] border-t border-border bg-background px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-[22px] font-bold leading-[30px] text-foreground">
              {activeOverlay === "email" &&
                (emailStep === "confirm"
                  ? "Confirma tu correo"
                  : "Cambiar correo")}
              {activeOverlay === "sessions" && "Sesiones activas"}
            </SheetTitle>

            <SheetClose
              render={
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="-mr-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              }
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </SheetClose>
          </div>

          {activeOverlay === "email" && emailStep === "form" && (
            <form
              onSubmit={handleEmailSubmit}
              className="mt-4 flex flex-col gap-5"
            >
              <p className="text-[14px] leading-[19px] text-muted-foreground">
                Confirma el cambio antes de usar tu nuevo correo para entrar.
              </p>

              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-normal text-muted-foreground">
                  Correo actual
                </span>
                <p className="break-all text-[15px] font-medium text-foreground">
                  {user.email}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="settings-new-email"
                  className="text-[12px] font-semibold text-foreground"
                >
                  Nuevo correo electrónico
                </label>
                <input
                  id="settings-new-email"
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="h-[56px] rounded-[8px] border border-input bg-background px-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[13px] leading-[18px] text-muted-foreground">
                  Te enviaremos instrucciones de confirmación.
                </p>
              </div>

              {emailError && (
                <p role="alert" className="text-[14px] text-destructive">
                  {emailError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSavingEmail}
                aria-busy={isSavingEmail}
                className="mt-6 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={isSavingEmail ? Loading03Icon : Mail01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={isSavingEmail ? "animate-spin" : undefined}
                />
                <span>
                  {isSavingEmail ? "Enviando…" : "Solicitar cambio"}
                </span>
              </button>
            </form>
          )}

          {activeOverlay === "email" && emailStep === "confirm" && (
            <div className="mt-6 flex flex-col items-center gap-4 text-center">
              <HugeiconsIcon
                icon={Mail01Icon}
                size={40}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-primary"
              />
              <p className="text-[15px] font-medium leading-[21px] text-foreground">
                Revisa las instrucciones enviadas a tu nuevo correo.
              </p>
              {pendingEmail && (
                <p className="break-all text-[15px] font-semibold text-foreground">
                  {pendingEmail}
                </p>
              )}
              <p className="text-[13px] leading-[18px] text-muted-foreground">
                Tu correo actual seguirá activo hasta que completes la
                confirmación.
              </p>

              <button
                type="button"
                onClick={() => setActiveOverlay(null)}
                className="mt-4 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Listo</span>
              </button>
            </div>
          )}

          {activeOverlay === "sessions" && (
            <div className="mt-4 flex flex-col gap-5">
              <p className="text-[14px] leading-[19px] text-muted-foreground">
                Controla los accesos a tu cuenta.
              </p>

              <div className="flex items-center gap-3 rounded-[16px] bg-muted p-4">
                <HugeiconsIcon
                  icon={SmartPhone01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="shrink-0 text-primary"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                    Sesión actual
                  </p>
                  <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                    Este dispositivo
                  </p>
                </div>
              </div>

              <p className="text-[14px] leading-[20px] text-foreground">
                Puedes cerrar las sesiones que dejaste abiertas en otros
                dispositivos.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => openConfirmDialog("revokeSessions")}
                  className="inline-flex min-h-[48px] w-fit cursor-pointer items-center justify-center rounded-[8px] border border-destructive px-5 text-[14px] font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cerrar otras
                </button>
                <p className="text-[13px] leading-[18px] text-muted-foreground">
                  Este dispositivo mantendrá su sesión abierta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveOverlay(null)}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Listo</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialogs contextuales (Figma 335:3114, 335:3126, 335:3138) */}
      <AlertDialog
        open={confirmDialog !== null}
        onOpenChange={(open) => {
          if (!open && !isConfirmBusy) {
            setConfirmError(null);
            setConfirmDialog(null);
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100%-48px)] max-w-[354px] gap-6 rounded-[16px] bg-background p-6 ring-0 shadow-xl">
          <AlertDialogTitle className="text-left font-sans text-[20px] font-semibold leading-[28px] text-foreground">
            {confirmDialog === "revokeSessions" && "¿Cerrar otras sesiones?"}
            {confirmDialog === "signOut" && "¿Cerrar sesión?"}
            {confirmDialog === "disableTwoFactor" &&
              "¿Desactivar la verificación?"}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-left text-[16px] font-normal leading-[22px] text-foreground">
            {confirmDialog === "revokeSessions" &&
              "Tu cuenta se cerrará en los otros dispositivos. Esta sesión seguirá abierta."}
            {confirmDialog === "signOut" &&
              "Para volver a entrar necesitarás tus datos de acceso."}
            {confirmDialog === "disableTwoFactor" &&
              "Tu cuenta dejará de pedir un código de tu app al iniciar sesión."}
          </AlertDialogDescription>

          {confirmError && (
            <p
              role="alert"
              className="-mt-2 text-left text-[14px] leading-[19px] text-destructive"
            >
              {confirmError}
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={isConfirmBusy}
            aria-busy={isConfirmBusy}
            className="inline-flex min-h-[48px] w-fit min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-destructive bg-background px-5 text-[14px] font-normal text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isConfirmBusy && (
              <HugeiconsIcon
                icon={Loading03Icon}
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="animate-spin"
              />
            )}
            <span>
              {confirmDialog === "revokeSessions" &&
                (isConfirmBusy ? "Cerrando…" : "Cerrar otras")}
              {confirmDialog === "signOut" &&
                (isConfirmBusy ? "Saliendo…" : "Cerrar sesión")}
              {confirmDialog === "disableTwoFactor" &&
                (isConfirmBusy ? "Desactivando…" : "Desactivar")}
            </span>
          </button>

          <AlertDialogCancel
            disabled={isConfirmBusy}
            className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-4 rounded-[8px] border-0 bg-primary text-[14px] font-semibold text-primary-foreground shadow-none hover:bg-primary-hover hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Cancelar</span>
          </AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
