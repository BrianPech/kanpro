import { describe, it, expect, vi } from "vitest";
import { buildCfdiPayrollXml } from "@/modules/company/utils/sat-cfdi-payroll-generator";
import { PacStampingService } from "@/modules/company/services/pac-stamping-service";
import {
  calculateNineBoxQuadrant,
  NINE_BOX_QUADRANTS,
  type NineBoxQuadrantType,
} from "@/modules/company/types/evaluations";
import { CompanyEvaluationsService } from "@/modules/company/services/company-evaluations";

describe("Fase 4 (P3) - Timbrado Fiscal SAT CFDI 4.0 y Matriz 9-Box 360", () => {
  describe("1. Generador de XML CFDI 4.0 con Complemento de Nómina 1.2", () => {
    it("debe generar un XML CFDI 4.0 válido con desglose de percepciones y deducciones", () => {
      const xml = buildCfdiPayrollXml({
        folio: "REC-001",
        serie: "NOM",
        fechaEmision: "2026-10-27T12:00:00",
        fechaPago: "2026-10-31",
        fechaInicioPeriodo: "2026-10-16",
        fechaFinPeriodo: "2026-10-31",
        emisor: {
          rfc: "KAN180101XYZ",
          nombre: "K'ANPRO SERVICES S.A. DE C.V.",
          regimenFiscal: "601",
          lugarExpedicion: "77500",
        },
        receptor: {
          rfc: "GABM850412XYZ",
          curp: "GABM850412HDFR09",
          nombre: "GABRIEL MONTEJO DZIB",
          codigoPostal: "77500",
          regimenFiscal: "605",
          numEmpleado: "EMP001",
          departamento: "Operaciones",
          puesto: "Coordinador de Logística",
          nss: "12345678901",
          clabe: "012180015678901234",
        },
        conceptos: {
          diasTrabajados: 15,
          sueldoBasePeriodo: 12500,
          horasExtras: 4,
          importeHorasExtras: 600,
          bonoPuntualidad: 500,
          bonoAsistencia: 500,
          bonoDesempeno: 1000,
          descuentoFaltas: 0,
          descuentoRetardos: 100,
          retencionImss: 450,
          retencionIsr: 1850,
          totalPercepciones: 15100,
          totalDeducciones: 2400,
          netoAPagar: 12700,
        },
      });

      expect(xml).toContain('Version="4.0"');
      expect(xml).toContain('TipoDeComprobante="N"');
      expect(xml).toContain('Moneda="MXN"');
      expect(xml).toContain('xmlns:nom12="http://www.sat.gob.mx/nomina12"');
      expect(xml).toContain('Rfc="KAN180101XYZ"');
      expect(xml).toContain('Rfc="GABM850412XYZ"');
      expect(xml).toContain('SubTotal="15100.00"');
      expect(xml).toContain('Descuento="2400.00"');
      expect(xml).toContain('Total="12700.00"');
      expect(xml).toContain('CuentaBancaria="012180015678901234"');
      expect(xml).toContain('NumSeguridadSocial="12345678901"');
    });
  });

  describe("2. Certificación y Timbrado Digital con PAC (Timbre Fiscal Digital 1.1)", () => {
    it("debe timbrar con PAC emitiendo UUID fiscal RFC 4122 v4, sellos SHA-256 y QR oficial del SAT", async () => {
      const stampResult = await PacStampingService.stampPayrollReceipt({
        folio: "REC-002",
        serie: "NOM",
        fechaEmision: "2026-10-27T12:00:00",
        fechaPago: "2026-10-31",
        fechaInicioPeriodo: "2026-10-16",
        fechaFinPeriodo: "2026-10-31",
        emisor: {
          rfc: "KAN180101XYZ",
          nombre: "K'ANPRO SERVICES S.A. DE C.V.",
          regimenFiscal: "601",
          lugarExpedicion: "77500",
        },
        receptor: {
          rfc: "HERL920101ABC",
          nombre: "LUCIA HERRERA POOT",
          codigoPostal: "77500",
          regimenFiscal: "605",
          numEmpleado: "EMP002",
          departamento: "Administración",
          puesto: "Especialista de RH",
        },
        conceptos: {
          diasTrabajados: 15,
          sueldoBasePeriodo: 9000,
          horasExtras: 0,
          importeHorasExtras: 0,
          bonoPuntualidad: 450,
          bonoAsistencia: 450,
          bonoDesempeno: 0,
          descuentoFaltas: 0,
          descuentoRetardos: 0,
          retencionImss: 320,
          retencionIsr: 950,
          totalPercepciones: 9900,
          totalDeducciones: 1270,
          netoAPagar: 8630,
        },
      });

      // Valida UUID v4 oficial
      const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
      expect(stampResult.uuid).toMatch(uuidV4Regex);

      // Valida sellos y XML timbrado
      expect(stampResult.cfdSeal).toBeTruthy();
      expect(stampResult.satSeal).toBeTruthy();
      expect(stampResult.pacRfc).toBe("SAT970701NN3");
      expect(stampResult.xml).toContain("<tfd:TimbreFiscalDigital");
      expect(stampResult.xml).toContain(`UUID="${stampResult.uuid}"`);

      // Valida URL de consulta QR del SAT
      expect(stampResult.qrCode).toContain("https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx");
      expect(stampResult.qrCode).toContain(`id=${stampResult.uuid}`);
      expect(stampResult.qrCode).toContain("re=KAN180101XYZ");
      expect(stampResult.qrCode).toContain("rr=HERL920101ABC");
      expect(stampResult.qrCode).toContain("tt=8630.00");
    });
  });

  describe("3. Motor de Matriz de Talento 9-Box (Desempeño vs. Potencial)", () => {
    it("debe clasificar con exactitud matemática los 9 cuadrantes del modelo 9-Box", () => {
      // 1. Alto Potencial (>= 3.8)
      expect(calculateNineBoxQuadrant(4.5, 4.5)).toBe("estrella");
      expect(calculateNineBoxQuadrant(3.2, 4.2)).toBe("alto_potencial");
      expect(calculateNineBoxQuadrant(2.1, 4.0)).toBe("enigma");

      // 2. Medio Potencial (2.8 a 3.7)
      expect(calculateNineBoxQuadrant(4.2, 3.2)).toBe("alto_desempeno");
      expect(calculateNineBoxQuadrant(3.5, 3.5)).toBe("clave");
      expect(calculateNineBoxQuadrant(2.4, 3.0)).toBe("en_desarrollo");

      // 3. Bajo Potencial (< 2.8)
      expect(calculateNineBoxQuadrant(4.0, 2.0)).toBe("pilar_solido");
      expect(calculateNineBoxQuadrant(3.0, 2.2)).toBe("efectivo");
      expect(calculateNineBoxQuadrant(2.0, 1.8)).toBe("riesgo");
    });

    it("debe contar con metadatos descriptivos y recomendaciones estratégicas para cada cuadrante", () => {
      const quadrants: NineBoxQuadrantType[] = [
        "estrella",
        "alto_potencial",
        "enigma",
        "alto_desempeno",
        "clave",
        "en_desarrollo",
        "pilar_solido",
        "efectivo",
        "riesgo",
      ];

      quadrants.forEach((q) => {
        const meta = NINE_BOX_QUADRANTS[q];
        expect(meta).toBeDefined();
        expect(meta.title).toBeTruthy();
        expect(meta.recommendation).toBeTruthy();
        expect(meta.badgeClass).toBeTruthy();
      });
    });
  });

  describe("4. Flujo Multi-Evaluador 360° en Base de Datos", () => {
    it("debe persistir perspectiva de evaluador (jefe_directo, autoevaluacion, par, subordinado) y cuadrante 9-Box", async () => {
      let insertedPayload: Record<string, unknown> | null = null;

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "company_evaluations") {
            return {
              insert: vi.fn((payload: Record<string, unknown>) => {
                insertedPayload = payload;
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({
                      data: { id: "eval-360-real-uuid" },
                      error: null,
                    })),
                  })),
                };
              }),
            };
          }
          return {};
        }),
      } as any;

      const result = await CompanyEvaluationsService.createEvaluation(
        mockSupabase,
        "company-uuid-123",
        {
          employeeId: "emp-uuid-456",
          employeeName: "Manuel Poot May",
          jobTitle: "Líder Técnico",
          department: "Tecnología",
          period: "Q2 2026 - Evaluación 360",
          evaluatorName: "Mariana Alcocer",
          evaluatorRole: "Par / Colega",
          evaluatorRelation: "par",
          potentialScore: 4.5,
          punctualityScore: 5,
          attendanceScore: 5,
          productivityScore: 4,
          teamworkScore: 5,
          customerServiceScore: 4,
          goalsScore: 5,
          strengths: ["Excelente mentoría técnica", "Trabajo en equipo sobresaliente"],
          growthAreas: ["Delegar más tareas operativas"],
          developmentPlan: "Liderazgo de proyectos transversales",
          status: "completada",
        }
      );

      expect(result.evaluationId).toBe("eval-360-real-uuid");
      expect(result.averageScore).toBe(4.7);

      expect(insertedPayload).toBeDefined();
      expect(insertedPayload!.evaluator_relation).toBe("par");
      expect(insertedPayload!.potential_score).toBe(4.5);
      expect(insertedPayload!.nine_box_quadrant).toBe("estrella");
      expect(insertedPayload!.average_score).toBe(4.7);
    });
  });
});
