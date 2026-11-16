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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SettingsIcon,
  BellIcon,
  LogOutIcon,
  Building2Icon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { CompanySettingsModal } from "../company-settings-dialog";

export interface CompanyTopbarUserProps {
  initialName?: string;
  initialInitials?: string;
  className?: string;
  showName?: boolean;
}

export function CompanyTopbarUser({
  initialName,
  initialInitials,
  className,
  showName = false,
}: CompanyTopbarUserProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [settingsSection, setSettingsSection] = React.useState("appearance");

  const [userData, setUserData] = React.useState({
    name: initialName || "Usuario",
    email: "usuario@kanpro.com",
    avatar: "",
    isVerified: false,
    role: "company" as const,
  });

  React.useEffect(() => {
    const supabase = createClient();

    async function fetchUserData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, email")
            .eq("id", authUser.id)
            .maybeSingle();

          let name =
            profile?.full_name ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            initialName ||
            "Usuario K'anPro";

          let avatar =
            profile?.avatar_url || authUser.user_metadata?.avatar_url || "";
          let isVerified = false;

          const { data: companyProfile } = await supabase
            .from("company_profiles")
            .select("company_name, logo_url, verification_status")
            .eq("id", authUser.id)
            .maybeSingle();

          if (companyProfile) {
            if (companyProfile.company_name && !showName) {
              name = companyProfile.company_name;
            }
            if (companyProfile.logo_url && !showName) {
              avatar = companyProfile.logo_url;
            }
            isVerified = companyProfile.verification_status === "approved";
          }

          const email = authUser.email || profile?.email || "usuario@kanpro.com";
          setUserData({ name, email, avatar, isVerified, role: "company" });
        }
      } catch (err) {
        console.error("Error obteniendo datos de usuario para topbar:", err);
      }
    }

    fetchUserData();
  }, [initialName, showName]);

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const getInitials = (name: string) => {
    if (initialInitials) return initialInitials;
    if (!name) return "KP";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(userData.name);

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              showName
                ? "flex items-center gap-2 rounded-[12px] pr-2 hover:bg-background/60 transition-colors cursor-pointer shrink-0 select-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                : "relative size-8 rounded-full ring-1.5 ring-border/80 hover:ring-primary/60 focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none transition-all cursor-pointer shrink-0 select-none overflow-hidden",
              className
            )}
            aria-label="Abrir menú de usuario"
          />
        }
      >
        <Avatar
          className={
            showName
              ? "size-[44px] rounded-[12px] shrink-0 after:hidden"
              : "size-full rounded-full after:hidden"
          }
        >
          <AvatarImage
            src={userData.avatar}
            alt={userData.name}
            className={showName ? "rounded-[12px] object-cover" : "object-cover"}
          />
          <AvatarFallback
            className={
              showName
                ? "rounded-[12px] bg-sidebar-accent text-link font-bold text-[15px]"
                : "bg-primary/10 text-primary font-extrabold text-[11px]"
            }
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {showName && (
          <span className="hidden sm:inline text-[14px] font-medium leading-[19px] text-foreground whitespace-nowrap">
            {userData.name}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[280px] rounded-[16px] p-0 shadow-xl border border-border bg-card overflow-hidden z-50"
      >
        {/* Header: User Summary */}
        <div className="px-[16px] py-[14px] border-b border-border flex items-center gap-[12px] text-left">
          <Avatar className="size-[40px] rounded-[8px] shrink-0 after:hidden">
            <AvatarImage
              src={userData.avatar}
              alt={userData.name}
              className="rounded-[8px] object-cover"
            />
            <AvatarFallback className="rounded-[8px] bg-sidebar-accent text-link font-semibold text-[13px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="truncate font-semibold text-[14px] leading-[20px] text-foreground block">
              {userData.name}
            </span>
            <span className="truncate text-[12px] leading-[16px] text-muted-foreground block font-normal">
              {userData.email}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <DropdownMenuGroup className="p-[8px] flex flex-col gap-[2px]">
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/company/profile")}
            className="h-[40px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer outline-none select-none"
          >
            <Building2Icon className="size-[16px] text-muted-foreground shrink-0" />
            <span className="truncate">Perfil de empresa</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setSettingsSection("appearance");
              setIsSettingsOpen(true);
            }}
            className="h-[40px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer outline-none select-none"
          >
            <SettingsIcon className="size-[16px] text-muted-foreground shrink-0" />
            <span className="truncate">Configuración</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setSettingsSection("notifications");
              setIsSettingsOpen(true);
            }}
            className="h-[40px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer outline-none select-none"
          >
            <BellIcon className="size-[16px] text-muted-foreground shrink-0" />
            <span className="truncate">Preferencias de notificaciones</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Logout */}
        <div className="border-t border-border p-[8px]">
          <DropdownMenuItem
            onClick={handleLogout}
            className="h-[40px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] font-medium leading-[20px] text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer outline-none select-none"
          >
            <LogOutIcon className="size-[16px] shrink-0" />
            <span className="truncate">Cerrar sesión</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    <CompanySettingsModal
      open={isSettingsOpen}
      onOpenChange={setIsSettingsOpen}
      defaultSection={settingsSection}
    />
  </>
  );
}
