import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType =
  | "success"     // Contratado, Activo, Aprobado, Pagado, Vigente
  | "warning"     // Pendiente, En revisión, Por vencer, Parcial
  | "info"        // Nuevo, Preseleccionado, Entrevista, En proceso
  | "destructive" // Rechazado, Cancelado, Vencido, Inasistencia
  | "neutral"     // Borrador, Pausado, Finalizado, Histórico
  // Common aliases
  | "activo"
  | "active"
  | "completed"
  | "pausado"
  | "pending"
  | "revision"
  | "inactivo"
  | "inactive";

interface CompanyStatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function CompanyStatusBadge({
  status,
  label,
  className,
  icon: Icon,
}: CompanyStatusBadgeProps) {
  const variantStyles: Record<string, string> = {
    success:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    activo:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    active:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    completed:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    pausado:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    pending:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    revision:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    info: "bg-primary/10 text-primary border-primary/20",
    destructive:
      "bg-destructive/10 text-destructive border-destructive/20",
    neutral: "bg-muted text-muted-foreground border-border",
    inactivo: "bg-muted text-muted-foreground border-border",
    inactive: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-semibold px-2.5 py-0.5 rounded-3xl transition-colors",
        variantStyles[status],
        className
      )}
    >
      {Icon && <Icon className="size-3 mr-1 shrink-0" />}
      {label}
    </Badge>
  );
}
