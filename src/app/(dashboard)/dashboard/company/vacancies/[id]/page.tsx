"use client";

import * as React from "react";
import {
  ChevronLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useVacancyManager, type VacancyRow } from "@/hooks/use-vacancy-manager";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PageProps {
  params: React.Usable<{ id: string }>;
}

export default function VacancyDetailPage({ params }: PageProps) {
  const { id } = React.use(params);
  const [vacancy, setVacancy] = React.useState<VacancyRow | null>(null);
  const [loading, setLoading] = React.useState(true);

  const { toggleVacancyStatus } = useVacancyManager();

  const fetchVacancy = React.useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vacancies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }
      setVacancy(data as VacancyRow);
    } catch (err: any) {
      console.error("Error fetching vacancy detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchVacancy();
  }, [fetchVacancy]);

  const handleToggleActive = async () => {
    if (!vacancy) return;
    const nextState = !vacancy.is_active;
    try {
      const success = await toggleVacancyStatus(vacancy.id, nextState);
      if (success) {
        setVacancy((prev) =>
          prev
            ? {
                ...prev,
                is_active: nextState,
                status: nextState ? "Activa" : "Cerrada",
              }
            : null
        );
        toast.success(
          nextState ? "Vacante activada con éxito" : "¡Vacante Pausada!",
          {
            description: nextState
              ? "La oferta vuelve a estar visible para candidatos."
              : "Se ha marcado como pausada/cubierta.",
          }
        );
      }
    } catch (err: any) {
      toast.error("Error al actualizar la vacante", {
        description: err.message,
      });
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    const formatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    });

    if (min != null && max != null) {
      return `${formatter.format(min)} - ${formatter.format(max)} MXN`;
    } else if (min != null) {
      return `Desde ${formatter.format(min)} MXN`;
    } else if (max != null) {
      return `Hasta ${formatter.format(max)} MXN`;
    }
    return "Sueldo no especificado";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date
      .toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(".", "");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 text-center space-y-6 py-20 animate-in fade-in duration-300">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-xl font-bold text-foreground">Oferta no encontrada</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          La vacante que intentas visualizar no existe o ha sido eliminada permanentemente de la plataforma.
        </p>
        <Button asChild className="rounded-xl px-6 h-12 bg-primary hover:bg-primary/90 text-white font-bold">
          <Link href="/dashboard/company/vacancies">
            Volver a vacantes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Cabecera de Control */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <Button
          asChild
          variant="ghost"
          className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 px-3 rounded-lg border border-border/20"
        >
          <Link href="/dashboard/company/vacancies">
            <ChevronLeft className="size-4" />
            Volver a vacantes
          </Link>
        </Button>

        <div className="flex items-center gap-5">
          <Button
            asChild
            variant="link"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 gap-1.5 p-0 h-auto"
          >
            <Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`}>
              <Edit2 className="size-3.5" />
              Editar vacante
            </Link>
          </Button>
          
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex items-center gap-2">
            <Switch
              checked={vacancy.is_active}
              onCheckedChange={handleToggleActive}
            />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {vacancy.is_active ? "Activa" : "Pausada"}
            </span>
          </div>
        </div>
      </div>

      {/* Bloque de Identidad */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border",
              vacancy.is_active
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
            )}
          >
            {vacancy.is_active ? "Oferta Activa" : "Oferta Pausada"}
          </Badge>
          <span className="text-xs text-muted-foreground font-semibold">
            Categoría: <span className="text-foreground font-bold">{vacancy.category}</span>
          </span>
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
          {vacancy.title}
        </h1>

        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground font-semibold">
          <MapPin className="size-4 text-zinc-400 shrink-0" />
          <span>📍 {vacancy.zone || vacancy.location}</span>
        </div>
      </div>

      {/* Fila de Metadatos Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 bg-white dark:bg-zinc-950 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase className="size-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Tipo de Jornada</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mt-1">
              {vacancy.employment_type || "No especificado"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="size-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Compensación Mensual</p>
            <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {formatSalary(vacancy.salary_min, vacancy.salary_max)}
            </p>
          </div>
        </div>
      </div>

      {/* Cuerpo de la Oferta */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Descripción del Puesto</h3>
          <div className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-line bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl">
            {vacancy.description}
          </div>
        </div>

        {vacancy.requirements && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Requisitos</h3>
            <div className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-line bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl">
              {vacancy.requirements}
            </div>
          </div>
        )}
      </div>

      {/* Info adicional de fecha */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-semibold border-t border-zinc-100 dark:border-zinc-800 pt-5">
        <Calendar className="size-4" />
        <span>Oferta creada el {formatDate(vacancy.created_at)}</span>
      </div>
    </div>
  );
}
