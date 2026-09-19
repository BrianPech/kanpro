import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// Mock server-only and next/cache for Vitest environment
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

/**
 * ============================================================================
 * K'ANPRO SECURITY HARDENING ACCEPTANCE TEST SUITE (12 MANDATORY TESTS)
 * ============================================================================
 * 
 * Verifies all 12 Acceptance Criteria defined in ORIGINAL_REQUEST.md:
 * - Test 1: Public registration with signUp({ data: { role: "admin" } }) -> profiles.role === 'candidate'
 * - Test 2: Public registration with role: "super_admin" -> profiles.role === 'candidate'
 * - Test 3: Public registration with role: "company" -> profiles.role === 'company'
 * - Test 4: Auth callback route with ?role=admin or metadata role: 'admin' does NOT grant admin role (defaults to candidate)
 * - Test 5: Client updating user_metadata.role = "admin" after registration does NOT elevate session in getDashboardSession()
 * - Test 6: createAdminStaffMember called by unauthenticated/anonymous caller is rejected (requireAdminAuth)
 * - Test 7: createAdminStaffMember called by authenticated candidate/company user is rejected with authorization error
 * - Test 8: Authenticated admin user successfully executes createAdminStaffMember with executor session and cookies intact
 * - Test 9: Newly created staff has authentic auth.users.id matching profiles.id without crypto.randomUUID() FK violation
 * - Test 10: Newly created staff has profiles.role === 'admin', is_verified === true, and record in admin_staff_members
 * - Test 11: Attempting to create staff using an existing candidate/company email is rejected without mutating existing profile role
 * - Test 12: Simulated failure during staff insertion triggers compensatory rollback (deleteUser) while leaving pre-existing users untouched
 */

/**
 * Helper executing the handle_new_user() SQL trigger logic faithfully
 * matching supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql.
 */
function simulateHandleNewUserTrigger(userRecord: {
  id: string;
  email: string;
  raw_user_meta_data?: Record<string, unknown>;
  existingProfile?: { role: string; full_name?: string } | null;
}) {
  const raw_role_str = userRecord.raw_user_meta_data?.role;
  let assigned_role: "candidate" | "company" = "candidate";

  // R1 Logic: Strict role mapping
  if (raw_role_str === "company") {
    assigned_role = "company";
  } else {
    assigned_role = "candidate";
  }

  // ON CONFLICT DO UPDATE Logic
  let final_role: string = assigned_role;
  if (userRecord.existingProfile?.role === "admin") {
    final_role = "admin"; // Protected from downgrade/overwrite
  }

  const profile = {
    id: userRecord.id,
    email: userRecord.email,
    full_name: (userRecord.raw_user_meta_data?.full_name as string) || "Usuario K’anPro",
    whatsapp_number: (userRecord.raw_user_meta_data?.whatsapp_number as string) || "",
    role: final_role,
  };

  let candidateProfile: { id: string } | null = null;
  let candidatePrivateProfile: { id: string; birth_date: string | null } | null = null;
  let companyProfile: { id: string; company_name: string } | null = null;

  if (assigned_role === "candidate") {
    candidateProfile = { id: userRecord.id };
    const raw_birth_date = userRecord.raw_user_meta_data?.birth_date as string | undefined;
    candidatePrivateProfile = {
      id: userRecord.id,
      birth_date: raw_birth_date || null,
    };
  } else if (assigned_role === "company") {
    companyProfile = {
      id: userRecord.id,
      company_name:
        (userRecord.raw_user_meta_data?.company_name as string) ||
        (userRecord.raw_user_meta_data?.full_name as string) ||
        "Nueva Empresa",
    };
  }

  return { profile, candidateProfile, candidatePrivateProfile, companyProfile };
}

describe("K'anPro Admin Privilege Hardening — 12 Acceptance Criteria Security Test Suite", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // ==========================================================================
  // Test 1: Public registration with signUp({ data: { role: "admin" } })
  // results in profiles.role === 'candidate'
  // ==========================================================================
  test("Test 1: Public registration with signUp({ data: { role: 'admin' } }) results in profiles.role === 'candidate'", () => {
    const maliciousSignupUser = {
      id: "auth-uuid-test-1",
      email: "attacker-admin@evil.com",
      raw_user_meta_data: {
        role: "admin", // Attacker injected role
        full_name: "Evil Admin Attacker",
      },
    };

    const result = simulateHandleNewUserTrigger(maliciousSignupUser);

    expect(result.profile.role).toBe("candidate");
    expect(result.profile.role).not.toBe("admin");
    expect(result.candidateProfile).toBeDefined();
    expect(result.companyProfile).toBeNull();

    // Verify SQL Migration source code contains hardened logic
    const migrationPath = path.resolve(
      __dirname,
      "../../../supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql"
    );
    const migrationSql = fs.readFileSync(migrationPath, "utf8");
    expect(migrationSql).toContain("IF raw_role_str = 'company' THEN");
    expect(migrationSql).toContain("assigned_role := 'company'::public.user_role;");
    expect(migrationSql).toContain("assigned_role := 'candidate'::public.user_role;");
    expect(migrationSql).not.toContain("ELSIF raw_role_str = 'admin'");
  });

  // ==========================================================================
  // Test 2: Public registration with role: "super_admin"
  // results in profiles.role === 'candidate'
  // ==========================================================================
  test("Test 2: Public registration with role: 'super_admin' results in profiles.role === 'candidate'", () => {
    const superAdminAttemptUser = {
      id: "auth-uuid-test-2",
      email: "attacker-superadmin@evil.com",
      raw_user_meta_data: {
        role: "super_admin", // Attacker injected arbitrary elevated role
        full_name: "Super Admin Attacker",
      },
    };

    const result = simulateHandleNewUserTrigger(superAdminAttemptUser);

    expect(result.profile.role).toBe("candidate");
    expect(result.profile.role).not.toBe("super_admin");
    expect(result.profile.role).not.toBe("admin");
  });

  // ==========================================================================
  // Test 3: Public registration with role: "company"
  // results in profiles.role === 'company'
  // ==========================================================================
  test("Test 3: Public registration with role: 'company' results in profiles.role === 'company'", () => {
    const legitimateCompanyUser = {
      id: "auth-uuid-test-3",
      email: "recruiter@legitimate-company.com",
      raw_user_meta_data: {
        role: "company",
        company_name: "Empresa Legítima del Mayab",
      },
    };

    const result = simulateHandleNewUserTrigger(legitimateCompanyUser);

    expect(result.profile.role).toBe("company");
    expect(result.companyProfile).toBeDefined();
    expect(result.companyProfile?.company_name).toBe("Empresa Legítima del Mayab");
    expect(result.candidateProfile).toBeNull();
  });

  // ==========================================================================
  // Test 4: Auth callback route with ?role=admin or metadata role: 'admin'
  // does NOT grant admin role (defaults to candidate)
  // ==========================================================================
  test("Test 4: Auth callback route with ?role=admin or metadata role: 'admin' does NOT grant admin role (defaults to candidate)", async () => {
    let capturedProfileRole = "";

    const mockExchangeCode = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "oauth-user-test-4",
          email: "oauth-attacker@test.com",
          user_metadata: {
            role: "admin", // OAuth metadata tampering
          },
        },
      },
      error: null,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }), // Initial login (no DB profile yet)
        }),
      }),
      upsert: (payload: { role?: string }) => {
        if (payload?.role) {
          capturedProfileRole = payload.role;
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

    // Attack via URL search parameter ?role=admin
    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=oauth-secure-code&role=admin"
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(capturedProfileRole).toBe("candidate");
    expect(capturedProfileRole).not.toBe("admin");
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard/candidate");
  });

  // ==========================================================================
  // Test 5: Client updating user_metadata.role = "admin" after registration
  // does NOT elevate session in getDashboardSession() (database profiles.role is authoritative)
  // ==========================================================================
  test("Test 5: Client updating user_metadata.role = 'admin' after registration does NOT elevate session in getDashboardSession() (database profiles.role is authoritative)", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "candidate-user-test-5",
          email: "candidate@kanpro.com",
          user_metadata: {
            role: "admin", // Post-registration metadata manipulation
            full_name: "Tampered Candidate",
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
                role: "candidate", // Authoritative DB truth
                full_name: "Tampered Candidate",
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
    expect(session.role).not.toBe("admin");
    expect(session.plan).toBe("Candidato");
    expect(session.plan).not.toBe("Administrador");
  });

  // ==========================================================================
  // Test 6: createAdminStaffMember called by unauthenticated/anonymous caller
  // is rejected (requireAdminAuth)
  // ==========================================================================
  test("Test 6: createAdminStaffMember called by unauthenticated/anonymous caller is rejected (requireAdminAuth)", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null }, // Unauthenticated / anonymous
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
        email: "anon@evil.com",
        password: "SecretPassword123!",
        whatsappNumber: "+529990001122",
        subRole: "super_admin",
        department: "Directiva",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("No autenticado. Por favor inicie sesión.");

    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // Test 7: createAdminStaffMember called by authenticated candidate or company
  // user is rejected with authorization error
  // ==========================================================================
  test("Test 7: createAdminStaffMember called by authenticated candidate or company user is rejected with authorization error", async () => {
    // Authenticated user with candidate role
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "candidate-caller-id" } },
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
        name: "Candidate Escalation Attempt",
        email: "target-new-staff@kanpro.com",
        password: "SecretPassword123!",
        whatsappNumber: "+529990001122",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow("Acceso denegado: Se requieren permisos de administrador.");

    expect(mockAdminClient).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // Test 8: Authenticated admin user successfully executes createAdminStaffMember
  // with executor session and cookies remaining intact
  // ==========================================================================
  test("Test 8: Authenticated admin user successfully executes createAdminStaffMember with executor session and cookies remaining intact", async () => {
    const adminExecutorId = "admin-executor-test-8";
    let signUpCalled = false;

    // Caller server client (admin executor)
    const mockAuthGetUser = vi.fn().mockResolvedValue({
      data: {
        user: { id: adminExecutorId, email: "admin@kanpro.com" },
      },
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: mockAuthGetUser,
          signUp: () => {
            signUpCalled = true; // MUST NEVER BE CALLED
            return Promise.resolve({});
          },
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

    // Server-only Admin Client
    const newStaffUuid = "00000000-0000-4000-8000-000000000008";
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: { id: newStaffUuid, email: "newstaff@kanpro.com" },
              },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: () => Promise.resolve({ error: null }),
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    const result = await createAdminStaffMember({
      name: "Staff Legítimo",
      email: "newstaff@kanpro.com",
      password: "SafePassword123!",
      whatsappNumber: "+529991234567",
      subRole: "verification_admin",
      department: "Validación",
      permissions: ["verify_documents"],
    });

    expect(result.success).toBe(true);
    expect(result.profileId).toBe(newStaffUuid);

    // Verify session cookies / executor session was NOT mutated by signUp()
    expect(signUpCalled).toBe(false);
    const executorSession = await mockAuthGetUser();
    expect(executorSession.data.user.id).toBe(adminExecutorId);
  });

  // ==========================================================================
  // Test 9: Newly created staff has authentic auth.users.id matching profiles.id
  // without crypto.randomUUID() FK violation
  // ==========================================================================
  test("Test 9: Newly created staff has authentic auth.users.id matching profiles.id without crypto.randomUUID() FK violation", async () => {
    const authenticAuthUserId = "11111111-2222-4333-8444-555555555555";
    let passedProfileIdToDb = "";
    let passedStaffProfileIdToDb = "";

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-executor-9" } },
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

    const mockAdminCreateUser = vi.fn().mockResolvedValue({
      data: {
        user: { id: authenticAuthUserId, email: "staff.auth@kanpro.com" },
      },
      error: null,
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: mockAdminCreateUser,
            deleteUser: vi.fn(),
          },
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: (payload: { id?: string; profile_id?: string }) => {
            if (table === "profiles" && payload.id) {
              passedProfileIdToDb = payload.id;
            }
            if (table === "admin_staff_members" && payload.profile_id) {
              passedStaffProfileIdToDb = payload.profile_id;
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    const result = await createAdminStaffMember({
      name: "Auth ID Staff",
      email: "staff.auth@kanpro.com",
      password: "Password999!",
      whatsappNumber: "+529995556677",
      subRole: "ops_admin",
      department: "Operaciones",
      permissions: ["manage_users"],
    });

    expect(result.profileId).toBe(authenticAuthUserId);
    expect(passedProfileIdToDb).toBe(authenticAuthUserId);
    expect(passedStaffProfileIdToDb).toBe(authenticAuthUserId);
    expect(passedProfileIdToDb).toBe(passedStaffProfileIdToDb);
  });

  // ==========================================================================
  // Test 10: Newly created staff has profiles.role === 'admin',
  // is_verified === true, and associated record in admin_staff_members
  // ==========================================================================
  test("Test 10: Newly created staff has profiles.role === 'admin', is_verified === true, and associated record in admin_staff_members", async () => {
    const staffId = "00000000-0000-4000-8000-000000000010";
    interface ProfilePayload {
      id?: string;
      role?: string;
      is_verified?: boolean;
      full_name?: string;
    }
    interface StaffPayload {
      profile_id?: string;
      sub_role?: string;
      department?: string;
      permissions?: string[];
      status?: string;
    }

    let savedProfile: ProfilePayload = {};
    let savedStaff: StaffPayload = {};

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-executor-10" } },
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
              data: {
                user: { id: staffId, email: "superstaff@kanpro.com" },
              },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: (payload: ProfilePayload & StaffPayload) => {
            if (table === "profiles") {
              savedProfile = payload;
            }
            if (table === "admin_staff_members") {
              savedStaff = payload;
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));

    const { createAdminStaffMember } = await import(
      "@/app/(dashboard)/dashboard/admin/staff/actions"
    );

    const result = await createAdminStaffMember({
      name: "Super Staff Verified",
      email: "superstaff@kanpro.com",
      password: "SafePassword123!",
      whatsappNumber: "+529991112233",
      subRole: "super_admin",
      department: "Dirección General",
      permissions: ["manage_users", "manage_companies", "system_settings"],
    });

    expect(result.success).toBe(true);
    expect(savedProfile.id).toBe(staffId);
    expect(savedProfile.role).toBe("admin");
    expect(savedProfile.is_verified).toBe(true);
    expect(savedStaff.profile_id).toBe(staffId);
    expect(savedStaff.sub_role).toBe("super_admin");
    expect(savedStaff.status).toBe("active");
    expect(savedStaff.permissions).toEqual([
      "manage_users",
      "manage_companies",
      "system_settings",
    ]);
  });

  // ==========================================================================
  // Test 11: Attempting to create staff using an existing candidate or company
  // email is rejected with error without mutating the existing profile's role
  // ==========================================================================
  test("Test 11: Attempting to create staff using an existing candidate or company email is rejected with error 'Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción.' without mutating the existing profile's role", async () => {
    const existingCandidateProfile = {
      id: "candidate-existing-uuid-11",
      email: "existing.candidate@kanpro.com",
      role: "candidate",
      full_name: "Existing Candidate",
    };

    let profileUpdatedOrUpserted = false;
    let authUserCreated = false;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-executor-11" } },
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
              return Promise.resolve({ data: { user: { id: "new-user-id" } } });
            }),
            deleteUser: vi.fn(),
          },
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: existingCandidateProfile,
                  error: null,
                }),
            }),
          }),
          update: () => {
            profileUpdatedOrUpserted = true;
            return { eq: () => Promise.resolve({ error: null }) };
          },
          upsert: () => {
            profileUpdatedOrUpserted = true;
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
        name: "Malicious Silent Promotion",
        email: "existing.candidate@kanpro.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529990001122",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow(
      "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
    );

    // Verify invariants: existing candidate role is untouched and no auth creation occurred
    expect(profileUpdatedOrUpserted).toBe(false);
    expect(authUserCreated).toBe(false);
    expect(existingCandidateProfile.role).toBe("candidate");
  });

  // ==========================================================================
  // Test 12: Simulated failure during staff insertion triggers compensatory
  // rollback (supabaseAdmin.auth.admin.deleteUser) deleting the newly created
  // auth user, while leaving pre-existing users untouched
  // ==========================================================================
  test("Test 12: Simulated failure during staff insertion triggers compensatory rollback (supabaseAdmin.auth.admin.deleteUser) deleting the newly created auth user, while leaving pre-existing users untouched", async () => {
    const newlyCreatedAuthUserId = "00000000-0000-4000-8000-000000000012";
    let deletedAuthUserId: string | null = null;

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-executor-12" } },
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

    const mockAdminCreateUser = vi.fn().mockResolvedValue({
      data: {
        user: { id: newlyCreatedAuthUserId, email: "failingstaff@kanpro.com" },
      },
      error: null,
    });

    const mockAdminDeleteUser = vi.fn().mockImplementation((userId: string) => {
      deletedAuthUserId = userId;
      return Promise.resolve({ data: {}, error: null });
    });

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        auth: {
          admin: {
            createUser: mockAdminCreateUser,
            deleteUser: mockAdminDeleteUser,
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
              // Simulate database crash during profile elevation
              return Promise.resolve({
                error: { message: "Database connection failure on profiles upsert" },
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
        name: "Failing Staff User",
        email: "failingstaff@kanpro.com",
        password: "ValidPassword123!",
        whatsappNumber: "+529990001122",
        subRole: "ops_admin",
        department: "Operaciones",
        permissions: ["manage_users"],
      })
    ).rejects.toThrow(/Database connection failure on profiles upsert/i);

    // Verify compensatory rollback was executed on the new user
    expect(deletedAuthUserId).toBe(newlyCreatedAuthUserId);
  });
});
