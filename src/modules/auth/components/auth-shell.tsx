import React from "react";
import Image from "next/image";
import Link from "next/link";

interface AuthShellProps {
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({ headerRight, children }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between font-sans selection:bg-primary/20">
      {/* Cabecera */}
      <header className="w-full flex items-center justify-between px-4 py-5 sm:px-8 lg:px-12 shrink-0">
        <Link
          href="/"
          aria-label="K'anPro - Ir al inicio"
          className="relative h-[43.667px] w-[117.087px] shrink-0 select-none"
        >
          <Image
            src="/images/kanpro-mark-light.svg"
            alt=""
            width={34}
            height={38}
            priority
            className="absolute left-0 top-0 h-[38.261px] w-[34.435px] dark:hidden"
          />
          <Image
            src="/images/kanpro-mark-dark.svg"
            alt=""
            width={34}
            height={38}
            priority
            className="absolute left-0 top-0 h-[38.261px] w-[34.435px] hidden dark:block"
          />
          <span className="absolute left-[42.09px] top-[14.67px] text-[24.232px] font-semibold leading-none whitespace-nowrap tracking-normal">
            <span className="text-[#0b0b0b] dark:text-white">an </span>
            <span className="text-link">Pro</span>
          </span>
        </Link>

        {headerRight}
      </header>

      {/* Área principal */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        {children}
      </main>

      {/* Pie de página */}
      <footer className="w-full min-h-[64px] flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-12 text-[13px] leading-[18px] shrink-0">
        <p className="text-muted-foreground font-normal">
          © 2026 K’anPro. México.
        </p>
        <nav
          aria-label="Enlaces legales y soporte"
          className="flex items-center gap-6 font-medium text-link"
        >
          <Link
            href="/privacy"
            className="hover:underline underline-offset-4 transition-colors"
          >
            Aviso de privacidad
          </Link>
          <Link
            href="/terms"
            className="hover:underline underline-offset-4 transition-colors"
          >
            Términos
          </Link>
          <Link
            href="/contact"
            className="hover:underline underline-offset-4 transition-colors"
          >
            Soporte
          </Link>
        </nav>
      </footer>
    </div>
  );
}
