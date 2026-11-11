"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, User, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateOwnerPersonalNameAction } from "@/modules/company/actions/tenant-actions";

interface LegacyCompanyOwnerPromptProps {
  companyName: string;
  currentFullName: string;
}

export function LegacyCompanyOwnerPrompt({
  companyName,
  currentFullName,
}: LegacyCompanyOwnerPromptProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true until client checks storage

  useEffect(() => {
    // Check if user dismissed for this browser session
    const dismissed = sessionStorage.getItem("kanpro_dismiss_legacy_prompt");
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("kanpro_dismiss_legacy_prompt", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      toast.error("Por favor ingresa tu nombre y apellido");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateOwnerPersonalNameAction({ fullName: trimmed });
      if (res.success) {
        toast.success("¡Perfil personal actualizado!", {
          description: `Ahora tu cuenta está a nombre de ${trimmed} y gestionas ${companyName}.`,
        });
        sessionStorage.removeItem("kanpro_dismiss_legacy_prompt");
        router.refresh();
      } else {
        toast.error("Error al actualizar nombre", {
          description: res.error,
        });
      }
    } catch (err) {
      console.error("Error updating owner name:", err);
      toast.error("Ocurrió un error inesperado al guardar tu nombre");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Aviso de actualización de perfil multi-empresa"
      className="mb-4 w-full rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 md:p-5 shadow-xs transition-all relative overflow-hidden"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 p-1 rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
        aria-label="Cerrar aviso"
      >
        <X className="size-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 border-primary/30 text-primary gap-1"
            >
              <Sparkles className="size-3 text-primary animate-pulse" />
              <span>Novedad: Multi-Empresa</span>
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              Espacio Activo: <strong className="text-foreground">{companyName}</strong>
            </span>
          </div>

          <p className="text-xs md:text-sm text-foreground/90 font-medium leading-relaxed">
            Ahora puedes gestionar varias organizaciones desde tu misma cuenta. Tu empresa actual ya
            está a salvo como tu primer espacio. Ingresa tu <strong>nombre personal</strong> como
            titular/dueño para diferenciarte de tus empresas:
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0"
        >
          <div className="relative min-w-[220px]">
            <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tu nombre y apellido"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-9 h-9 text-xs bg-background/90"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || fullName.trim().length < 2}
            className="h-9 gap-1.5 text-xs font-medium shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>Guardar mi nombre</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Recordar luego
          </Button>
        </form>
      </div>
    </aside>
  );
}
