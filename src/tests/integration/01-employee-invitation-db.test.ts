import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  ensureLiveSupabase,
  getAdminClient,
  createTestCompanyUser,
  cleanupTestUsers,
  generateTestEmail,
} from "./helpers/test-client";

describe("[REAL INTEGRATION] 01 - Employee Invitation DB Persistence & Schema Invariants", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();
  let testCompany: { id: string; email: string; companyName: string };

  beforeAll(async () => {
    // Fail loudly if real Supabase stack is unreachable
    await ensureLiveSupabase();

    // Create a real company user
    testCompany = await createTestCompanyUser({
      email: generateTestEmail("company-db-test"),
      companyName: "DB Test Corp S.A. de C.V.",
    });
    usersToCleanup.push(testCompany.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  it("should persist a real employee record and invitation in PostgreSQL with correct constraints", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const candidateEmail = generateTestEmail("candidate-inv");

    // 1. Create employee entry in company_employees
    const { data: employee, error: empErr } = await admin
      .from("company_employees")
      .insert({
        company_id: testCompany.id,
        full_name: "María Fernández",
        job_title: "Recepcionista Bilingüe",
        department: "Recepción",
        status: "pending",
        base_salary_monthly: 18500.5,
        email: candidateEmail,
      })
      .select()
      .single();

    expect(empErr).toBeNull();
    expect(employee).toBeDefined();
    expect(employee.id).toBeDefined();
    expect(employee.company_id).toBe(testCompany.id);
    expect(employee.status).toBe("pending");
    expect(Number(employee.base_salary_monthly)).toBe(18500.5);

    // 2. Create corresponding employee_invitations record linked to the employee
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation, error: invErr } = await admin
      .from("employee_invitations")
      .insert({
        company_id: testCompany.id,
        employee_id: employee.id,
        email: candidateEmail,
        full_name: "María Fernández",
        position: "Recepcionista Bilingüe",
        salary: 18500.5,
        hire_date: "2026-10-01",
        contract_type: "tiempo_indeterminado",
        status: "pending",
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: testCompany.id,
      })
      .select()
      .single();

    expect(invErr).toBeNull();
    expect(invitation).toBeDefined();
    expect(invitation.id).toBeDefined();
    expect(invitation.company_id).toBe(testCompany.id);
    expect(invitation.employee_id).toBe(employee.id);
    expect(invitation.email).toBe(candidateEmail);
    expect(invitation.token_hash).toBe(tokenHash);
    expect(invitation.status).toBe("pending");

    // 3. Direct verification from PostgreSQL via SQL query
    const { data: fetchedInv, error: fetchErr } = await admin
      .from("employee_invitations")
      .select("*")
      .eq("id", invitation.id)
      .single();

    expect(fetchErr).toBeNull();
    expect(fetchedInv).toBeDefined();
    expect(fetchedInv.token_hash).toBe(tokenHash);
    expect(fetchedInv.accepted_at).toBeNull();
  });

  it("should enforce UNIQUE token_hash constraint in PostgreSQL", async () => {
    const duplicateTokenHash = crypto
      .createHash("sha256")
      .update("static-duplicate-token")
      .digest("hex");

    const email1 = generateTestEmail("dup1");
    const email2 = generateTestEmail("dup2");

    // First insert succeeds
    const { error: err1 } = await admin.from("employee_invitations").insert({
      company_id: testCompany.id,
      email: email1,
      full_name: "User One",
      position: "Dev",
      status: "pending",
      token_hash: duplicateTokenHash,
    });
    expect(err1).toBeNull();

    // Second insert with the exact same token_hash must be rejected by PostgreSQL unique constraint
    const { error: err2 } = await admin.from("employee_invitations").insert({
      company_id: testCompany.id,
      email: email2,
      full_name: "User Two",
      position: "Dev",
      status: "pending",
      token_hash: duplicateTokenHash,
    });

    expect(err2).not.toBeNull();
    // PostgreSQL error 23505 = unique_violation
    expect(err2?.code).toBe("23505");
  });

  it("should enforce CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled'))", async () => {
    const invalidStatusTokenHash = crypto
      .createHash("sha256")
      .update("invalid-status-token")
      .digest("hex");

    const { error } = await admin.from("employee_invitations").insert({
      company_id: testCompany.id,
      email: generateTestEmail("invalid-status"),
      full_name: "Invalid Status User",
      position: "Dev",
      status: "non_existent_status" as unknown as "pending",
      token_hash: invalidStatusTokenHash,
    });

    expect(error).not.toBeNull();
    // PostgreSQL error 23514 = check_violation
    expect(error?.code).toBe("23514");
  });

  it("should enforce foreign key cascade when company is deleted", async () => {
    // Create an ephemeral company user
    const tempCompany = await createTestCompanyUser({
      email: generateTestEmail("temp-company-cascade"),
      companyName: "Cascade Temp S.A.",
    });

    const tokenHash = crypto.randomBytes(32).toString("hex");

    // Insert an invitation for this company
    const { data: inv, error: invErr } = await admin
      .from("employee_invitations")
      .insert({
        company_id: tempCompany.id,
        email: generateTestEmail("temp-emp"),
        full_name: "Temp Employee",
        position: "Support",
        status: "pending",
        token_hash: tokenHash,
      })
      .select()
      .single();

    expect(invErr).toBeNull();
    expect(inv?.id).toBeDefined();

    // Delete company from auth.users (which cascades to company_profiles and employee_invitations)
    await admin.auth.admin.deleteUser(tempCompany.id);

    // Verify invitation no longer exists in PostgreSQL
    const { data: remainingInv, error: checkErr } = await admin
      .from("employee_invitations")
      .select("id")
      .eq("id", inv.id)
      .maybeSingle();

    expect(checkErr).toBeNull();
    expect(remainingInv).toBeNull();
  });
});
