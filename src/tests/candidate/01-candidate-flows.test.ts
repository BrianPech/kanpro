import { describe, test, expect, vi } from "vitest";
import {
  signCandidateContractSchema,
} from "@/modules/candidate/schemas/contracts.schema";
import {
  submitCandidateLeaveRequestSchema,
  leaveRequestTypeSchema,
} from "@/modules/candidate/schemas/leaves.schema";
import {
  respondToInterviewSchema,
  interviewResponseActionSchema,
} from "@/modules/candidate/schemas/interviews.schema";
import {
  CandidateContractsService,
} from "@/modules/candidate/services/candidate-contracts";
import {
  CandidateLeavesService,
} from "@/modules/candidate/services/candidate-leaves";
import {
  CandidateInterviewsService,
} from "@/modules/candidate/services/candidate-interviews";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Flujos de Candidato: Contratos, Vacaciones/Permisos y Entrevistas (Schema -> Handler -> Service)", () => {
  // =========================================================================
  // 1. VALIDACIÓN DE ESQUEMAS ZOD
  // =========================================================================
  describe("1. Validación de Esquemas Zod", () => {
    describe("Contratos (contracts.schema.ts)", () => {
      test("signCandidateContractSchema: Valida entrada correcta con firma data URL", () => {
        const valid = {
          contractId: "contract-123",
          signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        };
        const parsed = signCandidateContractSchema.safeParse(valid);
        expect(parsed.success).toBe(true);
      });

      test("signCandidateContractSchema: Rechaza contrato con contractId vacío", () => {
        const invalid = {
          contractId: "",
          signatureData: "data:image/png;base64,valid",
        };
        const result = signCandidateContractSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });

      test("signCandidateContractSchema: Rechaza si no es un data URL de imagen", () => {
        const invalid = {
          contractId: "contract-123",
          signatureData: "texto-plano-no-data-url",
        };
        const result = signCandidateContractSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });
    });

    describe("Permisos y Vacaciones (leaves.schema.ts)", () => {
      test("leaveRequestTypeSchema: Acepta los tipos legales LFT y rechaza valores inválidos", () => {
        expect(leaveRequestTypeSchema.safeParse("vacaciones").success).toBe(true);
        expect(leaveRequestTypeSchema.safeParse("permiso_con_goce").success).toBe(true);
        expect(leaveRequestTypeSchema.safeParse("permiso_sin_goce").success).toBe(true);
        expect(leaveRequestTypeSchema.safeParse("paternidad").success).toBe(true);
        expect(leaveRequestTypeSchema.safeParse("maternidad").success).toBe(true);
        expect(leaveRequestTypeSchema.safeParse("luto").success).toBe(true);
        expect(leaveRequestTypeSchema.safeParse("invalido_xyz").success).toBe(false);
      });

      test("submitCandidateLeaveRequestSchema: Valida rango válido de fechas", () => {
        const valid = {
          companyId: "comp-1",
          requestType: "vacaciones",
          startDate: "2026-10-10",
          endDate: "2026-10-15",
          reason: "Vacaciones familiares",
        };
        const parsed = submitCandidateLeaveRequestSchema.safeParse(valid);
        expect(parsed.success).toBe(true);
      });

      test("submitCandidateLeaveRequestSchema: Rechaza si endDate es anterior a startDate", () => {
        const invalid = {
          companyId: "comp-1",
          requestType: "vacaciones",
          startDate: "2026-10-15",
          endDate: "2026-10-10",
        };
        const result = submitCandidateLeaveRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("posterior o igual");
        }
      });

      test("submitCandidateLeaveRequestSchema: Rechaza formatos de fecha que no sean YYYY-MM-DD", () => {
        const invalid = {
          companyId: "comp-1",
          requestType: "vacaciones",
          startDate: "10/10/2026",
          endDate: "15/10/2026",
        };
        const result = submitCandidateLeaveRequestSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });
    });

    describe("Entrevistas (interviews.schema.ts)", () => {
      test("interviewResponseActionSchema: Valida 'confirm' y 'reschedule'", () => {
        expect(interviewResponseActionSchema.safeParse("confirm").success).toBe(true);
        expect(interviewResponseActionSchema.safeParse("reschedule").success).toBe(true);
        expect(interviewResponseActionSchema.safeParse("cancelar").success).toBe(false);
      });

      test("respondToInterviewSchema: Acepta confirmación básica", () => {
        const valid = {
          applicationId: "app-100",
          response: "confirm",
        };
        const parsed = respondToInterviewSchema.safeParse(valid);
        expect(parsed.success).toBe(true);
      });

      test("respondToInterviewSchema: Acepta reagendamiento con fechas y notas", () => {
        const valid = {
          applicationId: "app-100",
          response: "reschedule",
          proposedDate: "2026-10-12",
          proposedTime: "11:30",
          candidateNotes: "Conflicto de horario con examen profesional.",
        };
        const parsed = respondToInterviewSchema.safeParse(valid);
        expect(parsed.success).toBe(true);
      });

      test("respondToInterviewSchema: Rechaza si applicationId está vacío", () => {
        const invalid = {
          applicationId: "",
          response: "confirm",
        };
        const result = respondToInterviewSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });
    });
  });

  // =========================================================================
  // 2. SERVICIO CANDIDATE CONTRACTS (candidate-contracts.ts)
  // =========================================================================
  describe("2. Servicio CandidateContractsService", () => {
    test("getCandidateContracts: Retorna contratos mapeados y cuenta firmas pendientes", async () => {
      const mockContracts = [
        {
          id: "cont-1",
          folio: "KPR-CTR-2026-0001",
          company_id: "comp-1",
          candidate_id: "user-cand-1",
          employee_id: null,
          application_id: "app-1",
          job_title: "Ingeniero de Software",
          department: "Tecnología",
          contract_type: "indeterminado",
          template_type: "tiempo_indeterminado",
          start_date: "2026-01-01",
          end_date: null,
          salary: 45000,
          payment_frequency: "quincenal",
          company_signed: true,
          company_signature_url: "data:image/png;base64,comp-sig",
          employee_signed: false,
          employee_signature_url: null,
          status: "pendiente_firma",
          created_at: "2026-01-01T00:00:00Z",
          company: {
            id: "comp-1",
            company_name: "Tech Corp",
            legal_name: "Tech Corp SA de CV",
            rfc: "TEC200101XYZ",
            fiscal_address: "Av Reforma 100",
            legal_rep_name: "Director HR",
            logo_url: "https://logo.png",
          },
          application: {
            id: "app-1",
            status: "contratado",
            vacancies: {
              id: "vac-1",
              title: "Senior Fullstack Engineer",
            },
          },
        },
      ];

      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "company_employees") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: null, error: null })),
                })),
              })),
            };
          }
          if (table === "company_contracts") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(async () => ({
                    data: mockContracts,
                    error: null,
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await CandidateContractsService.getCandidateContracts(
        supabaseMock,
        "user-cand-1"
      );

      expect(result.contracts).toHaveLength(1);
      expect(result.pendingSignatureCount).toBe(1);
      expect(result.contracts[0].companyName).toBe("Tech Corp");
      expect(result.contracts[0].jobTitle).toBe("Ingeniero de Software");
    });

    test("signContract: Rechaza si el contrato no pertenece al usuario", async () => {
      const supabaseMock = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  id: "cont-2",
                  folio: "KPR-CTR-002",
                  candidate_id: "other-user-999",
                  employee_id: null,
                  company_signed: true,
                  employee_signed: false,
                },
                error: null,
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient<Database>;

      await expect(
        CandidateContractsService.signContract(supabaseMock, "user-cand-1", {
          contractId: "cont-2",
          signatureData: "data:image/png;base64,mysig",
        })
      ).rejects.toThrow("No tienes permisos para firmar este contrato.");
    });

    test("signContract: Idempotencia si el contrato ya fue firmado por el colaborador", async () => {
      const supabaseMock = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  id: "cont-3",
                  folio: "KPR-CTR-003",
                  candidate_id: "user-cand-1",
                  employee_signed: true,
                  status: "vigente",
                },
                error: null,
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient<Database>;

      const res = await CandidateContractsService.signContract(
        supabaseMock,
        "user-cand-1",
        {
          contractId: "cont-3",
          signatureData: "data:image/png;base64,mysig",
        }
      );

      expect(res.success).toBe(true);
      expect(res.message).toContain("ya se encontraba firmado");
      expect(res.folio).toBe("KPR-CTR-003");
    });

    test("signContract: Firma exitosamente, actualiza estado a 'vigente' y envía notificación", async () => {
      const updateFn = vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      }));
      const insertNotificationFn = vi.fn(async () => ({ error: null }));

      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "company_contracts") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: "cont-4",
                      folio: "KPR-CTR-004",
                      company_id: "comp-1",
                      candidate_id: "user-cand-1",
                      employee_id: null,
                      job_title: "Desarrollador",
                      company_signed: true,
                      employee_signed: false,
                      status: "pendiente_firma",
                    },
                    error: null,
                  })),
                })),
              })),
              update: updateFn,
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { full_name: "Juan Pérez" },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === "notifications") {
            return {
              insert: insertNotificationFn,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const res = await CandidateContractsService.signContract(
        supabaseMock,
        "user-cand-1",
        {
          contractId: "cont-4",
          signatureData: "data:image/png;base64,valid-signature",
        }
      );

      expect(res.success).toBe(true);
      expect(res.folio).toBe("KPR-CTR-004");
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          employee_signed: true,
          status: "vigente",
        })
      );
      expect(insertNotificationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "comp-1",
          type: "contract_signed",
        })
      );
    });
  });

  // =========================================================================
  // 3. SERVICIO CANDIDATE LEAVES (candidate-leaves.ts)
  // =========================================================================
  describe("3. Servicio CandidateLeavesService", () => {
    test("submitLeaveRequest: Rechaza si no hay días laborables en el rango", async () => {
      const supabaseMock = {} as SupabaseClient<Database>;

      // Domingo a domingo (solo 1 domingo -> 0 días hábiles en LFT)
      await expect(
        CandidateLeavesService.submitLeaveRequest(supabaseMock, "user-cand-1", {
          companyId: "comp-1",
          requestType: "vacaciones",
          startDate: "2026-10-11", // Domingo
          endDate: "2026-10-11",   // Domingo
          reason: "Descanso",
        })
      ).rejects.toThrow("no contiene días laborales hábiles");
    });

    test("submitLeaveRequest: Rechaza si excede el saldo de vacaciones LFT", async () => {
      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "company_contracts") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    neq: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => ({
                        // Ingresó hace menos de 1 año -> Saldo LFT = 12 días
                        data: { start_date: "2026-01-01" },
                        error: null,
                      })),
                    })),
                  })),
                })),
              })),
            };
          }
          if (table === "company_leaves") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => ({
                      or: vi.fn(async () => ({
                        // Ya tomó 10 días
                        data: [{ total_working_days: 10, status: "aprobada" }],
                        error: null,
                      })),
                    })),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      // Intenta pedir 5 días cuando le quedan 2 (12 - 10)
      await expect(
        CandidateLeavesService.submitLeaveRequest(supabaseMock, "user-cand-1", {
          companyId: "comp-1",
          requestType: "vacaciones",
          startDate: "2026-10-12", // Lunes
          endDate: "2026-10-16",   // Viernes (5 días laborales)
          reason: "Viaje",
        })
      ).rejects.toThrow("Saldo insuficiente");
    });

    test("submitLeaveRequest: Permite solicitud válida, registra y notifica a la empresa", async () => {
      const insertLeaveFn = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: "leave-req-1" },
            error: null,
          })),
        })),
      }));

      const insertNotificationFn = vi.fn(async () => ({ error: null }));

      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "company_contracts") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    neq: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => ({
                        data: { start_date: "2024-01-01" }, // >2 años de antigüedad -> 14 días
                        error: null,
                      })),
                    })),
                  })),
                })),
              })),
            };
          }
          if (table === "company_leaves") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => ({
                      or: vi.fn(async () => ({
                        data: [], // 0 días tomados
                        error: null,
                      })),
                    })),
                  })),
                })),
              })),
              insert: insertLeaveFn,
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { full_name: "María Gómez" },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === "notifications") {
            return {
              insert: insertNotificationFn,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const res = await CandidateLeavesService.submitLeaveRequest(
        supabaseMock,
        "user-cand-1",
        {
          companyId: "comp-1",
          requestType: "vacaciones",
          startDate: "2026-10-12", // Lunes
          endDate: "2026-10-14",   // Miércoles (3 días)
          reason: "Descanso familiar",
        }
      );

      expect(res.success).toBe(true);
      expect(res.leaveId).toBe("leave-req-1");
      expect(insertLeaveFn).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: "comp-1",
          request_type: "vacaciones",
          total_working_days: 3,
          status: "pendiente",
        })
      );
      expect(insertNotificationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "comp-1",
          type: "leave_requested",
        })
      );
    });

    test("submitLeaveRequest: Permisos especiales (paternidad, luto) no restan del saldo de vacaciones", async () => {
      const insertLeaveFn = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: "leave-req-2" },
            error: null,
          })),
        })),
      }));

      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "company_leaves") {
            return {
              insert: insertLeaveFn,
            };
          }
          if (table === "profiles" || table === "notifications") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: { full_name: "Colaborador" }, error: null })),
                })),
              })),
              insert: vi.fn(async () => ({ error: null })),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const res = await CandidateLeavesService.submitLeaveRequest(
        supabaseMock,
        "user-cand-1",
        {
          companyId: "comp-1",
          requestType: "paternidad",
          startDate: "2026-10-12",
          endDate: "2026-10-16",
          reason: "Nacimiento de hijo",
        }
      );

      expect(res.success).toBe(true);
      expect(res.leaveId).toBe("leave-req-2");
    });
  });

  // =========================================================================
  // 4. SERVICIO CANDIDATE INTERVIEWS (candidate-interviews.ts)
  // =========================================================================
  describe("4. Servicio CandidateInterviewsService", () => {
    test("respondToInterview: Rechaza si la postulación no pertenece al candidato", async () => {
      const supabaseMock = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  id: "app-200",
                  candidate_id: "other-user-999",
                },
                error: null,
              })),
            })),
          })),
        })),
      } as unknown as SupabaseClient<Database>;

      await expect(
        CandidateInterviewsService.respondToInterview(supabaseMock, "user-cand-1", {
          applicationId: "app-200",
          response: "confirm",
        })
      ).rejects.toThrow("No tienes permisos para responder sobre esta postulación.");
    });

    test("respondToInterview: Confirma entrevista, actualiza estado a 'confirmed' y notifica a la empresa", async () => {
      const updateFn = vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      }));
      const insertNotificationFn = vi.fn(async () => ({ error: null }));

      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "applications") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: "app-201",
                      candidate_id: "user-cand-1",
                      status: "interview",
                      interview_status: "scheduled",
                      interview_details: {
                        date: "2026-10-20",
                        time: "10:00",
                        meetingLink: "https://meet.google.com/xyz",
                      },
                      vacancy: {
                        id: "vac-1",
                        title: "Diseñador UI/UX",
                        company_id: "comp-1",
                      },
                    },
                    error: null,
                  })),
                })),
              })),
              update: updateFn,
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { full_name: "Laura Martínez" },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === "notifications") {
            return {
              insert: insertNotificationFn,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const res = await CandidateInterviewsService.respondToInterview(
        supabaseMock,
        "user-cand-1",
        {
          applicationId: "app-201",
          response: "confirm",
        }
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe("confirmed");
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          interview_status: "confirmed",
        })
      );
      expect(insertNotificationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "comp-1",
          type: "interview_confirmed",
        })
      );
    });

    test("respondToInterview: Reagenda entrevista con fecha sugerida y notas", async () => {
      const updateFn = vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      }));
      const insertNotificationFn = vi.fn(async () => ({ error: null }));

      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "applications") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: "app-202",
                      candidate_id: "user-cand-1",
                      status: "interview",
                      interview_status: "scheduled",
                      interview_details: {},
                      vacancy: {
                        id: "vac-2",
                        title: "DevOps Engineer",
                        company_id: "comp-2",
                      },
                    },
                    error: null,
                  })),
                })),
              })),
              update: updateFn,
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { full_name: "Carlos Sánchez" },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === "notifications") {
            return {
              insert: insertNotificationFn,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const res = await CandidateInterviewsService.respondToInterview(
        supabaseMock,
        "user-cand-1",
        {
          applicationId: "app-202",
          response: "reschedule",
          proposedDate: "2026-10-25",
          proposedTime: "16:00",
          candidateNotes: "Tengo cita médica en la fecha original.",
        }
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe("rescheduled");
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          interview_status: "rescheduled",
        })
      );
      expect(insertNotificationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "comp-2",
          type: "interview_rescheduled",
        })
      );
    });
  });
});
