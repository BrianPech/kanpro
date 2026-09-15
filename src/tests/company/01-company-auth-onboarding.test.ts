import { describe, test, expect, vi, beforeEach } from "vitest";
import { companyRegisterSchema } from "@/modules/auth/schemas/register.schema";
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Mock Supabase SSR client for proxy middleware tests
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe("Fase 1: Empresa - Registro, Autenticación y Guardias de Acceso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  describe("1. Validación del Schema de Registro de Empresa (companyRegisterSchema)", () => {
    test("Acepta un registro válido con nombre de empresa, correo corporativo y contraseña segura", () => {
      const validPayload = {
        full_name: "Hoteles & Resorts Riviera Maya S.A.",
        email: "talento@rivieraresorts.com",
        password: "Password2026!",
      };

      const result = companyRegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("talento@rivieraresorts.com");
        expect(result.data.full_name).toBe("Hoteles & Resorts Riviera Maya S.A.");
      }
    });

    test("Normaliza el email a minúsculas y elimina espacios circundantes", () => {
      const payloadWithSpaces = {
        full_name: "  Innovación Maya Tech  ",
        email: "  CONTACTO@INNOVACIONMAYA.COM  ",
        password: "SecurePassword1",
      };

      const result = companyRegisterSchema.safeParse(payloadWithSpaces);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("contacto@innovacionmaya.com");
        expect(result.data.full_name).toBe("Innovación Maya Tech");
      }
    });

    test("Rechaza nombres de empresa demasiado cortos (< 2 caracteres)", () => {
      const invalidPayload = {
        full_name: "A",
        email: "contacto@empresa.com",
        password: "ValidPass123!",
      };

      const result = companyRegisterSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.flatten();
        expect(error.fieldErrors.full_name).toBeDefined();
      }
    });

    test("Rechaza emails con formato inválido", () => {
      const invalidPayloads = [
        { full_name: "Empresa Valida", email: "not-an-email", password: "Password123!" },
        { full_name: "Empresa Valida", email: "missing@domain", password: "Password123!" },
        { full_name: "Empresa Valida", email: "@nodomain.com", password: "Password123!" },
      ];

      for (const payload of invalidPayloads) {
        const result = companyRegisterSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }
    });

    test("Rechaza contraseñas con menos de 8 caracteres", () => {
      const shortPassPayload = {
        full_name: "Empresa Valida",
        email: "admin@empresa.com",
        password: "Pass1",
      };

      const result = companyRegisterSchema.safeParse(shortPassPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.password?.[0]).toContain("al menos 8 caracteres");
      }
    });

    test("Rechaza contraseñas sin letras mayúsculas", () => {
      const noUpperPayload = {
        full_name: "Empresa Valida",
        email: "admin@empresa.com",
        password: "password12345",
      };

      const result = companyRegisterSchema.safeParse(noUpperPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.password?.[0]).toContain("letra mayúscula");
      }
    });

    test("Rechaza contraseñas sin números", () => {
      const noNumberPayload = {
        full_name: "Empresa Valida",
        email: "admin@empresa.com",
        password: "PasswordSinNumero",
      };

      const result = companyRegisterSchema.safeParse(noNumberPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.password?.[0]).toContain("al menos un número");
      }
    });
  });

  describe("2. Control de Acceso y Guardias de Rutas de Empresa", () => {
    test("Rechaza y redirige a usuario no autenticado de /dashboard/company a /login", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const req = new NextRequest("http://localhost:3000/dashboard/company");
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/login?redirectTo=%2Fdashboard%2Fcompany");
    });

    test("Rechaza y redirige a usuario con rol 'candidate' que intenta acceder a /dashboard/company", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "candidate-uuid-1" } } });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { role: "candidate" } }),
            maybeSingle: () => Promise.resolve({ data: { role: "candidate" } }),
          }),
        }),
      });

      const req = new NextRequest("http://localhost:3000/dashboard/company/employees");
      const res = await updateSession(req);

      // Debe redirigir al candidato a su propio dashboard
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");
    });

    test("Permite el acceso a /dashboard/company a usuario con rol 'company'", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "company-uuid-1" } } });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { role: "company" } }),
            maybeSingle: () => Promise.resolve({ data: { role: "company" } }),
          }),
        }),
      });

      const req = new NextRequest("http://localhost:3000/dashboard/company/employees");
      const res = await updateSession(req);

      expect(res.status).toBe(200);
    });

    test("Redirige a usuario autenticado como 'company' desde /dashboard a /dashboard/company", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "company-uuid-1" } } });
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { role: "company" } }),
            maybeSingle: () => Promise.resolve({ data: { role: "company" } }),
          }),
        }),
      });

      const req = new NextRequest("http://localhost:3000/dashboard");
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/company");
    });
  });
});
