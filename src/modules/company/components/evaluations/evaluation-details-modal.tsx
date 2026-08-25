"use client";

import React from "react";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    toast.success("Ficha de Evaluación descargada", {
      description: `Reporte de desempeño de ${evaluation.employeeName} (${evaluation.period}).`,
    });
  };

  const competencies = [
    { label: "Puntualidad & Compromiso de Horario", score: evaluation.punctualityScore, icon: <Clock className="size-3.5" /> },
    { label: "Asistencia & Cumplimiento de Turno", score: evaluation.attendanceScore, icon: <CheckCircle2 className="size-3.5" /> },
    { label: "Productividad & Eficiencia", score: evaluation.productivityScore, icon: <TrendingUp className="size-3.5" /> },
    { label: "Trabajo en Equipo & Colaboración", score: evaluation.teamworkScore, icon: <Users className="size-3.5" /> },
    { label: "Atención al Cliente & Comunicación", score: evaluation.customerServiceScore, icon: <MessageSquare className="size-3.5" /> },
    { label: "Cumplimiento de Metas y Objetivos", score: evaluation.goalsScore, icon: <Target className="size-3.5" /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2.5 py-0.5 rounded-lg">
                {evaluation.period}
              </Badge>
              <div className="flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-lg font-extrabold text-xs">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                <span>{evaluation.averageScore} / 5.0 ⭐</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl text-xs font-bold h-8 px-2.5 border-border/70 flex items-center gap-1"
              >
                <Printer className="size-3.5" />
                <span>Imprimir</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="rounded-xl text-xs font-bold h-8 px-2.5 border-border/70 flex items-center gap-1"
              >
                <Download className="size-3.5" />
                <span>PDF</span>
              </Button>
            </div>
          </div>

          <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
            {evaluation.employeeName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {evaluation.jobTitle} • {evaluation.department} • Evaluador: {evaluation.evaluatorName}
          </DialogDescription>
        </DialogHeader>

        {/* Competencies Progress Bars */}
        <div className="space-y-4 pt-1">
          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            Desglose de Competencias Evaluadas
          </h4>

          <div className="space-y-3">
            {competencies.map((comp) => (
              <div key={comp.label} className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="text-primary">{comp.icon}</span>
                    {comp.label}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                    {comp.score}.0 / 5.0
                  </span>
                </div>
                <Progress value={(comp.score / 5) * 100} className="h-2 rounded-full" />
              </div>
            ))}
          </div>

          {/* Qualitative Feedback */}
          <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-3 text-xs">
            <div>
              <span className="font-extrabold text-foreground block mb-1">
                ⭐ Fortalezas Destacadas:
              </span>
              <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground font-medium">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            {evaluation.growthAreas.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <span className="font-extrabold text-foreground block mb-1">
                  🌱 Áreas de Oportunidad & Desarrollo:
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground font-medium">
                  {evaluation.growthAreas.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.comments && (
              <div className="pt-2 border-t border-border/40">
                <span className="font-extrabold text-foreground block mb-0.5">
                  Comentarios del Evaluador:
                </span>
                <p className="text-muted-foreground italic font-medium">
                  &quot;{evaluation.comments}&quot;
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/40 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 px-5"
          >
            Cerrar Ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
