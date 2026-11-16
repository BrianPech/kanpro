"use client";

import * as React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { X } from "@/components/ui/icons";
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
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
  type VacancyWizardValues,
} from "../../schemas/vacancy-wizard.schema";

interface Step3DescriptionProps {
  form: UseFormReturn<VacancyWizardValues>;
}

export function Step3Description({ form }: Step3DescriptionProps) {
  const [skillInput, setSkillInput] = React.useState("");

  const handleAddSkill = (
    current: string[],
    onChange: (val: string[]) => void
  ) => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (!current.includes(trimmed)) {
      onChange([...current, trimmed]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (
    current: string[],
    onChange: (val: string[]) => void,
    skillToRemove: string
  ) => {
    onChange(current.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.015em] text-foreground">
          Descripción y requisitos
        </h2>
        <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
          Explica las funciones y el perfil que necesitas.
        </p>
      </div>

      {/* Descripción de la vacante */}
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <Field
            data-invalid={Boolean(fieldState.error)}
            className="gap-[6px]"
          >
            <label
              htmlFor="vacancy-description"
              className="text-[14px] font-medium leading-[20px] text-foreground"
            >
              Descripción de la vacante
            </label>
            <textarea
              id="vacancy-description"
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Describe las actividades principales, responsabilidades y ambiente de trabajo..."
              rows={4}
              className="w-full min-h-[112px] rounded-[8px] border border-input bg-card px-[12px] py-[10px] text-[14px] leading-[20px] text-foreground placeholder:text-muted-foreground outline-none focus:border-link transition-colors resize-y"
            />
            <span className="text-[12px] leading-[16px] text-muted-foreground">
              Incluye las funciones principales del puesto.
            </span>
            {fieldState.error?.message && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        )}
      />

      {/* Experiencia requerida y Nivel de estudios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
        <Controller
          control={form.control}
          name="experience_required"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Experiencia requerida
              </span>
              <Select
                value={field.value || "Sin experiencia previa"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Selecciona experiencia" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <SelectItem
                      key={lvl}
                      value={lvl}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                    >
                      {lvl}
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
          name="education_level"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Nivel de estudios
              </span>
              <Select
                value={field.value || "Indistinto"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Selecciona nivel de estudios" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  {EDUCATION_LEVELS.map((edu) => (
                    <SelectItem
                      key={edu}
                      value={edu}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                    >
                      {edu}
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

      {/* Habilidades (opcional) */}
      <Controller
        control={form.control}
        name="skills"
        render={({ field }) => {
          const currentSkills: string[] = Array.isArray(field.value)
            ? field.value
            : [];

          return (
            <div className="flex flex-col gap-[8px]">
              <label
                htmlFor="vacancy-skills-input"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Habilidades (opcional)
              </label>
              <Input
                id="vacancy-skills-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill(currentSkills, field.onChange);
                  }
                }}
                placeholder="Escribe una habilidad y presiona Enter"
                className="h-[44px] rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal"
              />
              {currentSkills.length > 0 && (
                <div className="flex flex-wrap gap-[8px] pt-[2px]">
                  {currentSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-[6px] h-[30px] px-[10px] rounded-[8px] bg-muted text-foreground text-[13px] font-normal"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveSkill(
                            currentSkills,
                            field.onChange,
                            skill
                          )
                        }
                        aria-label={`Quitar ${skill}`}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="size-[12px]" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
