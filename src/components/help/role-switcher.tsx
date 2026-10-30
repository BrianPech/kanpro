"use client";

import * as React from "react";
import { Building2, UserCheck } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  return (
    <div className={cn("w-full flex flex-col gap-2 select-none", className)}>
      <div className="flex items-center justify-between px-0.5 text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
        <span>Documentación</span>
        <Badge
          variant="secondary"
          className="text-[10px] font-mono font-normal py-0 h-4 px-1.5"
        >
          {activeRole === "company" ? "Empresas · B2B" : "Candidatos · Libre"}
        </Badge>
      </div>

      <Tabs
        value={activeRole}
        onValueChange={(val) => onRoleChange(val as HelpRole)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full h-9 bg-muted p-1 rounded-xl">
          <TabsTrigger
            value="company"
            className="text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <Building2 className="size-3.5 shrink-0" />
            <span>Empresas</span>
          </TabsTrigger>
          <TabsTrigger
            value="candidate"
            className="text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            <UserCheck className="size-3.5 shrink-0" />
            <span>Candidatos</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
