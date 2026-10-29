"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthHeroPanel } from "@/modules/auth/components/auth-hero-panel";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { ArrowLeft, Kanban } from "@/components/ui/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Compute top-right contextual navigation link
  const isRegister = pathname?.startsWith("/register");
  const isLogin = pathname === "/login";
  const isPasswordRecovery =
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password");

  return (
    <div className="min-h-screen w-full bg-[#f4f2ee] dark:bg-zinc-950 flex items-center justify-center p-0 sm:p-4 lg:p-6 font-sans selection:bg-primary/20">
      {/* ── Master Floating Rounded Card Shell ── */}
      <div className="w-full max-w-[1140px] xl:max-w-[1200px] min-h-screen sm:min-h-[680px] lg:h-[calc(100vh-3rem)] max-h-[920px] bg-card rounded-none sm:rounded-[32px] border-0 sm:border sm:border-border/80 dark:sm:border-white/10 shadow-none sm:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.08)] dark:sm:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* ── Left Column: Reference-Inspired Ambient Branded Hero Panel (5 cols) ── */}
        <AuthHeroPanel />

        {/* ── Right Column: Interactive Form & Context Canvas (7 cols) ── */}
        <main className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-5 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto bg-card text-foreground">
          
          {/* Top Bar: Brand Logo, Contextual Action Link & Theme Toggle */}
          <header className="flex items-center justify-between w-full pb-4 sm:pb-6 select-none shrink-0 border-b border-border/40 sm:border-transparent">
            {/* Logo / Back Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Kanban className="size-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-foreground">
                K&apos;anPro
              </span>
            </Link>

            {/* Top Right Contextual Switch Link & Theme Toggle */}
            <div className="flex items-center gap-3">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                {isRegister && (
                  <>
                    <span className="hidden sm:inline">¿Ya tienes cuenta?</span>
                    <Link
                      href="/login"
                      className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      Iniciar Sesión
                    </Link>
                  </>
                )}

                {isLogin && (
                  <>
                    <span className="hidden sm:inline">¿No tienes cuenta?</span>
                    <Link
                      href="/register"
                      className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      Registrarse
                    </Link>
                  </>
                )}

                {isPasswordRecovery && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Volver a Iniciar Sesión</span>
                  </Link>
                )}

                {!isRegister && !isLogin && !isPasswordRecovery && (
                  <Link
                    href="/login"
                    className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </div>

              {/* Mode Toggle for switching between Light and Dark mode */}
              <div className="pl-2 border-l border-border/60">
                <ModeToggle className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" />
              </div>
            </div>
          </header>

          {/* Center Content Canvas: Wraps Forms & Views */}
          <div className="my-auto py-4 sm:py-6 w-full max-w-[440px] mx-auto flex flex-col items-center">
            {children}
          </div>

          {/* Bottom Bar: Copyright & Helpful Legal Links */}
          <footer className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 sm:pt-6 text-xs text-muted-foreground select-none shrink-0 border-t border-border/40">
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
        </main>
      </div>
    </div>
  );
}
