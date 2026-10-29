"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileCheck2,
  ChevronRight,
  X,
  CreditCard,
  ShieldCheck,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OperationalAlert } from "../../types/dashboard";
import { cn } from "@/lib/utils";

interface OperationalAlertsBannerProps {
  alerts: OperationalAlert[];
}

export function OperationalAlertsBanner({ alerts }: OperationalAlertsBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const activeAlerts = alerts.filter(
    (alert) => !dismissedAlerts.includes(alert.id)
  );

  if (activeAlerts.length === 0) return null;

  const getAlertIcon = (type: OperationalAlert["type"]) => {
    switch (type) {
      case "contract":
        return <FileCheck2 className="size-5" />;
      case "attendance":
        return <Clock className="size-5" />;
      case "payroll":
        return <CreditCard className="size-5" />;
      case "legal":
        return <ShieldCheck className="size-5" />;
      default:
        return <AlertTriangle className="size-5" />;
    }
  };

  const getAlertStyles = (severity: OperationalAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          container: "bg-destructive/5 border-destructive/30",
          iconBox: "bg-destructive/15 text-destructive",
          btnVariant: "destructive" as const,
        };
      case "warning":
        return {
          container: "bg-amber-500/5 border-amber-500/30",
          iconBox: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
          btnVariant: "default" as const,
        };
      case "info":
        return {
          container: "bg-primary/5 border-primary/25",
          iconBox: "bg-primary/15 text-primary",
          btnVariant: "default" as const,
        };
      default:
        return {
          container: "bg-card border-border",
          iconBox: "bg-muted text-muted-foreground",
          btnVariant: "outline" as const,
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
              "p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
              styles.container
            )}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className={cn(
                  "p-2.5 rounded-2xl flex items-center justify-center shrink-0 mt-0.5",
                  styles.iconBox
                )}
              >
                {getAlertIcon(alert.type)}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {alert.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2 py-0.5 rounded-3xl uppercase tracking-wider"
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
                  variant={styles.btnVariant}
                  render={<Link href={alert.actionUrl} />}
                >
                  <span>{alert.actionLabel || "Atender"}</span>
                  <ChevronRight data-icon="inline-end" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setDismissedAlerts((prev) => [...prev, alert.id])
                }
                className="text-muted-foreground hover:text-foreground"
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
