import { describe, test, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { CompanyTenantService } from "@/modules/company/services/company-tenant.service";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import { CompanyDocumentAccessService } from "@/modules/company/services/company-document-access";

const mockAuthGetUser = vi.fn();
const mockCookieGet = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockAcceptEmployeeInvitationHelper = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockCookieGet,
  })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: mockSupabaseFrom,
    storage: {
      from: mockStorageFrom,
    },
  })),
}));
vi.mock("@/modules/auth/services/employee-invitations", () => ({
  getInvitationByToken: vi.fn(),
  acceptEmployeeInvitation: (...args: unknown[]) =>
    mockAcceptEmployeeInvitationHelper(...args),
}));

import {
  getCompanyBranches,
  getCompanyInvoices,
  toggleGlobalRecruitment,
  updateContactChannel,
} from "@/modules/company/actions/settings";
import {
  acceptEmployeeInvitationAction,
  terminateCompanyEmployeeAction,
} from "@/modules/company/actions/employees";
import { uploadDossierDocumentAction } from "@/modules/company/actions/dossier";

const ATTACKER_ID = "11111111-1111-4111-8111-111111111111";
const VICTIM_COMPANY_ID = "22222222-2222-4222-8222-222222222222";
const OWN_COMPANY_ID = "33333333-3333-4333-8333-333333333333";
const CANDIDATE_A_ID = "44444444-4444-4444-8444-444444444444";
const VICTIM_CANDIDATE_B_ID = "55555555-5555-4555-8555-555555555555";
const EMPLOYEE_OTHER_COMPANY_ID = "66666666-6666-4666-8666-666666666666";

describe("Fase A — Seguridad Crítica Multi-Empresa y CURP/RFC/Documentos (Casos Negativos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieGet.mockReturnValue(undefined);
  });

  // =========================================================================
  // #2: verifyUserMembership, cookie kanpro_active_company y roles en actions
  // =========================================================================
  describe("#2 verifyUserMembership, cookie manipulada y control de roles", () => {
    test("verifyUserMembership rechaza companyId no-UUID e inyección de filtros sin consultar BD", async () => {
      const service = new CompanyTenantService();
      const fromSpy = vi.fn();
      const mockClient = { from: fromSpy } as unknown as SupabaseClient<Database>;

      expect(
        await service.verifyUserMembership(ATTACKER_ID, "not-a-uuid", mockClient)
      ).toBeNull();
      expect(
        await service.verifyUserMembership(
          ATTACKER_ID,
          `${VICTIM_COMPANY_ID},id.neq.${VICTIM_COMPANY_ID}`,
          mockClient
        )
      ).toBeNull();
      expect(fromSpy).not.toHaveBeenCalled();
    });

    test("verifyUserMembership usa id.eq.<userId>,owner_id.eq.<userId> en fallback y rechaza empresas ajenas", async () => {
      const service = new CompanyTenantService();
      const orSpy = vi.fn();
      const eqCompanySpy = vi.fn();

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "company_members") {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === "company_profiles") {
            return {
              select: () => ({
                or: (filter: string) => {
                  orSpy(filter);
                  return {
                    eq: (col: string, val: string) => {
                      eqCompanySpy(col, val);
                      return {
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                      };
                    },
                  };
                },
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const role = await service.verifyUserMembership(
        ATTACKER_ID,
        VICTIM_COMPANY_ID,
        mockClient
      );

      expect(role).toBeNull();
      expect(orSpy).toHaveBeenCalledWith(
        `id.eq.${ATTACKER_ID},owner_id.eq.${ATTACKER_ID}`
      );
      expect(eqCompanySpy).toHaveBeenCalledWith("id", VICTIM_COMPANY_ID);
    });

    test("resolveAuthorizedCompanyScope rechaza cookie kanpro_active_company manipulada", async () => {
      const service = new CompanyTenantService();
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "company_members") {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === "company_profiles") {
            return {
              select: () => ({
                or: () => ({
                  eq: () => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const scope = await service.resolveAuthorizedCompanyScope(
        ATTACKER_ID,
        mockClient,
        ["owner", "admin"],
        VICTIM_COMPANY_ID
      );

      expect(scope).toBeNull();
    });

    test("resolveActiveCompanyScope lanza error cuando el usuario no tiene empresas (sin fallback userId/owner)", async () => {
      const service = new CompanyTenantService();
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "company_members") {
            return {
              select: () => ({
                eq: () => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          if (table === "company_profiles") {
            return {
              select: () => ({
                or: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      await expect(
        service.resolveActiveCompanyScope(ATTACKER_ID, mockClient)
      ).rejects.toThrow(/No tienes una empresa activa asociada/i);
    });

    test("getCompanyBranches y getCompanyInvoices exigen sesión autenticada y rol owner/admin", async () => {
      // Sin sesión
      mockAuthGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "No session" },
      });

      await expect(getCompanyBranches(VICTIM_COMPANY_ID)).rejects.toThrow(/No autorizado/i);
      await expect(getCompanyInvoices(VICTIM_COMPANY_ID)).rejects.toThrow(/No autorizado/i);

      // Con sesión de reclutador/viewer (sin rol owner/admin)
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: ATTACKER_ID } },
        error: null,
      });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "company_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { role: "recruiter" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(getCompanyBranches(VICTIM_COMPANY_ID)).rejects.toThrow(/No tienes permisos/i);
      await expect(getCompanyInvoices(VICTIM_COMPANY_ID)).rejects.toThrow(/No tienes permisos/i);
    });

    test("Acciones administrativas en settings.ts y employees.ts bloquean rol recruiter/viewer y cookie manipulada", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: ATTACKER_ID } },
        error: null,
      });
      mockCookieGet.mockReturnValue({ value: VICTIM_COMPANY_ID });
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "company_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { role: "viewer" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const toggleRes = await toggleGlobalRecruitment(VICTIM_COMPANY_ID, true);
      expect(toggleRes.success).toBe(false);

      const channelRes = await updateContactChannel(VICTIM_COMPANY_ID, "whatsapp");
      expect(channelRes.success).toBe(false);

      const terminateRes = await terminateCompanyEmployeeAction(
        EMPLOYEE_OTHER_COMPANY_ID,
        "Baja no autorizada"
      );
      expect(terminateRes.success).toBe(false);
      expect(terminateRes.error).toMatch(/permisos de administrador/i);
    });
  });

  // =========================================================================
  // #3: Robo de CURP/RFC y documentos (hireCandidate, documents, dossier)
  // =========================================================================
  describe("#3 Protección de CURP/RFC y documentos privados", () => {
    test("hireCandidate rechaza candidateId distinto a app.candidate_id antes de consultar candidate_private_profiles", async () => {
      const adminFromSpy = vi.fn();
      const appUpdateSpy = vi.fn();

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "applications") {
            return {
              select: () => ({
                eq: () => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "app-1",
                      status: "Entrevista",
                      candidate_id: CANDIDATE_A_ID,
                      vacancy_id: "vac-1",
                      vacancies: {
                        id: "vac-1",
                        title: "Mesero",
                        company_id: OWN_COMPANY_ID,
                        recruiter_id: OWN_COMPANY_ID,
                      },
                      candidate: {
                        id: CANDIDATE_A_ID,
                        profiles: {
                          id: CANDIDATE_A_ID,
                          full_name: "Candidato A",
                          whatsapp_number: "9991112233",
                          email: "a@test.local",
                          avatar_url: null,
                        },
                      },
                    },
                    error: null,
                  }),
                }),
              }),
              update: appUpdateSpy,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const mockAdmin = {
        from: adminFromSpy,
      } as unknown as SupabaseClient<Database>;

      await expect(
        CompanyEmployeeService.hireCandidate(
          mockSupabase,
          OWN_COMPANY_ID,
          {
            applicationId: "app-1",
            candidateId: VICTIM_CANDIDATE_B_ID,
            jobTitle: "Mesero",
            department: "Servicio",
            templateType: "indeterminado",
            startDate: "2026-11-22",
            salary: 12000,
            paymentFrequency: "quincenal",
          },
          mockAdmin
        )
      ).rejects.toThrow(/no corresponde a la postulación/i);

      expect(adminFromSpy).not.toHaveBeenCalled();
      expect(appUpdateSpy).not.toHaveBeenCalled();
    });

    test("getAuthorizedCandidateDocuments valida candidate_id y filtra estrictamente por requested_documents", async () => {
      const requests = [
        {
          id: "req-1",
          application_id: "app-1",
          company_id: OWN_COMPANY_ID,
          candidate_id: CANDIDATE_A_ID,
          status: "approved",
          rejected_at: null,
          requested_documents: ["curp"],
        },
      ];
      const docs = [
        {
          id: "doc-curp",
          owner_id: CANDIDATE_A_ID,
          doc_type: "curp",
          file_name: "curp.pdf",
          file_url: "cand-a/curp.pdf",
          status: "approved",
          created_at: "2026-11-01T00:00:00Z",
        },
        {
          id: "doc-ine",
          owner_id: CANDIDATE_A_ID,
          doc_type: "ine",
          file_name: "ine.pdf",
          file_url: "cand-a/ine.pdf",
          status: "approved",
          created_at: "2026-11-01T00:00:00Z",
        },
      ];

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "document_access_requests") {
            const chain = (filters: Array<[string, string]>) => ({
              eq: (col: string, val: string) => chain([...filters, [col, val]]),
              maybeSingle: vi.fn(async () => ({
                data:
                  requests.find((r) =>
                    filters.every(
                      ([c, v]) => (r as unknown as Record<string, string>)[c] === v
                    )
                  ) || null,
                error: null,
              })),
            });
            return { select: () => chain([]) };
          }
          if (table === "profile_documents") {
            return {
              select: () => ({
                eq: async (_col: string, ownerId: string) => ({
                  data: docs.filter((d) => d.owner_id === ownerId),
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
        storage: {
          from: vi.fn(() => ({
            createSignedUrl: vi.fn(async (p: string) => ({
              data: { signedUrl: `https://signed.local/${p}` },
              error: null,
            })),
          })),
        },
      } as unknown as SupabaseClient<Database>;

      // Intento con candidateId distinto al de la solicitud aprobada -> denegado
      const wrongCandidate =
        await CompanyDocumentAccessService.getAuthorizedCandidateDocuments(
          mockClient,
          OWN_COMPANY_ID,
          { applicationId: "app-1", candidateId: VICTIM_CANDIDATE_B_ID }
        );
      expect(wrongCandidate.authorized).toBe(false);
      expect(wrongCandidate.documents).toEqual([]);

      // Candidato correcto -> solo devuelve 'curp', nunca 'ine'
      const authorized =
        await CompanyDocumentAccessService.getAuthorizedCandidateDocuments(
          mockClient,
          OWN_COMPANY_ID,
          { applicationId: "app-1", candidateId: CANDIDATE_A_ID }
        );
      expect(authorized.authorized).toBe(true);
      expect(authorized.documents).toHaveLength(1);
      expect(authorized.documents[0].doc_type).toBe("curp");
    });

    test("uploadDossierDocumentAction rechaza empleado de otra empresa y propaga error de inserción en profile_documents", async () => {
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: ATTACKER_ID } },
        error: null,
      });

      const uploadSpy = vi.fn().mockResolvedValue({ error: null });
      const signSpy = vi.fn().mockResolvedValue({
        data: { signedUrl: "https://signed.local/file.pdf" },
        error: null,
      });
      const removeSpy = vi.fn().mockResolvedValue({ error: null });
      mockStorageFrom.mockReturnValue({
        upload: uploadSpy,
        createSignedUrl: signSpy,
        remove: removeSpy,
      });

      // Caso 1: empleado no pertenece a la empresa activa
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "company_members") {
          return {
            select: () => ({
              eq: () => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      role: "owner",
                      company_id: OWN_COMPANY_ID,
                      company: {
                        id: OWN_COMPANY_ID,
                        company_name: "Mi Empresa",
                        legal_name: null,
                        logo_url: null,
                        industry: "General",
                        verification_status: "approved",
                      },
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "company_employees") {
          return {
            select: () => ({
              eq: () => ({
                or: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const formOtherCompany = new FormData();
      formOtherCompany.append(
        "file",
        new File(["%PDF"], "doc.pdf", { type: "application/pdf" })
      );
      formOtherCompany.append("title", "Constancia");
      formOtherCompany.append("employeeId", EMPLOYEE_OTHER_COMPANY_ID);

      const resOther = await uploadDossierDocumentAction(formOtherCompany);
      expect(resOther.success).toBe(false);
      if (!resOther.success) {
        expect(resOther.error).toMatch(/no pertenece a la empresa activa/i);
      }
      expect(uploadSpy).not.toHaveBeenCalled();

      // Caso 2: error de inserción en profile_documents NO se traga (falla y limpia storage)
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === "company_members") {
          return {
            select: () => ({
              eq: () => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      role: "owner",
                      company_id: OWN_COMPANY_ID,
                      company: {
                        id: OWN_COMPANY_ID,
                        company_name: "Mi Empresa",
                        legal_name: null,
                        logo_url: null,
                        industry: "General",
                        verification_status: "approved",
                      },
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "company_employees") {
          return {
            select: () => ({
              eq: () => ({
                or: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: EMPLOYEE_OTHER_COMPANY_ID,
                      employee_id: CANDIDATE_A_ID,
                      company_id: OWN_COMPANY_ID,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "profile_documents") {
          return {
            insert: () => ({
              select: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "RLS insert violation" },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const formInsertFail = new FormData();
      formInsertFail.append(
        "file",
        new File(["%PDF"], "doc.pdf", { type: "application/pdf" })
      );
      formInsertFail.append("title", "Constancia");
      formInsertFail.append("employeeId", EMPLOYEE_OTHER_COMPANY_ID);
      formInsertFail.append("candidateId", CANDIDATE_A_ID);

      const resInsertFail = await uploadDossierDocumentAction(formInsertFail);
      expect(resInsertFail.success).toBe(false);
      if (!resInsertFail.success) {
        expect(resInsertFail.error).toContain("RLS insert violation");
      }
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // #4: Invitaciones (cancelled, expirada, email "%", cancelar aceptada)
  // =========================================================================
  describe("#4 Seguridad en Invitaciones", () => {
    function createInvitationMock(invitationRow: Record<string, unknown>) {
      const empUpdateSpy = vi.fn();
      const invUpdateSpy = vi.fn();

      const client = {
        from: vi.fn((table: string) => {
          if (table === "employee_invitations") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: vi
                    .fn()
                    .mockResolvedValue({ data: invitationRow, error: null }),
                  eq: () => ({
                    maybeSingle: vi
                      .fn()
                      .mockResolvedValue({ data: invitationRow, error: null }),
                  }),
                }),
              }),
              update: invUpdateSpy,
            };
          }
          if (table === "company_employees") {
            return {
              update: empUpdateSpy,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, empUpdateSpy, invUpdateSpy };
    }

    test("acceptEmployeeInvitation rechaza invitación cancelada sin mutar BD", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const { client, empUpdateSpy, invUpdateSpy } = createInvitationMock({
        id: "inv-cancelled",
        company_id: VICTIM_COMPANY_ID,
        employee_id: EMPLOYEE_OTHER_COMPANY_ID,
        email: "empleado@empresa.local",
        full_name: "Empleado",
        status: "cancelled",
        expires_at: new Date(Date.now() + 86400_000).toISOString(),
      });

      await expect(
        CompanyEmployeeService.acceptEmployeeInvitation(client, {
          rawToken,
          userId: CANDIDATE_A_ID,
          email: "empleado@empresa.local",
        })
      ).rejects.toThrow(/cancelada/i);

      expect(invUpdateSpy).not.toHaveBeenCalled();
      expect(empUpdateSpy).not.toHaveBeenCalled();
    });

    test("acceptEmployeeInvitation rechaza invitación expirada sin mutar BD", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const { client, empUpdateSpy, invUpdateSpy } = createInvitationMock({
        id: "inv-expired",
        company_id: VICTIM_COMPANY_ID,
        employee_id: EMPLOYEE_OTHER_COMPANY_ID,
        email: "empleado@empresa.local",
        full_name: "Empleado",
        status: "sent",
        expires_at: new Date(Date.now() - 60_000).toISOString(),
      });

      await expect(
        CompanyEmployeeService.acceptEmployeeInvitation(client, {
          rawToken,
          userId: CANDIDATE_A_ID,
          email: "empleado@empresa.local",
        })
      ).rejects.toThrow(/expirado/i);

      expect(invUpdateSpy).not.toHaveBeenCalled();
      expect(empUpdateSpy).not.toHaveBeenCalled();
    });

    test('acceptEmployeeInvitation rechaza email "%" y correos que no coinciden con la invitación', async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const { client, empUpdateSpy, invUpdateSpy } = createInvitationMock({
        id: "inv-wildcard",
        company_id: VICTIM_COMPANY_ID,
        employee_id: null,
        email: "empleado@empresa.local",
        full_name: "Empleado",
        status: "sent",
        expires_at: new Date(Date.now() + 86400_000).toISOString(),
      });

      await expect(
        CompanyEmployeeService.acceptEmployeeInvitation(client, {
          rawToken,
          userId: ATTACKER_ID,
          email: "%",
        })
      ).rejects.toThrow(/inválido/i);

      await expect(
        CompanyEmployeeService.acceptEmployeeInvitation(client, {
          rawToken,
          userId: ATTACKER_ID,
          email: "atacante@malicioso.local",
        })
      ).rejects.toThrow(/no coincide/i);

      expect(invUpdateSpy).not.toHaveBeenCalled();
      expect(empUpdateSpy).not.toHaveBeenCalled();
    });

    test('acceptEmployeeInvitationAction ignora rawInput.email="%" y usa el correo de auth.getUser()', async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      mockAuthGetUser.mockResolvedValue({
        data: { user: { id: CANDIDATE_A_ID, email: "real.user@empresa.local" } },
        error: null,
      });
      mockAcceptEmployeeInvitationHelper.mockResolvedValue({ success: true });

      const res = await acceptEmployeeInvitationAction({
        rawToken,
        email: "%",
        userId: ATTACKER_ID,
      });

      expect(res.success).toBe(true);
      expect(mockAcceptEmployeeInvitationHelper).toHaveBeenCalledWith({
        rawToken,
        email: "real.user@empresa.local",
        userId: CANDIDATE_A_ID,
      });
    });

    test("cancelEmployeeInvitation rechaza cancelar una invitación ya aceptada sin tocar al empleado activo", async () => {
      const { client, empUpdateSpy, invUpdateSpy } = createInvitationMock({
        id: "inv-accepted",
        company_id: OWN_COMPANY_ID,
        employee_id: EMPLOYEE_OTHER_COMPANY_ID,
        status: "accepted",
      });

      await expect(
        CompanyEmployeeService.cancelEmployeeInvitation(
          client,
          OWN_COMPANY_ID,
          "inv-accepted"
        )
      ).rejects.toThrow(/ya fue aceptada/i);

      expect(invUpdateSpy).not.toHaveBeenCalled();
      expect(empUpdateSpy).not.toHaveBeenCalled();
    });
  });
});
