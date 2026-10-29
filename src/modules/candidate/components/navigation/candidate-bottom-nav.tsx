"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  LayoutDashboard,
  Plane,
  FileCheck2,
  ShieldCheck,
  Compass,
  FileText,
  Bookmark,
  MoreHorizontal,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { CandidateBottomNavDrawer } from "./candidate-bottom-nav-drawer";

export interface CandidateBottomNavProps {
  isEmployee?: boolean;
}

export function CandidateBottomNav({ isEmployee = false }: CandidateBottomNavProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // 1. Navigation items for ACTIVE EMPLOYEES (Job seekers in an active contract)
  // Work-first operational navigation: Today's Shift/Attendance, Leaves, Contracts, Documents + More (Jobs & Settings)
  // Note: Profile is accessible in the sticky topbar header next to notifications
  const employeeNavItems = [
    {
      id: "shift",
      label: "Mi Turno",
      href: "/dashboard/candidate",
      isActive: pathname === "/dashboard/candidate",
      icon: Clock,
    },
    {
      id: "leaves",
      label: "Permisos",
      href: "/dashboard/candidate/leaves",
      isActive: pathname.startsWith("/dashboard/candidate/leaves"),
      icon: Plane,
    },
    {
      id: "contracts",
      label: "Contratos",
      href: "/dashboard/candidate/contracts",
      isActive: pathname.startsWith("/dashboard/candidate/contracts"),
      icon: FileCheck2,
    },
    {
      id: "documents",
      label: "Documentos",
      href: "/dashboard/candidate/documents",
      isActive: pathname.startsWith("/dashboard/candidate/documents"),
      icon: ShieldCheck,
    },
  ];

  // 2. Navigation items for REGULAR CANDIDATES (Job Seekers without active contracts)
  // Discovery-first navigation: Home, Search/Discovery, Applications, Saved + More
  // Note: Profile is accessible in the sticky topbar header next to notifications
  const candidateNavItems = [
    {
      id: "home",
      label: "Inicio",
      href: "/dashboard/candidate",
      isActive: pathname === "/dashboard/candidate",
      icon: LayoutDashboard,
    },
    {
      id: "discovery",
      label: "Buscar",
      href: "/dashboard/candidate/discovery",
      isActive: pathname.startsWith("/dashboard/candidate/discovery"),
      icon: Compass,
    },
    {
      id: "applications",
      label: "Empleos",
      href: "/dashboard/candidate/applications",
      isActive: pathname.startsWith("/dashboard/candidate/applications"),
      icon: FileText,
    },
    {
      id: "saved",
      label: "Guardados",
      href: "/dashboard/candidate/saved",
      isActive: pathname.startsWith("/dashboard/candidate/saved"),
      icon: Bookmark,
    },
  ];

  const currentNavItems = isEmployee ? employeeNavItems : candidateNavItems;

  // Check if current route is part of the secondary "Más" section
  const isEmployeeSecondaryRoute =
    isEmployee &&
    (pathname.startsWith("/dashboard/candidate/discovery") ||
      pathname.startsWith("/dashboard/candidate/applications") ||
      pathname.startsWith("/dashboard/candidate/saved") ||
      pathname.startsWith("/dashboard/candidate/settings"));

  const isCandidateSecondaryRoute =
    !isEmployee &&
    (pathname.startsWith("/dashboard/candidate/documents") ||
      pathname.startsWith("/dashboard/candidate/settings"));

  const isMoreActive = isDrawerOpen || isEmployeeSecondaryRoute || isCandidateSecondaryRoute;

  return (
    <>
      {/* Conventional Bottom Navigation Bar (Docked Edge-to-Edge) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full border-t border-border/80 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <nav
          aria-label={
            isEmployee
              ? "Navegación principal móvil del colaborador"
              : "Navegación principal móvil del candidato"
          }
          className="h-16 max-w-lg mx-auto px-2 flex items-center justify-around select-none"
        >
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isSelected = item.isActive;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isSelected ? "page" : undefined}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer gap-0.5",
                  isSelected
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <Icon
                    className={cn(
                      "size-5.5 transition-transform",
                      isSelected && "stroke-[2.5] scale-105"
                    )}
                  />
                </div>
                <span className="text-[10px] font-semibold tracking-tight leading-none mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Tab 5: "Más" Drawer Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir más opciones"
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer gap-0.5",
              isMoreActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <MoreHorizontal
                className={cn(
                  "size-5.5 transition-transform",
                  isMoreActive && "stroke-[2.5] scale-105"
                )}
              />
            </div>
            <span className="text-[10px] font-semibold tracking-tight leading-none mt-0.5">
              Más
            </span>
          </button>
        </nav>
      </div>

      {/* Drawer desplegable para opciones secundarias */}
      <CandidateBottomNavDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        isEmployee={isEmployee}
      />
    </>
  );
}
