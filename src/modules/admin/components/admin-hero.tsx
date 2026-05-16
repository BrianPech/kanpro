import * as React from "react"
import { Shield } from "lucide-react"

export function AdminHero() {
  return (
    <section className="bg-primary text-primary-foreground rounded-[24px] md:rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
      <div className="relative z-10 max-w-[800px]">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-12 h-[1px] bg-primary-foreground/30"></span>
          <span className="text-[13px] uppercase tracking-widest font-medium text-primary-foreground/80">
            Panel de Administración
          </span>
        </div>
        <h1 className="text-[48px] md:text-[72px] font-medium tracking-tighter leading-[1.0] mb-6">
          Panel de Control
        </h1>
        <p className="text-[18px] text-primary-foreground/90 tracking-[-0.09px] leading-[1.56] mb-6 max-w-[600px]">
          Supervisa usuarios, gestiona contenido y mantén la plataforma segura.
        </p>
        <div className="flex items-center gap-2 text-primary-foreground/70 text-[14px]">
          <Shield className="h-4 w-4" />
          <span>Acceso completo de administrador</span>
        </div>
      </div>
      <div className="absolute -right-[10%] -top-[20%] w-[60%] h-[150%] pointer-events-none opacity-[0.05] rotate-12 mix-blend-overlay">
        <div className="w-full h-full bg-primary-foreground rounded-full blur-[100px]"></div>
      </div>
    </section>
  )
}
