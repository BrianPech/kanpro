"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Building03Icon,
  InboxIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface SectionCardsProps {
  metrics?: {
    totalCandidates: number;
    totalCompanies: number;
    pendingVerifications: number;
    activeVacancies: number;
    totalApplications: number;
  };
}

export function SectionCards({ metrics }: SectionCardsProps) {
  const candidates = metrics?.totalCandidates ?? 0;
  const companies = metrics?.totalCompanies ?? 0;
  const verifications = metrics?.pendingVerifications ?? 0;
  const vacancies = metrics?.activeVacancies ?? 0;
  const applications = metrics?.totalApplications ?? 0;

  const cards = [
    {
      label: "Candidatos",
      value: candidates,
      subtitle: "Perfiles registrados",
      icon: UserGroupIcon,
      href: "/dashboard/admin/users",
      highlightSubtitle: false,
    },
    {
      label: "Empresas",
      value: companies,
      subtitle:
        verifications > 0
          ? `${verifications} por verificar`
          : "Expedientes al día",
      icon: Building03Icon,
      href: "/dashboard/admin/verifications",
      highlightSubtitle: verifications > 0,
    },
    {
      label: "Vacantes activas",
      value: vacancies,
      subtitle: "Publicadas en portal",
      icon: Briefcase01Icon,
      href: "/dashboard/admin/reports",
      highlightSubtitle: false,
    },
    {
      label: "Postulaciones",
      value: applications,
      subtitle: "Total acumulado",
      icon: InboxIcon,
      href: "/dashboard/admin/reports",
      highlightSubtitle: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="bg-card border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-1.5 hover:border-control-border transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium leading-[16px] text-muted-foreground truncate">
              {card.label}
            </span>
            <span className="size-[30px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon
                icon={card.icon}
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>
          </div>
          <span className="text-[22px] sm:text-[24px] font-bold leading-[28px] text-foreground tabular-nums">
            {card.value.toLocaleString("es-MX")}
          </span>
          <span
            className={cn(
              "text-[11.5px] leading-[15px] truncate",
              card.highlightSubtitle
                ? "font-semibold text-warning-foreground"
                : "text-muted-foreground"
            )}
          >
            {card.subtitle}
          </span>
        </Link>
      ))}
    </div>
  );
}
