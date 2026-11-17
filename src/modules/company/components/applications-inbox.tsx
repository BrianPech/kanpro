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
  Briefcase,
  ExternalLink,
  Phone,
  ArrowLeft,
  Loader2,
  FileText,
  ShieldCheck,
  Lock,
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
  Clock,
  MapPin,
} from "@/components/ui/icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Calendar03Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  Download01Icon,
  InboxIcon,
  StarIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
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

const APP_STATUS_PILL: Record<Applicant["status"], string> = {
  Pendiente: "bg-warning text-warning-foreground",
  "En revisión":
    "bg-[#e8f2fb] text-[#184c78] dark:bg-[#213748] dark:text-[#abd6f5]",
  Preseleccionado:
    "bg-[#e8f2fb] text-[#184c78] dark:bg-[#213748] dark:text-[#abd6f5]",
  Entrevista:
    "bg-[#e8f2fb] text-[#184c78] dark:bg-[#213748] dark:text-[#abd6f5]",
  Contratado: "bg-success text-success-foreground",
  Descartado:
    "bg-[#fcebe9] text-[#a6302a] dark:bg-[#3e2220] dark:text-[#f29b94]",
};

export function ApplicationsInbox({ companyId }: { companyId?: string } = {}) {
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
  } = useApplicationsInbox({ companyId });

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
      if (!res.success) {
        throw new Error(res.error);
      }
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
      if (ratingFilter === "unrated") {
        matchesRating = !app.internalRating;
      } else if (ratingFilter === "top") {
        matchesRating = (app.internalRating || 0) >= 5;
      } else if (ratingFilter === "high") {
        matchesRating = (app.internalRating || 0) >= 4;
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
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Candidato
          </span>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center gap-[12px] min-w-[200px]">
              <Avatar
                onClick={() => handleOpenDetail(app)}
                className="size-[36px] rounded-[8px] bg-sidebar-accent text-link shrink-0 cursor-pointer after:hidden"
              >
                <AvatarImage
                  src={app.avatar}
                  alt={app.name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-[8px] text-[12px] font-semibold bg-sidebar-accent text-link">
                  {getInitials(app.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(app)}
                  className="text-[14px] font-semibold leading-[20px] text-link hover:underline truncate block text-left cursor-pointer"
                >
                  {app.name}
                </button>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground truncate">
                  {app.location || "Local"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "vacancyTitle",
        id: "vacancyTitle",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Vacante
          </span>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <Link
              href={
                app.vacancyId
                  ? `/dashboard/company/vacancies/${app.vacancyId}`
                  : "/dashboard/company/vacancies"
              }
              className="text-[14px] font-normal leading-[20px] text-foreground hover:text-link transition-colors truncate block max-w-[240px]"
              title={app.vacancyTitle || "Vacante"}
            >
              {app.vacancyTitle || "Vacante"}
            </Link>
          );
        },
      },
      {
        accessorKey: "elapsedTime",
        id: "elapsedTime",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-[6px] text-[12px] font-medium leading-[16px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha de postulación</span>
            <ArrowUpDown className="size-[14px] text-link" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-[14px] font-normal leading-[20px] text-foreground whitespace-nowrap">
            {row.original.elapsedTime || "Reciente"}
          </span>
        ),
      },
      {
        accessorKey: "rating",
        id: "rating",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Calificación
          </span>
        ),
        cell: ({ row }) => {
          const score = row.original.internalRating;
          if (!score || score <= 0) {
            return (
              <span className="text-[14px] font-normal leading-[20px] text-muted-foreground whitespace-nowrap">
                Sin calificar
              </span>
            );
          }
          return (
            <div className="inline-flex items-center gap-[6px] text-[14px] font-medium leading-[20px] text-foreground whitespace-nowrap">
              <HugeiconsIcon
                icon={StarIcon}
                className="size-[16px] text-warning-foreground shrink-0"
                strokeWidth={2}
              />
              <span>{score.toFixed(1)} / 5</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Estatus
          </span>
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-[10px] py-[4px] text-[12px] font-medium leading-[16px] whitespace-nowrap",
                APP_STATUS_PILL[status]
              )}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground block text-right">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Más acciones para ${app.name}`}
                      className="size-[36px] rounded-[8px] bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                    />
                  }
                >
                  <MoreHorizontal className="size-[16px]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-xl border-border/60 bg-popover shadow-lg"
                >
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

                  {app.phone && (
                    <DropdownMenuItem
                      render={
                        <a
                          href={getWhatsAppLink(app)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleContactApplicant(app)}
                        />
                      }
                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-emerald-600 dark:text-emerald-400"
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Contactar por WhatsApp</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  {app.status === "Pendiente" && (
                    <DropdownMenuItem
                      onSelect={() => handleUpdateStatus(app.id, "En revisión")}
                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-blue-600 dark:text-blue-400"
                    >
                      <Eye className="size-3.5" />
                      <span>1. Iniciar Revisión</span>
                    </DropdownMenuItem>
                  )}

                  {app.status !== "Preseleccionado" &&
                    app.status !== "Contratado" && (
                      <DropdownMenuItem
                        onSelect={() =>
                          handleUpdateStatus(app.id, "Preseleccionado")
                        }
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

                  {app.status !== "Contratado" && (
                    <DropdownMenuItem
                      onSelect={() => handleStartHire(app)}
                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-primary hover:bg-primary/10"
                    >
                      <Sparkles className="size-3.5 text-primary" />
                      <span>4. Formalizar Contratación</span>
                    </DropdownMenuItem>
                  )}

                  {app.status !== "Descartado" &&
                    app.status !== "Contratado" && (
                      <DropdownMenuItem
                        onSelect={() =>
                          handleUpdateStatus(app.id, "Descartado")
                        }
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
        pageSize: 10,
      },
    },
  });

  const tableRows = table.getRowModel().rows;
  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = Math.max(1, table.getPageCount());
  const rangeStart = totalFilteredRows === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min(totalFilteredRows, (pageIndex + 1) * pageSize);

  return (
    <div className="flex flex-col gap-[24px] w-full pb-12 font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px]">
        <div>
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
            Postulaciones
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground mt-[4px]">
            Revisa candidatos y da seguimiento a cada etapa de selección.
          </p>
        </div>

        <Link
          href="/dashboard/company/vacancies"
          className="inline-flex h-[44px] items-center justify-center gap-[8px] rounded-[8px] border border-control-border bg-card px-[16px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-muted/50 transition-colors shrink-0 self-start sm:self-auto"
        >
          <HugeiconsIcon
            icon={Briefcase01Icon}
            className="size-[16px] text-muted-foreground"
            strokeWidth={1.8}
          />
          <span>Ver vacantes</span>
        </Link>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[16px]">
        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
              Postulaciones
            </span>
            <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={InboxIcon} className="size-[16px]" strokeWidth={1.8} />
            </div>
          </div>
          <p className="text-[24px] font-semibold leading-[32px] tracking-[-0.01em] text-foreground tabular-nums">
            {metrics.total}
          </p>
          <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            {selectedVacancyId === "all" ? "En todas las vacantes" : "En esta vacante"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
              Por revisar
            </span>
            <div className="size-[32px] rounded-[8px] bg-warning text-warning-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Clock01Icon} className="size-[16px]" strokeWidth={1.8} />
            </div>
          </div>
          <p className="text-[24px] font-semibold leading-[32px] tracking-[-0.01em] text-foreground tabular-nums">
            {metrics.pending}
          </p>
          <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Pendientes o en revisión
          </p>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
              Preseleccionados
            </span>
            <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserCheck01Icon} className="size-[16px]" strokeWidth={1.8} />
            </div>
          </div>
          <p className="text-[24px] font-semibold leading-[32px] tracking-[-0.01em] text-foreground tabular-nums">
            {metrics.shortlisted}
          </p>
          <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Candidatos por contactar
          </p>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
              Entrevistas
            </span>
            <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Calendar03Icon} className="size-[16px]" strokeWidth={1.8} />
            </div>
          </div>
          <p className="text-[24px] font-semibold leading-[32px] tracking-[-0.01em] text-foreground tabular-nums">
            {metrics.interviews}
          </p>
          <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Candidatos en esta etapa
          </p>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
              Contratados
            </span>
            <div className="size-[32px] rounded-[8px] bg-success text-success-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-[16px]" strokeWidth={1.8} />
            </div>
          </div>
          <p className="text-[24px] font-semibold leading-[32px] tracking-[-0.01em] text-foreground tabular-nums">
            {metrics.hired}
          </p>
          <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Procesos concluidos
          </p>
        </div>
      </div>

      {/* Main Card: Bandeja de postulaciones */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        {/* Card Header */}
        <div className="px-[20px] py-[16px] border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
          <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
            Bandeja de postulaciones
          </h2>

          <button
            type="button"
            onClick={() => handleExportCSV(filteredApplicants)}
            className="inline-flex h-[44px] items-center justify-center gap-[8px] rounded-[8px] border border-control-border bg-card px-[16px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <HugeiconsIcon
              icon={Download01Icon}
              className="size-[16px] text-muted-foreground"
              strokeWidth={1.8}
            />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Filters & Status Tabs */}
        <div className="px-[20px] py-[16px] border-b border-border flex flex-col gap-[16px]">
          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-[12px]">
            {/* Search */}
            <div className="flex flex-col gap-[6px] flex-1 min-w-0">
              <label
                htmlFor="applications-search"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Buscar candidatos
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground" />
                <Input
                  id="applications-search"
                  type="text"
                  placeholder="Nombre, cargo, teléfono o habilidad"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-[44px] pl-[36px] pr-[36px] rounded-[8px] border-input bg-card text-[14px] font-normal placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-[16px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Vacancy Filter */}
            <div className="flex flex-col gap-[6px] w-full sm:w-[220px] shrink-0">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Vacante
              </span>
              <Select
                value={selectedVacancyId}
                onValueChange={(val) => setSelectedVacancyId(val || "all")}
              >
                <SelectTrigger
                  aria-label="Filtrar candidatos por vacante"
                  className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal"
                >
                  <SelectValue placeholder="Todas las vacantes">
                    {selectedVacancyId === "all"
                      ? "Todas las vacantes"
                      : vacanciesWithCounts.find((v) => v.id === selectedVacancyId)
                          ?.title || selectedVacancyId}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg max-h-64">
                  <SelectItem
                    value="all"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Todas las vacantes ({applicants.length})
                  </SelectItem>
                  {vacanciesWithCounts.map((vac) => (
                    <SelectItem
                      key={vac.id}
                      value={vac.id}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                    >
                      {vac.title} ({vac.applicantCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div className="flex flex-col gap-[6px] w-full sm:w-[220px] shrink-0">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Calificación
              </span>
              <Select
                value={ratingFilter}
                onValueChange={(val) => setRatingFilter(val || "all")}
              >
                <SelectTrigger
                  aria-label="Filtrar por calificación"
                  className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal"
                >
                  <SelectValue placeholder="Todas las calificaciones">
                    {ratingFilter === "all"
                      ? "Todas las calificaciones"
                      : ratingFilter === "top"
                      ? "5 estrellas"
                      : ratingFilter === "high"
                      ? "4 estrellas o más"
                      : "Sin calificar"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  <SelectItem
                    value="all"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Todas las calificaciones
                  </SelectItem>
                  <SelectItem
                    value="top"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    5 estrellas
                  </SelectItem>
                  <SelectItem
                    value="high"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    4 estrellas o más
                  </SelectItem>
                  <SelectItem
                    value="unrated"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Sin calificar
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 5 Status Tabs */}
          <div className="flex items-center gap-[8px] flex-wrap">
            {[
              {
                key: "all",
                label: `Todas · ${currentScopeApplicants.length}`,
              },
              {
                key: "pending",
                label: `Por revisar · ${metrics.pending}`,
              },
              {
                key: "Preseleccionado",
                label: `Preseleccionados · ${metrics.shortlisted}`,
              },
              {
                key: "Entrevista",
                label: `Entrevistas · ${metrics.interviews}`,
              },
              {
                key: "Contratado",
                label: `Contratados · ${metrics.hired}`,
              },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "h-[36px] px-[12px] rounded-[8px] text-[14px] font-medium leading-[20px] transition-colors cursor-pointer inline-flex items-center whitespace-nowrap",
                    isActive
                      ? "bg-sidebar-accent text-link"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Body & Empty State */}
        <div className="relative">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Cargando postulaciones...
              </p>
            </div>
          ) : tableRows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia
                  variant="icon"
                  className="bg-sidebar-accent text-link"
                >
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {isFiltered
                    ? selectedVacancyId !== "all" &&
                      currentScopeApplicants.length === 0
                      ? `Sin postulantes para "${selectedVacancy?.title || "esta vacante"}"`
                      : "No se encontraron postulantes"
                    : "Aún no hay postulaciones"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? selectedVacancyId !== "all" &&
                      currentScopeApplicants.length === 0
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
                        className="font-medium text-xs cursor-pointer gap-1.5"
                      >
                        <Briefcase className="size-3.5" />
                        <span>Ver todas las vacantes</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="font-medium text-xs cursor-pointer gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Restablecer filtros</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/dashboard/company/vacancies" />}
                    className="font-medium text-xs cursor-pointer gap-1.5"
                  >
                    <Briefcase className="size-3.5" />
                    <span>Ver vacantes</span>
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="bg-muted/30 border-b border-border">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className="hover:bg-transparent border-border"
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="h-[44px] px-[16px] text-left align-middle"
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
                  <TableBody>
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
                        className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-[16px] py-[12px] align-middle"
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
              </div>

              {/* Pagination Footer */}
              <div className="px-[20px] py-[14px] border-t border-border flex flex-col sm:flex-row items-center justify-between gap-[12px] text-[14px] text-muted-foreground">
                <span className="tabular-nums">
                  {rangeStart}–{rangeEnd} de {totalFilteredRows} postulaciones
                </span>

                <div className="flex items-center gap-[12px]">
                  <button
                    type="button"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Página anterior"
                    className="size-[32px] rounded-[8px] border border-control-border bg-card inline-flex items-center justify-center text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="size-[16px]" />
                  </button>
                  <span className="text-[14px] font-medium text-foreground tabular-nums">
                    Página {pageIndex + 1} de {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Página siguiente"
                    className="size-[32px] rounded-[8px] border border-control-border bg-card inline-flex items-center justify-center text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                  >
                    <ChevronRight className="size-[16px]" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: Full Candidate Profile / Dossier Viewer (Redesigned matching reference) */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full sm:!max-w-[700px] md:!max-w-[740px] p-0 overflow-hidden !flex !flex-col h-[90vh] max-h-[860px] !gap-0 font-sans"
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {selectedApplicant.name}
                          </DialogTitle>
                          {selectedApplicant.isEarlyAccess && (
                            <Badge
                              variant="outline"
                              className="text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 px-2.5 py-0.5 rounded-full shadow-2xs"
                            >
                              <Sparkles className="size-3 text-amber-500" />
                              Pionero • Acceso Anticipado
                            </Badge>
                          )}
                        </div>
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
                            <div className="flex items-center gap-2">
                              {selectedApplicant.interview.status === "confirmed" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="size-3" />
                                  Asistencia Confirmada
                                </span>
                              ) : selectedApplicant.interview.status === "rescheduled" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  <Clock className="size-3" />
                                  Reagendamiento Solicitado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-700 dark:text-purple-300">
                                  Pendiente de respuesta
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenScheduleInterview(selectedApplicant)}
                                className="h-7 text-[11px] font-bold rounded-lg border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                              >
                                Reagendar Cita
                              </Button>
                            </div>
                          </div>

                          {selectedApplicant.interview.status === "rescheduled" && (
                            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                              <p className="font-bold flex items-center gap-1.5">
                                <Clock className="size-3.5 text-amber-600 shrink-0" />
                                <span>El candidato solicita reagendar la fecha/horario</span>
                              </p>
                              {selectedApplicant.interview.candidateResponseNotes && (
                                <p className="text-[11px] text-muted-foreground italic">
                                  Motivo: &ldquo;{selectedApplicant.interview.candidateResponseNotes}&rdquo;
                                </p>
                              )}
                              {(selectedApplicant.interview.proposedDate || selectedApplicant.interview.proposedTime) && (
                                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                  Propuesta del candidato: {selectedApplicant.interview.proposedDate} {selectedApplicant.interview.proposedTime ? `a las ${selectedApplicant.interview.proposedTime}` : ""}
                                </p>
                              )}
                            </div>
                          )}

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
                              <strong className="text-foreground">Indicaciones enviadas:</strong> {selectedApplicant.interview.notes}
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

                      {/* 5. Sección "Acerca del candidato" */}
                      <div className="pt-2 text-left space-y-3">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                          Acerca del candidato
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
                                      className="px-3 py-1 text-xs font-bold bg-muted/60 border border-border/60 text-foreground"
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

                          {/* TAB 4: Documentos LFT (Solo para empleados contratados) */}
                          {selectedApplicant.status === "Contratado" && (
                            <TabsContent value="documents" className="space-y-4 m-0 focus-visible:outline-none text-left w-full max-w-full min-w-0 overflow-hidden">
                              <Card className="bg-muted/15 border border-border/40 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="size-5" />
                                  </div>
                                   <div>
                                    <h4 className="text-sm font-bold text-foreground">
                                      Bóveda de Documentos Oficiales LFT (Empleado Contratado)
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      INE, CURP, Constancia SAT, NSS y Comprobante de domicilio para alta laboral y nómina.
                                    </p>
                                  </div>
                                </div>

                                {docAccessState?.status === "approved" ? (
                                  <div className="space-y-3 pt-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs px-3 py-1">
                                      <CheckCircle2 className="size-3.5 mr-1" />
                                      Acceso Autorizado por el Empleado
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
                                        El empleado aún no ha subido archivos a su bóveda digital.
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
                                      Se envió una notificación al empleado para autorizar el expediente.
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
              <DialogFooter className="p-4 px-6 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Cerrar
                  </Button>

                  {selectedApplicant.status !== "Descartado" && selectedApplicant.status !== "Contratado" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        await handleUpdateStatus(selectedApplicant.id, "Descartado");
                        setSelectedApplicant((prev) => prev ? { ...prev, status: "Descartado" } : null);
                      }}
                      className="text-xs font-semibold cursor-pointer"
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
                      className="text-xs font-bold cursor-pointer gap-1.5"
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
                      className="text-xs font-bold cursor-pointer gap-1.5"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>2. Marcar Preseleccionado</span>
                    </Button>
                  )}

                  {selectedApplicant.status === "Preseleccionado" && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenScheduleInterview(selectedApplicant)}
                      className="text-xs font-bold cursor-pointer gap-1.5"
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
                      className="text-xs font-bold cursor-pointer gap-1.5"
                    >
                      <Sparkles className="size-3.5" />
                      <span>4. Formalizar Contratación Final</span>
                    </Button>
                  )}

                  {selectedApplicant.status === "Contratado" && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 font-bold text-xs">
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
                      className="text-xs font-bold cursor-pointer gap-1.5"
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
          className="w-full sm:!max-w-[700px] md:!max-w-[740px] p-0 overflow-hidden flex flex-col h-[88vh] max-h-[820px] gap-0 font-sans"
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
                    className="h-9 font-medium text-xs sm:text-sm"
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
                      className="h-9 text-xs sm:text-sm font-semibold w-32 shrink-0"
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
                        className="text-xs sm:text-sm font-medium pl-10 pr-4"
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
                      className="text-xs sm:text-sm font-medium pl-10"
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

          {/* 3. Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-card shrink-0 flex items-center justify-between sm:justify-end gap-3 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInterviewModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmInterview}
              disabled={isScheduling || !interviewDate}
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
              "Se ha creado el expediente de empleado y se integró a la plantilla activa.",
          });
        }}
      />
    </div>
  );
}
