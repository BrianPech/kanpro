import { describe, test, expect, vi } from "vitest";
import { validateApplicationStatusTransition } from "@/modules/company/hooks/use-applications-inbox";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Guardián de Contratación en Tabla de Postulantes (Applications Inbox)", () => {
  describe("1. validateApplicationStatusTransition: Bloqueo de Contratación Directa", () => {
    test("Rechaza categóricamente la transición directa a 'Contratado'", () => {
      const result = validateApplicationStatusTransition("Contratado");
      expect(result.allowed).toBe(false);
      expect(result.message).toContain("asistente de contratación oficial");
    });

    test("Permite libremente transiciones evaluativas intermedias", () => {
      const allowedStatuses = [
        "Pendiente",
        "En revisión",
        "Preseleccionado",
        "Entrevista",
        "Descartado",
      ] as const;

      for (const status of allowedStatuses) {
        const result = validateApplicationStatusTransition(status);
        expect(result.allowed).toBe(true);
        expect(result.message).toBeUndefined();
      }
    });
  });

  describe("2. Integridad del Flujo Formal de Contratación (CompanyEmployeeService.hireCandidate)", () => {
    test("Garantiza que la única vía válida para contratar crea empleado, contrato y folio", async () => {
      const mockEmployees: Array<{ id: string; status: string; folio?: string }> = [];
      const mockContracts: Array<{ id: string; status: string }> = [];
      const mockApplications: Array<{ id: string; status: string; hired_at?: string }> = [
        { id: "app-test-1", status: "Entrevista" },
      ];

      const makeEqChain = () => {
        const chain: Record<string, unknown> = {};
        chain.eq = vi.fn(() => chain);
        chain.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
        chain.single = vi.fn(async () => ({ data: null, error: null }));
        chain.order = vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(async () => ({ data: null, error: null })),
          })),
        }));
        return chain;
      };

      const client = {
        from: (table: string) => {
          if (table === "applications") {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({
                    data: {
                      id: "app-test-1",
                      status: "Entrevista",
                      candidate_id: "cand-uuid-1",
                      vacancy_id: "vac-uuid-1",
                      vacancies: {
                        id: "vac-uuid-1",
                        title: "Gerente de Operaciones",
                        company_id: "comp-uuid-1",
                        recruiter_id: "comp-uuid-1",
                      },
                      candidate: {
                        id: "cand-uuid-1",
                        profiles: {
                          id: "cand-uuid-1",
                          full_name: "Alberto Morales",
                          whatsapp_number: "9991234567",
                          email: "alberto@example.com",
                          avatar_url: null,
                        },
                      },
                    },
                    error: null,
                  }),
                }),
              }),
              update: (patch: { status?: string; hired_at?: string }) => ({
                eq: async () => {
                  if (patch.status) mockApplications[0].status = patch.status;
                  if (patch.hired_at) mockApplications[0].hired_at = patch.hired_at;
                  return { error: null };
                },
              }),
            };
          }
          if (table === "company_employees") {
            return {
              select: () => makeEqChain(),
              insert: (data: { status: string; folio?: string }) => {
                const row = { id: "emp-rec-1", ...data };
                mockEmployees.push(row);
                return {
                  select: () => ({
                    single: async () => ({ data: row, error: null }),
                  }),
                  error: null,
                };
              },
            };
          }
          if (table === "company_contracts") {
            return {
              insert: async (data: { status: string }) => {
                const row = { id: "contract-1", ...data };
                mockContracts.push(row);
                return {
                  select: () => ({
                    single: async () => ({ data: row, error: null }),
                  }),
                  error: null,
                };
              },
            };
          }
          if (table === "company_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { company_name: "Restaurantes Peninsulares S.A." },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "notifications") {
            return {
              insert: async () => ({ error: null }),
            };
          }
          return {};
        },
      } as unknown as SupabaseClient<Database>;

      const hireResult = await CompanyEmployeeService.hireCandidate(
        client,
        "comp-uuid-1",
        {
          applicationId: "app-test-1",
          candidateId: "cand-uuid-1",
          jobTitle: "Gerente de Operaciones",
          department: "Operaciones",
          templateType: "indeterminado",
          startDate: "2026-12-01",
          salary: 35000,
          paymentFrequency: "quincenal",
        }
      );

      // El asistente formal crea la tríada completa:
      expect(hireResult.employeeRecordId).toBe("emp-rec-1");
      expect(hireResult.folio).toBeDefined();
      expect(mockEmployees[0].status).toBe("active");
      expect(mockContracts[0].status).toBe("vigente");
      expect(mockApplications[0].status).toBe("Contratado");
      expect(mockApplications[0].hired_at).toBeDefined();
    });
  });
});
