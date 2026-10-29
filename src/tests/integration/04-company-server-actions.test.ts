import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureLiveSupabase,
  getAdminClient,
  createTestCompanyUser,
  createTestCandidateUser,
  createAuthenticatedClient,
  cleanupTestUsers,
  generateTestEmail,
} from "./helpers/test-client";

// Module-level client holder for Server Actions mocking
let currentServerSupabaseClient: SupabaseClient;

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => currentServerSupabaseClient),
}));

// Import real server actions AFTER mocks are set up
import {
  getInvitationByTokenAction,
  acceptEmployeeInvitationAction,
  resendEmployeeInvitationAction,
  cancelEmployeeInvitationAction,
} from "@/modules/company/actions/employees";

describe("[REAL INTEGRATION] 04 - Employee Server Actions with Real PostgreSQL", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();

  let testCompany: { id: string; email: string; companyName: string };
  let testCandidate: { id: string; email: string; fullName: string };
  let companyClient: SupabaseClient;

  const password = "ServerActionsPass123!";

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Create real test company
    testCompany = await createTestCompanyUser({
      email: generateTestEmail("actions-company"),
      password,
      companyName: "Riviera Hospitality Group",
    });
    usersToCleanup.push(testCompany.id);

    // 2. Authenticate company to get client for server actions
    const auth = await createAuthenticatedClient(testCompany.email, password);
    companyClient = auth.client;
    currentServerSupabaseClient = companyClient;

    // 3. Create real test candidate
    testCandidate = await createTestCandidateUser({
      email: generateTestEmail("actions-candidate"),
      fullName: "Roberto Palazuelos",
    });
    usersToCleanup.push(testCandidate.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  describe("getInvitationByTokenAction", () => {
    it("should retrieve valid invitation details by token hash from PostgreSQL", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const candidateEmail = generateTestEmail("token-valid");

      const { data: inv } = await admin
        .from("employee_invitations")
        .insert({
          company_id: testCompany.id,
          email: candidateEmail,
          full_name: "Roberto Palazuelos",
          position: "Capitán de Meseros",
          salary: 22000,
          status: "sent",
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      const result = await getInvitationByTokenAction(rawToken);

      expect(result.status).toBe("valid");
      if (result.status === "valid") {
        expect(result.invitation.id).toBe(inv!.id);
        expect(result.invitation.email).toBe(candidateEmail);
        expect(result.invitation.position).toBe("Capitán de Meseros");
        expect(result.invitation.company_profiles).toBeDefined();
      }
    });

    it("should return not_found for non-existent token", async () => {
      const nonExistentToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const result = await getInvitationByTokenAction(nonExistentToken);

      expect(result.status).toBe("not_found");
    });

    it("should return invalid for tokens shorter than 10 chars", async () => {
      const shortToken = "short";
      const result = await getInvitationByTokenAction(shortToken);

      expect(result.status).toBe("invalid");
    });

    it("should return expired status when invitation is expired in PostgreSQL", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await admin.from("employee_invitations").insert({
        company_id: testCompany.id,
        email: generateTestEmail("expired-token"),
        full_name: "Usuario Expirado",
        position: "Auxiliar",
        status: "pending",
        token_hash: tokenHash,
        expires_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const result = await getInvitationByTokenAction(rawToken);
      expect(result.status).toBe("expired");
    });

    it("should return cancelled status when invitation is marked cancelled in PostgreSQL", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await admin.from("employee_invitations").insert({
        company_id: testCompany.id,
        email: generateTestEmail("cancelled-token"),
        full_name: "Usuario Cancelado",
        position: "Auxiliar",
        status: "cancelled",
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const result = await getInvitationByTokenAction(rawToken);
      expect(result.status).toBe("cancelled");
    });

    it("should return already_accepted status when invitation was previously accepted", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await admin.from("employee_invitations").insert({
        company_id: testCompany.id,
        email: generateTestEmail("already-accepted"),
        full_name: "Usuario Ya Aceptado",
        position: "Auxiliar",
        status: "accepted",
        token_hash: tokenHash,
        accepted_at: new Date().toISOString(),
      });

      const result = await getInvitationByTokenAction(rawToken);
      expect(result.status).toBe("already_accepted");
    });
  });

  describe("acceptEmployeeInvitationAction", () => {
    it("should accept invitation, link company_employees, and update status in PostgreSQL", async () => {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const candidateEmail = testCandidate.email;

      // 1. Create employee in company_employees
      const { data: employee } = await admin
        .from("company_employees")
        .insert({
          company_id: testCompany.id,
          full_name: testCandidate.fullName,
          job_title: "Gerente de A&B",
          status: "pending",
          email: candidateEmail,
        })
        .select()
        .single();

      // 2. Create invitation
      const { data: invitation } = await admin
        .from("employee_invitations")
        .insert({
          company_id: testCompany.id,
          employee_id: employee!.id,
          email: candidateEmail,
          full_name: testCandidate.fullName,
          position: "Gerente de A&B",
          status: "sent",
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      // 3. Authenticate as candidate to execute Server Action under candidate session
      const candidateAuth = await createAuthenticatedClient(candidateEmail, "TestPassword123!");
      currentServerSupabaseClient = candidateAuth.client;

      const result = await acceptEmployeeInvitationAction({
        rawToken,
        userId: testCandidate.id,
        email: candidateEmail,
      });

      // Restore company client for subsequent company-level tests
      currentServerSupabaseClient = companyClient;

      expect(result.success).toBe(true);

      // 4. Verify in PostgreSQL
      const { data: checkInv } = await admin
        .from("employee_invitations")
        .select("*")
        .eq("id", invitation!.id)
        .single();
      expect(checkInv?.status).toBe("accepted");
      expect(checkInv?.accepted_at).not.toBeNull();

      const { data: checkEmp } = await admin
        .from("company_employees")
        .select("*")
        .eq("id", employee!.id)
        .single();
      expect(checkEmp?.status).toBe("active");
      expect(checkEmp?.employee_id).toBe(testCandidate.id);

      // 5. Test idempotency: Accepting again should succeed gracefully
      const secondResult = await acceptEmployeeInvitationAction({
        rawToken,
        userId: testCandidate.id,
        email: candidateEmail,
      });
      expect(secondResult.success).toBe(true);
      expect(secondResult.message).toContain("ya aceptada previamente");
    });
  });

  describe("resendEmployeeInvitationAction & cancelEmployeeInvitationAction", () => {
    it("should resend invitation with a new token and extended expiry in PostgreSQL", async () => {
      const oldRawToken = crypto.randomBytes(32).toString("hex");
      const oldTokenHash = crypto.createHash("sha256").update(oldRawToken).digest("hex");

      const { data: inv } = await admin
        .from("employee_invitations")
        .insert({
          company_id: testCompany.id,
          email: generateTestEmail("resend-test"),
          full_name: "Empleado Resend",
          position: "Hostess",
          status: "pending",
          token_hash: oldTokenHash,
          expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      // Ensure server action runs as the company user
      currentServerSupabaseClient = companyClient;

      const resendResult = await resendEmployeeInvitationAction(inv!.id);
      expect(resendResult.success).toBe(true);
      expect(resendResult.rawToken).toBeDefined();

      // Verify in PostgreSQL: token_hash was updated and status became 'sent'
      const { data: checkInv } = await admin
        .from("employee_invitations")
        .select("*")
        .eq("id", inv!.id)
        .single();

      expect(checkInv?.status).toBe("sent");
      expect(checkInv?.token_hash).not.toBe(oldTokenHash);
      const newCalculatedHash = crypto
        .createHash("sha256")
        .update(resendResult.rawToken!)
        .digest("hex");
      expect(checkInv?.token_hash).toBe(newCalculatedHash);
    });

    it("should cancel invitation and terminate pending employee record in PostgreSQL", async () => {
      // 1. Create employee
      const { data: employee } = await admin
        .from("company_employees")
        .insert({
          company_id: testCompany.id,
          full_name: "Empleado To Cancel",
          job_title: "Recepcionista",
          status: "pending",
          email: generateTestEmail("cancel-emp"),
        })
        .select()
        .single();

      // 2. Create invitation
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const { data: inv } = await admin
        .from("employee_invitations")
        .insert({
          company_id: testCompany.id,
          employee_id: employee!.id,
          email: generateTestEmail("cancel-inv"),
          full_name: "Empleado To Cancel",
          position: "Recepcionista",
          status: "pending",
          token_hash: tokenHash,
        })
        .select()
        .single();

      // 3. Cancel via Server Action
      currentServerSupabaseClient = companyClient;
      const cancelResult = await cancelEmployeeInvitationAction(inv!.id);
      expect(cancelResult.success).toBe(true);

      // 4. Verify in PostgreSQL
      const { data: checkInv } = await admin
        .from("employee_invitations")
        .select("*")
        .eq("id", inv!.id)
        .single();
      expect(checkInv?.status).toBe("cancelled");

      const { data: checkEmp } = await admin
        .from("company_employees")
        .select("*")
        .eq("id", employee!.id)
        .single();
      expect(checkEmp?.status).toBe("terminated");
      expect(checkEmp?.termination_reason).toContain("cancelada");
    });
  });
});
