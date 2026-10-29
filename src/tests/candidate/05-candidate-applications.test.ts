import { describe, test, expect, vi, beforeEach } from "vitest";
import { applyToVacancyAction } from "@/modules/candidate/actions/applications";
import { saveCompanyVerificationAction } from "@/modules/company/actions/verification";
import { inviteCandidateToVacancyAction } from "@/modules/company/actions/radar";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Fase 3: Estandarización de Arquitectura Modular (Schema ➔ Handler ➔ Service)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-cand-123" } },
      error: null,
    });
  });

  describe("1. applyToVacancyAction", () => {
    const validUuid = "c56a4180-65aa-42ec-a945-5fd21dec0538";

    test("Rechaza identificador de vacante inválido", async () => {
      const res = await applyToVacancyAction({ vacancyId: "not-a-uuid" });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Identificador de vacante inválido");
      }
    });

    test("Rechaza postulación sin sesión autenticada", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "No auth" } });
      const res = await applyToVacancyAction({ vacancyId: validUuid });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("No autorizado");
      }
    });

    test("Permite postularse exitosamente a una vacante disponible", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "candidate_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "user-cand-123" } }),
              })),
            })),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "vacancies") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: validUuid, title: "Mesero", is_active: true, company_id: "comp-1" },
                }),
              })),
            })),
          };
        }
        if (table === "applications") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "app-id-999" } }),
              })),
            })),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: "Juan Pérez" } }),
              })),
            })),
          };
        }
        if (table === "notifications") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const res = await applyToVacancyAction({ vacancyId: validUuid });
      if (!res.success) {
        console.error("applyToVacancyAction failed:", res.error);
      }
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.alreadyApplied).toBe(false);
        expect(res.data.applicationId).toBe("app-id-999");
      }
    });
  });

  describe("2. saveCompanyVerificationAction", () => {
    test("Actualiza datos corporativos y fiscales en servidor", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({
        eq: mockEq,
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === "company_profiles" || table === "profiles") {
          return {
            update: mockUpdate,
          };
        }
        return {};
      });

      const res = await saveCompanyVerificationAction({
        company_name: "Hoteles del Caribe SA",
        legal_name: "Operadora Hotelera del Caribe SA de CV",
        rfc: "OHC120515XYZ",
        fiscal_address: "Playa del Carmen, Quintana Roo",
        submitForReview: true,
      });

      if (!res.success) {
        console.error("saveCompanyVerificationAction failed:", res.error);
      }
      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe("3. inviteCandidateToVacancyAction", () => {
    test("Envía notificación formal al candidato", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "company_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { company_name: "Grand Hotel" } }),
              })),
            })),
          };
        }
        if (table === "vacancies") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "vac-1", title: "Bartender", company_id: "user-cand-123" } }),
                })),
              })),
            })),
          };
        }
        if (table === "notifications") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const res = await inviteCandidateToVacancyAction("cand-target-uuid", "vac-1");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.message).toContain("Bartender");
      }
    });
  });
});
