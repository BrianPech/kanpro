"use client";

import React from "react";
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
  max = new Date().toISOString().split("T")[0],
  helperText = "Selecciona o escribe tu fecha (formato estándar)",
}: FormDateFieldProps) {
  // Ensure the value is in ISO format YYYY-MM-DD for the native date input
  const normalizedISO = normalizeDateToISO(value) || "";

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const iso = normalizeDateToISO(rawVal) || rawVal;
    onChange(iso);
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div
        className={`bg-[#f8fafc] dark:bg-zinc-900/90 rounded-[16px] px-4.5 py-3 border transition-all duration-200 shadow-2xs ${
          error
            ? "border-rose-400 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10"
            : "border-[#ebeef3] dark:border-zinc-800/80 focus-within:border-primary/50 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-primary/10"
        }`}
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-[12px] font-bold text-[#3e546d] dark:text-zinc-300 tracking-[-0.1px] select-none"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {required && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              Obligatorio
            </span>
          )}
        </div>

        <div className="relative flex items-center mt-1">
          <Calendar className="w-5 h-5 mr-2.5 text-[#5c7c9b] dark:text-zinc-400 shrink-0" />
          <input
            id={id}
            type="date"
            min={min}
            max={max}
            value={normalizedISO}
            onChange={handleNativeChange}
            className="w-full bg-transparent border-none outline-none p-0 text-[15px] sm:text-[16px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] dark:placeholder:text-zinc-600 focus:ring-0 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {helperText && !error && (
        <span className="text-[11px] text-[#5c7c9b] dark:text-zinc-400 font-medium px-1">
          {helperText}
        </span>
      )}

      {error && (
        <span className="text-[12px] font-semibold text-rose-500 px-1 animate-in fade-in duration-200">
          {error}
        </span>
      )}
    </div>
  );
}
