"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  Eye, 
  Trash2, 
  UploadCloud, 
  Lightbulb, 
  X, 
  CheckCircle, 
  CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UploadCvViewProps {
  onBack?: () => void;
}

export function UploadCvView({ onBack }: UploadCvViewProps) {
  const router = useRouter();

  // Simulated CV State
  const [hasCv, setHasCv] = React.useState<boolean>(true);
  const [fileName, setFileName] = React.useState<string>("CV_Brian_Pech_2026.pdf");
  const [fileSize, setFileSize] = React.useState<string>("1.4 MB");
  const [uploadDate, setUploadDate] = React.useState<string>("18 de Julio, 2026");
  
  // Uploading state
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = React.useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    toast.success(msg);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Simulate File Selection & Upload
  const handleSimulateUpload = () => {
    if (isUploading) return;
    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setHasCv(true);
        setFileName("CV_Brian_Pech_Nuevo.pdf");
        setFileSize("1.8 MB");
        const now = new Date();
        const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
        setUploadDate(`Hoy, ${timeStr}`);
        showToast("¡Tu CV se ha actualizado correctamente!");
      }
    }, 150);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSimulateUpload();
    }
  };

  const handleDeleteCv = () => {
    setIsDeleteOpen(false);
    setHasCv(false);
    showToast("Se ha eliminado tu CV");
  };

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-4 pb-28 md:pb-8 max-w-3xl mx-auto w-full animate-in fade-in duration-300 relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {/* AppBar */}
      <div className="flex items-center justify-between py-4 border-b border-transparent">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-[44px] h-[44px] bg-[#f5f7fa] dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
        </button>

        <h1 className="text-[20px] sm:text-[24px] font-[800] text-[#1f2732] dark:text-zinc-100 text-center tracking-[-0.4px]">
          Mi CV
        </h1>

        <div className="w-11" />
      </div>

      {/* Main Content */}
      <div className="pt-4 space-y-7">
        
        {/* Subtitle explanation */}
        <p className="text-[15px] sm:text-[16px] text-[#5c7c9b] dark:text-zinc-400 font-semibold leading-[1.5]">
          Sube tu Currículum Vitae en PDF para que los reclutadores de Quintana Roo y Yucatán revisen tu trayectoria.
        </p>

        {/* 1. Current Active CV Card */}
        {hasCv && (
          <div className="space-y-3.5 pt-2">
            <h2 className="text-[17px] sm:text-[18px] font-bold text-[#1f2732] dark:text-zinc-100">
              Tu CV actual
            </h2>

            <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#d2dbe5] dark:border-zinc-800 rounded-[22px] shadow-2xs space-y-5">
              <div className="flex items-center justify-between gap-4">
                {/* PDF Icon Box */}
                <div className="w-14 h-14 rounded-[16px] bg-[#FEE4E2] dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7 text-[#D92D20]" />
                </div>

                {/* File details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] sm:text-[18px] font-bold text-[#1f2732] dark:text-zinc-100 truncate">
                    {fileName}
                  </h3>
                  <p className="text-[13px] sm:text-[14px] font-medium text-[#5c7c9b] dark:text-zinc-400 truncate mt-0.5">
                    {fileSize} • Subido {uploadDate}
                  </p>
                </div>

                {/* Active Status Badge */}
                <div className="px-3 py-1.5 bg-[#E2F9EC] dark:bg-emerald-950/40 rounded-[10px] shrink-0">
                  <span className="text-[12px] sm:text-[13px] font-extrabold text-[#1B7A43] dark:text-emerald-400">
                    Activo
                  </span>
                </div>
              </div>

              <div className="border-t border-[#ebeef3] dark:border-zinc-800 pt-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1 h-12 rounded-[14px] border-[#d2dbe5] dark:border-zinc-700 text-[#344558] dark:text-zinc-200 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4.5 h-4.5 stroke-[2]" />
                  <span>Ver CV</span>
                </Button>

                <button
                  onClick={() => setIsDeleteOpen(true)}
                  aria-label="Eliminar CV"
                  className="p-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5.5 h-5.5 stroke-[2]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Upload / Replace Area */}
        <div className="space-y-3.5 pt-1">
          <h2 className="text-[17px] sm:text-[18px] font-bold text-[#1f2732] dark:text-zinc-100">
            {hasCv ? "Reemplazar o subir nuevo CV" : "Subir archivo PDF"}
          </h2>

          <div
            onClick={isUploading ? undefined : handleSimulateUpload}
            className={`p-8 sm:p-10 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[24px] border-2 transition-all cursor-pointer text-center ${
              isUploading
                ? "border-[#1f2732] dark:border-zinc-100 bg-[#f5f7fa]/90"
                : "border-[#d2dbe5] dark:border-zinc-800 hover:border-[#1f2732] dark:hover:border-zinc-600"
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-full border-4 border-[#1f2732] dark:border-zinc-100 border-t-transparent animate-spin" />
                <p className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100">
                  Subiendo archivo... {uploadProgress}%
                </p>
                <div className="w-full max-w-xs h-2 bg-[#d2dbe5] dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1f2732] dark:bg-zinc-100 transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-[64px] h-[64px] bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 shadow-2xs">
                  <UploadCloud className="w-8 h-8 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="text-[16px] sm:text-[18px] font-bold text-[#1f2732] dark:text-zinc-100">
                    Toca para seleccionar tu archivo PDF
                  </h3>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#5c7c9b] dark:text-zinc-400 mt-1">
                    Formatos aceptados: .pdf (Máx. 5 MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Tips / Recommendations Callout Card */}
        <div className="p-6 bg-[#1f2732] dark:bg-fiord-950 rounded-[24px] text-white space-y-4 shadow-md">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-amber-400 shrink-0" />
            <h3 className="text-[17px] font-bold text-white">
              Consejos para un CV efectivo
            </h3>
          </div>

          <div className="space-y-2.5 pl-1">
            <TipItem text="Mantén tu información de contacto y WhatsApp actualizada." />
            <TipItem text="Destaca tu experiencia previa en turismo, hostelería o comercio." />
            <TipItem text="Menciona tus idiomas (español, inglés u otros)." />
            <TipItem text="Asegúrate de que el documento PDF sea legible y sin contraseña." />
          </div>
        </div>

      </div>

      {/* PDF Preview Modal Bottom Sheet */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-t-[32px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8 space-y-5 max-h-[85vh]">
          <div className="w-12 h-1.5 bg-[#d2dbe5] dark:bg-zinc-700 rounded-full mx-auto" />

          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#ebeef3] dark:border-zinc-800">
            <div>
              <DialogTitle className="text-[20px] font-bold text-[#1f2732] dark:text-zinc-50">
                Vista Previa del CV
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#5c7c9b] font-medium mt-0.5">
                {fileName}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Mock PDF document page */}
          <div className="p-6 bg-[#f5f7fa] dark:bg-zinc-800/50 border border-[#ebeef3] dark:border-zinc-800 rounded-[22px] flex flex-col items-center justify-center text-center space-y-4 py-14">
            <div className="w-18 h-18 rounded-full bg-[#FEE4E2] dark:bg-rose-950/50 flex items-center justify-center text-[#D92D20] shrink-0">
              <FileText className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-[17px] font-bold text-[#1f2732] dark:text-zinc-100">
                {fileName}
              </h4>
              <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 mt-1">
                Documento PDF • {fileSize}
              </p>
            </div>

            <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-700 rounded-[14px] flex items-center gap-2.5 shadow-2xs">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-[14px] font-bold text-[#344558] dark:text-zinc-200">
                Formato verificado por K'anPro
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete CV Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8 space-y-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-[20px] font-bold text-[#1f2732] dark:text-zinc-50">
              Eliminar CV
            </DialogTitle>
            <DialogDescription className="text-[15px] text-[#3e546d] dark:text-zinc-400 leading-relaxed">
              ¿Estás seguro de que deseas eliminar tu CV guardado? Las empresas no podrán revisar tu documento al postularte.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-3 pt-4 border-t border-[#ebeef3] dark:border-zinc-800">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="text-[#5c7c9b] font-bold text-sm h-11 px-5 hover:bg-[#f5f7fa] cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCv}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-[14px] px-6 h-11 cursor-pointer"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function TipItem({ text }: { text: String }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-white/70 font-bold text-sm">•</span>
      <p className="text-[14px] text-white/90 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
