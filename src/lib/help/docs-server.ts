import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface DocMetadata {
  id: string; // slug, e.g. "auditoria-sat"
  slug: string;
  role: "empresas" | "candidatos";
  title: string;
  description?: string;
  badge?: string;
  isNew?: boolean;
  order?: number;
  section: string;
  readTime?: string;
  updatedAt?: string;
  relativeImportPath: string; // e.g. "empresas/02-cumplimiento-y-sat/auditoria-sat"
}

export interface DocSection {
  title: string;
  order: number;
  items: DocMetadata[];
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/help");

// Formatea nombres de carpeta como "01-primeros-pasos" a "Primeros Pasos"
function formatFolderName(folder: string): string {
  const clean = folder.replace(/^\d+[-_]/, "");
  return clean
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Extrae el orden numérico inicial (ej. "01-primeros-pasos" -> 1)
function extractFolderOrder(folder: string): number {
  const match = folder.match(/^(\d+)[-_]/);
  return match ? parseInt(match[1], 10) : 99;
}

// Escanea recursivamente un directorio en busca de archivos .mdx
function scanMdxDirectory(
  baseDir: string,
  role: "empresas" | "candidatos",
  currentSubdir = ""
): DocMetadata[] {
  const dirPath = path.join(baseDir, currentSubdir);
  if (!fs.existsSync(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: DocMetadata[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(currentSubdir, entry.name);

    if (entry.isDirectory()) {
      results.push(...scanMdxDirectory(baseDir, role, relPath));
    } else if (entry.isFile() && (entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))) {
      const fileContent = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(fileContent);

      const slug = entry.name.replace(/\.(mdx|md)$/, "");
      const folderSection = currentSubdir ? formatFolderName(currentSubdir.split(path.sep)[0]) : "General";
      const sectionName = data.section || folderSection;
      const sectionOrder = currentSubdir ? extractFolderOrder(currentSubdir.split(path.sep)[0]) : 99;

      const importPath = `${role}/${relPath.replace(/\.(mdx|md)$/, "")}`;

      results.push({
        id: slug,
        slug,
        role,
        title: data.title || slug.replace(/[-_]/g, " "),
        description: data.description || "",
        badge: data.badge,
        isNew: Boolean(data.isNew),
        order: data.order !== undefined ? Number(data.order) : 99,
        section: sectionName,
        readTime: data.readTime || "3 min",
        updatedAt: data.updatedAt || "Septiembre 2026",
        relativeImportPath: importPath,
      });
    }
  }

  return results;
}

// Obtiene la navegación completa agrupada por secciones para un rol específico
export function getHelpNavigation(role: "empresas" | "candidatos"): DocSection[] {
  const roleDir = path.join(CONTENT_DIR, role);
  const docs = scanMdxDirectory(roleDir, role);

  // Agrupar por sección
  const sectionsMap = new Map<string, DocMetadata[]>();

  for (const doc of docs) {
    const list = sectionsMap.get(doc.section) || [];
    list.push(doc);
    sectionsMap.set(doc.section, list);
  }

  const sections: DocSection[] = [];

  for (const [title, items] of sectionsMap.entries()) {
    // Ordenar items dentro de la sección
    items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    // Determinar orden de la sección basado en el primer elemento o convención
    const firstDocDir = items[0]?.relativeImportPath.split("/")[1] || "";
    const sectionOrder = extractFolderOrder(firstDocDir);

    sections.push({
      title,
      order: sectionOrder,
      items,
    });
  }

  // Ordenar secciones
  sections.sort((a, b) => a.order - b.order);

  return sections;
}

// Obtiene todos los documentos para ambos roles (para búsqueda y sitemap)
export function getAllHelpDocs(): DocMetadata[] {
  const empresasDocs = scanMdxDirectory(path.join(CONTENT_DIR, "empresas"), "empresas");
  const candidatosDocs = scanMdxDirectory(path.join(CONTENT_DIR, "candidatos"), "candidatos");
  return [...empresasDocs, ...candidatosDocs];
}

// Busca un documento específico por categoría y slug
export function findDocMetadata(category: string, slug: string): DocMetadata | null {
  const role = category.includes("empresa") ? "empresas" : "candidatos";
  const docs = scanMdxDirectory(path.join(CONTENT_DIR, role), role);
  return docs.find((d) => d.slug === slug || d.id === slug) || null;
}
