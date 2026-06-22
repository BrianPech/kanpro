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
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-4 bg-background/80 px-6 backdrop-blur-md md:px-10">
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-3">
        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
          </Button>
        )}

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
