"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { stopImpersonating } from "@/lib/auth/impersonation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlertIcon,
  LogOutIcon,
  Building2Icon,
  UserIcon,
  SparklesIcon,
} from "lucide-react";

interface ImpersonationBannerProps {
  targetUserName?: string;
  targetUserEmail?: string;
  targetUserRole?: "candidate" | "company" | "admin";
}

export function ImpersonationBanner({
  targetUserName = "Usuario",
  targetUserEmail = "",
  targetUserRole = "candidate",
}: ImpersonationBannerProps) {
  const router = useRouter();
  const [stopping, setStopping] = React.useState(false);

  const handleStopImpersonating = async () => {
    setStopping(true);
    try {
      const res = await stopImpersonating();
      toast.success("Sesión de impersonación finalizada. De regreso al Panel Admin.");
      router.push(res.redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al salir de impersonación.");
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white px-4 py-2.5 shadow-lg border-b border-purple-400/30 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-50 sticky top-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded-lg bg-white/10 shrink-0">
          <ShieldAlertIcon className="size-5 text-amber-300 animate-pulse" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
          <span className="font-bold tracking-tight text-amber-200 flex items-center gap-1">
            <SparklesIcon className="size-3.5" />
            Soporte Ninja (Modo Impersonación Activo):
          </span>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-white truncate">{targetUserName}</span>
            {targetUserEmail && (
              <span className="text-white/80 hidden md:inline truncate">({targetUserEmail})</span>
            )}
            <Badge
              variant="outline"
              className="border-white/30 bg-white/10 text-white text-[10px] px-2 py-0 font-semibold uppercase tracking-wider"
            >
              {targetUserRole === "company" ? (
                <>
                  <Building2Icon className="size-2.5 mr-1 inline" />
                  Empresa
                </>
              ) : (
                <>
                  <UserIcon className="size-2.5 mr-1 inline" />
                  Candidato
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          disabled={stopping}
          onClick={handleStopImpersonating}
          className="h-8 px-3 text-xs font-bold bg-white text-purple-900 hover:bg-amber-300 hover:text-purple-950 transition-all rounded-lg shadow-sm gap-1.5"
        >
          <LogOutIcon className="size-3.5" />
          <span>{stopping ? "Saliendo..." : "Salir y Volver a Admin"}</span>
        </Button>
      </div>
    </div>
  );
}
