import { describe, it, expect } from "vitest";
import { applyPreset } from "../vacancy-payload.factory";
import {
  DEFAULT_WIZARD_VALUES,
  type VacancyWizardValues,
} from "../../schemas/vacancy-wizard.schema";
import { VACANCY_PRESETS } from "../../data/vacancy-presets";

function getPresetById(id: string) {
  const preset = VACANCY_PRESETS.find((item) => item.id === id);
  if (!preset) {
    throw new Error(`Preset no encontrado: ${id}`);
  }
  return preset;
}

describe("vacancy-payload.factory: applyPreset", () => {
  it("aplica el preset de cocinero con todos los campos esperados del puesto", () => {
    const cocinero = getPresetById("cocinero");
    const baseValues: VacancyWizardValues = { ...DEFAULT_WIZARD_VALUES };

    const result = applyPreset(baseValues, cocinero);

    expect(result.title).toBe("Cocinero B (Línea Caliente y Fría)");
    expect(result.category).toBe("Alimentos y Bebidas");
    expect(result.employment_type).toBe("Tiempo Completo");
    expect(result.shift_schedule).toBe("Mixto / Rolado");
    expect(result.salary_min).toBe(12000);
    expect(result.salary_max).toBe(16000);
    expect(result.payment_frequency).toBe("quincenal");
    expect(result.benefits).toEqual(cocinero.benefits);
    expect(result.benefits).not.toBe(cocinero.benefits);
    expect(result.description).toBe(cocinero.description);
    expect(result.skills).toEqual([
      "Manejo Higiénico",
      "Línea Caliente",
      "Control de Mermas",
      "Trabajo en Equipo",
    ]);
    expect(result.skills).not.toBe(cocinero.skills);
    expect(result.experience_required).toBe("6 meses a 1 año");
    expect(result.education_level).toBe("Indistinto");
    expect(baseValues.title).toBe("");
  });

  it("conserva la ubicación, plazas y datos de contacto previos del formulario", () => {
    const cocinero = getPresetById("cocinero");
    const formValues: VacancyWizardValues = {
      ...DEFAULT_WIZARD_VALUES,
      positions_available: 3,
      location: "Playa del Carmen, Q. Roo",
      zone: "Playacar",
      contact_phone: "9841234567",
      contact_email: "talento@hotelcaribe.mx",
      preferred_contact_method: "both",
      is_active: false,
    };

    const result = applyPreset(formValues, cocinero);

    expect(result.positions_available).toBe(3);
    expect(result.location).toBe("Playa del Carmen, Q. Roo");
    expect(result.zone).toBe("Playacar");
    expect(result.contact_phone).toBe("9841234567");
    expect(result.contact_email).toBe("talento@hotelcaribe.mx");
    expect(result.preferred_contact_method).toBe("both");
    expect(result.is_active).toBe(false);
  });

  it("reemplaza por completo un preset previo al aplicar un segundo preset sin arrastrar valores", () => {
    const cocinero = getPresetById("cocinero");
    const recepcionista = getPresetById("recepcionista");
    const initialValues: VacancyWizardValues = {
      ...DEFAULT_WIZARD_VALUES,
      location: "Cancún, Q. Roo",
      zone: "Zona Hotelera",
      contact_phone: "9987654321",
    };

    const afterFirst = applyPreset(initialValues, cocinero);
    const afterSecond = applyPreset(afterFirst, recepcionista);

    expect(afterSecond.title).toBe("Recepcionista Bilingüe de Hotel");
    expect(afterSecond.category).toBe("Hotelería y Turismo");
    expect(afterSecond.employment_type).toBe("Tiempo Completo");
    expect(afterSecond.shift_schedule).toBe("Turno Rotativo");
    expect(afterSecond.salary_min).toBe(14000);
    expect(afterSecond.salary_max).toBe(18000);
    expect(afterSecond.payment_frequency).toBe("quincenal");
    expect(afterSecond.benefits).toEqual(recepcionista.benefits);
    expect(afterSecond.description).toBe(recepcionista.description);
    expect(afterSecond.skills).toEqual(recepcionista.skills);
    expect(afterSecond.skills).not.toContain("Línea Caliente");
    expect(afterSecond.experience_required).toBe("Sin experiencia previa");
    expect(afterSecond.education_level).toBe("Preparatoria / Bachillerato");
    expect(afterSecond.location).toBe("Cancún, Q. Roo");
    expect(afterSecond.zone).toBe("Zona Hotelera");
    expect(afterSecond.contact_phone).toBe("9987654321");
  });
});
