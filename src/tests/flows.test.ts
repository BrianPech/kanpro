import { describe, test, expect, vi, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { getCoordsForZone, GEO_CONFIG } from "@/config/geo";
import { calculateHaversineDistance } from "@/hooks/use-geolocation";

// -------------------------------------------------------------
// 1. CONFIGURACIÓN Y MOCKS PARA LAS SERVER ACTIONS Y ROUTING
// -------------------------------------------------------------

// Mock de next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}));

// Mock de next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

// Mock de Supabase Server Client para la Server Action
const mockServerSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockServerSupabase)),
}));

// Importar la Server Action después de definir los mocks correspondientes
import { toggleCandidateVerification } from "@/app/(dashboard)/dashboard/admin/actions";

// -------------------------------------------------------------
// 2. CLIENTE SUPABASE DE INTEGRACIÓN (BASE DE DATOS REAL LOCAL)
// -------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Creamos un cliente admin con la Service Role Key para poder gestionar usuarios y omitir políticas RLS en la preparación
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

describe("K'anPro Integration and Functional Test Suite", () => {
  // Lista de IDs de usuarios creados en las pruebas para su posterior limpieza por cascada
  const createdUserIds: string[] = [];

  beforeAll(() => {
    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno.");
    }
  });

  afterAll(async () => {
    // Limpieza por cascada: eliminando los usuarios creados de Auth se borran sus perfiles
    for (const userId of createdUserIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (err) {
        console.error(`Error limpiando usuario ${userId}:`, err);
      }
    }
  });

  // -------------------------------------------------------------
  // FLUJO 1: ONBOARDING EXPRESS E INTERCEPCIÓN DE RUTAS
  // -------------------------------------------------------------
  describe("Flujo 1: Onboarding Express e Intercepción de Rutas", () => {
    let testCandidateId: string;
    const candidateEmail = `candidate-onboard-${Date.now()}@kanpro.test`;
    const password = "PasswordSecure123!";

    test("Caso A: El registro dispara el trigger de DB y el Route Guard detecta 'location' vacío", async () => {
      // 1. Crear nuevo usuario en Auth con rol candidate
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: candidateEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "candidate",
          full_name: "Candidato Test Interceptor",
        },
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();
      testCandidateId = authData.user!.id;
      createdUserIds.push(testCandidateId);

      // 2. Verificar que el trigger handle_new_auth_user se disparó e insertó el perfil
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("profiles_private")
        .select("role, location")
        .eq("id", testCandidateId)
        .single();

      expect(profileErr).toBeNull();
      expect(profile).toBeDefined();
      expect(profile!.role).toBe("candidate");
      expect(profile!.location).toBeNull(); // Inicialmente vacío

      // 3. Simular el Route Guard del layout (DashboardTopLayout)
      const evaluateRouteGuard = (role: string, locationStr: string | null) => {
        const loc = locationStr || "";
        const hasLocation = loc.includes(" - ");
        if ((role === "candidate" || role === "company") && !hasLocation) {
          return { shouldRedirect: true, destination: "/onboarding" };
        }
        return { shouldRedirect: false };
      };

      const guardResult = evaluateRouteGuard(profile!.role, profile!.location);
      expect(guardResult.shouldRedirect).toBe(true);
      expect(guardResult.destination).toBe("/onboarding");
    });

    test("Caso B: En /onboarding se guarda 'Mérida - Altabrisa', se levanta bloqueo y redirige", async () => {
      // 1. Crear cliente firmado como el candidato para validar permisos RLS
      const candidateClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      // Login del candidato
      const { error: signInErr } = await candidateClient.auth.signInWithPassword({
        email: candidateEmail,
        password,
      });
      expect(signInErr).toBeNull();

      // 2. Simular submit del formulario de Onboarding ("Mérida" y "Altabrisa")
      const city = "Mérida";
      const zone = "Altabrisa";
      const locationStr = `${city} - ${zone}`;

      // Actualizar a través de la vista pública 'profiles' (usa trigger INSTEAD OF UPDATE)
      const { error: updateErr } = await candidateClient
        .from("profiles")
        .update({ location: locationStr })
        .eq("id", testCandidateId);

      expect(updateErr).toBeNull();

      // 3. Validar que se guardó exactamente como "Mérida - Altabrisa"
      const { data: updatedProfile, error: fetchErr } = await supabaseAdmin
        .from("profiles_private")
        .select("location")
        .eq("id", testCandidateId)
        .single();

      expect(fetchErr).toBeNull();
      expect(updatedProfile!.location).toBe("Mérida - Altabrisa");

      // 4. Evaluar el Route Guard de nuevo con la nueva ubicación
      const evaluateRouteGuardAfter = (role: string, locationStr: string | null) => {
        const loc = locationStr || "";
        const hasLocation = loc.includes(" - ");
        if ((role === "candidate" || role === "company") && !hasLocation) {
          return { shouldRedirect: true, destination: "/onboarding" };
        }
        // Determinar a qué dashboard debe ser enviado
        const destination = role === "company" ? "/dashboard/company/radar" : "/dashboard/candidate/discovery";
        return { shouldRedirect: false, destination };
      };

      const guardResultAfter = evaluateRouteGuardAfter("candidate", updatedProfile!.location);
      expect(guardResultAfter.shouldRedirect).toBe(false);
      expect(guardResultAfter.destination).toBe("/dashboard/candidate/discovery");
    });
  });

  // -------------------------------------------------------------
  // FLUJO 2: RADAR GEOLOCALIZADO E HÍBRIDO (MÉRIDA VS. PLAYA)
  // -------------------------------------------------------------
  describe("Flujo 2: Radar Geolocalizado e Híbrido", () => {
    let companyId: string;
    let candidateMéridaId: string;
    let candidatePlayaId: string;

    const companyEmail = `company-radar-${Date.now()}@kanpro.test`;
    const candidateMeridaEmail = `candidate-merida-${Date.now()}@kanpro.test`;
    const candidatePlayaEmail = `candidate-playa-${Date.now()}@kanpro.test`;
    const password = "PasswordSecure123!";

    beforeAll(async () => {
      // 1. Crear empresa en Playa del Carmen
      const { data: compAuth } = await supabaseAdmin.auth.admin.createUser({
        email: companyEmail,
        password,
        email_confirm: true,
        user_metadata: { role: "company", full_name: "Empresa Riviera" },
      });
      companyId = compAuth.user!.id;
      createdUserIds.push(companyId);

      // Registrar perfil extendido en la tabla company_profiles para sincronizar ubicación
      const { error: compErr } = await supabaseAdmin
        .from("company_profiles")
        .insert({
          id: companyId,
          company_name: "Empresa Riviera",
          location: "Playa del Carmen - Centro",
        });
      expect(compErr).toBeNull();

      // 2. Crear candidato Mérida
      const { data: candMeridaAuth } = await supabaseAdmin.auth.admin.createUser({
        email: candidateMeridaEmail,
        password,
        email_confirm: true,
        user_metadata: { role: "candidate", full_name: "Candidato Mérida" },
      });
      candidateMéridaId = candMeridaAuth.user!.id;
      createdUserIds.push(candidateMéridaId);
      await supabaseAdmin
        .from("profiles_private")
        .update({ location: "Mérida - Altabrisa" })
        .eq("id", candidateMéridaId);

      // 3. Crear candidato Playa del Carmen
      const { data: candPlayaAuth } = await supabaseAdmin.auth.admin.createUser({
        email: candidatePlayaEmail,
        password,
        email_confirm: true,
        user_metadata: { role: "candidate", full_name: "Candidato Playa" },
      });
      candidatePlayaId = candPlayaAuth.user!.id;
      createdUserIds.push(candidatePlayaId);
      await supabaseAdmin
        .from("profiles_private")
        .update({ location: "Playa del Carmen - Villas del Sol" })
        .eq("id", candidatePlayaId);
    });

    test("Caso A: La consulta de Supabase al Radar filtra duro por ciudad de la empresa", async () => {
      // Determinar la ciudad de la empresa (Playa del Carmen)
      const companyLocation = "Playa del Carmen - Centro";
      const parts = companyLocation.split(" - ");
      const companyCity = parts[0]; // "Playa del Carmen"

      // Simular la consulta del Radar de Talentos (candidate-radar.tsx)
      let query = supabaseAdmin
        .from("profiles")
        .select("id, full_name, location")
        .eq("role", "candidate");

      if (companyCity) {
        query = query.ilike("location", `%${companyCity}%`);
      }

      const { data: candidates, error } = await query;
      expect(error).toBeNull();
      expect(candidates).toBeDefined();

      // Verificar que EXCLUSIVAMENTE retorne candidatos de Playa del Carmen
      expect(candidates!.length).toBeGreaterThan(0);
      candidates!.forEach((c) => {
        expect(c.location).toContain("Playa del Carmen");
        expect(c.location).not.toContain("Mérida");
      });
    });

    test("Caso B: Coordenadas GPS válidas ordenan candidatos ascendentemente con fórmula de Haversine", () => {
      // Simular coordenadas del GPS del navegador del reclutador (Playa del Carmen - Centro)
      const recruiterCoords = { lat: 20.6296, lng: -87.0739 };

      // Candidatos simulados con diferentes zonas
      const mockCandidates = [
        { name: "Candidato Villas del Sol", location: "Playa del Carmen - Villas del Sol" },
        { name: "Candidato Centro", location: "Playa del Carmen - Centro" },
      ];

      // Calcular distancias y verificar el ordenamiento asc
      const sortedCandidates = mockCandidates.map((c) => {
        const candidateCoords = getCoordsForZone(c.location);
        expect(candidateCoords).not.toBeNull();
        
        const distance = calculateHaversineDistance(recruiterCoords, candidateCoords!);
        const distanceBadge = `${distance.toFixed(1)} km`;

        return {
          ...c,
          distance,
          distanceBadge,
        };
      }).sort((a, b) => a.distance - b.distance);

      // Candidato Centro está en Centro Playa (lat: 20.6296, lng: -87.0739), distancia debe ser 0.0 km
      expect(sortedCandidates[0].name).toBe("Candidato Centro");
      expect(sortedCandidates[0].distanceBadge).toBe("0.0 km");

      // Candidato Villas del Sol debe estar más lejano
      expect(sortedCandidates[1].name).toBe("Candidato Villas del Sol");
      expect(sortedCandidates[1].distance).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------
  // FLUJO 3: MÉTRICA NORTE Y CONEXIÓN SIMÉTRICA DE WHATSAPP
  // -------------------------------------------------------------
  describe("Flujo 3: Métrica Norte y Conexión Simétrica de WhatsApp", () => {
    let companyId: string;
    let candidateId: string;
    const companyEmail = `company-conn-${Date.now()}@kanpro.test`;
    const candidateEmail = `candidate-conn-${Date.now()}@kanpro.test`;
    const password = "PasswordSecure123!";
    const realPhone = "+52 999 123 4567";

    // Clientes de Supabase para simular diferentes roles autenticados
    const companyClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    beforeAll(async () => {
      // 1. Crear empresa
      const { data: compAuth } = await supabaseAdmin.auth.admin.createUser({
        email: companyEmail,
        password,
        email_confirm: true,
        user_metadata: { role: "company", full_name: "Reclutador Conexión" },
      });
      companyId = compAuth.user!.id;
      createdUserIds.push(companyId);
      await supabaseAdmin
        .from("company_profiles")
        .insert({ id: companyId, company_name: "Empresa Reclutadora", location: "Mérida - Centro" });

      // 2. Crear candidato con teléfono y show_phone = false (oculto por defecto)
      const { data: candAuth } = await supabaseAdmin.auth.admin.createUser({
        email: candidateEmail,
        password,
        email_confirm: true,
        user_metadata: { role: "candidate", full_name: "Candidato WhatsApp" },
      });
      candidateId = candAuth.user!.id;
      createdUserIds.push(candidateId);

      await supabaseAdmin
        .from("profiles_private")
        .update({
          phone: realPhone,
          whatsapp_number: realPhone,
          show_phone: false,
          location: "Mérida - Centro Mérida",
        })
        .eq("id", candidateId);

      // Iniciar sesión del cliente empresa
      await companyClient.auth.signInWithPassword({ email: companyEmail, password });
    });

    test("Caso A: Flujo completo de Conexión, RLS y URL de WhatsApp", async () => {
      // 1. Query inicial: La empresa NO tiene conexión, por ende el RLS debe retornar phone = null
      const { data: pBefore, error: errBefore } = await companyClient
        .from("profiles")
        .select("phone, whatsapp_number")
        .eq("id", candidateId)
        .single();

      expect(errBefore).toBeNull();
      expect(pBefore!.phone).toBeNull();
      expect(pBefore!.whatsapp_number).toBeNull();

      // 2. Simular inserción en la tabla de 'connections' (clic a contactar)
      const { error: insertErr } = await companyClient
        .from("connections")
        .insert({
          candidate_id: candidateId,
          recruiter_id: companyId,
          status: "contacted",
          initiated_by: "company",
        });

      expect(insertErr).toBeNull();

      // 3. Query posterior: Al existir la fila en 'connections', la vista con security_invoker desoculta el teléfono
      const { data: pAfter, error: errAfter } = await companyClient
        .from("profiles")
        .select("full_name, phone, whatsapp_number")
        .eq("id", candidateId)
        .single();

      expect(errAfter).toBeNull();
      expect(pAfter!.phone).toBe(realPhone);
      expect(pAfter!.whatsapp_number).toBe(realPhone);

      // 4. Validar construcción del hook: URL universal de WhatsApp Web
      const targetPhone = pAfter!.phone || pAfter!.whatsapp_number;
      expect(targetPhone).toBeDefined();

      const cleanPhone = targetPhone!.replace(/[^0-9]/g, "");
      const message = `¡Hola ${pAfter!.full_name}! Vi tu perfil verificado en K’anPro y me interesó tu perfil. ¿Podríamos conversar sobre una oportunidad?`;
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      expect(cleanPhone).toBe("529991234567");
      expect(whatsappUrl).toContain("https://wa.me/529991234567");
      expect(whatsappUrl).toContain(encodeURIComponent(pAfter!.full_name));
    });

    test("Caso B: Candidato puede iniciar una conexión con la empresa y el RLS lo permite", async () => {
      const candidateClientInstance = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Iniciar sesión del candidato
      const { error: signInErr } = await candidateClientInstance.auth.signInWithPassword({
        email: candidateEmail,
        password,
      });
      expect(signInErr).toBeNull();

      // Limpiar conexiones previas hechas por el candidato en la base de datos para no violar restricciones si existieran
      await supabaseAdmin.from("connections").delete().eq("candidate_id", candidateId);

      // Registrar una conexión como candidato
      const { error: insertErr } = await candidateClientInstance
        .from("connections")
        .insert({
          candidate_id: candidateId,
          recruiter_id: companyId,
          status: "contacted",
          initiated_by: "candidate",
        });

      expect(insertErr).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // FLUJO 4: CONSOLA DE ADMINISTRACIÓN Y SERVER ACTIONS
  // -------------------------------------------------------------
  describe("Flujo 4: Consola de Administración y Server Actions", () => {
    const candidateProfileId = "candidate-uuid-1234";

    test("Caso A: Rechazo inmediato de la Server Action si el rol es candidate o company", async () => {
      // Mockear la sesión en createClient de servidor para que devuelva un usuario no administrador (ej. 'candidate')
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "non-admin-user-id" } },
        error: null,
      });

      mockServerSupabase.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { role: "candidate" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Ejecutar y validar que arroje error de acceso denegado
      await expect(toggleCandidateVerification(candidateProfileId, true)).rejects.toThrow(
        "Acceso denegado: Se requieren permisos de administrador."
      );

      // Verificar que NO se haya llamado a revalidatePath
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    test("Caso B: Éxito de la Server Action si el rol es admin, muta DB y revalida la cache", async () => {
      // Reiniciar mocks
      mockRevalidatePath.mockClear();

      // Mockear la sesión para que devuelva un usuario administrador ('admin')
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-user-id" } },
        error: null,
      });

      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockServerSupabase.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { role: "admin" },
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      // Invocar la Server Action
      const result = await toggleCandidateVerification(candidateProfileId, true);

      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({ is_validated: true });
      expect(mockEq).toHaveBeenCalledWith("id", candidateProfileId);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/admin");
    });
  });
});
