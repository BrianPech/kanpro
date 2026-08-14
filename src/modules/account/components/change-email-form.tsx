"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2 } from "lucide-react";
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
    <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Correo Electrónico
          </h3>
          <p className="text-xs text-muted-foreground">
            Cambia la dirección de correo asociada a tu cuenta.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="newEmail">Nuevo Correo Electrónico</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="ejemplo@dominio.com"
            className="h-11 rounded-[12px] bg-background/50 focus-visible:ring-primary/20"
            {...register("newEmail")}
          />
          {errors.newEmail && (
            <p className="text-xs text-destructive">
              {errors.newEmail.message}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border/40">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full h-11 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando confirmación...</span>
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
