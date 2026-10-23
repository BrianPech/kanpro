"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  MessageSquareText,
  Briefcase,
  Sparkles,
  Check,
  ArrowRight,
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <>
      {/* Mobile Trigger: direct link to inbox */}
      <Button
        variant="ghost"
        size="icon"
        render={<Link href="/dashboard/candidate/inbox" />}
        className="relative h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted transition-all duration-200 cursor-pointer md:hidden"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background animate-in zoom-in-50 duration-200">
            {unreadCount}
          </span>
        )}
        <span className="sr-only">Ir a notificaciones</span>
      </Button>

      {/* Desktop Trigger & Popover Dropdown */}
      <div className="hidden md:block">
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
        className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl border border-border/40 bg-background/95 backdrop-blur-md overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header Block */}
        <div className="border-b border-border/40 px-4 py-3 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-tight text-foreground">
                Notificaciones
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {unreadCount > 0 
                  ? `Tienes ${unreadCount} alertas sin leer` 
                  : "Estás al día con tus notificaciones"
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shadow-2xs">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>
        </div>

        {/* Notifications list feed wrapped with ScrollArea */}
        <ScrollArea className="max-h-[350px] w-full">
          <div className="p-1.5 space-y-1">
            {loading ? (
              /* Mini Skeleton Loader while fetching */
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl">
                  <Skeleton className="size-7.5 rounded-lg shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3 w-1/2 rounded" />
                      <Skeleton className="h-2.5 w-10 rounded" />
                    </div>
                    <Skeleton className="h-2.5 w-4/5 rounded" />
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
                      "group flex items-start gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer transition-all duration-150 border border-transparent focus:bg-muted/50 outline-none select-none",
                      !notification.is_read
                        ? "bg-primary/5 hover:bg-primary/10 border-l-primary border-l-2"
                        : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-7.5 shrink-0 items-center justify-center rounded-lg transition-all mt-0.5",
                        colorClass
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p
                          className={cn(
                            "truncate text-xs tracking-tight",
                            !notification.is_read 
                              ? "font-bold text-foreground" 
                              : "font-medium text-muted-foreground/90"
                          )}
                        >
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span className="text-[10px] text-muted-foreground/70 font-medium whitespace-nowrap">
                            {formatTime(notification.created_at)}
                          </span>
                          {!notification.is_read && (
                            <span className="size-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                      </div>
                      
                      {/* Compact description text */}
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/80 line-clamp-2">
                        {notification.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })
            ) : (
              /* Empty State Container */
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center select-none">
                <div className="size-8 rounded-full bg-muted/50 text-muted-foreground/60 flex items-center justify-center mb-2">
                  <Bell className="size-4" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  Sin notificaciones nuevas
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] leading-normal">
                  Te avisaremos cuando una empresa responda a tus postulaciones.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Block */}
        <div className="border-t border-border/40 p-2 flex items-center justify-between gap-2 bg-muted/10">
          {unreadCount > 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllAsRead();
              }}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="size-3.5" />
              <span>Marcar leídas</span>
            </button>
          ) : (
            <div />
          )}
          <Link
            href="/dashboard/candidate/inbox"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-lg hover:bg-muted/50 flex items-center gap-1 ml-auto"
          >
            <span>Ver bandeja</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</>
  );
}
