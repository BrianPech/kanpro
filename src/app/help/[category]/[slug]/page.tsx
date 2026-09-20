"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Clock,
  Calendar,
  Share2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function HelpArticleLayoutPage() {
  const params = useParams();
  const categoryParam = (params?.category as string) || "empresas";
  const slugParam = (params?.slug as string) || "guia-operativa";

  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);

  // Formato legible para breadcrumb
  const isCompany = categoryParam.includes("empresa");
  const sectionName = isCompany ? "Para Empresas" : "Para Candidatos";

  return (
    <div className="w-full pb-20 sm:pb-28">
      {/* Top Breadcrumb Bar */}
      <section className="w-full border-b border-border/60 bg-muted/20 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/help" />}>
                  Centro de Ayuda
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/help" />}>
                  {sectionName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground capitalize">
                  {slugParam.replace(/-/g, " ")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      {/* Main Container: 2-Column Responsive Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 text-left">
          
          {/* ========================================================= */}
          {/* LEFT/MAIN COLUMN (8 COLS): ARTICLE CONTENT WIREFRAME      */}
          {/* ========================================================= */}
          <article className="lg:col-span-8 space-y-8">
            
            {/* Back Button (Mobile-First) */}
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver a todas las guías</span>
            </Link>

            {/* Article Header */}
            <header className="space-y-4 pb-6 border-b border-border">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/20 bg-primary/5">
                  {sectionName}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono text-muted-foreground">
                  Guía Operativa
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-foreground font-sans leading-[1.12]">
                Estructura y Proceso de Validación Operativa
              </h1>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  3 min de lectura
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Actualizado recientemente
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-auto"
                >
                  <Share2 className="size-3.5" />
                  <span>Compartir</span>
                </button>
              </div>
            </header>

            {/* Wireframe Body Content (Typography & Callouts Shell) */}
            <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
              
              {/* Callout Box: Resumen o Nota Clave */}
              <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3.5 text-foreground">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <span className="font-bold text-primary block">Objetivo de esta guía</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Esta sección describe el flujo de trabajo estándar, los requisitos normativos aplicables y las recomendaciones para operar sin comisiones ni intermediarios en la Península.
                  </p>
                </div>
              </div>

              {/* Sección 1: Introducción */}
              <div className="space-y-3 pt-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
                  1. Contexto y Requisitos Previos
                </h2>
                <p>
                  Antes de iniciar el procedimiento en la plataforma, asegúrate de tener a la mano los datos básicos de tu cuenta o empresa. Toda la documentación se tramita de manera digital y directa sin intermediarios.
                </p>
              </div>

              {/* Sección 2: Pasos Enumerados */}
              <div className="space-y-4 pt-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-sans">
                  2. Procedimiento Paso a Paso
                </h2>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground text-sm sm:text-base">
                      <span className="flex size-6 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold items-center justify-center">
                        1
                      </span>
                      <span>Paso 1: Acceso y Selección de Módulo</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground pl-8">
                      Ingresa al panel correspondiente y selecciona la opción dentro del menú de navegación superior o lateral.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground text-sm sm:text-base">
                      <span className="flex size-6 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold items-center justify-center">
                        2
                      </span>
                      <span>Paso 2: Carga de Información o Validación</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground pl-8">
                      Completa los campos requeridos y confirma la veracidad de la información conforme a las políticas vigentes.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground text-sm sm:text-base">
                      <span className="flex size-6 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold items-center justify-center">
                        3
                      </span>
                      <span>Paso 3: Notificación Directa por WhatsApp</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground pl-8">
                      El sistema genera la confirmación en tiempo real y enlaza la conversación con el interlocutor correspondiente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Callout Box: Advertencia / Consideración Legal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3.5 text-foreground">
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block">Consideración Importante</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Bajo las normativas mexicanas de protección de datos (LFPDPPP), la información sensible se encuentra debidamente cifrada y solo se comparte con autorización explícita.
                  </p>
                </div>
              </div>

            </div>

            {/* Interactive Feedback Widget */}
            <div className="p-6 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-sm font-bold text-foreground block">
                  ¿Te resultó útil esta información?
                </span>
                <p className="text-xs text-muted-foreground">
                  Tu retroalimentación nos ayuda a mantener actualizadas las guías operativas.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant={feedbackGiven === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeedbackGiven(true)}
                  className="rounded-xl text-xs gap-1.5 border-border cursor-pointer"
                >
                  <ThumbsUp className="size-3.5" />
                  <span>Sí, me ayudó</span>
                </Button>
                <Button
                  variant={feedbackGiven === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setFeedbackGiven(false)}
                  className="rounded-xl text-xs gap-1.5 border-border cursor-pointer"
                >
                  <ThumbsDown className="size-3.5" />
                  <span>No resolvió mi duda</span>
                </Button>
              </div>
            </div>

          </article>

          {/* ========================================================= */}
          {/* RIGHT COLUMN (4 COLS): STICKY SIDEBAR (TOC & SUPPORT)    */}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            
            {/* Table of Contents Card */}
            <Card className="rounded-2xl border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                  <BookOpen className="size-3.5 text-primary" />
                  <span>En esta guía</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2 text-xs font-medium">
                  <a href="#contexto" className="block text-primary hover:underline font-semibold">
                    1. Contexto y Requisitos Previos
                  </a>
                  <a href="#procedimiento" className="block text-muted-foreground hover:text-foreground transition-colors">
                    2. Procedimiento Paso a Paso
                  </a>
                  <a href="#consideraciones" className="block text-muted-foreground hover:text-foreground transition-colors">
                    3. Consideraciones y Normativa
                  </a>
                  <a href="#soporte" className="block text-muted-foreground hover:text-foreground transition-colors">
                    4. Contacto y Asistencia
                  </a>
                </nav>
              </CardContent>
            </Card>

            {/* Related Articles Card */}
            <Card className="rounded-2xl border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
                  Guías Relacionadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Link
                  href="/help"
                  className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground group transition-colors"
                >
                  <span className="line-clamp-1">Validación de Constancia 32-D SAT</span>
                  <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
                <Link
                  href="/help"
                  className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground group transition-colors"
                >
                  <span className="line-clamp-1">Protocolo de Entrevistas por WhatsApp</span>
                  <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
                <Link
                  href="/help"
                  className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground group transition-colors"
                >
                  <span className="line-clamp-1">Segmentación Hiperlocal por Colonia</span>
                  <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
              </CardContent>
            </Card>

            {/* Direct Support Card */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 text-left">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary">
                <MessageSquare className="size-3.5" />
                <span>¿DUDAS CON ESTE PASO?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escríbenos directamente por WhatsApp para asistencia personalizada en Mérida y Cancún.
              </p>
              <Button
                render={<Link href="https://wa.me/529990000000" target="_blank" rel="noopener noreferrer" />}
                size="sm"
                className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                <span>Chatear con Soporte</span>
              </Button>
            </div>

          </aside>

        </div>
      </section>
    </div>
  );
}
