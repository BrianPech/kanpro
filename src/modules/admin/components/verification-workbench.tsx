"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type PendingCompanyItem,
  type PendingCandidateItem,
  type ProfileDocumentItem,
  reviewCompanyVerification,
  reviewCandidateVerification,
  reviewProfileDocument,
} from "@/app/(dashboard)/dashboard/admin/verifications/actions";
import {
  BadgeCheck,
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  FileCheck,
  FileText,
  Download,
  Phone,
  ShieldCheck,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  X,
  Mail,
  ShieldAlert,
  Sparkles,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface VerificationWorkbenchProps {
  initialCompanies: PendingCompanyItem[];
  initialCandidates: PendingCandidateItem[];
}

export function VerificationWorkbenchClient({
  initialCompanies,
  initialCandidates,
}: VerificationWorkbenchProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"companies" | "candidates">("companies");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [companies, setCompanies] = React.useState<PendingCompanyItem[]>(initialCompanies);
  const [candidates, setCandidates] = React.useState<PendingCandidateItem[]>(initialCandidates);

  // Candidate Inspection Modal States
  const [inspectCandidate, setInspectCandidate] = React.useState<PendingCandidateItem | null>(null);
  const [auditNotes, setAuditNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [updatingDocId, setUpdatingDocId] = React.useState<string | null>(null);

  // Document Viewer Lightbox
  const [activeDocPreview, setActiveDocPreview] = React.useState<{ title: string; url: string } | null>(null);

  // Table Sorting
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const formatDocTypeLabel = (docType: string) => {
    switch (docType) {
      case "constancia_situacion_fiscal":
        return "Constancia RFC (SAT)";
      case "legal_rep_id":
        return "INE Rep. Legal";
      case "acta_constitutiva":
        return "Acta Constitutiva";
      case "legal_power":
        return "Poder Notarial / IMSS";
      case "cedula_profesional":
        return "Cédula Profesional (SEP)";
      case "cv":
        return "Currículum Vitae";
      case "ine":
      case "ine_passport":
        return "INE / Identificación";
      case "curp":
        return "CURP";
      case "proof_of_address":
        return "Comprobante de Domicilio";
      default:
        return docType.replace(/_/g, " ").toUpperCase();
    }
  };

  const handleOpenCandidateInspect = (item: PendingCandidateItem) => {
    setInspectCandidate(item);
    setAuditNotes("");
  };

  // Review single document action
  const handleReviewDocument = async (docId: string, status: "approved" | "rejected") => {
    setUpdatingDocId(docId);
    try {
      await reviewProfileDocument(docId, status);
      toast.success(status === "approved" ? "Documento aprobado" : "Documento rechazado");

      if (inspectCandidate) {
        setInspectCandidate((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            dbUploadedDocuments: prev.dbUploadedDocuments.map((d) =>
              d.id === docId ? { ...d, status } : d
            ),
          };
        });
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === inspectCandidate.id
              ? {
                  ...c,
                  dbUploadedDocuments: c.dbUploadedDocuments.map((d) =>
                    d.id === docId ? { ...d, status } : d
                  ),
                }
              : c
          )
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar documento");
    } finally {
      setUpdatingDocId(null);
    }
  };

  // Submit Candidate Resolution
  const handleSubmitCandidateResolution = async (isVerified: boolean) => {
    if (!inspectCandidate) return;
    setSubmitting(true);
    try {
      await reviewCandidateVerification(inspectCandidate.id, isVerified, auditNotes);
      setCandidates((prev) =>
        prev.map((c) => (c.id === inspectCandidate.id ? { ...c, isVerified } : c))
      );
      toast.success(
        isVerified
          ? "¡Candidato verificado con éxito!"
          : "Expediente de candidato actualizado"
      );
      setInspectCandidate(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al dictaminar candidato");
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === "companies") {
      const headers = ["Empresa", "RFC", "Email", "Telefono", "Giro", "Estatus", "Verificado"];
      const rows = filteredCompanies.map((c) => [
        `"${c.companyName.replace(/"/g, '""')}"`,
        `"${c.rfc}"`,
        `"${c.contactEmail}"`,
        `"${c.contactPhone}"`,
        `"${c.industry}"`,
        `"${c.verificationStatus}"`,
        `"${c.isVerified ? "Si" : "No"}"`,
      ]);
      const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `verificaciones_empresas_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ["Candidato", "Tipo", "Email", "Telefono", "Cedula", "Verificado"];
      const rows = filteredCandidates.map((c) => [
        `"${c.fullName.replace(/"/g, '""')}"`,
        `"${c.candidateType}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.cedulaProfesional || ""}"`,
        `"${c.isVerified ? "Si" : "No"}"`,
      ]);
      const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `verificaciones_candidatos_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success("Listado exportado a CSV");
  };

  // Filtered Company List
  const filteredCompanies = React.useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.companyName.toLowerCase().includes(q) ||
        c.rfc.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && c.isVerified) ||
        (statusFilter === "pending" && !c.isVerified && c.verificationStatus === "pending") ||
        (statusFilter === "requires_revision" && c.verificationStatus === "requires_revision") ||
        (statusFilter === "rejected" && c.verificationStatus === "rejected");

      return matchesSearch && matchesStatus;
    });
  }, [companies, searchQuery, statusFilter]);

  // Filtered Candidate List
  const filteredCandidates = React.useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.cedulaProfesional && c.cedulaProfesional.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && c.isVerified) ||
        (statusFilter === "pending" && !c.isVerified);

      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  // TanStack Table: Company Columns
  const companyColumns = React.useMemo<ColumnDef<PendingCompanyItem>[]>(
    () => [
      {
        accessorKey: "companyName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <span>Empresa / Razón Social</span>
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const comp = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-extrabold text-sm border border-purple-500/20 shrink-0">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {comp.companyName}
                  </h4>
                  {comp.isVerified && (
                    <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {comp.industry} • {comp.fiscalAddress || "Sureste"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "rfc",
        header: "RFC & Contacto",
        cell: ({ row }) => {
          const comp = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono font-bold text-xs text-foreground bg-muted px-2 py-0.5 rounded-md border border-border/60">
                {comp.rfc}
              </span>
              <p className="text-[11px] text-muted-foreground truncate pt-0.5">
                {comp.contactEmail}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "dbUploadedDocuments",
        header: "Expediente Digital",
        cell: ({ row }) => {
          const docs = row.original.dbUploadedDocuments;
          if (!docs || docs.length === 0) {
            return (
              <span className="text-[11px] text-muted-foreground italic">
                Sin documentos
              </span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {docs.map((d) => (
                <Badge
                  key={d.id}
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0 font-bold rounded-md",
                    d.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : d.status === "rejected"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}
                >
                  {formatDocTypeLabel(d.docType)}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "verificationStatus",
        header: "Estatus",
        cell: ({ row }) => {
          const comp = row.original;
          if (comp.isVerified) {
            return (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[10px] gap-1">
                <CheckCircle2 className="size-3" />
                <span>Verificada</span>
              </Badge>
            );
          }
          if (comp.verificationStatus === "requires_revision") {
            return (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold text-[10px] gap-1">
                <AlertTriangle className="size-3" />
                <span>Requiere Revisión</span>
              </Badge>
            );
          }
          if (comp.verificationStatus === "rejected") {
            return (
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold text-[10px] gap-1">
                <XCircle className="size-3" />
                <span>Rechazada</span>
              </Badge>
            );
          }
          return (
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold text-[10px] gap-1">
              <Clock className="size-3" />
              <span>Por Auditar</span>
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acción</div>,
        cell: ({ row }) => {
          const comp = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                render={<Link href={`/dashboard/admin/verifications/${comp.id}`} />}
                size="sm"
                className="h-8 px-3.5 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
              >
                <Eye className="size-3.5" />
                <span>Auditar Expediente</span>
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  // TanStack Table: Candidate Columns
  const candidateColumns = React.useMemo<ColumnDef<PendingCandidateItem>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <span>Candidato</span>
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const cand = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-sm border border-indigo-500/20 shrink-0">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {cand.fullName}
                  </h4>
                  {cand.isVerified && (
                    <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {cand.headline || cand.candidateType.toUpperCase()} • {cand.preferredZone || "Sureste"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "cedulaProfesional",
        header: "Cédula / Especialidad",
        cell: ({ row }) => {
          const cand = row.original;
          return (
            <div className="space-y-0.5">
              {cand.cedulaProfesional ? (
                <span className="font-mono font-bold text-xs text-foreground bg-muted px-2 py-0.5 rounded-md border border-border/60">
                  Cédula: {cand.cedulaProfesional}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {cand.specializationArea || "Técnico / Operativo"}
                </span>
              )}
              <p className="text-[11px] text-muted-foreground truncate pt-0.5">
                {cand.email}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "dbUploadedDocuments",
        header: "Expediente Adjunto",
        cell: ({ row }) => {
          const docs = row.original.dbUploadedDocuments;
          if (!docs || docs.length === 0) {
            return (
              <span className="text-[11px] text-muted-foreground italic">
                Sin documentos
              </span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {docs.map((d) => (
                <Badge
                  key={d.id}
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0 font-bold rounded-md",
                    d.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : d.status === "rejected"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}
                >
                  {formatDocTypeLabel(d.docType)}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "isVerified",
        header: "Estatus",
        cell: ({ row }) => {
          const cand = row.original;
          return cand.isVerified ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[10px] gap-1">
              <CheckCircle2 className="size-3" />
              <span>Verificado</span>
            </Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold text-[10px] gap-1">
              <Clock className="size-3" />
              <span>Por Auditar</span>
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acción</div>,
        cell: ({ row }) => {
          const cand = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => handleOpenCandidateInspect(cand)}
                size="sm"
                className="h-8 px-3 rounded-xl text-xs font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
              >
                <Eye className="size-3.5" />
                <span>Auditar</span>
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  // TanStack Table instances
  const companyTable = useReactTable({
    data: filteredCompanies,
    columns: companyColumns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const candidateTable = useReactTable({
    data: filteredCandidates,
    columns: candidateColumns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const activeTable = activeTab === "companies" ? companyTable : candidateTable;

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      
      {/* Unified Main Card Workbench */}
      <Card className="bg-card border border-border/60 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-border/60">
          
          {/* Top Row: Entity Tabs & Search & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            
            {/* Entity Switcher Tabs */}
            <div className="inline-flex p-1 rounded-2xl bg-muted border border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("companies");
                  setPagination({ pageIndex: 0, pageSize: 10 });
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === "companies"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="size-4 text-purple-600 dark:text-purple-400" />
                <span>Empresas ({companies.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("candidates");
                  setPagination({ pageIndex: 0, pageSize: 10 });
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === "candidates"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
                <span>Candidatos ({candidates.length})</span>
              </button>
            </div>

            {/* Search Input & Export Button */}
            <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === "companies"
                      ? "Buscar por empresa, RFC o correo..."
                      : "Buscar por candidato, cédula o correo..."
                  }
                  className="h-10 pl-10 pr-8 rounded-xl bg-muted/40 border-border/60 text-xs sm:text-sm font-medium"
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-10 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/60 cursor-pointer shrink-0"
              >
                <Download className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>

          {/* Status Filter Row */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: "all", label: "Todos los expedientes" },
              { id: "pending", label: "Pendientes por Auditar" },
              { id: "verified", label: "Verificados con Sello" },
              ...(activeTab === "companies"
                ? [
                    { id: "requires_revision", label: "Requiere Corrección" },
                    { id: "rejected", label: "Rechazados" },
                  ]
                : []),
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
                </button>
              );
            })}
          </div>
        </div>

        {/* TanStack Table View */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/30 border-b border-border/60">
              {activeTab === "companies"
                ? companyTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="py-3.5 px-4 sm:px-6 font-extrabold text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))
                : candidateTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="py-3.5 px-4 sm:px-6 font-extrabold text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
            </TableHeader>
            <TableBody className="divide-y divide-border/40">
              {(activeTab === "companies"
                ? companyTable.getRowModel().rows.length === 0
                : candidateTable.getRowModel().rows.length === 0) ? (
                <TableRow>
                  <TableCell
                    colSpan={activeTab === "companies" ? companyColumns.length : candidateColumns.length}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="size-8 stroke-[1.4] text-muted-foreground/50" />
                      <p className="text-sm font-bold text-foreground">No hay expedientes pendientes</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        No se encontraron registros que coincidan con la búsqueda o filtro aplicado.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : activeTab === "companies" ? (
                companyTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3.5 px-4 sm:px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                candidateTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3.5 px-4 sm:px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Página <strong>{activeTable.getState().pagination.pageIndex + 1}</strong> de{" "}
              <strong>{Math.max(1, activeTable.getPageCount())}</strong>
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span>
              Mostrando {activeTable.getRowModel().rows.length} de{" "}
              {activeTab === "companies" ? filteredCompanies.length : filteredCandidates.length} registros
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => activeTable.setPageIndex(0)}
              disabled={!activeTable.getCanPreviousPage()}
              className="size-8 rounded-lg border-border/60"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => activeTable.previousPage()}
              disabled={!activeTable.getCanPreviousPage()}
              className="size-8 rounded-lg border-border/60"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => activeTable.nextPage()}
              disabled={!activeTable.getCanNextPage()}
              className="size-8 rounded-lg border-border/60"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => activeTable.setPageIndex(activeTable.getPageCount() - 1)}
              disabled={!activeTable.getCanNextPage()}
              className="size-8 rounded-lg border-border/60"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: Audit Candidate Dossier */}
      {inspectCandidate && (
        <Dialog open={!!inspectCandidate} onOpenChange={() => setInspectCandidate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/60 bg-card p-6">
            <DialogHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-extrabold border border-indigo-500/20 shrink-0">
                  <Users className="size-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <span>{inspectCandidate.fullName}</span>
                    {inspectCandidate.isVerified && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        Verificado
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-medium">
                    Auditoría de Cédula Profesional, Identificación y CV
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-5">
              {/* Candidate Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Cédula Profesional</span>
                  <p className="font-mono font-bold text-foreground text-sm pt-0.5">
                    {inspectCandidate.cedulaProfesional || "No registrada"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Tipo de Perfil</span>
                  <p className="font-semibold text-foreground pt-0.5">{inspectCandidate.candidateType.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Especialidad</span>
                  <p className="font-semibold text-foreground pt-0.5">{inspectCandidate.specializationArea || "General"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Correo</span>
                  <p className="font-semibold text-foreground pt-0.5 truncate">{inspectCandidate.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Teléfono</span>
                  <p className="font-semibold text-foreground pt-0.5">{inspectCandidate.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Zona Preferente</span>
                  <p className="font-semibold text-foreground pt-0.5">{inspectCandidate.preferredZone || "Sureste"}</p>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" />
                  <span>Documentos Adjuntos ({inspectCandidate.dbUploadedDocuments.length})</span>
                </h4>

                {inspectCandidate.dbUploadedDocuments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-4 rounded-xl bg-muted/20 border border-border/40">
                    El candidato no tiene documentos cargados en su perfil.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {inspectCandidate.dbUploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileCheck className="size-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-foreground truncate">
                              {formatDocTypeLabel(doc.docType)}
                            </h5>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {doc.fileName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {doc.fileUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setActiveDocPreview({
                                  title: formatDocTypeLabel(doc.docType),
                                  url: doc.fileUrl,
                                })
                              }
                              className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1"
                            >
                              <Eye className="size-3.5" />
                              <span>Ver</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant={doc.status === "approved" ? "default" : "outline"}
                            disabled={updatingDocId === doc.id}
                            onClick={() => handleReviewDocument(doc.id, "approved")}
                            className={cn(
                              "h-8 px-2.5 rounded-lg text-xs font-bold gap-1",
                              doc.status === "approved" && "bg-emerald-600 text-white"
                            )}
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Aprobar</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="cand_notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notas de Verificación
                </Label>
                <Textarea
                  id="cand_notes"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Observaciones de Cédula SEP o expediente..."
                  className="min-h-[70px] rounded-xl bg-muted/30 border-border/60 text-xs font-medium"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 border-t border-border/50 pt-4">
              <Button
                variant="outline"
                onClick={() => setInspectCandidate(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cerrar
              </Button>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => handleSubmitCandidateResolution(false)}
                  disabled={submitting}
                  variant="destructive"
                  className="rounded-xl text-xs font-bold"
                >
                  Revocar / Rechazar
                </Button>

                <Button
                  onClick={() => handleSubmitCandidateResolution(true)}
                  disabled={submitting}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-4" />}
                  <span>Verificar Candidato</span>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox: Document Preview Dialog */}
      {activeDocPreview && (
        <Dialog open={!!activeDocPreview} onOpenChange={() => setActiveDocPreview(null)}>
          <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[94vw] md:max-w-[92vw] lg:max-w-6xl xl:max-w-[1300px] h-[92vh] max-h-[94vh] rounded-3xl border-border/60 bg-card p-5 sm:p-6 flex flex-col gap-3.5 overflow-hidden shadow-2xl">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>{activeDocPreview.title}</span>
              </DialogTitle>
              {activeDocPreview.url && (
                <a
                  href={activeDocPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Download className="size-3.5" />
                  <span>Descargar</span>
                </a>
              )}
            </DialogHeader>

            <div className="py-4 max-h-[65vh] overflow-auto flex items-center justify-center bg-muted/20 rounded-2xl border border-border/40">
              {activeDocPreview.url.toLowerCase().includes(".pdf") ||
              activeDocPreview.title.toLowerCase().includes("pdf") ||
              activeDocPreview.title.toLowerCase().includes("curp") ||
              activeDocPreview.title.toLowerCase().includes("cédula") ||
              activeDocPreview.title.toLowerCase().includes("constancia") ? (
                <object
                  data={activeDocPreview.url}
                  type="application/pdf"
                  className="w-full h-[500px] rounded-xl"
                >
                  <iframe
                    src={activeDocPreview.url}
                    className="w-full h-[500px] rounded-xl border-none bg-white"
                    title={activeDocPreview.title}
                  />
                </object>
              ) : (
                <img
                  src={activeDocPreview.url}
                  alt={activeDocPreview.title}
                  className="max-h-[500px] max-w-full rounded-xl object-contain shadow-xs"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
