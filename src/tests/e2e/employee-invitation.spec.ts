import { test, expect } from "@playwright/test";
import crypto from "crypto";
import {
  ensureLiveSupabase,
  getAdminClient,
  createTestCompanyUser,
  createAuthenticatedClient,
  cleanupTestUsers,
  generateTestEmail,
} from "../integration/helpers/test-client";

test.describe("[REAL E2E] Flujo Completo de Employee Invitation & Onboarding", () => {
  const usersToCleanup: string[] = [];
  const admin = getAdminClient();

  test.beforeAll(async () => {
    // Fail loudly if real Supabase stack is unreachable
    await ensureLiveSupabase();
  });

  test.afterAll(async () => {
    // Cascade cleanup of all created test users
    await cleanupTestUsers(usersToCleanup);
  });

  test("flujo completo: Empresa invita colaborador -> Empleado acepta y se registra -> Trigger vincula cuenta en PostgreSQL -> RLS aísla registros", async ({
    page,
    browser,
  }) => {
    const timestamp = Date.now();
    const companyPassword = "CompanyTestPass2026!";
    const candidatePassword = "EmployeeTestPass2026!";

    const companyEmail = generateTestEmail(`company-${timestamp}`);
    const candidateEmail = generateTestEmail(`employee-${timestamp}`);
    const candidateFullName = `Carlos Mendoza E2E ${timestamp}`;
    const companyName = `Hotel Boutique K'an ${timestamp}`;

    // 1. SETUP: Crear Empresa Real en Supabase Auth & PostgreSQL
    const companyUser = await createTestCompanyUser({
      email: companyEmail,
      password: companyPassword,
      companyName,
    });
    usersToCleanup.push(companyUser.id);

    // =========================================================================
    // COMPANY FLOW (UI REAL)
    // =========================================================================

    // 2. Navegar a /login e iniciar sesión como la empresa
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/Iniciar Sesión|K'anPro/i);

    const emailInput = page.locator("input#email");
    await expect(emailInput).toBeVisible();
    await emailInput.click();
    await emailInput.fill(companyEmail);
    await expect(emailInput).toHaveValue(companyEmail);

    const passwordInput = page.locator("input#password");
    await expect(passwordInput).toBeVisible();
    await passwordInput.click();
    await passwordInput.fill(companyPassword);
    await expect(passwordInput).toHaveValue(companyPassword);

    const loginSubmitBtn = page.locator('button[type="submit"]:has-text("Iniciar Sesión")');
    await expect(loginSubmitBtn).toBeEnabled();
    await loginSubmitBtn.click();

    // Esperar redirección al dashboard de la empresa
    await expect(page).toHaveURL(/\/dashboard\/company/, { timeout: 25_000 });

    // 3. Navegar a la sección de colaboradores
    await page.goto("/dashboard/company/employees");
    await page.waitForLoadState("networkidle");

    // 4. Abrir modal "Registrar Empleado"
    const registerBtn = page.locator('button').filter({ hasText: /Registrar (Empleado|Colaborador)/i }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // 5. Verificar que el modal se abrió y completar los datos del colaborador
    const modalTitle = page.locator("text=Alta de Colaboradores");
    await expect(modalTitle).toBeVisible();

    const nameInput = page.locator("input#full_name");
    await nameInput.fill(candidateFullName);
    await expect(nameInput).toHaveValue(candidateFullName);

    const candEmailInput = page.locator("input#email");
    await candEmailInput.fill(candidateEmail);
    await expect(candEmailInput).toHaveValue(candidateEmail);

    const posInput = page.locator("input#position");
    await posInput.fill("Mixólogo Especialista");
    await expect(posInput).toHaveValue("Mixólogo Especialista");

    await page.fill("input#phone", "9981234567");
    await page.fill("input#salary", "24500");

    // 6. Enviar formulario para crear la invitación y el registro de colaborador
    const submitInviteBtn = page.locator('button:has-text("Guardar e Invitar Colaborador")');
    await expect(submitInviteBtn).toBeVisible();
    await submitInviteBtn.click();

    // 7. Verificar en la UI que la invitación fue creada exitosamente
    await expect(
      page.getByRole("heading", { name: /¡Invitación Generada/i })
    ).toBeVisible({ timeout: 15_000 });

    // 8. Extraer el enlace y token generado mostrado en el input de la UI
    const inviteLinkInput = page.locator('input[readonly][value*="/invite/"]');
    await expect(inviteLinkInput).toBeVisible();
    const inviteUrlValue = await inviteLinkInput.inputValue();
    expect(inviteUrlValue).toContain("/invite/");

    // Extraer rawToken de la URL
    const rawToken = inviteUrlValue.split("/invite/")[1]?.trim();
    expect(rawToken).toBeDefined();
    expect(rawToken.length).toBeGreaterThanOrEqual(20);

    // Cerrar el modal mediante "Finalizar y Ver Plantilla"
    const finishBtn = page.locator('button:has-text("Finalizar y Ver Plantilla")');
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
    }

    // 9. Verificar en la UI de la Empresa: pestaña "Invitaciones"
    const invitationsTab = page.locator('button:has-text("Invitaciones")');
    await expect(invitationsTab).toBeVisible();
    await invitationsTab.click();

    // Comprobar que en la lista de invitaciones figura el colaborador con estado Enviada / Pendiente
    await expect(page.locator(`text=${candidateFullName}`).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(`text=${candidateEmail}`).first()).toBeVisible();
    await expect(page.locator("text=Enviada").or(page.locator("text=Pendiente")).first()).toBeVisible();

    // =========================================================================
    // EMPLOYEE FLOW (UI REAL EN CONTEXTO AISLADO)
    // =========================================================================

    // 10. Crear un nuevo contexto de navegador limpio (sin cookies de la empresa)
    const employeeContext = await browser.newContext();
    const employeePage = await employeeContext.newPage();

    // Abrir la URL real de la invitación
    await employeePage.goto(`/invite/${rawToken}`);
    await employeePage.waitForLoadState("networkidle");

    // 11. Verificar que la página de invitación muestra los datos reales
    await expect(employeePage.locator(`text=${companyName}`)).toBeVisible();
    await expect(employeePage.locator("text=Mixólogo Especialista")).toBeVisible();
    await expect(employeePage.locator(`input#email`)).toHaveValue(candidateEmail);

    // 12. Completar el formulario de aceptación y registro de cuenta
    const candNameInput = employeePage.locator("input#fullName");
    await candNameInput.fill(candidateFullName);
    await expect(candNameInput).toHaveValue(candidateFullName);

    const birthInput = employeePage.locator("input#birthDate");
    await birthInput.fill("1995-06-20");
    await expect(birthInput).toHaveValue("1995-06-20");

    const phoneInput = employeePage.locator("input#whatsappNumber");
    await phoneInput.fill("9987654321");

    const candPassInput = employeePage.locator("input#password");
    await candPassInput.fill(candidatePassword);
    await expect(candPassInput).toHaveValue(candidatePassword);

    const candConfirmPassInput = employeePage.locator("input#confirmPassword");
    await candConfirmPassInput.fill(candidatePassword);
    await expect(candConfirmPassInput).toHaveValue(candidatePassword);

    // 13. Enviar registro
    const registerEmployeeBtn = employeePage.locator('button:has-text("Completar Registro y Unirme al Equipo")');
    await expect(registerEmployeeBtn).toBeVisible();
    await registerEmployeeBtn.click();

    // 14. Verificar mensaje de bienvenida o redirección
    await expect(
      employeePage
        .locator(`text=¡Bienvenido a ${companyName}!`)
        .or(employeePage.locator("text=¡Registro completado!"))
        .or(employeePage.locator("text=Tu perfil ha sido vinculado exitosamente"))
        .first()
    ).toBeVisible({ timeout: 20_000 });

    // =========================================================================
    // VALIDACIÓN POST-E2E EN BASE DE DATOS REAL (POSTGRESQL)
    // =========================================================================

    // 15. Consultar usuario candidato creado en Supabase Auth
    const { data: authUsers, error: listAuthErr } = await admin.auth.admin.listUsers();
    expect(listAuthErr).toBeNull();
    const createdCandidate = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === candidateEmail.toLowerCase()
    );
    expect(createdCandidate).toBeDefined();
    const candidateUserId = createdCandidate!.id;
    usersToCleanup.push(candidateUserId);

    // 16. Verificar public.profiles
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("*")
      .eq("id", candidateUserId)
      .single();
    expect(profErr).toBeNull();
    expect(profile.role).toBe("candidate");
    expect(profile.email?.toLowerCase()).toBe(candidateEmail.toLowerCase());

    // 17. Verificar public.candidate_profiles (generado por el trigger antes del fkey check)
    const { data: candProfile, error: candProfErr } = await admin
      .from("candidate_profiles")
      .select("*")
      .eq("id", candidateUserId)
      .single();
    expect(candProfErr).toBeNull();
    expect(candProfile).toBeDefined();
    expect(candProfile.id).toBe(candidateUserId);

    // 18. Verificar public.company_employees (vinculado al UUID real y activado)
    const { data: employeeRecord, error: empRecordErr } = await admin
      .from("company_employees")
      .select("*")
      .eq("company_id", companyUser.id)
      .eq("employee_id", candidateUserId)
      .single();
    expect(empRecordErr).toBeNull();
    expect(employeeRecord).toBeDefined();
    expect(employeeRecord.status).toBe("active");
    expect(employeeRecord.employee_id).toBe(candidateUserId);
    expect(employeeRecord.company_id).toBe(companyUser.id);
    expect(employeeRecord.full_name).toContain("Carlos Mendoza");

    // 19. Verificar public.employee_invitations (transicionado a 'accepted')
    const { data: updatedInv, error: invCheckErr } = await admin
      .from("employee_invitations")
      .select("*")
      .eq("company_id", companyUser.id)
      .eq("email", candidateEmail)
      .single();
    expect(invCheckErr).toBeNull();
    expect(updatedInv).toBeDefined();
    expect(updatedInv.status).toBe("accepted");
    expect(updatedInv.accepted_at).not.toBeNull();

    // 20. Verificar notificación recibida por la empresa
    const { data: notif, error: notifErr } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", companyUser.id)
      .eq("type", "employee_joined")
      .maybeSingle();
    expect(notifErr).toBeNull();
    expect(notif).toBeDefined();
    expect(notif?.description).toContain(candidateFullName);

    // =========================================================================
    // VALIDACIÓN POST-E2E DE AISLAMIENTO RLS (COMPANY A vs COMPANY B)
    // =========================================================================

    // 21. Crear e iniciar sesión como Company B
    const companyBPassword = "CompanyB-Pass-2026!";
    const companyBUser = await createTestCompanyUser({
      email: generateTestEmail("company-b-isolation"),
      password: companyBPassword,
      companyName: "Empresa Competidora S.A.",
    });
    usersToCleanup.push(companyBUser.id);

    // Obtener clientes autenticados reales bajo RLS
    const { client: clientA } = await createAuthenticatedClient(companyEmail, companyPassword);
    const { client: clientB } = await createAuthenticatedClient(companyBUser.email, companyBPassword);

    // Company A debe poder ver al colaborador en su plantilla
    const { data: employeesA, error: errA } = await clientA
      .from("company_employees")
      .select("id, employee_id, full_name, company_id");
    expect(errA).toBeNull();
    expect(employeesA?.some((e) => e.employee_id === candidateUserId)).toBe(true);

    // Company B NO debe ver al colaborador de Company A
    const { data: employeesB, error: errB } = await clientB
      .from("company_employees")
      .select("id, employee_id, full_name, company_id");
    expect(errB).toBeNull();
    expect(employeesB?.some((e) => e.employee_id === candidateUserId)).toBe(false);

    // Company B intenta SELECT directo por ID en company_employees de Company A -> PostgREST devuelve null
    const { data: leakCheck, error: leakErr } = await clientB
      .from("company_employees")
      .select("*")
      .eq("id", employeeRecord.id)
      .maybeSingle();
    expect(leakErr).toBeNull();
    expect(leakCheck).toBeNull();

    // Cerrar contexto de empleado
    await employeeContext.close();
  });

  test("escenario negativo 1: intento de abrir un token inexistente / inválido muestra estado de error en UI", async ({
    page,
  }) => {
    // Navegar con un token no existente de longitud adecuada
    const bogusToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    await page.goto(`/invite/${bogusToken}`);
    await page.waitForLoadState("networkidle");

    // Verificar en la UI que muestra el estado de error
    await expect(page.locator("text=Invitación no disponible")).toBeVisible();
    await expect(
      page.locator("text=La invitación no existe o el enlace ha caducado.")
        .or(page.locator("text=No fue posible validar este enlace de invitación."))
    ).toBeVisible();

    // Verificar que existe el botón para ir a login
    await expect(page.locator('button:has-text("Ir al Inicio de Sesión")')).toBeVisible();
  });

  test("escenario negativo 2: intento de utilizar una invitación expirada muestra aviso en UI y no vincula", async ({
    page,
  }) => {
    const expiredRawToken = crypto.randomBytes(32).toString("hex");
    const expiredTokenHash = crypto.createHash("sha256").update(expiredRawToken).digest("hex");
    const expiredCandidateEmail = generateTestEmail("expired-e2e");

    // Preparar empresa
    const tempCompany = await createTestCompanyUser({
      email: generateTestEmail("expired-company"),
      companyName: "Hotel Luna Azul",
    });
    usersToCleanup.push(tempCompany.id);

    // Insertar invitación expirada (hace 3 días)
    const { data: inv, error: invErr } = await admin
      .from("employee_invitations")
      .insert({
        company_id: tempCompany.id,
        email: expiredCandidateEmail,
        full_name: "Persona Expirada",
        position: "Ayudante",
        status: "pending",
        token_hash: expiredTokenHash,
        expires_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    expect(invErr).toBeNull();
    expect(inv).toBeDefined();

    // Navegar a la página con el token expirado
    await page.goto(`/invite/${expiredRawToken}`);
    await page.waitForLoadState("networkidle");

    // Verificar que la UI muestra explícitamente "Invitación expirada"
    await expect(page.locator("text=Invitación expirada")).toBeVisible();
    await expect(page.locator("text=Este enlace de invitación ha vencido")).toBeVisible();
  });

  test("escenario negativo 3: intento de utilizar una invitación cancelada muestra aviso en UI", async ({
    page,
  }) => {
    const cancelledRawToken = crypto.randomBytes(32).toString("hex");
    const cancelledTokenHash = crypto.createHash("sha256").update(cancelledRawToken).digest("hex");
    const cancelledCandidateEmail = generateTestEmail("cancelled-e2e");

    // Preparar empresa
    const tempCompany = await createTestCompanyUser({
      email: generateTestEmail("cancelled-company"),
      companyName: "Playa Paraíso Resorts",
    });
    usersToCleanup.push(tempCompany.id);

    // Insertar invitación cancelada
    const { data: inv, error: invErr } = await admin
      .from("employee_invitations")
      .insert({
        company_id: tempCompany.id,
        email: cancelledCandidateEmail,
        full_name: "Persona Cancelada",
        position: "Seguridad",
        status: "cancelled",
        token_hash: cancelledTokenHash,
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    expect(invErr).toBeNull();
    expect(inv).toBeDefined();

    // Navegar a la página con el token cancelado
    await page.goto(`/invite/${cancelledRawToken}`);
    await page.waitForLoadState("networkidle");

    // Verificar que la UI muestra explícitamente "Invitación cancelada"
    await expect(page.locator("text=Invitación cancelada")).toBeVisible();
    await expect(page.locator("text=Esta invitación fue cancelada por la empresa emisora.")).toBeVisible();
  });
});
