import * as React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Download, Trash2 } from "lucide-react";

export default async function PrivacyPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Datos y privacidad</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Controla tu información y configura cómo se utilizan tus datos en K&apos;anPro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {/* Visibility Card */}
        <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-4 flex items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
              <Eye className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Visibilidad del Perfil</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Decide si las empresas y reclutadores pueden encontrar tu perfil mediante búsquedas públicas.
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full h-10 px-5 border-border/60 shrink-0">
            Ajustar visibilidad
          </Button>
        </div>

        {/* Download Data */}
        <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-4 flex items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shrink-0">
              <Download className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Descargar tus datos</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Obtén una copia completa en formato JSON/PDF de toda tu actividad y datos registrados en la plataforma.
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full h-10 px-5 border-border/60 shrink-0">
            Exportar datos
          </Button>
        </div>

        {/* Delete Account */}
        <div className="glass-card rounded-[24px] p-6 md:p-8 border border-destructive/20 bg-destructive/5 space-y-4 flex items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-destructive/10 rounded-2xl text-destructive shrink-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-destructive">Eliminar cuenta</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Borra permanentemente tu cuenta y todos los datos asociados de forma definitiva. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <Button variant="destructive" className="rounded-full h-10 px-5 shrink-0">
            Eliminar cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
