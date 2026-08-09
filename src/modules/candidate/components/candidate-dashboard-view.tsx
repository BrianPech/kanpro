"use client";

import * as React from "react";
import { 
  Briefcase, 
  CheckCircle2, 
  RotateCw,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { CandidateDashboardData } from "../services/candidate-dashboard";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CandidateDashboardViewProps {
  initialData: CandidateDashboardData;
}

export function CandidateDashboardView({ initialData }: CandidateDashboardViewProps) {
  const { profile, featuredVacancies = [], nearbyVacancies = [] } = initialData;
  const supabase = createClient();

  // Saved Job IDs State with Supabase sync
  const [savedJobIds, setSavedJobIds] = React.useState<Set<string>>(new Set());

  // Fetch initial saved jobs on mount
  React.useEffect(() => {
    async function loadSavedJobs() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("saved_vacancies")
            .select("vacancy_id")
            .eq("candidate_id", user.id);
          
          if (data) {
            setSavedJobIds(new Set(data.map((row: any) => row.vacancy_id)));
          }
        }
      } catch (err) {
        console.error("Error loading candidate saved vacancies:", err);
      }
    }
    loadSavedJobs();
  }, [supabase]);

  // Toggle bookmark / saved job with database persistence
  const toggleBookmark = async (vacancyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Inicia sesión para guardar vacantes.");
        return;
      }

      const isCurrentlySaved = savedJobIds.has(vacancyId);

      // Optimistic state update
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.delete(vacancyId);
        else next.add(vacancyId);
        return next;
      });

      if (isCurrentlySaved) {
        await supabase
          .from("saved_vacancies")
          .delete()
          .eq("candidate_id", user.id)
          .eq("vacancy_id", vacancyId);

        toast.info("Vacante eliminada de guardados");
      } else {
        await supabase
          .from("saved_vacancies")
          .insert({
            candidate_id: user.id,
            vacancy_id: vacancyId
          });

        toast.success("¡Vacante guardada en tus favoritos!");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Error al actualizar la lista de guardados");
    }
  };

  const firstName = profile?.full_name ? profile.full_name.trim().split(" ")[0] : "Candidato";

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex-grow min-h-full bg-fiord-50 dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-4 md:pt-8 pb-10 md:pb-8 space-y-8 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* 1. Top Greeting Header (Only on mobile, handled by Topbar on desktop) */}
      <header className="md:hidden sticky top-0 z-30 bg-fiord-50/95 dark:bg-zinc-950/95 backdrop-blur-md pt-4 sm:pt-6 pb-4 -mx-6 sm:-mx-10 lg:-mx-14 px-6 sm:px-10 lg:px-14 transition-all border-b border-border/10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <h1 className="text-[26px] sm:text-[30px] font-[800] text-[#1f2732] dark:text-fiord-50 tracking-[-0.6px] leading-tight">
              Hola, {firstName}
            </h1>
            <p className="text-[15px] sm:text-[16px] font-[600] text-[#5c7c9b] dark:text-fiord-400 mt-1">
              Descubre nuevas oportunidades hoy
            </p>
          </div>

          {/* Circular Notification Button (Only visible on mobile) */}
          <Link href="/dashboard/candidate/notifications" className="shrink-0 md:hidden">
            <div aria-label="Notificaciones" className="relative cursor-pointer group">
              <div className="w-[50px] h-[50px] bg-white dark:bg-zinc-900 rounded-full border-[1.5px] border-[#ebeef3] dark:border-zinc-800 flex items-center justify-center transition-all group-active:scale-95 shadow-2xs">
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-none stroke-[#344558] dark:stroke-fiord-200 stroke-[2]" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* 2. Featured Section (Vacantes Destacadas) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] sm:text-[22px] font-[800] tracking-[-0.4px] text-[#2f3c4b] dark:text-fiord-50">
            Vacantes destacadas
          </h2>
          <Link 
            href="/dashboard/candidate/discovery" 
            className="text-[15px] sm:text-[16px] font-extrabold text-[#5c7c9b] dark:text-fiord-300 hover:text-[#3e546d] transition-colors py-1 px-2"
          >
            Buscar &gt;
          </Link>
        </div>

        {/* Featured Content (Carousel or Empty Card) */}
        {featuredVacancies.length > 0 ? (
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 snap-x hide-scrollbar">
            {featuredVacancies.map((job) => (
              <div 
                key={job.id}
                onClick={() => window.location.href = `/dashboard/candidate/discovery?jobId=${job.id}`}
                className="w-[295px] sm:w-[320px] shrink-0 bg-[#2f3c4b] dark:bg-fiord-950 text-white rounded-[22px] p-6 flex flex-col justify-between h-[200px] sm:h-[210px] shadow-[0_10px_20px_rgba(31,39,50,0.14)] cursor-pointer hover:bg-[#253240] transition-all snap-start"
              >
                {/* Top Row: Company logo/icon, details and bookmark icon */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-[14px] bg-[#344558] flex items-center justify-center text-white shrink-0 font-bold text-sm overflow-hidden">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover rounded-[14px]" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-bold text-white tracking-[-0.2px] truncate">{job.companyName}</h4>
                      <p className="text-[13px] text-[#aabccf] font-medium truncate mt-0.5">{job.location}</p>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                    aria-label="Guardar vacante"
                    className="text-white hover:text-amber-400 p-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Bookmark className={`w-6 h-6 ${savedJobIds.has(job.id) ? "fill-amber-400 text-amber-400" : "text-white"}`} />
                  </button>
                </div>

                {/* Central Body: Job title */}
                <h3 className="text-[19px] sm:text-[20px] font-[700] text-white tracking-[-0.4px] leading-[1.3] line-clamp-2">
                  {job.title}
                </h3>

                {/* Bottom Footer: employment type and formatted salary */}
                <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-[#d2dbe5]">
                  <span className="font-semibold">{job.employmentType}</span>
                  <span className="text-[#7d99b3]">•</span>
                  <span className="font-bold truncate">{job.formattedSalary}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Featured Card */
          <div className="w-full bg-[#2f3c4b] dark:bg-fiord-950 text-white rounded-[24px] p-8 flex flex-col items-center justify-center text-center min-h-[180px] shadow-sm">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#aabccf] text-[#aabccf]">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </div>
            <p className="text-[15px] sm:text-[16px] font-semibold text-white text-center leading-relaxed">
              No hay vacantes destacadas en este momento
            </p>
          </div>
        )}
      </section>

      {/* 3. Nearby Section (Empleos Cerca de Ti) */}
      <section className="space-y-4 pt-2">
        <h2 className="text-[20px] sm:text-[22px] font-[800] tracking-[-0.4px] text-[#2f3c4b] dark:text-fiord-50">
          Empleos cerca de ti
        </h2>

        {nearbyVacancies.length > 0 ? (
          <div className="space-y-4">
            {nearbyVacancies.map((job) => (
              <div 
                key={job.id}
                onClick={() => window.location.href = `/dashboard/candidate/discovery?jobId=${job.id}`}
                className="bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] p-5 flex items-center justify-between gap-4 shadow-2xs hover:bg-[#ebeef3]/60 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
              >
                {/* Left: Company Icon container */}
                <div className="w-14 h-14 rounded-[14px] bg-[#ebeef3] dark:bg-zinc-800 text-[#3e546d] dark:text-zinc-300 flex items-center justify-center shrink-0 font-bold text-sm overflow-hidden">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover rounded-[14px]" />
                  ) : (
                    <Briefcase className="w-7 h-7 text-[#3e546d] dark:text-zinc-300" />
                  )}
                </div>

                {/* Center: Job Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] sm:text-[18px] font-bold text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px] truncate">{job.title}</h4>
                  <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-semibold truncate mt-1">
                    {job.companyName} • {job.employmentType}
                  </p>
                </div>

                {/* Right: Bookmark and Salary */}
                <div className="flex flex-col items-end justify-center shrink-0 gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                    aria-label="Guardar vacante"
                    className="p-1.5 text-[#7d99b3] hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Bookmark className={`w-6 h-6 ${savedJobIds.has(job.id) ? "fill-amber-400 text-amber-400" : "text-[#7d99b3]"}`} />
                  </button>
                  <span className="text-[13px] sm:text-[14px] font-extrabold text-[#3e546d] dark:text-zinc-300">{job.formattedSalary}</span>
                </div>
              </div>
            ))}

            {/* End of list indicator */}
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-[#aabccf]" />
              <span className="text-[14px] sm:text-[15px] font-bold text-[#7d99b3] tracking-[-0.2px]">
                Has visto todas las vacantes cerca de ti
              </span>
            </div>
          </div>
        ) : (
          /* Empty Nearby Card */
          <div className="w-full bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[24px] p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="mb-4 text-[#7d99b3]">
              <svg viewBox="0 0 24 24" className="w-11 h-11 stroke-current fill-none stroke-[1.75]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 10h4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 13v3a2 2 0 0 1-2 2h-1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m2 2 20 20" />
              </svg>
            </div>
            
            <h3 className="text-[17px] sm:text-[19px] font-bold text-[#1f2732] dark:text-zinc-100 mb-1.5">
              No se encontraron empleos activos cerca
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#5c7c9b] dark:text-zinc-400 text-center max-w-sm leading-relaxed mb-6">
              Vuelve a consultar más tarde o explora en el buscador.
            </p>

            <button 
              onClick={handleRefresh}
              className="rounded-full border border-[#1f2732] dark:border-zinc-300 text-[#1f2732] dark:text-zinc-100 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <RotateCw className="w-5 h-5 text-[#1f2732] dark:text-zinc-100" />
              Actualizar
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
