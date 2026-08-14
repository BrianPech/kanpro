"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { accountSecurityService } from "../services/account-security-service";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Ingresa tu contraseña actual" }),
    newPassword: z
      .string()
      .min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirma tu nueva contraseña" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      await accountSecurityService.updatePassword(values.newPassword);
      toast.success("Contraseña actualizada con éxito", {
        description: "Tu contraseña ha sido modficada correctamente.",
      });
      reset();
    } catch (error: unknown) {
      console.error("Error al cambiar contraseña:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la contraseña. Inténtalo de nuevo.";
      toast.error("Error al actualizar contraseña", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Cambiar Contraseña
          </h3>
          <p className="text-xs text-muted-foreground">
            Actualiza tu contraseña periódicamente para proteger tu cuenta.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Password */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 rounded-[12px] bg-background/50 focus-visible:ring-primary/20 pr-10"
                {...register("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={
                  showCurrentPassword
                    ? "Ocultar contraseña actual"
                    : "Mostrar contraseña actual"
                }
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 rounded-[12px] bg-background/50 focus-visible:ring-primary/20 pr-10"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={
                  showNewPassword
                    ? "Ocultar nueva contraseña"
                    : "Mostrar nueva contraseña"
                }
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 rounded-[12px] bg-background/50 focus-visible:ring-primary/20 pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación de contraseña"
                    : "Mostrar confirmación de contraseña"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
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
                <span>Actualizando...</span>
              </>
            ) : (
              <span>Actualizar contraseña</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
