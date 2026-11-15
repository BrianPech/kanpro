import { describe, expect, it, vi } from "vitest";
import { companyRegisterCredentialsSchema } from "../schemas/register.schema";
import { companyOnboardingWorkspaceSchema } from "../schemas/onboarding.schema";
import { updateOwnerNameSchema } from "@/modules/company/schemas/tenant.schema";
import { companyTenantService } from "@/modules/company/services/company-tenant.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

describe("Company Registration & Onboarding Flow", () => {
  it("validates email and matching passwords in step 1", () => {
    const valid = companyRegisterCredentialsSchema.safeParse({
      email: "owner@grupo.mx",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(valid.success).toBe(true);

    const mismatch = companyRegisterCredentialsSchema.safeParse({
      email: "owner@grupo.mx",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(mismatch.success).toBe(false);
  });

  it("validates owner name in onboarding step 1", () => {
    expect(updateOwnerNameSchema.safeParse({ fullName: "Carlos Méndez" }).success).toBe(true);
    expect(updateOwnerNameSchema.safeParse({ fullName: "A" }).success).toBe(false);
  });

  it("requires company_name and location in onboarding step 2", () => {
    const valid = companyOnboardingWorkspaceSchema.safeParse({
      company_name: "Grupo Hotelero Mayab",
      location: "Mérida, Yucatán",
    });
    expect(valid.success).toBe(true);

    const missingLocation = companyOnboardingWorkspaceSchema.safeParse({
      company_name: "Grupo Hotelero Mayab",
      location: "",
    });
    expect(missingLocation.success).toBe(false);
  });

  it("updates owner personal name via companyTenantService", async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock });
    const updateUserMock = vi.fn().mockResolvedValue({ error: null });

    const mockSupabase = {
      from: fromMock,
      auth: { updateUser: updateUserMock },
    } as unknown as SupabaseClient<Database>;

    const result = await companyTenantService.updateOwnerPersonalName(
      "user-123",
      "  Carlos Méndez  ",
      mockSupabase
    );

    expect(result).toEqual({ fullName: "Carlos Méndez" });
    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: "Carlos Méndez" })
    );
    expect(eqMock).toHaveBeenCalledWith("id", "user-123");
  });
});
