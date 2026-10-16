import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureLiveSupabase,
  getAdminClient,
  createTestCompanyUser,
  createAuthenticatedClient,
  cleanupTestUsers,
  generateTestEmail,
} from "./helpers/test-client";
import { CompanyEmployeeService } from "@/modules/company/services/company-service";
import { CompanyAttendanceService } from "@/modules/company/services/company-attendance";
import { CompanyLeavesService } from "@/modules/company/services/company-leaves";
import { CompanyIncidentsService } from "@/modules/company/services/company-incidents";

describe("[REAL INTEGRATION] 06 - Attendance, Geofencing, Leaves & Incidents with Real PostgreSQL", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();

  let companyA: { id: string; email: string; companyName: string };
  let companyB: { id: string; email: string; companyName: string };

  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  let attendanceServiceA: CompanyAttendanceService;
  let leavesServiceA: CompanyLeavesService;
  let incidentsServiceA: CompanyIncidentsService;

  let employeeAId: string;
  let branchAId: string;
  let attendanceRecordId: string;
  let leaveRecordId: string;
  let incidentRecordId: string;

  const passwordA = "CompA-Att-2026!";
  const passwordB = "CompB-Att-2026!";

  beforeAll(async () => {
    await ensureLiveSupabase();

    // 1. Create two real companies
    companyA = await createTestCompanyUser({
      email: generateTestEmail("comp-att-a"),
      password: passwordA,
      companyName: "Grupo Hotelero Hyatt Cancún",
    });
    usersToCleanup.push(companyA.id);

    companyB = await createTestCompanyUser({
      email: generateTestEmail("comp-att-b"),
      password: passwordB,
      companyName: "Operadora Turística Xcaret",
    });
    usersToCleanup.push(companyB.id);

    // 2. Authenticate
    const authA = await createAuthenticatedClient(companyA.email, passwordA);
    clientA = authA.client;

    const authB = await createAuthenticatedClient(companyB.email, passwordB);
    clientB = authB.client;

    // Instantiate real services bound to clientA (operating under PostgreSQL RLS)
    attendanceServiceA = new CompanyAttendanceService(clientA);
    leavesServiceA = new CompanyLeavesService(clientA);
    incidentsServiceA = new CompanyIncidentsService(clientA);

    // 3. Create a real branch with geofence for Company A
    const { data: branch, error: branchErr } = await clientA
      .from("company_branches")
      .insert({
        company_id: companyA.id,
        name: "Sucursal Zona Hotelera Km 14",
        address: "Blvd. Kukulcan Km 14, Zona Hotelera, Cancún",
        lat: 21.1167,
        lng: -86.7644,
        is_headquarters: true,
      })
      .select()
      .single();

    if (branchErr || !branch) {
      throw new Error(`Failed to create branch: ${branchErr?.message}`);
    }
    branchAId = branch.id;

    // 4. Create an employee for Company A
    const emp = await CompanyEmployeeService.createEmployee(clientA, companyA.id, {
      full_name: "Luis Fernando Alcocer",
      job_title: "Capitán de Meseros",
      department: "Alimentos y Bebidas",
      employee_code: "EMP-HYATT-001",
      email: generateTestEmail("emp-alcocer"),
      phone: "9982345678",
      work_schedule: "08:00 - 17:00",
      base_salary_monthly: 22000,
      payment_frequency: "quincenal",
    });
    employeeAId = emp.id;
  });

  afterAll(async () => {
    await cleanupTestUsers(usersToCleanup);
  });

  it("1. should record manual attendance in PostgreSQL and calculate status correctly", async () => {
    const today = new Date().toISOString().split("T")[0];

    const manualRecord = await attendanceServiceA.createManualAttendance(companyA.id, {
      employeeId: employeeAId,
      workDate: today,
      checkInTime: "08:05",
      checkOutTime: "17:10",
      status: "presente",
      delayMinutes: 0,
      notes: "Turno cubierto en tiempo y forma.",
    });

    expect(manualRecord).toBeDefined();
    expect(manualRecord.id).toBeDefined();
    expect(manualRecord.employee_id).toBe(employeeAId);
    expect(manualRecord.company_id).toBe(companyA.id);
    expect(manualRecord.status).toBe("presente");
    expect(manualRecord.check_in_time).toBe("08:05");
    expect(manualRecord.check_out_time).toBe("17:10");

    attendanceRecordId = manualRecord.id;

    // Verify in PostgreSQL
    const { data: dbRec } = await admin
      .from("company_attendance")
      .select("*")
      .eq("id", attendanceRecordId)
      .single();

    expect(dbRec?.delay_minutes).toBe(0);
    expect(dbRec?.scheduled_check_in).toBe("08:00");
    expect(dbRec?.scheduled_check_out).toBe("17:00");
  });

  it("2. should authorize overtime for the attendance record in PostgreSQL", async () => {
    const authorized = await attendanceServiceA.authorizeOvertime(companyA.id, {
      recordId: attendanceRecordId,
      hours: 2.5,
      rateType: "doble",
      notes: "Horas extra por evento nocturno autorizado por Gerencia de A&B.",
    });

    expect(authorized.overtime_hours).toBe(2.5);
    expect(authorized.overtime_status).toBe("autorizado");
    expect(authorized.overtime_rate_type).toBe("doble");

    // Verify in DB
    const { data: dbCheck } = await admin
      .from("company_attendance")
      .select("overtime_hours, overtime_status")
      .eq("id", attendanceRecordId)
      .single();

    expect(dbCheck?.overtime_hours).toBe(2.5);
    expect(dbCheck?.overtime_status).toBe("autorizado");
  });

  it("3. should review and approve an employee justification in PostgreSQL", async () => {
    // Submit a justification review decision
    const reviewed = await attendanceServiceA.reviewJustification(
      companyA.id,
      "rh@hyattcancun.com",
      {
        recordId: attendanceRecordId,
        decision: "aprobada",
        comments: "Comprobante médico validado ante el IMSS.",
      }
    );

    expect(reviewed.status).toBe("falta_justificada");
    expect(reviewed.justification_status).toBe("aprobada");
    expect(reviewed.justification_reviewed_by).toBe("rh@hyattcancun.com");

    // Verify in DB
    const { data: dbCheck } = await admin
      .from("company_attendance")
      .select("status, justification_status")
      .eq("id", attendanceRecordId)
      .single();

    expect(dbCheck?.status).toBe("falta_justificada");
    expect(dbCheck?.justification_status).toBe("aprobada");
  });

  it("4. should create and manage labor incidents in PostgreSQL via CompanyIncidentsService", async () => {
    const today = new Date().toISOString().split("T")[0];

    const incident = await incidentsServiceA.createIncident(companyA.id, {
      employeeId: employeeAId,
      employeeName: "Luis Fernando Alcocer",
      jobTitle: "Capitán de Meseros",
      department: "Alimentos y Bebidas",
      category: "reconocimiento",
      categoryLabel: "Reconocimiento de Excelencia",
      title: "Mención honorífica por servicio a huéspedes VIP",
      description: "Recibió 5 menciones directas en TripAdvisor durante la semana de congreso médico.",
      incidentDate: today,
      severity: "baja",
      responsibleSupervisor: "Gerente de Restaurante",
    });

    expect(incident).toBeDefined();
    expect(incident.id).toBeDefined();
    expect(incident.title).toContain("Mención honorífica");
    expect(incident.employeeId).toBe(employeeAId);

    incidentRecordId = incident.id;

    // Verify in PostgreSQL
    const { data: dbIncident } = await admin
      .from("company_incidents")
      .select("*")
      .eq("id", incidentRecordId)
      .single();

    expect(dbIncident).not.toBeNull();
    expect(dbIncident?.company_id).toBe(companyA.id);
    expect(dbIncident?.category).toBe("reconocimiento");
  });

  it("5. should request and approve company vacations/leaves via CompanyLeavesService", async () => {
    // Request 5 days of vacation (excluding weekends)
    const startDate = "2026-11-02"; // Monday
    const endDate = "2026-11-06";   // Friday

    const result = await leavesServiceA.createCompanyLeave(companyA.id, {
      employeeId: employeeAId,
      requestType: "vacaciones",
      startDate,
      endDate,
      reason: "Vacaciones anuales conforme a Ley Federal del Trabajo.",
    });

    expect(result.leaveId).toBeDefined();
    expect(result.workingDays).toBe(5);
    expect(result.leave.status).toBe("aprobada");

    leaveRecordId = result.leaveId;

    // Verify in PostgreSQL
    const { data: dbLeave } = await admin
      .from("company_leaves")
      .select("*")
      .eq("id", leaveRecordId)
      .single();

    expect(dbLeave).not.toBeNull();
    expect(dbLeave?.company_id).toBe(companyA.id);
    expect(dbLeave?.employee_id).toBe(employeeAId);
    expect(dbLeave?.total_working_days).toBe(5);
    expect(dbLeave?.status).toBe("aprobada");
  });

  it("6. should enforce multi-tenant isolation against Company B across all attendance, leaves and incidents", async () => {
    // Company B attempts to read Company A's attendance records
    const { data: attB, error: attErrB } = await clientB
      .from("company_attendance")
      .select("*")
      .eq("company_id", companyA.id);

    expect(attErrB).toBeNull();
    expect(attB).toEqual([]);

    // Company B attempts an unauthorized UPDATE on Company A's branches (branches are public read, but write-protected)
    const { data: hackedBranch } = await clientB
      .from("company_branches")
      .update({ name: "Sucursal Modificada por Atacante B" })
      .eq("id", branchAId)
      .select();

    expect(hackedBranch).toEqual([]);

    // Company B attempts an unauthorized DELETE on Company A's branch
    const { data: deletedBranch } = await clientB
      .from("company_branches")
      .delete()
      .eq("id", branchAId)
      .select();

    expect(deletedBranch).toEqual([]);

    // Company B attempts to read Company A's leaves
    const { data: leavesB, error: leavesErrB } = await clientB
      .from("company_leaves")
      .select("*")
      .eq("id", leaveRecordId);

    expect(leavesErrB).toBeNull();
    expect(leavesB).toEqual([]);

    // Company B attempts to read Company A's incidents
    const { data: incB, error: incErrB } = await clientB
      .from("company_incidents")
      .select("*")
      .eq("id", incidentRecordId);

    expect(incErrB).toBeNull();
    expect(incB).toEqual([]);

    // Company B attempts an unauthorized UPDATE on Company A's attendance
    const { data: hackedAtt } = await clientB
      .from("company_attendance")
      .update({ notes: "Modificado maliciosamente por Empresa B" })
      .eq("id", attendanceRecordId)
      .select();

    expect(hackedAtt).toEqual([]);

    // Verify the record remained unchanged in PostgreSQL
    const { data: checkAtt } = await admin
      .from("company_attendance")
      .select("notes")
      .eq("id", attendanceRecordId)
      .single();

    expect(checkAtt?.notes).toBe("Turno cubierto en tiempo y forma.");
  });
});
