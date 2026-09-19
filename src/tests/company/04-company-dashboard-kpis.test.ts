import { describe, test, expect } from "vitest";

describe("Fase 4: Empresa - Dashboard y Cálculo de Métricas KPIs en Tiempo Real", () => {
  interface MockEmployee {
    id: string;
    company_id: string;
    full_name: string;
    status: "Contratado" | "Baja" | "active" | "terminated" | "pending";
  }

  interface MockInvitation {
    id: string;
    company_id: string;
    email: string;
    status: "pending" | "sent" | "accepted" | "expired" | "cancelled";
    expires_at: string;
  }

  function calculateWorkforceKPIs(employees: MockEmployee[], invitations: MockInvitation[]) {
    const now = new Date();

    const activeWorkers = employees.filter(
      (e) => e.status === "Contratado" || e.status === "active"
    ).length;

    const terminatedWorkers = employees.filter(
      (e) => e.status === "Baja" || e.status === "terminated"
    ).length;

    const pendingInvitations = invitations.filter((inv) => {
      if (inv.status !== "pending" && inv.status !== "sent") return false;
      return new Date(inv.expires_at) > now;
    }).length;

    const expiredInvitations = invitations.filter((inv) => {
      if (inv.status === "expired") return true;
      if (inv.status === "pending" || inv.status === "sent") {
        return new Date(inv.expires_at) <= now;
      }
      return false;
    }).length;

    const acceptedInvitations = invitations.filter((inv) => inv.status === "accepted").length;

    return {
      totalEmployees: employees.length,
      activeWorkers,
      terminatedWorkers,
      pendingInvitations,
      expiredInvitations,
      acceptedInvitations,
    };
  }

  test("Calcula con exactitud los KPIs con una plantilla y lote de invitaciones conocidas", () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 1000 * 60).toISOString();

    const employees: MockEmployee[] = [
      { id: "e1", company_id: "c1", full_name: "Colaborador 1", status: "Contratado" },
      { id: "e2", company_id: "c1", full_name: "Colaborador 2", status: "active" },
      { id: "e3", company_id: "c1", full_name: "Colaborador 3", status: "Baja" },
      { id: "e4", company_id: "c1", full_name: "Colaborador 4", status: "pending" },
    ];

    const invitations: MockInvitation[] = [
      { id: "i1", company_id: "c1", email: "inv1@test.com", status: "sent", expires_at: futureDate },
      { id: "i2", company_id: "c1", email: "inv2@test.com", status: "pending", expires_at: futureDate },
      { id: "i3", company_id: "c1", email: "inv3@test.com", status: "sent", expires_at: pastDate }, // Expirada por fecha
      { id: "i4", company_id: "c1", email: "inv4@test.com", status: "accepted", expires_at: futureDate },
      { id: "i5", company_id: "c1", email: "inv5@test.com", status: "cancelled", expires_at: futureDate },
    ];

    const kpis = calculateWorkforceKPIs(employees, invitations);

    expect(kpis.totalEmployees).toBe(4);
    expect(kpis.activeWorkers).toBe(2);
    expect(kpis.terminatedWorkers).toBe(1);
    expect(kpis.pendingInvitations).toBe(2); // i1 y i2
    expect(kpis.expiredInvitations).toBe(1); // i3
    expect(kpis.acceptedInvitations).toBe(1); // i4
  });

  test("Transición reactiva: Agregar colaborador activo incrementa activeWorkers en +1", () => {
    const employees: MockEmployee[] = [
      { id: "e1", company_id: "c1", full_name: "Colaborador 1", status: "Contratado" },
    ];
    const invitations: MockInvitation[] = [];

    const before = calculateWorkforceKPIs(employees, invitations);
    expect(before.activeWorkers).toBe(1);

    // Agregar colaborador
    employees.push({
      id: "e2",
      company_id: "c1",
      full_name: "Nuevo Colaborador",
      status: "active",
    });

    const after = calculateWorkforceKPIs(employees, invitations);
    expect(after.activeWorkers).toBe(2);
    expect(after.totalEmployees).toBe(2);
  });

  test("Transición reactiva: Enviar invitación incrementa pendingInvitations en +1", () => {
    const employees: MockEmployee[] = [];
    const invitations: MockInvitation[] = [];

    const before = calculateWorkforceKPIs(employees, invitations);
    expect(before.pendingInvitations).toBe(0);

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    invitations.push({
      id: "inv-new",
      company_id: "c1",
      email: "nuevo@empresa.com",
      status: "sent",
      expires_at: futureDate,
    });

    const after = calculateWorkforceKPIs(employees, invitations);
    expect(after.pendingInvitations).toBe(1);
  });

  test("Transición reactiva: Aceptar invitación decrementa pendingInvitations (-1) e incrementa activeWorkers (+1)", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const employees: MockEmployee[] = [
      { id: "emp-pending", company_id: "c1", full_name: "Candidato", status: "pending" },
    ];
    const invitations: MockInvitation[] = [
      { id: "inv-1", company_id: "c1", email: "candidato@test.com", status: "sent", expires_at: futureDate },
    ];

    const before = calculateWorkforceKPIs(employees, invitations);
    expect(before.activeWorkers).toBe(0);
    expect(before.pendingInvitations).toBe(1);

    // Simular aceptación
    invitations[0].status = "accepted";
    employees[0].status = "active";

    const after = calculateWorkforceKPIs(employees, invitations);
    expect(after.pendingInvitations).toBe(0);
    expect(after.acceptedInvitations).toBe(1);
    expect(after.activeWorkers).toBe(1);
  });

  test("Transición reactiva: Dar de baja colaborador decrementa activeWorkers (-1) e incrementa terminatedWorkers (+1)", () => {
    const employees: MockEmployee[] = [
      { id: "emp-1", company_id: "c1", full_name: "Colaborador", status: "active" },
    ];
    const invitations: MockInvitation[] = [];

    const before = calculateWorkforceKPIs(employees, invitations);
    expect(before.activeWorkers).toBe(1);
    expect(before.terminatedWorkers).toBe(0);

    employees[0].status = "terminated";

    const after = calculateWorkforceKPIs(employees, invitations);
    expect(after.activeWorkers).toBe(0);
    expect(after.terminatedWorkers).toBe(1);
  });
});
