"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ForcePasswordChangeAlertProps {
  forcePasswordChange?: boolean;
}

export function ForcePasswordChangeAlert({
  forcePasswordChange = false,
}: ForcePasswordChangeAlertProps) {
  const [isVisible, setIsVisible] = useState(forcePasswordChange);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isVisible) {
    return null;
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("La contraseña debe contener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          force_password_change: false,
        },
      });

      if (error) {
        toast.error(error.message || "No se pudo actualizar la contraseña.");
        return;
      }

      toast.success("Contraseña actualizada exitosamente", {
        description: "Tu cuenta ahora está protegida con tu contraseña personal.",
      });

      setIsVisible(false);
      setIsModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al actualizar la contraseña.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── SECURITY ALERT BANNER ── */}
      <Alert className="border-2 border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100 rounded-3xl p-4 sm:p-5 shadow-2xs animate-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <KeyRound className="size-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <AlertTitle className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100">
                  Por seguridad, actualiza tu contraseña provisional
                </AlertTitle>
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <AlertDescription className="text-xs text-amber-900/80 dark:text-amber-200/80 font-medium">
                Tu empresa dio de alta tu usuario con una contraseña temporal. Te recomendamos cambiarla por una contraseña personal y segura.
              </AlertDescription>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 w-full sm:w-auto h-10 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 cursor-pointer shadow-xs"
          >
            <KeyRound className="size-3.5" />
            <span>Cambiar Contraseña</span>
          </Button>
        </div>
      </Alert>

      {/* ── CHANGE PASSWORD DIALOG MODAL ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-border bg-card">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Actualizar Contraseña de Acceso
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Establece tu contraseña personal y confidencial.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password-input" className="text-xs font-semibold text-foreground">
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="new-password-input"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10 h-10 rounded-xl bg-muted/30 border-border/70 text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password-input" className="text-xs font-semibold text-foreground">
                Confirmar Nueva Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password-input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="pr-10 h-10 rounded-xl bg-muted/30 border-border/70 text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-10 rounded-xl text-xs font-semibold"
              >
                Omitir por ahora
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Actualizar Contraseña
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
