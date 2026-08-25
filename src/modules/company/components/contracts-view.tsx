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
} from "lucide-react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ContractExpirationItem, WorkforceKPIs } from "../types/dashboard";
import { EmploymentContract, ContractTemplateType } from "../types/contracts";
import { ContractBuilderModal } from "./contracts/contract-builder-modal";
import { ContractPreviewModal } from "./contracts/contract-preview-modal";
import { EmployeeDossierSheet } from "./dossier/employee-dossier-sheet";

interface ContractRecord {
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

interface ContractsViewProps {
  initialContracts?: ContractExpirationItem[];
  kpis?: WorkforceKPIs;
}

export function ContractsView({
  initialContracts = [],
  kpis: _kpis,
}: ContractsViewProps) {
  const [activeTab, setActiveTab] = React.useState<"contracts" | "terminations">(
    "contracts"
  );

  // Contracts initial data
  const [contracts, setContracts] = React.useState<ContractRecord[]>(() => {
    // Generate realistic contracts based on initial or defaults
    const defaults: ContractRecord[] = [
      {
        id: "ctr-001",
        folio: "KAN-CTR-2026-081",
        employeeId: "emp-001",
        employeeName: "Carlos Eduardo Dzib",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        phone: "9992345678",
        jobTitle: "Técnico en Climas y Electricidad",
        department: "Mantenimiento y Limpieza",
        contractType: "Contrato por Tiempo Determinado (6 meses)",
        templateType: "determinado",
        startDate: "2026-02-01",
        endDate: "2026-08-31",
        daysRemaining: 6,
        salary: 14500,
        paymentFrequency: "Quincenal",
        status: "imminent",
        companySigned: true,
        employeeSigned: true,
      },
      {
        id: "ctr-002",
        folio: "KAN-CTR-2026-082",
        employeeId: "emp-002",
        employeeName: "Valeria Castillo Domínguez",
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        phone: "9849876543",
        jobTitle: "Barista Especialista & Mixóloga",
        department: "Alimentos y Bebidas",
        contractType: "Periodo de Prueba (90 días)",
        templateType: "periodo_prueba",
        startDate: "2026-06-01",
        endDate: "2026-09-15",
        daysRemaining: 21,
        salary: 13500,
        paymentFrequency: "Quincenal",
        status: "proximo_a_vencer",
        companySigned: true,
        employeeSigned: true,
      },
      {
        id: "ctr-003",
        folio: "KAN-CTR-2026-083",
        employeeId: "emp-003",
        employeeName: "Sofía Valentina Méndez",
        avatarUrl:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        phone: "9841234567",
        jobTitle: "Capitana de Meseros",
        department: "Alimentos y Bebidas",
        contractType: "Contrato por Tiempo Indeterminado (Planta)",
        templateType: "indeterminado",
        startDate: "2025-11-15",
        endDate: "Indeterminado",
        daysRemaining: 999,
        salary: 17000,
        paymentFrequency: "Quincenal",
        status: "vigente",
        companySigned: true,
        employeeSigned: true,
      },
      {
        id: "ctr-004",
        folio: "KAN-CTR-2026-084",
        employeeId: "emp-004",
        employeeName: "Alejandro Canul Pech",
        avatarUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        phone: "9983456789",
        jobTitle: "Chef de Partie",
        department: "Gastronomía y Cocina",
        contractType: "Contrato por Tiempo Indeterminado (Planta)",
        templateType: "indeterminado",
        startDate: "2026-01-10",
        endDate: "Indeterminado",
        daysRemaining: 999,
        salary: 20000,
        paymentFrequency: "Quincenal",
        status: "vigente",
        companySigned: true,
        employeeSigned: true,
      },
      {
        id: "ctr-005",
        folio: "KAN-CTR-2026-085",
        employeeId: "emp-005",
        employeeName: "Mariana González Rivas",
        avatarUrl:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        phone: "9988765432",
        jobTitle: "Recepcionista Bilingüe",
        department: "Hotelería y Turismo",
        contractType: "Contrato por Tiempo Indeterminado (Planta)",
        templateType: "indeterminado",
        startDate: "2025-09-01",
        endDate: "Indeterminado",
        daysRemaining: 999,
        salary: 15500,
        paymentFrequency: "Quincenal",
        status: "vigente",
        companySigned: true,
        employeeSigned: true,
      },
      {
        id: "ctr-006",
        folio: "KAN-CTR-2026-086",
        employeeId: "emp-006",
        employeeName: "Daniela Morales Chan",
        avatarUrl:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        phone: "9984321098",
        jobTitle: "Auxiliar de Recursos Humanos",
        department: "Administración y RRHH",
        contractType: "Periodo de Prueba (90 días)",
        templateType: "periodo_prueba",
        startDate: "2026-07-01",
        endDate: "2026-09-30",
        daysRemaining: 36,
        salary: 14000,
        paymentFrequency: "Quincenal",
        status: "en_firma",
        companySigned: true,
        employeeSigned: false,
      },
      {
        id: "ctr-007",
        folio: "KAN-CTR-2026-087",
        employeeId: "emp-007",
        employeeName: "Jorge Luis Poot May",
        avatarUrl:
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
        phone: "9995678901",
        jobTitle: "Supervisor de Logística & Almacén",
        department: "Operaciones y Logística",
        contractType: "Contrato por Tiempo Indeterminado (Planta)",
        templateType: "indeterminado",
        startDate: "2025-08-20",
        endDate: "Indeterminado",
        daysRemaining: 999,
        salary: 18000,
        paymentFrequency: "Quincenal",
        status: "vigente",
        companySigned: true,
        employeeSigned: true,
      },
    ];

    return defaults;
  });

  // Terminations initial data
  const [terminations, setTerminations] = React.useState<TerminationRecord[]>([
    {
      id: "term-001",
      employeeId: "emp-008",
      employeeName: "Ricardo Alcocer Cetina",
      avatarUrl:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      phone: "9846543210",
      jobTitle: "Steward & Limpieza de Cocina",
      department: "Mantenimiento y Limpieza",
      terminationDate: "2026-05-15",
      reason: "Renuncia voluntaria",
      notes: "Entrega completa de herramientas y firma de finiquito conforme a la ley.",
      severanceStatus: "finiquitado",
      severanceAmount: 8450,
    },
    {
      id: "term-002",
      employeeId: "emp-009",
      employeeName: "Mauricio Pech Canché",
      avatarUrl: null,
      phone: "9841122334",
      jobTitle: "Auxiliar de Almacén",
      department: "Operaciones y Logística",
      terminationDate: "2026-03-30",
      reason: "Fin de contrato / Proyecto",
      notes: "Conclusión de temporada alta de invierno. Finiquito pagado por transferencia.",
      severanceStatus: "finiquitado",
      severanceAmount: 11200,
    },
  ]);

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
    const fullContract: EmploymentContract = {
      id: item.id,
      folio: item.folio,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      employeeRfc: "MEMC920415HQ8",
      employeeCurp: "MEMC920415HQRNNR02",
      employeeAddress: "Playa del Carmen, Quintana Roo",
      avatarUrl: item.avatarUrl,
      jobTitle: item.jobTitle,
      department: item.department,
      companyName: "K'anPro Solutions S.A. de C.V.",
      companyRfc: "KPS220419RT5",
      companyAddress:
        "Av. Constituyentes #120, Gonzalo Guerrero, Playa del Carmen, Q.R.",
      legalRepName: "Lic. Andrea Garza Ramos",
      templateType: item.templateType,
      templateName: item.contractType,
      startDate: item.startDate,
      endDate: item.endDate === "Indeterminado" ? null : item.endDate,
      baseSalaryMonthly: item.salary,
      dailyIntegratedSalary: item.salary / 30.4,
      paymentFrequency: "quincenal",
      workSchedule: "Lunes a Viernes 08:00 - 17:00 (Sábados rotativos)",
      status: item.status === "en_firma" ? "en_firma" : "vigente",
      companySignature: {
        signerName: "Lic. Andrea Garza Ramos",
        signerRole: "representante_legal",
        signatureDataUrl:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><path d='M10 20 Q 30 5, 50 20 T 90 20' fill='none' stroke='%231e293b' stroke-width='2'/></svg>",
        signedAt: item.startDate,
        certificateHash: "SHA256:0x7a8b9c1d2e3f4a5b",
      },
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

  const handleContractCreated = (newContract: EmploymentContract) => {
    const newRecord: ContractRecord = {
      id: newContract.id,
      folio: newContract.folio,
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
      description: `Folio ${newContract.folio} para ${newContract.employeeName}.`,
    });
  };

  const handleConfirmRenew = (e: React.FormEvent) => {
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

    setContracts((prev) =>
      prev.map((c) =>
        c.id === selectedContractForRenew.id
          ? {
              ...c,
              endDate:
                extensionPeriod === "indeterminado"
                  ? "Indeterminado"
                  : newEnd.toISOString().split("T")[0],
              daysRemaining:
                extensionPeriod === "indeterminado" ? 999 : monthsToAdd * 30,
              status: "vigente",
              templateType:
                extensionPeriod === "indeterminado"
                  ? "indeterminado"
                  : "determinado",
              contractType:
                extensionPeriod === "indeterminado"
                  ? "Contrato por Tiempo Indeterminado (Planta)"
                  : `Contrato Determinado (${monthsToAdd} meses)`,
            }
          : c
      )
    );

    toast.success("Contrato renovado exitosamente", {
      description: `Se actualizó la vigencia laboral de ${selectedContractForRenew.employeeName}.`,
    });

    setIsRenewModalOpen(false);
    setSelectedContractForRenew(null);
  };

  const handleReactivateColaborador = (term: TerminationRecord) => {
    setTerminations((prev) => prev.filter((t) => t.id !== term.id));
    const newContract: ContractRecord = {
      id: `ctr-reac-${Date.now()}`,
      folio: `KAN-CTR-2026-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: term.employeeId,
      employeeName: term.employeeName,
      avatarUrl: term.avatarUrl,
      phone: term.phone,
      jobTitle: term.jobTitle,
      department: term.department,
      contractType: "Contrato por Tiempo Indeterminado (Reactivado)",
      templateType: "indeterminado",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "Indeterminado",
      daysRemaining: 999,
      salary: 15000,
      paymentFrequency: "Quincenal",
      status: "vigente",
      companySigned: true,
      employeeSigned: true,
    };
    setContracts((prev) => [newContract, ...prev]);
    toast.success("Colaborador reactivado en la empresa", {
      description: `${term.employeeName} ha sido incorporado a la plantilla activa con nuevo contrato.`,
    });
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
                className="text-[10px] font-semibold px-2 py-0 rounded-md border-border/30 bg-muted/30"
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
                  <Badge className="bg-destructive/15 text-destructive border-none text-[10px] font-extrabold px-2 py-0 rounded-md">
                    ¡Vence en {item.daysRemaining} días!
                  </Badge>
                ) : isUpcoming ? (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] font-extrabold px-2 py-0 rounded-md">
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
                      toast.info(`Generando copia PDF de ${item.folio}...`);
                    }}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="size-3.5" />
                    <span>Descargar PDF Firmado</span>
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
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
                onClick={() => handleReactivateColaborador(item)}
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
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-[800] text-foreground tracking-tight flex items-center gap-2.5">
            <span>Contratos & Bajas Laborales</span>
            <Badge
              variant="outline"
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg border-border/40"
            >
              {contracts.length + terminations.length}
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Plantillas oficiales LFT, firma electrónica digital, alertas de vigencia y registro de finiquitos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsBuilderOpen(true)}
            className="h-9 font-bold text-xs rounded-xl px-4 flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Nuevo Contrato con Plantilla</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
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

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
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

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
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

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
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
                    placeholder="Buscar por colaborador, puesto, departamento o folio..."
                    className="h-10 pl-10 pr-9 bg-background border-border/50 rounded-xl text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary"
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
                    <EmptyTitle>No se encontraron contratos</EmptyTitle>
                    <EmptyDescription>
                      No hay contratos que coincidan con la búsqueda o los filtros seleccionados.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContractSearch("");
                        setContractStatusFilter("all");
                        setContractTypeFilter("all");
                      }}
                      className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer border-border/50 gap-1.5"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Restablecer Filtros</span>
                    </Button>
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
                    placeholder="Buscar por colaborador, puesto o motivo de baja..."
                    className="h-10 pl-10 pr-9 bg-background border-border/50 rounded-xl text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary"
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
                    <SelectTrigger className="h-10 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
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
              {terminationRows.length === 0 ? (
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
                      className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer border-border/50 gap-1.5"
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
                  <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/60 text-xs font-semibold">
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

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenewModalOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-4 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
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
      />

      {/* Modal 2: Contract Document Preview & Signatures */}
      <ContractPreviewModal
        isOpen={!!previewContract}
        onOpenChange={(open) => !open && setPreviewContract(null)}
        contract={previewContract}
        onContractUpdated={(updated) => setPreviewContract(updated)}
      />

      {/* Sheet 3: Employee Dossier 360 */}
      <EmployeeDossierSheet
        employee={dossierEmployee}
        open={isDossierOpen}
        onOpenChange={setIsDossierOpen}
      />
    </div>
  );
}
