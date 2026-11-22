"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Bookmark, 
  RotateCw, 
  WifiOff, 
  CheckCircle2, 
  MapPin,
  Sparkles,
  ArrowUpRight
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPaymentFrequencyLabel } from "@/lib/formatters";

export interface SavedVacancy {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  location: string;
  employmentType: string;
  formattedSalary: string;
  paymentFrequency?: string | null;
  isPromoted: boolean;
}

interface SavedJobsViewProps {
  onBack?: () => void;
}

export function SavedJobsView({ onBack }: SavedJobsViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [savedVacancies, setSavedVacancies] = React.useState<SavedVacancy[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [hasError, setHasError] = React.useState<boolean>(false);

  const fetchSavedVacancies = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSavedVacancies([]);
        setIsLoading(false);
        return;
      }

      // Fetch saved vacancies for current candidate
      const { data: savedRows, error: savedError } = await supabase
        .from("saved_vacancies")
        .select(`
          id,
          vacancy_id,
          created_at,
          vacancy:vacancies (
            id,
            title,
            location,
            modality,
            employment_type,
            salary_min,
            salary_max,
            payment_frequency,
            is_featured,
            is_promoted,
            company_id
          )
        `)
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });

      if (savedError) {
        console.error("Error fetching saved_vacancies:", savedError);
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const validSaved = (savedRows || []).filter((row: any) => row.vacancy != null);

      // Fetch company profiles
      const companyIds = Array.from(
        new Set(validSaved.map((row: any) => row.vacancy.company_id).filter(Boolean))
      ) as string[];

      const companies: Record<string, { company_name: string; logo_url: string | null }> = {};
      if (companyIds.length > 0) {
        const { data: compDirectoryRows } = await supabase
          .from("company_directory")
          .select("id, company_name, logo_url")
          .in("id", companyIds);
        
        if (compDirectoryRows) {
          compDirectoryRows.forEach((c: { id: string | null; company_name: string | null; logo_url: string | null }) => {
            if (!c.id) return;
            companies[c.id] = {
              company_name: c.company_name || "Empresa",
              logo_url: c.logo_url || null,
            };
          });
        }
      }

      const formattedList: SavedVacancy[] = validSaved.map((row: any) => {
        const vac = row.vacancy;
        const comp = companies[vac.company_id];

        let formattedSalary = "";
        const min = Number(vac.salary_min);
        const max = Number(vac.salary_max);
        if (min && max) {
          formattedSalary = `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`;
        } else if (min) {
          formattedSalary = `Desde $${min.toLocaleString()} MXN`;
        } else if (max) {
          formattedSalary = `Hasta $${max.toLocaleString()} MXN`;
        } else {
          formattedSalary = "Sueldo no especificado";
        }

        return {
          id: vac.id,
          title: vac.title,
          companyName: comp?.company_name || "Empresa",
          companyLogo: comp?.logo_url || null,
          location: vac.location || vac.modality || "Remoto",
          employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
          formattedSalary,
          paymentFrequency: vac.payment_frequency || "quincenal",
          isPromoted: !!(vac.is_promoted || vac.is_featured),
        };
      });

      setSavedVacancies(formattedList);
    } catch (err) {
      console.error("Error loading saved vacancies:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    fetchSavedVacancies();
  }, [fetchSavedVacancies]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/candidate/profile");
    }
  };

  const handleRemoveSaved = async (id: string) => {
    const previous = savedVacancies;
    setSavedVacancies((prev) => prev.filter((v) => v.id !== id));
    toast.info("Vacante removida de tus favoritos");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("saved_vacancies")
        .delete()
        .eq("candidate_id", user.id)
        .eq("vacancy_id", id);

      if (error) {
        console.error("Error removing saved vacancy:", error);
        setSavedVacancies(previous);
        toast.error("Error al remover la vacante");
      }
    } catch (err) {
      console.error("Error removing saved vacancy:", err);
      setSavedVacancies(previous);
      toast.error("Error al remover la vacante");
    }
  };

  return (
    <div className="flex-1 min-h-full bg-transparent px-4 sm:px-6 lg:px-8 pt-2 pb-28 md:pb-12 max-w-4xl mx-auto w-full animate-in fade-in duration-300 space-y-6">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            aria-label="Regresar"
            className="size-10 rounded-full cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Vacantes Guardadas
            </h1>
            <p className="text-xs text-muted-foreground">
              Empleos guardados para revisar y postularte con calma.
            </p>
          </div>
        </div>

        {!isLoading && !hasError && savedVacancies.length > 0 && (
          <Badge variant="secondary" className="font-semibold text-xs px-3 py-1">
            {savedVacancies.length} {savedVacancies.length === 1 ? "guardada" : "guardadas"}
          </Badge>
        )}
      </div>

      {/* Content Area */}
      <div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-4xl border-border/60">
                <CardContent className="p-5 flex items-center gap-4">
                  <Skeleton className="size-12 rounded-3xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                    <Skeleton className="h-3.5 w-1/4 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasError && savedVacancies.length === 0 ? (
          <Card className="rounded-4xl border-border/60 shadow-xs">
            <CardContent className="py-16 px-6 text-center space-y-4">
              <WifiOff className="size-10 text-destructive mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Error al consultar vacantes guardadas
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  No pudimos recuperar tus empleos guardados en este momento.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSavedVacancies}
                className="h-9 px-4 rounded-4xl gap-2 text-xs font-semibold cursor-pointer"
              >
                <RotateCw className="size-3.5" />
                <span>Reintentar</span>
              </Button>
            </CardContent>
          </Card>
        ) : savedVacancies.length === 0 ? (
          <Card className="rounded-4xl border-border/60 shadow-xs">
            <CardContent className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="size-14 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
                <Bookmark className="size-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Sin vacantes guardadas
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Toca el icono de favoritos en cualquier vacante para guardarla y revisarla cuando estés listo para postularte.
                </p>
              </div>

              <Button
                onClick={() => router.push("/dashboard/candidate/discovery")}
                className="h-9 px-4 rounded-4xl text-xs font-semibold gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Explorar vacantes</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {savedVacancies.map((vacancy) => (
              <Card
                key={vacancy.id}
                onClick={() => router.push(`/dashboard/candidate/vacancies/${vacancy.id}`)}
                className="rounded-4xl border-border/60 shadow-xs hover:shadow-md hover:border-border transition-all cursor-pointer group"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <Avatar className="size-12 rounded-3xl ring-1 ring-border/50 shrink-0">
                      {vacancy.companyLogo && <AvatarImage src={vacancy.companyLogo} alt={vacancy.companyName} />}
                      <AvatarFallback className="text-xs font-bold rounded-3xl bg-muted text-foreground">
                        {vacancy.companyName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground truncate flex items-center gap-1">
                          {vacancy.companyName}
                          <CheckCircle2 className="size-3 text-primary shrink-0" />
                        </span>

                        {vacancy.isPromoted && (
                          <Badge variant="outline" className="text-[10px] font-semibold py-0.5 px-2.5 rounded-3xl bg-primary/10 text-primary border-primary/20">
                            ★ Destacada
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
                        {vacancy.title}
                      </h3>

                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 shrink-0" />
                          {vacancy.location}
                        </span>
                        <span>•</span>
                        <span>{vacancy.employmentType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/60 gap-3">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                        Salario {formatPaymentFrequencyLabel(vacancy.paymentFrequency).toLowerCase()}
                      </span>
                      <span className="text-sm sm:text-base font-bold font-mono text-foreground">
                        {vacancy.formattedSalary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSaved(vacancy.id);
                        }}
                        aria-label={`Remover ${vacancy.title} de guardados`}
                        className="size-9 rounded-3xl text-primary hover:text-destructive hover:border-destructive/30 cursor-pointer"
                      >
                        <Bookmark className="size-4 fill-primary text-primary" />
                      </Button>

                      <Button
                        size="sm"
                        className="h-9 px-4 rounded-4xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Postularme</span>
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

