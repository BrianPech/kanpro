"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  MessageSquare,
  Loader2,
  FolderLock,
  FileQuestion,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Applicant } from "../hooks/use-applications-inbox";
import { getCandidateCvDocument } from "../actions/document-access";

interface CandidateCvViewerProps {
  applicant: Applicant;
}

interface UploadedCvState {
  hasUploadedCv: boolean;
  cvUrl: string | null;
  fileName: string | null;
  uploadedAt: string | null;
}

export function CandidateCvViewer({ applicant }: CandidateCvViewerProps) {
  const [loading, setLoading] = useState(true);
  const [uploadedCv, setUploadedCv] = useState<UploadedCvState | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCv() {
      setLoading(true);
      try {
        const res = await getCandidateCvDocument(applicant.id, applicant.candidateId);
        if (isMounted) {
          setUploadedCv(res);
        }
      } catch (err) {
        console.error("Error fetching CV document:", err);
        if (isMounted) {
          setUploadedCv({
            hasUploadedCv: false,
            cvUrl: null,
            fileName: null,
            uploadedAt: null,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (applicant?.id) {
      fetchCv();
    }

    return () => {
      isMounted = false;
    };
  }, [applicant?.id, applicant?.candidateId]);

  const whatsappMessage = `Hola ${applicant.name}, te contactamos respecto a tu postulación en K'anPro para la vacante "${applicant.vacancyTitle}". Para avanzar en nuestro proceso de reclutamiento, ¿podrías compartirnos tu Currículum en archivo PDF? Muchas gracias.`;

  return (
    <div className="space-y-4 text-left">
      {/* Loading state */}
      {loading ? (
        <Card className="p-12 text-center bg-card border border-border/40 rounded-2xl">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs text-muted-foreground font-medium">
            Verificando si el candidato adjuntó archivo de CV en PDF...
          </p>
        </Card>
      ) : uploadedCv?.hasUploadedCv && uploadedCv?.cvUrl ? (
        /* PDF Attached: Controls & Viewer */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="size-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <span>{uploadedCv.fileName || "Curriculum_Vitae.pdf"}</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border-none">
                    PDF Adjunto
                  </Badge>
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {uploadedCv.uploadedAt
                    ? `Actualizado el ${new Date(uploadedCv.uploadedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}`
                    : "Documento curricular adjuntado por el candidato"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                href={uploadedCv.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 border-border/60 hover:bg-muted/50 cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Abrir en Pestaña Nueva</span>
                </Button>
              </a>

              <a
                href={uploadedCv.cvUrl}
                download={uploadedCv.fileName || "Curriculum.pdf"}
                className="inline-flex"
              >
                <Button
                  size="sm"
                  className="h-8 px-3.5 rounded-lg text-xs font-bold gap-1.5 bg-primary text-primary-foreground cursor-pointer shadow-2xs"
                >
                  <Download className="size-3.5" />
                  <span>Descargar PDF</span>
                </Button>
              </a>
            </div>
          </div>

          {/* Embedded PDF Viewer */}
          <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-xs">
            <iframe
              src={uploadedCv.cvUrl}
              className="w-full h-[560px] bg-muted/10 border-0"
              title="Currículum Vitae PDF"
            />
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Si la vista previa del PDF no se muestra directamente en tu navegador, puedes{" "}
            <a
              href={uploadedCv.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-2"
            >
              abrirlo en una pestaña nueva
            </a>{" "}
            o{" "}
            <a
              href={uploadedCv.cvUrl}
              download={uploadedCv.fileName || "Curriculum.pdf"}
              className="font-semibold text-primary underline underline-offset-2"
            >
              descargarlo en tu equipo
            </a>
            .
          </p>
        </div>
      ) : (
        /* No PDF Attached State */
        <Card className="p-8 sm:p-10 text-center bg-muted/10 border border-border/40 rounded-2xl space-y-4">
          <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto border border-border/40">
            <FileQuestion className="size-6 text-muted-foreground/80" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm sm:text-base font-bold text-foreground">
              El candidato no adjuntó archivo de CV en PDF
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El candidato completó su postulación mediante su perfil en la plataforma K&apos;anPro. Su historial laboral, educación y competencias clave se encuentran disponibles en la pestaña <strong>Trayectoria</strong> de este expediente.
            </p>
          </div>

          {applicant.phone && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <a
                href={`https://wa.me/${applicant.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer h-9 px-4"
                >
                  <MessageSquare className="size-3.5 text-emerald-600" />
                  <span>Solicitar CV en PDF por WhatsApp</span>
                </Button>
              </a>
            </div>
          )}
        </Card>
      )}

      {/* Note about official legal documents */}
      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 flex items-start gap-2.5 text-xs text-muted-foreground">
        <FolderLock className="size-4 text-muted-foreground/70 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>Nota sobre Documentación Oficial:</strong> La documentación legal del trabajador (INE, RFC, CURP, NSS y comprobante de domicilio) se solicita e integra formalmente al expediente laboral una vez concretada la contratación (Etapa 4), protegiendo la privacidad del candidato durante la evaluación.
        </p>
      </div>
    </div>
  );
}
