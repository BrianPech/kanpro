/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Bookmark, 
  CheckCircle2, 
  MapPin, 
  Search, 
  Sparkles, 
  ArrowUpRight, 
  DollarSign, 
  Compass, 
  Flame, 
  Clock, 
  ChevronRight,
  Navigation,
  Check,
  X,
  SlidersHorizontal,
  Share2,
  CheckCheck,
  FileCheck2,
  PenTool,
  ArrowRight,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { CandidateDashboardData, VacancyItem } from "@/modules/candidate/services/candidate-dashboard";
import { cn } from "@/lib/utils";
import { ActiveEmployeePortalView } from "./employee/active-employee-portal-view";
import { ForcePasswordChangeAlert } from "./password/force-password-change-alert";

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
  "Logística",
];

const QUICK_ZONES = [
  "Todas las zonas",
  "Mérida",
  "Cancún",
  "Playa del Carmen",
  "Tulum",
  "Remoto",
];

function CandidateJobSeekerDashboardView({
  initialData,
}: CandidateDashboardViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const searchInputId = useId();

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedZone, setSelectedZone] = useState("Todas las zonas");
  const [sortBy, setSortBy] = useState<"nearby" | "salary" | "recent">("nearby");

  const candidateProfile = initialData?.profile;
  const candidateLocation = candidateProfile?.location || "";
  const rawFeaturedVacancies = initialData?.featuredVacancies || [];
  const rawNearbyVacancies = initialData?.nearbyVacancies || [];

  // Load saved vacancies and applied applications for the candidate
  useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: savedData }, { data: appliedData }] = await Promise.all([
          supabase
            .from("saved_vacancies")
            .select("vacancy_id")
            .eq("candidate_id", user.id),
          supabase
            .from("applications")
            .select("vacancy_id")
            .eq("candidate_id", user.id)
        ]);

        if (isMounted) {
          if (savedData) {
            setSavedJobIds(new Set(savedData.map((r: { vacancy_id: string }) => r.vacancy_id)));
          }
          if (appliedData) {
            setAppliedJobIds(new Set(appliedData.map((a: { vacancy_id: string }) => a.vacancy_id)));
          }
        }
      } catch (err) {
        console.error("Error fetching candidate data:", err);
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Bookmark toggle with optimistic updates & notification
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
      toast.error("Error al actualizar favoritos");
    }
  };

  const handleCardClick = (jobId: string) => {
    router.push(`/dashboard/candidate/vacancies/${jobId}`);
  };

  // Quick share handler
  const handleShare = (e: React.MouseEvent, job: VacancyItem) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/candidate/vacancies/${job.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Enlace de vacante copiado al portapapeles");
    } else {
      toast.info(`Enlace: ${url}`);
    }
  };

  // Dynamic filter & sort
  const filteredVacancies = useMemo(() => {
    let list = [...rawNearbyVacancies];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((job) => {
        return (
          job.title.toLowerCase().includes(query) ||
          job.companyName.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query) ||
          (job.zone && job.zone.toLowerCase().includes(query)) ||
          (job.skills && job.skills.some((s) => s.toLowerCase().includes(query)))
        );
      });
    }

    // Category filter
    if (selectedCategory !== "Todos") {
      list = list.filter((job) => {
        const cat = job.category.toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (cat.includes(sel)) return true;
        if (selectedCategory === "Tecnología" && (cat.includes("tech") || cat.includes("software") || cat.includes("it"))) return true;
        if (selectedCategory === "Hotelería y Turismo" && (cat.includes("turismo") || cat.includes("hotel") || cat.includes("restaurante"))) return true;
        return false;
      });
    }

    // Zone filter
    if (selectedZone !== "Todas las zonas") {
      const zoneQuery = selectedZone.toLowerCase();
      list = list.filter((job) => {
        if (selectedZone === "Remoto") {
          return job.location.toLowerCase().includes("remoto") || job.modality?.toLowerCase().includes("remoto");
        }
        return job.location.toLowerCase().includes(zoneQuery) || (job.zone && job.zone.toLowerCase().includes(zoneQuery));
      });
    }

    // Sort selection
    if (sortBy === "salary") {
      list.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    } else if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      // By proximity (pre-calculated with Haversine distance)
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [rawNearbyVacancies, searchQuery, selectedCategory, selectedZone, sortBy]);

  const activeFiltersCount = (selectedCategory !== "Todos" ? 1 : 0) + (selectedZone !== "Todas las zonas" ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("Todos");
    setSelectedZone("Todas las zonas");
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-16 font-sans">
      {/* ── FORCE PASSWORD CHANGE SECURITY ALERT (DIRECT EMPLOYEE CREATION) ── */}
      <ForcePasswordChangeAlert
        forcePasswordChange={Boolean(initialData?.forcePasswordChange)}
      />

      {/* ── PENDING CONTRACT SIGNATURE URGENT ALERT BANNER ── */}
      {(initialData?.pendingContractsCount ?? 0) > 0 && (
        <div className="p-4 sm:p-5 rounded-4xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="size-11 rounded-3xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <FileCheck2 className="size-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  ¡Tienes {initialData.pendingContractsCount} contrato{initialData.pendingContractsCount > 1 ? "s" : ""} laboral pendiente de firma digital!
                </h2>
                <span className="size-2 rounded-full bg-primary animate-ping" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Una empresa ha formalizado tu contratación conforme a la Ley Federal del Trabajo. Revisa las cláusulas y estampa tu firma legal.
              </p>
            </div>
          </div>

          <Link href="/dashboard/candidate/contracts" className="shrink-0 w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-9 px-4 rounded-4xl text-xs font-semibold gap-2 cursor-pointer shadow-xs">
              <PenTool className="size-3.5" />
              <span>Revisar y Firmar Contrato</span>
              <ArrowRight className="size-3.5 ml-0.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* ── 0. MINIMALIST SEARCH & EXPLORATION HEADER ── */}
      <div className="space-y-3">
        {candidateProfile?.is_early_access && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1 rounded-3xl shadow-2xs"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Candidato Pionero • Acceso Anticipado</span>
            </Badge>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Minimalist Search Input */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">
              Buscar por puesto, empresa, zona o habilidad
            </label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/dashboard/candidate/discovery?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="Buscar por puesto, empresa, zona o habilidad..."
              className="h-9 rounded-3xl bg-input/50 border-input pl-10 pr-10 text-xs sm:text-sm placeholder:text-muted-foreground shadow-2xs focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Explore Catalog CTA */}
          <Link
            href={searchQuery.trim() ? `/dashboard/candidate/discovery?q=${encodeURIComponent(searchQuery.trim())}` : "/dashboard/candidate/discovery"}
            className="shrink-0"
          >
            <Button
              className="h-9 px-4 rounded-4xl text-xs sm:text-sm font-semibold gap-2 shadow-xs cursor-pointer w-full sm:w-auto"
            >
              <Sparkles className="size-4" />
              Explorar catálogo completo
            </Button>
          </Link>
        </div>

        {/* Minimalist Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar pt-1" role="tablist" aria-label="Categorías de empleo">
          {CATEGORY_CHIPS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Badge
                key={cat}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "h-9 px-3.5 rounded-3xl text-xs font-medium cursor-pointer transition-all shadow-2xs select-none inline-flex items-center",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/70"
                )}
              >
                {cat}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* ── 1. FEATURED CAROUSEL SECTION (VACANTES DESTACADAS) ── */}
      {rawFeaturedVacancies.length > 0 && (
        <section className="space-y-4" aria-labelledby="featured-vacancies-heading">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <Flame className="size-4 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <h2 id="featured-vacancies-heading" className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Vacantes destacadas
                </h2>
                <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 rounded-3xl">
                  ★ Premium
                </Badge>
              </div>
            </div>
            
            <Link 
              href="/dashboard/candidate/discovery" 
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group py-1"
            >
              Ver todas
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Premium Carousel with Embla and Shadcn Tokens */}
          <Carousel
            opts={{
              align: "start",
              loop: rawFeaturedVacancies.length > 3,
            }}
            className="w-full relative"
          >
            <CarouselContent className="-ml-3 sm:-ml-4">
              {rawFeaturedVacancies.map((job) => {
                const isSaved = savedJobIds.has(job.id);
                const isApplied = appliedJobIds.has(job.id);
                const companyInitials = job.companyName ? job.companyName.substring(0, 2).toUpperCase() : "EM";

                return (
                  <CarouselItem key={job.id} className="pl-3 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <div
                      onClick={() => handleCardClick(job.id)}
                      className="relative bg-card border border-border/70 hover:border-border hover:bg-muted/30 rounded-4xl p-5 flex flex-col justify-between shadow-2xs transition-colors duration-150 cursor-pointer h-full select-none"
                    >
                      <div className="space-y-3.5">
                        {/* Top Status Tags & Bookmark Button */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="gap-1 text-[11px] font-semibold bg-primary/10 text-primary border-primary/20 rounded-3xl px-2.5 py-0.5"
                            >
                              <Sparkles className="size-3 text-primary" />
                              Destacada
                            </Badge>
                            {isApplied && (
                              <Badge
                                variant="outline"
                                className="gap-1 text-[11px] font-semibold bg-primary/15 text-primary border-primary/30 rounded-3xl px-2.5 py-0.5"
                              >
                                <CheckCheck className="size-3 text-primary" />
                                Postulado
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleShare(e, job)}
                              aria-label={`Compartir vacante ${job.title}`}
                              className="text-muted-foreground hover:text-foreground size-9 sm:size-8 flex items-center justify-center rounded-2xl hover:bg-muted transition-colors cursor-pointer"
                            >
                              <Share2 className="size-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                              aria-label={isSaved ? `Remover ${job.title} de guardados` : `Guardar ${job.title}`}
                              className="text-muted-foreground hover:text-primary size-9 sm:size-8 flex items-center justify-center rounded-2xl hover:bg-muted transition-colors cursor-pointer"
                            >
                              <Bookmark className={cn("size-4 transition-transform active:scale-90", isSaved ? "fill-primary text-primary" : "")} />
                            </button>
                          </div>
                        </div>

                        {/* Company Branding & Job Title */}
                        <div className="flex items-start gap-3">
                          <Avatar className="size-11 rounded-3xl ring-1 ring-border/60 shrink-0 shadow-2xs">
                            {job.companyLogo ? (
                              <AvatarImage src={job.companyLogo} alt={job.companyName} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="rounded-3xl font-bold text-xs bg-muted text-foreground">
                              {companyInitials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground truncate flex items-center gap-1">
                              {job.companyName}
                              <CheckCircle2 className="size-3 text-primary shrink-0" />
                            </p>
                            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight line-clamp-2 mt-0.5">
                              {job.title}
                            </h3>
                          </div>
                        </div>

                        {/* Pills (Location, Distance, Modality) */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <Badge variant="secondary" className="gap-1 text-[11px] font-medium py-0.5 px-2.5 rounded-3xl bg-muted/60 text-muted-foreground border-border/60">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate max-w-[130px]">{job.location}</span>
                          </Badge>

                          {job.distanceBadge && (
                            <Badge variant="secondary" className="gap-1 text-[11px] font-semibold py-0.5 px-2.5 rounded-3xl bg-primary/10 text-primary border-primary/20">
                              <Navigation className="size-2.5 shrink-0" />
                              {job.distanceBadge}
                            </Badge>
                          )}

                          <Badge variant="secondary" className="text-[11px] font-medium py-0.5 px-2.5 rounded-3xl bg-muted/60 text-muted-foreground border-border/60">
                            {job.employmentType}
                          </Badge>
                        </div>
                      </div>

                      {/* Footer: Salary & CTA */}
                      <div className="pt-3.5 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                            Sueldo mensual
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground">
                            {job.formattedSalary}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          className="h-9 px-3.5 rounded-4xl text-xs font-semibold gap-1 shadow-2xs cursor-pointer"
                        >
                          Ver vacante
                          <ArrowUpRight className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {rawFeaturedVacancies.length > 2 && (
              <>
                <CarouselPrevious className="hidden sm:flex -left-3.5" />
                <CarouselNext className="hidden sm:flex -right-3.5" />
              </>
            )}
          </Carousel>
        </section>
      )}

      {/* ── 2. NEARBY FEED SECTION (EMPLEOS CERCA DE TI) ── */}
      <section className="space-y-4 pt-2" aria-labelledby="nearby-vacancies-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <Navigation className="size-4" />
              </div>
              <h2 id="nearby-vacancies-heading" className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Empleos cerca de ti
              </h2>
              <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {filteredVacancies.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ordenadas por cercanía geográfica y compatibilidad con tu perfil.
            </p>
          </div>

          {/* Controls: Sorting */}
          <div className="flex items-center gap-1 bg-card border border-border/70 p-1 rounded-3xl shadow-2xs self-start sm:self-auto" role="group" aria-label="Ordenar vacantes">
            <Button
              variant={sortBy === "nearby" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("nearby")}
              className={cn(
                "h-7 text-xs rounded-3xl px-2.5 font-medium gap-1 cursor-pointer transition-all",
                sortBy === "nearby" ? "shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="size-3" />
              Cercanía
            </Button>
            <Button
              variant={sortBy === "salary" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("salary")}
              className={cn(
                "h-7 text-xs rounded-3xl px-2.5 font-medium gap-1 cursor-pointer transition-all",
                sortBy === "salary" ? "shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <DollarSign className="size-3" />
              Sueldo
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className={cn(
                "h-7 text-xs rounded-3xl px-2.5 font-medium gap-1 cursor-pointer transition-all",
                sortBy === "recent" ? "shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="size-3" />
              Recientes
            </Button>
          </div>
        </div>

        {/* Nearby Vacancies List Feed */}
        {filteredVacancies.length > 0 ? (
          <div className="space-y-3">
            {filteredVacancies.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              const isApplied = appliedJobIds.has(job.id);
              const companyInitials = job.companyName ? job.companyName.substring(0, 2).toUpperCase() : "EM";

              return (
                <div
                  key={job.id}
                  onClick={() => handleCardClick(job.id)}
                  className="bg-card border border-border/70 hover:border-border hover:bg-muted/30 rounded-4xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs transition-colors duration-150 cursor-pointer relative overflow-hidden"
                >
                  {/* Left Column: Avatar + Main Metadata */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Company Avatar */}
                    <Avatar className="size-12 rounded-3xl ring-1 ring-border/60 shrink-0 shadow-2xs">
                      {job.companyLogo ? (
                        <AvatarImage src={job.companyLogo} alt={job.companyName} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="rounded-3xl font-bold text-xs bg-muted text-foreground">
                        {companyInitials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Job Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground truncate flex items-center gap-1">
                          {job.companyName}
                          <CheckCircle2 className="size-3 text-primary shrink-0" />
                        </span>

                        {job.distanceBadge && (
                          <Badge variant="secondary" className="gap-1 text-[11px] font-semibold py-0.5 px-2 bg-primary/10 text-primary border-primary/20">
                            <Navigation className="size-2.5 shrink-0" />
                            {job.distanceBadge}
                          </Badge>
                        )}

                        {job.isFeatured && (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 rounded-3xl px-2.5 py-0.5">
                            ★ Destacada
                          </Badge>
                        )}

                        {isApplied && (
                          <Badge variant="outline" className="gap-1 text-[10px] font-semibold bg-primary/15 text-primary border-primary/30 rounded-3xl px-2.5 py-0.5">
                            <CheckCheck className="size-3 text-primary" />
                            Postulado
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
                        {job.title}
                      </h3>

                      {/* Details row with pills */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap pt-0.5">
                        <Badge variant="secondary" className="gap-1 text-[11px] font-medium py-0.5 px-2 bg-muted/60 text-muted-foreground border-border/60">
                          <MapPin className="size-3 shrink-0" />
                          {job.location}
                        </Badge>
                        <Badge variant="secondary" className="text-[11px] font-medium py-0.5 px-2 bg-muted/60 text-muted-foreground border-border/60">
                          {job.employmentType}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] font-medium py-0.5 px-2 text-muted-foreground border-border/60">
                          {job.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Salary, Bookmark & CTA */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/60 gap-3">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                        Sueldo mensual
                      </span>
                      <span className="text-sm sm:text-base font-bold font-mono text-foreground">
                        {job.formattedSalary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                        aria-label={isSaved ? `Remover ${job.title} de guardados` : `Guardar ${job.title}`}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-2xl hover:bg-muted border border-border/70 shadow-2xs"
                      >
                        <Bookmark className={cn("size-4 transition-transform active:scale-90", isSaved ? "fill-primary text-primary" : "")} />
                      </button>

                      <Button 
                        size="sm"
                        className="h-9 px-4 rounded-4xl text-xs font-semibold shadow-2xs gap-1.5 cursor-pointer"
                      >
                        {isApplied ? "Ver postulación" : "Ver vacante"}
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* End of results banner */}
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Has visto todas las vacantes cercanas según tus filtros
              </p>
              <Link href="/dashboard/candidate/discovery">
                <Button variant="outline" size="sm" className="h-9 rounded-4xl text-xs font-medium mt-1 border-border/70 shadow-2xs cursor-pointer">
                  Explorar todo el catálogo regional
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-4xl bg-card border border-border/70 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="size-14 rounded-3xl bg-muted text-foreground flex items-center justify-center mb-4 border border-border/70 shadow-2xs">
              <Compass className="size-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              No se encontraron vacantes con estos filtros
            </h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
              Intenta buscar con otros términos o limpia los filtros activos para ver todas las oportunidades en Yucatán y Quintana Roo.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button 
                variant="outline"
                onClick={clearAllFilters}
                className="h-9 px-4 rounded-4xl border-border/70 text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Limpiar filtros
              </Button>
              <Link href="/dashboard/candidate/discovery">
                <Button 
                  className="h-9 px-4 rounded-4xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  Ver todas las vacantes
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}

export function CandidateDashboardView({
  initialData,
}: CandidateDashboardViewProps) {
  if (initialData?.activeEmployment) {
    return (
      <ActiveEmployeePortalView
        employment={initialData.activeEmployment}
        initialData={initialData}
      />
    );
  }

  return <CandidateJobSeekerDashboardView initialData={initialData} />;
}


