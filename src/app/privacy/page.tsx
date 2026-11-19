import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | K'anPro",
  description: "Aviso de privacidad y protección de datos personales de K'anPro.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6 rounded-3xl border border-border/60 bg-card p-6 sm:p-10 shadow-xs">
        <div className="space-y-2 border-b border-border/50 pb-4">
          <Link href="/" className="text-xs font-semibold text-primary hover:underline">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Aviso de Privacidad Integral
          </h1>
          <p className="text-xs text-muted-foreground">
            Última actualización: noviembre de 2026 • Conforme a la LFPDPPP
          </p>
        </div>

        <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            En K&apos;anPro protegemos tus datos personales y laborales bajo estrictos controles de acceso (Row-Level Security y almacenamiento cifrado) de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
          </p>
          <p>
            <strong className="text-foreground">1. Datos recabados:</strong> Nombre completo, correo electrónico, número telefónico/WhatsApp, zona laboral, historial profesional, documentación oficial (identificación, comprobante de domicilio, CV) y datos fiscales/identificadores (CURP, RFC) necesarios para procesos de selección y contratación.
          </p>
          <p>
            <strong className="text-foreground">2. Finalidades:</strong> Conectar talento con vacantes verificadas, gestionar entrevistas, formalizar contratos laborales y administrar expedientes, asistencia y trámites de recursos humanos autorizados.
          </p>
          <p>
            <strong className="text-foreground">3. Acceso controlado:</strong> La información sensible como CURP y documentos oficiales únicamente se comparte con las empresas ante las que autorices tu postulación o contratación formal.
          </p>
          <p>
            <strong className="text-foreground">4. Derechos ARCO:</strong> Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación u Oposición desde la sección de ajustes de tu cuenta o a través de{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              Contacto
            </Link>. Consulta también nuestros{" "}
            <Link href="/terms" className="text-primary underline underline-offset-4">
              Términos y Condiciones
            </Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
