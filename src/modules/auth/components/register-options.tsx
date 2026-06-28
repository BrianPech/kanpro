"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Kanban } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RegisterOptions() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = React.useState<"candidate" | "company">("candidate")
  
  // Track active slide for mobile carousel
  const [activeSlide, setActiveSlide] = React.useState<number>(0)

  // Sync active slide with selected role
  React.useEffect(() => {
    if (selectedRole === "candidate") {
      setActiveSlide(0)
    } else {
      setActiveSlide(1)
    }
  }, [selectedRole])

  const handleNext = () => {
    router.push(`/register/${selectedRole}`)
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative bg-background overflow-hidden box-border font-sans">
      
      {/* Ambient background glows (matching hero section) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/2.5" />
      </div>

      {/* Floating Card */}
      <div className="relative w-full max-w-[680px] bg-card border border-border/80 dark:border-border/10 rounded-[28px] p-6 sm:p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] z-10 flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col gap-2 items-center text-center">
          <div className="size-14 rounded-[18px] bg-card border border-border/85 dark:border-border/10 shadow-sm flex items-center justify-center text-primary mb-3 transition-transform hover:scale-105 duration-300">
            <Kanban className="size-6.5 fill-primary/5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.03em] leading-tight">
            Selecciona tu perfil
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm font-medium leading-relaxed mt-0.5">
            Para comenzar, necesitamos saber si eres candidato buscando empleo o una empresa contratando.
          </p>
        </header>

        {/* Roles Selector Container (Mobile: Carousel, Desktop: Side-by-Side) */}
        <div className="w-full">
          
          {/* Mobile Carousel View (md:hidden) */}
          <div className="md:hidden relative w-full overflow-hidden py-2">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {/* Card Candidato */}
              <div className="w-full shrink-0 px-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("candidate")}
                  className={`w-full flex flex-col items-center gap-5 bg-card border-2 rounded-[24px] p-6 pb-8 shadow-sm transition-all focus:outline-none ${
                    selectedRole === "candidate"
                      ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/5"
                      : "border-border text-card-foreground hover:border-border/80 bg-zinc-50/50 dark:bg-zinc-900/15"
                  }`}
                >
                  {/* Vector Illustration (Candidate) */}
                  <div className="w-40 h-40 flex items-center justify-center relative bg-muted/20 rounded-full p-4 overflow-hidden">
                    <svg className="w-full h-full text-foreground/75" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.03" />
                      <circle cx="100" cy="100" r="65" fill="currentColor" fillOpacity="0.05" />
                      <rect x="40" y="140" width="120" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
                      <rect x="65" y="110" width="70" height="30" rx="4" fill="#64748b" />
                      <rect x="70" y="115" width="60" height="20" rx="2" fill="#0f172a" />
                      <rect x="55" y="136" width="90" height="4" rx="2" fill="#475569" />
                      <path d="M70 115H130V135H70V115Z" fill="var(--color-primary)" fillOpacity="0.1" />
                      <rect x="35" y="65" width="40" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
                      <text x="44" y="79" fill="currentColor" fontSize="10" fontWeight="bold">&lt;/&gt;</text>
                      <rect x="125" y="55" width="40" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
                      <text x="139" y="69" fill="currentColor" fontSize="10" fontWeight="bold">JS</text>
                      <circle cx="50" cy="110" r="6" fill="var(--color-primary)" fillOpacity="0.8" />
                      <circle cx="155" cy="100" r="8" fill="var(--color-primary)" fillOpacity="0.8" />
                      <path d="M85 140C85 125 90 115 100 115C110 115 115 125 115 140H85Z" fill="currentColor" fillOpacity="0.7" />
                      <circle cx="100" cy="102" r="10" fill="currentColor" fillOpacity="0.7" />
                    </svg>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className={`text-[18px] font-bold tracking-tight ${selectedRole === "candidate" ? "text-primary" : "text-foreground"}`}>
                      Candidato
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px] mx-auto">
                      Descubre empleos, postula a vacantes y potencia tu carrera.
                    </p>
                  </div>
                </button>
              </div>

              {/* Card Empresa */}
              <div className="w-full shrink-0 px-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("company")}
                  className={`w-full flex flex-col items-center gap-5 bg-card border-2 rounded-[24px] p-6 pb-8 shadow-sm transition-all focus:outline-none ${
                    selectedRole === "company"
                      ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/5"
                      : "border-border text-card-foreground hover:border-border/80 bg-zinc-50/50 dark:bg-zinc-900/15"
                  }`}
                >
                  {/* Vector Illustration (Company) */}
                  <div className="w-40 h-40 flex items-center justify-center relative bg-muted/20 rounded-full p-4 overflow-hidden">
                    <svg className="w-full h-full text-foreground/75" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.03" />
                      <circle cx="100" cy="100" r="65" fill="currentColor" fillOpacity="0.05" />
                      <rect x="55" y="70" width="35" height="75" rx="3" fill="#64748b" />
                      <rect x="95" y="50" width="50" height="95" rx="3" fill="currentColor" fillOpacity="0.7" />
                      <rect x="63" y="80" width="7" height="7" rx="1" fill="#cbd5e1" />
                      <rect x="75" y="80" width="7" height="7" rx="1" fill="#cbd5e1" />
                      <rect x="63" y="95" width="7" height="7" rx="1" fill="#cbd5e1" />
                      <rect x="75" y="95" width="7" height="7" rx="1" fill="#cbd5e1" />
                      <rect x="63" y="110" width="7" height="7" rx="1" fill="#cbd5e1" />
                      <rect x="75" y="110" width="7" height="7" rx="1" fill="#cbd5e1" />
                      <rect x="105" y="60" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <rect x="123" y="60" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <rect x="105" y="78" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <rect x="123" y="78" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <rect x="105" y="96" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <rect x="123" y="96" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <rect x="105" y="114" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <rect x="123" y="114" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                      <path d="M35 130L65 105L105 115L155 75" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" />
                      <circle cx="155" cy="75" r="5" fill="var(--color-primary)" />
                      <circle cx="165" cy="120" r="10" fill="currentColor" fillOpacity="0.1" />
                      <path d="M162 120H168M165 117V123" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h3 className={`text-[18px] font-bold tracking-tight ${selectedRole === "company" ? "text-primary" : "text-foreground"}`}>
                      Empresa
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px] mx-auto">
                      Publica vacantes, gestiona candidatos y expande tu organización.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Side-by-Side View (hidden on mobile, visible on md+) */}
          <div className="hidden md:grid grid-cols-2 gap-6 w-full py-2">
            
            {/* Card Candidato */}
            <button
              type="button"
              onClick={() => setSelectedRole("candidate")}
              className={`flex flex-col items-center gap-5 bg-card border-2 rounded-[24px] p-6 pb-8 shadow-sm transition-all focus:outline-none text-left cursor-pointer hover:shadow-md ${
                selectedRole === "candidate"
                  ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/5"
                  : "border-border text-card-foreground hover:border-border/80 bg-zinc-50/50 dark:bg-zinc-900/15"
              }`}
            >
              {/* Vector Illustration (Candidate) */}
              <div className="w-36 h-36 flex items-center justify-center relative bg-muted/20 rounded-full p-4 overflow-hidden">
                <svg className="w-full h-full text-foreground/75" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.03" />
                  <circle cx="100" cy="100" r="65" fill="currentColor" fillOpacity="0.05" />
                  <rect x="40" y="140" width="120" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
                  <rect x="65" y="110" width="70" height="30" rx="4" fill="#64748b" />
                  <rect x="70" y="115" width="60" height="20" rx="2" fill="#0f172a" />
                  <rect x="55" y="136" width="90" height="4" rx="2" fill="#475569" />
                  <path d="M70 115H130V135H70V115Z" fill="var(--color-primary)" fillOpacity="0.1" />
                  <rect x="35" y="65" width="40" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
                  <text x="44" y="79" fill="currentColor" fontSize="10" fontWeight="bold">&lt;/&gt;</text>
                  <rect x="125" y="55" width="40" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
                  <text x="139" y="69" fill="currentColor" fontSize="10" fontWeight="bold">JS</text>
                  <circle cx="50" cy="110" r="6" fill="var(--color-primary)" fillOpacity="0.8" />
                  <circle cx="155" cy="100" r="8" fill="var(--color-primary)" fillOpacity="0.8" />
                  <path d="M85 140C85 125 90 115 100 115C110 115 115 125 115 140H85Z" fill="currentColor" fillOpacity="0.7" />
                  <circle cx="100" cy="102" r="10" fill="currentColor" fillOpacity="0.7" />
                </svg>
              </div>
              
              <div className="text-center space-y-1">
                <h3 className={`text-[18px] font-bold tracking-tight ${selectedRole === "candidate" ? "text-primary" : "text-foreground"}`}>
                  Candidato
                </h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px] mx-auto">
                  Descubre empleos, postula a vacantes y potencia tu carrera profesional.
                </p>
              </div>
            </button>

            {/* Card Empresa */}
            <button
              type="button"
              onClick={() => setSelectedRole("company")}
              className={`flex flex-col items-center gap-5 bg-card border-2 rounded-[24px] p-6 pb-8 shadow-sm transition-all focus:outline-none text-left cursor-pointer hover:shadow-md ${
                selectedRole === "company"
                  ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/5"
                  : "border-border text-card-foreground hover:border-border/80 bg-zinc-50/50 dark:bg-zinc-900/15"
              }`}
            >
              {/* Vector Illustration (Company) */}
              <div className="w-36 h-36 flex items-center justify-center relative bg-muted/20 rounded-full p-4 overflow-hidden">
                <svg className="w-full h-full text-foreground/75" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.03" />
                  <circle cx="100" cy="100" r="65" fill="currentColor" fillOpacity="0.05" />
                  <rect x="55" y="70" width="35" height="75" rx="3" fill="#64748b" />
                  <rect x="95" y="50" width="50" height="95" rx="3" fill="currentColor" fillOpacity="0.7" />
                  <rect x="63" y="80" width="7" height="7" rx="1" fill="#cbd5e1" />
                  <rect x="75" y="80" width="7" height="7" rx="1" fill="#cbd5e1" />
                  <rect x="63" y="95" width="7" height="7" rx="1" fill="#cbd5e1" />
                  <rect x="75" y="95" width="7" height="7" rx="1" fill="#cbd5e1" />
                  <rect x="63" y="110" width="7" height="7" rx="1" fill="#cbd5e1" />
                  <rect x="75" y="110" width="7" height="7" rx="1" fill="#cbd5e1" />
                  <rect x="105" y="60" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <rect x="123" y="60" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <rect x="105" y="78" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <rect x="123" y="78" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <rect x="105" y="96" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <rect x="123" y="96" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <rect x="105" y="114" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <rect x="123" y="114" width="10" height="10" rx="1" fill="#cbd5e1" fillOpacity="0.5" />
                  <path d="M35 130L65 105L105 115L155 75" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="155" cy="75" r="5" fill="var(--color-primary)" />
                  <circle cx="165" cy="120" r="10" fill="currentColor" fillOpacity="0.1" />
                  <path d="M162 120H168M165 117V123" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              
              <div className="text-center space-y-1">
                <h3 className={`text-[18px] font-bold tracking-tight ${selectedRole === "company" ? "text-primary" : "text-foreground"}`}>
                  Empresa
                </h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px] mx-auto">
                  Publica vacantes, gestiona candidatos y expande tu organización empresarial.
                </p>
              </div>
            </button>

          </div>

        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2">
          <button 
            type="button"
            onClick={() => setSelectedRole("candidate")}
            className={`h-2 rounded-full transition-all duration-300 ${
              selectedRole === "candidate" ? "w-5 bg-primary" : "w-2 bg-border hover:bg-border/80"
            }`}
            aria-label="Ver Candidato"
          />
          <button 
            type="button"
            onClick={() => setSelectedRole("company")}
            className={`h-2 rounded-full transition-all duration-300 ${
              selectedRole === "company" ? "w-5 bg-primary" : "w-2 bg-border hover:bg-border/80"
            }`}
            aria-label="Ver Empresa"
          />
        </div>

        {/* Action Button: Siguiente / Next */}
        <div className="w-full max-w-[260px] mx-auto">
          <Button
            onClick={handleNext}
            className="w-full h-[48px] rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[14px] shadow-md shadow-primary/10 tracking-[0.2px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            Siguiente
            <ArrowRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Back Link */}
        <div className="flex flex-col items-center gap-3.5 text-center mt-2 border-t border-border/60 dark:border-border/10 pt-5">
          <p className="text-[13px] text-muted-foreground font-medium">
            ¿Ya tienes una cuenta?
            <Link
              className="text-primary font-bold hover:underline ml-1 transition-colors tracking-[0.1px]"
              href="/login"
            >
              Iniciar Sesión
            </Link>
          </p>
          <p className="text-[11px] text-muted-foreground/60 font-medium">
            ¿Eres parte del equipo?{" "}
            <Link
              className="font-semibold text-amber-500 hover:text-amber-600 hover:underline transition-colors ml-0.5"
              href="/register/admin"
            >
              Registrar Administrador
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}
