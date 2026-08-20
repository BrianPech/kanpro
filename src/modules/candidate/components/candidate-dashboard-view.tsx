/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Bookmark, 
  RotateCw, 
  CheckCircle2, 
  MapPin, 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  ArrowUpRight, 
  DollarSign, 
  Building2, 
  Compass, 
  Flame, 
  Clock, 
  ChevronRight,
  Navigation,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { CandidateDashboardData, VacancyItem } from "@/modules/candidate/services/candidate-dashboard";
import { cn } from "@/lib/utils";

export interface CandidateDashboardViewProps {
  initialData: CandidateDashboardData;
}

const CATEGORY_CHIPS = [
  "Todos",
  "Tecnología",
  "Administración",
  "Ventas y Comercial",
  "Hotelería y Turismo",
  "Operaciones",
  "Atención al Cliente",
  "Salud",
];

export function CandidateDashboardView({
  initialData,
}: CandidateDashboardViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<"nearby" | "salary" | "recent">("nearby");

  const candidateProfile = initialData?.profile;
  const candidateLocation = candidateProfile?.location || "";
  const rawFeaturedVacancies = initialData?.featuredVacancies || [];
  const rawNearbyVacancies = initialData?.nearbyVacancies || [];

  // Load saved vacancies for the authenticated candidate on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSavedVacancies() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: savedData, error } = await supabase
          .from("saved_vacancies")
          .select("vacancy_id")
          .eq("candidate_id", user.id);

        if (error) {
          console.error("Error loading saved vacancies:", error);
          return;
        }

        if (savedData && isMounted) {
          setSavedJobIds(new Set(savedData.map((r: any) => r.vacancy_id)));
        }
      } catch (err) {
        console.error("Error fetching saved job ids:", err);
      }
    }

    loadSavedVacancies();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const toggleBookmark = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Inicia sesión para guardar vacantes");
        return;
      }

      const isCurrentlySaved = savedJobIds.has(id);

      // Optimistic update
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      if (isCurrentlySaved) {
        const { error } = await supabase
          .from("saved_vacancies")
          .delete()
          .eq("candidate_id", user.id)
          .eq("vacancy_id", id);

        if (error) {
          console.error("Error removing saved vacancy:", error);
          setSavedJobIds((prev) => new Set(prev).add(id));
          toast.error("Error al remover de guardados");
          return;
        }

        toast.info("Empleo removido de tus guardados");
      } else {
        const { error } = await supabase
          .from("saved_vacancies")
          .insert({
            candidate_id: user.id,
            vacancy_id: id,
          });

        if (error) {
          console.error("Error saving vacancy:", error);
          setSavedJobIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.error("Error al guardar el empleo");
          return;
        }

        toast.success("Empleo guardado en favoritos");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Error al actualizar la lista de guardados");
    }
  };

  const handleCardClick = (jobId: string) => {
    router.push(`/dashboard/candidate/vacancies/${jobId}`);
  };

  // Filter & Sort nearby vacancies dynamically
  const filteredVacancies = useMemo(() => {
    let list = [...rawNearbyVacancies];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((job) => {
        return (
          job.title.toLowerCase().includes(query) ||
          job.companyName.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query) ||
          (job.skills && job.skills.some((s) => s.toLowerCase().includes(query)))
        );
      });
    }

    // Category filter
    if (selectedCategory !== "Todos") {
      list = list.filter((job) =>
        job.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === "Tecnología" && job.category.toLowerCase().includes("tech")) ||
        (selectedCategory === "Hotelería y Turismo" && (job.category.toLowerCase().includes("turismo") || job.category.toLowerCase().includes("hotel")))
      );
    }

    // Sort selection
    if (sortBy === "salary") {
      list.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    } else if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      // By proximity (default pre-sorted by Haversine in server)
    }

    return list;
  }, [rawNearbyVacancies, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* ── 0. HERO SEARCH & LOCATION RADAR BAR ── */}
      <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden bg-radial-[at_top_right] from-primary/5 via-card to-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Compass className="size-3.5 animate-pulse" />
                Radar K&apos;anPro Activo
              </span>
              {candidateLocation && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
                  <MapPin className="size-3 text-primary shrink-0" />
                  {candidateLocation}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Encuentra tu próximo empleo en el Sureste
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Vacantes verificadas con salario real, prestaciones y cercanía a tu domicilio.
            </p>
          </div>

          <Link href="/dashboard/candidate/discovery" className="shrink-0">
            <Button className="rounded-xl px-5 py-2.5 font-bold shadow-xs hover:shadow-md transition-all gap-2 w-full md:w-auto">
              <Sparkles className="size-4" />
              Explorar Todas
            </Button>
          </Link>
        </div>

        {/* Live Filter Bar */}
        <div className="mt-5 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por puesto, empresa, zona o habilidad..."
              className="w-full bg-background border border-input rounded-xl pl-10 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips Scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            {CATEGORY_CHIPS.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 1. FEATURED SECTION (VACANTES DESTACADAS) ── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Vacantes destacadas
              </h2>
            </div>
          </div>
          
          <Link 
            href="/dashboard/candidate/discovery" 
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group py-1"
          >
            Ver catálogo completo
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Featured Content Carousel / Grid */}
        {rawFeaturedVacancies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rawFeaturedVacancies.map((job) => (
              <Card 
                key={job.id}
                onClick={() => handleCardClick(job.id)}
                className="group relative bg-card text-card-foreground border border-border/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer overflow-hidden bg-radial-[at_top_right] from-amber-500/5 via-transparent to-transparent"
              >
                <div>
                  {/* Top Badge & Bookmark */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      <Sparkles className="size-3" />
                      Destacada
                    </span>

                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                      aria-label="Guardar vacante"
                      className="text-muted-foreground hover:text-amber-500 p-1.5 shrink-0 transition-colors cursor-pointer rounded-lg hover:bg-muted/80"
                    >
                      <Bookmark className={cn("size-4.5 transition-transform active:scale-90", savedJobIds.has(job.id) ? "fill-amber-500 text-amber-500" : "")} />
                    </button>
                  </div>

                  {/* Company & Title */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="size-11 rounded-xl bg-muted/80 flex items-center justify-center text-foreground shrink-0 font-bold text-sm overflow-hidden border border-border shadow-2xs group-hover:scale-105 transition-transform">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-xs font-black text-primary">
                          {job.companyName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-muted-foreground truncate flex items-center gap-1.5">
                        {job.companyName}
                        <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                      </h4>
                      <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors mt-0.5">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  {/* Pills Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                      <MapPin className="size-3 text-primary shrink-0" />
                      <span className="truncate max-w-[140px]">{job.location}</span>
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                      {job.employmentType}
                    </span>
                  </div>
                </div>

                {/* Footer: Salary & Action */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
                      Salario ofrecido
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {job.formattedSalary}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    Ver vacante
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty Featured Card */
          <Card className="w-full bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xs">
            <p className="text-sm font-medium text-muted-foreground text-center">
              No hay vacantes destacadas en este momento.
            </p>
          </Card>
        )}
      </section>

      {/* ── 2. NEARBY FEED SECTION (EMPLEOS CERCA DE TI) ── */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Navigation className="size-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Empleos cerca de ti
              </h2>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold rounded-md">
                {filteredVacancies.length} disponibles
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ordenadas por cercanía geográfica a tu ubicación registrada.
            </p>
          </div>

          {/* Sort Selector Buttons */}
          <div className="inline-flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
            <button
              onClick={() => setSortBy("nearby")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                sortBy === "nearby"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="size-3" />
              Más cercanas
            </button>
            <button
              onClick={() => setSortBy("salary")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                sortBy === "salary"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <DollarSign className="size-3" />
              Mayor sueldo
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                sortBy === "recent"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="size-3" />
              Recientes
            </button>
          </div>
        </div>

        {/* Nearby Vacancies List */}
        {filteredVacancies.length > 0 ? (
          <div className="space-y-3">
            {filteredVacancies.map((job) => (
              <Card 
                key={job.id}
                onClick={() => handleCardClick(job.id)}
                className="group bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Left info container */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Company Logo Avatar */}
                  <div className="size-12 rounded-xl bg-muted/80 text-foreground flex items-center justify-center shrink-0 font-black text-sm overflow-hidden border border-border/80 shadow-2xs group-hover:scale-105 transition-transform">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-primary font-black">
                        {job.companyName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Title and details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground truncate">
                        {job.companyName}
                      </span>
                      {job.distanceBadge && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          <Navigation className="size-2.5" />
                          {job.distanceBadge}
                        </span>
                      )}
                      {job.isFeatured && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          ★ Destacada
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
                      {job.title}
                    </h3>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground shrink-0" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>{job.employmentType}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground/80">{job.category}</span>
                    </div>
                  </div>
                </div>

                {/* Right Salary and CTA */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 gap-2">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                      Salario Mensual
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                      {job.formattedSalary}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                      aria-label="Guardar vacante"
                      className="p-2 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer rounded-xl hover:bg-muted border border-border/50"
                    >
                      <Bookmark className={cn("size-4 transition-transform active:scale-90", savedJobIds.has(job.id) ? "fill-amber-500 text-amber-500" : "")} />
                    </button>

                    <Button 
                      size="sm"
                      className="rounded-xl px-3.5 py-1 text-xs font-bold shadow-2xs gap-1 group-hover:bg-primary"
                    >
                      Postularme
                      <ArrowUpRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* End of list confirmation */}
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                Has visto todas las vacantes cercanas disponibles
              </p>
              <Link href="/dashboard/candidate/discovery">
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold mt-1">
                  Explorar todo el catálogo regional
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Modern Empty State */
          <Card className="w-full bg-card border border-border/80 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Compass className="size-7 animate-spin duration-1000" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">
              No hay vacantes con estos filtros
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md leading-relaxed mb-6">
              Intenta buscar con otros términos o limpia los filtros activos para ver todas las oportunidades en Yucatán y Quintana Roo.
            </p>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => { setSearchQuery(""); setSelectedCategory("Todos"); }}
                className="rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Limpiar filtros
              </Button>
              <Link href="/dashboard/candidate/discovery">
                <Button 
                  className="rounded-xl px-4 py-2 text-xs font-bold shadow-xs cursor-pointer gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  Ver todas las vacantes
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>

    </div>
  );
}

