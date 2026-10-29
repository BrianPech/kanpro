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
  FileCheck2,
  Clock,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  Download,
  Users,
  Plus,
  Eye,
  FileText,
  UserX,
  ShieldCheck,
  Building2,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  X,
  Check,
  AlertCircle,
  FileSignature,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ContractExpirationItem, WorkforceKPIs } from "../types/dashboard";
import { EmploymentContract, ContractTemplateType } from "../types/contracts";
import {
  createContractAction,
  renewContractAction,
  signContractAction,
} from "../actions/contracts";
import {
  terminateCompanyEmployeeAction,
  reactivateCompanyEmployeeAction,
} from "../actions/employees";
import {
  ContractBuilderModal,
  ActiveEmployeeOption,
  CompanyLegalInfo,
} from "./contracts/contract-builder-modal";
import { ContractPreviewModal } from "./contracts/contract-preview-modal";
import { EmployeeDossierSheet } from "./dossier/employee-dossier-sheet";
import { CompanyPageHeader } from "./shared/company-page-header";
import { CompanyStatusBadge } from "./shared/company-status-badge";

export interface ContractRecord {
  id: string;
  folio: string;
  employeeId: string;
  employeeName: string;
  avatarUrl: string | null;
  phone?: string;
  jobTitle: string;
  department: string;
  contractType: string;
  templateType: ContractTemplateType;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  salary: number;
  paymentFrequency: string;
  status: "vigente" | "proximo_a_vencer" | "imminent" | "en_firma";
  companySigned: boolean;
  employeeSigned: boolean;
}

interface TerminationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl: string | null;
  phone?: string;
  jobTitle: string;
  department: string;
  terminationDate: string;
  reason:
    | "Renuncia voluntaria"
    | "Fin de contrato / Proyecto"
    | "Despido justificado"
    | "Mutuo acuerdo"
    | "Abandono de empleo"
    | "Otro";
  notes?: string;
  severanceStatus: "finiquitado" | "pendiente_firma" | "en_proceso";
  severanceAmount: number;
}

export type { ActiveEmployeeOption, CompanyLegalInfo, TerminationRecord };

export interface ContractsViewProps {
  realContracts?: ContractRecord[];
  realTerminations?: TerminationRecord[];
  activeEmployees?: ActiveEmployeeOption[];
  companyInfo?: CompanyLegalInfo;
  kpis?: WorkforceKPIs;
  initialContracts?: ContractExpirationItem[];
}

export function ContractsView({
  realContracts = [],
  realTerminations = [],
  activeEmployees = [],
  companyInfo,
  kpis: _kpis,
}: ContractsViewProps) {
  const [activeTab, setActiveTab] = React.useState<"contracts" | "terminations">(
    "contracts"
  );

  // Real contracts state directly from Supabase (empty if no records)
  const [contracts, setContracts] = React.useState<ContractRecord[]>(
    () => realContracts || []
  );

  React.useEffect(() => {
    setContracts(realContracts || []);
  }, [realContracts]);

  // Real terminations state directly from Supabase (empty if no records)
  const [terminations, setTerminations] = React.useState<TerminationRecord[]>(
    () => realTerminations || []
  );

  React.useEffect(() => {
    setTerminations(realTerminations || []);
  }, [realTerminations]);

  // Filters State for Contracts
  const [contractSearch, setContractSearch] = React.useState("");
  const [contractStatusFilter, setContractStatusFilter] = React.useState("all");
  const [contractTypeFilter, setContractTypeFilter] = React.useState("all");
  const [contractSorting, setContractSorting] = React.useState<SortingState>([
    { id: "daysRemaining", desc: false },
  ]);

  // Filters State for Terminations
  const [terminationSearch, setTerminationSearch] = React.useState("");
  const [terminationReasonFilter, setTerminationReasonFilter] =
    React.useState("all");
  const [terminationSorting, setTerminationSorting] =
    React.useState<SortingState>([{ id: "terminationDate", desc: true }]);

  // Modals & Sheets State
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [previewContract, setPreviewContract] =
    React.useState<EmploymentContract | null>(null);
  const [dossierEmployee, setDossierEmployee] = React.useState<any | null>(
    null
  );
  const [isDossierOpen, setIsDossierOpen] = React.useState(false);

  // Renew modal
  const [selectedContractForRenew, setSelectedContractForRenew] =
    React.useState<ContractRecord | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = React.useState(false);
  const [extensionPeriod, setExtensionPeriod] = React.useState("indeterminado");

  // Terminate modal
  const [selectedContractForTerminate, setSelectedContractForTerminate] =
    React.useState<ContractRecord | null>(null);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = React.useState(false);
  const [terminationReason, setTerminationReason] = React.useState<
    TerminationRecord["reason"]
  >("Renuncia voluntaria");
  const [terminationNotes, setTerminationNotes] = React.useState("");
  const [isTerminating, setIsTerminating] = React.useState(false);

  // Metrics
  const metrics = React.useMemo(() => {
    const totalActive = contracts.length;
    const imminent = contracts.filter((c) => c.status === "imminent").length;
    const upcoming = contracts.filter(
      (c) => c.status === "proximo_a_vencer"
    ).length;
    const indefinite = contracts.filter(
      (c) => c.templateType === "indeterminado"
    ).length;
    const totalBajas = terminations.length;

    return {
      totalActive,
      imminent,
      upcoming,
      indefinite,
      totalBajas,
      criticalTotal: imminent + upcoming,
    };
  }, [contracts, terminations]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOpenPreviewFromRecord = (item: ContractRecord) => {
    const matchedEmp = activeEmployees.find(
      (e) =>
        e.id === item.employeeId ||
        e.name.toLowerCase() === item.employeeName.toLowerCase()
    );

    const fullContract: EmploymentContract = {
      id: item.id,
      folio: item.folio,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      employeeRfc: matchedEmp?.rfc || "XAXX010101000",
      employeeCurp: matchedEmp?.curp || "NO_REGISTRADO",
      employeeAddress: "Domicilio registrado en expediente laboral",
      avatarUrl: item.avatarUrl,
      jobTitle: item.jobTitle,
      department: item.department,
      companyName: companyInfo?.name || "Empresa Contratante",
      companyRfc: companyInfo?.rfc || "XAXX010101000",
      companyAddress:
        companyInfo?.address ||
        "Domicilio fiscal registrado en Quintana Roo, México",
      legalRepName: companyInfo?.legalRepName || "Representante Legal",
      templateType: item.templateType,
      templateName: item.contractType,
      startDate: item.startDate,
      endDate: item.endDate === "Indeterminado" ? null : item.endDate,
      baseSalaryMonthly: item.salary,
      dailyIntegratedSalary: item.salary / 30.4,
      paymentFrequency: "quincenal",
      workSchedule: "Lunes a Viernes 08:00 - 17:00 (Sábados rotativos)",
      status: item.status === "en_firma" ? "en_firma" : "vigente",
      companySignature: item.companySigned
        ? {
            signerName: companyInfo?.legalRepName || "Representante Legal",
            signerRole: "representante_legal",
            signatureDataUrl:
              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><path d='M10 20 Q 30 5, 50 20 T 90 20' fill='none' stroke='%231e293b' stroke-width='2'/></svg>",
            signedAt: item.startDate,
            certificateHash: "SHA256:0x7a8b9c1d2e3f4a5b",
          }
        : null,
      employeeSignature: item.employeeSigned
        ? {
            signerName: item.employeeName,
            signerRole: "trabajador",
            signatureDataUrl:
              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><path d='M10 25 Q 40 10, 80 25' fill='none' stroke='%231e293b' stroke-width='2'/></svg>",
            signedAt: item.startDate,
            certificateHash: "SHA256:0x8b9c1d2e3f4a5b6c",
          }
        : null,
      addendums: [],
      createdAt: item.startDate,
    };

    setPreviewContract(fullContract);
  };

  const handleOpenDossierFromContract = (item: ContractRecord) => {
    setDossierEmployee({
      id: item.employeeId,
      candidate_id: `cand-${item.employeeId}`,
      full_name: item.employeeName,
      phone: item.phone || "+52 984 123 4567",
      avatar_url: item.avatarUrl,
      location: "Riviera Maya, Q. Roo",
      vacancy_title: item.jobTitle,
      vacancy_category: item.department,
      hired_date: item.startDate,
      status: "Contratado",
    });
    setIsDossierOpen(true);
  };

  const handleOpenDossierFromTermination = (item: TerminationRecord) => {
    setDossierEmployee({
      id: item.employeeId,
      candidate_id: `cand-${item.employeeId}`,
      full_name: item.employeeName,
      phone: item.phone || "+52 984 123 4567",
      avatar_url: item.avatarUrl,
      location: "Riviera Maya, Q. Roo",
      vacancy_title: item.jobTitle,
      vacancy_category: item.department,
      hired_date: item.terminationDate,
      status: "Baja",
      notes: `Motivo: ${item.reason}. ${item.notes || ""}`,
    });
    setIsDossierOpen(true);
  };

  const handleContractCreated = async (newContract: EmploymentContract) => {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        newContract.employeeId
      );

      const result = await createContractAction({
        employeeId: isUuid ? newContract.employeeId : undefined,
        folio: newContract.folio,
        jobTitle: newContract.jobTitle,
        department: newContract.department,
        contractType: newContract.templateName,
        templateType: newContract.templateType,
        startDate: newContract.startDate,
        endDate: newContract.endDate,
        salary: newContract.baseSalaryMonthly,
        paymentFrequency: newContract.paymentFrequency,
        companySigned: !!newContract.companySignature,
        companySignatureUrl: newContract.companySignature?.signatureDataUrl,
        employeeSigned: !!newContract.employeeSignature,
        employeeSignatureUrl: newContract.employeeSignature?.signatureDataUrl,
        status: newContract.employeeSignature ? "vigente" : "en_firma",
      });

      if (!result.success || !result.contractId || !result.folio) {
        throw new Error(result.error || "No se pudo registrar el contrato en la base de datos.");
      }

      const newRecord: ContractRecord = {
        id: result.contractId,
        folio: result.folio,
        employeeId: newContract.employeeId,
        employeeName: newContract.employeeName,
        avatarUrl: newContract.avatarUrl || null,
        phone: "+52 984 123 4567",
        jobTitle: newContract.jobTitle,
        department: newContract.department,
        contractType: newContract.templateName,
        templateType: newContract.templateType,
        startDate: newContract.startDate,
        endDate: newContract.endDate || "Indeterminado",
        daysRemaining: newContract.endDate ? 90 : 999,
        salary: newContract.baseSalaryMonthly,
        paymentFrequency: newContract.paymentFrequency,
        status: newContract.employeeSignature ? "vigente" : "en_firma",
        companySigned: !!newContract.companySignature,
        employeeSigned: !!newContract.employeeSignature,
      };

      setContracts((prev) => [newRecord, ...prev]);
      setPreviewContract(newContract);

      toast.success("Nuevo contrato laboral generado", {
        description: `Folio ${result.folio} para ${newContract.employeeName}.`,
      });
    } catch (err) {
      console.error("Error creating contract:", err);
      toast.error("No se pudo registrar el contrato en la base de datos.");
    }
  };

  const handleContractUpdated = async (updated: EmploymentContract) => {
    setPreviewContract(updated);
    try {
      const isCompanySigner = Boolean(updated.companySignature);
      const isEmployeeSigner = Boolean(updated.employeeSignature);
      const bothSigned = isCompanySigner && isEmployeeSigner;

      if (updated.companySignature) {
        await signContractAction({
          contractId: updated.id,
          signerRole: "representante_legal",
          signatureUrl: updated.companySignature.signatureDataUrl,
          isNowFullySigned: bothSigned,
        });
      }
      if (updated.employeeSignature) {
        await signContractAction({
          contractId: updated.id,
          signerRole: "trabajador",
          signatureUrl: updated.employeeSignature.signatureDataUrl,
          isNowFullySigned: bothSigned,
        });
      }

      setContracts((prev) =>
        prev.map((c) =>
          c.id === updated.id
            ? {
                ...c,
                status: bothSigned ? "vigente" : "en_firma",
                companySigned: isCompanySigner,
                employeeSigned: isEmployeeSigner,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Error signing contract:", err);
    }
  };

  const handleConfirmRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForRenew) return;

    const monthsToAdd =
      extensionPeriod === "3_meses"
        ? 3
        : extensionPeriod === "6_meses"
        ? 6
        : 12;

    const newEnd = new Date();
    newEnd.setMonth(newEnd.getMonth() + monthsToAdd);
    const calculatedEndDate =
      extensionPeriod === "indeterminado"
        ? null
        : newEnd.toISOString().split("T")[0];

    const templateType: ContractTemplateType =
      extensionPeriod === "indeterminado" ? "indeterminado" : "determinado";
    const contractType =
      extensionPeriod === "indeterminado"
        ? "Contrato por Tiempo Indeterminado (Planta)"
        : `Contrato Determinado (${monthsToAdd} meses)`;

    try {
      await renewContractAction({
        contractId: selectedContractForRenew.id,
        templateType,
        contractType,
        endDate: calculatedEndDate,
      });

      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContractForRenew.id
            ? {
                ...c,
                endDate: calculatedEndDate || "Indeterminado",
                daysRemaining:
                  extensionPeriod === "indeterminado" ? 999 : monthsToAdd * 30,
                status: "vigente",
                templateType,
                contractType,
              }
            : c
        )
      );

      toast.success("Contrato renovado exitosamente", {
        description: `Se actualizó la vigencia laboral de ${selectedContractForRenew.employeeName}.`,
      });
    } catch (err) {
      console.error("Error updating contract renewal in DB:", err);
      toast.error("No se pudo renovar el contrato en la base de datos.");
    }

    setIsRenewModalOpen(false);
    setSelectedContractForRenew(null);
  };

  const handleReactivateEmpleado = async (term: TerminationRecord) => {
    try {
      await reactivateCompanyEmployeeAction(term.employeeId);

      setTerminations((prev) => prev.filter((t) => t.id !== term.id));
      toast.success("Empleado reactivado", {
        description: `${term.employeeName} ha sido reincorporado a la plantilla activa.`,
      });
    } catch (err) {
      console.error("Error reactivating employee:", err);
      toast.error("No se pudo reactivar al empleado.");
    }
  };

  const handleConfirmTerminate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForTerminate) return;

    setIsTerminating(true);
    try {
      await terminateCompanyEmployeeAction(
        selectedContractForTerminate.employeeId,
        terminationReason,
        terminationNotes
      );

      const salary = selectedContractForTerminate.salary || 12000;
      const severanceAmount = Math.round(salary * 0.75);

      const newTermination: TerminationRecord = {
        id: selectedContractForTerminate.employeeId,
        employeeId: selectedContractForTerminate.employeeId,
        employeeName: selectedContractForTerminate.employeeName,
        avatarUrl: selectedContractForTerminate.avatarUrl,
        phone: selectedContractForTerminate.phone,
        jobTitle: selectedContractForTerminate.jobTitle,
        department: selectedContractForTerminate.department,
        terminationDate: new Date().toISOString().split("T")[0],
        reason: terminationReason,
        notes: terminationNotes || undefined,
        severanceStatus: "finiquitado",
        severanceAmount,
      };

      setTerminations((prev) => [newTermination, ...prev]);
      setContracts((prev) =>
        prev.filter((c) => c.id !== selectedContractForTerminate.id)
      );

      toast.success("Baja de empleado registrada", {
        description: `${selectedContractForTerminate.employeeName} ha sido dado de baja en el sistema.`,
      });

      setIsTerminateModalOpen(false);
      setSelectedContractForTerminate(null);
      setTerminationNotes("");
    } catch (err) {
      console.error("Error terminating employee:", err);
      toast.error("No se pudo registrar la baja en la base de datos.");
    } finally {
      setIsTerminating(false);
    }
  };

  // Filtered Contracts
  const filteredContracts = React.useMemo(() => {
    return contracts.filter((c) => {
      const query = contractSearch.toLowerCase();
      const matchesSearch =
        c.employeeName.toLowerCase().includes(query) ||
        c.jobTitle.toLowerCase().includes(query) ||
        c.department.toLowerCase().includes(query) ||
        c.folio.toLowerCase().includes(query);

      let matchesStatus = true;
      if (contractStatusFilter === "imminent") {
        matchesStatus = c.status === "imminent";
      } else if (contractStatusFilter === "upcoming") {
        matchesStatus =
          c.status === "proximo_a_vencer" || c.status === "imminent";
      } else if (contractStatusFilter === "vigente") {
        matchesStatus = c.status === "vigente";
      } else if (contractStatusFilter === "en_firma") {
        matchesStatus = c.status === "en_firma";
      }

      const matchesType =
        contractTypeFilter === "all" || c.templateType === contractTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [contracts, contractSearch, contractStatusFilter, contractTypeFilter]);

  // Filtered Terminations
  const filteredTerminations = React.useMemo(() => {
    return terminations.filter((t) => {
      const query = terminationSearch.toLowerCase();
      const matchesSearch =
        t.employeeName.toLowerCase().includes(query) ||
        t.jobTitle.toLowerCase().includes(query) ||
        t.department.toLowerCase().includes(query) ||
        (t.notes && t.notes.toLowerCase().includes(query));

      const matchesReason =
        terminationReasonFilter === "all" ||
        t.reason === terminationReasonFilter;

      return matchesSearch && matchesReason;
    });
  }, [terminations, terminationSearch, terminationReasonFilter]);

  // Contract Columns Definition
  const contractColumns = React.useMemo<ColumnDef<ContractRecord>[]>(
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
            <span>Empleado</span>
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
          const item = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar
                onClick={() => handleOpenDossierFromContract(item)}
                className="size-9 rounded-xl border border-border/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
              >
                <AvatarImage
                  src={item.avatarUrl || undefined}
                  alt={item.employeeName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl font-extrabold text-xs bg-primary/10 text-primary">
                  {getInitials(item.employeeName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDossierFromContract(item)}
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate block text-left cursor-pointer"
                >
                  {item.employeeName}
                </button>
                <p className="text-[11px] text-muted-foreground truncate">
                  {item.jobTitle}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "folio",
        id: "folio",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Folio & Modalidad</span>
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
          const item = row.original;
          return (
            <div className="space-y-1 py-1">
              <span className="font-mono text-xs font-bold text-foreground block">
                {item.folio}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0 border-border/30 bg-muted/30"
              >
                {item.templateType === "indeterminado"
                  ? "Planta (Indeterminado)"
                  : item.templateType === "periodo_prueba"
                  ? "Prueba (90 días)"
                  : item.templateType === "determinado"
                  ? "Tiempo Determinado"
                  : "Honorarios"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "daysRemaining",
        id: "daysRemaining",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Vigencia & Plazo</span>
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
          const item = row.original;
          const isImminent = item.status === "imminent";
          const isUpcoming = item.status === "proximo_a_vencer";

          return (
            <div className="space-y-0.5 py-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Calendar className="size-3 text-muted-foreground shrink-0" />
                <span>
                  {item.endDate === "Indeterminado"
                    ? "Sin fecha de término"
                    : item.endDate}
                </span>
              </div>
              <div>
                {isImminent ? (
                  <Badge className="bg-destructive/15 text-destructive border-none text-[10px] font-extrabold px-2 py-0">
                    ¡Vence en {item.daysRemaining} días!
                  </Badge>
                ) : isUpcoming ? (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] font-extrabold px-2 py-0">
                    Vence en {item.daysRemaining} días
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Inicio: {item.startDate}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "salary",
        id: "salary",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Salario</span>
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
          const item = row.original;
          return (
            <div className="py-1">
              <span className="font-mono text-xs font-extrabold text-foreground block">
                ${item.salary.toLocaleString("es-MX")} MXN
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {item.paymentFrequency}
              </span>
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
            <span>Estatus</span>
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
          const item = row.original;
          return (
            <div className="py-1">
              {item.status === "en_firma" ? (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none inline-flex items-center gap-1.5">
                  <FileSignature className="size-3" />
                  <span>En Firma</span>
                </Badge>
              ) : item.status === "imminent" ? (
                <Badge className="bg-destructive/10 text-destructive font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  <span>Crítico (&lt;7d)</span>
                </Badge>
              ) : item.status === "proximo_a_vencer" ? (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span>Por Vencer</span>
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Vigente</span>
                </Badge>
              )}
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
          const item = row.original;
          const isCritical =
            item.status === "imminent" || item.status === "proximo_a_vencer";

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              {/* Eye Button: Preview Full Contract */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenPreviewFromRecord(item)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors"
                title="Ver Contrato Digital Completo"
              >
                <Eye className="size-4" />
              </Button>

              {/* Quick Renew Button if critical */}
              {isCritical && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedContractForRenew(item);
                    setIsRenewModalOpen(true);
                  }}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer flex items-center gap-1"
                  title="Renovar o Pasar a Planta"
                >
                  <RotateCcw className="size-3" />
                  <span className="hidden xl:inline">Renovar</span>
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
                    onSelect={() => handleOpenPreviewFromRecord(item)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Ver Contrato Digital</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => {
                      setSelectedContractForRenew(item);
                      setIsRenewModalOpen(true);
                    }}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-primary hover:bg-primary/10"
                  >
                    <RotateCcw className="size-3.5 text-primary" />
                    <span>Renovar / Pasar a Planta</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => handleOpenDossierFromContract(item)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Ver Expediente 360</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onSelect={() => {
                      setSelectedContractForTerminate(item);
                      setIsTerminateModalOpen(true);
                    }}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <UserX className="size-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Registrar Baja / Finiquito</span>
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

  // Terminations Columns Definition
  const terminationColumns = React.useMemo<ColumnDef<TerminationRecord>[]>(
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
            <span>Empleado</span>
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
          const item = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar
                onClick={() => handleOpenDossierFromTermination(item)}
                className="size-9 rounded-xl border border-border/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all opacity-80"
              >
                <AvatarImage
                  src={item.avatarUrl || undefined}
                  alt={item.employeeName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl font-extrabold text-xs bg-rose-500/10 text-rose-600">
                  {getInitials(item.employeeName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDossierFromTermination(item)}
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate block text-left cursor-pointer"
                >
                  {item.employeeName}
                </button>
                <p className="text-[11px] text-muted-foreground truncate">
                  {item.jobTitle} • {item.department}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "terminationDate",
        id: "terminationDate",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha de Baja</span>
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
          const item = row.original;
          return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground py-1">
              <Calendar className="size-3 text-muted-foreground shrink-0" />
              <span>{item.terminationDate}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "reason",
        id: "reason",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Motivo Legal</span>
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
          const item = row.original;
          return (
            <div className="space-y-0.5 py-1">
              <Badge
                variant="outline"
                className="text-[10px] font-bold px-2 py-0.5 border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              >
                {item.reason}
              </Badge>
              {item.notes && (
                <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-xs">
                  {item.notes}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "severanceAmount",
        id: "severanceAmount",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Finiquito</span>
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
          const item = row.original;
          return (
            <div className="py-1">
              <span className="font-mono text-xs font-bold text-foreground block">
                ${item.severanceAmount.toLocaleString("es-MX")} MXN
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] px-1.5 py-0">
                Finiquitado
              </Badge>
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
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5 py-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenDossierFromTermination(item)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors"
                title="Ver Expediente Histórico"
              >
                <Eye className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReactivateEmpleado(item)}
                className="h-8 px-2.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-1"
                title="Reactivar e incorporar a plantilla activa"
              >
                <Check className="size-3.5" />
                <span>Reactivar</span>
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  // Contracts TanStack Table Instance
  const contractsTable = useReactTable({
    data: filteredContracts,
    columns: contractColumns,
    state: {
      sorting: contractSorting,
    },
    onSortingChange: setContractSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Terminations TanStack Table Instance
  const terminationsTable = useReactTable({
    data: filteredTerminations,
    columns: terminationColumns,
    state: {
      sorting: terminationSorting,
    },
    onSortingChange: setTerminationSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const contractRows = contractsTable.getRowModel().rows;
  const terminationRows = terminationsTable.getRowModel().rows;

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* 1. Header Unificado */}
      <CompanyPageHeader
        title="Contratos & Bajas Laborales"
        description="Plantillas oficiales LFT, firma electrónica digital, alertas de vigencia y registro de finiquitos."
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {contracts.length + terminations.length}
          </Badge>
          <Button
            size="sm"
            onClick={() => setIsBuilderOpen(true)}
            className="cursor-pointer font-medium"
          >
            <Plus data-icon="inline-start" />
            <span>Nuevo Contrato con Plantilla</span>
          </Button>
        </div>
      </CompanyPageHeader>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Contratos Activos
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileCheck2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.totalActive}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Expedientes vigentes
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Críticos (&lt; 7 días)
            </span>
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.imminent}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Requieren renovación urgente
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Planta (Indeterminados)
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.indefinite}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Plaza permanente
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Bajas Registradas
            </span>
            <div className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <UserX className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.totalBajas}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Historial de finiquitos
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Main Tabs Structure */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "contracts" | "terminations")}
        className="w-full space-y-4"
      >
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-11 p-1 rounded-2xl bg-muted/40 border border-border/40">
          <TabsTrigger
            value="contracts"
            className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer px-4"
          >
            <FileCheck2 className="size-4 text-primary" />
            <span>Contratos & Vigencias ({contracts.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="terminations"
            className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer px-4"
          >
            <UserX className="size-4 text-rose-500" />
            <span>Bajas & Finiquitos ({terminations.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Contratos y Vigencias */}
        <TabsContent value="contracts" className="space-y-4 m-0 focus-visible:outline-none">
          <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
            
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                  <Input
                    value={contractSearch}
                    onChange={(e) => setContractSearch(e.target.value)}
                    placeholder="Buscar por empleado, puesto, departamento o folio..."
                    className="pl-10 pr-9 text-xs sm:text-sm font-medium"
                  />
                  {contractSearch && (
                    <button
                      onClick={() => setContractSearch("")}
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

              {/* Filter Row: Status Segmented Tabs + Modalidad */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border/30">
                {/* Status Tabs */}
                <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setContractStatusFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      contractStatusFilter === "all"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Todos ({contracts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractStatusFilter("imminent")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      contractStatusFilter === "imminent"
                        ? "bg-background text-rose-600 dark:text-rose-400 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-rose-500 inline-block" />
                    <span>Críticos ({metrics.imminent})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractStatusFilter("upcoming")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      contractStatusFilter === "upcoming"
                        ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                    <span>Por Vencer ({metrics.upcoming})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractStatusFilter("vigente")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      contractStatusFilter === "vigente"
                        ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Vigentes ({metrics.indefinite})</span>
                  </button>
                </div>

                {/* Modalidad Selector */}
                <div className="flex items-center gap-2">
                  <div className="w-full sm:w-[220px]">
                    <Select
                      value={contractTypeFilter}
                      onValueChange={(val) =>
                        setContractTypeFilter(val || "all")
                      }
                    >
                      <SelectTrigger className="h-9 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
                        <SelectValue placeholder="Modalidad">
                          {contractTypeFilter === "all"
                            ? "Todas las modalidades"
                            : contractTypeFilter === "indeterminado"
                            ? "Indeterminado (Planta)"
                            : contractTypeFilter === "determinado"
                            ? "Tiempo Determinado"
                            : contractTypeFilter === "periodo_prueba"
                            ? "Periodo de Prueba"
                            : "Honorarios"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                        <SelectItem
                          value="all"
                          className="text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Todas las modalidades
                        </SelectItem>
                        <SelectItem
                          value="indeterminado"
                          className="text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Indeterminado (Planta)
                        </SelectItem>
                        <SelectItem
                          value="determinado"
                          className="text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Tiempo Determinado
                        </SelectItem>
                        <SelectItem
                          value="periodo_prueba"
                          className="text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Periodo de Prueba
                        </SelectItem>
                        <SelectItem
                          value="honorarios"
                          className="text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Honorarios
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(contractSearch ||
                    contractStatusFilter !== "all" ||
                    contractTypeFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setContractSearch("");
                        setContractStatusFilter("all");
                        setContractTypeFilter("all");
                      }}
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
              {contractRows.length === 0 ? (
                <Empty className="py-16">
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="bg-primary/10 text-primary"
                    >
                      <FileCheck2 className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>
                      {contracts.length === 0
                        ? "Sin contratos registrados"
                        : "No se encontraron contratos"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {contracts.length === 0
                        ? "Aún no has generado ningún contrato laboral digital para tu plantilla activa."
                        : "No hay contratos que coincidan con la búsqueda o los filtros seleccionados."}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    {contracts.length === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => setIsBuilderOpen(true)}
                        className="font-bold text-xs cursor-pointer gap-1.5"
                      >
                        <Plus className="size-3.5" />
                        <span>Nuevo Contrato Laboral</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setContractSearch("");
                          setContractStatusFilter("all");
                          setContractTypeFilter("all");
                        }}
                        className="font-bold text-xs cursor-pointer gap-1.5"
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
                      {contractsTable.getHeaderGroups().map((headerGroup) => (
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
                      {contractRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className={cn(
                            "hover:bg-muted/25 transition-colors group",
                            row.original.status === "imminent" && "bg-rose-500/5"
                          )}
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
                      Mostrando <strong>{contractRows.length}</strong> de{" "}
                      <strong>{contracts.length}</strong> contratos
                    </span>
                    <span className="text-[11px] text-muted-foreground/80">
                      Actualizado en tiempo real
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: Historial de Bajas & Finiquitos */}
        <TabsContent value="terminations" className="space-y-4 m-0 focus-visible:outline-none">
          <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
            
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                  <Input
                    value={terminationSearch}
                    onChange={(e) => setTerminationSearch(e.target.value)}
                    placeholder="Buscar por empleado, puesto o motivo de baja..."
                    className="pl-10 pr-9 text-xs sm:text-sm font-medium"
                  />
                  {terminationSearch && (
                    <button
                      onClick={() => setTerminationSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-[240px]">
                  <Select
                    value={terminationReasonFilter}
                    onValueChange={(val) =>
                      setTerminationReasonFilter(val || "all")
                    }
                  >
                    <SelectTrigger className="w-full text-xs font-semibold">
                      <SelectValue placeholder="Motivo de Baja">
                        {terminationReasonFilter === "all"
                          ? "Todos los motivos"
                          : terminationReasonFilter}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                      <SelectItem value="all" className="text-xs font-semibold rounded-lg">
                        Todos los motivos
                      </SelectItem>
                      <SelectItem value="Renuncia voluntaria" className="text-xs font-semibold rounded-lg">
                        Renuncia voluntaria
                      </SelectItem>
                      <SelectItem value="Fin de contrato / Proyecto" className="text-xs font-semibold rounded-lg">
                        Fin de contrato / Proyecto
                      </SelectItem>
                      <SelectItem value="Despido justificado" className="text-xs font-semibold rounded-lg">
                        Despido justificado
                      </SelectItem>
                      <SelectItem value="Mutuo acuerdo" className="text-xs font-semibold rounded-lg">
                        Mutuo acuerdo
                      </SelectItem>
                      <SelectItem value="Abandono de empleo" className="text-xs font-semibold rounded-lg">
                        Abandono de empleo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Terminations Table or Empty */}
            <div className="relative min-h-[300px]">
              {terminations.length === 0 ? (
                <Empty className="py-16">
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="bg-muted text-muted-foreground"
                    >
                      <UserX className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Sin bajas registradas</EmptyTitle>
                    <EmptyDescription>
                      No hay registros de desvinculación laboral en la empresa. Todos los empleados se encuentran en plantilla activa.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : terminationRows.length === 0 ? (
                <Empty className="py-16">
                  <EmptyHeader>
                    <EmptyMedia
                      variant="icon"
                      className="bg-muted text-muted-foreground"
                    >
                      <UserX className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>No hay bajas registradas</EmptyTitle>
                    <EmptyDescription>
                      No se encontraron registros de desvinculación laboral que coincidan con la búsqueda.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTerminationSearch("");
                        setTerminationReasonFilter("all");
                      }}
                      className="font-bold text-xs cursor-pointer gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Limpiar Filtros</span>
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-muted/30 border-b border-border/40">
                      {terminationsTable
                        .getHeaderGroups()
                        .map((headerGroup) => (
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
                      {terminationRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-muted/25 transition-colors group opacity-85"
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
                      Mostrando <strong>{terminationRows.length}</strong> de{" "}
                      <strong>{terminations.length}</strong> registros de baja
                    </span>
                    <span className="text-[11px] text-muted-foreground/80">
                      Historial legal LFT
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Renovar Contrato o Pasar a Planta */}
      <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
          <form onSubmit={handleConfirmRenew} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <RotateCcw className="size-4 text-primary" />
                <span>Renovar o Pasar a Planta</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Actualiza las condiciones contractuales y vigencia legal de{" "}
                <strong>{selectedContractForRenew?.employeeName}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Renovación / Extensión *
                </Label>
                <Select
                  value={extensionPeriod}
                  onValueChange={(val) => val && setExtensionPeriod(val)}
                >
                  <SelectTrigger className="text-xs font-semibold">
                    <SelectValue placeholder="Selecciona un plazo">
                      {extensionPeriod === "indeterminado"
                        ? "✨ Pasar a Contrato Indeterminado (Planta)"
                        : extensionPeriod === "6_meses"
                        ? "Extender por 6 meses determinados"
                        : extensionPeriod === "12_meses"
                        ? "Extender por 12 meses determinados"
                        : "Extender periodo de prueba (3 meses)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg">
                    <SelectItem
                      value="indeterminado"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      ✨ Pasar a Contrato Indeterminado (Planta)
                    </SelectItem>
                    <SelectItem
                      value="6_meses"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Extender por 6 meses determinados
                    </SelectItem>
                    <SelectItem
                      value="12_meses"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Extender por 12 meses determinados
                    </SelectItem>
                    <SelectItem
                      value="3_meses"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Extender periodo de prueba (3 meses)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenewModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
              >
                Confirmar Renovación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 1: Contract Builder */}
      <ContractBuilderModal
        isOpen={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        onContractCreated={handleContractCreated}
        activeEmployees={activeEmployees}
        companyInfo={companyInfo}
      />

      {/* Modal 2: Contract Document Preview & Signatures */}
      <ContractPreviewModal
        isOpen={!!previewContract}
        onOpenChange={(open) => !open && setPreviewContract(null)}
        contract={previewContract}
        onContractUpdated={handleContractUpdated}
      />

      {/* Sheet 3: Employee Dossier 360 */}
      <EmployeeDossierSheet
        employee={dossierEmployee}
        open={isDossierOpen}
        onOpenChange={setIsDossierOpen}
        onOpenTerminateDialog={(emp) => {
          const contract = contracts.find((c) => c.employeeId === emp.id);
          if (contract) {
            setSelectedContractForTerminate(contract);
          } else {
            setSelectedContractForTerminate({
              id: emp.id,
              folio: "CTR-BAJA",
              employeeId: emp.id,
              employeeName: emp.full_name,
              avatarUrl: emp.avatar_url,
              phone: emp.phone,
              jobTitle: emp.vacancy_title,
              department: emp.vacancy_category,
              contractType: "Contrato Laboral",
              templateType: "indeterminado",
              startDate: emp.hired_date,
              endDate: "Indeterminado",
              daysRemaining: 999,
              salary: 15000,
              paymentFrequency: "quincenal",
              status: "vigente",
              companySigned: true,
              employeeSigned: true,
            });
          }
          setIsDossierOpen(false);
          setIsTerminateModalOpen(true);
        }}
        onReactivate={(emp) => {
          const term = terminations.find((t) => t.employeeId === emp.id);
          if (term) {
            handleReactivateEmpleado(term);
          }
          setIsDossierOpen(false);
        }}
      />

      {/* Modal 4: Registrar Baja / Finiquito */}
      <Dialog
        open={isTerminateModalOpen}
        onOpenChange={(open) => {
          setIsTerminateModalOpen(open);
          if (!open) {
            setSelectedContractForTerminate(null);
            setTerminationNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px] rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
          <form onSubmit={handleConfirmTerminate} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
                <span>Registrar Baja de Empleado</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Registra la desvinculación laboral de{" "}
                <strong>{selectedContractForTerminate?.employeeName}</strong>. Esta acción
                actualizará su expediente y estatus en el historial laboral de la empresa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Motivo de Baja *
                </Label>
                <Select
                  value={terminationReason}
                  onValueChange={(val) =>
                    val && setTerminationReason(val as TerminationRecord["reason"])
                  }
                >
                  <SelectTrigger className="text-xs font-semibold">
                    <SelectValue placeholder="Selecciona un motivo">
                      {terminationReason}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg">
                    <SelectItem
                      value="Renuncia voluntaria"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Renuncia voluntaria
                    </SelectItem>
                    <SelectItem
                      value="Fin de contrato / Proyecto"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Fin de contrato / Proyecto
                    </SelectItem>
                    <SelectItem
                      value="Despido justificado"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Despido justificado
                    </SelectItem>
                    <SelectItem
                      value="Mutuo acuerdo"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Mutuo acuerdo
                    </SelectItem>
                    <SelectItem
                      value="Abandono de empleo"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Abandono de empleo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="contracts_term_notes"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Observaciones / Motivo Detallado (Opcional)
                </Label>
                <Textarea
                  id="contracts_term_notes"
                  value={terminationNotes}
                  onChange={(e) => setTerminationNotes(e.target.value)}
                  placeholder="Observaciones de entrega de equipo, cálculo de finiquito o acuerdos..."
                  className="min-h-[85px] rounded-xl bg-muted/40 border-border/60 text-xs font-medium"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTerminateModalOpen(false)}
                disabled={isTerminating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isTerminating}
              >
                {isTerminating ? (
                  <>
                    <Clock className="size-3.5 animate-spin" />
                    <span>Registrando baja...</span>
                  </>
                ) : (
                  <>
                    <UserX className="size-3.5" />
                    <span>Confirmar Baja</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
