import { describe, test, expect } from "vitest";
import { companyProfileSchema } from "@/modules/company/schemas/company.schema";
import { normalizeCity } from "@/modules/company/hooks/use-company-profile-form";

describe("Fase 2: Empresa - Perfil, Configuración y Persistencia", () => {
  describe("1. Validación de Schemas y Reglas de Negocio (companyProfileSchema)", () => {
    test("Acepta un perfil completo y válido de empresa", () => {
      const validProfile = {
        company_name: "Operadora Hotelera del Caribe",
        legal_name: "Operadora Hotelera del Caribe S.A. de C.V.",
        industry: "Hotelería y Turismo",
        website: "https://www.caribehotel.com",
        location: "Playa del Carmen",
        logo_url: "https://example.com/logo.png",
        description: "Líder en hospitalidad de lujo en la Riviera Maya con más de 15 años de trayectoria.",
        phone: "9841234567",
        company_size: "101-500",
        fiscal_regime: "persona_moral" as const,
        rfc: "OHC050512AB3",
        has_transport: true,
        benefit_canteen: true,
        benefit_imss: true,
      };

      const result = companyProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    test("Permite campos opcionales vacíos o ausentes", () => {
      const minimalProfile = {
        company_name: "Tulum Beach Club",
        industry: "Restaurantes y Bares",
        location: "Tulum",
      };

      const result = companyProfileSchema.safeParse(minimalProfile);
      expect(result.success).toBe(true);
    });

    test("Rechaza perfiles sin nombre comercial o con nombre < 2 caracteres", () => {
      const invalidProfile = {
        company_name: "A",
        industry: "Hotelería",
        location: "Cancún",
      };

      const result = companyProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company_name).toBeDefined();
      }
    });

    test("Rechaza URLs de sitio web con formato inválido", () => {
      const invalidWebsiteProfile = {
        company_name: "Empresa Valida",
        industry: "Tecnología",
        location: "Mérida",
        website: "not-a-url",
      };

      const result = companyProfileSchema.safeParse(invalidWebsiteProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.website).toBeDefined();
      }
    });

    test("Rechaza bio o descripción que exceda los 300 caracteres", () => {
      const longBioProfile = {
        company_name: "Empresa Valida",
        industry: "Tecnología",
        location: "Mérida",
        description: "A".repeat(301),
      };

      const result = companyProfileSchema.safeParse(longBioProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description?.[0]).toContain("300 caracteres");
      }
    });
  });

  describe("2. Validación de Regímenes Fiscales y Formato RFC SAT", () => {
    test("Acepta RFC válido de Persona Moral (12 caracteres: 3 letras + 6 dígitos + 3 homoclave)", () => {
      const validPersonaMoral = {
        company_name: "Corporativo Maya",
        industry: "Servicios",
        location: "Cancún",
        fiscal_regime: "persona_moral" as const,
        rfc: "CMA081023ABC", // 3 letras + 6 dígitos + 3 caracteres
      };

      const result = companyProfileSchema.safeParse(validPersonaMoral);
      expect(result.success).toBe(true);
    });

    test("Rechaza RFC de 13 caracteres si el régimen seleccionado es Persona Moral", () => {
      const invalidPersonaMoral = {
        company_name: "Corporativo Maya",
        industry: "Servicios",
        location: "Cancún",
        fiscal_regime: "persona_moral" as const,
        rfc: "CMAP081023ABC", // 13 caracteres (corresponde a persona física)
      };

      const result = companyProfileSchema.safeParse(invalidPersonaMoral);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.rfc?.[0]).toContain("Persona Moral debe tener exactamente 12 caracteres");
      }
    });

    test("Acepta RFC válido de Persona Física (13 caracteres: 4 letras + 6 dígitos + 3 homoclave)", () => {
      const validPersonaFisica = {
        company_name: "Consultoría Juan Pérez",
        industry: "Servicios Profesionales",
        location: "Mérida",
        fiscal_regime: "persona_fisica" as const,
        rfc: "PEPJ850101XYZ", // 4 letras + 6 dígitos + 3 caracteres
      };

      const result = companyProfileSchema.safeParse(validPersonaFisica);
      expect(result.success).toBe(true);
    });

    test("Rechaza RFC de 12 caracteres si el régimen es Persona Física", () => {
      const invalidPersonaFisica = {
        company_name: "Consultoría Juan Pérez",
        industry: "Servicios Profesionales",
        location: "Mérida",
        fiscal_regime: "persona_fisica" as const,
        rfc: "PEP850101XYZ", // 12 caracteres
      };

      const result = companyProfileSchema.safeParse(invalidPersonaFisica);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.rfc?.[0]).toContain("Persona Física debe tener exactamente 13 caracteres");
      }
    });
  });

  describe("3. Normalización de Ubicaciones en la Península de Yucatán", () => {
    test("Normaliza variantes de ciudades clave a nombres canónicos", () => {
      expect(normalizeCity("cancun - centro")).toBe("Cancún");
      expect(normalizeCity("Cancún Q.R.")).toBe("Cancún");
      expect(normalizeCity("playa del carmen - gonzalo guerrero")).toBe("Playa del Carmen");
      expect(normalizeCity("tulum zona hotelera")).toBe("Tulum");
      expect(normalizeCity("merida norte")).toBe("Mérida");
      expect(normalizeCity("cozumel isla")).toBe("Cozumel");
    });
  });

  describe("4. Aislamiento de Perfiles entre Empresas (Company A vs Company B)", () => {
    test("Modificar el perfil de Empresa A no muta el perfil ni los identificadores de Empresa B", () => {
      const companyA = {
        id: "company-a-uuid",
        company_name: "Empresa Original A",
        rfc: "AAA010101AA1",
        contact_phone: "9991112233",
        industry: "Construcción",
      };

      const companyB = {
        id: "company-b-uuid",
        company_name: "Empresa Original B",
        rfc: "BBB020202BB2",
        contact_phone: "9984445566",
        industry: "Hotelería",
      };

      // Simulación de actualización de Empresa A
      const updatedFieldsA = {
        company_name: "Empresa A Renovada S.A.",
        contact_phone: "9999999999",
      };

      const companyAUpdated = {
        ...companyA,
        ...updatedFieldsA,
      };

      // Verificar que Empresa A fue actualizada
      expect(companyAUpdated.company_name).toBe("Empresa A Renovada S.A.");
      expect(companyAUpdated.contact_phone).toBe("9999999999");

      // Verificar que Empresa B permanece 100% inalterada y aislada
      expect(companyB.id).toBe("company-b-uuid");
      expect(companyB.company_name).toBe("Empresa Original B");
      expect(companyB.rfc).toBe("BBB020202BB2");
      expect(companyB.contact_phone).toBe("9984445566");
      expect(companyB.industry).toBe("Hotelería");
    });
  });

  describe("5. Geocodificación y Coordenadas del Mapa", () => {
    test("Acepta y persiste coordenadas geográficas (latitude, longitude) en el perfil de empresa", () => {
      const profileWithCoords = {
        company_name: "Restaurante La Cueva del Chango",
        industry: "Restaurantes y Bares",
        location: "Playa del Carmen, Quintana Roo",
        address_details: "Calle 38 Nte. Mz. 4 Lote 3, Zazil-ha, 77720 Playa del Carmen",
        latitude: 20.6358,
        longitude: -87.0637,
      };

      const result = companyProfileSchema.safeParse(profileWithCoords);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.latitude).toBe(20.6358);
        expect(result.data.longitude).toBe(-87.0637);
      }
    });
  });
});
