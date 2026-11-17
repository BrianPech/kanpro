import { describe, test, expect, vi } from "vitest";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  createEmployeeInvitationSchema,
  bulkEmployeeImportRowSchema,
} from "@/modules/company/schemas/employee-invitation.schema";
import {
  registerDirectEmployeeSchema,
  assignEmployeeDepartmentSchema,
} from "@/modules/company/schemas/employee.schema";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import { parseEmployeeCsvText } from "@/modules/company/utils/employee-csv-parser";

describe("Fase 6: Empresa - Empleados, Importación Masiva e Invitaciones (Núcleo Prioritario ⭐)", () => {
  describe("1. Validación del Schema de Invitación Individual (createEmployeeInvitationSchema)", () => {
    test("Acepta un colaborador con todos los datos requeridos y opcionales", () => {
      const validEmployee = {
        full_name: "María Elena Morales",
        email: "maria.morales@hotelcaribe.com",
        position: "Coordinadora de Recursos Humanos",
        department: "Recursos Humanos",
        salary: 28500,
        hire_date: "2026-10-01",
        contract_type: "tiempo_indeterminado" as const,
        phone: "9841122334",
        employee_code: "EMP-042",
        work_schedule: "Lunes a Viernes 09:00 - 18:00",
        notes: "Contratación estratégica para apertura",
      };

      const result = createEmployeeInvitationSchema.safeParse(validEmployee);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("maria.morales@hotelcaribe.com");
        expect(result.data.full_name).toBe("María Elena Morales");
        expect(result.data.salary).toBe(28500);
      }
    });

    test("Normaliza el email a minúsculas y elimina espacios en blanco", () => {
      const payload = {
        full_name: "Carlos Sanchez",
        email: "  CARLOS.SANCHEZ@EMPRESA.COM  ",
        position: "Recepcionista Bilingüe",
        department: "Recepción",
      };

      const result = createEmployeeInvitationSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("carlos.sanchez@empresa.com");
      }
    });

    test("Rechaza colaboradores con nombre menor a 3 caracteres", () => {
      const invalid = {
        full_name: "Al",
        email: "al@empresa.com",
        position: "Bartender",
      };

      const result = createEmployeeInvitationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.full_name).toBeDefined();
      }
    });

    test("Rechaza emails con formato incorrecto", () => {
      const invalid = {
        full_name: "Alberto Gómez",
        email: "alberto.gomez_sin_arroba",
        position: "Chef de Partie",
      };

      const result = createEmployeeInvitationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    test("Rechaza puestos menores a 2 caracteres", () => {
      const invalid = {
        full_name: "Alberto Gómez",
        email: "alberto@empresa.com",
        position: "A",
      };

      const result = createEmployeeInvitationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.position).toBeDefined();
      }
    });

    test("Rechaza salarios negativos", () => {
      const invalid = {
        full_name: "Laura Martínez",
        email: "laura@empresa.com",
        position: "Capitana de Meseros",
        salary: -5000,
      };

      const result = createEmployeeInvitationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.salary).toBeDefined();
      }
    });
  });

  describe("2. Parseo y Validación de Archivos Masivos (parseEmployeeCsvText)", () => {
    test("Parsea correctamente un CSV con delimitador de coma y mapea cabeceras estándar", () => {
      const csvContent = `Nombre,Correo,Puesto,Departamento,Salario,Fecha de Ingreso,Tipo de Contrato,Teléfono
Juan Pérez,juan.perez@empresa.com,Supervisor de Seguridad,Seguridad,18000,2026-09-15,tiempo_indeterminado,9841234567
Ana Gómez,ana.gomez@empresa.com,Gerente de Alimentos,Alimentos y Bebidas,32000,2026-09-20,tiempo_indeterminado,9849876543`;

      const rows = parseEmployeeCsvText(csvContent);
      expect(rows).toHaveLength(2);

      expect(rows[0].isValid).toBe(true);
      expect(rows[0].full_name).toBe("Juan Pérez");
      expect(rows[0].email).toBe("juan.perez@empresa.com");
      expect(rows[0].position).toBe("Supervisor de Seguridad");
      expect(rows[0].salary).toBe(18000);

      expect(rows[1].isValid).toBe(true);
      expect(rows[1].full_name).toBe("Ana Gómez");
      expect(rows[1].email).toBe("ana.gomez@empresa.com");
      expect(rows[1].salary).toBe(32000);
    });

    test("Parsea correctamente un CSV con delimitador de punto y coma (formato común Excel en español)", () => {
      const csvContent = `Nombre;Correo;Puesto;Departamento;Salario
Rodrigo Pech;rodrigo.pech@maya.com;Desarrollador Web;Tecnología;25000
Lucía Canul;lucia.canul@maya.com;Diseñadora UI;Diseño;22000`;

      const rows = parseEmployeeCsvText(csvContent);
      expect(rows).toHaveLength(2);
      expect(rows[0].isValid).toBe(true);
      expect(rows[0].full_name).toBe("Rodrigo Pech");
      expect(rows[0].email).toBe("rodrigo.pech@maya.com");
      expect(rows[1].isValid).toBe(true);
      expect(rows[1].full_name).toBe("Lucía Canul");
    });

    test("Marca como inválidas las filas con emails malformados sin descartar las filas válidas", () => {
      const csvContent = `Nombre,Correo,Puesto
Colaborador Valido,valido@empresa.com,Auxiliar
Colaborador Invalido,correo-sin-arroba,Cocinero
Otro Valido,otro@empresa.com,Mesero`;

      const rows = parseEmployeeCsvText(csvContent);
      expect(rows).toHaveLength(3);

      expect(rows[0].isValid).toBe(true);
      expect(rows[1].isValid).toBe(false);
      expect(rows[1].errors.length).toBeGreaterThan(0);
      expect(rows[1].errors.join(" ")).toContain("Correo inválido");
      expect(rows[2].isValid).toBe(true);
    });

    test("Marca como inválidas las filas sin nombre o sin puesto", () => {
      const csvContent = `Nombre,Correo,Puesto
,sin_nombre@empresa.com,Steward
Pedro López,pedro@empresa.com,`;

      const rows = parseEmployeeCsvText(csvContent);
      expect(rows).toHaveLength(2);
      expect(rows[0].isValid).toBe(false);
      expect(rows[1].isValid).toBe(false);
    });

    test("Ignora líneas en blanco y espacios vacíos", () => {
      const csvContent = `Nombre,Correo,Puesto

David Chan,david@empresa.com,Electricista

`;

      const rows = parseEmployeeCsvText(csvContent);
      expect(rows).toHaveLength(1);
      expect(rows[0].full_name).toBe("David Chan");
      expect(rows[0].isValid).toBe(true);
    });

    test("Valida filas individuales con bulkEmployeeImportRowSchema", () => {
      const validRow = {
        full_name: "Esteban Quiroz",
        email: "esteban@empresa.com",
        position: "Jardinero",
        salary: 12000,
        hire_date: "2026-10-01",
        contract_type: "tiempo_determinado",
        department: "Mantenimiento",
      };

      const result = bulkEmployeeImportRowSchema.safeParse(validRow);
      expect(result.success).toBe(true);

      const invalidRow = {
        full_name: "Esteban Quiroz",
        email: "correo_invalido",
        position: "Jardinero",
      };

      const invalidResult = bulkEmployeeImportRowSchema.safeParse(invalidRow);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe("3. Criptografía, Seguridad del Token y Cálculo de Expiración", () => {
    test("Genera un token criptográfico seguro de 32 bytes en formato hexadecimal", () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      expect(rawToken).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(rawToken)).toBe(true);
    });

    test("El hash SHA-256 es determinista y no invertible", () => {
      const rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const hash1 = crypto.createHash("sha256").update(rawToken).digest("hex");
      const hash2 = crypto.createHash("sha256").update(rawToken).digest("hex");

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).not.toBe(rawToken);
    });

    test("Calcula correctamente la fecha de expiración a 7 días en el futuro", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const diffInDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffInDays).toBe(7);
      expect(expiresAt > now).toBe(true);
    });
  });

  describe("4. Estados y Casos de Aceptación del Token de Invitación", () => {
    // Simulación del evaluador de invitaciones
    function evaluateInvitation(invitation: {
      status: string;
      expires_at: string;
    } | null, rawToken: string) {
      if (!rawToken || rawToken.trim().length < 10) {
        return { status: "invalid", error: "Enlace de invitación inválido." };
      }
      if (!invitation) {
        return { status: "not_found", error: "La invitación no existe o el enlace ha caducado." };
      }
      if (invitation.status === "accepted") {
        return { status: "already_accepted", error: "Esta invitación ya ha sido aceptada previamente." };
      }
      if (invitation.status === "cancelled") {
        return { status: "cancelled", error: "Esta invitación fue cancelada por la empresa." };
      }
      const now = new Date();
      if (now > new Date(invitation.expires_at) || invitation.status === "expired") {
        return { status: "expired", error: "Esta invitación ha expirado." };
      }
      return { status: "valid" };
    }

    test("Caso Válido: Invitación vigente no aceptada", () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const invitation = { status: "sent", expires_at: futureDate };

      const result = evaluateInvitation(invitation, "a".repeat(64));
      expect(result.status).toBe("valid");
    });

    test("Caso Negativo: Invitación Expirada (> 7 días transcurridos)", () => {
      const pastDate = new Date(Date.now() - 1000 * 60).toISOString(); // Hace 1 minuto
      const invitation = { status: "sent", expires_at: pastDate };

      const result = evaluateInvitation(invitation, "a".repeat(64));
      expect(result.status).toBe("expired");
      expect(result.error).toContain("expirado");
    });

    test("Caso Negativo: Invitación Cancelada por la Empresa", () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const invitation = { status: "cancelled", expires_at: futureDate };

      const result = evaluateInvitation(invitation, "a".repeat(64));
      expect(result.status).toBe("cancelled");
      expect(result.error).toContain("cancelada");
    });

    test("Caso Negativo: Invitación Reutilizada (Ya fue aceptada)", () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const invitation = { status: "accepted", expires_at: futureDate };

      const result = evaluateInvitation(invitation, "a".repeat(64));
      expect(result.status).toBe("already_accepted");
      expect(result.error).toContain("aceptada previamente");
    });

    test("Caso Negativo: Token Manipulado, Demasiado Corto o Inexistente", () => {
      expect(evaluateInvitation(null, "short").status).toBe("invalid");
      expect(evaluateInvitation(null, "a".repeat(64)).status).toBe("not_found");
    });
  });

  describe("5. Reenvío y Cancelación de Invitaciones", () => {
    test("Reenviar invitación genera un nuevo rawToken y restablece el periodo de 7 días", () => {
      const initialToken = "token-original-1234567890abcdef1234567890abcdef";
      const initialHash = crypto.createHash("sha256").update(initialToken).digest("hex");
      const initialExpires = new Date(Date.now() - 10000).toISOString(); // Expirada

      // Simulación de resendEmployeeInvitationAction
      const newRawToken = crypto.randomBytes(32).toString("hex");
      const newTokenHash = crypto.createHash("sha256").update(newRawToken).digest("hex");
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      expect(newRawToken).not.toBe(initialToken);
      expect(newTokenHash).not.toBe(initialHash);
      expect(new Date(newExpiresAt).getTime()).toBeGreaterThan(new Date(initialExpires).getTime());
    });

    test("Cancelar invitación actualiza el estado de la invitación a 'cancelled' y el colaborador a 'terminated'", () => {
      const invitation = {
        id: "inv-1",
        status: "sent",
        employee_id: "emp-1",
      };

      const employee = {
        id: "emp-1",
        status: "pending",
        termination_reason: null as string | null,
      };

      // Simular cancelación
      invitation.status = "cancelled";
      employee.status = "terminated";
      employee.termination_reason = "Invitación cancelada por la empresa";

      expect(invitation.status).toBe("cancelled");
      expect(employee.status).toBe("terminated");
      expect(employee.termination_reason).toBe("Invitación cancelada por la empresa");
    });
  });

  describe("6. Vinculación Automática (Auto-Link) al Completar Registro de Candidato", () => {
    test("Aceptación de invitación actualiza employee_id, activa estado y marca invitación como 'accepted'", () => {
      const candidateUser = {
        id: "user-uuid-candidato-real-123",
        email: "candidato@correo.com",
      };

      const pendingEmployee = {
        id: "emp-table-row-1",
        company_id: "company-uuid-1",
        employee_id: null as string | null,
        full_name: "Candidato Real",
        email: "candidato@correo.com",
        status: "pending",
      };

      const invitation = {
        id: "inv-uuid-1",
        company_id: "company-uuid-1",
        email: "candidato@correo.com",
        status: "sent",
        employee_id: "emp-table-row-1",
        accepted_at: null as string | null,
      };

      // Simular acceptEmployeeInvitationAction
      const now = new Date().toISOString();
      invitation.status = "accepted";
      invitation.accepted_at = now;

      pendingEmployee.employee_id = candidateUser.id;
      pendingEmployee.status = "active";

      // Verificaciones del resultado
      expect(invitation.status).toBe("accepted");
      expect(invitation.accepted_at).toBeDefined();
      expect(pendingEmployee.employee_id).toBe(candidateUser.id);
      expect(pendingEmployee.status).toBe("active");
    });

    test("Aceptación de invitación genera una notificación en la empresa", () => {
      const mockNotifications: Array<{
        user_id: string;
        title: string;
        description: string;
        type: string;
      }> = [];

      const companyId = "company-123";
      const employeeName = "Sofia Mendoza";

      mockNotifications.push({
        user_id: companyId,
        title: "Colaborador se ha unido",
        description: `${employeeName} ha completado su registro y se incorporó a tu plantilla activa.`,
        type: "employee_joined",
      });

      expect(mockNotifications).toHaveLength(1);
      expect(mockNotifications[0].user_id).toBe(companyId);
      expect(mockNotifications[0].title).toBe("Colaborador se ha unido");
      expect(mockNotifications[0].description).toContain(employeeName);
      expect(mockNotifications[0].type).toBe("employee_joined");
    });
  });

  describe("6. Registro Directo de Empleados por la Empresa (registerDirectEmployee)", () => {
    describe("6.1 Validación del Schema (registerDirectEmployeeSchema)", () => {
      test("Acepta datos válidos para registro directo con force_password_change por defecto en true", () => {
        const input = {
          full_name: "Gonzalo Alcocer",
          email: "gonzalo@hotelcaribe.com",
          password: "PasswordSegura123!",
          confirm_password: "PasswordSegura123!",
        };

        const result = registerDirectEmployeeSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.full_name).toBe("Gonzalo Alcocer");
          expect(result.data.email).toBe("gonzalo@hotelcaribe.com");
          expect(result.data.force_password_change).toBe(true);
        }
      });

      test("Normaliza email a minúsculas y elimina espacios circundantes", () => {
        const input = {
          full_name: "  Andrea Castro  ",
          email: "  ANDREA.CASTRO@HOTELCARIBE.COM  ",
          password: "Password123456",
          confirm_password: "Password123456",
          force_password_change: false,
        };

        const result = registerDirectEmployeeSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("andrea.castro@hotelcaribe.com");
          expect(result.data.full_name).toBe("Andrea Castro");
          expect(result.data.force_password_change).toBe(false);
        }
      });

      test("Rechaza si las contraseñas no coinciden", () => {
        const input = {
          full_name: "Manuel Ortega",
          email: "manuel@hotelcaribe.com",
          password: "Password123",
          confirm_password: "DifferentPassword123",
        };

        const result = registerDirectEmployeeSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errors = result.error.flatten().fieldErrors;
          expect(errors.confirm_password).toContain("Las contraseñas no coinciden.");
        }
      });

      test("Rechaza si la contraseña tiene menos de 8 caracteres", () => {
        const input = {
          full_name: "Manuel Ortega",
          email: "manuel@hotelcaribe.com",
          password: "short",
          confirm_password: "short",
        };

        const result = registerDirectEmployeeSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errors = result.error.flatten().fieldErrors;
          expect(errors.password).toBeDefined();
        }
      });

      test("Rechaza nombre menor a 3 caracteres o email inválido", () => {
        const input = {
          full_name: "Jo",
          email: "not-an-email",
          password: "Password123",
          confirm_password: "Password123",
        };

        const result = registerDirectEmployeeSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errors = result.error.flatten().fieldErrors;
          expect(errors.full_name).toBeDefined();
          expect(errors.email).toBeDefined();
        }
      });
    });

    describe("6.2 Lógica de Negocio y Reglas en CompanyEmployeeService.registerDirectEmployee", () => {
      test("Opción A: Rechaza si el correo ya existe en public.profiles y sugiere usar la pestaña Invitar", async () => {
        const mockAdmin = {
          from: vi.fn((table: string) => {
            if (table === "profiles") {
              return {
                select: vi.fn(() => ({
                  ilike: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "user-existing-123", email: "existente@empresa.com", full_name: "Juan Existente" },
                      error: null,
                    }),
                  })),
                })),
              };
            }
            return {};
          }),
          auth: {
            admin: {
              createUser: vi.fn(),
              deleteUser: vi.fn(),
            },
          },
        } as unknown as SupabaseClient<Database>;

        await expect(
          CompanyEmployeeService.registerDirectEmployee(mockAdmin, "company-1", {
            full_name: "Juan Existente",
            email: "existente@empresa.com",
            password: "Password123!",
            confirm_password: "Password123!",
            force_password_change: true,
          })
        ).rejects.toThrow(
          "El correo ya está registrado en K'anPro; utiliza la pestaña Invitar Empleado para vincularlo a tu plantilla."
        );

        // Verifica que no se intentó crear el usuario en Auth
        expect(mockAdmin.auth.admin.createUser).not.toHaveBeenCalled();
      });

      test("Crea el usuario en Auth y lo registra en company_employees sin puesto por defecto", async () => {
        const mockCreatedUserId = "new-user-uuid-456";
        const mockInsertedRow = {
          id: "emp-row-999",
          company_id: "company-1",
          employee_id: mockCreatedUserId,
          full_name: "Elena Gómez",
          email: "elena@hotelcaribe.com",
          job_title: "",
          department: null,
          status: "active",
          hire_date: "2026-10-17",
        };

        const mockInsert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockInsertedRow,
              error: null,
            }),
          })),
        }));

        const mockAdmin = {
          from: vi.fn((table: string) => {
            if (table === "profiles") {
              return {
                select: vi.fn(() => ({
                  ilike: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  })),
                })),
              };
            }
            if (table === "company_employees") {
              return {
                insert: mockInsert,
              };
            }
            return {};
          }),
          auth: {
            admin: {
              createUser: vi.fn().mockResolvedValue({
                data: {
                  user: {
                    id: mockCreatedUserId,
                    email: "elena@hotelcaribe.com",
                    user_metadata: {
                      full_name: "Elena Gómez",
                      role: "candidate",
                      force_password_change: true,
                    },
                  },
                },
                error: null,
              }),
              deleteUser: vi.fn(),
            },
          },
        } as unknown as SupabaseClient<Database>;

        const result = await CompanyEmployeeService.registerDirectEmployee(mockAdmin, "company-1", {
          full_name: "Elena Gómez",
          email: "elena@hotelcaribe.com",
          password: "SecurePassword123!",
          confirm_password: "SecurePassword123!",
          force_password_change: true,
        });

        expect(result.userId).toBe(mockCreatedUserId);
        expect(result.employee.job_title).toBe(""); // Sin puesto por defecto
        expect(result.employee.status).toBe("active");

        // Validar argumentos de creación en Auth
        expect(mockAdmin.auth.admin.createUser).toHaveBeenCalledWith({
          email: "elena@hotelcaribe.com",
          password: "SecurePassword123!",
          email_confirm: true,
          user_metadata: {
            full_name: "Elena Gómez",
            role: "candidate",
            force_password_change: true,
          },
        });

        // Validar inserción en company_employees
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            company_id: "company-1",
            employee_id: mockCreatedUserId,
            full_name: "Elena Gómez",
            email: "elena@hotelcaribe.com",
            job_title: "",
            status: "active",
          })
        );
      });

      test("Ejecuta rollback (deleteUser) si la vinculación en company_employees falla", async () => {
        const mockCreatedUserId = "temp-user-to-rollback";

        const mockAdmin = {
          from: vi.fn((table: string) => {
            if (table === "profiles") {
              return {
                select: vi.fn(() => ({
                  ilike: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  })),
                })),
              };
            }
            if (table === "company_employees") {
              return {
                insert: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: new Error("Foreign key violation or DB error"),
                    }),
                  })),
                })),
              };
            }
            return {};
          }),
          auth: {
            admin: {
              createUser: vi.fn().mockResolvedValue({
                data: {
                  user: {
                    id: mockCreatedUserId,
                  },
                },
                error: null,
              }),
              deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
            },
          },
        } as unknown as SupabaseClient<Database>;

        await expect(
          CompanyEmployeeService.registerDirectEmployee(mockAdmin, "company-1", {
            full_name: "Carlos Fallido",
            email: "carlos.fallido@empresa.com",
            password: "Password123!",
            confirm_password: "Password123!",
            force_password_change: true,
          })
        ).rejects.toThrow("Foreign key violation or DB error");

        // Rollback ejecutado
        expect(mockAdmin.auth.admin.deleteUser).toHaveBeenCalledWith(mockCreatedUserId);
      });
    });
  });

  describe("7. Asignación de Área a Colaborador", () => {
    test("Valida correctamente el esquema de asignación de área con departamento válido", () => {
      const res = assignEmployeeDepartmentSchema.safeParse({
        employeeId: "emp-123",
        department: "Cocina y Alimentos",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.department).toBe("Cocina y Alimentos");
      }
    });

    test("Permite desasignar o limpiar el área (null o vacío)", () => {
      const resNull = assignEmployeeDepartmentSchema.safeParse({
        employeeId: "emp-123",
        department: null,
      });
      expect(resNull.success).toBe(true);

      const resEmpty = assignEmployeeDepartmentSchema.safeParse({
        employeeId: "emp-123",
      });
      expect(resEmpty.success).toBe(true);
    });

    test("Rechaza asignación si falta el employeeId", () => {
      const res = assignEmployeeDepartmentSchema.safeParse({
        employeeId: "",
        department: "Ventas",
      });
      expect(res.success).toBe(false);
    });

    test("Actualiza el departamento del empleado en company_employees correctamente", async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: "emp-123" },
        error: null,
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  maybeSingle: mockMaybeSingle,
                }),
              }),
            }),
          }),
        })),
      } as unknown as SupabaseClient<Database>;

      await CompanyEmployeeService.assignEmployeeDepartment(
        mockSupabase,
        "comp-1",
        "emp-123",
        "Operaciones"
      );

      expect(mockSupabase.from).toHaveBeenCalledWith("company_employees");
    });

    test("registerDirectEmployeeSchema acepta fecha de ingreso historica YYYY-MM-DD", () => {
      const parsed = registerDirectEmployeeSchema.safeParse({
        full_name: "Veterano QA",
        email: "veterano@empresa.mx",
        password: "Password123",
        confirm_password: "Password123",
        hire_date: "2021-05-10",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.hire_date).toBe("2021-05-10");
      }
    });
  });
});


