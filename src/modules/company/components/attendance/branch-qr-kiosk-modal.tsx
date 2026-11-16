"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Copy01Icon,
  Maximize01Icon,
  Minimize01Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons";
import { QrCode } from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GeofenceConfig } from "../../types/attendance";
import { generateQrSvg } from "../../utils/qrcode";

type PaperFormat = "carta" | "a4";

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
  const [tokenVersion, setTokenVersion] = useState(() =>
    Date.now().toString().slice(-4)
  );
  const [paperFormat, setPaperFormat] = useState<PaperFormat>("carta");
  const [isCopied, setIsCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Live real-time clock for projection mode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
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
    typeof window !== "undefined" ? window.location.origin : "";

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsCopied(false);
    }
    onOpenChange(open);
  };

  const handlePrint = () => {
    if (typeof document === "undefined" || !qrSvg) {
      toast.error("Espera un momento a que se genere el código QR.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const pageSize = paperFormat === "carta" ? "letter portrait" : "A4 portrait";
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      window.print();
      return;
    }

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>QR de sucursal - ${escapeHtml(branchConfig.branchName)}</title>
    <style>
      @page {
        size: ${pageSize};
        margin: 16mm;
      }
      * {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        color: #0a0a0a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .poster {
        width: 100%;
        max-width: 520px;
        border: 1px solid #d9d9d9;
        border-radius: 16px;
        padding: 48px 36px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        text-align: center;
        background: #ffffff;
      }
      .company {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
        color: #3d3d3d;
      }
      .title {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        line-height: 40px;
        color: #0a0a0a;
      }
      .qr {
        width: 280px;
        height: 280px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr svg {
        width: 100%;
        height: 100%;
      }
      .hint {
        margin: 0;
        font-size: 16px;
        line-height: 24px;
        color: #3d3d3d;
      }
      .token {
        margin: 0;
        font-size: 13px;
        line-height: 18px;
        color: #5e6561;
      }
    </style>
  </head>
  <body>
    <main class="poster">
      <p class="company">${escapeHtml(companyName)} · ${escapeHtml(branchConfig.branchName)}</p>
      <h1 class="title">Registra tu asistencia</h1>
      <div class="qr">${qrSvg}</div>
      <p class="hint">Escanea el código al iniciar o terminar tu turno.</p>
      <p class="token">Token V${escapeHtml(tokenVersion)}</p>
    </main>
  </body>
</html>`);
    doc.close();

    const cleanup = () => {
      setTimeout(() => {
        iframe.remove();
      }, 500);
    };

    const win = iframe.contentWindow;
    if (win) {
      win.onafterprint = cleanup;
      setTimeout(() => {
        win.focus();
        win.print();
      }, 100);
    } else {
      cleanup();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrCodeData);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
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

  const posterPaperClass =
    paperFormat === "carta"
      ? "w-[260px] h-[336px]"
      : "w-[248px] h-[350px]";

  const posterContent = (
    <div
      id="branch-qr-printable-poster"
      className={cn(
        "bg-white border border-[#d9d9d9] flex flex-col gap-[10px] items-center justify-center overflow-hidden p-[18px] shrink-0",
        posterPaperClass
      )}
    >
      <p className="font-semibold leading-[18px] text-[#3d3d3d] text-[12px] text-center w-full truncate">
        {companyName} · {branchConfig.branchName}
      </p>
      <p className="font-semibold leading-[27px] text-[#0a0a0a] text-[21px] text-center w-full">
        Registra tu asistencia
      </p>
      <div className="size-[146px] shrink-0 flex items-center justify-center">
        {qrSvg ? (
          <div
            dangerouslySetInnerHTML={{ __html: qrSvg }}
            className="size-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          />
        ) : (
          <div className="size-full rounded-[8px] border border-dashed border-[#d9d9d9] flex flex-col items-center justify-center text-[#737373] text-[11px] gap-1.5">
            <QrCode className="size-8 animate-pulse text-[#00786f]" />
            <span>Generando QR...</span>
          </div>
        )}
      </div>
      <p className="font-normal leading-[18px] text-[#3d3d3d] text-[12px] text-center w-full">
        Escanea el código al iniciar o terminar tu turno.
      </p>
      <p className="font-normal leading-[17px] text-[#3d3d3d] text-[11px] text-center w-full">
        Token V{tokenVersion}
      </p>
    </div>
  );

  const companyInitials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("") || "KP";

  // Fullscreen Tablet/Monitor Projection View
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background text-foreground flex flex-col px-6 sm:px-12 lg:px-16 py-8 select-none overflow-y-auto animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="w-full max-w-[1312px] mx-auto flex items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-[14px] min-w-0">
            <div className="size-[52px] rounded-[12px] bg-sidebar-accent text-link flex items-center justify-center text-[19px] font-semibold leading-[23px] shrink-0">
              {companyInitials}
            </div>
            <div className="flex flex-col gap-[3px] min-w-0">
              <h2 className="text-[22px] font-semibold leading-[27px] text-foreground truncate">
                {companyName}
              </h2>
              <p className="text-[15px] font-medium leading-[18px] text-muted-foreground truncate">
                {branchConfig.branchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-[12px] shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={toggleFullscreen}
              className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 gap-[8px] cursor-pointer"
            >
              <HugeiconsIcon icon={Minimize01Icon} size={16} strokeWidth={1.8} />
              <span>Salir de proyección</span>
            </Button>
            <span className="hidden sm:inline text-[13px] font-medium leading-[16px] text-muted-foreground">
              Esc
            </span>
          </div>
        </div>

        {/* Central Content */}
        <div className="w-full max-w-[1312px] mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-10 lg:gap-16">
          {/* Left Instructions & Clock */}
          <div className="flex flex-col gap-[24px] items-start max-w-[652px]">
            <div className="flex items-center gap-[9px]">
              <span className="size-[9px] rounded-full bg-link shrink-0" />
              <span className="text-[17px] font-semibold leading-[21px] text-link">
                Marcaje de asistencia
              </span>
            </div>

            <h1 className="text-[44px] sm:text-[56px] lg:text-[68px] font-semibold leading-[1.15] lg:leading-[83px] tracking-[-0.02em] text-foreground">
              Registra tu asistencia
            </h1>

            <p className="text-[20px] lg:text-[26px] font-normal leading-[1.3] lg:leading-[32px] text-muted-foreground max-w-[550px]">
              Escanea el código con tu celular al iniciar o terminar tu turno.
            </p>

            <div className="flex flex-col gap-[4px] items-start">
              <span className="text-[42px] font-semibold leading-[51px] text-foreground tabular-nums">
                {currentTime || "00:00"}
              </span>
              <span className="text-[14px] font-medium leading-[17px] text-muted-foreground">
                Hora local de la sede
              </span>
            </div>
          </div>

          {/* Right QR Surface */}
          <div className="flex flex-col gap-[16px] items-center justify-self-center lg:justify-self-end">
            <div className="bg-white rounded-[16px] p-[12px] size-[300px] sm:size-[380px] lg:size-[440px] flex items-center justify-center shadow-xs">
              {qrSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  className="size-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#737373] text-[14px] font-medium gap-2">
                  <QrCode className="size-10 animate-pulse text-[#00786f]" />
                  <span>Generando QR...</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleRegenerateToken}
              title="Clic para renovar el token del QR"
              className="text-[15px] font-medium leading-[18px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Token V{tokenVersion}
            </button>
          </div>
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
              @page {
                size: ${paperFormat === "carta" ? "letter portrait" : "A4 portrait"};
                margin: 12mm;
              }
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
                padding: 3rem 2rem !important;
                background: #ffffff !important;
                color: #0a0a0a !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                gap: 1.5rem !important;
                box-sizing: border-box !important;
                border: none !important;
                box-shadow: none !important;
                z-index: 9999999 !important;
              }
              #branch-qr-printable-poster svg {
                width: 320px !important;
                height: 320px !important;
              }
            }
          `,
        }}
      />

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[784px] p-[24px] rounded-[16px] bg-card border border-border shadow-[0px_12px_40px_0px_rgba(0,0,0,0.28)] gap-[18px] max-h-[92vh] overflow-y-auto"
        >
          <DialogHeader className="gap-[4px] text-left">
            <DialogTitle className="text-[26px] font-semibold leading-[32px] tracking-[-0.015em] text-foreground">
              QR de sucursal
            </DialogTitle>
            <DialogDescription className="text-[14px] font-normal leading-[20px] text-muted-foreground">
              Prepara el cartel que tu equipo usa para registrar entradas y
              salidas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_262px] gap-[20px] items-start">
            {/* Preview Area */}
            <div className="bg-muted rounded-[12px] p-[16px] flex flex-col gap-[12px] items-center">
              <span className="text-[13px] font-medium leading-[19px] text-muted-foreground">
                Vista previa · {paperFormat === "carta" ? "Carta" : "A4"}
              </span>
              {posterContent}
            </div>

            {/* Settings & Options Column */}
            <div className="flex flex-col gap-[16px] items-start w-full">
              <div className="flex flex-col gap-[4px] w-full">
                <span className="text-[12px] font-medium leading-[18px] text-muted-foreground">
                  Sucursal
                </span>
                <span className="text-[17px] font-semibold leading-[23px] text-foreground">
                  {branchConfig.branchName}
                </span>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="flex flex-col gap-[8px] w-full">
                <span className="text-[14px] font-semibold leading-[20px] text-foreground">
                  Formato de papel
                </span>
                <div className="flex items-center gap-[8px]">
                  <button
                    type="button"
                    onClick={() => setPaperFormat("carta")}
                    className={cn(
                      "h-[40px] w-[102px] rounded-[8px] text-[14px] font-semibold leading-[20px] flex items-center justify-center transition-colors cursor-pointer",
                      paperFormat === "carta"
                        ? "bg-sidebar-accent border border-link text-link"
                        : "bg-muted border border-transparent text-foreground hover:bg-muted/80"
                    )}
                  >
                    Carta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperFormat("a4")}
                    className={cn(
                      "h-[40px] w-[102px] rounded-[8px] text-[14px] font-semibold leading-[20px] flex items-center justify-center transition-colors cursor-pointer",
                      paperFormat === "a4"
                        ? "bg-sidebar-accent border border-link text-link"
                        : "bg-muted border border-transparent text-foreground hover:bg-muted/80"
                    )}
                  >
                    A4
                  </button>
                </div>
                <span className="text-[12px] font-normal leading-[18px] text-muted-foreground">
                  {paperFormat === "carta"
                    ? "216 × 279 mm · Vertical"
                    : "210 × 297 mm · Vertical"}
                </span>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="flex flex-col gap-[8px] w-full">
                <span className="text-[14px] font-semibold leading-[20px] text-foreground">
                  Otras opciones
                </span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="h-[40px] w-full px-[10px] rounded-[8px] border border-control-border bg-transparent text-[13px] font-medium leading-[19px] text-foreground flex items-center gap-[8px] hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={Maximize01Icon}
                    size={16}
                    strokeWidth={1.8}
                  />
                  <span>Proyectar en pantalla</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-[40px] w-full px-[10px] rounded-[8px] border border-control-border bg-transparent text-[13px] font-medium leading-[19px] text-foreground flex items-center gap-[8px] hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={Copy01Icon}
                    size={16}
                    strokeWidth={1.8}
                  />
                  <span>Copiar enlace</span>
                </button>
                {isCopied && (
                  <span className="text-[12px] font-medium leading-[16px] text-link">
                    Enlace copiado
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-[8px] pt-[12px] border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-[44px] min-w-[104px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 gap-[8px] cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
              <span>Cerrar</span>
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="h-[44px] min-w-[154px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 gap-[8px] cursor-pointer"
            >
              <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={1.8} />
              <span>Imprimir cartel</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
