"use client";

import * as React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Eye } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
import { type VacancyWizardValues } from "../../schemas/vacancy-wizard.schema";
import { cn } from "@/lib/utils";

interface Step4PublicationProps {
  form: UseFormReturn<VacancyWizardValues>;
  onOpenPreviewDrawer?: () => void;
  isEditing?: boolean;
}

const CONTACT_CHANNELS: {
  value: "whatsapp" | "platform" | "both";
  label: string;
}[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "platform", label: "Bandeja Kanpro" },
  { value: "both", label: "Ambos canales" },
];

export function Step4Publication({ form }: Step4PublicationProps) {
  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.015em] text-foreground">
          Contacto y publicación
        </h2>
        <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
          Elige cómo recibir postulaciones y revisa el anuncio.
        </p>
      </div>

      {/* Canal de recepción */}
      <Controller
        control={form.control}
        name="preferred_contact_method"
        render={({ field }) => {
          const activeMethod = field.value || "both";
          return (
            <div className="flex flex-col gap-[8px]">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                ¿Por dónde recibirás postulaciones?
              </span>
              <div className="flex flex-wrap items-center gap-[18px]">
                {CONTACT_CHANNELS.map((channel) => {
                  const selected = activeMethod === channel.value;
                  return (
                    <button
                      key={channel.value}
                      type="button"
                      onClick={() => field.onChange(channel.value)}
                      className="inline-flex items-center gap-[8px] text-[14px] font-normal text-foreground cursor-pointer"
                    >
                      <span
                        className={cn(
                          "size-[16px] rounded-full border flex items-center justify-center transition-colors",
                          selected
                            ? "border-link"
                            : "border-muted-foreground/60"
                        )}
                      >
                        {selected && (
                          <span className="size-[8px] rounded-full bg-link" />
                        )}
                      </span>
                      <span>{channel.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }}
      />

      {/* WhatsApp del reclutador */}
      <Controller
        control={form.control}
        name="contact_phone"
        render={({ field, fieldState }) => (
          <Field
            data-invalid={Boolean(fieldState.error)}
            className="gap-[6px]"
          >
            <label
              htmlFor="vacancy-contact-phone"
              className="text-[14px] font-medium leading-[20px] text-foreground"
            >
              WhatsApp del reclutador
            </label>
            <Input
              id="vacancy-contact-phone"
              type="tel"
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="999 000 0123"
              className="h-[44px] rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal"
            />
            <span className="text-[12px] leading-[16px] text-muted-foreground">
              Ingresa un número de 10 dígitos.
            </span>
            {fieldState.error?.message && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        )}
      />

      {/* Correo de contacto (opcional) */}
      <Controller
        control={form.control}
        name="contact_email"
        render={({ field, fieldState }) => (
          <Field
            data-invalid={Boolean(fieldState.error)}
            className="gap-[6px]"
          >
            <label
              htmlFor="vacancy-contact-email"
              className="text-[14px] font-medium leading-[20px] text-foreground"
            >
              Correo de contacto (opcional)
            </label>
            <Input
              id="vacancy-contact-email"
              type="email"
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="talento@empresa.com"
              className="h-[44px] rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal"
            />
            {fieldState.error?.message && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Field>
        )}
      />

      {/* Visibilidad de la vacante */}
      <div className="bg-muted rounded-[12px] p-[14px] flex items-start gap-[10px]">
        <Eye className="size-[16px] text-foreground shrink-0 mt-[2px]" />
        <div className="flex flex-col gap-[2px]">
          <span className="text-[14px] font-semibold leading-[20px] text-foreground">
            Visibilidad de la vacante
          </span>
          <span className="text-[13px] leading-[18px] text-muted-foreground">
            Al publicar, las personas candidatas podrán ver la vacante y
            postularse.
          </span>
        </div>
      </div>
    </div>
  );
}
