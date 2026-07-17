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
    <div className="flex-grow min-h-screen bg-[#fafafa] dark:bg-zinc-950/20 px-4 md:px-10 lg:px-12 py-10 space-y-10 max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
      
      {/* Welcome & Profile Status Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card (Clean off-black / dark slate) */}
        <section className="lg:col-span-2 bg-zinc-900 dark:bg-zinc-900 text-white rounded-xl p-6 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[260px] border border-zinc-850">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 md:mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Panel de Candidato Activo</span>
            </div>
            <h1 className="text-[28px] md:text-[38px] font-bold tracking-tight leading-tight mb-2">
              Hola, {candidateName}.
            </h1>
            <p className="text-[13px] md:text-[14px] text-zinc-400 leading-relaxed max-w-[480px]">
              Tu perfil profesional está activo y visible. El algoritmo de vinculación está buscando vacantes compatibles con tus habilidades hoy.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 mt-6">
            <Link href="/dashboard/candidate/discovery">
              <Button className="h-[40px] rounded-lg bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs font-bold px-5 transition-all duration-200 gap-1.5 group border-none">
                Explorar empleos
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
            {profile?.is_validated ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[11px] font-semibold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Perfil Validado y Visible
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] font-semibold text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                Verificación en Proceso
              </div>
            )}
          </div>
        </section>

        {/* Profile Completion Card */}
        {profile && (
          <section className="bg-white dark:bg-zinc-900 border border-border/10 rounded-xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-400">Tu Perfil</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md uppercase tracking-wider">
                  Fase {profile.completionScore === 100 ? "Completa" : "Inicial"}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1 mt-2 font-mono">
                <span className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{profile.completionScore}%</span>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 font-sans ml-1">completado</span>
              </div>

              {/* Custom Progress Bar */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-4">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${profile.completionScore}%` }}
                ></div>
              </div>

              <div className="mt-5 space-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>Información básica añadida</span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                      <Clock className="h-3 w-3" />
                    </span>
                  )}
                  <span className={profile.skills && profile.skills.length > 0 ? "" : "text-zinc-800 dark:text-zinc-200 font-medium"}>
                    Habilidades e IA Tags
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {profile.completionScore >= 80 ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                      <Clock className="h-3 w-3" />
                    </span>
                  )}
                  <span className={profile.completionScore >= 80 ? "" : "text-zinc-800 dark:text-zinc-200 font-medium"}>
                    Historial de Experiencia y CV
                  </span>
                </div>
              </div>
            </div>

            {profile.completionScore < 100 && (
              <Link href="/dashboard/candidate/settings" className="mt-6 block w-full">
                <Button variant="outline" className="w-full h-10 rounded-lg text-xs font-bold border-border/20 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 gap-2">
                  <User className="h-3.5 w-3.5" />
                  Completar Perfil
                </Button>
              </Link>
            )}
          </section>
        )}
      </div>

      {/* Activity Summary Metrics */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-wider font-bold text-zinc-400">Resumen de Actividad</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Metrics Card 1 */}
          <Card className="bg-white dark:bg-zinc-900 border border-border/10 p-5 rounded-xl flex flex-col justify-between shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Postulaciones</span>
              <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-4 font-mono">
              <h3 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{stats.total}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Enviadas a empresas</p>
            </div>
          </Card>

          {/* Metrics Card 2 */}
          <Card className="bg-white dark:bg-zinc-900 border border-border/10 p-5 rounded-xl flex flex-col justify-between shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">En Revisión</span>
              <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-4 font-mono">
              <h3 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{stats.reviewing}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Evaluadas actualmente</p>
            </div>
          </Card>

          {/* Metrics Card 3 */}
          <Card className="bg-white dark:bg-zinc-900 border border-border/10 p-5 rounded-xl flex flex-col justify-between shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Contratado</span>
              <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-4 font-mono">
              <h3 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{stats.hired}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                {stats.hired > 0 ? "¡Felicidades!" : "Buscando vacantes"}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Main Content Area: Applications */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Historial de Aplicaciones</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Monitorea el estado y haz seguimiento directo con las empresas.</p>
          </div>
          <Link href="/dashboard/candidate/discovery">
            <Button variant="ghost" className="h-9 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 gap-1 px-3">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  selectedFilter === filterName
                    ? "bg-primary text-primary-foreground shadow-none font-bold"
                    : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-border/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {filterName}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 order-1 lg:order-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar empleo o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-white dark:bg-zinc-900 border border-border/10 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <Card className="bg-white dark:bg-zinc-900 border border-border/10 rounded-xl overflow-hidden shadow-none">
            <div className="divide-y divide-border/10">
              {filteredApplications.map((app) => (
                <div 
                  key={app.id} 
                  onClick={() => handleOpenAppDetails(app)}
                  className="p-5 md:p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer group"
                >
                  {/* Left block: Company details & position */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px] text-zinc-600 dark:text-zinc-400 border border-border/10 shrink-0 shadow-none">
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.company} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        app.companyInitials
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-650 dark:group-hover:text-zinc-200 transition-colors truncate">{app.position}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-medium flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                          <Building2 className="h-3 w-3" />
                          {app.company}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {app.location}
                        </span>
                        <span>·</span>
                        <span>Postulado el {app.appliedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Progress & Status */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 lg:self-auto shrink-0 w-full lg:w-auto">

                    {/* Progress slider */}
                    <div className="flex flex-col gap-1 w-full sm:w-36">
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 font-mono">
                        <span className="font-sans">Reclutamiento</span>
                        <span>{app.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-150 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-700 ease-out" 
                          style={{ width: `${app.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md border tracking-wider uppercase shrink-0 ${app.statusColor.replace("rounded-full", "rounded-md")}`}>
                      {app.statusLabel}
                    </span>

                    {/* Desktop Action */}
                    <Button variant="ghost" size="icon" className="rounded-full hidden lg:flex shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          /* Empty state */
          <Card className="bg-zinc-50/20 dark:bg-zinc-900/10 border border-dashed border-border/10 rounded-xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto w-full shadow-none animate-in fade-in duration-300">
            <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-6">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">No encontramos postulaciones</h3>
            <p className="text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">
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
                  }}
                  variant="outline" 
                  className="rounded-lg text-xs font-bold px-5 h-9"
                >
                  Limpiar Filtros
                </Button>
              ) : (
                <Link href="/dashboard/candidate/discovery">
                  <Button className="rounded-lg text-xs font-bold px-5 h-9 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 border-none">
                    Buscar empleos
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </section>

      {/* Habilidades Section */}
      {profile?.skills && profile.skills.length > 0 && (
        <section className="bg-white dark:bg-zinc-900 border border-border/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Tus Habilidades</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Habilidades cargadas en tu perfil profesional.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 text-xs font-medium rounded-md border border-border/10 cursor-default"
              >
                <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Postulation Details Drawer / Sheet */}
      <Sheet open={isAppSheetOpen} onOpenChange={setIsAppSheetOpen}>
        {selectedApp && (
          <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto px-6 py-8 flex flex-col gap-6 bg-white dark:bg-zinc-900 border-l border-border/10 shadow-xl rounded-l-2xl">
            <SheetHeader className="gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-650 flex items-center justify-center font-bold text-xs border border-border/10 shadow-none">
                  {selectedApp.logoUrl ? (
                    <img src={selectedApp.logoUrl} alt={selectedApp.company} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    selectedApp.companyInitials
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{selectedApp.company}</p>
                  <SheetTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight mt-0.5">{selectedApp.position}</SheetTitle>
                </div>
              </div>
              <SheetDescription className="text-xs text-zinc-400 flex items-center gap-2 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{selectedApp.location}</span>
                <span>·</span>
                <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
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
                  <Button className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all gap-2 border-none">
                    Escribir a la Empresa
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            ) : null}

            {/* General Action Button */}
            <Button 
              variant="outline" 
              onClick={() => setIsAppSheetOpen(false)} 
              className="w-full h-10 rounded-lg text-xs font-bold"
            >
              Cerrar Detalles
            </Button>
          </SheetContent>
        )}
      </Sheet>

    </div>
  );
}
