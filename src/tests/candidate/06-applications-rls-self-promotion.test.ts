import { describe, test, expect, vi } from "vitest";
import { CandidateInterviewsService } from "@/modules/candidate/services/candidate-interviews";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Seguridad RLS y Prevención de Auto-Promoción en Applications", () => {
  describe("1. CandidateInterviewsService: Flujo seguro de Entrevistas vía RPC", () => {
    test("Invocación prioritaria del RPC respond_candidate_interview para aislar mutaciones", async () => {
      const rpcFn = vi.fn(async () => ({
        data: { success: true, application_id: "app-101", interview_status: "confirmed" },
        error: null,
      }));

      const supabaseMock = {
        from: vi.fn((table: string) => {
          if (table === "applications") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: {
                      id: "app-101",
                      candidate_id: "cand-uuid-1",
                      status: "Entrevista",
                      interview_status: "pending",
                      interview_details: { date: "2026-11-15", time: "10:00" },
                      vacancy: { id: "vac-1", title: "Ingeniero Frontend", company_id: "comp-1" },
                    },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { full_name: "Candidato Seguro" },
                    error: null,
                  })),
                })),
              })),
            };
          }
          if (table === "notifications") {
            return {
              insert: vi.fn(async () => ({ error: null })),
            };
          }
          return {};
        }),
        rpc: rpcFn,
      } as unknown as SupabaseClient<Database>;

      const result = await CandidateInterviewsService.respondToInterview(
        supabaseMock,
        "cand-uuid-1",
        {
          applicationId: "app-101",
          response: "confirm",
          candidateNotes: "Confirmado con gusto.",
        }
      );

      expect(result.success).toBe(true);
      expect(rpcFn).toHaveBeenCalledTimes(1);
      expect(rpcFn).toHaveBeenCalledWith("respond_candidate_interview", expect.objectContaining({
        p_application_id: "app-101",
        p_status: "confirmed",
      }));
    });
  });

  describe("2. Reglas de Validación RLS para Inserción y Modificación de Postulaciones", () => {
    // Simulador de validación de políticas RLS y Triggers definidos en la migración
    const evaluateApplicationInsertPolicy = (record: {
      candidate_id: string;
      session_uid: string;
      status?: string | null;
      rating?: number | null;
      hired_at?: string | null;
    }) => {
      // WITH CHECK (candidate_id = auth.uid() AND (status IS NULL OR status IN ('Pendiente', 'applied')) AND hired_at IS NULL AND rating IS NULL)
      if (record.candidate_id !== record.session_uid) {
        return { allowed: false, error: "Violación RLS: candidate_id no coincide con auth.uid()" };
      }
      const allowedInitialStatuses = ["Pendiente", "applied", null, undefined];
      if (!allowedInitialStatuses.includes(record.status)) {
        return { allowed: false, error: "Violación RLS: Estado inicial no autorizado" };
      }
      if (record.hired_at != null) {
        return { allowed: false, error: "Violación RLS: Inyección de hired_at denegada" };
      }
      if (record.rating != null) {
        return { allowed: false, error: "Violación RLS: Inyección de rating denegada" };
      }
      return { allowed: true };
    };

    const evaluateApplicationTriggerPolicy = (
      oldRecord: { candidate_id: string; status: string; rating: number | null; hired_at: string | null },
      newRecord: { candidate_id: string; status: string; rating: number | null; hired_at: string | null },
      sessionUid: string
    ) => {
      // Trigger: prevent_candidate_application_self_promotion
      if (sessionUid === oldRecord.candidate_id) {
        if (
          newRecord.status !== oldRecord.status ||
          newRecord.rating !== oldRecord.rating ||
          newRecord.hired_at !== oldRecord.hired_at
        ) {
          throw new Error("Operación denegada: un candidato no tiene autorización para modificar el estado o calificación de su postulación.");
        }
      }
      return true;
    };

    const evaluateApplicationDeletePolicy = (
      record: { candidate_id: string; status: string },
      sessionUid: string
    ) => {
      // USING (candidate_id = auth.uid() AND status IN ('Pendiente', 'applied', 'Descartado', 'rejected', 'withdrawn'))
      if (record.candidate_id !== sessionUid) return false;
      const withdrawableStatuses = ["Pendiente", "applied", "Descartado", "rejected", "withdrawn"];
      return withdrawableStatuses.includes(record.status);
    };

    test("Vector Ataque 1: Candidato intenta auto-promoverse a 'Contratado' mediante update", () => {
      const oldApp = {
        candidate_id: "cand-123",
        status: "Pendiente",
        rating: null,
        hired_at: null,
      };
      const maliciousUpdate = {
        candidate_id: "cand-123",
        status: "Contratado",
        rating: 5,
        hired_at: new Date().toISOString(),
      };

      expect(() => {
        evaluateApplicationTriggerPolicy(oldApp, maliciousUpdate, "cand-123");
      }).toThrow(/un candidato no tiene autorización para modificar el estado/);
    });

    test("Vector Ataque 2: Candidato intenta auto-calificarse con rating de 5 estrellas", () => {
      const oldApp = {
        candidate_id: "cand-123",
        status: "Pendiente",
        rating: null,
        hired_at: null,
      };
      const maliciousUpdate = {
        ...oldApp,
        rating: 5,
      };

      expect(() => {
        evaluateApplicationTriggerPolicy(oldApp, maliciousUpdate, "cand-123");
      }).toThrow(/un candidato no tiene autorización para modificar el estado/);
    });

    test("Vector Ataque 3: Candidato intenta insertar postulación inicial en estado 'Contratado'", () => {
      const checkResult = evaluateApplicationInsertPolicy({
        candidate_id: "cand-123",
        session_uid: "cand-123",
        status: "Contratado",
      });

      expect(checkResult.allowed).toBe(false);
      expect(checkResult.error).toContain("Estado inicial no autorizado");
    });

    test("Vector Ataque 4: Candidato intenta insertar postulación precargada con rating o hired_at", () => {
      const checkResult = evaluateApplicationInsertPolicy({
        candidate_id: "cand-123",
        session_uid: "cand-123",
        status: "Pendiente",
        rating: 5,
        hired_at: new Date().toISOString(),
      });

      expect(checkResult.allowed).toBe(false);
    });

    test("Flujo Legítimo 1: Candidato crea postulación válida en estado 'Pendiente'", () => {
      const checkResult = evaluateApplicationInsertPolicy({
        candidate_id: "cand-123",
        session_uid: "cand-123",
        status: "Pendiente",
      });

      expect(checkResult.allowed).toBe(true);
    });

    test("Flujo Legítimo 2: Candidato retira postulación que sigue en estado 'Pendiente'", () => {
      const canWithdraw = evaluateApplicationDeletePolicy(
        { candidate_id: "cand-123", status: "Pendiente" },
        "cand-123"
      );

      expect(canWithdraw).toBe(true);
    });

    test("Restricción Legítima: Candidato NO puede retirar ni eliminar una postulación ya 'Contratada'", () => {
      const canWithdraw = evaluateApplicationDeletePolicy(
        { candidate_id: "cand-123", status: "Contratado" },
        "cand-123"
      );

      expect(canWithdraw).toBe(false);
    });
  });
});
