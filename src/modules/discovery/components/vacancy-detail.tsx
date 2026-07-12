"use client";

import * as React from "react";
import {
  MapPin,
  Briefcase,
  DollarSign,
  CheckCircle,
  Send,
  Loader2,
  MessageCircle,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Job } from "../types";
import { useConnection } from "@/hooks/use-connection";

interface VacancyDetailProps {
  job: Job | null;
  candidateSkills: string[];
  isAlreadyApplied: boolean;
  candidateId: string;
  onApplySuccess: (jobId: string) => void;
  className?: string;
  isMobile?: boolean;
}

export function VacancyDetail({
  job,
  candidateSkills = [],
  isAlreadyApplied,
  candidateId,
  onApplySuccess,
  className,
  isMobile = false,
}: VacancyDetailProps) {
  const [isChecked, setIsChecked] = React.useState(false);
  const [coverMessage, setCoverMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAppliedSession, setIsAppliedSession] = React.useState(false);
  const [prevJobId, setPrevJobId] = React.useState<string | null>(null);

  const { initiateWhatsAppConnection, loading: connecting } = useConnection();

  const handleWhatsAppContact = async () => {
    if (!job) return;
    try {
      await initiateWhatsAppConnection({
        candidateId: candidateId || "",
        vacancyId: job.id,
        initiatedBy: "candidate",
      });
    } catch (err: any) {
      toast.error("Error al conectar", {
        description: err.message || "No se pudo abrir el canal de WhatsApp.",
      });
    }
  };

  // Synchronize state during render instead of inside useEffect to avoid warnings
  if (job && job.id !== prevJobId) {
    setPrevJobId(job.id);
    setIsAppliedSession(false);
    setIsChecked(false);
    setCoverMessage("");
  }

  const hasApplied = isAlreadyApplied || isAppliedSession;

  if (!job) {
    return (
      <div
        className={cn(
          "h-full w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-border/40 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground/60">
          <Briefcase className="size-6" />
        </div>
        <p className="text-sm font-bold text-foreground mb-1">
          Ninguna Vacante Seleccionada
        </p>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Haz clic en cualquiera de las tarjetas de la izquierda para ver los detalles completos del puesto, los requisitos y postularte de inmediato.
        </p>
      </div>
    );
  }

  // Removed AI Match calculations

  const handleApply = async () => {
    if (!candidateId) {
      toast.error("Debes iniciar sesión para postularte");
      return;
    }
    if (!isChecked) {
      toast.error("Por favor, confirma compartir tu perfil profesional");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      if (job.isFromDb) {
        // Real database insert
        const { error } = await supabase.from("applications").insert({
          candidate_id: candidateId,
          vacancy_id: job.id,
          status: "Pendiente",
        });

        if (error) {
          if (error.code === "23505") {
            // Unique key violation
            toast.info("Ya te has postulado a este empleo");
            setIsAppliedSession(true);
            onApplySuccess(job.id);
          } else {
            throw error;
          }
        } else {
          toast.success("¡Postulación enviada con éxito!");
          setIsAppliedSession(true);
          onApplySuccess(job.id);
        }
      } else {
        // Mock application success fallback
        toast.success("¡Postulación simulada enviada con éxito! (Vacante de Demostración)");
        setIsAppliedSession(true);
        onApplySuccess(job.id);
      }
    } catch (err: unknown) {
      console.error("Error submitting application:", err);
      const errMsg =
        err instanceof Error ? err.message : "Error al enviar la postulación";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappLink = job.companyPhone
    ? `https://wa.me/${job.companyPhone.replace(/[^0-9]/g, "")}?text=Hola!%20Me%20interesa%20la%20vacante%20de%20${encodeURIComponent(
        job.title
      )}%20que%20vi%20en%20K'anPro.`
    : `https://wa.me/5211234567890?text=Hola!%20Me%20interesa%20la%20vacante%20de%20${encodeURIComponent(
        job.title
      )}%20en%20K'anPro.`;

  return (
    <div
      className={cn(
        "h-full w-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-border/40 rounded-2xl flex flex-col overflow-hidden shadow-xs",
        className
      )}
    >
      {/* Header and Scrollable area wrapper */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 scroll-smooth scrollbar-thin">
        {/* Header Block */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center font-extrabold text-[16px] text-primary border border-border/40 shrink-0 shadow-xs">
              {job.logoUrl ? (
                <img
                  src={job.logoUrl}
                  alt={job.company}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                job.companyLogo || job.company.substring(0, 2)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                  {job.company}
                </span>
                {job.isCompanyValidated && (
                  <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-in fade-in" />
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight mt-0.5">
                {job.title}
              </h2>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-xs font-semibold text-muted-foreground/80 bg-neutral-50/50 dark:bg-zinc-800/30 p-4 rounded-xl border border-border/30">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{job.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-foreground font-bold truncate">
                {job.salaryFormatted ||
                  `$${(job.salaryMin / 1000).toFixed(0)}k - $${(
                    job.salaryMax / 1000
                  ).toFixed(0)}k`}
              </span>
            </div>
          </div>
        </div>



        {/* Job Description */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">
            Descripción del Puesto
          </h4>
          <div className="text-xs leading-relaxed text-muted-foreground bg-neutral-50/20 dark:bg-zinc-800/10 p-5 rounded-xl border border-border/30 whitespace-pre-line font-medium">
            {job.description ||
              "No hay una descripción detallada proporcionada para este puesto. Postúlate para conocer más sobre la oferta directamente de la empresa."}
          </div>
        </div>

        {/* Benefits list */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">
              Beneficios y Condiciones
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground font-medium">
              {job.benefits.map((benefit: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                  <span className="truncate">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Conversion Bar */}
      <div className="shrink-0 bg-white/95 dark:bg-zinc-900/90 border-t border-border/30 p-5 md:p-6 backdrop-blur-md flex flex-col gap-4">
        {hasApplied ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
              <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground">
                Candidatura enviada con éxito
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                onClick={handleWhatsAppContact}
                disabled={connecting}
                className="h-10 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-5 w-full sm:w-auto gap-2 shadow-xs transition-all border-none"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4.5 h-4.5" />}
                WhatsApp
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                disabled
                className="h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs px-5 w-full sm:w-auto shadow-none"
              >
                Postulado
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Confirmation checkbox & quick intro message */}
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] text-muted-foreground leading-relaxed">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="mt-0.5 rounded border-border/80 text-indigo-600 focus:ring-indigo-500/35 h-3.5 w-3.5 shrink-0 transition-all cursor-pointer"
                />
                <span>
                  Confirmo compartir mi perfil profesional de K&apos;anPro y mis datos de contacto con esta empresa.
                </span>
              </label>

              {isChecked && (
                <div className="flex flex-col gap-1.5 animate-in fade-in-50 duration-200">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Mensaje de presentación (opcional)
                  </label>
                  <Textarea
                    placeholder="Escribe un mensaje corto presentándote (máx. 300 caracteres)..."
                    value={coverMessage}
                    onChange={(e) =>
                      setCoverMessage(e.target.value.substring(0, 300))
                    }
                    className="min-h-16 text-xs rounded-xl resize-none placeholder:text-muted-foreground/50 bg-white/50 border-border/60 focus-visible:ring-indigo-500/30"
                  />
                  <span className="text-[9px] text-right text-muted-foreground/70">
                    {coverMessage.length}/300
                  </span>
                </div>
              )}
            </div>

            {/* Actions button group */}
            <div className="flex items-center gap-3">
              {/* WhatsApp (Green) button */}
              <Button
                onClick={handleWhatsAppContact}
                disabled={connecting}
                className="flex-1 h-11 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs px-5 gap-2 shadow-xs transition-all border-none"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4.5 h-4.5" />}
                Contacto Reclutador
                <ExternalLink className="w-3 h-3" />
              </Button>

              {/* Submit Postulación Simple (Indigo) button */}
              <Button
                onClick={handleApply}
                disabled={isSubmitting || !isChecked}
                className="flex-[1.5] h-11 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs px-5 shadow-xs transition-all gap-2 border-none focus-visible:ring-indigo-500/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Postulando...
                  </>
                ) : (
                  <>
                    <Send className="h-4.5 w-4.5" />
                    Postulación Simple
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
