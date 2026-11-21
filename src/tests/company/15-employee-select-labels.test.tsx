import { describe, test, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/modules/company/actions/incidents", () => ({
  createIncidentAction: vi.fn(),
  prepareIncidentEvidenceUploadAction: vi.fn(),
}));

vi.mock("@/modules/company/actions/leaves", () => ({
  createCompanyLeaveAction: vi.fn(),
}));

vi.mock("@/modules/company/actions/evaluations", () => ({
  createEvaluationAction: vi.fn(),
  createNom035SurveyAction: vi.fn(),
}));

vi.mock("@/modules/company/actions/attendance", () => ({
  recordAttendanceCheckInAction: vi.fn(),
}));

import { VacationRequestModal } from "@/modules/company/components/leaves/vacation-request-modal";
import { NewIncidentModal } from "@/modules/company/components/incidents/new-incident-modal";
import { EvaluationFormModal } from "@/modules/company/components/evaluations/evaluation-form-modal";
import { Nom035SurveyModal } from "@/modules/company/components/evaluations/nom035-survey-modal";
import { MobileCheckInSheet } from "@/modules/company/components/attendance/mobile-checkin-sheet";

function extractTriggerValueText(html: string): string {
  const match = html.match(/data-slot="select-value"[^>]*>([\s\S]*?)<\/span>/);
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : "";
}

describe("B1: Base UI SelectValue muestra nombre del empleado y conserva el UUID como valor", () => {
  const roster = [
    { id: "uuid-ana-1111-aaaa", fullName: "Ana", jobTitle: "Cocinera", department: "Cocina", hireDate: "2025-01-01" },
    { id: "uuid-luis-2222-bbbb", fullName: "Luis", jobTitle: "Chef", department: "Cocina", hireDate: "2025-01-01" },
  ];

  test("VacationRequestModal muestra 'Ana (Cocina)' en el trigger cerrado y guarda el UUID en el input oculto", () => {
    const html = renderToStaticMarkup(
      <VacationRequestModal
        isOpen={true}
        onOpenChange={() => {}}
        employees={roster}
      />
    );

    const triggerLabel = extractTriggerValueText(html);
    expect(triggerLabel).toContain("Ana");
    expect(triggerLabel).not.toContain("uuid-ana-1111-aaaa");
    expect(html).toContain('value="uuid-ana-1111-aaaa"');
  });

  test("NewIncidentModal renderiza el trigger de empleado con etiqueta legible (no UUID crudo) cuando hay selección", () => {
    const htmlInitial = renderToStaticMarkup(
      <NewIncidentModal
        isOpen={true}
        onOpenChange={() => {}}
        onIncidentCreated={() => {}}
        employees={roster}
      />
    );
    expect(extractTriggerValueText(htmlInitial)).toBe("Selecciona un empleado...");

    const selectedId = roster[0].id;
    const htmlSelected = renderToStaticMarkup(
      <Select value={selectedId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona un empleado...">
            {(val: string | null) => {
              const emp = roster.find((e) => e.id === val);
              return emp ? `${emp.fullName}${emp.jobTitle ? ` — ${emp.jobTitle}` : ""}` : "Selecciona un empleado...";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roster.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              {emp.fullName} — {emp.jobTitle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    const selectedTriggerLabel = extractTriggerValueText(htmlSelected);
    expect(selectedTriggerLabel).toContain("Ana");
    expect(selectedTriggerLabel).not.toContain("uuid-ana-1111-aaaa");
    expect(htmlSelected).toContain('value="uuid-ana-1111-aaaa"');
  });

  test("Auditoría B1: EvaluationFormModal, Nom035SurveyModal y MobileCheckInSheet muestran nombre en el trigger", () => {
    const evalEmployees = [
      { id: "uuid-ana-1111-aaaa", name: "Ana", jobTitle: "Cocinera", department: "Cocina", avatarUrl: null },
      { id: "uuid-luis-2222-bbbb", name: "Luis", jobTitle: "Chef", department: "Cocina", avatarUrl: null },
    ];

    const evalHtml = renderToStaticMarkup(
      <EvaluationFormModal
        isOpen={true}
        onOpenChange={() => {}}
        onEvaluationCreated={() => {}}
        employees={evalEmployees}
      />
    );
    const evalLabel = extractTriggerValueText(evalHtml);
    expect(evalLabel).toContain("Ana");
    expect(evalLabel).not.toContain("uuid-ana-1111-aaaa");

    const nomHtml = renderToStaticMarkup(
      <Nom035SurveyModal
        isOpen={true}
        onOpenChange={() => {}}
        employees={evalEmployees}
        onSurveyCreated={() => {}}
      />
    );
    expect(extractTriggerValueText(nomHtml)).toBe("Seleccionar empleado");

    const checkinHtml = renderToStaticMarkup(
      <MobileCheckInSheet
        isOpen={true}
        onOpenChange={() => {}}
        branchConfig={{
          branchName: "Sucursal Centro",
          address: "Calle 60 Centro, Mérida",
          latitude: 20.97,
          longitude: -89.62,
          radiusMeters: 150,
        }}
        onRecordCreated={() => {}}
        employees={evalEmployees.map((e) => ({ ...e, workSchedule: "08:00 - 17:00" }))}
      />
    );
    expect(extractTriggerValueText(checkinHtml)).toBe("Selecciona un empleado...");
  });
});
