import { describe, it, expect } from "vitest";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  vacancyWizardSchema,
  DEFAULT_WIZARD_VALUES,
} from "../vacancy-wizard.schema";
import { VACANCY_PRESETS } from "../../data/vacancy-presets";
import { WIZARD_STEPS } from "../../components/wizard/vacancy-wizard-container";

describe("Vacancy Wizard Validation Schemas", () => {
  describe("Step 1: Puesto y Datos Básicos", () => {
    it("should validate valid step 1 data", () => {
      const result = step1Schema.safeParse({
        title: "Cocinero B",
        category: "Alimentos y Bebidas",
        employment_type: "Tiempo Completo",
        shift_schedule: "Matutino (Mañana)",
        positions_available: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should fail when title is too short", () => {
      const result = step1Schema.safeParse({
        title: "AB",
        category: "Alimentos y Bebidas",
        employment_type: "Tiempo Completo",
        shift_schedule: "Matutino (Mañana)",
        positions_available: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("al menos 3 caracteres");
      }
    });

    it("should fail when positions_available is less than 1", () => {
      const result = step1Schema.safeParse({
        title: "Mesero de Restaurante",
        category: "Alimentos y Bebidas",
        employment_type: "Tiempo Completo",
        shift_schedule: "Matutino (Mañana)",
        positions_available: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Step 2: Ubicación, Salario y Beneficios", () => {
    it("should validate valid step 2 data", () => {
      const result = step2Schema.safeParse({
        location: "Mérida, Yucatán",
        zone: "Centro Mérida",
        salary_min: 10000,
        salary_max: 15000,
        payment_frequency: "quincenal",
        benefits: ["Prestaciones de Ley"],
      });
      expect(result.success).toBe(true);
    });

    it("should fail when salary_max is less than salary_min", () => {
      const result = step2Schema.safeParse({
        location: "Mérida, Yucatán",
        zone: "Centro Mérida",
        salary_min: 20000,
        salary_max: 10000,
        payment_frequency: "quincenal",
        benefits: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("mayor o igual al mínimo");
      }
    });

    it("should allow null or empty salaries", () => {
      const result = step2Schema.safeParse({
        location: "Cancún, Q. Roo",
        zone: "Zona Hotelera",
        salary_min: null,
        salary_max: null,
        payment_frequency: "semanal",
        benefits: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Step 3: Descripción & Requisitos", () => {
    it("should validate valid description", () => {
      const result = step3Schema.safeParse({
        description: "<h2>Responsabilidades</h2><p>Atención al cliente y elaboración de platillos.</p>",
        experience_required: "6 meses a 1 año",
        education_level: "Indistinto",
        skills: ["Cocina", "Puntualidad"],
      });
      expect(result.success).toBe(true);
    });

    it("should fail when description is too short", () => {
      const result = step3Schema.safeParse({
        description: "Corto",
        experience_required: "Sin experiencia previa",
        education_level: "Indistinto",
        skills: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Step 4: Contacto y Publicación", () => {
    it("should validate valid 10-digit whatsapp phone", () => {
      const result = step4Schema.safeParse({
        contact_phone: "9991234567",
        contact_email: "contacto@empresa.com",
        preferred_contact_method: "whatsapp",
        is_active: true,
      });
      expect(result.success).toBe(true);
    });

    it("should fail when whatsapp phone is invalid", () => {
      const result = step4Schema.safeParse({
        contact_phone: "123",
        contact_email: "",
        preferred_contact_method: "whatsapp",
        is_active: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Unified Wizard Schema & Presets", () => {
    it("should validate DEFAULT_WIZARD_VALUES with full schema", () => {
      const result = vacancyWizardSchema.safeParse({
        ...DEFAULT_WIZARD_VALUES,
        title: "Cocinero B",
        contact_phone: "9991234567",
      });
      expect(result.success).toBe(true);
    });

    it("should have valid data in all preset job templates", () => {
      expect(VACANCY_PRESETS.length).toBeGreaterThan(0);
      for (const preset of VACANCY_PRESETS) {
        expect(preset.title).toBeTruthy();
        expect(preset.category).toBeTruthy();
        expect(preset.salary_min).toBeGreaterThanOrEqual(0);
        expect(preset.salary_max).toBeGreaterThanOrEqual(preset.salary_min);
        expect(preset.description.length).toBeGreaterThan(15);
      }
    });

    it("should define exactly 4 wizard steps", () => {
      expect(WIZARD_STEPS.length).toBe(4);
      expect(WIZARD_STEPS.map((s) => s.id)).toEqual([1, 2, 3, 4]);
    });
  });
});
