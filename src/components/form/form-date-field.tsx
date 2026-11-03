"use client";

import React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

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
  placeholder?: string;
  startYear?: number;
  endYear?: number;
  defaultMonth?: Date;
  displayFormat?: string;
}

export function FormDateField({
  id = "birthDate",
  label = "Fecha de nacimiento",
  value = "",
  onChange,
  error,
  required = false,
  className = "",
  min = "1940-01-01",
  max,
  helperText,
  placeholder = "Selecciona tu fecha de nacimiento",
  startYear = 1940,
  endYear,
  defaultMonth,
  displayFormat = "d 'de' MMMM, yyyy",
}: FormDateFieldProps) {
  // Default max date: 15 years ago (LFT legal minimum working age)
  const resolvedMaxDate = React.useMemo(() => {
    if (max) {
      const parts = max.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      return new Date(max);
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 15);
    return d;
  }, [max]);

  const resolvedMinDate = React.useMemo(() => {
    if (min) {
      const parts = min.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      return new Date(min);
    }
    return new Date(1940, 0, 1);
  }, [min]);

  const resolvedEndYear = React.useMemo(() => {
    if (endYear !== undefined) return endYear;
    return resolvedMaxDate.getFullYear();
  }, [endYear, resolvedMaxDate]);

  const resolvedDefaultMonth = React.useMemo(() => {
    if (defaultMonth) return defaultMonth;
    // Default calendar view to ~20 years ago so candidates land on a logical age month
    const d = new Date();
    d.setFullYear(d.getFullYear() - 20);
    return d;
  }, [defaultMonth]);

  const resolvedMaxIso = React.useMemo(() => {
    const y = resolvedMaxDate.getFullYear();
    const m = String(resolvedMaxDate.getMonth() + 1).padStart(2, "0");
    const d = String(resolvedMaxDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [resolvedMaxDate]);

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <div
        className={cn(
          "bg-muted/40 hover:bg-muted/60 dark:bg-zinc-900/60 rounded-xl px-4 py-2 border transition-all duration-200 shadow-2xs",
          error
            ? "border-destructive/80 bg-destructive/5 dark:bg-destructive/10 ring-2 ring-destructive/10"
            : "border-border/80 focus-within:border-primary/60 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/15"
        )}
      >
        <div className="flex items-center justify-between mb-0.5">
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

        {/* ── Mobile View: Native Date Input (optimizado para táctil, rueda iOS/Android, sin superposiciones) ── */}
        <div className="block sm:hidden relative w-full">
          <input
            id={id}
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={resolvedMaxIso}
            className="w-full h-8 px-0 text-sm font-semibold bg-transparent border-none text-foreground focus:outline-none cursor-pointer"
          />
        </div>

        {/* ── Desktop & Tablet View: Radix Popover DatePicker con dropdowns de mes/año ── */}
        <div className="hidden sm:block w-full">
          <DatePicker
            id={id}
            value={value}
            onChange={(isoStr) => onChange(isoStr)}
            placeholder={placeholder}
            captionLayout="dropdown"
            startYear={startYear}
            endYear={resolvedEndYear}
            minDate={resolvedMinDate}
            maxDate={resolvedMaxDate}
            defaultMonth={resolvedDefaultMonth}
            variant="ghost"
            displayFormat={displayFormat}
            className="w-full h-8 px-0 text-sm font-semibold text-foreground cursor-pointer"
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
