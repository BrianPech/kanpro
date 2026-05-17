import * as React from "react"
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard"

export default async function CompanyDashboard() {
  const { companyName } = await getCompanyDashboardData()


  return (
    <div className="flex flex-col gap-16 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="bg-primary text-primary-foreground rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-[800px]">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-[1px] bg-primary-foreground/30"></span>
            <span className="text-[13px] uppercase tracking-widest font-medium text-primary-foreground/80">Panel de Empresa</span>
          </div>
          <h1 className="text-[56px] md:text-[80px] font-medium tracking-tighter leading-[1.0] mb-6">
            Bienvenido,<br />{companyName}.
          </h1>
          <p className="text-[18px] text-primary-foreground/90 tracking-[-0.09px] leading-[1.56] mb-10 max-w-[500px]">
            Tu panel de control está listo. Aquí podrás buscar el mejor talento y gestionar tus proyectos abiertos.
          </p>
        </div>
        <div className="absolute -right-[10%] -top-[20%] w-[60%] h-[150%] pointer-events-none opacity-[0.05] rotate-12 mix-blend-overlay">
          <div className="w-full h-full bg-primary-foreground rounded-full blur-[100px]"></div>
        </div>
      </section>
    </div>
  )
}
