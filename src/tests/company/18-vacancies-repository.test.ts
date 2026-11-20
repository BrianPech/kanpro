import { describe, test, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  SupabaseVacanciesRepository,
  type VacancyInsert,
  type VacancyRow,
} from "@/modules/company/repositories/vacancies.repository";
import { CompanyVacanciesService } from "@/modules/company/services/company-vacancies";

interface MockApplicationRow {
  vacancy_id: string | null;
}

type VacancyFilterKey = keyof VacancyRow;

function buildSampleVacancy(
  overrides: Partial<VacancyRow> = {}
): VacancyRow {
  return {
    benefits: [],
    category: "Alimentos y Bebidas",
    category_id: null,
    company_id: "comp-a",
    contact_email: "rh@empresa.mx",
    contact_phone: "9991234567",
    created_at: "2026-11-19T12:00:00.000Z",
    currency: "MXN",
    description: "Atención en barra y preparación de bebidas.",
    education_level: "Indistinto",
    employment_type: "Tiempo Completo",
    experience_required: "Sin experiencia previa",
    expires_at: null,
    featured_until: null,
    id: "vac-1",
    is_active: true,
    is_featured: false,
    is_promoted: false,
    location: "Mérida, Yucatán",
    modality: "Presencial",
    payment_frequency: "quincenal",
    positions_available: 1,
    preferred_contact_method: "whatsapp",
    recruiter_id: "user-1",
    requirements: "Atención en barra y preparación de bebidas.",
    salary_max: 12000,
    salary_min: 9000,
    shift_schedule: "Matutino (Mañana)",
    skills: ["Servicio"],
    status: "Activa",
    tags: ["Servicio"],
    title: "Barista QA",
    updated_at: "2026-11-19T12:00:00.000Z",
    zone: "Centro Mérida",
    zone_id: null,
    ...overrides,
  };
}

function createTypedMockSupabase(
  initialVacancies: VacancyRow[] = [],
  initialApplications: MockApplicationRow[] = []
) {
  const vacancies: VacancyRow[] = initialVacancies.map((v) => ({ ...v }));
  const applications: MockApplicationRow[] = initialApplications.map((a) => ({
    ...a,
  }));
  const recordedVacancyEqCalls: Array<[string, string | boolean]> = [];
  const recordedApplicationsInCalls: Array<[string, string[]]> = [];

  const matchesFilters = (
    row: VacancyRow,
    filters: Array<{ field: VacancyFilterKey; value: string | boolean }>
  ): boolean => {
    return filters.every(({ field, value }) => row[field] === value);
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "vacancies") {
        return {
          select: vi.fn(
            (
              _fields?: string,
              opts?: { count?: string; head?: boolean }
            ) => {
              const filters: Array<{
                field: VacancyFilterKey;
                value: string | boolean;
              }> = [];

              const builder = {
                eq(field: VacancyFilterKey, value: string | boolean) {
                  recordedVacancyEqCalls.push([field, value]);
                  filters.push({ field, value });
                  if (opts?.head && filters.length >= 2) {
                    const matched = vacancies.filter((v) =>
                      matchesFilters(v, filters)
                    );
                    return Promise.resolve({
                      count: matched.length,
                      error: null,
                    });
                  }
                  return builder;
                },
                order(
                  _col: string,
                  orderOpts?: { ascending?: boolean }
                ) {
                  const matched = vacancies
                    .filter((v) => matchesFilters(v, filters))
                    .sort((a, b) => {
                      const cmp = a.created_at.localeCompare(b.created_at);
                      return orderOpts?.ascending === false ? -cmp : cmp;
                    });
                  return Promise.resolve({ data: matched, error: null });
                },
                maybeSingle() {
                  const found =
                    vacancies.find((v) => matchesFilters(v, filters)) ?? null;
                  return Promise.resolve({ data: found, error: null });
                },
              };

              return builder;
            }
          ),
          insert: vi.fn((payload: VacancyInsert) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const row = buildSampleVacancy({
                  ...payload,
                  id: payload.id || `vac-${vacancies.length + 1}`,
                });
                vacancies.push(row);
                return { data: row, error: null };
              }),
            })),
          })),
          update: vi.fn((payload: Partial<VacancyRow>) => {
            const filters: Array<{
              field: VacancyFilterKey;
              value: string | boolean;
            }> = [];

            const builder = {
              eq(field: VacancyFilterKey, value: string | boolean) {
                recordedVacancyEqCalls.push([field, value]);
                filters.push({ field, value });
                return builder;
              },
              select() {
                return {
                  single: async () => {
                    const idx = vacancies.findIndex((v) =>
                      matchesFilters(v, filters)
                    );
                    if (idx === -1) {
                      return {
                        data: null,
                        error: { message: "No se pudo actualizar la vacante." },
                      };
                    }
                    vacancies[idx] = { ...vacancies[idx], ...payload };
                    return { data: vacancies[idx], error: null };
                  },
                };
              },
            };

            return builder;
          }),
          delete: vi.fn(() => {
            const filters: Array<{
              field: VacancyFilterKey;
              value: string | boolean;
            }> = [];

            const builder = {
              eq(field: VacancyFilterKey, value: string | boolean) {
                recordedVacancyEqCalls.push([field, value]);
                filters.push({ field, value });
                if (filters.length >= 2) {
                  const remaining = vacancies.filter(
                    (v) => !matchesFilters(v, filters)
                  );
                  vacancies.splice(0, vacancies.length, ...remaining);
                  return Promise.resolve({ error: null });
                }
                return builder;
              },
            };

            return builder;
          }),
        };
      }

      if (table === "applications") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async (field: string, ids: string[]) => {
              recordedApplicationsInCalls.push([field, ids]);
              const matched = applications.filter(
                (a) => a.vacancy_id !== null && ids.includes(a.vacancy_id)
              );
              return { data: matched, error: null };
            }),
          })),
        };
      }

      return {};
    }),
  } as unknown as SupabaseClient<Database>;

  return {
    client,
    vacancies,
    recordedVacancyEqCalls,
    recordedApplicationsInCalls,
  };
}

describe("Paso 1: VacanciesRepository y lecturas desacopladas", () => {
  test("create fuerza company_id al parámetro companyId aunque el payload traiga otro", async () => {
    const { client, vacancies } = createTypedMockSupabase();
    const repo = new SupabaseVacanciesRepository(client);

    const payload: VacancyInsert = {
      company_id: "empresa-maliciosa",
      recruiter_id: "user-1",
      title: "Cocinero QA",
      category: "Alimentos y Bebidas",
      employment_type: "Tiempo Completo",
      description: "Preparación de platillos calientes en cocina.",
      zone: "Centro Mérida",
    };

    const created = await repo.create("empresa-a", payload);

    expect(created.company_id).toBe("empresa-a");
    expect(vacancies[0].company_id).toBe("empresa-a");
  });

  test("listByCompany filtra por company_id y aisla vacantes entre empresas", async () => {
    const { client, recordedVacancyEqCalls } = createTypedMockSupabase([
      buildSampleVacancy({
        id: "vac-a1",
        company_id: "empresa-a",
        title: "Mesero A1",
        created_at: "2026-11-18T10:00:00.000Z",
      }),
      buildSampleVacancy({
        id: "vac-a2",
        company_id: "empresa-a",
        title: "Mesero A2",
        created_at: "2026-11-19T10:00:00.000Z",
      }),
      buildSampleVacancy({
        id: "vac-b1",
        company_id: "empresa-b",
        title: "Recepcionista B1",
        created_at: "2026-11-19T12:00:00.000Z",
      }),
    ]);
    const repo = new SupabaseVacanciesRepository(client);

    const listA = await repo.listByCompany("empresa-a");

    expect(listA.map((v) => v.id)).toEqual(["vac-a2", "vac-a1"]);
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-a"]);
  });

  test("getById devuelve la vacante de la empresa y null si pertenece a otra", async () => {
    const { client, recordedVacancyEqCalls } = createTypedMockSupabase([
      buildSampleVacancy({ id: "vac-a1", company_id: "empresa-a" }),
    ]);
    const repo = new SupabaseVacanciesRepository(client);

    const own = await repo.getById("empresa-a", "vac-a1");
    const foreign = await repo.getById("empresa-b", "vac-a1");

    expect(own?.id).toBe("vac-a1");
    expect(foreign).toBeNull();
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-a"]);
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-b"]);
  });

  test("update filtra por company_id, bloquea Empresa B e ignora cambio de company_id", async () => {
    const { client, vacancies, recordedVacancyEqCalls } = createTypedMockSupabase([
      buildSampleVacancy({
        id: "vac-a1",
        company_id: "empresa-a",
        title: "Título Original",
      }),
    ]);
    const repo = new SupabaseVacanciesRepository(client);

    await expect(
      repo.update("empresa-b", "vac-a1", { title: "Hackeado" })
    ).rejects.toThrow(/No se pudo actualizar/);
    expect(vacancies[0].title).toBe("Título Original");

    const updated = await repo.update("empresa-a", "vac-a1", {
      title: "Título Actualizado",
      company_id: "empresa-b",
    });

    expect(updated.title).toBe("Título Actualizado");
    expect(updated.company_id).toBe("empresa-a");
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-a"]);
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-b"]);
  });

  test("delete filtra por company_id e impide borrar vacantes de otra empresa", async () => {
    const { client, vacancies, recordedVacancyEqCalls } = createTypedMockSupabase([
      buildSampleVacancy({ id: "vac-a1", company_id: "empresa-a" }),
    ]);
    const repo = new SupabaseVacanciesRepository(client);

    await repo.delete("empresa-b", "vac-a1");
    expect(vacancies).toHaveLength(1);

    await repo.delete("empresa-a", "vac-a1");
    expect(vacancies).toHaveLength(0);
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-b"]);
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-a"]);
  });

  test("countActive cuenta únicamente vacantes activas de la empresa", async () => {
    const { client, recordedVacancyEqCalls } = createTypedMockSupabase([
      buildSampleVacancy({ id: "vac-a1", company_id: "empresa-a", is_active: true }),
      buildSampleVacancy({ id: "vac-a2", company_id: "empresa-a", is_active: false }),
      buildSampleVacancy({ id: "vac-b1", company_id: "empresa-b", is_active: true }),
    ]);
    const repo = new SupabaseVacanciesRepository(client);

    const activeA = await repo.countActive("empresa-a");

    expect(activeA).toBe(1);
    expect(recordedVacancyEqCalls).toContainEqual(["company_id", "empresa-a"]);
  });

  test("CompanyVacanciesService.getVacanciesWithCounts enriquece conteos acotados y omite consulta si no hay vacantes", async () => {
    const emptyMock = createTypedMockSupabase([], [
      { vacancy_id: "vac-otra-empresa" },
    ]);
    const emptyService = new CompanyVacanciesService(emptyMock.client);
    const emptyRes = await emptyService.getVacanciesWithCounts(
      "empresa-sin-vacantes"
    );

    expect(emptyRes).toEqual([]);
    expect(emptyMock.recordedApplicationsInCalls).toHaveLength(0);

    const populatedMock = createTypedMockSupabase(
      [
        buildSampleVacancy({ id: "vac-a1", company_id: "empresa-a" }),
        buildSampleVacancy({ id: "vac-a2", company_id: "empresa-a" }),
        buildSampleVacancy({ id: "vac-b1", company_id: "empresa-b" }),
      ],
      [
        { vacancy_id: "vac-a1" },
        { vacancy_id: "vac-a1" },
        { vacancy_id: "vac-b1" },
      ]
    );

    const populatedService = new CompanyVacanciesService(populatedMock.client);
    const listWithCounts = await populatedService.getVacanciesWithCounts(
      "empresa-a"
    );

    expect(listWithCounts).toHaveLength(2);
    expect(
      listWithCounts.find((v) => v.id === "vac-a1")?.applicants_count
    ).toBe(2);
    expect(
      listWithCounts.find((v) => v.id === "vac-a2")?.applicants_count
    ).toBe(0);
    expect(populatedMock.recordedApplicationsInCalls).toEqual([
      ["vacancy_id", ["vac-a1", "vac-a2"]],
    ]);
  });

  test("CompanyVacanciesService.getVacancies y getVacancyById delegan al repositorio respetando aislamiento", async () => {
    const { client } = createTypedMockSupabase([
      buildSampleVacancy({ id: "vac-a1", company_id: "empresa-a" }),
      buildSampleVacancy({ id: "vac-b1", company_id: "empresa-b" }),
    ]);
    const service = new CompanyVacanciesService(client);

    const listA = await service.getVacancies("empresa-a");
    const ownVacancy = await service.getVacancyById("empresa-a", "vac-a1");
    const foreignVacancy = await service.getVacancyById(
      "empresa-a",
      "vac-b1"
    );

    expect(listA.map((v) => v.id)).toEqual(["vac-a1"]);
    expect(ownVacancy?.id).toBe("vac-a1");
    expect(foreignVacancy).toBeNull();
  });
});
