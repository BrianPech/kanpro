import * as React from "react";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import {
  ContractsView,
  ContractRecord,
  TerminationRecord,
  ActiveEmployeeOption,
  CompanyLegalInfo,
} from "@/modules/company/components/contracts-view";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyContractsPage() {
  const { activeCompanyId } = await getDashboardSession();
  const [data, supabase] = await Promise.all([
    getCompanyDashboardData(activeCompanyId),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetCompanyId = activeCompanyId || user?.id;

  let realContracts: ContractRecord[] = [];
  let realTerminations: TerminationRecord[] = [];
  let activeEmployees: ActiveEmployeeOption[] = [];
  let companyInfo: CompanyLegalInfo | undefined = undefined;

  if (user && targetCompanyId) {
    const [contractsRes, terminationsRes, activeEmpsRes, companyProfileRes] = await Promise.all([
      supabase
        .from("company_contracts")
        .select(`
          id,
          folio,
          job_title,
          department,
          contract_type,
          template_type,
          start_date,
          end_date,
          salary,
          payment_frequency,
          company_signed,
          employee_signed,
          status,
          company_employees (
            id,
            full_name,
            phone,
            avatar_url
          ),
          candidate_profiles (
            id,
            profiles (
              id,
              full_name,
              avatar_url,
              whatsapp_number
            )
          )
        `)
        .eq("company_id", targetCompanyId)
        .order("created_at", { ascending: false }),

      supabase
        .from("company_employees")
        .select(`
          id,
          full_name,
          avatar_url,
          phone,
          job_title,
          department,
          termination_date,
          termination_reason,
          notes,
          base_salary_monthly,
          updated_at
        `)
        .eq("company_id", targetCompanyId)
        .eq("status", "terminated")
        .order("termination_date", { ascending: false, nullsFirst: false }),

      supabase
        .from("company_employees")
        .select(`
          id,
          full_name,
          job_title,
          department,
          avatar_url,
          phone,
          rfc,
          curp,
          base_salary_monthly
        `)
        .eq("company_id", targetCompanyId)
        .neq("status", "terminated")
        .order("full_name", { ascending: true }),

      supabase
        .from("company_profiles")
        .select("company_name, legal_name, rfc, fiscal_address, legal_rep_name")
        .eq("id", targetCompanyId)
        .maybeSingle(),
    ]);

    // 1. Process Contracts
    if (contractsRes.data && contractsRes.data.length > 0) {
      const now = new Date();
      realContracts = contractsRes.data.map((c: any) => {
        const emp = Array.isArray(c.company_employees)
          ? c.company_employees[0]
          : c.company_employees;
        const candProfile = Array.isArray(c.candidate_profiles)
          ? c.candidate_profiles[0]
          : c.candidate_profiles;
        const baseProfile = candProfile?.profiles
          ? Array.isArray(candProfile.profiles)
            ? candProfile.profiles[0]
            : candProfile.profiles
          : {};

        const employeeName =
          emp?.full_name || baseProfile?.full_name || "Empleado";
        const avatarUrl =
          emp?.avatar_url || baseProfile?.avatar_url || null;
        const phone =
          emp?.phone || baseProfile?.whatsapp_number || "+52 984 123 4567";

        let daysRemaining = 999;
        let contractStatus: "vigente" | "proximo_a_vencer" | "imminent" | "en_firma" =
          (c.status as any) || "vigente";
        const isIndeterminado =
          c.template_type === "indeterminado" || !c.end_date;

        if (!isIndeterminado && c.end_date) {
          const endDate = new Date(c.end_date);
          const diffMs = endDate.getTime() - now.getTime();
          daysRemaining = Math.max(
            0,
            Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          );
          if (c.status !== "en_firma") {
            if (daysRemaining <= 7) {
              contractStatus = "imminent";
            } else if (daysRemaining <= 30) {
              contractStatus = "proximo_a_vencer";
            } else {
              contractStatus = "vigente";
            }
          }
        }

        return {
          id: c.id,
          folio: c.folio || `KAN-CTR-2026-${c.id.slice(0, 4).toUpperCase()}`,
          employeeId: emp?.id || candProfile?.id || c.id,
          employeeName,
          avatarUrl,
          phone,
          jobTitle: c.job_title || "Puesto General",
          department: c.department || "Operaciones",
          contractType: c.contract_type || "Contrato Laboral",
          templateType: (c.template_type as any) || "determinado",
          startDate: c.start_date,
          endDate: isIndeterminado ? "Indeterminado" : c.end_date,
          daysRemaining,
          salary: Number(c.salary) || 0,
          paymentFrequency: c.payment_frequency || "Quincenal",
          status: contractStatus,
          companySigned: Boolean(c.company_signed),
          employeeSigned: Boolean(c.employee_signed),
        };
      });
    }

    // 2. Process Terminations (Bajas)
    if (terminationsRes.data && terminationsRes.data.length > 0) {
      const validReasons = [
        "Renuncia voluntaria",
        "Fin de contrato / Proyecto",
        "Despido justificado",
        "Mutuo acuerdo",
        "Abandono de empleo",
        "Otro",
      ] as const;

      realTerminations = terminationsRes.data.map((emp: any) => {
        const reason = validReasons.includes(emp.termination_reason)
          ? emp.termination_reason
          : "Renuncia voluntaria";
        const salary = Number(emp.base_salary_monthly) || 0;
        const severanceAmount = Math.round(salary * 0.75);

        return {
          id: emp.id,
          employeeId: emp.id,
          employeeName: emp.full_name || "Empleado",
          avatarUrl: emp.avatar_url || null,
          phone: emp.phone || undefined,
          jobTitle: emp.job_title || "Puesto General",
          department: emp.department || "Operaciones",
          terminationDate:
            emp.termination_date ||
            emp.updated_at?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          reason,
          notes: emp.notes || undefined,
          severanceStatus: "finiquitado",
          severanceAmount,
        };
      });
    }

    // 3. Process Active Employees for contract generator
    if (activeEmpsRes.data && activeEmpsRes.data.length > 0) {
      activeEmployees = activeEmpsRes.data.map((emp: any) => ({
        id: emp.id,
        name: emp.full_name,
        jobTitle: emp.job_title,
        department: emp.department || "Operaciones",
        avatarUrl: emp.avatar_url || null,
        phone: emp.phone || undefined,
        rfc: emp.rfc || undefined,
        curp: emp.curp || undefined,
        baseSalary: emp.base_salary_monthly
          ? Number(emp.base_salary_monthly)
          : undefined,
      }));
    }

    // 4. Process Company Legal Profile
    if (companyProfileRes.data) {
      companyInfo = {
        name:
          companyProfileRes.data.legal_name ||
          companyProfileRes.data.company_name ||
          "Empresa Contratante",
        rfc: companyProfileRes.data.rfc || "XAXX010101000",
        address:
          companyProfileRes.data.fiscal_address ||
          "Domicilio fiscal registrado en Quintana Roo, México",
        legalRepName:
          companyProfileRes.data.legal_rep_name || "Representante Legal",
      };
    }
  }

  return (
    <ContractsView
      realContracts={realContracts}
      realTerminations={realTerminations}
      activeEmployees={activeEmployees}
      companyInfo={companyInfo}
      kpis={data.kpis}
    />
  );
}
