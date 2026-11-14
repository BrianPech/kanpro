"use client";

import * as React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Minus, Plus, Briefcase } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VACANCY_CATEGORIES,
  EMPLOYMENT_TYPES,
  SHIFT_SCHEDULES,
  type VacancyWizardValues,
} from "../../schemas/vacancy-wizard.schema";
import { getCompanyDepartmentsAction } from "../../actions/areas";

interface Step1BasicProps {
  form: UseFormReturn<VacancyWizardValues>;
}

export function Step1Basic({ form }: Step1BasicProps) {
  const [companyAreas, setCompanyAreas] = React.useState<
    { id: string; name: string }[]
  >([]);

  React.useEffect(() => {
    getCompanyDepartmentsAction().then((res) => {
      if (res.success && res.data) {
        setCompanyAreas(res.data);
      }
    });
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Encabezado del Paso */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
        <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Briefcase className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Información del Puesto</h3>
          <p className="text-xs text-muted-foreground">Datos esenciales del rol, tipo de contrato y plazas</p>
        </div>
      </div>

      {/* 1. Título del Puesto / Oferta */}
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <Field data-invalid={Boolean(fieldState.error)} className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="title" className="text-sm font-semibold text-foreground">
                Título del Puesto / Oferta <span className="text-rose-500">*</span>
              </FieldLabel>
              <span className="text-xs text-muted-foreground font-mono font-medium">
                {field.value?.length || 0}/80
              </span>
            </div>
            <Input
              id="title"
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Ej. Cocinero B (Línea Caliente), Recepcionista de Hotel, Mesero..."
              className="w-full"
              maxLength={80}
            />
            <FieldDescription className="text-xs text-muted-foreground">
              Usa un nombre claro y específico para que los candidatos locales encuentren tu oferta rápidamente.
            </FieldDescription>
            {fieldState.error?.message && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        )}
      />

      {/* 2. Categoría y Tipo de Jornada en 2 Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {/* Categoría Laboral */}
        <Controller
          control={form.control}
          name="category"
          render={({ field, fieldState }) => (
            <Field data-invalid={Boolean(fieldState.error)} className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel className="text-sm font-semibold text-foreground">
                  Área / Categoría <span className="text-rose-500">*</span>
                </FieldLabel>
                <a
                  href="/dashboard/company/areas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  + Gestionar áreas
                </a>
              </div>
              <Select
                value={field.value || "Alimentos y Bebidas"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger
                  aria-label="Categoría o Área de la vacante"
                  className="w-full"
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {companyAreas.length > 0 && (
                    <>
                      <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                        Áreas de tu Empresa
                      </div>
                      {companyAreas.map((area) => (
                        <SelectItem
                          key={`area-${area.id}`}
                          value={area.name}
                          className="text-xs cursor-pointer py-2 text-primary font-bold"
                        >
                          ✦ {area.name}
                        </SelectItem>
                      ))}
                      <div className="my-1 border-t border-border/40" />
                      <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Categorías Generales
                      </div>
                    </>
                  )}
                  {VACANCY_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-xs cursor-pointer py-2"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        {/* Tipo de Jornada */}
        <Controller
          control={form.control}
          name="employment_type"
          render={({ field, fieldState }) => (
            <Field data-invalid={Boolean(fieldState.error)} className="space-y-2">
              <FieldLabel className="text-sm font-semibold text-foreground">
                Tipo de Jornada <span className="text-rose-500">*</span>
              </FieldLabel>
              <Select
                value={field.value || "Tiempo Completo"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger
                  aria-label="Tipo de jornada laboral"
                  className="w-full"
                >
                  <SelectValue placeholder="Selecciona la jornada" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-xs cursor-pointer py-2"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />
      </div>

      {/* 3. Horario / Turno y Plazas Disponibles en 2 Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {/* Horario / Turno */}
        <Controller
          control={form.control}
          name="shift_schedule"
          render={({ field, fieldState }) => (
            <Field data-invalid={Boolean(fieldState.error)} className="space-y-2">
              <FieldLabel className="text-sm font-semibold text-foreground">
                Horario / Turno de Trabajo <span className="text-rose-500">*</span>
              </FieldLabel>
              <Select
                value={field.value || "Matutino (Mañana)"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger
                  aria-label="Horario o turno de trabajo"
                  className="w-full"
                >
                  <SelectValue placeholder="Selecciona el turno" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_SCHEDULES.map((shift) => (
                    <SelectItem
                      key={shift}
                      value={shift}
                      className="text-xs cursor-pointer py-2"
                    >
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        {/* Plazas Disponibles: Control Normalizado */}
        <Controller
          control={form.control}
          name="positions_available"
          render={({ field, fieldState }) => {
            const count = Math.max(1, Number(field.value) || 1);

            return (
              <Field data-invalid={Boolean(fieldState.error)} className="space-y-2">
                <FieldLabel className="text-sm font-semibold text-foreground">
                  Número de Plazas Disponibles
                </FieldLabel>
                <div className="flex items-center justify-between h-9 w-full rounded-3xl border border-input bg-input/50 px-2 transition-colors">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.onChange(Math.max(1, count - 1))}
                    disabled={count <= 1}
                    className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Reducir plazas"
                  >
                    <Minus className="size-4" />
                  </Button>

                  <div className="flex items-center gap-1.5 select-none">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {count}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {count === 1 ? "vacante disponible" : "vacantes disponibles"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.onChange(count + 1)}
                    disabled={count >= 50}
                    className="cursor-pointer"
                    aria-label="Aumentar plazas"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {fieldState.error?.message && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            );
          }}
        />
      </div>
    </div>
  );
}
