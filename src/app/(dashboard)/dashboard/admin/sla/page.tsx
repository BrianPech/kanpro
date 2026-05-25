import { SlaMonitor } from "@/modules/admin/components/sla-monitor";

export default function SlaAdminPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/30">
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-foreground">
          Monitor de SLAs
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Supervisión en tiempo real de los tiempos de espera y cola de procesamiento de postulaciones.
        </p>
      </div>

      <SlaMonitor />
    </div>
  );
}
