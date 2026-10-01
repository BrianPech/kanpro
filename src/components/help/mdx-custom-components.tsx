import React from "react";
import { Info, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalloutProps {
  type?: "info" | "warning" | "success" | "tip";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({
  type = "info",
  title,
  children,
  className,
}: CalloutProps) {
  const configs = {
    info: {
      icon: Info,
      wrapperClasses: "bg-primary/5 border-primary/20 text-foreground",
      iconClasses: "text-primary",
      titleColor: "text-primary",
      defaultTitle: "Información importante",
    },
    warning: {
      icon: AlertTriangle,
      wrapperClasses: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200",
      iconClasses: "text-amber-600 dark:text-amber-400",
      titleColor: "text-amber-800 dark:text-amber-300",
      defaultTitle: "Atención requerida",
    },
    success: {
      icon: CheckCircle2,
      wrapperClasses: "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200",
      iconClasses: "text-emerald-600 dark:text-emerald-400",
      titleColor: "text-emerald-800 dark:text-emerald-300",
      defaultTitle: "Validación exitosa",
    },
    tip: {
      icon: Lightbulb,
      wrapperClasses: "bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200",
      iconClasses: "text-purple-600 dark:text-purple-400",
      titleColor: "text-purple-800 dark:text-purple-300",
      defaultTitle: "Recomendación operativa",
    },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <aside
      className={cn(
        "my-6 p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 transition-all text-xs sm:text-sm",
        config.wrapperClasses,
        className
      )}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", config.iconClasses)} />
      <div className="space-y-1 w-full overflow-hidden">
        <span className={cn("font-bold block text-xs sm:text-sm", config.titleColor)}>
          {title || config.defaultTitle}
        </span>
        <div className="text-muted-foreground leading-relaxed [&>p]:mb-0 [&>p]:mt-1">
          {children}
        </div>
      </div>
    </aside>
  );
}

export function StepList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3.5 my-6", className)}>
      {children}
    </div>
  );
}

export function Step({
  number,
  title,
  children,
  className,
}: {
  number: number | string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "p-4 sm:p-5 rounded-xl border border-border bg-card text-card-foreground shadow-2xs space-y-1.5 transition-all",
        className
      )}
    >
      <div className="flex items-center gap-2.5 font-bold text-foreground text-sm sm:text-base">
        <span className="flex size-6 sm:size-7 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold items-center justify-center shrink-0">
          {number}
        </span>
        <span>{title}</span>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground pl-8 sm:pl-9 leading-relaxed [&>p]:mb-0">
        {children}
      </div>
    </div>
  );
}
