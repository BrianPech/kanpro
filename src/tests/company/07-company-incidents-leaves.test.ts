import { describe, test, expect, vi } from "vitest";
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  deleteIncidentSchema,
} from "@/modules/company/schemas/incidents.schema";
import {
  respondToLeaveRequestSchema,
  createCompanyLeaveSchema,
} from "@/modules/company/schemas/leaves.schema";
import {
  CompanyIncidentsService,
  type IncidentRow,
} from "@/modules/company/services/company-incidents";
import {
  CompanyLeavesService,
  type CompanyLeaveRow,
} from "@/modules/company/services/company-leaves";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Fase 16: Módulos de Incidencias y Permisos - Patrón Schema -> Handler -> Service", () => {
  describe("1. Validación de Esquemas Zod de Incidencias (incidents.schema.ts)", () => {
    test("createIncidentSchema: Acepta incidencias con datos completos y evidencias", () => {
      const validPayload = {
        employeeId: "emp-100",
        employeeName: "Ana Laura Torres",
        jobTitle: "Cocinera B",
        department: "Alimentos y Bebidas",
        category: "accidente" as const,
        title: "Quemadura de primer grado en antebrazo",
        description: "Se atendió en enfermería interna y se canalizó a valoración IMSS.",
        incidentDate: "2026-10-01",
        severity: "media" as const,
        responsibleSupervisor: "Chef Ejecutivo",
        evidenceUrl: "https://storage.kanpro.mx/evidencias/accidente-01.jpg",
        evidenceFileName: "accidente-01.jpg",
        evidenceType: "foto" as const,
      };

      const result = createIncidentSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test("createIncidentSchema: Rechaza incidencias sin título o descripción", () => {
      const invalid = {
        employeeName: "Carlos Vega",
        category: "falta_injustificada" as const,
        title: "",
        description: "",
      };

      const result = createIncidentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test("updateIncidentStatusSchema: Valida estatus permitidos y rechaza inválidos", () => {
      const valid = {
        incidentId: "inc-1",
        status: "resuelto" as const,
        resolutionNotes: "Acuerdo firmado entre ambas partes.",
      };
      expect(updateIncidentStatusSchema.safeParse(valid).success).toBe(true);

      const invalidStatus = {
        incidentId: "inc-1",
        status: "archivado_no_permitido",
      };
      expect(updateIncidentStatusSchema.safeParse(invalidStatus).success).toBe(false);
    });

    test("deleteIncidentSchema: Valida ID no vacío", () => {
      expect(deleteIncidentSchema.safeParse({ incidentId: "inc-1" }).success).toBe(true);
      expect(deleteIncidentSchema.safeParse({ incidentId: "" }).success).toBe(false);
    });
  });

  describe("2. Validación de Esquemas Zod de Permisos (leaves.schema.ts)", () => {
    test("respondToLeaveRequestSchema: Acepta aprobación y rechazo con motivo", () => {
      const approve = {
        requestId: "leave-1",
        decision: "aprobada" as const,
      };
      expect(respondToLeaveRequestSchema.safeParse(approve).success).toBe(true);

      const reject = {
        requestId: "leave-1",
        decision: "rechazada" as const,
        rejectionReason: "Temporada alta, no es posible cubrir el turno.",
      };
      expect(respondToLeaveRequestSchema.safeParse(reject).success).toBe(true);
    });

    test("createCompanyLeaveSchema: Valida fechas YYYY-MM-DD y tipo de permiso", () => {
      const valid = {
        employeeId: "emp-1",
        requestType: "vacaciones" as const,
        startDate: "2026-10-05",
        endDate: "2026-10-10",
        reason: "Vacaciones anuales LFT",
      };
      expect(createCompanyLeaveSchema.safeParse(valid).success).toBe(true);

      const invalidDate = {
        ...valid,
        startDate: "05/10/2026",
      };
      expect(createCompanyLeaveSchema.safeParse(invalidDate).success).toBe(false);
    });
  });

  describe("3. CompanyIncidentsService (Lógica de Negocio y Multitenancy)", () => {
    function createMockSupabaseForIncidents(initialState?: {
      employees?: Array<{
        id: string;
        company_id: string;
        full_name: string;
        job_title?: string | null;
        department?: string | null;
        avatar_url?: string | null;
      }>;
      incidents?: IncidentRow[];
    }) {
      const employees = [...(initialState?.employees || [])];
      const incidents = [...(initialState?.incidents || [])];

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
                  })),
                })),
              })),
            };
          }

          if (table === "company_incidents") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  order: vi.fn(() => ({
                    order: vi.fn(async () => {
                      const found = incidents.filter(
                        (i) => (i as Record<string, unknown>)[fieldA] === valA
                      );
                      return { data: found, error: null };
                    }),
                  })),
                })),
              })),
              insert: vi.fn((payload: Database["public"]["Tables"]["company_incidents"]["Insert"]) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const row: IncidentRow = {
                      ...payload,
                      id: `inc-${Date.now()}`,
                      incident_date: payload.incident_date || new Date().toISOString().split("T")[0],
                      severity: payload.severity || "media",
                      status: payload.status || "pendiente",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      category_label: payload.category_label || null,
                      department: payload.department || null,
                      employee_id: payload.employee_id || null,
                      evidence_file_name: payload.evidence_file_name || null,
                      evidence_type: payload.evidence_type || null,
                      evidence_url: payload.evidence_url || null,
                      job_title: payload.job_title || null,
                      resolution_notes: null,
                      responsible_supervisor: payload.responsible_supervisor || null,
                    };
                    incidents.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              update: vi.fn((updateData: Database["public"]["Tables"]["company_incidents"]["Update"]) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    select: vi.fn(() => ({
                      single: vi.fn(async () => {
                        const idx = incidents.findIndex(
                          (i) =>
                            (i as Record<string, unknown>)[fieldA] === valA &&
                            (i as Record<string, unknown>)[fieldB] === valB
                        );
                        if (idx === -1) return { data: null, error: { message: "Not found" } };
                        incidents[idx] = { ...incidents[idx], ...updateData };
                        return { data: incidents[idx], error: null };
                      }),
                    })),
                  })),
                })),
              })),
              delete: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn(async (fieldB: string, valB: string) => {
                    const idx = incidents.findIndex(
                      (i) =>
                        (i as Record<string, unknown>)[fieldA] === valA &&
                        (i as Record<string, unknown>)[fieldB] === valB
                    );
                    if (idx === -1) {
                      return { error: null, count: 0 };
                    }
                    incidents.splice(idx, 1);
                    return { error: null, count: 1 };
                  }),
                })),
              })),
            };
          }

          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, incidents };
    }

    test("createIncident: Registra incidencia vinculada a colaborador", async () => {
      const { client, incidents } = createMockSupabaseForIncidents({
        employees: [
          {
            id: "emp-1",
            company_id: "comp-A",
            full_name: "Valeria Gómez",
            job_title: "Recepcionista",
            department: "Recepción",
            avatar_url: "https://avatar.test/valeria.png",
          },
        ],
      });

      const service = new CompanyIncidentsService(client);
      const res = await service.createIncident("comp-A", {
        employeeId: "emp-1",
        employeeName: "Valeria Gómez",
        category: "reconocimiento",
        title: "Felicitación de huésped",
        description: "Excelente servicio en check-in.",
      });

      expect(res.id).toBeDefined();
      expect(res.employeeName).toBe("Valeria Gómez");
      expect(res.avatarUrl).toBe("https://avatar.test/valeria.png");
      expect(res.status).toBe("resuelto");
      expect(incidents.length).toBe(1);
    });

    test("updateIncidentStatus: Actualiza estatus y rechaza operaciones de otra empresa", async () => {
      const existing: IncidentRow = {
        id: "inc-100",
        company_id: "comp-A",
        employee_id: "emp-1",
        employee_name: "Valeria",
        job_title: "Recepcionista",
        department: "Recepción",
        category: "retardo",
        category_label: "Retardo de Turno",
        title: "Retardo 25 min",
        description: "Demora en transporte público",
        incident_date: "2026-10-01",
        severity: "baja",
        responsible_supervisor: "RH",
        evidence_url: null,
        evidence_file_name: null,
        evidence_type: null,
        status: "pendiente",
        resolution_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { client } = createMockSupabaseForIncidents({ incidents: [existing] });
      const service = new CompanyIncidentsService(client);

      const updated = await service.updateIncidentStatus("comp-A", {
        incidentId: "inc-100",
        status: "resuelto",
        resolutionNotes: "Justificado por bloqueo vial",
      });
      expect(updated.status).toBe("resuelto");
      expect(updated.resolution_notes).toBe("Justificado por bloqueo vial");

      // Intento de actualización por Empresa B debe fallar (Multitenancy)
      await expect(
        service.updateIncidentStatus("comp-B", {
          incidentId: "inc-100",
          status: "aprobado",
        })
      ).rejects.toThrow("Incidencia no encontrada o no autorizada.");
    });

    test("deleteIncident: Elimina incidencia y valida aislamiento multitenant", async () => {
      const existing: IncidentRow = {
        id: "inc-200",
        company_id: "comp-A",
        employee_id: null,
        employee_name: "Externo",
        job_title: null,
        department: null,
        category: "otro",
        category_label: "Otra Incidencia",
        title: "Paquete dañado",
        description: "Llegó roto el empaque de insumos.",
        incident_date: "2026-10-01",
        severity: "baja",
        responsible_supervisor: "Almacén",
        evidence_url: null,
        evidence_file_name: null,
        evidence_type: null,
        status: "pendiente",
        resolution_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { client, incidents } = createMockSupabaseForIncidents({ incidents: [existing] });
      const service = new CompanyIncidentsService(client);

      // Empresa B intenta eliminar incidencia de Empresa A
      await expect(service.deleteIncident("comp-B", "inc-200")).rejects.toThrow(
        "Incidencia no encontrada o no autorizada."
      );
      expect(incidents.length).toBe(1);

      // Empresa A la elimina exitosamente
      await service.deleteIncident("comp-A", "inc-200");
      expect(incidents.length).toBe(0);
    });
  });

  describe("4. CompanyLeavesService (Lógica de Negocio y Notificaciones)", () => {
    function createMockSupabaseForLeaves(initialState?: {
      employees?: Array<{
        id: string;
        company_id: string;
        full_name: string;
        email: string;
        employee_id?: string | null;
      }>;
      leaves?: CompanyLeaveRow[];
    }) {
      const employees = [...(initialState?.employees || [])];
      const leaves = [...(initialState?.leaves || [])];
      const notifications: Array<{ user_id: string; title: string; description: string; type: string }> = [];

      const client = {
        from: vi.fn((table: string) => {
          if (table === "company_employees") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    single: vi.fn(async () => {
                      const found = employees.find(
                        (e) =>
                          (e as Record<string, unknown>)[fieldA] === valA &&
                          (e as Record<string, unknown>)[fieldB] === valB
                      );
                      return found ? { data: found, error: null } : { data: null, error: { message: "Employee not found" } };
                    }),
                  })),
                  maybeSingle: vi.fn(async () => {
                    const found = employees.find((e) => (e as Record<string, unknown>)[fieldA] === valA);
                    return { data: found || null, error: null };
                  }),
                })),
              })),
            };
          }

          if (table === "company_leaves") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    single: vi.fn(async () => {
                      const found = leaves.find(
                        (l) =>
                          (l as Record<string, unknown>)[fieldA] === valA &&
                          (l as Record<string, unknown>)[fieldB] === valB
                      );
                      return found ? { data: found, error: null } : { data: null, error: { message: "Leave not found" } };
                    }),
                  })),
                })),
              })),
              insert: vi.fn((payload: Database["public"]["Tables"]["company_leaves"]["Insert"]) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const row: CompanyLeaveRow = {
                      ...payload,
                      id: `leave-${Date.now()}`,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      candidate_id: payload.candidate_id || null,
                      employee_id: payload.employee_id || null,
                      reason: payload.reason || null,
                      rejection_reason: payload.rejection_reason || null,
                      reviewed_at: payload.reviewed_at || null,
                      reviewed_by: payload.reviewed_by || null,
                      status: payload.status || "pendiente",
                    };
                    leaves.push(row);
                    return { data: row, error: null };
                  }),
                })),
              })),
              update: vi.fn((updateData: Database["public"]["Tables"]["company_leaves"]["Update"]) => ({
                eq: vi.fn((fieldA: string, valA: string) => ({
                  eq: vi.fn((fieldB: string, valB: string) => ({
                    select: vi.fn(() => ({
                      single: vi.fn(async () => {
                        const idx = leaves.findIndex(
                          (l) =>
                            (l as Record<string, unknown>)[fieldA] === valA &&
                            (l as Record<string, unknown>)[fieldB] === valB
                        );
                        if (idx === -1) return { data: null, error: { message: "Leave not found" } };
                        leaves[idx] = { ...leaves[idx], ...updateData };
                        return { data: leaves[idx], error: null };
                      }),
                    })),
                  })),
                })),
              })),
            };
          }

          if (table === "notifications") {
            return {
              insert: vi.fn(async (notif: { user_id: string; title: string; description: string; type: string }) => {
                notifications.push(notif);
                return { error: null };
              }),
            };
          }

          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      return { client, leaves, notifications };
    }

    test("createCompanyLeave: Calcula días laborables e inserta permiso auto-aprobado", async () => {
      const { client, leaves } = createMockSupabaseForLeaves({
        employees: [
          {
            id: "emp-10",
            company_id: "comp-A",
            full_name: "Roberto Díaz",
            email: "roberto@hotel.com",
            employee_id: "cand-user-10",
          },
        ],
      });

      const service = new CompanyLeavesService(client);
      const res = await service.createCompanyLeave("comp-A", {
        employeeId: "emp-10",
        requestType: "vacaciones",
        startDate: "2026-10-05", // Lunes
        endDate: "2026-10-09",   // Viernes (5 días hábiles)
        reason: "Descanso familiar",
      });

      expect(res.leaveId).toBeDefined();
      expect(res.workingDays).toBe(5);
      expect(leaves.length).toBe(1);
      expect(leaves[0].status).toBe("aprobada");
    });

    test("createCompanyLeave: Falla si el colaborador pertenece a otra empresa (Multitenant)", async () => {
      const { client } = createMockSupabaseForLeaves({
        employees: [
          {
            id: "emp-10",
            company_id: "comp-B",
            full_name: "Roberto Díaz",
            email: "roberto@hotel.com",
          },
        ],
      });

      const service = new CompanyLeavesService(client);
      await expect(
        service.createCompanyLeave("comp-A", {
          employeeId: "emp-10",
          requestType: "vacaciones",
          startDate: "2026-10-05",
          endDate: "2026-10-09",
        })
      ).rejects.toThrow("El colaborador no pertenece a tu plantilla.");
    });

    test("respondToLeaveRequest: Aprueba solicitud y envía notificación al colaborador", async () => {
      const existingLeave: CompanyLeaveRow = {
        id: "leave-300",
        company_id: "comp-A",
        employee_id: "emp-10",
        candidate_id: "user-cand-10",
        request_type: "paternidad",
        start_date: "2026-10-12",
        end_date: "2026-10-16",
        total_working_days: 5,
        reason: "Nacimiento de mi hijo",
        status: "pendiente",
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { client, leaves, notifications } = createMockSupabaseForLeaves({
        leaves: [existingLeave],
      });
      const service = new CompanyLeavesService(client);

      const res = await service.respondToLeaveRequest("comp-A", {
        requestId: "leave-300",
        decision: "aprobada",
      });

      expect(res.leave.status).toBe("aprobada");
      expect(leaves[0].status).toBe("aprobada");
      expect(notifications.length).toBe(1);
      expect(notifications[0].user_id).toBe("user-cand-10");
      expect(notifications[0].type).toBe("leave_approved");

      // Intento de responder a una solicitud de otra empresa debe fallar
      await expect(
        service.respondToLeaveRequest("comp-B", {
          requestId: "leave-300",
          decision: "rechazada",
        })
      ).rejects.toThrow("No se encontró la solicitud de vacaciones o no pertenece a tu empresa.");
    });
  });
});
