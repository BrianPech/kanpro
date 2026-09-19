import { createClient } from "@/lib/supabase/server";

export interface CandidateContractItem {
  id: string;
  folio: string;
  companyId: string;
  companyName: string;
  companyLegalName?: string | null;
  companyRfc?: string | null;
  companyAddress?: string | null;
  companyLegalRep?: string | null;
  companyLogo?: string | null;
  jobTitle: string;
  department: string;
  contractType: string;
  templateType: string;
  startDate: string;
  endDate?: string | null;
  salary: number;
  paymentFrequency: string;
  companySigned: boolean;
  companySignatureUrl?: string | null;
  employeeSigned: boolean;
  employeeSignatureUrl?: string | null;
  status: string;
  createdAt: string;
  applicationId?: string | null;
  vacancyTitle?: string | null;
}

/**
 * Retrieves all employment contracts associated with the authenticated candidate/employee.
 */
export async function getCandidateContracts(): Promise<{
  contracts: CandidateContractItem[];
  pendingSignatureCount: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      contracts: [],
      pendingSignatureCount: 0,
    };
  }

  // 1. Fetch contracts directly linked by candidate_id
  const { data: dbContracts, error } = await supabase
    .from("company_contracts")
    .select(`
      id,
      folio,
      company_id,
      candidate_id,
      employee_id,
      application_id,
      job_title,
      department,
      contract_type,
      template_type,
      start_date,
      end_date,
      salary,
      payment_frequency,
      company_signed,
      company_signature_url,
      employee_signed,
      employee_signature_url,
      status,
      created_at,
      company:company_profiles (
        id,
        company_name,
        legal_name,
        rfc,
        fiscal_address,
        legal_rep_name,
        logo_url
      ),
      application:applications (
        id,
        status,
        vacancies (
          id,
          title
        )
      )
    `)
    .or(`candidate_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching candidate contracts:", error);
    return {
      contracts: [],
      pendingSignatureCount: 0,
    };
  }

  const rawList = dbContracts || [];

  const contracts: CandidateContractItem[] = rawList.map((c: any) => {
    const comp = Array.isArray(c.company) ? c.company[0] : c.company;
    const app = Array.isArray(c.application) ? c.application[0] : c.application;
    const vac = app?.vacancies
      ? Array.isArray(app.vacancies)
        ? app.vacancies[0]
        : app.vacancies
      : null;

    return {
      id: c.id,
      folio: c.folio,
      companyId: c.company_id,
      companyName:
        comp?.company_name || comp?.legal_name || "Empresa Contratante",
      companyLegalName: comp?.legal_name || null,
      companyRfc: comp?.rfc || null,
      companyAddress: comp?.fiscal_address || null,
      companyLegalRep: comp?.legal_rep_name || null,
      companyLogo: comp?.logo_url || null,
      jobTitle: c.job_title,
      department: c.department,
      contractType: c.contract_type,
      templateType: c.template_type,
      startDate: c.start_date,
      endDate: c.end_date || null,
      salary: Number(c.salary) || 0,
      paymentFrequency: c.payment_frequency || "quincenal",
      companySigned: Boolean(c.company_signed),
      companySignatureUrl: c.company_signature_url || null,
      employeeSigned: Boolean(c.employee_signed),
      employeeSignatureUrl: c.employee_signature_url || null,
      status: c.status || "vigente",
      createdAt: c.created_at,
      applicationId: c.application_id || null,
      vacancyTitle: vac?.title || null,
    };
  });

  const pendingSignatureCount = contracts.filter(
    (c) => !c.employeeSigned && c.status !== "cancelado"
  ).length;

  return {
    contracts,
    pendingSignatureCount,
  };
}
