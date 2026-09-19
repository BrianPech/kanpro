"use client";

import React, { useState } from "react";
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

  const qrCodeData = `KANPRO://CHECKIN?branch=${encodeURIComponent(
    branchConfig.branchName
  )}&company=${encodeURIComponent(companyName)}&token=V${tokenVersion}`;

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
            Imprime o proyecta este código en la recepción para que los colaboradores registren su asistencia.
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
          <div className="relative mx-auto size-44 p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-inner">
            <svg
              viewBox="0 0 100 100"
              className="size-full text-slate-900"
              fill="currentColor"
            >
              {/* Decorative stylised QR paths */}
              <rect x="5" y="5" width="28" height="28" rx="4" />
              <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
              <rect x="13" y="13" width="12" height="12" rx="1" />

              <rect x="67" y="5" width="28" height="28" rx="4" />
              <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
              <rect x="75" y="13" width="12" height="12" rx="1" />

              <rect x="5" y="67" width="28" height="28" rx="4" />
              <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
              <rect x="13" y="75" width="12" height="12" rx="1" />

              {/* Data matrix dots */}
              <rect x="38" y="10" width="6" height="6" rx="1" />
              <rect x="48" y="10" width="6" height="6" rx="1" />
              <rect x="38" y="20" width="6" height="6" rx="1" />
              <rect x="48" y="20" width="6" height="6" rx="1" />

              <rect x="10" y="38" width="6" height="6" rx="1" />
              <rect x="20" y="38" width="6" height="6" rx="1" />
              <rect x="10" y="48" width="6" height="6" rx="1" />
              <rect x="20" y="48" width="6" height="6" rx="1" />

              <rect x="38" y="38" width="10" height="10" rx="2" />
              <rect x="52" y="38" width="10" height="10" rx="2" />
              <rect x="38" y="52" width="10" height="10" rx="2" />
              <rect x="52" y="52" width="10" height="10" rx="2" />

              <rect x="68" y="42" width="8" height="8" rx="1" />
              <rect x="80" y="42" width="8" height="8" rx="1" />
              <rect x="68" y="54" width="8" height="8" rx="1" />
              <rect x="80" y="54" width="8" height="8" rx="1" />

              <rect x="42" y="68" width="8" height="8" rx="1" />
              <rect x="54" y="68" width="8" height="8" rx="1" />
              <rect x="66" y="68" width="8" height="8" rx="1" />
              <rect x="78" y="68" width="8" height="8" rx="1" />

              <rect x="42" y="80" width="8" height="8" rx="1" />
              <rect x="54" y="80" width="8" height="8" rx="1" />
              <rect x="66" y="80" width="8" height="8" rx="1" />
              <rect x="78" y="80" width="8" height="8" rx="1" />
            </svg>
            <div className="absolute size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="size-4" />
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
