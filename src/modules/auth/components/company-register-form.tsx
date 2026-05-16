"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";

import { createClient } from "@/lib/supabase/client";
import { companyRegisterSchema, type CompanyRegisterValues } from "../schemas/register.schema";

export function CompanyRegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyRegisterValues>({
    resolver: zodResolver(companyRegisterSchema as any),
  });

  const onSubmit = async (data: CompanyRegisterValues) => {
    try {
      console.log("Iniciando registro...");
      // 1. Crear usuario en Supabase Auth con metadata de rol
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "company",
            full_name: data.companyName,
          }
        }
      });

      if (authError) {
        console.error("Error en Auth:", authError);
        throw authError;
      }
      console.log("Usuario creado en Auth con metadata de rol:", authData.user?.id);

      if (authData.user) {
        // Omitimos la actualización de 'profiles' ya que la tabla no existe en el esquema.
        // Usaremos la metadata del usuario para determinar el rol.

        // 2. Insertar en company_profiles
        console.log("Insertando en company_profiles...");
        const { error: profileError } = await supabase
          .from("company_profiles")
          .insert({
            id: authData.user.id,
            company_name: data.companyName,
            industry: data.industry,
            website_or_linkedin: data.websiteOrLinkedin,
            location: data.location,
          });

        if (profileError) {
          console.error("Error en company_profiles insert:", profileError);
          throw profileError;
        }
        console.log("Registro completo en base de datos.");

        toast.success("Cuenta creada", {
          description: "Bienvenido a K'anPro. Serás redirigido al dashboard."
        });
        
        router.push("/dashboard/company");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error capturado en onSubmit:", error);
      toast.error("Error al registrar", {
        description: error.message || "No se pudo crear la cuenta."
      });
    }
  };

  return (
    <main className="flex flex-col min-h-screen w-full items-center justify-center bg-background font-sans p-6 md:p-12 transition-colors duration-300">
      <div className="w-full max-w-[480px] flex flex-col gap-8">
        
        <Link href="/register" className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          Volver a opciones
        </Link>

        <header className="flex flex-col gap-2">
          <h1 className="text-[32px] font-medium text-foreground tracking-[-0.32px] leading-[1.19]">
            Registro de Empresa
          </h1>
          <p className="text-[16px] text-muted-foreground tracking-[0.24px] leading-[1.5]">
            Escale sus operaciones encontrando el mejor talento.
          </p>
        </header>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="companyName" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Nombre de la Empresa</Label>
            <Input
              id="companyName"
              placeholder="TechCorp Inc."
              {...register("companyName")}
              className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
              aria-invalid={!!errors.companyName}
            />
            {errors.companyName && <FieldError errors={[errors.companyName]} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="industry" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Industria</Label>
            <Input
              id="industry"
              placeholder="Software, Finanzas, etc."
              {...register("industry")}
              className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
              aria-invalid={!!errors.industry}
            />
            {errors.industry && <FieldError errors={[errors.industry]} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="websiteOrLinkedin" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Sitio Web o LinkedIn</Label>
            <Input
              id="websiteOrLinkedin"
              placeholder="https://tuempresa.com"
              {...register("websiteOrLinkedin")}
              className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
              aria-invalid={!!errors.websiteOrLinkedin}
            />
            {errors.websiteOrLinkedin && <FieldError errors={[errors.websiteOrLinkedin]} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Ubicación</Label>
            <Input
              id="location"
              placeholder="Ciudad, País"
              {...register("location")}
              className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
              aria-invalid={!!errors.location}
            />
            {errors.location && <FieldError errors={[errors.location]} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Email Corporativo</Label>
            <Input
              id="email"
              placeholder="contacto@empresa.com"
              type="email"
              {...register("email")}
              className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
              aria-invalid={!!errors.email}
            />
            {errors.email && <FieldError errors={[errors.email]} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full h-[56px] px-4 pr-12 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <FieldError errors={[errors.password]} />}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[16px] font-semibold tracking-[0.24px] transition-all mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </form>

        <p className="text-[14px] text-muted-foreground text-center mt-2 font-normal">
          ¿Ya tienes una cuenta?
          <Link href="/" className="text-[16px] font-bold text-primary hover:underline ml-1.5 transition-colors tracking-[0.24px]">
            Iniciar Sesión
          </Link>
        </p>

      </div>
    </main>
  );
}
