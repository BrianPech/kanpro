"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { parseCompanyWorkRulesConfig } from "../../strategies/company-policies.parser";
import type {
  CompanyWorkRulesConfig,
  CompTimeMode,
  CutoffDaysBeforeEnd,
  DelayDeductionDays,
  DelayResetPeriod,
  DisciplinaryPayMode,
  EarlyDepartureMode,
  PayrollPeriodicity,
  SeventhDayMode,
} from "../../types/company-policies";
import type { LeaveApprovalMode } from "../../strategies/leave-approval.strategy";
import { updatePayrollImpactConfigAction } from "../../actions/settings";

const DELAY_DEDUCTION_LABELS: Record<string, string> = {
  "1": "1 día completo",
  "0.5": "0.5 (medio día)",
};

const PERIODICITY_LABELS: Record<string, string> = {
  semanal: "Semanal",
  catorcenal: "Catorcenal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

const EARLY_DEPARTURE_LABELS: Record<EarlyDepartureMode, string> = {
  descuento_proporcional: "Descuento proporcional",
  retardo_equivalente: "Cuenta como retardo",
  solo_registro: "Solo registro",
};

const COMP_TIME_LABELS: Record<CompTimeMode, string> = {
  tiempo_por_tiempo: "Tiempo por tiempo",
  banco_horas: "Banco de horas",
  ninguno: "Sin compensación",
};

const SEVENTH_DAY_LABELS: Record<SeventhDayMode, string> = {
  proporcional: "Proporcional (1.1666)",
  completo: "Día completo (+1 día)",
  ninguno: "Solo día faltado",
};

const SUSPENSION_MODE_LABELS: Record<DisciplinaryPayMode, string> = {
  sin_goce_solo_dia: "Sin goce (solo días)",
  sin_goce_con_septimo: "Sin goce + séptimo día",
  con_goce: "Con goce de sueldo",
};

const ADMIN_FAULT_MODE_LABELS: Record<DisciplinaryPayMode, string> = {
  con_goce: "Con goce (solo registro)",
  sin_goce_solo_dia: "Sin goce (solo día)",
  sin_goce_con_septimo: "Sin goce + séptimo día",
};

const CUTOFF_DAYS_LABELS: Record<string, string> = {
  "0": "0 — Fin del periodo (default)",
  "1": "1 día antes del cierre",
  "2": "2 días antes del cierre",
  "3": "3 días antes del cierre",
};

export interface WorkRulesPreset {
  id: "estandar" | "flexible" | "estricta";
  label: string;
  summary: string;
  patch: Partial<CompanyWorkRulesConfig>;
}

export const WORK_RULES_PRESETS: readonly WorkRulesPreset[] = [
  {
    id: "estandar",
    label: "Estándar (LFT)",
    summary: "10 min tolerancia · 3 retardos = 1 día · quincenal · 7° día proporcional",
    patch: {
      toleranceMinutes: 10,
      delaysPerAbsence: 3,
      delayDeductionDays: 1,
      resetPeriod: "quincenal",
      seventhDayMode: "proporcional",
    },
  },
  {
    id: "flexible",
    label: "Flexible",
    summary: "15 min tolerancia · 3 retardos = ½ día · mensual · 7° día proporcional",
    patch: {
      toleranceMinutes: 15,
      delaysPerAbsence: 3,
      delayDeductionDays: 0.5,
      resetPeriod: "mensual",
      seventhDayMode: "proporcional",
    },
  },
  {
    id: "estricta",
    label: "Estricta",
    summary: "5 min tolerancia · 2 retardos = 1 día · semanal · 7° día completo",
    patch: {
      toleranceMinutes: 5,
      delaysPerAbsence: 2,
      delayDeductionDays: 1,
      resetPeriod: "semanal",
      seventhDayMode: "completo",
    },
  },
];

interface CompanyWorkRulesPanelProps {
  companyId?: string;
  initialPayrollImpactConfig?: unknown;
  initialLeaveApprovalMode: LeaveApprovalMode;
  onSaved?: (config: CompanyWorkRulesConfig, approvalMode: LeaveApprovalMode) => void;
}

export function CompanyWorkRulesPanel({
  companyId,
  initialPayrollImpactConfig,
  initialLeaveApprovalMode,
  onSaved,
}: CompanyWorkRulesPanelProps) {
  const [config, setConfig] = React.useState<CompanyWorkRulesConfig>(() =>
    parseCompanyWorkRulesConfig(initialPayrollImpactConfig)
  );
  const [approvalMode, setApprovalMode] =
    React.useState<LeaveApprovalMode>(initialLeaveApprovalMode);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setConfig(parseCompanyWorkRulesConfig(initialPayrollImpactConfig));
  }, [initialPayrollImpactConfig]);

  React.useEffect(() => {
    setApprovalMode(initialLeaveApprovalMode);
  }, [initialLeaveApprovalMode]);

  const applyPreset = (preset: WorkRulesPreset) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.patch,
    }));
    toast.info(`Preset "${preset.label}" aplicado. Guarda para confirmar los cambios.`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updatePayrollImpactConfigAction({
        companyId,
        payrollImpactConfig: config,
        leaveApprovalMode: approvalMode,
      });
      if (!res.success || !res.data) {
        toast.error(res.error || "No se pudieron guardar las reglas de la empresa.");
        return;
      }
      setConfig(res.data.config);
      onSaved?.(res.data.config, approvalMode);
      toast.success("Reglas de la empresa guardadas correctamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets de 1 clic */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label className="text-xs font-bold text-foreground">
            Presets de políticas (1 clic)
          </Label>
          <span className="text-[11px] text-muted-foreground font-medium">
            Valores propuestos, a confirmar con RH
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WORK_RULES_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-left p-3 rounded-xl border border-border/50 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground">{preset.label}</span>
                <Badge variant="outline" className="text-[10px]">
                  Aplicar
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {preset.summary}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Vigencia y flujo de aprobación de permisos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/40 bg-muted/20">
        <div className="space-y-1.5">
          <Label htmlFor="rules-effective-from" className="text-xs font-bold">
            Vigencia de estas reglas (opcional)
          </Label>
          <Input
            id="rules-effective-from"
            type="date"
            value={config.effectiveFrom ?? ""}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                effectiveFrom: e.target.value ? e.target.value : null,
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Aprobación de vacaciones y permisos</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setApprovalMode("single_step")}
              className={cn(
                "px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                approvalMode === "single_step"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-muted/40"
              )}
            >
              1 paso (RH)
            </button>
            <button
              type="button"
              onClick={() => setApprovalMode("two_step")}
              className={cn(
                "px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                approvalMode === "two_step"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-muted/40"
              )}
            >
              2 pasos (Líder → RH)
            </button>
          </div>
        </div>
      </div>

      {/* 1. Puntualidad */}
      <div className="space-y-3 p-4 rounded-xl border border-border/40">
        <div className="space-y-0.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            1. Puntualidad y retardos
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Tolerancia de entrada, conversión de retardos a descuento y salidas anticipadas (Art. 107 LFT: sin multas fijas).
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="tolerance-minutes" className="text-[11px] font-semibold">
              Tolerancia (min)
            </Label>
            <Input
              id="tolerance-minutes"
              type="number"
              min={0}
              max={120}
              value={config.toleranceMinutes}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  toleranceMinutes: Math.max(0, Math.min(120, Number(e.target.value) || 0)),
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="delays-per-absence" className="text-[11px] font-semibold">
              Retardos por descuento
            </Label>
            <Input
              id="delays-per-absence"
              type="number"
              min={1}
              max={30}
              value={config.delaysPerAbsence}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  delaysPerAbsence: Math.max(1, Math.min(30, Math.floor(Number(e.target.value) || 1))),
                }))
              }
            />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Días descontados</Label>
            <Select
              value={String(config.delayDeductionDays)}
              onValueChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  delayDeductionDays: (val === "0.5" ? 0.5 : 1) as DelayDeductionDays,
                }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {DELAY_DEDUCTION_LABELS[String(config.delayDeductionDays)] ?? String(config.delayDeductionDays)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 día completo</SelectItem>
                <SelectItem value="0.5">0.5 (medio día)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Reinicio de conteo</Label>
            <Select
              value={config.resetPeriod}
              onValueChange={(val) =>
                val && setConfig((prev) => ({ ...prev, resetPeriod: val as DelayResetPeriod }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {PERIODICITY_LABELS[config.resetPeriod] ?? config.resetPeriod}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="catorcenal">Catorcenal</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Salida anticipada</Label>
            <Select
              value={config.earlyDepartureMode}
              onValueChange={(val) =>
                val &&
                setConfig((prev) => ({
                  ...prev,
                  earlyDepartureMode: val as EarlyDepartureMode,
                }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {EARLY_DEPARTURE_LABELS[config.earlyDepartureMode] ?? config.earlyDepartureMode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="descuento_proporcional">Descuento proporcional</SelectItem>
                <SelectItem value="retardo_equivalente">Cuenta como retardo</SelectItem>
                <SelectItem value="solo_registro">Solo registro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Tiempo compensable</Label>
            <Select
              value={config.compTimeMode}
              onValueChange={(val) =>
                val && setConfig((prev) => ({ ...prev, compTimeMode: val as CompTimeMode }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {COMP_TIME_LABELS[config.compTimeMode] ?? config.compTimeMode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiempo_por_tiempo">Tiempo por tiempo</SelectItem>
                <SelectItem value="banco_horas">Banco de horas</SelectItem>
                <SelectItem value="ninguno">Sin compensación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground font-medium">
            Aplicar tolerancia uniforme a todos los puestos, turnos y sucursales
          </span>
          <Switch
            checked={config.scope.uniformTolerance}
            onCheckedChange={(checked) =>
              setConfig((prev) => ({
                ...prev,
                scope: { ...prev.scope, uniformTolerance: checked },
              }))
            }
          />
        </div>
      </div>

      {/* 2. Faltas y séptimo día */}
      <div className="space-y-3 p-4 rounded-xl border border-border/40">
        <div className="space-y-0.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            2. Faltas, aclaraciones y séptimo día
          </h4>
          <p className="text-[11px] text-muted-foreground">
            El séptimo día se gana con los días trabajados (Art. 69 y 72 LFT).
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Descuento séptimo día</Label>
            <Select
              value={config.seventhDayMode}
              onValueChange={(val) =>
                val && setConfig((prev) => ({ ...prev, seventhDayMode: val as SeventhDayMode }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {SEVENTH_DAY_LABELS[config.seventhDayMode] ?? config.seventhDayMode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proporcional">Proporcional (1.1666)</SelectItem>
                <SelectItem value="completo">Día completo (+1 día)</SelectItem>
                <SelectItem value="ninguno">Solo día faltado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label htmlFor="clarification-window" className="text-[11px] font-semibold">
              Ventana para aclarar / justificante (días)
            </Label>
            <Input
              id="clarification-window"
              type="number"
              min={1}
              max={30}
              value={config.clarificationWindowDays}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  clarificationWindowDays: Math.max(1, Math.min(30, Math.floor(Number(e.target.value) || 3))),
                }))
              }
            />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Suspensión disciplinaria</Label>
            <Select
              value={config.disciplinaryRules.suspensionMode}
              onValueChange={(val) =>
                val &&
                setConfig((prev) => ({
                  ...prev,
                  disciplinaryRules: {
                    ...prev.disciplinaryRules,
                    suspensionMode: val as DisciplinaryPayMode,
                  },
                }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {SUSPENSION_MODE_LABELS[config.disciplinaryRules.suspensionMode] ??
                    config.disciplinaryRules.suspensionMode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sin_goce_solo_dia">Sin goce (solo días)</SelectItem>
                <SelectItem value="sin_goce_con_septimo">Sin goce + séptimo día</SelectItem>
                <SelectItem value="con_goce">Con goce de sueldo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Falta administrativa</Label>
            <Select
              value={config.disciplinaryRules.administrativeFaultMode}
              onValueChange={(val) =>
                val &&
                setConfig((prev) => ({
                  ...prev,
                  disciplinaryRules: {
                    ...prev.disciplinaryRules,
                    administrativeFaultMode: val as DisciplinaryPayMode,
                  },
                }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {ADMIN_FAULT_MODE_LABELS[config.disciplinaryRules.administrativeFaultMode] ??
                    config.disciplinaryRules.administrativeFaultMode}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="con_goce">Con goce (solo registro)</SelectItem>
                <SelectItem value="sin_goce_solo_dia">Sin goce (solo día)</SelectItem>
                <SelectItem value="sin_goce_con_septimo">Sin goce + séptimo día</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. Incapacidades IMSS, permisos y vacaciones */}
      <div className="space-y-3 p-4 rounded-xl border border-border/40">
        <div className="space-y-0.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            3. Incapacidades IMSS, permisos, vacaciones y horas extra
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Invariantes: incapacidad IMSS nunca cuenta como falta ni salario ordinario; permisos con goce se pagan íntegros.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="vac-premium" className="text-[11px] font-semibold">
              Prima vacacional (%, mín. 25)
            </Label>
            <Input
              id="vac-premium"
              type="number"
              min={25}
              max={500}
              value={config.vacationRules.premiumPercentage}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  vacationRules: {
                    ...prev.vacationRules,
                    premiumPercentage: Number(e.target.value) || 25,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="imss-comp-pct" className="text-[11px] font-semibold">
              Complemento IMSS (%)
            </Label>
            <Input
              id="imss-comp-pct"
              type="number"
              min={0}
              max={100}
              disabled={!config.imssComplement.enabled}
              value={config.imssComplement.complementPercentage}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  imssComplement: {
                    ...prev.imssComplement,
                    complementPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hourly-cap" className="text-[11px] font-semibold">
              Tope permisos por hora (h/mes)
            </Label>
            <Input
              id="hourly-cap"
              type="number"
              min={0}
              max={40}
              value={config.hourlyLeaveRules.monthlyCapHours}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  hourlyLeaveRules: {
                    ...prev.hourlyLeaveRules,
                    monthlyCapHours: Math.max(0, Math.min(40, Number(e.target.value) || 0)),
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="luto-days-event" className="text-[11px] font-semibold">
              Luto (días hábiles/evento, mín. 3 LFT)
            </Label>
            <Input
              id="luto-days-event"
              type="number"
              min={3}
              max={30}
              value={config.leaveCatalogue.luto.maxDaysPerEvent ?? 3}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  leaveCatalogue: {
                    ...prev.leaveCatalogue,
                    luto: {
                      ...prev.leaveCatalogue.luto,
                      maxDaysPerYear: null,
                      maxDaysPerEvent: Math.max(3, Math.min(30, Math.floor(Number(e.target.value) || 3))),
                    },
                  },
                }))
              }
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Switch
              checked={config.imssComplement.enabled}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  imssComplement: { ...prev.imssComplement, enabled: checked },
                }))
              }
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              Otorgar complemento voluntario en incapacidad IMSS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.overtimeRules.requiresPriorAuthorization}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({
                  ...prev,
                  overtimeRules: {
                    ...prev.overtimeRules,
                    requiresPriorAuthorization: checked,
                  },
                }))
              }
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              Horas extra requieren autorización previa
            </span>
          </div>
        </div>
      </div>

      {/* 4. Periodicidad y bonos */}
      <div className="space-y-3 p-4 rounded-xl border border-border/40">
        <div className="space-y-0.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            4. Periodicidad de nómina, corte y bonos
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Incidencias posteriores a la fecha de corte pasan al siguiente periodo.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] font-semibold">Periodicidad de nómina</Label>
            <Select
              value={config.payrollPeriodicity}
              onValueChange={(val) =>
                val &&
                setConfig((prev) => ({
                  ...prev,
                  payrollPeriodicity: val as PayrollPeriodicity,
                }))
              }
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue>
                  {PERIODICITY_LABELS[config.payrollPeriodicity] ?? config.payrollPeriodicity}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="catorcenal">Catorcenal</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-0">
            <Label htmlFor="cutoff-days-before-end" className="text-[11px] font-semibold">
              Corte de incidencias (días antes del fin)
            </Label>
            <Select
              value={String(config.cutoffDaysBeforeEnd)}
              onValueChange={(val) =>
                setConfig((prev) => ({
                  ...prev,
                  cutoffDaysBeforeEnd: (
                    ["0", "1", "2", "3"].includes(String(val)) ? Number(val) : 0
                  ) as CutoffDaysBeforeEnd,
                }))
              }
            >
              <SelectTrigger id="cutoff-days-before-end" className="w-full min-w-0">
                <SelectValue>
                  {CUTOFF_DAYS_LABELS[String(config.cutoffDaysBeforeEnd)] ??
                    String(config.cutoffDaysBeforeEnd)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Fin del periodo (default)</SelectItem>
                <SelectItem value="1">1 día antes del cierre</SelectItem>
                <SelectItem value="2">2 días antes del cierre</SelectItem>
                <SelectItem value="3">3 días antes del cierre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg border border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Bono de puntualidad</span>
              <Switch
                checked={config.punctualityBonus.enabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    punctualityBonus: { ...prev.punctualityBonus, enabled: checked },
                  }))
                }
              />
            </div>
            <Input
              type="number"
              min={0}
              disabled={!config.punctualityBonus.enabled}
              value={config.punctualityBonus.amount}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  punctualityBonus: {
                    ...prev.punctualityBonus,
                    amount: Math.max(0, Number(e.target.value) || 0),
                  },
                }))
              }
              placeholder="Monto o %"
            />
          </div>
          <div className="p-3 rounded-lg border border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Bono de asistencia</span>
              <Switch
                checked={config.attendanceBonus.enabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    attendanceBonus: { ...prev.attendanceBonus, enabled: checked },
                  }))
                }
              />
            </div>
            <Input
              type="number"
              min={0}
              disabled={!config.attendanceBonus.enabled}
              value={config.attendanceBonus.amount}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  attendanceBonus: {
                    ...prev.attendanceBonus,
                    amount: Math.max(0, Number(e.target.value) || 0),
                  },
                }))
              }
              placeholder="Monto o %"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="font-bold cursor-pointer"
        >
          {isSaving ? "Guardando..." : "Guardar reglas de mi empresa"}
        </Button>
      </div>
    </div>
  );
}
