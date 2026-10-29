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
} from "@/components/ui/icons";
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
  isEditing?: boolean;
}

export function Step4Publication({
  form,
  onOpenPreviewDrawer,
  isEditing = false,
}: Step4PublicationProps) {
  const values: VacancyWizardValues = form.state.values;

  const cleanPhone = (values.contact_phone || "").replace(/\D/g, "");
  const whatsappTestUrl = cleanPhone
    ? `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(
        `¡Hola! Vi la vacante de ${values.title || "este puesto"} en K'anPro y me interesa postularme.`
      )}`
    : "";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Encabezado del Paso */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
        <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Phone className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Canal de Recepción & Revisión</h3>
          <p className="text-xs text-muted-foreground">Contacto con candidatos y comprobación final de la oferta</p>
        </div>
      </div>

      {/* 1. Canal de Postulación & Contacto WhatsApp */}
      <div className="space-y-4">
        {/* Selector de Canal Preferente */}
        <form.Field name="preferred_contact_method">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => {
            const activeMethod = field.state.value || "whatsapp";

            return (
              <Field className="space-y-2.5">
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ¿Cómo prefieres recibir las solicitudes de los candidatos?
                </FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    {
                      value: "whatsapp",
                      title: "WhatsApp Directo",
                      desc: "Contacto inmediato a tu línea por chat",
                      icon: MessageSquare,
                    },
                    {
                      value: "platform",
                      title: "Bandeja K'anPro",
                      desc: "Gestión organizada en tu panel",
                      icon: Layers,
                    },
                    {
                      value: "both",
                      title: "Ambos Canales",
                      desc: "WhatsApp directo y plataforma",
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
                          "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-primary/5 border-primary text-foreground shadow-2xs ring-1 ring-primary/30"
                            : "bg-input/30 hover:bg-input/60 text-muted-foreground border-border/80"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={cn(
                              "size-8 sm:size-9 rounded-xl flex items-center justify-center font-bold text-xs",
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
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            {m.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
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
              <FieldLabel htmlFor="contact_phone" className="text-sm font-semibold text-foreground">
                WhatsApp del Reclutador (10 dígitos) <span className="text-rose-500">*</span>
              </FieldLabel>
              <div className="relative max-w-md">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  🇲🇽 +52
                </span>
                <Input
                  id="contact_phone"
                  type="tel"
                  inputMode="tel"
                  value={field.state.value || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="999 123 4567"
                  className="w-full pl-20 pr-3.5 font-mono text-sm"
                  maxLength={15}
                />
              </div>
              <FieldDescription className="text-xs text-muted-foreground">
                Número oficial donde los candidatos enviarán sus postulaciones y dudas del puesto.
              </FieldDescription>
              {field.state.meta.errors?.[0] && (
                <FieldError>{field.state.meta.errors[0]}</FieldError>
              )}

              {whatsappTestUrl && (
                <div className="pt-1.5 flex items-center justify-between max-w-md">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>Número configurado</span>
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
      <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Revisar Ficha Completa de la Vacante
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            Abre la vista previa en el componente Drawer interactivo para comprobar cómo verán los candidatos la descripción, sueldo, requisitos y contacto antes de {isEditing ? "guardar los cambios" : "publicar"}.
          </p>
        </div>

        <Button
          type="button"
          onClick={onOpenPreviewDrawer}
          variant="outline"
          className="font-bold text-xs gap-2 cursor-pointer shrink-0"
        >
          <Eye className="size-4 text-primary" />
          <span>Ver en Drawer</span>
        </Button>
      </Card>
    </div>
  );
}
