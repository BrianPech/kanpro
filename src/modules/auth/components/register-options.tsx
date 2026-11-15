"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Briefcase01Icon,
  Building03Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

const PROFILE_OPTIONS = [
  {
    id: "independent",
    title: "Profesional independiente",
    description: "Ofrece tus servicios y trabaja por cuenta propia.",
    href: "/register/candidate?profile=independent",
    icon: UserAccountIcon,
  },
  {
    id: "company",
    title: "Empresa",
    description: "Publica vacantes y gestiona a tu equipo.",
    href: "/register/company",
    icon: Building03Icon,
  },
  {
    id: "candidate",
    title: "Candidato",
    description: "Encuentra oportunidades de empleo y postúlate a vacantes.",
    href: "/register/candidate",
    icon: Briefcase01Icon,
  },
] as const;

export function RegisterOptions() {
  return (
    <div className="w-full max-w-[1056px] flex flex-col items-center gap-10">
      {/* Título e instrucciones */}
      <div className="flex flex-col items-center text-center gap-3 max-w-[760px]">
        <h1 className="text-[32px] sm:text-[44px] font-semibold leading-[1.18] sm:leading-[52px] tracking-[-1px] sm:tracking-[-1.4px] text-foreground">
          Crea tu cuenta de Kanpro
        </h1>
        <p className="text-[16px] font-normal leading-[24px] text-muted-foreground">
          Elige el perfil que mejor describe lo que quieres hacer.
        </p>
      </div>

      {/* Perfiles de registro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {PROFILE_OPTIONS.map((profile) => (
          <Link
            key={profile.id}
            href={profile.href}
            className="group bg-card border border-border rounded-[16px] p-6 min-h-[248px] flex flex-col justify-between gap-5 transition-colors hover:border-link/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex flex-col gap-5">
              <div className="size-[52px] rounded-[12px] bg-[#ddf4ef] dark:bg-[#203c37] text-link flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={profile.icon}
                  size={26}
                  strokeWidth={1.75}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                  {profile.title}
                </h2>
                <p className="text-[16px] font-normal leading-[24px] text-muted-foreground">
                  {profile.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="h-px w-full bg-border" />
              <div className="min-h-[44px] flex items-center justify-between text-[14px] font-semibold leading-[20px] text-link">
                <span>Continuar</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
