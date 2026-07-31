"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Building2, Kanban } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginClient() {
  const router = useRouter();

  // Mode: "login" or "register"
  const [candidateMode, setCandidateMode] = useState<"login" | "register">("login");
  const [companyMode, setCompanyMode] = useState<"login" | "register">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auth operations
  const handleAuth = async (role: "candidate" | "company", mode: "login" | "register") => {
    if (!email.trim() || !password.trim()) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    if (mode === "register" && role === "candidate" && !fullName.trim()) {
      toast.error("Por favor ingresa tu nombre completo.");
      return;
    }

    if (mode === "register" && role === "company" && !companyName.trim()) {
      toast.error("Por favor ingresa el nombre de la empresa.");
      return;
    }

    setLoading(true);
    // Initialize Supabase client defensively inside the handler (runtime only)
    const supabase = createClient();
    try {
      if (mode === "login") {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast.success("¡Sesión iniciada con éxito!");
          
          // Let redirect middleware/layout guide user, or force dashboard push
          router.push(role === "company" ? "/dashboard/company" : "/dashboard/candidate/discovery");
          router.refresh();
        }
      } else {
        // Sign Up with metadata role insertion
        const name = role === "candidate" ? fullName : companyName;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: name,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success("¡Cuenta creada con éxito!", {
            description: "Bienvenido a K'anPro.",
          });
          
          // Direct push to appropriate dashboard
          router.push(role === "company" ? "/dashboard/company" : "/dashboard/candidate/discovery");
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error", {
        description: err.message || "No se pudo completar la operación.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative bg-[#fafafc] dark:bg-zinc-950 overflow-hidden box-border font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/2.5" />
      </div>

      {/* Auth Card */}
      <div className="relative w-full max-w-[480px] bg-white dark:bg-zinc-900 border border-border/80 dark:border-border/10 rounded-[28px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] z-10 flex flex-col gap-6">
        
        {/* Logo and Greeting */}
        <div className="flex flex-col items-center">
          <div className="size-14 rounded-[18px] bg-white dark:bg-zinc-900 border border-border/85 dark:border-border/10 shadow-sm flex items-center justify-center text-primary mb-4 transition-transform hover:scale-105 duration-300">
            <Kanban className="size-6.5 fill-primary/5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-[-0.03em] leading-tight text-center">
            Bienvenido a K'anPro
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 text-center font-bold tracking-wider uppercase">
            Vinculación Laboral Express
          </p>
        </div>

        {/* Candidate / Company Tabs */}
        <Tabs defaultValue="candidate" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-6 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl h-11">
            <TabsTrigger value="candidate" className="font-bold text-xs uppercase tracking-wider rounded-xl">
              Soy Candidato
            </TabsTrigger>
            <TabsTrigger value="company" className="font-bold text-xs uppercase tracking-wider rounded-xl">
              Soy Empresa
            </TabsTrigger>
          </TabsList>

          {/* CANDIDATE TAB CONTENT */}
          <TabsContent value="candidate" className="space-y-4">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
              <h3 className="text-sm font-bold text-foreground">
                {candidateMode === "login" ? "Iniciar Sesión" : "Crear Cuenta de Candidato"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCandidateMode(candidateMode === "login" ? "register" : "login");
                  setEmail("");
                  setPassword("");
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                {candidateMode === "login" ? "¿No tienes cuenta? Registrate" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAuth("candidate", candidateMode);
              }}
              className="space-y-4"
            >
              {candidateMode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="c-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    Nombre Completo *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                    <Input
                      id="c-name"
                      placeholder="Ej. Elena Rodríguez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 pl-11 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="c-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Correo Electrónico *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                  <Input
                    id="c-email"
                    type="email"
                    placeholder="nombre@candidato.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                  <Input
                    id="c-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 pr-11 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider mt-4"
              >
                {loading ? "Procesando..." : candidateMode === "login" ? "Iniciar Sesión" : "Crear mi Cuenta"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </TabsContent>

          {/* COMPANY TAB CONTENT */}
          <TabsContent value="company" className="space-y-4">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
              <h3 className="text-sm font-bold text-foreground">
                {companyMode === "login" ? "Acceso Empresa" : "Crear Cuenta de Empresa"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCompanyMode(companyMode === "login" ? "register" : "login");
                  setEmail("");
                  setPassword("");
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                {companyMode === "login" ? "¿No tienes cuenta? Registrate" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAuth("company", companyMode);
              }}
              className="space-y-4"
            >
              {companyMode === "register" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="comp-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                      Nombre de la Empresa *
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                      <Input
                        id="comp-name"
                        placeholder="Ej. Hotel Riviera Grand, Restaurante El Faro"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-12 pl-11 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="comp-ind" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                      Sector Industrial (Opcional)
                    </Label>
                    <Input
                      id="comp-ind"
                      placeholder="Ej. Hotelería, Restaurantes, Retail"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="h-12 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="comp-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Correo de la Empresa *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                  <Input
                    id="comp-email"
                    type="email"
                    placeholder="reclutador@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comp-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/60" />
                  <Input
                    id="comp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 pr-11 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider mt-4"
              >
                {loading ? "Procesando..." : companyMode === "login" ? "Iniciar Sesión" : "Crear Cuenta de Empresa"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Card Footer Policy */}
        <footer className="pt-2 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground text-center font-medium leading-relaxed max-w-[340px] mx-auto">
            Al continuar, aceptas nuestros{" "}
            <a className="underline hover:text-foreground transition-colors" href="#">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a className="underline hover:text-foreground transition-colors" href="#">
              Política de Privacidad
            </a>
            .
          </p>
        </footer>

      </div>
    </main>
  );
}
