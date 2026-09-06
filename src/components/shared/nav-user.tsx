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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
} from "lucide-react";

export interface NavUserData {
  name: string;
  email: string;
  avatar?: string;
  role?: "admin" | "company" | "candidate";
  plan?: string;
  isVerified?: boolean;
}

export function NavUser({
  user: initialUser,
}: {
  user?: NavUserData;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const router = useRouter();

  const [userData, setUserData] = React.useState<NavUserData>({
    name: initialUser?.name || "Usuario",
    email: initialUser?.email || "usuario@kanpro.com",
    avatar: initialUser?.avatar || "",
    role: initialUser?.role || "candidate",
    plan: initialUser?.plan || "K'anPro Plan",
    isVerified: initialUser?.isVerified || false,
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

          const role = (profile?.role || (authUser.user_metadata?.role === "company" ? "company" : "candidate")) as NavUserData["role"];
          let name =
            profile?.full_name ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            "Usuario K'anPro";

          let avatar =
            profile?.avatar_url || authUser.user_metadata?.avatar_url || "";
          let isVerified = false;

          if (role === "company") {
            const { data: companyProfile } = await supabase
              .from("company_profiles")
              .select("company_name, logo_url, verification_status")
              .eq("id", authUser.id)
              .maybeSingle();

            if (companyProfile) {
              if (companyProfile.company_name) name = companyProfile.company_name;
              if (companyProfile.logo_url) avatar = companyProfile.logo_url;
              isVerified = companyProfile.verification_status === "approved";
            }
          }

          const email = authUser.email || profile?.email || "usuario@kanpro.com";
          setUserData({ name, email, avatar, role, isVerified });
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
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-xl transition-all"
              />
            }
          >
            <Avatar className="size-8 rounded-lg ring-1 ring-border/50">
              <AvatarImage src={userData.avatar} alt={userData.name} className="object-cover" />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-bold flex items-center gap-1.5 text-foreground text-xs">
                {userData.name}
                {userData.role === "admin" && (
                  <ShieldCheckIcon className="size-3.5 text-purple-500 shrink-0" />
                )}
                {userData.role === "company" && (
                  <Building2Icon className="size-3.5 text-amber-500 shrink-0" />
                )}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {userData.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground/70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 rounded-2xl p-2 shadow-2xl border border-border/50 bg-popover/95 backdrop-blur-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={10}
          >
            {/* 1. Header Card: Mini Dossier del Usuario */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-left">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 rounded-xl ring-2 ring-primary/25 border border-border/50 shadow-2xs shrink-0">
                  <AvatarImage src={userData.avatar} alt={userData.name} className="object-cover" />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-black text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="truncate font-extrabold text-xs text-foreground block">
                    {userData.name}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground block font-medium mt-0.5">
                    {userData.email}
                  </span>
                </div>
              </div>

              {/* Sub-barra de Rol / Estado */}
              <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center justify-between gap-1 text-[10px]">
                {userData.role === "company" ? (
                  <>
                    <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-2 py-0.5 rounded-md gap-1">
                      <Building2Icon className="size-3" />
                      <span>Empresa</span>
                    </Badge>
                    {userData.isVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheckIcon className="size-3" />
                        <span>Verificada</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-semibold">
                        Portal Reclutador
                      </span>
                    )}
                  </>
                ) : userData.role === "admin" ? (
                  <>
                    <Badge variant="outline" className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 px-2 py-0.5 rounded-md gap-1">
                      <ShieldCheckIcon className="size-3" />
                      <span>Administrador</span>
                    </Badge>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      Acceso Total
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded-md gap-1">
                      <UserIcon className="size-3" />
                      <span>Candidato</span>
                    </Badge>
                    <span className="text-muted-foreground font-semibold">
                      K&apos;anPro Talento
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 2. Menu Navigation Items */}
            <DropdownMenuGroup className="space-y-0.5 my-1">
              <DropdownMenuItem
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                  router.push(profileHref);
                }}
                className="group rounded-xl p-2 text-left cursor-pointer transition-all duration-150 hover:bg-muted/50 focus:bg-muted/50 outline-none select-none"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                    <UserIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">Mi Perfil</span>
                    <span className="text-[10px] text-muted-foreground block truncate font-medium">Ver y editar información pública</span>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                  router.push(settingsHref);
                }}
                className="group rounded-xl p-2 text-left cursor-pointer transition-all duration-150 hover:bg-muted/50 focus:bg-muted/50 outline-none select-none"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors shadow-2xs">
                    <SettingsIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">Configuración</span>
                    <span className="text-[10px] text-muted-foreground block truncate font-medium">Preferencias, privacidad y cuenta</span>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                  if (userData.role === "company") {
                    router.push("/dashboard/company/settings?tab=notifications");
                  } else if (userData.role === "candidate") {
                    router.push("/dashboard/candidate/settings?tab=notifications");
                  } else {
                    router.push("/dashboard/admin/settings");
                  }
                }}
                className="group rounded-xl p-2 text-left cursor-pointer transition-all duration-150 hover:bg-muted/50 focus:bg-muted/50 outline-none select-none"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                    <BellIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">Notificaciones</span>
                    <span className="text-[10px] text-muted-foreground block truncate font-medium">Avisos de postulaciones y alertas</span>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1 border-t border-border/40" />

            {/* 3. Logout Item */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="group rounded-xl p-2 text-left cursor-pointer transition-all duration-150 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-600 outline-none select-none"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-2xs">
                  <LogOutIcon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block truncate">Cerrar Sesión</span>
                  <span className="text-[10px] text-rose-500/70 block truncate font-medium">Finalizar sesión en este equipo</span>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
