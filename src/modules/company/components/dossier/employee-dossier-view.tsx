"use client";

import React, { useState } from "react";
import {
  User,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  ShieldCheck,
  Award,
  Download,
  ArrowLeft,
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
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeDossier, EmployeeDocument } from "../../types/employee-dossier";

interface EmployeeDossierViewProps {
  dossier: EmployeeDossier;
}

export function EmployeeDossierView({ dossier }: EmployeeDossierViewProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [documents, setDocuments] = useState<EmployeeDocument[]>(dossier.documents);

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

    setDocuments((prev) => [newDoc, ...prev]);
    toast.success("Documento cargado exitosamente al expediente", {
      description: `${newDocTitle} ha sido indexado en la bóveda digital.`,
    });

    setNewDocTitle("");
    setIsUploadDocOpen(false);
  };

  const handleDownloadDossier = () => {
    toast.success("Generando Expediente Digital Completo (PDF)...", {
      description: `Se ha descargado el dossier integral de ${dossier.fullName}.`,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/company/employees"
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver a Plantilla de Empleados</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <User className="size-7 text-primary" />
            <span>Expediente Digital 360</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {`Historial integral, documentos legales, salarios, vacaciones LFT y desempeño.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadDossier}
            className="rounded-xl text-xs font-bold h-10 px-4 border-border/70 shadow-xs flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Descargar Expediente Completo</span>
          </Button>
        </div>
      </div>

      {/* Hero Card del Colaborador */}
      <Card className="rounded-3xl border border-border/40 bg-gradient-to-br from-card via-background to-primary/5 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <Avatar className="size-16 sm:size-20 rounded-2xl shrink-0 border-2 border-primary/20 shadow-xs">
              <AvatarImage src={dossier.avatarUrl || ""} />
              <AvatarFallback className="rounded-2xl text-xl sm:text-2xl font-extrabold bg-primary/10 text-primary">
                {dossier.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {dossier.fullName}
                </h2>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Colaborador Activo
                </Badge>
              </div>

              <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                {dossier.jobTitle} • <span className="text-foreground">{dossier.department}</span>
              </p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold flex-wrap pt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="size-3.5 text-primary" />
                  {dossier.branchName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-indigo-600" />
                  {`Ingreso: ${dossier.hireDate} (${dossier.yearsOfServiceFormatted})`}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2 self-start md:self-center min-w-48 shadow-xs">
            <div className="text-xs font-bold text-muted-foreground">
              Salario Bruto Mensual
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">
              ${dossier.baseSalaryMonthly.toLocaleString()} MXN
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold">
              SDI Diario: ${dossier.dailyIntegratedSalary.toFixed(2)} MXN
            </div>
          </div>
        </div>
      </Card>

      {/* Navegación por Pestañas del Expediente 360 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 p-1.5 h-auto rounded-2xl bg-muted/60 gap-1">
          <TabsTrigger
            value="general"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            1. Datos Personales
          </TabsTrigger>
          <TabsTrigger
            value="laboral"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            2. Contrato & Salario
          </TabsTrigger>
          <TabsTrigger
            value="documentos"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            3. Documentos ({documents.length})
          </TabsTrigger>
          <TabsTrigger
            value="puestos"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            4. Historial Puestos
          </TabsTrigger>
          <TabsTrigger
            value="vacaciones"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            5. Vacaciones LFT
          </TabsTrigger>
          <TabsTrigger
            value="asistencia"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            6. Asistencia
          </TabsTrigger>
          <TabsTrigger
            value="evaluaciones"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            7. Evaluaciones
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DATOS PERSONALES & FISCALES */}
        <TabsContent value="general" className="space-y-6 mt-0">
          <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-6 shadow-xs">
            <div className="pb-2 border-b border-border/40">
              <h3 className="text-base font-extrabold text-foreground">
                Información Personal, Fiscal y de Contacto
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Datos oficiales para timbrado de nómina, IMSS y expediente legal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">RFC Oficial</span>
                <span className="text-sm font-extrabold text-foreground block font-mono">{dossier.rfc}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">CURP</span>
                <span className="text-sm font-extrabold text-foreground block font-mono">{dossier.curp}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">NSS (Seguro Social IMSS)</span>
                <span className="text-sm font-extrabold text-foreground block font-mono">{dossier.nss}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Teléfono Principal</span>
                <span className="text-sm font-extrabold text-foreground block flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" />
                  {dossier.phone}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Correo Electrónico</span>
                <span className="text-sm font-extrabold text-foreground block flex items-center gap-1.5">
                  <Mail className="size-3.5 text-primary" />
                  {dossier.email}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Fecha de Nacimiento</span>
                <span className="text-sm font-extrabold text-foreground block">{dossier.birthDate}</span>
              </div>

              <div className="space-y-1 md:col-span-2">
                <span className="text-xs font-bold text-muted-foreground block">Domicilio Particular</span>
                <span className="text-sm font-semibold text-foreground block flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  {dossier.address}
                </span>
              </div>

              <div className="space-y-1 p-4 rounded-xl bg-muted/30 border border-border/50 md:col-span-3">
                <span className="text-xs font-extrabold text-primary flex items-center gap-1.5 mb-1">
                  <HeartHandshake className="size-4 text-primary" />
                  Contacto de Emergencia
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-semibold text-foreground">
                  <span><strong>Nombre:</strong> {dossier.emergencyContact.name}</span>
                  <span><strong>Teléfono:</strong> {dossier.emergencyContact.phone}</span>
                  <span><strong>Parentesco:</strong> {dossier.emergencyContact.relationship}</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: CONTRATO & SALARIO */}
        <TabsContent value="laboral" className="space-y-6 mt-0">
          <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-6 shadow-xs">
            <div className="pb-2 border-b border-border/40">
              <h3 className="text-base font-extrabold text-foreground">
                Condiciones Laborales, Tipo de Contrato y Compensaciones
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Esquema de contratación, periodicidad de pago y jornada laboral.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Tipo de Contrato</span>
                <Badge className="bg-primary/10 text-primary border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
                  {dossier.contractTypeLabel}
                </Badge>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Fecha de Contratación</span>
                <span className="text-sm font-extrabold text-foreground block">{dossier.hireDate}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Antigüedad Oficial</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  {dossier.yearsOfServiceFormatted}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Salario Bruto Mensual</span>
                <span className="text-lg font-extrabold text-foreground block">
                  ${dossier.baseSalaryMonthly.toLocaleString()} MXN
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Salario Diario Integrado (SDI)</span>
                <span className="text-lg font-extrabold text-foreground block">
                  ${dossier.dailyIntegratedSalary.toFixed(2)} MXN
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">Periodicidad de Pago</span>
                <span className="text-sm font-extrabold text-foreground block capitalize">
                  {dossier.paymentFrequency}
                </span>
              </div>

              <div className="space-y-1 md:col-span-3">
                <span className="text-xs font-bold text-muted-foreground block">Jornada y Horario de Trabajo</span>
                <span className="text-sm font-semibold text-foreground block">
                  {dossier.workSchedule}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: DOCUMENTOS DIGITALES */}
        <TabsContent value="documentos" className="space-y-6 mt-0">
          <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  Bóveda de Documentos Legales & Digitales
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  Archivos oficiales encriptados y validados del expediente.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsUploadDocOpen(true)}
                className="rounded-xl text-xs font-bold h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Cargar Nuevo Documento</span>
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/30">
                <FileText className="size-5 mx-auto text-muted-foreground/60 mb-2" />
                <p className="font-semibold text-foreground">Sin documentos digitalizados</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  El colaborador aún no cuenta con archivos subidos a su expediente digital.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-border/50 bg-background hover:border-border transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-foreground truncate">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {doc.fileName} • {doc.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold">
                        Validado
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDoc(doc)}
                        className="rounded-lg text-xs font-bold h-8 px-2.5 border-border/70 flex items-center gap-1"
                      >
                        <ExternalLink className="size-3" />
                        <span>Ver</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 4: HISTORIAL DE PUESTOS */}
        <TabsContent value="puestos" className="space-y-6 mt-0">
          <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-6 shadow-xs">
            <div className="pb-2 border-b border-border/40">
              <h3 className="text-base font-extrabold text-foreground">
                Línea de Tiempo de Puestos, Promociones y Salarios
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Registro histórico del plan de carrera y ascensos del colaborador.
              </p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {dossier.positionHistory.map((item, idx) => (
                <div key={item.id} className="relative space-y-2">
                  <div
                    className={cn(
                      "absolute -left-[27px] top-1 size-4 rounded-full border-2 bg-background",
                      idx === 0 ? "border-primary bg-primary" : "border-muted-foreground/40"
                    )}
                  />
                  <div className="p-4 rounded-xl border border-border/50 bg-background space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-foreground">
                        {item.jobTitle}
                      </h4>
                      <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-bold">
                        {item.startDate} — {item.endDate}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                      <span>Departamento: <strong className="text-foreground">{item.department}</strong></span>
                      <span>•</span>
                      <span>Salario: <strong className="text-emerald-600 dark:text-emerald-400">${item.salary.toLocaleString()} MXN</strong></span>
                    </div>

                    {item.promotionReason && (
                      <p className="text-xs text-muted-foreground font-medium pt-1 border-t border-border/30">
                        {item.promotionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: VACACIONES LFT & PERMISOS */}
        <TabsContent value="vacaciones" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
              <div className="text-xs font-bold text-muted-foreground">
                Días de Vacaciones por Ley (LFT)
              </div>
              <div className="text-3xl font-extrabold text-foreground">
                {dossier.vacationBalance.totalDaysAccruedLFT} días
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {`Año ${dossier.vacationBalance.yearsOfService + 1} de servicio`}
              </p>
            </Card>

            <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
              <div className="text-xs font-bold text-muted-foreground">
                Días Disfrutados
              </div>
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {dossier.vacationBalance.daysTaken} días
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Tomados en el periodo actual
              </p>
            </Card>

            <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
              <div className="text-xs font-bold text-muted-foreground">
                Saldo Disponible en Tiempo Real
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {dossier.vacationBalance.daysAvailable} días
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {`Próximo aniversario: ${dossier.vacationBalance.nextPeriodDate}`}
              </p>
            </Card>
          </div>

          <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-5 shadow-xs">
            <div className="pb-2 border-b border-border/40">
              <h3 className="text-base font-extrabold text-foreground">
                Historial de Solicitudes de Vacaciones & Permisos
              </h3>
            </div>

            <div className="space-y-3">
              {dossier.vacationRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/30">
                  <Calendar className="size-5 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-foreground">Sin solicitudes de vacaciones</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    No se han registrado solicitudes de vacaciones o permisos para este colaborador.
                  </p>
                </div>
              ) : (
                dossier.vacationRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-border/50 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-foreground">
                          {req.typeLabel}
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border-none",
                            req.status === "aprobada"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : req.status === "pendiente"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-destructive/15 text-destructive"
                          )}
                        >
                          {req.status === "aprobada"
                            ? "Aprobada"
                            : req.status === "pendiente"
                            ? "🟡 Pendiente de Aprobación"
                            : "Rechazada"}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground font-semibold">
                        Periodo: <strong className="text-foreground">{req.startDate} al {req.endDate}</strong> ({req.totalWorkingDays} días hábiles)
                      </div>

                      {req.reason && (
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Motivo: &quot;{req.reason}&quot;
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-muted-foreground font-medium self-end sm:self-center">
                      Solicitado: {req.requestedAt}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 6: ASISTENCIA */}
        <TabsContent value="asistencia" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-1 shadow-xs">
              <span className="text-xs font-bold text-muted-foreground">Puntualidad Acumulada</span>
              <div className="text-2xl font-extrabold text-foreground">
                {dossier.attendanceSummary.punctualityRate}%
              </div>
            </Card>

            <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-1 shadow-xs">
              <span className="text-xs font-bold text-muted-foreground">Días Laborados</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {dossier.attendanceSummary.totalDaysPresent} días
              </div>
            </Card>

            <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-1 shadow-xs">
              <span className="text-xs font-bold text-muted-foreground">Retardos Acumulados</span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {dossier.attendanceSummary.totalLateArrivals}
              </div>
            </Card>

            <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-1 shadow-xs">
              <span className="text-xs font-bold text-muted-foreground">Horas Extra Totales</span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                +{dossier.attendanceSummary.totalOvertimeHours} hrs
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 7: EVALUACIONES DE DESEMPEÑO */}
        <TabsContent value="evaluaciones" className="space-y-6 mt-0">
          <Card className="rounded-2xl border border-border/40 bg-card p-6 space-y-6 shadow-xs">
            <div className="pb-2 border-b border-border/40">
              <h3 className="text-base font-extrabold text-foreground">
                Evaluaciones de Desempeño & Feedback Periódico
              </h3>
            </div>

            <div className="space-y-4">
              {dossier.performanceReviews.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/30">
                  <Sparkles className="size-5 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-foreground">Sin evaluaciones registradas</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Este colaborador aún no cuenta con evaluaciones de desempeño en el sistema.
                  </p>
                </div>
              ) : (
                dossier.performanceReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl border border-border/50 bg-background space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground">
                          {rev.period}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          Evaluador: {rev.evaluatorName} • Fecha: {rev.evaluationDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-sm self-start sm:self-center">
                        <Star className="size-4 fill-amber-500 text-amber-500" />
                        <span>{rev.score} / 5.0</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/40 text-xs leading-relaxed">
                      <div>
                        <strong className="text-foreground block mb-1">Fortalezas destacadas:</strong>
                        <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground font-medium">
                          {rev.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-1">
                        <strong className="text-foreground block mb-0.5">Metas alcanzadas:</strong>
                        <p className="text-muted-foreground font-medium">{rev.goalsMet}</p>
                      </div>

                      <div className="pt-1">
                        <strong className="text-foreground block mb-0.5">Comentarios generales:</strong>
                        <p className="text-foreground font-medium italic">&quot;{rev.generalComments}&quot;</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Visor de Documento */}
      {selectedDoc && (
        <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 bg-card border-border/80">
            <DialogHeader className="space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <FileCheck2 className="size-4 text-primary" />
                <span>Bóveda Digital K&apos;anPro</span>
              </div>
              <DialogTitle className="text-lg font-extrabold text-foreground">
                {selectedDoc.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Archivo: {selectedDoc.fileName} • Fecha de carga: {selectedDoc.uploadedAt}
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 rounded-2xl bg-muted/30 border border-dashed border-border/60 text-center space-y-3">
              <FileText className="size-12 text-primary mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  Documento Legal Indexado
                </p>
                <p className="text-[11px] text-muted-foreground">
                  El archivo PDF cuenta con firma digital y verificación de autenticidad.
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDoc(null)}
                className="rounded-xl text-xs font-bold h-10 px-4"
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  toast.success("Descargando documento...");
                  setSelectedDoc(null);
                }}
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
              >
                <Download className="size-4" />
                <span>Descargar Archivo</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Cargar Documento */}
      <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl p-6 bg-card border-border/80">
          <form onSubmit={handleUploadDoc} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Cargar Documento al Expediente
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Añade identificaciones, certificados o contratos firmados.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="doc-title" className="text-xs font-bold text-foreground">
                  Nombre o Título del Documento *
                </Label>
                <Input
                  id="doc-title"
                  placeholder="Ej. Certificado Médico Anual"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="p-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center space-y-2 cursor-pointer hover:bg-muted/40 transition-colors">
                <Paperclip className="size-6 text-muted-foreground mx-auto" />
                <span className="text-xs font-bold text-foreground block">
                  Arrastra o selecciona tu archivo PDF o imagen
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Máximo 15 MB (PDF, JPG, PNG)
                </span>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDocOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                Guardar en Bóveda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
