"use client";

import * as React from "react";
import {
  Phone,
  MessageSquare,
  Eye,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { type VacancyWizardValues } from "../../schemas/vacancy-wizard.schema";
import { cn } from "@/lib/utils";

interface Step4PublicationProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onOpenPreviewDrawer?: () => void;
}

export function Step4Publication({
  form,
  onOpenPreviewDrawer,
}: Step4PublicationProps) {
  const values: VacancyWizardValues = form.state.values;

  const cleanPhone = (values.contact_phone || "").replace(/\D/g, "");
  const whatsappTestUrl = cleanPhone
    ? `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(
        `¡Hola! Vi la vacante de ${values.title || "este puesto"} en K'anPro y me interesa postularme.`
      )}`
    : "";

  return (
    <div className="space-y-8">
      {/* 1. Canal de Postulación & Contacto WhatsApp */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Phone className="size-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Canal de Postulación & Contacto Directo <span className="text-rose-500">*</span>
          </span>
        </div>

        {/* Selector de Canal Preferente con 3 Cards */}
        <form.Field name="preferred_contact_method">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const activeMethod = field.state.value || "whatsapp";

            return (
              <Field className="space-y-3">
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ¿Cómo prefieres recibir a los candidatos?
                </FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      value: "whatsapp",
                      title: "WhatsApp Directo",
                      desc: "Los candidatos te escriben al instante por WhatsApp",
                      icon: MessageSquare,
                    },
                    {
                      value: "platform",
                      title: "Bandeja K'anPro",
                      desc: "Gestión y revisión de CVs dentro de tu panel",
                      icon: Layers,
                    },
                    {
                      value: "both",
                      title: "Ambos Canales",
                      desc: "Máxima captación: WhatsApp y plataforma",
                      icon: Sparkles,
                    },
                  ].map((m) => {
                    const isSelected = activeMethod === m.value;
                    const Icon = m.icon;

                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => field.handleChange(m.value)}
                        className={cn(
                          "p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-primary/5 border-primary text-foreground shadow-xs ring-1 ring-primary/30"
                            : "bg-background hover:bg-muted/40 text-muted-foreground border-border/70"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={cn(
                              "size-9 rounded-xl flex items-center justify-center font-bold text-xs",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="size-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {m.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {m.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            );
          }}
        </form.Field>

        {/* Input de Teléfono WhatsApp */}
        <form.Field name="contact_phone">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
              <FieldLabel htmlFor="contact_phone" className="text-xs font-bold uppercase tracking-wider text-foreground">
                WhatsApp del Reclutador (10 dígitos) <span className="text-rose-500">*</span>
              </FieldLabel>
              <div className="relative max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  🇲🇽 +52
                </span>
                <Input
                  id="contact_phone"
                  value={field.state.value || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="999 123 4567"
                  className="h-12 pl-20 rounded-xl bg-background border-border/70 text-base font-semibold font-mono shadow-2xs"
                  maxLength={15}
                />
              </div>
              <FieldDescription className="text-xs text-muted-foreground">
                Número donde se recibirán las consultas de candidatos calificados.
              </FieldDescription>
              {field.state.meta.errors?.[0] && (
                <FieldError>{field.state.meta.errors[0]}</FieldError>
              )}

              {whatsappTestUrl && (
                <div className="pt-2 flex items-center justify-between max-w-md">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    <span>Número listo para recibir postulaciones</span>
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
            </Field>
          )}
        </form.Field>
      </div>

      {/* 2. Banner de Vista Previa con Drawer de shadcn */}
      <Card className="p-6 rounded-2xl bg-muted/20 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <h4 className="text-sm sm:text-base font-bold text-foreground">
              Revisar Ficha Completa de la Vacante
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            Abre la vista previa en el componente Drawer interactivo para comprobar cómo verán los candidatos la descripción, sueldo, requisitos y datos de contacto antes de publicar.
          </p>
        </div>

        <Button
          type="button"
          onClick={onOpenPreviewDrawer}
          variant="outline"
          className="h-11 px-5 rounded-xl font-bold text-xs gap-2 border-primary/50 text-primary hover:bg-primary/10 cursor-pointer shrink-0 shadow-xs"
        >
          <Eye className="size-4" />
          <span>Ver en Drawer</span>
        </Button>
      </Card>
    </div>
  );
}
