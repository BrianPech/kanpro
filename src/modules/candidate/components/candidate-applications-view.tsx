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
  User,
  Search,
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

interface CandidateApplicationsViewProps {
  initialData: CandidateDashboardData;
}

export function CandidateApplicationsView({ initialData }: CandidateApplicationsViewProps) {
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
      const matchesStatus = 
        selectedFilter === "Todas" || 
        (selectedFilter === "Pendientes" && app.status === "Pendiente") ||
        (selectedFilter === "En Revisión" && (app.status === "En revisión" || app.status === "Preseleccionado")) ||
        (selectedFilter === "Contratados" && app.status === "Contratado") ||
        (selectedFilter === "Descartados" && app.status === "Descartado");

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
    <div className="flex-grow min-h-screen bg-fiord-50 dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-24 md:pb-10 space-y-7 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[800] text-[#1f2732] dark:text-fiord-50 tracking-[-0.6px]">
            Mis Postulaciones
          </h1>
          <p className="text-[14px] font-[500] text-[#5c7c9b] dark:text-fiord-400 mt-1">
            Seguimiento de procesos de selección activos
          </p>
        </div>
      </div>

      {/* 2. Activity & Profile Completion Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Profile Completion */}
        {profile && (
          <Card className="md:col-span-3 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-wider font-bold text-[#7d99b3]">TU PERFIL PROFESIONAL</h3>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-[#f5f7fa] dark:bg-zinc-800 text-[#3e546d] dark:text-zinc-300 rounded-md uppercase tracking-wider">
                  FASE {profile.completionScore === 100 ? "COMPLETA" : "INICIAL"}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-bold tracking-tight text-[#1f2732] dark:text-zinc-50">{profile.completionScore}%</span>
                <span className="text-xs font-medium text-[#5c7c9b] font-sans ml-1">completado</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#ebeef3] dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-[#2f3c4b] dark:bg-fiord-400 h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${profile.completionScore}%` }}
                ></div>
              </div>
            </div>

            {profile.completionScore < 100 && (
              <Link href="/dashboard/candidate/settings" className="mt-4 block w-full">
                <Button variant="outline" className="w-full h-11 rounded-2xl text-xs font-bold border-[#ebeef3] text-[#1f2732] dark:text-zinc-300 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 gap-2">
                  <User className="h-4 w-4" />
                  Completar Perfil
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Metric 1: Postulaciones */}
        <Card className="bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-5 rounded-3xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#5c7c9b] uppercase tracking-wider">POSTULACIONES</span>
            <div className="h-9 w-9 rounded-xl bg-[#f5f7fa] dark:bg-zinc-800 text-[#3e546d] dark:text-zinc-400 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-[#1f2732] dark:text-zinc-50 font-mono">{stats.total}</h3>
            <p className="text-[11px] text-[#5c7c9b] mt-1 font-sans">Enviadas a empresas</p>
          </div>
        </Card>

        {/* Metric 2: En Revisión */}
        <Card className="bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-5 rounded-3xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#5c7c9b] uppercase tracking-wider">EN REVISIÓN</span>
            <div className="h-9 w-9 rounded-xl bg-[#f5f7fa] dark:bg-zinc-800 text-[#3e546d] dark:text-zinc-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-[#1f2732] dark:text-zinc-50 font-mono">{stats.reviewing}</h3>
            <p className="text-[11px] text-[#5c7c9b] mt-1 font-sans">Evaluadas actualmente</p>
          </div>
        </Card>

        {/* Metric 3: Contratado */}
        <Card className="bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-5 rounded-3xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#5c7c9b] uppercase tracking-wider">CONTRATADO</span>
            <div className="h-9 w-9 rounded-xl bg-[#f5f7fa] dark:bg-zinc-800 text-[#3e546d] dark:text-zinc-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-[#1f2732] dark:text-zinc-50 font-mono">{stats.hired}</h3>
            <p className="text-[11px] text-[#5c7c9b] mt-1 font-sans">
              {stats.hired > 0 ? "¡Felicidades!" : "Buscando vacantes"}
            </p>
          </div>
        </Card>
      </section>

      {/* 3. Historial de Postulaciones */}
      <section className="flex flex-col gap-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ebeef3] dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#1f2732] dark:text-zinc-50">Historial de Aplicaciones</h2>
            <p className="text-xs text-[#5c7c9b] dark:text-zinc-400 mt-0.5">Monitorea el estado y haz seguimiento directo con las empresas.</p>
          </div>
          <Link href="/dashboard/candidate/discovery">
            <Button variant="ghost" className="h-9 rounded-xl text-xs font-bold text-[#3e546d] dark:text-zinc-300 hover:bg-[#ebeef3]/50 dark:hover:bg-zinc-800 gap-1.5 px-3">
              <Compass className="h-4 w-4 text-[#5c7c9b]" />
              Explorar vacantes
            </Button>
          </Link>
        </div>

        {/* Interactive Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {["Todas", "Pendientes", "En Revisión", "Contratados", "Descartados"].map((filterName) => (
              <button
                key={filterName}
                onClick={() => setSelectedFilter(filterName)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  selectedFilter === filterName
                    ? "bg-[#1f2732] text-white shadow-xs font-bold"
                    : "bg-white dark:bg-zinc-900 text-[#5c7c9b] dark:text-zinc-400 border border-[#ebeef3] dark:border-zinc-800 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800"
                }`}
              >
                {filterName}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7d99b3]" />
            <input
              type="text"
              placeholder="Buscar empleo o empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 text-xs text-[#1f2732] dark:text-zinc-100 placeholder-[#7d99b3] focus:outline-none focus:ring-1 focus:ring-[#7d99b3] transition-all"
            />
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <Card className="bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="divide-y divide-[#ebeef3] dark:divide-zinc-800">
              {filteredApplications.map((app) => (
                <div 
                  key={app.id} 
                  onClick={() => handleOpenAppDetails(app)}
                  className="p-4 sm:p-5 hover:bg-[#f5f7fa]/50 dark:hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left block: Company details & position */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#f5f7fa] dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-[#3e546d] dark:text-zinc-300 border border-[#ebeef3] shrink-0">
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.company} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        app.companyInitials
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1f2732] dark:text-zinc-100 group-hover:text-[#3e546d] dark:group-hover:text-zinc-300 transition-colors truncate">{app.position}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#5c7c9b] font-medium flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-[#1f2732] dark:text-zinc-300">
                          <Building2 className="h-3 w-3 text-[#7d99b3]" />
                          {app.company}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#7d99b3]" />
                          {app.location}
                        </span>
                        <span>·</span>
                        <span>{app.appliedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Progress & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border tracking-wider uppercase shrink-0 ${app.statusColor}`}>
                      {app.statusLabel}
                    </span>

                    <ChevronRight className="h-4 w-4 text-[#7d99b3] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="bg-[#f5f7fa]/40 dark:bg-zinc-900/30 border border-dashed border-[#ebeef3] dark:border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center shadow-none">
            <Compass className="h-8 w-8 text-[#7d99b3] mb-3" />
            <h3 className="text-sm font-bold text-[#1f2732] dark:text-zinc-100">No encontramos postulaciones</h3>
            <p className="text-xs text-[#5c7c9b] dark:text-zinc-400 mt-1 max-w-sm leading-relaxed">
              {searchQuery || selectedFilter !== "Todas"
                ? "No hay postulaciones que coincidan con los filtros seleccionados."
                : "Aún no has aplicado a ninguna vacante. Explora las vacantes disponibles."}
            </p>
          </Card>
        )}
      </section>

      {/* Application Details Sheet */}
      <Sheet open={isAppSheetOpen} onOpenChange={setIsAppSheetOpen}>
        {selectedApp && (
          <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto px-6 py-8 flex flex-col gap-6 bg-white dark:bg-zinc-900 border-l border-[#ebeef3] dark:border-zinc-800 shadow-xl rounded-l-3xl">
            <SheetHeader className="gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f5f7fa] dark:bg-zinc-800 text-[#3e546d] flex items-center justify-center font-bold text-xs border border-[#ebeef3]">
                  {selectedApp.logoUrl ? (
                    <img src={selectedApp.logoUrl} alt={selectedApp.company} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    selectedApp.companyInitials
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7d99b3] uppercase tracking-wider">{selectedApp.company}</p>
                  <SheetTitle className="text-base font-bold text-[#1f2732] dark:text-zinc-50 leading-tight mt-0.5">{selectedApp.position}</SheetTitle>
                </div>
              </div>
              <SheetDescription className="text-xs text-[#5c7c9b] flex items-center gap-2 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#7d99b3] shrink-0" />
                <span>{selectedApp.location}</span>
                <span>·</span>
                <Calendar className="w-3.5 h-3.5 text-[#7d99b3] shrink-0" />
                <span>Postulado el {selectedApp.appliedDate}</span>
              </SheetDescription>
            </SheetHeader>

            {/* Timeline */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7d99b3]">Progreso de Selección</h4>
              
              <div className="relative pl-5 border-l border-[#ebeef3] dark:border-zinc-800 ml-3 py-2 space-y-6">
                
                <div className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                  <h5 className="text-xs font-bold text-[#1f2732] dark:text-zinc-100 leading-tight">Postulación Recibida</h5>
                  <p className="text-[11px] text-[#5c7c9b] mt-0.5">Hemos compartido tu perfil profesional con la empresa.</p>
                </div>

                <div className="relative">
                  <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                    selectedApp.status === "En revisión" || selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "bg-emerald-500"
                      : "bg-[#ebeef3] dark:bg-zinc-700"
                  }`} />
                  <h5 className={`text-xs font-bold leading-tight ${
                    selectedApp.status === "En revisión" || selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "text-[#1f2732] dark:text-zinc-100"
                      : "text-[#7d99b3]"
                  }`}>En Revisión</h5>
                  <p className="text-[11px] text-[#5c7c9b] mt-0.5">El reclutador está analizando tu postulación.</p>
                </div>

                <div className="relative">
                  <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                    selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "bg-emerald-500"
                      : "bg-[#ebeef3] dark:bg-zinc-700"
                  }`} />
                  <h5 className={`text-xs font-bold leading-tight ${
                    selectedApp.status === "Preseleccionado" || selectedApp.status === "Contratado"
                      ? "text-[#1f2732] dark:text-zinc-100"
                      : "text-[#7d99b3]"
                  }`}>Preseleccionado (Entrevista)</h5>
                  <p className="text-[11px] text-[#5c7c9b] mt-0.5">Puedes agendar entrevista directamente.</p>
                </div>

                {selectedApp.status === "Contratado" && (
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                    <h5 className="text-xs font-bold text-[#1f2732] dark:text-zinc-100 leading-tight">¡Contratado!</h5>
                    <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">Proceso concluido exitosamente.</p>
                  </div>
                )}
                
                {selectedApp.status === "Descartado" && (
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-900" />
                    <h5 className="text-xs font-bold text-rose-500 leading-tight">Proceso Concluido</h5>
                    <p className="text-[11px] text-[#5c7c9b] mt-0.5">La empresa decidió avanzar con otros candidatos.</p>
                  </div>
                )}

              </div>
            </div>

            <hr className="border-[#ebeef3] dark:border-zinc-800 mt-auto" />

            {/* Direct WhatsApp Call to Action */}
            {selectedApp.companyPhone && (selectedApp.status === "Preseleccionado" || selectedApp.status === "En revisión" || selectedApp.status === "Pendiente") ? (
              <div className="flex flex-col gap-3 bg-emerald-500/[0.04] border border-emerald-500/15 p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1f2732] dark:text-zinc-100">Contacto por WhatsApp</h5>
                    <p className="text-[11px] text-[#5c7c9b] mt-0.5">
                      Comunícate directamente con la empresa para coordinar la entrevista.
                    </p>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/${selectedApp.companyPhone.replace(/[^0-9]/g, "")}?text=Hola!%20Soy%20${encodeURIComponent(candidateName)},%20me%20postule%20a%20la%20vacante%20de%20${encodeURIComponent(selectedApp.position)}%20en%20K'anPro.`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all gap-2 border-none">
                    Escribir a la Empresa
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            ) : null}

            <Button 
              variant="outline" 
              onClick={() => setIsAppSheetOpen(false)} 
              className="w-full h-10 rounded-xl text-xs font-bold border-[#ebeef3]"
            >
              Cerrar Detalles
            </Button>
          </SheetContent>
        )}
      </Sheet>

    </div>
  );
}
