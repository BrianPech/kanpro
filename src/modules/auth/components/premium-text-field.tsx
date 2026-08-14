"use client";

import React, { ReactNode } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface PremiumTextFieldProps {
  id?: string;
  label: string;
  hintText: string;
  type?: string;
  registerProps?: UseFormRegisterReturn;
  error?: string;
  suffixIcon?: ReactNode;
  readOnly?: boolean;
  onClick?: () => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  maxLength?: number;
}

export function PremiumTextField({
  id,
  label,
  hintText,
  type = "text",
  registerProps,
  error,
  suffixIcon,
  readOnly = false,
  onClick,
  value,
  onChange,
  className = "",
  maxLength,
}: PremiumTextFieldProps) {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div
        onClick={onClick}
        className={`bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border transition-all duration-200 ${
          error
            ? "border-red-400 dark:border-red-800"
            : "border-transparent focus-within:border-[#5c7c9b]/40 dark:focus-within:border-zinc-700"
        } ${readOnly ? "cursor-pointer" : ""}`}
      >
        <label
          htmlFor={id}
          className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 tracking-[-0.1px] select-none"
        >
          {label}
        </label>
        <div className="relative flex items-center mt-1">
          <input
            id={id}
            type={type}
            readOnly={readOnly}
            placeholder={hintText}
            maxLength={maxLength}
            {...(registerProps || {})}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent border-none outline-none p-0 text-[16px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] dark:placeholder:text-zinc-600 focus:ring-0 focus:outline-none"
          />
          {suffixIcon && (
            <div className="ml-2 flex items-center justify-center shrink-0">
              {suffixIcon}
            </div>
          )}
        </div>
      </div>
      {error && (
        <span className="text-[12px] font-semibold text-rose-500 px-1 animate-in fade-in duration-200">
          {error}
        </span>
      )}
    </div>
  );
}
