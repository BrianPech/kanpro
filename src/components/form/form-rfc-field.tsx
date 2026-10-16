"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { normalizeRfc } from "@/lib/formatters";

export interface FormRfcFieldProps {
  id?: string;
  label?: string;
  value?: string | null;
  onChange: (rfcValue: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export function FormRfcField({
  id = "rfc",
  label = "RFC Fiscal",
  value = "",
  onChange,
  error,
  required = false,
  className = "",
  placeholder = "XAXX010101000",
  helperText = "12 caracteres para personas morales o 13 para físicas",
  disabled = false,
}: FormRfcFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = normalizeRfc(raw);
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
              {(value || "").length}/13
            </span>
            {required && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                Requerido
              </span>
            )}
          </div>
        </div>

        <div className="relative flex items-center mt-1">
          <Building2 className="w-4 h-4 mr-2.5 text-muted-foreground shrink-0" />
          <input
            id={id}
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            maxLength={13}
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
