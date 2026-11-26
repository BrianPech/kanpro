"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  File01Icon,
  Notification02Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  CandidateApplication,
  CandidateDashboardData,
} from "../services/candidate-dashboard";
import {
  APPLICATION_STAGES,
  formatInterviewDateParts,
  resolveApplicationStage,
  type ApplicationStageInfo,
} from "../utils/application-stages";

interface CandidateApplicationsViewProps {
  initialData: CandidateDashboardData;
}

type FilterTab = "active" | "finished";

interface EnrichedApplication {
  app: CandidateApplication;
  stage: ApplicationStageInfo;
}

function ApplicationCard({
  item,
  onSelect,
}: {
  item: EnrichedApplication;
  onSelect: (item: EnrichedApplication) => void;
}) {
  const { app, stage } = item;

  return (
    <article className="flex min-h-[144px] w-full flex-col justify-between gap-4 rounded-[16px] border border-border bg-background p-4">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-muted"
        >
          <span className="text-[12px] font-medium leading-[17px] text-primary">
            {app.companyInitials}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-[14px] font-normal leading-[19px] text-foreground">
            {app.company}
          </p>
          <h2 className="line-clamp-2 text-[18px] font-semibold leading-[24px] text-foreground">
            {app.position}
          </h2>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-label={`Ver detalles de tu postulación para ${app.position} en ${app.company}: ${stage.label}${stage.isRejected ? "" : `, Etapa ${stage.step} de 4`}`}
        className="flex min-h-[48px] w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] bg-muted px-4 text-left transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate text-[14px] font-medium leading-[19px] text-primary">
          {stage.label}
        </span>

        <span className="flex shrink-0 items-center gap-3">
          <span className="whitespace-nowrap text-[12px] font-medium leading-[17px] text-foreground">
            {stage.isRejected ? "Proceso cerrado" : `Etapa ${stage.step} de 4`}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className="text-muted-foreground"
          />
        </span>
      </button>
    </article>
  );
}

function ApplicationDetailSheet({
  selected,
  onClose,
}: {
  selected: EnrichedApplication | null;
  onClose: () => void;
}) {
  const interviewParts = selected
    ? formatInterviewDateParts(selected.app.interviewDetails)
    : null;

  return (
    <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto w-full max-w-[460px] max-h-[calc(100dvh-72px)] overflow-y-auto rounded-t-[24px] border-t border-border bg-background px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-xl"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-5 h-[4px] w-[48px] shrink-0 rounded-[2px] bg-input"
        />

        <div className="flex items-center justify-between gap-2">
          <SheetTitle className="text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
            Tu postulación
          </SheetTitle>

          <SheetClose
            render={
              <button
                type="button"
                aria-label="Cerrar detalle"
                className="-mr-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            }
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </SheetClose>
        </div>

        {selected && (
          <div className="mt-6 flex flex-col gap-6">
            {/* Identidad de la vacante */}
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="flex size-[48px] shrink-0 items-center justify-center rounded-[8px] bg-muted"
              >
                <span className="text-[12px] font-medium leading-[17px] text-primary">
                  {selected.app.companyInitials}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 break-words">
                <p className="text-[14px] font-normal leading-[19px] text-foreground">
                  {selected.app.company}
                </p>
                <p className="text-[20px] font-semibold leading-[28px] text-foreground">
                  {selected.app.position}
                </p>
              </div>
            </div>

            {/* Dos columnas: estado/próximo paso a la izquierda, timeline vertical a la derecha */}
            <div className="grid grid-cols-1 gap-6 min-[340px]:grid-cols-[minmax(0,1fr)_144px]">
              {/* Columna izquierda: Información */}
              <div className="flex min-w-0 flex-col gap-6 break-words">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[12px] font-medium leading-[17px] text-muted-foreground">
                    Estado actual
                  </p>
                  <p className="text-[18px] font-semibold leading-[24px] text-primary">
                    {selected.stage.label}
                  </p>
                  <p className="text-[12px] font-medium leading-[17px] text-muted-foreground">
                    {selected.stage.isRejected
                      ? "Proceso cerrado"
                      : `Etapa ${selected.stage.step} de 4`}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-normal leading-[19px] text-foreground">
                    {selected.stage.isRejected
                      ? "Última etapa"
                      : selected.stage.isFinished
                        ? "Resultado"
                        : "Próximo paso"}
                  </p>
                  <div className="text-[16px] font-medium leading-[24px] text-foreground">
                    <p>{selected.stage.nextStepTitle}</p>
                    {selected.stage.step === 3 &&
                      !selected.stage.isRejected &&
                      interviewParts?.timeLine && (
                        <p>{interviewParts.timeLine}</p>
                      )}
                  </div>
                  <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                    {selected.stage.nextStepSubtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-normal leading-[22px] text-foreground">
                    {selected.stage.isRejected ? "Sigue buscando" : "Qué sigue"}
                  </p>
                  <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                    {selected.stage.whatFollows}
                  </p>
                </div>
              </div>

              {/* Columna derecha: Timeline vertical de 4 etapas */}
              <div className="flex flex-col gap-4">
                <p className="text-[14px] font-normal leading-[19px] text-foreground">
                  Tu proceso
                </p>

                <ol className="relative flex flex-col">
                  {APPLICATION_STAGES.map((stageItem, idx) => {
                    const isHired =
                      selected.stage.isFinished && !selected.stage.isRejected;
                    const isRejected = selected.stage.isRejected;
                    const isCompleted = isRejected
                      ? stageItem.step <= selected.stage.step
                      : isHired || stageItem.step < selected.stage.step;
                    const isCurrent =
                      !isRejected &&
                      !isHired &&
                      stageItem.step === selected.stage.step;
                    const isLast = idx === APPLICATION_STAGES.length - 1;
                    const connectorDone = isRejected
                      ? stageItem.step <= selected.stage.step
                      : stageItem.step < selected.stage.step;
                    const statusText = isCurrent
                      ? "Actual"
                      : isCompleted
                        ? "Completado"
                        : isRejected
                          ? "No alcanzada"
                          : "Pendiente";

                    return (
                      <li
                        key={stageItem.step}
                        aria-current={isCurrent ? "step" : undefined}
                        className="relative flex items-start gap-4 pb-6 last:pb-0"
                      >
                        {!isLast && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute left-[13px] top-[28px] bottom-0 w-[2px]",
                              connectorDone ? "bg-primary" : "bg-border"
                            )}
                          />
                        )}

                        <span
                          aria-hidden="true"
                          className={cn(
                            "relative z-10 flex size-[28px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                            isCurrent &&
                              "bg-primary text-primary-foreground",
                            isCompleted &&
                              "border border-primary bg-background text-primary",
                            !isCurrent &&
                              !isCompleted &&
                              "bg-muted text-primary"
                          )}
                        >
                          {stageItem.step}
                        </span>

                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className={cn(
                              "text-[14px] font-medium leading-[20px]",
                              isCurrent ? "text-primary" : "text-foreground"
                            )}
                          >
                            {stageItem.label}
                          </span>
                          <span
                            className={cn(
                              "text-[12px] font-medium leading-[17px]",
                              isCurrent
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          >
                            {statusText}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {selected.stage.isRejected ? (
              <Link
                href="/dashboard/candidate"
                onClick={onClose}
                className="mt-2 inline-flex min-h-[56px] w-full items-center justify-center rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Explorar vacantes
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Entendido
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function CandidateApplicationsView({
  initialData,
}: CandidateApplicationsViewProps) {
  const [activeTab, setActiveTab] = React.useState<FilterTab>("active");
  const [selectedItem, setSelectedItem] =
    React.useState<EnrichedApplication | null>(null);

  const enriched = React.useMemo<EnrichedApplication[]>(
    () =>
      (initialData.applications ?? []).map((app) => ({
        app,
        stage: resolveApplicationStage(
          app.status,
          app.interviewDetails,
          app.progress
        ),
      })),
    [initialData.applications]
  );

  const activeItems = React.useMemo(
    () => enriched.filter((item) => !item.stage.isFinished),
    [enriched]
  );
  const finishedItems = React.useMemo(
    () => enriched.filter((item) => item.stage.isFinished),
    [enriched]
  );

  const scheduledInterviewsCount = React.useMemo(
    () => activeItems.filter((item) => item.stage.step === 3).length,
    [activeItems]
  );

  const visibleItems = activeTab === "active" ? activeItems : finishedItems;

  return (
    <div className="flex w-full flex-col gap-6 pb-8 md:pb-0">
      {/* Encabezado */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Postulaciones
          </h1>

          <Link
            href="/dashboard/candidate/inbox"
            aria-label="Notificaciones"
            className="md:hidden -mr-2 inline-flex size-[48px] shrink-0 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Notification02Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </div>

        <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
          Sigue tus procesos, paso a paso.
        </p>
      </header>

      {/* Filtros Activas / Finalizadas */}
      <div
        role="tablist"
        aria-label="Filtrar postulaciones"
        className="grid w-full max-w-[440px] grid-cols-2 gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "active"}
          onClick={() => setActiveTab("active")}
          className={cn(
            "flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border px-3 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeTab === "active"
              ? "border-primary bg-muted text-primary"
              : "border-input bg-background text-foreground hover:bg-muted/40"
          )}
        >
          Activas · {activeItems.length}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "finished"}
          onClick={() => setActiveTab("finished")}
          className={cn(
            "flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border px-3 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeTab === "finished"
              ? "border-primary bg-muted text-primary"
              : "border-input bg-background text-foreground hover:bg-muted/40"
          )}
        >
          Finalizadas · {finishedItems.length}
        </button>
      </div>

      {/* Subtítulo y contador de entrevistas programadas */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[16px] font-normal leading-[22px] text-foreground">
          {activeTab === "active"
            ? "Tus procesos activos"
            : finishedItems.length === 0
              ? "Sin procesos finalizados"
              : "Tus procesos finalizados"}
        </p>

        {activeTab === "active" && scheduledInterviewsCount > 0 && (
          <p className="whitespace-nowrap text-[12px] font-medium leading-[17px] text-muted-foreground">
            {scheduledInterviewsCount}{" "}
            {scheduledInterviewsCount === 1 ? "programada" : "programadas"}
          </p>
        )}

        {activeTab === "finished" && finishedItems.length > 0 && (
          <p className="whitespace-nowrap text-[12px] font-medium leading-[17px] text-muted-foreground">
            {finishedItems.length}{" "}
            {finishedItems.length === 1 ? "proceso" : "procesos"}
          </p>
        )}
      </div>

      {/* Lista de postulaciones */}
      <section aria-label="Lista de postulaciones" className="w-full">
        {visibleItems.length === 0 ? (
          activeTab === "finished" ? (
            <div className="flex max-w-[354px] flex-col items-start justify-center gap-6 py-10">
              <HugeiconsIcon
                icon={File01Icon}
                size={40}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-muted-foreground"
              />
              <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                Aún no hay procesos finalizados
              </h2>
              <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
                Cuando termine una postulación, podrás consultar aquí su
                resultado.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={File01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Ver postulaciones activas</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-[16px] border border-border bg-background p-8 text-center">
              <div className="flex size-[56px] items-center justify-center rounded-full bg-muted text-primary">
                <HugeiconsIcon
                  icon={File01Icon}
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div className="flex max-w-sm flex-col gap-1">
                <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">
                  Aún no tienes postulaciones activas
                </h2>
                <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  Explora las vacantes disponibles y da seguimiento a cada etapa
                  aquí.
                </p>
              </div>
              <Link
                href="/dashboard/candidate"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Explorar vacantes
              </Link>
            </div>
          )
        ) : (
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            {visibleItems.map((item) => (
              <ApplicationCard
                key={item.app.id}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sheet contextual: Tu postulación */}
      <ApplicationDetailSheet
        selected={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
