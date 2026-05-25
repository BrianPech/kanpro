import { MatchPanel } from "@/modules/admin/components/match-panel";

export default function MatchAdminPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/30">
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-foreground">
          Match Manual
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Curaduría y vinculación manual entre talentos Premium disponibles y vacantes urgentes.
        </p>
      </div>

      <MatchPanel />
    </div>
  );
}
