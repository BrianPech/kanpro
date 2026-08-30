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
} from "lucide-react";
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
            ? "max-h-[92dvh] rounded-t-3xl p-0"
            : "h-full w-full sm:max-w-xl md:max-w-2xl sm:[--drawer-content-width:38rem] md:[--drawer-content-width:44rem] rounded-l-3xl p-0 ml-auto"
        )}
      >
        {/* Header con Título, Categoría y Estado */}
        <DrawerHeader className="p-5 sm:p-6 pb-4 border-b border-border/50 text-left shrink-0 bg-muted/20 relative">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
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
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg border-border/40"
                  >
                    {vacancy.category}
                  </Badge>
                )}

                {vacancy.modality && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg text-muted-foreground border-border/50"
                  >
                    {vacancy.modality}
                  </Badge>
                )}
              </div>

              <DrawerTitle className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
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
          </div>

          <DrawerClose
            render={
              <button
                type="button"
                className="absolute top-5 right-5 size-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar detalles de la vacante"
              />
            }
          >
            <X className="size-4" />
          </DrawerClose>
        </DrawerHeader>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 select-text">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Sueldo */}
            <Card className="bg-muted/30 border-border/50 rounded-2xl p-3.5 space-y-1 shadow-none">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="size-3.5 text-primary" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Sueldo
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black font-mono text-foreground truncate">
                {formatSalary(vacancy.salary_min ?? null, vacancy.salary_max ?? null)}
              </p>
              <span className="text-[10px] text-muted-foreground capitalize block font-medium">
                {vacancy.payment_frequency ? `${vacancy.payment_frequency}` : "MXN Mensual"}
              </span>
            </Card>

            {/* Postulaciones */}
            <Card className="bg-muted/30 border-border/50 rounded-2xl p-3.5 space-y-1 shadow-none">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5 text-indigo-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Candidatos
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black font-mono text-foreground">
                {applicantsCount} {applicantsCount === 1 ? "postulado" : "postulados"}
              </p>
              <Link
                href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Ver bandeja <ExternalLink className="size-2.5" />
              </Link>
            </Card>

            {/* Jornada / Horario */}
            <Card className="bg-muted/30 border-border/50 rounded-2xl p-3.5 space-y-1 shadow-none col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5 text-amber-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Jornada
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                {vacancy.employment_type || "Tiempo Completo"}
              </p>
              <span className="text-[10px] text-muted-foreground truncate block font-medium">
                {vacancy.shift_schedule || "Horario regular"}
              </span>
            </Card>
          </div>

          {/* Plazas y Experiencia adicional si existen */}
          {(vacancy.positions_available || vacancy.experience_required || vacancy.education_level) && (
            <div className="flex items-center gap-2.5 flex-wrap text-xs font-semibold text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/40">
              {vacancy.positions_available && vacancy.positions_available > 1 && (
                <span className="text-primary font-bold flex items-center gap-1">
                  <Flame className="size-3.5 text-amber-500" />
                  <span>{vacancy.positions_available} vacantes disponibles</span>
                </span>
              )}
              {vacancy.experience_required && (
                <span className="flex items-center gap-1">
                  <Award className="size-3.5 text-muted-foreground" />
                  <span>Experiencia: <strong className="text-foreground">{vacancy.experience_required}</strong></span>
                </span>
              )}
              {vacancy.education_level && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="size-3.5 text-muted-foreground" />
                  <span>Escolaridad: <strong className="text-foreground">{vacancy.education_level}</strong></span>
                </span>
              )}
            </div>
          )}

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
                    className="rounded-lg bg-muted/40 text-foreground border-border/50 px-2.5 py-1 text-xs font-bold shadow-none"
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
        <DrawerFooter className="p-4 sm:p-5 border-t border-border/50 bg-muted/20 shrink-0 gap-2 flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Ver postulaciones */}
            <Button
              size="sm"
              render={
                <Link
                  href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                />
              }
              className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Users className="size-3.5" />
              <span>Ver Postulaciones ({applicantsCount})</span>
            </Button>

            {/* Editar vacante */}
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  href={`/dashboard/company/vacancies/${vacancy.id}/edit`}
                />
              }
              className="h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-border/60 hover:bg-muted"
            >
              <Edit2 className="size-3.5 text-primary" />
              <span>Editar</span>
            </Button>

            {/* Activar / Pausar */}
            {onToggleActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleActive(vacancy.id, isActive)}
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-border/60",
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
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
