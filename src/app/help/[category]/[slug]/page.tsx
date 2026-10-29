import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Clock,
  Calendar,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  MessageSquare,
  FileText,
} from "@/components/ui/icons";
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
import { ArticleFeedback, ShareArticleButton } from "@/components/help/article-feedback";
import { getDocArticle, getAllDocSlugs, getHelpNavigation } from "@/lib/help/docs";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getAllDocSlugs();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const doc = await getDocArticle(category, slug);

  if (!doc) {
    return {
      title: "Guía no encontrada | Centro de Ayuda K'anPro",
    };
  }

  return {
    title: `${doc.metadata.title || slug} | Centro de Ayuda K'anPro`,
    description: doc.metadata.description || "Guía operativa oficial de la plataforma K'anPro.",
  };
}

export default async function HelpArticleLayoutPage({ params }: PageProps) {
  const { category, slug } = await params;
  const doc = await getDocArticle(category, slug);

  const isCompany = category.includes("empresa");
  const sectionName = isCompany ? "Para Empresas" : "Para Candidatos";
  const catalogKey = isCompany ? "empresas" : "candidatos";
  const relatedSections = getHelpNavigation(catalogKey);

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
                  {doc?.metadata?.title || slug.replace(/-/g, " ")}
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
          {/* LEFT/MAIN COLUMN (8 COLS): ARTICLE CONTENT VIA MDX        */}
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

            {doc ? (
              <>
                {/* Article Header */}
                <header className="space-y-4 pb-6 border-b border-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/20 bg-primary/5">
                      {sectionName}
                    </Badge>
                    {doc.metadata.badge && (
                      <Badge variant="secondary" className="text-xs font-mono text-muted-foreground">
                        {doc.metadata.badge}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-foreground font-sans leading-[1.12]">
                    {doc.metadata.title}
                  </h1>

                  {doc.metadata.description && (
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                      {doc.metadata.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground font-mono pt-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      {doc.metadata.readTime || "3 min de lectura"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {doc.metadata.updatedAt ? `Actualizado ${doc.metadata.updatedAt}` : "Septiembre 2026"}
                    </span>
                    <ShareArticleButton title={doc.metadata.title || "Guía K'anPro"} />
                  </div>
                </header>

                {/* Render Native Compiled MDX Component */}
                <div className="prose-content">
                  <doc.MDXContent />
                </div>

                {/* Interactive Feedback & Support Widget */}
                <ArticleFeedback />
              </>
            ) : (
              /* Fallback if doc is still in draft */
              <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-4">
                <FileText className="size-10 text-muted-foreground mx-auto" />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">Guía en proceso de redacción</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                    El equipo editorial está completando esta guía operativa en formato MDX. Estará disponible en la próxima actualización.
                  </p>
                </div>
                <Button render={<Link href="/help" />} variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                  <ArrowLeft className="size-3.5" />
                  <span>Regresar al índice principal</span>
                </Button>
              </div>
            )}

          </article>

          {/* ========================================================= */}
          {/* RIGHT COLUMN (4 COLS): STICKY SIDEBAR (TOC & SUPPORT)    */}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            
            {/* Quick Actions / Available MDX Guides */}
            <Card className="rounded-2xl border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                  <BookOpen className="size-3.5 text-primary" />
                  <span>Guías en esta categoría</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {relatedSections.flatMap((s) => s.items).slice(0, 5).map((item) => {
                  const itemHref = `/help/${catalogKey}/${item.id}`;
                  const isCurrent = item.id === slug;
                  return (
                    <Link
                      key={item.id}
                      href={itemHref}
                      className={`flex items-center justify-between text-xs transition-colors p-1.5 rounded-lg ${
                        isCurrent
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span className="line-clamp-1">{item.title}</span>
                      <ChevronRight className="size-3 shrink-0 ml-2 text-muted-foreground" />
                    </Link>
                  );
                })}
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
