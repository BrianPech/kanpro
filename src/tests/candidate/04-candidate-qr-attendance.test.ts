import { describe, test, expect, vi, beforeEach } from "vitest";
import { parseQrAttendancePayload } from "@/modules/candidate/utils/qr-attendance-parser";
import {
  employeeQrCheckInSchema,
  type EmployeeQrCheckInInput,
} from "@/modules/candidate/schemas/employee-attendance.schema";
import { CandidateAttendanceService } from "@/modules/candidate/services/candidate-attendance";
import { recordEmployeeQrCheckInAction } from "@/modules/candidate/actions/employee-attendance";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import * as serverSupabase from "@/lib/supabase/server";

describe("Checador QR en el Portal de Colaboradores (Candidate / Employee Attendance)", () => {
  describe("1. Parser de Códigos QR y Enlaces de Sucursal (parseQrAttendancePayload)", () => {
    test("Parsea URL web nativa con parámetros estándar (/checkin?c=...&b=...&t=...)", () => {
      const url =
        "/checkin?c=comp-hotel-maya&b=Recepcion+Playa&t=V4567&lat=20.6296&lng=-87.0739&r=150";
      const parsed = parseQrAttendancePayload(url);

      expect(parsed.token).toBe("V4567");
      expect(parsed.companyId).toBe("comp-hotel-maya");
      expect(parsed.branchName).toBe("Recepcion Playa");
      expect(parsed.branchLat).toBe(20.6296);
      expect(parsed.branchLng).toBe(-87.0739);
      expect(parsed.radiusMeters).toBe(150);
    });

    test("Parsea URL absoluta con protocolo HTTPS (https://kanpro.mx/checkin?...)", () => {
      const url =
        "https://kanpro.mx/checkin?companyId=comp-100&branchName=Sucursal+Norte&token=V8888&lat=21.1619&lng=-86.8515";
      const parsed = parseQrAttendancePayload(url);

      expect(parsed.token).toBe("V8888");
      expect(parsed.companyId).toBe("comp-100");
      expect(parsed.branchName).toBe("Sucursal Norte");
      expect(parsed.branchLat).toBe(21.1619);
      expect(parsed.branchLng).toBe(-86.8515);
    });

    test("Parsea esquema personalizado de Kiosco legado (KANPRO://CHECKIN?branch=...&token=...)", () => {
      const raw =
        "KANPRO://CHECKIN?branch=OficinaCentral&company=comp-A&token=V5678&lat=20.62&lng=-87.07&radius=100";
      const parsed = parseQrAttendancePayload(raw);

      expect(parsed.token).toBe("V5678");
      expect(parsed.branchName).toBe("OficinaCentral");
      expect(parsed.companyName).toBe("comp-A");
      expect(parsed.branchLat).toBe(20.62);
      expect(parsed.branchLng).toBe(-87.07);
      expect(parsed.radiusMeters).toBe(100);
    });

    test("Parsea payload JSON serializado ({ token, branch, company })", () => {
      const json = JSON.stringify({
        token: "V9999",
        branch: "Restaurante Tulum",
        company: "Grupo Gastronómico",
        lat: 20.2114,
        lng: -87.4654,
        radius: 200,
      });
      const parsed = parseQrAttendancePayload(json);

      expect(parsed.token).toBe("V9999");
      expect(parsed.branchName).toBe("Restaurante Tulum");
      expect(parsed.companyName).toBe("Grupo Gastronómico");
      expect(parsed.branchLat).toBe(20.2114);
      expect(parsed.branchLng).toBe(-87.4654);
      expect(parsed.radiusMeters).toBe(200);
    });

    test("Acepta token plano de texto como fallback seguro", () => {
      const rawToken = "V1234-CENTRAL";
      const parsed = parseQrAttendancePayload(rawToken);

      expect(parsed.token).toBe("V1234-CENTRAL");
      expect(parsed.branchName).toBeUndefined();
    });

    test("Maneja string vacío sin arrojar excepciones", () => {
      const parsed = parseQrAttendancePayload("");
      expect(parsed.token).toBe("");
    });

    test("Rechaza URL directa sin parámetros de token retornando token vacío", () => {
      const parsed = parseQrAttendancePayload("http://localhost:3000/checkin");
      expect(parsed.token).toBe("");
    });
  });

  describe("2. Validación de Esquema Zod (employeeQrCheckInSchema)", () => {
    test("Acepta payload válido con QR y coordenadas de geolocalización", () => {
      const input: EmployeeQrCheckInInput = {
        qrUrlOrToken: "/checkin?b=Oficina+Central&t=V1000",
        coordinates: {
          lat: 20.6296,
          lng: -87.0739,
          accuracy: 5,
        },
      };

      const result = employeeQrCheckInSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("Acepta payload válido sin coordenadas GPS opcionales", () => {
      const input = {
        qrUrlOrToken: "V2026-TOKEN",
      };

      const result = employeeQrCheckInSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    test("Rechaza payload con token QR vacío", () => {
      const input = {
        qrUrlOrToken: "",
      };

      const result = employeeQrCheckInSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    test("Rechaza coordenadas GPS fuera de rango geográfico", () => {
      const invalidLat = {
        qrUrlOrToken: "V1000",
        coordinates: {
          lat: 95, // Latitud máxima es 90
          lng: -87.07,
        },
      };
      expect(employeeQrCheckInSchema.safeParse(invalidLat).success).toBe(false);

      const invalidLng = {
        qrUrlOrToken: "V1000",
        coordinates: {
          lat: 20.62,
          lng: -195, // Longitud mínima es -180
        },
      };
      expect(employeeQrCheckInSchema.safeParse(invalidLng).success).toBe(false);
    });
  });

  describe("3. Servicio CandidateAttendanceService (Lógica de Negocio y Búsqueda de Colaborador)", () => {
    function createMockSupabase(initialState?: {
      employees?: Array<{
        id: string;
        company_id: string;
        full_name: string;
        email: string | null;
        employee_id: string | null;
        status: string;
        work_schedule?: string | null;
      }>;
      attendance?: Array<{
        id: string;
        company_id: string;
        employee_id: string;
        work_date: string;
        check_in_time: string | null;
        check_out_time: string | null;
        status: string;
        delay_minutes: number;
        check_in_method: string;
      }>;
    }) {
      const employees = [...(initialState?.employees || [])];
      const attendance = [...(initialState?.attendance || [])];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_employees") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    maybeSingle: vi.fn(async () => {
                      const found = employees.find(
                        (e) =>
                          (e as Record<string, unknown>)[fieldA] === valA &&
                          (e as Record<string, unknown>)[fieldB] === valB
                      );
                      return { data: found || null, error: null };
                    }),
                    single: vi.fn(async () => {
                      const found = employees.find(
                        (e) =>
                          (e as Record<string, unknown>)[fieldA] === valA &&
                          (e as Record<string, unknown>)[fieldB] === valB
                      );
                      return found
                        ? { data: found, error: null }
                        : { data: null, error: { message: "Not found" } };
                    }),
                  })),
                  single: vi.fn(async () => {
                    const found = employees.find(
                      (e) => (e as Record<string, unknown>)[fieldA] === valA
                    );
                    return found
                      ? { data: found, error: null }
                      : { data: null, error: { message: "Not found" } };
                  }),
                })),
              })),
            };
          }

          if (table === "company_attendance") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    eq: vi.fn((fieldC: string, valC: string) => ({
                      maybeSingle: vi.fn(async () => {
                        const found = attendance.find(
                          (a) =>
                            (a as Record<string, unknown>)[fieldA] === valA &&
                            (a as Record<string, unknown>)[fieldB] === valB &&
                            (a as Record<string, unknown>)[fieldC] === valC
                        );
                        return { data: found || null, error: null };
                      }),
                    })),
                  })),
                })),
              })),
              upsert: vi.fn((payload: Record<string, unknown>) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const existingIndex = attendance.findIndex(
                      (a) =>
                        a.company_id === payload.company_id &&
                        a.employee_id === payload.employee_id &&
                        a.work_date === payload.work_date
                    );
                    const row = {
                      id:
                        existingIndex >= 0
                          ? attendance[existingIndex].id
                          : `att-${Date.now()}`,
                      company_id: payload.company_id as string,
                      employee_id: payload.employee_id as string,
                      work_date: payload.work_date as string,
                      check_in_time:
                        (payload.check_in_time as string) ||
                        (existingIndex >= 0
                          ? attendance[existingIndex].check_in_time
                          : null),
                      check_out_time:
                        (payload.check_out_time as string) || null,
                      status: (payload.status as string) || "presente",
                      delay_minutes: (payload.delay_minutes as number) || 0,
                      check_in_method:
                        (payload.check_in_method as string) || "qr",
                    };
                    if (existingIndex >= 0) {
                      attendance[existingIndex] = row;
                    } else {
                      attendance.push(row);
                    }
                    return { data: row, error: null };
                  }),
                })),
              })),
            };
          }

          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, employees, attendance };
    }

    test("findActiveEmployee: Encuentra colaborador activo por employee_id (auth user id)", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-row-1",
            company_id: "comp-A",
            full_name: "Mariana Rivera",
            email: "mariana@example.com",
            employee_id: "user-uuid-1",
            status: "active",
          },
        ],
      });

      const service = new CandidateAttendanceService(client);
      const emp = await service.findActiveEmployee("user-uuid-1", "mariana@example.com");

      expect(emp).toBeDefined();
      expect(emp?.id).toBe("emp-row-1");
      expect(emp?.full_name).toBe("Mariana Rivera");
    });

    test("findActiveEmployee: Encuentra colaborador activo por email si employee_id es nulo o diferente", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-row-2",
            company_id: "comp-B",
            full_name: "Carlos Dzib",
            email: "carlos@hotel.mx",
            employee_id: null, // Aún no enlazado con user.id directamente
            status: "active",
          },
        ],
      });

      const service = new CandidateAttendanceService(client);
      const emp = await service.findActiveEmployee("user-new-uuid", "carlos@hotel.mx");

      expect(emp).toBeDefined();
      expect(emp?.id).toBe("emp-row-2");
      expect(emp?.full_name).toBe("Carlos Dzib");
    });

    test("findActiveEmployee: Retorna null si el colaborador está inactivo (baja)", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-row-inactive",
            company_id: "comp-A",
            full_name: "Empleado Baja",
            email: "baja@example.com",
            employee_id: "user-baja-1",
            status: "terminated",
          },
        ],
      });

      const service = new CandidateAttendanceService(client);
      const emp = await service.findActiveEmployee("user-baja-1", "baja@example.com");

      expect(emp).toBeNull();
    });

    test("recordQrCheckIn: Registra ENTRADA (check_in) cuando el colaborador no tiene registro hoy", async () => {
      const { client, attendance } = createMockSupabase({
        employees: [
          {
            id: "emp-checkin-1",
            company_id: "comp-A",
            full_name: "Alejandra May",
            email: "alejandra@example.com",
            employee_id: "user-1",
            status: "active",
            work_schedule: "08:00 - 17:00",
          },
        ],
      });

      const service = new CandidateAttendanceService(client);
      const result = await service.recordQrCheckIn(
        {
          id: "emp-checkin-1",
          company_id: "comp-A",
          full_name: "Alejandra May",
          email: "alejandra@example.com",
          employee_id: "user-1",
          status: "active",
        },
        {
          qrUrlOrToken: "/checkin?b=Oficina+Central&t=V1234",
          coordinates: { lat: 20.6296, lng: -87.0739 },
        }
      );

      expect(result.actionType).toBe("check_in");
      expect(result.employeeName).toBe("Alejandra May");
      expect(result.branchName).toBe("Oficina Central");
      expect(result.timeStr).toMatch(/^\d{2}:\d{2}$/);
      expect(attendance.length).toBe(1);
      expect(attendance[0].check_in_time).toBeDefined();
      expect(attendance[0].check_out_time).toBeNull();
    });

    test("recordQrCheckIn: Registra SALIDA (check_out) automáticamente si ya checó entrada hoy", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const { client, attendance } = createMockSupabase({
        employees: [
          {
            id: "emp-checkout-1",
            company_id: "comp-A",
            full_name: "Fernando Pech",
            email: "fernando@example.com",
            employee_id: "user-2",
            status: "active",
            work_schedule: "08:00 - 17:00",
          },
        ],
        attendance: [
          {
            id: "att-existing-1",
            company_id: "comp-A",
            employee_id: "emp-checkout-1",
            work_date: todayStr,
            check_in_time: "08:02",
            check_out_time: null,
            status: "presente",
            delay_minutes: 0,
            check_in_method: "qr",
          },
        ],
      });

      const service = new CandidateAttendanceService(client);
      const result = await service.recordQrCheckIn(
        {
          id: "emp-checkout-1",
          company_id: "comp-A",
          full_name: "Fernando Pech",
          email: "fernando@example.com",
          employee_id: "user-2",
          status: "active",
        },
        {
          qrUrlOrToken: "https://kanpro.mx/checkin?b=Sucursal+Playa&t=V9999",
        }
      );

      expect(result.actionType).toBe("check_out");
      expect(attendance.length).toBe(1);
      expect(attendance[0].check_in_time).toBe("08:02"); // Preserva la entrada original
      expect(attendance[0].check_out_time).toBeDefined(); // Asigna la hora de salida
    });

    test("recordQrCheckIn: Falla con Doble Factor si el colaborador está fuera de la geocerca de la sucursal", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-dist-1",
            company_id: "comp-A",
            full_name: "Empleado Lejano",
            email: "dist@example.com",
            employee_id: "user-3",
            status: "active",
          },
        ],
      });

      const service = new CandidateAttendanceService(client);
      // Coordenadas a varios kilómetros de distancia de la sucursal
      await expect(
        service.recordQrCheckIn(
          {
            id: "emp-dist-1",
            company_id: "comp-A",
            full_name: "Empleado Lejano",
            email: "dist@example.com",
            employee_id: "user-3",
            status: "active",
          },
          {
            qrUrlOrToken:
              "/checkin?b=Sucursal&t=V1000&lat=20.6296&lng=-87.0739&radius=100",
            coordinates: { lat: 21.1619, lng: -86.8515 }, // Cancún vs Playa del Carmen (~65km)
          }
        )
      ).rejects.toThrow(/Fuera de la zona de trabajo autorizada/);
    });
  });

  describe("4. Server Action (recordEmployeeQrCheckInAction)", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    test("Rechaza solicitud si el usuario no tiene sesión activa", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Auth session missing" },
          }),
        },
      };

      vi.spyOn(serverSupabase, "createClient").mockResolvedValue(
        mockSupabase as unknown as SupabaseClient<Database>
      );

      const res = await recordEmployeeQrCheckInAction({
        qrUrlOrToken: "V1234",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("No autorizado");
    });

    test("Rechaza solicitud si el usuario autenticado no está en la plantilla activa", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-unlinked", email: "unlinked@example.com" } },
            error: null,
          }),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          })),
        })),
      };

      vi.spyOn(serverSupabase, "createClient").mockResolvedValue(
        mockSupabase as unknown as SupabaseClient<Database>
      );

      const res = await recordEmployeeQrCheckInAction({
        qrUrlOrToken: "V1234",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("No se encontró un perfil de colaborador activo");
    });
  });
});
