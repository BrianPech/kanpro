import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEMO_ROLLOUT,
  getLockedModuleBadge,
  getModulesForPhase,
  isCompanyRouteAllowed,
  normalizeDemoRollout,
} from "@/modules/company/config/demo-rollout";

describe("DEMO progressive module rollout", () => {
  it("allows Week 1 and Week 2 routes (including leaves and incidents) by default and locks Week 3-4 routes", () => {
    const enabled = DEFAULT_DEMO_ROLLOUT.enabledModules;

    expect(DEFAULT_DEMO_ROLLOUT.activePhase).toBe(2);
    expect(isCompanyRouteAllowed("/dashboard/company", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/vacancies", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/vacancies/new", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/applications", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/employees", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/areas", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/contracts", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/profile", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/attendance", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/leaves", enabled)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/incidents", enabled)).toBe(true);

    // Locked in Week 2
    expect(isCompanyRouteAllowed("/dashboard/company/evaluations", enabled)).toBe(false);
    expect(getLockedModuleBadge("/dashboard/company/evaluations", enabled)).toBe("Semana 3");
    expect(getLockedModuleBadge("/dashboard/company/payroll", enabled)).toBe("Semana 4");

    // Week 1 phase still locks Week 2 routes
    const phase1 = getModulesForPhase(1);
    expect(isCompanyRouteAllowed("/dashboard/company/leaves", phase1)).toBe(false);
    expect(getLockedModuleBadge("/dashboard/company/leaves", phase1)).toBe("Semana 2");
    expect(getLockedModuleBadge("/dashboard/company/incidents", phase1)).toBe("Semana 2");
  });

  it("unlocks progressive modules per phase and normalizes raw settings safely", () => {
    const phase2 = getModulesForPhase(2);
    expect(isCompanyRouteAllowed("/dashboard/company/attendance", phase2)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/leaves", phase2)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/contracts", phase2)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/evaluations", phase2)).toBe(false);

    const phase4 = getModulesForPhase(4);
    expect(isCompanyRouteAllowed("/dashboard/company/payroll", phase4)).toBe(true);
    expect(isCompanyRouteAllowed("/dashboard/company/reports", phase4)).toBe(true);

    const normalized = normalizeDemoRollout({
      activePhase: 3,
      enabledModules: ["vacancies", "payroll", "invalid_module"],
    });
    expect(normalized.activePhase).toBe(3);
    expect(normalized.enabledModules).toContain("vacancies");
    expect(normalized.enabledModules).toContain("payroll");
    expect(normalized.enabledModules).toContain("dashboard"); // alwaysEnabled
    expect(normalized.enabledModules).toContain("contracts"); // alwaysEnabled from Week 1
    expect(normalized.enabledModules).not.toContain("invalid_module");
  });
});
