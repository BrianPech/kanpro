"use client";

import * as React from "react";
import { Sparkles, Minus, Plus, Sun, Sunset, Moon, RefreshCw, Clock } from "lucide-react";
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
} from "../../schemas/vacancy-wizard.schema";
import { VACANCY_PRESETS, type VacancyPreset } from "../../data/vacancy-presets";
import { cn } from "@/lib/utils";

const SHIFT_OPTIONS = [
  { value: "Matutino (Mañana)", label: "Matutino", icon: Sun, desc: "Mañana" },
  { value: "Vespertino (Tarde)", label: "Vespertino", icon: Sunset, desc: "Tarde" },
  { value: "Nocturno (Noche)", label: "Nocturno", icon: Moon, desc: "Noche" },
  { value: "Mixto / Rolado", label: "Mixto / Rolado", icon: RefreshCw, desc: "Rotativo" },
  { value: "Flexible", label: "Flexible", icon: Clock, desc: "A convenir" },
];

interface Step1BasicProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onApplyPreset?: (preset: VacancyPreset) => void;
}

export function Step1Basic({ form, onApplyPreset }: Step1BasicProps) {
  return (
    <div className="space-y-8">
      {/* 1. Plantillas Rápidas con diseño limpio */}
      <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="size-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Plantillas Rápidas para Puestos Habituales
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Aplica un perfil preconfigurado con un clic
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {VACANCY_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onApplyPreset?.(preset)}
              className="h-8 rounded-xl text-xs font-semibold border-border/70 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer shadow-2xs"
            >
              <span>{preset.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 2. Título de la Vacante */}
      <form.Field name="title">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => (
          <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-foreground">
                Título del Puesto / Oferta <span className="text-rose-500">*</span>
              </FieldLabel>
              <span className="text-xs text-muted-foreground font-mono font-semibold">
                {field.state.value?.length || 0}/80
              </span>
            </div>
            <Input
              id="title"
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Ej. Cocinero B (Línea Caliente), Recepcionista de Hotel, Mesero..."
              className="h-12 rounded-xl bg-background border-border/70 text-base font-semibold focus-visible:ring-primary shadow-2xs"
              maxLength={80}
            />
            <FieldDescription className="text-xs text-muted-foreground">
              Usa un nombre claro y específico para que los candidatos locales encuentren tu vacante rápidamente en las búsquedas.
            </FieldDescription>
            {field.state.meta.errors?.[0] && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>

      {/* 3. Categoría y Tipo de Jornada en 2 Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Categoría */}
        <form.Field name="category">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
              <FieldLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                Categoría Laboral <span className="text-rose-500">*</span>
              </FieldLabel>
              <Select
                value={field.state.value || "Alimentos y Bebidas"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background border-border/70 text-sm font-semibold cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl max-h-72">
                  {VACANCY_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-xs font-semibold rounded-lg cursor-pointer py-2.5"
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
              <FieldLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tipo de Jornada <span className="text-rose-500">*</span>
              </FieldLabel>
              <Select
                value={field.state.value || "Tiempo Completo"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-12 rounded-xl bg-background border-border/70 text-sm font-semibold cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Selecciona la jornada" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-xs font-semibold rounded-lg cursor-pointer py-2.5"
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

      {/* 4. Horario / Turno de Trabajo: Selector de Cards con 1 Clic */}
      <form.Field name="shift_schedule">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => {
          const activeShift = field.state.value || "Matutino (Mañana)";

          return (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Horario / Turno de Trabajo <span className="text-rose-500">*</span>
                </FieldLabel>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Selecciona el turno habitual
                </span>
              </div>

              {/* Botones de Selección Directa */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {SHIFT_OPTIONS.map((opt) => {
                  const isSelected = activeShift === opt.value;
                  const Icon = opt.icon;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.handleChange(opt.value)}
                      className={cn(
                        "p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background hover:bg-muted/50 text-foreground border-border/70"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={cn("size-4", isSelected ? "text-primary-foreground" : "text-primary")} />
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {opt.desc}
                        </span>
                      </div>
                      <span className="text-xs font-bold truncate">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {field.state.meta.errors?.[0] && (
                <FieldError>{field.state.meta.errors[0]}</FieldError>
              )}
            </Field>
          );
        }}
      </form.Field>

      {/* 5. Plazas Disponibles */}
      <form.Field name="positions_available">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => (
          <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
            <FieldLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
              Número de Plazas Disponibles para esta Vacante
            </FieldLabel>
            <div className="flex items-center gap-3 max-w-xs">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  field.handleChange(Math.max(1, (Number(field.state.value) || 1) - 1))
                }
                className="size-12 rounded-xl border-border/70 text-base font-bold cursor-pointer shrink-0 shadow-2xs hover:bg-muted"
                aria-label="Reducir plazas"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={50}
                value={field.state.value || 1}
                onChange={(e) =>
                  field.handleChange(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="h-12 rounded-xl bg-background border-border/70 text-center font-black text-base font-mono shadow-2xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  field.handleChange((Number(field.state.value) || 1) + 1)
                }
                className="size-12 rounded-xl border-border/70 text-base font-bold cursor-pointer shrink-0 shadow-2xs hover:bg-muted"
                aria-label="Aumentar plazas"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {field.state.meta.errors?.[0] && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>
    </div>
  );
}
