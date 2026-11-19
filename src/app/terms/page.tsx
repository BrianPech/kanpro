import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | K'anPro",
  description: "Términos y condiciones de uso de la plataforma K'anPro.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6 rounded-3xl border border-border/60 bg-card p-6 sm:p-10 shadow-xs">
        <div className="space-y-2 border-b border-border/50 pb-4">
          <Link href="/" className="text-xs font-semibold text-primary hover:underline">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-xs text-muted-foreground">
            Última actualización: noviembre de 2026 • K&apos;anPro México
          </p>
        </div>

        <section className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            El acceso y uso de K&apos;anPro implica la aceptación de estos términos aplicables a personas candidatas, empresas empleadoras y administradores autorizados dentro de la plataforma.
          </p>
          <p>
            <strong className="text-foreground">1. Veracidad de la información:</strong> Las empresas y personas candidatas son responsables de la autenticidad de los datos, vacantes, comprobantes fiscales (RFC), CURP y documentación laboral cargada en su expediente.
          </p>
          <p>
            <strong className="text-foreground">2. Relaciones laborales y contratos digitales:</strong> K&apos;anPro provee herramientas tecnológicas para vinculación laboral, seguimiento de postulaciones, asistencia y emisión/firma electrónica de documentos conforme a la Ley Federal del Trabajo y el Código de Comercio vigentes en México.
          </p>
          <p>
            <strong className="text-foreground">3. Uso permitido:</strong> Queda prohibido el uso de la plataforma para ofertas discriminatorias, fraudulentas o la extracción no autorizada de datos personales de terceros.
          </p>
          <p>
            <strong className="text-foreground">4. Contacto y soporte:</strong> Para aclaraciones sobre estos términos, visita{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              Contacto
            </Link>{" "}
            o consulta el{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-4">
              Aviso de Privacidad
            </Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
