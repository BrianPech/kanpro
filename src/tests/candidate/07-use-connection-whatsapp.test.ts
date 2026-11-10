import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  formatWhatsAppPhone,
  buildWhatsAppUrl,
  executeWhatsAppConnection,
} from "@/hooks/use-connection";
import type { createClient } from "@/lib/supabase/client";

describe("Lógica de Conexión WhatsApp (Prevención de Bucle de Contacto)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined") {
      vi.spyOn(window, "open").mockImplementation(() => null);
    }
  });

  describe("1. Funciones Utilitarias de Teléfono y URL", () => {
    test("formatWhatsAppPhone: Agrega prefijo 52 a números locales mexicanos de 10 dígitos", () => {
      expect(formatWhatsAppPhone("9991234567")).toBe("529991234567");
      expect(formatWhatsAppPhone("(999) 123-4567")).toBe("529991234567");
      expect(formatWhatsAppPhone("999-123-45-67")).toBe("529991234567");
    });

    test("formatWhatsAppPhone: Mantiene intactos números que ya incluyen prefijo de país", () => {
      expect(formatWhatsAppPhone("529991234567")).toBe("529991234567");
      expect(formatWhatsAppPhone("+52 999 123 4567")).toBe("529991234567");
      expect(formatWhatsAppPhone("+1 415 555 2671")).toBe("14155552671");
    });

    test("buildWhatsAppUrl: Construye URL wa.me correctamente codificada", () => {
      const url = buildWhatsAppUrl("9991234567", "¡Hola! Me interesa la vacante.");
      expect(url).toBe("https://wa.me/529991234567?text=%C2%A1Hola!%20Me%20interesa%20la%20vacante.");
    });
  });

  describe("2. initiatedBy === 'candidate' (Candidato contacta a Empresa)", () => {
    test("Caso A: Resuelve teléfono directo de la vacante y NUNCA del propio candidato", async () => {
      const candidateUser = { id: "cand-user-123" };
      const mockInsertConnection = vi.fn().mockResolvedValue({ error: null });

      const supabaseMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: candidateUser }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === "vacancies") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "vac-888",
                      title: "Desarrollador Fullstack",
                      recruiter_id: "recruiter-456",
                      company_id: "comp-789",
                      contact_phone: "9998887766", // Teléfono de la vacante
                    },
                    error: null,
                  }),
                })),
              })),
            };
          }
          if (table === "connections") {
            return { insert: mockInsertConnection };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createClient>;

      const whatsappUrl = await executeWhatsAppConnection(supabaseMock, {
        candidateId: "cand-user-123",
        vacancyId: "vac-888",
        initiatedBy: "candidate",
      });

      // Debe abrir WhatsApp hacia el teléfono de la VACANTE (+52 9998887766), NUNCA hacia el candidato
      expect(whatsappUrl).toContain("https://wa.me/529998887766");
      expect(whatsappUrl).toContain(encodeURIComponent("Desarrollador Fullstack"));
      expect(whatsappUrl).toContain("cand-user-123"); // Enlace al perfil del candidato

      // Debe registrar la conexión con los roles correctos
      expect(mockInsertConnection).toHaveBeenCalledWith({
        candidate_id: "cand-user-123",
        recruiter_id: "recruiter-456",
        vacancy_id: "vac-888",
        initiated_by: "candidate",
        status: "contacted",
      });
    });

    test("Caso B: Fallback a company_profiles.contact_phone si la vacante no tiene teléfono directo", async () => {
      const supabaseMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cand-user-123" } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === "vacancies") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "vac-888",
                      title: "Contador Senior",
                      recruiter_id: "recruiter-456",
                      company_id: "comp-789",
                      contact_phone: null, // Vacante no tiene teléfono
                    },
                    error: null,
                  }),
                })),
              })),
            };
          }
          if (table === "company_profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      contact_phone: "9991112233", // Teléfono de la empresa
                    },
                    error: null,
                  }),
                })),
              })),
            };
          }
          if (table === "connections") {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createClient>;

      const whatsappUrl = await executeWhatsAppConnection(supabaseMock, {
        vacancyId: "vac-888",
        initiatedBy: "candidate",
      });

      // Teléfono resuelto desde company_profiles
      expect(whatsappUrl).toContain("https://wa.me/529991112233");
    });

    test("Caso C: Fallback a profiles.whatsapp_number del reclutador si ni vacante ni empresa tienen teléfono", async () => {
      const supabaseMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cand-user-123" } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === "vacancies") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "vac-888",
                      title: "Chofer",
                      recruiter_id: "recruiter-456",
                      company_id: null,
                      contact_phone: null,
                    },
                    error: null,
                  }),
                })),
              })),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      whatsapp_number: "9993334455", // WhatsApp del reclutador
                    },
                    error: null,
                  }),
                })),
              })),
            };
          }
          if (table === "connections") {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createClient>;

      const whatsappUrl = await executeWhatsAppConnection(supabaseMock, {
        vacancyId: "vac-888",
        initiatedBy: "candidate",
      });

      expect(whatsappUrl).toContain("https://wa.me/529993334455");
    });

    test("Caso D: Lanza error amigable si la empresa no tiene ningún teléfono registrado", async () => {
      const supabaseMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "cand-user-123" } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === "vacancies") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "vac-sin-tel",
                      title: "Puesto Remoto",
                      recruiter_id: "rec-999",
                      company_id: "comp-999",
                      contact_phone: null,
                    },
                    error: null,
                  }),
                })),
              })),
            };
          }
          if (table === "company_profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { contact_phone: null }, error: null }),
                })),
              })),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { whatsapp_number: null }, error: null }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createClient>;

      await expect(
        executeWhatsAppConnection(supabaseMock, {
          vacancyId: "vac-sin-tel",
          initiatedBy: "candidate",
        })
      ).rejects.toThrow("La empresa no tiene registrado un número de WhatsApp de contacto en esta vacante.");
    });
  });

  describe("3. initiatedBy === 'company' (Empresa contacta a Candidato)", () => {
    test("Obtiene correctamente el whatsapp_number del candidato y construye mensaje formal", async () => {
      const mockInsertConnection = vi.fn().mockResolvedValue({ error: null });

      const supabaseMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "recruiter-123" } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      full_name: "María Gómez",
                      whatsapp_number: "9995556677",
                    },
                    error: null,
                  }),
                })),
              })),
            };
          }
          if (table === "connections") {
            return { insert: mockInsertConnection };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createClient>;

      const whatsappUrl = await executeWhatsAppConnection(supabaseMock, {
        candidateId: "cand-456",
        initiatedBy: "company",
      });

      expect(whatsappUrl).toContain("https://wa.me/529995556677");
      expect(whatsappUrl).toContain(encodeURIComponent("María Gómez"));
      expect(mockInsertConnection).toHaveBeenCalledWith({
        candidate_id: "cand-456",
        recruiter_id: "recruiter-123",
        vacancy_id: null,
        initiated_by: "company",
        status: "contacted",
      });
    });

    test("Lanza error si el candidato no tiene número telefónico", async () => {
      const supabaseMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "recruiter-123" } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: "Sin Teléfono", whatsapp_number: null },
                    error: null,
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as ReturnType<typeof createClient>;

      await expect(
        executeWhatsAppConnection(supabaseMock, {
          candidateId: "cand-sin-tel",
          initiatedBy: "company",
        })
      ).rejects.toThrow("El candidato no tiene registrado un número telefónico de contacto.");
    });
  });
});
