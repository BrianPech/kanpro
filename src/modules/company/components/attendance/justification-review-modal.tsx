"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Calendar,
  User,
  Paperclip,
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttendanceRecord, AttendanceJustification } from "../../types/attendance";

interface JustificationReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
  onDecision: (
    recordId: string,
    decision: "aprobada" | "rechazada",
    comments?: string
  ) => void;
}

export function JustificationReviewModal({
  isOpen,
  onOpenChange,
  record,
  onDecision,
}: JustificationReviewModalProps) {
  const [reviewComments, setReviewComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!record) return null;

  const justification: AttendanceJustification = record.justification || {
    id: `just-temp-${record.id}`,
    attendanceRecordId: record.id,
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    workDate: record.workDate,
    reasonType: "medica",
    reasonLabel: "Incapacidad / Cita Médica IMSS",
    comments: "El colaborador presentó comprobante médico por cuadro de salud.",
    evidenceUrl: "/assets/docs/comprobante_sample.pdf",
    status: "pendiente",
    submittedAt: "Hoy, 08:30 AM",
  };

  const handleApprove = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onDecision(record.id, "aprobada", reviewComments);
      toast.success("Justificación autorizada con éxito", {
        description: `La falta de ${record.employeeName} fue clasificada como Justificada. No se aplicará descuento en nómina.`,
      });
      onOpenChange(false);
    }, 600);
  };

  const handleReject = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onDecision(record.id, "rechazada", reviewComments);
      toast.error("Justificación rechazada", {
        description: `Se mantendrá el registro de falta injustificada.`,
      });
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 bg-card border-border/80">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="size-3.5 text-primary" />
            <span>Revisión de Recursos Humanos</span>
          </div>
          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            Justificación de Falta • {record.employeeName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Fecha de incidencia: {record.workDate} • Puesto: {record.jobTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Motivo Card */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                Motivo declarado:
              </span>
              <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-none text-[10px] font-bold">
                {justification.reasonLabel}
              </Badge>
            </div>
            <p className="text-xs text-foreground font-medium leading-relaxed">
              &quot;{justification.comments}&quot;
            </p>
          </div>

          {/* Evidence Attachment */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Paperclip className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-foreground block truncate">
                  Comprobante_Medico_IMSS.pdf
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Documento adjunto por el colaborador
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info("Abriendo visor de documento...")}
              className="rounded-lg text-xs font-bold h-8 px-3 border-border/70 flex items-center gap-1 shrink-0"
            >
              <ExternalLink className="size-3" />
              <span>Ver</span>
            </Button>
          </div>

          {/* Review Comments */}
          <div className="space-y-1.5">
            <Label htmlFor="review-note" className="text-xs font-bold text-foreground">
              Comentarios de RH (Opcional)
            </Label>
            <Textarea
              id="review-note"
              placeholder="Notas para el expediente o pre-nómina..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              className="min-h-[70px] rounded-xl bg-background border-border/80 text-xs resize-none font-medium"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
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
            variant="outline"
            onClick={handleReject}
            disabled={isProcessing}
            className="rounded-xl text-xs font-bold h-10 px-4 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
          >
            Rechazar
          </Button>

          <Button
            type="button"
            onClick={handleApprove}
            disabled={isProcessing}
            className="rounded-xl text-xs font-bold h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="size-4" />
            <span>Aprobar Justificación</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
