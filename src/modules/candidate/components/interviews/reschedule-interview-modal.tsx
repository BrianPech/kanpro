"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarClock, Loader2, Send } from "lucide-react";
import { respondToInterviewAction } from "@/modules/candidate/actions/interviews";

interface RescheduleInterviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  currentDate?: string;
  currentTime?: string;
  companyName: string;
  vacancyTitle: string;
  onSuccess?: () => void;
}

const QUICK_TIMES = ["09:00", "10:00", "11:30", "13:00", "15:00", "16:30", "17:00"];

export function RescheduleInterviewModal({
  isOpen,
  onOpenChange,
  applicationId,
  currentDate,
  currentTime,
  companyName,
  vacancyTitle,
  onSuccess,
}: RescheduleInterviewModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const [proposedDate, setProposedDate] = useState(currentDate || minDate);
  const [proposedTime, setProposedTime] = useState(currentTime || "10:00");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Por favor ingresa un motivo o comentario para la empresa.");
      return;
    }

    setIsSubmitting(true);
    try {
      await respondToInterviewAction({
        applicationId,
        response: "reschedule",
        candidateNotes: reason.trim(),
        proposedDate: proposedDate || undefined,
        proposedTime: proposedTime || undefined,
      });

      toast.success("Solicitud de reagendamiento enviada", {
        description: `Se ha notificado a ${companyName} sobre tu propuesta de nuevo horario.`,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error al solicitar reagendar entrevista:", err);
      toast.error("Error al enviar solicitud", {
        description: err.message || "No se pudo registrar la solicitud. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
            <CalendarClock className="size-4" />
            <span>Coordinación de Cita</span>
          </div>
          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            Solicitar Reagendar Entrevista
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Vacante: <strong>{vacancyTitle}</strong> en <strong>{companyName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {currentDate && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Fecha actual de la cita: </span>
              {currentDate} {currentTime ? `a las ${currentTime}` : ""}
            </div>
          )}

          {/* Proposed Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proposed-date" className="text-xs font-bold text-foreground">
                Nueva fecha propuesta
              </Label>
              <Input
                id="proposed-date"
                type="date"
                min={minDate}
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="h-10 rounded-xl text-xs bg-background border-border/80"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proposed-time" className="text-xs font-bold text-foreground">
                Horario preferido
              </Label>
              <Input
                id="proposed-time"
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="h-10 rounded-xl text-xs bg-background border-border/80"
                required
              />
            </div>
          </div>

          {/* Quick Times Chips */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-muted-foreground">
              Horarios sugeridos rápidos:
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProposedTime(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    proposedTime === t
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-reason" className="text-xs font-bold text-foreground">
              Motivo o mensaje para la empresa
            </Label>
            <Textarea
              id="reschedule-reason"
              rows={3}
              placeholder="Ej: Por motivos laborales actuales me sería más viable asistir en este horario, quedo atento a su confirmación..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl text-xs resize-none bg-background border-border/80"
              required
            />
          </div>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl text-xs font-bold border-border/70 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Enviando solicitud...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Enviar Propuesta de Cita</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
