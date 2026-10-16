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
        className={`bg-muted/40 hover:bg-muted/60 dark:bg-zinc-900/60 rounded-xl px-4 py-2.5 border transition-all duration-200 shadow-2xs ${
          error
            ? "border-destructive/80 bg-destructive/5 dark:bg-destructive/10 ring-2 ring-destructive/10"
            : "border-border/80 focus-within:border-primary/60 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/15"
        } ${readOnly || onClick ? "cursor-pointer" : ""} ${disabled ? "opacity-60 pointer-events-none" : ""}`}
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
          {prefixIcon && (
            <div className="mr-2.5 flex items-center justify-center shrink-0 text-muted-foreground">
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
            className="w-full bg-transparent border-none outline-none p-0 text-sm sm:text-base font-semibold text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
          />
          {suffixIcon && (
            <div className="ml-2 flex items-center justify-center shrink-0 text-muted-foreground">
              {suffixIcon}
            </div>
          )}
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
