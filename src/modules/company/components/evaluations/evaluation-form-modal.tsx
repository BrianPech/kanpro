"use client";

import React, { useState } from "react";
import {
  Star,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  TrendingUp,
  User,
  Building2,
  Clock,
  Target,
  Users,
  MessageSquare,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeEvaluation } from "../../types/evaluations";

interface EvaluationFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEvaluationCreated: (evaluation: EmployeeEvaluation) => void;
  initialEmployee?: {
    id: string;
    name: string;
    jobTitle: string;
    department: string;
  };
}

export function EvaluationFormModal({
  isOpen,
  onOpenChange,
  onEvaluationCreated,
  initialEmployee,
}: EvaluationFormModalProps) {
  const [employeeName, setEmployeeName] = useState(initialEmployee?.name || "Carlos Mendoza");
  const [jobTitle, setJobTitle] = useState(initialEmployee?.jobTitle || "Supervisor de Mantenimiento");
  const [department, setDepartment] = useState(initialEmployee?.department || "Operaciones");
  const [period, setPeriod] = useState("Q2 2026 - Evaluación de Desempeño");
  const [evaluatorName, setEvaluatorName] = useState("Lic. Andrea Garza (Dirección)");

  // 6 Competencies (1 to 5)
  const [punctuality, setPunctuality] = useState(5);
  const [attendance, setAttendance] = useState(5);
  const [productivity, setProductivity] = useState(4);
  const [teamwork, setTeamwork] = useState(5);
  const [customerService, setCustomerService] = useState(4);
  const [goals, setGoals] = useState(5);

  // Qualitative
  const [strengths, setStrengths] = useState("Excelente liderazgo, apego a estándares de seguridad y resolución rápida de incidencias.");
  const [growthAreas, setGrowthAreas] = useState("Optimizar el tiempo de entrega de reportes administrativos y control de inventarios.");
  const [developmentPlan, setDevelopmentPlan] = useState("Capacitación en software de gestión preventiva y mentoring para mandos medios.");
  const [goalsAchieved, setGoalsAchieved] = useState("Cumplimiento del 96% en el programa de mantenimiento preventivo.");
  const [comments, setComments] = useState("Colaborador ejemplar con gran disposición al crecimiento interno.");

  const averageScore = Math.round(
    ((punctuality + attendance + productivity + teamwork + customerService + goals) / 6) * 10
  ) / 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      toast.error("Por favor ingresa el nombre del colaborador.");
      return;
    }

    const newEval: EmployeeEvaluation = {
      id: `eval-${Date.now()}`,
      employeeId: initialEmployee?.id || `emp-${Date.now()}`,
      employeeName: employeeName.trim(),
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      period,
      evaluationDate: new Date().toISOString().split("T")[0],
      evaluatorName,
      evaluatorRole: "Evaluador Directo",
      punctualityScore: punctuality,
      attendanceScore: attendance,
      productivityScore: productivity,
      teamworkScore: teamwork,
      customerServiceScore: customerService,
      goalsScore: goals,
      averageScore,
      strengths: strengths.split(".").map((s) => s.trim()).filter(Boolean),
      growthAreas: growthAreas.split(".").map((g) => g.trim()).filter(Boolean),
      developmentPlan,
      goalsAchieved,
      comments,
      status: "completada",
    };

    onEvaluationCreated(newEval);
    toast.success("Evaluación de desempeño registrada", {
      description: `Se guardó la evaluación para ${employeeName} con promedio de ${averageScore}/5.0 ⭐.`,
    });

    onOpenChange(false);
  };

  const renderStarSelector = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    icon: React.ReactNode
  ) => (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-xs font-bold text-foreground truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 text-muted-foreground/40 hover:text-amber-500 transition-colors"
          >
            <Star
              className={cn(
                "size-4 transition-all",
                star <= value
                  ? "fill-amber-500 text-amber-500 scale-110"
                  : "text-muted-foreground/30 hover:scale-110"
              )}
            />
          </button>
        ))}
        <span className="text-xs font-extrabold text-foreground ml-1.5 w-6 text-center">
          {value}.0
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="size-3.5 text-primary" />
                <span>Desarrollo de Talento 360</span>
              </div>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-none text-xs font-extrabold px-2.5 py-0.5">
                Promedio: {averageScore} / 5.0 ⭐
              </Badge>
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              Nueva Evaluación de Desempeño
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Herramienta de retroalimentación orientada al crecimiento y desarrollo del colaborador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Colaborador & Periodo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Colaborador *</Label>
                <Input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Puesto / Cargo</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                />
              </div>
            </div>

            {/* 6 Competencies Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-foreground uppercase tracking-wider block">
                Calificación por Competencias (1 a 5 Estrellas)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {renderStarSelector("1. Puntualidad & Horario", punctuality, setPunctuality, <Clock className="size-3.5" />)}
                {renderStarSelector("2. Asistencia & Turno", attendance, setAttendance, <CheckCircle2 className="size-3.5" />)}
                {renderStarSelector("3. Productividad & Eficiencia", productivity, setProductivity, <TrendingUp className="size-3.5" />)}
                {renderStarSelector("4. Trabajo en Equipo", teamwork, setTeamwork, <Users className="size-3.5" />)}
                {renderStarSelector("5. Atención & Comunicación", customerService, setCustomerService, <MessageSquare className="size-3.5" />)}
                {renderStarSelector("6. Cumplimiento de Metas", goals, setGoals, <Target className="size-3.5" />)}
              </div>
            </div>

            {/* Qualitative Notes */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Fortalezas Destacadas
                </Label>
                <Input
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Ej. Gran liderazgo, iniciativa y compromiso..."
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Áreas de Oportunidad & Plan de Capacitación
                </Label>
                <Textarea
                  value={growthAreas}
                  onChange={(e) => setGrowthAreas(e.target.value)}
                  placeholder="Aspectos constructivos para fortalecer en el siguiente ciclo..."
                  className="min-h-[65px] rounded-xl bg-background border-border/80 text-xs resize-none font-medium"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              Guardar Evaluación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
