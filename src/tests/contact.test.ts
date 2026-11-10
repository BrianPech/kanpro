import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockInsert = vi.fn();
const mockAdmin = {
  from: vi.fn(() => ({
    insert: mockInsert,
  })),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdmin),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
  })),
}));

import { submitContactMessageAction } from "@/modules/contact/actions/contact";

describe("submitContactMessageAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

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
    expect(mockAdmin.from).toHaveBeenCalledWith("support_tickets");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Auditoria Cero Confianza",
        category: "general",
        priority: "media",
        status: "abierto",
      })
    );
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
