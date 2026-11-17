"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Eye,
  Users,
  UserCheck,
  DollarSign,
  Plane,
  ShieldCheck,
  Sparkles,
  Search,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Briefcase,
  CreditCard,
  Building2,
  Filter,
  X,
  FileCheck,
  Star,
  Layers,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { getMexicoDateISO } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  CompanyReportsData,
  ReportDefinition,
  ReportCategoryGroup,
} from "../../types/reports";
import { exportReportToCSV } from "../../utils/report-csv-exporter";
import { CompanyPageHeader } from "../shared/company-page-header";

interface CompanyReportsViewProps {
  initialData: CompanyReportsData;
}

const PERIOD_LABELS: Record<string, string> = {
  este_mes: "Este Mes",
  mes_anterior: "Mes Anterior",
  acumulado_2026: "Acumulado Anual",
};

export function CompanyReportsView({ initialData }: CompanyReportsViewProps) {
  const { companyName, kpis, insights, reports, departments } = initialData;

  const [selectedPeriod, setSelectedPeriod] = useState("este_mes");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCategory, setSelectedCategory] =
    useState<ReportCategoryGroup>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  // Preview Modal State
  const [previewReport, setPreviewReport] = useState<ReportDefinition | null>(
    null
  );
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Filter reports based on category, search and department
  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        if (selectedCategory !== "all" && report.category !== selectedCategory) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = report.title.toLowerCase().includes(q);
          const matchDesc = report.description.toLowerCase().includes(q);
          const matchCol = report.columns.some((c) =>
            c.label.toLowerCase().includes(q)
          );
          if (!matchTitle && !matchDesc && !matchCol) return false;
        }

        return true;
      })
      .map((report) => {
        // Apply department filter to rows if applicable
        if (selectedDepartment === "all") return report;

        const filteredData = report.data.filter((row) => {
          const dept = row.departamento || row.department;
          return !dept || dept === selectedDepartment;
        });

        return {
          ...report,
          data: filteredData,
          recordCount: filteredData.length,
        };
      });
  }, [reports, selectedCategory, searchQuery, selectedDepartment]);

  // Handle Real CSV Download
  const handleDownload = (report: ReportDefinition) => {
    setIsExporting(report.id);
    try {
      const todayStr = getMexicoDateISO();
      const filename = `kanpro_${report.id}_${todayStr}`;

      exportReportToCSV({
        filename,
        columns: report.columns,
        data: report.data,
      });

      toast.success(`Reporte descargado exitosamente`, {
        description: `Se exportaron ${report.data.length} registros en formato CSV (compatible con Excel/Sheets).`,
      });
    } catch (err: any) {
      console.error("Error exporting report:", err);
      toast.error("Error al exportar reporte", {
        description: err?.message || "No se pudo generar el archivo CSV.",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const activeInsight = insights[activeInsightIndex] || insights[0];

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      <CompanyPageHeader
        title="Centro de Reportes & Analítica Oficial"
        description={`Genera y descarga en Excel/CSV los 6 reportes oficiales de plantilla, contratos, vacaciones LFT, nómina y evaluaciones de ${companyName}.`}
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex items-center gap-1"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Live Data</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {departments.length > 0 && (
              <Select
                value={selectedDepartment}
                onValueChange={(val) => val && setSelectedDepartment(val)}
              >
                <SelectTrigger className="w-44">
                  <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Deptos.</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={selectedPeriod}
              onValueChange={(val) => val && setSelectedPeriod(val)}
            >
              <SelectTrigger className="w-40">
                <Calendar className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue>{PERIOD_LABELS[selectedPeriod] || selectedPeriod}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="este_mes">Este Mes</SelectItem>
                <SelectItem value="mes_anterior">Mes Anterior</SelectItem>
                <SelectItem value="acumulado_2026">Acumulado Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* 2. Tarjetas de Métricas Ejecutivas en Vivo (4 KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Plantilla Activa */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Plantilla Activa
            </span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.activeEmployees}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>{kpis.totalEmployees} empleados en total</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {kpis.retentionRate}% retención
              </span>
            </p>
          </div>
        </Card>

        {/* KPI 2: Masa Salarial */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Masa Salarial Mensual
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              ${kpis.totalMonthlyPayroll.toLocaleString("es-MX")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              Promedio: ${kpis.averageSalary.toLocaleString("es-MX")} / colab
            </p>
          </div>
        </Card>

        {/* KPI 3: Pasivo Vacaciones LFT */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Pasivo Vacaciones LFT
            </span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Plane className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.totalAccruedVacationDays}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                días
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              Art. 76 LFT • Reforma Vacaciones Dignas
            </p>
          </div>
        </Card>

        {/* KPI 4: Contratos & Evaluaciones */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Contratos & Evaluación
            </span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.totalContractsCount}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                contratos
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>{kpis.totalEvaluationsCount} evaluaciones</span>
              {kpis.evaluationsAverageScore > 0 && (
                <span className="font-bold text-primary flex items-center gap-0.5">
                  <Star className="size-3 fill-primary text-primary" />
                  {kpis.evaluationsAverageScore}
                </span>
              )}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Panel de Insights Inteligentes Basado en Datos Reales */}
      {insights && insights.length > 0 && activeInsight && (
        <Card className="p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4.5 text-primary" />
              <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                Consultas Rápidas & Diagnóstico Laboral
              </h3>
            </div>
            <Badge
              variant="secondary"
              className="w-fit text-[11px] font-bold px-2.5 py-0.5 text-primary bg-primary/10"
            >
              Analítica Instantánea
            </Badge>
          </div>

          {/* Preguntas disponibles como tabs limpias */}
          <div className="flex flex-wrap items-center gap-1.5">
            {insights.map((qi, idx) => (
              <button
                key={qi.id}
                type="button"
                onClick={() => setActiveInsightIndex(idx)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer",
                  activeInsightIndex === idx
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background/80 hover:bg-muted text-muted-foreground border-border/60"
                )}
              >
                {qi.question}
              </button>
            ))}
          </div>

          {/* Tarjeta de Respuesta del Insight Activo */}
          <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-border/80 text-muted-foreground"
                >
                  {activeInsight.category}
                </Badge>
                <Badge
                  className={cn(
                    "text-[10px] font-bold border-none",
                    activeInsight.badgeColor ||
                      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {activeInsight.badge}
                </Badge>
              </div>

              <h4 className="text-base sm:text-lg font-extrabold text-foreground">
                {activeInsight.headline}
              </h4>

              <p className="text-xs text-muted-foreground font-medium max-w-2xl leading-relaxed">
                {activeInsight.explanation}
              </p>

              {activeInsight.linkHref && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={activeInsight.linkHref} />}
                    className="gap-1 font-bold cursor-pointer"
                  >
                    <span>{activeInsight.linkLabel || "Ver más detalles"}</span>
                    <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-3xl bg-muted/40 border border-border/60 text-center min-w-44 shrink-0 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Métrica Clave
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-primary">
                {activeInsight.metric}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground block">
                {activeInsight.metricSubtitle}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Catálogo de Reportes Oficiales */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground">
              Catálogo de Reportes Oficiales de Recursos Humanos
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Archivos consolidados con validez para auditorías IMSS, contabilidad, nómina y dirección.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar reporte o columnas..."
              className="pl-8.5 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/50">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] cursor-pointer shrink-0",
              selectedCategory === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Todos los Reportes ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("talento")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] cursor-pointer shrink-0",
              selectedCategory === "talento"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Plantilla & Talento
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("legal")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] cursor-pointer shrink-0",
              selectedCategory === "legal"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Contratos & Legal
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("finanzas")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] cursor-pointer shrink-0",
              selectedCategory === "finanzas"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Nómina & Costos
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("evaluaciones")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] cursor-pointer shrink-0",
              selectedCategory === "evaluaciones"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Desempeño & Vacantes
          </button>
        </div>

        {/* Grid de Reportes */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="p-5 space-y-4 hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-bold px-2 py-0.5"
                        >
                          {report.categoryLabel}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold border-border/70 text-muted-foreground"
                        >
                          {report.recommendedFrequency}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-extrabold text-foreground pt-0.5">
                        {report.title}
                      </h4>
                    </div>

                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex items-center gap-1"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>{report.recordCount} registros</span>
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {report.description}
                  </p>

                  <div className="pt-2 border-t border-border/40 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Columnas ({report.columns.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {report.columns.slice(0, 6).map((col) => (
                        <span
                          key={col.key}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-foreground"
                        >
                          {col.label}
                        </span>
                      ))}
                      {report.columns.length > 6 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-muted-foreground">
                          +{report.columns.length - 6} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewReport(report)}
                    className="font-bold cursor-pointer gap-1.5"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Vista Previa</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleDownload(report)}
                    disabled={isExporting === report.id}
                    className="font-bold gap-1.5 cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span>
                      {isExporting === report.id
                        ? "Generando..."
                        : "Descargar CSV"}
                    </span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed space-y-3">
            <FileSpreadsheet className="size-8 mx-auto text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                No se encontraron reportes con ese criterio
              </p>
              <p className="text-xs text-muted-foreground">
                Intenta ajustando el término de búsqueda o cambiando la pestaña de categoría.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="font-bold cursor-pointer"
            >
              Restablecer Filtros
            </Button>
          </Card>
        )}
      </div>

      {/* 5. Modal de Vista Previa de Filas (ReportPreviewModal) */}
      <Dialog
        open={Boolean(previewReport)}
        onOpenChange={(open) => !open && setPreviewReport(null)}
      >
        <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-6">
          {previewReport && (
            <>
              <DialogHeader className="space-y-1 text-left pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {previewReport.categoryLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {previewReport.data.length} registros en total
                  </span>
                </div>
                <DialogTitle className="text-lg font-extrabold text-foreground">
                  Vista Previa: {previewReport.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {previewReport.description}
                </DialogDescription>
              </DialogHeader>

              {/* Contenido tabular scrolleable */}
              <div className="flex-1 overflow-auto rounded-2xl border border-border/60 my-2 max-h-[50vh]">
                {previewReport.data.length > 0 ? (
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow>
                        {previewReport.columns.map((col) => (
                          <TableHead
                            key={col.key}
                            className="font-bold text-foreground whitespace-nowrap text-xs"
                          >
                            {col.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewReport.data.slice(0, 15).map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          {previewReport.columns.map((col) => {
                            const val = row[col.key];
                            const format = col.format;

                            let display = val ?? "—";
                            if (format === "currency" && typeof val === "number") {
                              display = `$${val.toLocaleString("es-MX")}`;
                            } else if (format === "number" && typeof val === "number") {
                              display = val.toLocaleString("es-MX");
                            }

                            return (
                              <TableCell
                                key={col.key}
                                className="whitespace-nowrap font-medium text-xs py-2.5"
                              >
                                {display}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="size-6 mx-auto text-muted-foreground/40" />
                    <p className="text-xs font-bold text-foreground">
                      Sin registros disponibles en este momento
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      No hay filas cargadas en la base de datos para este reporte.
                    </p>
                  </div>
                )}
              </div>

              {previewReport.data.length > 15 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Mostrando 15 de {previewReport.data.length} registros en la vista previa. El archivo CSV contendrá la totalidad de las filas.
                </p>
              )}

              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewReport(null)}
                  className="font-bold cursor-pointer"
                >
                  Cerrar
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    handleDownload(previewReport);
                    setPreviewReport(null);
                  }}
                  className="font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Descargar Reporte Completo (.CSV)</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
