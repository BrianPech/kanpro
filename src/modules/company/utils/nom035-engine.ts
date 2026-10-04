import type {
  Nom035RiskLevel,
  Nom035GuideType,
  Nom035Metrics,
} from "../types/evaluations";

export interface Nom035DimensionScores {
  environmentScore: number;
  activityFactorsScore: number;
  timeOrganizationScore: number;
  leadershipRelationsScore: number;
  organizationalClimateScore: number;
}

/**
 * Motor de Dominio POO para la Norma Oficial Mexicana NOM-035-STPS-2018
 * Conforme a .agents/rules/domain-patterns.md
 * Encapsula la ponderación de dimensiones, cálculo de nivel de riesgo y agregación de métricas.
 */
export class Nom035Engine {
  private readonly dimensions: Nom035DimensionScores;
  private readonly guideType: Nom035GuideType;
  private readonly totalScore: number;
  private readonly riskLevel: Nom035RiskLevel;

  constructor(
    dimensions: Nom035DimensionScores,
    guideType: Nom035GuideType = "guia_ii"
  ) {
    this.dimensions = {
      environmentScore: Math.max(0, Number(dimensions.environmentScore) || 0),
      activityFactorsScore: Math.max(0, Number(dimensions.activityFactorsScore) || 0),
      timeOrganizationScore: Math.max(0, Number(dimensions.timeOrganizationScore) || 0),
      leadershipRelationsScore: Math.max(0, Number(dimensions.leadershipRelationsScore) || 0),
      organizationalClimateScore: Math.max(0, Number(dimensions.organizationalClimateScore) || 0),
    };
    this.guideType = guideType;
    this.totalScore = Nom035Engine.calculateTotalScore(this.dimensions);
    this.riskLevel = Nom035Engine.calculateRiskLevel(this.totalScore, this.guideType);
  }

  public static calculateTotalScore(dimensions: Nom035DimensionScores): number {
    return (
      Math.max(0, Number(dimensions.environmentScore) || 0) +
      Math.max(0, Number(dimensions.activityFactorsScore) || 0) +
      Math.max(0, Number(dimensions.timeOrganizationScore) || 0) +
      Math.max(0, Number(dimensions.leadershipRelationsScore) || 0) +
      Math.max(0, Number(dimensions.organizationalClimateScore) || 0)
    );
  }

  /**
   * Determina el nivel de riesgo conforme a los baremos de las Guías de Referencia de la NOM-035.
   * Guía II (Centros de 16 a 50 trabajadores) y Guía III (Centros de más de 50 trabajadores).
   */
  public static calculateRiskLevel(
    totalScore: number,
    guideType: Nom035GuideType = "guia_ii"
  ): Nom035RiskLevel {
    if (guideType === "guia_iii") {
      if (totalScore < 50) return "nulo";
      if (totalScore < 75) return "bajo";
      if (totalScore < 99) return "medio";
      if (totalScore < 140) return "alto";
      return "muy_alto";
    }

    // Default para Guía II y Guía I
    if (totalScore < 20) return "nulo";
    if (totalScore < 45) return "bajo";
    if (totalScore < 70) return "medio";
    if (totalScore < 90) return "alto";
    return "muy_alto";
  }

  /**
   * Genera el plan de acción y recomendaciones obligatorias según el nivel de riesgo identificado.
   */
  public static getRecommendedActionPlan(riskLevel: Nom035RiskLevel): string {
    switch (riskLevel) {
      case "muy_alto":
        return "Se requiere realizar una evaluación clínica a los trabajadores e implementar un Programa de Intervención Organizacional integral inmediato con medidas de control de tercer nivel (apoyo psicológico y médico).";
      case "alto":
        return "Se requiere realizar una campaña de sensibilización, revisar la carga laboral, los horarios de trabajo y promover el sentido de pertenencia y liderazgo constructivo con evaluación semestral.";
      case "medio":
        return "Se sugiere revisar las políticas de prevención de riesgos psicosociales, difundir programas de apoyo y realizar encuestas de clima laboral de seguimiento.";
      case "bajo":
        return "Mantener la difusión de la política de prevención de riesgos psicosociales y promover actividades de integración laboral y ergonomía preventiva.";
      case "nulo":
      default:
        return "El centro de trabajo no presenta indicios significativos de riesgo psicosocial. Continuar con las buenas prácticas organizacionales y revisiones anuales preventivas.";
    }
  }

  /**
   * Agrega y calcula las métricas globales de un conjunto de encuestas NOM-035.
   */
  public static calculateMetrics(
    surveys: Array<{
      totalScore: number;
      riskLevel: Nom035RiskLevel;
      environmentScore: number;
      activityFactorsScore: number;
      timeOrganizationScore: number;
      leadershipRelationsScore: number;
      organizationalClimateScore: number;
    }>
  ): Nom035Metrics {
    const totalSurveys = surveys.length;
    if (totalSurveys === 0) {
      return {
        totalSurveys: 0,
        averageTotalScore: 0,
        overallRiskLevel: "nulo",
        riskCounts: { nulo: 0, bajo: 0, medio: 0, alto: 0, muy_alto: 0 },
        dimensionAverages: {
          environment: 0,
          activityFactors: 0,
          timeOrganization: 0,
          leadershipRelations: 0,
          organizationalClimate: 0,
        },
      };
    }

    const riskCounts: Record<Nom035RiskLevel, number> = {
      nulo: 0,
      bajo: 0,
      medio: 0,
      alto: 0,
      muy_alto: 0,
    };

    let sumTotal = 0;
    let sumEnv = 0;
    let sumAct = 0;
    let sumTime = 0;
    let sumLead = 0;
    let sumClim = 0;

    for (const survey of surveys) {
      if (riskCounts[survey.riskLevel] !== undefined) {
        riskCounts[survey.riskLevel]++;
      }
      sumTotal += survey.totalScore || 0;
      sumEnv += survey.environmentScore || 0;
      sumAct += survey.activityFactorsScore || 0;
      sumTime += survey.timeOrganizationScore || 0;
      sumLead += survey.leadershipRelationsScore || 0;
      sumClim += survey.organizationalClimateScore || 0;
    }

    const averageTotalScore = Math.round((sumTotal / totalSurveys) * 10) / 10;
    const overallRiskLevel = Nom035Engine.calculateRiskLevel(averageTotalScore, "guia_ii");

    return {
      totalSurveys,
      averageTotalScore,
      overallRiskLevel,
      riskCounts,
      dimensionAverages: {
        environment: Math.round((sumEnv / totalSurveys) * 10) / 10,
        activityFactors: Math.round((sumAct / totalSurveys) * 10) / 10,
        timeOrganization: Math.round((sumTime / totalSurveys) * 10) / 10,
        leadershipRelations: Math.round((sumLead / totalSurveys) * 10) / 10,
        organizationalClimate: Math.round((sumClim / totalSurveys) * 10) / 10,
      },
    };
  }

  public getTotalScore(): number {
    return this.totalScore;
  }

  public getRiskLevel(): Nom035RiskLevel {
    return this.riskLevel;
  }

  public getActionPlan(): string {
    return Nom035Engine.getRecommendedActionPlan(this.riskLevel);
  }

  public getDimensions(): Nom035DimensionScores {
    return { ...this.dimensions };
  }

  public getGuideType(): Nom035GuideType {
    return this.guideType;
  }
}
