"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Clock3,
  LogOut,
  MessageSquareText,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import * as React from "react";

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

type CandidateTopbarProps = {
  userName: string;
  userInitials: string;
  plan: string;
};

// Candidate-specific notifications matching active applications
const candidateNotifications = [
  {
    title: "Invitación a Entrevista",
    description: "Wayne Corp quiere agendar una llamada contigo para Security Architect.",
    time: "Hace 10 min",
    icon: MessageSquareText,
    unread: true,
  },
  {
    title: "CV Seleccionado y Revisado",
    description: "Stark Industries cambió tu estado a 'En Revisión' en Senior Fullstack Engineer.",
    time: "Hace 2 h",
    icon: CheckCircle2,
    unread: true,
  },
  {
    title: "Nueva vacante sugerida con 90% Match",
    description: "Globex publicó 'React Developer (Q3 2026)' que se alinea con tu perfil.",
    time: "Ayer",
    icon: Sparkles,
    unread: false,
  },
];

export function CandidateTopbar({
  userName,
  userInitials,
  plan,
}: CandidateTopbarProps) {
  const router = useRouter();
  const supabase = createClient();

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
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between bg-background/60 backdrop-blur-md px-6 md:px-10 border-b border-border/30 transition-all duration-300">
      
      {/* Left Area: Sidebar Trigger (mostly for mobile/tablet) */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground md:hidden" />
        
        {/* Quick Candidate Job Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          Buscando Empleo Activamente
        </div>
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-4">
        
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#494fdf] ring-2 ring-background animate-pulse" />
              <span className="sr-only">Abrir notificaciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[min(24rem,calc(100vw-2rem))] rounded-[28px] p-0 shadow-lg border border-border/40"
            align="end"
            sideOffset={12}
          >
            <div className="border-b border-border/40 px-5 py-4 bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-bold tracking-tight text-foreground">
                    Alertas de Empleo (IA)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tienes 2 notificaciones sin leer
                  </p>
                </div>
                <Badge className="rounded-full bg-primary hover:bg-primary/95 text-[11px] font-bold px-2.5">
                  2 nuevas
                </Badge>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {candidateNotifications.map((notification, idx) => {
                const Icon = notification.icon;

                return (
                  <DropdownMenuItem
                    key={idx}
                    className="group flex items-start gap-3.5 rounded-[20px] px-3.5 py-3 hover:bg-muted/50 cursor-pointer transition-colors duration-200"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                        notification.unread 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`truncate text-sm ${notification.unread ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/80">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>

            <div className="border-t border-border/40 p-2 text-center bg-muted/10">
              <DropdownMenuItem className="justify-center rounded-[16px] px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                Marcar todas como leídas
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto rounded-full p-1 text-left hover:bg-muted/70 flex items-center gap-2 border border-border/20 shadow-xs"
            >
              <div className="hidden md:flex md:flex-col md:items-end md:gap-0.5 pl-3 pr-1">
                <span className="text-[13px] font-bold leading-none tracking-tight text-foreground">
                  {userName}
                </span>
                <span className="text-[10px] leading-none text-muted-foreground font-semibold mt-1.5">
                  {plan}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-[#4f55f1] text-[13px] font-bold text-white shadow-xs border border-white/10 shrink-0">
                {userInitials}
              </div>
              <ChevronDown className="mr-2 size-3 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60 rounded-[24px] border border-border/40 shadow-md p-1.5"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-3.5 py-2.5">
              <div className="grid gap-1">
                <span className="text-sm font-bold text-foreground leading-none">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {plan}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuItem 
              variant="destructive" 
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 cursor-pointer focus:bg-destructive/10 focus:text-destructive flex items-center gap-2"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
