"use client";

import * as React from "react";
import { FileText, Award, GraduationCap, Plus, X, Tag } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Step3DescriptionProps {
  form: any;
}

export function Step3Description({ form }: Step3DescriptionProps) {
  const [skillInput, setSkillInput] = React.useState("");

  const handleAddSkill = (field: any) => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    const current: string[] = field.state.value || [];
    if (!current.includes(trimmed)) {
      field.handleChange([...current, trimmed]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (field: any, skillToRemove: string) => {
    const current: string[] = field.state.value || [];
    field.handleChange(current.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="space-y-6">
      {/* 1. Tiptap Rich Text Editor */}
      <form.Field
        name="description"
        children={(field: any) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Descripción del Puesto & Responsabilidades <span className="text-rose-500">*</span>
                </Label>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                Editor enriquecido (Markdown)
              </span>
            </div>
            <RichTextEditor
              value={field.state.value || ""}
              onChange={(html) => field.handleChange(html)}
              placeholder="Describe detalladamente las tareas diarias, ambiente de trabajo y qué esperas del candidato..."
              minHeight="220px"
            />
            {field.state.meta.errors?.[0] && (
              <p className="text-xs font-semibold text-rose-500">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      {/* 2. Experience & Education Level Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Experience Required */}
        <form.Field
          name="experience_required"
          children={(field: any) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-muted-foreground" />
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Experiencia Laboral Requerida
                </Label>
              </div>
              <Select
                value={field.state.value || "Sin experiencia previa"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                  <SelectValue placeholder="Selecciona la experiencia" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg">
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <SelectItem key={exp} value={exp} className="text-xs font-semibold rounded-lg cursor-pointer">
                      {exp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {/* Education Level */}
        <form.Field
          name="education_level"
          children={(field: any) => (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-muted-foreground" />
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nivel de Estudios Mínimo
                </Label>
              </div>
              <Select
                value={field.state.value || "Indistinto"}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                  <SelectValue placeholder="Selecciona el nivel de estudios" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg">
                  {EDUCATION_LEVELS.map((edu) => (
                    <SelectItem key={edu} value={edu} className="text-xs font-semibold rounded-lg cursor-pointer">
                      {edu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* 3. Skills Tags Input */}
      <form.Field
        name="skills"
        children={(field: any) => {
          const skillsList: string[] = field.state.value || [];

          return (
            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Habilidades & Competencias Clave ({skillsList.length})
                </Label>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Agrega palabras clave sobre las competencias deseadas para mejorar el match con candidatos:
              </p>

              {/* Skills Chips */}
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {skillsList.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="px-3 py-1 rounded-xl font-bold text-xs gap-1.5 bg-card border border-border/60 text-foreground shadow-2xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(field, skill)}
                      className="text-muted-foreground hover:text-rose-500 cursor-pointer ml-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Input for adding new skill */}
              <div className="flex gap-2 pt-1">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill(field);
                    }
                  }}
                  placeholder="Ej. Manejo de caja, Puntualidad, Distintivo H..."
                  className="h-10 rounded-xl bg-card border-border/60 text-xs font-medium"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddSkill(field)}
                  disabled={!skillInput.trim()}
                  className="h-10 px-4 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  <Plus className="size-3.5 mr-1" />
                  <span>Agregar Skill</span>
                </Button>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
