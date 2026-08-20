"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Kanban, ArrowUpRight, Menu, X, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function getSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          setRole(profile?.role || "candidate");
        }
      } catch {
        // silent
      }
    }
    getSession();
  }, []);

  const dashboardUrl = role === "admin"
    ? "/dashboard/admin"
    : role === "company"
      ? "/dashboard/company"
      : "/dashboard/candidate";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--color-fiord-200)]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px]">
          
          {/* Brand Wordmark with Fiord Glyph */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-8 rounded-full bg-[var(--color-fiord-950)] text-white flex items-center justify-center font-bold transition-transform group-hover:scale-95 shadow-xs">
              <Kanban className="size-4.5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-[-0.5px] text-[var(--color-fiord-950)] font-sans">
                K&apos;anPro
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[var(--color-fiord-600)] uppercase font-semibold hidden sm:inline">
                SURESTE
              </span>
            </div>
          </Link>

          {/* Desktop Center Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold text-[var(--color-fiord-700)]">
            <Link href="#empresas" className="hover:text-[var(--color-fiord-950)] transition-colors">
              Empresas
            </Link>
            <Link href="#candidatos" className="hover:text-[var(--color-fiord-950)] transition-colors">
              Candidatos
            </Link>
            <Link href="#verificacion" className="hover:text-[var(--color-fiord-950)] transition-colors">
              Verificación SAT
            </Link>
            <Link href="#planes" className="hover:text-[var(--color-fiord-950)] transition-colors">
              Tarifas
            </Link>
            <Link href="#faq" className="hover:text-[var(--color-fiord-950)] transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Right Action Group */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href={dashboardUrl}
                className="h-10 px-5 rounded-full bg-[var(--color-fiord-950)] text-white hover:bg-[var(--color-fiord-900)] text-[14px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <LayoutDashboard className="size-4" />
                <span>Panel {role === "company" ? "Empresa" : "Candidato"}</span>
                <ArrowUpRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[14px] font-semibold text-[var(--color-fiord-700)] hover:text-[var(--color-fiord-950)] px-3 py-2 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register/candidate"
                  className="h-10 px-4.5 rounded-full border border-[var(--color-fiord-200)] bg-white hover:bg-[var(--color-fiord-50)] text-[var(--color-fiord-950)] text-[13px] font-semibold flex items-center transition-colors shadow-2xs"
                >
                  Soy Candidato
                </Link>
                <Link
                  href="/register/company"
                  className="h-10 px-5 rounded-full bg-[var(--color-fiord-950)] text-white hover:bg-[var(--color-fiord-900)] text-[13px] font-semibold flex items-center gap-1 transition-colors shadow-xs"
                >
                  <span>Publicar vacante</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-full text-[var(--color-fiord-950)] hover:bg-[var(--color-fiord-50)] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-[var(--color-fiord-200)] px-6 py-6 space-y-4 shadow-lg text-left">
          <nav className="flex flex-col gap-3 text-[15px] font-semibold text-[var(--color-fiord-800)]">
            <Link
              href="#empresas"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-[var(--color-fiord-100)]"
            >
              Para Empresas
            </Link>
            <Link
              href="#candidatos"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-[var(--color-fiord-100)]"
            >
              Para Candidatos
            </Link>
            <Link
              href="#verificacion"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-[var(--color-fiord-100)]"
            >
              Verificación SAT y Expediente
            </Link>
            <Link
              href="#planes"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-[var(--color-fiord-100)]"
            >
              Tarifas sin comisiones
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="py-2"
            >
              Preguntas frecuentes
            </Link>
          </nav>

          <div className="pt-3 flex flex-col gap-2.5">
            {user ? (
              <Link
                href={dashboardUrl}
                onClick={() => setMobileOpen(false)}
                className="w-full h-11 rounded-full bg-[var(--color-fiord-950)] text-white font-semibold text-[14px] flex items-center justify-center shadow-xs"
              >
                Ir a mi Panel ({role === "company" ? "Empresa" : "Candidato"})
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full h-11 rounded-full border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] font-semibold text-[14px] flex items-center justify-center hover:bg-[var(--color-fiord-50)]"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register/company"
                  onClick={() => setMobileOpen(false)}
                  className="w-full h-11 rounded-full bg-[var(--color-fiord-950)] text-white font-semibold text-[14px] flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Publicar vacante como Empresa</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
