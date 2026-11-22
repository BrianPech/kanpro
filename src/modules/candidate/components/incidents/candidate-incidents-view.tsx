"use client";

import React, { useState, useTransition } from "react";
import { ShieldAlert, CheckCircle2, Award } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CandidateIncident } from "../../services/candidate-incidents";
import { respondToIncidentAction } from "../../actions/incidents";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Por revisar",
  por_aclarar: "Por aclarar",
  en_revision: "En revisión",
  aprobado: "Aplicada",
  rechazado: "Descartada",
  resuelto: "Resuelta",
};

interface CandidateIncidentsViewProps {
  initialIncidents: CandidateIncident[];
}

function IncidentCard({
  incident,
  onUpdated,
}: {
  incident: CandidateIncident;
  onUpdated: (incident: CandidateIncident) => void;
}) {
  const [statement, setStatement] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = (acknowledge: boolean) => {
    startTransition(async () => {
      const res = await respondToIncidentAction({
        incidentId: incident.id,
        acknowledge,
        statement: statement.trim() || undefined,
      });
      if (!res.success) {
        toast.error("No se pudo registrar tu respuesta", { description: res.error });
        return;
      }
      setStatement("");
      onUpdated(res.data);
      toast.success(acknowledge ? "Quedaste enterado" : "Descargo registrado");
    });
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {incident.isRecognition ? (
            <Award className="size-4 text-amber-700" aria-hidden />
          ) : (
            <ShieldAlert className="size-4 text-destructive" aria-hidden />
          )}
          <Badge variant="secondary" className="text-xs font-bold">
            {incident.categoryLabel}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs font-bold">
          Estatus: {STATUS_LABELS[incident.status] ?? incident.status}
        </Badge>
      </div>

      <div>
        <h3 className="text-base font-extrabold text-foreground">{incident.title}</h3>
        <p className="text-xs text-muted-foreground font-medium">{incident.incidentDate}</p>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{incident.description}</p>

      {incident.resolutionNotes && (
        <p className="text-sm text-foreground">
          <strong>Resolución de RH:</strong> {incident.resolutionNotes}
        </p>
      )}

      {incident.acknowledgedAt && (
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <CheckCircle2 className="size-4" aria-hidden />
          Enterado el {incident.acknowledgedAt}
        </p>
      )}

      {incident.employeeStatement && (
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-sm">
          <strong>Tu descargo{incident.employeeStatementAt ? ` (${incident.employeeStatementAt})` : ""}:</strong>{" "}
          {incident.employeeStatement}
        </div>
      )}

      {!incident.isRecognition && incident.status !== "rechazado" && (
        <div className="space-y-2 pt-1">
          <label htmlFor={`descargo-${incident.id}`} className="text-sm font-bold text-foreground">
            Tu descargo (opcional)
          </label>
          <Textarea
            id={`descargo-${incident.id}`}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            maxLength={2000}
            placeholder="Escribe tu versión de los hechos."
            disabled={isPending}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            {!incident.acknowledgedAt && (
              <Button
                type="button"
                onClick={() => submit(true)}
                disabled={isPending}
                className="min-h-12 font-bold cursor-pointer"
              >
                Estoy enterado
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => submit(false)}
              disabled={isPending || !statement.trim()}
              className="min-h-12 font-bold cursor-pointer"
            >
              Enviar descargo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function CandidateIncidentsView({ initialIncidents }: CandidateIncidentsViewProps) {
  const [incidents, setIncidents] = useState(initialIncidents);

  const handleUpdated = (updated: CandidateIncident) =>
    setIncidents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));

  return (
    <div className="flex-grow min-h-full px-6 sm:px-10 lg:px-14 pt-6 pb-28 md:pb-8 max-w-4xl mx-auto w-full space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
        <ShieldAlert className="size-7 text-primary" aria-hidden />
        <span>Mis Incidencias</span>
      </h1>

      {incidents.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground font-medium">
          No tienes incidencias ni reconocimientos registrados.
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
