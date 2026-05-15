"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight, ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { professionalRegisterSchema, type ProfessionalRegisterValues } from "../schemas/register.schema";

export function ProfessionalRegisterForm() {
  const [step, setStep] = React.useState(1);
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalRegisterValues>({
    resolver: zodResolver(professionalRegisterSchema as any),
    mode: "onTouched",
  });

  const onSubmit = async (data: ProfessionalRegisterValues) => {
    setAuthError(null);
    const supabase = createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (signUpError) {
      setAuthError(signUpError.message);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from("professional_profiles")
        .insert({
          id: authData.user.id,
          full_name: data.fullName,
          birth_date: data.birthDate,
          location: data.location,
          category: data.category,
          terms_accepted: data.termsAccepted,
        });

      if (profileError) {
        setAuthError(profileError.message);
        return;
      }

      router.push("/dashboard");
    }
  };

  const nextStep = async (fields: (keyof ProfessionalRegisterValues)[]) => {
    // Validar solo los campos del paso actual
    const isValid = await trigger(fields);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <main className="flex flex-col min-h-screen w-full items-center justify-center bg-background font-sans p-6 md:p-12 transition-colors duration-300">
      <div className="w-full max-w-[480px] flex flex-col gap-8">
        
        {step === 1 ? (
          <Link href="/register" className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" />
            Volver a opciones
          </Link>
        ) : (
          <button onClick={prevStep} type="button" className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Paso anterior
          </button>
        )}

        <header className="flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between">
            <h1 className="text-[32px] font-medium text-foreground tracking-[-0.32px] leading-[1.19]">
              Registro Profesional
            </h1>
            <span className="text-[14px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
              Paso {step} de 3
            </span>
          </div>
          <p className="text-[16px] text-muted-foreground tracking-[0.24px] leading-[1.5]">
            {step === 1 && "Complete sus datos de identidad para comenzar."}
            {step === 2 && "Validemos su información básica."}
            {step === 3 && "Configure su perfil profesional."}
          </p>
        </header>

        <form className="flex flex-col gap-6 relative" onSubmit={handleSubmit(onSubmit)} noValidate>
          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm mb-4">
              {authError}
            </div>
          )}
          
          {/* PASO 1: IDENTIDAD */}
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Ej. Juan Pérez"
                  {...register("fullName")}
                  className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && <FieldError errors={[errors.fullName]} />}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Correo Electrónico *</Label>
                <Input
                  id="email"
                  placeholder="juan@ejemplo.com"
                  type="email"
                  {...register("email")}
                  className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <FieldError errors={[errors.email]} />}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Contraseña *</Label>
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
                type="button"
                onClick={() => nextStep(["fullName", "email", "password"])}
                className="h-[48px] w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[16px] font-semibold tracking-[0.24px] transition-all mt-2 flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* PASO 2: VALIDACIÓN */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2">
                <Label htmlFor="birthDate" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Fecha de Nacimiento *</Label>
                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          role="combobox"
                          aria-invalid={!!errors.birthDate}
                          className={cn(
                            "w-full !h-[56px] px-4 text-[16px] justify-start text-left font-normal rounded-[12px] border border-transparent bg-input/50 dark:bg-input/50 hover:bg-input/50 dark:hover:bg-input/50 focus-visible:ring-primary/20 transition-all",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {field.value ? format(new Date(field.value + "T00:00:00"), "PPP", { locale: es }) : <span>Seleccione su fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background/80 backdrop-blur-xl border-border/50 shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.birthDate && <FieldError errors={[errors.birthDate]} />}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="location" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">País de Residencia *</Label>
                <Controller
                  control={control}
                  name="location"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full !h-[56px] px-4 text-[16px] rounded-[12px] border border-transparent bg-input/50 focus-visible:ring-primary/20 transition-all" aria-invalid={!!errors.location}>
                        <SelectValue placeholder="Seleccione su país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MX">🇲🇽 México</SelectItem>
                        <SelectItem value="ES">🇪🇸 España</SelectItem>
                        <SelectItem value="CO">🇨🇴 Colombia</SelectItem>
                        <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
                        <SelectItem value="CL">🇨🇱 Chile</SelectItem>
                        <SelectItem value="PE">🇵🇪 Perú</SelectItem>
                        <SelectItem value="US">🇺🇸 Estados Unidos</SelectItem>
                        <SelectItem value="other">🌍 Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.location && <FieldError errors={[errors.location]} />}
              </div>

              <Button
                type="button"
                onClick={() => nextStep(["birthDate", "location"])}
                className="h-[48px] w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[16px] font-semibold tracking-[0.24px] transition-all mt-2 flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* PASO 3: PERFIL */}
          {step === 3 && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Categoría Profesional *</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full !h-[56px] px-4 text-[16px] rounded-[12px] border border-transparent bg-input/50 focus-visible:ring-primary/20 transition-all" aria-invalid={!!errors.category}>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="software">Desarrollo de Software</SelectItem>
                        <SelectItem value="design">Diseño y UI/UX</SelectItem>
                        <SelectItem value="marketing">Marketing y SEO</SelectItem>
                        <SelectItem value="finance">Finanzas y Contabilidad</SelectItem>
                        <SelectItem value="legal">Consultoría Legal</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <FieldError errors={[errors.category]} />}
              </div>

              <div className="flex items-start space-x-3 mt-2">
                <Controller
                  control={control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <Checkbox
                      id="termsAccepted"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1"
                    />
                  )}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="termsAccepted"
                    className="text-[14px] font-medium leading-relaxed tracking-[0.16px] text-foreground cursor-pointer"
                  >
                    He leído y acepto los{" "}
                    <a href="#" className="text-primary hover:underline">Términos de Servicio</a>
                    {" "}y la{" "}
                    <a href="#" className="text-primary hover:underline">Política de Privacidad</a>.*
                  </label>
                  {errors.termsAccepted && <FieldError errors={[errors.termsAccepted]} />}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-[48px] w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[16px] font-semibold tracking-[0.24px] transition-all mt-4 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Finalizar registro" : "Finalizar registro"}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}
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
