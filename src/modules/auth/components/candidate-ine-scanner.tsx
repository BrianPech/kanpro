"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  RefreshIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { AlertCircle, Loader2 } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type IneScanStep =
  | "front-scan"
  | "front-review"
  | "back-scan"
  | "back-review";

export interface IneCaptureResult {
  frontImage: string;
  backImage: string;
  qrData: string | null;
}

interface CandidateIneScannerProps {
  initialStep?: IneScanStep;
  backHref?: string;
  onComplete?: (result: IneCaptureResult) => void;
}

const STEP_META: Record<
  IneScanStep,
  {
    headerLabel: string;
    actionLabel: string;
    actionAriaLabel: string;
    isReview: boolean;
  }
> = {
  "front-scan": {
    headerLabel: "Frente · 1 de 2",
    actionLabel: "Capturar",
    actionAriaLabel: "Tomar captura del frente de la INE",
    isReview: false,
  },
  "front-review": {
    headerLabel: "Frente · 1 de 2 · Revisión",
    actionLabel: "Usar frente",
    actionAriaLabel: "Confirmar captura del frente y continuar al reverso",
    isReview: true,
  },
  "back-scan": {
    headerLabel: "Reverso · 2 de 2",
    actionLabel: "Capturar",
    actionAriaLabel: "Tomar captura del reverso de la INE",
    isReview: false,
  },
  "back-review": {
    headerLabel: "Reverso · 2 de 2 · Revisión",
    actionLabel: "Enviar INE",
    actionAriaLabel: "Confirmar captura del reverso y enviar INE",
    isReview: true,
  },
};

function decodeQrFromCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) return null;
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    return decoded?.data ?? null;
  } catch {
    return null;
  }
}

async function requestRearCameraStream(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    {
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    {
      video: { facingMode: "environment" },
      audio: false,
    },
    {
      video: true,
      audio: false,
    },
  ];

  let lastError: unknown = null;

  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === "function") {
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
          focusMode?: string[];
        };
        if (capabilities.focusMode?.includes("continuous")) {
          void track
            .applyConstraints({
              advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
            })
            .catch(() => undefined);
        }
      }
      return stream;
    } catch (error: unknown) {
      lastError = error;
      const errName = error instanceof DOMException ? error.name : "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("No se pudo iniciar la cámara trasera.");
}

async function attachStreamToVideo(
  video: HTMLVideoElement,
  stream: MediaStream
): Promise<void> {
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.srcObject = stream;

  if (video.readyState < 1) {
    await new Promise<void>((resolve) => {
      const onLoaded = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        resolve();
      };
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
    });
  }

  await video.play();
}

export function CandidateIneScanner({
  initialStep = "front-scan",
  backHref = "/register/candidate/ine",
  onComplete,
}: CandidateIneScannerProps) {
  const router = useRouter();
  const [step, setStep] = useState<IneScanStep>(initialStep);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "starting" | "ready" | "error"
  >("starting");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const meta = STEP_META[step];
  const isScanning = !meta.isReview;
  const activePreview =
    step === "front-review"
      ? frontImage
      : step === "back-review"
        ? backImage
        : null;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const retryCamera = useCallback(() => {
    setCameraError(null);
    setCameraStatus("starting");
    setCameraAttempt((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isScanning) {
      stopCamera();
      return;
    }

    let cancelled = false;

    const initCamera = async () => {
      stopCamera();

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        if (!cancelled) {
          const isHttpInsecure =
            typeof window !== "undefined" &&
            window.isSecureContext === false &&
            window.location.hostname !== "localhost" &&
            window.location.hostname !== "127.0.0.1";

          setCameraStatus("error");
          setCameraError(
            isHttpInsecure
              ? "El navegador requiere HTTPS para abrir la cámara en vivo desde el teléfono. Abre esta página por HTTPS o usa la cámara nativa."
              : "No pudimos acceder a la cámara en este navegador. Usa la cámara nativa para tomar la foto."
          );
        }
        return;
      }

      try {
        const stream = await requestRearCameraStream();

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          await attachStreamToVideo(videoRef.current, stream);
        }

        if (!cancelled) {
          setCameraError(null);
          setCameraStatus("ready");
        }
      } catch (error: unknown) {
        if (cancelled) return;
        setCameraStatus("error");
        const errName = error instanceof DOMException ? error.name : "";
        if (
          errName === "NotAllowedError" ||
          errName === "PermissionDeniedError"
        ) {
          setCameraError(
            "Permiso de cámara denegado. Habilítalo en los ajustes de tu navegador y toca Reintentar."
          );
        } else if (errName === "NotFoundError") {
          setCameraError(
            "No detectamos una cámara trasera disponible. Puedes abrir la cámara nativa."
          );
        } else {
          setCameraError(
            "No fue posible iniciar la cámara trasera. Reintenta o abre la cámara nativa."
          );
        }
      }
    };

    void initCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isScanning, cameraAttempt, stopCamera]);

  const enterScanStep = (nextStep: "front-scan" | "back-scan") => {
    setCameraError(null);
    setCameraStatus("starting");
    setStep(nextStep);
  };

  const handleBack = () => {
    if (step === "front-scan") {
      router.push(backHref);
      return;
    }
    if (step === "front-review") {
      setFrontImage(null);
      enterScanStep("front-scan");
      return;
    }
    if (step === "back-scan") {
      setStep("front-review");
      return;
    }
    setBackImage(null);
    enterScanStep("back-scan");
  };

  const handleRetake = () => {
    if (step === "front-review") {
      setFrontImage(null);
      enterScanStep("front-scan");
      return;
    }
    if (step === "back-review") {
      setBackImage(null);
      setQrData(null);
      enterScanStep("back-scan");
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || cameraStatus !== "ready" || video.videoWidth === 0) {
      fileInputRef.current?.click();
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // ignore unsupported vibration
      }
    }

    if (step === "front-scan") {
      setFrontImage(dataUrl);
      setStep("front-review");
      return;
    }

    if (step === "back-scan") {
      const detectedQr = decodeQrFromCanvas(canvas);
      setQrData(detectedQr);
      setBackImage(dataUrl);
      setStep("back-review");
    }
  };

  const handleFileFallback = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;

      if (step === "front-scan") {
        setFrontImage(result);
        setStep("front-review");
        return;
      }

      if (step === "back-scan") {
        setBackImage(result);
        const img = new window.Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          setQrData(decodeQrFromCanvas(canvas));
        };
        img.src = result;
        setStep("back-review");
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrimaryAction = async () => {
    if (step === "front-scan" || step === "back-scan") {
      handleCaptureFrame();
      return;
    }

    if (step === "front-review") {
      enterScanStep("back-scan");
      return;
    }

    if (step === "back-review") {
      setIsSubmitting(true);
      try {
        if (onComplete && frontImage && backImage) {
          onComplete({ frontImage, backImage, qrData });
          return;
        }
        router.push("/register/candidate/ine/processing");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-dvh landscape:h-dvh w-full bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-hidden">
      {/* Canvas oculto para captura y lectura QR */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileFallback}
        className="sr-only"
        aria-label="Abrir cámara trasera para capturar INE"
      />

      {/* Contenedor adaptable: columna en vertical, 3 columnas exactas de Figma en horizontal */}
      <main className="relative flex-1 w-full max-w-[1040px] mx-auto flex flex-col landscape:flex-row items-center landscape:items-stretch justify-between px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] landscape:px-0 landscape:py-0">
        {/* Columna izquierda (horizontal): botón atrás; en vertical: barra superior con atrás + etiqueta */}
        <div className="w-full landscape:w-[128px] flex items-center justify-between landscape:items-start landscape:justify-end landscape:pt-4 landscape:pr-4 shrink-0">
          {step === "front-scan" ? (
            <Link
              href={backHref}
              aria-label="Atrás"
              className="size-[48px] inline-flex items-center justify-center rounded-[8px] text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Atrás"
              className="size-[48px] inline-flex items-center justify-center rounded-[8px] text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Etiqueta de paso en vertical */}
          <p className="landscape:hidden text-[12px] font-medium leading-[17px] text-foreground text-center">
            {meta.headerLabel}
          </p>

          {/* Espaciador equilibrado en vertical */}
          <span className="landscape:hidden size-[48px]" aria-hidden="true" />
        </div>

        {/* Columna central: etiqueta superior (horizontal) + visor de cámara / revisión */}
        <div className="w-full flex-1 flex flex-col items-center justify-center landscape:h-dvh landscape:py-2 min-w-0">
          {/* Etiqueta de paso en horizontal (arriba del visor, exacto Figma) */}
          <p className="hidden landscape:block mb-2 text-[12px] font-medium leading-[17px] text-foreground text-center">
            {meta.headerLabel}
          </p>

          {/* Visor negro con borde teal de 2 px (cámara en vivo o captura en revisión) */}
          <div className="relative w-full max-w-[600px] aspect-[1.586/1] landscape:aspect-[600/332] landscape:max-h-[calc(100dvh-56px)] rounded-[16px] border-2 border-primary bg-foreground overflow-hidden flex items-center justify-center">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  aria-label="Vista previa de cámara trasera para escanear INE"
                  className={cn(
                    "size-full object-cover",
                    cameraStatus !== "ready" && "opacity-0"
                  )}
                />

                {cameraStatus === "starting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-background">
                    <Loader2
                      className="size-7 animate-spin text-primary-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-[14px] leading-[19px] text-primary-foreground">
                      Activando cámara trasera...
                    </p>
                  </div>
                )}

                {cameraStatus === "error" && (
                  <div
                    role="alert"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center bg-foreground text-background"
                  >
                    <AlertCircle
                      className="size-6 text-warning-foreground dark:text-warning shrink-0"
                      aria-hidden="true"
                    />
                    <p className="max-w-[340px] text-[13px] leading-[18px] text-background">
                      {cameraError}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={retryCamera}
                        className="min-h-[48px] px-4 rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold inline-flex items-center gap-2 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors"
                      >
                        <HugeiconsIcon
                          icon={RefreshIcon}
                          size={18}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>Reintentar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[48px] px-4 rounded-[8px] border border-background/40 bg-background/10 text-background text-[14px] font-semibold inline-flex items-center gap-2 hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors"
                      >
                        <HugeiconsIcon
                          icon={Camera01Icon}
                          size={18}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>Abrir cámara</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : activePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activePreview}
                alt={
                  step === "front-review"
                    ? "Vista previa del frente de tu INE"
                    : "Vista previa del reverso de tu INE"
                }
                className="size-full object-cover"
              />
            ) : (
              <p className="text-[14px] leading-[19px] text-background/80 px-6 text-center">
                Vista previa de captura
              </p>
            )}
          </div>

          {/* Aviso suave en vertical recomendando girar el teléfono */}
          <p className="landscape:hidden mt-4 inline-flex items-center gap-2 text-[13px] leading-[18px] text-muted-foreground text-center px-4">
            <HugeiconsIcon
              icon={SmartPhone01Icon}
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className="-rotate-90 shrink-0 text-primary"
            />
            <span>Gira tu teléfono en horizontal para mejor encuadre.</span>
          </p>
        </div>

        {/* Columna derecha (horizontal) / Zona inferior del pulgar (vertical): acciones */}
        <div className="w-full landscape:w-[146px] flex flex-col items-center justify-center gap-4 landscape:gap-8 pt-4 pb-2 landscape:pt-0 landscape:pb-0 landscape:px-2 shrink-0">
          {/* Botón Repetir (solo en estados de revisión) */}
          {meta.isReview && (
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center justify-center gap-3 min-h-[48px] px-3 rounded-[8px] text-[16px] font-normal leading-[22px] text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Repetir</span>
            </button>
          )}

          {/* Botón circular principal (72 × 72 px) + etiqueta */}
          <div className="flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handlePrimaryAction()}
              disabled={isSubmitting}
              aria-label={meta.actionAriaLabel}
              className="size-[72px] rounded-full bg-primary hover:bg-primary-hover text-primary-foreground border-[3px] border-background shadow-xs inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : meta.isReview ? (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              ) : (
                <HugeiconsIcon
                  icon={Camera01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              )}
            </button>
            <span className="text-[14px] font-normal leading-[19px] text-foreground text-center">
              {meta.actionLabel}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
