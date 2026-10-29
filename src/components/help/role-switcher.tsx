"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2, UserCheck } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type HelpRole = "company" | "candidate";

interface RoleSwitcherProps {
  activeRole: HelpRole;
  onRoleChange: (role: HelpRole) => void;
  className?: string;
}

export function RoleSwitcher({
  activeRole,
  onRoleChange,
  className,
}: RoleSwitcherProps) {
  const roles = [
    {
      id: "company" as const,
      label: "Para Empresas",
      subtitle: "Portal B2B & Auditoría SAT",
      description: "Alta fiscal, 32-D SAT, vacantes y filtro < 3 km",
      badge: "B2B",
      icon: Building2,
    },
    {
      id: "candidate" as const,
      label: "Para Candidatos",
      subtitle: "Portal Empleo & Talento",
      description: "Expediente 360, postulación WhatsApp y cercanía",
      badge: "100% Gratis",
      icon: UserCheck,
    },
  ];

  const currentRole = roles.find((r) => r.id === activeRole) ?? roles[0];
  const IconComponent = currentRole.icon;

  return (
    <div
      className={cn(
        "w-full h-[78px] min-h-[78px] max-h-[78px] shrink-0 flex flex-col gap-1.5 select-none",
        className
      )}
    >
      {/* Top Header: Fixed height 20px */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono font-bold tracking-wider uppercase px-0.5 h-5 shrink-0">
        <span>VISTA DE DOCUMENTACIÓN</span>
        <div className="flex items-center justify-end min-w-[70px]">
          <Badge
            variant="outline"
            className="text-[10px] font-mono text-primary border-primary/30 py-0 h-4 min-w-[42px] justify-center"
          >
            {currentRole.badge}
          </Badge>
        </div>
      </div>

      {/* Trigger container with strict fixed height 52px */}
      <div className="w-full h-[52px] min-h-[52px] max-h-[52px] relative shrink-0">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex w-full h-[52px] items-center gap-2.5 rounded-2xl border border-border bg-card px-2.5 text-left text-sm shadow-2xs hover:bg-accent/40 hover:border-border transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-primary data-popup-open:bg-accent/60 data-popup-open:border-primary/40 group overflow-hidden"
              />
            }
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:scale-105 transition-transform">
              <IconComponent className="size-4.5" />
            </div>
            <div className="flex flex-col justify-center leading-tight min-w-0 flex-1 text-left overflow-hidden">
              <span className="font-bold text-xs text-foreground truncate">
                {currentRole.label}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {currentRole.subtitle}
              </span>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground/70 shrink-0 ml-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[var(--anchor-width)] min-w-[260px] rounded-2xl p-1.5 shadow-xl border border-border bg-popover text-popover-foreground"
            align="start"
            sideOffset={6}
          >
            {roles.map((role) => {
              const ItemIcon = role.icon;
              const isSelected = role.id === activeRole;
              return (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => onRoleChange(role.id)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors",
                    isSelected
                      ? "bg-accent/80 text-accent-foreground font-medium"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <ItemIcon className="size-4" />
                  </div>
                  <div className="flex flex-col justify-center text-left min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground">
                        {role.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-mono px-1 py-0 h-3.5"
                      >
                        {role.badge}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {role.description}
                    </span>
                  </div>
                  <div className="size-4 shrink-0 ml-1 flex items-center justify-center">
                    {isSelected && (
                      <Check className="size-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
