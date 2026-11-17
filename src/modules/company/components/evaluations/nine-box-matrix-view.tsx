"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Users,
  Target,
  Award,
  AlertTriangle,
  TrendingUp,
  Info,
  Filter,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  EmployeeEvaluation,
  NineBoxQuadrantType,
  NINE_BOX_QUADRANTS,
  calculateNineBoxQuadrant,
} from "../../types/evaluations";

interface NineBoxMatrixViewProps {
  evaluations: EmployeeEvaluation[];
  onSelectEvaluation?: (evaluation: EmployeeEvaluation) => void;
}

export function NineBoxMatrixView({
  evaluations,
  onSelectEvaluation,
}: NineBoxMatrixViewProps) {
  const [selectedDept, setSelectedDept] = useState<string>("all");

  // Departamentos disponibles
  const departments = useMemo(() => {
    const set = new Set<string>();
    evaluations.forEach((ev) => {
      if (ev.department) set.add(ev.department);
    });
    return Array.from(set).sort();
  }, [evaluations]);

  // Filtrado por departamento
  const filteredEvaluations = useMemo(() => {
    if (selectedDept === "all") return evaluations;
    return evaluations.filter((ev) => ev.department === selectedDept);
  }, [evaluations, selectedDept]);

  // Agrupamiento de colaboradores por cuadrante
  const quadrantMap = useMemo(() => {
    const map: Record<NineBoxQuadrantType, EmployeeEvaluation[]> = {
      estrella: [],
      alto_potencial: [],
      enigma: [],
      alto_desempeno: [],
      clave: [],
      en_desarrollo: [],
      pilar_solido: [],
      efectivo: [],
      riesgo: [],
    };

    filteredEvaluations.forEach((ev) => {
      const perf = Number(ev.averageScore) || 3.0;
      const pot = Number(ev.potentialScore) || 3.5;
      const quadrant = (ev.nineBoxQuadrant as NineBoxQuadrantType) || calculateNineBoxQuadrant(perf, pot);
      if (map[quadrant]) {
        map[quadrant].push(ev);
      } else {
        map.clave.push(ev);
      }
    });

    return map;
  }, [filteredEvaluations]);

  // KPIs estratégicos
  const totalEmployees = filteredEvaluations.length;
  const starsCount = quadrantMap.estrella.length;
  const highPotCount = quadrantMap.estrella.length + quadrantMap.alto_potencial.length + quadrantMap.enigma.length;
  const highPerfCount = quadrantMap.estrella.length + quadrantMap.alto_desempeno.length + quadrantMap.pilar_solido.length;
  const riskCount = quadrantMap.riesgo.length;

  const starsPct = totalEmployees > 0 ? Math.round((starsCount / totalEmployees) * 100) : 0;
  const highPotPct = totalEmployees > 0 ? Math.round((highPotCount / totalEmployees) * 100) : 0;
  const riskPct = totalEmployees > 0 ? Math.round((riskCount / totalEmployees) * 100) : 0;

  // Filas de la matriz 3x3 (Eje Y: Potencial Alto -> Medio -> Bajo)
  // Columnas: Desempeño Bajo -> Medio -> Alto
  const matrixGrid: Array<{
    potLabel: string;
    quadrants: NineBoxQuadrantType[];
  }> = [
    {
      potLabel: "Alto Potencial (4.0 - 5.0)",
      quadrants: ["enigma", "alto_potencial", "estrella"],
    },
    {
      potLabel: "Medio Potencial (3.0 - 3.9)",
      quadrants: ["en_desarrollo", "clave", "alto_desempeno"],
    },
    {
      potLabel: "Bajo Potencial (1.0 - 2.9)",
      quadrants: ["riesgo", "efectivo", "pilar_solido"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Strategic Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/50">
        <div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <span>Matriz de Talento 9-Box (Desempeño vs. Potencial)</span>
          </h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Metodología ejecutiva para mapeo de competencias, planes de sucesión y retención clave.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-muted-foreground" />
          <Select value={selectedDept} onValueChange={(val) => setSelectedDept(val || "all")}>
            <SelectTrigger className="h-8 text-xs font-semibold rounded-xl w-[180px] bg-background">
              <SelectValue placeholder="Todos los departamentos">
                {selectedDept === "all" ? "Todos los departamentos" : selectedDept}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl text-xs">
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 rounded-2xl border border-border/40 bg-card space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Colaboradores Mapeados
          </span>
          <div className="text-xl font-extrabold text-foreground">{totalEmployees}</div>
          <span className="text-[10px] text-muted-foreground">En el ciclo evaluado</span>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
            🌟 Estrellas / Sucesores
          </span>
          <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400">
            {starsCount} <span className="text-xs font-normal">({starsPct}%)</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Alto desempeño + Alto potencial</span>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
            🚀 Alto Potencial
          </span>
          <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {highPotCount} <span className="text-xs font-normal">({highPotPct}%)</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Listos para desarrollo</span>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-1">
          <span className="text-[10px] font-bold text-destructive uppercase">
            ⚠️ En Riesgo / Ajuste
          </span>
          <div className="text-xl font-extrabold text-destructive">
            {riskCount} <span className="text-xs font-normal">({riskPct}%)</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Requiere plan PIP o cambio</span>
        </Card>
      </div>

      {/* The 9-Box Grid */}
      <div className="space-y-2">
        {/* Columns Header (Desempeño X-Axis) */}
        <div className="grid grid-cols-12 gap-2 text-center text-xs font-bold text-muted-foreground pb-1">
          <div className="col-span-12 sm:col-span-2 text-left pl-2 hidden sm:block">
            Eje Y (Potencial)
          </div>
          <div className="col-span-4 sm:col-span-3 sm:col-start-3 rounded-lg bg-muted/20 py-1 text-[11px] uppercase tracking-wider">
            Bajo Desempeño (&lt; 2.8)
          </div>
          <div className="col-span-4 sm:col-span-3 rounded-lg bg-muted/20 py-1 text-[11px] uppercase tracking-wider">
            Medio Desempeño (2.8 - 3.7)
          </div>
          <div className="col-span-4 sm:col-span-4 rounded-lg bg-muted/20 py-1 text-[11px] uppercase tracking-wider">
            Alto Desempeño (≥ 3.8)
          </div>
        </div>

        {/* Rows (Potencial Y-Axis) */}
        {matrixGrid.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-stretch">
            {/* Y-Axis Label */}
            <div className="sm:col-span-2 hidden sm:flex flex-col justify-center pr-2 text-left">
              <span className="text-[11px] font-extrabold text-foreground">
                {row.potLabel.split(" ")[0]} {row.potLabel.split(" ")[1]}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {row.potLabel.split("(")[1]?.replace(")", "") || ""}
              </span>
            </div>

            {/* 3 Cells in Row */}
            {row.quadrants.map((quadKey) => {
              const meta = NINE_BOX_QUADRANTS[quadKey];
              const quadEmployees = quadrantMap[quadKey] || [];
              const isCol3 = quadKey === "estrella" || quadKey === "alto_desempeno" || quadKey === "pilar_solido";

              return (
                <div
                  key={quadKey}
                  className={cn(
                    "rounded-2xl border p-3 flex flex-col justify-between transition-all min-h-[140px]",
                    meta.badgeClass,
                    isCol3 ? "sm:col-span-4" : "sm:col-span-3",
                    "hover:shadow-xs"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold tracking-tight">
                        {meta.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold px-1.5 py-0 h-4 rounded-full"
                      >
                        {quadEmployees.length}
                      </Badge>
                    </div>

                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                      {meta.recommendation}
                    </p>
                  </div>

                  {/* Employees in quadrant */}
                  <div className="pt-2 mt-2 border-t border-border/30 space-y-1">
                    {quadEmployees.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground italic block">
                        Sin colaboradores
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                        {quadEmployees.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => onSelectEvaluation?.(emp)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-background/80 hover:bg-background border border-border/50 text-[10px] font-semibold text-foreground transition-colors cursor-pointer shadow-2xs"
                            title={`${emp.employeeName} • Desempeño: ${emp.averageScore} | Potencial: ${emp.potentialScore || 3.5}`}
                          >
                            <Avatar className="size-3.5 rounded-full">
                              <AvatarImage src={emp.avatarUrl || ""} />
                              <AvatarFallback className="text-[8px] bg-muted">
                                {emp.employeeName.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[90px]">{emp.employeeName}</span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {emp.averageScore}★
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
