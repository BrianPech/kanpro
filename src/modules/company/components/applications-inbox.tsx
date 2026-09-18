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
  Mail,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Link as LinkIcon,
  Copy,
  Video,
  PenTool,
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
import { useApplicationsInbox, type Applicant, type InterviewDetails } from "../hooks/use-applications-inbox";
import {
  requestDocumentAccess,
  getDocumentAccessStatus,
  getAuthorizedCandidateDocuments,
} from "../actions/document-access";
import { HireCandidateWizardModal } from "./recruitment/hire-candidate-wizard-modal";
import { CandidateCvViewer } from "./candidate-cv-viewer";
import { DatePicker } from "@/components/ui/date-picker";

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
    handleScheduleInterview,
    getWhatsAppLink,
    handleUpdateNotes,
    handleUpdateRating,
    handleContactApplicant,
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
  const [activeModalTab, setActiveModalTab] = React.useState<string>("experience");
  const [isHireWizardOpen, setIsHireWizardOpen] = React.useState(false);
  const [hiringApplicant, setHiringApplicant] = React.useState<Applicant | null>(
    null
  );

  // Interview Appointment Modal State
  const [isInterviewModalOpen, setIsInterviewModalOpen] = React.useState(false);
  const [interviewApplicant, setInterviewApplicant] = React.useState<Applicant | null>(null);
  const [interviewDate, setInterviewDate] = React.useState("");
  const [interviewTime, setInterviewTime] = React.useState("10:00");
  const [interviewModality, setInterviewModality] = React.useState<"presencial" | "virtual">("presencial");
  const [interviewPlatform, setInterviewPlatform] = React.useState<"meet" | "zoom" | "teams" | "custom">("meet");
  const [interviewLocationOrLink, setInterviewLocationOrLink] = React.useState("");
  const [interviewNotes, setInterviewNotes] = React.useState("");
  const [isScheduling, setIsScheduling] = React.useState(false);

  const handleOpenScheduleInterview = (applicant: Applicant) => {
    setInterviewApplicant(applicant);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split("T")[0];

    if (applicant.interview) {
      setInterviewDate(applicant.interview.date);
      setInterviewTime(applicant.interview.time || "10:00");
      setInterviewModality(applicant.interview.modality);
      setInterviewLocationOrLink(applicant.interview.locationOrLink);
      setInterviewNotes(applicant.interview.notes || "");
      const loc = (applicant.interview.locationOrLink || "").toLowerCase();
      if (loc.includes("zoom")) setInterviewPlatform("zoom");
      else if (loc.includes("teams")) setInterviewPlatform("teams");
      else if (loc.includes("meet")) setInterviewPlatform("meet");
      else setInterviewPlatform("custom");
    } else {
      setInterviewDate(defaultDate);
      setInterviewTime("10:00");
      setInterviewModality("presencial");
      setInterviewPlatform("meet");
      setInterviewLocationOrLink(applicant.location || "Instalaciones de la empresa / Sucursal");
      setInterviewNotes("Presentarse con 10 minutos de anticipación e identificación oficial física.");
    }
    setIsInterviewModalOpen(true);
  };

  const handleSelectPlatform = (platform: "meet" | "zoom" | "teams" | "custom") => {
    setInterviewPlatform(platform);
    if (platform === "meet") {
      if (!interviewLocationOrLink || !interviewLocationOrLink.includes("http") || interviewLocationOrLink.includes("zoom") || interviewLocationOrLink.includes("teams")) {
        setInterviewLocationOrLink("https://meet.google.com/new");
      }
    } else if (platform === "zoom") {
      if (!interviewLocationOrLink || !interviewLocationOrLink.includes("http") || interviewLocationOrLink.includes("meet") || interviewLocationOrLink.includes("teams")) {
        setInterviewLocationOrLink("https://zoom.us/j/");
      }
    } else if (platform === "teams") {
      if (!interviewLocationOrLink || !interviewLocationOrLink.includes("http") || interviewLocationOrLink.includes("meet") || interviewLocationOrLink.includes("zoom")) {
        setInterviewLocationOrLink("https://teams.live.com/meet");
      }
    }
  };

  const getQuickDateIso = (offsetDays: number | "nextMonday"): string => {
    const d = new Date();
    if (offsetDays === "nextMonday") {
      const day = d.getDay(); // 0 is Sunday, 1 is Monday
      const diff = (8 - day) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const quickTimes = ["09:00", "10:00", "11:30", "13:00", "15:00", "16:30", "17:00"];

  const quickNotesSnippets = [
    "Identificación oficial (INE)",
    "Llegar 10 min antes",
    "CV impreso",
    "Cámara y micrófono activos",
  ];

  const handleAppendInterviewNote = (snippet: string) => {
    setInterviewNotes((prev) => {
      if (!prev.trim()) return snippet;
      if (prev.includes(snippet)) return prev;
      return `${prev.trim()} • ${snippet}`;
    });
  };

  const handleConfirmInterview = async () => {
    if (!interviewApplicant) return;
    if (!interviewDate) {
      toast.error("Por favor selecciona una fecha para la entrevista");
      return;
    }
    setIsScheduling(true);
    try {
      const details: InterviewDetails = {
        date: interviewDate,
        time: interviewTime,
        modality: interviewModality,
        locationOrLink:
          interviewLocationOrLink ||
          (interviewModality === "presencial" ? "Oficinas de la empresa" : "Google Meet"),
        notes: interviewNotes,
        scheduledAt: new Date().toISOString(),
      };
      await handleScheduleInterview(interviewApplicant.id, details);
      if (selectedApplicant?.id === interviewApplicant.id) {
        setSelectedApplicant({
          ...selectedApplicant,
          status: "Entrevista",
          interview: details,
        });
      }
      setIsInterviewModalOpen(false);
      toast.success("¡Cita de entrevista agendada con éxito!", {
        description: `Se agendó para el ${interviewDate} a las ${interviewTime}.`,
      });
    } catch {
      toast.error("Error al agendar la entrevista");
    } finally {
      setIsScheduling(false);
    }
  };

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

  // Distinct vacancies with real applicant counts
  const vacanciesWithCounts = React.useMemo(() => {
    const map = new Map<string, { id: string; title: string; applicantCount: number }>();

    (vacancies || []).forEach((vac) => {
      if (vac?.id) {
        map.set(String(vac.id), { id: String(vac.id), title: vac.title || "Vacante", applicantCount: 0 });
      }
    });

    (applicants || []).forEach((app) => {
      if (app?.vacancyId) {
        const vId = String(app.vacancyId);
        if (map.has(vId)) {
          map.get(vId)!.applicantCount += 1;
        } else {
          map.set(vId, {
            id: vId,
            title: app.vacancyTitle || "Vacante",
            applicantCount: 1,
          });
        }
      }
    });

    return Array.from(map.values()).filter((v) => v && v.id && v.id.trim() !== "");
  }, [vacancies, applicants]);

  // Selected vacancy details
  const selectedVacancy = React.useMemo(() => {
    if (selectedVacancyId === "all") return null;
    return vacanciesWithCounts.find((v) => v.id === selectedVacancyId) || null;
  }, [vacanciesWithCounts, selectedVacancyId]);

  // Applicants for the currently selected vacancy (for metrics & status tabs counts)
  const currentScopeApplicants = React.useMemo(() => {
    if (selectedVacancyId === "all") return applicants;
    return applicants.filter((a) => a.vacancyId === selectedVacancyId);
  }, [applicants, selectedVacancyId]);

  // Pipeline Metrics (dynamically adapts to selected vacancy!)
  const metrics = React.useMemo(() => {
    const total = currentScopeApplicants.length;
    const pending = currentScopeApplicants.filter(
      (a) => a.status === "Pendiente" || a.status === "En revisión"
    ).length;
    const shortlisted = currentScopeApplicants.filter(
      (a) => a.status === "Preseleccionado"
    ).length;
    const interviews = currentScopeApplicants.filter(
      (a) => a.status === "Entrevista"
    ).length;
    const hired = currentScopeApplicants.filter((a) => a.status === "Contratado").length;
    return { total, pending, shortlisted, interviews, hired };
  }, [currentScopeApplicants]);

  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== "string" || !name.trim()) return "KP";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "KP";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return ((parts[0][0] || "") + (parts[1][0] || "")).toUpperCase() || "KP";
  };

  const getStatusBadgeClass = (status: Applicant["status"]) => {
    switch (status) {
      case "Preseleccionado":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
      case "En revisión":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "Entrevista":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
      case "Contratado":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      case "Descartado":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
    }
  };

  // Open Candidate Detail Modal
  const handleOpenDetail = (applicant: Applicant, initialTab: string = "experience") => {
    setSelectedApplicant(applicant);
    setNoteText(applicant.internalNotes || "");
    const tabToOpen = initialTab === "documents" && applicant.status !== "Contratado" ? "curriculum" : initialTab;
    setActiveModalTab(tabToOpen);
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
    return (applicants || []).filter((app) => {
      if (!app) return false;
      const query = (searchQuery || "").toLowerCase().trim();
      const matchesSearch = query
        ? (app.name || "").toLowerCase().includes(query) ||
          (app.headline || "").toLowerCase().includes(query) ||
          (app.vacancyTitle || "").toLowerCase().includes(query) ||
          (app.location || "").toLowerCase().includes(query) ||
          (Array.isArray(app.skills) && app.skills.some((s) => typeof s === "string" && s.toLowerCase().includes(query))) ||
          (app.phone || "").includes(query)
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
                  className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary hover:text-primary transition-colors truncate block text-left cursor-pointer"
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
                href={app.vacancyId ? `/dashboard/company/vacancies/${app.vacancyId}` : "/dashboard/company/vacancies"}
                className="text-xs font-bold text-foreground hover:text-primary transition-colors line-clamp-1 block"
              >
                {app.vacancyTitle || "Vacante"}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <MapPin className="size-3 text-primary shrink-0" />
                <span className="truncate">{app.location || "Local"}</span>
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
          const skillsList = Array.isArray(app?.skills) ? app.skills.filter(Boolean) : [];
          const displaySkills = skillsList.slice(0, 3);
          const remaining = Math.max(0, skillsList.length - 3);

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
                    value="Entrevista"
                    className="text-xs font-semibold text-purple-600 rounded-lg"
                  >
                    Entrevista
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
              {app.phone && (
                <a
                  href={getWhatsAppLink(app)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactApplicant(app)}
                  className="inline-flex"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 cursor-pointer font-bold text-xs gap-1.5"
                  >
                    <MessageSquare className="size-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                </a>
              )}

              {/* View Profile Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDetail(app)}
                className="h-8 px-2.5 rounded-lg border-border/60 hover:bg-muted/50 cursor-pointer font-semibold text-xs gap-1.5"
              >
                <Eye className="size-3.5 text-muted-foreground" />
                <span>Perfil</span>
              </Button>

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/60 bg-popover shadow-lg">
                  <DropdownMenuItem
                    onSelect={() => handleOpenDetail(app, "experience")}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Ver Expediente Completo</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => handleOpenDetail(app, "curriculum")}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-primary focus:text-primary"
                  >
                    <FileText className="size-3.5" />
                    <span>Ver CV en PDF</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  {/* Flow Actions */}
                  {app.status === "Pendiente" && (
                    <DropdownMenuItem
                      onSelect={() => handleUpdateStatus(app.id, "En revisión")}
                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-blue-600 dark:text-blue-400"
                    >
                      <Eye className="size-3.5" />
                      <span>1. Iniciar Revisión</span>
                    </DropdownMenuItem>
                  )}

                  {app.status !== "Preseleccionado" && app.status !== "Contratado" && (
                    <DropdownMenuItem
                      onSelect={() => handleUpdateStatus(app.id, "Preseleccionado")}
                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-indigo-600 dark:text-indigo-400"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>2. Marcar Preseleccionado</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onSelect={() => handleOpenScheduleInterview(app)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-purple-600 dark:text-purple-400"
                  >
                    <Calendar className="size-3.5" />
                    <span>3. Agendar Cita de Entrevista</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onSelect={() => handleStartHire(app)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-primary hover:bg-primary/10"
                  >
                    <Sparkles className="size-3.5 text-primary" />
                    <span>4. Formalizar Contratación</span>
                  </DropdownMenuItem>

                  {app.status !== "Descartado" && (
                    <DropdownMenuItem
                      onSelect={() => handleUpdateStatus(app.id, "Descartado")}
                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                    >
                      <UserX className="size-3.5" />
                      <span>Descartar Postulante</span>
                    </DropdownMenuItem>
                  )}
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

      {/* 2. Barra de Selección y Filtro por Vacante */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Briefcase className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                  Filtrar por Vacante
                </h3>
                {selectedVacancyId !== "all" ? (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30 px-2 py-0.5 rounded-md">
                    Filtro activo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold bg-muted text-muted-foreground border-border/40 px-2 py-0.5 rounded-md">
                    {vacanciesWithCounts.length} {vacanciesWithCounts.length === 1 ? "vacante" : "vacantes"}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedVacancyId === "all" ? (
                  <span>Viendo todos los postulantes de la empresa (<strong>{applicants.length}</strong> en total)</span>
                ) : (
                  <span>
                    Viendo postulantes para: <strong className="text-foreground">{selectedVacancy?.title || "Vacante seleccionada"}</strong> ({currentScopeApplicants.length} candidatos)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-[250px]">
              <Select
                value={selectedVacancyId}
                onValueChange={(val) => setSelectedVacancyId(val || "all")}
              >
                <SelectTrigger className="h-9 w-full rounded-xl border-border/60 bg-background text-xs font-bold shadow-2xs">
                  <SelectValue placeholder="Seleccionar vacante...">
                    {selectedVacancyId === "all"
                      ? `Todas las vacantes (${applicants.length})`
                      : vacanciesWithCounts.find((v) => v.id === selectedVacancyId)?.title || "Vacante"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 bg-popover shadow-xl max-h-72">
                  <SelectItem value="all" className="text-xs font-bold rounded-lg cursor-pointer">
                    Todas las vacantes ({applicants.length})
                  </SelectItem>
                  {vacanciesWithCounts.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs font-semibold rounded-lg cursor-pointer">
                      {v.title} ({v.applicantCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVacancyId !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVacancyId("all")}
                className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted cursor-pointer shrink-0 gap-1.5"
                title="Ver todas las vacantes"
              >
                <X className="size-3.5" />
                <span className="hidden sm:inline">Ver todas</span>
              </Button>
            )}
          </div>
        </div>

        {/* Carrusel Horizontal de Chips con ScrollArea */}
        <div className="pt-2 border-t border-border/30">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                onClick={() => setSelectedVacancyId("all")}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0",
                  selectedVacancyId === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
                )}
              >
                <span>Todas las vacantes</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none",
                    selectedVacancyId === "all"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {applicants.length}
                </span>
              </button>

              {vacanciesWithCounts.map((vac) => {
                const isSelected = selectedVacancyId === vac.id;
                return (
                  <button
                    key={vac.id}
                    type="button"
                    onClick={() => setSelectedVacancyId(vac.id)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 max-w-[280px]",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
                    )}
                  >
                    <span className="truncate">{vac.title}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 leading-none",
                        isSelected
                          ? "bg-white/20 text-white"
                          : vac.applicantCount > 0
                          ? "bg-primary/15 text-primary dark:text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {vac.applicantCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 3. Pipeline Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
              {selectedVacancyId === "all" ? "En todas las convocatorias" : "En esta vacante"}
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              1. Por Revisar
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
              {selectedVacancyId === "all" ? "Pendientes / Revisión" : "Por evaluar"}
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              2. Preselección
            </span>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.shortlisted}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {selectedVacancyId === "all" ? "Listos para agendar" : "Preseleccionados"}
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              3. Entrevistas
            </span>
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.interviews}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {selectedVacancyId === "all" ? "Citas agendadas" : "Entrevistas vacante"}
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              4. Contratados
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.hired}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {selectedVacancyId === "all" ? "Plantilla activa" : "Contratados vacante"}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Master TanStack DataTable Card */}
      <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Unified Toolbar & Filters inside Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
          
          {/* Top Row: Search & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cargo, teléfono, skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-background border-border/50 text-xs font-medium focus-visible:ring-primary/20 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Mostrando <strong className="text-foreground">{filteredApplicants.length}</strong> postulantes
              </span>
            </div>
          </div>

          {/* Bottom Row: Status Filter Tabs & Vacancy Selectors */}
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
                Todos ({currentScopeApplicants.length})
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
                onClick={() => setStatusFilter("Entrevista")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "Entrevista"
                    ? "bg-background text-purple-600 dark:text-purple-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-purple-500 inline-block" />
                <span>Entrevistas ({metrics.interviews})</span>
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
                        : vacanciesWithCounts.find((v) => v.id === selectedVacancyId)?.title || selectedVacancyId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg max-h-64">
                    <SelectItem
                      value="all"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Todas las vacantes ({applicants.length})
                    </SelectItem>
                    {vacanciesWithCounts.map((vac) => (
                      <SelectItem
                        key={vac.id}
                        value={vac.id}
                        className="text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {vac.title} ({vac.applicantCount})
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
                    ? selectedVacancyId !== "all" && currentScopeApplicants.length === 0
                      ? `Sin postulantes para "${selectedVacancy?.title || "esta vacante"}"`
                      : "No se encontraron postulantes"
                    : "Aún no hay postulaciones"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? selectedVacancyId !== "all" && currentScopeApplicants.length === 0
                      ? "Aún ningún candidato se ha postulado a esta vacante en particular. Puedes ver los candidatos de otras vacantes o compartir la convocatoria."
                      : "No hay candidatos que coincidan con la búsqueda o filtros aplicados. Intenta restablecer los filtros."
                    : "Tus convocatorias activas comenzarán a recibir candidatos locales de inmediato."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isFiltered ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {selectedVacancyId !== "all" && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedVacancyId("all")}
                        className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground shadow-xs"
                      >
                        <Briefcase className="size-3.5" />
                        <span>Ver todas las vacantes</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer border-border/50 gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Restablecer Filtros</span>
                    </Button>
                  </div>
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
                      data-state={row.getIsSelected() && "selected"}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest(
                            "button, a, input, [role='combobox'], [role='checkbox'], [role='menuitem'], [data-slot='select-trigger'], [data-slot='select-content'], [data-slot='dropdown-menu-trigger'], [data-slot='dropdown-menu-content'], [data-slot='dropdown-menu-item'], [data-slot='alert-dialog'], [data-slot='alert-dialog-content']"
                          )
                        ) {
                          return;
                        }
                        handleOpenDetail(row.original);
                      }}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
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

      {/* Modal: Full Candidate Profile / Dossier Viewer (Redesigned matching reference) */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full sm:!max-w-[700px] md:!max-w-[740px] rounded-[32px] p-0 overflow-hidden bg-card border-border/80 shadow-2xl !flex !flex-col h-[90vh] max-h-[860px] !gap-0 font-sans"
        >
          {selectedApplicant && (
            <>
              {/* Scrollable Container with entire profile */}
              <div className="flex-1 min-h-0 h-full relative overflow-hidden bg-card w-full max-w-full">
                <ScrollArea className="h-full w-full max-w-full">
                  <div className="flex flex-col w-full max-w-full min-w-0 overflow-x-hidden">
                    
                    {/* 1. Header Banner: Vibrant Warm Orange with Abstract Geometric Watermark */}
                    <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-[#FF5722] via-[#FF6F00] to-[#FF3D00] overflow-hidden shrink-0">
                      {/* Decorative watermark / abstract curved shapes matching reference */}
                      <div className="absolute -right-8 -bottom-12 w-56 h-56 sm:w-72 sm:h-72 rounded-full border-[32px] border-white/20 pointer-events-none" />
                      <div className="absolute right-14 -top-8 w-36 h-36 rounded-full border-[22px] border-white/10 pointer-events-none" />
                      
                      {/* Top Bar inside Banner: Vacancy Badge & Close Button */}
                      <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border-white/20 text-white shadow-xs"
                        >
                          <Briefcase className="size-3 mr-1.5 inline" />
                          <span>{selectedApplicant.vacancyTitle || "Vacante Activa"}</span>
                        </Badge>

                        <button
                          type="button"
                          onClick={() => setIsDetailModalOpen(false)}
                          className="size-8 sm:size-9 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Cerrar modal"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Main Profile Card Content */}
                    <div className="px-6 sm:px-8 pb-8 space-y-5">
                      
                      {/* Avatar overlapping the banner + Status Badge */}
                      <div className="flex justify-between items-end -mt-14 sm:-mt-16 md:-mt-20">
                        <Avatar className="size-24 sm:size-28 md:size-32 rounded-full border-4 border-card bg-card shadow-lg shrink-0">
                          <AvatarImage
                            src={selectedApplicant.avatar}
                            alt={selectedApplicant.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-2xl sm:text-3xl font-black bg-primary/10 text-primary">
                            {getInitials(selectedApplicant.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="mb-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-bold px-3 py-1 rounded-full border shadow-2xs",
                              getStatusBadgeClass(selectedApplicant.status)
                            )}
                          >
                            {selectedApplicant.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Name & Headline */}
                      <div className="space-y-1 text-left">
                        <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                          {selectedApplicant.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base text-muted-foreground font-medium">
                          {selectedApplicant.headline || selectedApplicant.vacancyTitle || "Candidato Profesional"}
                        </DialogDescription>
                      </div>

                      {/* 2.1 Pipeline Stage Progression Stepper */}
                      <div className="rounded-2xl bg-muted/30 border border-border/50 p-3 sm:p-4 my-2 text-left shadow-2xs">
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          {/* 1. Revisión */}
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div
                              className={cn(
                                "size-7 sm:size-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                                selectedApplicant.status === "Pendiente" || selectedApplicant.status === "En revisión"
                                  ? "bg-blue-600 text-white shadow-xs ring-4 ring-blue-500/20"
                                  : (selectedApplicant.status === "Preseleccionado" || selectedApplicant.status === "Entrevista" || selectedApplicant.status === "Contratado")
                                    ? "bg-emerald-600 text-white"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {(selectedApplicant.status === "Preseleccionado" || selectedApplicant.status === "Entrevista" || selectedApplicant.status === "Contratado") ? (
                                <Check className="size-3.5" />
                              ) : (
                                "1"
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold mt-1.5 text-foreground">1. Revisión</span>
                            <span className="text-[9px] text-muted-foreground hidden sm:inline">
                              {selectedApplicant.status === "Pendiente" ? "Por analizar" : "Revisado"}
                            </span>
                          </div>

                          <div
                            className={cn(
                              "h-0.5 flex-1 mx-1 rounded-full transition-colors",
                              (selectedApplicant.status === "Preseleccionado" || selectedApplicant.status === "Entrevista" || selectedApplicant.status === "Contratado")
                                ? "bg-emerald-600"
                                : "bg-border/60"
                            )}
                          />

                          {/* 2. Preselección */}
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div
                              className={cn(
                                "size-7 sm:size-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                                selectedApplicant.status === "Preseleccionado"
                                  ? "bg-indigo-600 text-white shadow-xs ring-4 ring-indigo-500/20"
                                  : (selectedApplicant.status === "Entrevista" || selectedApplicant.status === "Contratado")
                                    ? "bg-emerald-600 text-white"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {(selectedApplicant.status === "Entrevista" || selectedApplicant.status === "Contratado") ? (
                                <Check className="size-3.5" />
                              ) : (
                                "2"
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold mt-1.5 text-foreground">2. Pre-selección</span>
                            <span className="text-[9px] text-muted-foreground hidden sm:inline">
                              {selectedApplicant.status === "Preseleccionado" ? "Seleccionado" : "Filtro inicial"}
                            </span>
                          </div>

                          <div
                            className={cn(
                              "h-0.5 flex-1 mx-1 rounded-full transition-colors",
                              (selectedApplicant.status === "Entrevista" || selectedApplicant.status === "Contratado")
                                ? "bg-emerald-600"
                                : "bg-border/60"
                            )}
                          />

                          {/* 3. Entrevista */}
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div
                              className={cn(
                                "size-7 sm:size-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                                selectedApplicant.status === "Entrevista"
                                  ? "bg-purple-600 text-white shadow-xs ring-4 ring-purple-500/20"
                                  : selectedApplicant.status === "Contratado"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {selectedApplicant.status === "Contratado" ? (
                                <Check className="size-3.5" />
                              ) : (
                                "3"
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold mt-1.5 text-foreground">3. Entrevista</span>
                            <span className="text-[9px] text-muted-foreground hidden sm:inline">
                              {selectedApplicant.status === "Entrevista" ? "Cita agendada" : "Cita laboral"}
                            </span>
                          </div>

                          <div
                            className={cn(
                              "h-0.5 flex-1 mx-1 rounded-full transition-colors",
                              selectedApplicant.status === "Contratado" ? "bg-emerald-600" : "bg-border/60"
                            )}
                          />

                          {/* 4. Contratación */}
                          <div className="flex-1 flex flex-col items-center text-center">
                            <div
                              className={cn(
                                "size-7 sm:size-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                                selectedApplicant.status === "Contratado"
                                  ? "bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-500/20"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {selectedApplicant.status === "Contratado" ? (
                                <Sparkles className="size-3.5" />
                              ) : (
                                "4"
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold mt-1.5 text-foreground">4. Contratación</span>
                            <span className="text-[9px] text-muted-foreground hidden sm:inline">
                              {selectedApplicant.status === "Contratado" ? "Contratado" : "Decisión final"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2.2 Cita de Entrevista Agendada Card */}
                      {selectedApplicant.status === "Entrevista" && selectedApplicant.interview && (
                        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-left space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Calendar className="size-3.5" />
                              Cita de Entrevista Programada
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenScheduleInterview(selectedApplicant)}
                              className="h-7 text-[11px] font-bold rounded-lg border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                            >
                              Reagendar Cita
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-foreground pt-1">
                            <div className="flex items-center gap-2">
                              <Clock className="size-3.5 text-purple-600 shrink-0" />
                              <span>{selectedApplicant.interview.date} a las {selectedApplicant.interview.time || "10:00"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedApplicant.interview.modality === "presencial" ? (
                                <MapPin className="size-3.5 text-purple-600 shrink-0" />
                              ) : (
                                <Video className="size-3.5 text-purple-600 shrink-0" />
                              )}
                              <span className="truncate">
                                {selectedApplicant.interview.modality === "presencial" ? "Presencial: " : "Virtual: "}
                                {selectedApplicant.interview.locationOrLink}
                              </span>
                            </div>
                          </div>
                          {selectedApplicant.interview.notes && (
                            <p className="text-[11px] text-muted-foreground font-medium pt-1.5 border-t border-purple-500/20">
                              <strong className="text-foreground">Indicaciones:</strong> {selectedApplicant.interview.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 3. 4-Metrics Row (Exact format from reference: Posts, Likes, Followers, Following) */}
                      <div className="grid grid-cols-4 gap-2 sm:gap-4 py-4 sm:py-5 border-y border-border/40 text-left">
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-foreground">
                            {selectedApplicant.experiences?.length || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                            Experiencias
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-1">
                            <span>{selectedApplicant.rating > 0 ? selectedApplicant.rating.toFixed(1) : "5.0"}</span>
                            <Star className="size-3.5 fill-amber-400 text-amber-400 inline" />
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                            Calificación
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-foreground">
                            {selectedApplicant.skills?.length || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                            Habilidades
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-foreground truncate">
                            {selectedApplicant.elapsedTime || "Reciente"}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                            Postulado
                          </div>
                        </div>
                      </div>

                      {/* 4. Action Buttons Row (Exact 3 pill buttons like the reference image, stage-aware) */}
                      <div className="flex items-center gap-2.5 sm:gap-3 py-1">
                        {/* Pill 1: Dynamic Action according to Pipeline Stage */}
                        {selectedApplicant.status === "Pendiente" ? (
                          <Button
                            onClick={async () => {
                              await handleUpdateStatus(selectedApplicant.id, "En revisión");
                              setSelectedApplicant((prev) => prev ? { ...prev, status: "En revisión" } : null);
                            }}
                            className="flex-1 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                          >
                            <Eye className="size-4" />
                            <span>Iniciar Revisión</span>
                          </Button>
                        ) : selectedApplicant.status === "En revisión" ? (
                          <Button
                            onClick={async () => {
                              await handleUpdateStatus(selectedApplicant.id, "Preseleccionado");
                              setSelectedApplicant((prev) => prev ? { ...prev, status: "Preseleccionado" } : null);
                            }}
                            className="flex-1 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                          >
                            <CheckCircle2 className="size-4" />
                            <span>Preseleccionar</span>
                          </Button>
                        ) : selectedApplicant.status === "Preseleccionado" ? (
                          <Button
                            onClick={() => handleOpenScheduleInterview(selectedApplicant)}
                            className="flex-1 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 shadow-xs bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                          >
                            <Calendar className="size-4" />
                            <span>Agendar Cita</span>
                          </Button>
                        ) : selectedApplicant.status === "Entrevista" ? (
                          <Button
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              handleStartHire(selectedApplicant);
                            }}
                            className="flex-1 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            <Sparkles className="size-4" />
                            <span>Contratar</span>
                          </Button>
                        ) : selectedApplicant.status === "Contratado" ? (
                          <Button
                            disabled
                            variant="outline"
                            className="flex-1 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 border-emerald-500/40 text-emerald-600 bg-emerald-500/10 cursor-default"
                          >
                            <CheckCircle2 className="size-4" />
                            <span>Contratado</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={async () => {
                              await handleUpdateStatus(selectedApplicant.id, "En revisión");
                              setSelectedApplicant((prev) => prev ? { ...prev, status: "En revisión" } : null);
                            }}
                            className="flex-1 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 border-border/80 text-foreground cursor-pointer"
                          >
                            <RotateCcw className="size-4" />
                            <span>Reactivar</span>
                          </Button>
                        )}

                        {/* Pill 2: WhatsApp */}
                        {selectedApplicant.phone && (
                          <a
                            href={getWhatsAppLink(selectedApplicant)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleContactApplicant(selectedApplicant)}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 border-border/80 hover:bg-muted/50 text-foreground cursor-pointer shadow-2xs"
                            >
                              <MessageSquare className="size-4 text-emerald-600" />
                              <span>WhatsApp</span>
                            </Button>
                          </a>
                        )}

                        {/* Pill 3: Email or Reagendar */}
                        {selectedApplicant.status === "Entrevista" ? (
                          <Button
                            variant="outline"
                            onClick={() => handleOpenScheduleInterview(selectedApplicant)}
                            className="flex-1 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 border-border/80 hover:bg-muted/50 text-foreground cursor-pointer shadow-2xs"
                          >
                            <Calendar className="size-4 text-purple-600" />
                            <span>Reagendar</span>
                          </Button>
                        ) : (
                          <a
                            href={`mailto:${selectedApplicant.email || "contacto@candidato.com"}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm gap-2 border-border/80 hover:bg-muted/50 text-foreground cursor-pointer shadow-2xs"
                            >
                              <Mail className="size-4 text-primary" />
                              <span>Email</span>
                            </Button>
                          </a>
                        )}
                      </div>

                      {/* 5. "About" Section */}
                      <div className="pt-2 text-left space-y-3">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                          About
                        </h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground font-normal whitespace-pre-line">
                          {selectedApplicant.bio ||
                            "Profesional proactivo con pasión por generar impacto positivo y soluciones centradas en el usuario. Cuenta con trayectoria en el área, adaptabilidad y compromiso para integrarse y aportar al equipo desde el primer día."}
                        </p>

                        {/* Meta items with icons like in the reference image bottom section */}
                        <div className="space-y-2 pt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-muted-foreground/70 shrink-0" />
                            <span>{selectedApplicant.location || "Ubicación en el Sureste de México"}</span>
                          </div>
                          {selectedApplicant.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="size-4 text-muted-foreground/70 shrink-0" />
                              <span>{selectedApplicant.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Briefcase className="size-4 text-muted-foreground/70 shrink-0" />
                            <span>Postulación: <strong className="text-foreground">{selectedApplicant.vacancyTitle}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <FileText className="size-4 text-primary shrink-0" />
                            <button
                              type="button"
                              onClick={() => setActiveModalTab("curriculum")}
                              className="text-primary hover:underline font-bold text-xs sm:text-sm text-left cursor-pointer flex items-center gap-1"
                            >
                              <span>Ver Currículum en PDF</span>
                              <ChevronRight className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 6. Tabs for Deep Dossier: Trayectoria, CV en PDF, Notas Internas, (Documentos LFT si Contratado) */}
                      <div className="pt-4 border-t border-border/40 w-full max-w-full min-w-0">
                        <Tabs value={activeModalTab} onValueChange={setActiveModalTab} className="w-full max-w-full min-w-0 space-y-4">
                          <TabsList
                            className={cn(
                              "grid w-full max-w-full h-11 p-1 rounded-2xl bg-muted/40 border border-border/40",
                              selectedApplicant.status === "Contratado" ? "grid-cols-4" : "grid-cols-3"
                            )}
                          >
                            <TabsTrigger
                              value="experience"
                              className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer min-w-0"
                            >
                              <Briefcase className="size-3.5 shrink-0" />
                              <span className="truncate">Trayectoria</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="curriculum"
                              className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer min-w-0"
                            >
                              <FileText className="size-3.5 text-primary shrink-0" />
                              <span className="truncate">CV en PDF</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="notes"
                              className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer min-w-0"
                            >
                              <PenTool className="size-3.5 shrink-0" />
                              <span className="truncate">Notas Internas</span>
                            </TabsTrigger>
                            {selectedApplicant.status === "Contratado" && (
                              <TabsTrigger
                                value="documents"
                                className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer min-w-0"
                              >
                                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">Documentos LFT</span>
                              </TabsTrigger>
                            )}
                          </TabsList>

                          {/* TAB 1: Trayectoria, Habilidades & Educación */}
                          <TabsContent value="experience" className="space-y-4 m-0 focus-visible:outline-none text-left w-full max-w-full min-w-0 overflow-hidden">
                            {/* Skills */}
                            {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                              <Card className="bg-muted/15 border border-border/40 rounded-2xl p-4 space-y-2.5">
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
                            {selectedApplicant.experiences && selectedApplicant.experiences.length > 0 && (
                              <Card className="bg-muted/15 border border-border/40 rounded-2xl p-4 space-y-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Historial Laboral
                                </span>
                                <div className="space-y-2.5">
                                  {selectedApplicant.experiences.map((exp, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3.5 rounded-xl bg-card border border-border/40 space-y-1 shadow-2xs"
                                    >
                                      <div className="flex justify-between items-start gap-2">
                                        <h5 className="text-xs sm:text-sm font-bold text-foreground">
                                          {exp.role}
                                        </h5>
                                        <Badge variant="outline" className="text-[10px] font-semibold">
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
                            {selectedApplicant.education && selectedApplicant.education.length > 0 && (
                              <Card className="bg-muted/15 border border-border/40 rounded-2xl p-4 space-y-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Formación Académica
                                </span>
                                <div className="space-y-2">
                                  {selectedApplicant.education.map((edu, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-xl bg-card border border-border/30 space-y-0.5 shadow-2xs"
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

                          {/* TAB 2: Currículum Vitae (CV) */}
                          <TabsContent value="curriculum" className="space-y-4 m-0 focus-visible:outline-none text-left w-full max-w-full min-w-0 overflow-hidden">
                            <CandidateCvViewer applicant={selectedApplicant} />
                          </TabsContent>

                          {/* TAB 3: Notas Internas */}
                          <TabsContent value="notes" className="space-y-4 m-0 focus-visible:outline-none text-left w-full max-w-full min-w-0 overflow-hidden">
                            <Card className="bg-muted/15 border border-border/40 rounded-2xl p-5 space-y-3">
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  Notas Privadas del Reclutador
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Estas notas son internas y nunca serán visibles para el candidato.
                                </p>
                              </div>

                              <Textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Anotaciones de entrevista telefónica, expectativas salariales, disponibilidad..."
                                className="min-h-[120px] rounded-xl bg-card border-border/60 text-xs font-medium shadow-2xs"
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

                          {/* TAB 4: Documentos LFT (Solo para colaboradores contratados) */}
                          {selectedApplicant.status === "Contratado" && (
                            <TabsContent value="documents" className="space-y-4 m-0 focus-visible:outline-none text-left w-full max-w-full min-w-0 overflow-hidden">
                              <Card className="bg-muted/15 border border-border/40 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="size-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-foreground">
                                      Bóveda de Documentos Oficiales LFT (Colaborador Contratado)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      INE, CURP, Constancia SAT, NSS y Comprobante de domicilio para alta laboral y nómina.
                                    </p>
                                  </div>
                                </div>

                                {docAccessState?.status === "approved" ? (
                                  <div className="space-y-3 pt-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-xs px-3 py-1 rounded-lg">
                                      <CheckCircle2 className="size-3.5 mr-1" />
                                      Acceso Autorizado por el Colaborador
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
                                            className="p-3 rounded-xl bg-card border border-border/30 flex items-center justify-between text-xs shadow-2xs"
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
                                                toast.info(`Descargando documento: ${doc.title || doc.name}`)
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
                                        El colaborador aún no ha subido archivos a su bóveda digital.
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
                                      Se envió una notificación al colaborador para autorizar el expediente.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-xl bg-card border border-border/40 space-y-3 shadow-2xs">
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
                                      <span>Solicitar Acceso a Documentos de Contratación</span>
                                    </Button>
                                  </div>
                                )}
                              </Card>
                            </TabsContent>
                          )}
                        </Tabs>
                      </div>

                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* 7. Bottom Operation Footer */}
              <DialogFooter className="p-4 px-6 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
                  >
                    Cerrar
                  </Button>

                  {selectedApplicant.status !== "Descartado" && selectedApplicant.status !== "Contratado" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await handleUpdateStatus(selectedApplicant.id, "Descartado");
                        setSelectedApplicant((prev) => prev ? { ...prev, status: "Descartado" } : null);
                      }}
                      className="rounded-xl text-xs font-semibold h-9 px-3 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 cursor-pointer"
                    >
                      Descartar
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Contextual Next Step Button */}
                  {selectedApplicant.status === "Pendiente" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await handleUpdateStatus(selectedApplicant.id, "En revisión");
                        setSelectedApplicant((prev) => prev ? { ...prev, status: "En revisión" } : null);
                      }}
                      className="rounded-xl text-xs font-bold h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer gap-1.5"
                    >
                      <Eye className="size-3.5" />
                      <span>1. Iniciar Revisión</span>
                    </Button>
                  )}

                  {selectedApplicant.status === "En revisión" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await handleUpdateStatus(selectedApplicant.id, "Preseleccionado");
                        setSelectedApplicant((prev) => prev ? { ...prev, status: "Preseleccionado" } : null);
                      }}
                      className="rounded-xl text-xs font-bold h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer gap-1.5"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>2. Marcar Preseleccionado</span>
                    </Button>
                  )}

                  {selectedApplicant.status === "Preseleccionado" && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenScheduleInterview(selectedApplicant)}
                      className="rounded-xl text-xs font-bold h-9 px-5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer gap-1.5"
                    >
                      <Calendar className="size-3.5" />
                      <span>3. Agendar Cita de Entrevista</span>
                    </Button>
                  )}

                  {selectedApplicant.status === "Entrevista" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleStartHire(selectedApplicant);
                      }}
                      className="rounded-xl text-xs font-bold h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer gap-1.5"
                    >
                      <Sparkles className="size-3.5" />
                      <span>4. Formalizar Contratación Final</span>
                    </Button>
                  )}

                  {selectedApplicant.status === "Contratado" && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold text-xs">
                      <CheckCircle2 className="size-3.5 mr-1" />
                      Candidato Contratado
                    </Badge>
                  )}

                  {selectedApplicant.status === "Descartado" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await handleUpdateStatus(selectedApplicant.id, "En revisión");
                        setSelectedApplicant((prev) => prev ? { ...prev, status: "En revisión" } : null);
                      }}
                      className="rounded-xl text-xs font-bold h-9 px-4 cursor-pointer gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Reactivar Postulación</span>
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Agendar Cita de Entrevista (Rediseñada con mayor ancho, ScrollArea, Video Plataformas y shadcn DatePicker) */}
      <Dialog open={isInterviewModalOpen} onOpenChange={setIsInterviewModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full sm:!max-w-[700px] md:!max-w-[740px] rounded-[32px] p-0 overflow-hidden bg-card border-border/80 shadow-2xl flex flex-col h-[88vh] max-h-[820px] gap-0 font-sans"
        >
          {/* 1. Header (Fijo arriba) */}
          <div className="p-5 sm:p-6 pb-4 border-b border-border/40 shrink-0 bg-card z-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary border border-primary/25 flex items-center justify-center shadow-2xs shrink-0">
                  <CalendarCheck className="size-5.5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                    Agendar Cita de Entrevista
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-medium">
                    Coordina la fecha, horario y modalidad de evaluación con el postulante.
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] font-bold px-3 py-1 rounded-full bg-primary/5 text-primary border-primary/25 hidden sm:inline-flex shrink-0">
                  Etapa 3 • Entrevista Laboral
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="size-8 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  aria-label="Cerrar modal"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Ficha Resumen del Candidato */}
            {interviewApplicant && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50 text-left">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="size-10 rounded-xl border border-border/50 shrink-0">
                    <AvatarImage src={interviewApplicant.avatar} alt={interviewApplicant.name} />
                    <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                      {getInitials(interviewApplicant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {interviewApplicant.name}
                      </h4>
                      <Badge variant="outline" className="text-[10px] font-bold shrink-0 bg-background text-primary border-primary/30">
                        Postulante
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Vacante: <strong className="text-foreground">{interviewApplicant.vacancyTitle}</strong>
                    </p>
                  </div>
                </div>
                {interviewApplicant.phone && (
                  <span className="text-[11px] text-muted-foreground font-semibold hidden sm:inline shrink-0 pl-2">
                    {interviewApplicant.phone}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 2. Cuerpo con ScrollArea para navegación fluida sin desborde */}
          <div className="flex-1 min-h-0 h-full relative overflow-hidden bg-card w-full max-w-full">
            <ScrollArea className="h-full w-full max-w-full">
              <div className="p-6 sm:p-7 space-y-6 text-left">
              {/* Bloque 1: Fecha y Horario en 2 Columnas (Desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Columna Izquierda: Fecha */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      <span>Fecha de la Entrevista</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Solo fechas presentes o futuras
                    </span>
                  </div>

                  {/* Shadcn UI DatePicker con hidePastDates={true} y minDate={new Date()} */}
                  <DatePicker
                    value={interviewDate}
                    onChange={(newDate) => setInterviewDate(newDate)}
                    minDate={new Date()}
                    hidePastDates={true}
                    placeholder="Selecciona el día de la cita"
                    className="h-10.5 rounded-xl border-border/70 bg-background font-medium text-xs sm:text-sm shadow-2xs"
                  />

                  {/* Atajos Rápidos de Fecha */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mr-0.5">
                      Rápido:
                    </span>
                    {[
                      { label: "Hoy", val: getQuickDateIso(0) },
                      { label: "Mañana", val: getQuickDateIso(1) },
                      { label: "En 2 días", val: getQuickDateIso(2) },
                      { label: "Próx. Lunes", val: getQuickDateIso("nextMonday") },
                    ].map((item) => {
                      const isActive = interviewDate === item.val;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setInterviewDate(item.val)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border",
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                              : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50 hover:text-foreground"
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Columna Derecha: Horario */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      <span>Horario de la Cita</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Formato 24h
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="rounded-xl h-10.5 text-xs sm:text-sm font-semibold bg-background border-border/70 w-32 shrink-0 shadow-2xs"
                    />

                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      {quickTimes.map((timeStr) => {
                        const isActive = interviewTime === timeStr;
                        return (
                          <button
                            key={timeStr}
                            type="button"
                            onClick={() => setInterviewTime(timeStr)}
                            className={cn(
                              "px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border",
                              isActive
                                ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                                : "bg-muted/30 hover:bg-muted text-muted-foreground border-border/40 hover:text-foreground"
                            )}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Selector de Modalidad */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Modalidad de Reunión</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInterviewModality("presencial");
                      if (!interviewLocationOrLink || interviewLocationOrLink.includes("http")) {
                        setInterviewLocationOrLink(interviewApplicant?.location || "Instalaciones de la empresa / Sucursal");
                      }
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                      interviewModality === "presencial"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/25 shadow-2xs"
                        : "border-border/60 bg-card hover:bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      interviewModality === "presencial" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <MapPin className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-foreground">Reunión Presencial</div>
                      <div className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                        En sucursal física u oficinas de la empresa
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInterviewModality("virtual");
                      handleSelectPlatform(interviewPlatform || "meet");
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                      interviewModality === "virtual"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/25 shadow-2xs"
                        : "border-border/60 bg-card hover:bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      interviewModality === "virtual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <Video className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-foreground">Videollamada en Línea</div>
                      <div className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                        Google Meet, Zoom o Microsoft Teams
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bloque 3: Configuración Dinámica de la Reunión */}
              {interviewModality === "virtual" ? (
                /* Sub-bloque Videollamada: Integración con Meet / Zoom / Teams / Enlace ya hecho */
                <div className="space-y-3.5 p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Video className="size-3.5 text-primary" />
                      <span>Plataforma de Videollamada</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Selecciona tu plataforma o pega un enlace ya creado
                    </span>
                  </div>

                  {/* Selector de Plataforma */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "meet", name: "Google Meet", badge: "meet.new" },
                      { id: "zoom", name: "Zoom", badge: "zoom.us" },
                      { id: "teams", name: "MS Teams", badge: "live.com" },
                      { id: "custom", name: "Enlace ya hecho", badge: "Personalizado" },
                    ].map((plat) => {
                      const isSelected = interviewPlatform === plat.id;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => handleSelectPlatform(plat.id as any)}
                          className={cn(
                            "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                              : "bg-background hover:bg-muted/50 text-muted-foreground border-border/60 hover:text-foreground"
                          )}
                        >
                          <div className="text-xs font-bold">{plat.name}</div>
                          <div className={cn("text-[10px] opacity-80", isSelected ? "text-primary-foreground/90" : "text-muted-foreground")}>
                            {plat.badge}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Acciones de Generación Rápida según Plataforma */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
                    {interviewPlatform === "meet" && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open("https://meet.new", "_blank")}
                          className="h-8 rounded-lg text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Crear nueva sala en Google Meet (meet.new)</span>
                        </Button>
                        <span className="text-[11px] text-muted-foreground hidden md:inline">
                          Abre Meet en tu navegador para copiar el enlace
                        </span>
                      </div>
                    )}

                    {interviewPlatform === "zoom" && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open("https://zoom.us/start/videomeeting", "_blank")}
                          className="h-8 rounded-lg text-xs font-semibold gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Iniciar / Crear reunión en Zoom (zoom.us)</span>
                        </Button>
                        <span className="text-[11px] text-muted-foreground hidden md:inline">
                          Genera tu enlace de sala en Zoom
                        </span>
                      </div>
                    )}

                    {interviewPlatform === "teams" && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open("https://teams.live.com/meet", "_blank")}
                          className="h-8 rounded-lg text-xs font-semibold gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>Crear reunión en Microsoft Teams</span>
                        </Button>
                        <span className="text-[11px] text-muted-foreground hidden md:inline">
                          Abre Teams para crear sala
                        </span>
                      </div>
                    )}

                    {interviewPlatform === "custom" && (
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Pega aquí cualquier enlace de reunión previamente creado (Meet, Zoom, Teams o Calendly).
                      </span>
                    )}
                  </div>

                  {/* Input con Icono y Acciones de Probar/Copiar */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Enlace de la Videollamada</span>
                      {interviewLocationOrLink && interviewLocationOrLink.startsWith("http") && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(interviewLocationOrLink, "_blank")}
                            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                            title="Probar enlace en pestaña nueva"
                          >
                            <ExternalLink className="size-3" />
                            <span>Probar enlace</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(interviewLocationOrLink);
                              toast.success("Enlace copiado al portapapeles");
                            }}
                            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                            title="Copiar enlace"
                          >
                            <Copy className="size-3" />
                            <span>Copiar</span>
                          </button>
                        </div>
                      )}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        <LinkIcon className="size-4 text-primary" />
                      </div>
                      <Input
                        value={interviewLocationOrLink}
                        onChange={(e) => setInterviewLocationOrLink(e.target.value)}
                        placeholder={
                          interviewPlatform === "meet"
                            ? "Ej. https://meet.google.com/xyz-abcd-efg"
                            : interviewPlatform === "zoom"
                            ? "Ej. https://zoom.us/j/1234567890"
                            : interviewPlatform === "teams"
                            ? "Ej. https://teams.microsoft.com/l/meetup-join/..."
                            : "Pega el enlace de la reunión aquí..."
                        }
                        className="rounded-xl h-11 text-xs sm:text-sm font-medium pl-10 pr-4 bg-background border-border/70 shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      El candidato recibirá este enlace con un botón directo en su WhatsApp para conectarse a la hora programada.
                    </p>
                  </div>
                </div>
              ) : (
                /* Sub-bloque Presencial: Dirección o Sucursal */
                <div className="space-y-2.5 p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" />
                      <span>Dirección o Sucursal de la Entrevista</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Lugar físico para presentarse
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <MapPin className="size-4 text-primary" />
                    </div>
                    <Input
                      value={interviewLocationOrLink}
                      onChange={(e) => setInterviewLocationOrLink(e.target.value)}
                      placeholder="Ej. Av. Paseo de Montejo #450 x 39, Col. Centro, Mérida, Yucatán"
                      className="rounded-xl h-11 text-xs sm:text-sm font-medium pl-10 bg-background border-border/70 shadow-2xs"
                    />
                  </div>

                  {/* Atajos de Dirección de Sucursales */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mr-0.5">
                      Sugerencias:
                    </span>
                    {[
                      interviewApplicant?.location || "Felipe Carrillo Puerto",
                      "Oficinas Centrales",
                      "Sucursal Mérida Norte",
                      "Instalaciones de la empresa",
                    ]
                      .filter(Boolean)
                      .map((locSnippet, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInterviewLocationOrLink(locSnippet)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
                        >
                          {locSnippet}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Bloque 4: Indicaciones para el Candidato */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Indicaciones para el Candidato</label>
                  <span className="text-[11px] text-muted-foreground">Opcional</span>
                </div>
                <Textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Ej. Presentarse con 10 minutos de anticipación e identificación oficial física..."
                  className="min-h-[76px] rounded-xl text-xs sm:text-sm font-medium bg-background border-border/70 shadow-2xs resize-none"
                />

                {/* Chips de Sugerencias */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-0.5">
                    Añadir indicación rápida:
                  </span>
                  {quickNotesSnippets.map((snippet) => (
                    <button
                      key={snippet}
                      type="button"
                      onClick={() => handleAppendInterviewNote(snippet)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
                    >
                      + {snippet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloque 5: Banner de Recordatorio de WhatsApp */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium leading-relaxed">
                <MessageSquare className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Mensaje listo para WhatsApp:</strong> Al confirmar la cita, el estado del candidato avanzará automáticamente a <strong>Entrevista</strong> y se generará el mensaje personalizado con fecha, hora, modalidad y el enlace directo o dirección para enviárselo al instante.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

          {/* 3. Footer (Fijo abajo con fondo opaco sólido para que el contenido nunca se trasluzca) */}
          <div className="p-4 sm:p-5 border-t border-border/40 bg-card shrink-0 flex items-center justify-between sm:justify-end gap-3 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInterviewModalOpen(false)}
              className="rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer border-border/70 hover:bg-muted/50"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmInterview}
              disabled={isScheduling || !interviewDate}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer shadow-md gap-2"
            >
              {isScheduling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CalendarCheck className="size-4" />
              )}
              <span>Confirmar Cita de Entrevista</span>
            </Button>
          </div>
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
