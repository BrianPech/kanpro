"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getMexicoDateISO } from "@/lib/formatters";
import { ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Sparkles } from "@/components/ui/icons";
import { EmployeeSelectOption } from "../../services/company-evaluations";
import { Nom035Survey, Nom035RiskLevel, Nom035GuideType } from "../../types/evaluations";
import { createNom035SurveyAction } from "../../actions/evaluations";
import { cn } from "@/lib/utils";

interface Nom035SurveyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeSelectOption[];
  onSurveyCreated: (survey: Nom035Survey) => void;
}

export function Nom035SurveyModal({
  isOpen,
  onOpenChange,
  employees,
  onSurveyCreated,
}: Nom035SurveyModalProps) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [guideType, setGuideType] = useState<Nom035GuideType>("guia_ii");
  const [surveyDate, setSurveyDate] = useState<string>(getMexicoDateISO());

  // Scores (STPS 2018 dimensions)
  const [environmentScore, setEnvironmentScore] = useState<number>(4);
  const [activityFactorsScore, setActivityFactorsScore] = useState<number>(8);
  const [timeOrganizationScore, setTimeOrganizationScore] = useState<number>(4);
  const [leadershipRelationsScore, setLeadershipRelationsScore] = useState<number>(6);
  const [organizationalClimateScore, setOrganizationalClimateScore] = useState<number>(5);

  const [actionPlan, setActionPlan] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  // Calculate total and risk level dynamically
  const totalScore =
    Number(environmentScore || 0) +
    Number(activityFactorsScore || 0) +
    Number(timeOrganizationScore || 0) +
    Number(leadershipRelationsScore || 0) +
    Number(organizationalClimateScore || 0);

  let riskLevel: Nom035RiskLevel = "bajo";
  let riskBadgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  let riskRecommendation = "Mantener condiciones actuales y difundir política de prevención.";

  if (totalScore < 20) {
    riskLevel = "nulo";
    riskBadgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    riskRecommendation = "El riesgo es nulo o despreciable. No se requieren medidas adicionales según la STPS.";
  } else if (totalScore < 45) {
    riskLevel = "bajo";
    riskBadgeColor = "bg-teal-500/10 text-teal-600 border-teal-500/20";
    riskRecommendation = "Riesgo bajo. Mantener acciones de sensibilización y clima laboral favorable.";
  } else if (totalScore < 70) {
    riskLevel = "medio";
    riskBadgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    riskRecommendation = "Riesgo medio. Revisar distribución de cargas de trabajo y comunicación con líderes de área.";
  } else if (totalScore < 90) {
    riskLevel = "alto";
    riskBadgeColor = "bg-orange-500/10 text-orange-600 border-orange-500/20";
    riskRecommendation = "Riesgo alto. Requiere programa de intervención específico y evaluación ergonómica/organizacional.";
  } else {
    riskLevel = "muy_alto";
    riskBadgeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
    riskRecommendation = "Riesgo muy alto. Implementar intervención clínica inmediata y medidas urgentes de protección STPS.";
  }

  const handleApplyRecommendation = () => {
    setActionPlan(riskRecommendation);
    toast.info("Recomendación oficial STPS aplicada al plan de acción.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId || !selectedEmployee) {
      toast.error("Por favor selecciona un empleado.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createNom035SurveyAction({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        jobTitle: selectedEmployee.jobTitle,
        department: selectedEmployee.department,
        guideType,
        surveyDate,
        environmentScore,
        activityFactorsScore,
        timeOrganizationScore,
        leadershipRelationsScore,
        organizationalClimateScore,
        actionPlan: actionPlan.trim() || riskRecommendation,
        status: "completada",
      });

      if (!res.success || !res.surveyId) {
        toast.error(res.error || "No se pudo registrar la evaluación NOM-035.");
        return;
      }

      const newSurvey: Nom035Survey = {
        id: res.surveyId,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        jobTitle: selectedEmployee.jobTitle,
        department: selectedEmployee.department,
        guideType,
        surveyDate,
        environmentScore,
        activityFactorsScore,
        timeOrganizationScore,
        leadershipRelationsScore,
        organizationalClimateScore,
        totalScore: res.totalScore || totalScore,
        riskLevel: res.riskLevel || riskLevel,
        actionPlan: actionPlan.trim() || riskRecommendation,
        status: "completada",
      };

      onSurveyCreated(newSurvey);
      toast.success("Evaluación NOM-035 guardada con éxito.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Error inesperado al guardar la evaluación NOM-035.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7">
        <DialogHeader className="space-y-1.5 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                Cédula NOM-035-STPS-2018
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Identificación de factores de riesgo psicosocial y entorno organizacional favorable.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Employee & Guide Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Empleado Evaluado *
              </Label>
              <Select value={employeeId} onValueChange={(v) => setEmployeeId(v || "")}>
                <SelectTrigger className="w-full h-10 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Seleccionar empleado">
                    {(val: string | null) => {
                      const emp = employees.find((e) => e.id === val);
                      return emp
                        ? `${emp.name} — ${emp.jobTitle} (${emp.department})`
                        : "Seleccionar empleado";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="w-(--anchor-width) min-w-[280px] max-h-60 rounded-xl">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs">
                      {emp.name} — {emp.jobTitle} ({emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Guía de Referencia STPS *
              </Label>
              <Select
                value={guideType}
                onValueChange={(v) => setGuideType(v as Nom035GuideType)}
              >
                <SelectTrigger className="w-full h-10 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Seleccionar Guía">
                    {({
                      guia_ii: "Guía II: Factores de Riesgo Psicosocial (Hasta 50 trab.)",
                      guia_iii: "Guía III: Entorno Organizacional (>50 trab.)",
                      guia_i: "Guía I: Acontecimientos Traumáticos Severos",
                    } as Record<string, string>)[guideType] || guideType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="w-(--anchor-width) min-w-[280px] rounded-xl">
                  <SelectItem value="guia_ii" className="text-xs">
                    Guía II: Factores de Riesgo Psicosocial (Hasta 50 trab.)
                  </SelectItem>
                  <SelectItem value="guia_iii" className="text-xs">
                    Guía III: Entorno Organizacional (&gt;50 trab.)
                  </SelectItem>
                  <SelectItem value="guia_i" className="text-xs">
                    Guía I: Acontecimientos Traumáticos Severos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Fecha de Aplicación
              </Label>
              <Input
                type="date"
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
                className="h-10 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          {/* 5 Official STPS Dimensions */}
          <div className="space-y-3.5 pt-2 border-t border-border/30">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>Puntuación por Dimensiones STPS</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Escala de Riesgo
              </Badge>
            </h4>

            {/* Dimension 1 */}
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  1. Ambiente de Trabajo (0–20 pts)
                </span>
                <span className="font-mono font-extrabold text-primary">
                  {environmentScore} pts
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Condiciones peligrosas, insalubres o sobreesfuerzo físico en las instalaciones.
              </p>
              <input
                type="range"
                min={0}
                max={20}
                value={environmentScore}
                onChange={(e) => setEnvironmentScore(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Dimension 2 */}
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  2. Factores de la Actividad (0–40 pts)
                </span>
                <span className="font-mono font-extrabold text-primary">
                  {activityFactorsScore} pts
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Carga mental/física acelerada, falta de autonomía o control sobre el puesto.
              </p>
              <input
                type="range"
                min={0}
                max={40}
                value={activityFactorsScore}
                onChange={(e) => setActivityFactorsScore(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Dimension 3 */}
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  3. Organización del Tiempo (0–20 pts)
                </span>
                <span className="font-mono font-extrabold text-primary">
                  {timeOrganizationScore} pts
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Jornadas extensas, rotación de turnos sin descanso o interferencia familia-trabajo.
              </p>
              <input
                type="range"
                min={0}
                max={20}
                value={timeOrganizationScore}
                onChange={(e) => setTimeOrganizationScore(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Dimension 4 */}
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  4. Liderazgo y Relaciones Laborales (0–40 pts)
                </span>
                <span className="font-mono font-extrabold text-primary">
                  {leadershipRelationsScore} pts
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Claridad de funciones, trato del jefe directo y compañerismo en el equipo.
              </p>
              <input
                type="range"
                min={0}
                max={40}
                value={leadershipRelationsScore}
                onChange={(e) => setLeadershipRelationsScore(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Dimension 5 */}
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  5. Entorno Organizacional (0–30 pts)
                </span>
                <span className="font-mono font-extrabold text-primary">
                  {organizationalClimateScore} pts
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Reconocimiento al desempeño, sentido de pertenencia y estabilidad laboral.
              </p>
              <input
                type="range"
                min={0}
                max={30}
                value={organizationalClimateScore}
                onChange={(e) => setOrganizationalClimateScore(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Dynamic Score & Traffic Light Indicator */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Puntaje Total Calculado
                </span>
                <span className="text-2xl font-black text-foreground font-mono">
                  {totalScore} pts
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs font-extrabold uppercase px-3 py-1 border", riskBadgeColor)}
              >
                Riesgo {riskLevel.replace("_", " ")}
              </Badge>
            </div>

            <div className="p-2.5 rounded-xl bg-background border border-border/30 flex items-start gap-2 text-xs">
              <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground">
                  {riskRecommendation}
                </p>
                <button
                  type="button"
                  onClick={handleApplyRecommendation}
                  className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="size-3" />
                  Copiar recomendación al plan de acción
                </button>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">
              Plan de Acción / Medidas de Prevención LFT
            </Label>
            <Textarea
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder="Describir las medidas de prevención o control recomendadas..."
              className="rounded-xl text-xs min-h-[70px] resize-none"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/30 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !employeeId}
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  <span>Registrar Cédula NOM-035</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
