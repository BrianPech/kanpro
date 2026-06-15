import { Camera, ShieldAlert, Key, Laptop, Eye, Mail, ArrowRight, ShieldCheck, Sparkles, CreditCard, ChevronRight, User, Lock, Search } from "lucide-react";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function AccountPage() {
  const { userName, userInitials, plan, role } = await getDashboardSession();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email || "";

  return (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-500">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center gap-4 w-full">
        {/* Large Avatar with camera overlay */}
        <div className="relative group cursor-pointer">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-all duration-300 group-hover:scale-105">
            <AvatarFallback className="bg-primary/5 text-primary text-4xl font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-10 w-10 bg-background dark:bg-zinc-800 border border-border shadow-md rounded-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
            <Camera className="h-5 w-5" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-medium tracking-tight text-foreground">{userName}</h1>
          <p className="text-muted-foreground text-sm tracking-wide">{email}</p>
        </div>

        {/* Central Search Bar */}
        <div className="w-full max-w-[580px] mx-auto mt-4 px-4">
          <div className="w-full flex items-center gap-3 bg-muted/40 hover:bg-muted/65 transition-colors border border-border/20 px-5 py-3 rounded-full group focus-within:bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar en la cuenta de K'anPro"
              className="w-full bg-transparent border-none outline-none text-[15px] text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>

        {/* Shortcut buttons */}
        <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[640px] px-4">
          <Link href="/account/security">
            <Button variant="outline" size="sm" className="rounded-full h-10 px-5 gap-2 text-[13px] border-border/60 hover:bg-muted/50 font-normal">
              <Key className="h-4 w-4" />
              Mi contraseña
            </Button>
          </Link>
          <Link href="/account/security">
            <Button variant="outline" size="sm" className="rounded-full h-10 px-5 gap-2 text-[13px] border-border/60 hover:bg-muted/50 font-normal">
              <Laptop className="h-4 w-4" />
              Dispositivos
            </Button>
          </Link>
          <Link href="/account/security">
            <Button variant="outline" size="sm" className="rounded-full h-10 px-5 gap-2 text-[13px] border-border/60 hover:bg-muted/50 font-normal">
              <Eye className="h-4 w-4" />
              Seguridad
            </Button>
          </Link>
          <Link href="/account/personal-info">
            <Button variant="outline" size="sm" className="rounded-full h-10 px-5 gap-2 text-[13px] border-border/60 hover:bg-muted/50 font-normal">
              <Mail className="h-4 w-4" />
              Correo electrónico
            </Button>
          </Link>
        </div>
      </div>

      {/* Main warning card (Google style) */}
      <div className="w-full bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Seguir protegiendo tu cuenta</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Si no finalizaste los pasos de seguridad que comenzaste para proteger tu perfil y datos, complétalos ahora para mayor tranquilidad.
            </p>
          </div>
        </div>
        <Link href="/account/security" className="w-full md:w-auto shrink-0">
          <Button className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-full h-11 px-6 gap-2">
            Continuar con los pasos de seguridad
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Grid of Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
        
        {/* Card 1: Personal Info */}
        <div className="glass-card rounded-[24px] p-8 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <User className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-foreground tracking-tight">Información personal</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Consulta y gestiona los datos personales asociados con tu perfil de K&apos;anPro.
              </p>
            </div>
          </div>
          <Link href="/account/personal-info" className="mt-8 flex items-center justify-between text-emerald-500 font-semibold text-sm hover:underline">
            <span>Gestionar información personal</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Security & Credentials */}
        <div className="glass-card rounded-[24px] p-8 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Lock className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-foreground tracking-tight">Seguridad y acceso</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configuraciones y recomendaciones para mantener tu cuenta completamente blindada.
              </p>
            </div>
          </div>
          <Link href="/account/security" className="mt-8 flex items-center justify-between text-sky-500 font-semibold text-sm hover:underline">
            <span>Ver opciones de seguridad</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: AI Plan */}
        <div className="glass-card rounded-[24px] p-8 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-foreground tracking-tight">Plan de K&apos;anPro AI</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Descubre los superpoderes de K&apos;anPro AI Pro y sube de nivel tu automatización profesional.
              </p>
            </div>
          </div>
          <Link href="/account/ai-plan" className="mt-8 flex items-center justify-between text-violet-500 font-semibold text-sm hover:underline">
            <span>Explorar K&apos;anPro AI</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 4: Wallet & Billing */}
        <div className="glass-card rounded-[24px] p-8 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-foreground tracking-tight">Billetera y suscripciones</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gestiona tus métodos de pago, saldo en billetera y suscripciones activas.
              </p>
            </div>
          </div>
          <Link href="/account/billing" className="mt-8 flex items-center justify-between text-purple-500 font-semibold text-sm hover:underline">
            <span>Configurar métodos de pago</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>

      {/* Footer Info Box */}
      <footer className="w-full mt-10 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center md:text-left">
        <p className="max-w-xl">
          Solo tú puedes ver la configuración. También puedes revisar la seguridad o cualquier servicio de K&apos;anPro que uses con frecuencia. K&apos;anPro protege tu privacidad y la seguridad de tus datos.
        </p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground hover:underline transition-colors">Privacidad</a>
          <a href="#" className="hover:text-foreground hover:underline transition-colors">Condiciones</a>
          <a href="#" className="hover:text-foreground hover:underline transition-colors">Ayuda</a>
        </div>
      </footer>

    </div>
  );
}
