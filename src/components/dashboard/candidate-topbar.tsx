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
        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300"
          >
            <Bell className="h-5 w-5" />
          </Button>
        )}

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
