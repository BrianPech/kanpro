import { describe, test, expect, vi } from "vitest";
import {
  createCompanySchema,
  switchActiveCompanySchema,
  updateOwnerNameSchema,
} from "@/modules/company/schemas/tenant.schema";
import { CompanyTenantService } from "@/modules/company/services/company-tenant.service";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Multi-Company Organization & Tenant Management (1 Usuario -> N Empresas)", () => {
  describe("1. Validaciones de Esquema (Zod)", () => {
    test("Debe aceptar datos válidos para registrar una nueva organización", () => {
      const validPayload = {
        company_name: "Hoteles Rivera del Caribe",
        legal_name: "Operadora Rivera S.A. de C.V.",
        rfc: "hrc200101abc",
        industry: "Hotelería & Turismo",
        company_size: "51-200",
        location: "Cancún, Quintana Roo",
        contact_phone: "998 123 4567",
      };

      const result = createCompanySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_name).toBe("Hoteles Rivera del Caribe");
        expect(result.data.rfc).toBe("HRC200101ABC"); // Normalizado a mayúsculas
      }
    });

    test("Debe rechazar nombre de empresa menor a 2 caracteres", () => {
      const invalidPayload = {
        company_name: "H",
        industry: "General",
        location: "Mérida, Yucatán",
      };

      const result = createCompanySchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("al menos 2 caracteres");
      }
    });

    test("Debe validar UUID correcto al conmutar de empresa activa", () => {
      const valid = switchActiveCompanySchema.safeParse({
        companyId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(valid.success).toBe(true);

      const invalid = switchActiveCompanySchema.safeParse({
        companyId: "invalid-uuid-string",
      });
      expect(invalid.success).toBe(false);
    });

    test("Debe validar nombre de titular válido para usuarios legacy", () => {
      const valid = updateOwnerNameSchema.safeParse({
        fullName: "Roberto Gómez Bolaños",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.fullName).toBe("Roberto Gómez Bolaños");
      }

      const invalid = updateOwnerNameSchema.safeParse({
        fullName: "R",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("2. Capa de Servicio (CompanyTenantService)", () => {
    test("createCompany debe insertar en company_profiles con owner_id y en company_members como owner", async () => {
      const service = new CompanyTenantService();
      const mockUserId = "usr-owner-uuid-1";

      const mockCompanyId = "new-company-uuid-99";
      const insertCompanyMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockCompanyId, company_name: "Grupo Gastronómico Maya" },
            error: null,
          }),
        }),
      });

      const insertMemberMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockSupabase = {
        from: (table: string) => {
          if (table === "company_profiles") {
            return { insert: insertCompanyMock };
          }
          if (table === "company_members") {
            return { insert: insertMemberMock };
          }
          return {};
        },
      } as unknown as SupabaseClient<Database>;

      const result = await service.createCompany(
        mockUserId,
        {
          company_name: "Grupo Gastronómico Maya",
          industry: "Restaurantes & Alimentos",
          location: "Mérida, Yucatán",
          rfc: "GGM200505XYZ",
        },
        mockSupabase
      );

      expect(result.companyId).toBe(mockCompanyId);
      expect(result.companyName).toBe("Grupo Gastronómico Maya");

      // Verificar que insertó company_profiles con owner_id
      expect(insertCompanyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: "Grupo Gastronómico Maya",
          owner_id: mockUserId,
          rfc: "GGM200505XYZ",
        })
      );

      // Verificar que asignó la membresía de 'owner'
      expect(insertMemberMock).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: mockCompanyId,
          user_id: mockUserId,
          role: "owner",
        })
      );
    });

    test("getUserCompanies debe retornar múltiples empresas asociadas al mismo usuario", async () => {
      const service = new CompanyTenantService();
      const mockUserId = "usr-multicompany-uuid";

      const mockMemberships = [
        {
          role: "owner",
          company_id: "comp-1",
          company: {
            id: "comp-1",
            company_name: "Restaurante Los Almendros",
            legal_name: "Almendros S.A.",
            logo_url: "https://logo1.png",
            industry: "Alimentos",
            verification_status: "verified",
          },
        },
        {
          role: "owner",
          company_id: "comp-2",
          company: {
            id: "comp-2",
            company_name: "Boutique Hotel Uxmal",
            legal_name: "Uxmal Hospitality",
            logo_url: null,
            industry: "Hotelería",
            verification_status: "pending",
          },
        },
      ];

      const mockSupabase = {
        from: (table: string) => {
          if (table === "company_members") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: mockMemberships, error: null }),
                }),
              }),
            };
          }
          return {};
        },
      } as unknown as SupabaseClient<Database>;

      const companies = await service.getUserCompanies(mockUserId, mockSupabase);

      expect(companies).toHaveLength(2);
      expect(companies[0].companyId).toBe("comp-1");
      expect(companies[0].companyName).toBe("Restaurante Los Almendros");
      expect(companies[0].role).toBe("owner");

      expect(companies[1].companyId).toBe("comp-2");
      expect(companies[1].companyName).toBe("Boutique Hotel Uxmal");
      expect(companies[1].role).toBe("owner");
    });

    test("getUserCompanies debe auto-recuperar empresas históricas (retrocompatibilidad sin pérdida de datos)", async () => {
      const service = new CompanyTenantService();
      const legacyUserId = "legacy-user-123";

      const mockSupabase = {
        from: (table: string) => {
          if (table === "company_members") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: [], error: null }), // Sin filas en members aún
                }),
              }),
              upsert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === "company_profiles") {
            return {
              select: () => ({
                or: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        id: legacyUserId,
                        company_name: "Empresa Histórica Existente",
                        legal_name: "Histórica S.A.",
                        logo_url: null,
                        industry: "Comercio",
                        verification_status: "verified",
                      },
                      error: null,
                    }),
                }),
              }),
            };
          }
          return {};
        },
      } as unknown as SupabaseClient<Database>;

      const companies = await service.getUserCompanies(legacyUserId, mockSupabase);

      expect(companies).toHaveLength(1);
      expect(companies[0].companyId).toBe(legacyUserId);
      expect(companies[0].companyName).toBe("Empresa Histórica Existente");
      expect(companies[0].role).toBe("owner");
    });

    test("verifyUserMembership debe verificar si el usuario tiene permiso sobre una empresa", async () => {
      const service = new CompanyTenantService();
      const mockUserId = "11111111-1111-4111-8111-111111111111";
      const targetCompanyId = "22222222-2222-4222-8222-222222222222";

      const mockSupabase = {
        from: (table: string) => {
          if (table === "company_members") {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: { role: "owner" }, error: null }),
                  }),
                }),
              }),
            };
          }
          return {};
        },
      } as unknown as SupabaseClient<Database>;

      const role = await service.verifyUserMembership(mockUserId, targetCompanyId, mockSupabase);
      expect(role).toBe("owner");
    });
  });
});
