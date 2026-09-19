"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Star,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  Download,
  Users,
  Award,
  Target,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  MoreHorizontal,
  X,
  FileText,
  Briefcase,
  HeartHandshake,
  BarChart3,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  EmployeeEvaluation,
  Nom035Survey,
  Nom035Metrics,
  Nom035RiskLevel,
} from "../types/evaluations";
import { EmployeeSelectOption } from "../services/company-evaluations";
import { EvaluationQuestionnaireModal } from "./evaluations/evaluation-questionnaire-modal";
import { EvaluationDetailsModal } from "./evaluations/evaluation-details-modal";
import { EmployeeDossierSheet } from "./dossier/employee-dossier-sheet";
import { Nom035SurveyModal } from "./evaluations/nom035-survey-modal";
import {
  deleteEvaluationAction,
  deleteNom035SurveyAction,
} from "../actions/evaluations";

export interface EvaluationsViewProps {
  initialEvaluations?: EmployeeEvaluation[];
  employees?: EmployeeSelectOption[];
  nom035Surveys?: Nom035Survey[];
  nom035Metrics?: Nom035Metrics;
  companyName?: string;
}

export function EvaluationsView({
  initialEvaluations,
  employees = [],
  nom035Surveys: initialNomSurveys = [],
  nom035Metrics: initialNomMetrics,
  companyName = "K'anPro",
}: EvaluationsViewProps) {
  const [activeTab, setActiveTab] = React.useState<
    "reviews" | "analytics" | "nom035"
  >("reviews");

  // Real evaluations state directly from backend (empty if no records in Supabase)
  const [evaluations, setEvaluations] = React.useState<EmployeeEvaluation[]>(
    () => initialEvaluations || []
  );

  React.useEffect(() => {
    setEvaluations(initialEvaluations || []);
  }, [initialEvaluations]);

  // Real NOM-035 Surveys State
  const [nomSurveys, setNomSurveys] = React.useState<Nom035Survey[]>(
    () => initialNomSurveys || []
  );

  React.useEffect(() => {
    setNomSurveys(initialNomSurveys || []);
  }, [initialNomSurveys]);

  // Filter States for 360 Reviews
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [ratingFilter, setRatingFilter] = React.useState<string>("all");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "averageScore", desc: true },
  ]);

  // Filter States for NOM-035
  const [nomSearchQuery, setNomSearchQuery] = React.useState("");
  const [nomRiskFilter, setNomRiskFilter] = React.useState<string>("all");

  // Modal & Sheet States
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [isNomModalOpen, setIsNomModalOpen] = React.useState(false);
  const [selectedEvaluation, setSelectedEvaluation] =
    React.useState<EmployeeEvaluation | null>(null);
  const [dossierEmployee, setDossierEmployee] = React.useState<any | null>(
    null
  );
  const [isDossierOpen, setIsDossierOpen] = React.useState(false);

  // Departments List
  const departments = React.useMemo(() => {
    const set = new Set<string>();
    evaluations.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [evaluations]);

  // Global Metrics
  const metrics = React.useMemo(() => {
    const total = evaluations.length;
    const totalScore = evaluations.reduce((acc, c) => acc + c.averageScore, 0);
    const globalAvg = total > 0 ? (totalScore / total).toFixed(1) : "—";

    const punctualityAvg =
      total > 0
        ? (
            evaluations.reduce((acc, c) => acc + c.punctualityScore, 0) / total
          ).toFixed(1)
        : "0.0";
    const teamworkAvg =
      total > 0
        ? (
            evaluations.reduce((acc, c) => acc + c.teamworkScore, 0) / total
          ).toFixed(1)
        : "0.0";
    const productivityAvg =
      total > 0
        ? (
            evaluations.reduce((acc, c) => acc + c.productivityScore, 0) / total
          ).toFixed(1)
        : "0.0";
    const customerServiceAvg =
      total > 0
        ? (
            evaluations.reduce((acc, c) => acc + c.customerServiceScore, 0) /
            total
          ).toFixed(1)
        : "0.0";

    const topRated = evaluations.filter((e) => e.averageScore >= 4.7).length;

    return {
      total,
      globalAvg,
      punctualityAvg,
      teamworkAvg,
      productivityAvg,
      customerServiceAvg,
      topRated,
    };
  }, [evaluations]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEvaluationCreated = (newEval: EmployeeEvaluation) => {
    setEvaluations((prev) => [newEval, ...prev]);
    toast.success("Evaluación de Desempeño 360 registrada", {
      description: `Se registró la evaluación de ${newEval.employeeName} (${newEval.period}).`,
    });
  };

  const handleOpenDossierFromEval = (ev: EmployeeEvaluation) => {
    setDossierEmployee({
      id: ev.employeeId,
      candidate_id: `cand-${ev.employeeId}`,
      full_name: ev.employeeName,
      phone: "+52 984 123 4567",
      avatar_url: ev.avatarUrl,
      location: "Riviera Maya, Q. Roo",
      vacancy_title: ev.jobTitle,
      vacancy_category: ev.department,
      hired_date: "2025-06-01",
      status: "Contratado",
    });
    setIsDossierOpen(true);
  };

  const handleExportSummary = () => {
    if (filteredEvaluations.length === 0) {
      toast.info("No hay evaluaciones registradas para exportar.");
      return;
    }

    const exportRows = filteredEvaluations.map((e) => [
      `"${e.employeeName.replace(/"/g, '""')}"`,
      `"${e.jobTitle.replace(/"/g, '""')}"`,
      `"${e.department.replace(/"/g, '""')}"`,
      `"${e.period.replace(/"/g, '""')}"`,
      `"${e.evaluatorName.replace(/"/g, '""')}"`,
      `"${e.averageScore}"`,
      `"${e.punctualityScore}"`,
      `"${e.attendanceScore}"`,
      `"${e.productivityScore}"`,
      `"${e.teamworkScore}"`,
      `"${e.customerServiceScore}"`,
      `"${e.goalsScore}"`,
      `"${(e.goalsAchieved || "").replace(/"/g, '""')}"`,
      `"${(e.developmentPlan || "").replace(/"/g, '""')}"`,
    ]);

    const headers = [
      "Colaborador",
      "Puesto",
      "Departamento",
      "Periodo",
      "Evaluador",
      "Promedio General",
      "Puntualidad",
      "Asistencia",
      "Productividad",
      "Trabajo en Equipo",
      "Servicio",
      "Metas",
      "Objetivos Cumplidos",
      "Plan de Desarrollo",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...exportRows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `evaluaciones_desempeno_360_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Resumen de evaluaciones exportado a CSV");
  };

  const handleDeleteEvaluation = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la evaluación de ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    const res = await deleteEvaluationAction(id);
    if (res.success) {
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
      toast.success(`Evaluación de ${name} eliminada.`);
    } else {
      toast.error(res.error || "No se pudo eliminar la evaluación.");
    }
  };

  const handleDeleteNomSurvey = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cédula NOM-035 de ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    const res = await deleteNom035SurveyAction(id);
    if (res.success) {
      setNomSurveys((prev) => prev.filter((s) => s.id !== id));
      toast.success(`Cédula NOM-035 de ${name} eliminada.`);
    } else {
      toast.error(res.error || "No se pudo eliminar la cédula.");
    }
  };

  const handleNomSurveyCreated = (newSurvey: Nom035Survey) => {
    setNomSurveys((prev) => [newSurvey, ...prev]);
  };

  // Dynamic NOM-035 Metrics
  const currentNomMetrics = React.useMemo<Nom035Metrics>(() => {
    const total = nomSurveys.length;
    const sumTotal = nomSurveys.reduce((acc, s) => acc + s.totalScore, 0);
    const avgTotal =
      total > 0 ? Math.round((sumTotal / total) * 10) / 10 : 0;

    let overallRiskLevel: Nom035RiskLevel = "nulo";
    if (avgTotal >= 90) overallRiskLevel = "muy_alto";
    else if (avgTotal >= 70) overallRiskLevel = "alto";
    else if (avgTotal >= 45) overallRiskLevel = "medio";
    else if (avgTotal >= 20) overallRiskLevel = "bajo";
    else overallRiskLevel = "nulo";

    const riskCounts: Record<Nom035RiskLevel, number> = {
      nulo: 0,
      bajo: 0,
      medio: 0,
      alto: 0,
      muy_alto: 0,
    };

    nomSurveys.forEach((s) => {
      if (riskCounts[s.riskLevel] !== undefined) {
        riskCounts[s.riskLevel]++;
      }
    });

    return {
      totalSurveys: total,
      averageTotalScore: avgTotal,
      overallRiskLevel,
      riskCounts,
      dimensionAverages: {
        environment:
          total > 0
            ? Math.round(
                (nomSurveys.reduce((a, s) => a + s.environmentScore, 0) /
                  total) *
                  10
              ) / 10
            : 0,
        activityFactors:
          total > 0
            ? Math.round(
                (nomSurveys.reduce((a, s) => a + s.activityFactorsScore, 0) /
                  total) *
                  10
              ) / 10
            : 0,
        timeOrganization:
          total > 0
            ? Math.round(
                (nomSurveys.reduce((a, s) => a + s.timeOrganizationScore, 0) /
                  total) *
                  10
              ) / 10
            : 0,
        leadershipRelations:
          total > 0
            ? Math.round(
                (nomSurveys.reduce(
                  (a, s) => a + s.leadershipRelationsScore,
                  0
                ) /
                  total) *
                  10
              ) / 10
            : 0,
        organizationalClimate:
          total > 0
            ? Math.round(
                (nomSurveys.reduce(
                  (a, s) => a + s.organizationalClimateScore,
                  0
                ) /
                  total) *
                  10
              ) / 10
            : 0,
      },
    };
  }, [nomSurveys]);

  const handleExportNom035Csv = () => {
    if (nomSurveys.length === 0) {
      toast.info("No hay cédulas NOM-035 registradas para exportar.");
      return;
    }

    const exportRows = nomSurveys.map((s) => [
      `"${s.employeeName.replace(/"/g, '""')}"`,
      `"${(s.jobTitle || "Colaborador").replace(/"/g, '""')}"`,
      `"${(s.department || "Operaciones").replace(/"/g, '""')}"`,
      `"${s.guideType === "guia_i" ? "Guía I (Trauma)" : s.guideType === "guia_iii" ? "Guía III (Entorno)" : "Guía II (Riesgo)"}"`,
      `"${s.surveyDate}"`,
      `"${s.environmentScore}"`,
      `"${s.activityFactorsScore}"`,
      `"${s.timeOrganizationScore}"`,
      `"${s.leadershipRelationsScore}"`,
      `"${s.organizationalClimateScore}"`,
      `"${s.totalScore}"`,
      `"${s.riskLevel.toUpperCase()}"`,
      `"${(s.actionPlan || "").replace(/"/g, '""')}"`,
    ]);

    const headers = [
      "Colaborador",
      "Puesto",
      "Área",
      "Guía STPS",
      "Fecha de Aplicación",
      "Ambiente de Trabajo (0-20)",
      "Factores de Actividad (0-40)",
      "Organización Tiempo (0-20)",
      "Liderazgo y Relaciones (0-40)",
      "Entorno Organizacional (0-30)",
      "Puntaje Total",
      "Nivel de Riesgo",
      "Plan de Acción STPS",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...exportRows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cedula_oficial_nom035_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Cédula oficial NOM-035-STPS exportada a CSV.");
  };

  // Filtered NOM-035 Surveys
  const filteredNomSurveys = React.useMemo(() => {
    return nomSurveys.filter((s) => {
      const q = nomSearchQuery.toLowerCase();
      const matchesSearch =
        s.employeeName.toLowerCase().includes(q) ||
        (s.jobTitle && s.jobTitle.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q));

      const matchesRisk =
        nomRiskFilter === "all" || s.riskLevel === nomRiskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [nomSurveys, nomSearchQuery, nomRiskFilter]);

  // Filtered Evaluations
  const filteredEvaluations = React.useMemo(() => {
    return evaluations.filter((ev) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ev.employeeName.toLowerCase().includes(query) ||
        ev.jobTitle.toLowerCase().includes(query) ||
        ev.department.toLowerCase().includes(query) ||
        ev.evaluatorName.toLowerCase().includes(query);

      const matchesDept =
        departmentFilter === "all" || ev.department === departmentFilter;

      let matchesRating = true;
      if (ratingFilter === "sobresaliente") {
        matchesRating = ev.averageScore >= 4.7;
      } else if (ratingFilter === "alto") {
        matchesRating = ev.averageScore >= 4.4 && ev.averageScore < 4.7;
      } else if (ratingFilter === "medio") {
        matchesRating = ev.averageScore < 4.4;
      }

      return matchesSearch && matchesDept && matchesRating;
    });
  }, [evaluations, searchQuery, departmentFilter, ratingFilter]);

  const isFiltered =
    searchQuery.trim().length > 0 ||
    departmentFilter !== "all" ||
    ratingFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setRatingFilter("all");
    setSorting([{ id: "averageScore", desc: true }]);
  };

  // TanStack Table Columns Definition
  const columns = React.useMemo<ColumnDef<EmployeeEvaluation>[]>(
    () => [
      {
        accessorKey: "employeeName",
        id: "employeeName",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Colaborador</span>
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
          const ev = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar
                onClick={() => handleOpenDossierFromEval(ev)}
                className="size-9 rounded-xl border border-border/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
              >
                <AvatarImage
                  src={ev.avatarUrl || undefined}
                  alt={ev.employeeName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl font-extrabold text-xs bg-amber-500/10 text-amber-600">
                  {getInitials(ev.employeeName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDossierFromEval(ev)}
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate block text-left cursor-pointer"
                >
                  {ev.employeeName}
                </button>
                <p className="text-[11px] text-muted-foreground truncate">
                  {ev.jobTitle}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        id: "department",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Área & Periodo</span>
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
          const ev = row.original;
          return (
            <div className="space-y-1 py-1">
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0 rounded-md border-border/30 bg-muted/30"
              >
                {ev.department}
              </Badge>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {ev.period}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "evaluatorName",
        id: "evaluatorName",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Evaluador</span>
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
          const ev = row.original;
          return (
            <div className="space-y-0.5 py-1 text-xs">
              <span className="font-semibold text-foreground block truncate">
                {ev.evaluatorName}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {ev.evaluationDate}
              </span>
            </div>
          );
        },
      },
      {
        id: "competencies",
        header: () => (
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground block">
            Competencias Clave (1–5)
          </span>
        ),
        cell: ({ row }) => {
          const ev = row.original;
          return (
            <div className="flex items-center gap-1.5 py-1 text-[10px] font-mono">
              <div
                className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground border border-border/30"
                title="Puntualidad"
              >
                P:{ev.punctualityScore}
              </div>
              <div
                className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground border border-border/30"
                title="Asistencia"
              >
                A:{ev.attendanceScore}
              </div>
              <div
                className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground border border-border/30"
                title="Productividad"
              >
                Pr:{ev.productivityScore}
              </div>
              <div
                className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground border border-border/30"
                title="Trabajo en Equipo"
              >
                Eq:{ev.teamworkScore}
              </div>
              <div
                className="px-1.5 py-0.5 rounded bg-muted/40 text-foreground border border-border/30"
                title="Servicio al Cliente"
              >
                Svc:{ev.customerServiceScore}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "averageScore",
        id: "averageScore",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Promedio 360</span>
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
          const ev = row.original;
          const isOutstanding = ev.averageScore >= 4.7;

          return (
            <div className="py-1">
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-extrabold text-xs font-mono shadow-2xs",
                  isOutstanding
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    : "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                <span>{ev.averageScore.toFixed(1)} / 5.0</span>
              </div>
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
          const ev = row.original;
          return (
            <div className="flex items-center justify-end gap-1 py-1">
              {/* Eye Button: View Full 360 Evaluation Card */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvaluation(ev)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors"
                title="Ver Ficha 360 Completa"
              >
                <Eye className="size-4" />
              </Button>

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
                    onSelect={() => setSelectedEvaluation(ev)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Ver Ficha 360</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => handleOpenDossierFromEval(ev)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Ver Expediente del Colaborador</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onSelect={() => {
                      toast.info(
                        `Generando reporte de desempeño de ${ev.employeeName}...`
                      );
                    }}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="size-3.5" />
                    <span>Descargar Reporte PDF</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onSelect={() => handleDeleteEvaluation(ev.id, ev.employeeName)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-rose-600 focus:text-rose-600 hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Eliminar Evaluación</span>
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
    data: filteredEvaluations,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const tableRows = table.getRowModel().rows;

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-[800] text-foreground tracking-tight flex items-center gap-2.5">
            <span>Evaluación de Desempeño 360</span>
            <Badge
              variant="outline"
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg border-border/40"
            >
              {evaluations.length}
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Evaluación periódica de 6 competencias clave, planes de desarrollo humano y seguimiento de metas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummary}
            className="h-9 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-2 border-border/50 hover:bg-muted/40 cursor-pointer"
          >
            <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="h-9 font-bold text-xs rounded-xl px-4 flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Nueva Evaluación</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Índice General
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Star className="size-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono flex items-center gap-1.5">
              <span>{metrics.globalAvg}</span>
              {metrics.total > 0 && (
                <span className="text-sm text-muted-foreground font-sans font-semibold">
                  / 5.0
                </span>
              )}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {metrics.total > 0 ? "Promedio de la empresa" : "Sin evaluaciones"}
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Evaluaciones
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.total}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Registradas este ciclo
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Fortaleza Top
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-foreground truncate">
              {metrics.total > 0 ? "Trabajo en Equipo" : "—"}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 font-mono">
              {metrics.total > 0 ? `${metrics.teamworkAvg} / 5.0 promedio` : "Sin evaluaciones"}
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Sobresalientes
            </span>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Award className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.topRated}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Calificación &ge; 4.7 / 5.0
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Main Tabs Structure */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "reviews" | "analytics")}
        className="w-full space-y-4"
      >
        <TabsList className="w-full sm:w-auto grid grid-cols-1 sm:grid-cols-3 sm:inline-flex h-auto sm:h-11 p-1 rounded-2xl bg-muted/40 border border-border/40 gap-1 sm:gap-0">
          <TabsTrigger
            value="reviews"
            className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer px-4"
          >
            <Star className="size-4 text-amber-500" />
            <span>Evaluaciones 360 ({evaluations.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer px-4"
          >
            <BarChart3 className="size-4 text-primary" />
            <span>Matriz de Competencias</span>
          </TabsTrigger>
          <TabsTrigger
            value="nom035"
            className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer px-4"
          >
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Clima Laboral & NOM-035 ({nomSurveys.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Master DataTable */}
        <TabsContent
          value="reviews"
          className="space-y-4 m-0 focus-visible:outline-none"
        >
          <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
            
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por colaborador, puesto, área o evaluador..."
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

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <ArrowUpDown className="size-3.5 text-primary" />
                  <span>Haz clic en los encabezados para ordenar</span>
                </div>
              </div>

              {/* Filters Row: Rating Level + Department */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border/30">
                {/* Rating Level Tabs */}
                <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setRatingFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      ratingFilter === "all"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Todos ({evaluations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingFilter("sobresaliente")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      ratingFilter === "sobresaliente"
                        ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Star className="size-3.5 fill-amber-500 text-amber-500" />
                    <span>Sobresaliente (4.7+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingFilter("alto")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      ratingFilter === "alto"
                        ? "bg-background text-primary shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>Alto (4.4–4.6)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingFilter("medio")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      ratingFilter === "medio"
                        ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>En Desarrollo (&lt;4.4)</span>
                  </button>
                </div>

                {/* Department Selector */}
                <div className="flex items-center gap-2">
                  <div className="w-full sm:w-[220px]">
                    <Select
                      value={departmentFilter}
                      onValueChange={(val) =>
                        setDepartmentFilter(val || "all")
                      }
                    >
                      <SelectTrigger className="h-9 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
                        <SelectValue placeholder="Todas las áreas">
                          {departmentFilter === "all"
                            ? `Todas las áreas (${evaluations.length})`
                            : departmentFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                        <SelectItem
                          value="all"
                          className="text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Todas las áreas ({evaluations.length})
                        </SelectItem>
                        {departments.map((d) => (
                          <SelectItem
                            key={d}
                            value={d}
                            className="text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            {d}
                          </SelectItem>
                        ))}
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

            {/* Table or Empty */}
            <div className="relative min-h-[300px]">
              {tableRows.length === 0 ? (
                <Empty className="py-16">
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="bg-amber-500/10 text-amber-600"
                    >
                      <Star className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>
                      {evaluations.length === 0
                        ? "Sin evaluaciones registradas"
                        : "No se encontraron evaluaciones"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {evaluations.length === 0
                        ? "Aún no has registrado ninguna evaluación de desempeño 360 para tus colaboradores en este ciclo."
                        : "No hay registros de evaluación que coincidan con los filtros aplicados."}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    {evaluations.length === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => setIsNewModalOpen(true)}
                        className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="size-3.5" />
                        <span>Nueva Evaluación</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer border-border/50 gap-1.5"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Restablecer Filtros</span>
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

                  <div className="p-3.5 px-4 sm:px-6 border-t border-border/30 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>
                      Mostrando <strong>{tableRows.length}</strong> de{" "}
                      <strong>{evaluations.length}</strong> evaluaciones
                    </span>
                    <span className="text-[11px] text-muted-foreground/80">
                      Ciclo de desarrollo humano {companyName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: Analytics & Competencies Matrix */}
        <TabsContent
          value="analytics"
          className="space-y-6 m-0 focus-visible:outline-none"
        >
          {/* Competency Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border border-border/40 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                    Promedio por Competencia (1–5)
                  </h3>
                </div>
                <Badge variant="outline" className="text-xs font-bold font-mono">
                  6 Competencias LFT
                </Badge>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>Puntualidad & Horarios</span>
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {metrics.punctualityAvg} / 5.0
                    </span>
                  </div>
                  <Progress
                    value={(parseFloat(metrics.punctualityAvg) / 5) * 100}
                    className="h-2 rounded-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground" />
                      <span>Trabajo en Equipo & Colaboración</span>
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {metrics.teamworkAvg} / 5.0
                    </span>
                  </div>
                  <Progress
                    value={(parseFloat(metrics.teamworkAvg) / 5) * 100}
                    className="h-2 rounded-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-muted-foreground" />
                      <span>Productividad & Calidad</span>
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {metrics.productivityAvg} / 5.0
                    </span>
                  </div>
                  <Progress
                    value={(parseFloat(metrics.productivityAvg) / 5) * 100}
                    className="h-2 rounded-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-muted-foreground" />
                      <span>Atención al Cliente & Comunicación</span>
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {metrics.customerServiceAvg} / 5.0
                    </span>
                  </div>
                  <Progress
                    value={(parseFloat(metrics.customerServiceAvg) / 5) * 100}
                    className="h-2 rounded-full"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-card border border-border/40 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                    Filosofía de Desarrollo Humano
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Las evaluaciones en K&apos;anPro están orientadas al mentoring formativo, identificando fortalezas individuales para potenciar el talento operativo y retener al personal clave en la empresa.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Cumplimiento Metas
                  </span>
                  <h4 className="text-lg font-extrabold text-foreground font-mono mt-0.5">
                    {evaluations.length > 0 ? "98.2%" : "—"}
                  </h4>
                </div>
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Planes de Carrera
                  </span>
                  <h4 className="text-lg font-extrabold text-primary font-mono mt-0.5">
                    {evaluations.length > 0 ? "100% Activos" : "—"}
                  </h4>
                </div>
              </div>
            </Card>
          </div>

          {/* Development Plans Showcase */}
          <Card className="bg-card border border-border/40 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                  Planes de Desarrollo y Capacitación Asignados
                </h3>
              </div>
            </div>

            {evaluations.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Aún no hay planes formativos ni capacitaciones registradas.
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  Completa la primera evaluación de desempeño 360 para generar diagnósticos y planes de carrera.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {evaluations.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">
                        {ev.employeeName}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold font-mono px-1.5 py-0"
                      >
                        {ev.averageScore} / 5.0
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {ev.jobTitle}
                    </p>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-primary block tracking-wider">
                      Plan Formativo:
                    </span>
                    <p className="text-[11px] text-foreground font-semibold">
                      {ev.developmentPlan}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Meta: {ev.goalsAchieved}</span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 3: NOM-035-STPS-2018 Clima Laboral & Factores de Riesgo */}
        <TabsContent
          value="nom035"
          className="space-y-6 m-0 focus-visible:outline-none"
        >
          {/* Header & Quick Actions for NOM-035 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-extrabold text-foreground tracking-tight">
                  Cédulas de Evaluación del Entorno Laboral NOM-035-STPS-2018
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Prevención de factores de riesgo psicosocial, evaluación de entorno organizacional favorable y cumplimiento normativo laboral.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportNom035Csv}
                className="h-9 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-2 border-border/50 hover:bg-muted/40 cursor-pointer"
              >
                <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Exportar Cédula STPS</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsNomModalOpen(true)}
                className="h-9 font-bold text-xs rounded-xl px-4 flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Nueva Cédula NOM-035</span>
              </Button>
            </div>
          </div>

          {/* 3 Metric Cards for NOM-035 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Semáforo Global */}
            <Card className="bg-card border border-border/40 rounded-3xl p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Nivel de Riesgo General
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-black uppercase px-2.5 py-0.5 rounded-lg border",
                    currentNomMetrics.overallRiskLevel === "nulo" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                    currentNomMetrics.overallRiskLevel === "bajo" && "bg-teal-500/10 text-teal-600 border-teal-500/30",
                    currentNomMetrics.overallRiskLevel === "medio" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                    currentNomMetrics.overallRiskLevel === "alto" && "bg-orange-500/10 text-orange-600 border-orange-500/30",
                    currentNomMetrics.overallRiskLevel === "muy_alto" && "bg-rose-500/10 text-rose-600 border-rose-500/30"
                  )}
                >
                  {currentNomMetrics.overallRiskLevel.replace("_", " ")}
                </Badge>
              </div>

              <div>
                <h4 className="text-2xl font-black text-foreground font-mono">
                  {currentNomMetrics.averageTotalScore} pts
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Promedio de {currentNomMetrics.totalSurveys} colaboradores evaluados
                </p>
              </div>

              <div className="pt-2 border-t border-border/30 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                <span>
                  {currentNomMetrics.overallRiskLevel === "nulo" || currentNomMetrics.overallRiskLevel === "bajo"
                    ? "Entorno organizacional favorable y saludable"
                    : "Requiere seguimiento en plan de acción STPS"}
                </span>
              </div>
            </Card>

            {/* Card 2: Distribución por Semáforo */}
            <Card className="bg-card border border-border/40 rounded-3xl p-5 flex flex-col justify-between space-y-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Distribución Semáforo STPS
              </span>

              <div className="grid grid-cols-5 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-600 block">Nulo</span>
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {currentNomMetrics.riskCounts.nulo}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <span className="text-[10px] font-bold text-teal-600 block">Bajo</span>
                  <span className="text-base font-black text-teal-700 dark:text-teal-400 font-mono">
                    {currentNomMetrics.riskCounts.bajo}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-600 block">Medio</span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono">
                    {currentNomMetrics.riskCounts.medio}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-[10px] font-bold text-orange-600 block">Alto</span>
                  <span className="text-base font-black text-orange-700 dark:text-orange-400 font-mono">
                    {currentNomMetrics.riskCounts.alto}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] font-bold text-rose-600 block">M. Alto</span>
                  <span className="text-base font-black text-rose-700 dark:text-rose-400 font-mono">
                    {currentNomMetrics.riskCounts.muy_alto}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/30 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Total cédulas:</span>
                <span className="font-mono font-bold text-foreground">
                  {currentNomMetrics.totalSurveys} evaluados
                </span>
              </div>
            </Card>

            {/* Card 3: Dimensiones Promedio */}
            <Card className="bg-card border border-border/40 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Dimensiones Normativas
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Promedios
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground truncate">Ambiente de Trabajo</span>
                    <span className="font-mono font-bold text-foreground">{currentNomMetrics.dimensionAverages.environment} / 20</span>
                  </div>
                  <Progress value={(currentNomMetrics.dimensionAverages.environment / 20) * 100} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground truncate">Factores de Actividad</span>
                    <span className="font-mono font-bold text-foreground">{currentNomMetrics.dimensionAverages.activityFactors} / 40</span>
                  </div>
                  <Progress value={(currentNomMetrics.dimensionAverages.activityFactors / 40) * 100} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground truncate">Liderazgo & Relaciones</span>
                    <span className="font-mono font-bold text-foreground">{currentNomMetrics.dimensionAverages.leadershipRelations} / 40</span>
                  </div>
                  <Progress value={(currentNomMetrics.dimensionAverages.leadershipRelations / 40) * 100} className="h-1.5" />
                </div>
              </div>
            </Card>
          </div>

          {/* DataTable of NOM-035 Surveys */}
          <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-border/40 space-y-3 bg-muted/10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                  <Input
                    value={nomSearchQuery}
                    onChange={(e) => setNomSearchQuery(e.target.value)}
                    placeholder="Buscar por colaborador, puesto o departamento..."
                    className="h-10 pl-10 pr-9 bg-background border-border/50 rounded-xl text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  {nomSearchQuery && (
                    <button
                      onClick={() => setNomSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Risk Filter Tabs */}
                <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setNomRiskFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      nomRiskFilter === "all"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Todos ({nomSurveys.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNomRiskFilter("nulo")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      nomRiskFilter === "nulo"
                        ? "bg-background text-emerald-600 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Nulo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNomRiskFilter("bajo")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      nomRiskFilter === "bajo"
                        ? "bg-background text-teal-600 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Bajo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNomRiskFilter("medio")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      nomRiskFilter === "medio"
                        ? "bg-background text-amber-600 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Medio
                  </button>
                  <button
                    type="button"
                    onClick={() => setNomRiskFilter("alto")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      nomRiskFilter === "alto"
                        ? "bg-background text-orange-600 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Alto
                  </button>
                  <button
                    type="button"
                    onClick={() => setNomRiskFilter("muy_alto")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      nomRiskFilter === "muy_alto"
                        ? "bg-background text-rose-600 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Muy Alto
                  </button>
                </div>
              </div>
            </div>

            {/* Table or Empty */}
            {filteredNomSurveys.length === 0 ? (
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {nomSurveys.length === 0
                      ? "Sin cédulas NOM-035 registradas"
                      : "No se encontraron cédulas con este filtro"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {nomSurveys.length === 0
                      ? "Aplica la primera cédula de evaluación de factores psicosociales NOM-035-STPS-2018 a tus colaboradores."
                      : "Prueba seleccionando otro nivel de riesgo o limpiando la búsqueda."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => setIsNomModalOpen(true)}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Plus className="size-3.5" />
                    <span>Nueva Cédula NOM-035</span>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="bg-muted/30 border-b border-border/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-3 px-4 sm:px-6 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Colaborador
                      </TableHead>
                      <TableHead className="py-3 px-4 sm:px-6 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Guía STPS & Fecha
                      </TableHead>
                      <TableHead className="py-3 px-4 sm:px-6 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Dimensiones Evaluadas
                      </TableHead>
                      <TableHead className="py-3 px-4 sm:px-6 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Puntaje Total & Semáforo
                      </TableHead>
                      <TableHead className="py-3 px-4 sm:px-6 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground">
                        Plan de Acción STPS
                      </TableHead>
                      <TableHead className="py-3 px-4 sm:px-6 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/30">
                    {filteredNomSurveys.map((survey) => (
                      <TableRow key={survey.id} className="hover:bg-muted/25 transition-colors group">
                        <TableCell className="py-3 px-4 sm:px-6">
                          <div className="space-y-0.5">
                            <span className="text-xs sm:text-sm font-bold text-foreground block">
                              {survey.employeeName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {survey.jobTitle || "Colaborador"} • {survey.department || "Operaciones"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4 sm:px-6">
                          <div className="space-y-0.5">
                            <Badge variant="outline" className="text-[10px] font-bold font-mono">
                              {survey.guideType === "guia_i"
                                ? "Guía I (Trauma)"
                                : survey.guideType === "guia_iii"
                                ? "Guía III (Entorno)"
                                : "Guía II (Riesgo)"}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground">
                              {survey.surveyDate}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/30" title="Ambiente de Trabajo">
                              Amb:{survey.environmentScore}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/30" title="Factores de la Actividad">
                              Act:{survey.activityFactorsScore}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/30" title="Organización del Tiempo">
                              Tpo:{survey.timeOrganizationScore}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/30" title="Liderazgo y Relaciones">
                              Lid:{survey.leadershipRelationsScore}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/30" title="Entorno Organizacional">
                              Ent:{survey.organizationalClimateScore}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-foreground">
                              {survey.totalScore} pts
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border",
                                survey.riskLevel === "nulo" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                                survey.riskLevel === "bajo" && "bg-teal-500/10 text-teal-600 border-teal-500/30",
                                survey.riskLevel === "medio" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                                survey.riskLevel === "alto" && "bg-orange-500/10 text-orange-600 border-orange-500/30",
                                survey.riskLevel === "muy_alto" && "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              )}
                            >
                              {survey.riskLevel.replace("_", " ")}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4 sm:px-6 max-w-xs">
                          <p className="text-xs text-muted-foreground truncate" title={survey.actionPlan || ""}>
                            {survey.actionPlan || "Sin plan de acción registrado"}
                          </p>
                        </TableCell>

                        <TableCell className="py-3 px-4 sm:px-6 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNomSurvey(survey.id, survey.employeeName)}
                            className="size-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            title="Eliminar Cédula NOM-035"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: 360 Questionnaire Evaluation Wizard */}
      <EvaluationQuestionnaireModal
        isOpen={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        onEvaluationCreated={handleEvaluationCreated}
        employees={employees}
      />

      {/* Modal 2: 360 Evaluation Details */}
      <EvaluationDetailsModal
        isOpen={!!selectedEvaluation}
        onOpenChange={(open) => !open && setSelectedEvaluation(null)}
        evaluation={selectedEvaluation}
      />

      {/* Sheet 3: Employee Dossier 360 */}
      <EmployeeDossierSheet
        employee={dossierEmployee}
        open={isDossierOpen}
        onOpenChange={setIsDossierOpen}
      />

      {/* Modal 4: NOM-035 Survey Modal */}
      <Nom035SurveyModal
        isOpen={isNomModalOpen}
        onOpenChange={setIsNomModalOpen}
        employees={employees}
        onSurveyCreated={handleNomSurveyCreated}
      />
    </div>
  );
}
