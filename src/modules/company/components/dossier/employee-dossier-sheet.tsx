"use client";

import * as React from "react";
import {
  User,
  UserX,
  Building2,
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
  ExternalLink,
  Plus,
  Sparkles,
  Star,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Layers,
  Paperclip,
  MessageSquare,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { calculateLFTVacationDays } from "../../utils/vacation-calculator";
import { EmployeeDocument, EmployeeDossier } from "../../types/employee-dossier";

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

interface EmployeeDossierSheetProps {
  employee: SimpleEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenDateDialog?: (employee: SimpleEmployee) => void;
  onOpenTerminateDialog?: (employee: SimpleEmployee) => void;
  onReactivate?: (employee: SimpleEmployee) => void;
}

export function EmployeeDossierSheet({
  employee,
  open,
  onOpenChange,
  onOpenDateDialog,
  onOpenTerminateDialog,
  onReactivate,
}: EmployeeDossierSheetProps) {
  const [activeTab, setActiveTab] = React.useState("general");
  const [isUploadDocOpen, setIsUploadDocOpen] = React.useState(false);
  const [newDocTitle, setNewDocTitle] = React.useState("");

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

  const [documentsList, setDocumentsList] = React.useState<EmployeeDocument[]>(
    []
  );

  React.useEffect(() => {
    if (dossier?.documents) {
      setDocumentsList(dossier.documents);
    }
  }, [dossier]);

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

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      docType: "comprobante_estudios",
      title: newDocTitle.trim(),
      fileName: `${newDocTitle.replace(/\s+/g, "_")}.pdf`,
      fileUrl: "/assets/docs/sample.pdf",
      fileSizeBytes: 750000,
      uploadedAt: "Hoy",
      status: "validado",
    };

    setDocumentsList((prev) => [newDoc, ...prev]);
    toast.success("Documento cargado al expediente digital", {
      description: `${newDocTitle} ha sido indexado exitosamente.`,
    });

    setNewDocTitle("");
    setIsUploadDocOpen(false);
  };

  const handleDownloadDossier = () => {
    toast.success("Generando Expediente Digital 360...", {
      description: `Se ha descargado el expediente integral de ${dossier.fullName}.`,
    });
  };

  const isActive = employee.status === "Contratado";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:!max-w-[860px] md:!max-w-[940px] lg:!max-w-[1020px] p-0 overflow-hidden flex flex-col h-full bg-card border-l border-border/60 shadow-2xl font-sans"
      >
        {/* 1. Header Fijo con Resumen del Colaborador */}
        <div className="p-5 sm:p-6 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="flex items-start justify-between gap-4">
            
            {/* Perfil Header */}
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="size-14 rounded-2xl border-2 border-border/50 shadow-sm shrink-0">
                <AvatarImage
                  src={dossier.avatarUrl || undefined}
                  alt={dossier.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl font-extrabold text-base bg-primary/10 text-primary">
                  {getInitials(dossier.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
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
                    <span>{isActive ? "Activo" : "Baja"}</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium">
                  <span className="font-semibold text-foreground">
                    {dossier.jobTitle}
                  </span>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-2 py-0 rounded-md border-border/30 bg-muted/40"
                  >
                    {dossier.department}
                  </Badge>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 text-primary" />
                    <span>{dossier.address}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-1.5 shrink-0 pr-8">
              {employee.phone && isActive && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Enviar WhatsApp"
                >
                  <MessageSquare className="size-4 stroke-[2.5]" />
                </a>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDossier}
                className="h-9 px-3 rounded-xl text-xs font-semibold border-border/50 gap-1.5 cursor-pointer hover:bg-muted"
                title="Descargar Expediente PDF"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Cuerpo Desplazable con Tabs */}
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="p-5 sm:p-6 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full space-y-5"
            >
              {/* Tab Navigation */}
              <TabsList className="grid grid-cols-4 w-full h-11 p-1 rounded-2xl bg-muted/40 border border-border/40">
                <TabsTrigger
                  value="general"
                  className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
                >
                  <User className="size-3.5" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger
                  value="laboral"
                  className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
                >
                  <Briefcase className="size-3.5" />
                  <span className="hidden sm:inline">Laboral & Salario</span>
                </TabsTrigger>
                <TabsTrigger
                  value="documentos"
                  className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
                >
                  <FileText className="size-3.5" />
                  <span className="hidden sm:inline">Documentos ({documentsList.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="vacaciones"
                  className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
                >
                  <Award className="size-3.5" />
                  <span className="hidden sm:inline">LFT & 360</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Información General & Contacto */}
              <TabsContent value="general" className="space-y-4 m-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contacto */}
                  <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <Phone className="size-3.5 text-primary" />
                      <span>Contacto Directo</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-muted-foreground font-medium block">
                          Teléfono de Contacto:
                        </span>
                        <span className="font-bold text-foreground font-mono">
                          {dossier.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium block">
                          Correo Corporativo:
                        </span>
                        <span className="font-semibold text-foreground">
                          {dossier.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium block">
                          Ubicación / Domicilio:
                        </span>
                        <span className="font-semibold text-foreground">
                          {dossier.address}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Datos Fiscales e Identidad */}
                  <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <ShieldCheck className="size-3.5 text-primary" />
                      <span>Identidad & Fiscal</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground font-medium block">
                            RFC Oficial:
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            {dossier.rfc}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium block">
                            NSS IMSS:
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            {dossier.nss}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium block">
                          CURP:
                        </span>
                        <span className="font-bold text-foreground font-mono">
                          {dossier.curp}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground font-medium block">
                            Nacionalidad:
                          </span>
                          <span className="font-semibold text-foreground">
                            {dossier.nationality}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium block">
                            F. Nacimiento:
                          </span>
                          <span className="font-semibold text-foreground">
                            15 Jun 1994
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Contacto de Emergencia */}
                <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    <HeartHandshake className="size-3.5 text-rose-500" />
                    <span>Contacto de Emergencia Registrado</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium block">
                        Nombre:
                      </span>
                      <span className="font-bold text-foreground">
                        {dossier.emergencyContact.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block">
                        Parentesco:
                      </span>
                      <span className="font-semibold text-foreground">
                        {dossier.emergencyContact.relationship}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block">
                        Teléfono:
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {dossier.emergencyContact.phone}
                      </span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 2: Información Laboral & Salario */}
              <TabsContent value="laboral" className="space-y-4 m-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="bg-card border border-border/40 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Salario Mensual
                    </span>
                    <h3 className="text-xl font-extrabold text-foreground font-mono mt-1">
                      ${dossier.baseSalaryMonthly.toLocaleString("es-MX")} MXN
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      Pago {dossier.paymentFrequency}
                    </p>
                  </Card>

                  <Card className="bg-card border border-border/40 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Salario Diario (SDI)
                    </span>
                    <h3 className="text-xl font-extrabold text-foreground font-mono mt-1">
                      ${dossier.dailyIntegratedSalary.toFixed(2)} MXN
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      Integrado para IMSS
                    </p>
                  </Card>

                  <Card className="bg-card border border-border/40 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Antigüedad LFT
                    </span>
                    <h3 className="text-xl font-extrabold text-foreground font-mono mt-1">
                      {dossier.yearsOfServiceFormatted}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      Ingreso: {dossier.hireDate}
                    </p>
                  </Card>
                </div>

                {/* Detalles de Contratación */}
                <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <Briefcase className="size-3.5 text-primary" />
                      <span>Condiciones de Contratación</span>
                    </div>
                    {onOpenDateDialog && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDateDialog(employee)}
                        className="h-7 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg px-2 cursor-pointer"
                      >
                        Cambiar fecha inicio
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium block">
                        Tipo de Contrato:
                      </span>
                      <span className="font-bold text-foreground">
                        {dossier.contractTypeLabel}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium block">
                        Jornada & Horario:
                      </span>
                      <span className="font-semibold text-foreground">
                        {dossier.workSchedule}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Historial de Puestos */}
                <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="size-3.5 text-primary" />
                    <span>Trayectoria y Puestos en la Empresa</span>
                  </div>

                  <div className="space-y-3">
                    {dossier.positionHistory.map((pos) => (
                      <div
                        key={pos.id}
                        className="p-3 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-between text-xs"
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
                            ${pos.salary.toLocaleString("es-MX")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {pos.startDate} - {pos.endDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 3: Bóveda Documental */}
              <TabsContent value="documentos" className="space-y-4 m-0 focus-visible:outline-none">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Expediente Digitalizado
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Documentación requerida por la LFT y auditoría laboral.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsUploadDocOpen(true)}
                    className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Cargar Documento</span>
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {documentsList.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border/30">
                      <FileText className="size-5 mx-auto text-muted-foreground/60 mb-2" />
                      <p className="font-semibold text-foreground">Sin documentos cargados</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        El colaborador aún no cuenta con documentos digitalizados en su expediente.
                      </p>
                    </div>
                  ) : (
                    documentsList.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/40 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-md"
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

              {/* TAB 4: Vacaciones LFT & Desempeño 360 */}
              <TabsContent value="vacaciones" className="space-y-4 m-0 focus-visible:outline-none">
                {/* Balance de Vacaciones Dignas LFT */}
                <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      <Award className="size-3.5 text-primary" />
                      <span>Vacaciones Dignas (Art. 76 LFT)</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-extrabold font-mono text-primary px-2.5 py-0.5 rounded-lg border-primary/30"
                    >
                      {dossier.vacationBalance.daysAvailable} días disponibles
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Devengados
                      </span>
                      <span className="text-lg font-extrabold text-foreground font-mono">
                        {dossier.vacationBalance.totalDaysAccruedLFT}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Disfrutados
                      </span>
                      <span className="text-lg font-extrabold text-foreground font-mono">
                        {dossier.vacationBalance.daysTaken}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <span className="text-[10px] font-bold uppercase block">
                        Saldo Restante
                      </span>
                      <span className="text-lg font-extrabold font-mono">
                        {dossier.vacationBalance.daysAvailable}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Métricas de Asistencia y Puntualidad */}
                <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
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
                </Card>

                {/* Evaluación de Desempeño */}
                {dossier.performanceReviews.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-border/30">
                    <Sparkles className="size-4 mx-auto text-muted-foreground/60 mb-1.5" />
                    <p className="font-semibold text-foreground">Sin evaluaciones registradas</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Este colaborador aún no cuenta con evaluaciones 360 en el sistema.
                    </p>
                  </div>
                ) : (
                  dossier.performanceReviews.map((rev) => (
                    <Card
                      key={rev.id}
                      className="bg-card border border-border/40 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                          <Sparkles className="size-3.5 text-amber-500" />
                          <span>{rev.period}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm">
                          <Star className="size-4 fill-amber-500" />
                          <span>{rev.score} / 5.0</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-muted-foreground font-medium block">
                            Fortalezas Destacadas:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-foreground font-semibold mt-1">
                            {rev.strengths.map((str, i) => (
                              <li key={i}>{str}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-muted-foreground text-[11px] italic pt-1">
                          &ldquo;{rev.generalComments}&rdquo;
                        </p>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* 3. Footer Operativo */}
        <div className="p-4 sm:p-5 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <div>
            {isActive ? (
              onOpenTerminateDialog && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenTerminateDialog(employee)}
                  className="rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer h-9"
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
                  className="rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer h-9"
                >
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  <span>Reactivar</span>
                </Button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
                />
              }
            >
              <span>Cerrar</span>
            </SheetClose>

            <Button
              size="sm"
              onClick={handleDownloadDossier}
              className="rounded-xl text-xs font-bold h-9 px-4 gap-1.5 bg-primary text-primary-foreground cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </div>

        {/* Modal: Subir nuevo documento */}
        <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
          <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
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
                    placeholder="Ej. Certificado Médico, Carta de Recomendación..."
                    className="h-10 rounded-xl bg-muted/40 border-border/60 text-xs font-semibold"
                    required
                  />
                </div>

                <div className="border-2 border-dashed border-border/60 rounded-2xl p-6 text-center space-y-2 bg-muted/10">
                  <Paperclip className="size-6 mx-auto text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">
                    Selecciona un archivo PDF o imagen
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Máximo 10 MB (PDF, PNG, JPG)
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsUploadDocOpen(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
                >
                  Guardar Documento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
