"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  Check,
  MessageSquareText,
  Sparkles,
} from "@/components/ui/icons";
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

  const [nowMs, setNowMs] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "application_status":
        return Briefcase;
      case "message":
        return MessageSquareText;
      case "system":
        return Sparkles;
      default:
        return Bell;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = nowMs - date.getTime();
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
        nativeButton={false}
        render={<Link href="/dashboard/candidate/inbox" />}
        className="relative size-[36px] rounded-[8px] text-foreground hover:bg-muted transition-colors cursor-pointer md:hidden"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
            {unreadCount}
          </span>
        )}
        <span className="sr-only">Ir a notificaciones</span>
      </Button>

      {/* Desktop Trigger & Dropdown */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative size-[36px] rounded-[8px] text-foreground hover:bg-muted transition-colors cursor-pointer"
              />
            }
          >
            <Bell className="size-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
                {unreadCount}
              </span>
            )}
            <span className="sr-only">Abrir notificaciones</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[min(360px,calc(100vw-2rem))] rounded-[16px] p-0 shadow-xl border border-border bg-card overflow-hidden"
            align="end"
            sideOffset={8}
          >
            {/* Header */}
            <div className="border-b border-border px-[16px] py-[14px] flex items-start justify-between gap-[12px]">
              <div>
                <p className="text-[16px] font-semibold leading-[22px] text-foreground">
                  Notificaciones
                </p>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground mt-[2px]">
                  {notifications.length === 0
                    ? "Sin actividad"
                    : unreadCount > 0
                    ? `${unreadCount} sin leer`
                    : "Al día"}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="inline-flex items-center gap-[4px] text-[12px] font-medium text-link hover:underline cursor-pointer shrink-0 pt-[2px]"
                >
                  <Check className="size-[14px]" />
                  <span>Marcar todas como leídas</span>
                </button>
              )}
            </div>

            {/* Body */}
            {loading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-[12px] px-[16px] py-[12px]"
                  >
                    <Skeleton className="size-[32px] rounded-[8px] shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <Skeleton className="h-3.5 w-1/2 rounded" />
                      <Skeleton className="h-3 w-4/5 rounded" />
                      <Skeleton className="h-2.5 w-14 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <ScrollArea className="max-h-[340px] w-full">
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);

                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={() =>
                          !notification.is_read && markAsRead(notification.id)
                        }
                        className={cn(
                          "flex items-start gap-[12px] rounded-none px-[16px] py-[12px] cursor-pointer hover:bg-muted/40 focus:bg-muted/40 transition-colors outline-none select-none"
                        )}
                      >
                        <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-sidebar-accent text-link mt-[2px]">
                          <Icon className="size-[16px]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-[8px]">
                            <p className="truncate text-[14px] font-semibold leading-[20px] text-foreground">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="size-[6px] rounded-full bg-primary shrink-0" />
                            )}
                          </div>

                          <p className="mt-[2px] text-[12px] font-normal leading-[18px] text-muted-foreground line-clamp-2">
                            {notification.description}
                          </p>

                          <p className="mt-[4px] text-[12px] font-normal leading-[16px] text-muted-foreground">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-[36px] px-[20px] text-center flex flex-col items-center justify-center gap-[6px] select-none">
                <Bell className="size-[20px] text-muted-foreground mb-[4px]" />
                <p className="text-[14px] font-semibold leading-[20px] text-foreground">
                  Aún no tienes notificaciones
                </p>
                <p className="text-[12px] font-normal leading-[18px] text-muted-foreground max-w-[230px]">
                  Aquí aparecerán avisos sobre tu equipo y tus vacantes.
                </p>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
