"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Check,
  Circle,
  User,
  Phone,
  ShieldCheck,
  Sparkles,
  MapPin,
} from "@/components/ui/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormTextField } from "@/components/form";
import { useCompanyRegisterForm } from "../hooks/use-company-register-form";
import { Onboarding } from "@/components/ui/onboarding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CompanyLocationMap = dynamic(
  () =>
    import("./company-location-map").then((mod) => mod.CompanyLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-52 sm:h-56 rounded-2xl border border-border/70 bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
        <MapPin className="size-5 text-primary/60 animate-bounce" />
        <span className="text-xs font-semibold">Cargando mapa interactivo...</span>
      </div>
    ),
  }
);

const INDUSTRIES = [
  { id: "Hotelería & Turismo", label: "Hotelería y Turismo", icon: "🏨" },
  { id: "Restaurantes & Alimentos", label: "Restaurantes y Bebidas", icon: "🍽️" },
  { id: "Comercio & Retail", label: "Comercio y Retail", icon: "🛍️" },
  { id: "Construcción & Inmobiliaria", label: "Construcción e Inmuebles", icon: "🏗️" },
  { id: "Tecnología & Servicios", label: "Tecnología y TI", icon: "💻" },
  { id: "Logística & Transporte", label: "Logística y Transporte", icon: "🚚" },
  { id: "Salud & Bienestar", label: "Salud y Cuidado", icon: "🏥" },
  { id: "Servicios Generales", label: "Servicios Generales", icon: "🏢" },
  { id: "Otros", label: "Otros", icon: "💼" },
];

const CITIES = [
  "Mérida, Yucatán",
  "Cancún, Quintana Roo",
  "Playa del Carmen, Quintana Roo",
  "Tulum, Quintana Roo",
  "Chetumal, Quintana Roo",
  "Valladolid, Yucatán",
  "Cozumel, Quintana Roo",
  "Bacalar, Quintana Roo",
  "Puerto Morelos, Quintana Roo",
  "Felipe Carrillo Puerto, Quintana Roo",
  "Campeche, Campeche",
  "Ciudad del Carmen, Campeche",
  "Progreso, Yucatán",
  "Otra ciudad del Sureste",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1 a 10 colaboradores (Microempresa)" },
  { value: "11-50", label: "11 a 50 colaboradores (Pequeña)" },
  { value: "51-200", label: "51 a 200 colaboradores (Mediana)" },
  { value: "200+", label: "Más de 200 colaboradores (Corporativo)" },
];

export function CompanyRegisterForm() {
  const {
    currentStep,
    setCurrentStep,
    // Step 1
    credentialsRegister,
    credentialsErrors,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordCriteria,
    passwordsMatch,
    handleRegisterSubmit,
    // Step 2
    identityRegister,
    identityErrors,
    handleIdentitySubmit,
    // Step 3
    operations,
    setIndustry,
    setLocation,
    setFullLocation,
    setCompanySize,
    isFinishing,
    handleFinishOnboarding,
    handleSkipOnboarding,
  } = useCompanyRegisterForm();

  return (
    <Onboarding
      totalSteps={3}
      value={currentStep}
      onValueChange={setCurrentStep}
      className="w-full border-0 bg-transparent rounded-none p-0 shadow-none flex flex-col gap-5 select-none"
    >
      {/* ── PASO 1: Formulario de Registro (Email, Contraseña, Confirmar Contraseña) ── */}
      <Onboarding.Step step={1}>
        <div className="w-full flex flex-col items-center gap-5">
          {/* ── Brand Header (Título + Subtítulo con link) ── */}
          <div className="flex flex-col items-center text-center gap-1.5 w-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Registro de Empresa
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="text-foreground font-semibold underline underline-offset-4 hover:text-primary transition-colors"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>

          <form
            onSubmit={handleRegisterSubmit}
            className="w-full flex flex-col items-center gap-3.5"
            noValidate
          >
            {/* Correo Corporativo */}
            <div className="w-full space-y-1">
              <FormTextField
                id="email"
                label="Email Corporativo"
                hintText="contacto@empresa.com"
                type="email"
                required
                registerProps={credentialsRegister("email")}
                error={credentialsErrors.email?.message}
                prefixIcon={<Mail className="size-4" />}
              />
            </div>

            {/* Contraseña Segura */}
            <div className="w-full space-y-1.5">
              <FormTextField
                id="password"
                label="Contraseña"
                hintText="••••••••"
                type={showPassword ? "text" : "password"}
                required
                registerProps={credentialsRegister("password")}
                error={credentialsErrors.password?.message}
                prefixIcon={<Lock className="size-4" />}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                }
              />

              {/* Dynamic Password Checklist */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 px-0.5 text-[11px] select-none">
                <span
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    passwordCriteria.hasMinLength
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {passwordCriteria.hasMinLength ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="size-2 text-muted-foreground/60 fill-current" />
                  )}
                  Mínimo 8 caracteres
                </span>

                <span
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    passwordCriteria.hasUppercase
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {passwordCriteria.hasUppercase ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="size-2 text-muted-foreground/60 fill-current" />
                  )}
                  1 mayúscula
                </span>

                <span
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    passwordCriteria.hasNumber
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {passwordCriteria.hasNumber ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="size-2 text-muted-foreground/60 fill-current" />
                  )}
                  1 número
                </span>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="w-full space-y-1">
              <FormTextField
                id="confirmPassword"
                label="Confirmar contraseña"
                hintText="••••••••"
                type={showConfirmPassword ? "text" : "password"}
                required
                registerProps={credentialsRegister("confirmPassword")}
                error={credentialsErrors.confirmPassword?.message}
                prefixIcon={<Lock className="size-4" />}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmación"
                        : "Mostrar confirmación"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                }
              />
              {!passwordsMatch && (
                <p className="text-[11px] text-destructive px-0.5">
                  Las contraseñas deben ser idénticas.
                </p>
              )}
            </div>

            {/* Botón Principal (Create Account) */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin text-primary-foreground/80" />
                  <span>Creando cuenta de empresa...</span>
                </>
              ) : (
                <>
                  <span>Crear Cuenta de Empresa</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {/* Aviso Legal (Similar al footer de la referencia) */}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-1 mt-1">
              Al continuar, aceptas nuestros{" "}
              <Link
                href="/terms"
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
              >
                Términos de Servicio
              </Link>{" "}
              y{" "}
              <Link
                href="/privacy"
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
              >
                Aviso de Privacidad
              </Link>
              .
            </p>

            {/* Enlace alternativo para candidatos */}
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/60 w-full text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <User className="size-3.5 text-muted-foreground" />
                <span>¿Buscas empleo en el Sureste?</span>
                <Link
                  href="/register/candidate"
                  className="text-foreground font-semibold hover:text-primary underline ml-0.5 transition-colors"
                >
                  Regístrate como Candidato
                </Link>
              </p>
            </div>
          </form>
        </div>
      </Onboarding.Step>

      {/* ── PASO 2: Onboarding - Identidad de la Empresa (Nombre y Contacto) ── */}
      <Onboarding.Step step={2}>
        <div className="w-full flex flex-col items-center gap-5">
          {/* Header con icono centrado */}
          <div className="flex flex-col items-center text-center gap-1.5 w-full">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1 shadow-2xs">
              <Building2 className="size-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Nombre de tu Empresa
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              ¿Cómo se llama tu empresa o marca empleadora? Configuraremos tu espacio de trabajo.
            </p>
            <div className="w-full flex justify-center pt-2">
              <Onboarding.StepIndicator variant="pills" className="w-full max-w-[140px]" />
            </div>
          </div>

          <form
            onSubmit={handleIdentitySubmit}
            className="w-full flex flex-col items-center gap-3.5"
            noValidate
          >
            {/* Nombre de la Empresa */}
            <div className="w-full space-y-1">
              <FormTextField
                id="company_name"
                label="Nombre Comercial o Razón Social"
                hintText="ej. Hoteles Maya Riviera S.A. de C.V."
                type="text"
                required
                registerProps={identityRegister("company_name")}
                error={identityErrors.company_name?.message}
                prefixIcon={<Building2 className="size-4" />}
              />
            </div>

            {/* Teléfono o WhatsApp de contacto corporativo */}
            <div className="w-full space-y-1">
              <FormTextField
                id="contact_phone"
                label="Teléfono o WhatsApp de Contacto"
                hintText="ej. 998 123 4567"
                type="tel"
                registerProps={identityRegister("contact_phone")}
                error={identityErrors.contact_phone?.message}
                prefixIcon={<Phone className="size-4" />}
              />
            </div>

            {/* RFC de la empresa (Opcional) */}
            <div className="w-full space-y-1">
              <FormTextField
                id="rfc"
                label="RFC de la Empresa (Opcional)"
                hintText="ej. XAXX010101000"
                type="text"
                registerProps={identityRegister("rfc")}
                error={identityErrors.rfc?.message}
                prefixIcon={<ShieldCheck className="size-4" />}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Continuar a Giro y Ubicación</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </Onboarding.Step>

      {/* ── PASO 3: Onboarding - Operación, Giro y Ubicación en el Sureste ── */}
      <Onboarding.Step step={3}>
        <div className="w-full flex flex-col items-center gap-5">
          {/* Header con icono centrado */}
          <div className="flex flex-col items-center text-center gap-1.5 w-full">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1 shadow-2xs">
              <Sparkles className="size-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Giro y Ubicación
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              Personaliza tu espacio empresarial para conectar con el talento idóneo en el Sureste.
            </p>
            <div className="w-full flex justify-center pt-2">
              <Onboarding.StepIndicator variant="pills" className="w-full max-w-[140px]" />
            </div>
          </div>

          <div className="w-full flex flex-col gap-4">
            {/* Sector / Giro industrial con Select */}
            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Giro o Sector de la Empresa <span className="text-destructive">*</span>
              </label>
              <Select
                value={operations.industry}
                onValueChange={(val) => val && setIndustry(val)}
              >
                <SelectTrigger className="w-full h-11 px-3.5 rounded-xl bg-card border border-input text-foreground text-xs sm:text-sm shadow-2xs cursor-pointer">
                  <SelectValue placeholder="Selecciona el giro de la empresa" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/80 bg-popover text-popover-foreground">
                  {INDUSTRIES.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      className="text-xs sm:text-sm font-medium cursor-pointer rounded-lg py-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ciudad Sede en el Sureste con Select */}
            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <MapPin className="size-3.5 text-primary" />
                <span>Ciudad Sede en el Sureste</span>{" "}
                <span className="text-destructive">*</span>
              </label>
              <Select
                value={operations.location}
                onValueChange={(val) => val && setLocation(val)}
              >
                <SelectTrigger className="w-full h-11 px-3.5 rounded-xl bg-card border border-input text-foreground text-xs sm:text-sm shadow-2xs cursor-pointer">
                  <SelectValue placeholder="Selecciona la ciudad sede" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/80 bg-popover text-popover-foreground">
                  {CITIES.map((city) => (
                    <SelectItem
                      key={city}
                      value={city}
                      className="text-xs sm:text-sm font-medium cursor-pointer rounded-lg py-2"
                    >
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Mapa Interactivo con Leaflet + OpenStreetMap + Pin y Geocodificación ── */}
            <div className="w-full space-y-1.5 pt-0.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Ubicación Exacta en el Mapa</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  OpenStreetMap
                </span>
              </label>
              <CompanyLocationMap
                selectedCity={operations.location}
                initialAddress={operations.address_details}
                initialCoordinates={
                  operations.latitude && operations.longitude
                    ? [operations.latitude, operations.longitude]
                    : undefined
                }
                onLocationChange={(res) => {
                  setFullLocation({
                    location: res.city,
                    address_details: res.address,
                    latitude: res.latitude,
                    longitude: res.longitude,
                  });
                }}
              />
            </div>

            {/* Tamaño de la Empresa con Select */}
            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tamaño de la Empresa
              </label>
              <Select
                value={operations.company_size || "11-50"}
                onValueChange={(val) => val && setCompanySize(val)}
              >
                <SelectTrigger className="w-full h-11 px-3.5 rounded-xl bg-card border border-input text-foreground text-xs sm:text-sm shadow-2xs cursor-pointer">
                  <SelectValue placeholder="Selecciona el tamaño de la empresa" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/80 bg-popover text-popover-foreground">
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem
                      key={size.value}
                      value={size.value}
                      className="text-xs sm:text-sm font-medium cursor-pointer rounded-lg py-2"
                    >
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="h-11 px-5 rounded-xl cursor-pointer"
              >
                Atrás
              </Button>
              <Button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isFinishing}
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-primary-foreground/80" />
                    <span>Configurando...</span>
                  </>
                ) : (
                  <>
                    <span>Finalizar y Comenzar</span>
                    <Check className="size-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Omitir por ahora */}
            <button
              type="button"
              onClick={handleSkipOnboarding}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors mx-auto mt-0.5 cursor-pointer"
            >
              Omitir por ahora e ir al panel
            </button>
          </div>
        </div>
      </Onboarding.Step>
    </Onboarding>
  );
}
