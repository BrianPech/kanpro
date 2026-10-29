"use client";

import * as React from "react";
import {
  User,
  UserX,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  ShieldCheck,
  Award,
  Download,
  Phone,
  Mail,
  MapPin,
  HeartHandshake,
  TrendingUp,
  FileCheck2,
  Plus,
  Sparkles,
  Star,
  CheckCircle2,
  Layers,
  Paperclip,
  MessageSquare,
  Copy,
  Check,
  X,
  Building,
} from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { calculateLFTVacationDays } from "../../utils/vacation-calculator";
import { EmployeeDocument, EmployeeDossier } from "../../types/employee-dossier";
import { uploadDossierDocumentAction } from "../../actions/dossier";
import { exportDossierToPrintableDocument } from "../../utils/dossier-exporter";

export interface SimpleEmployee {
  id: string;
  candidate_id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  location: string;
  vacancy_title: string;
  vacancy_category: string;
  hired_date: string;
  notes?: string;
  status: "Contratado" | "Baja";
  base_salary_monthly?: number | null;
  payment_frequency?: string | null;
  employee_code?: string | null;
  department?: string | null;
  job_title?: string | null;
  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;
  work_schedule?: string | null;
  email?: string | null;
}

export interface EmployeeDossierModalProps {
  employee: SimpleEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenTerminateDialog?: (employee: SimpleEmployee) => void;
  onReactivate?: (employee: SimpleEmployee) => void;
  onOpenAreaDialog?: (employee: SimpleEmployee) => void;
}

export function EmployeeDossierModal({
  employee,
  open,
  onOpenChange,
  onOpenTerminateDialog,
  onReactivate,
  onOpenAreaDialog,
}: EmployeeDossierModalProps) {
  const [activeTab, setActiveTab] = React.useState("laboral");
  const [isUploadDocOpen, setIsUploadDocOpen] = React.useState(false);
  const [newDocTitle, setNewDocTitle] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  // Construct dynamic dossier strictly from real employee record
  const dossier = React.useMemo<EmployeeDossier | null>(() => {
    if (!employee) return null;

    const hireDate =
      employee.hired_date || new Date().toISOString().split("T")[0];
    const seniority = calculateLFTVacationDays(hireDate);

    const baseSalary = Number(employee.base_salary_monthly) || 0;
    const dailyIntegratedSalary =
      baseSalary > 0
        ? Math.round((baseSalary / 30.4) * 1.0493 * 100) / 100
        : 0;

    const email = employee.email || "";

    return {
      id: employee.id,
      candidateId: employee.candidate_id,
      fullName: employee.full_name,
      avatarUrl: employee.avatar_url,
      email,
      phone: employee.phone || "No registrado",
      emergencyContact: {
        name: "No registrado",
        phone: "No registrado",
        relationship: "No registrado",
      },
      rfc: employee.rfc || "No registrado",
      curp: employee.curp || "No registrado",
      nss: employee.nss || "No registrado",
      birthDate: "",
      address: employee.location || "Playa del Carmen, Quintana Roo",
      nationality: "Mexicana",

      jobTitle:
        employee.job_title || employee.vacancy_title || "Puesto General",
      department:
        employee.department || employee.vacancy_category || "Operaciones",
      branchName: `Sucursal Principal • ${employee.location || "Riviera Maya"}`,
      hireDate,
      yearsOfServiceFormatted: seniority.formattedSeniority,
      contractType: "indeterminado",
      contractTypeLabel: "Contrato Laboral LFT",
      contractStartDate: hireDate,
      contractEndDate: null,
      baseSalaryMonthly: baseSalary,
      dailyIntegratedSalary,
      paymentFrequency:
        employee.payment_frequency === "semanal" ||
        employee.payment_frequency === "mensual"
          ? employee.payment_frequency
          : "quincenal",
      workSchedule:
        employee.work_schedule || "Lunes a Viernes (Jornada LFT)",
      status: employee.status === "Contratado" ? "activo" : "baja",

      documents: [],

      positionHistory: [
        {
          id: `pos-${employee.id}`,
          jobTitle:
            employee.job_title || employee.vacancy_title || "Puesto General",
          department:
            employee.department || employee.vacancy_category || "Operaciones",
          startDate: hireDate,
          endDate: employee.status === "Baja" ? "Baja" : "Actual",
          salary: baseSalary,
          promotionReason:
            employee.status === "Baja"
              ? employee.notes || "Desvinculación laboral"
              : "Ingreso inicial a la empresa",
        },
      ],

      vacationBalance: {
        hireDate,
        yearsOfService: seniority.yearsOfService,
        totalDaysAccruedLFT: seniority.currentYearEntitlement,
        daysTaken: 0,
        daysPendingApproval: 0,
        daysAvailable: seniority.currentYearEntitlement,
        nextPeriodDate: `Ciclo anual ${new Date().getFullYear() + 1}`,
      },

      vacationRequests: [],
      performanceReviews: [],

      attendanceSummary: {
        punctualityRate: 100,
        totalDaysPresent: 0,
        totalLateArrivals: 0,
        totalAbsences: 0,
        totalOvertimeHours: 0,
      },
    };
  }, [employee]);

  const [uploadedDocs, setUploadedDocs] = React.useState<EmployeeDocument[]>([]);
  const documentsList = React.useMemo<EmployeeDocument[]>(() => {
    return [...uploadedDocs, ...(dossier?.documents || [])];
  }, [uploadedDocs, dossier?.documents]);

  if (!employee || !dossier) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getWhatsAppLink = () => {
    if (!employee.phone) return "";
    const cleanPhone = employee.phone.replace(/\D/g, "");
    const msg = `¡Hola ${employee.full_name}! Te contacto de Recursos Humanos respecto a tu expediente laboral en el puesto de ${employee.vacancy_title}.`;
    return `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleCopy = (key: string, text: string) => {
    if (!text || text === "No registrado") return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado al portapapeles", { description: text });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      toast.error("Ingresa el nombre o título del documento.");
      return;
    }
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo PDF o imagen para subir.");
      return;
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", newDocTitle.trim());
      formData.append("employeeId", employee.id);
      if (employee.candidate_id) {
        formData.append("candidateId", employee.candidate_id);
      }

      const res = await uploadDossierDocumentAction(formData);
      if (!res.success) {
        throw new Error(res.error || "Error al cargar documento.");
      }

      setUploadedDocs((prev) => [res.data, ...prev]);
      toast.success("Documento cargado al expediente digital", {
        description: `${res.data.title} ha sido indexado y almacenado exitosamente en Supabase.`,
      });

      setNewDocTitle("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploadDocOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al subir el archivo.";
      toast.error("Error al cargar documento", { description: message });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDownloadDossier = () => {
    if (!dossier) return;
    try {
      exportDossierToPrintableDocument(dossier);
      toast.success("Generando Expediente Digital 360...", {
        description: `Se desplegó el expediente integral de ${dossier.fullName} listo para impresión o guardado en PDF.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo generar el expediente.";
      toast.error("Error al exportar expediente", { description: message });
    }
  };

  const isActive = employee.status === "Contratado";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-full sm:max-w-3xl lg:max-w-4xl h-[88vh] max-h-[820px] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border border-border/80 bg-card font-sans shadow-md"
        >
          {/* Hidden Dialog Titles for Screen Readers Accessibility */}
          <DialogHeader className="sr-only">
            <DialogTitle>Detalles del Empleado - {dossier.fullName}</DialogTitle>
            <DialogDescription>
              Información consolidada laboral, fiscal, contractual y de expediente.
            </DialogDescription>
          </DialogHeader>

          {/* 1. Header con Información Principal del Empleado */}
          <div className="p-5 sm:p-6 border-b border-border/50 bg-muted/20 shrink-0">
            <div className="flex items-start justify-between gap-4">
              {/* Foto + Nombres + Estatus */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <Avatar className="size-14 sm:size-16 rounded-xl border border-border/60 shrink-0">
                  <AvatarImage
                    src={dossier.avatarUrl || undefined}
                    alt={dossier.fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-xl font-extrabold text-base bg-primary/10 text-primary">
                    {getInitials(dossier.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-[800] text-foreground tracking-tight truncate">
                      {dossier.fullName}
                    </h2>

                    <Badge
                      className={cn(
                        "font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none select-none shrink-0 inline-flex items-center gap-1.5",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          isActive ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      />
                      <span>{isActive ? "Activo" : "Baja Laboral"}</span>
                    </Badge>

                    {employee.employee_code && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono px-2 py-0 border-border/50 text-muted-foreground"
                      >
                        {employee.employee_code}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium">
                    <span className="font-semibold text-foreground">
                      {dossier.jobTitle}
                    </span>
                    <span>•</span>
                    {onOpenAreaDialog && employee ? (
                      <button
                        type="button"
                        onClick={() => onOpenAreaDialog(employee)}
                        className="cursor-pointer group/badge"
                        title="Haz clic para reasignar área"
                      >
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold px-2 py-0.5 border-border/40 bg-muted/40 group-hover/badge:border-primary/50 group-hover/badge:bg-primary/5 transition-colors flex items-center gap-1"
                        >
                          <Layers className="size-2.5 text-primary" />
                          <span>{dossier.department}</span>
                        </Badge>
                      </button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold px-2 py-0 border-border/40 bg-muted/40"
                      >
                        {dossier.department}
                      </Badge>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="size-3 text-primary shrink-0" />
                      <span className="truncate">{dossier.address}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Close Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                {employee.phone && isActive && (
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-8.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer"
                    title="Contactar por WhatsApp"
                  >
                    <MessageSquare className="size-4 stroke-[2.5]" />
                  </a>
                )}

                {employee.phone && (
                  <a
                    href={`tel:${employee.phone}`}
                    className="size-8.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                    title="Llamar por teléfono"
                  >
                    <Phone className="size-3.5" />
                  </a>
                )}

                {dossier.email && (
                  <a
                    href={`mailto:${dossier.email}`}
                    className="size-8.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                    title="Enviar correo electrónico"
                  >
                    <Mail className="size-3.5" />
                  </a>
                )}

                <DialogClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                      title="Cerrar modal"
                    />
                  }
                >
                  <X className="size-4" />
                  <span className="sr-only">Cerrar</span>
                </DialogClose>
              </div>
            </div>

            {/* Quick Metrics Strip (Lo más importante a simple vista - Flat) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-border/40">
              {/* 1. Salario */}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <DollarSign className="size-3 text-primary" />
                  <span>Salario Mensual</span>
                </span>
                <p className="text-sm font-extrabold text-foreground font-mono truncate">
                  ${dossier.baseSalaryMonthly.toLocaleString("es-MX")} MXN
                </p>
                <p className="text-[10px] text-muted-foreground font-medium capitalize">
                  Pago {dossier.paymentFrequency}
                </p>
              </div>

              {/* 2. SDI */}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>SDI (IMSS)</span>
                </span>
                <p className="text-sm font-extrabold text-foreground font-mono truncate">
                  ${dossier.dailyIntegratedSalary.toFixed(2)} MXN
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Salario diario integrado
                </p>
              </div>

              {/* 3. Antigüedad */}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Antigüedad LFT</span>
                </span>
                <p className="text-sm font-extrabold text-foreground truncate">
                  {dossier.yearsOfServiceFormatted}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium truncate">
                  Ingreso: {dossier.hireDate}
                </p>
              </div>

              {/* 4. Vacaciones */}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Award className="size-3 text-amber-500" />
                  <span>Vacaciones LFT</span>
                </span>
                <p className="text-sm font-extrabold text-primary font-mono truncate">
                  {dossier.vacationBalance.daysAvailable} días
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Art. 76 LFT vigentes
                </p>
              </div>
            </div>
          </div>

          {/* 2. Cuerpo Desplazable con Tabs Organizados */}
          <div className="flex-1 min-h-0 overflow-y-auto w-full p-5 sm:p-6 space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full space-y-4"
            >
              {/* Tab Navigation - Flat */}
              <TabsList className="grid grid-cols-4 w-full h-10 p-1 rounded-xl bg-muted/40 border border-border/40">
                <TabsTrigger
                  value="laboral"
                  className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent cursor-pointer transition-colors"
                >
                  <Briefcase className="size-3.5" />
                  <span className="hidden sm:inline">Laboral & Salario</span>
                  <span className="sm:hidden">Laboral</span>
                </TabsTrigger>
                <TabsTrigger
                  value="fiscal"
                  className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent cursor-pointer transition-colors"
                >
                  <ShieldCheck className="size-3.5" />
                  <span className="hidden sm:inline">Fiscal & Contacto</span>
                  <span className="sm:hidden">Fiscal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="vacaciones"
                  className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent cursor-pointer transition-colors"
                >
                  <Award className="size-3.5" />
                  <span className="hidden sm:inline">Vacaciones & Asist.</span>
                  <span className="sm:hidden">LFT</span>
                </TabsTrigger>
                <TabsTrigger
                  value="documentos"
                  className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent cursor-pointer transition-colors"
                >
                  <FileText className="size-3.5" />
                  <span>Expediente ({documentsList.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Condiciones Laborales, Puesto & Salario */}
              <TabsContent
                value="laboral"
                className="space-y-4 m-0 focus-visible:outline-none"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card: Condiciones de Contratación */}
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-border/30">
                      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                        <Briefcase className="size-3.5 text-primary" />
                        <span>Condiciones de Contratación</span>
                      </div>
                      {onOpenAreaDialog && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenAreaDialog(employee)}
                          className="h-6.5 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg px-2 cursor-pointer gap-1"
                        >
                          <Layers className="size-3" />
                          <span>Cambiar Área</span>
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Puesto / Cargo:
                          </span>
                          <span className="font-bold text-foreground">
                            {dossier.jobTitle}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Área / Departamento:
                          </span>
                          <span className="font-bold text-foreground">
                            {dossier.department}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Tipo de Contrato:
                          </span>
                          <span className="font-semibold text-foreground">
                            {dossier.contractTypeLabel}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Horario / Jornada:
                          </span>
                          <span className="font-semibold text-foreground">
                            {dossier.workSchedule}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground font-medium block text-[11px]">
                          Sucursal de Adscripción:
                        </span>
                        <span className="font-semibold text-foreground">
                          {dossier.branchName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card: Compensación & Nómina */}
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/30 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <DollarSign className="size-3.5 text-primary" />
                      <span>Compensación & Salario</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Salario Base Mensual:
                          </span>
                          <span className="font-bold text-foreground font-mono text-sm">
                            ${dossier.baseSalaryMonthly.toLocaleString("es-MX")} MXN
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Frecuencia de Pago:
                          </span>
                          <span className="font-bold text-foreground capitalize">
                            {dossier.paymentFrequency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Salario Diario Integrado (SDI):
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            ${dossier.dailyIntegratedSalary.toFixed(2)} MXN
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Fecha de Alta Laboral:
                          </span>
                          <span className="font-semibold text-foreground">
                            {dossier.hireDate}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground font-medium block text-[11px]">
                          Prestaciones de Ley:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          Aguinaldo (15 días), Prima vacacional (25%), IMSS & INFONAVIT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card: Observaciones & Notas del Empleado */}
                {employee.notes && (
                  <div className="bg-muted/20 border border-border/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <FileText className="size-3.5 text-primary" />
                      <span>Notas Internas & Observaciones</span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed bg-background/60 p-3 rounded-lg border border-border/30">
                      {employee.notes}
                    </p>
                  </div>
                )}

                {/* Card: Trayectoria y Puestos en la Empresa */}
                <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/30">
                    <TrendingUp className="size-3.5 text-primary" />
                    <span>Trayectoria y Puestos en la Empresa</span>
                  </div>

                  <div className="space-y-2.5">
                    {dossier.positionHistory.map((pos) => (
                      <div
                        key={pos.id}
                        className="p-3 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-foreground">
                            {pos.jobTitle}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {pos.department} • {pos.promotionReason}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground font-mono block">
                            ${pos.salary.toLocaleString("es-MX")} MXN
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {pos.startDate} - {pos.endDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: Identidad, Fiscal (SAT/IMSS) & Contacto */}
              <TabsContent
                value="fiscal"
                className="space-y-4 m-0 focus-visible:outline-none"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card: Identificadores Fiscales Oficiales */}
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/30 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <ShieldCheck className="size-3.5 text-primary" />
                      <span>Identidad Fiscal Oficial</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* RFC */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[10px]">
                            RFC con Homoclave:
                          </span>
                          <span className="font-bold text-foreground font-mono text-xs">
                            {dossier.rfc}
                          </span>
                        </div>
                        {dossier.rfc !== "No registrado" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy("rfc", dossier.rfc)}
                            className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copiar RFC"
                          >
                            {copiedKey === "rfc" ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* CURP */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[10px]">
                            CURP:
                          </span>
                          <span className="font-bold text-foreground font-mono text-xs">
                            {dossier.curp}
                          </span>
                        </div>
                        {dossier.curp !== "No registrado" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy("curp", dossier.curp)}
                            className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copiar CURP"
                          >
                            {copiedKey === "curp" ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* NSS */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[10px]">
                            NSS (Seguridad Social IMSS):
                          </span>
                          <span className="font-bold text-foreground font-mono text-xs">
                            {dossier.nss}
                          </span>
                        </div>
                        {dossier.nss !== "No registrado" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy("nss", dossier.nss)}
                            className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copiar NSS"
                          >
                            {copiedKey === "nss" ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Nacionalidad:
                          </span>
                          <span className="font-semibold text-foreground">
                            {dossier.nationality}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium block text-[11px]">
                            Estado Civil / Datos:
                          </span>
                          <span className="font-semibold text-foreground">
                            No especificado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Contacto & Domicilio */}
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/30 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <Phone className="size-3.5 text-primary" />
                      <span>Contacto Directo & Domicilio</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-muted-foreground font-medium block text-[11px]">
                          Teléfono Móvil:
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-bold text-foreground font-mono text-sm">
                            {dossier.phone}
                          </span>
                          {dossier.phone !== "No registrado" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy("phone", dossier.phone)}
                              className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copiar Teléfono"
                            >
                              {copiedKey === "phone" ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground font-medium block text-[11px]">
                          Correo Electrónico:
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-semibold text-foreground truncate">
                            {dossier.email || "Sin correo registrado"}
                          </span>
                          {dossier.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy("email", dossier.email)}
                              className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                              title="Copiar Correo"
                            >
                              {copiedKey === "email" ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground font-medium block text-[11px]">
                          Ubicación / Domicilio:
                        </span>
                        <span className="font-semibold text-foreground block mt-0.5">
                          {dossier.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card: Contacto de Emergencia */}
                <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/30">
                    <HeartHandshake className="size-3.5 text-rose-500" />
                    <span>Contacto de Emergencia Registrado</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium block text-[11px]">
                         Nombre Completo:
                      </span>
                      <span className="font-bold text-foreground">
                        {dossier.emergencyContact.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block text-[11px]">
                        Parentesco:
                      </span>
                      <span className="font-semibold text-foreground">
                        {dossier.emergencyContact.relationship}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block text-[11px]">
                        Teléfono de Urgencias:
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {dossier.emergencyContact.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: Vacaciones LFT & Asistencia */}
              <TabsContent
                value="vacaciones"
                className="space-y-4 m-0 focus-visible:outline-none"
              >
                {/* Balance de Vacaciones Dignas LFT */}
                <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-border/30">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <Award className="size-3.5 text-primary" />
                      <span>Vacaciones Dignas (Art. 76 LFT)</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-extrabold font-mono text-primary px-2.5 py-0.5 border-primary/30 bg-primary/5"
                    >
                      {dossier.vacationBalance.daysAvailable} días disponibles
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Devengados
                      </span>
                      <span className="text-lg font-extrabold text-foreground font-mono">
                        {dossier.vacationBalance.totalDaysAccruedLFT}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Disfrutados
                      </span>
                      <span className="text-lg font-extrabold text-foreground font-mono">
                        {dossier.vacationBalance.daysTaken}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <span className="text-[10px] font-bold uppercase block">
                        Saldo Restante
                      </span>
                      <span className="text-lg font-extrabold font-mono">
                        {dossier.vacationBalance.daysAvailable}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground text-center">
                    Cálculo automático de acuerdo a la antigüedad laboral desde {dossier.hireDate}.
                  </p>
                </div>

                {/* Métricas de Asistencia y Puntualidad */}
                <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-primary" />
                      <span>Asistencia y Puntualidad</span>
                    </div>
                    <span className="font-mono text-foreground font-bold">
                      {dossier.attendanceSummary.punctualityRate}% puntualidad
                    </span>
                  </div>

                  <Progress
                    value={dossier.attendanceSummary.punctualityRate}
                    className="h-2 rounded-full"
                  />

                  <div className="grid grid-cols-3 gap-2 text-xs text-center pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Asistencias:
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {dossier.attendanceSummary.totalDaysPresent} días
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Retardos:
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {dossier.attendanceSummary.totalLateArrivals}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">
                        Horas Extra:
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {dossier.attendanceSummary.totalOvertimeHours}h
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: Bóveda Documental del Colaborador */}
              <TabsContent
                value="documentos"
                className="space-y-4 m-0 focus-visible:outline-none"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Expediente Digitalizado
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Documentación requerida para auditorías LFT e IMSS.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsUploadDocOpen(true)}
                    className="h-8 rounded-lg text-xs font-bold gap-1.5 bg-primary text-primary-foreground cursor-pointer shadow-none"
                  >
                    <Plus className="size-3.5" />
                    <span>Cargar Documento</span>
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {documentsList.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/30">
                      <FileText className="size-6 mx-auto text-muted-foreground/60 mb-2" />
                      <p className="font-semibold text-foreground">Sin documentos digitalizados</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Agrega constancias, identificaciones oficiales o contratos al expediente.
                      </p>
                    </div>
                  ) : (
                    documentsList.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-muted/20 border border-border/40 hover:border-border/70 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {doc.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {doc.fileName} • {doc.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5"
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            Validado
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toast.info(`Descargando documento: ${doc.title}`)
                            }
                            className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Descargar archivo"
                          >
                            <Download className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 3. Footer Operativo */}
          <div className="p-4 sm:p-5 border-t border-border/50 bg-muted/15 flex items-center justify-between gap-3 shrink-0 mt-auto relative z-10">
            <div>
              {isActive ? (
                onOpenTerminateDialog && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenTerminateDialog(employee)}
                    className="rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer h-9 shadow-none"
                  >
                    <UserX className="size-3.5 mr-1.5" />
                    <span>Registrar Baja</span>
                  </Button>
                )
              ) : (
                onReactivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReactivate(employee)}
                    className="rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer h-9 shadow-none"
                  >
                    <CheckCircle2 className="size-3.5 mr-1.5" />
                    <span>Reactivar Colaborador</span>
                  </Button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <DialogClose
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs font-semibold h-9 px-4 cursor-pointer border-border/60 hover:bg-muted/50 shadow-none"
                  />
                }
              >
                <span>Cerrar</span>
              </DialogClose>

              <Button
                size="sm"
                onClick={handleDownloadDossier}
                className="rounded-lg text-xs font-bold h-9 px-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-none"
              >
                <Download className="size-3.5" />
                <span>Exportar PDF</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Modal: Subir nuevo documento (Rendered as independent sibling dialog) */}
      <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
        <DialogContent className="rounded-xl border-border/60 bg-card max-w-md shadow-md p-5">
          <form onSubmit={handleUploadDoc}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileCheck2 className="size-4 text-primary" />
                <span>Cargar Documento al Expediente</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Indexa un nuevo archivo digitalizado para {dossier.fullName}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="doc_title"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Nombre / Tipo de Documento
                </Label>
                <Input
                  id="doc_title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ej. Constancia de Situación Fiscal, Contrato Firmado..."
                  className="h-10 rounded-lg bg-muted/30 border-border/50 text-xs font-semibold"
                  required
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center space-y-2 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
              >
                <Paperclip className="size-6 mx-auto text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : "Selecciona un archivo PDF o imagen"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : "Máximo 15 MB (PDF, PNG, JPG, WEBP)"}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsUploadDocOpen(false);
                  setSelectedFile(null);
                }}
                className="rounded-lg text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUploadingDoc || !selectedFile || !newDocTitle.trim()}
                className="rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-none"
              >
                {isUploadingDoc ? "Subiendo a Bóveda..." : "Guardar Documento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
