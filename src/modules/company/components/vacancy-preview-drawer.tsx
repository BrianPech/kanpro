"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Calendar,
  Edit2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Tag,
  Gift,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  X,
  Award,
  GraduationCap,
  Flame,
  Briefcase,
} from "@/components/ui/icons";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { VacancyRow } from "@/modules/company/hooks/use-vacancy-manager";

export interface VacancyPreviewItem extends Partial<VacancyRow> {
  id: string;
  title: string;
  applicants_count?: number;
}

export interface VacancyPreviewDrawerProps {
  vacancy: VacancyPreviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleActive?: (id: string, currentActive: boolean) => void;
  formatSalary: (min: number | null, max: number | null) => string;
  formatDate: (dateStr: string) => string;
}

export function VacancyPreviewDrawer({
  vacancy,
  open,
  onOpenChange,
  onToggleActive,
  formatSalary,
  formatDate,
}: VacancyPreviewDrawerProps) {
  const isMobile = useIsMobile();

  if (!vacancy) return null;

  const isActive = Boolean(vacancy.is_active);
  const statusText = vacancy.status || (isActive ? "Activa" : "Pausada");
  const applicantsCount = vacancy.applicants_count ?? 0;

  // Extraer listas de beneficios y habilidades
  const benefitsList: string[] = Array.isArray(vacancy.benefits)
    ? (vacancy.benefits as string[])
    : typeof vacancy.benefits === "string"
    ? (vacancy.benefits as string)
        .split(",")
        .map((b: string) => b.trim())
        .filter(Boolean)
    : [];

  const skillsList: string[] = Array.isArray(vacancy.skills)
    ? (vacancy.skills as string[])
    : typeof vacancy.skills === "string"
    ? (vacancy.skills as string)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  // Verificar si hay requisitos específicos adicionales que no sean idénticos a la descripción
  const hasSeparateRequirements = Boolean(
    vacancy.requirements &&
      vacancy.requirements.trim() !== "" &&
      vacancy.requirements.trim() !== vacancy.description?.trim()
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isMobile ? "down" : "right"}
      showSwipeHandle={isMobile}
    >
      <DrawerContent
        className={cn(
          "bg-card text-card-foreground border-border shadow-2xl flex flex-col",
          isMobile
            ? "[--drawer-inset:0px] max-h-[92dvh] rounded-t-[28px] rounded-b-none border-x-0 border-b-0 border-t border-border/70 p-0 overflow-hidden"
            : "h-full w-full sm:max-w-xl md:max-w-2xl sm:[--drawer-content-width:38rem] md:[--drawer-content-width:44rem] rounded-l-3xl p-0 ml-auto"
        )}
      >
        {/* Header con Título, Categoría y Estado */}
        <DrawerHeader className="px-5 py-4 sm:p-6 sm:pb-4 border-b border-border/50 text-left shrink-0 bg-muted/15 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-none flex items-center gap-1.5",
                    statusText === "Cerrada"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      : isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full inline-block animate-pulse",
                      statusText === "Cerrada"
                        ? "bg-rose-500"
                        : isActive
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    )}
                  />
                  <span>{statusText}</span>
                </Badge>

                {vacancy.category && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold px-2 py-0.5 border-border/40"
                  >
                    {vacancy.category}
                  </Badge>
                )}

                {vacancy.modality && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-2 py-0.5 text-muted-foreground border-border/50"
                  >
                    {vacancy.modality}
                  </Badge>
                )}
              </div>

              <DrawerTitle className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
                {vacancy.title}
              </DrawerTitle>

              <DrawerDescription className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap pt-0.5 font-medium">
                <span className="flex items-center gap-1 text-foreground/80 font-semibold">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span>{vacancy.zone || vacancy.location || "Mérida / Riviera Maya"}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Publicada el {formatDate(vacancy.created_at || "")}</span>
                </span>
              </DrawerDescription>
            </div>

            <DrawerClose
              render={
                <button
                  type="button"
                  className="size-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                  aria-label="Cerrar detalles de la vacante"
                />
              }
            >
              <X className="size-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6 select-text">
          {/* Quick Metrics (2 columnas simétricas) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Sueldo */}
            <Card className="bg-muted/30 border-border/50 rounded-2xl p-3 sm:p-3.5 space-y-1 shadow-none">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Sueldo
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black font-mono text-foreground truncate">
                {formatSalary(vacancy.salary_min ?? null, vacancy.salary_max ?? null)}
              </p>
              <span className="text-[10px] text-muted-foreground capitalize block font-medium truncate">
                {vacancy.payment_frequency ? `${vacancy.payment_frequency}` : "MXN Mensual"}
              </span>
            </Card>

            {/* Postulaciones */}
            <Card className="bg-muted/30 border-border/50 rounded-2xl p-3 sm:p-3.5 space-y-1 shadow-none">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5 text-indigo-500" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    Candidatos
                  </span>
                </div>
                <Link
                  href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                  className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Bandeja <ExternalLink className="size-2.5" />
                </Link>
              </div>
              <p className="text-xs sm:text-sm font-black font-mono text-foreground">
                {applicantsCount} {applicantsCount === 1 ? "postulado" : "postulados"}
              </p>
              <span className="text-[10px] text-muted-foreground block font-medium truncate">
                {isActive ? "Recepción activa" : "Recepción pausada"}
              </span>
            </Card>
          </div>

          {/* Ficha de Especificaciones clave (Grid 2x2 armónico) */}
          <div className="bg-muted/20 border border-border/40 rounded-2xl p-3 sm:p-3.5 grid grid-cols-2 gap-3 text-xs">
            {/* Jornada */}
            <div className="flex items-start gap-2 min-w-0">
              <div className="size-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Jornada</p>
                <p className="font-semibold text-foreground text-xs leading-tight line-clamp-1">
                  {vacancy.employment_type || "Tiempo Completo"}
                </p>
                {vacancy.shift_schedule && (
                  <p className="text-[10px] text-muted-foreground truncate">{vacancy.shift_schedule}</p>
                )}
              </div>
            </div>

            {/* Experiencia */}
            <div className="flex items-start gap-2 min-w-0">
              <div className="size-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Experiencia</p>
                <p className="font-semibold text-foreground text-xs leading-tight line-clamp-1">
                  {vacancy.experience_required || "Sin experiencia"}
                </p>
              </div>
            </div>

            {/* Escolaridad */}
            <div className="flex items-start gap-2 min-w-0">
              <div className="size-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Escolaridad</p>
                <p className="font-semibold text-foreground text-xs leading-tight line-clamp-1">
                  {vacancy.education_level || "No especificada"}
                </p>
              </div>
            </div>

            {/* Plazas disponibles */}
            <div className="flex items-start gap-2 min-w-0">
              <div className="size-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Disponibilidad</p>
                <p className="font-semibold text-foreground text-xs leading-tight line-clamp-1">
                  {vacancy.positions_available && vacancy.positions_available > 1
                    ? `${vacancy.positions_available} vacantes`
                    : "1 vacante"}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción General y Responsabilidades */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-3.5" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Descripción del Puesto & Responsabilidades
              </h3>
            </div>
            <div className="bg-muted/30 border border-border/40 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed">
              <MarkdownRenderer content={vacancy.description || "Sin descripción disponible."} />
            </div>
          </div>

          {/* Requisitos Específicos Adicionales (solo si son distintos a la descripción) */}
          {hasSeparateRequirements && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Requisitos Adicionales
              </h3>
              <div className="bg-muted/30 border border-border/40 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed">
                <MarkdownRenderer content={vacancy.requirements} />
              </div>
            </div>
          )}

          {/* Habilidades Requeridas */}
          {skillsList.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="size-3.5 text-muted-foreground" />
                Habilidades y Conocimientos
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((skill, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-muted/40 text-foreground border-border/50 px-2.5 py-1 text-xs font-bold shadow-none"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Beneficios e Incentivos */}
          {benefitsList.length > 0 && (
            <div className="space-y-2.5 border-t border-border/40 pt-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Gift className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Beneficios Ofrecidos
              </h3>
              <div className="flex flex-wrap gap-2">
                {benefitsList.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacto & Ubicación */}
          {(vacancy.contact_phone || vacancy.contact_email || vacancy.location || vacancy.zone) && (
            <div className="border-t border-border/40 pt-4 space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Detalles de Contacto y Ubicación
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {vacancy.contact_phone && (
                  <a
                    href={`tel:${vacancy.contact_phone}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40 hover:border-emerald-500/40 transition-colors"
                  >
                    <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-foreground truncate">{vacancy.contact_phone}</span>
                  </a>
                )}
                {vacancy.contact_email && (
                  <a
                    href={`mailto:${vacancy.contact_email}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40 hover:border-blue-500/40 transition-colors"
                  >
                    <Mail className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold text-foreground truncate">{vacancy.contact_email}</span>
                  </a>
                )}
                {(vacancy.zone || vacancy.location) && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40 col-span-1 sm:col-span-2">
                    <MapPin className="size-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold text-foreground truncate">
                      {vacancy.zone || vacancy.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones Rápidas */}
        <DrawerFooter className="p-4 sm:p-5 border-t border-border/60 bg-card/95 backdrop-blur-md shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-[calc(1rem+env(safe-area-inset-bottom,0.5rem))]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Ver postulaciones - Primary CTA */}
            <Button
              size="default"
              render={
                <Link
                  href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                />
              }
              className="h-11 sm:h-9 px-4 rounded-xl text-xs sm:text-xs font-bold gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm justify-center"
            >
              <Users className="size-4 sm:size-3.5" />
              <span>Ver Postulaciones ({applicantsCount})</span>
            </Button>

            {/* Acciones secundarias: grid de 2 columnas simétricas en mobile, flex en desktop */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              {/* Editar vacante */}
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    href={`/dashboard/company/vacancies/${vacancy.id}/edit`}
                  />
                }
                className="h-10 sm:h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-border/70 hover:bg-muted justify-center"
              >
                <Edit2 className="size-3.5 text-muted-foreground" />
                <span>Editar</span>
              </Button>

              {/* Activar / Pausar */}
              {onToggleActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleActive(vacancy.id, isActive)}
                  className={cn(
                    "h-10 sm:h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-border/70 justify-center",
                    isActive
                      ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  )}
                >
                  {isActive ? (
                    <>
                      <PauseCircle className="size-3.5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="size-3.5" />
                      <span>Activar</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Cerrar sólo en desktop para evitar duplicar el X y el swipe handle en mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <DrawerClose
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl text-xs font-bold cursor-pointer hover:bg-muted"
                />
              }
            >
              Cerrar
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
