"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function CandidateBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Inicio",
      icon: LayoutDashboard,
      href: "/dashboard/candidate",
    },
    {
      label: "Radar",
      icon: Compass,
      href: "/dashboard/candidate/discovery",
    },
    {
      label: "Mi Perfil",
      icon: User,
      href: "/dashboard/candidate/settings",
    },
  ];

  return (
    <nav
      aria-label="Navegación principal del candidato móvil"
      className="block md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-zinc-900/90 border-t border-border/40 backdrop-blur-md z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)]"
    >
      <div className="grid h-full grid-cols-3 mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href) && item.href !== "/dashboard/candidate");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex flex-col items-center justify-center px-4 active:scale-95 transition-all gap-1.5 text-muted-foreground",
                isActive && "text-primary"
              )}
            >
              <Icon className={cn("size-[18px]", isActive && "text-primary")} aria-hidden="true" />
              <span className={cn(
                "text-[9px] uppercase tracking-wider font-extrabold",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
