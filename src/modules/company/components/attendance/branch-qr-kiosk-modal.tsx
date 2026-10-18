"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  Printer,
  Download,
  Building2,
  MapPin,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
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
}

export function BranchQrKioskModal({
  isOpen,
  onOpenChange,
  branchConfig,
  companyName,
}: BranchQrKioskModalProps) {
  const [tokenVersion, setTokenVersion] = useState(Date.now().toString().slice(-4));
  const [isCopied, setIsCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");

  const qrCodeData = `KANPRO://CHECKIN?branch=${encodeURIComponent(
    branchConfig.branchName
  )}&company=${encodeURIComponent(companyName)}&token=V${tokenVersion}&lat=${branchConfig.latitude}&lng=${branchConfig.longitude}&radius=${branchConfig.radiusMeters}`;

  useEffect(() => {
    generateQrSvg(qrCodeData, { width: 180, margin: 1 })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("Error generating QR SVG:", err));
  }, [qrCodeData]);

  const handlePrint = () => {
    toast.success("Enviando a impresión...", {
      description: "Se ha preparado el Cartel Oficial de Checador QR.",
    });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrCodeData);
    setIsCopied(true);
    toast.success("Enlace de Kiosco copiado");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerateToken = () => {
    setTokenVersion(Date.now().toString().slice(-4));
    toast.success("Código QR de establecimiento renovado con nuevo token de seguridad.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80 text-center">
        <DialogHeader className="space-y-1.5 text-center">
          <div className="mx-auto size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1">
            <QrCode className="size-6" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
            Kiosco QR de Establecimiento
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Imprime o proyecta este código en la recepción para que los empleados registren su asistencia.
          </DialogDescription>
        </DialogHeader>

        {/* Printable Poster Card */}
        <div className="p-6 rounded-2xl bg-white text-slate-900 border-2 border-indigo-500/30 space-y-4 shadow-md max-w-xs mx-auto">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              <Building2 className="size-3.5" />
              <span>{companyName}</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Punto de Checador Oficial
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              {branchConfig.branchName}
            </p>
          </div>

          {/* QR Graphic Container */}
          <div className="relative mx-auto size-48 p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-inner overflow-hidden">
            {qrSvg ? (
              <div
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                className="size-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground text-xs font-semibold gap-2">
                <QrCode className="size-8 animate-pulse text-indigo-500" />
                <span>Generando QR...</span>
              </div>
            )}
            <div className="absolute size-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-xs border border-white">
              <ShieldCheck className="size-3.5" />
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block">
              Abre tu app K&apos;anPro y escanea para registrar tu turno
            </span>
            <span className="text-[9px] text-indigo-600 font-extrabold block">
              Token de Seguridad: V{tokenVersion}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRegenerateToken}
            className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 px-2.5"
          >
            <RefreshCw className="size-3 mr-1" />
            Renovar Token QR
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyLink}
            className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 px-2.5"
          >
            {isCopied ? <Check className="size-3 mr-1 text-emerald-600" /> : <Copy className="size-3 mr-1" />}
            {isCopied ? "Copiado" : "Copiar Token"}
          </Button>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
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
            className="rounded-xl text-xs font-bold h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
          >
            <Printer className="size-4" />
            <span>Imprimir Cartel de Checador</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
