"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CompanyBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      id: "home",
      label: "Inicio",
      href: "/dashboard/company",
      isActive: pathname === "/dashboard/company",
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-current" aria-hidden="true">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
        </svg>
      ),
    },
    {
      id: "vacancies",
      label: "Vacantes",
      href: "/dashboard/company/vacancies",
      isActive: pathname.startsWith("/dashboard/company/vacancies"),
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-current" aria-hidden="true">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
    },
    {
      id: "applicants",
      label: "Postulantes",
      href: "/dashboard/company/applications",
      isActive: pathname.startsWith("/dashboard/company/applications"),
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-current" aria-hidden="true">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-3-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-2a4 4 0 0 0-4-4H3" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <circle cx="17" cy="7" r="3" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Perfil",
      href: "/dashboard/company/profile",
      isActive: pathname.startsWith("/dashboard/company/profile"),
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-current" aria-hidden="true">
          <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-4-8h2v2h-2v-2zm0 4h2v2h-2v-2z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[25px] h-[25px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h6M9 10h6M9 14h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-[450px]">
      <nav
        aria-label="Navegación principal móvil de la empresa"
        className="h-[64px] px-3 bg-card/95 backdrop-blur-md rounded-full border border-border shadow-lg flex items-center justify-around transition-all duration-300 select-none"
      >
        {navItems.map((item) => {
          const isSelected = item.isActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isSelected ? "page" : undefined}
              className={`flex items-center justify-center cursor-pointer transition-all duration-250 ease-in-out active:scale-95 ${
                isSelected
                  ? "bg-primary text-primary-foreground rounded-full px-4 py-2.5 shadow-xs"
                  : "bg-transparent text-muted-foreground hover:text-foreground px-3 py-2"
              }`}
            >
              <div className="flex items-center justify-center shrink-0">
                {isSelected ? item.iconFilled : item.iconOutline}
              </div>

              {isSelected && (
                <span className="ml-2 text-[14px] sm:text-[15px] font-extrabold tracking-tight text-primary-foreground leading-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
