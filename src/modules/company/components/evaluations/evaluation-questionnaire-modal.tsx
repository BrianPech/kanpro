"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { Sparkles, Star, Loader2, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmployeeEvaluation } from "../../types/evaluations";
import { EmployeeSelectOption } from "../../services/company-evaluations";
import { createEvaluationAction } from "../../actions/evaluations";
import { evaluationQuestionnaireSchema } from "../../schemas/evaluation-questionnaire.schema";

interface EvaluationQuestionnaireModalProps {
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

export function EvaluationQuestionnaireModal({
  isOpen,
  onOpenChange,
  onEvaluationCreated,
  employees = [],
  initialEmployee,
}: EvaluationQuestionnaireModalProps) {
  const [activeItem, setActiveItem] = useState<string>("employee_id");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Memoized employee choices based on available company workforce
  const employeeChoices = useMemo(() => {
    if (employees.length > 0) {
      return employees.map((emp) => ({
        value: emp.id,
        label: emp.name,
        description: `${emp.jobTitle} • ${emp.department}`,
      }));
    }

    if (initialEmployee) {
      return [
        {
          value: initialEmployee.id,
          label: initialEmployee.name,
          description: `${initialEmployee.jobTitle} • ${initialEmployee.department}`,
        },
      ];
    }

    return [];
  }, [employees, initialEmployee]);

  const items = useMemo(
    () =>
      [
        {
          name: "employee_id",
          required: true,
          prompt: "¿A qué empleado vas a evaluar?",
          description:
            "Selecciona al miembro activo de tu equipo que recibirá la evaluación de desempeño 360.",
          choices: employeeChoices,
        },
        {
          name: "period",
          required: true,
          prompt: "Periodo Operativo de Evaluación",
          description:
            "Indica el ciclo o corte de tiempo evaluado.",
          choices: [
            {
              value: "Q2 2026 - Evaluación Trimestral",
              label: "Q2 2026 - Evaluación Trimestral",
              description: "Ciclo regular de objetivos y desempeño (Abril - Junio)",
            },
            {
              value: "Q1 2026 - Evaluación Trimestral",
              label: "Q1 2026 - Evaluación Trimestral",
              description: "Ciclo anterior de desempeño (Enero - Marzo)",
            },
            {
              value: "Evaluación Fin de Periodo de Prueba",
              label: "Evaluación Fin de Periodo de Prueba",
              description: "Evaluación a los 90 días para contrato por tiempo indeterminado",
            },
            {
              value: "Evaluación Anual de Desempeño 2026",
              label: "Evaluación Anual de Desempeño",
              description: "Revisión anual integral y consideraciones de ajuste",
            },
          ],
        },
        {
          name: "puntualidad",
          required: true,
          prompt: "1. Puntualidad y Horario",
          description:
            "¿Cómo calificarías el cumplimiento del horario de entrada y disposición al inicio del turno?",
          choices: [
            {
              value: "5",
              label: "⭐⭐⭐⭐⭐ Excepcional (5.0)",
              description: "Puntualidad perfecta, siempre listo con anticipación.",
            },
            {
              value: "4",
              label: "⭐⭐⭐⭐ Bueno (4.0)",
              description: "Muy puntual, retrasos mínimos e informados previamente.",
            },
            {
              value: "3",
              label: "⭐⭐⭐ Aceptable (3.0)",
              description: "Cumple con el margen de tolerancia habitual de entrada.",
            },
            {
              value: "2",
              label: "⭐⭐ Regular (2.0)",
              description: "Retardos recurrentes que impactan la operación del turno.",
            },
            {
              value: "1",
              label: "⭐ Deficiente (1.0)",
              description: "Incumplimiento sistemático de los horarios establecidos.",
            },
          ],
        },
        {
          name: "asistencia",
          required: true,
          prompt: "2. Asistencia y Turnos",
          description:
            "¿Cómo es su constancia, presencia y apego a turnos programados?",
          choices: [
            {
              value: "5",
              label: "⭐⭐⭐⭐⭐ Asistencia Total (5.0)",
              description: "Cero ausencias injustificadas y alta disponibilidad para cubrir turnos.",
            },
            {
              value: "4",
              label: "⭐⭐⭐⭐ Buena Asistencia (4.0)",
              description: "Faltas mínimas y debidamente justificadas con aviso previo.",
            },
            {
              value: "3",
              label: "⭐⭐⭐ Aceptable (3.0)",
              description: "Presencia habitual con imprevistos menores dentro de lo tolerable.",
            },
            {
              value: "2",
              label: "⭐⭐ Inconsistente (2.0)",
              description: "Ausencias frecuentes que sobrecargan al resto del equipo.",
            },
            {
              value: "1",
              label: "⭐ Crítico (1.0)",
              description: "Múltiples ausencias injustificadas en el ciclo.",
            },
          ],
        },
        {
          name: "productividad",
          required: true,
          prompt: "3. Productividad y Calidad de Trabajo",
          description:
            "¿Cómo calificarías el volumen, velocidad y exactitud en sus labores diarias?",
          choices: [
            {
              value: "5",
              label: "⭐⭐⭐⭐⭐ Sobresaliente (5.0)",
              description: "Supera estándares de volumen y velocidad con cero mermas o errores.",
            },
            {
              value: "4",
              label: "⭐⭐⭐⭐ Alto Desempeño (4.0)",
              description: "Cumple el 100% de las tareas asignadas en tiempo y forma.",
            },
            {
              value: "3",
              label: "⭐⭐⭐ Estándar (3.0)",
              description: "Ritmo de trabajo regular conforme a las expectativas del puesto.",
            },
            {
              value: "2",
              label: "⭐⭐ Por Mejorar (2.0)",
              description: "Dificultad para mantener el ritmo en horas pico de operación.",
            },
            {
              value: "1",
              label: "⭐ Insuficiente (1.0)",
              description: "Rendimiento bajo que requiere supervisión continua.",
            },
          ],
        },
        {
          name: "trabajo_equipo",
          required: true,
          prompt: "4. Trabajo en Equipo y Colaboración",
          description:
            "¿Cómo es su relación, empatía y apoyo hacia sus compañeros de trabajo?",
          choices: [
            {
              value: "5",
              label: "⭐⭐⭐⭐⭐ Líder Positivo (5.0)",
              description: "Fomenta la armonía, inspira y ayuda activamente a sus compañeros.",
            },
            {
              value: "4",
              label: "⭐⭐⭐⭐ Muy Colaborativo (4.0)",
              description: "Excelente comunicación y gran disposición al compañerismo.",
            },
            {
              value: "3",
              label: "⭐⭐⭐ Funcional (3.0)",
              description: "Realiza su trabajo individual sin generar fricciones en el equipo.",
            },
            {
              value: "2",
              label: "⭐⭐ Fricciones (2.0)",
              description: "Le cuesta coordinarse con otros turnos o departamentos.",
            },
            {
              value: "1",
              label: "⭐ Desintegrador (1.0)",
              description: "Actitud negativa o generador de desacuerdos continuos.",
            },
          ],
        },
        {
          name: "atencion_comunicacion",
          required: true,
          prompt: "5. Atención al Cliente y Comunicación",
          description:
            "¿Cómo es el trato, educación y servicio hacia clientes o usuarios internos?",
          choices: [
            {
              value: "5",
              label: "⭐⭐⭐⭐⭐ Servicio de Excelencia (5.0)",
              description: "Calidez impecable, amabilidad y felicitaciones de clientes.",
            },
            {
              value: "4",
              label: "⭐⭐⭐⭐ Muy Buen Servicio (4.0)",
              description: "Trato educado, respetuoso, empático y orientado a la solución.",
            },
            {
              value: "3",
              label: "⭐⭐⭐ Correcto (3.0)",
              description: "Sigue el protocolo de servicio estándar sin contratiempos.",
            },
            {
              value: "2",
              label: "⭐⭐ Mejorable (2.0)",
              description: "Ocasionalmente cortante o con dificultades de comunicación.",
            },
            {
              value: "1",
              label: "⭐ Inadecuado (1.0)",
              description: "Quejas de clientes o mala actitud en el trato directo.",
            },
          ],
        },
        {
          name: "metas",
          required: true,
          prompt: "6. Cumplimiento de Metas y Objetivos",
          description:
            "¿En qué grado alcanzó las metas u órdenes de trabajo planteadas para el periodo?",
          choices: [
            {
              value: "5",
              label: "⭐⭐⭐⭐⭐ Superó Metas (+100%)",
              description: "Superó con creces los objetivos clave pactados para el ciclo.",
            },
            {
              value: "4",
              label: "⭐⭐⭐⭐ Metas Cumplidas (90% - 100%)",
              description: "Logró la totalidad de los resultados esperados con autonomía.",
            },
            {
              value: "3",
              label: "⭐⭐⭐ Cumplimiento Parcial (75% - 89%)",
              description: "Buen avance general aunque algunas metas quedaron en progreso.",
            },
            {
              value: "2",
              label: "⭐⭐ Por Debajo (50% - 74%)",
              description: "Quedaron pendientes importantes de entrega operativa.",
            },
            {
              value: "1",
              label: "⭐ No Alcanzadas (< 50%)",
              description: "Lejos de las expectativas mínimas acordadas.",
            },
          ],
        },
        {
          name: "fortalezas",
          required: true,
          multiple: true,
          prompt: "Fortalezas Destacadas",
          description:
            "Selecciona una o más cualidades sobresalientes del empleado (o escribe una propia).",
          choices: [
            {
              value: "Liderazgo y proactividad para resolver problemas",
              label: "Liderazgo y Proactividad",
              description: "Iniciativa y resolución rápida de incidencias diarias.",
            },
            {
              value: "Apego estricto a estándares de seguridad e higiene",
              label: "Apego a Estándares y Seguridad",
              description: "Cuidado riguroso de protocolos y normas laborales.",
            },
            {
              value: "Excelente actitud de servicio y calidez humana",
              label: "Calidez Humana y Trato al Cliente",
              description: "Empatía constante con compañeros y clientes.",
            },
            {
              value: "Dominio técnico operativo de primer nivel",
              label: "Dominio Técnico y Habilidades Prácticas",
              description: "Destreza profesional en sus herramientas y tareas.",
            },
            {
              value: "Adaptabilidad y resiliencia ante alta demanda",
              label: "Resiliencia Bajo Presión",
              description: "Mantiene la calma y el orden en momentos de alta afluencia.",
            },
          ],
          input: {
            label: "Otra fortaleza",
            placeholder: "Escribe otra fortaleza destacada…",
          },
        },
        {
          name: "areas_oportunidad",
          required: true,
          multiple: true,
          prompt: "Áreas de Oportunidad y Crecimiento",
          description:
            "Elige aspectos en los que el empleado puede fortalecerse constructivamente.",
          choices: [
            {
              value: "Optimizar tiempos en reportes administrativos y bitácoras",
              label: "Reportes y Tiempos Administrativos",
              description: "Mayor velocidad y orden en el papeleo de turno.",
            },
            {
              value: "Control riguroso de mermas e insumos de trabajo",
              label: "Cuidado de Insumos y Mermas",
              description: "Mayor ahorro y administración de recursos.",
            },
            {
              value: "Puntualidad rigurosa en juntas previas de servicio",
              label: "Asistencia a Juntas Previas",
              description: "Llegar a tiempo a las reuniones informativas.",
            },
            {
              value: "Manejo del estrés y paciencia en momentos de alta carga",
              label: "Manejo del Estrés Operativo",
              description: "Autorregulación en situaciones de alta presión.",
            },
            {
              value: "Comunicación más asertiva y proactiva con supervisores",
              label: "Comunicación Asertiva",
              description: "Compartir dudas y avances de forma transparente.",
            },
          ],
          input: {
            label: "Otra área de oportunidad",
            placeholder: "Escribe otra área de oportunidad…",
          },
        },
        {
          name: "plan_desarrollo",
          required: true,
          prompt: "Plan de Desarrollo y Capacitación",
          description:
            "¿Qué acciones o capacitaciones se acuerdan para impulsar su crecimiento?",
          choices: [
            {
              value: "Certificación técnica especializada en el área",
              label: "Certificación Técnica Especializada",
              description: "Capacitación formal para elevar su nivel profesional.",
            },
            {
              value: "Programa de mentoring y preparación para liderazgo",
              label: "Mentoring para Mandos Medios",
              description: "Acompañamiento hacia roles de supervisión de personal.",
            },
            {
              value: "Taller de excelencia en servicio al cliente y hospitalidad",
              label: "Taller de Excelencia en Servicio",
              description: "Refuerzo en habilidades blandas y resolución de quejas.",
            },
            {
              value: "Acompañamiento y seguimiento quincenal de objetivos",
              label: "Acompañamiento y Metas Quincenales",
              description: "Reuniones periódicas de retroalimentación 1 a 1.",
            },
          ],
          input: {
            label: "Plan de desarrollo personalizado",
            placeholder: "Detalla el plan o metas pactadas…",
          },
        },
      ] as const,
    [employeeChoices]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});

    const formData = new FormData(event.currentTarget);

    const employeeId = (formData.get("employee_id") as string) || "";
    const period = (formData.get("period") as string) || "Q2 2026 - Evaluación Trimestral";
    const puntualidad = (formData.get("puntualidad") as string) || "5";
    const asistencia = (formData.get("asistencia") as string) || "5";
    const productividad = (formData.get("productividad") as string) || "5";
    const trabajo_equipo = (formData.get("trabajo_equipo") as string) || "5";
    const atencion_comunicacion = (formData.get("atencion_comunicacion") as string) || "5";
    const metas = (formData.get("metas") as string) || "5";

    // Strengths array (checkboxes + freeform input share "fortalezas")
    const strengths = (formData.getAll("fortalezas") as string[])
      .map((s) => s.trim())
      .filter(Boolean);

    // Growth areas array
    const areas_oportunidad = (formData.getAll("areas_oportunidad") as string[])
      .map((g) => g.trim())
      .filter(Boolean);

    // Development plan
    const planEntries = (formData.getAll("plan_desarrollo") as string[])
      .map((p) => p.trim())
      .filter(Boolean);
    const plan_desarrollo = planEntries.join(". ") || "Capacitación y desarrollo continuo";

    // Validate using Zod
    const validation = evaluationQuestionnaireSchema.safeParse({
      employee_id: employeeId,
      period,
      puntualidad,
      asistencia,
      productividad,
      trabajo_equipo,
      atencion_comunicacion,
      metas,
      fortalezas: strengths.length > 0 ? strengths : ["Excelente desempeño general"],
      areas_oportunidad: areas_oportunidad.length > 0 ? areas_oportunidad : ["Optimizar procesos continuos"],
      plan_desarrollo,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        fieldErrors[fieldName] = issue.message;
      });
      setFormErrors(fieldErrors);

      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        setActiveItem(firstErrorField);
      }
      toast.error("Por favor completa las preguntas requeridas.");
      return;
    }

    // Resolve target employee details
    const selectedEmp = employees.find((e) => e.id === employeeId);
    const employeeName =
      selectedEmp?.name ||
      initialEmployee?.name ||
      (employeeChoices.find((c) => c.value === employeeId)?.label as string) ||
      "Empleado";
    const jobTitle = selectedEmp?.jobTitle || initialEmployee?.jobTitle || "Puesto General";
    const department = selectedEmp?.department || initialEmployee?.department || "Operaciones";
    const avatarUrl = selectedEmp?.avatarUrl || initialEmployee?.avatarUrl || null;

    setIsSubmitting(true);

    try {
      const pScore = Number(puntualidad);
      const aScore = Number(asistencia);
      const prScore = Number(productividad);
      const tScore = Number(trabajo_equipo);
      const cScore = Number(atencion_comunicacion);
      const mScore = Number(metas);

      const result = await createEvaluationAction({
        employeeId: employeeId.startsWith("emp-") && employeeId.length < 15 ? undefined : employeeId,
        employeeName,
        jobTitle,
        department,
        avatarUrl,
        period,
        evaluatorName: "Dirección de Operaciones",
        evaluatorRole: "Administrador K'anPro",
        punctualityScore: pScore,
        attendanceScore: aScore,
        productivityScore: prScore,
        teamworkScore: tScore,
        customerServiceScore: cScore,
        goalsScore: mScore,
        strengths: validation.data.fortalezas,
        growthAreas: validation.data.areas_oportunidad,
        developmentPlan: plan_desarrollo,
        goalsAchieved: `Cumplimiento de metas: ${mScore >= 4 ? "Alto / Sobresaliente" : "Estándar"}`,
        comments: `Evaluación 360 registrada con metodología guiada para ${employeeName}.`,
        status: "completada",
      });

      if (!result.success) {
        toast.error("Error al guardar la evaluación", {
          description: result.error,
        });
        return;
      }

      const newEval: EmployeeEvaluation = {
        id: result.evaluationId || `eval-${Date.now()}`,
        employeeId,
        employeeName,
        avatarUrl,
        jobTitle,
        department,
        period,
        evaluationDate: new Date().toISOString().split("T")[0],
        evaluatorName: "Dirección de Operaciones",
        evaluatorRole: "Administrador K'anPro",
        punctualityScore: pScore,
        attendanceScore: aScore,
        productivityScore: prScore,
        teamworkScore: tScore,
        customerServiceScore: cScore,
        goalsScore: mScore,
        averageScore: result.averageScore || Math.round(((pScore + aScore + prScore + tScore + cScore + mScore) / 6) * 10) / 10,
        strengths: validation.data.fortalezas,
        growthAreas: validation.data.areas_oportunidad,
        developmentPlan: plan_desarrollo,
        goalsAchieved: `Cumplimiento de metas del periodo (${mScore}/5 ⭐)`,
        comments: `Evaluación 360 registrada para ${employeeName}.`,
        status: "completada",
      };

      onEvaluationCreated(newEval);
      toast.success("Evaluación de Desempeño 360 Completada", {
        description: `Se registró con éxito la evaluación de ${employeeName} (${result.averageScore || newEval.averageScore}/5.0 ⭐).`,
      });

      onOpenChange(false);
    } catch (err: any) {
      console.error("Error submitting questionnaire:", err);
      toast.error("Ocurrió un error inesperado al guardar la evaluación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (employeeChoices.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 sm:p-7 bg-card border-border/80 text-center">
          <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Users className="size-7" />
          </div>
          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            Sin Empleados Activos
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Para realizar una evaluación 360, primero debes registrar o vincular empleados en tu plantilla activa desde el módulo de Personal o Contrataciones.
          </DialogDescription>
          <div className="pt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs px-5 h-9"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] rounded-3xl p-6 sm:p-7 bg-card border-border/80 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1 text-left pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="size-3.5 text-primary" />
              <span>Cuestionario Guiado 360</span>
            </div>
            <Badge className="bg-primary/10 text-primary border-none text-[11px] font-bold px-2.5 py-0.5">
              LFT & Estándares K'anPro
            </Badge>
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
            Evaluación de Desempeño Laboral
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Responde cada sección del cuestionario para generar un reporte integral de competencias.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <Questionnaire
            items={items}
            shortcuts="letters"
            item={activeItem}
            onItemChange={setActiveItem}
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between pb-2">
              <QuestionnaireProgress className="text-xs font-bold text-muted-foreground" />
            </div>

            {items.map((question) => {
              const hasInput = "input" in question && Boolean(question.input);
              const isMultiple = "multiple" in question && Boolean(question.multiple);
              const errorText = formErrors[question.name];

              return (
                <QuestionnaireItem
                  key={question.name}
                  name={question.name}
                  required={question.required}
                  multiple={isMultiple}
                  invalid={Boolean(errorText)}
                  className="space-y-3"
                >
                  <div>
                    <QuestionnaireTitle className="text-base font-bold text-foreground">
                      {question.prompt}
                    </QuestionnaireTitle>
                    <QuestionnaireDescription className="text-xs text-muted-foreground mt-0.5">
                      {question.description}
                    </QuestionnaireDescription>
                  </div>

                  <QuestionnaireChoices className="gap-2.5">
                    {question.choices.map((choice) => (
                      <QuestionnaireChoice
                        key={choice.value}
                        value={choice.value}
                        className="py-2.5 px-3.5 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors"
                      >
                        <span className="font-bold text-xs text-foreground">
                          {choice.label}
                        </span>
                        {"description" in choice && choice.description ? (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {choice.description}
                          </span>
                        ) : null}
                      </QuestionnaireChoice>
                    ))}

                    {hasInput && question.input ? (
                      <div className="pt-1">
                        <QuestionnaireInput
                          aria-label={question.input.label}
                          placeholder={question.input.placeholder}
                          className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                        />
                      </div>
                    ) : null}
                  </QuestionnaireChoices>

                  {errorText ? (
                    <QuestionnaireError className="text-xs font-semibold text-destructive mt-1">
                      {errorText}
                    </QuestionnaireError>
                  ) : null}
                </QuestionnaireItem>
              );
            })}

            <div className="pt-4 border-t border-border/40 mt-4">
              <QuestionnaireActions className="flex items-center justify-between gap-2">
                <QuestionnairePrevious
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold h-10 px-4 cursor-pointer"
                >
                  Anterior
                </QuestionnairePrevious>

                <div className="flex items-center gap-2">
                  <QuestionnaireSkip
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs font-medium h-10 px-3 cursor-pointer text-muted-foreground"
                  >
                    Omitir
                  </QuestionnaireSkip>

                  <QuestionnaireNext
                    size="sm"
                    variant="default"
                    className="rounded-xl text-xs font-bold h-10 px-5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Siguiente
                  </QuestionnaireNext>

                  <QuestionnaireSubmit
                    size="sm"
                    variant="default"
                    disabled={isSubmitting}
                    className="rounded-xl text-xs font-bold h-10 px-6 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Guardando Evaluación...
                      </>
                    ) : (
                      "Concluir Evaluación 360"
                    )}
                  </QuestionnaireSubmit>
                </div>
              </QuestionnaireActions>
            </div>
          </Questionnaire>
        </div>
      </DialogContent>
    </Dialog>
  );
}
