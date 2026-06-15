"use client";

import * as React from "react";
import {
  Home,
  User,
  Shield,
  Lock,
  CreditCard,
  Sparkles,
  Users,
  Heart,
  Grid,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}

export function AccountSidebar({ role = "pro" }: { role?: string }) {
  const pathname = usePathname();

  const navigation: NavigationItem[] = [
    {
      title: "Página principal",
      url: "/account",
      icon: Home,
      colorClass: "text-blue-500 dark:text-blue-400",
      bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      title: "Plan de K'anPro AI",
      url: "/account/ai-plan",
      icon: Sparkles,
      colorClass: "text-violet-500 dark:text-violet-400",
      bgClass: "bg-violet-500/10 dark:bg-violet-500/20",
    },
    {
      title: "Billetera y suscripciones",
      url: "/account/billing",
      icon: CreditCard,
      colorClass: "text-purple-500 dark:text-purple-400",
      bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
    },
    {
      title: "Información personal",
      url: "/account/personal-info",
      icon: User,
      colorClass: "text-emerald-500 dark:text-emerald-400",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      title: "Seguridad y acceso",
      url: "/account/security",
      icon: Lock,
      colorClass: "text-sky-500 dark:text-sky-400",
      bgClass: "bg-sky-500/10 dark:bg-sky-500/20",
    },
    {
      title: "Apps vinculadas",
      url: "/account/apps",
      icon: Grid,
      colorClass: "text-cyan-500 dark:text-cyan-400",
      bgClass: "bg-cyan-500/10 dark:bg-cyan-500/20",
    },
    {
      title: "Datos y privacidad",
      url: "/account/privacy",
      icon: Shield,
      colorClass: "text-amber-500 dark:text-amber-400",
      bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      title: "Personas e información",
      url: "/account/people",
      icon: Users,
      colorClass: "text-rose-500 dark:text-rose-400",
      bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
    },
    {
      title: "Familia",
      url: "/account/family",
      icon: Heart,
      colorClass: "text-pink-500 dark:text-pink-400",
      bgClass: "bg-pink-500/10 dark:bg-pink-500/20",
    },
  ];

  return (
    <Sidebar
      collapsible="none"
      className="w-72 bg-transparent border-none select-none shrink-0 h-screen hidden md:flex"
    >
      {/* Sidebar Header: Brand Logo */}
      <SidebarHeader className="h-16 px-6 flex flex-row items-center justify-start shrink-0 bg-transparent gap-0">
        <Link href={`/dashboard/${role}`} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground shadow-sm transition-all duration-300">
            <Sparkles className="h-4.5 w-4.5 text-background" />
          </div>
          <span className="text-[19px] font-semibold tracking-[-0.04em] text-foreground">
            K&apos;anPro
          </span>
        </Link>
        <span className="text-muted-foreground/30 text-base font-light mx-2">|</span>
        <span className="text-base text-muted-foreground tracking-tight">
          Cuenta
        </span>
      </SidebarHeader>

      {/* Sidebar Content: Navigation List */}
      <SidebarContent className="px-4 py-4 flex flex-col gap-1 bg-transparent border-none no-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.url;

          return (
            <div key={item.url} className="w-full">
              <Link
                href={item.url}
                className={`flex items-center w-full h-12 rounded-full px-4 gap-4 transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                }`}
              >
                {/* Circular Icon Container */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                    isActive ? "bg-primary text-primary-foreground" : item.bgClass
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-[14.5px] tracking-tight truncate">
                  {item.title}
                </span>
              </Link>
            </div>
          );
        })}
      </SidebarContent>

      {/* Sidebar Footer: Legal Links */}
      <SidebarFooter className="px-6 py-4 flex flex-col gap-1.5 shrink-0 bg-transparent border-t border-border/10 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-start">
          <a href="#" className="hover:text-foreground hover:underline">Privacidad</a>
          <a href="#" className="hover:text-foreground hover:underline">Condiciones</a>
          <a href="#" className="hover:text-foreground hover:underline">Ayuda</a>
        </div>
        <div className="flex justify-start">
          <a href="#" className="hover:text-foreground hover:underline">Información</a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
