import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building03Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import {
  getCompanyVerifications,
  getCandidateVerifications,
} from "./actions";
import { VerificationWorkbenchClient } from "@/modules/admin/components/verification-workbench";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Verificación de Expedientes | K'anPro Admin",
  description:
    "Auditoría fiscal, legal y validación de documentos oficiales en K'anPro.",
};

export default async function AdminVerificationsPage() {
  const [companies, candidates] = await Promise.all([
    getCompanyVerifications(),
    getCandidateVerifications(),
  ]);

  const verifiedCompaniesCount = companies.filter((c) => c.isVerified).length;
  const verifiedCandidatesCount = candidates.filter((c) => c.isVerified).length;
  const pendingCompaniesCount = companies.filter(
    (c) => !c.isVerified && c.verificationStatus === "pending"
  ).length;
  const totalAudits = companies.length + candidates.length;

  const kpiCards = [
    {
      label: "Empresas validadas",
      value: `${verifiedCompaniesCount}`,
      totalSuffix: `/ ${companies.length}`,
      subtitle: "Con sello verificado",
      icon: Building03Icon,
      highlight: false,
    },
    {
      label: "Candidatos validados",
      value: `${verifiedCandidatesCount}`,
      totalSuffix: `/ ${candidates.length}`,
      subtitle: "INE y cédula verificados",
      icon: UserGroupIcon,
      highlight: false,
    },
    {
      label: "Por dictaminar",
      value: `${pendingCompaniesCount}`,
      totalSuffix: "",
      subtitle:
        pendingCompaniesCount > 0
          ? "Pendientes de revisión"
          : "Expedientes al día",
      icon: Clock01Icon,
      highlight: pendingCompaniesCount > 0,
    },
    {
      label: "Total expedientes",
      value: `${totalAudits}`,
      totalSuffix: "",
      subtitle: "Entidades en plataforma",
      icon: CheckmarkBadge01Icon,
      highlight: false,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 w-full pb-4">
      {/* Encabezado compacto */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[24px] sm:text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
          Verificación de expedientes
        </h1>
        <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
          Auditoría fiscal, legal y validación de documentos oficiales de empresas y candidatos.
        </p>
      </div>

      {/* KPIs compactos */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium leading-[16px] text-muted-foreground truncate">
                {card.label}
              </span>
              <span className="size-[30px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={card.icon}
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[22px] sm:text-[24px] font-bold leading-[28px] text-foreground tabular-nums">
                {card.value}
              </span>
              {card.totalSuffix && (
                <span className="text-[12px] font-medium text-muted-foreground tabular-nums">
                  {card.totalSuffix}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[11.5px] leading-[15px] truncate",
                card.highlight
                  ? "font-semibold text-warning-foreground"
                  : "text-muted-foreground"
              )}
            >
              {card.subtitle}
            </span>
          </div>
        ))}
      </div>

      {/* Workbench compacto */}
      <VerificationWorkbenchClient
        initialCompanies={companies}
        initialCandidates={candidates}
      />
    </div>
  );
}
