"use client";

import React, { ReactNode } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

export interface FormTextFieldProps {
  id?: string;
  label: string;
  hintText?: string;
  type?: string;
  registerProps?: UseFormRegisterReturn;
  error?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  readOnly?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  maxLength?: number;
  required?: boolean;
  helperText?: string;
}

export function FormTextField({
  id,
  label,
  hintText,
  type = "text",
  registerProps,
  error,
  prefixIcon,
  suffixIcon,
  readOnly = false,
  disabled = false,
  onClick,
  value,
  onChange,
  className = "",
  maxLength,
  required = false,
  helperText,
}: FormTextFieldProps) {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div
        onClick={onClick}
        className={`bg-[#f8fafc] dark:bg-zinc-900/90 rounded-[16px] px-4.5 py-3 border transition-all duration-200 shadow-2xs ${
          error
            ? "border-rose-400 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10"
            : "border-[#ebeef3] dark:border-zinc-800/80 focus-within:border-primary/50 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-primary/10"
        } ${readOnly || onClick ? "cursor-pointer" : ""} ${disabled ? "opacity-60 pointer-events-none" : ""}`}
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
              Requerido
            </span>
          )}
        </div>

        <div className="relative flex items-center mt-1">
          {prefixIcon && (
            <div className="mr-2.5 flex items-center justify-center shrink-0 text-[#5c7c9b] dark:text-zinc-400">
              {prefixIcon}
            </div>
          )}
          <input
            id={id}
            type={type}
            readOnly={readOnly}
            disabled={disabled}
            placeholder={hintText}
            maxLength={maxLength}
            {...(registerProps || {})}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent border-none outline-none p-0 text-[15px] sm:text-[16px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] dark:placeholder:text-zinc-600 focus:ring-0 focus:outline-none"
          />
          {suffixIcon && (
            <div className="ml-2 flex items-center justify-center shrink-0 text-[#5c7c9b] dark:text-zinc-400">
              {suffixIcon}
            </div>
          )}
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
