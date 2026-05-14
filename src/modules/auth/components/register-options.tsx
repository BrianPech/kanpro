import Link from "next/link";
import { Building, Briefcase, User, ArrowRight } from "lucide-react";

export function RegisterOptions() {
  return (
    <main className="flex flex-col min-h-screen w-full items-center justify-center bg-background font-sans p-6 md:p-12 transition-colors duration-300">
      <div className="w-full max-w-[1000px] flex flex-col gap-12 items-center">
        
        <header className="flex flex-col gap-3 items-center text-center">
          <div className="mb-4">
            <span className="text-[20px] font-medium text-foreground tracking-tighter">
              K'anPro
            </span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-medium text-foreground tracking-[-0.48px] leading-[1.19]">
            Únase a nosotros
          </h1>
          <p className="text-[18px] text-muted-foreground tracking-[-0.09px] leading-[1.56] max-w-md">
            Seleccione el tipo de perfil que mejor describa sus necesidades para continuar.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
          
          {/* Card Empresa */}
          <Link 
            href="/register/company" 
            className="group flex flex-col items-start gap-4 bg-card border border-border rounded-[20px] p-[32px] hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all">
              <Building className="h-6 w-6" />
            </div>
            <h3 className="text-[24px] font-medium text-foreground tracking-[0px] mt-2 leading-[1.33]">Empresa</h3>
            <p className="text-[16px] text-muted-foreground leading-[1.5] tracking-[0.24px]">
              Encuentre talento especializado y escale las operaciones de su organización con precisión.
            </p>
            <div className="mt-auto pt-6 flex items-center gap-2 text-[14px] font-semibold text-primary transition-all">
              Comenzar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card Profesional */}
          <Link 
            href="/register/professional" 
            className="group flex flex-col items-start gap-4 bg-card border border-border rounded-[20px] p-[32px] hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-[24px] font-medium text-foreground tracking-[0px] mt-2 leading-[1.33]">Profesional</h3>
            <p className="text-[16px] text-muted-foreground leading-[1.5] tracking-[0.24px]">
              Gestione su práctica independiente, acceda a proyectos de alto impacto y controle sus clientes.
            </p>
            <div className="mt-auto pt-6 flex items-center gap-2 text-[14px] font-semibold text-primary transition-all">
              Comenzar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card Candidato */}
          <Link 
            href="/register/candidate" 
            className="group flex flex-col items-start gap-4 bg-card border border-border rounded-[20px] p-[32px] hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-[24px] font-medium text-foreground tracking-[0px] mt-2 leading-[1.33]">Candidato</h3>
            <p className="text-[16px] text-muted-foreground leading-[1.5] tracking-[0.24px]">
              Conecte con las mejores empresas y descubra oportunidades diseñadas para su crecimiento.
            </p>
            <div className="mt-auto pt-6 flex items-center gap-2 text-[14px] font-semibold text-primary transition-all">
              Comenzar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>

        {/* Footer Link */}
        <p className="text-[14px] text-muted-foreground mt-8 text-center">
          ¿Ya tienes una cuenta?
          <Link
            className="text-[16px] font-bold text-primary hover:underline ml-1.5 transition-colors tracking-[0.24px]"
            href="/"
          >
            Iniciar Sesión
          </Link>
        </p>

      </div>
    </main>
  );
}
