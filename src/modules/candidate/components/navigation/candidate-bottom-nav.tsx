"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  File01Icon,
  Home01Icon,
  Search01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { CandidateSearchSheet } from "./candidate-search-sheet";

export interface CandidateBottomNavProps {
  isEmployee?: boolean;
}

export function CandidateBottomNav({
  isEmployee = false,
}: CandidateBottomNavProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const isHomeActive = pathname === "/dashboard/candidate";
  const isApplicationsActive = pathname.startsWith(
    "/dashboard/candidate/applications"
  );
  const isWorkActive =
    pathname.startsWith("/dashboard/candidate/contracts") ||
    pathname.startsWith("/dashboard/candidate/leaves") ||
    pathname.startsWith("/dashboard/candidate/incidents");
  const isProfileActive =
    pathname.startsWith("/dashboard/candidate/profile") ||
    pathname.startsWith("/dashboard/candidate/documents") ||
    pathname.startsWith("/dashboard/candidate/settings");

  const workHref = isEmployee
    ? "/dashboard/candidate/leaves"
    : "/dashboard/candidate/contracts";

  const sideTabs = [
    {
      id: "home",
      label: "Inicio",
      href: "/dashboard/candidate",
      isActive: isHomeActive,
      icon: Home01Icon,
    },
    {
      id: "applications",
      label: "Postulaciones",
      href: "/dashboard/candidate/applications",
      isActive: isApplicationsActive,
      icon: File01Icon,
    },
    {
      id: "work",
      label: "Mi trabajo",
      href: workHref,
      isActive: isWorkActive,
      icon: Briefcase01Icon,
    },
    {
      id: "profile",
      label: "Perfil",
      href: "/dashboard/candidate/profile",
      isActive: isProfileActive,
      icon: UserCircleIcon,
    },
  ] as const;

  const leftTabs = sideTabs.slice(0, 2);
  const rightTabs = sideTabs.slice(2, 4);

  const hideOnMobileRoute =
    pathname.startsWith("/dashboard/candidate/vacancies/") ||
    pathname === "/dashboard/candidate/saved" ||
    pathname === "/dashboard/candidate/profile/saved" ||
    pathname === "/dashboard/candidate/profile/edit" ||
    pathname === "/dashboard/candidate/profile/cv" ||
    pathname === "/dashboard/candidate/profile/preferences" ||
    pathname === "/dashboard/candidate/settings";
  if (hideOnMobileRoute) return null;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full bg-background border-t border-border pb-[env(safe-area-inset-bottom,0px)]">
      <nav
        aria-label={
          isEmployee
            ? "Navegación principal móvil del colaborador"
            : "Navegación principal móvil del candidato"
        }
        className="h-[84px] max-w-[430px] mx-auto grid grid-cols-5 items-start select-none"
      >
        {leftTabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            className="min-h-[72px] min-w-[48px] pt-2 flex flex-col items-center justify-start gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[8px] transition-colors"
          >
            <span
              className={cn(
                "w-[56px] h-[32px] rounded-[16px] flex items-center justify-center transition-colors",
                item.isActive
                  ? "bg-muted text-primary"
                  : "bg-transparent text-muted-foreground"
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
            <span
              className={cn(
                "text-[12px] font-medium leading-[17px] text-center truncate max-w-full px-0.5",
                item.isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}

        {/* Acción central elevada: Buscar (abre Sheet contextual, Figma 212:176) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          aria-label="Buscar vacantes"
          className="min-h-[80px] min-w-[48px] -mt-1 flex flex-col items-center justify-start gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[12px] transition-transform active:scale-95"
        >
          <span className="size-[56px] rounded-full bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center shadow-xs transition-colors">
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
              strokeWidth={2}
              aria-hidden="true"
            />
          </span>
          <span className="text-[12px] font-medium leading-[17px] text-primary text-center">
            Buscar
          </span>
        </button>

        {rightTabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            className="min-h-[72px] min-w-[48px] pt-2 flex flex-col items-center justify-start gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[8px] transition-colors"
          >
            <span
              className={cn(
                "w-[56px] h-[32px] rounded-[16px] flex items-center justify-center transition-colors",
                item.isActive
                  ? "bg-muted text-primary"
                  : "bg-transparent text-muted-foreground"
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
            <span
              className={cn(
                "text-[12px] font-medium leading-[17px] text-center truncate max-w-full px-0.5",
                item.isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <CandidateSearchSheet open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
