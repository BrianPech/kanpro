"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { switchCompanyAction } from "@/modules/company/actions/tenant-actions";
import type { UserCompanyItem } from "@/modules/company/services/company-tenant.service";
import { cn } from "@/lib/utils";

interface CompanySwitcherProps {
  companies: UserCompanyItem[];
  activeCompanyId?: string;
  className?: string;
  collapsed?: boolean;
}

const roleLabels: Record<string, string> = {
  owner: "Dueño",
  admin: "Admin",
  recruiter: "Reclutador",
  viewer: "Lector",
};

export function CompanySwitcher({
  companies,
  activeCompanyId,
  className,
  collapsed = false,
}: CompanySwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [targetSwitchingId, setTargetSwitchingId] = React.useState<string | null>(null);

  const activeCompany =
    companies.find((c) => c.companyId === activeCompanyId) || companies[0] || null;

  const handleSwitchCompany = (companyId: string) => {
    if (companyId === activeCompany?.companyId || isPending) return;

    setTargetSwitchingId(companyId);
    startTransition(async () => {
      try {
        const result = await switchCompanyAction({ companyId });
        if (result.success) {
          toast.success("Empresa cambiada", {
            description: `Ahora estás operando como ${
              companies.find((c) => c.companyId === companyId)?.companyName || "la empresa seleccionada"
            }.`,
          });
          router.refresh();
        } else {
          toast.error("Error al cambiar de empresa", {
            description: result.error,
          });
        }
      } catch (err) {
        console.error("Error switching company:", err);
        toast.error("Error inesperado al cambiar de empresa");
      } finally {
        setTargetSwitchingId(null);
      }
    });
  };

  const handleCreateNew = () => {
    router.push("/dashboard/company/new");
  };

  if (!activeCompany && companies.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateNew}
        className={cn("gap-2 font-medium border-dashed text-primary hover:border-primary", className)}
      >
        <Plus className="size-4" />
        <span>Registrar Empresa</span>
      </Button>
    );
  }

  const initials = (activeCompany?.companyName || "K")
    .substring(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Seleccionar Empresa"
            className={cn(
              "flex items-center gap-2.5 h-10 px-2.5 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/70 transition-all text-left font-normal select-none shadow-2xs cursor-pointer",
              collapsed ? "w-10 p-0 justify-center" : "max-w-[240px] md:max-w-[280px]",
              className
            )}
          />
        }
      >
        <Avatar className="size-6 rounded-md shrink-0 border border-border/60">
          {activeCompany?.logoUrl ? (
            <AvatarImage src={activeCompany.logoUrl} alt={activeCompany.companyName} />
          ) : null}
          <AvatarFallback className="rounded-md text-[10px] font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        {!collapsed && (
          <div className="flex-1 min-w-0 flex flex-col justify-center leading-tight">
            <span className="text-xs font-semibold text-foreground truncate">
              {activeCompany?.companyName || "Seleccionar Empresa"}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
              {roleLabels[activeCompany?.role || "owner"] || "Organización"}
              {activeCompany?.verificationStatus === "verified" && (
                <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
              )}
            </span>
          </div>
        )}

        {!collapsed && (
          <div className="shrink-0 text-muted-foreground/70">
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <ChevronsUpDown className="size-3.5" />
            )}
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-72 p-1.5 rounded-xl shadow-lg border-border/80"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase px-2 py-1 tracking-wider">
            Mis Organizaciones ({companies.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />

          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {companies.map((comp) => {
              const isSelected = comp.companyId === activeCompany?.companyId;
              const isSwitchingThis = targetSwitchingId === comp.companyId;
              const compInitials = comp.companyName.substring(0, 2).toUpperCase();

              return (
                <DropdownMenuItem
                  key={comp.companyId}
                  disabled={isPending}
                  onClick={() => handleSwitchCompany(comp.companyId)}
                  className={cn(
                    "flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors",
                    isSelected && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Avatar className="size-7 rounded-md shrink-0 border border-border/50">
                    {comp.logoUrl ? (
                      <AvatarImage src={comp.logoUrl} alt={comp.companyName} />
                    ) : null}
                    <AvatarFallback className="rounded-md text-[10px] font-bold bg-muted text-foreground">
                      {compInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {comp.companyName}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold px-1 py-0 uppercase shrink-0 text-muted-foreground"
                      >
                        {roleLabels[comp.role] || comp.role}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {comp.industry || "General"}
                    </p>
                  </div>

                  <div className="size-4 flex items-center justify-center shrink-0">
                    {isSwitchingThis ? (
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                    ) : isSelected ? (
                      <Check className="size-3.5 text-primary" />
                    ) : null}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={handleCreateNew}
          className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-primary hover:bg-primary/5 hover:text-primary font-medium text-xs"
        >
          <div className="size-6 rounded-md border border-dashed border-primary/40 flex items-center justify-center bg-primary/5">
            <Plus className="size-3.5 text-primary" />
          </div>
          <span>Registrar otra empresa</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
