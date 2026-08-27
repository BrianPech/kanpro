import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ============================================================================
// 1. Tests for createAdminClient
// ============================================================================
describe("createAdminClient (src/lib/supabase/admin.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  test("throws descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key-test";

    const { createAdminClient } = await import("@/lib/supabase/admin");
    expect(() => createAdminClient()).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/i
    );
  });

  test("throws descriptive error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createAdminClient } = await import("@/lib/supabase/admin");
    expect(() => createAdminClient()).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/i
    );
  });

  test("successfully instantiates client with non-persisting auth configuration", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key-test-valid";

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const client = createAdminClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(typeof client.auth.admin.createUser).toBe("function");
    expect(typeof client.auth.admin.deleteUser).toBe("function");
  });
});

// ============================================================================
// 2. Tests for getDashboardSession
// ============================================================================
describe("getDashboardSession (src/modules/auth/services/dashboard-session.ts)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("strictly relies on database profiles.role and ignores malicious user_metadata.role = 'admin'", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "cand-user-123",
          email: "candidate@kanpro.com",
          user_metadata: {
            role: "admin", // Attacker manipulated metadata
            full_name: "Attacker Candidate",
          },
        },
      },
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                role: "candidate", // DB truth
                full_name: "Attacker Candidate",
              },
            }),
        }),
      }),
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
      }),
    }));

    const { getDashboardSession } = await import(
      "@/modules/auth/services/dashboard-session"
    );
    const session = await getDashboardSession();

    expect(session.role).toBe("candidate");
    expect(session.plan).toBe("Candidato");
  });

  test("correctly returns admin plan when database profiles.role is 'admin'", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "admin-user-456",
          email: "admin@kanpro.com",
          user_metadata: {},
        },
      },
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                role: "admin",
                full_name: "Verified Admin",
              },
            }),
        }),
      }),
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
      }),
    }));

    const { getDashboardSession } = await import(
      "@/modules/auth/services/dashboard-session"
    );
    const session = await getDashboardSession();

    expect(session.role).toBe("admin");
    expect(session.plan).toBe("Administrador");
    expect(session.userName).toBe("Verified Admin");
  });
});

// ============================================================================
// 3. Tests for Auth Callback Route (src/app/(auth)/auth/callback/route.ts)
// ============================================================================
describe("Auth Callback Route (src/app/(auth)/auth/callback/route.ts)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("strips ?role=admin search parameter and assigns candidate role", async () => {
    const { NextRequest } = await import("next/server");
    let assignedProfileRole = "";

    const mockExchangeCode = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "new-oauth-user",
          email: "oauth@example.com",
          user_metadata: {},
        },
      },
      error: null,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }), // Profile doesn't exist yet
        }),
      }),
      upsert: (payload: { role?: string }) => {
        if (payload?.role) {
          assignedProfileRole = payload.role;
        }
        return Promise.resolve({ error: null });
      },
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          exchangeCodeForSession: mockExchangeCode,
          updateUser: vi.fn().mockResolvedValue({}),
        },
        from: mockFrom,
      }),
    }));

    const { GET } = await import("@/app/(auth)/auth/callback/route");
    const req = new NextRequest("http://localhost:3000/auth/callback?code=test-code&role=admin");

    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(assignedProfileRole).toBe("candidate");
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");
  });

  test("strips user_metadata.role = 'admin' and assigns candidate role", async () => {
    const { NextRequest } = await import("next/server");
    let assignedProfileRole = "";

    const mockExchangeCode = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "new-oauth-user-2",
          email: "attacker@example.com",
          user_metadata: {
            role: "admin",
          },
        },
      },
      error: null,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
        }),
      }),
      upsert: (payload: { role?: string }) => {
        if (payload?.role) {
          assignedProfileRole = payload.role;
        }
        return Promise.resolve({ error: null });
      },
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          exchangeCodeForSession: mockExchangeCode,
          updateUser: vi.fn().mockResolvedValue({}),
        },
        from: mockFrom,
      }),
    }));

    const { GET } = await import("@/app/(auth)/auth/callback/route");
    const req = new NextRequest("http://localhost:3000/auth/callback?code=test-code");

    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(assignedProfileRole).toBe("candidate");
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");
  });

  test("allows legitimate company role from search param", async () => {
    const { NextRequest } = await import("next/server");
    let assignedProfileRole = "";

    const mockExchangeCode = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "new-company-user",
          email: "company@example.com",
          user_metadata: {
            company_name: "Empresa Legítima",
          },
        },
      },
      error: null,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
        }),
      }),
      upsert: (payload: { role?: string }) => {
        if (payload?.role) {
          assignedProfileRole = payload.role;
        }
        return Promise.resolve({ error: null });
      },
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          exchangeCodeForSession: mockExchangeCode,
          updateUser: vi.fn().mockResolvedValue({}),
        },
        from: mockFrom,
      }),
    }));

    const { GET } = await import("@/app/(auth)/auth/callback/route");
    const req = new NextRequest("http://localhost:3000/auth/callback?code=test-code&role=company");

    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(assignedProfileRole).toBe("company");
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/company");
  });
});

// ============================================================================
// 4. Tests for Staff Actions (createAdminStaffMember)
// ============================================================================
describe("Staff Actions (src/app/(dashboard)/dashboard/admin/staff/actions.ts)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("rejects when existing profile has role 'candidate' with descriptive error", async () => {
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: {
        user: { id: "admin-executor-1" },
      },
    });

    // Executor session check
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockAuthGetUser },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { role: "admin" }, // Executor is admin
                }),
            }),
          }),
        }),
      }),
    }));

    // Admin client check
    const mockAdminFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                id: "existing-cand-123",
                role: "candidate",
                email: "cand@kanpro.com",
              },
              error: null,
            }),
        }),
      }),
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        from: mockAdminFrom,
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Test Name",
        email: "cand@kanpro.com",
        password: "securePassword123",
        whatsappNumber: "+529991234567",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow(
      "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
    );
  });

  test("creates user via auth.admin.createUser and promotes to admin role with real UUID", async () => {
    const newRealUuid = "00000000-0000-4000-8000-000000000001";
    interface CreatedAuthPayload {
      email?: string;
      email_confirm?: boolean;
      user_metadata?: Record<string, unknown>;
    }
    interface PromotedProfilePayload {
      id?: string;
      email?: string;
      full_name?: string;
      whatsapp_number?: string;
      role?: string;
      is_verified?: boolean;
    }
    interface StaffRecordPayload {
      profile_id?: string;
      sub_role?: string;
      department?: string;
      permissions?: string[];
      status?: string;
      notes?: string;
    }

    let createdAuthPayload: CreatedAuthPayload = {};
    let promotedProfilePayload: PromotedProfilePayload = {};
    let staffRecordPayload: StaffRecordPayload = {};

    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: {
        user: { id: "admin-executor-1" },
      },
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockAuthGetUser },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { role: "admin" },
                }),
            }),
          }),
        }),
      }),
    }));

    const mockAdminCreateUser = vi.fn().mockImplementation((payload: CreatedAuthPayload) => {
      createdAuthPayload = payload;
      return Promise.resolve({
        data: {
          user: { id: newRealUuid, email: payload.email || "" },
        },
        error: null,
      });
    });

    const mockAdminFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: (payload: PromotedProfilePayload) => {
            promotedProfilePayload = payload;
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "admin_staff_members") {
        return {
          upsert: (payload: StaffRecordPayload) => {
            staffRecordPayload = payload;
            return Promise.resolve({ error: null });
          },
        };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: mockAdminCreateUser,
            deleteUser: vi.fn(),
          },
        },
        from: mockAdminFrom,
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    const result = await createAdminStaffMember({
      name: "Nuevo Administrador",
      email: "newadmin@kanpro.com",
      password: "secretPassword123",
      whatsappNumber: "+529997654321",
      subRole: "ops_admin",
      department: "Operaciones",
      permissions: ["manage_users", "manage_companies"],
    });

    expect(result.success).toBe(true);
    expect(result.profileId).toBe(newRealUuid);
    expect(createdAuthPayload?.email).toBe("newadmin@kanpro.com");
    expect(createdAuthPayload?.email_confirm).toBe(true);
    expect(promotedProfilePayload?.id).toBe(newRealUuid);
    expect(promotedProfilePayload?.role).toBe("admin");
    expect(promotedProfilePayload?.is_verified).toBe(true);
    expect(staffRecordPayload?.profile_id).toBe(newRealUuid);
    expect(staffRecordPayload?.sub_role).toBe("ops_admin");
  });

  test("executes compensatory rollback (deleteUser) if subsequent database operation fails", async () => {
    const newlyCreatedUuid = "00000000-0000-4000-8000-000000000099";
    let deletedUserId: string | null = null;

    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: {
        user: { id: "admin-executor-1" },
      },
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockAuthGetUser },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { role: "admin" },
                }),
            }),
          }),
        }),
      }),
    }));

    const mockAdminCreateUser = vi.fn().mockResolvedValue({
      data: {
        user: { id: newlyCreatedUuid, email: "failingstaff@kanpro.com" },
      },
      error: null,
    });

    const mockAdminDeleteUser = vi.fn().mockImplementation((userId: string) => {
      deletedUserId = userId;
      return Promise.resolve({ data: {}, error: null });
    });

    const mockAdminFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: () => {
            // Simulate database error during profile promotion
            return Promise.resolve({
              error: { message: "Database connection failed during profile upsert" },
            });
          },
        };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: mockAdminCreateUser,
            deleteUser: mockAdminDeleteUser,
          },
        },
        from: mockAdminFrom,
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Failing Staff",
        email: "failingstaff@kanpro.com",
        password: "secretPassword123",
        whatsappNumber: "+529991112233",
        subRole: "verification_admin",
        department: "Validación",
        permissions: ["verify_documents"],
      })
    ).rejects.toThrow(/Error al crear el perfil de administrador/i);

    // Verify compensatory rollback was invoked
    expect(deletedUserId).toBe(newlyCreatedUuid);
  });
});

// ============================================================================
// 5. Tests for requireAdmin Helper (src/lib/auth/require-admin.ts)
// ============================================================================
describe("requireAdmin (src/lib/auth/require-admin.ts)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("redirects candidate user even if user_metadata.role is 'admin'", async () => {
    let redirectDestination = "";
    vi.doMock("next/navigation", () => ({
      redirect: (url: string) => {
        redirectDestination = url;
        throw new Error(`REDIRECTED_TO:${url}`);
      },
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "candidate-123",
                email: "cand@test.com",
                user_metadata: { role: "admin" }, // Tampered metadata
              },
            },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { id: "candidate-123", role: "candidate" }, // DB truth
                }),
            }),
          }),
        }),
      }),
    }));

    const { requireAdmin } = await import("@/lib/auth/require-admin");

    await expect(requireAdmin()).rejects.toThrow("REDIRECTED_TO:/dashboard/candidate/discovery");
    expect(redirectDestination).toBe("/dashboard/candidate/discovery");
  });

  test("returns AuthenticatedAdmin when database profile has role 'admin'", async () => {
    vi.doMock("next/navigation", () => ({
      redirect: vi.fn(),
    }));

    const mockAdminProfile = {
      id: "admin-789",
      email: "realadmin@kanpro.com",
      role: "admin",
      full_name: "Real Admin",
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "admin-789",
                email: "realadmin@kanpro.com",
                user_metadata: {},
              },
            },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: mockAdminProfile,
                }),
            }),
          }),
        }),
      }),
    }));

    const { requireAdmin } = await import("@/lib/auth/require-admin");
    const result = await requireAdmin();

    expect(result.role).toBe("admin");
    expect(result.user.id).toBe("admin-789");
    expect(result.profile.role).toBe("admin");
  });
});

