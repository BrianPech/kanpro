"use client";

import * as React from "react";
import {
  Star,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  Clock,
  CheckCircle2,
  MessageSquare,
  Award,
  Calendar,
  Briefcase,
  User,
  ShieldCheck,
  Building2,
  Check,
} from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeEvaluation } from "../../types/evaluations";

interface EvaluationDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EmployeeEvaluation | null;
}

export function EvaluationDetailsModal({
  isOpen,
  onOpenChange,
  evaluation,
}: EvaluationDetailsModalProps) {
  if (!evaluation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Ficha de Evaluación 360 descargada", {
      description: `Reporte de desempeño de ${evaluation.employeeName} (${evaluation.period}).`,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const competencies = [
    {
      label: "Puntualidad & Compromiso de Horario",
      score: evaluation.punctualityScore,
      icon: <Clock className="size-4 text-primary" />,
      description: "Apego al horario de entrada y cumplimiento de turnos asignados.",
    },
    {
      label: "Asistencia & Disponibilidad",
      score: evaluation.attendanceScore,
      icon: <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />,
      description: "Constancia operativa y cumplimiento regular sin ausencias injustificadas.",
    },
    {
      label: "Productividad & Calidad de Trabajo",
      score: evaluation.productivityScore,
      icon: <TrendingUp className="size-4 text-indigo-600 dark:text-indigo-400" />,
      description: "Eficiencia en ejecución de tareas y apego a estándares de calidad.",
    },
    {
      label: "Trabajo en Equipo & Colaboración",
      score: evaluation.teamworkScore,
      icon: <Users className="size-4 text-primary" />,
      description: "Disposición para apoyar a compañeros y clima laboral positivo.",
    },
    {
      label: "Atención al Cliente & Comunicación",
      score: evaluation.customerServiceScore,
      icon: <MessageSquare className="size-4 text-amber-500" />,
      description: "Trato empático con clientes internos/externos y comunicación clara.",
    },
    {
      label: "Cumplimiento de Metas y Objetivos",
      score: evaluation.goalsScore,
      icon: <Target className="size-4 text-rose-500" />,
      description: "Logro de metas cuantitativas y proyectos del periodo evaluado.",
    },
  ];

  const isOutstanding = evaluation.averageScore >= 4.7;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:!max-w-[840px] md:!max-w-[900px] lg:!max-w-[960px] rounded-3xl p-0 overflow-hidden bg-card border-border/80 shadow-2xl !flex !flex-col h-[85vh] max-h-[820px] !gap-0 font-sans">
        
        {/* 1. Header Fijo y Espacioso */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 bg-muted/20 shrink-0 pr-14 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Perfil Header */}
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="size-13 rounded-2xl border-2 border-border/50 shadow-sm shrink-0">
                <AvatarImage
                  src={evaluation.avatarUrl || undefined}
                  alt={evaluation.employeeName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl font-extrabold text-sm bg-primary/10 text-primary">
                  {getInitials(evaluation.employeeName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg sm:text-xl font-[800] text-foreground tracking-tight">
                    {evaluation.employeeName}
                  </DialogTitle>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-extrabold text-xs font-mono select-none",
                      isOutstanding
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : "bg-primary/10 text-primary border border-primary/20"
                    )}
                  >
                    <Star className="size-3.5 fill-amber-500 text-amber-500" />
                    <span>{evaluation.averageScore.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <DialogDescription className="text-xs text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {evaluation.jobTitle}
                  </span>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-2 py-0 border-border/30 bg-muted/40"
                  >
                    {evaluation.department}
                  </Badge>
                  <span>•</span>
                  <span>Evaluador: {evaluation.evaluatorName}</span>
                </DialogDescription>
              </div>
            </div>

            {/* Quick Period Badge */}
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-3 py-1">
                {evaluation.period}
              </Badge>
              <span className="text-[11px] text-muted-foreground font-medium mt-1">
                {evaluation.evaluationDate}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* 2. Contenedor de ScrollArea con Altura Restringida */}
        <div className="flex-1 min-h-0 h-full relative overflow-hidden bg-background">
          <ScrollArea className="h-full w-full">
            <div className="p-5 sm:p-6 space-y-6">
            
            {/* Seccion 1: Competencias Evaluadas (2 Column Grid) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Award className="size-4 text-primary" />
                  <span>Desglose de Competencias Evaluadas (1–5)</span>
                </h4>
                <span className="text-xs text-muted-foreground font-semibold">
                  Promedio ponderado: <strong>{evaluation.averageScore.toFixed(1)}/5.0</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {competencies.map((comp) => (
                  <div
                    key={comp.label}
                    className="p-3.5 rounded-2xl bg-muted/20 border border-border/40 hover:border-border/70 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-8 rounded-xl bg-background border border-border/40 flex items-center justify-center shrink-0">
                          {comp.icon}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-foreground truncate">
                            {comp.label}
                          </h5>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {comp.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold font-mono text-foreground px-2 py-0.5 rounded-md bg-muted/40 shrink-0">
                        {comp.score}.0 / 5
                      </span>
                    </div>

                    <Progress
                      value={(comp.score / 5) * 100}
                      className="h-2 rounded-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Seccion 2: Feedback Cualitativo & Desarrollo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Fortalezas Destacadas */}
              <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <Star className="size-4 fill-amber-500" />
                  <span>Fortalezas Destacadas</span>
                </div>

                <ul className="space-y-2 text-xs">
                  {evaluation.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground font-semibold">
                      <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Áreas de Oportunidad */}
              <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary">
                  <Sparkles className="size-4" />
                  <span>Áreas de Oportunidad & Desarrollo</span>
                </div>

                {evaluation.growthAreas.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {evaluation.growthAreas.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground font-semibold">
                        <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5 inline-block" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Sin áreas críticas detectadas en el periodo.
                  </p>
                )}
              </Card>
            </div>

            {/* Seccion 3: Plan de Formación y Objetivos */}
            <Card className="bg-card border border-border/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground">
                  <Target className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Plan de Capacitación y Metas del Periodo</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    Plan de Desarrollo Humano:
                  </span>
                  <p className="text-foreground font-semibold">
                    {evaluation.developmentPlan || "Capacitación continua en procesos internos."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Cumplimiento de Metas:
                  </span>
                  <p className="text-foreground font-semibold">
                    {evaluation.goalsAchieved || "100% de metas del periodo alcanzadas."}
                  </p>
                </div>
              </div>

              {evaluation.comments && (
                <div className="pt-2 border-t border-border/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Comentarios del Evaluador ({evaluation.evaluatorName}):
                  </span>
                  <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">
                    &ldquo;{evaluation.comments}&rdquo;
                  </p>
                </div>
              )}
            </Card>
          </div>
        </ScrollArea>
        </div>

        {/* 3. Footer Operativo */}
        <DialogFooter className="p-4 px-6 border-t border-border/40 bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl text-xs font-semibold h-9 px-3.5 border-border/60 hover:bg-muted cursor-pointer gap-1.5"
            >
              <Printer className="size-3.5 text-muted-foreground" />
              <span>Imprimir Ficha</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="rounded-xl text-xs font-semibold h-9 px-3.5 border-border/60 hover:bg-muted cursor-pointer gap-1.5"
            >
              <Download className="size-3.5 text-muted-foreground" />
              <span>Descargar PDF</span>
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer w-full sm:w-auto"
          >
            Cerrar Ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
