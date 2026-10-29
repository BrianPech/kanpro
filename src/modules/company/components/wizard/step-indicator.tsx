"use client";

import * as React from "react";
import { Check, Briefcase, MapPin, FileText, Send } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WIZARD_STEPS: StepItem[] = [
  {
    id: 1,
    label: "Puesto",
    sublabel: "Rol y Jornada",
    icon: Briefcase,
  },
  {
    id: 2,
    label: "Ubicación & Sueldo",
    sublabel: "Zona y Beneficios",
    icon: MapPin,
  },
  {
    id: 3,
    label: "Descripción",
    sublabel: "Detalles y Requisitos",
    icon: FileText,
  },
  {
    id: 4,
    label: "Publicación",
    sublabel: "Contacto y Preview",
    icon: Send,
  },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  maxAccessibleStep?: number;
}

export function StepIndicator({
  currentStep,
  onStepClick,
  maxAccessibleStep = currentStep,
}: StepIndicatorProps) {
  const progressPercent = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Step Numbers & Labels Horizontal Flow */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {WIZARD_STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = step.id <= maxAccessibleStep && onStepClick;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.id)}
              className={cn(
                "p-3 rounded-2xl border text-left flex items-center gap-3 transition-all duration-200 select-none",
                isCurrent
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : isCompleted
                  ? "bg-card hover:bg-muted/60 text-foreground border-border/80 cursor-pointer"
                  : "bg-card/40 text-muted-foreground border-border/40 cursor-not-allowed opacity-60",
                !isCurrent && isClickable && "cursor-pointer"
              )}
            >
              {/* Circle Badge */}
              <div
                className={cn(
                  "size-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-colors",
                  isCurrent
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : isCompleted
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4 stroke-[3]" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>

              {/* Text Meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isCurrent
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    Paso {step.id}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs sm:text-sm font-bold truncate leading-tight mt-0.5",
                    isCurrent ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
