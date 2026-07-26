"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CandidateBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "/dashboard/candidate",
      isActive: pathname === "/dashboard/candidate",
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-current" aria-hidden="true">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-current stroke-[1.8]" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
        </svg>
      ),
    },
    {
      id: "search",
      label: "Search",
      href: "/dashboard/candidate/discovery",
      isActive: pathname.startsWith("/dashboard/candidate/discovery"),
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-current stroke-[2.8]" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-current stroke-[1.8]" aria-hidden="true">
          <circle cx="11" cy="11" r="7.5" />
          <path strokeLinecap="round" d="m20 20-4.35-4.35" />
        </svg>
      ),
    },
    {
      id: "applied",
      label: "Applied",
      href: "/dashboard/candidate/applications",
      isActive: pathname.startsWith("/dashboard/candidate/applications"),
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-current stroke-[2.2]" aria-hidden="true">
          <rect x="5" y="4" width="14" height="17" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 2h6v4H9z" fill="currentColor" />
          <path d="M9 11h6M9 15h6" strokeLinecap="round" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-current stroke-[1.8]" aria-hidden="true">
          <rect x="5" y="4" width="14" height="17" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 2h6v3H9z" />
          <path d="M9 10.5h6M9 14.5h6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "me",
      label: "Me",
      href: "/dashboard/candidate/profile",
      isActive: pathname.startsWith("/dashboard/candidate/profile"),
      iconFilled: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-current" aria-hidden="true">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-current stroke-[1.8]" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-40px)] max-w-[420px]">
      <nav
        aria-label="Navegación principal móvil del candidato"
        className="h-[56px] px-3 bg-white rounded-[28px] border border-[#ebeef3] shadow-[0_8px_20px_rgba(0,0,0,0.04),0_-2px_8px_rgba(0,0,0,0.015)] flex items-center justify-around transition-all duration-300 select-none"
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
                  ? "bg-[#1f2732] text-white rounded-[20px] px-4 py-[6px]"
                  : "bg-transparent text-[#5c7c9b] hover:text-[#3e546d] px-3 py-[6px]"
              }`}
            >
              <div className="flex items-center justify-center shrink-0">
                {isSelected ? item.iconFilled : item.iconOutline}
              </div>

              {isSelected && (
                <span className="ml-2 text-[13px] font-bold tracking-[-0.2px] text-white leading-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
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


