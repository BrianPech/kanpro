"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  ChevronDown,
  Clock3,
  LogOut,
  MessageSquareText,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardTopbarProps = {
  userName: string;
  userInitials: string;
  plan: string;
  role: "company" | "candidate" | "admin";
};

const notifications = [
  {
    title: "Nueva candidatura recibida",
    description: "María López aplicó a Analista Senior hace 5 min.",
    time: "5 min",
    icon: Briefcase,
    unread: true,
  },
  {
    title: "2 mensajes pendientes",
    description: "El equipo de soporte respondió en tu bandeja.",
    time: "12 min",
    icon: MessageSquareText,
    unread: true,
  },
  {
    title: "Actividad de equipo",
    description: "Carlos actualizó el perfil de la empresa.",
    time: "1 h",
    icon: Users,
    unread: false,
  },
];

export function DashboardTopbar({
  userName,
  userInitials,
  plan,
  role,
}: DashboardTopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const profileHref =
    role === "company"
      ? "/dashboard/company/profile"
      : role === "candidate"
        ? "/dashboard/candidate"
        : "/dashboard/admin";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      return;
    }

    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-4 bg-background/80 px-6 backdrop-blur-md md:px-10">
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              <span className="sr-only">Abrir notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[min(24rem,calc(100vw-2rem))] rounded-[28px] p-0"
            align="end"
            sideOffset={12}
          >
            <div className="border-b border-border/60 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-foreground">
                    Notificaciones
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tienes 2 notificaciones sin leer
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-2.5">
                  2 nuevas
                </Badge>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {notifications.map((notification) => {
                const Icon = notification.icon;

                return (
                  <DropdownMenuItem
                    key={notification.title}
                    className="group flex items-start gap-3 rounded-[22px] px-3 py-3"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${notification.unread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {notification.description}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>

            <div className="border-t border-border/60 p-2">
              <DropdownMenuItem className="justify-center rounded-[20px] px-4 py-3 text-sm font-medium text-foreground">
                Marcar todo como leído
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto rounded-2xl px-3 py-2 text-left hover:bg-muted/70"
            >
              <div className="hidden text-right md:flex md:flex-col md:items-end md:gap-0.5">
                <span className="text-[14px] font-semibold leading-tight tracking-tight text-foreground">
                  {userName}
                </span>
                <span className="text-[12px] leading-tight text-muted-foreground">
                  {plan}
                </span>
              </div>
              <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-foreground to-muted-foreground text-[14px] font-bold text-background shadow-sm">
                {userInitials}
              </div>
              <ChevronDown className="ml-1 size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-64 rounded-3xl"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-3 py-2">
              <div className="grid gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground">{plan}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <User />
                  <span>Mi perfil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
