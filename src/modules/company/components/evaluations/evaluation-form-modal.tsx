"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeEvaluation } from "../../types/evaluations";
import { EmployeeSelectOption } from "../../services/company-evaluations";
import { createEvaluationAction } from "../../actions/evaluations";

interface EvaluationFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEvaluationCreated: (evaluation: EmployeeEvaluation) => void;
  employees?: EmployeeSelectOption[];
  initialEmployee?: {
    id: string;
    name: string;
    jobTitle: string;
    department: string;
    avatarUrl?: string | null;
  };
}

export function EvaluationFormModal({
  isOpen,
  onOpenChange,
  onEvaluationCreated,
  employees = [],
  initialEmployee,
}: EvaluationFormModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialEmployee?.id || (employees.length > 0 ? employees[0].id : "custom")
  );
  const [employeeName, setEmployeeName] = useState(
    initialEmployee?.name || (employees.length > 0 ? employees[0].name : "")
  );
  const [jobTitle, setJobTitle] = useState(
    initialEmployee?.jobTitle || (employees.length > 0 ? employees[0].jobTitle : "")
  );
  const [department, setDepartment] = useState(
    initialEmployee?.department || (employees.length > 0 ? employees[0].department : "")
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialEmployee?.avatarUrl || (employees.length > 0 ? employees[0].avatarUrl || null : null)
  );

  const [period, setPeriod] = useState("Q2 2026 - Evaluación de Desempeño");
  const [evaluatorName, setEvaluatorName] = useState("Lic. Andrea Garza (Dirección)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 6 Competencies (1 to 5)
  const [punctuality, setPunctuality] = useState(5);
  const [attendance, setAttendance] = useState(5);
  const [productivity, setProductivity] = useState(5);
  const [teamwork, setTeamwork] = useState(5);
  const [customerService, setCustomerService] = useState(5);
  const [goals, setGoals] = useState(5);

  // Qualitative
  const [strengths, setStrengths] = useState(
    "Excelente liderazgo, apego a estándares de seguridad y resolución rápida de incidencias."
  );
  const [growthAreas, setGrowthAreas] = useState(
    "Optimizar el tiempo de entrega de reportes administrativos y control de inventarios."
  );
  const [developmentPlan, setDevelopmentPlan] = useState(
    "Capacitación en software de gestión preventiva y mentoring para mandos medios."
  );
  const [goalsAchieved, setGoalsAchieved] = useState(
    "Cumplimiento del 96% en el programa de trabajo preventivo."
  );
  const [comments, setComments] = useState(
    "Colaborador con gran disposición al crecimiento interno y compromiso."
  );

  // Synchronize when initialEmployee or employees change
  useEffect(() => {
    if (initialEmployee) {
      setSelectedEmployeeId(initialEmployee.id);
      setEmployeeName(initialEmployee.name);
      setJobTitle(initialEmployee.jobTitle);
      setDepartment(initialEmployee.department);
      setAvatarUrl(initialEmployee.avatarUrl || null);
    } else if (employees.length > 0 && selectedEmployeeId === "custom") {
      const first = employees[0];
      setSelectedEmployeeId(first.id);
      setEmployeeName(first.name);
      setJobTitle(first.jobTitle);
      setDepartment(first.department);
      setAvatarUrl(first.avatarUrl || null);
    }
  }, [initialEmployee, employees]);

  const handleSelectEmployee = (val: string | null) => {
    if (!val) return;
    setSelectedEmployeeId(val);
    if (val === "custom") {
      setEmployeeName("");
      setJobTitle("");
      setDepartment("");
      setAvatarUrl(null);
      return;
    }

    const emp = employees.find((e) => e.id === val);
    if (emp) {
      setEmployeeName(emp.name);
      setJobTitle(emp.jobTitle);
      setDepartment(emp.department);
      setAvatarUrl(emp.avatarUrl || null);
    }
  };

  const averageScore =
    Math.round(
      ((punctuality + attendance + productivity + teamwork + customerService + goals) / 6) * 10
    ) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      toast.error("Por favor ingresa o selecciona el nombre del colaborador.");
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedStrengths = strengths
        .split(".")
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedGrowthAreas = growthAreas
        .split(".")
        .map((g) => g.trim())
        .filter(Boolean);

      const targetEmployeeId =
        selectedEmployeeId !== "custom" && selectedEmployeeId ? selectedEmployeeId : undefined;

      const result = await createEvaluationAction({
        employeeId: targetEmployeeId,
        employeeName: employeeName.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        avatarUrl: avatarUrl || null,
        period,
        evaluatorName,
        evaluatorRole: "Evaluador Directo",
        punctualityScore: punctuality,
        attendanceScore: attendance,
        productivityScore: productivity,
        teamworkScore: teamwork,
        customerServiceScore: customerService,
        goalsScore: goals,
        strengths: parsedStrengths,
        growthAreas: parsedGrowthAreas,
        developmentPlan,
        goalsAchieved,
        comments,
        status: "completada",
      });

      if (!result.success) {
        toast.error("No se pudo registrar la evaluación", {
          description: result.error || "Ocurrió un error inesperado.",
        });
        return;
      }

      const newEval: EmployeeEvaluation = {
        id: result.evaluationId || `eval-${Date.now()}`,
        employeeId: targetEmployeeId || `emp-${Date.now()}`,
        employeeName: employeeName.trim(),
        avatarUrl,
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
        averageScore: result.averageScore || averageScore,
        strengths: parsedStrengths,
        growthAreas: parsedGrowthAreas,
        developmentPlan,
        goalsAchieved,
        comments,
        status: "completada",
      };

      onEvaluationCreated(newEval);
      toast.success("Evaluación 360 registrada con éxito", {
        description: `Se guardó en la base de datos para ${employeeName} (${result.averageScore || averageScore}/5.0 ⭐).`,
      });

      onOpenChange(false);
    } catch (err: any) {
      console.error("Error creating evaluation:", err);
      toast.error("Error al guardar la evaluación", {
        description: err?.message || "Ocurrió un problema de conexión.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            {/* Employee Selector if list available */}
            {employees.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Seleccionar de la Plantilla de Colaboradores
                </Label>
                <Select
                  value={selectedEmployeeId}
                  onValueChange={handleSelectEmployee}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue placeholder="Elige un colaborador..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <span className="font-bold text-foreground">{emp.name}</span>
                        <span className="text-muted-foreground ml-2">
                          — {emp.jobTitle} ({emp.department})
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <span className="italic text-muted-foreground">
                        + Ingresar otro colaborador manualmente
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Colaborador & Puesto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Nombre del Colaborador *</Label>
                <Input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Puesto / Cargo</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ej. Barista, Técnico, Chef..."
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                />
              </div>
            </div>

            {/* Departamento & Periodo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Departamento</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ej. Operaciones, Alimentos y Bebidas..."
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Periodo de Evaluación</Label>
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ej. Q2 2026 - Evaluación Trimestral"
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
                {renderStarSelector(
                  "1. Puntualidad & Horario",
                  punctuality,
                  setPunctuality,
                  <Clock className="size-3.5" />
                )}
                {renderStarSelector(
                  "2. Asistencia & Turno",
                  attendance,
                  setAttendance,
                  <CheckCircle2 className="size-3.5" />
                )}
                {renderStarSelector(
                  "3. Productividad & Eficiencia",
                  productivity,
                  setProductivity,
                  <TrendingUp className="size-3.5" />
                )}
                {renderStarSelector(
                  "4. Trabajo en Equipo",
                  teamwork,
                  setTeamwork,
                  <Users className="size-3.5" />
                )}
                {renderStarSelector(
                  "5. Atención & Comunicación",
                  customerService,
                  setCustomerService,
                  <MessageSquare className="size-3.5" />
                )}
                {renderStarSelector(
                  "6. Cumplimiento de Metas",
                  goals,
                  setGoals,
                  <Target className="size-3.5" />
                )}
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Plan de Desarrollo & Metas para el Próximo Periodo
                </Label>
                <Input
                  value={developmentPlan}
                  onChange={(e) => setDevelopmentPlan(e.target.value)}
                  placeholder="Ej. Certificación en manejo de alimentos / Curso de liderazgo..."
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Guardando en BD...
                </>
              ) : (
                "Guardar Evaluación"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
