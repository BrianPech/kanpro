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
        description: "Tu contraseña ha sido modificada correctamente.",
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
    <div className="w-full rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-3 pb-3 border-b border-border/40">
        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Key className="size-4.5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Cambiar Contraseña
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Actualiza tu contraseña periódicamente para mantener tu cuenta protegida.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Current Password */}
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-xs font-semibold text-foreground">
              Contraseña Actual
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-10 rounded-xl bg-background border-border/50 text-xs sm:text-sm pr-9"
                {...register("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                aria-label={
                  showCurrentPassword
                    ? "Ocultar contraseña actual"
                    : "Mostrar contraseña actual"
                }
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
              Nueva Contraseña
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className="h-10 rounded-xl bg-background border-border/50 text-xs sm:text-sm pr-9"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                aria-label={
                  showNewPassword
                    ? "Ocultar nueva contraseña"
                    : "Mostrar nueva contraseña"
                }
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
              Confirmar Nueva Contraseña
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite la contraseña"
                className="h-10 rounded-xl bg-background border-border/50 text-xs sm:text-sm pr-9"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación de contraseña"
                    : "Mostrar confirmación de contraseña"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/30">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl h-10 px-5 text-xs font-bold bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#253240] dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
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
