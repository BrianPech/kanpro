"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Bookmark, 
  Briefcase, 
  RotateCw, 
  WifiOff, 
  CheckCircle2, 
  Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

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

      // Fetch active vacancies for demo / saved vacancies
      const { data: vacancies } = await supabase
        .from("vacancies")
        .select(`
          id,
          title,
          location,
          modality,
          employment_type,
          salary_min,
          salary_max,
          is_featured,
          company_id
        `)
        .eq("status", "Activa")
        .limit(10);

      // Fetch companies
      const companies: Record<string, string> = {};
      if (vacancies && vacancies.length > 0) {
        const companyIds = Array.from(new Set(vacancies.map((v: any) => v.company_id).filter(Boolean)));
        if (companyIds.length > 0) {
          const { data: compProfiles } = await supabase
            .from("company_profiles")
            .select("id, company_name")
            .in("id", companyIds);
          
          if (compProfiles) {
            compProfiles.forEach((c: any) => {
              companies[c.id] = c.company_name || "Empresa";
            });
          }
        }
      }

      const formattedList: SavedVacancy[] = (vacancies || []).map((vac: any) => {
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
          companyName: companies[vac.company_id] || "Empresa",
          companyLogo: null,
          location: vac.location || vac.modality || "Remoto",
          employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
          formattedSalary,
          isPromoted: !!vac.is_featured,
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleRemoveSaved = (id: string) => {
    setSavedVacancies((prev) => prev.filter((v) => v.id !== id));
    showToast("Vacante removida de tus favoritos");
  };

  return (
    <div className="flex-grow min-h-screen bg-white dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-3 pb-24 md:pb-10 max-w-3xl mx-auto w-full animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[12px] text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AppBar */}
      <div className="flex items-center justify-between py-3 border-b border-transparent">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-[36px] h-[36px] bg-[#f5f7fa] dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        <h1 className="text-[17px] font-[800] text-[#1f2732] dark:text-zinc-100 text-center tracking-[-0.4px]">
          Vacantes Guardadas
        </h1>

        <div className="w-9" />
      </div>

      {/* Main Content Area */}
      <div className="pt-3">
        {isLoading ? (
          /* Skeleton Loader */
          <div className="space-y-3.5 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] flex items-center gap-3.5 animate-pulse"
              >
                <div className="w-12 h-12 rounded-[12px] bg-[#ebeef3] dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-3 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError && savedVacancies.length === 0 ? (
          /* Error View */
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <WifiOff className="w-10 h-10 text-rose-500" />
            <h3 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100">
              Error al sincronizar guardados
            </h3>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-relaxed">
              No pudimos conectar con Supabase para recuperar tus empleos guardados.
            </p>
            <Button
              onClick={fetchSavedVacancies}
              className="mt-2 bg-[#1f2732] hover:bg-[#2f3c4b] text-white rounded-[12px] text-xs font-bold px-5 py-2.5 flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        ) : savedVacancies.length === 0 ? (
          /* Empty State View (_EmptySavedJobsView) */
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#f5f7fa] dark:bg-zinc-900 flex items-center justify-center text-[#7d99b3] shrink-0">
              <Bookmark className="w-9 h-9 stroke-[1.75]" />
            </div>

            <h3 className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-100 max-w-xs leading-snug">
              Sin vacantes guardadas
            </h3>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-[1.45] text-center">
              Guarda las ofertas de empleo que te interesen tocando el icono de guardado para revisarlas y postularte más tarde.
            </p>

            <Button
              onClick={() => router.push("/dashboard/candidate/discovery")}
              className="mt-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[16px] text-xs font-bold px-6 py-3 transition-all cursor-pointer active:scale-95 border-none"
            >
              Explorar vacantes
            </Button>
          </div>
        ) : (
          /* Populated List */
          <div className="space-y-4">
            {/* Header counter row */}
            <div className="flex items-center justify-between py-2">
              <h2 className="text-[14px] font-bold text-[#2f3c4b] dark:text-zinc-200">
                Tus empleos guardados
              </h2>
              <div className="px-2.5 py-1 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[12px]">
                <span className="text-[12px] font-bold text-[#3e546d] dark:text-zinc-300">
                  {savedVacancies.length} guardadas
                </span>
              </div>
            </div>

            {/* List of Cards */}
            <div className="space-y-3.5">
              {savedVacancies.map((vacancy) => (
                <div
                  key={vacancy.id}
                  onClick={() => router.push(`/dashboard/candidate/discovery?jobId=${vacancy.id}`)}
                  className={`p-4 rounded-[16px] space-y-3 transition-all cursor-pointer ${
                    vacancy.isPromoted
                      ? "bg-[#2f3c4b] dark:bg-fiord-950 text-white shadow-md"
                      : "bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 text-[#1f2732]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-[44px] h-[44px] rounded-[12px] flex items-center justify-center shrink-0 ${
                        vacancy.isPromoted ? "bg-[#344558] text-white" : "bg-[#ebeef3] dark:bg-zinc-800 text-[#3e546d]"
                      }`}>
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-[15px] font-bold tracking-[-0.3px] truncate ${
                          vacancy.isPromoted ? "text-white" : "text-[#1f2732] dark:text-zinc-100"
                        }`}>
                          {vacancy.title}
                        </h3>
                        <p className={`text-[13px] font-medium truncate mt-0.5 ${
                          vacancy.isPromoted ? "text-[#aabccf]" : "text-[#5c7c9b] dark:text-zinc-400"
                        }`}>
                          {vacancy.companyName} • {vacancy.location}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSaved(vacancy.id);
                      }}
                      aria-label="Remover guardado"
                      className="p-1 text-amber-400 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                    >
                      <Bookmark className="w-[22px] h-[22px] fill-amber-400 text-amber-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[13px] font-[800] ${
                      vacancy.isPromoted ? "text-[#d2dbe5]" : "text-[#344558] dark:text-zinc-200"
                    }`}>
                      {vacancy.formattedSalary}
                    </span>

                    <div className={`px-3 py-1 rounded-[8px] text-[12px] font-bold ${
                      vacancy.isPromoted
                        ? "bg-[#344558] text-white"
                        : "bg-[#ebeef3] dark:bg-zinc-800 text-[#344558] dark:text-zinc-200"
                    }`}>
                      {vacancy.employmentType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
