import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks whether a `render` prop passed to a Base UI component represents a non-button element
 * (e.g. `<Link />`, `<a />`, `<div>`, etc.) so that `nativeButton={false}` can be safely applied.
 */
export function isNonButtonRender(render: unknown): boolean {
  if (!React.isValidElement(render)) return false
  if (typeof render.type === "string") {
    return render.type !== "button"
  }
  if ((render.props as any)?.href !== undefined) {
    return true
  }
  const name = (render.type as any)?.displayName || (render.type as any)?.name || ""
  if (name === "Link" || name.includes("Link")) {
    return true
  }
  return false
}
