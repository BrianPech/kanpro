"use client";

import React from "react";
import { CreditCard } from "lucide-react";
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
        className={`bg-[#f8fafc] dark:bg-zinc-900/90 rounded-[16px] px-4.5 py-3 border transition-all duration-200 shadow-2xs ${
          error
            ? "border-rose-400 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10"
            : "border-[#ebeef3] dark:border-zinc-800/80 focus-within:border-primary/50 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-primary/10"
        } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-[12px] font-bold text-[#3e546d] dark:text-zinc-300 tracking-[-0.1px] select-none"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[#5c7c9b] dark:text-zinc-400">
              {(value || "").length}/18
            </span>
            {required && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                Obligatorio
              </span>
            )}
          </div>
        </div>

        <div className="relative flex items-center mt-1">
          <CreditCard className="w-5 h-5 mr-2.5 text-[#5c7c9b] dark:text-zinc-400 shrink-0" />
          <input
            id={id}
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            maxLength={18}
            value={value || ""}
            onChange={handleChange}
            className="w-full bg-transparent border-none outline-none p-0 text-[15px] sm:text-[16px] font-bold tracking-wider uppercase text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] dark:placeholder:text-zinc-600 focus:ring-0 focus:outline-none"
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
