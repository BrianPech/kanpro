"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  Loading03Icon,
  Upload01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  candidateDocumentsService,
  type CandidateDocument,
  type CandidateDocumentType,
} from "../services/candidate-documents";

interface DocumentSlot {
  docType: CandidateDocumentType;
  title: string;
  emptySubtitle: string;
  optional?: boolean;
  isIdentity?: boolean;
}

const DOCUMENT_SLOTS: readonly DocumentSlot[] = [
  {
    docType: "ine_passport",
    title: "Identificación oficial",
    emptySubtitle: "INE · Frente y reverso",
    isIdentity: true,
  },
  {
    docType: "cv",
    title: "Currículum vitae",
    emptySubtitle: "Tu CV en PDF",
  },
  {
    docType: "proof_of_address",
    title: "Comprobante de domicilio",
    emptySubtitle: "Recibo reciente en PDF o imagen",
  },
  {
    docType: "work_certificate",
    title: "Constancias laborales",
    emptySubtitle: "Cartas de empleo · Opcional",
    optional: true,
  },
];

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileFormatLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase();
  return ext || "Archivo";
}

export function CandidateDocumentsView() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [userId, setUserId] = React.useState<string | null>(null);
  const [documents, setDocuments] = React.useState<CandidateDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeSlot, setActiveSlot] = React.useState<DocumentSlot | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isOpeningPreview, setIsOpeningPreview] = React.useState(false);

  const loadDocuments = React.useCallback(async () => {
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const list = await candidateDocumentsService.list(user.id);
      setDocuments(list);
    } catch (err) {
      console.error("Error loading candidate documents:", err);
      toast.error("No pudimos cargar tus documentos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await loadDocuments();
    })();
    return () => {
      active = false;
    };
  }, [loadDocuments]);

  const docByType = React.useMemo(() => {
    const map = new Map<CandidateDocumentType, CandidateDocument>();
    for (const doc of documents) {
      if (!map.has(doc.doc_type)) {
        map.set(doc.doc_type, doc);
      }
    }
    return map;
  }, [documents]);

  const uploadedCount = DOCUMENT_SLOTS.filter((slot) =>
    docByType.has(slot.docType)
  ).length;
  const optionalPendingCount = DOCUMENT_SLOTS.filter(
    (slot) => slot.optional && !docByType.has(slot.docType)
  ).length;
  const hasIdentity = docByType.has("ine_passport");

  const activeDoc = activeSlot ? docByType.get(activeSlot.docType) ?? null : null;

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId || !activeSlot) return;

    setIsUploading(true);
    try {
      await candidateDocumentsService.upload(
        userId,
        activeSlot.docType,
        file,
        false
      );
      await loadDocuments();
      toast.success("Documento cargado correctamente");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo subir el archivo";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewActiveDoc = async () => {
    if (!activeDoc || isOpeningPreview) return;
    setIsOpeningPreview(true);
    try {
      const url = await candidateDocumentsService.getSignedUrl(
        activeDoc.file_url
      );
      if (!url) {
        toast.error("No se pudo abrir el archivo");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("No se pudo abrir el archivo");
    } finally {
      setIsOpeningPreview(false);
    }
  };

  const summarySubtitle = [
    `${uploadedCount} ${uploadedCount === 1 ? "cargado" : "cargados"}`,
    optionalPendingCount > 0
      ? `${optionalPendingCount} opcional pendiente`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-8">
      {/* Encabezado (Figma 228:722) */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/candidate/profile")}
            aria-label="Volver a Mi perfil"
            className="md:hidden -ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Mis documentos
          </h1>
        </div>
        <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
          Ten tus archivos listos para postular.
        </p>
      </header>

      {/* Tarjeta resumen de estado */}
      <section
        aria-label="Resumen de documentos"
        className="flex items-start gap-4 rounded-[16px] border border-border bg-background p-4"
      >
        <HugeiconsIcon
          icon={AlertCircleIcon}
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-primary"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[16px] font-semibold leading-[22px] text-foreground">
            {hasIdentity
              ? "Identificación capturada"
              : "Completa tus documentos"}
          </p>
          <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
            {isLoading ? "Verificando archivos…" : summarySubtitle}
          </p>
        </div>
      </section>

      {/* Lista Tus documentos */}
      <section aria-labelledby="docs-heading" className="flex flex-col gap-4">
        <h2
          id="docs-heading"
          className="text-[16px] font-normal leading-[22px] text-foreground"
        >
          Tus documentos
        </h2>

        {isLoading ? (
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton className="h-[116px] w-full rounded-[16px]" />
            <Skeleton className="h-[116px] w-full rounded-[16px]" />
            <Skeleton className="h-[116px] w-full rounded-[16px]" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {DOCUMENT_SLOTS.map((slot) => {
              const doc = docByType.get(slot.docType);
              const sizeStr = formatBytes(doc?.file_size_bytes);
              const subtitle = doc
                ? slot.isIdentity
                  ? "INE · Frente y reverso capturados"
                  : [doc.file_name, sizeStr].filter(Boolean).join(" · ")
                : slot.emptySubtitle;

              const statusLabel = doc
                ? slot.isIdentity
                  ? "Capturada"
                  : "Cargado"
                : slot.optional
                  ? "Opcional"
                  : "Pendiente";

              return (
                <button
                  key={slot.docType}
                  type="button"
                  onClick={() => setActiveSlot(slot)}
                  className="group flex min-h-[116px] w-full cursor-pointer flex-col justify-between gap-3 rounded-[16px] border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex w-full items-start gap-4">
                    <HugeiconsIcon
                      icon={File01Icon}
                      size={20}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-muted-foreground"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-[16px] font-semibold leading-[22px] text-foreground">
                        {slot.title}
                      </p>
                      <p className="truncate text-[13px] font-normal leading-[18px] text-muted-foreground">
                        {subtitle}
                      </p>
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={20}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {doc ? (
                      <>
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={20}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className="shrink-0 text-primary"
                        />
                        <span className="text-[14px] font-medium leading-[19px] text-primary">
                          {statusLabel}
                        </span>
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={Upload01Icon}
                          size={20}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className="shrink-0 text-muted-foreground"
                        />
                        <span className="text-[14px] font-medium leading-[19px] text-muted-foreground">
                          {statusLabel}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Input oculto compartido para subir o reemplazar archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        className="hidden"
        aria-label="Seleccionar archivo de documento"
      />

      {/* Sheets contextuales: Tu identificación (229:883), Documento (229:937 / 229:1003), Subir documento (229:1069) */}
      <Sheet
        open={Boolean(activeSlot)}
        onOpenChange={(open) => !open && setActiveSlot(null)}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto w-full max-w-[460px] max-h-[calc(100dvh-72px)] overflow-y-auto rounded-t-[24px] border-t border-border bg-background px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-xl"
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-5 h-[4px] w-[48px] rounded-[2px] bg-input"
          />

          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-[28px] font-bold leading-[39px] text-foreground">
              {activeSlot?.isIdentity && activeDoc
                ? "Tu identificación"
                : activeDoc
                  ? "Documento"
                  : "Subir documento"}
            </SheetTitle>

            <SheetClose
              render={
                <button
                  type="button"
                  aria-label="Cerrar"
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

          {/* Variante A: Tu identificación (Figma 229:883) */}
          {activeSlot?.isIdentity && activeDoc && (
            <div className="mt-6 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-[18px] font-semibold leading-[24px] text-foreground">
                  Identificación oficial
                </p>
                <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  INE · Frente y reverso
                </p>
              </div>

              <div className="flex min-h-[168px] flex-col items-center justify-center gap-3 rounded-[16px] border border-input bg-background p-6 text-center">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="text-primary"
                />
                <p className="text-[16px] font-medium leading-[22px] text-foreground">
                  Dos capturas de tu INE
                </p>
                <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  Frente y reverso recibidos
                </p>
              </div>

              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                Tus capturas están listas para la revisión de identidad.
              </p>

              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Listo</span>
              </button>
            </div>
          )}

          {/* Variante B: Documento cargado (Figma 229:937 y 229:1003) */}
          {activeSlot && !activeSlot.isIdentity && activeDoc && (
            <div className="mt-6 flex flex-col gap-6">
              <p className="text-[18px] font-semibold leading-[24px] text-foreground">
                {activeSlot.title}
              </p>

              <div className="flex flex-col gap-3 rounded-[16px] border border-border bg-background p-4">
                <div className="flex items-start gap-4">
                  <HugeiconsIcon
                    icon={File01Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-[14px] font-medium leading-[19px] text-foreground">
                      {activeDoc.file_name}
                    </p>
                    <p className="text-[12px] font-normal leading-[17px] text-muted-foreground">
                      {[
                        getFileFormatLabel(activeDoc.file_name),
                        formatBytes(activeDoc.file_size_bytes),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-primary"
                  />
                  <span className="text-[14px] font-medium leading-[19px] text-primary">
                    Cargado
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[16px] font-normal leading-[22px] text-foreground">
                  Gestionar archivo
                </p>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={triggerFilePicker}
                  className="flex min-h-[48px] w-full cursor-pointer items-center gap-4 rounded-[8px] border border-input bg-background px-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon
                    icon={isUploading ? Loading03Icon : Upload01Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className={
                      isUploading
                        ? "shrink-0 animate-spin text-primary"
                        : "shrink-0 text-primary"
                    }
                  />
                  <span className="flex-1 text-[14px] font-medium text-foreground">
                    {isUploading ? "Subiendo…" : "Reemplazar archivo"}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                  />
                </button>
              </div>

              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                Consulta tu archivo y reemplázalo cuando necesites actualizarlo.
              </p>

              <button
                type="button"
                disabled={isOpeningPreview}
                onClick={() => void handlePreviewActiveDoc()}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={isOpeningPreview ? Loading03Icon : ViewIcon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={isOpeningPreview ? "animate-spin" : undefined}
                />
                <span>
                  {isOpeningPreview ? "Abriendo…" : "Ver archivo"}
                </span>
              </button>
            </div>
          )}

          {/* Variante C: Subir documento (Figma 229:1069) */}
          {activeSlot && !activeDoc && (
            <div className="mt-6 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-[18px] font-semibold leading-[24px] text-foreground">
                  {activeSlot.title}
                </p>
                <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  {activeSlot.emptySubtitle}
                </p>
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={triggerFilePicker}
                className="flex min-h-[168px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-input bg-background p-6 text-center transition-colors hover:bg-muted/30 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={isUploading ? Loading03Icon : Upload01Icon}
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={
                    isUploading ? "animate-spin text-primary" : "text-primary"
                  }
                />
                <p className="text-[16px] font-medium leading-[22px] text-foreground">
                  Archivo completo y legible
                </p>
                <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  PDF o imagen · Máximo 10 MB
                </p>
              </button>

              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                Revisa que los datos y las esquinas del documento se vean
                completos.
              </p>

              <button
                type="button"
                disabled={isUploading}
                onClick={triggerFilePicker}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={isUploading ? Loading03Icon : Upload01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={isUploading ? "animate-spin" : undefined}
                />
                <span>{isUploading ? "Subiendo…" : "Elegir archivo"}</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
