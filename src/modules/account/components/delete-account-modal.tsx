"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert, KeyRound, Type } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { accountSecurityService } from "../services/account-security-service";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
}: DeleteAccountModalProps) {
  const [confirmationMethod, setConfirmationMethod] = useState<"text" | "password">("text");
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const REQUIRED_CONFIRMATION = "ELIMINAR MI CUENTA";

  const isTextValid = confirmText.trim() === REQUIRED_CONFIRMATION;
  const isPasswordValid = password.trim().length > 0;
  const isValid = confirmationMethod === "text" ? isTextValid : isPasswordValid;

  const handleClose = () => {
    if (isSubmitting) return;
    setConfirmText("");
    setPassword("");
    setReason("");
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleDeleteAccount = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // If user chose password verification, check current password with Supabase
      if (confirmationMethod === "password") {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !user.email) {
          throw new Error("No se pudo verificar la sesión actual.");
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password.trim(),
        });

        if (authError) {
          throw new Error("La contraseña ingresada es incorrecta.");
        }
      }

      toast.loading("Procesando desactivación y eliminación de cuenta...");

      await accountSecurityService.requestAccountDeletion(reason.trim() || undefined);
    } catch (err: unknown) {
      console.error("Error deleting account:", err);
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error inesperado al eliminar la cuenta.";
      setErrorMessage(msg);
      toast.error("No se pudo eliminar la cuenta", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] rounded-[28px] p-6 sm:p-8 bg-background border-border/80 shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 text-destructive rounded-2xl shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-destructive">
                Eliminar / Desactivar cuenta
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Derechos ARCO / LFPDPPP - K'anPro
              </p>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
            Esta acción desactivará inmediatamente tu perfil y registrará tu solicitud de eliminación
            definitiva de acuerdo con la legislación de datos personales (LFPDPPP). No podrás acceder
            a tu historial ni a las vacantes o candidaturas activas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="delete-reason" className="text-xs font-bold text-foreground uppercase tracking-wider">
              Motivo de la cancelación (Opcional)
            </Label>
            <Textarea
              id="delete-reason"
              placeholder="Indica el motivo por el cual deseas cerrar tu cuenta..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[70px] rounded-[16px] bg-muted/40 text-sm focus-visible:ring-destructive/30 border-border/60 resize-none"
            />
          </div>

          {/* Safety Confirmation Options */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Confirmación de Seguridad *
            </Label>

            <Tabs
              value={confirmationMethod}
              onValueChange={(val) => {
                setConfirmationMethod(val as "text" | "password");
                setErrorMessage(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full h-10 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="text" className="text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" /> Escribir texto
                </TabsTrigger>
                <TabsTrigger value="password" className="text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Contraseña actual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-2 pt-3">
                <p className="text-xs text-muted-foreground">
                  Para confirmar, escribe exactamente <span className="font-bold text-destructive select-all">"{REQUIRED_CONFIRMATION}"</span> en el campo inferior:
                </p>
                <Input
                  type="text"
                  placeholder={REQUIRED_CONFIRMATION}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 rounded-[14px] bg-background border-border/80 focus-visible:ring-destructive/30 font-medium"
                />
              </TabsContent>

              <TabsContent value="password" className="space-y-2 pt-3">
                <p className="text-xs text-muted-foreground">
                  Ingresa tu contraseña actual para confirmar la identidad y autorizar la baja:
                </p>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 rounded-[14px] bg-background border-border/80 focus-visible:ring-destructive/30"
                />
              </TabsContent>
            </Tabs>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-xs font-medium rounded-xl border border-destructive/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full h-11 px-5 border-border/70 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isValid || isSubmitting}
            className="rounded-full h-11 px-6 font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md shadow-destructive/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar mi cuenta definitivamente"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
