import {
  getCompanyVerifications,
  getCandidateVerifications,
} from "./actions";
import { VerificationWorkbenchClient } from "./verification-workbench-client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BadgeCheckIcon,
  Building2Icon,
  UserCheckIcon,
  ShieldCheckIcon,
  FileCheckIcon,
} from "lucide-react";

export default async function AdminVerificationsPage() {
  // Fetch real verification lists from Supabase
  const [companies, candidates] = await Promise.all([
    getCompanyVerifications(),
    getCandidateVerifications(),
  ]);

  const verifiedCompaniesCount = companies.filter((c) => c.isVerified).length;
  const verifiedCandidatesCount = candidates.filter((c) => c.isVerified).length;
  const pendingCompaniesCount = companies.filter((c) => !c.isVerified).length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Page Title & Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <BadgeCheckIcon className="size-6 text-purple-600" />
          <span>Verificación Manual de Expedientes y Documentos</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Audite RFC, Cédulas Profesionales, registros patronales y archivos cargados por Empresas y Candidatos en K’anPro.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Empresas Verificadas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {verifiedCompaniesCount} / {companies.length}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Building2Icon className="size-3.5 text-blue-500" />
                Empresas
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Con Badge Verificado{" "}
              <ShieldCheckIcon className="size-4 text-emerald-500" />
            </div>
            <div className="text-muted-foreground text-xs">
              Documentación fiscal auditada
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Candidatos Verificados</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {verifiedCandidatesCount} / {candidates.length}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <UserCheckIcon className="size-3.5 text-purple-500" />
                Candidatos
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Expedientes validados{" "}
              <FileCheckIcon className="size-4 text-purple-500" />
            </div>
            <div className="text-muted-foreground text-xs">
              Cédula e INE verificados
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Auditorías Pendientes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {pendingCompaniesCount}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShieldCheckIcon className="size-3.5 text-amber-500" />
                Por Revisar
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Revisión prioritaria{" "}
              <BadgeCheckIcon className="size-4 text-amber-500" />
            </div>
            <div className="text-muted-foreground text-xs">
              Pendientes de dictamen de staff
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Main Interactive Verification Workbench */}
      <div>
        <VerificationWorkbenchClient
          initialCompanies={companies}
          initialCandidates={candidates}
        />
      </div>
    </div>
  );
}
