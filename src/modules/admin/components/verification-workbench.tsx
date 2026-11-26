"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  File02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  reviewCandidateVerification,
  reviewProfileDocument,
} from "@/app/(dashboard)/dashboard/admin/verifications/actions";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface VerificationWorkbenchProps {
  initialCompanies: PendingCompanyItem[];
  initialCandidates: PendingCandidateItem[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const ROW_HEIGHT_PX = 54;
const HEADER_HEIGHT_PX = 36;

function formatDocTypeLabel(docType: string): string {
  switch (docType) {
    case "constancia_situacion_fiscal":
      return "Constancia RFC";
    case "legal_rep_id":
      return "INE Rep. Legal";
    case "acta_constitutiva":
      return "Acta Constitutiva";
    case "legal_power":
      return "Poder / IMSS";
    case "cedula_profesional":
      return "Cédula SEP";
    case "cv":
      return "CV";
    case "ine":
    case "ine_passport":
      return "INE / ID";
    case "curp":
      return "CURP";
    case "proof_of_address":
      return "Domicilio";
    default:
      return docType.replace(/_/g, " ");
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function VerificationWorkbenchClient({
  initialCompanies,
  initialCandidates,
}: VerificationWorkbenchProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"companies" | "candidates">(
    "companies"
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [companies] = React.useState<PendingCompanyItem[]>(initialCompanies);
  const [candidates, setCandidates] =
    React.useState<PendingCandidateItem[]>(initialCandidates);

  const [inspectCandidate, setInspectCandidate] =
    React.useState<PendingCandidateItem | null>(null);
  const [auditNotes, setAuditNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [updatingDocId, setUpdatingDocId] = React.useState<string | null>(null);
  const [activeDocPreview, setActiveDocPreview] = React.useState<{
    title: string;
    url: string;
  } | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleOpenCandidateInspect = React.useCallback(
    (item: PendingCandidateItem) => {
      setInspectCandidate(item);
      setAuditNotes("");
    },
    []
  );

  const handleReviewDocument = async (
    docId: string,
    status: "approved" | "rejected"
  ) => {
    setUpdatingDocId(docId);
    try {
      await reviewProfileDocument(docId, status);
      toast.success(
        status === "approved" ? "Documento aprobado" : "Documento rechazado"
      );

      if (inspectCandidate) {
        setInspectCandidate((prev) =>
          prev
            ? {
                ...prev,
                dbUploadedDocuments: prev.dbUploadedDocuments.map((d) =>
                  d.id === docId ? { ...d, status } : d
                ),
              }
            : null
        );
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al actualizar documento"));
    } finally {
      setUpdatingDocId(null);
    }
  };

  const handleSubmitCandidateResolution = async (isVerified: boolean) => {
    if (!inspectCandidate) return;
    setSubmitting(true);
    try {
      await reviewCandidateVerification(
        inspectCandidate.id,
        isVerified,
        auditNotes
      );
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === inspectCandidate.id ? { ...c, isVerified } : c
        )
      );
      toast.success(
        isVerified
          ? "Candidato verificado con éxito"
          : "Expediente de candidato actualizado"
      );
      setInspectCandidate(null);
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al dictaminar candidato"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesSearch =
        !q ||
        c.companyName.toLowerCase().includes(q) ||
        c.rfc.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && c.isVerified) ||
        (statusFilter === "pending" &&
          !c.isVerified &&
          c.verificationStatus === "pending") ||
        (statusFilter === "requires_revision" &&
          c.verificationStatus === "requires_revision") ||
        (statusFilter === "rejected" && c.verificationStatus === "rejected");

      return matchesSearch && matchesStatus;
    });
  }, [companies, searchQuery, statusFilter]);

  const filteredCandidates = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidates.filter((c) => {
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.cedulaProfesional &&
          c.cedulaProfesional.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && c.isVerified) ||
        (statusFilter === "pending" && !c.isVerified);

      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (activeTab === "companies") {
      const headers = [
        "Empresa",
        "RFC",
        "Email",
        "Telefono",
        "Giro",
        "Estatus",
        "Verificado",
      ];
      const rows = filteredCompanies.map((c) => [
        `"${c.companyName.replace(/"/g, '""')}"`,
        `"${c.rfc}"`,
        `"${c.contactEmail}"`,
        `"${c.contactPhone}"`,
        `"${c.industry}"`,
        `"${c.verificationStatus}"`,
        `"${c.isVerified ? "Si" : "No"}"`,
      ]);
      const csv =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `verificaciones_empresas_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        "Candidato",
        "Tipo",
        "Email",
        "Telefono",
        "Cedula",
        "Verificado",
      ];
      const rows = filteredCandidates.map((c) => [
        `"${c.fullName.replace(/"/g, '""')}"`,
        `"${c.candidateType}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.cedulaProfesional || ""}"`,
        `"${c.isVerified ? "Si" : "No"}"`,
      ]);
      const csv =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `verificaciones_candidatos_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success("Listado exportado a CSV");
  };

  const companyColumns = React.useMemo<ColumnDef<PendingCompanyItem>[]>(
    () => [
      {
        accessorKey: "companyName",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span>Empresa</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => {
          const comp = row.original;
          return (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="size-[30px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={Building03Icon}
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-medium text-foreground truncate">
                    {comp.companyName}
                  </span>
                  {comp.isVerified && (
                    <ShieldCheck className="size-3.5 text-success-foreground shrink-0" />
                  )}
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate">
                  {comp.industry} · {comp.fiscalAddress || "Sureste"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "rfc",
        header: "RFC y contacto",
        cell: ({ row }) => {
          const comp = row.original;
          return (
            <div className="min-w-0">
              <div className="font-mono text-[12px] font-medium text-foreground truncate">
                {comp.rfc}
              </div>
              <div className="text-[11.5px] text-muted-foreground truncate">
                {comp.contactEmail}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "dbUploadedDocuments",
        header: "Documentos",
        cell: ({ row }) => {
          const docs = row.original.dbUploadedDocuments;
          if (!docs || docs.length === 0) {
            return (
              <span className="text-[12px] text-muted-foreground">
                Sin archivos
              </span>
            );
          }
          const visible = docs.slice(0, 2);
          const extra = docs.length - visible.length;
          return (
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              {visible.map((d) => (
                <Badge
                  key={d.id}
                  variant="outline"
                  className={cn(
                    "rounded-[6px] px-1.5 py-0 text-[10.5px] font-medium max-w-[100px]",
                    d.status === "approved"
                      ? "bg-success text-success-foreground border-transparent"
                      : d.status === "rejected"
                        ? "bg-error text-error-foreground border-transparent"
                        : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  <span className="truncate">{formatDocTypeLabel(d.docType)}</span>
                </Badge>
              ))}
              {extra > 0 && (
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                  +{extra}
                </span>
              )}
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
              <span className="text-[12px] font-semibold text-success-foreground whitespace-nowrap">
                Verificada
              </span>
            );
          }
          if (comp.verificationStatus === "requires_revision") {
            return (
              <span className="text-[12px] font-semibold text-warning-foreground whitespace-nowrap">
                Corrección
              </span>
            );
          }
          if (comp.verificationStatus === "rejected") {
            return (
              <span className="text-[12px] font-semibold text-destructive whitespace-nowrap">
                Rechazada
              </span>
            );
          }
          return (
            <span className="text-[12px] font-semibold text-warning-foreground whitespace-nowrap">
              Por auditar
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acción</div>,
        cell: ({ row }) => (
          <div className="text-right whitespace-nowrap">
            <Link
              href={`/dashboard/admin/verifications/${row.original.id}`}
              className="text-[12.5px] font-medium text-link hover:underline"
            >
              Auditar →
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  const candidateColumns = React.useMemo<ColumnDef<PendingCandidateItem>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span>Candidato</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => {
          const cand = row.original;
          return (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="size-[30px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-medium text-foreground truncate">
                    {cand.fullName}
                  </span>
                  {cand.isVerified && (
                    <ShieldCheck className="size-3.5 text-success-foreground shrink-0" />
                  )}
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate">
                  {cand.headline || cand.candidateType} ·{" "}
                  {cand.preferredZone || "Sureste"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "cedulaProfesional",
        header: "Cédula / contacto",
        cell: ({ row }) => {
          const cand = row.original;
          return (
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-foreground truncate">
                {cand.cedulaProfesional ? (
                  <span className="font-mono">{cand.cedulaProfesional}</span>
                ) : (
                  cand.specializationArea || "Técnico / Operativo"
                )}
              </div>
              <div className="text-[11.5px] text-muted-foreground truncate">
                {cand.email}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "dbUploadedDocuments",
        header: "Documentos",
        cell: ({ row }) => {
          const docs = row.original.dbUploadedDocuments;
          if (!docs || docs.length === 0) {
            return (
              <span className="text-[12px] text-muted-foreground">
                Sin archivos
              </span>
            );
          }
          const visible = docs.slice(0, 2);
          const extra = docs.length - visible.length;
          return (
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              {visible.map((d) => (
                <Badge
                  key={d.id}
                  variant="outline"
                  className={cn(
                    "rounded-[6px] px-1.5 py-0 text-[10.5px] font-medium max-w-[100px]",
                    d.status === "approved"
                      ? "bg-success text-success-foreground border-transparent"
                      : d.status === "rejected"
                        ? "bg-error text-error-foreground border-transparent"
                        : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  <span className="truncate">{formatDocTypeLabel(d.docType)}</span>
                </Badge>
              ))}
              {extra > 0 && (
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                  +{extra}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "isVerified",
        header: "Estatus",
        cell: ({ row }) =>
          row.original.isVerified ? (
            <span className="text-[12px] font-semibold text-success-foreground whitespace-nowrap">
              Verificado
            </span>
          ) : (
            <span className="text-[12px] font-semibold text-warning-foreground whitespace-nowrap">
              Por auditar
            </span>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acción</div>,
        cell: ({ row }) => (
          <div className="text-right whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleOpenCandidateInspect(row.original)}
              className="text-[12.5px] font-medium text-link hover:underline cursor-pointer"
            >
              Auditar →
            </button>
          </div>
        ),
      },
    ],
    [handleOpenCandidateInspect]
  );

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
  const totalFiltered =
    activeTab === "companies"
      ? filteredCompanies.length
      : filteredCandidates.length;
  const currentPageIndex = activeTable.getState().pagination.pageIndex;
  const currentPageSize = activeTable.getState().pagination.pageSize;
  const totalPages = Math.max(1, activeTable.getPageCount());
  const startItem =
    totalFiltered === 0 ? 0 : currentPageIndex * currentPageSize + 1;
  const endItem = Math.min(
    (currentPageIndex + 1) * currentPageSize,
    totalFiltered
  );

  // Reserve exact vertical height for currentPageSize rows to eliminate layout shift
  const tableMinHeight = HEADER_HEIGHT_PX + currentPageSize * ROW_HEIGHT_PX;

  const statusTabs = [
    { id: "all", label: "Todos" },
    { id: "pending", label: "Por auditar" },
    { id: "verified", label: "Verificados" },
    ...(activeTab === "companies"
      ? [
          { id: "requires_revision", label: "Corrección" },
          { id: "rejected", label: "Rechazados" },
        ]
      : []),
  ];

  const colWidths = ["w-[32%]", "w-[23%]", "w-[22%]", "w-[11%]", "w-[12%]"];

  return (
    <div className="w-full">
      <section className="bg-card border border-border rounded-[14px] overflow-hidden">
        {/* Toolbar compacta */}
        <div className="px-4 py-3 border-b border-border flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
            {/* Switcher Empresas / Candidatos */}
            <div className="inline-flex p-0.5 rounded-[10px] bg-muted/60 border border-border shrink-0 self-start">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("companies");
                  setStatusFilter("all");
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className={cn(
                  "h-7 px-3 rounded-[8px] text-[12.5px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer select-none",
                  activeTab === "companies"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HugeiconsIcon
                  icon={Building03Icon}
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span>Empresas</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {companies.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("candidates");
                  setStatusFilter("all");
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className={cn(
                  "h-7 px-3 rounded-[8px] text-[12.5px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer select-none",
                  activeTab === "candidates"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span>Candidatos</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {candidates.length}
                </span>
              </button>
            </div>

            {/* Búsqueda + Exportar */}
            <div className="flex items-center gap-2 flex-1 sm:max-w-sm justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  placeholder={
                    activeTab === "companies"
                      ? "Buscar empresa, RFC o correo..."
                      : "Buscar candidato, cédula o correo..."
                  }
                  className="h-8 pl-8 pr-7 rounded-[8px] bg-background border-control-border text-[12.5px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    onClick={() => {
                      setSearchQuery("");
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 px-2.5 rounded-[8px] text-[12px] font-medium gap-1.5 border-control-border cursor-pointer shrink-0"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>
          </div>

          {/* Filtros de estatus */}
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  className={cn(
                    "h-7 px-2.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer select-none",
                    isSelected
                      ? "bg-sidebar-accent text-link"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabla compacta con columnas y altura fijas */}
        <div
          className="overflow-x-auto"
          style={{ minHeight: `${tableMinHeight}px` }}
        >
          <Table className="w-full table-fixed min-w-[700px]">
            <TableHeader className="bg-muted/30 border-b border-border">
              {activeTab === "companies"
                ? companyTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent h-9"
                    >
                      {headerGroup.headers.map((header, idx) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "h-9 px-4 text-[11.5px] font-semibold text-muted-foreground",
                            colWidths[idx]
                          )}
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
                  ))
                : candidateTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent h-9"
                    >
                      {headerGroup.headers.map((header, idx) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "h-9 px-4 text-[11.5px] font-semibold text-muted-foreground",
                            colWidths[idx]
                          )}
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
            <TableBody className="divide-y divide-border">
              {activeTable.getRowModel().rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    style={{ height: `${currentPageSize * ROW_HEIGHT_PX}px` }}
                    className="text-center text-muted-foreground align-middle"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <ShieldCheck className="size-5 text-muted-foreground/50" />
                      <p className="text-[13px] font-medium text-foreground">
                        Sin expedientes para mostrar
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        Ajusta la búsqueda o el filtro seleccionado.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : activeTab === "companies" ? (
                companyTable.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-[54px] hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                candidateTable.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-[54px] hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pie de paginación compacto */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {totalFiltered === 0
              ? "0 resultados"
              : `Mostrando ${startItem}–${endItem} de ${totalFiltered}`}
          </span>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground hidden sm:inline">
                Filas:
              </span>
              <Select
                value={String(currentPageSize)}
                onValueChange={(val) => {
                  const next = Number(val);
                  if (next > 0) {
                    setPagination({ pageIndex: 0, pageSize: next });
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Filas por página"
                  className="h-7 w-[64px] rounded-[8px] border-control-border bg-background text-[12px] tabular-nums"
                >
                  <SelectValue>{currentPageSize}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border-border bg-popover">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem
                      key={size}
                      value={String(size)}
                      className="text-[12px] tabular-nums"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground tabular-nums min-w-[72px] text-center">
                Pág. {currentPageIndex + 1} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Página anterior"
                disabled={!activeTable.getCanPreviousPage()}
                onClick={() => activeTable.previousPage()}
                className="size-7 rounded-[8px] border-control-border cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Página siguiente"
                disabled={!activeTable.getCanNextPage()}
                onClick={() => activeTable.nextPage()}
                className="size-7 rounded-[8px] border-control-border cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal compacto: Auditoría de candidato */}
      {inspectCandidate && (
        <Dialog
          open={Boolean(inspectCandidate)}
          onOpenChange={() => setInspectCandidate(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[16px] border-border bg-card p-5">
            <DialogHeader className="border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <span className="size-9 rounded-[10px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                    <span className="truncate">{inspectCandidate.fullName}</span>
                    {inspectCandidate.isVerified && (
                      <span className="text-[11px] font-semibold text-success-foreground shrink-0">
                        Verificado
                      </span>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-[12px] text-muted-foreground">
                    Auditoría de cédula profesional, identificación y CV
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-3 space-y-4">
              {/* Resumen del candidato */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-[12px] bg-muted/40 border border-border text-[12px]">
                <div>
                  <span className="text-[11px] text-muted-foreground">
                    Cédula profesional
                  </span>
                  <p className="font-mono font-semibold text-foreground mt-0.5 truncate">
                    {inspectCandidate.cedulaProfesional || "No registrada"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">
                    Tipo de perfil
                  </span>
                  <p className="font-medium text-foreground mt-0.5 truncate">
                    {inspectCandidate.candidateType}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">
                    Especialidad
                  </span>
                  <p className="font-medium text-foreground mt-0.5 truncate">
                    {inspectCandidate.specializationArea || "General"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">
                    Correo
                  </span>
                  <p className="font-medium text-foreground mt-0.5 truncate">
                    {inspectCandidate.email}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">
                    Teléfono
                  </span>
                  <p className="font-medium text-foreground mt-0.5 truncate">
                    {inspectCandidate.phone || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">
                    Zona preferente
                  </span>
                  <p className="font-medium text-foreground mt-0.5 truncate">
                    {inspectCandidate.preferredZone || "Sureste"}
                  </p>
                </div>
              </div>

              {/* Documentos adjuntos */}
              <div className="space-y-2">
                <h4 className="text-[12px] font-semibold text-muted-foreground">
                  Documentos adjuntos ({inspectCandidate.dbUploadedDocuments.length})
                </h4>

                {inspectCandidate.dbUploadedDocuments.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground p-3 rounded-[10px] bg-muted/30 border border-border">
                    El candidato no tiene documentos cargados en su perfil.
                  </p>
                ) : (
                  <div className="divide-y divide-border rounded-[12px] border border-border overflow-hidden">
                    {inspectCandidate.dbUploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="px-3 py-2.5 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="size-8 rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                            <HugeiconsIcon
                              icon={File02Icon}
                              size={15}
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-medium text-foreground truncate">
                              {formatDocTypeLabel(doc.docType)}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {doc.fileName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {doc.fileUrl && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setActiveDocPreview({
                                  title: formatDocTypeLabel(doc.docType),
                                  url: doc.fileUrl,
                                })
                              }
                              className="h-7 px-2.5 rounded-[8px] text-[12px] font-medium gap-1 border-control-border cursor-pointer"
                            >
                              <Eye className="size-3.5" />
                              <span>Ver</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant={
                              doc.status === "approved" ? "default" : "outline"
                            }
                            disabled={updatingDocId === doc.id}
                            onClick={() =>
                              handleReviewDocument(doc.id, "approved")
                            }
                            className={cn(
                              "h-7 px-2.5 rounded-[8px] text-[12px] font-medium gap-1 cursor-pointer",
                              doc.status === "approved"
                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                : "border-control-border"
                            )}
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Aprobar</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant={
                              doc.status === "rejected"
                                ? "destructive"
                                : "outline"
                            }
                            disabled={updatingDocId === doc.id}
                            onClick={() =>
                              handleReviewDocument(doc.id, "rejected")
                            }
                            className="h-7 px-2 rounded-[8px] text-[12px] font-medium border-control-border cursor-pointer"
                            aria-label="Rechazar documento"
                          >
                            <XCircle className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="cand_notes"
                  className="text-[12px] font-semibold text-muted-foreground"
                >
                  Notas de verificación
                </Label>
                <Textarea
                  id="cand_notes"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Observaciones de cédula SEP o expediente..."
                  className="min-h-[64px] rounded-[10px] bg-background border-control-border text-[12.5px]"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInspectCandidate(null)}
                className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
              >
                Cerrar
              </Button>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => handleSubmitCandidateResolution(false)}
                  disabled={submitting}
                  variant="destructive"
                  className="h-8 px-3 rounded-[8px] text-[12.5px] font-semibold cursor-pointer"
                >
                  Revocar / Rechazar
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSubmitCandidateResolution(true)}
                  disabled={submitting}
                  className="h-8 px-3 rounded-[8px] text-[12.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  <span>Verificar candidato</span>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox: Vista previa de documento */}
      {activeDocPreview && (
        <Dialog
          open={Boolean(activeDocPreview)}
          onOpenChange={() => setActiveDocPreview(null)}
        >
          <DialogContent className="w-[96vw] max-w-[96vw] lg:max-w-5xl h-[90vh] max-h-[92vh] rounded-[16px] border-border bg-card p-5 flex flex-col gap-3 overflow-hidden">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-3 pr-8">
              <DialogTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-link" />
                <span>{activeDocPreview.title}</span>
              </DialogTitle>
              {activeDocPreview.url && (
                <a
                  href={activeDocPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-link hover:underline"
                >
                  <Download className="size-3.5" />
                  <span>Descargar</span>
                </a>
              )}
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center bg-muted/30 rounded-[12px] border border-border p-3">
              {activeDocPreview.url.toLowerCase().includes(".pdf") ||
              activeDocPreview.title.toLowerCase().includes("pdf") ||
              activeDocPreview.title.toLowerCase().includes("curp") ||
              activeDocPreview.title.toLowerCase().includes("cédula") ||
              activeDocPreview.title.toLowerCase().includes("constancia") ? (
                <object
                  data={activeDocPreview.url}
                  type="application/pdf"
                  className="w-full h-full min-h-[480px] rounded-[8px]"
                >
                  <iframe
                    src={activeDocPreview.url}
                    className="w-full h-full min-h-[480px] rounded-[8px] border-none bg-white"
                    title={activeDocPreview.title}
                  />
                </object>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeDocPreview.url}
                  alt={activeDocPreview.title}
                  className="max-h-full max-w-full rounded-[8px] object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
