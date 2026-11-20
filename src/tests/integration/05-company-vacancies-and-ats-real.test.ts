import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
import { CompanyVacanciesService } from "@/modules/company/services/company-vacancies";
import { companyService } from "@/modules/company/services/company-service";

describe("[REAL INTEGRATION] 05 - Company Vacancies & ATS Pipeline with Real PostgreSQL", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();

  let companyA: { id: string; email: string; companyName: string };
  let companyB: { id: string; email: string; companyName: string };
  let candidateUser: { id: string; email: string; fullName: string };

  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let candidateClient: SupabaseClient;

  const passwordA = "CompA-Vacancies-2026!";
  const passwordB = "CompB-Vacancies-2026!";
  const passwordCand = "Cand-Vacancies-2026!";

  let vacancy1Id: string;
  let vacancy2Id: string;
  let vacancy3Id: string;
  let application1Id: string;

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Create two real companies
    companyA = await createTestCompanyUser({
      email: generateTestEmail("comp-ats-a"),
      password: passwordA,
      companyName: "Grupo Hotelero Maya S.A.",
    });
    usersToCleanup.push(companyA.id);

    companyB = await createTestCompanyUser({
      email: generateTestEmail("comp-ats-b"),
      password: passwordB,
      companyName: "Resort Caribe Internacional",
    });
    usersToCleanup.push(companyB.id);

    // 2. Create real candidate
    candidateUser = await createTestCandidateUser({
      email: generateTestEmail("cand-ats"),
      password: passwordCand,
      fullName: "Roberto Carlos Dzib",
    });
    usersToCleanup.push(candidateUser.id);

    // 3. Authenticate clients
    const authA = await createAuthenticatedClient(companyA.email, passwordA);
    clientA = authA.client;

    const authB = await createAuthenticatedClient(companyB.email, passwordB);
    clientB = authB.client;

    const authCand = await createAuthenticatedClient(candidateUser.email, passwordCand);
    candidateClient = authCand.client;
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  it("1. should create a full vacancy in PostgreSQL via CompanyVacanciesService", async () => {
    const vacancyData = {
      title: "Cocinero A Especialista en Mariscos",
      category: "Restaurantes y Alimentos",
      employment_type: "Tiempo Completo",
      shift_schedule: "Rotativo",
      positions_available: 2,
      location: "Cancún, Quintana Roo",
      zone: "Zona Hotelera",
      salary_min: 14000,
      salary_max: 18000,
      currency: "MXN",
      payment_frequency: "quincenal" as const,
      benefits: ["Seguro de vida", "Comedor gratuito", "Transporte"],
      description: "Buscamos cocinero A con experiencia en cocina de mariscos y cortes finos.",
      requirements: "Mínimo 2 años de experiencia comprobable y manejo de Distintivo H.",
      experience_required: "2 a 3 años",
      education_level: "Técnico / Bachillerato",
      skills: ["Distintivo H", "Manejo de Cuchillos", "Pescados y Mariscos"],
      contact_phone: "9981122334",
      contact_email: "rh@grupomaya.com",
      preferred_contact_method: "whatsapp" as const,
      is_active: true,
      status: "Activa",
    };

    const created = await new CompanyVacanciesService(clientA).createVacancy(
      companyA.id,
      vacancyData,
      companyA.id
    );

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.company_id).toBe(companyA.id);
    expect(created.title).toBe("Cocinero A Especialista en Mariscos");
    expect(created.is_active).toBe(true);
    expect(created.status).toBe("Activa");
    expect(created.salary_min).toBe(14000);
    expect(created.salary_max).toBe(18000);

    vacancy1Id = created.id;

    // Verify directly in PostgreSQL via Admin client
    const { data: dbVacancy } = await admin
      .from("vacancies")
      .select("*")
      .eq("id", vacancy1Id)
      .single();

    expect(dbVacancy).not.toBeNull();
    expect(dbVacancy?.company_id).toBe(companyA.id);
    expect(dbVacancy?.skills).toEqual(["Distintivo H", "Manejo de Cuchillos", "Pescados y Mariscos"]);
  });

  it("2. should create an express vacancy in PostgreSQL via CompanyVacanciesService", async () => {
    const expressData = {
      title: "Ayudante de Bar Exprés",
      zone: "Playa del Carmen",
      category: "Bares y Entretenimiento",
      requirements: "Ganas de aprender y disponibilidad inmediata.",
      salary_min: 10000,
      salary_max: 12000,
      modality: "Presencial",
      employment_type: "Tiempo Completo",
    };

    const expressVacancy = await new CompanyVacanciesService(
      clientA
    ).createExpressVacancy(companyA.id, expressData, companyA.id);

    expect(expressVacancy).toBeDefined();
    expect(expressVacancy.title).toBe("Ayudante de Bar Exprés");
    expect(expressVacancy.is_active).toBe(true);
    expect(expressVacancy.company_id).toBe(companyA.id);

    vacancy2Id = expressVacancy.id;
  });

  it("3. should enforce active vacancy limit on Basic plan (max 3 active vacancies)", async () => {
    // Currently Company A has 2 active vacancies (vacancy1Id and vacancy2Id).
    // Let's create the 3rd active vacancy:
    const serviceA = new CompanyVacanciesService(clientA);
    const thirdVacancy = await serviceA.createExpressVacancy(
      companyA.id,
      {
        title: "Recepcionista Nocturno",
        zone: "Cancún Centro",
        category: "Hotelería y Turismo",
        requirements: "Inglés conversacional intermedio.",
        modality: "Presencial",
        salary_min: 13000,
      },
      companyA.id
    );
    expect(thirdVacancy.is_active).toBe(true);
    vacancy3Id = thirdVacancy.id;

    // Company A now has exactly 3 active vacancies, which is the limit for Plan Básico.
    // Attempting to create a 4th active vacancy MUST throw an error:
    await expect(
      serviceA.createExpressVacancy(
        companyA.id,
        {
          title: "4ta Vacante que debe ser rechazada",
          zone: "Cancún Centro",
          category: "Hotelería y Turismo",
          requirements: "Excede límite de plan.",
          modality: "Presencial",
        },
        companyA.id
      )
    ).rejects.toThrow(/límite de 3 vacantes activas/i);
  });

  it("4. should pause an active vacancy and allow activating another within limits", async () => {
    const serviceA = new CompanyVacanciesService(clientA);
    // Pause vacancy2
    const paused = await serviceA.toggleVacancyStatus(
      companyA.id,
      vacancy2Id,
      false
    );

    expect(paused.is_active).toBe(false);
    expect(paused.status).toBe("Pausada");

    // Verify in DB
    const { data: dbCheck } = await admin
      .from("vacancies")
      .select("is_active, status")
      .eq("id", vacancy2Id)
      .single();
    expect(dbCheck?.is_active).toBe(false);
    expect(dbCheck?.status).toBe("Pausada");

    // Now active count is 2 (vacancy1 and vacancy3). A new active vacancy should now be allowed:
    const newAllowedVacancy = await serviceA.createExpressVacancy(
      companyA.id,
      {
        title: "Camarista de Piso Reemplazo",
        zone: "Zona Hotelera",
        category: "Hotelería y Turismo",
        requirements: "Experiencia en limpieza de habitaciones de lujo.",
        modality: "Presencial",
      },
      companyA.id
    );
    expect(newAllowedVacancy.is_active).toBe(true);

    // Delete the temporary replacement to keep state clean
    await serviceA.deleteVacancy(companyA.id, newAllowedVacancy.id);
  });

  it("5. should clone an existing vacancy into a draft in PostgreSQL", async () => {
    const cloneResult = await new CompanyVacanciesService(
      clientA
    ).cloneVacancy(companyA.id, vacancy1Id, companyA.id);

    expect(cloneResult.newVacancyId).toBeDefined();
    expect(cloneResult.title).toContain("(Copia)");

    const { data: clonedDb } = await admin
      .from("vacancies")
      .select("*")
      .eq("id", cloneResult.newVacancyId)
      .single();

    expect(clonedDb?.is_active).toBe(false);
    expect(clonedDb?.status).toBe("Borrador");
    expect(clonedDb?.salary_min).toBe(14000);

    // Cleanup cloned vacancy
    await admin.from("vacancies").delete().eq("id", cloneResult.newVacancyId);
  });

  it("6. should allow a candidate to apply to vacancy1 and verify ATS row creation", async () => {
    // Candidate applies to vacancy1
    const { data: application, error: appError } = await candidateClient
      .from("applications")
      .insert({
        vacancy_id: vacancy1Id,
        candidate_id: candidateUser.id,
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    expect(appError).toBeNull();
    expect(application).toBeDefined();
    expect(application?.vacancy_id).toBe(vacancy1Id);
    expect(application?.candidate_id).toBe(candidateUser.id);
    expect(application?.status).toBe("applied");

    application1Id = application!.id;
  });

  it("7. should progress the candidate through the complete ATS pipeline (Interview, Notes, Rating, Hired)", async () => {
    // A. Company schedules an interview
    const interviewData = {
      date: "2026-10-20",
      time: "11:30",
      type: "Presencial",
      location: "Oficinas Generales Cancún",
      notes: "Traer identificación oficial y carta de recomendación",
      interviewer: "Lic. Andrea González",
      status: "scheduled",
    };

    await companyService.updateApplicationInterview(application1Id, interviewData, clientA);

    // Verify interview status in PostgreSQL
    const { data: interviewDb } = await admin
      .from("applications")
      .select("status, interview_status, scheduled_interview_at, interview_details")
      .eq("id", application1Id)
      .single();

    expect(interviewDb?.status).toBe("Entrevista");
    expect(interviewDb?.interview_status).toBe("confirmed");
    expect(new Date(interviewDb!.scheduled_interview_at!).toISOString()).toBe(
      new Date("2026-10-20T11:30:00").toISOString()
    );

    // B. Recruiter adds notes and rating
    await companyService.updateApplicationNotes(
      application1Id,
      "Excelente actitud y dominio de BPM en cocina caliente.",
      clientA
    );
    await companyService.updateApplicationRating(application1Id, 5, clientA);

    const { data: ratedDb } = await admin
      .from("applications")
      .select("notes, rating")
      .eq("id", application1Id)
      .single();

    expect(ratedDb?.notes).toBe("Excelente actitud y dominio de BPM en cocina caliente.");
    expect(ratedDb?.rating).toBe(5);

    // C. Company marks candidate as Hired (Contratado)
    await companyService.updateApplicationStatus(application1Id, "Contratado", clientA);

    const { data: hiredDb } = await admin
      .from("applications")
      .select("status")
      .eq("id", application1Id)
      .single();

    expect(hiredDb?.status).toBe("Contratado");
  });

  it("8. should strictly isolate vacancies and applications from Company B (PostgreSQL RLS)", async () => {
    // In PostgreSQL RLS, draft or paused vacancies of Company A cannot be seen by Company B
    const { data: draftsB, error: draftErrB } = await clientB
      .from("vacancies")
      .select("id, title, company_id")
      .eq("company_id", companyA.id)
      .eq("status", "Borrador");

    expect(draftErrB).toBeNull();
    expect(draftsB).toEqual([]);

    // Company B attempts to update Company A's vacancy
    const { data: hackedVac } = await clientB
      .from("vacancies")
      .update({ title: "Título vulnerado por Empresa B" })
      .eq("id", vacancy1Id)
      .select();

    expect(hackedVac).toEqual([]);

    // Company B attempts to update Company A's candidate application
    const { data: hackedApp } = await clientB
      .from("applications")
      .update({ status: "Rechazado", notes: "Ataque RLS" })
      .eq("id", application1Id)
      .select();

    expect(hackedApp).toEqual([]);

    // Verify vacancy1 and application1 remain unchanged in PostgreSQL
    const { data: verifyVac } = await admin
      .from("vacancies")
      .select("title")
      .eq("id", vacancy1Id)
      .single();
    expect(verifyVac?.title).toBe("Cocinero A Especialista en Mariscos");

    const { data: verifyApp } = await admin
      .from("applications")
      .select("status")
      .eq("id", application1Id)
      .single();
    expect(verifyApp?.status).toBe("Contratado");
  });
});
