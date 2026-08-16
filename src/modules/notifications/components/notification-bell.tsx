"use client";

import * as React from "react";
import {
  Bell,
  Clock,
  MessageSquareText,
  Briefcase,
  Sparkles,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "../hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
  } = useNotifications(userId);

  // Helper to resolve icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application_status":
        return {
          icon: Briefcase,
          colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        };
      case "message":
        return {
          icon: MessageSquareText,
          colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
      case "system":
        return {
          icon: Sparkles,
          colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        };
      default:
        return {
          icon: Bell,
          colorClass: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
        };
    }
  };

  // Helper to format timestamps relative to now
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Ahora";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return "Ayer";
      return `Hace ${diffDays} d`;
    } catch {
      return "Reciente";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted transition-all duration-200 cursor-pointer"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background animate-in zoom-in-50 duration-200">
            {unreadCount}
          </span>
        )}
        <span className="sr-only">Abrir notificaciones</span>
      </DropdownMenuTrigger>
      
      {/* Airy & Liquid Glass styling */}
      <DropdownMenuContent
        className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl border border-border/40 bg-background/90 backdrop-blur-md"
        align="end"
        sideOffset={12}
      >
        {/* Header Block */}
        <div className="border-b border-border/40 px-5 py-4 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[15px] font-bold tracking-tight text-foreground">
                Notificaciones
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount > 0 
                  ? `Tienes ${unreadCount} alertas sin leer` 
                  : "Estás al día con tus notificaciones"
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge className="rounded-full bg-primary text-primary-foreground text-[11px] font-bold px-2.5">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>
        </div>

        {/* Notifications list feed */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {loading ? (
            /* Mini Skeleton Loader while fetching */
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-xl">
                <Skeleton className="size-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5 rounded-md" />
                  <Skeleton className="h-3 w-4/5 rounded-md" />
                </div>
              </div>
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notification) => {
              const { icon: Icon, colorClass } = getNotificationIcon(notification.type);

              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={cn(
                    "group flex items-start gap-3.5 rounded-xl px-3.5 py-3.5 cursor-pointer transition-all duration-200 hover:bg-muted/50 border border-transparent focus:bg-muted/50",
                    !notification.is_read && "bg-muted/30 border-l-primary border-l-2"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                      colorClass
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-sm tracking-tight",
                          !notification.is_read 
                            ? "font-bold text-foreground" 
                            : "font-medium text-muted-foreground/90"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    
                    {/* Airy paragraph text */}
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground/85">
                      {notification.description}
                    </p>
                    
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/70">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTime(notification.created_at)}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : (
            /* Empty State Container */
            <div className="py-10 px-6 text-center flex flex-col items-center justify-center select-none">
              <div className="h-10 w-10 rounded-full bg-muted/50 text-muted-foreground/60 flex items-center justify-center mb-3">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">
                Sin notificaciones nuevas
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-normal">
                Te avisaremos cuando una empresa responda a tus postulaciones.
              </p>
            </div>
          )}
        </div>

        {/* Footer Block */}
        {unreadCount > 0 && (
          <div className="border-t border-border/40 p-2 text-center bg-muted/10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllAsRead();
              }}
              className="w-full text-center rounded-lg px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Marcar todas como leídas
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
