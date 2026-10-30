import React from "react";
import { Info, AlertTriangle, CheckCircle2, Lightbulb } from "@/components/ui/icons";
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
      wrapperClasses: "border-border bg-muted/40 text-foreground",
      iconClasses: "text-primary",
      titleColor: "text-foreground",
      defaultTitle: "Información importante",
    },
    warning: {
      icon: AlertTriangle,
      wrapperClasses: "border-amber-500/30 bg-amber-500/5 text-foreground dark:border-amber-500/40 dark:bg-amber-500/10",
      iconClasses: "text-amber-600 dark:text-amber-400",
      titleColor: "text-foreground font-semibold",
      defaultTitle: "Atención requerida",
    },
    success: {
      icon: CheckCircle2,
      wrapperClasses: "border-emerald-500/30 bg-emerald-500/5 text-foreground dark:border-emerald-500/40 dark:bg-emerald-500/10",
      iconClasses: "text-emerald-600 dark:text-emerald-400",
      titleColor: "text-foreground font-semibold",
      defaultTitle: "Validación exitosa",
    },
    tip: {
      icon: Lightbulb,
      wrapperClasses: "border-primary/25 bg-primary/5 text-foreground",
      iconClasses: "text-primary",
      titleColor: "text-foreground font-semibold",
      defaultTitle: "Recomendación operativa",
    },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <aside
      className={cn(
        "my-6 p-4 sm:p-5 rounded-xl border flex items-start gap-3.5 transition-all text-xs sm:text-sm",
        config.wrapperClasses,
        className
      )}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", config.iconClasses)} />
      <div className="space-y-1 w-full overflow-hidden">
        <span className={cn("font-semibold block text-xs sm:text-sm tracking-tight", config.titleColor)}>
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
      <div className="flex items-center gap-2.5 font-semibold text-foreground text-sm sm:text-base">
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
