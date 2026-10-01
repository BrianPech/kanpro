"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle2, Share2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ArticleFeedback() {
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);

  return (
    <div className="p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            ¿Te resultó útil este artículo?
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tu opinión nos ayuda a perfeccionar la documentación de la plataforma.
          </p>
        </div>

        {feedbackGiven === null ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFeedbackGiven(true);
                toast.success("¡Gracias por tu retroalimentación!");
              }}
              className="h-8 gap-1.5 text-xs rounded-lg"
            >
              <ThumbsUp className="size-3.5 text-emerald-500" />
              <span>Sí, fue útil</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFeedbackGiven(false);
                toast.info("Anotado. Trabajaremos en mejorar esta guía.");
              }}
              className="h-8 gap-1.5 text-xs rounded-lg"
            >
              <ThumbsDown className="size-3.5 text-muted-foreground" />
              <span>No del todo</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="size-4" />
            <span>¡Gracias por tus comentarios!</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>¿Dudas específicas no resueltas?</span>
        <a
          href="https://wa.me/529990000000"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <MessageSquare className="size-3.5" />
          <span>Contactar mesa de soporte</span>
        </a>
      </div>
    </div>
  );
}

export function ShareArticleButton({ title }: { title: string }) {
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch {
      // Ignorar cancelaciones de compartir nativo
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-auto"
      title="Compartir este artículo"
    >
      <Share2 className="size-3.5" />
      <span>Compartir</span>
    </button>
  );
}
