"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
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
} from "../../schemas/vacancy-wizard.schema";

interface Step1BasicProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

export function Step1Basic({ form }: Step1BasicProps) {
  return (
    <div className="space-y-6">
      {/* 1. Título del Puesto / Oferta */}
      <form.Field name="title">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => (
          <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="title" className="text-sm font-semibold text-foreground">
                Título del Puesto / Oferta <span className="text-rose-500">*</span>
              </FieldLabel>
              <span className="text-xs text-muted-foreground font-mono font-medium">
                {field.state.value?.length || 0}/80
              </span>
            </div>
            <Input
              id="title"
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Ej. Cocinero B (Línea Caliente), Recepcionista de Hotel, Mesero..."
              className="h-11 w-full rounded-2xl bg-input/50 border border-border/80 px-3.5 text-sm font-medium focus-visible:bg-background shadow-2xs"
              maxLength={80}
            />
            <FieldDescription className="text-xs text-muted-foreground">
              Usa un nombre claro y específico para que los candidatos locales encuentren tu oferta rápidamente.
            </FieldDescription>
            {field.state.meta.errors?.[0] && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>

      {/* 2. Categoría y Tipo de Jornada en 2 Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {/* Categoría Laboral */}
        <form.Field name="category">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
              <FieldLabel className="text-sm font-semibold text-foreground">
                Categoría Laboral <span className="text-rose-500">*</span>
              </FieldLabel>
              <Select
                value={field.state.value || "Alimentos y Bebidas"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 w-full rounded-2xl bg-input/50 border border-border/80 px-3.5 text-sm font-medium cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 bg-popover shadow-xl max-h-72">
                  {VACANCY_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-xs font-semibold rounded-xl cursor-pointer py-2.5"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors?.[0] && (
                <FieldError>{field.state.meta.errors[0]}</FieldError>
              )}
            </Field>
          )}
        </form.Field>

        {/* Tipo de Jornada */}
        <form.Field name="employment_type">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
              <FieldLabel className="text-sm font-semibold text-foreground">
                Tipo de Jornada <span className="text-rose-500">*</span>
              </FieldLabel>
              <Select
                value={field.state.value || "Tiempo Completo"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 w-full rounded-2xl bg-input/50 border border-border/80 px-3.5 text-sm font-medium cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Selecciona la jornada" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 bg-popover shadow-xl">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-xs font-semibold rounded-xl cursor-pointer py-2.5"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors?.[0] && (
                <FieldError>{field.state.meta.errors[0]}</FieldError>
              )}
            </Field>
          )}
        </form.Field>
      </div>

      {/* 3. Horario / Turno y Plazas Disponibles en 2 Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {/* Horario / Turno */}
        <form.Field name="shift_schedule">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
              <FieldLabel className="text-sm font-semibold text-foreground">
                Horario / Turno de Trabajo <span className="text-rose-500">*</span>
              </FieldLabel>
              <Select
                value={field.state.value || "Matutino (Mañana)"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 w-full rounded-2xl bg-input/50 border border-border/80 px-3.5 text-sm font-medium cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Selecciona el turno" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 bg-popover shadow-xl">
                  {SHIFT_SCHEDULES.map((shift) => (
                    <SelectItem
                      key={shift}
                      value={shift}
                      className="text-xs font-semibold rounded-xl cursor-pointer py-2.5"
                    >
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors?.[0] && (
                <FieldError>{field.state.meta.errors[0]}</FieldError>
              )}
            </Field>
          )}
        </form.Field>

        {/* Plazas Disponibles: Control Normalizado */}
        <form.Field name="positions_available">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const count = Math.max(1, Number(field.state.value) || 1);

            return (
              <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
                <FieldLabel className="text-sm font-semibold text-foreground">
                  Número de Plazas Disponibles
                </FieldLabel>
                <div className="flex items-center justify-between h-11 w-full rounded-2xl border border-border/80 bg-input/50 px-2 shadow-2xs transition-colors">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.handleChange(Math.max(1, count - 1))}
                    disabled={count <= 1}
                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
                    onClick={() => field.handleChange(count + 1)}
                    disabled={count >= 50}
                    className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer"
                    aria-label="Aumentar plazas"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {field.state.meta.errors?.[0] && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}
