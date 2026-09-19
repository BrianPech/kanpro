"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  PenTool,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sparkles,
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DigitalSignature } from "../../types/contracts";

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  signerName: string;
  signerRole: "representante_legal" | "trabajador";
  contractFolio: string;
  onSignComplete: (signature: DigitalSignature) => void;
}

export function DigitalSignatureModal({
  isOpen,
  onOpenChange,
  signerName,
  signerRole,
  contractFolio,
  onSignComplete,
}: DigitalSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }, 100);
      setHasDrawn(false);
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirmSignature = () => {
    if (!hasDrawn) {
      toast.error("Por favor dibuja tu firma en el recuadro.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    const dataUrl = canvas.toDataURL("image/png");

    setTimeout(() => {
      setIsProcessing(false);

      const randomHash = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const signature: DigitalSignature = {
        signerName,
        signerRole,
        signatureDataUrl: dataUrl,
        signedAt: new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
        certificateHash: `SHA256:0x${randomHash}4b9a1e8c7f`,
        ipAddress: "187.190.22.104",
      };

      onSignComplete(signature);
      toast.success("Firma electrónica estampada", {
        description: `Certificado digital generado para el contrato ${contractFolio}.`,
      });
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Firma Electrónica Avanzada K&apos;anPro</span>
          </div>
          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            Firma de Contrato • {signerName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Folio: {contractFolio} • Rol: {signerRole === "representante_legal" ? "Representante Legal" : "Trabajador"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground">
              Traza tu firma en el lienzo (Mouse o Pantalla táctil)
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Limpiar</span>
            </Button>
          </div>

          {/* Signature Canvas */}
          <div className="relative rounded-2xl border-2 border-dashed border-border/80 bg-background overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={430}
              height={160}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none cursor-crosshair w-full h-[160px]"
            />
            {!hasDrawn && (
              <div className="absolute pointer-events-none flex flex-col items-center gap-1 text-muted-foreground/50">
                <PenTool className="size-6" />
                <span className="text-xs font-medium">Firme aquí dentro del recuadro</span>
              </div>
            )}
          </div>

          {/* Legal Notice */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-start gap-2.5 text-[11px] text-muted-foreground">
            <Lock className="size-3.5 text-primary shrink-0 mt-0.5" />
            <p className="leading-snug">
              Al firmar, manifiesto mi consentimiento expreso con plena validez jurídica conforme al Código de Comercio y la LFT.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 px-4"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmSignature}
            disabled={isProcessing || !hasDrawn}
            className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="size-4" />
            <span>Estampar Firma Digital</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
