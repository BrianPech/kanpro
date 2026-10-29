import React from "react";
import Link from "next/link";
import { getInvitationByTokenAction } from "@/modules/company/actions/employees";
import { InviteAcceptForm } from "@/modules/auth/components/invite-accept-form";
import { Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Invitación de Empleo | K'anPro",
  description: "Acepta tu invitación laboral para integrarte a tu equipo en K'anPro.",
};

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getInvitationByTokenAction(token);

  if (result.status !== "valid" || !result.invitation) {
    let title = "Invitación no disponible";
    let message = result.error || "No fue posible validar este enlace de invitación.";
    let icon = <AlertCircle className="size-10 text-rose-500" />;
    const showLoginBtn = true;

    if (result.status === "expired") {
      title = "Invitación expirada";
      message =
        "Este enlace de invitación ha vencido (vigencia de 7 días). Solicita al administrador de tu empresa que genere un nuevo enlace.";
      icon = <Clock className="size-10 text-amber-500" />;
    } else if (result.status === "already_accepted") {
      title = "Invitación ya aceptada";
      message =
        "Esta invitación ya ha sido utilizada previamente. Si ya creaste tu cuenta, puedes iniciar sesión directamente.";
      icon = <CheckCircle2 className="size-10 text-emerald-500" />;
    } else if (result.status === "cancelled") {
      title = "Invitación cancelada";
      message = "Esta invitación fue cancelada por la empresa emisora.";
      icon = <XCircle className="size-10 text-rose-500" />;
    }

    return (
      <div className="w-full flex flex-col items-center text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="size-16 rounded-3xl bg-muted/60 flex items-center justify-center shadow-xs">
          {icon}
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
        {showLoginBtn && (
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link href="/login">
              <Button className="rounded-xl h-10 px-5 text-xs font-bold gap-1.5 cursor-pointer">
                <span>Ir al Inicio de Sesión</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <InviteAcceptForm invitation={result.invitation} rawToken={token} />
    </div>
  );
}
