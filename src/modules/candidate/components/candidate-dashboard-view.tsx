"use client";

import * as React from "react";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Building2, 
  ChevronRight,
  Compass,
  ArrowRight,
  User,
  AlertCircle,
  Search,
  Check,
  MessageCircle,
  ExternalLink,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { CandidateDashboardData, CandidateApplication } from "../services/candidate-dashboard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CandidateDashboardViewProps {
  initialData: CandidateDashboardData;
}

export function CandidateDashboardView({ initialData }: CandidateDashboardViewProps) {
  const { profile, applications, stats } = initialData;
  
  // States for interactive filters and search
  const [selectedFilter, setSelectedFilter] = React.useState<string>("Todas");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Sheet State for Application Details
  const [selectedApp, setSelectedApp] = React.useState<CandidateApplication | null>(null);
  const [isAppSheetOpen, setIsAppSheetOpen] = React.useState<boolean>(false);

  // Filter and search logic
  const filteredApplications = React.useMemo(() => {
    return applications.filter((app) => {
      // Filter by status
      const matchesStatus = 
        selectedFilter === "Todas" || 
        (selectedFilter === "Pendientes" && app.status === "Pendiente") ||
        (selectedFilter === "En Revisión" && (app.status === "En revisión" || app.status === "Preseleccionado")) ||
        (selectedFilter === "Contratados" && app.status === "Contratado") ||
        (selectedFilter === "Descartados" && app.status === "Descartado");

      // Filter by search text (position or company)
      const matchesSearch = 
        app.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [applications, selectedFilter, searchQuery]);

  const candidateName = profile?.full_name || "Candidato";

  const handleOpenAppDetails = (app: CandidateApplication) => {
    setSelectedApp(app);
    setIsAppSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-10 lg:p-12 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#fafafc] dark:bg-zinc-950">
      
      {/* Welcome & Profile Status Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card (Revolut primary colors) */}
        <section className="lg:col-span-2 bg-gradient-to-br from-[#494fdf] via-[#4f55f1] to-[#3a40c4] text-white rounded-[28px] p-6 md:p-10 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[280px]">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-white/80">Panel de Candidato Activo</span>
            </div>
            <h1 className="text-[32px] md:text-[44px] font-bold tracking-tight leading-tight mb-3">
              Hola, {candidateName}.
            </h1>
            <p className="text-[14px] md:text-[16px] text-white/95 leading-relaxed max-w-[480px]">
              Tu perfil está activo en nuestra plataforma de emparejamiento con IA. Hay nuevas empresas buscando tus habilidades hoy.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 mt-6">
            <Link href="/dashboard/candidate/discovery">
              <Button className="h-[44px] rounded-full bg-white text-[#494fdf] hover:bg-white/95 text-[14px] font-bold px-6 shadow-xs transition-all duration-300 gap-2 group border-none">
                Explorar Empleos
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            {profile?.is_validated ? (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Perfil Validado y Visible
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-full text-xs font-semibold text-amber-200">
                <AlertCircle className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                Perfil en Proceso de Validación
              </div>
            )}
          </div>

          {/* Decorative blur elements */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/20 rounded-full blur-3xl pointer-events-none"></div>
        </section>

        {/* Profile Completion Card */}
        {profile && (
          <section className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[28px] p-6 md:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Tu Perfil</h3>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-[#494fdf]/10 text-[#494fdf] rounded-full uppercase tracking-wider">
                  Fase {profile.completionScore === 100 ? "Completada" : "Inicial"}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">{profile.completionScore}%</span>
                <span className="text-xs font-medium text-muted-foreground">completado</span>
              </div>

              {/* Custom Progress Bar */}
              <div className="w-full bg-muted dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-4">
                <div 
                  className="bg-[#494fdf] h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${profile.completionScore}%` }}
                ></div>
              </div>

              <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Información básica añadida</span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-zinc-800 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span className={profile.skills && profile.skills.length > 0 ? "" : "text-foreground font-semibold"}>
                    Habilidades e IA Tags
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.completionScore >= 80 ? (
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-zinc-800 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span className={profile.completionScore >= 80 ? "" : "text-foreground font-semibold"}>
                    Historial de Experiencia y CV
                  </span>
                </div>
              </div>
            </div>

            {profile.completionScore < 100 && (
              <Link href="/dashboard/candidate/settings" className="mt-6 block w-full">
                <Button variant="outline" className="w-full h-11 rounded-full text-xs font-bold border-[#494fdf]/20 hover:border-[#494fdf]/40 text-[#494fdf] hover:bg-[#494fdf]/5 gap-2">
                  <User className="h-4 w-4" />
                  Completar Perfil
                </Button>
              </Link>
            )}
          </section>
        )}
      </div>

      {/* Activity Summary Metrics */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Resumen de Actividad</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Metrics Card 1 */}
          <Card className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Postulaciones</span>
              <div className="h-8 w-8 rounded-lg bg-[#494fdf]/10 text-[#494fdf] flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">{stats.total}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Enviadas a empresas</p>
            </div>
          </Card>

          {/* Metrics Card 2 */}
          <Card className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">En Revisión</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">{stats.reviewing}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Evaluadas actualmente</p>
            </div>
          </Card>

          {/* Metrics Card 3 */}
          <Card className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Contratado</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-foreground">{stats.hired}</h3>
              <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">
                {stats.hired > 0 ? "¡Felicidades!" : "Buscando contratación"}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Main Content Area: Applications */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Historial de Aplicaciones</h2>
            <p className="text-xs text-muted-foreground mt-1">Monitorea el estado y haz seguimiento directo con las empresas.</p>
          </div>
          <Link href="/dashboard/candidate/discovery">
            <Button variant="ghost" className="h-9 rounded-full text-xs font-bold text-[#494fdf] hover:bg-[#494fdf]/5 hover:text-[#494fdf] gap-1 px-4">
              <Compass className="h-4 w-4" />
              Explorar nuevos empleos
            </Button>
          </Link>
        </div>

        {/* Interactive Search & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 order-2 lg:order-1">
            {["Todas", "Pendientes", "En Revisión", "Contratados", "Descartados"].map((filterName) => (
              <button
                key={filterName}
                onClick={() => setSelectedFilter(filterName)}
                className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
                  selectedFilter === filterName
                    ? "bg-[#494fdf] text-white shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-muted-foreground border border-black/5 dark:border-white/5 hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {filterName}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 order-1 lg:order-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Buscar empleo o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-xs text-foreground placeholder-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-[#494fdf]/45 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xs">
            <div className="divide-y divide-border/30">
              {filteredApplications.map((app) => (
                <div 
                  key={app.id} 
                  onClick={() => handleOpenAppDetails(app)}
                  className="p-6 md:p-8 hover:bg-muted/10 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer group"
                >
                  {/* Left block: Company details & position */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#494fdf]/10 to-[#494fdf]/5 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center font-extrabold text-[12px] text-[#494fdf] border border-border/40 shrink-0 shadow-xs">
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.company} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        app.companyInitials
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-foreground group-hover:text-[#494fdf] transition-colors truncate">{app.position}</h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-semibold flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-foreground/75">
                          <Building2 className="h-3.5 w-3.5" />
                          {app.company}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {app.location}
                        </span>
                        <span>·</span>
                        <span>Postulado {app.appliedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Progress & Status */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 lg:self-auto shrink-0 w-full lg:w-auto">

                    {/* Progress slider */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-40">
                      <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                        <span>Reclutamiento</span>
                        <span>{app.progress}%</span>
                      </div>
                      <div className="w-full bg-muted dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#494fdf] h-full rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `${app.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border tracking-wider uppercase shrink-0 ${app.statusColor}`}>
                      {app.statusLabel}
                    </span>

                    {/* Desktop Action */}
                    <Button variant="ghost" size="icon" className="rounded-full hidden lg:flex shrink-0 group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          /* Empty state */
          <Card className="bg-white/50 dark:bg-zinc-900/30 border border-dashed border-border/80 rounded-[28px] p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto w-full shadow-xs animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-full bg-[#494fdf]/10 text-[#494fdf] flex items-center justify-center mb-6">
              <Compass className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No encontramos postulaciones</h3>
            <p className="text-xs text-muted-foreground mt-2.5 max-w-md leading-relaxed">
              {searchQuery || selectedFilter !== "Todas"
                ? "No hay postulaciones que coincidan con los criterios de búsqueda o filtros seleccionados."
                : "Aún no has aplicado a ninguna vacante. Completa tu perfil y explora las vacantes disponibles."}
            </p>
            <div className="mt-6 flex gap-4">
              {(searchQuery || selectedFilter !== "Todas") ? (
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilter("Todas");
                    setSelectedFilter("Todas");
                  }}
                  variant="outline" 
                  className="rounded-full text-xs font-bold px-6 h-10"
                >
                  Limpiar Filtros
                </Button>
              ) : (
                <Link href="/dashboard/candidate/discovery">
                  <Button className="rounded-full text-xs font-bold px-6 h-10 bg-[#494fdf] text-white hover:bg-[#494fdf]/90 border-none">
                    Buscar Empleos
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </section>

      {/* Habilidades Section */}
      {profile?.skills && profile.skills.length > 0 && (
        <section className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[28px] p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Tus Habilidades</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Habilidades cargadas en tu perfil profesional.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted dark:bg-zinc-800 text-foreground text-xs font-semibold rounded-lg border border-border/40 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all duration-200 cursor-default"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Postulation Details Drawer / Sheet */}
      <Sheet open={isAppSheetOpen} onOpenChange={setIsAppSheetOpen}>
        {selectedApp && (
          <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto px-6 py-8 flex flex-col gap-6 bg-card border-l border-border/40 shadow-xl">
            <SheetHeader className="gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#494fdf]/10 to-[#494fdf]/5 text-[#494fdf] flex items-center justify-center font-extrabold text-xs border border-border/30 shadow-xs">
                  {selectedApp.logoUrl ? (
                    <img src={selectedApp.logoUrl} alt={selectedApp.company} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    selectedApp.companyInitials
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{selectedApp.company}</p>
                  <SheetTitle className="text-lg font-bold text-foreground leading-tight mt-0.5">{selectedApp.position}</SheetTitle>
                </div>
              </div>
              <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span>{selectedApp.location}</span>
                <span>·</span>
                <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span>Postulado el {selectedApp.appliedDate}</span>
              </SheetDescription>
            </SheetHeader>



            {/* Recruitment Stage Timeline */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Progreso de Selección</h4>
              
              <div className="relative pl-5 border-l border-border/70 ml-3 py-2 space-y-6">
                
                {/* Stage 1: Recibida */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-xs" />
                  <h5 className="text-xs font-bold text-foreground leading-tight">Postulación Recibida</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Hemos compartido tu currículum digital con la empresa.</p>
                </div>

                {/* Stage 2: En revisión */}
                <div className="relative">
                  <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs ${
                    selectedApp.status === "En revisión" || selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  }`} />
                  <h5 className={`text-xs font-bold leading-tight ${
                    selectedApp.status === "En revisión" || selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}>En Revisión</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">El reclutador está analizando tus datos y tags de habilidades.</p>
                </div>

                {/* Stage 3: Preseleccionado */}
                <div className="relative">
                  <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs ${
                    selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  }`} />
                  <h5 className={`text-xs font-bold leading-tight ${
                    selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}>Preseleccionado (Entrevista)</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">¡Felicidades! Eres apto para el puesto. Puedes agendar entrevista directamente.</p>
                </div>

                {/* Stage 4: Resultado Final */}
                {selectedApp.status === "Contratado" && (
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-xs" />
                    <h5 className="text-xs font-bold text-foreground leading-tight">¡Contratado!</h5>
                    <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">El proceso ha concluido exitosamente. ¡Bienvenido a bordo!</p>
                  </div>
                )}
                
                {selectedApp.status === "Descartado" && (
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-900 shadow-xs" />
                    <h5 className="text-xs font-bold text-rose-500 leading-tight">Proceso Concluido</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">La empresa decidió avanzar con otros candidatos en esta ocasión.</p>
                  </div>
                )}

              </div>
            </div>

            <hr className="border-border/40 mt-auto" />

            {/* Direct WhatsApp Call to Action */}
            {selectedApp.companyPhone && (selectedApp.status === "Preseleccionado" || selectedApp.status === "En revisión" || selectedApp.status === "Pendiente") ? (
              <div className="flex flex-col gap-3 bg-emerald-500/[0.04] border border-emerald-500/15 p-4 rounded-[20px]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Contacto por WhatsApp</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Comunícate directamente con la empresa para coordinar la entrevista o dar seguimiento a tu postulación.
                    </p>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/${selectedApp.companyPhone.replace(/[^0-9]/g, "")}?text=Hola!%20Soy%20${encodeURIComponent(candidateName)},%20me%20postule%20a%20la%20vacante%20de%20${encodeURIComponent(selectedApp.position)}%20en%20K'anPro.`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all gap-2 border-none">
                    Escribir a la Empresa
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            ) : null}

            {/* General Action Button */}
            <Button 
              variant="outline" 
              onClick={() => setIsAppSheetOpen(false)} 
              className="w-full h-11 rounded-full text-xs font-bold"
            >
              Cerrar Detalles
            </Button>
          </SheetContent>
        )}
      </Sheet>

    </div>
  );
}
