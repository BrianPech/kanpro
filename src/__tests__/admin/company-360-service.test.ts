import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock Next.js internal modules
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("Company 360° Diagnostic Service Suite", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("requireAdminAuth rejects unauthenticated requests", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      }),
    }));

    const { getCompanyFullDiagnostic } = await import(
      "@/modules/admin/services/company-360"
    );

    await expect(getCompanyFullDiagnostic("company-123")).rejects.toThrow(
      /No autenticado/i
    );
  });

  test("requireAdminAuth rejects non-admin users (candidate or company role)", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-candidate" } },
          }),
        },
        from: (table: string) => {
          if (table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { role: "company" } }),
                }),
              }),
            };
          }
          return {};
        },
      }),
    }));

    const { getCompanyFullDiagnostic } = await import(
      "@/modules/admin/services/company-360"
    );

    await expect(getCompanyFullDiagnostic("target-company-id")).rejects.toThrow(
      /Acceso denegado: Se requieren permisos de administrador/i
    );
  });

  test("returns null if company is not found in database", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-master" } },
          }),
        },
        from: (table: string) => {
          if (table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
                }),
              }),
            };
          }
          return {};
        },
      }),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null }),
            }),
          }),
        }),
      }),
    }));

    const { getCompanyFullDiagnostic } = await import(
      "@/modules/admin/services/company-360"
    );

    const result = await getCompanyFullDiagnostic("non-existent-id");
    expect(result).toBeNull();
  });

  test("successfully aggregates complete 360° diagnostic data for company", async () => {
    const targetCompanyId = "comp-mayan-resort-99";

    const mockCompanyProfile = {
      id: targetCompanyId,
      company_name: "Mayan Luxury Resorts",
      legal_name: "Mayan Luxury Resorts S.A. de C.V.",
      rfc: "MLR190520ABC",
      industry: "Hotelería y Turismo",
      verification_status: "approved",
      credits_available: 50,
      subscription_plan: "Empresa Pro",
      subscription_status: "active",
      corporateEmail: "contacto@mayanresorts.mx",
      contactPhone: "+529981234567",
      fiscal_address: "Blvd Kukulcan Km 12.5, Cancún, Q.Roo",
      branch_addresses: [{ branchName: "Cancún Matriz" }],
    };

    const mockUserProfile = {
      id: targetCompanyId,
      full_name: "Lic. Roberto Garza",
      email: "rgarza@mayanresorts.mx",
      role: "company",
      is_verified: true,
      whatsapp_number: "+529981234567",
    };

    const mockVacancies = [
      {
        id: "vac-1",
        company_id: targetCompanyId,
        title: "Chef Ejecutivo de Cocina Maya",
        category: "Gastronomía",
        location: "Cancún, Quintana Roo",
        modality: "presencial",
        employment_type: "tiempo_completo",
        status: "Activa",
        is_active: true,
        salary_min: 35000,
        salary_max: 45000,
        currency: "MXN",
        created_at: "2026-09-01T10:00:00Z",
      },
      {
        id: "vac-2",
        company_id: targetCompanyId,
        title: "Gerente de Recepción",
        category: "Hotelería",
        location: "Playa del Carmen, Quintana Roo",
        modality: "presencial",
        employment_type: "tiempo_completo",
        status: "Pausada",
        is_active: false,
        salary_min: 25000,
        salary_max: 30000,
        currency: "MXN",
        created_at: "2026-09-05T10:00:00Z",
      },
    ];

    const mockApplications = [
      { id: "app-1", vacancy_id: "vac-1" },
      { id: "app-2", vacancy_id: "vac-1" },
      { id: "app-3", vacancy_id: "vac-2" },
    ];

    const mockEmployees = [
      {
        id: "emp-101",
        company_id: targetCompanyId,
        full_name: "Elena Pech",
        job_title: "Sous Chef",
        department: "Alimentos y Bebidas",
        employee_code: "EMP-001",
        email: "elena.pech@mayanresorts.mx",
        phone: "9981112233",
        status: "active",
        hire_date: "2026-01-15",
        base_salary_monthly: 28000,
        avatar_url: null,
      },
    ];

    const mockInvitations = [
      {
        id: "inv-201",
        company_id: targetCompanyId,
        full_name: "Carlos Dzib",
        email: "carlos.dzib@gmail.com",
        position: "Capitán de Meseros",
        status: "pending",
        expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
        created_at: "2026-09-18T12:00:00Z",
        accepted_at: null,
      },
    ];

    const mockAttendance = [
      {
        id: "att-301",
        company_id: targetCompanyId,
        employee_id: "emp-101",
        work_date: "2026-09-20",
        check_in_time: "07:58:00",
        check_out_time: "16:05:00",
        status: "presente",
        check_in_method: "qr_kiosk",
        delay_minutes: 0,
        overtime_hours: 0,
      },
    ];

    const mockContracts = [
      {
        id: "con-401",
        company_id: targetCompanyId,
        folio: "CTR-2026-001",
        job_title: "Sous Chef",
        contract_type: "tiempo_indeterminado",
        department: "Alimentos y Bebidas",
        salary: 28000,
        start_date: "2026-01-15",
        end_date: null,
        company_signed: true,
        employee_signed: true,
        status: "vigente",
        created_at: "2026-01-10T10:00:00Z",
      },
    ];

    const mockPayrolls = [
      {
        id: "pay-501",
        company_id: targetCompanyId,
        period_name: "Primera Quincena Septiembre 2026",
        period_type: "quincenal",
        start_date: "2026-09-01",
        end_date: "2026-09-15",
        payout_date: "2026-09-15",
        status: "pagada",
        employees_count: 15,
        total_gross: 240000,
        total_net: 215000,
      },
    ];

    const mockTickets = [
      {
        id: "tkt-601",
        ticket_number: "TK-1044",
        user_id: targetCompanyId,
        subject: "Actualización de Constancia de Situación Fiscal",
        description: "Adjuntamos CSF actualizada con nuevo régimen",
        category: "verificacion_documentos",
        priority: "media",
        status: "abierto",
        created_at: "2026-09-21T09:00:00Z",
        updated_at: "2026-09-21T09:00:00Z",
      },
    ];

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-root-01" } },
          }),
        },
        from: (table: string) => {
          if (table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { role: "admin" } }),
                }),
              }),
            };
          }
          return {};
        },
      }),
    }));

    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: vi.fn().mockReturnValue({
        from: (table: string) => {
          if (table === "company_profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: mockCompanyProfile }),
                }),
              }),
            };
          }
          if (table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: mockUserProfile }),
                }),
              }),
            };
          }
          if (table === "vacancies") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: mockVacancies }),
                }),
              }),
            };
          }
          if (table === "applications") {
            return {
              select: () => ({
                in: () => Promise.resolve({ data: mockApplications }),
              }),
            };
          }
          if (table === "company_employees") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: mockEmployees }),
                }),
              }),
            };
          }
          if (table === "employee_invitations") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: mockInvitations }),
                }),
              }),
            };
          }
          if (table === "company_attendance") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({ data: mockAttendance, count: 1 }),
                  }),
                }),
              }),
            };
          }
          if (table === "company_contracts") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: mockContracts }),
                }),
              }),
            };
          }
          if (table === "company_payrolls") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: mockPayrolls }),
                }),
              }),
            };
          }
          if (table === "support_tickets") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => Promise.resolve({ data: mockTickets }),
                }),
              }),
            };
          }
          if (table === "profile_documents") {
            return {
              select: () => ({
                eq: () => Promise.resolve({ count: 3 }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [] }),
            }),
          };
        },
      }),
    }));

    const { getCompanyFullDiagnostic } = await import(
      "@/modules/admin/services/company-360"
    );

    const diagnostic = await getCompanyFullDiagnostic(targetCompanyId);

    expect(diagnostic).not.toBeNull();
    if (!diagnostic) return;

    // Company profile assertions
    expect(diagnostic.company.companyName).toBe("Mayan Luxury Resorts");
    expect(diagnostic.company.rfc).toBe("MLR190520ABC");
    expect(diagnostic.company.isVerified).toBe(true);
    expect(diagnostic.company.creditsAvailable).toBe(50);
    expect(diagnostic.company.industry).toBe("Hotelería y Turismo");

    // Vacancies assertions
    expect(diagnostic.vacancies.totalCount).toBe(2);
    expect(diagnostic.vacancies.activeCount).toBe(1);
    expect(diagnostic.vacancies.pausedCount).toBe(1);
    expect(diagnostic.vacancies.totalApplicationsCount).toBe(3);
    expect(diagnostic.vacancies.list[0].applicationsCount).toBe(2);
    expect(diagnostic.vacancies.list[1].applicationsCount).toBe(1);

    // Team assertions
    expect(diagnostic.team.employees).toHaveLength(1);
    expect(diagnostic.team.employees[0].fullName).toBe("Elena Pech");
    expect(diagnostic.team.activeEmployeesCount).toBe(1);
    expect(diagnostic.team.invitations).toHaveLength(1);
    expect(diagnostic.team.invitations[0].email).toBe("carlos.dzib@gmail.com");
    expect(diagnostic.team.pendingInvitationsCount).toBe(1);

    // Attendance & Kiosk assertions
    expect(diagnostic.attendance.kioskConfigured).toBe(true);
    expect(diagnostic.attendance.kioskQrCount).toBe(1);
    expect(diagnostic.attendance.recentRecords).toHaveLength(1);
    expect(diagnostic.attendance.recentRecords[0].employeeName).toBe("Elena Pech");

    // Operations assertions
    expect(diagnostic.operations.contracts.totalCount).toBe(1);
    expect(diagnostic.operations.contracts.signedCount).toBe(1);
    expect(diagnostic.operations.payrolls.totalCount).toBe(1);
    expect(diagnostic.operations.payrolls.totalNetDispersed).toBe(215000);
    expect(diagnostic.operations.hasAuditDocuments).toBe(true);
    expect(diagnostic.operations.auditUrl).toBe(
      `/dashboard/admin/verifications/${targetCompanyId}`
    );

    // Support assertions
    expect(diagnostic.support.tickets).toHaveLength(1);
    expect(diagnostic.support.tickets[0].ticketNumber).toBe("TK-1044");
    expect(diagnostic.support.openCount).toBe(1);
  });
});
