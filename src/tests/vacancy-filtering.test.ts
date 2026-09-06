import { describe, it, expect } from "vitest";

interface MockApplicant {
  id: string;
  name: string;
  status: "Pendiente" | "En revisión" | "Preseleccionado" | "Entrevista" | "Contratado" | "Descartado";
  vacancyId: string;
  vacancyTitle: string;
}

interface MockVacancy {
  id: string;
  title: string;
}

function calculateVacanciesWithCounts(vacancies: MockVacancy[], applicants: MockApplicant[]) {
  const map = new Map<string, { id: string; title: string; applicantCount: number }>();

  vacancies.forEach((vac) => {
    map.set(vac.id, { id: vac.id, title: vac.title, applicantCount: 0 });
  });

  applicants.forEach((app) => {
    if (app.vacancyId) {
      if (map.has(app.vacancyId)) {
        map.get(app.vacancyId)!.applicantCount += 1;
      } else {
        map.set(app.vacancyId, {
          id: app.vacancyId,
          title: app.vacancyTitle || "Vacante",
          applicantCount: 1,
        });
      }
    }
  });

  return Array.from(map.values());
}

function calculateScopedMetrics(applicants: MockApplicant[], selectedVacancyId: string) {
  const currentScopeApplicants =
    selectedVacancyId === "all"
      ? applicants
      : applicants.filter((a) => a.vacancyId === selectedVacancyId);

  const total = currentScopeApplicants.length;
  const pending = currentScopeApplicants.filter(
    (a) => a.status === "Pendiente" || a.status === "En revisión"
  ).length;
  const shortlisted = currentScopeApplicants.filter(
    (a) => a.status === "Preseleccionado"
  ).length;
  const interviews = currentScopeApplicants.filter(
    (a) => a.status === "Entrevista"
  ).length;
  const hired = currentScopeApplicants.filter((a) => a.status === "Contratado").length;

  return { total, pending, shortlisted, interviews, hired, count: currentScopeApplicants.length };
}

describe("Vacancy Filtering & Scoped Metrics Logic", () => {
  const mockVacancies: MockVacancy[] = [
    { id: "vac-1", title: "Supervisor(a) de Operaciones" },
    { id: "vac-2", title: "Auxiliar Contable" },
    { id: "vac-3", title: "Desarrollador Full-Stack" },
  ];

  const mockApplicants: MockApplicant[] = [
    { id: "app-1", name: "Ana Gomez", status: "Pendiente", vacancyId: "vac-1", vacancyTitle: "Supervisor(a) de Operaciones" },
    { id: "app-2", name: "Carlos Perez", status: "Preseleccionado", vacancyId: "vac-1", vacancyTitle: "Supervisor(a) de Operaciones" },
    { id: "app-3", name: "Diana Lopez", status: "Entrevista", vacancyId: "vac-1", vacancyTitle: "Supervisor(a) de Operaciones" },
    { id: "app-4", name: "Eduardo Ruiz", status: "Contratado", vacancyId: "vac-1", vacancyTitle: "Supervisor(a) de Operaciones" },
    { id: "app-5", name: "Fernanda Ortiz", status: "Pendiente", vacancyId: "vac-2", vacancyTitle: "Auxiliar Contable" },
    { id: "app-6", name: "Gabriel Soto", status: "En revisión", vacancyId: "vac-2", vacancyTitle: "Auxiliar Contable" },
  ];

  it("calculates exact applicant counts per vacancy including 0 for empty vacancies", () => {
    const counts = calculateVacanciesWithCounts(mockVacancies, mockApplicants);
    expect(counts).toHaveLength(3);

    const vac1 = counts.find((v) => v.id === "vac-1");
    expect(vac1?.applicantCount).toBe(4);

    const vac2 = counts.find((v) => v.id === "vac-2");
    expect(vac2?.applicantCount).toBe(2);

    const vac3 = counts.find((v) => v.id === "vac-3");
    expect(vac3?.applicantCount).toBe(0);
  });

  it("calculates global metrics when selectedVacancyId is 'all'", () => {
    const metrics = calculateScopedMetrics(mockApplicants, "all");
    expect(metrics.total).toBe(6);
    expect(metrics.pending).toBe(3);
    expect(metrics.shortlisted).toBe(1);
    expect(metrics.interviews).toBe(1);
    expect(metrics.hired).toBe(1);
  });

  it("calculates vacancy-specific metrics when filtering by a specific vacancyId", () => {
    const metricsVac1 = calculateScopedMetrics(mockApplicants, "vac-1");
    expect(metricsVac1.total).toBe(4);
    expect(metricsVac1.pending).toBe(1);
    expect(metricsVac1.shortlisted).toBe(1);
    expect(metricsVac1.interviews).toBe(1);
    expect(metricsVac1.hired).toBe(1);

    const metricsVac2 = calculateScopedMetrics(mockApplicants, "vac-2");
    expect(metricsVac2.total).toBe(2);
    expect(metricsVac2.pending).toBe(2);
    expect(metricsVac2.shortlisted).toBe(0);
    expect(metricsVac2.interviews).toBe(0);
    expect(metricsVac2.hired).toBe(0);

    const metricsVac3 = calculateScopedMetrics(mockApplicants, "vac-3");
    expect(metricsVac3.total).toBe(0);
    expect(metricsVac3.pending).toBe(0);
  });
});
