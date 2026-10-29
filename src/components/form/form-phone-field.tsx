"use client";

import React from "react";
import { Phone } from "@/components/ui/icons";
import { normalizePhone, formatPhoneDisplay } from "@/lib/formatters";

export interface FormPhoneFieldProps {
  id?: string;
  label?: string;
  value?: string | null;
  onChange: (normalizedValue: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export function FormPhoneField({
  id = "phone",
  label = "Teléfono Celular / WhatsApp",
  value = "",
  onChange,
  error,
  required = false,
  className = "",
  placeholder = "(999) 123-4567",
  helperText = "10 dígitos con lada de tu ciudad",
  disabled = false,
}: FormPhoneFieldProps) {
  // Extract national 10 digits (stripping any leading +52 or 52 country code)
  const nationalDigits = React.useMemo(() => {
    if (!value) return "";
    const clean = value.replace(/[^0-9]/g, "");
    if (clean.startsWith("52") && clean.length >= 12) {
      return clean.slice(2, 12);
    }
    return clean.slice(0, 10);
  }, [value]);

  // Compute visual formatted national display: (999) 123-4567
  const displayValue = React.useMemo(() => {
    if (!nationalDigits) return "";
    if (nationalDigits.length <= 3) return nationalDigits;
    if (nationalDigits.length <= 6) {
      return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3)}`;
    }
    return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6, 10)}`;
  }, [nationalDigits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 10);
    // When 10 digits are reached, notify parent with normalized E.164 +52XXXXXXXXXX format
    if (digits.length === 10) {
      onChange(`+52${digits}`);
    } else {
      onChange(digits);
    }
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
          {required && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
              Requerido
            </span>
          )}
        </div>

        <div className="relative flex items-center mt-1">
          <div className="flex items-center gap-1.5 mr-2.5 shrink-0 text-muted-foreground font-bold text-xs sm:text-sm select-none border-r border-border pr-2.5">
            <span className="text-base">🇲🇽</span>
            <span>+52</span>
          </div>
          <input
            id={id}
            type="tel"
            disabled={disabled}
            placeholder={placeholder}
            maxLength={16}
            value={displayValue}
            onChange={handleChange}
            className="w-full bg-transparent border-none outline-none p-0 text-sm sm:text-base font-semibold text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
          />
          <Phone className="w-4 h-4 ml-2 text-muted-foreground shrink-0" />
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
