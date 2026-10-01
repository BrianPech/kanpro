"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  ShieldCheck,
  Coins,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  LifeBuoy,
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  QrCode,
  Calendar,
  ChevronRight,
  PlusCircle,
  Loader2,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Globe,
  MapPin,
  FileCheck2,
  Search,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { startImpersonating } from "@/lib/auth/impersonation";
import { createSupportTicket } from "@/app/(dashboard)/dashboard/admin/support/actions";
import type {
  TicketCategory,
  TicketPriority,
} from "@/modules/admin/types/support";
import type {
  CompanyFullDiagnostic,
  CompanyDiagnosticTicket,
} from "../services/company-360";

interface Company360ViewProps {
  diagnostic: CompanyFullDiagnostic;
}

function formatCurrency(amount: number | null | undefined, currency: string = "MXN") {
  if (amount === null || amount === undefined) return "No especificado";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function getInitials(name: string) {
  if (!name) return "EM";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function Company360View({ diagnostic }: Company360ViewProps) {
  const { company, vacancies, team, attendance, operations, support } = diagnostic;

  const [activeTab, setActiveTab] = React.useState("vacancies");
  const [isImpersonating, setIsImpersonating] = React.useState(false);

  // Support ticket creation dialog state
  const [ticketDialogOpen, setTicketDialogOpen] = React.useState(false);
  const [ticketSubject, setTicketSubject] = React.useState("");
  const [ticketDescription, setTicketDescription] = React.useState("");
  const [ticketCategory, setTicketCategory] = React.useState<TicketCategory>("verificacion_documentos");
  const [ticketPriority, setTicketPriority] = React.useState<TicketPriority>("media");
  const [isSubmittingTicket, setIsSubmittingTicket] = React.useState(false);
  const [ticketsList, setTicketsList] = React.useState<CompanyDiagnosticTicket[]>(support.tickets);

  // Search filter for vacancies
  const [vacancySearch, setVacancySearch] = React.useState("");
  const filteredVacancies = React.useMemo(() => {
    if (!vacancySearch.trim()) return vacancies.list;
    const q = vacancySearch.toLowerCase();
    return vacancies.list.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
    );
  }, [vacancies.list, vacancySearch]);

  // Handle Impersonation
  const handleImpersonate = async () => {
    setIsImpersonating(true);
    try {
      toast.loading(`Iniciando impersonación de ${company.companyName}...`);
      const res = await startImpersonating(company.id);
      toast.success(`Impersonando a ${res.targetName || company.companyName}`);
      window.location.href = res.redirectUrl;
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al iniciar impersonación");
      setIsImpersonating(false);
    }
  };

  // Handle Ticket Submission
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      toast.error("Por favor complete el asunto y la descripción.");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await createSupportTicket({
        userId: company.id,
        userEmail: company.corporateEmail || company.userEmail || "soporte@kanpro.mx",
        userName: company.companyName,
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        category: ticketCategory,
        priority: ticketPriority,
      });

      const ticketItem: CompanyDiagnosticTicket = {
        id: res.ticketId,
        ticketNumber: res.ticketNumber,
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        status: "abierto",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTicketsList((prev) => [ticketItem, ...prev]);
      toast.success(`Ticket ${res.ticketNumber} creado con éxito`);
      setTicketDialogOpen(false);
      setTicketSubject("");
      setTicketDescription("");
      setActiveTab("support");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al crear ticket de soporte");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Hero Card */}
      <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: Avatar & Info */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <Avatar className="size-16 sm:size-20 rounded-2xl border-2 border-border/60 bg-muted shrink-0 shadow-xs">
                <AvatarImage src={company.logoUrl || undefined} alt={company.companyName} />
                <AvatarFallback className="bg-primary/10 text-primary font-extrabold text-lg sm:text-xl">
                  {getInitials(company.companyName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                    {company.companyName}
                  </h1>

                  {/* Verification Badge */}
                  {company.verificationStatus === "approved" || company.isVerified ? (
                    <Badge
                      variant="outline"
                      className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      <ShieldCheck className="size-3.5" />
                      <span>Empresa Verificada</span>
                    </Badge>
                  ) : company.verificationStatus === "pending" ? (
                    <Badge
                      variant="outline"
                      className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                      <Clock className="size-3.5" />
                      <span>Verificación Pendiente</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1 border-slate-500/30 bg-slate-500/10 text-muted-foreground"
                    >
                      <AlertCircle className="size-3.5" />
                      <span>No Verificada</span>
                    </Badge>
                  )}

                  {/* Credits Badge */}
                  <Badge
                    variant="outline"
                    className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  >
                    <Coins className="size-3.5" />
                    <span>{company.creditsAvailable} Créditos</span>
                  </Badge>

                  {/* Plan Badge */}
                  <Badge
                    variant="secondary"
                    className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-lg"
                  >
                    {company.subscriptionPlan}
                  </Badge>
                </div>

                {/* Subtitle Details: Legal Name & RFC */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {company.legalName && (
                    <span className="font-semibold text-foreground/80">
                      {company.legalName}
                    </span>
                  )}
                  <span className="font-mono bg-muted/60 px-2 py-0.5 rounded-md font-bold text-foreground">
                    RFC: {company.rfc}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Building2 className="size-3.5 text-muted-foreground/70" />
                    {company.industry}
                  </span>
                </div>

                {/* Contact items */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                  {company.corporateEmail && (
                    <a
                      href={`mailto:${company.corporateEmail}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors truncate"
                    >
                      <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <span>{company.corporateEmail}</span>
                    </a>
                  )}
                  {company.contactPhone && (
                    <a
                      href={`tel:${company.contactPhone}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <span>{company.contactPhone}</span>
                    </a>
                  )}
                  {company.websiteUrl && (
                    <a
                      href={company.websiteUrl.startsWith("http") ? company.websiteUrl : `https://${company.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors truncate"
                    >
                      <Globe className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <span className="max-w-[200px] truncate">{company.websiteUrl.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  )}
                  {company.fiscalAddress && (
                    <span className="flex items-center gap-1 truncate max-w-sm">
                      <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <span className="truncate">{company.fiscalAddress}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImpersonate}
                disabled={isImpersonating}
                className="flex-1 lg:flex-none h-10 px-4 rounded-2xl text-xs font-bold gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer shadow-2xs"
              >
                {isImpersonating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>Impersonar Empresa</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setTicketDialogOpen(true)}
                className="flex-1 lg:flex-none h-10 px-4 rounded-2xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                <LifeBuoy className="size-3.5" />
                <span>Crear Ticket de Soporte</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Diagnostic Snapshot KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border/60 bg-muted/20 divide-x divide-border/60 text-xs">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-medium">Vacantes Activas</p>
              <p className="text-lg font-black text-foreground tabular-nums">
                {vacancies.activeCount} <span className="text-xs font-medium text-muted-foreground">/ {vacancies.totalCount}</span>
              </p>
            </div>
            <Briefcase className="size-5 text-primary/70 shrink-0" />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-medium">Postulaciones</p>
              <p className="text-lg font-black text-foreground tabular-nums">
                {vacancies.totalApplicationsCount}
              </p>
            </div>
            <Users className="size-5 text-blue-500/70 shrink-0" />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-medium">Equipo Activo</p>
              <p className="text-lg font-black text-foreground tabular-nums">
                {team.activeEmployeesCount} <span className="text-xs font-medium text-muted-foreground">colab.</span>
              </p>
            </div>
            <UserCheck className="size-5 text-emerald-500/70 shrink-0" />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground font-medium">Soporte Abierto</p>
              <p className="text-lg font-black text-foreground tabular-nums">
                {support.openCount} <span className="text-xs font-medium text-muted-foreground">tickets</span>
              </p>
            </div>
            <LifeBuoy className="size-5 text-amber-500/70 shrink-0" />
          </div>
        </div>
      </Card>

      {/* 4 Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-11 p-1 rounded-2xl bg-muted/50 border border-border/50">
          <TabsTrigger value="vacancies" className="rounded-xl text-xs font-bold gap-2 cursor-pointer">
            <Briefcase className="size-3.5" />
            <span>Vacantes & ATS</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md">
              {vacancies.totalCount}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="team" className="rounded-xl text-xs font-bold gap-2 cursor-pointer">
            <Users className="size-3.5" />
            <span>Equipo & RRHH</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md">
              {team.employees.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="operations" className="rounded-xl text-xs font-bold gap-2 cursor-pointer">
            <FileSpreadsheet className="size-3.5" />
            <span>Operaciones & Cumplimiento</span>
          </TabsTrigger>

          <TabsTrigger value="support" className="rounded-xl text-xs font-bold gap-2 cursor-pointer">
            <LifeBuoy className="size-3.5" />
            <span>Historial de Soporte</span>
            {support.openCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 rounded-md bg-amber-500 text-white font-bold">
                {support.openCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: Vacantes & ATS */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="vacancies" className="space-y-4 m-0 focus-visible:outline-none">
          <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="size-4 text-primary" />
                  <span>Ofertas Laborales Publicadas</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Vacantes registradas en el portal, estatus actual y candidatos postulados.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70" />
                <Input
                  placeholder="Filtrar por título, área..."
                  value={vacancySearch}
                  onChange={(e) => setVacancySearch(e.target.value)}
                  className="pl-8.5 h-9 rounded-xl bg-muted/30 border-border/60 text-xs"
                />
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/60">
                  <TableRow>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Puesto / Vacante
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Categoría
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Salario Estimado
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground text-center">
                      Postulaciones
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground text-right">
                      Fecha
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {filteredVacancies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Briefcase className="size-8 text-muted-foreground/40 stroke-[1.5]" />
                          <p className="text-xs font-bold text-foreground">No se encontraron vacantes</p>
                          <p className="text-xs text-muted-foreground">
                            Esta empresa aún no ha publicado vacantes o no coinciden con la búsqueda.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVacancies.map((vac) => (
                      <TableRow key={vac.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 px-5">
                          <div className="font-bold text-sm text-foreground">
                            {vac.title}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{vac.location}</span>
                            <span>•</span>
                            <span className="capitalize">{vac.modality}</span>
                            <span>•</span>
                            <span>{vac.employmentType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-foreground font-medium">
                          {vac.category}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                          {vac.salaryMin || vac.salaryMax
                            ? `${formatCurrency(vac.salaryMin, vac.currency || "MXN")} - ${formatCurrency(vac.salaryMax, vac.currency || "MXN")}`
                            : "A convenir"}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-center">
                          <Badge
                            variant="secondary"
                            className="px-2.5 py-0.5 rounded-lg text-xs font-bold gap-1 font-mono"
                          >
                            <Users className="size-3 text-primary" />
                            <span>{vac.applicationsCount}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          {vac.status === "Activa" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-xs font-bold rounded-xl gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                              <CheckCircle2 className="size-3" />
                              <span>Activa</span>
                            </Badge>
                          ) : vac.status === "Pausada" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-xs font-bold rounded-xl gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            >
                              <Clock className="size-3" />
                              <span>Pausada</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-xs font-bold rounded-xl gap-1 border-slate-500/30 bg-slate-500/10 text-muted-foreground"
                            >
                              <span>Cerrada</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right text-xs text-muted-foreground font-mono">
                          {formatDate(vac.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* TAB 2: Equipo & RRHH */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="team" className="space-y-6 m-0 focus-visible:outline-none">
          {/* Active Employees */}
          <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <UserCheck className="size-4 text-emerald-600" />
                    <span>Colaboradores Registrados ({team.employees.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Plantilla activa de trabajadores registrados en K'anPro.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                  {team.activeEmployeesCount} Activos
                </Badge>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/60">
                  <TableRow>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Colaborador
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Puesto
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Departamento
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Salario Mensual
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground text-right">
                      Alta
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {team.employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="size-7 text-muted-foreground/40 stroke-[1.5]" />
                          <p className="text-xs font-bold text-foreground">Sin colaboradores registrados</p>
                          <p className="text-xs text-muted-foreground">
                            La empresa aún no ha dado de alta colaboradores en su plantilla.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    team.employees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 rounded-xl bg-muted border border-border/60 shrink-0">
                              <AvatarImage src={emp.avatarUrl || undefined} alt={emp.fullName} />
                              <AvatarFallback className="text-[10px] font-bold">
                                {getInitials(emp.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-sm text-foreground">
                                {emp.fullName}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{emp.email || "Sin correo"}</span>
                                {emp.employeeCode && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{emp.employeeCode}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-foreground font-semibold">
                          {emp.jobTitle}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-muted-foreground">
                          {emp.department || "General"}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs font-mono font-medium text-foreground">
                          {emp.baseSalaryMonthly ? formatCurrency(emp.baseSalaryMonthly) : "No registrado"}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          {emp.status === "active" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                              Activo
                            </Badge>
                          ) : emp.status === "terminated" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            >
                              Baja
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-bold rounded-xl">
                              {emp.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right text-xs text-muted-foreground font-mono">
                          {formatDate(emp.hireDate)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Employee Invitations */}
          <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <span>Invitaciones para Incorporación ({team.invitations.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Invitaciones enviadas por correo para que nuevos colaboradores se unan.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-bold border-amber-500/30 bg-amber-500/10 text-amber-600">
                  {team.pendingInvitationsCount} Pendientes
                </Badge>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/60">
                  <TableRow>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Invitado / Correo
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Puesto Propuesto
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Fecha Expiración
                    </TableHead>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground text-right">
                      Fecha Envío
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {team.invitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Mail className="size-7 text-muted-foreground/40 stroke-[1.5]" />
                          <p className="text-xs font-bold text-foreground">Sin invitaciones pendientes</p>
                          <p className="text-xs text-muted-foreground">
                            No se han emitido enlaces de invitación recientes para esta empresa.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    team.invitations.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 px-5">
                          <div className="font-bold text-xs sm:text-sm text-foreground">
                            {inv.fullName || "Sin nombre registrado"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {inv.email}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-foreground font-semibold">
                          {inv.position}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          {inv.status === "pending" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            >
                              Pendiente
                            </Badge>
                          ) : inv.status === "accepted" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                              Aceptada
                            </Badge>
                          ) : inv.status === "expired" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            >
                              Expirada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-bold rounded-xl">
                              Cancelada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                          {formatDate(inv.expiresAt)}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right text-xs text-muted-foreground font-mono">
                          {formatDate(inv.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* TAB 3: Operaciones & Cumplimiento */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="operations" className="space-y-6 m-0 focus-visible:outline-none">
          {/* Operations Snapshot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kiosk / Attendance Card */}
            <Card className="rounded-3xl border-border/60 bg-card shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Checador & Asistencia
                </span>
                <QrCode className="size-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-foreground tabular-nums">
                    {attendance.totalRecordsCount}
                  </span>
                  <span className="text-xs text-muted-foreground">registros</span>
                </div>
                <div className="mt-2">
                  {attendance.kioskConfigured ? (
                    <Badge
                      variant="outline"
                      className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Kiosk QR Configurado</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600"
                    >
                      <Clock className="size-3" />
                      <span>Kiosk Pendiente</span>
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {attendance.kioskQrCount} checajes registrados mediante código QR oficial en sucursal.
              </p>
            </Card>

            {/* Contracts Card */}
            <Card className="rounded-3xl border-border/60 bg-card shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contratos Laborales
                </span>
                <FileCheck2 className="size-4 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-foreground tabular-nums">
                    {operations.contracts.totalCount}
                  </span>
                  <span className="text-xs text-muted-foreground">contratos</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs font-bold">
                    {operations.contracts.signedCount} Firmados
                  </Badge>
                  {operations.contracts.pendingCount > 0 && (
                    <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-500/30">
                      {operations.contracts.pendingCount} Por Firmar
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Documentos contractuales y adendas emitidos para la plantilla.
              </p>
            </Card>

            {/* Payrolls & Audit Card */}
            <Card className="rounded-3xl border-border/60 bg-card shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nómina & Expediente
                </span>
                <DollarSign className="size-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-xl font-black text-foreground tabular-nums">
                  {formatCurrency(operations.payrolls.totalNetDispersed)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {operations.payrolls.totalCount} periodos de nómina calculados
                </div>
              </div>
              <div className="pt-1">
                <Button
                  render={<Link href={operations.auditUrl} />}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-bold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <FileText className="size-3.5" />
                  <span>Auditoría de Expediente Fiscal</span>
                  <ExternalLink className="size-3" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent Attendance Logs */}
          <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>Últimos Registros de Asistencia</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Checajes en tiempo real sincronizados desde terminales Kiosk y la app K'anPro.
              </CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/60">
                  <TableRow>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Colaborador
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Fecha
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Entrada
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Salida
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Método
                    </TableHead>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground text-right">
                      Estatus / Retardo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {attendance.recentRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Clock className="size-7 text-muted-foreground/40 stroke-[1.5]" />
                          <p className="text-xs font-bold text-foreground">Sin registros de asistencia</p>
                          <p className="text-xs text-muted-foreground">
                            Aún no se han sincronizado checajes para el periodo en curso.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.recentRecords.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 px-5 font-bold text-xs sm:text-sm text-foreground">
                          {rec.employeeName}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                          {formatDate(rec.workDate)}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs font-mono font-medium">
                          {rec.checkInTime ? rec.checkInTime.slice(0, 5) : "—"}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs font-mono font-medium">
                          {rec.checkOutTime ? rec.checkOutTime.slice(0, 5) : "—"}
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold font-mono">
                            {rec.checkInMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right">
                          {rec.delayMinutes > 0 ? (
                            <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-500/30">
                              +{rec.delayMinutes} min
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs font-bold text-emerald-600 border-emerald-500/30">
                              A tiempo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* TAB 4: Historial de Soporte */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="support" className="space-y-4 m-0 focus-visible:outline-none">
          <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <LifeBuoy className="size-4 text-primary" />
                  <span>Historial de Incidencias & Tickets</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Tickets de asistencia técnica, facturación, cuentas y seguimiento de soporte.
                </CardDescription>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setTicketDialogOpen(true)}
                className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                <PlusCircle className="size-3.5" />
                <span>Nuevo Ticket de Soporte</span>
              </Button>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/60">
                  <TableRow>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Ticket
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Asunto
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Prioridad
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="py-3 px-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Fecha
                    </TableHead>
                    <TableHead className="py-3 px-5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground text-right">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {ticketsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <LifeBuoy className="size-8 text-muted-foreground/40 stroke-[1.5]" />
                          <p className="text-xs font-bold text-foreground">Sin tickets de soporte</p>
                          <p className="text-xs text-muted-foreground">
                            Esta empresa no cuenta con incidencias abiertas ni historial previo.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketDialogOpen(true)}
                            className="mt-2 h-8 text-xs font-bold rounded-xl"
                          >
                            Crear Primer Ticket
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ticketsList.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 px-5 font-mono text-xs font-bold text-primary">
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {ticket.subject}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {ticket.description}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className="px-2 py-0.5 text-[11px] font-semibold rounded-xl capitalize"
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          {ticket.status === "abierto" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-600"
                            >
                              Abierto
                            </Badge>
                          ) : ticket.status === "en_proceso" ? (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-purple-500/30 bg-purple-500/10 text-purple-600"
                            >
                              En Atención
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-[11px] font-bold rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            >
                              Resuelto
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right">
                          <Button
                            render={<Link href={`/dashboard/admin/support/tickets/${ticket.id}`} />}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl"
                          >
                            <span>Atender</span>
                            <ChevronRight className="size-3.5 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Creating Support Ticket */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 border-border/60 shadow-2xl">
          <DialogHeader className="gap-1.5 pb-2">
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <LifeBuoy className="size-5 text-primary" />
              <span>Crear Ticket de Soporte</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Abra una solicitud de asistencia técnica o seguimiento para{" "}
              <strong className="text-foreground">{company.companyName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Asunto del Ticket
              </Label>
              <Input
                placeholder="Ej. Problema con sincronización de checador QR..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                required
                className="h-10 rounded-xl bg-muted/30 text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Categoría
                </Label>
                <Select
                  value={ticketCategory}
                  onValueChange={(val) => val && setTicketCategory(val as TicketCategory)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectGroup>
                      <SelectItem value="cuenta_acceso" className="text-xs">Acceso y Cuenta</SelectItem>
                      <SelectItem value="pagos_creditos" className="text-xs">Pagos y Créditos</SelectItem>
                      <SelectItem value="verificacion_documentos" className="text-xs">Expediente y Verificación</SelectItem>
                      <SelectItem value="vacantes_postulaciones" className="text-xs">Vacantes y ATS</SelectItem>
                      <SelectItem value="fallo_tecnico" className="text-xs">Incidencia Técnica</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Prioridad
                </Label>
                <Select
                  value={ticketPriority}
                  onValueChange={(val) => val && setTicketPriority(val as TicketPriority)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectGroup>
                      <SelectItem value="baja" className="text-xs">Baja</SelectItem>
                      <SelectItem value="media" className="text-xs">Media</SelectItem>
                      <SelectItem value="alta" className="text-xs font-semibold">Alta</SelectItem>
                      <SelectItem value="urgente" className="text-xs font-bold text-rose-600">Urgente</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Descripción del Problema o Solicitud
              </Label>
              <Textarea
                placeholder="Detalle el requerimiento, evidencia o reporte de la empresa..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                required
                rows={4}
                className="rounded-xl bg-muted/30 text-xs sm:text-sm resize-none"
              />
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTicketDialogOpen(false)}
                disabled={isSubmittingTicket}
                className="h-9 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingTicket}
                className="h-9 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                {isSubmittingTicket ? (
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                ) : (
                  <PlusCircle className="size-3.5 mr-1" />
                )}
                <span>Crear Ticket</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
