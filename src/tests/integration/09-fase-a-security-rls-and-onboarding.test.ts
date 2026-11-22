import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  ensureLiveSupabase,
  getAdminClient,
  createAnonClient,
  createAuthenticatedClient,
  createTestCompanyUser,
  createTestCandidateUser,
  cleanupTestUsers,
  generateTestEmail,
} from "./helpers/test-client";
import { companyTenantService } from "@/modules/company/services/company-tenant.service";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import { CompanyDocumentAccessService } from "@/modules/company/services/company-document-access";

/**
 * Fase A — Integration Security Tests against real local PostgreSQL & RLS
 * Verifies #1–#4 fixes AND legitimate new-company onboarding against local Supabase.
 */
describe("Integration: Fase A — Seguridad Multi-Empresa, CURP/RFC/Docs, Invitaciones y Onboarding", () => {
  const admin = getAdminClient() as unknown as SupabaseClient<Database>;
  const createdUserIds: string[] = [];

  let victimCompanyOwner: { id: string; email: string; companyName: string };
  let victimCompanyClient: SupabaseClient<Database>;

  let attackerCandidate: { id: string; email: string; fullName: string };
  let attackerClient: SupabaseClient<Database>;

  let applicantCandidate: { id: string; email: string; fullName: string };
  let applicantClient: SupabaseClient<Database>;

  let onboardingCompanyUserId: string;
  let onboardingClient: SupabaseClient<Database>;
  const createdExtraCompanyIds: string[] = [];

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Empresa víctima (con handle_new_user creando company_profiles + company_members owner)
    victimCompanyOwner = await createTestCompanyUser({
      email: generateTestEmail("fasea-victim-co"),
      companyName: "Empresa Víctima Fase A S.A.",
    });
    createdUserIds.push(victimCompanyOwner.id);
    const victimAuth = await createAuthenticatedClient(victimCompanyOwner.email);
    victimCompanyClient = victimAuth.client as unknown as SupabaseClient<Database>;

    // 2. Usuario ajeno / atacante (candidato)
    attackerCandidate = await createTestCandidateUser({
      email: generateTestEmail("fasea-attacker"),
      fullName: "Atacante Externo",
    });
    createdUserIds.push(attackerCandidate.id);
    const attackerAuth = await createAuthenticatedClient(attackerCandidate.email);
    attackerClient = attackerAuth.client as unknown as SupabaseClient<Database>;

    // 3. Candidato postulante con documentos privados (cv, curp, rfc, ine)
    applicantCandidate = await createTestCandidateUser({
      email: generateTestEmail("fasea-applicant"),
      fullName: "Candidato Postulante",
    });
    createdUserIds.push(applicantCandidate.id);
    const applicantAuth = await createAuthenticatedClient(applicantCandidate.email);
    applicantClient = applicantAuth.client as unknown as SupabaseClient<Database>;

    // 4. Usuario recién registrado con role=company SIN company_name (flujo real de onboarding)
    const onboardingEmail = generateTestEmail("fasea-onboarding-co");
    const { data: onboardUser, error: onboardErr } = await admin.auth.admin.createUser({
      email: onboardingEmail,
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: {
        role: "company",
        full_name: "Titular Onboarding Legítimo",
      },
    });
    if (onboardErr || !onboardUser.user) {
      throw new Error(`No se pudo crear usuario de onboarding: ${onboardErr?.message}`);
    }
    onboardingCompanyUserId = onboardUser.user.id;
    createdUserIds.push(onboardingCompanyUserId);
    const onboardingAuth = await createAuthenticatedClient(onboardingEmail);
    onboardingClient = onboardingAuth.client as unknown as SupabaseClient<Database>;
  }, 30000);

  afterAll(async () => {
    for (const cid of createdExtraCompanyIds) {
      await admin.from("company_profiles").delete().eq("id", cid);
    }
    await cleanupTestUsers(createdUserIds);
  }, 30000);

  // =========================================================================
  // #1: company_members RLS & company_profiles INSERT RLS + Onboarding legítimo
  // =========================================================================
  describe("#1 RLS de company_members, company_profiles y onboarding legítimo", () => {
    it("Bloquea a un usuario ajeno que intenta autoinsertarse como owner de otra empresa en company_members", async () => {
      const { error } = await attackerClient.from("company_members").insert({
        company_id: victimCompanyOwner.id,
        user_id: attackerCandidate.id,
        role: "owner",
      });

      expect(error).not.toBeNull();

      // Confirmar que no hubo cambios en BD
      const { data: members } = await admin
        .from("company_members")
        .select("*")
        .eq("company_id", victimCompanyOwner.id)
        .eq("user_id", attackerCandidate.id);
      expect(members).toEqual([]);
    });

    it("Bloquea INSERT en company_profiles con owner_id ajeno", async () => {
      const { error } = await attackerClient.from("company_profiles").insert({
        company_name: "Empresa Suplantada",
        rfc: "XAXX010101000",
        fiscal_address: "Mérida, Yucatán",
        industry: "General",
        owner_id: victimCompanyOwner.id,
      });

      expect(error).not.toBeNull();
    });

    it("Confirma que el onboarding legítimo de una empresa nueva sigue funcionando de extremo a extremo", async () => {
      const created = await companyTenantService.createCompany(
        onboardingCompanyUserId,
        {
          company_name: "Hotel Legítimo Onboarding",
          industry: "Hotelería",
          location: "Mérida, Yucatán",
          rfc: "HLO260101ABC",
        },
        onboardingClient
      );

      expect(created.companyId).toBeTruthy();
      expect(created.companyName).toBe("Hotel Legítimo Onboarding");
      createdExtraCompanyIds.push(created.companyId);

      // Verificar membresía como owner y lectura del perfil propio
      const role = await companyTenantService.verifyUserMembership(
        onboardingCompanyUserId,
        created.companyId,
        onboardingClient
      );
      expect(role).toBe("owner");

      const companies = await companyTenantService.getUserCompanies(
        onboardingCompanyUserId,
        onboardingClient
      );
      expect(companies.some((c) => c.companyId === created.companyId)).toBe(true);
    });
  });

  // =========================================================================
  // #2: company_profiles RLS, company_directory, verifyUserMembership & cookie manipulada
  // =========================================================================
  describe("#2 Restricción de company_profiles, vista company_directory y cookie manipulada", () => {
    it("Impide que un ajeno lea company_profiles directamente pero mantiene pública company_directory", async () => {
      const { data: directProfile } = await attackerClient
        .from("company_profiles")
        .select("id, company_name, rfc")
        .eq("id", victimCompanyOwner.id)
        .maybeSingle();

      expect(directProfile).toBeNull();

      // La vista pública company_directory sigue accesible para anon y authenticated
      const anonClient = createAnonClient() as unknown as SupabaseClient<Database>;
      const { data: dirRow, error: dirErr } = await anonClient
        .from("company_directory")
        .select("id, company_name, industry")
        .eq("id", victimCompanyOwner.id)
        .maybeSingle();

      expect(dirErr).toBeNull();
      expect(dirRow?.company_name).toBe("Empresa Víctima Fase A S.A.");
    });

    it("verifyUserMembership y resolveAuthorizedCompanyScope rechazan cookie kanpro_active_company manipulada", async () => {
      const role = await companyTenantService.verifyUserMembership(
        attackerCandidate.id,
        victimCompanyOwner.id,
        attackerClient
      );
      expect(role).toBeNull();

      const scope = await companyTenantService.resolveAuthorizedCompanyScope(
        attackerCandidate.id,
        attackerClient,
        ["owner", "admin"],
        victimCompanyOwner.id
      );
      expect(scope).toBeNull();
    });
  });

  // =========================================================================
  // #3: RLS de profile_documents, hireCandidate y getAuthorizedCandidateDocuments
  // =========================================================================
  describe("#3 RLS de profile_documents y protección de CURP/RFC", () => {
    it("Cierra profile_documents a solo CV para postulantes y solo doc_type aprobado tras solicitud vigente", async () => {
      // Sembrar vacante, postulación y documentos privados del candidato
      const { data: vacancy, error: vacErr } = await admin
        .from("vacancies")
        .insert({
          company_id: victimCompanyOwner.id,
          recruiter_id: victimCompanyOwner.id,
          title: "Recepcionista Fase A",
          description: "Atención a huéspedes",
          category: "Hotelería",
          employment_type: "Tiempo Completo",
          zone: "Centro",
          modality: "Presencial",
          location: "Mérida",
          status: "Activa",
          is_active: true,
        })
        .select("id")
        .single();
      expect(vacErr).toBeNull();

      const { data: application, error: appErr } = await admin
        .from("applications")
        .insert({
          vacancy_id: vacancy!.id,
          candidate_id: applicantCandidate.id,
          status: "En revisión",
        })
        .select("id")
        .single();
      expect(appErr).toBeNull();

      await admin.from("candidate_private_profiles").upsert({
        id: attackerCandidate.id,
        curp: "ATAC900101HYNXXX01",
        rfc: "ATAC900101XXX",
      });

      await admin.from("profile_documents").insert([
        {
          owner_id: applicantCandidate.id,
          doc_type: "cv",
          file_name: "cv.pdf",
          file_url: `${applicantCandidate.id}/cv.pdf`,
          status: "approved",
        },
        {
          owner_id: applicantCandidate.id,
          doc_type: "curp",
          file_name: "curp.pdf",
          file_url: `${applicantCandidate.id}/curp.pdf`,
          status: "approved",
        },
        {
          owner_id: applicantCandidate.id,
          doc_type: "ine_passport",
          file_name: "ine.pdf",
          file_url: `${applicantCandidate.id}/ine.pdf`,
          status: "approved",
        },
      ]);

      // 1. Antes de aprobación: empresa solo ve CV por RLS
      const { data: beforeApproval } = await victimCompanyClient
        .from("profile_documents")
        .select("doc_type")
        .eq("owner_id", applicantCandidate.id);
      expect((beforeApproval || []).map((d) => d.doc_type)).toEqual(["cv"]);

      // 2. hireCandidate con candidateId suplantado falla sin tocar BD ni robar CURP/RFC
      await expect(
        CompanyEmployeeService.hireCandidate(
          victimCompanyClient,
          victimCompanyOwner.id,
          {
            applicationId: application!.id,
            candidateId: attackerCandidate.id,
            jobTitle: "Recepcionista",
            department: "Recepción",
            templateType: "indeterminado",
            startDate: "2026-11-22",
            salary: 14000,
            paymentFrequency: "quincenal",
          },
          admin
        )
      ).rejects.toThrow(/no corresponde a la postulación/i);

      const { data: empAfterFailedHire } = await admin
        .from("company_employees")
        .select("id")
        .eq("company_id", victimCompanyOwner.id)
        .eq("employee_id", attackerCandidate.id);
      expect(empAfterFailedHire).toEqual([]);

      // 3. Tras aprobar solo ['curp']: empresa ve CV + curp, nunca ine
      const { data: reqRow } = await admin
        .from("document_access_requests")
        .insert({
          company_id: victimCompanyOwner.id,
          candidate_id: applicantCandidate.id,
          application_id: application!.id,
          requested_documents: ["curp"],
          status: "pending",
        })
        .select("id")
        .single();

      await CompanyDocumentAccessService.respondDocumentAccess(
        applicantClient,
        applicantCandidate.id,
        { requestId: reqRow!.id, status: "approved" }
      );

      const { data: afterApproval } = await victimCompanyClient
        .from("profile_documents")
        .select("doc_type")
        .eq("owner_id", applicantCandidate.id);
      const visibleTypes = (afterApproval || []).map((d) => d.doc_type).sort();
      expect(visibleTypes).toEqual(["curp", "cv"]);

      // Servicio también filtra estrictamente por candidate_id + requested_documents
      const wrongCandDocs =
        await CompanyDocumentAccessService.getAuthorizedCandidateDocuments(
          victimCompanyClient,
          victimCompanyOwner.id,
          { applicationId: application!.id, candidateId: attackerCandidate.id }
        );
      expect(wrongCandDocs.authorized).toBe(false);
      expect(wrongCandDocs.documents).toEqual([]);

      const approvedDocs =
        await CompanyDocumentAccessService.getAuthorizedCandidateDocuments(
          victimCompanyClient,
          victimCompanyOwner.id,
          { applicationId: application!.id, candidateId: applicantCandidate.id }
        );
      expect(approvedDocs.authorized).toBe(true);
      expect(approvedDocs.documents.map((d) => d.doc_type)).toEqual(["curp"]);
    });
  });

  // =========================================================================
  // #4: Invitaciones (cancelled, expirada, email "%", cancelar aceptada)
  // =========================================================================
  describe("#4 Invitaciones en PostgreSQL real", () => {
    it("Bloquea aceptar invitación cancelada, expirada o con email '%' sin modificar BD", async () => {
      // Crear empleado activo existente en la empresa para verificar que email "%" NO lo sobrescribe
      const { data: bystanderEmp } = await admin
        .from("company_employees")
        .insert({
          company_id: victimCompanyOwner.id,
          full_name: "Empleado Activo Protegido",
          email: "protegido@empresa.local",
          job_title: "Chef",
          status: "active",
        })
        .select("id, employee_id, status")
        .single();

      // 1. Invitación cancelada
      const cancelledToken = crypto.randomBytes(32).toString("hex");
      const { data: cancelledInv } = await admin
        .from("employee_invitations")
        .insert({
          company_id: victimCompanyOwner.id,
          email: attackerCandidate.email,
          full_name: "Invitado Cancelado",
          position: "Auxiliar",
          status: "cancelled",
          token_hash: crypto.createHash("sha256").update(cancelledToken).digest("hex"),
          expires_at: new Date(Date.now() + 86400_000).toISOString(),
        })
        .select("id")
        .single();

      await expect(
        CompanyEmployeeService.acceptEmployeeInvitation(admin, {
          rawToken: cancelledToken,
          userId: attackerCandidate.id,
          email: attackerCandidate.email,
        })
      ).rejects.toThrow(/cancelada/i);

      const { data: cancelledCheck } = await admin
        .from("employee_invitations")
        .select("status")
        .eq("id", cancelledInv!.id)
        .single();
      expect(cancelledCheck?.status).toBe("cancelled");

      // 2. Invitación expirada
      const expiredToken = crypto.randomBytes(32).toString("hex");
      const { data: expiredInv } = await admin
        .from("employee_invitations")
        .insert({
          company_id: victimCompanyOwner.id,
          email: attackerCandidate.email,
          full_name: "Invitado Expirado",
          position: "Auxiliar",
          status: "sent",
          token_hash: crypto.createHash("sha256").update(expiredToken).digest("hex"),
          expires_at: new Date(Date.now() - 3600_000).toISOString(),
        })
        .select("id")
        .single();

      await expect(
        CompanyEmployeeService.acceptEmployeeInvitation(admin, {
          rawToken: expiredToken,
          userId: attackerCandidate.id,
          email: attackerCandidate.email,
        })
      ).rejects.toThrow(/expirado/i);

      const { data: expiredCheck } = await admin
        .from("employee_invitations")
        .select("status")
        .eq("id", expiredInv!.id)
        .single();
      expect(expiredCheck?.status).toBe("sent");

      // 3. Invitación vigente atacada con email "%"
      const wildcardToken = crypto.randomBytes(32).toString("hex");
      await admin.from("employee_invitations").insert({
        company_id: victimCompanyOwner.id,
        email: applicantCandidate.email,
        full_name: "Invitado Real",
        position: "Mesero",
        status: "sent",
        token_hash: crypto.createHash("sha256").update(wildcardToken).digest("hex"),
        expires_at: new Date(Date.now() + 86400_000).toISOString(),
      });

      await expect(
        CompanyEmployeeService.acceptEmployeeInvitation(admin, {
          rawToken: wildcardToken,
          userId: attackerCandidate.id,
          email: "%",
        })
      ).rejects.toThrow(/inválido/i);

      // Confirmar que el empleado bystander NO fue modificado
      const { data: bystanderCheck } = await admin
        .from("company_employees")
        .select("employee_id, status")
        .eq("id", bystanderEmp!.id)
        .single();
      expect(bystanderCheck?.employee_id).toBeNull();
      expect(bystanderCheck?.status).toBe("active");
    });

    it("Bloquea cancelar una invitación ya aceptada sin dar de baja al empleado activo", async () => {
      const validToken = crypto.randomBytes(32).toString("hex");

      const { data: empRow } = await admin
        .from("company_employees")
        .insert({
          company_id: victimCompanyOwner.id,
          full_name: applicantCandidate.fullName,
          email: applicantCandidate.email,
          job_title: "Hostess",
          status: "pending",
        })
        .select("id")
        .single();

      const { data: invRow } = await admin
        .from("employee_invitations")
        .insert({
          company_id: victimCompanyOwner.id,
          employee_id: empRow!.id,
          email: applicantCandidate.email,
          full_name: applicantCandidate.fullName,
          position: "Hostess",
          status: "sent",
          token_hash: crypto.createHash("sha256").update(validToken).digest("hex"),
          expires_at: new Date(Date.now() + 86400_000).toISOString(),
        })
        .select("id")
        .single();

      // 1. Aceptación legítima con correo coincidente
      const acceptRes = await CompanyEmployeeService.acceptEmployeeInvitation(admin, {
        rawToken: validToken,
        userId: applicantCandidate.id,
        email: applicantCandidate.email,
      });
      expect(acceptRes.success).toBe(true);

      // 2. Intentar cancelar la invitación ya aceptada -> debe fallar
      await expect(
        CompanyEmployeeService.cancelEmployeeInvitation(
          victimCompanyClient,
          victimCompanyOwner.id,
          invRow!.id
        )
      ).rejects.toThrow(/ya fue aceptada/i);

      // 3. Verificar que ni la invitación ni el empleado activo cambiaron
      const { data: invCheck } = await admin
        .from("employee_invitations")
        .select("status")
        .eq("id", invRow!.id)
        .single();
      expect(invCheck?.status).toBe("accepted");

      const { data: empCheck } = await admin
        .from("company_employees")
        .select("status, employee_id")
        .eq("id", empRow!.id)
        .single();
      expect(empCheck?.status).toBe("active");
      expect(empCheck?.employee_id).toBe(applicantCandidate.id);
    });
  });
});
