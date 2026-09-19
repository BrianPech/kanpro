import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  ensureLiveSupabase,
  getAdminClient,
  createTestCompanyUser,
  createTestCandidateUser,
  cleanupTestUsers,
  generateTestEmail,
} from "./helpers/test-client";

describe("[REAL INTEGRATION] 02 - PostgreSQL Trigger: handle_employee_invitation_acceptance", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();
  let testCompany: { id: string; email: string; companyName: string };

  beforeAll(async () => {
    await ensureLiveSupabase();
    testCompany = await createTestCompanyUser({
      email: generateTestEmail("trigger-company"),
      companyName: "Grand Oasis Resorts",
    });
    usersToCleanup.push(testCompany.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  it("should trigger automatic linking and status transitions when candidate signs up (status 'pending')", async () => {
    const candidateEmail = generateTestEmail("new-hire-pending");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 1. Create company_employees row with status 'pending'
    const { data: employee, error: empErr } = await admin
      .from("company_employees")
      .insert({
        company_id: testCompany.id,
        full_name: "Carlos Mendoza",
        job_title: "Bartender Senior",
        department: "Alimentos y Bebidas",
        status: "pending",
        base_salary_monthly: 16000,
        email: candidateEmail,
      })
      .select()
      .single();

    expect(empErr).toBeNull();
    expect(employee.status).toBe("pending");
    expect(employee.employee_id).toBeNull();

    // 2. Create employee_invitations row with status 'pending'
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation, error: invErr } = await admin
      .from("employee_invitations")
      .insert({
        company_id: testCompany.id,
        employee_id: employee.id,
        email: candidateEmail,
        full_name: "Carlos Mendoza",
        position: "Bartender Senior",
        salary: 16000,
        status: "pending",
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: testCompany.id,
      })
      .select()
      .single();

    expect(invErr).toBeNull();
    expect(invitation.status).toBe("pending");
    expect(invitation.accepted_at).toBeNull();

    // 3. Register candidate user in Supabase Auth (fires handle_new_user -> profiles -> handle_employee_invitation_acceptance)
    const candidate = await createTestCandidateUser({
      email: candidateEmail,
      fullName: "Carlos Mendoza",
    });
    usersToCleanup.push(candidate.id);

    // 4. Verify in PostgreSQL: employee_invitations status transition to 'accepted'
    const { data: updatedInv, error: checkInvErr } = await admin
      .from("employee_invitations")
      .select("*")
      .eq("id", invitation.id)
      .single();

    expect(checkInvErr).toBeNull();
    expect(updatedInv.status).toBe("accepted");
    expect(updatedInv.accepted_at).not.toBeNull();

    // 5. Verify in PostgreSQL: company_employees transition to 'active' and linked to candidate auth ID
    const { data: updatedEmp, error: checkEmpErr } = await admin
      .from("company_employees")
      .select("*")
      .eq("id", employee.id)
      .single();

    expect(checkEmpErr).toBeNull();
    expect(updatedEmp.status).toBe("active");
    expect(updatedEmp.employee_id).toBe(candidate.id);

    // 6. Verify in PostgreSQL: notification created for the company
    const { data: notification, error: notifErr } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", testCompany.id)
      .eq("type", "employee_joined")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    expect(notifErr).toBeNull();
    expect(notification).not.toBeNull();
    expect(notification?.description).toContain("Carlos Mendoza");
  });

  it("should trigger automatic linking when invitation status is 'sent'", async () => {
    const candidateEmail = generateTestEmail("new-hire-sent");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 1. Create employee
    const { data: employee } = await admin
      .from("company_employees")
      .insert({
        company_id: testCompany.id,
        full_name: "Lucía Ramírez",
        job_title: "Concierge",
        status: "pending",
        email: candidateEmail,
      })
      .select()
      .single();

    // 2. Create invitation with status 'sent'
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation } = await admin
      .from("employee_invitations")
      .insert({
        company_id: testCompany.id,
        employee_id: employee!.id,
        email: candidateEmail,
        full_name: "Lucía Ramírez",
        position: "Concierge",
        status: "sent",
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select()
      .single();

    // 3. Register candidate user
    const candidate = await createTestCandidateUser({
      email: candidateEmail,
      fullName: "Lucía Ramírez",
    });
    usersToCleanup.push(candidate.id);

    // 4. Verify trigger executed
    const { data: updatedInv } = await admin
      .from("employee_invitations")
      .select("*")
      .eq("id", invitation!.id)
      .single();

    expect(updatedInv?.status).toBe("accepted");
    expect(updatedInv?.accepted_at).not.toBeNull();

    const { data: updatedEmp } = await admin
      .from("company_employees")
      .select("*")
      .eq("id", employee!.id)
      .single();

    expect(updatedEmp?.status).toBe("active");
    expect(updatedEmp?.employee_id).toBe(candidate.id);
  });

  it("should NOT trigger automatic linking if the invitation has expired", async () => {
    const candidateEmail = generateTestEmail("expired-hire");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 1. Create employee
    const { data: employee } = await admin
      .from("company_employees")
      .insert({
        company_id: testCompany.id,
        full_name: "Ignacio Vega",
        job_title: "Chef de Partie",
        status: "pending",
        email: candidateEmail,
      })
      .select()
      .single();

    // 2. Create expired invitation (expires_at in the past)
    const expiredDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation } = await admin
      .from("employee_invitations")
      .insert({
        company_id: testCompany.id,
        employee_id: employee!.id,
        email: candidateEmail,
        full_name: "Ignacio Vega",
        position: "Chef de Partie",
        status: "pending",
        token_hash: tokenHash,
        expires_at: expiredDate,
      })
      .select()
      .single();

    // 3. Register candidate user
    const candidate = await createTestCandidateUser({
      email: candidateEmail,
      fullName: "Ignacio Vega",
    });
    usersToCleanup.push(candidate.id);

    // 4. Verify invitation and employee were NOT transitioned
    const { data: checkInv } = await admin
      .from("employee_invitations")
      .select("*")
      .eq("id", invitation!.id)
      .single();

    expect(checkInv?.status).toBe("pending");
    expect(checkInv?.accepted_at).toBeNull();

    const { data: checkEmp } = await admin
      .from("company_employees")
      .select("*")
      .eq("id", employee!.id)
      .single();

    expect(checkEmp?.status).toBe("pending");
    expect(checkEmp?.employee_id).toBeNull();
  });

  it("should NOT trigger automatic linking if the invitation status is 'cancelled'", async () => {
    const candidateEmail = generateTestEmail("cancelled-hire");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 1. Create employee
    const { data: employee } = await admin
      .from("company_employees")
      .insert({
        company_id: testCompany.id,
        full_name: "Patricia Luna",
        job_title: "Hostess",
        status: "pending",
        email: candidateEmail,
      })
      .select()
      .single();

    // 2. Create invitation with status 'cancelled'
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation } = await admin
      .from("employee_invitations")
      .insert({
        company_id: testCompany.id,
        employee_id: employee!.id,
        email: candidateEmail,
        full_name: "Patricia Luna",
        position: "Hostess",
        status: "cancelled",
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select()
      .single();

    // 3. Register candidate user
    const candidate = await createTestCandidateUser({
      email: candidateEmail,
      fullName: "Patricia Luna",
    });
    usersToCleanup.push(candidate.id);

    // 4. Verify invitation remained cancelled and employee remained pending
    const { data: checkInv } = await admin
      .from("employee_invitations")
      .select("*")
      .eq("id", invitation!.id)
      .single();

    expect(checkInv?.status).toBe("cancelled");
    expect(checkInv?.accepted_at).toBeNull();

    const { data: checkEmp } = await admin
      .from("company_employees")
      .select("*")
      .eq("id", employee!.id)
      .single();

    expect(checkEmp?.status).toBe("pending");
    expect(checkEmp?.employee_id).toBeNull();
  });
});
