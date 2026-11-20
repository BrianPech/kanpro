import { describe, test, expect } from "vitest";
import {
  applyPreset,
  buildCloneInsert,
  buildExpressInsert,
  buildInsert,
  buildUpdate,
} from "@/modules/company/factories/vacancy-payload.factory";
import {
  DEFAULT_WIZARD_VALUES,
  type VacancyWizardValues,
} from "@/modules/company/schemas/vacancy-wizard.schema";
import { VACANCY_PRESETS } from "@/modules/company/data/vacancy-presets";
import type { VacancyRow } from "@/modules/company/repositories/vacancies.repository";

const wizard: VacancyWizardValues = {
  ...DEFAULT_WIZARD_VALUES,
  title: "  Barista  ",
  description: "  Preparación de bebidas en barra.  ",
  location: " Mérida, Yucatán ",
  zone: " Centro Mérida ",
  salary_min: 9000,
  salary_max: 12000,
  skills: ["Servicio"],
  contact_phone: " 9991234567 ",
  contact_email: "",
  is_active: true,
};

describe("Paso 2: Factory de payload de vacantes", () => {
  test("buildInsert: crea desde valores del wizard con tenant y reclutador", () => {
    const p = buildInsert("comp-1", "user-1", wizard);
    expect(p.company_id).toBe("comp-1");
    expect(p.recruiter_id).toBe("user-1");
    expect(p.title).toBe("Barista");
    expect(p.description).toBe("Preparación de bebidas en barra.");
    expect(p.requirements).toBe(p.description);
    expect(p.tags).toEqual(["Servicio"]);
    expect(p.contact_phone).toBe("9991234567");
    expect(p.contact_email).toBeNull();
    expect(p.is_active).toBe(true);
    expect(p.status).toBe("Activa");
    expect(buildInsert("c", "u", { ...wizard, is_active: false }).status).toBe(
      "Borrador"
    );
  });

  test("buildUpdate: actualiza desde wizard sin tocar tenant ni reclutador", () => {
    const p = buildUpdate({ ...wizard, is_active: false }, "2026-01-01T00:00:00.000Z");
    expect(p.title).toBe("Barista");
    expect(p.status).toBe("Borrador");
    expect(p.is_active).toBe(false);
    expect(p.updated_at).toBe("2026-01-01T00:00:00.000Z");
    expect(p).not.toHaveProperty("company_id");
    expect(p).not.toHaveProperty("recruiter_id");
  });

  test("buildExpressInsert: aplica defaults y ubicación de empresa", () => {
    const input = {
      title: " Auxiliar ",
      zone: "Tulum",
      category: "Mantenimiento y Limpieza",
      requirements: "Plomería básica",
      salary_min: null,
      salary_max: 14000,
      modality: "Presencial",
    };
    const p = buildExpressInsert("comp-1", "user-1", input, null);
    expect(p.title).toBe("Auxiliar");
    expect(p.location).toBe("Tulum");
    expect(p.recruiter_id).toBe("user-1");
    expect(p.status).toBe("Activa");
    expect(p.positions_available).toBe(1);
    expect(buildExpressInsert("c", "u", input, "Cancún").location).toBe("Cancún");
  });

  test("buildCloneInsert: Borrador, sufijo (Copia) y recruiter_id del usuario resuelto", () => {
    const source = {
      id: "v1",
      company_id: "comp-1",
      recruiter_id: "otro",
      title: "Chef",
      description: "d",
      requirements: "r",
      category: "Alimentos y Bebidas",
      employment_type: "Tiempo Completo",
      skills: ["A"],
      tags: null,
      is_active: true,
      status: "Activa",
    } as unknown as VacancyRow;
    const p = buildCloneInsert(source, "comp-1", "user-9");
    expect(p.title).toBe("Chef (Copia)");
    expect(p.recruiter_id).toBe("user-9");
    expect(p.company_id).toBe("comp-1");
    expect(p.status).toBe("Borrador");
    expect(p.is_active).toBe(false);
    expect(p.tags).toEqual(["A"]);
    expect(p).not.toHaveProperty("id");
  });

  test("applyPreset: pre-llena campos del puesto y conserva ubicación/contacto", () => {
    const preset = VACANCY_PRESETS[0];
    const base: VacancyWizardValues = {
      ...wizard,
      zone: "Tulum",
      contact_phone: "9990001111",
      positions_available: 3,
    };
    const next = applyPreset(base, preset);
    expect(next.title).toBe(preset.title);
    expect(next.category).toBe(preset.category);
    expect(next.salary_min).toBe(preset.salary_min);
    expect(next.benefits).toEqual(preset.benefits);
    expect(next.benefits).not.toBe(preset.benefits);
    expect(next.zone).toBe("Tulum");
    expect(next.contact_phone).toBe("9990001111");
    expect(next.positions_available).toBe(3);
    expect(base.title).toBe("  Barista  ");
  });
});
