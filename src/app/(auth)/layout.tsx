"use client";

import React from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { KanproIsotype } from "@/components/ui/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-primary/20 relative">
      {/* ── Top Bar: Minimalist Logo & Theme Switcher ── */}
      <header className="flex items-center justify-between w-full max-w-4xl mx-auto select-none shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <KanproIsotype className="size-4.5" variant="white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-foreground">
            K&apos;anPro
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ModeToggle className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" />
        </div>
      </header>

      {/* ── Center Content: Centered without borders or outer box containers ── */}
      <main className="w-full max-w-[420px] sm:max-w-[440px] mx-auto my-auto py-8 sm:py-12 flex flex-col items-center justify-center">
        {children}
      </main>

      {/* ── Minimalist Footer ── */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-6 text-xs text-muted-foreground select-none shrink-0">
        <span>© 2026 K&apos;anPro. México.</span>
        <div className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Aviso de Privacidad
          </Link>
          <span>•</span>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Términos
          </Link>
          <span>•</span>
          <Link
            href="/contact"
            className="hover:text-foreground transition-colors"
          >
            Soporte
          </Link>
        </div>
      </footer>
    </div>
  );
}
