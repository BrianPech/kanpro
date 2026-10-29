import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { submitContactMessageAction } from "@/modules/contact/actions/contact";
import { getAdminClient } from "@/tests/integration/helpers/test-client";

describe("submitContactMessageAction", () => {
  it("should successfully persist anonymous contact messages in support_tickets table", async () => {
    const testEmail = `anon-test-${Date.now()}@test.com`;
    const res = await submitContactMessageAction({
      name: "Anonimo Auditor",
      email: testEmail,
      subject: "Auditoria Cero Confianza",
      message: "Este es un mensaje de prueba anonimo sin sesion.",
    });

    expect(res.success).toBe(true);
    expect(res.ticketNumber).toBeDefined();

    const admin = getAdminClient();
    const { data: ticket } = await admin
      .from("support_tickets")
      .select("*")
      .eq("ticket_number", res.ticketNumber!)
      .single();

    expect(ticket).not.toBeNull();
    expect(ticket?.subject).toBe("Auditoria Cero Confianza");
    expect(ticket?.description).toContain(testEmail);

    // Cleanup
    await admin.from("support_tickets").delete().eq("id", ticket!.id);
  });

  it("should reject invalid email or empty message", async () => {
    const res = await submitContactMessageAction({
      name: "A",
      email: "invalid-email",
      subject: "Test",
      message: "Corto",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
