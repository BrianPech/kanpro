"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  Star,
  MapPin,
  Briefcase,
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
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  MoreHorizontal,
  X,
  Check,
  UserCheck,
  UserX,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useApplicationsInbox, type Applicant } from "../hooks/use-applications-inbox";
import {
  requestDocumentAccess,
  getDocumentAccessStatus,
  getAuthorizedCandidateDocuments,
} from "../actions/document-access";
import { HireCandidateWizardModal } from "./recruitment/hire-candidate-wizard-modal";

export function ApplicationsInbox() {
  const {
    applicants,
    vacancies,
    selectedVacancyId,
    setSelectedVacancyId,
    searchQuery,
    setSearchQuery,
    isLoading,
    handleUpdateStatus,
    getWhatsAppLink,
    handleUpdateNotes,
    handleUpdateRating,
    handleExportCSV,
    reloadData,
  } = useApplicationsInbox();

  // Filters State
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [ratingFilter, setRatingFilter] = React.useState<string>("all");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "rating", desc: true },
  ]);

  // Modals & Detail Viewer
  const [selectedApplicant, setSelectedApplicant] =
    React.useState<Applicant | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [isHireWizardOpen, setIsHireWizardOpen] = React.useState(false);
  const [hiringApplicant, setHiringApplicant] = React.useState<Applicant | null>(
    null
  );

  // Document Authorization & Notes State
  const [docAccessState, setDocAccessState] = React.useState<{
    status: string;
    id?: string;
  } | null>(null);
  const [isRequestingDocs, setIsRequestingDocs] = React.useState(false);
  const [authorizedDocs, setAuthorizedDocs] = React.useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);

  // Pipeline Metrics
  const metrics = React.useMemo(() => {
    const total = applicants.length;
    const pending = applicants.filter(
      (a) => a.status === "Pendiente" || a.status === "En revisión"
    ).length;
    const shortlisted = applicants.filter(
      (a) => a.status === "Preseleccionado"
    ).length;
    const hired = applicants.filter((a) => a.status === "Contratado").length;
    return { total, pending, shortlisted, hired };
  }, [applicants]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeClass = (status: Applicant["status"]) => {
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

  // Open Candidate Detail Modal
  const handleOpenDetail = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setNoteText(applicant.internalNotes || "");
    setIsDetailModalOpen(true);
  };

  // Load document authorization status when candidate is opened
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
    if (isDetailModalOpen) {
      loadDocStatus();
    }
  }, [selectedApplicant, isDetailModalOpen]);

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
    if (isDetailModalOpen) {
      loadAuthorizedDocs();
    }
  }, [selectedApplicant, docAccessState?.status, isDetailModalOpen]);

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
        description:
          "Se ha enviado una notificación al candidato para autorizar el acceso a su expediente oficial.",
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

  const handleStartHire = (applicant: Applicant) => {
    setHiringApplicant(applicant);
    setIsHireWizardOpen(true);
  };

  // Filtered applicants
  const filteredApplicants = React.useMemo(() => {
    return applicants.filter((app) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = query
        ? app.name.toLowerCase().includes(query) ||
          app.headline.toLowerCase().includes(query) ||
          app.vacancyTitle.toLowerCase().includes(query) ||
          app.location.toLowerCase().includes(query) ||
          app.skills.some((s) => s.toLowerCase().includes(query)) ||
          app.phone.includes(query)
        : true;

      const matchesVacancy =
        selectedVacancyId === "all" || app.vacancyId === selectedVacancyId;

      let matchesStatus = true;
      if (statusFilter === "pending") {
        matchesStatus =
          app.status === "Pendiente" || app.status === "En revisión";
      } else if (statusFilter !== "all") {
        matchesStatus = app.status === statusFilter;
      }

      let matchesRating = true;
      if (ratingFilter === "top") {
        matchesRating = (app.internalRating || app.rating || 5) >= 5;
      } else if (ratingFilter === "high") {
        matchesRating = (app.internalRating || app.rating || 5) >= 4;
      }

      return matchesSearch && matchesVacancy && matchesStatus && matchesRating;
    });
  }, [applicants, searchQuery, selectedVacancyId, statusFilter, ratingFilter]);

  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedVacancyId !== "all" ||
    statusFilter !== "all" ||
    ratingFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedVacancyId("all");
    setStatusFilter("all");
    setRatingFilter("all");
    setSorting([{ id: "rating", desc: true }]);
  };

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<Applicant>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Candidato</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center gap-3 py-1 min-w-[200px]">
              <Avatar
                onClick={() => handleOpenDetail(app)}
                className="size-10 rounded-2xl border border-border/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all shadow-2xs"
              >
                <AvatarImage
                  src={app.avatar}
                  alt={app.name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl font-extrabold text-xs bg-primary/10 text-primary">
                  {getInitials(app.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(app)}
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate block text-left cursor-pointer"
                >
                  {app.name}
                </button>
                <p className="text-[11px] text-muted-foreground font-medium truncate">
                  {app.headline || "Candidato"}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                  <span>{app.elapsedTime}</span>
                  {app.phone && (
                    <>
                      <span>•</span>
                      <span>{app.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "vacancyTitle",
        id: "vacancyTitle",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Vacante Aplicada</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="space-y-1 py-1">
              <Link
                href={`/dashboard/company/vacancies/${app.vacancyId}`}
                className="text-xs font-bold text-foreground hover:text-primary transition-colors line-clamp-1 block"
              >
                {app.vacancyTitle}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <MapPin className="size-3 text-primary shrink-0" />
                <span className="truncate">{app.location}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "skills",
        header: () => (
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground block">
            Habilidades Clave
          </span>
        ),
        cell: ({ row }) => {
          const app = row.original;
          const displaySkills = app.skills.slice(0, 3);
          const remaining = app.skills.length - 3;

          return (
            <div className="flex items-center gap-1.5 flex-wrap py-1 max-w-xs">
              {displaySkills.map((skill, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-[10px] font-semibold px-2 py-0 rounded-md border-border/40 bg-muted/30"
                >
                  {skill}
                </Badge>
              ))}
              {remaining > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono font-bold">
                  +{remaining}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "rating",
        id: "rating",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Calificación</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const app = row.original;
          const currentRating = app.internalRating || app.rating || 5;

          return (
            <div className="flex items-center gap-0.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleUpdateRating(app.id, star)}
                  className="cursor-pointer hover:scale-110 transition-transform p-0.5"
                  title={`Calificar con ${star} estrellas`}
                >
                  <Star
                    className={cn(
                      "size-3.5",
                      star <= currentRating
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estatus Embudo</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="py-1">
              <Select
                value={app.status}
                onValueChange={(val) =>
                  handleUpdateStatus(app.id, val as Applicant["status"])
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-7 px-2.5 rounded-full text-[10px] font-extrabold border-none shadow-2xs cursor-pointer",
                    getStatusBadgeClass(app.status)
                  )}
                >
                  <SelectValue placeholder={app.status}>
                    {app.status}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                  <SelectItem
                    value="Pendiente"
                    className="text-xs font-semibold rounded-lg"
                  >
                    Pendiente
                  </SelectItem>
                  <SelectItem
                    value="En revisión"
                    className="text-xs font-semibold text-amber-600 rounded-lg"
                  >
                    En revisión
                  </SelectItem>
                  <SelectItem
                    value="Preseleccionado"
                    className="text-xs font-semibold text-indigo-600 rounded-lg"
                  >
                    Preseleccionado
                  </SelectItem>
                  <SelectItem
                    value="Contratado"
                    className="text-xs font-semibold text-emerald-600 rounded-lg"
                  >
                    Contratado
                  </SelectItem>
                  <SelectItem
                    value="Descartado"
                    className="text-xs font-semibold text-rose-600 rounded-lg"
                  >
                    Descartado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground block text-right pr-2">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center justify-end gap-1 py-1">
              {/* WhatsApp Button */}
              {app.phone && (
                <a
                  href={getWhatsAppLink(app)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-8 rounded-lg bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/25 flex items-center justify-center transition-colors cursor-pointer"
                  title="Contactar por WhatsApp"
                >
                  <MessageSquare className="size-3.5 stroke-[2.5]" />
                </a>
              )}

              {/* Eye Button: Open Candidate Profile / 360 Dossier */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenDetail(app)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors"
                title="Ver Perfil y Trayectoria del Postulante"
              >
                <Eye className="size-4" />
              </Button>

              {/* Hire Button */}
              {app.status !== "Contratado" && (
                <Button
                  size="sm"
                  onClick={() => handleStartHire(app)}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1"
                  title="Formalizar contratación de este candidato"
                >
                  <Sparkles className="size-3" />
                  <span className="hidden xl:inline">Contratar</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors flex items-center justify-center" />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl border border-border/50 bg-popover min-w-[200px] shadow-lg p-1.5"
                >
                  <DropdownMenuItem
                    onSelect={() => handleOpenDetail(app)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Ver Expediente del Candidato</span>
                  </DropdownMenuItem>

                  {app.phone && (
                    <DropdownMenuItem
                      render={
                        <a
                          href={getWhatsAppLink(app)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-emerald-600 dark:text-emerald-400"
                        />
                      }
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Enviar WhatsApp</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onSelect={() => handleStartHire(app)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-primary hover:bg-primary/10"
                  >
                    <UserCheck className="size-3.5 text-primary" />
                    <span>Contratar Candidato</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onSelect={() =>
                      handleUpdateStatus(app.id, "Preseleccionado")
                    }
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-indigo-600 dark:text-indigo-400"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Marcar Preseleccionado</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => handleUpdateStatus(app.id, "Descartado")}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10"
                  >
                    <UserX className="size-3.5" />
                    <span>Descartar Postulante</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: filteredApplicants,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const tableRows = table.getRowModel().rows;

  return (
    <div className="space-y-6 w-full pb-16 font-sans animate-in fade-in duration-300">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-[800] text-foreground tracking-tight flex items-center gap-2.5">
            <span>Postulantes & Selección</span>
            <Badge
              variant="outline"
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg border-border/40"
            >
              {applicants.length}
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Bandeja de candidatos, revisión de perfiles, evaluación curricular y contratación directa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportCSV(filteredApplicants)}
            className="h-9 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-2 border-border/50 hover:bg-muted/40 cursor-pointer"
          >
            <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            size="sm"
            render={<Link href="/dashboard/company/vacancies" />}
            className="h-9 font-bold text-xs rounded-xl px-4 flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Briefcase className="size-4" />
            <span>Ver Vacantes</span>
          </Button>
        </div>
      </div>

      {/* 2. Pipeline Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Postulantes
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.total}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              En todas las convocatorias
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Por Revisar
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.pending}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Pendientes & en revisión
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Preseleccionados
            </span>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.shortlisted}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Listos para entrevista
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Contratados
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.hired}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              En plantilla activa
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Master TanStack DataTable Card */}
      <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Unified Toolbar & Filters inside Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
          
          {/* Top Row: Search & Info */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por candidato, vacante, habilidades o teléfono..."
                className="h-10 pl-10 pr-9 bg-background border-border/50 rounded-xl text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort Helper */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <ArrowUpDown className="size-3.5 text-primary" />
              <span>Haz clic en los encabezados para ordenar</span>
            </div>
          </div>

          {/* Filter Row: Status Segmented Tabs + Vacancy Select + Rating Filter + Clear */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-border/30">
            
            {/* Status Segmented Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  statusFilter === "all"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todos ({applicants.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "pending"
                    ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                <span>Por Revisar ({metrics.pending})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Preseleccionado")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "Preseleccionado"
                    ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-indigo-500 inline-block" />
                <span>Preseleccionados ({metrics.shortlisted})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Contratado")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "Contratado"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Contratados ({metrics.hired})</span>
              </button>
            </div>

            {/* Selectors Group */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Vacancy Selector */}
              <div className="w-full sm:w-[220px]">
                <Select
                  value={selectedVacancyId}
                  onValueChange={(val) => setSelectedVacancyId(val || "all")}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
                    <SelectValue placeholder="Todas las vacantes">
                      {selectedVacancyId === "all"
                        ? `Todas las vacantes (${applicants.length})`
                        : vacancies.find((v) => v.id === selectedVacancyId)
                            ?.title || selectedVacancyId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg max-h-64">
                    <SelectItem
                      value="all"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Todas las vacantes ({applicants.length})
                    </SelectItem>
                    {vacancies.map((vac) => (
                      <SelectItem
                        key={vac.id}
                        value={vac.id}
                        className="text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {vac.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Selector */}
              <div className="w-full sm:w-[150px]">
                <Select
                  value={ratingFilter}
                  onValueChange={(val) => setRatingFilter(val || "all")}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
                    <SelectValue placeholder="Calificación">
                      {ratingFilter === "all"
                        ? "Todas las notas"
                        : ratingFilter === "top"
                        ? "⭐⭐⭐⭐⭐ (5★)"
                        : "⭐⭐⭐⭐ (4★+)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                    <SelectItem
                      value="all"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Todas las notas
                    </SelectItem>
                    <SelectItem
                      value="top"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      ⭐⭐⭐⭐⭐ (5★)
                    </SelectItem>
                    <SelectItem
                      value="high"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      ⭐⭐⭐⭐ (4★+)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Limpiar</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Table Body & Empty State */}
        <div className="relative min-h-[300px]">
          {isLoading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">
                Cargando postulaciones...
              </p>
            </div>
          ) : tableRows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia
                  variant="icon"
                  className="bg-primary/10 text-primary"
                >
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {isFiltered
                    ? "No se encontraron postulantes"
                    : "Aún no hay postulaciones"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? "No hay candidatos que coincidan con la búsqueda o filtros aplicados. Intenta restablecer los filtros."
                    : "Tus convocatorias activas comenzarán a recibir candidatos locales de inmediato."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isFiltered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer border-border/50 gap-1.5"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Restablecer Filtros</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    render={<Link href="/dashboard/company/vacancies" />}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Briefcase className="size-3.5" />
                    <span>Revisar Convocatorias</span>
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/30 border-b border-border/40">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="py-3 px-4 sm:px-6"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {tableRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/25 transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-3 px-4 sm:px-6"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Table Footer with Summary and Pagination */}
              <div className="p-3.5 px-4 sm:px-6 border-t border-border/30 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-medium">
                <span>
                  Mostrando <strong>{tableRows.length}</strong> de{" "}
                  <strong>{filteredApplicants.length}</strong> postulantes
                </span>

                {/* Pagination Controls */}
                {table.getPageCount() > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="h-8 px-2.5 rounded-lg text-xs"
                    >
                      <ChevronLeft className="size-3.5 mr-1" />
                      <span>Anterior</span>
                    </Button>
                    <span className="px-2 font-semibold">
                      Página {table.getState().pagination.pageIndex + 1} de{" "}
                      {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="h-8 px-2.5 rounded-lg text-xs"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal: Full Candidate Profile / Dossier Viewer */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-full sm:!max-w-[860px] md:!max-w-[920px] rounded-3xl p-0 overflow-hidden bg-card border-border/80 shadow-2xl !flex !flex-col h-[85vh] max-h-[820px] !gap-0 font-sans">
          {selectedApplicant && (
            <>
              {/* 1. Header Fijo con Resumen del Candidato */}
              <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 bg-muted/20 shrink-0 pr-14 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="size-14 rounded-2xl border-2 border-border/50 shadow-sm shrink-0">
                      <AvatarImage
                        src={selectedApplicant.avatar}
                        alt={selectedApplicant.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-2xl font-extrabold text-base bg-primary/10 text-primary">
                        {getInitials(selectedApplicant.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-lg sm:text-xl font-[800] text-foreground tracking-tight">
                          {selectedApplicant.name}
                        </DialogTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            getStatusBadgeClass(selectedApplicant.status)
                          )}
                        >
                          {selectedApplicant.status}
                        </Badge>
                      </div>

                      <DialogDescription className="text-xs text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {selectedApplicant.headline}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-primary" />
                          <span>{selectedApplicant.location}</span>
                        </span>
                        <span>•</span>
                        <span>Postulado {selectedApplicant.elapsedTime}</span>
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedApplicant.phone && (
                      <a
                        href={getWhatsAppLink(selectedApplicant)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#25D366] text-[#062c1e] font-extrabold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <MessageSquare className="size-3.5 stroke-[2.5]" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {selectedApplicant.status !== "Contratado" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          handleStartHire(selectedApplicant);
                        }}
                        className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 cursor-pointer gap-1.5"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Contratar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* 2. Scrollable Body with Tabs */}
              <div className="flex-1 min-h-0 h-full relative overflow-hidden bg-background">
                <ScrollArea className="h-full w-full">
                  <div className="p-5 sm:p-6 space-y-6">
                    <Tabs defaultValue="profile" className="w-full space-y-5">
                      <TabsList className="grid grid-cols-3 w-full h-11 p-1 rounded-2xl bg-muted/40 border border-border/40">
                        <TabsTrigger
                          value="profile"
                          className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
                        >
                          <Briefcase className="size-3.5" />
                          <span>Perfil & Trayectoria</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="documents"
                          className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
                        >
                          <ShieldCheck className="size-3.5" />
                          <span>Documentos Oficiales</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="notes"
                          className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
                        >
                          <FileText className="size-3.5" />
                          <span>Notas Internas</span>
                        </TabsTrigger>
                      </TabsList>

                      {/* TAB 1: Profile & Career */}
                      <TabsContent
                        value="profile"
                        className="space-y-4 m-0 focus-visible:outline-none"
                      >
                        {/* Bio */}
                        <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Biografía Profesional
                          </span>
                          <p className="text-xs sm:text-sm leading-relaxed text-foreground font-medium whitespace-pre-line">
                            {selectedApplicant.bio ||
                              "El candidato no ha registrado biografía adicional."}
                          </p>
                        </Card>

                        {/* Skills */}
                        {selectedApplicant.skills &&
                          selectedApplicant.skills.length > 0 && (
                            <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-2.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Habilidades & Competencias
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {selectedApplicant.skills.map((skill, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="px-3 py-1 rounded-xl text-xs font-bold bg-muted/60 border border-border/60 text-foreground"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </Card>
                          )}

                        {/* Experiences */}
                        {selectedApplicant.experiences &&
                          selectedApplicant.experiences.length > 0 && (
                            <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Trayectoria Laboral
                              </span>
                              <div className="space-y-2.5">
                                {selectedApplicant.experiences.map((exp, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3.5 rounded-xl bg-muted/25 border border-border/40 space-y-1"
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <h5 className="text-xs sm:text-sm font-bold text-foreground">
                                        {exp.role}
                                      </h5>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-semibold"
                                      >
                                        {exp.period}
                                      </Badge>
                                    </div>
                                    <p className="text-xs font-semibold text-primary">
                                      {exp.company}
                                    </p>
                                    {exp.description && (
                                      <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                        {exp.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}

                        {/* Education */}
                        {selectedApplicant.education &&
                          selectedApplicant.education.length > 0 && (
                            <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Formación Académica
                              </span>
                              <div className="space-y-2">
                                {selectedApplicant.education.map((edu, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-0.5"
                                  >
                                    <h5 className="text-xs font-bold text-foreground">
                                      {edu.degree}
                                    </h5>
                                    <p className="text-xs text-muted-foreground font-medium">
                                      {edu.institution} • {edu.period}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}
                      </TabsContent>

                      {/* TAB 2: Official Documents & Privacy Vault */}
                      <TabsContent
                        value="documents"
                        className="space-y-4 m-0 focus-visible:outline-none"
                      >
                        <Card className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <ShieldCheck className="size-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">
                                Bóveda de Documentos Oficiales LFT
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                INE, CURP, Constancia SAT y Comprobante de domicilio protegidos por privacidad.
                              </p>
                            </div>
                          </div>

                          {docAccessState?.status === "approved" ? (
                            <div className="space-y-3 pt-2">
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-xs px-3 py-1 rounded-lg">
                                <CheckCircle2 className="size-3.5 mr-1" />
                                Acceso Autorizado por el Candidato
                              </Badge>

                              {isLoadingDocs ? (
                                <div className="p-6 text-center">
                                  <Loader2 className="size-5 animate-spin mx-auto text-primary" />
                                </div>
                              ) : authorizedDocs.length > 0 ? (
                                <div className="space-y-2">
                                  {authorizedDocs.map((doc, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-primary" />
                                        <span className="font-semibold text-foreground">
                                          {doc.title || doc.name}
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          toast.info(
                                            `Descargando documento: ${doc.title || doc.name}`
                                          )
                                        }
                                        className="h-8 px-2.5 text-xs font-semibold"
                                      >
                                        <Download className="size-3 mr-1" />
                                        <span>Descargar</span>
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  El candidato aún no ha subido archivos a su bóveda digital.
                                </p>
                              )}
                            </div>
                          ) : docAccessState?.status === "pending" ? (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1 text-xs">
                              <span className="font-bold flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                Solicitud en Espera de Autorización
                              </span>
                              <p className="text-[11px] text-muted-foreground">
                                Se envió una notificación al candidato. Podrás visualizar sus documentos en cuanto confirme el acceso.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <Lock className="size-4 text-muted-foreground" />
                                <span>
                                  Los documentos oficiales están resguardados bajo consentimiento explícito del trabajador.
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={handleRequestDocuments}
                                disabled={isRequestingDocs}
                                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground h-9 px-4 cursor-pointer"
                              >
                                {isRequestingDocs ? (
                                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                ) : (
                                  <ShieldCheck className="size-3.5 mr-1.5" />
                                )}
                                <span>Solicitar Acceso a Documentos</span>
                              </Button>
                            </div>
                          )}
                        </Card>
                      </TabsContent>

                      {/* TAB 3: Internal Notes */}
                      <TabsContent
                        value="notes"
                        className="space-y-4 m-0 focus-visible:outline-none"
                      >
                        <Card className="bg-card border border-border/40 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Notas Privadas del Reclutador
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Estas notas son internas y nunca serán visibles para el candidato.
                              </p>
                            </div>
                          </div>

                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Anotaciones de entrevista telefónica, expectativas salariales, disponibilidad..."
                            className="min-h-[120px] rounded-xl bg-muted/30 border-border/60 text-xs font-medium"
                          />

                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={handleSaveNotes}
                              disabled={isSavingNotes}
                              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground h-9 px-4 cursor-pointer"
                            >
                              {isSavingNotes ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Save className="size-3.5 mr-1.5" />
                              )}
                              <span>Guardar Notas</span>
                            </Button>
                          </div>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </div>

              {/* 3. Footer Operativo */}
              <DialogFooter className="p-4 px-6 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
                >
                  Cerrar
                </Button>

                <div className="flex items-center gap-2">
                  {selectedApplicant.status !== "Contratado" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleStartHire(selectedApplicant);
                      }}
                      className="rounded-xl text-xs font-bold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer gap-1.5"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Formalizar Contratación</span>
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Wizard Modal: Hire Candidate & Generate Digital Contract / Employee */}
      <HireCandidateWizardModal
        isOpen={isHireWizardOpen}
        onOpenChange={setIsHireWizardOpen}
        candidate={hiringApplicant}
        onHiringCompleted={() => {
          setIsHireWizardOpen(false);
          reloadData();
          toast.success("¡Candidato contratado con éxito!", {
            description:
              "Se ha creado el expediente de colaborador y se integró a la plantilla activa.",
          });
        }}
      />
    </div>
  );
}
