"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut
} from "lucide-react";
import * as React from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";

type CandidateTopbarProps = {
  userName: string;
  userInitials: string;
  plan: string;
};

export function CandidateTopbar({
  userName,
  userInitials,
  plan,
}: CandidateTopbarProps) {
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
    <header className="hidden md:flex sticky top-0 z-40 h-20 shrink-0 items-center justify-between bg-background/80 backdrop-blur-md px-6 md:px-10 border-b border-border/10 transition-all duration-300">
      
      {/* Left Area: Sidebar Trigger (mostly for mobile/tablet) */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 md:hidden" />
        
        {/* Quick Candidate Job Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-border/10 rounded-full text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Buscando empleo
        </div>
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-4">
        
        {/* Notifications Dropdown */}
        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
          </Button>
        )}

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto rounded-full p-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2 border border-border/10 transition-all"
            >
              <div className="hidden md:flex md:flex-col md:items-end pl-2.5 pr-1">
                <span className="text-[12px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {userName}
                </span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
                  {plan}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-[12px] font-bold text-zinc-100 dark:text-zinc-900 border border-border/10 shrink-0">
                {userInitials}
              </div>
              <ChevronDown className="mr-1 size-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-xl border border-border/20 shadow-lg p-1.5"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-3 py-2">
              <div className="grid gap-0.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                  {userName}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {plan}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-t border-border/10" />
            <DropdownMenuItem 
              variant="destructive" 
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 cursor-pointer focus:bg-rose-50/80 dark:focus:bg-rose-950/20 focus:text-rose-600 dark:focus:text-rose-400 flex items-center gap-2 text-xs"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
