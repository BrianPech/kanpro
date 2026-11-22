import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
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
import { CompanyEvaluationsService } from "@/modules/company/services/company-evaluations";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import { getEmployeeDossierById } from "@/modules/company/services/company-dossier";
import { companyVerificationService } from "@/modules/company/services/company-verification";
import { executeWhatsAppConnection } from "@/hooks/use-connection";

let currentServerSupabaseClient: SupabaseClient<Database>;
let currentBrowserSupabaseClient: SupabaseClient<Database>;
let currentActiveCompanyCookie: string | undefined;

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "kanpro_active_company" && currentActiveCompanyCookie
        ? { value: currentActiveCompanyCookie }
        : undefined,
  })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => currentServerSupabaseClient),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => currentBrowserSupabaseClient),
}));

import { uploadDossierDocumentAction } from "@/modules/company/actions/dossier";
import { getCompanyVerificationServerData } from "@/modules/company/services/company-verification.server";

describe("[REAL INTEGRATION] 10 - Fase B Bloque 1 (#5, #8, Adiciones A, B, C) contra PostgreSQL y RLS reales", () => {
  const admin = getAdminClient() as unknown as SupabaseClient<Database>;
  const createdUserIds: string[] = [];
  const createdExtraCompanyIds: string[] = [];
  const uploadedProfileDocsPaths: string[] = [];
  const uploadedCompanyAssetsPaths: string[] = [];

  let ownerUser: { id: string; email: string; companyName: string };
  let ownerClient: SupabaseClient<Database>;
  let companyAId: string;
  let companyBId: string;

  let otherCompanyUser: { id: string; email: string; companyName: string };
  let otherCompanyClient: SupabaseClient<Database>;

  let employeeCandidate: { id: string; email: string; fullName: string };
  let inviteeCandidate: { id: string; email: string; fullName: string };
  let candidateViewer: { id: string; email: string; fullName: string };
  let candidateViewerClient: SupabaseClient<Database>;

  let companyAEmployeeRecordId: string;
  let companyAVacancyId: string;

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Owner con Empresa A (legacy id = ownerUser.id) + Empresa B (segundo tenant id != ownerUser.id)
    ownerUser = await createTestCompanyUser({
      email: generateTestEmail("faseb-owner"),
      companyName: "Empresa A Matriz S.A.",
    });
    createdUserIds.push(ownerUser.id);
    companyAId = ownerUser.id;

    const ownerAuth = await createAuthenticatedClient(ownerUser.email);
    ownerClient = ownerAuth.client as unknown as SupabaseClient<Database>;
    currentServerSupabaseClient = ownerClient;
    currentBrowserSupabaseClient = ownerClient;

    // Asegurar datos públicos de Empresa A para tests de Adición B
    await admin
      .from("company_profiles")
      .update({
        logo_url: "https://cdn.local/empresa-a-logo.png",
        contact_phone: "+52 (998) 765-4321",
        verification_status: "approved",
      })
      .eq("id", companyAId);

    // Crear Empresa B usando CompanyTenantService con sesión real de ownerClient
    const companyB = await companyTenantService.createCompany(
      ownerUser.id,
      {
        company_name: "Empresa B Sucursal Riviera",
        industry: "Hotelería",
        location: "Cancún, Quintana Roo",
        rfc: "EBS260101XYZ",
      },
      ownerClient
    );
    companyBId = companyB.companyId;
    createdExtraCompanyIds.push(companyBId);

    // 2. Empresa ajena para pruebas negativas
    otherCompanyUser = await createTestCompanyUser({
      email: generateTestEmail("faseb-other-co"),
      companyName: "Empresa Ajena C",
    });
    createdUserIds.push(otherCompanyUser.id);
    const otherAuth = await createAuthenticatedClient(otherCompanyUser.email);
    otherCompanyClient = otherAuth.client as unknown as SupabaseClient<Database>;

    // 3. Empleado de Empresa A y candidato invitado para Empresa B
    employeeCandidate = await createTestCandidateUser({
      email: generateTestEmail("faseb-emp-a"),
      fullName: "Empleado Expediente H1",
    });
    createdUserIds.push(employeeCandidate.id);

    inviteeCandidate = await createTestCandidateUser({
      email: generateTestEmail("faseb-invitee-b"),
      fullName: "Invitado Empresa B",
    });
    createdUserIds.push(inviteeCandidate.id);

    candidateViewer = await createTestCandidateUser({
      email: generateTestEmail("faseb-cand-view"),
      fullName: "Candidato Discovery",
    });
    createdUserIds.push(candidateViewer.id);
    const candAuth = await createAuthenticatedClient(candidateViewer.email);
    candidateViewerClient = candAuth.client as unknown as SupabaseClient<Database>;

    const { data: empRow, error: empErr } = await admin
      .from("company_employees")
      .insert({
        company_id: companyAId,
        employee_id: employeeCandidate.id,
        full_name: employeeCandidate.fullName,
        email: employeeCandidate.email,
        job_title: "Recepcionista",
        department: "Front Desk",
        status: "active",
      })
      .select("id")
      .single();
    if (empErr || !empRow) {
      throw new Error(`Error creando empleado de prueba: ${empErr?.message}`);
    }
    companyAEmployeeRecordId = empRow.id;

    // 4. Vacante activa de Empresa A SIN contact_phone directo (para probar fallback a company_directory)
    const { data: vacRow, error: vacErr } = await admin
      .from("vacancies")
      .insert({
        company_id: companyAId,
        recruiter_id: ownerUser.id,
        title: "Concierge Nocturno",
        description: "Atención a huéspedes VIP",
        category: "Hotelería",
        employment_type: "Tiempo Completo",
        zone: "Zona Hotelera",
        modality: "Presencial",
        location: "Cancún",
        contact_phone: null,
        status: "Activa",
        is_active: true,
      })
      .select("id")
      .single();
    if (vacErr || !vacRow) {
      throw new Error(`Error creando vacante de prueba: ${vacErr?.message}`);
    }
    companyAVacancyId = vacRow.id;
  }, 30000);

  afterAll(async () => {
    if (uploadedProfileDocsPaths.length > 0) {
      await admin.storage.from("profile_documents").remove(uploadedProfileDocsPaths);
    }
    if (uploadedCompanyAssetsPaths.length > 0) {
      await admin.storage.from("company_assets").remove(uploadedCompanyAssetsPaths);
    }
    for (const cid of createdExtraCompanyIds) {
      await admin.from("company_profiles").delete().eq("id", cid);
    }
    await cleanupTestUsers(createdUserIds);
  }, 30000);

  // =========================================================================
  // Adición A (H1) + Adición C (doc_type real): Dossier por RH contra RLS real
  // =========================================================================
  describe("Adición A (H1) & C: Subida de documentos al dossier por RH bajo RLS real", () => {
    it("Permite a RH subir documento al dossier del empleado contra Storage y profile_documents con RLS real y respeta doc_type", async () => {
      currentServerSupabaseClient = ownerClient;
      currentActiveCompanyCookie = companyAId;

      const pdfFile = new File(["%PDF-1.4 test dossier content"], "constancia_sat.pdf", {
        type: "application/pdf",
      });

      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("title", "Constancia Fiscal SAT");
      formData.append("docType", "rfc_sat");
      formData.append("employeeId", companyAEmployeeRecordId);
      formData.append("candidateId", employeeCandidate.id);

      const res = await uploadDossierDocumentAction(formData);
      expect(res.success).toBe(true);
      if (!res.success) return;

      expect(res.data.docType).toBe("rfc_sat");
      expect(res.data.fileUrl).toContain("token=");

      // Verificar fila real en BD (doc_type real, company_id real, ruta dossiers/{companyId}/...)
      const { data: dbDoc, error: dbErr } = await admin
        .from("profile_documents")
        .select("*")
        .eq("id", res.data.id)
        .single();
      expect(dbErr).toBeNull();
      expect(dbDoc?.doc_type).toBe("constancia_situacion_fiscal");
      expect(dbDoc?.company_id).toBe(companyAId);
      expect(dbDoc?.owner_id).toBe(employeeCandidate.id);
      expect(dbDoc?.file_url).toMatch(
        new RegExp(`^dossiers/${companyAId}/${employeeCandidate.id}/`)
      );
      if (dbDoc?.file_url) {
        uploadedProfileDocsPaths.push(dbDoc.file_url);
      }

      // Verificar visibilidad en getEmployeeDossierById usando únicamente el cliente RLS de la empresa (sin adminClient)
      const dossier = await getEmployeeDossierById(
        ownerClient,
        companyAEmployeeRecordId,
        companyAId
      );
      expect(dossier).not.toBeNull();
      const uploadedInDossier = dossier!.documents.find((d) => d.id === res.data.id);
      expect(uploadedInDossier).toBeDefined();
      expect(uploadedInDossier?.docType).toBe("rfc_sat");
      expect(uploadedInDossier?.fileUrl).toContain("token=");

      // Negativo: Empresa C ajena NO puede leer el documento ni subir a dossiers/{companyAId}/...
      const { data: otherVisible } = await otherCompanyClient
        .from("profile_documents")
        .select("id")
        .eq("id", res.data.id);
      expect(otherVisible).toEqual([]);

      const { error: crossUploadErr } = await otherCompanyClient.storage
        .from("profile_documents")
        .upload(
          `dossiers/${companyAId}/${employeeCandidate.id}/hack.pdf`,
          new File(["%PDF"], "hack.pdf", { type: "application/pdf" })
        );
      expect(crossUploadErr).not.toBeNull();
    });
  });

  // =========================================================================
  // Adición B: Pantallas de candidato con company_directory y teléfono sanitizado
  // =========================================================================
  describe("Adición B: Vistas de candidato leen company_directory y teléfono sanitizado", () => {
    it("Candidato ve 0 filas en company_profiles pero lee nombre, logo, verificación y contact_phone sanitizado en company_directory", async () => {
      // 1. company_profiles permanece cerrado al candidato
      const { data: blockedProfile } = await candidateViewerClient
        .from("company_profiles")
        .select("id, company_name")
        .eq("id", companyAId)
        .maybeSingle();
      expect(blockedProfile).toBeNull();

      // 2. company_directory expone campos públicos + contact_phone sanitizado a autenticados
      const { data: dirRow, error: dirErr } = await candidateViewerClient
        .from("company_directory")
        .select("id, company_name, logo_url, verification_status, contact_phone")
        .eq("id", companyAId)
        .maybeSingle();
      expect(dirErr).toBeNull();
      expect(dirRow?.company_name).toBe("Empresa A Matriz S.A.");
      expect(dirRow?.logo_url).toBe("https://cdn.local/empresa-a-logo.png");
      expect(dirRow?.verification_status).toBe("approved");
      expect(dirRow?.contact_phone).toBe("+529987654321");

      // 3. Anon NO recibe contact_phone en company_directory
      const anonClient = createAnonClient() as unknown as SupabaseClient<Database>;
      const { data: anonDirRow, error: anonDirErr } = await anonClient
        .from("company_directory")
        .select("id, company_name, contact_phone")
        .eq("id", companyAId)
        .maybeSingle();
      expect(anonDirErr).toBeNull();
      expect(anonDirRow?.company_name).toBe("Empresa A Matriz S.A.");
      expect(anonDirRow?.contact_phone).toBeNull();

      // 4. Join de vacante con company_directory (discovery / detalle) funciona para candidato
      const { data: vacWithCompany, error: vacJoinErr } = await candidateViewerClient
        .from("vacancies")
        .select("id, title, company:company_directory(id, company_name, logo_url, verification_status, contact_phone)")
        .eq("id", companyAVacancyId)
        .maybeSingle();
      expect(vacJoinErr).toBeNull();
      const embeddedComp = Array.isArray(vacWithCompany?.company)
        ? vacWithCompany?.company[0]
        : vacWithCompany?.company;
      expect(embeddedComp?.company_name).toBe("Empresa A Matriz S.A.");
      expect(embeddedComp?.logo_url).toBe("https://cdn.local/empresa-a-logo.png");
      expect(embeddedComp?.verification_status).toBe("approved");
      expect(embeddedComp?.contact_phone).toBe("+529987654321");

      // 5. executeWhatsAppConnection resuelve el teléfono de company_directory cuando vacante no tiene contact_phone
      const whatsappUrl = await executeWhatsAppConnection(
        candidateViewerClient as unknown as Parameters<typeof executeWhatsAppConnection>[0],
        {
          vacancyId: companyAVacancyId,
          initiatedBy: "candidate",
        }
      );
      expect(whatsappUrl).toContain("https://wa.me/529987654321");
    });
  });

  // =========================================================================
  // Punto #5: Multi-empresa (segunda empresa con companyBId !== ownerUser.id)
  // =========================================================================
  describe("Punto #5: Segunda empresa opera sin violar FKs (23503) ni sobrescribir archivos", () => {
    it("createEvaluation, createEmployeeInvitation, bulkImportEmployees y acceptEmployeeInvitation funcionan en Empresa B", async () => {
      expect(companyBId).not.toBe(ownerUser.id);

      // 1. createEvaluation con evaluator_id = ownerUser.id
      const evalRes = await CompanyEvaluationsService.createEvaluation(
        ownerClient,
        companyBId,
        {
          employeeName: "Colaborador B",
          period: "Q4 2026",
          evaluatorName: "Director General",
          evaluatorRole: "Dirección / RRHH",
          evaluatorRelation: "jefe_directo",
          potentialScore: 4,
          punctualityScore: 5,
          attendanceScore: 5,
          productivityScore: 5,
          teamworkScore: 4,
          customerServiceScore: 5,
          goalsScore: 5,
          strengths: ["Puntualidad"],
          growthAreas: [],
          status: "completada",
        },
        ownerUser.id
      );
      expect(evalRes.evaluationId).toBeTruthy();

      const { data: evalRow } = await admin
        .from("company_evaluations")
        .select("company_id, evaluator_id")
        .eq("id", evalRes.evaluationId)
        .single();
      expect(evalRow?.company_id).toBe(companyBId);
      expect(evalRow?.evaluator_id).toBe(ownerUser.id);

      // 2. createEmployeeInvitation con created_by = ownerUser.id
      const invRes = await CompanyEmployeeService.createEmployeeInvitation(
        ownerClient,
        companyBId,
        {
          full_name: inviteeCandidate.fullName,
          email: inviteeCandidate.email,
          position: "Supervisor B",
          salary: 18000,
          department: "Operaciones",
          contract_type: "tiempo_indeterminado",
        },
        ownerUser.id
      );
      expect(invRes.invitation.created_by).toBe(ownerUser.id);
      expect(invRes.invitation.company_id).toBe(companyBId);

      // 3. bulkImportEmployees con created_by = ownerUser.id
      const bulkEmail = generateTestEmail("faseb-bulk-b");
      const bulkRes = await CompanyEmployeeService.bulkImportEmployees(
        ownerClient,
        companyBId,
        [
          {
            full_name: "Importado Empresa B",
            email: bulkEmail,
            position: "Auxiliar B",
            salary: 12000,
            department: "Operaciones",
            contract_type: "tiempo_indeterminado",
          },
        ],
        ownerUser.id
      );
      expect(bulkRes.imported).toBe(1);
      expect(bulkRes.failed).toBe(0);

      const { data: bulkInvRow } = await admin
        .from("employee_invitations")
        .select("created_by, company_id")
        .eq("company_id", companyBId)
        .eq("email", bulkEmail)
        .single();
      expect(bulkInvRow?.created_by).toBe(ownerUser.id);

      // 4. acceptEmployeeInvitation envía notificación a owner_id (no a companyBId)
      const acceptRes = await CompanyEmployeeService.acceptEmployeeInvitation(admin, {
        rawToken: invRes.rawToken,
        userId: inviteeCandidate.id,
        email: inviteeCandidate.email,
      });
      expect(acceptRes.success).toBe(true);

      const { data: notifs } = await admin
        .from("notifications")
        .select("user_id, type")
        .eq("user_id", ownerUser.id)
        .eq("type", "employee_joined");
      expect((notifs || []).length).toBeGreaterThanOrEqual(1);
    });

    it("Logo/banner en company_assets y documentos de verificación permanecen aislados entre Empresa A y Empresa B", async () => {
      // 1. Subida y upsert de logos/banners en company_assets/${companyId}/...
      const pngBytes = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64"
      );
      const logoA = new File([pngBytes], "logoA.png", { type: "image/png" });
      const logoB = new File([pngBytes], "logoB.png", { type: "image/png" });
      const bannerB = new File([pngBytes], "bannerB.png", { type: "image/png" });

      const pathLogoA = `${companyAId}/logo.png`;
      const pathLogoB = `${companyBId}/logo.png`;
      const pathBannerB = `${companyBId}/banner.png`;

      const upA1 = await ownerClient.storage
        .from("company_assets")
        .upload(pathLogoA, logoA, { upsert: true, contentType: "image/png" });
      expect(upA1.error).toBeNull();
      uploadedCompanyAssetsPaths.push(pathLogoA);

      // Segundo upload con upsert: true para confirmar que SELECT + UPDATE funcionan en company_assets
      const upA2 = await ownerClient.storage
        .from("company_assets")
        .upload(pathLogoA, logoA, { upsert: true, contentType: "image/png" });
      expect(upA2.error).toBeNull();

      const upBLogo = await ownerClient.storage
        .from("company_assets")
        .upload(pathLogoB, logoB, { upsert: true, contentType: "image/png" });
      expect(upBLogo.error).toBeNull();
      uploadedCompanyAssetsPaths.push(pathLogoB);

      const upBBanner = await ownerClient.storage
        .from("company_assets")
        .upload(pathBannerB, bannerB, { upsert: true, contentType: "image/png" });
      expect(upBBanner.error).toBeNull();
      uploadedCompanyAssetsPaths.push(pathBannerB);

      expect(pathLogoA).not.toBe(pathLogoB);

      // 2. Verificación documental aislada por companyId (company_verification/${companyId}/...)
      currentServerSupabaseClient = ownerClient;
      currentBrowserSupabaseClient = ownerClient;

      const pdfA = new File(["%PDF-1.4 empresa A"], "constancia_A.pdf", {
        type: "application/pdf",
      });
      const pdfB = new File(["%PDF-1.4 empresa B"], "constancia_B.pdf", {
        type: "application/pdf",
      });

      const docA = await companyVerificationService.uploadDocument(
        companyAId,
        "constancia_situacion_fiscal",
        pdfA
      );
      uploadedProfileDocsPaths.push(docA.file_url);

      const docB = await companyVerificationService.uploadDocument(
        companyBId,
        "constancia_situacion_fiscal",
        pdfB
      );
      uploadedProfileDocsPaths.push(docB.file_url);

      expect(docA.file_url).toBe(
        `company_verification/${companyAId}/constancia_situacion_fiscal.pdf`
      );
      expect(docB.file_url).toBe(
        `company_verification/${companyBId}/constancia_situacion_fiscal.pdf`
      );

      // getCompanyVerificationServerData devuelve companyScopeId y documentos separados
      const serverDataA = await getCompanyVerificationServerData(companyAId);
      const serverDataB = await getCompanyVerificationServerData(companyBId);

      expect(serverDataA?.companyId).toBe(companyAId);
      expect(serverDataB?.companyId).toBe(companyBId);
      expect(
        serverDataA?.verificationData.documents.constancia_situacion_fiscal?.file_name
      ).toBe("constancia_A.pdf");
      expect(
        serverDataB?.verificationData.documents.constancia_situacion_fiscal?.file_name
      ).toBe("constancia_B.pdf");
    });
  });
});
