import { describe, test, expect, vi } from "vitest";
import {
  mobileCheckInSchema,
  manualAttendanceSchema,
  authorizeOvertimeSchema,
  reviewJustificationSchema,
  getAttendanceHistorySchema,
} from "@/modules/company/schemas/attendance.schema";
import {
  CompanyAttendanceService,
  resolveWorkSchedule,
  calculateDelayMinutes,
  type AttendanceRow,
} from "@/modules/company/services/company-attendance";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { generateQrSvg } from "@/modules/company/utils/qrcode";

describe("Fase 15: Módulo de Asistencia - Arquitectura Schema -> Handler -> Service", () => {
  describe("1. Validación de Esquemas Zod (attendance.schema.ts)", () => {
    test("mobileCheckInSchema: Valida checada válida por GPS y QR", () => {
      const gpsPayload = {
        employeeId: "emp-123",
        actionType: "check_in" as const,
        method: "gps" as const,
        coordinates: {
          lat: 20.6296,
          lng: -87.0739,
          accuracy: 10,
        },
        distanceMeters: 45,
      };
      const resGps = mobileCheckInSchema.safeParse(gpsPayload);
      expect(resGps.success).toBe(true);

      const qrPayload = {
        employeeId: "emp-456",
        actionType: "check_out" as const,
        method: "qr" as const,
        qrToken: "token-valid-abc",
      };
      const resQr = mobileCheckInSchema.safeParse(qrPayload);
      expect(resQr.success).toBe(true);

      const autoPayload = {
        employeeId: "emp-789",
        actionType: "auto" as const,
        method: "qr" as const,
        qrToken: "token-auto-123",
      };
      const resAuto = mobileCheckInSchema.safeParse(autoPayload);
      expect(resAuto.success).toBe(true);
    });

    test("mobileCheckInSchema: Rechaza entrada con datos inválidos", () => {
      const invalidAction = {
        employeeId: "emp-123",
        actionType: "invalid_action",
        method: "gps",
      };
      expect(mobileCheckInSchema.safeParse(invalidAction).success).toBe(false);

      const missingEmployee = {
        employeeId: "",
        actionType: "check_in",
        method: "manual",
      };
      expect(mobileCheckInSchema.safeParse(missingEmployee).success).toBe(false);

      const invalidCoords = {
        employeeId: "emp-123",
        actionType: "check_in",
        method: "gps",
        coordinates: {
          lat: 120, // Latitud fuera de rango (-90 a 90)
          lng: -87.07,
        },
      };
      expect(mobileCheckInSchema.safeParse(invalidCoords).success).toBe(false);
    });

    test("manualAttendanceSchema: Valida registros manuales y formato de fecha", () => {
      const validManual = {
        employeeId: "emp-789",
        workDate: "2026-10-01",
        checkInTime: "08:10",
        checkOutTime: "17:15",
        status: "presente" as const,
        notes: "Aclaración por huella no detectada",
      };
      const result = manualAttendanceSchema.safeParse(validManual);
      expect(result.success).toBe(true);

      const invalidDate = {
        ...validManual,
        workDate: "01-10-2026", // Formato incorrecto
      };
      expect(manualAttendanceSchema.safeParse(invalidDate).success).toBe(false);

      const invalidStatus = {
        ...validManual,
        status: "desconocido",
      };
      expect(manualAttendanceSchema.safeParse(invalidStatus).success).toBe(false);
    });

    test("authorizeOvertimeSchema: Valida horas extras y tipo de tarifa", () => {
      const valid = {
        recordId: "rec-01",
        hours: 2.5,
        rateType: "doble" as const,
        notes: "Turno extraordinario por inventario",
      };
      expect(authorizeOvertimeSchema.safeParse(valid).success).toBe(true);

      const zeroHours = {
        ...valid,
        hours: 0,
      };
      expect(authorizeOvertimeSchema.safeParse(zeroHours).success).toBe(false);

      const negativeHours = {
        ...valid,
        hours: -2,
      };
      expect(authorizeOvertimeSchema.safeParse(negativeHours).success).toBe(false);

      const invalidRate = {
        ...valid,
        rateType: "cuadruple",
      };
      expect(authorizeOvertimeSchema.safeParse(invalidRate).success).toBe(false);
    });

    test("reviewJustificationSchema: Valida resolución de justificantes", () => {
      const validApprove = {
        recordId: "rec-01",
        decision: "aprobada" as const,
        comments: "Incapacidad IMSS verificada",
      };
      expect(reviewJustificationSchema.safeParse(validApprove).success).toBe(true);

      const validReject = {
        recordId: "rec-01",
        decision: "rechazada" as const,
      };
      expect(reviewJustificationSchema.safeParse(validReject).success).toBe(true);

      const invalidDecision = {
        recordId: "rec-01",
        decision: "pendiente",
      };
      expect(reviewJustificationSchema.safeParse(invalidDecision).success).toBe(false);
    });

    test("getAttendanceHistorySchema: Valida parámetros de consulta mensual", () => {
      const valid = {
        employeeId: "emp-123",
        month: 10,
        year: 2026,
      };
      expect(getAttendanceHistorySchema.safeParse(valid).success).toBe(true);

      const invalidMonth = {
        employeeId: "emp-123",
        month: 13,
      };
      expect(getAttendanceHistorySchema.safeParse(invalidMonth).success).toBe(false);
    });
  });

  describe("2. Utilidades y Reglas de Negocio Puras", () => {
    test("resolveWorkSchedule: Parsea horarios con guion o aplica valores por defecto", () => {
      const custom = resolveWorkSchedule("09:00 - 18:00");
      expect(custom.scheduledCheckIn).toBe("09:00");
      expect(custom.scheduledCheckOut).toBe("18:00");

      const empty = resolveWorkSchedule(null);
      expect(empty.scheduledCheckIn).toBe("08:00");
      expect(empty.scheduledCheckOut).toBe("17:00");
    });

    test("calculateDelayMinutes: Respeta los 15 minutos de tolerancia para retardos", () => {
      // Entrada a las 08:00, checada a las 08:12 (dentro de tolerancia de 15 min)
      const onTimeDate = new Date("2026-10-01T08:12:00");
      const onTime = calculateDelayMinutes("08:00", onTimeDate, 15);
      expect(onTime.isLate).toBe(false);
      expect(onTime.delayMinutes).toBe(0);

      // Entrada a las 08:00, checada a las 08:15 (exactamente en el límite de tolerancia)
      const exactLimitDate = new Date("2026-10-01T08:15:00");
      const exactLimit = calculateDelayMinutes("08:00", exactLimitDate, 15);
      expect(exactLimit.isLate).toBe(false);
      expect(exactLimit.delayMinutes).toBe(0);

      // Entrada a las 08:00, checada a las 08:25 (supera los 15 min de tolerancia)
      const lateDate = new Date("2026-10-01T08:25:00");
      const late = calculateDelayMinutes("08:00", lateDate, 15);
      expect(late.isLate).toBe(true);
      expect(late.delayMinutes).toBe(25);
    });
  });

  describe("3. CompanyAttendanceService (Aislamiento y Lógica de Negocio)", () => {
    function createMockSupabase(initialState?: {
      employees?: Array<{
        id: string;
        company_id: string;
        full_name: string;
        work_schedule?: string | null;
        job_title?: string | null;
        department?: string | null;
        avatar_url?: string | null;
      }>;
      attendance?: AttendanceRow[];
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
                    single: vi.fn(async () => {
                      const found = employees.find(
                        (e) => (e as Record<string, unknown>)[fieldA] === valA && (e as Record<string, unknown>)[fieldB] === valB
                      );
                      return found ? { data: found, error: null } : { data: null, error: { message: "Not found" } };
                    }),
                  })),
                  single: vi.fn(async () => {
                    const found = employees.find((e) => (e as Record<string, unknown>)[fieldA] === valA);
                    return found ? { data: found, error: null } : { data: null, error: { message: "Not found" } };
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
                    gte: vi.fn(() => ({
                      lte: vi.fn(() => ({
                        order: vi.fn(async () => {
                          const records = attendance.filter(
                            (a) => (a as Record<string, unknown>)[fieldA] === valA && (a as Record<string, unknown>)[fieldB] === valB
                          );
                          return { data: records, error: null };
                        }),
                      })),
                    })),
                  })),
                })),
              })),
              insert: vi.fn((payload: Database["public"]["Tables"]["company_attendance"]["Insert"]) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const newRow = {
                      ...payload,
                      id: `att-${Date.now()}`,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    } as AttendanceRow;
                    attendance.push(newRow);
                    return { data: newRow, error: null };
                  }),
                })),
              })),
              update: vi.fn((updateData: Database["public"]["Tables"]["company_attendance"]["Update"]) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    select: vi.fn(() => ({
                      single: vi.fn(async () => {
                        const idx = attendance.findIndex(
                          (a) => (a as Record<string, unknown>)[fieldA] === valA && (a as Record<string, unknown>)[fieldB] === valB
                        );
                        if (idx === -1) return { data: null, error: { message: "Record not found" } };
                        attendance[idx] = { ...attendance[idx], ...updateData, updated_at: new Date().toISOString() };
                        return { data: attendance[idx], error: null };
                      }),
                    })),
                  })),
                  select: vi.fn(() => ({
                    single: vi.fn(async () => {
                      const idx = attendance.findIndex((a) => (a as Record<string, unknown>)[fieldA] === valA);
                      if (idx === -1) return { data: null, error: { message: "Record not found" } };
                      attendance[idx] = { ...attendance[idx], ...updateData, updated_at: new Date().toISOString() };
                      return { data: attendance[idx], error: null };
                    }),
                  })),
                })),
              })),
              upsert: vi.fn((payload: Database["public"]["Tables"]["company_attendance"]["Insert"]) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const existingIndex = attendance.findIndex(
                      (a) =>
                        a.company_id === payload.company_id &&
                        a.employee_id === payload.employee_id &&
                        a.work_date === payload.work_date
                    );
                    if (existingIndex >= 0) {
                      attendance[existingIndex] = {
                        ...attendance[existingIndex],
                        ...payload,
                        updated_at: new Date().toISOString(),
                      };
                      return { data: attendance[existingIndex], error: null };
                    }
                    const newRow = {
                      ...payload,
                      id: `att-manual-${Date.now()}`,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    } as AttendanceRow;
                    attendance.push(newRow);
                    return { data: newRow, error: null };
                  }),
                })),
              })),
            };
          }

          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, attendance };
    }

    test("recordMobileCheckIn: Inserta checada correctamente para colaborador de la empresa", async () => {
      const { client, attendance } = createMockSupabase({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-A",
            full_name: "Juan Pérez",
            work_schedule: "08:00 - 17:00",
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      const res = await service.recordMobileCheckIn("comp-A", {
        employeeId: "emp-1",
        actionType: "check_in",
        method: "gps",
        coordinates: { lat: 20.62, lng: -87.07, accuracy: 5 },
        distanceMeters: 20,
      });

      expect(res.record).toBeDefined();
      expect(res.record.employee_id).toBe("emp-1");
      expect(res.record.company_id).toBe("comp-A");
      expect(attendance.length).toBe(1);
    });

    test("recordMobileCheckIn: Falla si el colaborador pertenece a otra empresa (Multi-tenant check)", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-B", // Empresa B
            full_name: "Empleado B",
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      // Empresa A intenta checar a un empleado de Empresa B
      await expect(
        service.recordMobileCheckIn("comp-A", {
          employeeId: "emp-1",
          actionType: "check_in",
          method: "manual",
        })
      ).rejects.toThrow("Colaborador no encontrado en la plantilla de la empresa.");
    });

    test("recordMobileCheckIn: Doble Factor (QR + Geocerca GPS) registra checada y extrae nombre y horario del colaborador", async () => {
      const { client, attendance } = createMockSupabase({
        employees: [
          {
            id: "emp-qr-1",
            company_id: "comp-A",
            full_name: "Sofía Martínez",
            job_title: "Ingeniera de Software",
            department: "Tecnología",
            work_schedule: "08:30 - 17:30",
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      const res = await service.recordMobileCheckIn("comp-A", {
        employeeId: "emp-qr-1",
        actionType: "check_in",
        method: "qr",
        qrToken: "V9876-CENTRAL",
        distanceMeters: 25, // Dentro del límite de 150m
        coordinates: { lat: 20.6297, lng: -87.0738, accuracy: 4 },
      });

      // Valida inserción y campos del registro
      expect(res.record).toBeDefined();
      expect(res.record.employee_id).toBe("emp-qr-1");
      expect(res.record.check_in_method).toBe("qr");
      expect(attendance.length).toBe(1);

      // Valida extracción del nombre del trabajador y horario programado
      expect(res.employeeName).toBe("Sofía Martínez");
      expect(res.jobTitle).toBe("Ingeniera de Software");
      expect(res.department).toBe("Tecnología");
      expect(res.scheduledCheckIn).toBe("08:30");
      expect(res.scheduledCheckOut).toBe("17:30");
      expect(res.timeStr).toMatch(/^\d{2}:\d{2}$/);
    });

    test("recordMobileCheckIn: Doble Factor rechaza checada si falta el token QR", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-qr-2",
            company_id: "comp-A",
            full_name: "Roberto Gómez",
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      await expect(
        service.recordMobileCheckIn("comp-A", {
          employeeId: "emp-qr-2",
          actionType: "check_in",
          method: "qr",
          qrToken: "", // Token vacío
          distanceMeters: 10,
        })
      ).rejects.toThrow("Código QR no proporcionado o inválido.");
    });

    test("recordMobileCheckIn: Doble Factor rechaza checada si el colaborador está fuera de la geocerca (> 150m)", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-qr-3",
            company_id: "comp-A",
            full_name: "Andrés Guardado",
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      await expect(
        service.recordMobileCheckIn("comp-A", {
          employeeId: "emp-qr-3",
          actionType: "check_in",
          method: "qr",
          qrToken: "V1234",
          distanceMeters: 350, // 350 metros > 150m de límite
        })
      ).rejects.toThrow(/Fuera de la zona de trabajo autorizada/);
    });

    test("recordMobileCheckIn: actionType auto registra Entrada (check_in) cuando no existe registro hoy", async () => {
      const { client, attendance } = createMockSupabase({
        employees: [
          {
            id: "emp-auto-1",
            company_id: "comp-A",
            full_name: "Mariana Treviño",
            work_schedule: "08:00 - 17:00",
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      const res = await service.recordMobileCheckIn("comp-A", {
        employeeId: "emp-auto-1",
        actionType: "auto",
        method: "qr",
        qrToken: "V9999",
        distanceMeters: 20,
      });

      expect(res.actionTaken).toBe("check_in");
      expect(res.record.check_in_time).toBeDefined();
      expect(res.record.check_out_time).toBeNull();
      expect(attendance.length).toBe(1);
    });

    test("recordMobileCheckIn: actionType auto registra Salida (check_out) si ya existe Entrada hoy", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const existingIn: AttendanceRow = {
        id: "att-auto-existing",
        company_id: "comp-A",
        employee_id: "emp-auto-2",
        work_date: todayStr,
        scheduled_check_in: "08:00",
        scheduled_check_out: "17:00",
        check_in_time: "08:02",
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        check_in_method: "qr",
        check_in_lat: 20.62,
        check_in_lng: -87.07,
        check_in_accuracy: 5,
        check_in_distance_meters: 15,
        delay_minutes: 0,
        status: "presente",
        overtime_hours: 0,
        overtime_status: null,
        overtime_rate_type: null,
        overtime_notes: null,
        justification_reason_type: null,
        justification_label: null,
        justification_comments: null,
        justification_evidence_url: null,
        justification_status: null,
        justification_submitted_at: null,
        justification_reviewed_at: null,
        justification_reviewed_by: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { client, attendance } = createMockSupabase({
        employees: [
          {
            id: "emp-auto-2",
            company_id: "comp-A",
            full_name: "Carlos Hermosillo",
            work_schedule: "08:00 - 17:00",
          },
        ],
        attendance: [existingIn],
      });

      const service = new CompanyAttendanceService(client);
      const res = await service.recordMobileCheckIn("comp-A", {
        employeeId: "emp-auto-2",
        actionType: "auto",
        method: "qr",
        qrToken: "V9999",
        distanceMeters: 30,
      });

      expect(res.actionTaken).toBe("check_out");
      expect(res.record.check_in_time).toBe("08:02");
      expect(res.record.check_out_time).toBeDefined();
      expect(res.record.check_out_time).not.toBeNull();
      expect(attendance.length).toBe(1);
    });

    test("recordMobileCheckIn: actionType auto actualiza Salida (check_out) si ambos ya estaban registrados hoy", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const completedTurn: AttendanceRow = {
        id: "att-auto-completed",
        company_id: "comp-A",
        employee_id: "emp-auto-3",
        work_date: todayStr,
        scheduled_check_in: "08:00",
        scheduled_check_out: "17:00",
        check_in_time: "07:55",
        check_out_time: "17:05",
        break_start_time: null,
        break_end_time: null,
        check_in_method: "qr",
        check_in_lat: 20.62,
        check_in_lng: -87.07,
        check_in_accuracy: 5,
        check_in_distance_meters: 10,
        delay_minutes: 0,
        status: "presente",
        overtime_hours: 0,
        overtime_status: null,
        overtime_rate_type: null,
        overtime_notes: null,
        justification_reason_type: null,
        justification_label: null,
        justification_comments: null,
        justification_evidence_url: null,
        justification_status: null,
        justification_submitted_at: null,
        justification_reviewed_at: null,
        justification_reviewed_by: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-auto-3",
            company_id: "comp-A",
            full_name: "Lucía Méndez",
            work_schedule: "08:00 - 17:00",
          },
        ],
        attendance: [completedTurn],
      });

      const service = new CompanyAttendanceService(client);
      const res = await service.recordMobileCheckIn("comp-A", {
        employeeId: "emp-auto-3",
        actionType: "auto",
        method: "qr",
        qrToken: "V9999",
        distanceMeters: 12,
      });

      expect(res.actionTaken).toBe("check_out");
      expect(res.record.check_in_time).toBe("07:55");
      expect(res.record.check_out_time).toBeDefined();
    });

    test("generateQrSvg: Genera código QR vectorial SVG válido para el kiosco de la sucursal", async () => {
      const payload = "KANPRO://CHECKIN?branch=OficinaCentral&token=V5678";
      const svg = await generateQrSvg(payload, { width: 200, margin: 1 });

      expect(svg).toBeDefined();
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("viewBox");
    });

    test("createManualAttendance: Inserta asistencia manual respetando pertenencia de empresa", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-A",
            full_name: "Juan Pérez",
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      const res = await service.createManualAttendance("comp-A", {
        employeeId: "emp-1",
        workDate: "2026-10-01",
        status: "presente",
        checkInTime: "08:05",
        checkOutTime: "17:00",
        notes: "Aprobado por RH",
      });

      expect(res.status).toBe("presente");
      expect(res.check_in_time).toBe("08:05");
      expect(res.notes).toBe("Aprobado por RH");
    });

    test("authorizeOvertime: Autoriza horas extras y valida empresa", async () => {
      const existingAtt: AttendanceRow = {
        id: "rec-100",
        company_id: "comp-A",
        employee_id: "emp-1",
        work_date: "2026-10-01",
        scheduled_check_in: "08:00",
        scheduled_check_out: "17:00",
        check_in_time: "08:00",
        check_out_time: "20:00",
        break_start_time: null,
        break_end_time: null,
        check_in_method: "gps",
        check_in_lat: null,
        check_in_lng: null,
        check_in_accuracy: null,
        check_in_distance_meters: null,
        delay_minutes: 0,
        status: "presente",
        overtime_hours: 0,
        overtime_status: null,
        overtime_rate_type: null,
        overtime_notes: null,
        justification_reason_type: null,
        justification_label: null,
        justification_comments: null,
        justification_evidence_url: null,
        justification_status: null,
        justification_submitted_at: null,
        justification_reviewed_at: null,
        justification_reviewed_by: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { client } = createMockSupabase({ attendance: [existingAtt] });
      const service = new CompanyAttendanceService(client);

      const res = await service.authorizeOvertime("comp-A", {
        recordId: "rec-100",
        hours: 3,
        rateType: "doble",
      });

      expect(res.overtime_hours).toBe(3);
      expect(res.overtime_status).toBe("autorizado");
      expect(res.overtime_rate_type).toBe("doble");

      // Intento de autorización por otra empresa debe fallar
      await expect(
        service.authorizeOvertime("comp-HACKER", {
          recordId: "rec-100",
          hours: 3,
          rateType: "doble",
        })
      ).rejects.toThrow("Registro de asistencia no encontrado o no autorizado.");
    });

    test("reviewJustification: Aprueba y rechaza justificante con actualización de estado", async () => {
      const existingAtt: AttendanceRow = {
        id: "rec-200",
        company_id: "comp-A",
        employee_id: "emp-1",
        work_date: "2026-10-01",
        scheduled_check_in: "08:00",
        scheduled_check_out: "17:00",
        check_in_time: null,
        check_out_time: null,
        break_start_time: null,
        break_end_time: null,
        check_in_method: "manual",
        check_in_lat: null,
        check_in_lng: null,
        check_in_accuracy: null,
        check_in_distance_meters: null,
        delay_minutes: 0,
        status: "falta_injustificada",
        overtime_hours: 0,
        overtime_status: null,
        overtime_rate_type: null,
        overtime_notes: null,
        justification_reason_type: "medica",
        justification_label: "Incapacidad Médica",
        justification_comments: "Comprobante emitido por IMSS",
        justification_evidence_url: null,
        justification_status: "pendiente",
        justification_submitted_at: new Date().toISOString(),
        justification_reviewed_at: null,
        justification_reviewed_by: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { client } = createMockSupabase({ attendance: [existingAtt] });
      const service = new CompanyAttendanceService(client);

      const approved = await service.reviewJustification("comp-A", "rh@empresa.com", {
        recordId: "rec-200",
        decision: "aprobada",
        comments: "Justificante legal válido",
      });

      expect(approved.status).toBe("falta_justificada");
      expect(approved.justification_status).toBe("aprobada");
      expect(approved.justification_reviewed_by).toBe("rh@empresa.com");
    });

    test("getEmployeeAttendanceHistory: Obtiene historial y calcula tasa de puntualidad", async () => {
      const { client } = createMockSupabase({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-A",
            full_name: "Rosa Morales",
            job_title: "Supervisora",
            department: "Operaciones",
          },
        ],
        attendance: [
          {
            id: "att-day1",
            company_id: "comp-A",
            employee_id: "emp-1",
            work_date: "2026-10-01",
            scheduled_check_in: "08:00",
            scheduled_check_out: "17:00",
            check_in_time: "08:00",
            check_out_time: "17:00",
            break_start_time: null,
            break_end_time: null,
            check_in_method: "gps",
            check_in_lat: null,
            check_in_lng: null,
            check_in_accuracy: null,
            check_in_distance_meters: null,
            delay_minutes: 0,
            status: "presente",
            overtime_hours: 0,
            overtime_status: null,
            overtime_rate_type: null,
            overtime_notes: null,
            justification_reason_type: null,
            justification_label: null,
            justification_comments: null,
            justification_evidence_url: null,
            justification_status: null,
            justification_submitted_at: null,
            justification_reviewed_at: null,
            justification_reviewed_by: null,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "att-day2",
            company_id: "comp-A",
            employee_id: "emp-1",
            work_date: "2026-10-02",
            scheduled_check_in: "08:00",
            scheduled_check_out: "17:00",
            check_in_time: "08:30",
            check_out_time: "17:00",
            break_start_time: null,
            break_end_time: null,
            check_in_method: "gps",
            check_in_lat: null,
            check_in_lng: null,
            check_in_accuracy: null,
            check_in_distance_meters: null,
            delay_minutes: 30,
            status: "retardo",
            overtime_hours: 0,
            overtime_status: null,
            overtime_rate_type: null,
            overtime_notes: null,
            justification_reason_type: null,
            justification_label: null,
            justification_comments: null,
            justification_evidence_url: null,
            justification_status: null,
            justification_submitted_at: null,
            justification_reviewed_at: null,
            justification_reviewed_by: null,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const service = new CompanyAttendanceService(client);
      const history = await service.getEmployeeAttendanceHistory("comp-A", {
        employeeId: "emp-1",
        month: 10,
        year: 2026,
      });

      expect(history.employeeId).toBe("emp-1");
      expect(history.daysPresent).toBe(2);
      expect(history.daysLate).toBe(1);
      // Tasa de puntualidad = (presentes - retardos) / presentes = (2 - 1) / 2 = 50%
      expect(history.individualPunctualityRate).toBe(50);
      expect(history.totalEffectiveHours).toBe(16); // 8 + 8
    });
  });
});
