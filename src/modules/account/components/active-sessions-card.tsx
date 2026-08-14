"use client";

import React, { useState } from "react";
import { Laptop, Smartphone, Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { revokeOtherSessions } from "../services/account-security-service";

export function ActiveSessionsCard() {
  const [isRevoking, setIsRevoking] = useState(false);
  const [otherSessionsRevoked, setOtherSessionsRevoked] = useState(false);

  const handleRevokeOthers = async () => {
    setIsRevoking(true);
    try {
      await revokeOtherSessions();
      setOtherSessionsRevoked(true);
      toast.success("Sesiones cerradas con éxito", {
        description: "Se han cerrado las sesiones en todos los demás dispositivos.",
      });
    } catch (error: unknown) {
      console.error("Error al revocar otras sesiones:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudieron cerrar las demás sesiones. Inténtalo de nuevo.";
      toast.error("Error al cerrar sesiones", {
        description: errorMessage,
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Dispositivos activos
            </h3>
            <p className="text-xs text-muted-foreground">
              Gestiona las sesiones abiertas con tu cuenta.
            </p>
          </div>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1 rounded-full">
          {otherSessionsRevoked ? "1 Sesión Activa" : "2 Sesiones Activas"}
        </span>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {/* Current Device */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-foreground">
                  Navegador Web • macOS
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Sesión actual en este navegador
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
            Este dispositivo
          </span>
        </div>

        {/* Secondary Device (Shown only if not revoked) */}
        {!otherSessionsRevoked ? (
          <div className="flex items-center justify-between py-2 border-t border-border/20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted/60 rounded-xl flex items-center justify-center text-muted-foreground shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  Dispositivo Móvil • Safari
                </h4>
                <p className="text-xs text-muted-foreground">
                  Última actividad: Hace 2 horas
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground italic">
              Activo
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Todas las demás sesiones fueron cerradas.</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-4 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          onClick={handleRevokeOthers}
          disabled={isRevoking || otherSessionsRevoked}
          className="rounded-full h-11 px-6 font-semibold border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all flex items-center gap-2"
        >
          {isRevoking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cerrando sesiones...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión en otros dispositivos</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
