import { describe, test, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  IncidentsRepository,
  IncidentRow,
} from "@/modules/company/repositories/incidents.repository";
import { CompanyIncidentsService } from "@/modules/company/services/company-incidents";
import { CompanyPayrollService } from "@/modules/company/services/company-payroll";
import { IncidentEvidenceService } from "@/modules/company/services/incident-evidence.service";
import { IncidentActaService } from "@/modules/company/services/incident-acta.service";
import { buildActaAdministrativaPdf } from "@/modules/company/utils/acta-administrativa-pdf";
import { calculateAbsenceDeduction } from "@/modules/company/utils/payroll-calculator";
import {
  DEFAULT_PAYROLL_IMPACT_CONFIG,
  filterPayrollEligibleIncidents,
  parsePayrollImpactConfig,
} from "@/modules/company/strategies/incident-payroll-impact.strategy";
import { CandidateIncidentsService } from "@/modules/candidate/services/candidate-incidents";
import { respondToIncidentSchema } from "@/modules/candidate/schemas/incidents.schema";

function buildIncident(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: "inc-12345678",
    company_id: "comp-A",
    employee_id: "emp-1",
    employee_name: "Rosa Flores",
    job_title: "Supervisora",
    department: "Operaciones",
    category: "retardo",
    category_label: "Retardo de Turno",
    title: "Retardo",
    description: "Llegó tarde al turno matutino.",
    incident_date: "2026-10-05",
    severity: "baja",
    responsible_supervisor: "RH",
    evidence_url: null,
    evidence_file_name: null,
    evidence_type: null,
    status: "aprobado",
    clarification_deadline: null,
    resolution_notes: null,
    created_at: "2026-10-05T15:00:00.000Z",
    updated_at: "2026-10-05T15:00:00.000Z",
    notified_at: null,
    acknowledged_at: null,
    employee_statement: null,
    employee_statement_at: null,
    folio_imss: null,
    dias_amparados: null,
    ramo_imss: null,
    complemento_empresa: null,
    ...overrides,
  };
}

function buildFakeRepo(overrides: Partial<IncidentsRepository> = {}): IncidentsRepository {
  return {
    create: vi.fn(async (companyId, payload) => buildIncident({ ...payload, company_id: companyId } as Partial<IncidentRow>)),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(async () => null),
    markNotified: vi.fn(async () => undefined),
    listByCompany: vi.fn(async () => []),
    listByEmployeeAndPeriod: vi.fn(async () => []),
    listByPeriod: vi.fn(async () => []),
    ...overrides,
  };
}

describe("Parte 3A: portal del colaborador (aceptación y descargo)", () => {
  test("respondToIncidentSchema exige aceptar o escribir un descargo", () => {
    expect(respondToIncidentSchema.safeParse({ incidentId: "i1", acknowledge: false }).success).toBe(false);
    expect(respondToIncidentSchema.safeParse({ incidentId: "i1", acknowledge: true }).success).toBe(true);
    expect(
      respondToIncidentSchema.safeParse({ incidentId: "i1", acknowledge: false, statement: "No estuve de acuerdo." }).success
    ).toBe(true);
    expect(
      respondToIncidentSchema.safeParse({ incidentId: "i1", acknowledge: true, statement: "x".repeat(2001) }).success
    ).toBe(false);
  });

  test("CandidateIncidentsService.respond usa la función RPC y mapea la respuesta", async () => {
    const row = buildIncident({
      acknowledged_at: "2026-10-06T15:00:00.000Z",
      employee_statement: "Hubo un bloqueo vial.",
      employee_statement_at: "2026-10-06T15:00:00.000Z",
    });
    const rpc = vi.fn(async () => ({ data: row, error: null }));
    const service = new CandidateIncidentsService({ rpc } as unknown as SupabaseClient<Database>);

    const result = await service.respond({
      incidentId: "inc-12345678",
      acknowledge: true,
      statement: "Hubo un bloqueo vial.",
    });

    expect(rpc).toHaveBeenCalledWith("employee_respond_to_incident", {
      p_incident_id: "inc-12345678",
      p_acknowledge: true,
      p_statement: "Hubo un bloqueo vial.",
    });
    expect(result.acknowledgedAt).toBeDefined();
    expect(result.employeeStatement).toBe("Hubo un bloqueo vial.");
  });

  test("CandidateIncidentsService.respond propaga el rechazo de la función (otro colaborador)", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: "Incidencia no encontrada o no autorizada." } }));
    const service = new CandidateIncidentsService({ rpc } as unknown as SupabaseClient<Database>);

    await expect(
      service.respond({ incidentId: "ajena", acknowledge: true })
    ).rejects.toThrow("Incidencia no encontrada o no autorizada.");
  });

  test("createIncident notifica al colaborador, registra notified_at y valida la ruta de evidencia", async () => {
    const notifications: Array<{ user_id: string; type: string }> = [];
    const client = {
      from: vi.fn((table: string) => {
        if (table === "company_employees") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "emp-1",
                      full_name: "Rosa Flores",
                      job_title: "Supervisora",
                      department: "Operaciones",
                      avatar_url: null,
                      employee_id: "user-rosa",
                      email: "rosa@hotel.mx",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "notifications") {
          return {
            insert: async (payload: { user_id: string; type: string }) => {
              notifications.push(payload);
              return { error: null };
            },
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = buildFakeRepo();
    const service = new CompanyIncidentsService(client, repo);

    const created = await service.createIncident("comp-A", {
      employeeId: "emp-1",
      employeeName: "Rosa Flores",
      category: "falta_injustificada",
      title: "Falta",
      description: "No se presentó.",
      evidenceUrl: "comp-A/uuid-evidencia.pdf",
      evidenceFileName: "evidencia.pdf",
    });

    expect(notifications).toEqual([expect.objectContaining({ user_id: "user-rosa", type: "incident_notified" })]);
    expect(repo.markNotified).toHaveBeenCalledWith("comp-A", expect.any(String), expect.any(String));
    expect(created.notifiedAt).toBeDefined();

    await expect(
      service.createIncident("comp-A", {
        employeeName: "Rosa Flores",
        category: "otro",
        title: "Intento",
        description: "Evidencia de otra empresa.",
        evidenceUrl: "comp-B/uuid-ajena.pdf",
      })
    ).rejects.toThrow("La evidencia no pertenece a tu empresa.");

    await expect(
      service.createIncident("comp-A", {
        employeeName: "Rosa Flores",
        category: "otro",
        title: "Heredada",
        description: "Evidencia heredada en data URI.",
        evidenceUrl: "data:application/pdf;base64,AAAA",
      })
    ).resolves.toBeDefined();
  });
});

describe("Parte 3A: evidencias y Acta Administrativa PDF", () => {
  test("createUploadTarget valida tipo y tamaño y aísla la ruta por empresa", async () => {
    const createSignedUploadUrl = vi.fn(async () => ({ data: { token: "tok" }, error: null }));
    const client = {
      storage: { from: vi.fn(() => ({ createSignedUploadUrl })) },
    } as unknown as SupabaseClient<Database>;
    const service = new IncidentEvidenceService(client, buildFakeRepo());

    await expect(
      service.createUploadTarget("comp-A", { fileName: "a.exe", mimeType: "application/x-msdownload", size: 10 })
    ).rejects.toThrow(/Formato no permitido/);
    await expect(
      service.createUploadTarget("comp-A", { fileName: "a.pdf", mimeType: "application/pdf", size: 6 * 1024 * 1024 })
    ).rejects.toThrow(/5 MB/);

    const target = await service.createUploadTarget("comp-A", {
      fileName: "Receta Médica.pdf",
      mimeType: "application/pdf",
      size: 1024,
    });
    expect(target.token).toBe("tok");
    expect(target.path.startsWith("comp-A/")).toBe(true);
    expect(target.path).toMatch(/Receta_Medica\.pdf$/);
  });

  test("getEvidenceUrl firma rutas de Storage y deja pasar URLs heredadas", async () => {
    const createSignedUrl = vi.fn(async () => ({ data: { signedUrl: "https://signed.test/x" }, error: null }));
    const client = {
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    } as unknown as SupabaseClient<Database>;
    const repo = buildFakeRepo({
      getById: vi.fn(async (_c, id) =>
        id === "storage"
          ? buildIncident({ evidence_url: "comp-A/u-doc.pdf" })
          : id === "legacy"
          ? buildIncident({ evidence_url: "https://cdn.test/doc.pdf" })
          : null
      ),
    });
    const service = new IncidentEvidenceService(client, repo);

    expect(await service.getEvidenceUrl("comp-A", "storage")).toBe("https://signed.test/x");
    expect(createSignedUrl).toHaveBeenCalledWith("comp-A/u-doc.pdf", 300);
    expect(await service.getEvidenceUrl("comp-A", "legacy")).toBe("https://cdn.test/doc.pdf");
    await expect(service.getEvidenceUrl("comp-B", "missing")).rejects.toThrow(/no tiene evidencia/);
  });

  test("buildActaAdministrativaPdf produce un PDF válido con xref correcto y paginación", () => {
    const base = {
      folio: "ABCD1234",
      companyName: "Hoteles Caribe",
      issuedOn: "20 nov 2026",
      employeeName: "Rosa Flores (ñandú)",
      jobTitle: "Supervisora",
      department: "Operaciones",
      categoryLabel: "Acta Administrativa",
      title: "Incumplimiento (grave)",
      incidentDate: "5 oct 2026",
      severity: "alta",
      description: "Hechos.",
      responsibleSupervisor: "RH",
    };
    const pdf = buildActaAdministrativaPdf(base);
    const text = Buffer.from(pdf).toString("latin1");

    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("ACTA ADMINISTRATIVA");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    const xrefOffset = Number(/startxref\n(\d+)/.exec(text)?.[1]);
    expect(text.slice(xrefOffset, xrefOffset + 4)).toBe("xref");
    expect(text).toContain("/Count 1");

    const long = buildActaAdministrativaPdf({ ...base, description: "Hecho relevante. ".repeat(900) });
    expect(Buffer.from(long).toString("latin1")).not.toContain("/Count 1 ");
  });

  test("IncidentActaService arma el acta con la respuesta del trabajador y respeta el aislamiento", async () => {
    const client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { company_name: "Hoteles Caribe", legal_name: null }, error: null }) }),
        }),
      })),
    } as unknown as SupabaseClient<Database>;
    const repo = buildFakeRepo({
      getById: vi.fn(async (companyId, id) =>
        companyId === "comp-A" && id === "inc-12345678"
          ? buildIncident({ acknowledged_at: "2026-10-06T15:00:00.000Z", employee_statement: "Mi descargo." })
          : null
      ),
    });
    const service = new IncidentActaService(client, repo);

    const { fileName, pdf } = await service.generate("comp-A", "inc-12345678");
    expect(fileName).toBe("acta-administrativa-INC-1234.pdf");
    expect(Buffer.from(pdf).toString("latin1")).toContain("Mi descargo.");
    await expect(service.generate("comp-B", "inc-12345678")).rejects.toThrow("Incidencia no encontrada o no autorizada.");
  });
});

describe("Parte 3A: cableado de incidencias en nómina", () => {
  test("parsePayrollImpactConfig: default, valores válidos e inválidos", () => {
    expect(parsePayrollImpactConfig(null)).toEqual(DEFAULT_PAYROLL_IMPACT_CONFIG);
    expect(parsePayrollImpactConfig({ delaysPerAbsence: 2, recognitionBonusDays: 0.5 })).toEqual({
      ...DEFAULT_PAYROLL_IMPACT_CONFIG,
      delaysPerAbsence: 2,
      recognitionBonusDays: 0.5,
    });
    expect(parsePayrollImpactConfig({ delaysPerAbsence: 0, recognitionBonusDays: -1 })).toEqual(
      DEFAULT_PAYROLL_IMPACT_CONFIG
    );
  });

  test("filterPayrollEligibleIncidents: solo aplicadas y sin duplicar asistencia", () => {
    const incidents = [
      { category: "falta_injustificada" as const, status: "aprobado", incident_date: "2026-10-01" },
      { category: "falta_injustificada" as const, status: "pendiente", incident_date: "2026-10-02" },
      { category: "falta_injustificada" as const, status: "aprobado", incident_date: "2026-10-03" },
      { category: "reconocimiento" as const, status: "resuelto", incident_date: "2026-10-04" },
      { category: "incapacidad" as const, status: "rechazado", incident_date: "2026-10-05" },
    ];
    const attendance = [{ work_date: "2026-10-03", status: "falta_injustificada" }];

    expect(filterPayrollEligibleIncidents(incidents, attendance).map((i) => i.incident_date)).toEqual([
      "2026-10-01",
      "2026-10-04",
    ]);
  });

  function buildPayrollClient(payrollImpactConfig: unknown) {
    return {
      from: vi.fn((table: string) => {
        if (table === "company_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "comp-A", company_name: "Hoteles Caribe", legal_name: null, rfc: null, payroll_impact_config: payrollImpactConfig },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "company_employees") {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: async () => ({
                    data: [
                      {
                        id: "emp-1",
                        employee_id: null,
                        full_name: "Rosa Flores",
                        job_title: "Supervisora",
                        department: "Operaciones",
                        avatar_url: null,
                        base_salary_monthly: 12000,
                        payment_frequency: "quincenal",
                        status: "active",
                        rfc: null,
                        curp: null,
                        bank_name: null,
                        clabe_account: null,
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "company_payrolls") {
          return { select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }) };
        }
        if (table === "company_attendance") {
          return { select: () => ({ eq: () => ({ gte: () => ({ lte: async () => ({ data: [], error: null }) }) }) }) };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;
  }

  const refDate = new Date("2026-10-05T18:00:00.000Z");
  const salary = 12000;
  const applied = (category: string, day: number): IncidentRow =>
    buildIncident({ id: `inc-${category}-${day}`, category, incident_date: `2026-10-0${day}`, status: "aprobado" });

  test("la pre-nómina aplica falta, acumulación de retardos (default 3 = 1) y bono de reconocimiento", async () => {
    const repo = buildFakeRepo({
      listByPeriod: vi.fn(async () => [
        applied("falta_injustificada", 1),
        applied("retardo", 2),
        applied("retardo", 3),
        applied("retardo", 4),
        { ...applied("reconocimiento", 5), status: "resuelto" },
        { ...applied("falta_injustificada", 6), status: "pendiente" },
      ]),
    });
    const service = new CompanyPayrollService(buildPayrollClient(null), repo);

    const { summary } = await service.getCompanyPayrollData("comp-A", refDate);
    const emp = summary.employees[0];

    expect(repo.listByPeriod).toHaveBeenCalledWith("comp-A", "2026-10-01", "2026-10-15");
    expect(emp.unjustifiedAbsences).toBe(2);
    expect(emp.absenceDeductions).toBe(2 * calculateAbsenceDeduction(salary, 1));
    expect(emp.performanceBonus).toBe(400);
    expect(emp.punctualityBonus).toBe(0);
    expect(emp.attendanceBonus).toBe(0);
  });

  test("regla por empresa 2 retardos = 1 falta cambia la deducción", async () => {
    const repo = buildFakeRepo({
      listByPeriod: vi.fn(async () => [
        applied("retardo", 1),
        applied("retardo", 2),
        applied("retardo", 3),
        applied("retardo", 4),
      ]),
    });

    const byDefault = await new CompanyPayrollService(buildPayrollClient(null), repo).getCompanyPayrollData("comp-A", refDate);
    const byCompany = await new CompanyPayrollService(
      buildPayrollClient({ delaysPerAbsence: 2 }),
      repo
    ).getCompanyPayrollData("comp-A", refDate);

    expect(byDefault.summary.employees[0].absenceDeductions).toBe(calculateAbsenceDeduction(salary, 1));
    expect(byCompany.summary.employees[0].absenceDeductions).toBe(calculateAbsenceDeduction(salary, 2));
  });

  test("sin incidencias aplicadas la nómina queda igual (bonos por defecto intactos)", async () => {
    const repo = buildFakeRepo({
      listByPeriod: vi.fn(async () => [{ ...applied("falta_injustificada", 1), status: "pendiente" }]),
    });
    const { summary } = await new CompanyPayrollService(buildPayrollClient(null), repo).getCompanyPayrollData("comp-A", refDate);
    const emp = summary.employees[0];

    expect(emp.absenceDeductions).toBe(0);
    expect(emp.unjustifiedAbsences).toBe(0);
    expect(emp.performanceBonus).toBe(0);
    expect(emp.attendanceBonus).toBe(300);
  });
});
