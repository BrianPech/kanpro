"use client";

import * as React from "react";
import {
  Phone,
  MessageSquare,
  Sparkles,
  MapPin,
  Briefcase,
  Eye,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  Calendar,
  Gift,
  Building,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type VacancyWizardValues } from "../../schemas/vacancy-wizard.schema";
import { cn } from "@/lib/utils";

interface Step4PublicationProps {
  form: any;
  companyName?: string;
  isVerified?: boolean;
}

export function Step4Publication({
  form,
  companyName = "K'anPro Empresa",
  isVerified = true,
}: Step4PublicationProps) {
  const values: VacancyWizardValues = form.state.values;

  const formatMXN = (val: number | null | undefined) => {
    if (val == null || isNaN(val)) return "$0 MXN";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cleanPhone = (values.contact_phone || "").replace(/\D/g, "");
  const whatsappTestUrl = cleanPhone
    ? `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(
        `¡Hola! Vi la vacante de ${values.title || "este puesto"} en K'anPro y me interesa postularme.`
      )}`
    : "";

  return (
    <div className="space-y-6">
      {/* 1. Recruiter Contact Details */}
      <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="size-4 text-emerald-600 dark:text-emerald-400" />
          <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
            Canal de Postulación & Contacto WhatsApp <span className="text-rose-500">*</span>
          </Label>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Los candidatos podrán contactar al reclutador directamente por WhatsApp o postularse a través de la plataforma:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Phone Input */}
          <form.Field
            name="contact_phone"
            children={(field: any) => (
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone" className="text-xs font-semibold text-muted-foreground">
                  WhatsApp del Reclutador (10 dígitos)
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    +52
                  </span>
                  <Input
                    id="contact_phone"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="999 123 4567"
                    className="h-11 pl-12 rounded-xl bg-card border-border/60 text-sm font-semibold font-mono"
                    maxLength={15}
                  />
                </div>
                {field.state.meta.errors?.[0] && (
                  <p className="text-xs font-semibold text-rose-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          />

          {/* Preferred Contact Method */}
          <form.Field
            name="preferred_contact_method"
            children={(field: any) => (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Canal Preferente
                </Label>
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {[
                    { value: "whatsapp", label: "WhatsApp" },
                    { value: "platform", label: "Plataforma" },
                    { value: "both", label: "Ambos" },
                  ].map((method) => {
                    const isSelected = field.state.value === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => field.handleChange(method.value)}
                        className={cn(
                          "h-10 rounded-xl font-bold text-xs transition-all border cursor-pointer select-none",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-card hover:bg-muted text-muted-foreground border-border/60"
                        )}
                      >
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          />
        </div>

        {whatsappTestUrl && (
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-4" />
              <span>Número listo para recibir mensajes directos</span>
            </span>
            <a
              href={whatsappTestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Probar enlace</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>

      {/* 2. Informational Banner about publishing / draft */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 flex items-center justify-between gap-4 shadow-xs">
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-foreground">
            Opciones de Publicación
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Al finalizar, puedes elegir entre <strong>Publicar Vacante Ahora</strong> (visible inmediatamente en el feed de empleo) o <strong>Guardar como Borrador</strong> (pausada para revisarla más tarde).
          </p>
        </div>
      </div>

      {/* 3. Real-time Live Preview Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vista Previa en Vivo (Feed del Candidato)
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Así se verá tu vacante publicada
          </span>
        </div>

        {/* Realistic Candidate Card Simulation */}
        <Card className="bg-card border-2 border-primary/30 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-base shrink-0">
                <Building className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-foreground">
                    {companyName}
                  </span>
                  {isVerified && (
                    <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0 font-bold rounded-full">
                      Verificada
                    </Badge>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
                  {values.title || "Título del Puesto"}
                </h3>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shrink-0">
              {values.employment_type || "Tiempo Completo"}
            </Badge>
          </div>

          {/* Meta specs row */}
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground bg-muted/60 px-3 py-1 rounded-xl border border-border/50">
              <DollarSign className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono">
                {formatMXN(values.salary_min)} - {formatMXN(values.salary_max)} MXN ({values.payment_frequency})
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground bg-muted/40 px-3 py-1 rounded-xl border border-border/40">
              <MapPin className="size-3.5 text-primary" />
              <span>{values.zone || "Centro Mérida"}, {values.location || "Mérida"}</span>
            </div>
          </div>

          {/* Benefits pills */}
          {values.benefits && values.benefits.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Prestaciones Destacadas:</span>
              <div className="flex flex-wrap gap-1.5">
                {values.benefits.slice(0, 4).map((b, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[11px] font-semibold bg-muted/30 border-border/60 text-muted-foreground px-2.5 py-0.5 rounded-lg"
                  >
                    {b}
                  </Badge>
                ))}
                {values.benefits.length > 4 && (
                  <Badge variant="outline" className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-lg">
                    +{values.benefits.length - 4} más
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Mock Action Button in Preview */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">
              Turno: <strong className="text-foreground">{values.shift_schedule || "Matutino"}</strong>
            </span>
            <Button
              size="sm"
              disabled
              className="bg-[#25D366] text-[#062c1e] font-extrabold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs opacity-90"
            >
              <MessageSquare className="size-3.5 stroke-[2.5]" />
              <span>Postularme por WhatsApp</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
