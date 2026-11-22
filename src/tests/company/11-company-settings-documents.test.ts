import { describe, test, expect, vi } from "vitest";
import {
  requestDocumentAccessSchema,
  respondDocumentAccessSchema,
  getDocumentAccessStatusSchema,
  getAuthorizedDocumentsSchema,
  getCandidateCvDocumentSchema,
} from "@/modules/company/schemas/document-access.schema";
import {
  toggleGlobalRecruitmentSchema,
  updateContactChannelSchema,
  updateSubscriptionPlanSchema,
  branchGeofenceSchema,
  updateCompanyBranchesSchema,
  getCompanyInvoicesSchema,
} from "@/modules/company/schemas/settings.schema";
import {
  CompanyDocumentAccessService,
} from "@/modules/company/services/company-document-access";
import {
  CompanySettingsService,
} from "@/modules/company/services/company-settings";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Fase 20: Flujos Finales - Acceso a Documentos y Configuración de Empresa (Schema -> Handler -> Service)", () => {
  // =========================================================================
  // 1. VALIDACIÓN DE ESQUEMAS ZOD
  // =========================================================================
  describe("1. Validación de Esquemas Zod (document-access.schema.ts y settings.schema.ts)", () => {
    test("requestDocumentAccessSchema: Valida IDs y aplica documentos por defecto", () => {
      const validPayload = {
        applicationId: "app-101",
        candidateId: "cand-202",
      };
      const parsed = requestDocumentAccessSchema.parse(validPayload);
      expect(parsed.applicationId).toBe("app-101");
      expect(parsed.candidateId).toBe("cand-202");
      expect(parsed.requestedDocuments).toEqual(["curp", "rfc", "ine"]);

      const invalidPayload = {
        applicationId: "",
        candidateId: "cand-202",
        requestedDocuments: [],
      };
      const result = requestDocumentAccessSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    test("respondDocumentAccessSchema: Acepta 'approved' y 'rejected', rechaza otros", () => {
      const approved = respondDocumentAccessSchema.safeParse({
        requestId: "req-1",
        status: "approved",
      });
      const rejected = respondDocumentAccessSchema.safeParse({
        requestId: "req-1",
        status: "rejected",
      });
      const invalid = respondDocumentAccessSchema.safeParse({
        requestId: "req-1",
        status: "pending",
      });

      expect(approved.success).toBe(true);
      expect(rejected.success).toBe(true);
      expect(invalid.success).toBe(false);
    });

    test("branchGeofenceSchema: Valida rangos GPS (-90 a 90, -180 a 180) y radios de geocerca", () => {
      const validBranch = {
        branchName: "Sucursal Altabrisa",
        address: "Calle 7 #451 x 20 y 22, Altabrisa, Mérida, Yuc.",
        latitude: 21.0182,
        longitude: -89.5855,
        radiusMeters: 200,
      };
      const parsed = branchGeofenceSchema.parse(validBranch);
      expect(parsed.branchName).toBe("Sucursal Altabrisa");
      expect(parsed.radiusMeters).toBe(200);

      // Latitud fuera de rango (> 90)
      const invalidLat = branchGeofenceSchema.safeParse({
        ...validBranch,
        latitude: 95.5,
      });
      expect(invalidLat.success).toBe(false);

      // Radio menor a 10 metros
      const invalidRadius = branchGeofenceSchema.safeParse({
        ...validBranch,
        radiusMeters: 5,
      });
      expect(invalidRadius.success).toBe(false);
    });

    test("updateCompanyBranchesSchema: Requiere al menos una sucursal con geocerca", () => {
      const emptyBranches = {
        companyId: "comp-1",
        branches: [],
      };
      expect(updateCompanyBranchesSchema.safeParse(emptyBranches).success).toBe(false);

      const validPayload = {
        companyId: "comp-1",
        branches: [
          {
            branchName: "Matriz Cancún",
            address: "Av. Bonampak Sm 4, Cancún, Q.R.",
            latitude: 21.1619,
            longitude: -86.8515,
            radiusMeters: 150,
          },
        ],
      };
      expect(updateCompanyBranchesSchema.safeParse(validPayload).success).toBe(true);
    });

    test("updateSubscriptionPlanSchema & updateContactChannelSchema: Valida enums estrictos", () => {
      expect(
        updateSubscriptionPlanSchema.safeParse({ companyId: "comp-1", plan: "pro" }).success
      ).toBe(true);
      expect(
        updateSubscriptionPlanSchema.safeParse({ companyId: "comp-1", plan: "unlimited" }).success
      ).toBe(false);

      expect(
        updateContactChannelSchema.safeParse({ companyId: "comp-1", channel: "whatsapp" }).success
      ).toBe(true);
      expect(
        updateContactChannelSchema.safeParse({ companyId: "comp-1", channel: "telegram" }).success
      ).toBe(false);
    });
  });

  // =========================================================================
  // 2. SERVICIO DE ACCESO A DOCUMENTOS (CompanyDocumentAccessService)
  // =========================================================================
  describe("2. Servicio de Acceso a Documentos (CompanyDocumentAccessService)", () => {
    function createMockDocumentSupabase() {
      const requests: Array<{
        id: string;
        company_id: string;
        candidate_id: string;
        application_id: string;
        requested_documents: string[];
        status: string;
        created_at: string;
        approved_at?: string | null;
        rejected_at?: string | null;
      }> = [];

      const notifications: Array<{
        user_id: string;
        title: string;
        description: string;
        type: string;
      }> = [];

      const profileDocuments: Array<{
        id: string;
        owner_id: string;
        doc_type: string;
        file_name: string | null;
        file_url: string | null;
        status: string;
        created_at: string;
      }> = [];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "document_access_requests") {
            const buildChain = (filters: Array<[string, string]>) => ({
              eq: vi.fn((field: string, val: string) =>
                buildChain([...filters, [field, val]])
              ),
              order: vi.fn(() => ({
                maybeSingle: vi.fn(async () => {
                  const found = requests
                    .filter((r) =>
                      filters.every(
                        ([f, v]) => (r as unknown as Record<string, string>)[f] === v
                      )
                    )
                    .pop();
                  return { data: found || null, error: null };
                }),
              })),
              maybeSingle: vi.fn(async () => {
                const found = requests.find((r) =>
                  filters.every(
                    ([f, v]) => (r as unknown as Record<string, string>)[f] === v
                  )
                );
                return { data: found || null, error: null };
              }),
            });

            return {
              select: vi.fn(() => buildChain([])),
              insert: vi.fn((payload: unknown) => {
                const item = {
                  id: `req-${requests.length + 1}`,
                  ...(payload as object),
                  created_at: new Date().toISOString(),
                } as (typeof requests)[0];
                requests.push(item);
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => ({ data: item, error: null })),
                  })),
                };
              }),
              update: vi.fn((updatePayload: Record<string, unknown>) => {
                return {
                  eq: vi.fn((idField: string, idVal: string) => ({
                    eq: vi.fn(async (candField: string, candVal: string) => {
                      const req = requests.find(
                        (r) =>
                          (r as unknown as Record<string, string>)[idField] === idVal &&
                          (r as unknown as Record<string, string>)[candField] === candVal
                      );
                      if (req) {
                        Object.assign(req, updatePayload);
                      }
                      return { data: req, error: null };
                    }),
                  })),
                };
              }),
            };
          }

          if (table === "company_profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { company_name: "Hoteles Caribe Maya" },
                    error: null,
                  })),
                })),
              })),
            };
          }

          if (table === "notifications") {
            return {
              insert: vi.fn(async (notif: unknown) => {
                notifications.push(notif as (typeof notifications)[0]);
                return { data: notif, error: null };
              }),
            };
          }

          if (table === "applications") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((field1: string, val1: string) => ({
                  eq: vi.fn((field2: string, val2: string) => ({
                    maybeSingle: vi.fn(async () => ({
                      data: {
                        id: val1,
                        candidate_id: val2,
                        vacancies: {
                          company_id: "comp-1",
                          recruiter_id: "comp-1",
                        },
                      },
                      error: null,
                    })),
                  })),
                })),
              })),
            };
          }

          if (table === "profile_documents") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((field1: string, val1: string) => ({
                  eq: vi.fn((field2: string, val2: string) => ({
                    order: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => {
                        const found = profileDocuments.find(
                          (d) =>
                            (d as unknown as Record<string, string>)[field1] === val1 &&
                            (d as unknown as Record<string, string>)[field2] === val2
                        );
                        return { data: found || null, error: null };
                      }),
                    })),
                  })),
                })),
              })),
            };
          }

          return {};
        }),
        storage: {
          from: vi.fn(() => ({
            createSignedUrl: vi.fn(async (path: string) => ({
              data: { signedUrl: `https://storage.kanpro.mx/signed/${path}` },
              error: null,
            })),
          })),
        },
      } as unknown as SupabaseClient<Database>;

      return { client, requests, notifications, profileDocuments };
    }

    test("requestDocumentAccess: Crea solicitud y envía notificación al candidato", async () => {
      const { client, requests, notifications } = createMockDocumentSupabase();

      const input = requestDocumentAccessSchema.parse({
        applicationId: "app-501",
        candidateId: "cand-901",
      });

      const res = await CompanyDocumentAccessService.requestDocumentAccess(
        client,
        "comp-1",
        input
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe("pending");
      expect(requests.length).toBe(1);
      expect(requests[0].requested_documents).toEqual(["curp", "rfc", "ine"]);
      expect(notifications.length).toBe(1);
      expect(notifications[0].user_id).toBe("cand-901");
      expect(notifications[0].title).toBe("Solicitud de Documentos de Contratación");
    });

    test("requestDocumentAccess: Detecta solicitud existente (aprobada o pendiente) sin duplicar", async () => {
      const { client, requests } = createMockDocumentSupabase();
      requests.push({
        id: "req-existing-1",
        company_id: "comp-1",
        candidate_id: "cand-901",
        application_id: "app-501",
        requested_documents: ["curp", "rfc"],
        status: "approved",
        created_at: new Date().toISOString(),
      });

      const input = requestDocumentAccessSchema.parse({
        applicationId: "app-501",
        candidateId: "cand-901",
      });

      const res = await CompanyDocumentAccessService.requestDocumentAccess(
        client,
        "comp-1",
        input
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe("approved");
      expect(res.message).toContain("ya fue autorizada");
      expect(requests.length).toBe(1); // No duplicó
    });

    test("respondDocumentAccess: Candidato aprueba o rechaza solicitud", async () => {
      const { client, requests } = createMockDocumentSupabase();
      requests.push({
        id: "req-99",
        company_id: "comp-1",
        candidate_id: "cand-901",
        application_id: "app-501",
        requested_documents: ["curp"],
        status: "pending",
        created_at: new Date().toISOString(),
      });

      const approveInput = respondDocumentAccessSchema.parse({
        requestId: "req-99",
        status: "approved",
      });

      const approveRes = await CompanyDocumentAccessService.respondDocumentAccess(
        client,
        "cand-901",
        approveInput
      );

      expect(approveRes.success).toBe(true);
      expect(requests[0].status).toBe("approved");
      expect(requests[0].approved_at).toBeDefined();
    });

    test("getAuthorizedCandidateDocuments: Bloquea acceso si no está autorizada", async () => {
      const { client } = createMockDocumentSupabase();

      const input = getAuthorizedDocumentsSchema.parse({
        applicationId: "app-unauth",
        candidateId: "cand-123",
      });

      const result = await CompanyDocumentAccessService.getAuthorizedCandidateDocuments(
        client,
        "comp-1",
        input
      );

      expect(result.authorized).toBe(false);
      expect(result.documents).toEqual([]);
    });

    test("getCandidateCvDocument: Retorna información del CV y genera signedUrl si es relativa", async () => {
      const { client, profileDocuments } = createMockDocumentSupabase();
      profileDocuments.push({
        id: "doc-cv-1",
        owner_id: "cand-901",
        doc_type: "cv",
        file_name: "Curriculum_Vitae_Sofia.pdf",
        file_url: "candidatos/cv_sofia.pdf",
        status: "verificado",
        created_at: "2026-10-01T10:00:00Z",
      });

      const input = getCandidateCvDocumentSchema.parse({
        applicationId: "app-501",
        candidateId: "cand-901",
      });

      const result = await CompanyDocumentAccessService.getCandidateCvDocument(
        client,
        "comp-1",
        input
      );

      expect(result.hasUploadedCv).toBe(true);
      expect(result.fileName).toBe("Curriculum_Vitae_Sofia.pdf");
      expect(result.cvUrl).toContain("https://storage.kanpro.mx/signed/candidatos/cv_sofia.pdf");
    });
  });

  // =========================================================================
  // 3. SERVICIO DE CONFIGURACIÓN DE EMPRESA (CompanySettingsService)
  // =========================================================================
  describe("3. Servicio de Configuración de Empresa (CompanySettingsService)", () => {
    function createMockSettingsSupabase() {
      const vacancies = [
        { id: "vac-1", company_id: "comp-1", is_active: true, title: "Recepcionista" },
        { id: "vac-2", company_id: "comp-1", is_active: true, title: "Bartender" },
        { id: "vac-3", company_id: "comp-2", is_active: true, title: "Chef" },
      ];

      const companyProfiles: Array<{
        id: string;
        company_name: string;
        contact_channel?: string;
        subscription_plan?: string;
        subscription_status?: string;
        subscription_period_end?: string;
        featured_vacancies_allowance?: number;
        branch_addresses?: unknown;
        fiscal_address?: string;
        address_details?: string;
      }> = [
        {
          id: "comp-1",
          company_name: "Resort & Spa Maya",
          contact_channel: "inbox",
          subscription_plan: "basic",
          fiscal_address: "Av. Tulum #55, Cancún",
        },
      ];

      const invoices: Array<{
        id: string;
        company_id: string;
        plan_name: string;
        amount: number;
        currency: string;
        status: string;
        payment_method: string | null;
        created_at: string;
      }> = [];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "vacancies") {
            return {
              update: vi.fn((updatePayload: Record<string, unknown>) => ({
                eq: vi.fn(async (compField: string, compVal: string) => {
                  vacancies.forEach((v) => {
                    if ((v as unknown as Record<string, string>)[compField] === compVal) {
                      Object.assign(v, updatePayload);
                    }
                  });
                  return { data: vacancies, error: null };
                }),
              })),
            };
          }

          if (table === "company_profiles") {
            return {
              update: vi.fn((updatePayload: Record<string, unknown>) => ({
                eq: vi.fn(async (idField: string, idVal: string) => {
                  const prof = companyProfiles.find(
                    (p) => (p as unknown as Record<string, string>)[idField] === idVal
                  );
                  if (prof) {
                    Object.assign(prof, updatePayload);
                  }
                  return { data: prof, error: null };
                }),
              })),
              select: vi.fn(() => ({
                eq: vi.fn((idField: string, idVal: string) => ({
                  maybeSingle: vi.fn(async () => {
                    const prof = companyProfiles.find(
                      (p) => (p as unknown as Record<string, string>)[idField] === idVal
                    );
                    return { data: prof || null, error: null };
                  }),
                })),
              })),
            };
          }

          if (table === "company_invoices") {
            return {
              insert: vi.fn(async (payload: unknown) => {
                const item = {
                  id: `inv-${invoices.length + 1}`,
                  ...(payload as object),
                  created_at: new Date().toISOString(),
                } as (typeof invoices)[0];
                invoices.push(item);
                return { data: item, error: null };
              }),
              select: vi.fn(() => ({
                eq: vi.fn((compField: string, compVal: string) => ({
                  order: vi.fn(async () => {
                    const filtered = invoices.filter(
                      (inv) => (inv as unknown as Record<string, string>)[compField] === compVal
                    );
                    return { data: filtered, error: null };
                  }),
                })),
              })),
            };
          }

          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, vacancies, companyProfiles, invoices };
    }

    test("toggleGlobalRecruitment: Pausa y reanuda vacantes solo de la empresa indicada", async () => {
      const { client, vacancies } = createMockSettingsSupabase();

      // Pausar
      await CompanySettingsService.toggleGlobalRecruitment(client, "comp-1", true);
      expect(vacancies[0].is_active).toBe(false);
      expect(vacancies[1].is_active).toBe(false);
      expect(vacancies[2].is_active).toBe(true); // Vacante de comp-2 intacta

      // Reanudar
      await CompanySettingsService.toggleGlobalRecruitment(client, "comp-1", false);
      expect(vacancies[0].is_active).toBe(true);
      expect(vacancies[1].is_active).toBe(true);
    });

    test("updateContactChannel: Modifica canal de contacto preferido", async () => {
      const { client, companyProfiles } = createMockSettingsSupabase();

      await CompanySettingsService.updateContactChannel(client, "comp-1", "whatsapp");
      expect(companyProfiles[0].contact_channel).toBe("whatsapp");
    });

    test("updateSubscriptionPlan: Rechaza upgrade directo a planes de pago sin ID de transacción verificado y permite cuando está verificado", async () => {
      const { client, companyProfiles, invoices } = createMockSettingsSupabase();

      await expect(
        CompanySettingsService.updateSubscriptionPlan(client, "comp-1", "pro")
      ).rejects.toThrow(/ID de transacción verificado/i);

      await expect(
        CompanySettingsService.updateSubscriptionPlan(client, "comp-1", "enterprise")
      ).rejects.toThrow(/ID de transacción verificado/i);
      expect(invoices.length).toBe(0);

      // Con transacción verificada por webhook sí procede y registra factura
      const res = await CompanySettingsService.updateSubscriptionPlan(client, "comp-1", "pro", {
        verifiedTransactionId: "tx_stripe_verified_999",
      });

      expect(res.success).toBe(true);
      expect(res.featuredAllowance).toBe(3);
      expect(res.planPrice).toBe(1499.0);
      expect(companyProfiles[0].subscription_plan).toBe("pro");
      expect(companyProfiles[0].featured_vacancies_allowance).toBe(3);
      expect(invoices.length).toBe(1);
      expect(invoices[0].amount).toBe(1499.0);
      expect(invoices[0].plan_name).toBe("Plan PRO Mensual");

      // Downgrade a basic funciona sin ID de transacción y sin factura adicional
      const basicRes = await CompanySettingsService.updateSubscriptionPlan(client, "comp-1", "basic");
      expect(basicRes.success).toBe(true);
      expect(companyProfiles[0].subscription_plan).toBe("basic");
      expect(invoices.length).toBe(1);
    });

    test("updateCompanyBranches & getCompanyBranches: Persiste sucursales con geocercas GPS", async () => {
      const { client, companyProfiles } = createMockSettingsSupabase();

      const branchesPayload = [
        {
          branchName: "Sucursal Playa Centro",
          address: "5ta Avenida x Calle 12, Playa del Carmen",
          latitude: 20.6274,
          longitude: -87.0725,
          radiusMeters: 150,
        },
        {
          branchName: "Sucursal Tulum Costera",
          address: "Km 5 Carretera Tulum-Boca Paila, Tulum",
          latitude: 20.1983,
          longitude: -87.4352,
          radiusMeters: 250,
        },
      ];

      const saveResult = await CompanySettingsService.updateCompanyBranches(
        client,
        "comp-1",
        branchesPayload
      );

      expect(saveResult.success).toBe(true);
      expect(saveResult.count).toBe(2);
      expect(companyProfiles[0].branch_addresses).toEqual(branchesPayload);

      const retrieved = await CompanySettingsService.getCompanyBranches(client, "comp-1");
      expect(retrieved.length).toBe(2);
      expect(retrieved[0].branchName).toBe("Sucursal Playa Centro");
      expect(retrieved[1].radiusMeters).toBe(250);
    });

    test("getCompanyInvoices: Consulta facturas registradas de la empresa", async () => {
      const { client, invoices } = createMockSettingsSupabase();
      invoices.push({
        id: "inv-101",
        company_id: "comp-1",
        plan_name: "Plan PRO Mensual",
        amount: 1499.0,
        currency: "MXN",
        status: "paid",
        payment_method: "Tarjeta",
        created_at: "2026-10-01T00:00:00Z",
      });

      const records = await CompanySettingsService.getCompanyInvoices(client, "comp-1");
      expect(records.length).toBe(1);
      expect(records[0].plan_name).toBe("Plan PRO Mensual");
    });
  });

  // =========================================================================
  // 4. AISLAMIENTO MULTITENANT (Cross-Tenant Security)
  // =========================================================================
  describe("4. Aislamiento Multitenant (Cross-Tenant Security)", () => {
    test("Una empresa B no puede ver documentos autorizados para la Empresa A", async () => {
      const requests = [
        {
          id: "req-comp-a",
          company_id: "comp-A",
          candidate_id: "cand-1",
          application_id: "app-1",
          requested_documents: ["ine", "rfc"],
          status: "approved",
          created_at: new Date().toISOString(),
        },
      ];

      const buildChain = (filters: Array<[string, string]>) => ({
        eq: vi.fn((field: string, val: string) =>
          buildChain([...filters, [field, val]])
        ),
        maybeSingle: vi.fn(async () => {
          const match = requests.find((r) =>
            filters.every(
              ([f, v]) => (r as unknown as Record<string, string>)[f] === v
            )
          );
          return { data: match || null, error: null };
        }),
      });

      const client = {
        from: vi.fn(() => ({
          select: vi.fn(() => buildChain([])),
        })),
        storage: { from: vi.fn() },
      } as unknown as SupabaseClient<Database>;

      // Intento de consulta desde comp-B
      const resCompB = await CompanyDocumentAccessService.getAuthorizedCandidateDocuments(
        client,
        "comp-B",
        { applicationId: "app-1", candidateId: "cand-1" }
      );

      expect(resCompB.authorized).toBe(false);
      expect(resCompB.documents).toEqual([]);
    });

    test("Una empresa B no puede pausar ni modificar las vacantes de Empresa A", async () => {
      const vacancies = [
        { id: "vac-A1", company_id: "comp-A", is_active: true },
        { id: "vac-B1", company_id: "comp-B", is_active: true },
      ];

      const client = {
        from: vi.fn(() => ({
          update: vi.fn((payload: Record<string, unknown>) => ({
            eq: vi.fn(async (compField: string, compVal: string) => {
              vacancies.forEach((v) => {
                if ((v as unknown as Record<string, string>)[compField] === compVal) {
                  Object.assign(v, payload);
                }
              });
              return { data: vacancies, error: null };
            }),
          })),
        })),
      } as unknown as SupabaseClient<Database>;

      // comp-B pausa sus vacantes
      await CompanySettingsService.toggleGlobalRecruitment(client, "comp-B", true);

      expect(vacancies.find((v) => v.id === "vac-B1")?.is_active).toBe(false);
      // Vacante de comp-A permanece activa
      expect(vacancies.find((v) => v.id === "vac-A1")?.is_active).toBe(true);
    });
  });
});
