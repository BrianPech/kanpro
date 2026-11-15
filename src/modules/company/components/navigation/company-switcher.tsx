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
import {
  Check,
  ChevronDown,
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
  variant?: "default" | "sidebar";
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
  variant = "default",
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

  const isSidebar = variant === "sidebar";
  const words = (activeCompany?.companyName || "K").trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (activeCompany?.companyName || "K").substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Seleccionar Empresa"
            className={cn(
              isSidebar
                ? "flex items-center gap-2 w-full p-2 rounded-[8px] border border-input bg-card hover:bg-card/80 transition-colors text-left font-normal select-none cursor-pointer"
                : "flex items-center gap-2.5 h-10 px-2.5 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/70 transition-all text-left font-normal select-none shadow-2xs cursor-pointer",
              !isSidebar &&
                (collapsed
                  ? "w-10 p-0 justify-center"
                  : "max-w-[240px] md:max-w-[280px]"),
              className
            )}
          />
        }
      >
        <Avatar
          className={cn(
            "shrink-0 after:hidden",
            isSidebar
              ? "size-8 rounded-[8px]"
              : "size-6 rounded-md border border-border/60"
          )}
        >
          {activeCompany?.logoUrl ? (
            <AvatarImage
              src={activeCompany.logoUrl}
              alt={activeCompany.companyName}
              className={isSidebar ? "rounded-[8px]" : "rounded-md"}
            />
          ) : null}
          <AvatarFallback
            className={cn(
              "font-bold",
              isSidebar
                ? "rounded-[8px] text-[13px] bg-sidebar-accent text-link"
                : "rounded-md text-[10px] bg-primary/10 text-primary"
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        {!collapsed && (
          <div className="flex-1 min-w-0 flex flex-col justify-center leading-tight">
            <span
              className={cn(
                "truncate",
                isSidebar
                  ? "text-[14px] font-semibold leading-[19px] text-foreground"
                  : "text-xs font-semibold text-foreground"
              )}
            >
              {activeCompany?.companyName || "Seleccionar Empresa"}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 truncate",
                isSidebar
                  ? "text-[12px] font-medium leading-[17px] text-muted-foreground"
                  : "text-[10px] text-muted-foreground"
              )}
            >
              {isSidebar
                ? "Empresa activa"
                : roleLabels[activeCompany?.role || "owner"] || "Organización"}
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
            ) : isSidebar ? (
              <ChevronDown className="size-4 text-foreground/70" />
            ) : (
              <ChevronsUpDown className="size-3.5" />
            )}
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-[290px] p-[12px] rounded-[16px] bg-card border border-border shadow-[0px_8px_24px_0px_rgba(0,0,0,0.25)] flex flex-col gap-[8px]"
      >
        <DropdownMenuGroup className="flex flex-col gap-[8px]">
          <DropdownMenuLabel className="p-0 text-[13px] font-semibold leading-[19px] text-muted-foreground">
            Mis empresas
          </DropdownMenuLabel>

          <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
            {companies.map((comp) => {
              const isSelected = comp.companyId === activeCompany?.companyId;
              const isSwitchingThis = targetSwitchingId === comp.companyId;
              const compWords = comp.companyName.trim().split(/\s+/);
              const compInitials =
                compWords.length >= 2
                  ? (compWords[0][0] + compWords[1][0]).toUpperCase()
                  : comp.companyName.substring(0, 2).toUpperCase();

              return (
                <DropdownMenuItem
                  key={comp.companyId}
                  disabled={isPending}
                  onClick={() => handleSwitchCompany(comp.companyId)}
                  className={cn(
                    "flex items-center gap-[12px] p-[10px] rounded-[8px] cursor-pointer transition-colors focus:bg-accent",
                    isSelected && "bg-sidebar-accent focus:bg-sidebar-accent"
                  )}
                >
                  <Avatar className="h-[35px] min-w-[40px] w-auto rounded-[8px] shrink-0 bg-muted after:hidden">
                    {comp.logoUrl ? (
                      <AvatarImage
                        src={comp.logoUrl}
                        alt={comp.companyName}
                        className="rounded-[8px]"
                      />
                    ) : null}
                    <AvatarFallback className="rounded-[8px] px-[12px] py-[8px] text-[13px] font-semibold leading-[19px] bg-muted text-muted-foreground">
                      {compInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-[14px] font-semibold leading-[20px] truncate text-foreground">
                      {comp.companyName}
                    </p>
                    <p className="text-[12px] font-normal leading-[18px] text-muted-foreground truncate">
                      {isSelected
                        ? "Empresa activa"
                        : comp.industry || roleLabels[comp.role] || "Organización"}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center justify-center">
                    {isSwitchingThis ? (
                      <Loader2 className="size-4 animate-spin text-link" />
                    ) : isSelected ? (
                      <Check className="size-4 text-link" strokeWidth={2.25} />
                    ) : null}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-0 bg-border" />

        <DropdownMenuItem
          onClick={handleCreateNew}
          className="flex items-center gap-[8px] px-[10px] py-[8px] rounded-[8px] cursor-pointer text-link focus:bg-sidebar-accent/50 focus:text-link"
        >
          <span aria-hidden className="text-[20px] font-medium leading-[20px]">
            +
          </span>
          <span className="text-[14px] font-semibold leading-[20px]">
            Registrar otra empresa
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
