"use client";

import * as React from "react";
import { FileText, Award, GraduationCap, Plus, X, Tag, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
} from "../../schemas/vacancy-wizard.schema";

const SUGGESTED_SKILLS = [
  "Atención al cliente",
  "Puntualidad",
  "Trabajo en equipo",
  "Manejo de caja",
  "Comunicación asertiva",
  "Resolución de problemas",
  "Organización",
  "Actitud de servicio",
];

interface Step3DescriptionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

export function Step3Description({ form }: Step3DescriptionProps) {
  const [skillInput, setSkillInput] = React.useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddSkill = (field: any) => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    const current: string[] = field.state.value || [];
    if (!current.includes(trimmed)) {
      field.handleChange([...current, trimmed]);
    }
    setSkillInput("");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddSuggestedSkill = (field: any, skill: string) => {
    const current: string[] = field.state.value || [];
    if (!current.includes(skill)) {
      field.handleChange([...current, skill]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRemoveSkill = (field: any, skillToRemove: string) => {
    const current: string[] = field.state.value || [];
    field.handleChange(current.filter((s: string) => s !== skillToRemove));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Encabezado del Paso */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
        <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <FileText className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Descripción & Requisitos</h3>
          <p className="text-xs text-muted-foreground">Funciones del puesto, nivel de experiencia y habilidades</p>
        </div>
      </div>

      {/* 1. Editor Enriquecido de Descripción */}
      <form.Field name="description">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => (
          <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FieldLabel htmlFor="description" className="text-sm font-semibold text-foreground">
                  Funciones & Responsabilidades <span className="text-rose-500">*</span>
                </FieldLabel>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                Markdown
              </span>
            </div>
            <div className="rounded-2xl border border-border/80 overflow-hidden shadow-2xs">
              <RichTextEditor
                value={field.state.value || ""}
                onChange={(html) => field.handleChange(html)}
                placeholder="Describe detalladamente las funciones principales, responsabilidades del puesto y el perfil general del candidato..."
                minHeight="220px"
              />
            </div>
            <FieldDescription className="text-xs text-muted-foreground">
              Una descripción organizada y clara con viñetas facilita la postulación de candidatos idóneos.
            </FieldDescription>
            {field.state.meta.errors?.[0] && (
              <FieldError>{field.state.meta.errors[0]}</FieldError>
            )}
          </Field>
        )}
      </form.Field>

      {/* 2. Experiencia y Escolaridad en 2 Columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 pt-2 border-t border-border/60">
        {/* Experiencia Laboral */}
        <form.Field name="experience_required">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="size-3.5 text-muted-foreground" />
                <FieldLabel className="text-sm font-semibold text-foreground">
                  Experiencia Laboral Requerida
                </FieldLabel>
              </div>
              <Select
                value={field.state.value || "Sin experiencia previa"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 w-full rounded-2xl bg-input/50 border border-border/80 px-3.5 text-sm font-medium cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Selecciona la experiencia" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 bg-popover shadow-xl">
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <SelectItem
                      key={exp}
                      value={exp}
                      className="text-xs font-semibold rounded-xl cursor-pointer py-2.5"
                    >
                      {exp}
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

        {/* Nivel de Estudios */}
        <form.Field name="education_level">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-3.5 text-muted-foreground" />
                <FieldLabel className="text-sm font-semibold text-foreground">
                  Nivel de Estudios Mínimo
                </FieldLabel>
              </div>
              <Select
                value={field.state.value || "Indistinto"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 w-full rounded-2xl bg-input/50 border border-border/80 px-3.5 text-sm font-medium cursor-pointer shadow-2xs">
                  <SelectValue placeholder="Selecciona el nivel de estudios" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/60 bg-popover shadow-xl">
                  {EDUCATION_LEVELS.map((edu) => (
                    <SelectItem
                      key={edu}
                      value={edu}
                      className="text-xs font-semibold rounded-xl cursor-pointer py-2.5"
                    >
                      {edu}
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

      {/* 3. Habilidades y Competencias Clave */}
      <form.Field name="skills">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => {
          const skillsList: string[] = field.state.value || [];

          return (
            <Field className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  <FieldLabel className="text-sm font-semibold text-foreground">
                    Habilidades & Competencias Clave ({skillsList.length} agregadas)
                  </FieldLabel>
                </div>
              </div>
              <FieldDescription className="text-xs text-muted-foreground">
                Agrega palabras clave sobre las competencias deseadas para mejorar la coincidencia con los candidatos:
              </FieldDescription>

              {/* Chips de Habilidades Seleccionadas */}
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {skillsList.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1.5 rounded-xl font-bold text-xs gap-2 bg-input/40 border border-border/80 text-foreground shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(field, skill)}
                        className="text-muted-foreground hover:text-rose-500 cursor-pointer"
                        aria-label={`Eliminar ${skill}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Sugerencias Rápidas */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="size-3 text-primary" />
                  <span>Sugerencias Populares (clic para agregar):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SKILLS.filter((s) => !skillsList.includes(s)).map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSuggestedSkill(field, suggestion)}
                      className="h-7 px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition-all cursor-pointer"
                    >
                      + {suggestion}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Campo para Escribir Nueva Habilidad */}
              <div className="flex gap-2.5 pt-1">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill(field);
                    }
                  }}
                  placeholder="Escribe otra habilidad o competencia y presiona Enter..."
                  className="h-11 rounded-2xl bg-input/50 border border-border/80 px-3.5 text-xs font-medium shadow-2xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddSkill(field)}
                  disabled={!skillInput.trim()}
                  className="h-11 px-4 rounded-2xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  <Plus className="size-4 mr-1" />
                  <span>Agregar</span>
                </Button>
              </div>
            </Field>
          );
        }}
      </form.Field>
    </div>
  );
}
