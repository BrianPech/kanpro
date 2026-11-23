import * as React from "react";
import { cn } from "@/lib/utils";

interface CompanyPageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function CompanyPageHeader({
  title,
  description,
  badge,
  actions,
  children,
  className,
}: CompanyPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-border/40",
        className
      )}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
