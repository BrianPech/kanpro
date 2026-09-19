"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  Lock, 
  ArrowRight,
  PlusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function InteractiveRoleShowcase() {
  const [selectedRole, setSelectedRole] = useState<"company" | "candidate">("company");
  const [activeCompanyFeature, setActiveCompanyFeature] = useState(0);
  const [activeCandidateFeature, setActiveCandidateFeature] = useState(0);

  const companyFeatures = [
    {
      id: "wizard",
      icon: PlusCircle,
      title: "Publicador Asistido en 4 Pasos",
      shortDesc: "Crea vacantes en minutos con selector de prestaciones de ley y superiores.",
      tag: "Wizard Inteligente",
      color: "text-primary",
      bgColor: "bg-primary/10",
      details: [
        "Configura sueldo mínimo y máximo en pesos mexicanos (MXN).",
        "Selecciona prestaciones: IMSS, propinas, comedor, transporte, uniformes y turnos.",
        "Delimita la colonia exacta (ej. Altabrisa, Centro, Montejo, Playa del Carmen) para atraer personal cercano.",
      ],
      previewTitle: "Creación de Oferta Laboral",
      previewBadge: "Paso 2: Compensación y Beneficios",
    },
    {
      id: "inbox",
      icon: Layers,
      title: "Applications Inbox & Pipeline",
      shortDesc: "Controla cada postulación en tiempo real sin perder candidatos de vista.",
      tag: "Pipeline Kanban",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10",
      details: [
        "Estados fluidos: Pendiente, En revisión, Preseleccionado, Contratado y Descartado.",
        "Calificación interna de 1 a 5 estrellas y notas privadas compartidas con tu equipo.",
        "Filtros instantáneos por vacante, cercanía y exportación a formato CSV.",
      ],
      previewTitle: "Pipeline de Postulantes en Vivo",
      previewBadge: "Bandeja Unificada",
    },
    {
      id: "whatsapp",
      icon: MessageSquare,
      title: "Conexión Directa por WhatsApp",
      shortDesc: "Inicia conversaciones con candidatos con un solo clic usando plantillas directas.",
      tag: "Cero Burocracia",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      details: [
        "Abre el chat de WhatsApp con el número verificado del postulante sin agregarlo a tu agenda.",
        "Mensaje precargado con el nombre de la vacante y fecha de entrevista.",
        "Reduce el tiempo de contratación de semanas a solo un par de horas.",
      ],
      previewTitle: "Chat Instantáneo con Candidato",
      previewBadge: "Respuesta en < 2 hrs",
    },
    {
      id: "verification",
      icon: ShieldCheck,
      title: "Sello de Verificación Legal (13 Requisitos)",
      shortDesc: "Valida tu razón social, SAT y Acta Constitutiva para atraer al mejor talento.",
      tag: "Confianza SAT",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      details: [
        "Auditoría de RFC (Persona Moral o Física), domicilio fiscal y poder notarial.",
        "Insignia oficial de Empresa Verificada en el listado de ofertas del Sureste.",
        "Máxima confianza para candidatos calificados que buscan empleo formal.",
      ],
      previewTitle: "Expediente Corporativo Auditado",
      previewBadge: "13 Requisitos SAT",
    },
  ];

  const candidateFeatures = [
    {
      id: "proximity",
      icon: MapPin,
      title: "Búsqueda por Cercanía y Colonias",
      shortDesc: "Encuentra empleo cerca de tu casa y reduce tus tiempos y gastos de traslado.",
      tag: "Filtro Geográfico",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      details: [
        "Filtrado por colonias en Mérida (Altabrisa, Centro, Montejo, Caucel) y Quintana Roo (Playa del Carmen, Tulum).",
        "Cálculo visual de proximidad para elegir puestos a menos de 20 minutos de tu domicilio.",
        "Información clara de beneficios de transporte y horarios de entrada/salida.",
      ],
      previewTitle: "Vacantes Cercanas a tu Domicilio",
      previewBadge: "Radio 5 km",
    },
    {
      id: "dossier",
      icon: ShieldCheck,
      title: "Expediente Digital Laboral (0 - 100%)",
      shortDesc: "Centraliza tu INE, CURP, CV y constancias para tener prioridad máxima.",
      tag: "Certificación K'anPro",
      color: "text-primary",
      bgColor: "bg-primary/10",
      details: [
        "Barra de nivel de expediente: obtén la insignia de 'Prioridad Máxima' al alcanzar 85%+.",
        "Carga segura de INE, Comprobante de Domicilio, Cartas de Recomendación y Cursos.",
        "Tu expediente te respalda como un candidato formal y confiable ante las empresas.",
      ],
      previewTitle: "Expediente Laboral Digital",
      previewBadge: "Nivel 95% Certificado",
    },
    {
      id: "fast_apply",
      icon: MessageSquare,
      title: "Postulación a 1-Clic & WhatsApp Directo",
      shortDesc: "Aplica en segundos y habla directamente con el reclutador sin intermediarios.",
      tag: "Contacto Inmediato",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      details: [
        "Sin formularios engorrosos ni cartas de presentación repetitivas.",
        "Acceso a la línea de WhatsApp de recursos humanos para confirmar tu postulación.",
        "Seguimiento transparente del estado de tu solicitud (Pendiente -> Preseleccionado -> Contratado).",
      ],
      previewTitle: "Postulación Directa a la Empresa",
      previewBadge: "1 Solo Clic",
    },
    {
      id: "privacy",
      icon: Lock,
      title: "Control de Privacidad y Consentimiento",
      shortDesc: "Tú decides qué empresa puede consultar tus documentos sensibles.",
      tag: "Seguridad LFPDPPP",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      details: [
        "Tus identificaciones oficiales y comprobantes no son públicos en internet.",
        "Las empresas deben solicitar autorización para consultar tu expediente laboral.",
        "Tus datos se transmiten con cifrado de extremo a extremo en Supabase Storage.",
      ],
      previewTitle: "Permisos y Acceso de Empresas",
      previewBadge: "Consentimiento Explícito",
    },
  ];

  const currentFeatures = selectedRole === "company" ? companyFeatures : candidateFeatures;
  const currentActiveIdx = selectedRole === "company" ? activeCompanyFeature : activeCandidateFeature;
  const setFeatureIdx = selectedRole === "company" ? setActiveCompanyFeature : setActiveCandidateFeature;
  const activeFeature = currentFeatures[currentActiveIdx];

  return (
    <section id={selectedRole === "company" ? "empresas" : "candidatos"} className="py-16 sm:py-24 border-t border-border/60 bg-muted/20 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10 space-y-12">
        
        {/* Section Header with Dual Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
          <div className="space-y-3 text-left">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-3 py-1 rounded-full">
              <Sparkles className="size-3.5 mr-1.5" />
              Suite Especializada de Funcionalidades
            </Badge>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Herramientas diseñadas para cada lado de la mesa
            </h2>
            
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl">
              Explora en detalle cómo K&apos;anPro optimiza la contratación y la búsqueda laboral en el Sureste de México.
            </p>
          </div>

          {/* Toggle pill selector */}
          <div className="inline-flex p-1.5 rounded-2xl bg-card border border-border shadow-xs self-start md:self-auto">
            <button
              onClick={() => setSelectedRole("company")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                selectedRole === "company"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <Building2 className="size-4" />
              <span>Para Empresas</span>
            </button>

            <button
              onClick={() => setSelectedRole("candidate")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                selectedRole === "candidate"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <UserCheck className="size-4" />
              <span>Para Candidatos</span>
            </button>
          </div>
        </div>

        {/* Master Showcase Layout: Left Feature Selectors (5 cols) + Right Dynamic Simulator (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Feature List */}
          <div className="lg:col-span-5 space-y-3">
            {currentFeatures.map((feat, index) => {
              const Icon = feat.icon;
              const isSelected = index === currentActiveIdx;

              return (
                <div
                  key={feat.id}
                  onClick={() => setFeatureIdx(index)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left space-y-2 relative ${
                    isSelected
                      ? "bg-card border-primary/50 shadow-sm ring-1 ring-primary/20"
                      : "bg-card/50 border-border/60 hover:bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-8 rounded-lg ${feat.bgColor} ${feat.color} flex items-center justify-center`}>
                        <Icon className="size-4.5" />
                      </div>
                      <h3 className="text-sm font-extrabold text-foreground">
                        {feat.title}
                      </h3>
                    </div>

                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-md border-border/80">
                      {feat.tag}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium leading-relaxed pl-10">
                    {feat.shortDesc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Interactive Simulator Visual Card */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedRole}-${activeFeature.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-left"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Feature Spotlight
                    </span>
                    <h4 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                      {activeFeature.title}
                    </h4>
                  </div>

                  <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-3 py-1 rounded-full">
                    {activeFeature.previewBadge}
                  </Badge>
                </div>

                {/* Core Feature Value Bullets */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Capacidades Clave:
                  </h5>
                  <div className="space-y-2.5">
                    {activeFeature.details.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-foreground">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Realistic In-App Simulator Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/50 pb-2">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Layers className="size-3.5 text-primary" />
                      {activeFeature.previewTitle}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      En Vivo
                    </span>
                  </div>

                  {/* Dynamic Simulation Content depending on feature */}
                  {selectedRole === "company" ? (
                    activeFeature.id === "wizard" ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-card border border-border/60">
                            <span className="text-[10px] text-muted-foreground block">Rango Salarial</span>
                            <span className="font-extrabold font-mono text-foreground">$14,000 - $18,000 MXN</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-card border border-border/60">
                            <span className="text-[10px] text-muted-foreground block">Zona de Cobertura</span>
                            <span className="font-extrabold text-foreground">Altabrisa, Mérida</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg">✓ IMSS & Vacaciones</span>
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg">✓ Comedor Subsidiado</span>
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg">✓ Bono de Puntualidad</span>
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg">✓ Uniformes</span>
                        </div>
                      </div>
                    ) : activeFeature.id === "inbox" ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">LR</div>
                            <div>
                              <div className="text-xs font-bold text-foreground">Luis Ramirez</div>
                              <div className="text-[10px] text-muted-foreground">Barista / 3 años exp.</div>
                            </div>
                          </div>
                          <Badge className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[10px] font-bold">Preseleccionado</Badge>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-amber-500 text-amber-950 font-bold text-xs flex items-center justify-center">CM</div>
                            <div>
                              <div className="text-xs font-bold text-foreground">Carla Morales</div>
                              <div className="text-[10px] text-muted-foreground">Auxiliar Administrativo</div>
                            </div>
                          </div>
                          <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold">En revisión</Badge>
                        </div>
                      </div>
                    ) : activeFeature.id === "whatsapp" ? (
                      <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <MessageSquare className="size-4" />
                          <span>Mensaje preconfigurado para enviar:</span>
                        </div>
                        <p className="text-xs italic text-foreground bg-muted/60 p-2.5 rounded-lg leading-relaxed">
                          {'"¡Hola Mauricio! Revisamos tu expediente en K\'anPro para la vacante de Cocinero A en Mérida Centro y nos gustaría agendar tu entrevista presencial mañana a las 11:00 AM."'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-foreground">Auditoría SAT y Legal</span>
                          <span className="text-emerald-600 font-mono">13 / 13 Cumplidos (100%)</span>
                        </div>
                        <Progress value={100} className="h-2 bg-muted" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                          <ShieldCheck className="size-4 text-emerald-500" />
                          <span>Acta Constitutiva, RFC validado y Representante Legal confirmados.</span>
                        </div>
                      </div>
                    )
                  ) : (
                    activeFeature.id === "proximity" ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground">Restaurante Altabrisa</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-primary" /> A 1.2 km de tu casa (10 min en bici / camión)
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">$15,000/mes</span>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground">Hotel Boutique Centro</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-primary" /> A 3.5 km de tu casa (Ruta directa)
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">$16,500/mes</span>
                        </div>
                      </div>
                    ) : activeFeature.id === "dossier" ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-foreground">Nivel de Expediente Laboral</span>
                          <span className="text-primary font-mono">95% (Prioridad Máxima)</span>
                        </div>
                        <Progress value={95} className="h-2.5 bg-muted" />
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-muted-foreground pt-1">
                          <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> INE Cotejada</span>
                          <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> CURP Oficial SAT</span>
                          <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> Comprobante Domicilio</span>
                          <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> 2 Cartas de Recomendación</span>
                        </div>
                      </div>
                    ) : activeFeature.id === "fast_apply" ? (
                      <div className="p-3.5 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-foreground">Recepcionista Bilingüe</div>
                          <div className="text-[10px] text-muted-foreground">Hotel Playa del Carmen</div>
                        </div>
                        <Button size="sm" className="h-8 rounded-lg text-xs font-bold bg-[#25D366] text-[#062c1e] hover:bg-[#20ba59] gap-1.5 shadow-2xs">
                          <MessageSquare className="size-3.5 stroke-[2.5]" />
                          <span>Postularme por WhatsApp</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">Solicitud de Acceso a Documentos</span>
                          <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20">Requiere tu Aprobación</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {'"Operadora Hotelera del Sureste solicita autorización para consultar tu INE y Constancia Laboral."'}
                        </p>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">Denegar</Button>
                          <Button size="sm" className="h-7 text-[10px] font-bold bg-primary text-primary-foreground">Autorizar Acceso</Button>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground font-semibold">
                    {selectedRole === "company" ? "¿Listo para reclutar?" : "¿Buscando tu próximo empleo?"}
                  </div>

                  <Button
                    render={
                      <Link 
                        href={selectedRole === "company" ? "/register/company" : "/register/candidate"} 
                      />
                    }
                    className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs gap-2 cursor-pointer"
                  >
                    <span>{selectedRole === "company" ? "Crear Cuenta de Empresa" : "Crear mi Expediente Gratis"}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
