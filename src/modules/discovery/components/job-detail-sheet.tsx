"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Sparkles,
  CheckCircle,
  Send,
  Loader2,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  logoUrl: string | null;
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryFormatted: string;
  type: string;
  category: string;
  experience: string;
  skills: string[];
  postedAt: string;
  featured: boolean;
  description: string;
  benefits: string[];
  isFromDb: boolean;
  companyPhone: string | null;
}

interface JobDetailSheetProps {
  job: Job | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  candidateSkills: string[];
  isAlreadyApplied: boolean;
  candidateId: string;
  onApplySuccess: (jobId: string) => void;
}

export function JobDetailSheet({
  job,
  isOpen,
  onOpenChange,
  candidateSkills,
  isAlreadyApplied,
  candidateId,
  onApplySuccess,
}: JobDetailSheetProps) {
  const [isChecked, setIsChecked] = React.useState(false);
  const [coverMessage, setCoverMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAppliedSession, setIsAppliedSession] = React.useState(false);
  const [prevJobId, setPrevJobId] = React.useState<string | null>(null);

  // Synchronize state during render instead of inside useEffect to avoid warnings
  if (job && job.id !== prevJobId) {
    setPrevJobId(job.id);
    setIsAppliedSession(false);
    setIsChecked(false);
    setCoverMessage("");
  }

  const hasApplied = isAlreadyApplied || isAppliedSession;

  if (!job) return null;

  // Calculate skill match breakdown
  const jobSkills = job.skills || [];
  const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase().trim());
  
  const matchedSkills = jobSkills.filter((vs: string) =>
    candidateSkillsLower.some((cs: string) => cs.includes(vs.toLowerCase().trim()) || vs.toLowerCase().trim().includes(cs))
  );

  const missingSkills = jobSkills.filter((vs: string) =>
    !candidateSkillsLower.some((cs: string) => cs.includes(vs.toLowerCase().trim()) || vs.toLowerCase().trim().includes(cs))
  );

  const matchPercentage = jobSkills.length > 0 
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : 70; // default baseline

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
        const { error } = await supabase
          .from("applications")
          .insert({
            candidate_id: candidateId,
            vacancy_id: job.id,
            status: "Pendiente"
          });

        if (error) {
          if (error.code === "23505") { // Unique key violation
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
      const errMsg = err instanceof Error ? err.message : "Error al enviar la postulación";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[550px] overflow-y-auto px-6 py-8 flex flex-col gap-6 bg-card border-l border-border/40">
        
        {/* Header Block */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/10 to-primary/5 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center font-extrabold text-[16px] text-primary border border-border/40 shrink-0 shadow-xs">
              {job.logoUrl ? (
                <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                job.companyLogo
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">{job.company}</p>
              <SheetTitle className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight mt-0.5">
                {job.title}
              </SheetTitle>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-3 mt-2 text-xs font-medium text-muted-foreground bg-muted/40 p-4 rounded-2xl border border-border/20">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{job.type}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-foreground font-bold">{job.salaryFormatted || `$${(job.salaryMin/1000).toFixed(0)}k - $${(job.salaryMax/1000).toFixed(0)}k`}</span>
            </div>
          </div>
        </div>

        <hr className="border-border/40" />

        {/* Dynamic IA Match Showcase */}
        <div className="bg-gradient-to-br from-primary/[0.04] to-primary/[0.01] border border-primary/15 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary shrink-0" />
            <h4 className="text-sm font-bold text-foreground">Compatibilidad con IA</h4>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
              matchPercentage >= 75
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}>
              {matchPercentage}% Coincidencia
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Comparamos las tecnologías requeridas por la empresa con las habilidades de tu perfil:
            </p>

            {/* Skills breakdown tags */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {matchedSkills.map((skill: string, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/15 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 rounded-md">
                  ✓ {skill}
                </span>
              ))}
              {missingSkills.map((skill: string, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted dark:bg-zinc-800 text-[11px] font-semibold text-muted-foreground rounded-md">
                  • {skill}
                </span>
              ))}
            </div>

            {missingSkills.length > 0 && (
              <p className="text-[10px] text-muted-foreground/80 font-medium">
                Tip: Considera añadir {missingSkills.slice(0, 2).join(", ")} a tu perfil si tienes experiencia en ellos.
              </p>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold text-foreground">Descripción del Puesto</h4>
          <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-2xl border border-border/20">
            {job.description || "No hay una descripción detallada proporcionada para este puesto. Por favor postúlate para obtener más información directamente de la empresa."}
          </div>
        </div>

        {/* Benefits list */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-bold text-foreground">Beneficios</h4>
            <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {job.benefits.map((benefit: string, idx: number) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                  <span className="truncate">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <hr className="border-border/40 mt-auto" />

        {/* Application Submission Block */}
        <div className="flex flex-col gap-4 bg-muted/10 p-5 rounded-[24px] border border-border/30">
          {hasApplied ? (
            <div className="flex flex-col items-center justify-center py-4 text-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-foreground">Ya te has postulado</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu perfil y currículum han sido compartidos con la empresa. Puedes seguir el proceso desde tu Panel de Control.
                </p>
              </div>
              <Button disabled className="w-full h-11 rounded-full mt-1 bg-emerald-600/20 text-emerald-600 border border-emerald-600/30 font-bold opacity-80">
                Postulación Enviada
              </Button>
              {job.companyPhone && (
                <a 
                  href={`https://wa.me/${job.companyPhone.replace(/[^0-9]/g, "")}?text=Hola!%20Me%20he%20postulado%20a%20la%20vacante%20de%20${encodeURIComponent(job.title)}%20en%20K'anPro.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-1.5"
                >
                  <Button className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all gap-2 border-none">
                    <MessageCircle className="w-4 h-4" />
                    Contactar por WhatsApp
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h5 className="text-sm font-bold text-foreground">Enviar Postulación</h5>
              
              {/* Checkbox item */}
              <label className="flex items-start gap-3 cursor-pointer select-none group text-xs text-muted-foreground leading-relaxed">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0 transition-all cursor-pointer"
                />
                <span>
                  Confirmo compartir mi perfil profesional de K&apos;anPro y mis datos de contacto con esta empresa.
                </span>
              </label>

              {/* Cover letter message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/80">Mensaje de presentación (opcional)</label>
                <Textarea
                  placeholder="Escribe un mensaje corto presentándote a la empresa..."
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value.substring(0, 300))}
                  className="min-h-16 text-xs rounded-xl resize-none placeholder:text-muted-foreground/60 bg-white"
                />
                <span className="text-[10px] text-right text-muted-foreground/75">{coverMessage.length}/300 caracteres</span>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleApply}
                disabled={isSubmitting || !isChecked}
                className="w-full h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all gap-2 mt-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando candidatura...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Candidatura
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
