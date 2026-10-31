"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import {
  Camera,
  SwitchCamera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  QrCode,
  MapPin,
  Clock,
  RefreshCw,
  Upload,
  Keyboard,
  ShieldCheck,
  Video,
  Info,
} from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  recordEmployeeQrCheckInAction,
  type RecordEmployeeQrCheckInResponse,
} from "../../actions/employee-attendance";
import type { EmployeeQrCheckInResult } from "../../schemas/employee-attendance.schema";

interface QrAttendanceScannerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckInSuccess?: (result: EmployeeQrCheckInResult) => void;
}

export function QrAttendanceScannerModal({
  isOpen,
  onOpenChange,
  onCheckInSuccess,
}: QrAttendanceScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "photo" | "manual">("camera");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<EmployeeQrCheckInResult | null>(null);
  const [manualCode, setManualCode] = useState("");

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const hasProcessedRef = useRef<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly and release hardware locks
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      try {
        videoElementRef.current.pause();
        videoElementRef.current.srcObject = null;
      } catch {
        // ignore
      }
    }
    setIsCameraActive(false);
  }, []);

  // Frame scanner loop using jsQR
  const scanFrame = useCallback(() => {
    if (!isScanningRef.current) return;
    const video = videoElementRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data.trim() && !hasProcessedRef.current) {
          hasProcessedRef.current = true;
          isScanningRef.current = false;
          handleQrDetected(code.data.trim());
          return;
        }
      }
    }

    if (isScanningRef.current) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  }, []);

  // Bind video element to current stream
  const bindStreamToVideo = useCallback(
    async (stream: MediaStream) => {
      const video = videoElementRef.current;
      if (!video) return;

      try {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
        isScanningRef.current = true;
        hasProcessedRef.current = false;
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        console.warn("Could not play video element:", err);
      }
    },
    [scanFrame]
  );

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setErrorMessage(null);
    setSuccessData(null);
    hasProcessedRef.current = false;

    // Check if getUserMedia is supported in the current environment
    const isMediaDevicesSupported =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";

    if (!isMediaDevicesSupported) {
      const isHttpInsecure =
        typeof window !== "undefined" &&
        window.isSecureContext === false &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1";

      setCameraError(
        isHttpInsecure
          ? "Tu navegador restringe el video en vivo al navegar por HTTP local sin HTTPS. Puedes usar el botón 'Tomar Foto con Cámara' de abajo para abrir la cámara nativa de tu teléfono."
          : "La cámara no está disponible o tu navegador no tiene permisos de captura."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      await bindStreamToVideo(stream);
    } catch (err: unknown) {
      console.warn("Camera access denied or unavailable:", err);
      let errorDesc = "No se pudo acceder a la cámara. Por favor autoriza el permiso en tu navegador.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorDesc = "Permiso de cámara denegado. Toca el icono de ajustes/candado en la barra de tu navegador para permitir la cámara.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorDesc = "No se detectó ninguna cámara disponible en este dispositivo.";
        }
      }
      setCameraError(errorDesc);
      setIsCameraActive(false);
    }
  }, [bindStreamToVideo, facingMode, stopCamera]);

  // Handle scanned payload
  const handleQrDetected = useCallback(
    async (rawQrData: string) => {
      if (isSubmitting) return;
      stopCamera();

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch {
          // ignore
        }
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      // Attempt non-blocking geolocation check
      let coords: { lat: number; lng: number } | undefined = undefined;
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition | null>((resolve) => {
            const timer = setTimeout(() => resolve(null), 1500);
            navigator.geolocation.getCurrentPosition(
              (p) => {
                clearTimeout(timer);
                resolve(p);
              },
              () => {
                clearTimeout(timer);
                resolve(null);
              },
              { timeout: 1500, enableHighAccuracy: true }
            );
          });
          if (pos) {
            coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
          }
        } catch {
          // Non-blocking geolocation
        }
      }

      try {
        const response: RecordEmployeeQrCheckInResponse =
          await recordEmployeeQrCheckInAction({
            qrUrlOrToken: rawQrData,
            coordinates: coords,
          });

        if (response.success && response.data) {
          setSuccessData(response.data);
          const actionText =
            response.data.actionType === "check_out"
              ? "Salida registrada"
              : "Entrada registrada";

          toast.success(`¡${actionText} a las ${response.data.timeStr}!`, {
            description: response.data.branchName
              ? `Sucursal: ${response.data.branchName}`
              : "Asistencia confirmada con éxito.",
          });

          onCheckInSuccess?.(response.data);

          // Close modal after brief celebratory display
          setTimeout(() => {
            onOpenChange(false);
          }, 2400);
        } else {
          setErrorMessage(response.error || "Código QR no válido o fuera de horario.");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "No fue posible registrar la asistencia.";
        setErrorMessage(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onCheckInSuccess, onOpenChange, stopCamera]
  );

  // Process uploaded or captured image through jsQR
  const handleImageFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data && code.data.trim()) {
            handleQrDetected(code.data.trim());
          } else {
            toast.error("No se detectó un código QR legible", {
              description: "Asegúrate de que la foto tenga buena iluminación y el código esté enfocado.",
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [handleQrDetected]
  );

  // Reset and restart for 2nd/3rd attempts
  const resetAndRestartScan = useCallback(() => {
    hasProcessedRef.current = false;
    isScanningRef.current = false;
    setIsSubmitting(false);
    setErrorMessage(null);
    setSuccessData(null);
    setCameraError(null);
    startCamera();
  }, [startCamera]);

  // Clean setup when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      resetAndRestartScan();
    } else {
      stopCamera();
      setIsSubmitting(false);
      setSuccessData(null);
      setErrorMessage(null);
      hasProcessedRef.current = false;
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, resetAndRestartScan, stopCamera]);

  // Toggle camera direction (environment / user)
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Simulation fallback for testing/demo environments
  const handleSimulateScan = () => {
    const mockToken = "V9999-SUCURSAL-CENTRAL";
    handleQrDetected(`/checkin?b=Oficina+Central&t=${mockToken}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-4xl p-6 bg-card border border-border shadow-2xl text-card-foreground">
        {/* Hidden inputs for native mobile camera photo capture and file selection */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = "";
          }}
        />

        {/* Modal Header */}
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Camera className="size-5.5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                  Escanear Asistencia de Hoy
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Alinea el código QR de tu sucursal o captura una foto para marcar tu turno
                </DialogDescription>
              </div>
            </div>

            {activeTab === "camera" && isCameraActive && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleToggleFacingMode}
                title="Cambiar cámara"
                className="size-9 rounded-full border-border bg-card hover:bg-muted text-foreground cursor-pointer"
              >
                <SwitchCamera className="size-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Segmented Mode Selector */}
        <div className="flex items-center justify-center bg-muted/60 p-1 rounded-3xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              startCamera();
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-3xl transition-all cursor-pointer",
              activeTab === "camera"
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Video className="size-4 text-primary" />
            <span>Cámara en Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("photo");
              stopCamera();
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-3xl transition-all cursor-pointer",
              activeTab === "photo"
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Camera className="size-4 text-primary" />
            <span>Tomar Foto / Móvil</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
              stopCamera();
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-3xl transition-all cursor-pointer",
              activeTab === "manual"
                ? "bg-card text-foreground shadow-2xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Keyboard className="size-4 text-primary" />
            <span>Código Manual</span>
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden bg-muted/40 border border-border flex items-center justify-center shadow-inner">
          {/* TAB 1: Live Video Feed */}
          {activeTab === "camera" && (
            <>
              <video
                ref={(node) => {
                  videoElementRef.current = node;
                  if (node && streamRef.current && node.srcObject !== streamRef.current) {
                    bindStreamToVideo(streamRef.current);
                  }
                }}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Overlay with Animated Corner Guides */}
              {isCameraActive && !successData && !errorMessage && !isSubmitting && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  <div className="relative size-60 sm:size-72 border-2 border-primary/50 rounded-3xl flex items-center justify-center shadow-2xl">
                    {/* 4 Corner Markers */}
                    <div className="absolute top-0 left-0 size-7 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 size-7 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 size-7 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 size-7 border-b-4 border-r-4 border-primary rounded-br-2xl" />

                    {/* Laser scanning line */}
                    <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_var(--primary)] animate-pulse" />

                    <span className="text-[11px] font-semibold text-foreground bg-card/90 px-3.5 py-1 rounded-full backdrop-blur-md tracking-wider uppercase border border-border/80 shadow-md">
                      Alinea el código QR
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: Native Mobile Camera Photo Capture */}
          {activeTab === "photo" && !successData && !isSubmitting && (
            <div className="absolute inset-0 bg-card p-6 flex flex-col items-center justify-center text-center gap-4">
              <div className="size-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                <Camera className="size-8" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-base font-bold text-foreground">
                  Captura con la Cámara de tu Celular
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Abre la cámara nativa de tu teléfono para enfocar el código QR o selecciona una foto guardada de tu galería.
                </p>
              </div>

              <div className="flex flex-col w-full max-w-xs gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-9 rounded-4xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <Camera className="size-4" />
                  <span>Abrir Cámara del Teléfono</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full h-9 rounded-4xl border-border bg-card hover:bg-muted text-foreground font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Upload className="size-4 text-muted-foreground" />
                  <span>Cargar Imagen de Galería</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: Manual Code Entry */}
          {activeTab === "manual" && !successData && !isSubmitting && (
            <div className="absolute inset-0 bg-card p-6 flex flex-col items-center justify-center text-center gap-4">
              <div className="size-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                <Keyboard className="size-8" />
              </div>

              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-foreground">
                  Ingreso Manual de Token o URL
                </h4>
                <p className="text-xs text-muted-foreground">
                  Escribe o pega el token de sucursal (ej. V100) o la URL de asistencia.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-2.5 pt-1">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="ej. V100 o /checkin?t=..."
                  className="bg-input/50 border-input text-foreground placeholder:text-muted-foreground text-center font-mono text-xs sm:text-sm h-9 rounded-3xl"
                />

                <Button
                  type="button"
                  disabled={!manualCode.trim()}
                  onClick={() => handleQrDetected(manualCode.trim())}
                  className="w-full h-9 rounded-4xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
                >
                  Confirmar Asistencia
                </Button>
              </div>
            </div>
          )}

          {/* Submitting Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 z-20">
              <div className="size-14 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center animate-pulse shadow-xs">
                <Loader2 className="size-7 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Registrando asistencia...
                </h4>
                <p className="text-xs text-muted-foreground">
                  Validando coordenadas GPS y token de sucursal
                </p>
              </div>
            </div>
          )}

          {/* Success Overlay */}
          {successData && (
            <div className="absolute inset-0 bg-card/95 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-3 text-center z-20 animate-in fade-in duration-200">
              <div className="size-16 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="size-9" />
              </div>

              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-0.5 rounded-full font-bold uppercase tracking-wide"
                >
                  {successData.actionType === "check_out"
                    ? "Salida Registrada"
                    : "Entrada Registrada"}
                </Badge>
                <div className="text-3xl sm:text-4xl font-black font-mono text-foreground tracking-tight pt-1">
                  {successData.timeStr}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {successData.employeeName}
                </p>
              </div>

              {successData.branchName && (
                <div className="flex items-center gap-1.5 text-xs text-foreground bg-muted/60 border border-border/70 rounded-full px-3.5 py-1">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[220px]">
                    {successData.branchName}
                  </span>
                </div>
              )}

              {successData.isLate && (
                <p className="text-xs font-semibold text-destructive">
                  ⚠️ Retardo registrado (+{successData.delayMinutes} min)
                </p>
              )}
            </div>
          )}

          {/* Error Overlay with Clean Retry Button */}
          {errorMessage && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 text-center z-20">
              <div className="size-12 rounded-3xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-foreground">
                  No se pudo registrar
                </h4>
                <p className="text-xs text-destructive leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={resetAndRestartScan}
                  className="rounded-4xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-4 gap-1.5 shadow-xs"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Intentar de Nuevo</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setErrorMessage(null);
                    setActiveTab("photo");
                  }}
                  className="rounded-4xl border-border bg-card hover:bg-muted text-foreground text-xs font-semibold h-9 px-4"
                >
                  Tomar Foto
                </Button>
              </div>
            </div>
          )}

          {/* Camera Permission / Access Guidance on Live Tab */}
          {activeTab === "camera" && cameraError && !errorMessage && !successData && (
            <div className="absolute inset-0 bg-card p-6 flex flex-col items-center justify-center text-center gap-3.5 z-10">
              <div className="size-14 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <Camera className="size-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-base font-bold text-foreground">
                  Permiso de Cámara Requerido
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cameraError}
                </p>
              </div>

              <div className="flex flex-col w-full max-w-xs gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-9 rounded-4xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <Camera className="size-4" />
                  <span>Abrir Cámara Nativa del Móvil</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetAndRestartScan}
                  className="h-9 rounded-4xl border-border bg-card hover:bg-muted text-foreground text-xs font-semibold gap-1.5"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Reintentar Acceso en Vivo</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span className="font-semibold text-foreground">K&apos;anPro Checador</span>
          </div>

          <div className="flex items-center gap-2">
            {process.env.NODE_ENV === "development" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSimulateScan}
                className="text-xs h-9 px-3.5 rounded-4xl border-border bg-card hover:bg-muted text-foreground font-semibold"
              >
                Simular QR
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground h-9 px-3.5 rounded-4xl"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
