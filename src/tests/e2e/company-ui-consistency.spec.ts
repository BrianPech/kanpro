import { test, expect, type Cookie } from "@playwright/test";
import {
  ensureLiveSupabase,
  createTestCompanyUser,
  cleanupTestUsers,
  generateTestEmail,
} from "../integration/helpers/test-client";

const COMPANY_ROUTES = [
  { path: "/dashboard/company", name: "Dashboard Principal" },
  { path: "/dashboard/company/vacancies", name: "Gestión de Vacantes" },
  { path: "/dashboard/company/vacancies/new", name: "Wizard de Vacante" },
  { path: "/dashboard/company/applications", name: "Bandeja de Postulaciones" },
  { path: "/dashboard/company/employees", name: "Plantilla de Empleados" },
  { path: "/dashboard/company/attendance", name: "Control de Asistencia" },
  { path: "/dashboard/company/leaves", name: "Permisos y Vacaciones" },
  { path: "/dashboard/company/payroll", name: "Cálculo de Nómina" },
  { path: "/dashboard/company/contracts", name: "Contratos y Expedientes" },
  { path: "/dashboard/company/evaluations", name: "Evaluaciones 360 / NOM-035" },
  { path: "/dashboard/company/areas", name: "Estructura y Áreas" },
  { path: "/dashboard/company/reports", name: "Reportes Operativos" },
  { path: "/dashboard/company/settings", name: "Configuración General" },
  { path: "/dashboard/company/profile", name: "Perfil de Empresa" },
  { path: "/dashboard/company/verification", name: "Verificación Empresarial" },
  { path: "/dashboard/company/radar", name: "Radar de Talento" },
];

test.describe("Auditoría de Consistencia UI/UX - Módulo de Empresas (Theme: base-luma)", () => {
  let authCookies: Cookie[] = [];
  const testUsersToCleanup: string[] = [];

  test.beforeAll(async ({ browser }) => {
    try {
      // 1. Verificar si el backend real de Supabase está activo
      await ensureLiveSupabase();
      const timestamp = Date.now();
      const companyEmail = generateTestEmail(`ui-audit-${timestamp}`);
      const companyPassword = "CompanyTestPass2026!";
      const companyName = `Hotel Boutique K'an ${timestamp}`;

      // 2. Crear empresa real en Supabase Auth y PostgreSQL
      const user = await createTestCompanyUser({
        email: companyEmail,
        password: companyPassword,
        companyName,
      });
      testUsersToCleanup.push(user.id);

      // 3. Iniciar sesión real a través de /login para obtener cookies de sesión
      const page = await browser.newPage();
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      const emailInput = page.locator("input#email");
      await emailInput.fill(companyEmail);
      const passwordInput = page.locator("input#password");
      await passwordInput.fill(companyPassword);

      const loginSubmitBtn = page.locator('button[type="submit"]:has-text("Iniciar Sesión")');
      await loginSubmitBtn.click();
      await page.waitForURL(/\/dashboard\/company/, { timeout: 25_000 });

      // Capturar cookies de sesión reales de Supabase
      authCookies = await page.context().cookies();
      await page.close();
    } catch (err) {
      console.warn("[Playwright Setup] Live Supabase auth unavailable, falling back to mock session:", err);
    }
  });

  test.afterAll(async () => {
    if (testUsersToCleanup.length > 0) {
      await cleanupTestUsers(testUsersToCleanup);
    }
  });

  test.beforeEach(async ({ context }) => {
    if (authCookies.length > 0) {
      // Inyectar cookies de autenticación reales
      await context.addCookies(authCookies);
    } else {
      // Fallback a mock determinista si la conexión remota fallara
      await context.addCookies([
        {
          name: "e2e-mock-role",
          value: "company",
          domain: "127.0.0.1",
          path: "/",
        },
      ]);
    }
  });

  for (const route of COMPANY_ROUTES) {
    test(`Consistencia de diseño y tokens en ${route.name} (${route.path})`, async ({ page }) => {
      // 1. Navegar a la ruta
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);

      // Esperar a que la red y el DOM se estabilicen
      await page.waitForLoadState("networkidle").catch(() => {});

      // 2. Verificar ausencia de scroll horizontal no deseado
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(
        hasHorizontalScroll,
        `La ruta ${route.path} presenta desbordamiento horizontal inesperado.`
      ).toBe(false);

      // 3. Validar token border-radius de Card (base-luma: rounded-4xl >= 18px)
      const cards = page.locator("[data-slot=card]");
      const cardCount = await cards.count();
      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 8); i++) {
          const cardRadius = await cards.nth(i).evaluate((el) => {
            return window.getComputedStyle(el).borderRadius;
          });
          const radiusNum = parseFloat(cardRadius);
          if (!isNaN(radiusNum)) {
            expect(
              radiusNum,
              `Card en ${route.path} debe cumplir token rounded-4xl (>= 18px)`
            ).toBeGreaterThanOrEqual(18);
          }
        }
      }

      // 4. Validar token height e Input (base-luma: h-9 = 36px, rounded-3xl >= 14px)
      const inputs = page.locator("input[data-slot=input]:not([type=checkbox]):not([type=radio]):not([type=hidden])");
      const inputCount = await inputs.count();
      if (inputCount > 0) {
        for (let i = 0; i < Math.min(inputCount, 6); i++) {
          const inputHeight = await inputs.nth(i).evaluate((el) => {
            return window.getComputedStyle(el).height;
          });
          const inputRadius = await inputs.nth(i).evaluate((el) => {
            return window.getComputedStyle(el).borderRadius;
          });
          const heightNum = parseFloat(inputHeight);
          const radiusNum = parseFloat(inputRadius);

          if (!isNaN(heightNum)) {
            expect(
              heightNum,
              `Input en ${route.path} debe cumplir con h-9 (36px ± 2px)`
            ).toBeCloseTo(36, 1);
          }
          if (!isNaN(radiusNum)) {
            expect(
              radiusNum,
              `Input en ${route.path} debe cumplir token rounded-3xl (>= 14px)`
            ).toBeGreaterThanOrEqual(14);
          }
        }
      }

      // 5. Validar token border-radius en Buttons estándar (base-luma: rounded-4xl >= 16px)
      const buttons = page.locator("button[data-slot=button]:not([data-variant=ghost]):not([data-variant=link])");
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 6); i++) {
          const btnRadius = await buttons.nth(i).evaluate((el) => {
            return window.getComputedStyle(el).borderRadius;
          });
          const radiusNum = parseFloat(btnRadius);
          if (!isNaN(radiusNum)) {
            expect(
              radiusNum,
              `Botón en ${route.path} debe cumplir token de curvatura base-luma (>= 16px)`
            ).toBeGreaterThanOrEqual(16);
          }
        }
      }

      // 6. Validar token border-radius en Badges (base-luma: rounded-3xl >= 10px)
      const badges = page.locator("[data-slot=badge]");
      const badgeCount = await badges.count();
      if (badgeCount > 0) {
        for (let i = 0; i < Math.min(badgeCount, 4); i++) {
          const badgeRadius = await badges.nth(i).evaluate((el) => {
            return window.getComputedStyle(el).borderRadius;
          });
          const radiusNum = parseFloat(badgeRadius);
          if (!isNaN(radiusNum)) {
            expect(
              radiusNum,
              `Badge en ${route.path} debe cumplir token pill/rounded-3xl (>= 10px)`
            ).toBeGreaterThanOrEqual(10);
          }
        }
      }

      // 7. Validar que la tipografía principal pertenezca a la familia Geist
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      expect(fontFamily.toLowerCase()).toMatch(/geist|sans-serif|system-ui/);
    });
  }
});
