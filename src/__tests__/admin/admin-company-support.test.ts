import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock Next.js internal modules
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

/**
 * ============================================================================
 * K'anPro Admin Company Support & Settings QA Test Suite
 * ============================================================================
 * 
 * Tests:
 * 1. getCompanyFullDiagnostic loads company profile, vacancies, employees, invitations, attendance
 * 2. resendEmployeeInvitation extends expiry and requires admin auth
 * 3. cancelEmployeeInvitation cancels invitation and requires admin auth
 * 4. getDashboardSession respects impersonation cookie when caller is admin
 * 5. saveSystemSettings rejects non-admin callers and saves settings for authenticated admin
 */

describe("Admin Company Support & System Settings Test Suite", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ==========================================================================
  // Test 1: getCompanyFullDiagnostic
  // ==========================================================================
  describe("Test 1: getCompanyFullDiagnostic", () => {
    test("rejects when caller is unauthenticated or non-admin", async () => {
      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "candidate-user-1" } } }),
          },
          from: (table: string) => ({
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "candidate" } }),
              }),
            }),
          }),
        }),
      }));

      const { getCompanyFullDiagnostic } = await import(
        "@/app/(dashboard)/dashboard/admin/support/actions"
      );

      await expect(getCompanyFullDiagnostic("company-123")).rejects.toThrow(
        /Acceso denegado: Se requieren permisos de administrador/i
      );
    });

    test("loads company profile, vacancies, employees, invitations, and attendance for authenticated admin", async () => {
      const mockCompanyId = "comp-alpha-123";

      const mockCompanyProfile = {
        id: mockCompanyId,
        company_name: "Tech Solutions México",
        industry: "Tecnología",
        credits_available: 25,
      };

      const mockVacancies = [
        { id: "vac-1", company_id: mockCompanyId, title: "Desarrollador Frontend", status: "published" },
        { id: "vac-2", company_id: mockCompanyId, title: "Líder de Proyecto", status: "draft" },
      ];

      const mockEmployees = [
        { id: "emp-1", company_id: mockCompanyId, full_name: "Mariana Silva", job_title: "Ingeniera de Software" },
      ];

      const mockInvitations = [
        { id: "inv-1", company_id: mockCompanyId, full_name: "Roberto Méndez", email: "roberto@tech.mx", status: "sent" },
      ];

      const mockAttendance = [
        { id: "att-1", company_id: mockCompanyId, employee_id: "emp-1", status: "present", check_in_time: "08:55:00" },
      ];

      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-master-id" } } }),
          },
          from: (table: string) => {
            if (table === "profiles") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
                  }),
                }),
              };
            }
            if (table === "company_profiles") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: mockCompanyProfile, error: null }),
                  }),
                }),
              };
            }
            if (table === "vacancies") {
              return {
                select: () => ({
                  eq: () => Promise.resolve({ data: mockVacancies, error: null }),
                }),
              };
            }
            if (table === "company_employees") {
              return {
                select: () => ({
                  eq: () => Promise.resolve({ data: mockEmployees, error: null }),
                }),
              };
            }
            if (table === "employee_invitations") {
              return {
                select: () => ({
                  eq: () => Promise.resolve({ data: mockInvitations, error: null }),
                }),
              };
            }
            if (table === "company_attendance") {
              return {
                select: () => ({
                  eq: () => Promise.resolve({ data: mockAttendance, error: null }),
                }),
              };
            }
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            };
          },
        }),
      }));

      const { getCompanyFullDiagnostic } = await import(
        "@/app/(dashboard)/dashboard/admin/support/actions"
      );

      const diagnostic = await getCompanyFullDiagnostic(mockCompanyId);

      expect(diagnostic.company).toBeDefined();
      expect(diagnostic.company?.company_name).toBe("Tech Solutions México");
      expect(diagnostic.vacancies).toHaveLength(2);
      expect(diagnostic.vacancies[0].title).toBe("Desarrollador Frontend");
      expect(diagnostic.employees).toHaveLength(1);
      expect(diagnostic.employees[0].full_name).toBe("Mariana Silva");
      expect(diagnostic.invitations).toHaveLength(1);
      expect(diagnostic.invitations[0].email).toBe("roberto@tech.mx");
      expect(diagnostic.attendance).toHaveLength(1);
      expect(diagnostic.attendance[0].check_in_time).toBe("08:55:00");
    });
  });

  // ==========================================================================
  // Test 2: resendEmployeeInvitation
  // ==========================================================================
  describe("Test 2: resendEmployeeInvitation", () => {
    test("rejects when non-admin attempts to resend invitation", async () => {
      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "company-user-1" } } }),
          },
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "company" } }),
              }),
            }),
          }),
        }),
      }));

      const { resendEmployeeInvitation } = await import(
        "@/app/(dashboard)/dashboard/admin/support/actions"
      );

      await expect(resendEmployeeInvitation("invitation-123")).rejects.toThrow(
        /Acceso denegado: Se requieren permisos de administrador/i
      );
    });

    test("extends expiry date, updates token and notifies company for authenticated admin", async () => {
      const invitationId = "invitation-valid-999";
      let updatedPayload: Record<string, any> = {};
      let notificationPayload: Record<string, any> = {};

      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-agent-id" } } }),
          },
          from: (table: string) => {
            if (table === "profiles") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
                  }),
                }),
              };
            }
            if (table === "employee_invitations") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: {
                          id: invitationId,
                          company_id: "company-owner-456",
                          email: "carlos@talent.com",
                          full_name: "Carlos Colaborador",
                        },
                        error: null,
                      }),
                  }),
                }),
                update: (payload: Record<string, any>) => {
                  updatedPayload = payload;
                  return {
                    eq: () => Promise.resolve({ error: null }),
                  };
                },
              };
            }
            if (table === "notifications") {
              return {
                insert: (payload: Record<string, any>) => {
                  notificationPayload = payload;
                  return Promise.resolve({ error: null });
                },
              };
            }
            return {};
          },
        }),
      }));

      const { resendEmployeeInvitation } = await import(
        "@/app/(dashboard)/dashboard/admin/support/actions"
      );

      const beforeTime = Date.now() + 6 * 24 * 60 * 60 * 1000;
      const result = await resendEmployeeInvitation(invitationId);
      const afterTime = Date.now() + 8 * 24 * 60 * 60 * 1000;

      expect(result.success).toBe(true);
      expect(result.rawToken).toBeDefined();
      expect(typeof result.rawToken).toBe("string");

      const expiryTimestamp = new Date(result.expiresAt).getTime();
      expect(expiryTimestamp).toBeGreaterThan(beforeTime);
      expect(expiryTimestamp).toBeLessThan(afterTime);

      // Verify DB update parameters
      expect(updatedPayload.status).toBe("sent");
      expect(updatedPayload.token_hash).toBeDefined();
      expect(updatedPayload.expires_at).toBe(result.expiresAt);

      // Verify notification sent to company
      expect(notificationPayload.user_id).toBe("company-owner-456");
      expect(notificationPayload.title).toContain("Invitación de colaborador extendida");
    });
  });

  // ==========================================================================
  // Test 3: cancelEmployeeInvitation
  // ==========================================================================
  describe("Test 3: cancelEmployeeInvitation", () => {
    test("rejects when non-admin attempts to cancel invitation", async () => {
      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "unauth-user" } } }),
          },
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "candidate" } }),
              }),
            }),
          }),
        }),
      }));

      const { cancelEmployeeInvitation } = await import(
        "@/app/(dashboard)/dashboard/admin/support/actions"
      );

      await expect(cancelEmployeeInvitation("inv-to-cancel")).rejects.toThrow(
        /Acceso denegado: Se requieren permisos de administrador/i
      );
    });

    test("cancels invitation and marks employee record terminated for authenticated admin", async () => {
      const invitationId = "inv-cancel-123";
      const employeeId = "emp-placeholder-456";

      let invitationUpdatedStatus = "";
      let employeeUpdatedStatus = "";
      let notificationTitle = "";

      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-super" } } }),
          },
          from: (table: string) => {
            if (table === "profiles") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
                  }),
                }),
              };
            }
            if (table === "employee_invitations") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: {
                          id: invitationId,
                          company_id: "comp-target-789",
                          employee_id: employeeId,
                          full_name: "Persona Cancelada",
                          email: "cancelado@empresa.com",
                        },
                        error: null,
                      }),
                  }),
                }),
                update: (payload: { status: string }) => {
                  invitationUpdatedStatus = payload.status;
                  return {
                    eq: () => Promise.resolve({ error: null }),
                  };
                },
              };
            }
            if (table === "company_employees") {
              return {
                update: (payload: { status: string }) => {
                  employeeUpdatedStatus = payload.status;
                  return {
                    eq: () => Promise.resolve({ error: null }),
                  };
                },
              };
            }
            if (table === "notifications") {
              return {
                insert: (payload: { title: string }) => {
                  notificationTitle = payload.title;
                  return Promise.resolve({ error: null });
                },
              };
            }
            return {};
          },
        }),
      }));

      const { cancelEmployeeInvitation } = await import(
        "@/app/(dashboard)/dashboard/admin/support/actions"
      );

      const res = await cancelEmployeeInvitation(invitationId);

      expect(res.success).toBe(true);
      expect(invitationUpdatedStatus).toBe("cancelled");
      expect(employeeUpdatedStatus).toBe("terminated");
      expect(notificationTitle).toContain("Invitación cancelada");
    });
  });

  // ==========================================================================
  // Test 4: getDashboardSession respects impersonation cookie when caller is admin
  // ==========================================================================
  describe("Test 4: getDashboardSession impersonation", () => {
    test("respects impersonation cookie when caller is authenticated admin", async () => {
      const adminUserId = "admin-executor-99";
      const impersonatedCompanyId = "comp-impersonated-88";

      // Mock cookies with impersonation data
      vi.doMock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue({
          get: vi.fn((key: string) => {
            if (key === "kanpro_impersonate_user_id") return { value: impersonatedCompanyId };
            if (key === "kanpro_impersonate_user_role") return { value: "company" };
            if (key === "kanpro_impersonate_user_name") return { value: "Empresa Aliada Impersonada" };
            if (key === "kanpro_impersonate_user_email") return { value: "admin-acting@aliada.mx" };
            return undefined;
          }),
        }),
      }));

      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: adminUserId, email: "admin@kanpro.com" } },
            }),
          },
          from: (table: string) => {
            if (table === "profiles") {
              return {
                select: () => ({
                  eq: (col: string, val: string) => ({
                    maybeSingle: () => {
                      if (val === adminUserId) {
                        return Promise.resolve({
                          data: { id: adminUserId, role: "admin", full_name: "Super Admin" },
                        });
                      }
                      if (val === impersonatedCompanyId) {
                        return Promise.resolve({
                          data: {
                            id: impersonatedCompanyId,
                            role: "company",
                            full_name: "Empresa Aliada Impersonada",
                            email: "admin-acting@aliada.mx",
                          },
                        });
                      }
                      return Promise.resolve({ data: null });
                    },
                  }),
                }),
              };
            }
            return {};
          },
        }),
      }));

      const { getDashboardSession } = await import(
        "@/modules/auth/services/dashboard-session"
      );

      const session = await getDashboardSession();

      expect(session.role).toBe("company");
      expect(session.plan).toBe("Empresa");
      expect(session.userName).toBe("Empresa Aliada Impersonada");
      expect(session.isImpersonated).toBe(true);
      expect(session.targetUserId).toBe(impersonatedCompanyId);
    });

    test("ignores impersonation cookie when caller is candidate (non-admin)", async () => {
      const candidateUserId = "candidate-attacker-1";

      // Attacker candidate tries to forge impersonation cookie for admin
      vi.doMock("next/headers", () => ({
        cookies: vi.fn().mockResolvedValue({
          get: vi.fn((key: string) => {
            if (key === "kanpro_impersonate_user_id") return { value: "target-admin-id" };
            if (key === "kanpro_impersonate_user_role") return { value: "admin" };
            if (key === "kanpro_impersonate_user_name") return { value: "Forged Admin" };
            return undefined;
          }),
        }),
      }));

      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: candidateUserId, email: "cand@test.com" } },
            }),
          },
          from: (table: string) => {
            if (table === "profiles") {
              return {
                select: () => ({
                  eq: (col: string, val: string) => ({
                    maybeSingle: () => {
                      return Promise.resolve({
                        data: { id: candidateUserId, role: "candidate", full_name: "Usuario Candidato" },
                      });
                    },
                  }),
                }),
              };
            }
            return {};
          },
        }),
      }));

      const { getDashboardSession } = await import(
        "@/modules/auth/services/dashboard-session"
      );

      const session = await getDashboardSession();

      // Must strictly remain candidate!
      expect(session.role).toBe("candidate");
      expect(session.plan).toBe("Candidato");
      expect(session.userName).toBe("Usuario Candidato");
      expect(session.isImpersonated).toBe(false);
    });
  });

  // ==========================================================================
  // Test 5: saveSystemSettings
  // ==========================================================================
  describe("Test 5: saveSystemSettings", () => {
    test("rejects non-admin callers attempting to save system settings", async () => {
      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "regular-user" } } }),
          },
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { role: "company" } }),
              }),
            }),
          }),
        }),
      }));

      const { saveSystemSettings } = await import(
        "@/app/(dashboard)/dashboard/admin/settings/actions"
      );

      await expect(
        saveSystemSettings({
          general: { appName: "Malicious Tamper" },
        })
      ).rejects.toThrow(/Acceso denegado: Se requieren permisos de administrador/i);
    });

    test("persists system settings for authenticated admin", async () => {
      const adminUserId = "admin-chief-01";
      const savedSettingsMap: Record<string, any> = {};

      vi.doMock("@/lib/supabase/server", () => ({
        createClient: vi.fn().mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: adminUserId } } }),
          },
          from: (table: string) => {
            if (table === "profiles") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
                  }),
                }),
              };
            }
            if (table === "system_settings") {
              return {
                select: () =>
                  Promise.resolve({
                    data: Object.entries(savedSettingsMap).map(([key, value]) => ({ key, value })),
                    error: null,
                  }),
                upsert: (payload: { key: string; value: any; updated_by: string }) => {
                  savedSettingsMap[payload.key] = payload.value;
                  return Promise.resolve({ error: null });
                },
              };
            }
            return {};
          },
        }),
      }));

      const { saveSystemSettings, getSystemSettings } = await import(
        "@/app/(dashboard)/dashboard/admin/settings/actions"
      );

      const newSettings = {
        general: {
          appName: "K'anPro Enterprise",
          language: "es",
          timezone: "America/Mexico_City",
          currency: "MXN",
        },
        security: {
          require2FA: true,
          sessionTimeoutMinutes: 60,
          maxLoginAttempts: 3,
        },
      };

      const saveRes = await saveSystemSettings(newSettings);
      expect(saveRes.success).toBe(true);

      const loaded = await getSystemSettings();
      expect(loaded.general?.appName).toBe("K'anPro Enterprise");
      expect(loaded.security?.sessionTimeoutMinutes).toBe(60);
      expect(loaded.security?.maxLoginAttempts).toBe(3);
    });
  });
});
