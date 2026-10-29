"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { accountSecurityService } from "../services/account-security-service";

const changeEmailSchema = z.object({
  newEmail: z
    .string()
    .min(1, { message: "Ingresa tu nuevo correo electrónico" })
    .email({ message: "Ingresa una dirección de correo válida" }),
});

type ChangeEmailValues = z.infer<typeof changeEmailSchema>;

export function ChangeEmailForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  const onSubmit = async (values: ChangeEmailValues) => {
    try {
      await accountSecurityService.updateEmail(values.newEmail);
      toast.success("Enlace de confirmación enviado", {
        description: `Se ha enviado un correo a ${values.newEmail} para confirmar el cambio.`,
      });
      reset();
    } catch (error: unknown) {
      console.error("Error al actualizar correo:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el correo electrónico. Inténtalo de nuevo.";
      toast.error("Error al actualizar correo", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-3 pb-3 border-b border-border/40">
        <div className="size-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Mail className="size-4.5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Correo Electrónico
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Cambia la dirección de correo asociada para inicio de sesión y notificaciones.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="flex flex-col sm:flex-row gap-3.5 sm:items-end">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="newEmail" className="text-xs font-semibold text-foreground">
              Nuevo Correo Electrónico
            </Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="ejemplo@dominio.com"
              className="h-10 rounded-xl bg-background border-border/50 text-xs sm:text-sm"
              {...register("newEmail")}
            />
            {errors.newEmail && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.newEmail.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl h-10 px-5 text-xs font-bold bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#253240] dark:hover:bg-zinc-200 transition-all flex items-center gap-2 shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <span>Solicitar cambio de correo</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
