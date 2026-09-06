import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Base UI DropdownMenu Safety", () => {
  test("nav-user.tsx does not use DropdownMenuLabel outside DropdownMenuGroup", () => {
    const filePath = path.resolve(__dirname, "../components/shared/nav-user.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // DropdownMenuLabel in Base UI throws if not inside <Menu.Group>.
    // nav-user uses a custom header card <div> instead.
    expect(content.includes("<DropdownMenuLabel")).toBe(false);
    expect(content.includes("DropdownMenuGroup")).toBe(true);
  });

  test("reports-data-table.tsx wraps DropdownMenuLabel inside DropdownMenuGroup", () => {
    const filePath = path.resolve(__dirname, "../modules/admin/components/reports-data-table.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // In Base UI, DropdownMenuLabel must be inside DropdownMenuGroup
    const hasLabel = content.includes("<DropdownMenuLabel");
    if (hasLabel) {
      expect(content.includes("<DropdownMenuGroup>")).toBe(true);
    }
  });
});
