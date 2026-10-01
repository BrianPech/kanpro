import type React from "react";
import {
  findDocMetadata,
  getAllHelpDocs,
  getHelpNavigation,
  type DocMetadata,
  type DocSection,
} from "./docs-server";

export type { DocMetadata, DocSection };
export { getHelpNavigation, getAllHelpDocs };

export async function getDocArticle(category: string, slug: string) {
  const meta = findDocMetadata(category, slug);
  if (!meta) return null;

  try {
    const mod = await import(`@/content/help/${meta.relativeImportPath}.mdx`);
    return {
      MDXContent: mod.default as React.ComponentType,
      metadata: {
        ...meta,
        ...(mod.metadata || {}),
      },
    };
  } catch (error) {
    console.error(`Error loading MDX doc for ${meta.relativeImportPath}:`, error);
    return null;
  }
}

export function getAllDocSlugs() {
  const allDocs = getAllHelpDocs();
  return allDocs.map((item) => ({
    category: item.role,
    slug: item.slug,
  }));
}
