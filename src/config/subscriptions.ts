export type SubscriptionPlanId = "basic" | "pro" | "enterprise";

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  name: string;
  badgeName: string;
  price: number;
  currency: "MXN";
  billingPeriodLabel: string;
  priceFormatted: string;
  description: string;
  featuredVacanciesAllowance: number;
  featuredVacanciesLabel: string;
  maxActiveVacancies: number;
  creditsAllowance: number;
  autoBilling: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanConfig> = {
  basic: {
    id: "basic",
    name: "Plan Básico",
    badgeName: "Básico",
    price: 0,
    currency: "MXN",
    billingPeriodLabel: "Gratuito",
    priceFormatted: "Gratis",
    description: "Acceso esencial a la bolsa de trabajo y gestión operativa.",
    featuredVacanciesAllowance: 0,
    featuredVacanciesLabel: "Sin vacantes destacadas.",
    maxActiveVacancies: 3,
    creditsAllowance: 3,
    autoBilling: false,
  },
  pro: {
    id: "pro",
    name: "Plan PRO Mensual",
    badgeName: "PRO",
    price: 1499.0,
    currency: "MXN",
    billingPeriodLabel: "mensual",
    priceFormatted: "$1,499 MXN/m",
    description: "3 vacantes destacadas con prioridad en postulaciones y mayor visibilidad.",
    featuredVacanciesAllowance: 3,
    featuredVacanciesLabel: "3 vacantes destacadas.",
    maxActiveVacancies: 15,
    creditsAllowance: 15,
    autoBilling: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Plan Corporativo Mensual",
    badgeName: "Corporativo",
    price: 3999.0,
    currency: "MXN",
    billingPeriodLabel: "mensual",
    priceFormatted: "$3,999 MXN/m",
    description: "10 vacantes destacadas, vacantes ilimitadas y soporte prioritario.",
    featuredVacanciesAllowance: 10,
    featuredVacanciesLabel: "10 vacantes destacadas.",
    maxActiveVacancies: Infinity,
    creditsAllowance: 50,
    autoBilling: true,
  },
};

export function getSubscriptionPlan(planId: string | null | undefined): SubscriptionPlanConfig {
  if (!planId) return SUBSCRIPTION_PLANS.basic;
  const normalized = planId.toLowerCase() as SubscriptionPlanId;
  return SUBSCRIPTION_PLANS[normalized] || SUBSCRIPTION_PLANS.basic;
}
