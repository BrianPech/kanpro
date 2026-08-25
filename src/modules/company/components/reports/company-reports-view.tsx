"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  UserX,
  Plane,
  ShieldAlert,
  Users,
  CreditCard,
  Sparkles,
  TrendingUp,
  Search,
  ArrowLeft,
  ChevronRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReportItemDefinition, QuickInsightAnswer, ReportCategory } from "../../types/reports";

export function CompanyReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState("este_mes");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Quick Insights state
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  const quickInsights: QuickInsightAnswer[] = [
    {
      id: "qi-1",
      question: "¿Qué trabajador tuvo más retardos este mes?",
      category: "Asistencia & Puntualidad",
      headline: "Mariana Silva acumuló 1 retardo",
      metric: "18 min",
      metricSubtitle: "Demora acumulada",
      badge: "Tolerancia: 15 min",
      employeeHighlight: {
        name: "Mariana Silva",
        jobTitle: "Capitán de Meseros",
        department: "Alimentos y Bebidas",
        detail: "1 retardo registrado (22 Jun 2026)",
        employeeId: "emp-002",
      },
      explanation:
        "Mariana Silva presentó 1 retardo de 18 minutos el 22 de junio atribuible a bloqueo vial. El 95% de la plantilla restante mantuvo asistencia 100% puntual.",
    },
    {
      id: "qi-2",
      question: "¿Quién generó más horas extras autorizadas?",
      category: "Jornada Extraordinaria",
      headline: "Carlos Mendoza lideró horas extraordinarias",
      metric: "+6.5 hrs",
      metricSubtitle: "Horas dobles LFT",
      badge: "+$1,235 MXN",
      employeeHighlight: {
        name: "Carlos Mendoza",
        jobTitle: "Supervisor de Mantenimiento",
        department: "Operaciones",
        detail: "3 turnos extraordinarios autorizados",
        employeeId: "emp-001",
      },
      explanation:
        "Carlos Mendoza cubrió guardias de mantenimiento preventivo fuera de horario, debidamente aprobadas por la gerencia para la pre-nómina.",
    },
    {
      id: "qi-3",
      question: "¿Cuál es la tasa de rotación de personal (Turnover)?",
      category: "Retención de Talento",
      headline: "Excelente estabilidad laboral",
      metric: "2.1%",
      metricSubtitle: "Tasa mensual",
      badge: "Nivel Óptimo (< 5%)",
      explanation:
        "La empresa mantiene una tasa de rotación muy baja en comparación con el promedio de la industria hotelera y restaurantera (8.5%).",
    },
    {
      id: "qi-4",
      question: "¿Cuál es el pasivo laboral en vacaciones acumuladas?",
      category: "Vacaciones LFT",
      headline: "38 días de vacaciones disponibles en la plantilla",
      metric: "38 días",
      metricSubtitle: "Saldo global acumulado",
      badge: "Promedio: 9.5 días / colab",
      explanation:
        "Todos los colaboradores cuentan con saldos de Vacaciones Dignas al día conforme al Art. 76 de la LFT.",
    },
    {
      id: "qi-5",
      question: "¿Cuáles contratos vencen este mes?",
      category: "Contratos & Vigencias",
      headline: "2 contratos en periodo de prueba próximos a vencer",
      metric: "2 contratos",
      metricSubtitle: "Requieren renovación a planta",
      badge: "Alerta Preventiva",
      explanation:
        "Se recomienda revisar el pase a contrato por tiempo indeterminado para el área de Front Desk y Cocina.",
    },
  ];

  const reportCatalog: ReportItemDefinition[] = [
    {
      id: "asistencia_mensual",
      title: "1. Reporte Mensual de Asistencia",
      category: "operaciones",
      description: "Entradas por GPS/QR, puntualidad individual, retardos y asistencias efectivas.",
      iconName: "Clock",
      recommendedFrequency: "Mensual / Quincenal",
      fieldsIncluded: ["Nombre", "Puesto", "Días Presente", "Retardos", "% Puntualidad", "Método GPS/QR"],
    },
    {
      id: "horas_trabajadas",
      title: "2. Reporte de Horas Trabajadas & Extras",
      category: "operaciones",
      description: "Desglose de horas regulares de jornada, horas extras dobles/triples autorizadas.",
      iconName: "Clock",
      recommendedFrequency: "Quincenal",
      fieldsIncluded: ["Colaborador", "Horas Regulares", "Horas Extras", "Tarifa LFT", "Importe Extra"],
    },
    {
      id: "faltas_retardos",
      title: "3. Reporte de Faltas, Retardos & Tolerancias",
      category: "operaciones",
      description: "Bitácora de inasistencias justificadas/injustificadas y minutos de demora acumulados.",
      iconName: "UserX",
      recommendedFrequency: "Semanal",
      fieldsIncluded: ["Fecha", "Colaborador", "Tipo Incidencia", "Minutos Retardo", "Justificante IMSS"],
    },
    {
      id: "rotacion_personal",
      title: "4. Reporte de Rotación de Personal (Turnover)",
      category: "talento",
      description: "Análisis de retención, índice de rotación voluntaria e involuntaria y motivos de baja.",
      iconName: "RotateCcw",
      recommendedFrequency: "Trimestral",
      fieldsIncluded: ["Plantilla Inicial", "Altas", "Bajas", "Índice Rotación %", "Antigüedad Promedio"],
    },
    {
      id: "vacaciones_lft",
      title: "5. Reporte de Vacaciones & Saldos LFT",
      category: "talento",
      description: "Días por ley por antigüedad (Vacaciones Dignas), días disfrutados y saldo disponible.",
      iconName: "Plane",
      recommendedFrequency: "Mensual",
      fieldsIncluded: ["Colaborador", "Antigüedad LFT", "Días por Ley", "Gozados", "Saldo Disponible"],
    },
    {
      id: "incidencias_clima",
      title: "6. Bitácora de Incidencias & Reconocimientos",
      category: "legal",
      description: "Registro de las 8 categorías: actas administrativas, accidentes, quejas y reconocimientos.",
      iconName: "ShieldAlert",
      recommendedFrequency: "Mensual",
      fieldsIncluded: ["Fecha", "Categoría", "Colaborador", "Severidad", "Supervisor", "Evidencias"],
    },
    {
      id: "censo_plantilla",
      title: "7. Censo de Plantilla & Estructura Organizacional",
      category: "talento",
      description: "Directorio activo, puestos, departamentos, sucursales y tipos de contrato.",
      iconName: "Users",
      recommendedFrequency: "Mensual",
      fieldsIncluded: ["Nombre", "Puesto", "Departamento", "Salario Bruto", "Tipo Contrato", "Contacto"],
    },
    {
      id: "costos_nomina",
      title: "8. Estimación de Costos de Personal & Nómina",
      category: "finanzas",
      description: "Masa salarial bruta, bonificaciones, horas extras y desglose presupuestal.",
      iconName: "CreditCard",
      recommendedFrequency: "Quincenal",
      fieldsIncluded: ["Sueldo Base", "Bonos", "Horas Extra", "Deducciones", "Neto Dispersado"],
    },
  ];

  const handleDownloadReport = (report: ReportItemDefinition) => {
    setIsExporting(report.id);
    setTimeout(() => {
      setIsExporting(null);
      toast.success(`${report.title} descargado con éxito`, {
        description: `Se generó el archivo en formato Excel/CSV para el periodo seleccionado (${selectedPeriod}).`,
      });
    }, 1000);
  };

  const activeInsight = quickInsights[activeInsightIndex];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/company"
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver al Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="size-7 text-primary" />
            <span>Centro de Reportes & Analítica de Personal</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {`Descarga los 8 reportes oficiales de RH y consulta insights inteligentes en 1 clic.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Select value={selectedPeriod} onValueChange={(val) => val && setSelectedPeriod(val)}>
            <SelectTrigger className="h-10 w-44 rounded-xl bg-background border-border/80 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="este_mes">Este Mes (Junio 2026)</SelectItem>
              <SelectItem value="mes_anterior">Mes Anterior (Mayo 2026)</SelectItem>
              <SelectItem value="q2_2026">Segundo Trimestre (Q2)</SelectItem>
              <SelectItem value="anual_2026">Acumulado Anual 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* WIDGET: CONSULTAS RÁPIDAS INTELIGENTES */}
      <Card className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-background to-primary/5 p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              Asistente de Consultas Rápidas para el Empresario
            </h3>
          </div>
          <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2.5 py-0.5">
            Analítica Instantánea
          </Badge>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {quickInsights.map((qi, idx) => (
            <button
              key={qi.id}
              type="button"
              onClick={() => setActiveInsightIndex(idx)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer",
                activeInsightIndex === idx
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background/80 hover:bg-muted text-muted-foreground border-border/60"
              )}
            >
              {qi.question}
            </button>
          ))}
        </div>

        {/* Active Insight Response Card */}
        <div className="p-5 rounded-2xl bg-card border border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs animate-in fade-in">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold border-border/70">
                {activeInsight.category}
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold">
                {activeInsight.badge}
              </Badge>
            </div>

            <h4 className="text-base sm:text-lg font-extrabold text-foreground">
              {activeInsight.headline}
            </h4>

            <p className="text-xs text-muted-foreground font-medium max-w-2xl leading-relaxed">
              {activeInsight.explanation}
            </p>

            {activeInsight.employeeHighlight && (
              <div className="pt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/dashboard/company/employees/${activeInsight.employeeHighlight.employeeId}`} />}
                  className="rounded-xl text-xs font-bold h-8 px-3 border-border/70 text-primary hover:bg-primary/10"
                >
                  <span>Ver Expediente 360 de {activeInsight.employeeHighlight.name}</span>
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center min-w-44 shrink-0 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase block">
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

      {/* CATÁLOGO DE LOS 8 REPORTES DESCARGABLES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Catálogo de Reportes Oficiales de Recursos Humanos
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Archivos consolidados listos para auditorías IMSS, contabilidad y dirección.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportCatalog.map((report) => (
            <Card
              key={report.id}
              className="rounded-2xl border border-border/50 bg-card p-5 space-y-4 hover:border-border transition-all flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-foreground">
                    {report.title}
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-bold border-border/60">
                    {report.recommendedFrequency}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {report.description}
                </p>

                <div className="pt-2 border-t border-border/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                    Columnas incluidas:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {report.fieldsIncluded.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/40 text-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Formato: .XLSX / .CSV / .PDF
                </span>

                <Button
                  size="sm"
                  onClick={() => handleDownloadReport(report)}
                  disabled={isExporting === report.id}
                  className="rounded-xl text-xs font-bold h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
                >
                  <Download className="size-3.5" />
                  <span>{isExporting === report.id ? "Generando..." : "Descargar Reporte"}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
