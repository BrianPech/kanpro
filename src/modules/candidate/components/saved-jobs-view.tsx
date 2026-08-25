/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Bookmark, 
  Briefcase, 
  RotateCw, 
  WifiOff, 
  CheckCircle2, 
  MapPin,
  Sparkles,
  ArrowUpRight,
  Trash2,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SavedVacancy {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  location: string;
  employmentType: string;
  formattedSalary: string;
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
        const { data: compProfiles } = await supabase
          .from("company_profiles")
          .select("id, company_name, logo_url")
          .in("id", companyIds);
        
        if (compProfiles) {
          compProfiles.forEach((c: any) => {
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
      router.back();
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
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300 font-sans">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Regresar"
            className="size-10 bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-md flex items-center justify-center text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50 dark:hover:bg-fiord-900 transition-all cursor-pointer shadow-soft"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-fiord-950 dark:text-fiord-50">
              Vacantes Guardadas
            </h1>
            <p className="text-xs text-fiord-600 dark:text-fiord-400">
              Empleos guardados para revisar y postularte con calma.
            </p>
          </div>
        </div>

        {!isLoading && !hasError && savedVacancies.length > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-fiord-100 dark:bg-fiord-900 text-fiord-900 dark:text-fiord-100 border border-fiord-200 dark:border-fiord-800">
            {savedVacancies.length} {savedVacancies.length === 1 ? "guardada" : "guardadas"}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg flex items-center gap-4 animate-pulse shadow-soft"
              >
                <div className="size-12 rounded-md bg-fiord-100 dark:bg-fiord-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-fiord-100 dark:bg-fiord-800 rounded w-1/3" />
                  <div className="h-3.5 bg-fiord-100 dark:bg-fiord-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError && savedVacancies.length === 0 ? (
          <div className="py-16 px-6 rounded-lg bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 text-center space-y-3 shadow-soft">
            <WifiOff className="size-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-semibold text-fiord-950 dark:text-fiord-50">
              Error al consultar vacantes guardadas
            </h3>
            <p className="text-xs text-fiord-600 dark:text-fiord-400 max-w-xs mx-auto">
              No pudimos recuperar tus empleos guardados.
            </p>
            <Button
              onClick={fetchSavedVacancies}
              className="h-9 px-4 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 gap-2"
            >
              <RotateCw className="size-3.5" />
              Reintentar
            </Button>
          </div>
        ) : savedVacancies.length === 0 ? (
          <div className="py-16 px-6 rounded-lg bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 flex flex-col items-center justify-center text-center space-y-4 shadow-soft">
            <div className="size-14 rounded-lg bg-fiord-100 dark:bg-fiord-900/60 flex items-center justify-center text-fiord-700 dark:text-fiord-300 border border-fiord-200 dark:border-fiord-800">
              <Bookmark className="size-7" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-fiord-950 dark:text-fiord-50">
                Sin vacantes guardadas
              </h3>
              <p className="text-xs text-fiord-600 dark:text-fiord-400 max-w-sm mt-1 leading-relaxed">
                Toca el icono de favoritos en cualquier vacante para guardarla y revisarla cuando estés listo para postularte.
              </p>
            </div>

            <Button
              onClick={() => router.push("/dashboard/candidate/discovery")}
              className="h-9 px-4 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white shadow-sm gap-2"
            >
              <Sparkles className="size-4" />
              Explorar vacantes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {savedVacancies.map((vacancy) => (
              <div
                key={vacancy.id}
                onClick={() => router.push(`/dashboard/candidate/vacancies/${vacancy.id}`)}
                className="group bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft hover:shadow-card-hover hover:border-fiord-400 dark:hover:border-fiord-600 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="size-12 rounded-md bg-fiord-50 dark:bg-fiord-900/60 border border-fiord-200 dark:border-fiord-800 flex items-center justify-center text-fiord-900 dark:text-fiord-100 shrink-0 font-semibold text-xs overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                    {vacancy.companyLogo ? (
                      <img src={vacancy.companyLogo} alt={vacancy.companyName} className="size-full object-cover" />
                    ) : (
                      <span>{vacancy.companyName.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-fiord-600 dark:text-fiord-400 truncate flex items-center gap-1">
                        {vacancy.companyName}
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      </span>

                      {vacancy.isPromoted && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          ★ Destacada
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-fiord-950 dark:text-fiord-50 tracking-[-0.2px] group-hover:text-fiord-700 dark:group-hover:text-fiord-200 transition-colors truncate">
                      {vacancy.title}
                    </h3>

                    <div className="flex items-center gap-2.5 text-xs text-fiord-600 dark:text-fiord-400 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 text-fiord-500 shrink-0" />
                        {vacancy.location}
                      </span>
                      <span>•</span>
                      <span>{vacancy.employmentType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-fiord-100 dark:border-fiord-800/80 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-fiord-500 dark:text-fiord-400 font-semibold uppercase tracking-wider block">
                      Salario mensual
                    </span>
                    <span className="text-sm sm:text-base font-semibold font-mono text-emerald-700 dark:text-emerald-400">
                      {vacancy.formattedSalary}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSaved(vacancy.id);
                      }}
                      aria-label={`Remover ${vacancy.title} de guardados`}
                      className="p-2 text-amber-500 hover:text-rose-500 transition-colors cursor-pointer rounded-md hover:bg-fiord-50 dark:hover:bg-fiord-800/60 border border-fiord-200 dark:border-fiord-800"
                    >
                      <Bookmark className="size-4 fill-amber-500 text-amber-500" />
                    </button>

                    <Button
                      size="sm"
                      className="h-9 px-4 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 transition-all dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white shadow-sm gap-1.5"
                    >
                      Postularme
                      <ArrowUpRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

