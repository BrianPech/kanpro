"use client";

import React from "react";
import { CreditCard } from "@/components/ui/icons";
import { normalizeCurp } from "@/lib/formatters";

export interface FormCurpFieldProps {
  id?: string;
  label?: string;
  value?: string | null;
  onChange: (curpValue: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export function FormCurpField({
  id = "curp",
  label = "CURP (18 Caracteres)",
  value = "",
  onChange,
  error,
  required = false,
  className = "",
  placeholder = "EJ. HESA950412HDFRR090",
  helperText = "Clave Única de Registro de Población",
  disabled = false,
}: FormCurpFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = normalizeCurp(raw);
    onChange(normalized);
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div
        className={`bg-muted/40 hover:bg-muted/60 dark:bg-zinc-900/60 rounded-xl px-4 py-2.5 border transition-all duration-200 shadow-2xs ${
          error
            ? "border-destructive/80 bg-destructive/5 dark:bg-destructive/10 ring-2 ring-destructive/10"
            : "border-border/80 focus-within:border-primary/60 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/15"
        } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs font-bold text-foreground/90 tracking-tight select-none"
          >
            {label} {required && <span className="text-destructive">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground">
              {(value || "").length}/18
            </span>
            {required && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                Obligatorio
              </span>
            )}
          </div>
        </div>

        <div className="relative flex items-center mt-1">
          <CreditCard className="w-4 h-4 mr-2.5 text-muted-foreground shrink-0" />
          <input
            id={id}
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            maxLength={18}
            value={value || ""}
            onChange={handleChange}
            className="w-full bg-transparent border-none outline-none p-0 text-sm sm:text-base font-bold tracking-wider uppercase text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {helperText && !error && (
        <span className="text-xs text-muted-foreground font-medium px-1">
          {helperText}
        </span>
      )}

      {error && (
        <span className="text-xs font-semibold text-destructive px-1 animate-in fade-in duration-200">
          {error}
        </span>
      )}
    </div>
  );
}
