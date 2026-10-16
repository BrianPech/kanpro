import { describe, test, expect, vi, beforeEach } from "vitest";
import { candidateRegisterSchema } from "@/modules/auth/schemas/register.schema";
import { authService } from "@/modules/auth/services/auth-service";

// Mock Supabase client
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

describe("Módulo de Autenticación de Candidato - Registro y Validación", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. VALIDACIÓN DE ESQUEMA (candidateRegisterSchema)
  // =========================================================================
  describe("1. Validación de Esquema Zod (candidateRegisterSchema)", () => {
    test("Acepta un registro válido de candidato con datos completos", () => {
      const validPayload = {
        fullName: "María Fernanda López",
        birthDate: "1998-07-22",
        whatsappNumber: "9991234567",
        email: "maria.lopez@ejemplo.com",
        password: "Password2026!",
      };

      const result = candidateRegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe("María Fernanda López");
        expect(result.data.birthDate).toBe("1998-07-22");
        expect(result.data.whatsappNumber).toBe("+529991234567");
        expect(result.data.email).toBe("maria.lopez@ejemplo.com");
      }
    });

    test("Acepta el registro sin número de teléfono (teléfono opcional)", () => {
      const result = candidateRegisterSchema.safeParse({
        fullName: "Carlos Mendoza",
        birthDate: "1997-03-10",
        email: "carlos@ejemplo.com",
        password: "Password123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.whatsappNumber).toBeUndefined();
      }
    });

    test("Normaliza teléfonos mexicanos de 10 dígitos a formato E.164 (+52XXXXXXXXXX)", () => {
      const payloads = [
        "9991234567",
        "(999) 123-4567",
        "999-123-4567",
        "+529991234567",
        "+52 999 123 4567",
        "+5219991234567",
      ];

      for (const phone of payloads) {
        const result = candidateRegisterSchema.safeParse({
          fullName: "Juan Pérez",
          birthDate: "1995-01-15",
          whatsappNumber: phone,
          email: "juan.perez@ejemplo.com",
          password: "SecurePass123",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.whatsappNumber).toBe("+529991234567");
        }
      }
    });

    test("Normaliza fechas en formato mexicano DD/MM/AAAA a formato ISO YYYY-MM-DD", () => {
      const result = candidateRegisterSchema.safeParse({
        fullName: "Juan Pérez",
        birthDate: "25/12/1996",
        whatsappNumber: "9991234567",
        email: "juan.perez@ejemplo.com",
        password: "SecurePass123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.birthDate).toBe("1996-12-25");
      }
    });

    test("Rechaza candidatos menores de 15 años conforme a la Ley Federal del Trabajo", () => {
      const today = new Date();
      const twelveYearsAgo = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate())
        .toISOString()
        .split("T")[0];

      const result = candidateRegisterSchema.safeParse({
        fullName: "Menor de Edad",
        birthDate: twelveYearsAgo,
        whatsappNumber: "9991234567",
        email: "menor@ejemplo.com",
        password: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.birthDate?.[0]).toContain("al menos 15 años");
      }
    });

    test("Rechaza fechas de nacimiento en el futuro", () => {
      const futureDate = "2040-01-01";

      const result = candidateRegisterSchema.safeParse({
        fullName: "Viajero del Tiempo",
        birthDate: futureDate,
        whatsappNumber: "9991234567",
        email: "futuro@ejemplo.com",
        password: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.birthDate).toBeDefined();
      }
    });

    test("Rechaza números de teléfono con menos de 10 dígitos", () => {
      const shortPhones = ["123", "999123", "99912345"];

      for (const phone of shortPhones) {
        const result = candidateRegisterSchema.safeParse({
          fullName: "Juan Pérez",
          birthDate: "1995-01-15",
          whatsappNumber: phone,
          email: "juan@ejemplo.com",
          password: "SecurePass123",
        });

        expect(result.success).toBe(false);
      }
    });

    test("Rechaza contraseñas débiles (menos de 8 caracteres, sin mayúscula o sin número)", () => {
      const weakPasswords = [
        "short1A", // < 8 chars
        "solominusculasy123", // sin mayúscula
        "SOLOMAYUSCULASYNUMEROS123", // sin minúscula pero pasa si cumple /A-Z/ y /0-9/, comprobamos sin número:
        "SoloLetrasSinNumero", // sin número
      ];

      for (const password of weakPasswords) {
        const result = candidateRegisterSchema.safeParse({
          fullName: "Juan Pérez",
          birthDate: "1995-01-15",
          whatsappNumber: "9991234567",
          email: "juan@ejemplo.com",
          password,
        });

        if (password === "SoloLetrasSinNumero" || password === "short1A" || password === "solominusculasy123") {
          expect(result.success).toBe(false);
        }
      }
    });

    test("Rechaza nombres vacíos o menores a 2 caracteres", () => {
      const result = candidateRegisterSchema.safeParse({
        fullName: "J",
        birthDate: "1995-01-15",
        whatsappNumber: "9991234567",
        email: "juan@ejemplo.com",
        password: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.fullName?.[0]).toContain("nombre completo");
      }
    });
  });

  // =========================================================================
  // 2. SERVICIO DE REGISTRO (authService.signUpCandidate)
  // =========================================================================
  describe("2. Servicio authService.signUpCandidate", () => {
    test("Registra al candidato exitosamente enviando metadata con rol 'candidate'", async () => {
      const mockUser = {
        id: "cand-user-uuid-1",
        email: "candidato@ejemplo.com",
        email_confirmed_at: "2026-10-14T00:00:00Z",
        identities: [{ id: "identity-1" }],
      };
      const mockSession = { access_token: "mock-token", user: mockUser };

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const res = await authService.signUpCandidate({
        fullName: "Carlos Méndez",
        birthDate: "1992-03-10",
        whatsappNumber: "9991234567",
        email: "candidato@ejemplo.com",
        password: "Password123!",
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "candidato@ejemplo.com",
          password: "Password123!",
          options: expect.objectContaining({
            data: {
              role: "candidate",
              full_name: "Carlos Méndez",
              birth_date: "1992-03-10",
              whatsapp_number: "+529991234567",
            },
          }),
        })
      );

      expect(res.user.id).toBe("cand-user-uuid-1");
      expect(res.role).toBe("candidate");
      expect(res.session).toEqual(mockSession);
    });

    test("Detecta usuario duplicado cuando identities viene vacío y arroja error descriptivo", async () => {
      // Supabase feature: when email is already registered and enumeration protection is active, identities is []
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: "existing-user", email: "repetido@ejemplo.com", identities: [] },
          session: null,
        },
        error: null,
      });

      await expect(
        authService.signUpCandidate({
          fullName: "Usuario Duplicado",
          birthDate: "1990-01-01",
          whatsappNumber: "9991234567",
          email: "repetido@ejemplo.com",
          password: "Password123!",
        })
      ).rejects.toThrow("Ya existe una cuenta registrada con este correo electrónico");
    });

    test("Inicia sesión automáticamente si el registro no retorna sesión inmediata pero auto-confirm está activo", async () => {
      const mockUser = {
        id: "cand-auto-login",
        email: "auto@ejemplo.com",
        identities: [{ id: "id-1" }],
      };
      const mockSession = { access_token: "session-after-signin", user: mockUser };

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const res = await authService.signUpCandidate({
        fullName: "Auto Login User",
        birthDate: "1994-06-12",
        whatsappNumber: "9991234567",
        email: "auto@ejemplo.com",
        password: "Password123!",
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "auto@ejemplo.com",
        password: "Password123!",
      });
      expect(res.session).toEqual(mockSession);
    });

    test("Lanza error si supabase.auth.signUp retorna un error de API", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error("Database error saving user"),
      });

      await expect(
        authService.signUpCandidate({
          fullName: "Error Test",
          birthDate: "1990-01-01",
          whatsappNumber: "9991234567",
          email: "error@ejemplo.com",
          password: "Password123!",
        })
      ).rejects.toThrow("Database error saving user");
    });
  });
});
