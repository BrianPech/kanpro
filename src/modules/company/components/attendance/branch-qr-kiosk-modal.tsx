"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  Printer,
  Building2,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Tv,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GeofenceConfig } from "../../types/attendance";
import { generateQrSvg } from "../../utils/qrcode";

interface BranchQrKioskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  branchConfig: GeofenceConfig;
  companyName: string;
  companyId?: string;
}

export function BranchQrKioskModal({
  isOpen,
  onOpenChange,
  branchConfig,
  companyName,
  companyId,
}: BranchQrKioskModalProps) {
  const [tokenVersion, setTokenVersion] = useState(
    Date.now().toString().slice(-4)
  );
  const [isCopied, setIsCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Live real-time clock for projection mode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for ESC or fullscreen state change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const effectiveOrigin =
    origin || (typeof window !== "undefined" ? window.location.origin : "");

  const qrCodeData = `${effectiveOrigin}/checkin?c=${encodeURIComponent(
    companyId || ""
  )}&b=${encodeURIComponent(branchConfig.branchName)}&t=V${tokenVersion}&lat=${
    branchConfig.latitude
  }&lng=${branchConfig.longitude}&r=${branchConfig.radiusMeters}`;

  useEffect(() => {
    generateQrSvg(qrCodeData, { width: 220, margin: 1 })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("Error generating QR SVG:", err));
  }, [qrCodeData]);

  const handlePrint = () => {
    toast.success("Enviando a impresión...", {
      description: "Se ha preparado el Cartel Oficial de Checador QR.",
    });
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrCodeData);
    setIsCopied(true);
    toast.success("Enlace web de Kiosco copiado");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerateToken = () => {
    setTokenVersion(Date.now().toString().slice(-4));
    toast.success(
      "Código QR de sucursal renovado con nuevo token dinámico de seguridad."
    );
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (
        typeof document !== "undefined" &&
        document.documentElement.requestFullscreen
      ) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (
        typeof document !== "undefined" &&
        document.fullscreenElement &&
        document.exitFullscreen
      ) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Fullscreen Tablet/Monitor Projection View
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col justify-between items-center p-6 sm:p-10 select-none animate-in fade-in duration-300">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                {companyName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <MapPin className="size-3 text-indigo-400" />
                <span>{branchConfig.branchName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Kiosco Activo • En Línea</span>
            </Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerateToken}
              className="h-8 px-2.5 rounded-xl border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white"
              title="Renovar token QR"
            >
              <RefreshCw className="size-3 mr-1" />
              <span>Token V{tokenVersion}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              className="h-8 px-3 rounded-xl border-slate-700 bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-1.5"
            >
              <Minimize2 className="size-3.5" />
              <span>Salir (ESC)</span>
            </Button>
          </div>
        </div>

        {/* Central QR and Clock Display */}
        <div className="flex flex-col items-center justify-center text-center space-y-5 my-auto max-w-lg">
          {/* Live Clock Display */}
          <div className="space-y-0.5">
            <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-indigo-400 drop-shadow-sm flex items-center justify-center gap-2">
              <Clock className="size-6 text-indigo-400/80" />
              <span>{currentTime}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Hora Oficial del Establecimiento
            </p>
          </div>

          {/* High-Contrast QR Card */}
          <div className="p-6 rounded-3xl bg-white text-slate-900 shadow-2xl border-4 border-indigo-500/40 relative">
            <div className="size-64 sm:size-72 p-2 bg-white rounded-2xl flex items-center justify-center relative overflow-hidden">
              {qrSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  className="size-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-2">
                  <QrCode className="size-10 animate-pulse text-indigo-500" />
                  <span>Cargando Checador...</span>
                </div>
              )}
              <div className="absolute size-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <ShieldCheck className="size-5" />
              </div>
            </div>

            <div className="mt-3 text-center space-y-0.5">
              <span className="text-xs font-black text-slate-800 block">
                Checador Oficial de Asistencia
              </span>
              <span className="text-[11px] font-bold text-indigo-600 block">
                Token Dinámico: V{tokenVersion} • Radio: {branchConfig.radiusMeters}m
              </span>
            </div>
          </div>

          {/* Projection Guidance */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Apunta con la cámara de tu celular para registrar Entrada o Salida
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-md">
              Abre tu cámara o ingresa a tu portal K&apos;anPro para checar automáticamente tu turno laboral con geolocalización.
            </p>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="w-full flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          <span>{branchConfig.address || "Punto de checador oficial"}</span>
          <span>Presiona [ESC] o el botón superior para salir de proyección</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Stylesheet */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #branch-qr-printable-poster,
              #branch-qr-printable-poster * {
                visibility: visible !important;
              }
              #branch-qr-printable-poster {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                min-height: 100vh !important;
                margin: 0 !important;
                padding: 2.5rem 2rem !important;
                background: #ffffff !important;
                color: #0f172a !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                align-items: center !important;
                box-sizing: border-box !important;
                border: none !important;
                box-shadow: none !important;
                z-index: 9999999 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `,
        }}
      />

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 bg-card border-border/80 text-center max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 text-center">
            <div className="mx-auto size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
              <QrCode className="size-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              Cartel QR de Sucursal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Imprime en hoja Carta/A4 o proyecta en pantalla completa para que los empleados registren su asistencia.
            </DialogDescription>
          </DialogHeader>

          {/* Printable Poster Card (Also used by window.print()) */}
          <div
            id="branch-qr-printable-poster"
            className="p-5 sm:p-6 rounded-2xl bg-white text-slate-900 border-2 border-indigo-500/30 space-y-4 shadow-md max-w-sm mx-auto text-center"
          >
            {/* Header: Logo / Company / Branch */}
            <div className="space-y-1 border-b border-slate-200 pb-2.5 w-full">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-700 uppercase tracking-widest">
                <Building2 className="size-4 shrink-0" />
                <span className="truncate">{companyName}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 truncate">
                {branchConfig.branchName}
              </p>
              {branchConfig.address && (
                <p className="text-[9px] text-slate-400 truncate">
                  {branchConfig.address}
                </p>
              )}
            </div>

            {/* Poster Title */}
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Checador Oficial de Asistencia - Escanea tu Entrada o Salida
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Registro digital oficial de jornada laboral en tiempo real
              </p>
            </div>

            {/* Centered Large QR Graphic Container */}
            <div className="relative mx-auto size-48 sm:size-52 p-2 bg-white rounded-2xl border-2 border-slate-900 flex items-center justify-center shadow-inner overflow-hidden">
              {qrSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  className="size-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground text-xs font-semibold gap-2">
                  <QrCode className="size-8 animate-pulse text-indigo-500" />
                  <span>Generando código QR...</span>
                </div>
              )}
              <div className="absolute size-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-xs border border-white">
                <ShieldCheck className="size-3.5" />
              </div>
            </div>

            {/* Token Badge */}
            <div className="text-[10px] font-mono font-bold text-indigo-600">
              Token de Seguridad: V{tokenVersion} • Cobertura: {branchConfig.radiusMeters}m
            </div>

            {/* 2 Step Instructions */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-left">
              <div className="text-[10px] font-black text-slate-800 uppercase tracking-wider text-center border-b border-slate-200 pb-1">
                Instrucciones de Registro
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-700 leading-tight">
                <span className="size-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Abre tu cámara o entra a tu portal K&apos;anPro</strong> en tu celular.
                </span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-700 leading-tight">
                <span className="size-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Escanea este código</strong> al iniciar o finalizar tu turno laboral.
                </span>
              </div>
            </div>

            {/* LFT Legal Notice */}
            <div className="pt-2 border-t border-slate-200 text-center space-y-0.5">
              <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                <strong>Nota legal:</strong> Registro oficial de jornada de trabajo conforme al Artículo 132 Fracción I y concordantes de la Ley Federal del Trabajo (LFT). La constancia electrónica acredita el cumplimiento del horario laboral pactado.
              </p>
              <p className="text-[8px] text-slate-400 font-bold tracking-tight">
                K&apos;anPro HRMS • Validez Patronal Oficial
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              className="text-xs font-bold h-8 px-2.5 rounded-xl border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
            >
              <Tv className="size-3.5 mr-1.5" />
              <span>Proyectar en Pantalla</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleRegenerateToken}
              className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 px-2.5"
            >
              <RefreshCw className="size-3 mr-1" />
              Renovar Token
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 px-2.5"
            >
              {isCopied ? (
                <Check className="size-3 mr-1 text-emerald-600" />
              ) : (
                <Copy className="size-3 mr-1" />
              )}
              {isCopied ? "Copiado" : "Copiar Enlace"}
            </Button>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="size-4" />
              <span>Imprimir Cartel (A4 / Carta)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
