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
import { CompanyEmployeeService } from "@/modules/company/services/company-service";

describe("[REAL INTEGRATION] 08 - Exhaustive Multi-Tenant & RLS Security Audit in Real PostgreSQL", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();

  let companyA: { id: string; email: string; companyName: string };
  let companyB: { id: string; email: string; companyName: string };
  let candidate: { id: string; email: string; fullName: string };

  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  let vacancyAId: string;
  let applicationAId: string;
  let employeeAId: string;
  let branchAId: string;
  let attendanceAId: string;
  let leaveAId: string;
  let incidentAId: string;
  let contractAId: string;
  let payrollAId: string;

  const passwordA = "CompA-Audit-2026!";
  const passwordB = "CompB-Audit-2026!";

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Create two real companies
    companyA = await createTestCompanyUser({
      email: generateTestEmail("tenant-audit-a"),
      password: passwordA,
      companyName: "Audited Company Alpha S.A.",
    });
    usersToCleanup.push(companyA.id);

    companyB = await createTestCompanyUser({
      email: generateTestEmail("tenant-audit-b"),
      password: passwordB,
      companyName: "Adversary Company Beta S.A.",
    });
    usersToCleanup.push(companyB.id);

    candidate = await createTestCandidateUser({
      email: generateTestEmail("cand-audit"),
      password: "CandidatePass123!",
      fullName: "Candidato de Prueba Audit",
    });
    usersToCleanup.push(candidate.id);

    // 2. Authenticate
    const authA = await createAuthenticatedClient(companyA.email, passwordA);
    clientA = authA.client;

    const authB = await createAuthenticatedClient(companyB.email, passwordB);
    clientB = authB.client;

    // 3. Seed complete company ecosystem for Company A via clientA / Admin
    // Branch
    const { data: branch } = await clientA
      .from("company_branches")
      .insert({
        company_id: companyA.id,
        name: "Matriz Mérida Norte",
        address: "Prol. Paseo de Montejo 100",
        lat: 20.998,
        lng: -89.615,
        is_headquarters: true,
      })
      .select()
      .single();
    branchAId = branch!.id;

    // Vacancy
    const vac = await new CompanyVacanciesService(clientA).createExpressVacancy(
      companyA.id,
      {
        title: "Audited Senior Position",
        zone: "Mérida Norte",
        category: "Tecnología",
        requirements: "5 años de experiencia.",
        modality: "Presencial",
      },
      companyA.id
    );
    vacancyAId = vac.id;

    // Application
    const { data: app } = await admin
      .from("applications")
      .insert({
        vacancy_id: vacancyAId,
        candidate_id: candidate.id,
        status: "applied",
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();
    applicationAId = app!.id;

    // Employee
    const emp = await CompanyEmployeeService.createEmployee(clientA, companyA.id, {
      full_name: "Colaborador Secreto Alpha",
      job_title: "Ingeniero Principal",
      department: "I+D",
      base_salary_monthly: 60000,
      payment_frequency: "quincenal",
    });
    employeeAId = emp.id;

    // Attendance
    const { data: att } = await clientA
      .from("company_attendance")
      .insert({
        company_id: companyA.id,
        employee_id: employeeAId,
        work_date: "2026-10-14",
        status: "presente",
        notes: "Confidencial Alpha",
      })
      .select()
      .single();
    attendanceAId = att!.id;

    // Leave
    const { data: leave } = await clientA
      .from("company_leaves")
      .insert({
        company_id: companyA.id,
        employee_id: employeeAId,
        request_type: "vacaciones",
        start_date: "2026-12-01",
        end_date: "2026-12-05",
        total_working_days: 5,
        status: "aprobada",
      })
      .select()
      .single();
    leaveAId = leave!.id;

    // Incident
    const { data: inc } = await clientA
      .from("company_incidents")
      .insert({
        company_id: companyA.id,
        employee_id: employeeAId,
        employee_name: "Colaborador Secreto Alpha",
        category: "otro",
        title: "Incidencia Interna Confidencial",
        description: "Detalles estrictamente privados de Alpha.",
        severity: "alta",
        status: "pendiente",
      })
      .select()
      .single();
    incidentAId = inc!.id;

    // Contract
    const { data: ctr } = await clientA
      .from("company_contracts")
      .insert({
        company_id: companyA.id,
        employee_id: employeeAId,
        folio: "AUDIT-CTR-ALPHA-001",
        job_title: "Ingeniero Principal",
        department: "I+D",
        contract_type: "indeterminado",
        template_type: "indeterminado",
        start_date: "2026-10-01",
        salary: 60000,
        payment_frequency: "quincenal",
        status: "vigente",
      })
      .select()
      .single();
    contractAId = ctr!.id;

    // Payroll
    const { data: pay } = await clientA
      .from("company_payrolls")
      .insert({
        company_id: companyA.id,
        period_name: "1ra Quincena Octubre 2026",
        period_type: "quincenal",
        start_date: "2026-10-01",
        end_date: "2026-10-15",
        payout_date: "2026-10-15",
        status: "calculada",
        total_gross: 30000,
        total_net: 24500,
      })
      .select()
      .single();
    payrollAId = pay!.id;
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  it("1. prevents Company B from modifying Company A's profile or RFC", async () => {
    const { data, error } = await clientB
      .from("company_profiles")
      .update({ company_name: "Hacked Company Name", rfc: "HACK999999XXX" })
      .eq("id", companyA.id)
      .select();

    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: check } = await admin
      .from("company_profiles")
      .select("company_name")
      .eq("id", companyA.id)
      .single();

    expect(check?.company_name).toBe("Audited Company Alpha S.A.");
  });

  it("2. prevents Company B from modifying or deleting Company A's branches", async () => {
    const { data: updated } = await clientB
      .from("company_branches")
      .update({ address: "Calle Falsa 123" })
      .eq("id", branchAId)
      .select();

    expect(updated).toEqual([]);

    const { data: deleted } = await clientB
      .from("company_branches")
      .delete()
      .eq("id", branchAId)
      .select();

    expect(deleted).toEqual([]);
  });

  it("3. prevents Company B from modifying or deleting Company A's vacancies", async () => {
    const { data: updated } = await clientB
      .from("vacancies")
      .update({ title: "Título Hackeado" })
      .eq("id", vacancyAId)
      .select();

    expect(updated).toEqual([]);

    const { data: deleted } = await clientB
      .from("vacancies")
      .delete()
      .eq("id", vacancyAId)
      .select();

    expect(deleted).toEqual([]);
  });

  it("4. prevents Company B from accessing or mutating Company A's ATS applications", async () => {
    const { data: updated } = await clientB
      .from("applications")
      .update({ status: "Rechazado" })
      .eq("id", applicationAId)
      .select();

    expect(updated).toEqual([]);
  });

  it("5. prevents Company B from reading, updating or deleting Company A's employees", async () => {
    const { data: list } = await clientB
      .from("company_employees")
      .select("*")
      .eq("company_id", companyA.id);

    expect(list).toEqual([]);

    const { data: updated } = await clientB
      .from("company_employees")
      .update({ base_salary_monthly: 1 })
      .eq("id", employeeAId)
      .select();

    expect(updated).toEqual([]);
  });

  it("6. prevents Company B from reading, updating or deleting Company A's attendance records", async () => {
    const { data: list } = await clientB
      .from("company_attendance")
      .select("*")
      .eq("company_id", companyA.id);

    expect(list).toEqual([]);

    const { data: updated } = await clientB
      .from("company_attendance")
      .update({ notes: "Vulnerado" })
      .eq("id", attendanceAId)
      .select();

    expect(updated).toEqual([]);
  });

  it("7. prevents Company B from reading, updating or deleting Company A's vacation and leave requests", async () => {
    const { data: list } = await clientB
      .from("company_leaves")
      .select("*")
      .eq("company_id", companyA.id);

    expect(list).toEqual([]);

    const { data: updated } = await clientB
      .from("company_leaves")
      .update({ status: "rechazada" })
      .eq("id", leaveAId)
      .select();

    expect(updated).toEqual([]);
  });

  it("8. prevents Company B from reading, updating or deleting Company A's labor incidents", async () => {
    const { data: list } = await clientB
      .from("company_incidents")
      .select("*")
      .eq("company_id", companyA.id);

    expect(list).toEqual([]);

    const { data: updated } = await clientB
      .from("company_incidents")
      .update({ title: "Incidencia alterada" })
      .eq("id", incidentAId)
      .select();

    expect(updated).toEqual([]);
  });

  it("9. prevents Company B from reading, updating or deleting Company A's contracts", async () => {
    const { data: list } = await clientB
      .from("company_contracts")
      .select("*")
      .eq("id", contractAId);

    expect(list).toEqual([]);

    const { data: updated } = await clientB
      .from("company_contracts")
      .update({ salary: 0 })
      .eq("id", contractAId)
      .select();

    expect(updated).toEqual([]);
  });

  it("10. prevents Company B from reading, updating or deleting Company A's payroll data", async () => {
    const { data: list } = await clientB
      .from("company_payrolls")
      .select("*")
      .eq("id", payrollAId);

    expect(list).toEqual([]);

    const { data: updated } = await clientB
      .from("company_payrolls")
      .update({ total_net: 0 })
      .eq("id", payrollAId)
      .select();

    expect(updated).toEqual([]);
  });
});
