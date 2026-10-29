"use client";

import * as React from "react";
import { ChevronLeft, Edit2, Trash2, AlertTriangle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVacancyManager, type VacancyRow } from "@/modules/company/hooks/use-vacancy-manager";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VacancyPreview,
  type CompanyInfo,
} from "@/modules/company/components/vacancy-preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VacancyDetailPage({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const [vacancy, setVacancy] = React.useState<VacancyRow | null>(null);
  const [company, setCompany] = React.useState<CompanyInfo | null>(null);
  const [otherVacancies, setOtherVacancies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);

  const { toggleVacancyStatus, deleteVacancy } = useVacancyManager();

  const fetchVacancyData = React.useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 1. Fetch main vacancy
      const { data: vacData, error: vacError } = await supabase
        .from("vacancies")
        .select("*")
        .eq("id", id)
        .single();

      if (vacError || !vacData) {
        throw vacError || new Error("Vacante no encontrada");
      }
      setVacancy(vacData as VacancyRow);

      // 2. Fetch company profile and base profile in parallel
      const companyId = vacData.company_id || vacData.recruiter_id;
      if (companyId) {
        const [compRes, baseProfRes, otherVacRes] = await Promise.all([
          supabase
            .from("company_profiles")
            .select("*")
            .eq("id", companyId)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("full_name, location, avatar_url")
            .eq("id", companyId)
            .maybeSingle(),
          supabase
            .from("vacancies")
            .select("id, title, location, created_at")
            .eq("company_id", companyId)
            .neq("id", id)
            .limit(4),
        ]);

        const compProfile = compRes.data as any;
        const baseProfile = baseProfRes.data as any;

        const resolvedName =
          compProfile?.company_name &&
          compProfile.company_name.trim() !== "" &&
          compProfile.company_name.trim() !== "Nueva Empresa"
            ? compProfile.company_name
            : baseProfile?.full_name || "Empresa K'anPro";

        const resolvedLogo = compProfile?.logo_url || baseProfile?.avatar_url || "";
        const resolvedLocation =
          compProfile?.fiscal_address || compProfile?.address_details || baseProfile?.location || "";

        setCompany({
          id: companyId,
          company_name: resolvedName,
          logo_url: resolvedLogo,
          location: resolvedLocation,
          industry: compProfile?.industry || "",
          description: compProfile?.description || "",
          phone: compProfile?.contact_phone || "",
          website_or_linkedin: compProfile?.website_url || "",
          followers_count: 0,
        });

        if (otherVacRes.data) {
          setOtherVacancies(otherVacRes.data);
        }
      }
    } catch (err: any) {
      console.error("Error fetching vacancy detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchVacancyData();
  }, [fetchVacancyData]);

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

  const handleDeleteVacancy = async () => {
    if (!vacancy) return;
    setDeleting(true);
    try {
      const success = await deleteVacancy(vacancy.id);
      if (success) {
        toast.success("Vacante eliminada", {
          description: `Se eliminó la oferta "${vacancy.title}".`,
        });
        router.push("/dashboard/company/vacancies");
      }
    } catch (err: any) {
      toast.error("Error al eliminar la vacante", {
        description: err.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 text-center space-y-6 py-20 animate-in fade-in duration-300">
        <div className="size-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Oferta no encontrada
          </h2>
          <p className="text-xs font-semibold text-muted-foreground max-w-md mx-auto leading-relaxed">
            La vacante que intentas visualizar no existe o ha sido eliminada permanentemente.
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/company/vacancies" />}
          className="rounded-xl px-6 h-11 font-bold text-xs uppercase tracking-wider"
        >
          Volver a vacantes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Control Toolbar */}
      <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto px-2">
        <Button
          variant="outline"
          render={<Link href="/dashboard/company/vacancies" />}
          className="text-xs font-bold gap-2 px-3.5 h-10 rounded-xl bg-card border-border shadow-xs"
        >
          <ChevronLeft className="size-4" />
          Volver a vacantes
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            render={<Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`} />}
            className="h-10 px-4 rounded-xl border-border bg-card font-bold text-xs gap-2 shadow-xs"
          >
            <Edit2 className="size-3.5 text-primary" />
            Editar Vacante
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  disabled={deleting}
                  className="h-10 w-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
                  title="Eliminar vacante"
                />
              }
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <AlertTriangle className="size-5 text-destructive" />
                  ¿Eliminar vacante?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  Esta acción eliminará la oferta &quot;{vacancy.title}&quot; de forma permanente. Los candidatos ya no podrán verla ni postularse.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl text-xs font-bold border-border">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteVacancy}
                  className="rounded-xl text-xs font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Render High-Fidelity VacancyPreview Component */}
      <VacancyPreview
        vacancy={vacancy}
        company={company}
        otherVacancies={otherVacancies}
        isCompanyView={true}
        onEdit={() => router.push(`/dashboard/company/vacancies/${vacancy.id}/edit`)}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
