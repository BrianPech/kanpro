"use client";

import React, { useState } from "react";
import {
  Star,
  Sparkles,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  User,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  Download,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeEvaluation } from "../types/evaluations";
import { EvaluationFormModal } from "./evaluations/evaluation-form-modal";
import { EvaluationDetailsModal } from "./evaluations/evaluation-details-modal";

interface EvaluationsViewProps {
  initialEvaluations?: EmployeeEvaluation[];
  companyName?: string;
}

export function EvaluationsView({
  initialEvaluations,
  companyName = "Mi Empresa",
}: EvaluationsViewProps) {
  const [evaluations, setEvaluations] = useState<EmployeeEvaluation[]>(
    initialEvaluations || [
      {
        id: "eval-001",
        employeeId: "emp-001",
        employeeName: "Carlos Mendoza",
        jobTitle: "Supervisor de Mantenimiento",
        department: "Operaciones",
        period: "Q2 2026 - Evaluación Trimestral",
        evaluationDate: "2026-06-15",
        evaluatorName: "Lic. Andrea Garza Ramos",
        evaluatorRole: "Directora de Operaciones",
        punctualityScore: 5,
        attendanceScore: 5,
        productivityScore: 5,
        teamworkScore: 5,
        customerServiceScore: 4,
        goalsScore: 5,
        averageScore: 4.8,
        strengths: ["Liderazgo técnico", "Apego a normas de seguridad", "Resolución de problemas"],
        growthAreas: ["Optimizar tiempos de reporte administrativo"],
        developmentPlan: "Certificación en control electromecánico avanzado",
        goalsAchieved: "98% del plan de mantenimiento preventivo ejecutado",
        comments: "Colaborador con alto sentido de pertenencia y compromiso.",
        status: "completada",
      },
      {
        id: "eval-002",
        employeeId: "emp-002",
        employeeName: "Mariana Silva",
        jobTitle: "Capitán de Meseros",
        department: "Alimentos y Bebidas",
        period: "Q2 2026 - Evaluación Trimestral",
        evaluationDate: "2026-06-18",
        evaluatorName: "Lic. Andrea Garza Ramos",
        evaluatorRole: "Gerente de Restaurante",
        punctualityScore: 4,
        attendanceScore: 5,
        productivityScore: 5,
        teamworkScore: 5,
        customerServiceScore: 5,
        goalsScore: 4,
        averageScore: 4.7,
        strengths: ["Excelente trato al comensal", "Manejo impecable del equipo de salón"],
        growthAreas: ["Puntualidad en turnos matutinos"],
        developmentPlan: "Taller de coaching para supervisores de servicio",
        goalsAchieved: "Calificación de satisfacción del cliente en 4.9/5",
        comments: "Gran desempeño y liderazgo positivo.",
        status: "completada",
      },
      {
        id: "eval-003",
        employeeId: "emp-003",
        employeeName: "Alejandro Ruiz",
        jobTitle: "Cocinero A",
        department: "Cocina & Producción",
        period: "Q2 2026 - Evaluación Trimestral",
        evaluationDate: "2026-06-20",
        evaluatorName: "Chef Ejecutivo",
        evaluatorRole: "Chef Principal",
        punctualityScore: 5,
        attendanceScore: 5,
        productivityScore: 4,
        teamworkScore: 4,
        customerServiceScore: 4,
        goalsScore: 5,
        averageScore: 4.5,
        strengths: ["Dominio de técnicas culinarias", "Control de mermas"],
        growthAreas: ["Comunicación interdepartamental"],
        developmentPlan: "Curso de estandarización de recetas y costos",
        goalsAchieved: "Reducción del 5% en desperdicios de cocina",
        comments: "Muy proactivo y limpio en sus estaciones.",
        status: "completada",
      },
    ]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EmployeeEvaluation | null>(null);

  const filteredEvaluations = evaluations.filter((ev) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      ev.employeeName.toLowerCase().includes(query) ||
      ev.jobTitle.toLowerCase().includes(query) ||
      ev.department.toLowerCase().includes(query);

    const matchesDept = deptFilter === "all" ? true : ev.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(evaluations.map((e) => e.department)));
  const globalAverage =
    evaluations.length > 0
      ? (evaluations.reduce((acc, curr) => acc + curr.averageScore, 0) / evaluations.length).toFixed(1)
      : "5.0";

  const handleEvaluationCreated = (newEval: EmployeeEvaluation) => {
    setEvaluations((prev) => [newEval, ...prev]);
  };

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
            <Star className="size-7 text-amber-500 fill-amber-500" />
            <span>Evaluación del Desempeño 360</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {`Herramienta de apoyo al desarrollo humano, evaluación de 6 competencias y planes de mejora.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="rounded-xl text-xs font-bold h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>Nueva Evaluación</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Promedio de Empresa</span>
            <Sparkles className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-1.5">
            <Star className="size-6 text-amber-500 fill-amber-500" />
            <span>{globalAverage} / 5.0</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Índice general de desempeño
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Evaluaciones Realizadas</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {evaluations.length}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Colaboradores evaluados este trimestre
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Competencia Más Fuerte</span>
            <TrendingUp className="size-4 text-primary" />
          </div>
          <div className="text-xl font-extrabold text-primary truncate">
            Trabajo en Equipo
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            4.9 / 5.0 promedio global
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Enfoque de Desarrollo</span>
            <Badge className="bg-primary/10 text-primary border-none text-[10px]">
              Formativo
            </Badge>
          </div>
          <div className="text-xl font-extrabold text-foreground">
            100% Crecimiento
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Herramienta orientada a mentoring
          </p>
        </Card>
      </div>

      {/* Main Evaluations List */}
      <Card className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador, cargo o departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <Select
            value={deptFilter}
            onValueChange={(val) => val && setDeptFilter(val)}
          >
            <SelectTrigger className="h-10 w-44 rounded-xl bg-background border-border/80 text-xs font-medium">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredEvaluations.length === 0 ? (
          <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
            <p className="text-xs text-muted-foreground">
              No se encontraron evaluaciones que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvaluations.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-border/50 bg-background hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <Avatar className="size-11 rounded-xl shrink-0 border border-border/40">
                    <AvatarImage src={ev.avatarUrl || ""} />
                    <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                      {ev.employeeName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-foreground truncate">
                        {ev.employeeName}
                      </h4>
                      <span className="text-xs text-muted-foreground font-medium">
                        • {ev.jobTitle} ({ev.department})
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-border/60">
                        {ev.period}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold flex-wrap">
                      <span>Evaluador: {ev.evaluatorName}</span>
                      <span>•</span>
                      <span>Fecha: {ev.evaluationDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                    <Star className="size-4 fill-amber-500 text-amber-500" />
                    <span>{ev.averageScore} / 5.0</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedEvaluation(ev)}
                    className="h-9 px-3 rounded-xl text-xs font-bold border-border/70 flex items-center gap-1"
                  >
                    <Eye className="size-3.5" />
                    <span>Ver Ficha 360</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    render={<Link href={`/dashboard/company/employees/${ev.employeeId}`} />}
                    className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    <span>Ver Expediente</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal 1: New Evaluation Form */}
      <EvaluationFormModal
        isOpen={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        onEvaluationCreated={handleEvaluationCreated}
      />

      {/* Modal 2: Details Modal */}
      <EvaluationDetailsModal
        isOpen={!!selectedEvaluation}
        onOpenChange={(open) => !open && setSelectedEvaluation(null)}
        evaluation={selectedEvaluation}
      />
    </div>
  );
}
