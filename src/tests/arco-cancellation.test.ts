import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

vi.mock("server-only", () => ({}));

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureLiveSupabase,
  getAdminClient,
  createTestCandidateUser,
  createTestCompanyUser,
  createAuthenticatedClient,
  cleanupTestUsers,
  generateTestEmail,
} from "./integration/helpers/test-client";

// Module-level client holder for Server Actions mocking
let currentServerSupabaseClient: SupabaseClient;

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => currentServerSupabaseClient),
}));

import { requestAccountDeletionAction } from "@/modules/account/actions/account-actions";

describe("[REAL INTEGRATION] ARCO Account Cancellation & Audit Ledger", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();

  let testUser: { id: string; email: string; fullName: string };
  const password = "ArcoTestPassword123!";

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Create a real candidate user in Supabase Auth
    testUser = await createTestCandidateUser({
      email: generateTestEmail("arco-candidate"),
      password,
      fullName: "Candidato ARCO Para Cancelar",
    });
    usersToCleanup.push(testUser.id);

    // 2. Insert candidate private profile PII (RFC / CURP)
    await admin.from("candidate_private_profiles").upsert({
      id: testUser.id,
      rfc: "PEBR950515XYZ",
      curp: "PEBR950515HQRNNN01",
      birth_date: "1995-05-15",
    });

    // 3. Authenticate client
    const auth = await createAuthenticatedClient(testUser.email, password);
    currentServerSupabaseClient = auth.client;
  });

  afterAll(async () => {
    if (usersToCleanup.length > 0) {
      await admin
        .from("company_profiles")
        .delete()
        .in("owner_id", usersToCleanup);
      await admin
        .from("company_profiles")
        .delete()
        .in("id", usersToCleanup);
    }
    await cleanupTestUsers(usersToCleanup);
  });

  it("should process ARCO cancellation, record in arco_requests audit ledger, and anonymize user PII in PostgreSQL", async () => {
    const reasonText = "Solicitud formal de cancelación de datos personales LFPDPPP.";

    // 1. Execute Server Action
    const result = await requestAccountDeletionAction(reasonText);
    if (!result.success) {
      console.error("Action failure details:", result.error);
    }

    expect(result.success).toBe(true);
    expect(result.message).toContain("cancelada");

    // 2. Verify audit ledger entry in arco_requests
    const { data: arcoRecord, error: arcoErr } = await admin
      .from("arco_requests")
      .select("*")
      .eq("user_email", testUser.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    expect(arcoErr).toBeNull();
    expect(arcoRecord).not.toBeNull();
    expect(arcoRecord?.request_type).toBe("cancellation");
    expect(arcoRecord?.status).toBe("completed");
    expect(arcoRecord?.reason).toBe(reasonText);

    // 3. Verify profiles table state: marked suspended / PENDING_DELETION and PII anonymized
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", testUser.id)
      .single();

    expect(profile?.status).toBe("suspended");
    expect(profile?.location).toBe("PENDING_DELETION");
    expect(profile?.is_verified).toBe(false);
    expect(profile?.full_name).toBe("Usuario Eliminado (ARCO)");
    expect(profile?.whatsapp_number ?? "").toBe("");

    // 4. Verify candidate private PII is deleted
    const { data: privateProfile } = await admin
      .from("candidate_private_profiles")
      .select("*")
      .eq("id", testUser.id)
      .maybeSingle();

    expect(privateProfile).toBeNull();

    // 5. Verify user is banned / deactivated in Auth
    const { data: authUser } = await admin.auth.admin.getUserById(testUser.id);
    expect(authUser?.user?.banned_until).not.toBeNull();
  });

  it("should anonymize multi-company profile, close active vacancies, remove memberships, and ban owner on ARCO deletion", async () => {
    const companyUser = await createTestCompanyUser({
      email: generateTestEmail("arco-company"),
      password,
      companyName: "Empresa Multi ARCO QA",
    });
    usersToCleanup.push(companyUser.id);

    const { data: ownedCompany, error: compInsertErr } = await admin
      .from("company_profiles")
      .insert({
        owner_id: companyUser.id,
        company_name: "Cafetería ARCO QA",
        rfc: "CAQ240101AB1",
        fiscal_address: "Mérida, Yucatán",
        industry: "Alimentos y Bebidas",
        contact_phone: "9991112233",
        corporate_email: companyUser.email,
        legal_rep_name: "Lic. QA ARCO",
      })
      .select("id")
      .single();

    expect(compInsertErr).toBeNull();
    expect(ownedCompany?.id).toBeTruthy();

    await admin.from("company_members").insert({
      company_id: ownedCompany!.id,
      user_id: companyUser.id,
      role: "owner",
    });

    const { data: activeVacancy, error: vacErr } = await admin
      .from("vacancies")
      .insert({
        company_id: ownedCompany!.id,
        recruiter_id: companyUser.id,
        title: "Barista ARCO QA",
        description: "Vacante temporal de prueba ARCO",
        category: "Alimentos y Bebidas",
        zone: "Centro Mérida",
        location: "Mérida",
        employment_type: "Tiempo Completo",
        is_active: true,
        status: "Activa",
      })
      .select("id")
      .single();

    expect(vacErr).toBeNull();

    const companyAuth = await createAuthenticatedClient(companyUser.email, password);
    currentServerSupabaseClient = companyAuth.client;

    const result = await requestAccountDeletionAction("Cierre definitivo empresa QA.");
    expect(result.success).toBe(true);

    const { data: anonymizedComp } = await admin
      .from("company_profiles")
      .select("company_name, verification_status, contact_phone, corporate_email, legal_rep_name")
      .eq("id", ownedCompany!.id)
      .single();

    expect(anonymizedComp?.company_name).toBe("Empresa Eliminada (ARCO)");
    expect(anonymizedComp?.verification_status).toBe("rejected");
    expect(anonymizedComp?.contact_phone).toBeNull();
    expect(anonymizedComp?.corporate_email).toBeNull();
    expect(anonymizedComp?.legal_rep_name).toBeNull();

    const { data: closedVac } = await admin
      .from("vacancies")
      .select("is_active, status")
      .eq("id", activeVacancy!.id)
      .single();

    expect(closedVac?.is_active).toBe(false);
    expect(closedVac?.status).toBe("Cerrada");

    const { count: remainingMemberships } = await admin
      .from("company_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", companyUser.id);

    expect(remainingMemberships).toBe(0);

    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("status, whatsapp_number, full_name")
      .eq("id", companyUser.id)
      .single();

    expect(ownerProfile?.status).toBe("suspended");
    expect(ownerProfile?.whatsapp_number ?? "").toBe("");
    expect(ownerProfile?.full_name).toBe("Usuario Eliminado (ARCO)");
  });
});
