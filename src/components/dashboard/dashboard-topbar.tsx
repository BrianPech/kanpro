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
  Search,
  Plus,
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
import { NotificationBell } from "@/modules/notifications/components/notification-bell";

type DashboardTopbarProps = {
  userName: string;
  userInitials: string;
  plan: string;
  role: "company" | "candidate" | "admin";
};

export function DashboardTopbar({
  userName,
  userInitials,
  plan,
  role,
}: DashboardTopbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadUser();
  }, [supabase]);

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
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-fiord-100/40 bg-background/90 px-6 backdrop-blur-md md:px-10">
      
      {/* Left side: Role-based Greeting or sidebar trigger */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 text-fiord-500 hover:text-fiord-900 dark:hover:text-fiord-50" />
        
        {role === "company" ? (
          <div className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
            <h1 className="text-base md:text-lg font-bold text-fiord-900 dark:text-fiord-50 leading-tight">
              Hola, {userName} 👋
            </h1>
            <p className="text-[11px] text-fiord-400 dark:text-fiord-500 font-medium hidden sm:block">
              Aquí está el resumen de tus vacantes hoy
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <h1 className="text-base md:text-lg font-bold text-fiord-900 dark:text-fiord-50 leading-tight">
              Panel K&apos;anPro
            </h1>
          </div>
        )}
      </div>
 
      {/* Right side: Global Search, Nueva Vacante action, Notifications & Avatar */}
      <div className="flex items-center gap-4">
        
        {role === "company" && (
          <>
            {/* Global Search Bar */}
            <div className="relative hidden lg:block w-56 xl:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fiord-400 dark:text-fiord-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar candidatos..."
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-fiord-100 dark:border-fiord-800/80 bg-fiord-50/30 dark:bg-fiord-900/30 text-[13px] outline-none text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus:border-fiord-300 dark:focus:border-fiord-700 focus:ring-1 focus:ring-fiord-300/35 transition-all"
              />
            </div>
 
            {/* CTA + Nueva Vacante Button */}
            <Link href="/dashboard/company/vacancies/new" className="shrink-0">
              <Button className="bg-fiord-950 dark:bg-fiord-50 hover:bg-fiord-900 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 font-semibold px-3 sm:px-4 py-2 text-xs rounded-xl h-9 flex items-center gap-2 border-none transition-all active:scale-[0.98] shadow-sm">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nueva Vacante</span>
              </Button>
            </Link>
          </>
        )}
 
        {/* Notifications & Avatar */}
        <div className="flex items-center gap-2">
          {userId ? (
            <NotificationBell userId={userId} />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl text-fiord-550 dark:text-fiord-400 hover:bg-fiord-100 dark:hover:bg-fiord-900"
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}
 
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto rounded-2xl px-2 py-1.5 text-left hover:bg-fiord-50/50 dark:hover:bg-fiord-900/40 flex items-center gap-1.5"
              >
                <div className="hidden text-right md:flex md:flex-col md:items-end md:gap-0.5">
                  <span className="text-[13px] font-bold leading-tight tracking-tight text-fiord-900 dark:text-fiord-50">
                    {userName}
                  </span>
                  <span className="text-[10px] leading-tight text-fiord-400 dark:text-fiord-500 font-semibold uppercase tracking-wider">
                    {plan}
                  </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-fiord-950 dark:bg-fiord-50 text-[12px] font-bold text-white dark:text-fiord-950 shadow-sm shrink-0">
                  {userInitials}
                </div>
                <ChevronDown className="size-3.5 text-fiord-400 dark:text-fiord-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-60 rounded-2xl border-fiord-100 dark:border-fiord-800"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="grid gap-0.5">
                  <span className="text-sm font-semibold text-fiord-900 dark:text-fiord-100">
                    {userName}
                  </span>
                  <span className="text-xs text-fiord-400 dark:text-fiord-500">{plan}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-fiord-100/50 dark:bg-fiord-800/50" />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link href={profileHref}>
                    <User className="size-4 mr-2" />
                    <span>Mi perfil</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-fiord-100/50 dark:bg-fiord-800/50" />
              <DropdownMenuItem variant="destructive" onClick={handleLogout} className="rounded-lg">
                <LogOut className="size-4 mr-2" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
