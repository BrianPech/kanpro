"use client";

import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  Loader2,
  MapPin,
  User,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { FormTextField } from "@/components/form";
import { Onboarding } from "@/components/ui/onboarding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateOwnerNameSchema,
  type UpdateOwnerNameInput,
} from "@/modules/company/schemas/tenant.schema";
import {
  createCompanyAction,
  updateOwnerPersonalNameAction,
} from "@/modules/company/actions/tenant-actions";
import {
  companyOnboardingWorkspaceSchema,
  type CompanyOnboardingWorkspaceValues,
} from "../schemas/onboarding.schema";

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
  "Otra ciudad",
];

interface CompanyOnboardingFlowProps {
  initialStep?: 1 | 2;
  initialFullName?: string;
}

export function CompanyOnboardingFlow({
  initialStep = 1,
  initialFullName = "",
}: CompanyOnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [customLocation, setCustomLocation] = useState(false);

  const ownerForm = useForm<UpdateOwnerNameInput>({
    resolver: zodResolver(updateOwnerNameSchema),
    defaultValues: {
      fullName: initialFullName,
    },
    mode: "onTouched",
  });

  const companyForm = useForm<CompanyOnboardingWorkspaceValues>({
    resolver: zodResolver(companyOnboardingWorkspaceSchema),
    defaultValues: {
      company_name: "",
      location: "Mérida, Yucatán",
    },
    mode: "onTouched",
  });

  const selectedLocation = companyForm.watch("location");

  const onOwnerSubmit: SubmitHandler<UpdateOwnerNameInput> = async (data) => {
    try {
      setIsSavingName(true);
      const res = await updateOwnerPersonalNameAction({
        fullName: data.fullName,
      });

      if (!res.success) {
        toast.error("No se pudo guardar tu nombre", {
          description: res.error,
        });
        return;
      }

      setCurrentStep(2);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar tu nombre.";
      toast.error("Error en onboarding", { description: msg });
    } finally {
      setIsSavingName(false);
    }
  };

  const onCompanySubmit: SubmitHandler<CompanyOnboardingWorkspaceValues> = async (
    data
  ) => {
    try {
      setIsCreatingCompany(true);
      const res = await createCompanyAction({
        company_name: data.company_name,
        location: data.location,
        industry: "General",
      });

      if (!res.success) {
        toast.error("No se pudo registrar la empresa", {
          description: res.error,
        });
        return;
      }

      toast.success("¡Grupo de trabajo creado!", {
        description: `Bienvenido a ${res.data.companyName}.`,
      });

      router.push("/dashboard/company");
      router.refresh();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al registrar tu empresa.";
      toast.error("Error al crear empresa", { description: msg });
    } finally {
      setIsCreatingCompany(false);
    }
  };

  return (
    <Onboarding
      totalSteps={2}
      value={currentStep}
      onValueChange={setCurrentStep}
      className="w-full border-0 bg-transparent rounded-none p-0 shadow-none flex flex-col gap-5 select-none"
    >
      {/* ── PASO 1: Nombre del Dueño / Titular ── */}
      <Onboarding.Step step={1}>
        <div className="w-full flex flex-col items-center gap-5">
          <div className="flex flex-col items-center text-center gap-1.5 w-full">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1 shadow-2xs">
              <User className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              ¿Cuál es tu nombre?
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              Como titular de la cuenta podrás administrar una o varias empresas desde un mismo lugar.
            </p>
            <div className="w-full flex justify-center pt-2">
              <Onboarding.StepIndicator
                variant="pills"
                className="w-full max-w-[120px]"
              />
            </div>
          </div>

          <form
            onSubmit={ownerForm.handleSubmit(onOwnerSubmit)}
            className="w-full flex flex-col items-center gap-4"
            noValidate
          >
            <div className="w-full">
              <FormTextField
                id="fullName"
                label="Tu Nombre Completo"
                hintText="Ej. Carlos Méndez"
                type="text"
                required
                registerProps={ownerForm.register("fullName")}
                error={ownerForm.formState.errors.fullName?.message}
                prefixIcon={<User className="size-4" />}
              />
            </div>

            <Button
              type="submit"
              disabled={isSavingName}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingName ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </Onboarding.Step>

      {/* ── PASO 2: Registro Obligatorio de Primera Empresa (Grupo de Trabajo) ── */}
      <Onboarding.Step step={2}>
        <div className="w-full flex flex-col items-center gap-5">
          <div className="flex flex-col items-center text-center gap-1.5 w-full">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1 shadow-2xs">
              <Building2 className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Registra tu primera empresa
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              Esta empresa funcionará como tu primer grupo de trabajo para publicar vacantes y gestionar colaboradores.
            </p>
            <div className="w-full flex justify-center pt-2">
              <Onboarding.StepIndicator
                variant="pills"
                className="w-full max-w-[120px]"
              />
            </div>
          </div>

          <form
            onSubmit={companyForm.handleSubmit(onCompanySubmit)}
            className="w-full flex flex-col items-center gap-4"
            noValidate
          >
            <div className="w-full">
              <FormTextField
                id="company_name"
                label="Nombre de la Empresa"
                hintText="Ej. Grupo Hotelero Mayab"
                type="text"
                required
                registerProps={companyForm.register("company_name")}
                error={companyForm.formState.errors.company_name?.message}
                prefixIcon={<Building2 className="size-4" />}
              />
            </div>

            <div className="w-full space-y-1.5">
              <label
                htmlFor="location-select"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <MapPin className="size-3.5 text-muted-foreground" />
                <span>Ubicación</span>
                <span className="text-destructive">*</span>
              </label>

              {!customLocation ? (
                <Select
                  value={CITIES.includes(selectedLocation) ? selectedLocation : "Otra ciudad"}
                  onValueChange={(val) => {
                    if (!val) return;
                    if (val === "Otra ciudad") {
                      setCustomLocation(true);
                      companyForm.setValue("location", "", { shouldValidate: true });
                    } else {
                      companyForm.setValue("location", val, { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger id="location-select" className="w-full h-11 rounded-xl">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-1.5">
                  <FormTextField
                    id="location"
                    label=""
                    hintText="Ej. Guadalajara, Jalisco"
                    type="text"
                    required
                    registerProps={companyForm.register("location")}
                    error={companyForm.formState.errors.location?.message}
                    prefixIcon={<MapPin className="size-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLocation(false);
                      companyForm.setValue("location", "Mérida, Yucatán", {
                        shouldValidate: true,
                      });
                    }}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Elegir de la lista de ciudades
                  </button>
                </div>
              )}

              {!customLocation && companyForm.formState.errors.location?.message && (
                <p className="text-[11px] text-destructive px-0.5">
                  {companyForm.formState.errors.location.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isCreatingCompany}
              className="w-full h-11 mt-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCreatingCompany ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creando grupo de trabajo...</span>
                </>
              ) : (
                <>
                  <span>Ir al Dashboard de Empresas</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </Onboarding.Step>
    </Onboarding>
  );
}
