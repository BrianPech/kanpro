import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { CreateCompanyWizard } from "@/modules/company/components/wizard/create-company-wizard";

export const metadata = {
  title: "Registrar Empresa | K'anPro",
  description: "Crea y configura una organización para publicar ofertas y gestionar talento.",
};

export default async function NewCompanyPage() {
  const { userCompanies } = await getDashboardSession();
  const isFirstCompany = !userCompanies || userCompanies.length === 0;

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center px-4 py-6">
      <CreateCompanyWizard isFirstCompany={isFirstCompany} />
    </div>
  );
}
