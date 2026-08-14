import * as React from "react";
import {
  ChangePasswordForm,
  ChangeEmailForm,
  TwoFactorSetup,
  ActiveSessionsCard,
} from "@/modules/account/components";

export default async function SecurityPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">
          Seguridad y acceso
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Configuraciones y herramientas para mantener tu cuenta segura y protegida.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {/* Change Password Component */}
        <ChangePasswordForm />

        {/* Change Email Component */}
        <ChangeEmailForm />

        {/* Two-Factor Auth Component */}
        <TwoFactorSetup />

        {/* Active Devices / Sessions Component */}
        <ActiveSessionsCard />
      </div>
    </div>
  );
}
