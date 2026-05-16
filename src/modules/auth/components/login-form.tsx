"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight, Cloud, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";

import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema as any),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Leer el rol de la metadata del usuario
        let role = authData.user.user_metadata?.role;

        // Fallback: Si no hay rol en metadata, verificar si existe en company_profiles
        if (!role) {
          const { data: companyProfile } = await supabase
            .from("company_profiles")
            .select("id")
            .eq("id", authData.user.id)
            .maybeSingle();
          
          if (companyProfile) {
            role = "company";
          }
        }

        role = role || "pro";
        
        toast.success("Bienvenido de nuevo");
        
        router.push(`/dashboard/${role}`);
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error al iniciar sesión", {
        description: error.message || "Credenciales inválidas."
      });
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen w-full font-sans">
      {/* Left Column: Storytelling Canvas */}
      <section className="hidden md:flex flex-1 bg-muted flex-col justify-between p-8 md:p-16 lg:p-24 relative overflow-hidden border-r border-border">
        {/* Brand Logo Anchor */}
        <div className="z-10">
          <span className="text-3xl font-medium text-foreground tracking-tighter">
            K'anPro
          </span>
        </div>

        {/* Main Narrative */}
        <div className="max-w-[600px] z-10 mt-12 md:mt-0">
          <h1 className="text-5xl md:text-6xl lg:text-[80px] font-medium text-foreground mb-6 leading-none tracking-tighter">
            El futuro de la gestión profesional.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed tracking-wide">
            Una plataforma centralizada diseñada para escalar su ecosistema
            operativo con precisión mecánica y claridad absoluta.
          </p>
        </div>

        {/* Aesthetic Accent / Image */}
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-20 pointer-events-none mix-blend-luminosity">
          <img
            alt="Ethereal digital architecture"
            className="w-full h-full object-cover grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJo5NGFifpEcKLpuk0a3yDE_IzN6kRD7-3bY_V2RHqEAzKOXy7rghxKHaO1MLA8TC8K-ZAOOpasEqzJrXEq-kbsL3w8r_6dS9syH5Km3C93-Z8GciapsmcaF0UIgU5KWHNIrxACUTgn4Otqs4QQ5zkWqOyawdi6VDLRZEsSlP4oVUTIAzoSBDgayJI5TolscVtesAdC67sWnCqRCieaO3vLD8dpow-R3whYwSYvb7E1d4BzNzL-i-0oHQgtoEFt3AUHvJ_RPPWsy64"
          />
        </div>

        <div className="z-10 mt-12">
          <div className="flex items-center gap-3 text-muted-foreground text-[13px] uppercase tracking-widest font-medium">
            <span className="w-12 h-[1px] bg-border"></span>
            <span>Sistema de Control v4.0</span>
          </div>
        </div>
      </section>

      {/* Right Column: Catalogue Mode Login Form */}
      <section className="flex-1 bg-background flex items-center justify-center p-8 md:p-12 lg:p-[88px]">
        <div className="w-full max-w-[440px] flex flex-col gap-10">
          <header className="flex flex-col gap-2">
            <h2 className="text-[32px] font-medium text-foreground tracking-tight leading-[1.19]">
              Bienvenido de nuevo
            </h2>
            <p className="text-[16px] text-muted-foreground tracking-[0.24px]">
              Ingrese sus credenciales para acceder a su panel de control.
            </p>
          </header>

          <form
            className="flex flex-col gap-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-[16px] font-semibold text-foreground tracking-[0.16px]"
              >
                Email
              </Label>
              <Input
                id="email"
                placeholder="nombre@empresa.com"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
                aria-invalid={!!errors.email}
              />
              {errors.email && <FieldError errors={[errors.email]} />}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="password"
                  className="text-[16px] font-semibold text-foreground tracking-[0.16px]"
                >
                  Contraseña
                </Label>
                <a
                  className="text-[16px] font-bold text-primary hover:underline transition-colors tracking-[0.24px]"
                  href="#"
                >
                  Olvidé mi contraseña
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className="w-full h-[56px] px-4 pr-12 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <FieldError errors={[errors.password]} />}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[16px] font-semibold tracking-[0.24px] transition-all mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Autenticando..." : "Iniciar Sesión"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>

          {/* Alternative Actions */}
          <div className="flex flex-col gap-8 items-center">
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 h-[1px] bg-border"></div>
              <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-widest">
                O continuar con
              </span>
              <div className="flex-1 h-[1px] bg-border"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button
                variant="outline"
                className="h-[48px] w-full rounded-full border-border text-[14px] font-semibold tracking-[0.16px] flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <Cloud className="h-5 w-5" />
                Google
              </Button>
              <Button
                variant="outline"
                className="h-[48px] w-full rounded-full border-border text-[14px] font-semibold tracking-[0.16px] flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <Shield className="h-5 w-5" />
                SSO
              </Button>
            </div>
            <p className="text-[14px] text-muted-foreground mt-2">
              ¿No tienes una cuenta?
              <a
                className="text-[16px] font-semibold text-foreground hover:underline ml-1 transition-colors tracking-[0.16px]"
                href="/register"
              >
                Registrarse
              </a>
            </p>
          </div>

          {/* Legal Footer */}
          <footer className="pt-8 border-t border-border mt-4 w-full">
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              <a
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                href="#"
              >
                Términos de Servicio
              </a>
              <a
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                href="#"
              >
                Privacidad
              </a>
              <a
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                href="#"
              >
                Ayuda
              </a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
