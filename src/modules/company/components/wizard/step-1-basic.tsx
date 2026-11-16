"use client";

import * as React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
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

  const categoryOptions = React.useMemo(() => {
    const merged = new Set<string>(VACANCY_CATEGORIES);
    companyAreas.forEach((area) => {
      if (area.name?.trim()) merged.add(area.name.trim());
    });
    return Array.from(merged);
  }, [companyAreas]);

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.015em] text-foreground">
          Datos del puesto
        </h2>
        <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
          Define el puesto y cuántas personas buscas.
        </p>
      </div>

      {/* Nombre del puesto */}
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <Field data-invalid={Boolean(fieldState.error)} className="gap-[6px]">
            <label
              htmlFor="vacancy-title"
              className="text-[14px] font-medium leading-[20px] text-foreground"
            >
              Nombre del puesto
            </label>
            <Input
              id="vacancy-title"
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Ej. Recepcionista de hotel"
              maxLength={80}
              className="h-[44px] rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal"
            />
            {fieldState.error?.message && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        )}
      />

      {/* Categoría y Plazas disponibles */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-[16px] items-start">
        <Controller
          control={form.control}
          name="category"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Categoría
              </span>
              <Select
                value={field.value || "Hotelería y Turismo"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  {categoryOptions.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
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

        <Controller
          control={form.control}
          name="positions_available"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <label
                htmlFor="vacancy-positions"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Plazas disponibles
              </label>
              <Input
                id="vacancy-positions"
                type="number"
                min={1}
                value={field.value ?? 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  field.onChange(Number.isNaN(val) ? 1 : Math.max(1, val));
                }}
                className="h-[44px] rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal tabular-nums"
              />
              <span className="text-[12px] leading-[16px] text-muted-foreground">
                Mínimo 1 plaza
              </span>
              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />
      </div>

      {/* Tipo de jornada y Horario o turno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
        <Controller
          control={form.control}
          name="employment_type"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Tipo de jornada
              </span>
              <Select
                value={field.value || "Tiempo Completo"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Selecciona tipo de jornada" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
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

        <Controller
          control={form.control}
          name="shift_schedule"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Horario o turno
              </span>
              <Select
                value={field.value || "Vespertino (Tarde)"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Selecciona horario" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  {SHIFT_SCHEDULES.map((shift) => (
                    <SelectItem
                      key={shift}
                      value={shift}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
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
      </div>
    </div>
  );
}
