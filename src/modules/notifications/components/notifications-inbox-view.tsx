"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Briefcase,
  MessageSquareText,
  Sparkles,
  Inbox,
  Clock,
  ArrowRight,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/use-notifications";
import type { Notification } from "../services/notification-service";

interface NotificationsInboxViewProps {
  userId: string;
}

export function NotificationsInboxView({ userId }: NotificationsInboxViewProps) {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications(userId);

  const [filter, setFilter] = React.useState<"all" | "unread" | "applications" | "system">("all");

  // Filter logic
  const filteredNotifications = React.useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.is_read);
      case "applications":
        return notifications.filter((n) => n.type === "application_status");
      case "system":
        return notifications.filter((n) => n.type === "system");
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Helper for notification icons and color classes
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "application_status":
        return {
          icon: Briefcase,
          containerClass: "bg-primary/10 text-primary border border-primary/20",
          tag: "Postulación",
        };
      case "message":
        return {
          icon: MessageSquareText,
          containerClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          tag: "Mensaje",
        };
      case "system":
        return {
          icon: Sparkles,
          containerClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          tag: "Sistema",
        };
      default:
        return {
          icon: Bell,
          containerClass: "bg-muted text-muted-foreground border border-border",
          tag: "Aviso",
        };
    }
  };

  // Helper for relative timestamps
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Hace un momento";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return "Ayer";
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return date.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
    } catch {
      return "Reciente";
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto w-full pb-10">
      {/* ── Filter Tabs & Quick Action ── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0",
              filter === "all"
                ? "bg-primary text-primary-foreground font-bold shadow-2xs hover:bg-primary/90"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Todas ({notifications.length})
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilter("unread")}
            className={cn(
              "h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0",
              filter === "unread"
                ? "bg-primary text-primary-foreground font-bold shadow-2xs hover:bg-primary/90"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Sin leer {unreadCount > 0 && `(${unreadCount})`}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilter("applications")}
            className={cn(
              "h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0",
              filter === "applications"
                ? "bg-primary text-primary-foreground font-bold shadow-2xs hover:bg-primary/90"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Postulaciones
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilter("system")}
            className={cn(
              "h-8 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0",
              filter === "system"
                ? "bg-primary text-primary-foreground font-bold shadow-2xs hover:bg-primary/90"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Sistema
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="h-8 px-2.5 rounded-xl text-primary hover:bg-primary/10 text-xs font-bold gap-1 shrink-0 ml-auto cursor-pointer"
          >
            <CheckCheck className="size-3.5" />
            <span className="hidden sm:inline">Marcar todas leídas</span>
            <span className="sm:hidden">Marcar leídas</span>
          </Button>
        )}
      </div>

      {/* ── 3. Notifications Feed ── */}
      <div className="space-y-2.5">
        {loading ? (
          /* Skeleton Loader */
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-card border border-border/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs"
            >
              <Skeleton className="size-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-3.5 w-4/5 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => {
            const config = getNotificationConfig(item.type);
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.is_read) {
                    markAsRead(item.id);
                  }
                }}
                className={cn(
                  "group relative bg-card border rounded-2xl p-4 transition-all duration-150 flex items-start gap-3.5 shadow-2xs cursor-pointer select-none",
                  !item.is_read
                    ? "border-primary/40 bg-primary/2 hover:bg-primary/4 shadow-sm"
                    : "border-border/80 hover:border-border hover:bg-muted/20"
                )}
              >
                {/* Type Icon */}
                <div
                  className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    config.containerClass
                  )}
                >
                  <Icon className="size-5" />
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3
                        className={cn(
                          "text-sm tracking-tight truncate",
                          !item.is_read
                            ? "font-bold text-foreground"
                            : "font-semibold text-foreground/90"
                        )}
                      >
                        {item.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 font-bold border-border/80 text-muted-foreground"
                      >
                        {config.tag}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground/80 font-medium">
                        {formatTime(item.created_at)}
                      </span>
                      {!item.is_read && (
                        <span
                          className="size-2 rounded-full bg-primary shrink-0"
                          title="Sin leer"
                        />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  {/* Context Actions */}
                  {item.type === "application_status" && (
                    <div className="pt-2">
                      <Link
                        href="/dashboard/candidate/applications"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Ver mis postulaciones</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="bg-card border border-border/80 rounded-3xl p-10 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="size-16 rounded-3xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-3">
              <Inbox className="size-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {filter === "unread"
                ? "No tienes notificaciones sin leer"
                : "No hay notificaciones en esta bandeja"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
              {filter === "unread"
                ? "Estás completamente al día con tus avisos y alertas."
                : "Te avisaremos de inmediato cuando las empresas respondan a tus postulaciones o haya avisos de turnos."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
