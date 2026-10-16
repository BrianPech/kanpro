"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { normalizeDateToISO } from "@/lib/formatters";

export interface FormDateFieldProps {
  id?: string;
  label: string;
  value?: string | null;
  onChange: (isoValue: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
  helperText?: string;
}

export function FormDateField({
  id = "birthDate",
  label = "Fecha de Nacimiento",
  value = "",
  onChange,
  error,
  required = false,
  className = "",
  min = "1940-01-01",
  max,
  helperText = "Escribe tu fecha (DD/MM/AAAA) o elígela en el calendario",
}: FormDateFieldProps) {
  // Convert ISO (YYYY-MM-DD) or other format to Display (DD/MM/AAAA)
  const toDisplayFormat = (val?: string | null): string => {
    if (!val) return "";
    const clean = val.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
    const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    return clean;
  };

  const [displayValue, setDisplayValue] = useState<string>(() => toDisplayFormat(value));
  const pickerRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with external value changes
  useEffect(() => {
    setDisplayValue(toDisplayFormat(value));
  }, [value]);

  // Default max date: 15 years ago (LFT legal minimum working age)
  const resolvedMax = React.useMemo(() => {
    if (max) return max;
    const d = new Date();
    d.setFullYear(d.getFullYear() - 15);
    return d.toISOString().split("T")[0];
  }, [max]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Strip non-digits
    const digits = raw.replace(/\D/g, "").slice(0, 8);

    let formatted = digits;
    if (digits.length >= 5) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    } else if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }

    setDisplayValue(formatted);

    if (digits.length === 8) {
      const day = digits.slice(0, 2);
      const month = digits.slice(2, 4);
      const year = digits.slice(4, 8);
      const iso = `${year}-${month}-${day}`;
      onChange(iso);
    } else if (digits.length === 0) {
      onChange("");
    }
  };

  const handleBlur = () => {
    if (displayValue) {
      const iso = normalizeDateToISO(displayValue);
      if (iso) {
        onChange(iso);
      } else {
        onChange(displayValue);
      }
    }
  };

  const handleOpenPicker = () => {
    if (pickerRef.current) {
      try {
        if ("showPicker" in pickerRef.current && typeof pickerRef.current.showPicker === "function") {
          pickerRef.current.showPicker();
        } else {
          pickerRef.current.focus();
        }
      } catch {
        pickerRef.current.focus();
      }
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value; // YYYY-MM-DD
    if (iso) {
      setDisplayValue(toDisplayFormat(iso));
      onChange(iso);
    }
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div
        onClick={() => textInputRef.current?.focus()}
        className={`bg-muted/40 hover:bg-muted/60 dark:bg-zinc-900/60 rounded-xl px-4 py-2.5 border transition-all duration-200 shadow-2xs cursor-text ${
          error
            ? "border-destructive/80 bg-destructive/5 dark:bg-destructive/10 ring-2 ring-destructive/10"
            : "border-border/80 focus-within:border-primary/60 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/15"
        }`}
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs font-bold text-foreground/90 tracking-tight select-none cursor-pointer"
          >
            {label} {required && <span className="text-destructive">*</span>}
          </label>
          {required && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
              Obligatorio
            </span>
          )}
        </div>

        <div className="relative flex items-center mt-1">
          <Calendar className="w-4 h-4 mr-2.5 text-muted-foreground shrink-0 pointer-events-none" />
          <input
            ref={textInputRef}
            id={id}
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            value={displayValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            maxLength={10}
            className="w-full bg-transparent border-none outline-none p-0 text-sm sm:text-base font-semibold text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
          />

          {/* Clickable Calendar Picker Button with Native Popover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPicker();
            }}
            title="Abrir calendario"
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-1"
            aria-label="Abrir calendario"
          >
            <Calendar className="size-4" />
          </button>

          {/* Hidden Native Date Input for Browser Popover */}
          <input
            ref={pickerRef}
            type="date"
            min={min}
            max={resolvedMax}
            value={normalizeDateToISO(value) || ""}
            onChange={handlePickerChange}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
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
