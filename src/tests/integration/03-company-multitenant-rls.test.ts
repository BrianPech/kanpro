import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import {
  ensureLiveSupabase,
  getAdminClient,
  createAnonClient,
  createTestCompanyUser,
  createAuthenticatedClient,
  cleanupTestUsers,
  generateTestEmail,
} from "./helpers/test-client";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("[REAL INTEGRATION] 03 - PostgreSQL Row Level Security (RLS) Multi-tenant Isolation", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();
  const anonClient = createAnonClient();

  let companyAUser: { id: string; email: string; companyName: string };
  let companyBUser: { id: string; email: string; companyName: string };

  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  let employeeAId: string;
  let employeeBId: string;
  let invitationAId: string;
  let invitationBId: string;

  const passwordA = "CompA-Pass-2026!";
  const passwordB = "CompB-Pass-2026!";

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Create two separate real companies in Supabase Auth & PostgreSQL
    companyAUser = await createTestCompanyUser({
      email: generateTestEmail("tenant-a"),
      password: passwordA,
      companyName: "Tenant Alpha Hoteles S.A.",
    });
    usersToCleanup.push(companyAUser.id);

    companyBUser = await createTestCompanyUser({
      email: generateTestEmail("tenant-b"),
      password: passwordB,
      companyName: "Tenant Beta Operadora S.A.",
    });
    usersToCleanup.push(companyBUser.id);

    // 2. Sign in to obtain real JWT-authenticated clients bound to PostgreSQL RLS
    const authA = await createAuthenticatedClient(companyAUser.email, passwordA);
    clientA = authA.client;

    const authB = await createAuthenticatedClient(companyBUser.email, passwordB);
    clientB = authB.client;

    // 3. Seed real records for Company A via Admin client
    const { data: empA } = await admin
      .from("company_employees")
      .insert({
        company_id: companyAUser.id,
        full_name: "Empleado Tenant A",
        job_title: "Gerente de Operaciones",
        status: "pending",
        base_salary_monthly: 45000,
        email: generateTestEmail("emp-a"),
      })
      .select()
      .single();
    employeeAId = empA!.id;

    const tokenA = crypto.randomBytes(32).toString("hex");
    const tokenHashA = crypto.createHash("sha256").update(tokenA).digest("hex");
    const { data: invA } = await admin
      .from("employee_invitations")
      .insert({
        company_id: companyAUser.id,
        employee_id: employeeAId,
        email: generateTestEmail("inv-a"),
        full_name: "Empleado Tenant A",
        position: "Gerente de Operaciones",
        status: "pending",
        token_hash: tokenHashA,
      })
      .select()
      .single();
    invitationAId = invA!.id;

    // 4. Seed real records for Company B via Admin client
    const { data: empB } = await admin
      .from("company_employees")
      .insert({
        company_id: companyBUser.id,
        full_name: "Empleado Tenant B",
        job_title: "Sommelier Principal",
        status: "pending",
        base_salary_monthly: 38000,
        email: generateTestEmail("emp-b"),
      })
      .select()
      .single();
    employeeBId = empB!.id;

    const tokenB = crypto.randomBytes(32).toString("hex");
    const tokenHashB = crypto.createHash("sha256").update(tokenB).digest("hex");
    const { data: invB } = await admin
      .from("employee_invitations")
      .insert({
        company_id: companyBUser.id,
        employee_id: employeeBId,
        email: generateTestEmail("inv-b"),
        full_name: "Empleado Tenant B",
        position: "Sommelier Principal",
        status: "pending",
        token_hash: tokenHashB,
      })
      .select()
      .single();
    invitationBId = invB!.id;
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  it("should restrict company_employees list queries strictly to the authenticated tenant", async () => {
    // Company A queries company_employees
    const { data: dataA, error: errA } = await clientA
      .from("company_employees")
      .select("id, company_id, full_name");

    expect(errA).toBeNull();
    expect(dataA).toBeDefined();
    // Company A sees its own employee
    expect(dataA!.some((e) => e.id === employeeAId)).toBe(true);
    // Company A CANNOT see Company B's employee
    expect(dataA!.some((e) => e.id === employeeBId)).toBe(false);
    // All returned records belong strictly to Company A
    expect(dataA!.every((e) => e.company_id === companyAUser.id)).toBe(true);

    // Company B queries company_employees
    const { data: dataB, error: errB } = await clientB
      .from("company_employees")
      .select("id, company_id, full_name");

    expect(errB).toBeNull();
    expect(dataB).toBeDefined();
    expect(dataB!.some((e) => e.id === employeeBId)).toBe(true);
    expect(dataB!.some((e) => e.id === employeeAId)).toBe(false);
    expect(dataB!.every((e) => e.company_id === companyBUser.id)).toBe(true);
  });

  it("should restrict employee_invitations list queries strictly to the authenticated tenant", async () => {
    // Company A queries employee_invitations
    const { data: dataA, error: errA } = await clientA
      .from("employee_invitations")
      .select("id, company_id, full_name");

    expect(errA).toBeNull();
    expect(dataA).toBeDefined();
    expect(dataA!.some((i) => i.id === invitationAId)).toBe(true);
    expect(dataA!.some((i) => i.id === invitationBId)).toBe(false);
    expect(dataA!.every((i) => i.company_id === companyAUser.id)).toBe(true);

    // Company B queries employee_invitations
    const { data: dataB, error: errB } = await clientB
      .from("employee_invitations")
      .select("id, company_id, full_name");

    expect(errB).toBeNull();
    expect(dataB).toBeDefined();
    expect(dataB!.some((i) => i.id === invitationBId)).toBe(true);
    expect(dataB!.some((i) => i.id === invitationAId)).toBe(false);
    expect(dataB!.every((i) => i.company_id === companyBUser.id)).toBe(true);
  });

  it("should prevent direct SELECT by ID on another tenant's record (zero row leakage)", async () => {
    // Company A attempts direct SELECT on Company B's employee
    const { data: directEmp, error: empErr } = await clientA
      .from("company_employees")
      .select("*")
      .eq("id", employeeBId)
      .maybeSingle();

    expect(empErr).toBeNull();
    expect(directEmp).toBeNull();

    // Company A attempts direct SELECT on Company B's invitation
    const { data: directInv, error: invErr } = await clientA
      .from("employee_invitations")
      .select("*")
      .eq("id", invitationBId)
      .maybeSingle();

    expect(invErr).toBeNull();
    expect(directInv).toBeNull();
  });

  it("should silently reject cross-tenant UPDATE attempts via RLS (0 rows modified)", async () => {
    // Company A attempts to UPDATE Company B's employee
    const { data: updatedEmp, error: updateEmpErr } = await clientA
      .from("company_employees")
      .update({ job_title: "HACKED TITLE BY TENANT A" })
      .eq("id", employeeBId)
      .select();

    expect(updateEmpErr).toBeNull();
    // PostgREST returns empty array when RLS prevents row update
    expect(updatedEmp).toEqual([]);

    // Verify employee B was NOT modified in PostgreSQL
    const { data: checkEmp } = await admin
      .from("company_employees")
      .select("job_title")
      .eq("id", employeeBId)
      .single();
    expect(checkEmp?.job_title).toBe("Sommelier Principal");

    // Company A attempts to UPDATE Company B's invitation
    const { data: updatedInv, error: updateInvErr } = await clientA
      .from("employee_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationBId)
      .select();

    expect(updateInvErr).toBeNull();
    expect(updatedInv).toEqual([]);

    // Verify invitation B was NOT modified in PostgreSQL
    const { data: checkInv } = await admin
      .from("employee_invitations")
      .select("status")
      .eq("id", invitationBId)
      .single();
    expect(checkInv?.status).toBe("pending");
  });

  it("should silently reject cross-tenant DELETE attempts via RLS (0 rows affected)", async () => {
    // Company A attempts to DELETE Company B's employee
    const { data: deletedEmp, error: delEmpErr } = await clientA
      .from("company_employees")
      .delete()
      .eq("id", employeeBId)
      .select();

    expect(delEmpErr).toBeNull();
    expect(deletedEmp).toEqual([]);

    // Verify employee B still exists in PostgreSQL
    const { data: checkEmp } = await admin
      .from("company_employees")
      .select("id")
      .eq("id", employeeBId)
      .maybeSingle();
    expect(checkEmp).not.toBeNull();
    expect(checkEmp?.id).toBe(employeeBId);

    // Company A attempts to DELETE Company B's invitation
    const { data: deletedInv, error: delInvErr } = await clientA
      .from("employee_invitations")
      .delete()
      .eq("id", invitationBId)
      .select();

    expect(delInvErr).toBeNull();
    expect(deletedInv).toEqual([]);

    // Verify invitation B still exists in PostgreSQL
    const { data: checkInv } = await admin
      .from("employee_invitations")
      .select("id")
      .eq("id", invitationBId)
      .maybeSingle();
    expect(checkInv).not.toBeNull();
    expect(checkInv?.id).toBe(invitationBId);
  });

  it("should block unauthenticated (anonymous) access to employee and invitation records", async () => {
    // Anonymous SELECT on company_employees
    const { data: anonEmp, error: anonEmpErr } = await anonClient
      .from("company_employees")
      .select("id, full_name");

    // Anon either receives empty array or RLS rejection
    if (!anonEmpErr) {
      expect(anonEmp).toEqual([]);
    } else {
      expect(anonEmpErr).toBeDefined();
    }

    // Anonymous SELECT on employee_invitations
    const { data: anonInv, error: anonInvErr } = await anonClient
      .from("employee_invitations")
      .select("id, email");

    if (!anonInvErr) {
      expect(anonInv).toEqual([]);
    } else {
      expect(anonInvErr).toBeDefined();
    }

    // Anonymous INSERT into employee_invitations must be rejected
    const dummyTokenHash = crypto.randomBytes(32).toString("hex");
    const { error: anonInsertErr } = await anonClient.from("employee_invitations").insert({
      company_id: companyAUser.id,
      email: generateTestEmail("anon-exploit"),
      full_name: "Exploit User",
      position: "Hacker",
      token_hash: dummyTokenHash,
    });

    expect(anonInsertErr).not.toBeNull();
  });
});
