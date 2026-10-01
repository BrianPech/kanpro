import { describe, it, expect } from "vitest";
import { getHelpNavigation, getAllHelpDocs, findDocMetadata } from "@/lib/help/docs-server";

describe("Help Center Automated MDX Navigation Generator", () => {
  it("generates navigation tree automatically for empresas", () => {
    const sections = getHelpNavigation("empresas");

    expect(sections.length).toBeGreaterThan(0);

    // Debe contener las secciones escaneadas de las carpetas
    const sectionTitles = sections.map((s) => s.title);
    expect(sectionTitles).toContain("Primeros Pasos");
    expect(sectionTitles).toContain("Cumplimiento Y Sat");
    expect(sectionTitles).toContain("Vacantes Y Proximidad");
    expect(sectionTitles).toContain("Vinculacion Y Candidatos");

    // Verificar que los items dentro de Cumplimiento Y Sat tengan metadata
    const satSection = sections.find((s) => s.title === "Cumplimiento Y Sat");
    expect(satSection).toBeDefined();
    expect(satSection?.items.length).toBeGreaterThan(0);

    const satDoc = satSection?.items.find((i) => i.id === "auditoria-sat");
    expect(satDoc).toBeDefined();
    expect(satDoc?.title).toBe("Auditoría de 13 Puntos y Cumplimiento SAT");
    expect(satDoc?.badge).toBe("Obligatorio");
    expect(satDoc?.readTime).toBe("4 min");
  });

  it("generates navigation tree automatically for candidatos", () => {
    const sections = getHelpNavigation("candidatos");

    expect(sections.length).toBeGreaterThan(0);

    const sectionTitles = sections.map((s) => s.title);
    expect(sectionTitles).toContain("Primeros Pasos");
    expect(sectionTitles).toContain("Postulaciones");
    expect(sectionTitles).toContain("Seguridad Y Derechos");

    const primerosPasos = sections.find((s) => s.title === "Primeros Pasos");
    const registroDoc = primerosPasos?.items.find((i) => i.id === "registro-candidato");
    expect(registroDoc).toBeDefined();
    expect(registroDoc?.title).toBe("Registro de Candidato y Creación de Perfil");
    expect(registroDoc?.badge).toBe("Inicio Rápido");
  });

  it("finds doc metadata correctly by category and slug", () => {
    const doc = findDocMetadata("empresas", "auditoria-sat");
    expect(doc).not.toBeNull();
    expect(doc?.id).toBe("auditoria-sat");
    expect(doc?.role).toBe("empresas");
    expect(doc?.relativeImportPath).toBe("empresas/02-cumplimiento-y-sat/auditoria-sat");
  });

  it("retrieves all help docs for search indexing", () => {
    const allDocs = getAllHelpDocs();
    expect(allDocs.length).toBeGreaterThanOrEqual(8);
    const slugs = allDocs.map((d) => d.slug);
    expect(slugs).toContain("auditoria-sat");
    expect(slugs).toContain("publicar-vacante");
    expect(slugs).toContain("registro-candidato");
    expect(slugs).toContain("postulacion-1clic");
  });
});
