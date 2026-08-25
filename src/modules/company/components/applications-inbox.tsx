"use client";

import * as React from "react";
import {
  Search,
  Filter,
  Star,
  MapPin,
  Briefcase,
  Award,
  ExternalLink,
  Phone,
  ArrowLeft,
  Loader2,
  FileText,
  ShieldCheck,
  Lock,
  Clock,
  Download,
  Save,
  Eye,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useApplicationsInbox, type Applicant } from "../hooks/use-applications-inbox";
import {
  requestDocumentAccess,
  getDocumentAccessStatus,
  getAuthorizedCandidateDocuments,
} from "../actions/document-access";

export function ApplicationsInbox() {
  const {
    applicants,
    vacancies,
    selectedVacancyId,
    setSelectedVacancyId,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    selectedApplicant,
    isLoading,
    handleUpdateStatus,
    getWhatsAppLink,
    handleUpdateNotes,
    handleUpdateRating,
    handleExportCSV,
  } = useApplicationsInbox();

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"newest" | "rating">("newest");
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);
  const [docAccessState, setDocAccessState] = React.useState<{ status: string; id?: string } | null>(null);
  const [isRequestingDocs, setIsRequestingDocs] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);
  const [authorizedDocs, setAuthorizedDocs] = React.useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (selectedApplicant) {
      setNoteText(selectedApplicant.internalNotes || "");
    }
  }, [selectedApplicant]);

  // Load document access status for selected applicant
  React.useEffect(() => {
    async function loadDocStatus() {
      if (selectedApplicant?.id) {
        try {
          const docReq = await getDocumentAccessStatus(selectedApplicant.id);
          if (docReq) {
            setDocAccessState({ status: docReq.status, id: docReq.id });
          } else {
            setDocAccessState(null);
          }
        } catch {
          setDocAccessState(null);
        }
      } else {
        setDocAccessState(null);
      }
    }
    loadDocStatus();
  }, [selectedApplicant]);

  // Load authorized documents if approved
  React.useEffect(() => {
    async function loadAuthorizedDocs() {
      if (
        selectedApplicant?.id &&
        selectedApplicant?.candidateId &&
        docAccessState?.status === "approved"
      ) {
        setIsLoadingDocs(true);
        try {
          const res = await getAuthorizedCandidateDocuments(
            selectedApplicant.id,
            selectedApplicant.candidateId
          );
          if (res.authorized) {
            setAuthorizedDocs(res.documents);
          } else {
            setAuthorizedDocs([]);
          }
        } catch (err) {
          console.error("Error loading authorized documents:", err);
          setAuthorizedDocs([]);
        } finally {
          setIsLoadingDocs(false);
        }
      } else {
        setAuthorizedDocs([]);
      }
    }
    loadAuthorizedDocs();
  }, [selectedApplicant, docAccessState?.status]);

  const handleRequestDocuments = async () => {
    if (!selectedApplicant) return;
    setIsRequestingDocs(true);
    try {
      const res = await requestDocumentAccess(
        selectedApplicant.id,
        selectedApplicant.candidateId
      );
      setDocAccessState({ status: res.status, id: res.requestId });
      toast.success("Solicitud de documentos enviada", {
        description: "Se ha enviado una notificación al candidato para autorizar el acceso.",
      });
    } catch (err: any) {
      toast.error("Error al solicitar documentos", {
        description: err.message || "No se pudo procesar la solicitud.",
      });
    } finally {
      setIsRequestingDocs(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApplicant) return;
    setIsSavingNotes(true);
    try {
      await handleUpdateNotes(selectedApplicant.id, noteText);
      toast.success("Notas guardadas exitosamente");
    } catch {
      toast.error("Error al guardar las notas");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Pipeline Metrics
  const metrics = React.useMemo(() => {
    const total = applicants.length;
    const pending = applicants.filter((a) => a.status === "Pendiente" || a.status === "En revisión").length;
    const shortlisted = applicants.filter((a) => a.status === "Preseleccionado").length;
    const hired = applicants.filter((a) => a.status === "Contratado").length;
    return { total, pending, shortlisted, hired };
  }, [applicants]);

  // Filtered & Sorted Applicants
  const filteredApplicants = React.useMemo(() => {
    const list = applicants.filter((app) => {
      const matchesSearch = searchQuery
        ? app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
          app.phone.includes(searchQuery)
        : true;

      const matchesVacancy = selectedVacancyId === "all" || app.vacancyId === selectedVacancyId;
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesVacancy && matchesStatus;
    });

    if (sortBy === "rating") {
      return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [applicants, searchQuery, selectedVacancyId, statusFilter, sortBy]);

  const selectApplicant = (id: string) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const getStatusBadge = (status: Applicant["status"]) => {
    switch (status) {
      case "Preseleccionado":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
      case "En revisión":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      case "Contratado":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      case "Descartado":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground border-border/60";
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      
      {/* 1. Top Pipeline Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Postulantes
            </span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.total}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">En todas las ofertas</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Por Revisar
            </span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.pending}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">Pendientes & en revisión</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Preseleccionados
            </span>
            <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.shortlisted}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">Listos para entrevista</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Contratados
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.hired}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">Candidatos seleccionados</p>
          </div>
        </Card>
      </div>

      {/* 2. Unified Master-Detail Inbox Card */}
      <Card className="bg-card border border-border/60 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-border/60">
          
          {/* Top Controls: Search, Vacancy Filter & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por candidato, habilidades o teléfono..."
                className="h-10 pl-10 rounded-xl bg-muted/40 border-border/60 text-xs sm:text-sm font-medium"
              />
            </div>

            {/* Vacancy Selector & Actions */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {/* Vacancy Selector */}
              <div className="min-w-[180px] sm:min-w-[220px]">
                <Select
                  value={selectedVacancyId}
                  onValueChange={(val) => setSelectedVacancyId(val || "all")}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border/60 bg-muted/40 text-xs font-semibold">
                    <SelectValue placeholder="Todas las vacantes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg max-h-64">
                    <SelectItem value="all" className="text-xs font-semibold rounded-lg cursor-pointer">
                      Todas las vacantes ({applicants.length})
                    </SelectItem>
                    {vacancies.map((vac) => (
                      <SelectItem key={vac.id} value={vac.id} className="text-xs font-semibold rounded-lg cursor-pointer">
                        {vac.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === "newest" ? "rating" : "newest")}
                className={cn(
                  "h-10 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/60 cursor-pointer",
                  sortBy === "rating" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                )}
              >
                <Star className="size-3.5" />
                <span className="hidden sm:inline">
                  {sortBy === "rating" ? "Calificación" : "Recientes"}
                </span>
              </Button>

              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(filteredApplicants)}
                className="h-10 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/60 cursor-pointer"
              >
                <Download className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>

          {/* Status Tabs Row */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: "all", label: "Todos", count: applicants.length },
              { id: "Pendiente", label: "Pendientes", count: applicants.filter((a) => a.status === "Pendiente").length },
              { id: "En revisión", label: "En revisión", count: applicants.filter((a) => a.status === "En revisión").length },
              { id: "Preseleccionado", label: "Preseleccionados", count: applicants.filter((a) => a.status === "Preseleccionado").length },
              { id: "Contratado", label: "Contratados", count: applicants.filter((a) => a.status === "Contratado").length },
              { id: "Descartado", label: "Descartados", count: applicants.filter((a) => a.status === "Descartado").length },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px] max-h-[720px]">
          
          {/* Left Column: Candidates Roster (4 or 5 columns on desktop) */}
          <div
            className={cn(
              "md:col-span-5 lg:col-span-4 border-r border-border/60 overflow-y-auto divide-y divide-border/40",
              mobileDetailOpen ? "hidden md:block" : "block"
            )}
          >
            {isLoading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-semibold">Cargando postulantes...</p>
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <Users className="size-10 stroke-[1.4] text-muted-foreground/50" />
                <p className="text-sm font-bold text-foreground">No hay postulantes</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  No se encontraron candidatos que coincidan con la búsqueda o filtro aplicado.
                </p>
              </div>
            ) : (
              filteredApplicants.map((applicant) => {
                const isSelected = applicant.id === selectedId;

                return (
                  <div
                    key={applicant.id}
                    onClick={() => selectApplicant(applicant.id)}
                    className={cn(
                      "p-4 transition-all duration-150 cursor-pointer flex gap-3 relative",
                      isSelected
                        ? "bg-primary/5 border-l-4 border-primary shadow-2xs"
                        : "hover:bg-muted/40"
                    )}
                  >
                    {/* Candidate Avatar */}
                    <img
                      src={applicant.avatar}
                      alt={applicant.name}
                      className="size-12 rounded-xl object-cover border border-border/60 shadow-2xs shrink-0"
                    />

                    {/* Candidate Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {applicant.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                          {applicant.elapsedTime}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground font-medium truncate">
                        {applicant.headline || "Candidato"}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-primary truncate">
                        <Briefcase className="size-3 shrink-0" />
                        <span className="truncate">{applicant.vacancyTitle}</span>
                      </div>

                      {/* Status and Rating footer */}
                      <div className="flex items-center justify-between pt-1">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0 font-bold rounded-md border", getStatusBadge(applicant.status))}
                        >
                          {applicant.status}
                        </Badge>

                        <div className="flex items-center gap-1 text-xs">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          <span className="font-mono font-bold text-[11px] text-muted-foreground">
                            {applicant.rating || 5}.0
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Candidate Detail Dossier */}
          <div
            className={cn(
              "md:col-span-7 lg:col-span-8 bg-muted/10 overflow-y-auto",
              mobileDetailOpen ? "block" : "hidden md:block"
            )}
          >
            {selectedApplicant ? (
              <div className="p-5 sm:p-6 space-y-6">
                
                {/* Mobile Back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileDetailOpen(false)}
                  className="md:hidden text-xs font-bold gap-1 text-muted-foreground mb-2"
                >
                  <ArrowLeft className="size-4" />
                  <span>Volver a la lista</span>
                </Button>

                {/* Candidate Hero Card */}
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    
                    {/* Avatar & Name Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={selectedApplicant.avatar}
                        alt={selectedApplicant.name}
                        className="size-16 rounded-2xl object-cover border-2 border-border/60 shadow-xs shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-foreground truncate">
                            {selectedApplicant.name}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-muted-foreground truncate">
                          {selectedApplicant.headline}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <MapPin className="size-3 text-primary" />
                          <span>{selectedApplicant.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Select & Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                      <Select
                        value={selectedApplicant.status}
                        onValueChange={(val) =>
                          handleUpdateStatus(selectedApplicant.id, val as Applicant["status"])
                        }
                      >
                        <SelectTrigger className="h-9 min-w-[140px] rounded-xl text-xs font-bold border-border/60 bg-card">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg">
                          <SelectItem value="Pendiente" className="text-xs font-bold rounded-lg">Pendiente</SelectItem>
                          <SelectItem value="En revisión" className="text-xs font-bold rounded-lg">En revisión</SelectItem>
                          <SelectItem value="Preseleccionado" className="text-xs font-bold text-indigo-600 rounded-lg">Preseleccionado</SelectItem>
                          <SelectItem value="Contratado" className="text-xs font-bold text-emerald-600 rounded-lg">Contratado</SelectItem>
                          <SelectItem value="Descartado" className="text-xs font-bold text-rose-600 rounded-lg">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Vacancy & Contact Bar */}
                  <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="font-bold text-[11px] px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border-primary/20">
                        {selectedApplicant.vacancyTitle}
                      </Badge>
                    </div>

                    {/* Direct Contact Buttons */}
                    <div className="flex items-center gap-2">
                      {selectedApplicant.phone && (
                        <a
                          href={getWhatsAppLink(selectedApplicant)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#25D366] text-[#062c1e] font-extrabold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <MessageSquare className="size-3.5 stroke-[2.5]" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {selectedApplicant.phone && (
                        <a
                          href={`tel:${selectedApplicant.phone}`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground cursor-pointer transition-colors"
                        >
                          <Phone className="size-3.5 text-muted-foreground" />
                          <span>Llamar</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabbed Dossier Sections */}
                <Tabs defaultValue="profile" className="w-full space-y-4">
                  <TabsList className="h-10 rounded-xl bg-muted/60 p-1 border border-border/50">
                    <TabsTrigger value="profile" className="rounded-lg text-xs font-bold cursor-pointer">
                      Perfil & Trayectoria
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="rounded-lg text-xs font-bold cursor-pointer">
                      Documentos Oficiales
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-lg text-xs font-bold cursor-pointer">
                      Notas Internas
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Profile, Experience & Education */}
                  <TabsContent value="profile" className="space-y-4 mt-0">
                    {/* Bio */}
                    <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Biografía Profesional
                      </span>
                      <p className="text-xs sm:text-sm leading-relaxed text-foreground font-medium whitespace-pre-line">
                        {selectedApplicant.bio || "El candidato no ha agregado una biografía detallada."}
                      </p>
                    </div>

                    {/* Skills */}
                    {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Habilidades & Competencias
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplicant.skills.map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-muted border border-border/60 text-foreground"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Work Experience */}
                    {selectedApplicant.experiences && selectedApplicant.experiences.length > 0 && (
                      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Experiencia Laboral
                        </span>
                        <div className="space-y-3">
                          {selectedApplicant.experiences.map((exp, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="text-xs sm:text-sm font-bold text-foreground">{exp.role}</h5>
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  {exp.period}
                                </Badge>
                              </div>
                              <p className="text-xs font-semibold text-muted-foreground">{exp.company}</p>
                              {exp.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed pt-1 font-medium">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {selectedApplicant.education && selectedApplicant.education.length > 0 && (
                      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Educación & Estudios
                        </span>
                        <div className="space-y-2.5">
                          {selectedApplicant.education.map((edu, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-0.5">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="text-xs sm:text-sm font-bold text-foreground">{edu.degree}</h5>
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  {edu.period}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-semibold">{edu.institution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 2: Official Documents Access */}
                  <TabsContent value="documents" className="space-y-4 mt-0">
                    <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-5 text-primary" />
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            Expediente Laboral y Verificación K'anPro
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium">
                            Solicita acceso seguro a los documentos oficiales validados del candidato (INE, CURP, Constancia RFC).
                          </p>
                        </div>
                      </div>

                      {docAccessState?.status === "approved" ? (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>Acceso autorizado por el candidato. Documentos listos para consulta.</span>
                          </div>

                          {isLoadingDocs ? (
                            <div className="py-6 text-center">
                              <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                            </div>
                          ) : authorizedDocs.length === 0 ? (
                            <p className="text-xs text-muted-foreground font-medium py-2">
                              El candidato no ha subido archivos adjuntos todavía.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {authorizedDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText className="size-4 text-primary shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-foreground truncate">
                                        {doc.file_name || doc.doc_type?.toUpperCase()}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground">
                                        {doc.doc_type}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {doc.file_url && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setPreviewDoc(doc)}
                                        className="size-8 rounded-lg"
                                      >
                                        <Eye className="size-3.5" />
                                      </Button>
                                    )}
                                    {doc.file_url && (
                                      <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                      >
                                        <Download className="size-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : docAccessState?.status === "pending" ? (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                          <Clock className="size-4 shrink-0" />
                          <span>Solicitud pendiente de autorización por parte del candidato.</span>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3">
                          <p className="text-xs text-muted-foreground font-medium">
                            Por protección de datos (LFPDPPP), el candidato debe autorizar la consulta de sus identificaciones y comprobantes.
                          </p>
                          <Button
                            onClick={handleRequestDocuments}
                            disabled={isRequestingDocs}
                            className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground cursor-pointer shadow-xs"
                          >
                            {isRequestingDocs ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Enviando solicitud...</span>
                              </>
                            ) : (
                              <>
                                <Lock className="size-3.5" />
                                <span>Solicitar Autorización de Documentos</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 3: Internal Notes */}
                  <TabsContent value="notes" className="space-y-4 mt-0">
                    <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            Notas de Entrevista & Seguimiento
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium">
                            Solo visibles para el equipo de reclutamiento de tu empresa.
                          </p>
                        </div>
                      </div>

                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Escribe impresiones de la entrevista, pretensiones económicas, disponibilidad..."
                        className="min-h-[140px] rounded-xl bg-muted/30 border-border/60 text-xs sm:text-sm font-medium"
                      />

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground cursor-pointer shadow-xs"
                        >
                          {isSavingNotes ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Save className="size-3.5" />
                          )}
                          <span>Guardar Notas</span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="size-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">
                    Selecciona un postulante
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                    Haz clic en cualquiera de los candidatos del listado para ver su expediente completo, contactarlo por WhatsApp o gestionar su estatus.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Document Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl rounded-2xl border-border/60 bg-card">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>{previewDoc.file_name || previewDoc.doc_type?.toUpperCase()}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Documento validado del expediente laboral
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-auto flex items-center justify-center">
              {previewDoc.file_url?.endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.file_url}
                  className="w-full h-[500px] rounded-xl border border-border/60"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewDoc.file_url}
                  alt="Document Preview"
                  className="max-h-[500px] max-w-full rounded-xl object-contain border border-border/60"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
