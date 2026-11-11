"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Building2,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCompanySchema,
  type CreateCompanyInput,
} from "../../schemas/tenant.schema";
import { createCompanyAction } from "../../actions/tenant-actions";
import { cn } from "@/lib/utils";

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
  "Campeche, Campeche",
  "Ciudad del Carmen, Campeche",
  "Progreso, Yucatán",
  "Otra ciudad",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1 a 10 colaboradores (Microempresa)" },
  { value: "11-50", label: "11 a 50 colaboradores (Pequeña)" },
  { value: "51-200", label: "51 a 200 colaboradores (Mediana)" },
  { value: "201+", label: "Más de 200 colaboradores (Corporativa)" },
];

interface CreateCompanyWizardProps {
  isFirstCompany?: boolean;
}

export function CreateCompanyWizard({ isFirstCompany = false }: CreateCompanyWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      company_name: "",
      legal_name: "",
      rfc: "",
      industry: "Hotelería & Turismo",
      company_size: "1-10",
      location: "Mérida, Yucatán",
      address_details: "",
      contact_phone: "",
      website_url: "",
      description: "",
    },
    mode: "onTouched",
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;

  const currentIndustry = watch("industry");
  const currentLocation = watch("location");
  const currentSize = watch("company_size");

  const onSubmit = async (values: CreateCompanyInput) => {
    try {
      setIsSubmitting(true);
      const res = await createCompanyAction(values);

      if (!res.success) {
        toast.error("Error al registrar la empresa", {
          description: res.error,
        });
        return;
      }

      toast.success("¡Organización registrada!", {
        description: `Bienvenido a ${res.data.companyName}. Tu espacio de trabajo está listo.`,
      });

      router.push("/dashboard/company");
      router.refresh();
    } catch (err) {
      console.error("Error creating company:", err);
      toast.error("Ocurrió un error inesperado al dar de alta la empresa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-6 md:py-10">
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-2 pb-6 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                {isFirstCompany ? "Da de alta tu primera Empresa" : "Registrar Nueva Organización"}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {isFirstCompany
                  ? "Configura la entidad a nombre de la cual publicarás vacantes y gestionarás talento."
                  : "Crea otra razón social o unidad de negocio para gestionarla desde tu misma cuenta."}
              </CardDescription>
            </div>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 pt-4">
            <div
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                step >= 1 ? "bg-primary" : "bg-muted"
              )}
            />
            <div
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                step >= 2 ? "bg-primary" : "bg-muted"
              )}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Paso 1: Identidad y Datos Fiscales</span>
            <span>Paso 2: Operación y Ubicación</span>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="space-y-1.5">
                  <Label htmlFor="company_name" className="text-xs font-semibold">
                    Nombre Comercial de la Empresa <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      placeholder="Ej. Hotel Gran Península, Tacos Mérida"
                      className="pl-9"
                      {...register("company_name")}
                    />
                  </div>
                  {errors.company_name && (
                    <p className="text-xs text-destructive">{errors.company_name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="legal_name" className="text-xs font-semibold">
                      Razón Social (Opcional)
                    </Label>
                    <Input
                      id="legal_name"
                      placeholder="Ej. Operadora Hotelera S.A. de C.V."
                      {...register("legal_name")}
                    />
                    {errors.legal_name && (
                      <p className="text-xs text-destructive">{errors.legal_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rfc" className="text-xs font-semibold">
                      RFC (Opcional para comenzar)
                    </Label>
                    <Input
                      id="rfc"
                      placeholder="XAXX010101000"
                      maxLength={13}
                      className="uppercase font-mono"
                      {...register("rfc")}
                    />
                    {errors.rfc && (
                      <p className="text-xs text-destructive">{errors.rfc.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone" className="text-xs font-semibold">
                    Teléfono de Contacto Comercial / RRHH
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="contact_phone"
                      placeholder="Ej. 999 123 4567"
                      className="pl-9"
                      {...register("contact_phone")}
                    />
                  </div>
                  {errors.contact_phone && (
                    <p className="text-xs text-destructive">{errors.contact_phone.message}</p>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={async () => {
                      const valid = await form.trigger(["company_name", "legal_name", "rfc", "contact_phone"]);
                      if (valid) setStep(2);
                    }}
                    className="gap-2 font-medium"
                  >
                    <span>Siguiente: Operación</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Giro / Industria Principal <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={currentIndustry}
                    onValueChange={(val) => {
                      if (val) setValue("industry", val, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una industria" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.id} value={ind.id}>
                          <span className="mr-2">{ind.icon}</span>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-xs text-destructive">{errors.industry.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Ubicación Principal / Ciudad <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={currentLocation}
                      onValueChange={(val) => {
                        if (val) setValue("location", val, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tamaño de la Plantilla</Label>
                    <Select
                      value={currentSize}
                      onValueChange={(val) => {
                        if (val) setValue("company_size", val);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona rango" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address_details" className="text-xs font-semibold">
                    Dirección o Referencia
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="address_details"
                      placeholder="Calle, Número, Colonia, C.P."
                      className="pl-9"
                      {...register("address_details")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website_url" className="text-xs font-semibold">
                    Sitio Web o Red Social (Opcional)
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="website_url"
                      placeholder="https://tuempresa.com"
                      className="pl-9"
                      {...register("website_url")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Breve Descripción de la Empresa (Opcional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Cuéntanos un poco sobre qué hace la empresa y tu ambiente laboral..."
                    rows={3}
                    {...register("description")}
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Atrás</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        <span>Completar y Activar Empresa</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
