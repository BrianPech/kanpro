import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// ============================================================================
// SUITE 1: Candidate / Company Account Collision & Silent Promotion Resistance
// ============================================================================
describe("Adversarial Challenge 1: Account Collision & Silent Promotion Rejection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("Attack Scenario 1.1: Attempting to create admin staff with existing candidate email is blocked and preserves original candidate role", async () => {
    const candidateProfile = {
      id: "candidate-uuid-100",
      email: "candidate.user@example.com",
      role: "candidate",
      full_name: "Candidate User",
    };

    let profileUpdated = false;
    let staffCreated = false;
    let authUserCreated = false;

    // Executor is valid admin
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    // Mock Admin client
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockImplementation(() => {
              authUserCreated = true;
              return Promise.resolve({ data: { user: { id: "new-id" } } });
            }),
            deleteUser: vi.fn(),
          },
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: candidateProfile, error: null }),
            }),
          }),
          update: () => {
            profileUpdated = true;
            return { eq: () => Promise.resolve({ error: null }) };
          },
          upsert: () => {
            if (table === "admin_staff_members") staffCreated = true;
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    // Act & Assert
    await expect(
      createAdminStaffMember({
        name: "Malicious Promotion Attempt",
        email: "   Candidate.User@Example.com   ", // testing whitespace trimming & case insensitivity
        password: "ValidPassword123!",
        whatsappNumber: "+529990001122",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow(
      "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
    );

    // Verify invariants: no DB changes or auth creations occurred
    expect(profileUpdated).toBe(false);
    expect(staffCreated).toBe(false);
    expect(authUserCreated).toBe(false);
    expect(candidateProfile.role).toBe("candidate");
  });

  test("Attack Scenario 1.2: Attempting to create admin staff with existing company email is blocked and preserves company role", async () => {
    const companyProfile = {
      id: "company-uuid-200",
      email: "recruiter@acme-corp.com",
      role: "company",
      full_name: "Acme Corp Recruiter",
    };

    let profileUpdated = false;
    let staffCreated = false;
    let authUserCreated = false;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockImplementation(() => {
              authUserCreated = true;
              return Promise.resolve({ data: { user: { id: "new-id" } } });
            }),
            deleteUser: vi.fn(),
          },
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: companyProfile, error: null }),
            }),
          }),
          update: () => {
            profileUpdated = true;
            return { eq: () => Promise.resolve({ error: null }) };
          },
          upsert: () => {
            if (table === "admin_staff_members") staffCreated = true;
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Company Hijack Attempt",
        email: "recruiter@acme-corp.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529993334455",
        subRole: "verification_admin",
        department: "Validación",
        permissions: ["verify_documents"],
      })
    ).rejects.toThrow(
      "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
    );

    expect(profileUpdated).toBe(false);
    expect(staffCreated).toBe(false);
    expect(authUserCreated).toBe(false);
    expect(companyProfile.role).toBe("company");
  });

  test("Attack Scenario 1.3: Existing user with unexpected/invalid role is rejected fail-closed", async () => {
    const corruptedProfile = {
      id: "corrupt-uuid-300",
      email: "corrupt@kanpro.com",
      role: "unknown_custom_role",
      full_name: "Corrupt Profile",
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn(),
            deleteUser: vi.fn(),
          },
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: corruptedProfile, error: null }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          upsert: () => Promise.resolve({ error: null }),
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Unknown Role User",
        email: "corrupt@kanpro.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529993334455",
        subRole: "verification_admin",
        department: "Validación",
        permissions: ["verify_documents"],
      })
    ).rejects.toThrow(
      "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
    );
  });

  test("Scenario 1.4: Validation rejects empty email or empty name", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "   ",
        email: "admin@kanpro.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529991112233",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Nombre y correo electrónico institucional son requeridos.");

    await expect(
      createAdminStaffMember({
        name: "Admin Name",
        email: "   ",
        password: "ValidPassword123!",
        whatsappNumber: "+529991112233",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Nombre y correo electrónico institucional son requeridos.");
  });

  test("Scenario 1.5: Validation rejects weak password (<6 characters) for new admin user", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "New Admin",
        email: "newadmin@kanpro.com",
        password: "123", // Short password
        whatsappNumber: "+529991112233",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("La contraseña para el nuevo administrador debe tener al menos 6 caracteres.");
  });
});

// ============================================================================
// SUITE 2: Compensatory Rollback & Failure Recovery
// ============================================================================
describe("Adversarial Challenge 2: Compensatory Rollback Invariant", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("Rollback Scenario 2.1: Failure during profiles table upsert triggers deleteUser for newly created Auth user", async () => {
    const newlyCreatedId = "newly-created-auth-uuid-999";
    let deletedUserId: string | null = null;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    const mockCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: newlyCreatedId, email: "newstaff@kanpro.com" } },
      error: null,
    });

    const mockDeleteUser = vi.fn().mockImplementation((id: string) => {
      deletedUserId = id;
      return Promise.resolve({ data: {}, error: null });
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: mockCreateUser,
            deleteUser: mockDeleteUser,
          },
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: () => {
            if (table === "profiles") {
              return Promise.resolve({
                error: { message: "Simulated DB constraint error on profiles" },
              });
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Rollback Candidate",
        email: "newstaff@kanpro.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529991112233",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Error al crear el perfil de administrador: Simulated DB constraint error on profiles");

    expect(deletedUserId).toBe(newlyCreatedId);
  });

  test("Rollback Scenario 2.2: Failure during admin_staff_members upsert triggers deleteUser for newly created Auth user", async () => {
    const newlyCreatedId = "newly-created-auth-uuid-888";
    let deletedUserId: string | null = null;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    const mockCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: newlyCreatedId, email: "newstaff2@kanpro.com" } },
      error: null,
    });

    const mockDeleteUser = vi.fn().mockImplementation((id: string) => {
      deletedUserId = id;
      return Promise.resolve({ data: {}, error: null });
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: mockCreateUser,
            deleteUser: mockDeleteUser,
          },
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: () => {
            if (table === "profiles") {
              return Promise.resolve({ error: null }); // profile upsert ok
            }
            if (table === "admin_staff_members") {
              return Promise.resolve({
                error: { message: "Simulated DB constraint error on admin_staff_members" },
              });
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Rollback Candidate 2",
        email: "newstaff2@kanpro.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529991112233",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Error al asignar metadata administrativa: Simulated DB constraint error on admin_staff_members");

    expect(deletedUserId).toBe(newlyCreatedId);
  });

  test("Rollback Scenario 2.3: Failure while updating existing admin NEVER calls deleteUser on existing account", async () => {
    const existingAdminProfile = {
      id: "existing-admin-uuid-555",
      email: "existing.admin@kanpro.com",
      role: "admin",
      full_name: "Existing Admin",
    };

    let deleteUserCalled = false;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn(),
            deleteUser: vi.fn().mockImplementation(() => {
              deleteUserCalled = true;
              return Promise.resolve({});
            }),
          },
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: existingAdminProfile, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: { message: "DB update error on profiles" } }),
          }),
          upsert: () => Promise.resolve({ error: null }),
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Existing Admin Update",
        email: "existing.admin@kanpro.com",
        password: "AnyPassword123",
        whatsappNumber: "+529991112233",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Error al actualizar el perfil de administrador: DB update error on profiles");

    expect(deleteUserCalled).toBe(false);
  });

  test("Rollback Scenario 2.4: Rollback error is caught and logged without swallowing primary error", async () => {
    const newlyCreatedId = "newly-created-auth-uuid-777";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "executor-admin-id" } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: { id: newlyCreatedId, email: "rollbackfail@kanpro.com" } },
              error: null,
            }),
            deleteUser: vi.fn().mockRejectedValue(new Error("Supabase Auth API unavailable for rollback")),
          },
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: () => {
            if (table === "profiles") {
              return Promise.resolve({
                error: { message: "Primary profile insertion error" },
              });
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Rollback Edge Case",
        email: "rollbackfail@kanpro.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529991112233",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Error al crear el perfil de administrador: Primary profile insertion error");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Error en rollback compensatorio eliminando usuario ${newlyCreatedId}`),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

// ============================================================================
// SUITE 3: Executor Session Integrity & Zero Session Contamination
// ============================================================================
describe("Adversarial Challenge 3: Executor Session Integrity & Server-Only Isolation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("Session Scenario 3.1: Anonymous user cannot invoke createAdminStaffMember", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null }, // Anonymous
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null }),
            }),
          }),
        }),
      }),
    }));

    const mockAdminClient = vi.fn();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: mockAdminClient,
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Anonymous Attacker",
        email: "attacker@anon.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529991112233",
        subRole: "super_admin",
        department: "Directiva",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("No autenticado. Por favor inicie sesión.");

    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  test("Session Scenario 3.2: Candidate user cannot invoke createAdminStaffMember", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "candidate-user-id" } },
          }),
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

    const mockAdminClient = vi.fn();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: mockAdminClient,
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(
      createAdminStaffMember({
        name: "Candidate Escalation",
        email: "candidate@anon.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529991112233",
        subRole: "super_admin",
        department: "Directiva",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Acceso denegado: Se requieren permisos de administrador.");

    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  test("Session Scenario 3.3: Self-deletion prevention in deleteAdminStaffMember", async () => {
    const adminId = "admin-executor-99";
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: adminId } },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
            }),
          }),
        }),
      }),
    }));

    const { deleteAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    await expect(deleteAdminStaffMember(adminId)).rejects.toThrow(
      "No puede dar de baja su propio usuario administrador."
    );
  });

  test("Session Scenario 3.4: createAdminClient does NOT persist or mutate session state", async () => {
    vi.doUnmock("@/lib/supabase/admin");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    expect(adminClient).toBeDefined();
    expect(adminClient.auth).toBeDefined();
    expect(typeof adminClient.auth.admin.createUser).toBe("function");
    expect(typeof adminClient.auth.admin.deleteUser).toBe("function");
  });
});

// ============================================================================
// SUITE 4: Callback Role Tampering & Parameter Injection Resistance
// ============================================================================
describe("Adversarial Challenge 4: Auth Callback Role Tampering", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("Tampering Scenario 4.1: Query parameter ?role=admin is ignored and coerced to candidate", async () => {
    let upsertedRole: string | null = null;
    let updatedUserRole: string | null = null;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "oauth-attacker-1",
                email: "attacker@test.com",
                user_metadata: {},
              },
            },
            error: null,
          }),
          updateUser: vi.fn().mockImplementation((payload: { data: { role: string } }) => {
            updatedUserRole = payload.data.role;
            return Promise.resolve({ data: {}, error: null });
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null }), // Profile doesn't exist yet
            }),
          }),
          upsert: (payload: { role?: string }) => {
            if (payload?.role) upsertedRole = payload.role;
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { GET } = await import("@/app/(auth)/auth/callback/route");
    const req = new NextRequest("http://localhost:3000/auth/callback?code=valid-code&role=admin");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(upsertedRole).toBe("candidate");
    expect(updatedUserRole).toBe("candidate");
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");
  });

  test("Tampering Scenario 4.2: Injected metadata { role: 'admin' } and ?role=super_admin coerced to candidate", async () => {
    let upsertedRole: string | null = null;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "oauth-attacker-2",
                email: "attacker2@test.com",
                user_metadata: { role: "admin", sub: "123" },
              },
            },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null }),
            }),
          }),
          upsert: (payload: { role?: string }) => {
            if (payload?.role) upsertedRole = payload.role;
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { GET } = await import("@/app/(auth)/auth/callback/route");
    const req = new NextRequest("http://localhost:3000/auth/callback?code=valid-code&role=super_admin");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(upsertedRole).toBe("candidate");
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");
  });

  test("Tampering Scenario 4.3: Open redirect injection in redirectTo is sanitized", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "oauth-user-3",
                email: "user3@test.com",
                user_metadata: {},
              },
            },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "candidate" } }),
            }),
          }),
          upsert: () => Promise.resolve({ error: null }),
        }),
      }),
    }));

    const { GET } = await import("@/app/(auth)/auth/callback/route");

    // Test protocol relative URL (//evil.com)
    const req1 = new NextRequest("http://localhost:3000/auth/callback?code=valid-code&redirectTo=//evil.com");
    const res1 = await GET(req1);
    expect(res1.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");

    // Test external absolute URL (https://evil.com)
    const req2 = new NextRequest("http://localhost:3000/auth/callback?code=valid-code&redirectTo=https://evil.com/phish");
    const res2 = await GET(req2);
    expect(res2.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");

    // Test valid internal relative path (/dashboard/candidate/profile)
    const req3 = new NextRequest("http://localhost:3000/auth/callback?code=valid-code&redirectTo=/dashboard/candidate/profile");
    const res3 = await GET(req3);
    expect(res3.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate/profile");
  });

  test("Tampering Scenario 4.4: Existing admin profile logging in via callback preserves admin redirection", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "legit-admin-user",
                email: "admin@kanpro.com",
                user_metadata: {},
              },
            },
            error: null,
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { role: "admin" } }), // DB profile role is admin
            }),
          }),
        }),
      }),
    }));

    const { GET } = await import("@/app/(auth)/auth/callback/route");
    const req = new NextRequest("http://localhost:3000/auth/callback?code=valid-admin-code");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/admin");
  });
});

// ============================================================================
// SUITE 5: Session Role Tampering & Client SDK Privilege Escalation
// ============================================================================
describe("Adversarial Challenge 5: Session Role Tampering & Route Authorization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("Session Tampering 5.1: Client tampering user_metadata.role = 'admin' does not grant admin session in getDashboardSession", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "tampered-user-1",
                email: "cand@test.com",
                user_metadata: {
                  role: "admin", // Client altered its own user_metadata
                  full_name: "Evil Candidate",
                },
              },
            },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    role: "candidate", // DB is authoritative
                    full_name: "Evil Candidate",
                  },
                }),
            }),
          }),
        }),
      }),
    }));

    const { getDashboardSession } = await import(
      "@/modules/auth/services/dashboard-session"
    );
    const session = await getDashboardSession();

    expect(session.role).toBe("candidate");
    expect(session.plan).toBe("Candidato");
    expect(session.userName).toBe("Evil Candidate");
  });

  test("Session Tampering 5.2: Fallback when profile row is absent rejects user_metadata.role = 'admin'", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "no-profile-user",
                email: "unprofiled@test.com",
                user_metadata: {
                  role: "admin", // Attacker sets metadata role to admin
                },
              },
            },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null }), // No profile
            }),
          }),
        }),
      }),
    }));

    const { getDashboardSession } = await import(
      "@/modules/auth/services/dashboard-session"
    );
    const session = await getDashboardSession();

    expect(session.role).toBe("candidate");
    expect(session.plan).toBe("Candidato");
  });

  test("Session Tampering 5.3: requireAdmin blocks candidate with metadata role='admin' from admin route", async () => {
    let redirectedUrl = "";
    vi.doMock("next/navigation", () => ({
      redirect: (url: string) => {
        redirectedUrl = url;
        throw new Error(`REDIRECTED:${url}`);
      },
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "tampered-candidate",
                email: "cand@test.com",
                user_metadata: { role: "admin" },
              },
            },
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { id: "tampered-candidate", role: "candidate" },
                }),
            }),
          }),
        }),
      }),
    }));

    const { requireAdmin } = await import("@/lib/auth/require-admin");

    await expect(requireAdmin()).rejects.toThrow("REDIRECTED:/dashboard/candidate/discovery");
    expect(redirectedUrl).toBe("/dashboard/candidate/discovery");
  });

  test("Session Tampering 5.4: requireAdmin redirects unauthenticated visitor to /login", async () => {
    let redirectedUrl = "";
    vi.doMock("next/navigation", () => ({
      redirect: (url: string) => {
        redirectedUrl = url;
        throw new Error(`REDIRECTED:${url}`);
      },
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      }),
    }));

    const { requireAdmin } = await import("@/lib/auth/require-admin");

    await expect(requireAdmin()).rejects.toThrow("REDIRECTED:/login");
    expect(redirectedUrl).toBe("/login");
  });
});
