"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronsUpDownIcon,
  UserIcon,
  SettingsIcon,
  BellIcon,
  LogOutIcon,
  Building2Icon,
  ShieldCheckIcon,
} from "lucide-react";

export interface NavUserData {
  name: string;
  email: string;
  avatar?: string;
  role?: "admin" | "company" | "candidate";
  plan?: string;
}

export function NavUser({
  user: initialUser,
}: {
  user?: NavUserData;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const [userData, setUserData] = React.useState<NavUserData>({
    name: initialUser?.name || "Usuario",
    email: initialUser?.email || "usuario@kanpro.com",
    avatar: initialUser?.avatar || "",
    role: initialUser?.role || "candidate",
    plan: initialUser?.plan || "K'anPro Plan",
  });

  React.useEffect(() => {
    if (initialUser?.name) {
      setUserData(initialUser);
      return;
    }

    const supabase = createClient();

    async function fetchUserData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, email, role")
            .eq("id", authUser.id)
            .maybeSingle();

          const name =
            profile?.full_name ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            "Usuario K'anPro";

          const email = authUser.email || profile?.email || "usuario@kanpro.com";
          const avatar =
            profile?.avatar_url || authUser.user_metadata?.avatar_url || "";
          const role = (profile?.role || (authUser.user_metadata?.role === "company" ? "company" : "candidate")) as NavUserData["role"];

          setUserData({ name, email, avatar, role });
        }
      } catch (err) {
        console.error("Error obteniendo datos del usuario en NavUser:", err);
      }
    }

    fetchUserData();
  }, [initialUser]);

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const getInitials = (name: string) => {
    if (!name) return "KP";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(userData.name);

  const profileHref =
    userData.role === "company"
      ? "/dashboard/company/profile"
      : userData.role === "candidate"
        ? "/dashboard/candidate/profile"
        : "/dashboard/admin";

  const settingsHref =
    userData.role === "company"
      ? "/dashboard/company/settings"
      : userData.role === "candidate"
        ? "/dashboard/candidate/settings"
        : "/dashboard/admin/settings";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold flex items-center gap-1.5 text-foreground">
                {userData.name}
                {userData.role === "admin" && (
                  <ShieldCheckIcon className="size-3.5 text-purple-500 shrink-0" />
                )}
                {userData.role === "company" && (
                  <Building2Icon className="size-3.5 text-amber-500 shrink-0" />
                )}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {userData.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-xl p-1.5"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm">
                  <Avatar className="h-9 w-9 rounded-lg">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-foreground">{userData.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{userData.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1 border-t border-border/10" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push(profileHref)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-2"
              >
                <UserIcon className="size-4 text-primary" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(settingsHref)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-2"
              >
                <SettingsIcon className="size-4 text-muted-foreground" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(settingsHref)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-2"
              >
                <BellIcon className="size-4 text-muted-foreground" />
                <span>Notificaciones</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1 border-t border-border/10" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
            >
              <LogOutIcon className="size-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
