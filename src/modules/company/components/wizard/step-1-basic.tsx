"use client";

import * as React from "react";
import { Sparkles, Users, Clock, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { VACANCY_PRESETS, type VacancyPreset } from "../../data/vacancy-presets";

interface Step1BasicProps {
  form: any;
  onApplyPreset?: (preset: VacancyPreset) => void;
}

export function Step1Basic({ form, onApplyPreset }: Step1BasicProps) {
  return (
    <div className="space-y-6">
      {/* 1. Quick Presets Bar */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Sparkles className="size-4 text-primary" />
          <span>Plantillas Rápidas para Puestos Habituales</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Selecciona una plantilla para auto-completar título, sueldo, responsabilidades y prestaciones recomendadas:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {VACANCY_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onApplyPreset?.(preset)}
              className="h-8 rounded-xl text-xs font-semibold hover:bg-card hover:border-primary/50 transition-all cursor-pointer"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 2. Main Job Title Input */}
      <form.Field
        name="title"
        children={(field: any) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Título del Puesto / Oferta <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {field.state.value?.length || 0}/80
              </span>
            </div>
            <Input
              id="title"
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Ej. Cocinero B (Línea Caliente), Recepcionista de Hotel, Mesero..."
              className="h-11 rounded-xl bg-card border-border/60 text-sm font-semibold"
              maxLength={80}
            />
            {field.state.meta.errors?.[0] && (
              <p className="text-xs font-semibold text-rose-500">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      {/* 3. Category & Employment Type Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category Select */}
        <form.Field
          name="category"
          children={(field: any) => (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categoría Laboral <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={field.state.value || "Alimentos y Bebidas"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg max-h-64">
                  {VACANCY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs font-semibold rounded-lg cursor-pointer">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {/* Employment Type */}
        <form.Field
          name="employment_type"
          children={(field: any) => (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tipo de Jornada <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={field.state.value || "Tiempo Completo"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                  <SelectValue placeholder="Selecciona la jornada" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs font-semibold rounded-lg cursor-pointer">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* 4. Shift Schedule & Positions Available */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Shift Schedule */}
        <form.Field
          name="shift_schedule"
          children={(field: any) => (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Horario / Turno de Trabajo <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={field.state.value || "Matutino (Mañana)"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                  <SelectValue placeholder="Selecciona el turno" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg">
                  {SHIFT_SCHEDULES.map((shift) => (
                    <SelectItem key={shift} value={shift} className="text-xs font-semibold rounded-lg cursor-pointer">
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {/* Positions Available Stepper */}
        <form.Field
          name="positions_available"
          children={(field: any) => (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Número de Plazas / Vacantes Disponibles
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => field.handleChange(Math.max(1, (field.state.value || 1) - 1))}
                  className="size-11 rounded-xl border-border/60 text-lg font-bold cursor-pointer"
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={field.state.value || 1}
                  onChange={(e) => field.handleChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-11 rounded-xl bg-card border-border/60 text-center font-bold text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => field.handleChange((field.state.value || 1) + 1)}
                  className="size-11 rounded-xl border-border/60 text-lg font-bold cursor-pointer"
                >
                  +
                </Button>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
