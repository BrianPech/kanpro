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
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
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
    <div className="flex-grow min-h-screen bg-white dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-3 pb-24 md:pb-10 max-w-2xl mx-auto w-full animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[12px] text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {/* AppBar */}
      <div className="flex items-center justify-between py-3 border-b border-transparent">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-[36px] h-[36px] bg-[#f5f7fa] dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        <h1 className="text-[17px] font-[800] text-[#1f2732] dark:text-zinc-100 text-center tracking-[-0.4px]">
          Mi CV
        </h1>

        <div className="w-9" />
      </div>

      {/* Main Content */}
      <div className="pt-3 space-y-6">
        
        {/* Subtitle explanation */}
        <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-medium leading-[1.45]">
          Sube tu Currículum Vitae en PDF para que los reclutadores de Quintana Roo y Yucatán revisen tu trayectoria.
        </p>

        {/* 1. Current Active CV Card */}
        {hasCv && (
          <div className="space-y-3 pt-2">
            <h2 className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100">
              Tu CV actual
            </h2>

            <div className="p-[18px] bg-white dark:bg-zinc-900 border border-[#d2dbe5] dark:border-zinc-800 rounded-[20px] shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                {/* PDF Icon Box */}
                <div className="w-12 h-12 rounded-[14px] bg-[#FEE4E2] dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-[#D92D20]" />
                </div>

                {/* File details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100 truncate">
                    {fileName}
                  </h3>
                  <p className="text-[12px] font-medium text-[#5c7c9b] dark:text-zinc-400 truncate mt-0.5">
                    {fileSize} • Subido {uploadDate}
                  </p>
                </div>

                {/* Active Status Badge */}
                <div className="px-2.5 py-1 bg-[#E2F9EC] dark:bg-emerald-950/40 rounded-[8px] shrink-0">
                  <span className="text-[11px] font-bold text-[#1B7A43] dark:text-emerald-400">
                    Activo
                  </span>
                </div>
              </div>

              <div className="border-t border-[#ebeef3] dark:border-zinc-800 pt-3 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1 h-10 rounded-[12px] border-[#d2dbe5] dark:border-zinc-700 text-[#344558] dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 stroke-[2]" />
                  <span>Ver CV</span>
                </Button>

                <button
                  onClick={() => setIsDeleteOpen(true)}
                  aria-label="Eliminar CV"
                  className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5 stroke-[2]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Upload / Replace Area */}
        <div className="space-y-3 pt-1">
          <h2 className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100">
            {hasCv ? "Reemplazar o subir nuevo CV" : "Subir archivo PDF"}
          </h2>

          <div
            onClick={isUploading ? undefined : handleSimulateUpload}
            className={`p-6 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[20px] border-2 transition-all cursor-pointer text-center ${
              isUploading
                ? "border-[#1f2732] dark:border-zinc-100 bg-[#f5f7fa]/90"
                : "border-[#d2dbe5] dark:border-zinc-800 hover:border-[#1f2732] dark:hover:border-zinc-600"
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full border-4 border-[#1f2732] border-t-transparent animate-spin" />
                <p className="text-[14px] font-bold text-[#1f2732] dark:text-zinc-100">
                  Subiendo archivo... {uploadProgress}%
                </p>
                <div className="w-full h-1.5 bg-[#d2dbe5] dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1f2732] dark:bg-zinc-100 transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-[56px] h-[56px] bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 shadow-2xs">
                  <UploadCloud className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100">
                    Toca para seleccionar tu archivo PDF
                  </h3>
                  <p className="text-[12px] font-medium text-[#5c7c9b] dark:text-zinc-400 mt-1">
                    Formatos aceptados: .pdf (Máx. 5 MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Tips / Recommendations Callout Card */}
        <div className="p-5 bg-[#1f2732] dark:bg-fiord-950 rounded-[20px] text-white space-y-3.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-[15px] font-bold text-white">
              Consejos para un CV efectivo
            </h3>
          </div>

          <div className="space-y-2 pl-1">
            <TipItem text="Mantén tu información de contacto y WhatsApp actualizada." />
            <TipItem text="Destaca tu experiencia previa en turismo, hostelería o comercio." />
            <TipItem text="Menciona tus idiomas (español, inglés u otros)." />
            <TipItem text="Asegúrate de que el documento PDF sea legible y sin contraseña." />
          </div>
        </div>

      </div>

      {/* PDF Preview Modal Bottom Sheet */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-t-[28px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4 max-h-[85vh]">
          <div className="w-10 h-1.5 bg-[#d2dbe5] dark:bg-zinc-700 rounded-full mx-auto" />

          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#ebeef3] dark:border-zinc-800">
            <div>
              <DialogTitle className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-50">
                Vista Previa del CV
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#5c7c9b] font-medium mt-0.5">
                {fileName}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Mock PDF document page */}
          <div className="p-6 bg-[#f5f7fa] dark:bg-zinc-800/50 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] flex flex-col items-center justify-center text-center space-y-4 py-12">
            <div className="w-16 h-16 rounded-full bg-[#FEE4E2] dark:bg-rose-950/50 flex items-center justify-center text-[#D92D20] shrink-0">
              <FileText className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100">
                {fileName}
              </h4>
              <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 mt-1">
                Documento PDF • {fileSize}
              </p>
            </div>

            <div className="px-4 py-3 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-700 rounded-[12px] flex items-center gap-2 shadow-2xs">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-[13px] font-semibold text-[#344558] dark:text-zinc-200">
                Formato verificado por K'anPro
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete CV Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[24px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-50">
              Eliminar CV
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#3e546d] dark:text-zinc-400 leading-relaxed">
              ¿Estás seguro de que deseas eliminar tu CV guardado? Las empresas no podrán revisar tu documento al postularte.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-[#ebeef3] dark:border-zinc-800">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="text-[#5c7c9b] font-bold text-xs hover:bg-[#f5f7fa]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCv}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-[12px] px-4 py-2"
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
    <div className="flex items-start gap-2">
      <span className="text-white/70 font-bold text-xs">•</span>
      <p className="text-[13px] text-white/90 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
