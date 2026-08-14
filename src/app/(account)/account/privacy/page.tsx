"use client";

import React, { useState } from "react";
import { Eye, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { accountSecurityService } from "@/modules/account/services/account-security-service";
import { DeleteAccountModal } from "@/modules/account/components/delete-account-modal";

export default function PrivacyPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleExportData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const exportData = await accountSecurityService.exportUserData();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `kanpro-datos-usuario-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Exportación completada", {
        description: "Se ha generado y descargado el archivo JSON con tu información.",
      });
    } catch (err: unknown) {
      console.error("Error exporting user data:", err);
      toast.error("Error al exportar datos", {
        description:
          err instanceof Error
            ? err.message
            : "No se pudieron exportar los datos en este momento.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">
          Datos y privacidad
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Controla tu información y configura cómo se utilizan tus datos en K&apos;anPro conforme a tus derechos ARCO y la legislación vigente (LFPDPPP).
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
                Obtén una copia completa en formato JSON con toda tu información registrada en la plataforma (Derecho de Acceso ARCO).
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
            className="rounded-full h-10 px-5 border-border/60 shrink-0 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              "Exportar datos"
            )}
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
                Desactiva y solicita la eliminación definitiva de tu cuenta y datos personales. Esta acción no se puede deshacer (Derecho de Cancelación ARCO).
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteModalOpen(true)}
            className="rounded-full h-10 px-5 shrink-0"
          >
            Eliminar cuenta
          </Button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <DeleteAccountModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      />
    </div>
  );
}
