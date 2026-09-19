# K'anPro — Suite E2E Real: Flujo Completo de Employee Invitation

## 1. Resumen Ejecutivo y Estado Final

La suite de pruebas End-to-End (E2E) para el flujo de **Employee Invitation y Onboarding** de K'anPro ejecuta pruebas reales desde la perspectiva del usuario mediante **Playwright** y un navegador **Chromium** vivo, validando la interacción con la interfaz gráfica, el sistema de autenticación de Supabase GoTrue, los Server Actions de Next.js, las funciones y triggers de PostgreSQL, y las políticas de aislamiento de Row Level Security (RLS).

### Métricas de Validación

```text
Unit Tests:
  57/57 PASS

Integration Tests (Validado tras reset limpio de DB):
  23/23 PASS

E2E Tests (Playwright / Chromium Real):
  4/4 PASS

TypeScript (tsc --noEmit):
  PASS (0 errors)

ESLint (eslint):
  PASS (0 errors en código y tests relacionados)
```

---

## 2. Prueba de Autenticidad de los Tests (Zero Mocks)

Todos los tests de esta suite han sido certificados bajo los siguientes parámetros de ejecución real:

```text
DB: REAL (PostgreSQL 17 local en puerto 54322)
Supabase: REAL (Kong, GoTrue, PostgREST en puerto 54321)
Auth: REAL (Supabase Auth con sesiones JWT independientes)
PostgreSQL: REAL (Restricciones UNIQUE, CHECK, FK y transacciones reales)
RLS: REAL (Políticas activas aplicadas sobre clientes autenticados)
Trigger: REAL (handle_new_user() y handle_employee_invitation_acceptance())
UI: REAL (Navegador Chromium automatizado vía Playwright)
Mocks: NONE (Sin mocks de base de datos, sin bypass de triggers ni manipulación manual de registros)
```

---

## 3. Validación de Migraciones desde Base de Datos Limpia

### Estado: `VERIFIED`

La base de datos local fue completamente reconstruida y validada ejecutando:

```bash
npx supabase db reset
```

Secuencia ejecutada y verificada:
1. Recreación de base de datos en PostgreSQL.
2. Aplicación secuencial y limpia de las 22 migraciones:
   - `20260728000000_initial_schema.sql` hasta `20260909000000_employee_invitations.sql`.
3. Verificación de que el tipo `employee_status` incluye el valor `'pending'`.
4. Creación de tablas `public.employee_invitations` y `public.company_employees` con claves foráneas, índices de rendimiento y políticas RLS.
5. Creación de la función y trigger PostgreSQL `public.handle_employee_invitation_acceptance()`.
6. Comprobación de que la suite de integración (`23/23`) pasa al 100% inmediatamente después del reset.

---

## 4. Flujo E2E Validado

El test principal (`src/tests/e2e/employee-invitation.spec.ts`) reproduce exactamente la experiencia de usuario de dos identidades independientes:

```text
COMPANY USER (Empresa)
       ↓
[UI] Login (/login)
       ↓
[UI] Redirección automática (/dashboard/company)
       ↓
[UI] Navegación a Plantilla (/dashboard/company/employees)
       ↓
[UI] Apertura de modal "+ Registrar Colaborador"
       ↓
[UI] Ingreso de datos (Nombre, Email, Puesto, Salario, Teléfono)
       ↓
[UI] Envío ("Guardar e Invitar Colaborador")
       ↓
[PostgreSQL] Inserción en company_employees (status = 'pending')
       ↓
[PostgreSQL] Inserción en employee_invitations (status = 'sent', token_hash)
       ↓
[UI] Modal muestra éxito y enlace único (/invite/[rawToken])
       ↓
[UI] Pestaña "Invitaciones" muestra registro con badge "Enviada"
       ↓
EMPLOYEE USER (Contexto de Navegador Aislado)
       ↓
[UI] Apertura de enlace de invitación (/invite/[rawToken])
       ↓
[UI] Validación de datos de la empresa, puesto y correo asignado
       ↓
[UI] Llenado de formulario (Nombre, Fecha de nacimiento, WhatsApp, Contraseña)
       ↓
[UI] Envío ("Completar Registro y Unirme al Equipo")
       ↓
[Supabase Auth] Creación de usuario real en auth.users
       ↓
[PostgreSQL Trigger] handle_new_user() crea registro en public.profiles
       ↓
[PostgreSQL Trigger] on_candidate_profile_linked_invitation dispara:
       handle_employee_invitation_acceptance()
       ↓
[PostgreSQL] Inserta perfil de candidato en public.candidate_profiles (idempotente)
       ↓
[PostgreSQL] Actualiza public.company_employees:
       - employee_id = <candidate auth UUID>
       - status = 'active'
       ↓
[PostgreSQL] Actualiza public.employee_invitations:
       - status = 'accepted'
       - accepted_at = now()
       ↓
[PostgreSQL] Inserta en public.notifications aviso para la empresa
       ↓
[PostgreSQL RLS] Empresa A puede consultar y gestionar su colaborador
       ↓
[PostgreSQL RLS] Empresa B no tiene visibilidad ni acceso al colaborador (0 filas)
```

---

## 5. Inventario de Tests E2E

Ubicación: `src/tests/e2e/employee-invitation.spec.ts`

| Test # | Nombre del Escenario | Tipo | Validación Principal |
| :---: | :--- | :---: | :--- |
| **1** | `flujo completo: Empresa invita colaborador -> Empleado acepta y se registra -> Trigger vincula cuenta -> RLS aísla registros` | **Happy Path** | Flujo completo de 2 identidades, UI de empresa, UI de candidato, triggers en DB, y aislamiento multi-tenant RLS Empresa A vs Empresa B. |
| **2** | `escenario negativo 1: intento de abrir un token inexistente / inválido` | **Negativo** | UI renderiza "Invitación no disponible", mensaje descriptivo y botón para ir a login. |
| **3** | `escenario negativo 2: intento de utilizar una invitación expirada` | **Negativo** | UI renderiza "Invitación expirada", informa del vencimiento y PostgreSQL no altera ningún registro. |
| **4** | `escenario negativo 3: intento de utilizar una invitación cancelada` | **Negativo** | UI renderiza "Invitación cancelada", informa de la cancelación por la empresa. |

---

## 6. Hallazgos Forenses y Bugs Corregidos Durante la Implementación

### 1. Hidratación de Formulario en Next.js Dev Mode (E2E)
- **Problema**: En el primer intento del test E2E, Playwright llenó el campo de correo en `/login` antes de que la hidratación de React terminara, provocando que `react-hook-form` restableciera el valor por defecto (`""`).
- **Solución**: En el test E2E se sincronizó la interacción esperando `networkidle` y validando explícitamente `await expect(input).toHaveValue(value)` antes de presionar el botón de envío.

### 2. Ambigüedad de Selectores en Playwright Strict Mode
- **Problema**: Mensajes de toast (Sonner) y títulos de diálogo/tablas compartían textos idénticos (ej. `"¡Invitación generada exitosamente!"` y el nombre del colaborador en la descripción del toast y en la celda de la tabla), disparando violaciones de modo estricto en Playwright.
- **Solución**: Se refinaron los localizadores utilizando roles semánticos (`getByRole("heading", ...)` y `.first()`) para asegurar pruebas robustas y deterministas.

### 3. Configuración de `allowedDevOrigins` en Next.js
- **Problema**: Next.js 16 bloqueaba solicitudes cross-origin internas para webpack HMR cuando las pruebas navegaban entre `127.0.0.1` y `localhost`.
- **Solución**: Se añadió `allowedDevOrigins: ["127.0.0.1", "localhost"]` en `next.config.ts`.

---

## 7. Limitaciones y Alcance

1. **Proveedor de Correo Electrónico**:
   - En el entorno de pruebas local, el envío de correos salientes no se delega a un servicio SMTP de producción (como Resend).
   - Se utiliza el `rawToken` generado criptográficamente y expuesto en la interfaz y en la base de datos de test, lo cual es la práctica estándar para pruebas E2E locales.
2. **Ambiente de Ejecución**:
   - Las pruebas E2E requieren que el stack local de Supabase esté activo (`npx supabase start`).
   - El servidor de desarrollo de Next.js es gestionado automáticamente por `playwright.config.ts` en el puerto 3000.

---

## 8. Guía de Ejecución Rápida

```bash
# Ejecutar tests unitarios
npm run test:unit

# Ejecutar tests de integración contra PostgreSQL real
npm run test:integration

# Ejecutar suite E2E real con Playwright
npm run test:e2e
```
