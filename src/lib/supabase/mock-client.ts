/**
 * E2E Mock Supabase Client
 * Provides deterministic, isolated in-memory responses for Playwright visual consistency
 * and smoke tests without requiring an active external Supabase Docker daemon.
 */

const MOCK_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_USER = {
  id: MOCK_COMPANY_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "empresa.demo@kanpro.test",
  email_confirmed_at: "2024-01-01T00:00:00.000Z",
  phone: "+52 998 123 4567",
  user_metadata: {
    role: "company",
    full_name: "Hotel Boutique K'an",
    name: "Hotel Boutique K'an",
  },
  app_metadata: {
    provider: "email",
    providers: ["email"],
  },
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

export const MOCK_PROFILE = {
  id: MOCK_COMPANY_ID,
  role: "company",
  full_name: "Hotel Boutique K'an",
  is_early_access: true,
  email: "empresa.demo@kanpro.test",
  created_at: "2024-01-01T00:00:00.000Z",
};

export const MOCK_COMPANY_PROFILE = {
  id: MOCK_COMPANY_ID,
  company_name: "Hotel Boutique K'an",
  legal_name: "K'an Operadora Hotelera S.A. de C.V.",
  rfc: "KOH180425ABC",
  contact_phone: "+52 998 123 4567",
  corporate_email: "contacto@hotelboutiquekan.mx",
  fiscal_address: "Av. Tulum Sm 20, Cancún, Quintana Roo",
  entity_type: "moral",
  subscription_plan: "pro",
  subscription_status: "active",
  subscription_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  credits_available: 50,
  featured_vacancies_allowance: 5,
  featured_vacancies_used: 1,
  verification_status: "verified",
  industry: "Hotelería y Turismo",
  company_size: "51-200",
  description: "Hotel boutique de lujo y hospitalidad en la Riviera Maya.",
  website_url: "https://hotelboutiquekan.mx",
  contact_channel: "whatsapp",
  profiles: {
    is_early_access: true,
  },
};

export const MOCK_VACANCIES = [
  {
    id: "vac-001",
    company_id: MOCK_COMPANY_ID,
    recruiter_id: MOCK_COMPANY_ID,
    title: "Recepcionista Bilingüe",
    department: "Recepción",
    category: "Hotelería",
    location: "Cancún, Q.R.",
    zone: "Zona Hotelera",
    work_modality: "presencial",
    employment_type: "tiempo_completo",
    salary_min: 14000,
    salary_max: 18000,
    currency: "MXN",
    is_salary_public: true,
    description: "Atención cálida a huéspedes internacionales, check-in, check-out.",
    requirements: ["Inglés avanzado", "Experiencia mínima 1 año en hotelería"],
    benefits: ["Prestaciones de ley", "Comedor de colaboradores", "Transporte"],
    is_active: true,
    status: "published",
    views_count: 142,
    applications_count: 18,
    created_at: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "vac-002",
    company_id: MOCK_COMPANY_ID,
    recruiter_id: MOCK_COMPANY_ID,
    title: "Chef Ejecutivo",
    department: "Cocina",
    category: "Gastronomía",
    location: "Playa del Carmen",
    zone: "Centro",
    work_modality: "presencial",
    employment_type: "tiempo_completo",
    salary_min: 28000,
    salary_max: 35000,
    currency: "MXN",
    is_salary_public: true,
    description: "Diseño de menús de temporada, costeo y liderazgo del equipo culinario.",
    requirements: ["Licenciatura en Gastronomía", "5 años de experiencia liderando cocina"],
    benefits: ["Vales de despensa", "Seguro de gastos médicos mayores", "Bono por desempeño"],
    is_active: true,
    status: "published",
    views_count: 88,
    applications_count: 6,
    created_at: "2026-10-10T12:00:00.000Z",
  },
  {
    id: "vac-003",
    company_id: MOCK_COMPANY_ID,
    recruiter_id: MOCK_COMPANY_ID,
    title: "Auxiliar Contable",
    department: "Finanzas",
    category: "Finanzas",
    location: "Cancún, Q.R.",
    zone: "Centro",
    work_modality: "hibrido",
    employment_type: "tiempo_completo",
    salary_min: 12000,
    salary_max: 15000,
    currency: "MXN",
    is_salary_public: true,
    description: "Conciliaciones bancarias, facturación SAT 4.0 y pólizas contables.",
    requirements: ["Carrera técnica o pasante contaduría", "Manejo de Contpaqi o Aspel"],
    benefits: ["Prestaciones de ley", "Horario flexible"],
    is_active: false,
    status: "paused",
    views_count: 45,
    applications_count: 4,
    created_at: "2026-10-15T09:00:00.000Z",
  },
];

export const MOCK_EMPLOYEES = [
  {
    id: "emp-001",
    company_id: MOCK_COMPANY_ID,
    employee_id: "usr-emp-001",
    full_name: "María Fernanda Gómez",
    job_title: "Coordinadora de Recursos Humanos",
    department: "Recursos Humanos",
    employee_code: "EMP-001",
    phone: "+52 998 555 1234",
    email: "maria.gomez@empresa.com",
    avatar_url: null,
    base_salary_monthly: 22000,
    payment_frequency: "quincenal",
    work_schedule: "Lunes a Viernes 9:00 - 18:00",
    rfc: "GOFM900101XYZ",
    curp: "GOFM900101MQRXYZ01",
    nss: "12345678901",
    status: "active",
    hire_date: "2024-01-15",
    notes: "Excelente desempeño operativo",
    created_at: "2024-01-15T08:00:00.000Z",
  },
  {
    id: "emp-002",
    company_id: MOCK_COMPANY_ID,
    employee_id: "usr-emp-002",
    full_name: "Alejandro Morales Rivera",
    job_title: "Desarrollador Fullstack Senior",
    department: "Tecnología",
    employee_code: "EMP-002",
    phone: "+52 998 555 5678",
    email: "alejandro.morales@empresa.com",
    avatar_url: null,
    base_salary_monthly: 45000,
    payment_frequency: "quincenal",
    work_schedule: "Lunes a Viernes 9:00 - 18:00",
    rfc: "MORA880202ABC",
    curp: "MORA880202HQRABC02",
    nss: "98765432109",
    status: "active",
    hire_date: "2023-06-01",
    notes: "Líder técnico del portal interno",
    created_at: "2023-06-01T08:00:00.000Z",
  },
  {
    id: "emp-003",
    company_id: MOCK_COMPANY_ID,
    employee_id: "usr-emp-003",
    full_name: "Sofía Ramírez Cruz",
    job_title: "Recepcionista Bilingüe",
    department: "Recepción",
    employee_code: "EMP-003",
    phone: "+52 998 555 9012",
    email: "sofia.ramirez@empresa.com",
    avatar_url: null,
    base_salary_monthly: 16000,
    payment_frequency: "quincenal",
    work_schedule: "Turnos rotativos 7:00 - 15:30 / 15:00 - 23:00",
    rfc: "RACS950303DEF",
    curp: "RACS950303MQRDEF03",
    nss: "56789012345",
    status: "active",
    hire_date: "2024-03-01",
    notes: "Mención especial por satisfacción del cliente",
    created_at: "2024-03-01T08:00:00.000Z",
  },
];

export const MOCK_APPLICATIONS = [
  {
    id: "app-001",
    vacancy_id: "vac-001",
    candidate_id: "cand-001",
    status: "in_review",
    created_at: "2026-10-25T14:30:00.000Z",
    vacancy: {
      id: "vac-001",
      title: "Recepcionista Bilingüe",
    },
    candidate: {
      id: "cand-001",
      full_name: "Laura Patricia Torres",
      email: "laura.torres@gmail.com",
      phone: "+52 998 111 2233",
      avatar_url: null,
      headline: "Recepcionista con 4 años de experiencia hotelera",
      location: "Cancún",
    },
  },
  {
    id: "app-002",
    vacancy_id: "vac-002",
    candidate_id: "cand-002",
    status: "pending",
    created_at: "2026-10-26T09:15:00.000Z",
    vacancy: {
      id: "vac-002",
      title: "Chef Ejecutivo",
    },
    candidate: {
      id: "cand-002",
      full_name: "Carlos Alberto Vega",
      email: "carlos.vega@gmail.com",
      phone: "+52 984 222 3344",
      avatar_url: null,
      headline: "Sous Chef / Especialista en Cocina de Mar",
      location: "Playa del Carmen",
    },
  },
];

export const MOCK_ATTENDANCE = [
  {
    id: "att-001",
    employee_id: "emp-001",
    employee: {
      full_name: "María Fernanda Gómez",
      department: "Recursos Humanos",
      job_title: "Coordinadora de RRHH",
    },
    date: new Date().toISOString().split("T")[0],
    check_in: "08:55",
    check_out: null,
    status: "presente",
    work_modality: "presencial",
    location: "Oficina Central",
    created_at: new Date().toISOString(),
  },
  {
    id: "att-002",
    employee_id: "emp-002",
    employee: {
      full_name: "Alejandro Morales Rivera",
      department: "Tecnología",
      job_title: "Desarrollador Fullstack Senior",
    },
    date: new Date().toISOString().split("T")[0],
    check_in: "09:12",
    check_out: null,
    status: "retardo",
    work_modality: "remoto",
    location: "Remoto",
    created_at: new Date().toISOString(),
  },
  {
    id: "att-003",
    employee_id: "emp-003",
    employee: {
      full_name: "Sofía Ramírez Cruz",
      department: "Recepción",
      job_title: "Recepcionista Bilingüe",
    },
    date: new Date().toISOString().split("T")[0],
    check_in: "07:58",
    check_out: null,
    status: "presente",
    work_modality: "presencial",
    location: "Lobby",
    created_at: new Date().toISOString(),
  },
];

export const MOCK_AREAS = [
  {
    id: "area-001",
    company_id: MOCK_COMPANY_ID,
    name: "Recursos Humanos",
    code: "RRHH",
    description: "Gestión estratégica del capital humano y clima laboral",
    employees_count: 1,
    created_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "area-002",
    company_id: MOCK_COMPANY_ID,
    name: "Tecnología e Innovación",
    code: "TECH",
    description: "Infraestructura, desarrollo y soporte de plataformas digitales",
    employees_count: 1,
    created_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "area-003",
    company_id: MOCK_COMPANY_ID,
    name: "Operaciones y Recepción",
    code: "OPS",
    description: "Atención al huésped, conserjería y coordinación operativa",
    employees_count: 1,
    created_at: "2024-01-01T00:00:00.000Z",
  },
];

export const MOCK_INVOICES = [
  {
    id: "inv-001",
    company_id: MOCK_COMPANY_ID,
    amount: 1499,
    status: "paid",
    period: "Octubre 2026",
    pdf_url: "#",
    created_at: "2026-10-01T10:00:00.000Z",
  },
];

export const MOCK_CONTRACTS = [
  {
    id: "con-001",
    company_id: MOCK_COMPANY_ID,
    employee_id: "emp-001",
    contract_type: "indeterminado",
    start_date: "2024-01-15",
    end_date: null,
    status: "active",
    signed_at: "2024-01-15T10:00:00.000Z",
    created_at: "2024-01-15T10:00:00.000Z",
    employee: {
      id: "emp-001",
      full_name: "María Fernanda Gómez",
      job_title: "Coordinadora de Recursos Humanos",
      department: "Recursos Humanos",
    },
  },
];

export const MOCK_INCIDENTS = [
  {
    id: "inc-001",
    company_id: MOCK_COMPANY_ID,
    employee_id: "emp-001",
    type: "permiso",
    title: "Permiso médico IMSS",
    description: "Cita médica programada",
    date: new Date().toISOString().split("T")[0],
    severity: "baja",
    status: "aprobado",
    created_at: new Date().toISOString(),
    employee: {
      full_name: "María Fernanda Gómez",
      department: "Recursos Humanos",
    },
  },
];

export const MOCK_LEAVES = [
  {
    id: "leave-001",
    company_id: MOCK_COMPANY_ID,
    employee_id: "emp-002",
    leave_type: "vacaciones",
    start_date: "2026-11-10",
    end_date: "2026-11-15",
    days_requested: 5,
    status: "aprobado",
    created_at: new Date().toISOString(),
    employee: {
      full_name: "Alejandro Morales Rivera",
      department: "Tecnología",
    },
  },
];

export const MOCK_EVALUATIONS = [
  {
    id: "eval-001",
    company_id: MOCK_COMPANY_ID,
    title: "Evaluación 360° - Q3 2026",
    period: "2026-Q3",
    status: "active",
    type: "desempeno_360",
    created_at: "2026-10-01T10:00:00.000Z",
  },
];

export const MOCK_PAYROLL = [
  {
    id: "pay-001",
    company_id: MOCK_COMPANY_ID,
    period_name: "1ra Quincena Octubre 2026",
    start_date: "2026-10-01",
    end_date: "2026-10-15",
    payment_date: "2026-10-15",
    total_gross: 83000,
    total_net: 71200,
    employees_count: 3,
    status: "calculada",
    created_at: new Date().toISOString(),
  },
];

function getMockTableData(tableName: string, isSingle: boolean): any {
  switch (tableName) {
    case "profiles":
      return isSingle ? MOCK_PROFILE : [MOCK_PROFILE];

    case "company_profiles":
      return isSingle ? MOCK_COMPANY_PROFILE : [MOCK_COMPANY_PROFILE];

    case "vacancies":
      return isSingle ? MOCK_VACANCIES[0] : MOCK_VACANCIES;

    case "company_employees":
      return isSingle ? MOCK_EMPLOYEES[0] : MOCK_EMPLOYEES;

    case "applications":
      return isSingle ? MOCK_APPLICATIONS[0] : MOCK_APPLICATIONS;

    case "company_attendance":
    case "attendance":
      return isSingle ? MOCK_ATTENDANCE[0] : MOCK_ATTENDANCE;

    case "company_areas":
    case "departments":
      return isSingle ? MOCK_AREAS[0] : MOCK_AREAS;

    case "company_invoices":
      return isSingle ? MOCK_INVOICES[0] : MOCK_INVOICES;

    case "company_contracts":
      return isSingle ? MOCK_CONTRACTS[0] : MOCK_CONTRACTS;

    case "company_incidents":
      return isSingle ? MOCK_INCIDENTS[0] : MOCK_INCIDENTS;

    case "company_leaves":
      return isSingle ? MOCK_LEAVES[0] : MOCK_LEAVES;

    case "company_evaluations":
      return isSingle ? MOCK_EVALUATIONS[0] : MOCK_EVALUATIONS;

    case "company_payroll":
    case "payroll_runs":
    case "payroll_items":
      return isSingle ? MOCK_PAYROLL[0] : MOCK_PAYROLL;

    default:
      return isSingle ? null : [];
  }
}

class MockQueryBuilder {
  private tableName: string;
  private isSingle: boolean;

  constructor(tableName: string, isSingle = false) {
    this.tableName = tableName;
    this.isSingle = isSingle;
  }

  select(..._args: any[]) {
    return this;
  }

  insert(..._args: any[]) {
    return this;
  }

  update(..._args: any[]) {
    return this;
  }

  upsert(..._args: any[]) {
    return this;
  }

  delete(..._args: any[]) {
    return this;
  }

  eq(..._args: any[]) {
    return this;
  }

  neq(..._args: any[]) {
    return this;
  }

  gt(..._args: any[]) {
    return this;
  }

  gte(..._args: any[]) {
    return this;
  }

  lt(..._args: any[]) {
    return this;
  }

  lte(..._args: any[]) {
    return this;
  }

  like(..._args: any[]) {
    return this;
  }

  ilike(..._args: any[]) {
    return this;
  }

  is(..._args: any[]) {
    return this;
  }

  in(..._args: any[]) {
    return this;
  }

  contains(..._args: any[]) {
    return this;
  }

  containedBy(..._args: any[]) {
    return this;
  }

  order(..._args: any[]) {
    return this;
  }

  limit(..._args: any[]) {
    return this;
  }

  range(..._args: any[]) {
    return this;
  }

  filter(..._args: any[]) {
    return this;
  }

  match(..._args: any[]) {
    return this;
  }

  or(..._args: any[]) {
    return this;
  }

  textSearch(..._args: any[]) {
    return this;
  }

  abortSignal(..._args: any[]) {
    return this;
  }

  maybeSingle() {
    return new MockQueryBuilder(this.tableName, true);
  }

  single() {
    return new MockQueryBuilder(this.tableName, true);
  }

  then(resolve: (val: any) => void, reject?: (err: any) => void) {
    const rawData = getMockTableData(this.tableName, this.isSingle);
    const result = {
      data: rawData,
      error: null,
      count: Array.isArray(rawData) ? rawData.length : 1,
      status: 200,
      statusText: "OK",
    };
    return Promise.resolve(result).then(resolve, reject);
  }
}

/**
 * Creates a fully functioning in-memory Supabase client for E2E tests.
 */
export function createMockSupabaseClient(): any {
  const mockSession = {
    access_token: "mock-access-token-e2e",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "mock-refresh-token-e2e",
    user: MOCK_USER,
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
      getSession: async () => ({ data: { session: mockSession }, error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            id: "mock-sub",
            callback: () => {},
            unsubscribe: () => {},
          },
        },
      }),
      signInWithPassword: async () => ({ data: { user: MOCK_USER, session: mockSession }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (tableName: string) => new MockQueryBuilder(tableName),
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `/mock-storage/${path}` } }),
        upload: async (path: string) => ({ data: { path }, error: null }),
        download: async () => ({ data: new Blob([]), error: null }),
        remove: async (paths: string[]) => ({ data: paths, error: null }),
      }),
    },
    rpc: (_fnName: string) => new MockQueryBuilder("rpc", true),
    channel: () => ({
      on: function () {
        return this;
      },
      subscribe: function () {
        return this;
      },
      unsubscribe: function () {
        return this;
      },
    }),
    removeChannel: async () => "ok",
    getChannels: () => [],
  };
}
