"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Briefcase,
  Calendar,
  CreditCard,
  ShieldAlert,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { OperationalAlert } from "../../types/dashboard";

interface OperationalAlertsBannerProps {
  alerts: OperationalAlert[];
}

export function OperationalAlertsBanner({ alerts }: OperationalAlertsBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const activeAlerts = alerts.filter((a) => !dismissedAlerts.includes(a.id));

  if (activeAlerts.length === 0) return null;

  const getAlertIcon = (type: OperationalAlert["type"]) => {
    switch (type) {
      case "contract":
        return <Clock className="size-4.5 shrink-0" />;
      case "incident":
        return <ShieldAlert className="size-4.5 shrink-0" />;
      case "vacancy":
        return <Briefcase className="size-4.5 shrink-0" />;
      case "payroll":
        return <CreditCard className="size-4.5 shrink-0" />;
      case "attendance":
        return <Calendar className="size-4.5 shrink-0" />;
      default:
        return <AlertTriangle className="size-4.5 shrink-0" />;
    }
  };

  const getAlertStyles = (severity: OperationalAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          container: "bg-destructive/10 border-destructive/30 text-destructive-foreground",
          iconBox: "bg-destructive/15 text-destructive",
          badge: "bg-destructive text-destructive-foreground",
          btn: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        };
      case "warning":
        return {
          container: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200",
          iconBox: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          badge: "bg-amber-500 text-white",
          btn: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "info":
        return {
          container: "bg-primary/10 border-primary/25 text-foreground",
          iconBox: "bg-primary/15 text-primary",
          badge: "bg-primary text-primary-foreground",
          btn: "bg-primary text-primary-foreground hover:bg-primary/90",
        };
      default:
        return {
          container: "bg-muted/50 border-border text-foreground",
          iconBox: "bg-muted text-muted-foreground",
          badge: "bg-muted text-muted-foreground",
          btn: "bg-primary text-primary-foreground",
        };
    }
  };

  return (
    <div className="space-y-3">
      {activeAlerts.map((alert) => {
        const styles = getAlertStyles(alert.severity);

        return (
          <Card
            key={alert.id}
            className={cn(
              "rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4",
              styles.container
            )}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className={cn(
                  "p-2.5 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  styles.iconBox
                )}
              >
                {getAlertIcon(alert.type)}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-foreground truncate">
                    {alert.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border-transparent uppercase tracking-wider"
                  >
                    {alert.timestamp}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {alert.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {alert.actionUrl && (
                <Button
                  size="sm"
                  render={<Link href={alert.actionUrl} />}
                  className={cn(
                    "rounded-xl h-9 px-4 text-xs font-bold shadow-xs flex items-center gap-1.5",
                    styles.btn
                  )}
                >
                  <span>{alert.actionLabel || "Atender"}</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setDismissedAlerts((prev) => [...prev, alert.id])
                }
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Cerrar alerta"
              >
                <X className="size-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
