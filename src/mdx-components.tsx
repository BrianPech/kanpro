import type { MDXComponents } from "mdx/types";
import React from "react";
import Link from "next/link";
import { Callout, StepList, Step } from "@/components/help/mdx-custom-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...components,
    // Custom interactive components available directly in MDX docs
    Callout,
    StepList,
    Step,
    Badge,
    Button,

    // El encabezado de página ya renderiza el título H1 principal con metadatos.
    // Omitimos el H1 duplicado del MDX para mantener coherencia visual limpia.
    h1: () => null,

    // Base HTML typography styled with Tailwind & shadcn tokens
    h2: ({ children, ...props }) => (
      <h2
        className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-heading mt-8 mb-3 pb-2 border-b border-border"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-lg sm:text-xl font-semibold tracking-tight text-foreground font-heading mt-6 mb-2"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="text-base font-semibold text-foreground font-heading mt-4 mb-2"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }) => (
      <p
        className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4"
        {...props}
      >
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc pl-6 space-y-1.5 text-sm sm:text-base text-muted-foreground mb-4"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal pl-6 space-y-1.5 text-sm sm:text-base text-muted-foreground mb-4"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-2 border-primary/50 pl-4 py-1 italic text-muted-foreground my-4 bg-muted/20 rounded-r-lg"
        {...props}
      >
        {children}
      </blockquote>
    ),
    hr: ({ ...props }) => <hr className="border-border my-8" {...props} />,
    table: ({ children, ...props }) => (
      <div className="my-6 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <table
          className="w-full border-collapse text-xs sm:text-sm text-left"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border-b border-border bg-muted/50 p-3 font-semibold text-xs font-mono uppercase tracking-wider text-foreground"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="border-b border-border/50 p-3 text-muted-foreground"
        {...props}
      >
        {children}
      </td>
    ),
    code: ({ children, ...props }) => (
      <code
        className="px-1.5 py-0.5 rounded-md font-mono text-xs bg-muted text-foreground border border-border"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ...props }) => (
      <pre
        className="p-4 rounded-xl bg-muted/40 border border-border overflow-x-auto text-xs font-mono my-4 text-foreground"
        {...props}
      >
        {children}
      </pre>
    ),
    a: ({ href = "", children, ...props }) => {
      const isInternal = href.startsWith("/") || href.startsWith("#");
      if (isInternal) {
        return (
          <Link
            href={href}
            className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium transition-colors"
            {...props}
          >
            {children}
          </Link>
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium transition-colors inline-flex items-center gap-1"
          {...props}
        >
          {children}
        </a>
      );
    },
  };
}
