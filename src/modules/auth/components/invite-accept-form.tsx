"use client";

import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Lock,
  Briefcase,
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "@/components/ui/icons";
import Link from "next/link";
import { FormTextField, FormDateField, FormPhoneField } from "@/components/form";
import { normalizeDateToISO, normalizePhone } from "@/lib/formatters";
import { authService } from "../services/auth-service";
import { acceptEmployeeInvitationAction } from "@/modules/company/actions/employees";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const inviteAcceptSchema = z
  .object({
    fullName: z.string().trim().min(2, "Por favor ingresa tu nombre completo"),
    birthDate: z
      .string()
      .trim()
      .min(1, "Por favor selecciona tu fecha de nacimiento")
      .transform((val) => normalizeDateToISO(val) || val)
      .refine(
        (val) => Boolean(normalizeDateToISO(val)),
        "Por favor ingresa una fecha de nacimiento válida"
      ),
    whatsappNumber: z
      .string()
      .trim()
      .min(8, "Por favor ingresa un número de teléfono válido")
      .transform((val) => normalizePhone(val) || val)
      .refine(
        (val) => {
          const clean = normalizePhone(val);
          return clean.length >= 10 && clean.length <= 18;
        },
        "Por favor ingresa un número de WhatsApp / teléfono válido (10 dígitos)"
      ),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type InviteAcceptFormValues = z.infer<typeof inviteAcceptSchema>;

interface InviteAcceptFormProps {
  invitation: {
    id: string;
    company_id: string;
    email: string;
    full_name: string;
    position: string;
    salary?: number | null;
    hire_date?: string | null;
    contract_type?: string | null;
    company_profiles?: {
      id: string;
      company_name: string;
      logo_url?: string | null;
      industry?: string | null;
      fiscal_address?: string | null;
    } | null;
  };
  rawToken: string;
}

export function InviteAcceptForm({ invitation, rawToken }: InviteAcceptFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const companyName = invitation.company_profiles?.company_name || "La empresa";
  const companyLogo = invitation.company_profiles?.logo_url;

  const form = useForm<InviteAcceptFormValues>({
    resolver: zodResolver(inviteAcceptSchema),
    defaultValues: {
      fullName: invitation.full_name || "",
      birthDate: "",
      whatsappNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const birthDateValue = form.watch("birthDate");
  const whatsappValue = form.watch("whatsappNumber");

  const onSubmit: SubmitHandler<InviteAcceptFormValues> = async (data) => {
    try {
      // 1. Crear usuario candidato en Supabase Auth
      const authRes = await authService.signUpCandidate({
        fullName: data.fullName,
        email: invitation.email,
        password: data.password,
        birthDate: data.birthDate,
        whatsappNumber: data.whatsappNumber,
      });

      // 2. Asociar explícitamente la invitación y activar el colaborador
      if (authRes.user) {
        await acceptEmployeeInvitationAction({
          rawToken,
          userId: authRes.user.id,
          email: invitation.email,
        });
      }

      setIsSuccess(true);

      // 3. Evaluar sesión / confirmación de correo
      if (!authRes.session || !authRes.user?.email_confirmed_at) {
        toast.success("¡Registro completado!", {
          description: "Por favor revisa tu correo para activar tu cuenta e ingresar al equipo.",
        });
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(invitation.email)}`);
        }, 1500);
        return;
      }

      toast.success(`¡Bienvenido al equipo de ${companyName}!`, {
        description: "Tu perfil ha sido vinculado exitosamente.",
      });

      setTimeout(() => {
        router.push("/dashboard/candidate");
        router.refresh();
      }, 1200);
    } catch (error: unknown) {
      console.error("Error al completar el registro:", error);
      const message = error instanceof Error ? error.message : "Ocurrió un problema. Intenta nuevamente.";
      toast.error("Error al completar el registro", {
        description: message,
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full flex flex-col items-center text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="size-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5">
          <CheckCircle2 className="size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#1f2732] dark:text-white tracking-tight">
            ¡Bienvenido a {companyName}!
          </h2>
          <p className="text-sm text-[#5c7c9b] dark:text-zinc-400 max-w-sm">
            Tu cuenta y perfil laboral han sido configurados correctamente. Redirigiendo a tu espacio de trabajo...
          </p>
        </div>
        <Loader2 className="size-5 animate-spin text-primary mt-2" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Tarjeta informativa de la empresa y la posición */}
      <div className="w-full bg-[#f8fafc] dark:bg-zinc-900/60 rounded-2xl p-4 sm:p-5 border border-[#d2dbe5]/70 dark:border-zinc-800/80 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar className="size-13 rounded-2xl border border-border/80 bg-white shadow-xs shrink-0">
          <AvatarImage src={companyLogo || undefined} alt={companyName} className="object-cover" />
          <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-black text-lg">
            {companyName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <Sparkles className="size-3" /> Invitación Laboral
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-[#1f2732] dark:text-white truncate">
            {companyName}
          </h2>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Briefcase className="size-3 text-muted-foreground" />
              <span>{invitation.position}</span>
            </Badge>
            {invitation.hire_date && (
              <Badge variant="outline" className="text-[11px] font-normal px-2 py-0.5 rounded-lg text-muted-foreground flex items-center gap-1 border-border/60">
                <Calendar className="size-3" />
                <span>Inicio: {new Date(invitation.hire_date).toLocaleDateString("es-MX")}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 2. Formulario de Completar Registro */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center gap-3.5"
        noValidate
      >
        {/* Full Name Field */}
        <FormTextField
          id="fullName"
          label="Nombre completo"
          hintText="Juan Pérez"
          type="text"
          required
          registerProps={form.register("fullName")}
          error={form.formState.errors.fullName?.message}
          prefixIcon={<User className="size-4.5" />}
        />

        {/* Email Field (Bloqueado/Pre-asignado para la invitación) */}
        <div className="w-full">
          <FormTextField
            id="email"
            label="Correo electrónico asignado"
            type="email"
            readOnly
            disabled
            value={invitation.email}
            prefixIcon={<Mail className="size-4.5" />}
            suffixIcon={<ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />}
            helperText="Este correo fue registrado por la empresa para tu invitación."
          />
        </div>

        {/* Date of Birth Field */}
        <FormDateField
          id="birthDate"
          label="Fecha de nacimiento"
          required
          value={birthDateValue}
          onChange={(val) => form.setValue("birthDate", val, { shouldValidate: true })}
          error={form.formState.errors.birthDate?.message}
        />

        {/* Teléfono / WhatsApp Field */}
        <FormPhoneField
          id="whatsappNumber"
          label="Teléfono / WhatsApp"
          required
          value={whatsappValue}
          onChange={(val) => form.setValue("whatsappNumber", val, { shouldValidate: true })}
          error={form.formState.errors.whatsappNumber?.message}
        />

        {/* Password Field */}
        <FormTextField
          id="password"
          label="Crea tu contraseña"
          hintText="Mínimo 8 caracteres, 1 mayúscula y 1 número"
          type={showPassword ? "text" : "password"}
          required
          registerProps={form.register("password")}
          error={form.formState.errors.password?.message}
          prefixIcon={<Lock className="size-4.5" />}
          suffixIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#7d99b3] dark:text-zinc-500 hover:text-[#1f2732] dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          }
        />

        {/* Confirm Password Field */}
        <FormTextField
          id="confirmPassword"
          label="Confirmar contraseña"
          hintText="Repite tu contraseña"
          type={showConfirmPassword ? "text" : "password"}
          required
          registerProps={form.register("confirmPassword")}
          error={form.formState.errors.confirmPassword?.message}
          prefixIcon={<Lock className="size-4.5" />}
          suffixIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-[#7d99b3] dark:text-zinc-500 hover:text-[#1f2732] dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
              aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          }
        />

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full h-[54px] mt-3 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] dark:bg-primary dark:hover:bg-primary/90 text-white font-bold text-[15px] sm:text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin text-white/80" />
              <span>Vinculando tu cuenta...</span>
            </>
          ) : (
            <span>Completar Registro y Unirme al Equipo</span>
          )}
        </button>

        {/* Navigation Link to Login if they already have an account */}
        <div className="mt-3 text-center">
          <span className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] font-medium">
            ¿Ya tienes una cuenta en K&apos;anPro?{" "}
          </span>
          <Link
            href="/login"
            className="text-[#1f2732] dark:text-zinc-100 font-bold text-[14px] hover:underline transition-colors"
          >
            Inicia Sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
