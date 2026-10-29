import {
  getCompanyVerifications,
  getCandidateVerifications,
} from "./actions";
import { VerificationWorkbenchClient } from "@/modules/admin/components/verification-workbench";
import { Card } from "@/components/ui/card";
import {
  BadgeCheck,
  Building2,
  Users,
  ShieldCheck,
  Clock,
} from "@/components/ui/icons";

export const metadata = {
  title: "Verificación de Expedientes | K'anPro Admin",
  description: "Auditoría fiscal, legal y validación de documentos oficiales en K'anPro.",
};

export default async function AdminVerificationsPage() {
  // Fetch real verification lists from Supabase
  const [companies, candidates] = await Promise.all([
    getCompanyVerifications(),
    getCandidateVerifications(),
  ]);

  const verifiedCompaniesCount = companies.filter((c) => c.isVerified).length;
  const verifiedCandidatesCount = candidates.filter((c) => c.isVerified).length;
  const pendingCompaniesCount = companies.filter((c) => !c.isVerified && c.verificationStatus === "pending").length;
  const totalAudits = companies.length + candidates.length;

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8 animate-in fade-in duration-200">
      
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Empresas Validadas
            </span>
            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {verifiedCompaniesCount} <span className="text-xs text-muted-foreground font-sans">/ {companies.length}</span>
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Con Sello Verificado activo
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Candidatos Validados
            </span>
            <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {verifiedCandidatesCount} <span className="text-xs text-muted-foreground font-sans">/ {candidates.length}</span>
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Cédula e INE verificados
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Auditorías Pendientes
            </span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {pendingCompaniesCount}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Por dictaminar por staff
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Total Expedientes
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {totalAudits}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Entidades en plataforma
            </p>
          </div>
        </Card>
      </div>

      {/* Main Interactive Verification Workbench with TanStack Table */}
      <VerificationWorkbenchClient
        initialCompanies={companies}
        initialCandidates={candidates}
      />
    </div>
  );
}
