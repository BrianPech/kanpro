"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useVacancyManager,
  type VacancyRow,
} from "@/modules/company/hooks/use-vacancy-manager";
import { cloneVacancyAction } from "@/modules/company/actions/vacancies";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

type VacancyDetailRecord = VacancyRow & {
  positions_available?: number | null;
  payment_frequency?: string | null;
  preferred_contact_method?: string | null;
  experience_required?: string | null;
  education_level?: string | null;
};

type VacancyStatusKey = "active" | "paused" | "closed" | "draft";

function resolveStatusKey(v: VacancyDetailRecord): VacancyStatusKey {
  const raw = (v.status || "").toLowerCase();
  if (raw.includes("borrador") || raw === "draft") return "draft";
  if (raw.includes("cerrad") || raw === "closed") return "closed";
  if (v.is_active || raw === "activa") return "active";
  return "paused";
}

const STATUS_BADGE_MAP: Record<
  VacancyStatusKey,
  { label: string; className: string }
> = {
  active: {
    label: "Activa",
    className: "bg-success text-success-foreground",
  },
  paused: {
    label: "Pausada",
    className: "bg-warning text-warning-foreground",
  },
  closed: {
    label: "Cerrada",
    className: "bg-muted text-muted-foreground",
  },
  draft: {
    label: "Borrador",
    className:
      "bg-[#e8f2fb] text-[#184c78] dark:bg-[#213748] dark:text-[#abd6f5]",
  },
};

const CONTACT_CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  platform: "Bandeja Kanpro",
  both: "WhatsApp y bandeja Kanpro",
};

const FREQUENCY_LABELS: Record<string, string> = {
  semanal: "Por semana",
  quincenal: "Por quincena",
  mensual: "Por mes",
};

function formatSalaryRange(min: number | null, max: number | null): string {
  const fmt = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
  if (min != null && max != null) {
    return `${fmt.format(min)}–${fmt.format(max)} MXN`;
  }
  if (min != null) return `Desde ${fmt.format(min)} MXN`;
  if (max != null) return `Hasta ${fmt.format(max)} MXN`;
  return "Sueldo a convenir";
}

export default function VacancyDetailPage({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter();

  const [vacancy, setVacancy] = React.useState<VacancyDetailRecord | null>(
    null
  );
  const [companyName, setCompanyName] = React.useState("Empresa");
  const [companyLocation, setCompanyLocation] = React.useState("");
  const [applicantsCount, setApplicantsCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const { toggleVacancyStatus, deleteVacancy } = useVacancyManager();

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();

        const [vacRes, appCountRes] = await Promise.all([
          supabase.from("vacancies").select("*").eq("id", id).single(),
          supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("vacancy_id", id),
        ]);

        if (vacRes.error || !vacRes.data) {
          throw vacRes.error || new Error("Vacante no encontrada");
        }

        if (cancelled) return;
        const vacData = vacRes.data as VacancyDetailRecord;
        setVacancy(vacData);
        setApplicantsCount(appCountRes.count ?? 0);

        const companyId = vacData.company_id || vacData.recruiter_id;
        if (companyId) {
          const [compRes, baseProfRes] = await Promise.all([
            supabase
              .from("company_profiles")
              .select("company_name, fiscal_address, address_details")
              .eq("id", companyId)
              .maybeSingle(),
            supabase
              .from("profiles")
              .select("full_name, location")
              .eq("id", companyId)
              .maybeSingle(),
          ]);

          if (cancelled) return;
          const compProfile = compRes.data;
          const baseProfile = baseProfRes.data;

          const resolvedName =
            compProfile?.company_name &&
            compProfile.company_name.trim() !== "" &&
            compProfile.company_name.trim() !== "Nueva Empresa"
              ? compProfile.company_name
              : baseProfile?.full_name || "Empresa K'anPro";

          setCompanyName(resolvedName);
          setCompanyLocation(
            compProfile?.fiscal_address ||
              compProfile?.address_details ||
              baseProfile?.location ||
              ""
          );
        }
      } catch (err) {
        console.error("Error fetching vacancy detail:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleToggleActive = async (
    nextActive: boolean,
    nextStatus: "Activa" | "Pausada" | "Cerrada"
  ) => {
    if (!vacancy) return;
    setIsUpdating(true);
    try {
      const success = await toggleVacancyStatus(
        vacancy.id,
        nextActive,
        nextStatus
      );
      if (success) {
        setVacancy((prev) =>
          prev
            ? {
                ...prev,
                is_active: nextActive,
                status: nextStatus,
              }
            : null
        );
        toast.success(
          nextActive
            ? "Vacante reactivada con éxito"
            : nextStatus === "Cerrada"
            ? "Vacante marcada como cerrada"
            : "Vacante pausada temporalmente"
        );
      }
    } catch (err: unknown) {
      toast.error("Error al actualizar la vacante", {
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDuplicate = async () => {
    if (!vacancy) return;
    setIsUpdating(true);
    try {
      const res = await cloneVacancyAction(vacancy.id);
      if (res.success) {
        toast.success("Vacante duplicada como borrador");
        router.push("/dashboard/company/vacancies");
      } else {
        toast.error("No se pudo duplicar la vacante");
      }
    } catch (err: unknown) {
      toast.error("Error al duplicar", {
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setIsUpdating(false);
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
    } catch (err: unknown) {
      toast.error("Error al eliminar la vacante", {
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-[20px] pb-12">
        <Skeleton className="h-5 w-36 rounded-md" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-72 rounded-lg" />
            <Skeleton className="h-4 w-52 rounded-md" />
          </div>
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-28 w-full rounded-[12px]" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[20px]">
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-[16px]" />
            <Skeleton className="h-40 w-full rounded-[16px]" />
            <Skeleton className="h-28 w-full rounded-[16px]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-[16px]" />
            <Skeleton className="h-52 w-full rounded-[16px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center flex flex-col items-center gap-4">
        <h2 className="text-[20px] font-semibold text-foreground">
          Vacante no encontrada
        </h2>
        <p className="text-[14px] text-muted-foreground">
          La vacante que intentas visualizar no existe o fue eliminada.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/company/vacancies" />}
          className="h-[44px] px-4 rounded-[8px] bg-primary text-primary-foreground text-[14px] font-medium"
        >
          Volver a Vacantes
        </Button>
      </div>
    );
  }

  const statusKey = resolveStatusKey(vacancy);
  const statusBadge = STATUS_BADGE_MAP[statusKey];
  const shiftShort = (vacancy.shift_schedule || "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
  const displayLocation = vacancy.location || companyLocation || "Por definir";
  const displayZone = [vacancy.zone, displayLocation].filter(Boolean).join(", ");
  const cleanDescription = (vacancy.description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const benefitsList = Array.isArray(vacancy.benefits)
    ? vacancy.benefits.map((b) =>
        b.startsWith("Prestaciones de Ley") ? "Prestaciones de ley" : b
      )
    : [];
  const skillsList = Array.isArray(vacancy.skills) ? vacancy.skills : [];

  return (
    <div className="w-full flex flex-col gap-[20px] pb-12 font-sans">
      {/* 1. Back Link */}
      <div>
        <Link
          href="/dashboard/company/vacancies"
          className="inline-flex items-center gap-[6px] text-[14px] font-medium text-link hover:underline"
        >
          <ArrowLeft className="size-[16px]" />
          <span>Volver a Vacantes</span>
        </Link>
      </div>

      {/* 2. Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-[4px]">
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
            {vacancy.title}
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
            {companyName}
            {displayLocation ? ` · ${displayLocation}` : ""}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex items-center justify-center h-[28px] px-[12px] rounded-[8px] text-[13px] font-medium leading-[18px] shrink-0",
            statusBadge.className
          )}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* 3. Estado de publicación Banner */}
      <div className="bg-muted border border-border rounded-[12px] p-[20px] flex flex-col gap-[12px]">
        <div className="flex flex-col gap-[4px]">
          <span className="text-[15px] font-semibold leading-[20px] text-foreground">
            Estado de publicación
          </span>
          <span className="text-[13px] leading-[18px] text-muted-foreground">
            {statusKey === "active"
              ? "Visible para candidatos. Está recibiendo postulaciones."
              : statusKey === "paused"
              ? "El anuncio está oculto temporalmente. Puedes reactivarlo cuando quieras."
              : statusKey === "draft"
              ? "Esta vacante está guardada como borrador y aún no es visible."
              : "El proceso de selección terminó. Consulta las postulaciones recibidas desde esta vacante."}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          {statusKey === "active" && (
            <>
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                  />
                }
                className="h-[40px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 cursor-pointer"
              >
                Ver postulaciones
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => handleToggleActive(false, "Pausada")}
                className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 cursor-pointer"
              >
                Pausar vacante
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => handleToggleActive(false, "Cerrada")}
                className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 cursor-pointer"
              >
                Cerrar vacante
              </Button>
            </>
          )}

          {statusKey === "paused" && (
            <>
              <Button
                type="button"
                disabled={isUpdating}
                onClick={() => handleToggleActive(true, "Activa")}
                className="h-[40px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 cursor-pointer"
              >
                Reactivar vacante
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                  />
                }
                className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 cursor-pointer"
              >
                Ver postulaciones
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => handleToggleActive(false, "Cerrada")}
                className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 cursor-pointer"
              >
                Cerrar vacante
              </Button>
            </>
          )}

          {(statusKey === "closed" || statusKey === "draft") && (
            <>
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                  />
                }
                className="h-[40px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 cursor-pointer"
              >
                Ver postulaciones
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={handleDuplicate}
                className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 cursor-pointer"
              >
                Duplicar vacante
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setIsDeleteOpen(true)}
                className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 cursor-pointer"
              >
                Eliminar vacante
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 4. Two-Column Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[20px] items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-[16px]">
          {/* Sobre el puesto */}
          <section className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
            <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">
              Sobre el puesto
            </h2>
            <p className="text-[14px] leading-[22px] text-foreground">
              {cleanDescription || "Sin descripción registrada."}
            </p>
            <div className="h-px w-full bg-border" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  Categoría
                </span>
                <span className="text-[14px] font-medium text-foreground">
                  {vacancy.category || "General"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  Jornada y turno
                </span>
                <span className="text-[14px] font-medium text-foreground">
                  {vacancy.employment_type || "Tiempo completo"}
                  {shiftShort ? ` · ${shiftShort}` : ""}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  Plazas
                </span>
                <span className="text-[14px] font-medium text-foreground">
                  {vacancy.positions_available || 1} disponibles
                </span>
              </div>
            </div>
          </section>

          {/* Requisitos del puesto */}
          <section className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
            <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">
              Requisitos del puesto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  Experiencia
                </span>
                <span className="text-[14px] font-medium text-foreground">
                  {vacancy.experience_required || "Sin experiencia previa"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  Escolaridad
                </span>
                <span className="text-[14px] font-medium text-foreground">
                  {vacancy.education_level || "Indistinto"}
                </span>
              </div>
            </div>

            {skillsList.length > 0 && (
              <div className="flex flex-col gap-[8px]">
                <span className="text-[12px] text-muted-foreground">
                  Habilidades
                </span>
                <div className="flex flex-wrap gap-[8px]">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center h-[30px] px-[10px] rounded-[8px] bg-muted text-foreground text-[13px] font-normal"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Prestaciones */}
          <section className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[12px]">
            <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">
              Prestaciones
            </h2>
            {benefitsList.length > 0 ? (
              <div className="flex flex-wrap gap-[8px]">
                {benefitsList.map((benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center h-[30px] px-[10px] rounded-[8px] bg-muted text-foreground text-[13px] font-normal"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[14px] text-muted-foreground">
                Prestaciones de ley / a convenir.
              </span>
            )}
          </section>
        </div>

        {/* Right Column */}
        <aside className="flex flex-col gap-[16px]">
          {/* Sueldo y ubicación */}
          <section className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[12px]">
            <h3 className="text-[16px] font-semibold leading-[22px] text-foreground">
              Sueldo y ubicación
            </h3>
            <div className="flex flex-col gap-[2px]">
              <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
                {formatSalaryRange(vacancy.salary_min, vacancy.salary_max)}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {FREQUENCY_LABELS[vacancy.payment_frequency || "mensual"] ||
                  "Por mes"}
              </span>
            </div>
            <div className="h-px w-full bg-border" />
            <div className="flex flex-col gap-[2px]">
              <span className="text-[12px] text-muted-foreground">
                Zona de trabajo
              </span>
              <span className="text-[14px] font-medium text-foreground">
                {displayZone}
              </span>
            </div>
          </section>

          {/* Postulaciones y contacto */}
          <section className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[12px]">
            <h3 className="text-[16px] font-semibold leading-[22px] text-foreground">
              Postulaciones y contacto
            </h3>
            <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
              {applicantsCount} recibidas
            </span>
            <div className="h-px w-full bg-border" />
            <div className="flex flex-col gap-[10px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  Canales de postulación
                </span>
                <span className="text-[14px] font-medium text-foreground">
                  {CONTACT_CHANNEL_LABELS[
                    vacancy.preferred_contact_method || "both"
                  ] || "WhatsApp y bandeja Kanpro"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  WhatsApp de contacto
                </span>
                <span className="text-[14px] font-medium text-foreground">
                  {vacancy.contact_phone || "—"}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] text-muted-foreground">
                  Correo de contacto
                </span>
                <span className="text-[14px] font-medium text-foreground break-all">
                  {vacancy.contact_email || "—"}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-[16px] bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <span>¿Eliminar vacante?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-muted-foreground leading-relaxed">
              Esta acción eliminará la oferta &quot;{vacancy.title}&quot; de
              forma permanente. Los candidatos ya no podrán verla ni postularse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[8px] text-[14px] font-medium border-control-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVacancy}
              disabled={deleting}
              className="rounded-[8px] text-[14px] font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
