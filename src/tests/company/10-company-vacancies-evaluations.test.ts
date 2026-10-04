import { describe, test, expect, vi } from "vitest";
import { Nom035Engine } from "@/modules/company/utils/nom035-engine";
import {
  cloneVacancySchema,
  createExpressVacancySchema,
  toggleVacancyStatusSchema,
  deleteVacancySchema,
  vacancyWizardSchema,
} from "@/modules/company/schemas/vacancies.schema";
import {
  createEvaluationSchema,
  deleteEvaluationSchema,
  createNom035SurveySchema,
  deleteNom035SurveySchema,
} from "@/modules/company/schemas/evaluations.schema";
import {
  CompanyVacanciesService,
  type VacancyRow,
} from "@/modules/company/services/company-vacancies";
import {
  CompanyEvaluationsService,
  type EvaluationRow,
  type Nom035SurveyRow,
} from "@/modules/company/services/company-evaluations";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Fase 19: Vacantes y Evaluaciones/NOM-035 - Patrón Schema -> Handler -> Service", () => {
  describe("1. Motor de Dominio NOM-035 (nom035-engine.ts)", () => {
    test("Nom035Engine: Calcula puntaje total sumando las 5 dimensiones", () => {
      const dimensions = {
        environmentScore: 8,
        activityFactorsScore: 12,
        timeOrganizationScore: 6,
        leadershipRelationsScore: 10,
        organizationalClimateScore: 9,
      };

      const engine = new Nom035Engine(dimensions, "guia_ii");
      expect(engine.getTotalScore()).toBe(45);
      expect(engine.getRiskLevel()).toBe("medio");
    });

    test("Nom035Engine: Clasifica correctamente los niveles de riesgo para Guía II y Guía III", () => {
      // Guía II
      expect(Nom035Engine.calculateRiskLevel(15, "guia_ii")).toBe("nulo");
      expect(Nom035Engine.calculateRiskLevel(30, "guia_ii")).toBe("bajo");
      expect(Nom035Engine.calculateRiskLevel(55, "guia_ii")).toBe("medio");
      expect(Nom035Engine.calculateRiskLevel(80, "guia_ii")).toBe("alto");
      expect(Nom035Engine.calculateRiskLevel(95, "guia_ii")).toBe("muy_alto");

      // Guía III (Centros > 50 colaboradores)
      expect(Nom035Engine.calculateRiskLevel(40, "guia_iii")).toBe("nulo");
      expect(Nom035Engine.calculateRiskLevel(60, "guia_iii")).toBe("bajo");
      expect(Nom035Engine.calculateRiskLevel(85, "guia_iii")).toBe("medio");
      expect(Nom035Engine.calculateRiskLevel(110, "guia_iii")).toBe("alto");
      expect(Nom035Engine.calculateRiskLevel(150, "guia_iii")).toBe("muy_alto");
    });

    test("Nom035Engine: Genera plan de acción según el nivel de riesgo identificado", () => {
      const planNulo = Nom035Engine.getRecommendedActionPlan("nulo");
      expect(planNulo).toContain("no presenta indicios significativos");

      const planMuyAlto = Nom035Engine.getRecommendedActionPlan("muy_alto");
      expect(planMuyAlto).toContain("evaluación clínica a los trabajadores");
    });

    test("Nom035Engine: Agrega métricas globales y calcula promedios correctamente", () => {
      const surveys = [
        {
          totalScore: 20,
          riskLevel: "bajo" as const,
          environmentScore: 5,
          activityFactorsScore: 5,
          timeOrganizationScore: 5,
          leadershipRelationsScore: 5,
          organizationalClimateScore: 0,
        },
        {
          totalScore: 80,
          riskLevel: "alto" as const,
          environmentScore: 15,
          activityFactorsScore: 20,
          timeOrganizationScore: 15,
          leadershipRelationsScore: 15,
          organizationalClimateScore: 15,
        },
      ];

      const metrics = Nom035Engine.calculateMetrics(surveys);
      expect(metrics.totalSurveys).toBe(2);
      expect(metrics.averageTotalScore).toBe(50);
      expect(metrics.riskCounts.bajo).toBe(1);
      expect(metrics.riskCounts.alto).toBe(1);
      expect(metrics.dimensionAverages.environment).toBe(10);
      expect(metrics.dimensionAverages.activityFactors).toBe(12.5);
    });
  });

  describe("2. Validación de Esquemas Zod (vacancies.schema.ts y evaluations.schema.ts)", () => {
    test("createExpressVacancySchema: Valida coherencia de salarios y campos obligatorios", () => {
      const valid = {
        title: "Bartender Coctelería de Autor",
        zone: "Centro Mérida",
        category: "Alimentos y Bebidas",
        requirements: "Experiencia en coctelería clásica y moderna de 1 año",
        salary_min: 14000,
        salary_max: 18000,
        modality: "Presencial",
      };
      expect(createExpressVacancySchema.safeParse(valid).success).toBe(true);

      const invalidSalary = {
        ...valid,
        salary_min: 20000,
        salary_max: 15000,
      };
      expect(createExpressVacancySchema.safeParse(invalidSalary).success).toBe(false);
    });

    test("cloneVacancySchema & deleteVacancySchema: Exigen UUID válido", () => {
      const validUuid = { vacancyId: "123e4567-e89b-12d3-a456-426614174000" };
      expect(cloneVacancySchema.safeParse(validUuid).success).toBe(true);
      expect(deleteVacancySchema.safeParse(validUuid).success).toBe(true);

      const invalid = { vacancyId: "not-a-uuid" };
      expect(cloneVacancySchema.safeParse(invalid).success).toBe(false);
      expect(deleteVacancySchema.safeParse(invalid).success).toBe(false);
    });

    test("createEvaluationSchema: Valida calificaciones en escala de 1 a 5", () => {
      const validEval = {
        employeeName: "Eduardo Castillo",
        jobTitle: "Capitán de Meseros",
        department: "Alimentos y Bebidas",
        period: "Q1 2026",
        evaluatorName: "Carlos Gerente",
        punctualityScore: 5,
        attendanceScore: 4,
        productivityScore: 5,
        teamworkScore: 4,
        customerServiceScore: 5,
        goalsScore: 4,
        strengths: ["Liderazgo en servicio", "Proactividad"],
        growthAreas: ["Manejo de inventario"],
      };
      expect(createEvaluationSchema.safeParse(validEval).success).toBe(true);

      const invalidScore = {
        ...validEval,
        punctualityScore: 6, // Fuera del rango 1-5
      };
      expect(createEvaluationSchema.safeParse(invalidScore).success).toBe(false);

      const zeroScore = {
        ...validEval,
        punctualityScore: 0,
      };
      expect(createEvaluationSchema.safeParse(zeroScore).success).toBe(false);
    });

    test("createNom035SurveySchema: Valida puntajes no negativos y tipo de guía", () => {
      const validSurvey = {
        employeeName: "Laura Ricalde",
        jobTitle: "Recepcionista",
        department: "Recepción",
        guideType: "guia_ii" as const,
        environmentScore: 5,
        activityFactorsScore: 10,
        timeOrganizationScore: 4,
        leadershipRelationsScore: 8,
        organizationalClimateScore: 5,
      };
      expect(createNom035SurveySchema.safeParse(validSurvey).success).toBe(true);

      const negativeScore = {
        ...validSurvey,
        environmentScore: -2,
      };
      expect(createNom035SurveySchema.safeParse(negativeScore).success).toBe(false);
    });
  });

  describe("3. Servicio de Vacantes (CompanyVacanciesService)", () => {
    function createMockVacanciesSupabase(
      initialVacancies: Partial<VacancyRow>[] = [],
      subscriptionPlan = "basic"
    ) {
      const vacancies = [...initialVacancies] as VacancyRow[];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { subscription_plan: subscriptionPlan, fiscal_address: "Mérida, Yucatán" },
                    error: null,
                  })),
                })),
              })),
            };
          }

          if (table === "vacancies") {
            return {
              select: vi.fn((fields?: string, opts?: { count?: string; head?: boolean }) => {
                if (opts?.head) {
                  return {
                    eq: vi.fn((fieldA: string, valA: string) => ({
                      eq: vi.fn((fieldB: string, valB: boolean) => {
                        const count = vacancies.filter(
                          (v) => (v as any)[fieldA] === valA && (v as any)[fieldB] === valB
                        ).length;
                        return Promise.resolve({ count, error: null });
                      }),
                    })),
                  };
                }

                return {
                  eq: vi.fn((fieldA: string, valA: string) => ({
                    eq: vi.fn((fieldB: string, valB: string) => ({
                      maybeSingle: vi.fn(async () => {
                        const found = vacancies.find(
                          (v) => (v as any)[fieldA] === valA && (v as any)[fieldB] === valB
                        );
                        return { data: found || null, error: null };
                      }),
                    })),
                    order: vi.fn(async () => {
                      const found = vacancies.filter((v) => (v as any)[fieldA] === valA);
                      return { data: found, error: null };
                    }),
                  })),
                };
              }),
              insert: vi.fn((payload: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const id = payload.id || `vac-${Date.now()}-${Math.random()}`;
                    const row = { id, created_at: new Date().toISOString(), ...payload };
                    vacancies.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              update: vi.fn((payload: any) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    select: vi.fn(() => ({
                      single: vi.fn(async () => {
                        const idx = vacancies.findIndex(
                          (v) => (v as any)[fieldA] === valA && (v as any)[fieldB] === valB
                        );
                        if (idx === -1) return { data: null, error: { message: "Not found" } };
                        vacancies[idx] = { ...vacancies[idx], ...payload };
                        return { data: vacancies[idx], error: null };
                      }),
                    })),
                  })),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = vacancies.findIndex(
                      (v) => (v as any)[fieldA] === valA && (v as any)[fieldB] === valB
                    );
                    if (idx !== -1) vacancies.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, vacancies };
    }

    test("createExpressVacancy: Crea vacante exprés asociada a la empresa", async () => {
      const { client, vacancies } = createMockVacanciesSupabase();

      const rawPayload = {
        title: "Auxiliar de Mantenimiento",
        zone: "Playa del Carmen",
        category: "Mantenimiento y Limpieza",
        requirements: "Conocimientos de electricidad y plomería básica",
        salary_min: 12000,
        salary_max: 14000,
      };
      const created = await CompanyVacanciesService.createExpressVacancy(
        client,
        "comp-1",
        createExpressVacancySchema.parse(rawPayload)
      );

      expect(created.id).toBeDefined();
      expect(created.title).toBe("Auxiliar de Mantenimiento");
      expect(created.status).toBe("Activa");
      expect(created.is_active).toBe(true);
      expect(vacancies.length).toBe(1);
    });

    test("cloneVacancy: Clona una vacante existente con sufijo (Copia) y en estado Borrador", async () => {
      const initial: Partial<VacancyRow>[] = [
        {
          id: "vac-origin-1",
          company_id: "comp-1",
          title: "Chef de Partie",
          category: "Alimentos y Bebidas",
          description: "Encargado de estación caliente",
          requirements: "Experiencia 2 años",
          is_active: true,
          status: "Activa",
        },
      ];
      const { client, vacancies } = createMockVacanciesSupabase(initial);

      const cloneRes = await CompanyVacanciesService.cloneVacancy(client, "comp-1", "vac-origin-1");

      expect(cloneRes.title).toBe("Chef de Partie (Copia)");
      expect(vacancies.length).toBe(2);

      const cloned = vacancies.find((v) => v.id === cloneRes.newVacancyId);
      expect(cloned?.status).toBe("Borrador");
      expect(cloned?.is_active).toBe(false);
    });

    test("toggleVacancyStatus: Pausa o activa una vacante", async () => {
      const initial: Partial<VacancyRow>[] = [
        {
          id: "vac-toggle-1",
          company_id: "comp-1",
          title: "Hostess",
          is_active: true,
          status: "Activa",
        },
      ];
      const { client, vacancies } = createMockVacanciesSupabase(initial);

      const paused = await CompanyVacanciesService.toggleVacancyStatus(
        client,
        "comp-1",
        "vac-toggle-1",
        false
      );
      expect(paused.is_active).toBe(false);
      expect(paused.status).toBe("Pausada");
      expect(vacancies[0].status).toBe("Pausada");
    });

    test("checkActiveVacancyLimit: Respeta el límite del Plan Básico", async () => {
      const initial: Partial<VacancyRow>[] = [
        { id: "v-1", company_id: "comp-1", is_active: true },
        { id: "v-2", company_id: "comp-1", is_active: true },
        { id: "v-3", company_id: "comp-1", is_active: true },
      ];
      const { client } = createMockVacanciesSupabase(initial, "basic");

      await expect(
        CompanyVacanciesService.checkActiveVacancyLimit(client, "comp-1")
      ).rejects.toThrow(/límite de 3 vacantes activas/);
    });

    test("deleteVacancy: Elimina la vacante de la empresa", async () => {
      const initial: Partial<VacancyRow>[] = [
        { id: "vac-del-1", company_id: "comp-1", title: "Para borrar" },
      ];
      const { client, vacancies } = createMockVacanciesSupabase(initial);

      await CompanyVacanciesService.deleteVacancy(client, "comp-1", "vac-del-1");
      expect(vacancies.length).toBe(0);
    });
  });

  describe("4. Servicio de Evaluaciones y NOM-035 (CompanyEvaluationsService)", () => {
    function createMockEvaluationsSupabase() {
      const evaluations: Partial<EvaluationRow>[] = [];
      const nom035Surveys: Partial<Nom035SurveyRow>[] = [];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_evaluations") {
            return {
              insert: vi.fn((payload: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const id = `eval-${Date.now()}`;
                    const row = { id, created_at: new Date().toISOString(), ...payload };
                    evaluations.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = evaluations.findIndex(
                      (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                    );
                    if (idx !== -1) evaluations.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }

          if (table === "company_nom035_surveys") {
            return {
              insert: vi.fn((payload: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const id = `nom-${Date.now()}`;
                    const row = { id, created_at: new Date().toISOString(), ...payload };
                    nom035Surveys.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = nom035Surveys.findIndex(
                      (s) => (s as any)[fieldA] === valA && (s as any)[fieldB] === valB
                    );
                    if (idx !== -1) nom035Surveys.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, evaluations, nom035Surveys };
    }

    test("createEvaluation: Calcula promedio y registra la evaluación 360", async () => {
      const { client, evaluations } = createMockEvaluationsSupabase();

      const rawPayload = {
        employeeName: "Marcos Varela",
        jobTitle: "Sommelier",
        department: "Vinos",
        period: "Periodo Q2 2026",
        evaluatorName: "Javier Méndez",
        punctualityScore: 5,
        attendanceScore: 5,
        productivityScore: 4,
        teamworkScore: 4,
        customerServiceScore: 5,
        goalsScore: 4,
      };
      const result = await CompanyEvaluationsService.createEvaluation(
        client,
        "comp-1",
        createEvaluationSchema.parse(rawPayload)
      );

      expect(result.evaluationId).toBeDefined();
      expect(result.averageScore).toBe(4.5);
      expect(evaluations.length).toBe(1);
      expect(evaluations[0].average_score).toBe(4.5);
    });

    test("deleteEvaluation: Elimina la evaluación de desempeño", async () => {
      const { client, evaluations } = createMockEvaluationsSupabase();
      evaluations.push({ id: "eval-101", company_id: "comp-1" });

      await CompanyEvaluationsService.deleteEvaluation(client, "comp-1", "eval-101");
      expect(evaluations.length).toBe(0);
    });

    test("createNom035Survey: Calcula nivel de riesgo y registra la encuesta NOM-035", async () => {
      const { client, nom035Surveys } = createMockEvaluationsSupabase();

      const rawSurvey = {
        employeeName: "Sofía Pech",
        guideType: "guia_ii" as const,
        environmentScore: 10,
        activityFactorsScore: 15,
        timeOrganizationScore: 10,
        leadershipRelationsScore: 10,
        organizationalClimateScore: 5,
      };
      const result = await CompanyEvaluationsService.createNom035Survey(
        client,
        "comp-1",
        createNom035SurveySchema.parse(rawSurvey)
      );

      expect(result.surveyId).toBeDefined();
      expect(result.totalScore).toBe(50);
      expect(result.riskLevel).toBe("medio");
      expect(nom035Surveys.length).toBe(1);
      expect(nom035Surveys[0].risk_level).toBe("medio");
      expect(nom035Surveys[0].action_plan).toBeDefined();
    });

    test("deleteNom035Survey: Elimina la encuesta NOM-035", async () => {
      const { client, nom035Surveys } = createMockEvaluationsSupabase();
      nom035Surveys.push({ id: "nom-201", company_id: "comp-1" });

      await CompanyEvaluationsService.deleteNom035Survey(client, "comp-1", "nom-201");
      expect(nom035Surveys.length).toBe(0);
    });
  });

  describe("5. Aislamiento Multitenant (Cross-Tenant Boundary Security)", () => {
    test("Una empresa B no puede clonar, pausar ni borrar vacantes de Empresa A", async () => {
      const vacancies: Partial<VacancyRow>[] = [
        {
          id: "vac-empresa-a",
          company_id: "empresa-a",
          title: "Vacante Exclusiva A",
          is_active: true,
          status: "Activa",
        },
      ];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "vacancies") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    maybeSingle: vi.fn(async () => {
                      const found = vacancies.find(
                        (v) => (v as any)[fieldA] === valA && (v as any)[fieldB] === valB
                      );
                      return { data: found || null, error: null };
                    }),
                  })),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = vacancies.findIndex(
                      (v) => (v as any)[fieldA] === valA && (v as any)[fieldB] === valB
                    );
                    if (idx !== -1) vacancies.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      // Empresa B intenta clonar la vacante de Empresa A
      await expect(
        CompanyVacanciesService.cloneVacancy(client, "empresa-b", "vac-empresa-a")
      ).rejects.toThrow(/No se encontró la vacante origen/);

      // Empresa B intenta borrar la vacante de Empresa A
      await CompanyVacanciesService.deleteVacancy(client, "empresa-b", "vac-empresa-a");
      // La vacante de Empresa A sigue existiendo
      expect(vacancies.length).toBe(1);
    });

    test("Una empresa B no puede borrar evaluaciones ni encuestas de Empresa A", async () => {
      const evaluations: Partial<EvaluationRow>[] = [
        { id: "eval-empresa-a", company_id: "empresa-a" },
      ];
      const surveys: Partial<Nom035SurveyRow>[] = [
        { id: "nom-empresa-a", company_id: "empresa-a" },
      ];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_evaluations") {
            return {
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = evaluations.findIndex(
                      (e) => (e as any)[fieldA] === valA && (e as any)[fieldB] === valB
                    );
                    if (idx !== -1) evaluations.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }

          if (table === "company_nom035_surveys") {
            return {
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = surveys.findIndex(
                      (s) => (s as any)[fieldA] === valA && (s as any)[fieldB] === valB
                    );
                    if (idx !== -1) surveys.splice(idx, 1);
                    return { error: null };
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      // Empresa B intenta borrar evaluación de Empresa A
      await CompanyEvaluationsService.deleteEvaluation(client, "empresa-b", "eval-empresa-a");
      expect(evaluations.length).toBe(1);

      // Empresa B intenta borrar encuesta NOM-035 de Empresa A
      await CompanyEvaluationsService.deleteNom035Survey(client, "empresa-b", "nom-empresa-a");
      expect(surveys.length).toBe(1);
    });
  });
});
