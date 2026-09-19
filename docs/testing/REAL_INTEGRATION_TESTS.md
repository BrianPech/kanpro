# K'anPro — Suite de Tests de Integración Real (Supabase & PostgreSQL)

## 1. Infraestructura de Pruebas

La capa de **Integration Tests Reales** de K'anPro ejecuta pruebas automatizadas contra una instancia viva de **Supabase y PostgreSQL**, sin ningún tipo de mock de base de datos (`MockDatabaseRLS`, `.filter()`, etc.).

### 1.1 Entorno y Requisitos
- **Runner**: [Vitest 4.1.11](https://vitest.dev)
- **Supabase Local**: Stack de contenedores Docker gestionado mediante `npx supabase start`:
  - **API Gateway (Kong / PostgREST)**: `http://127.0.0.1:54321`
  - **PostgreSQL**: `127.0.0.1:54322` (database `postgres`)
  - **Supabase Auth (GoTrue)**: `http://127.0.0.1:54321/auth/v1`
- **Políticas RLS Activas**: `ROW LEVEL SECURITY` habilitado y forzado en `public.company_employees`, `public.employee_invitations`, `public.profiles`, `public.company_profiles`, `public.candidate_profiles`, y `public.notifications`.
- **Triggers Reales Activos**:
  - `on_auth_user_created` en `auth.users` -> ejecuta `public.handle_new_user()`.
  - `on_candidate_profile_linked_invitation` en `public.profiles` -> ejecuta `public.handle_employee_invitation_acceptance()`.

### 1.2 Invariante de Falla Temprana (Fail-Loudly)
La suite **nunca omite silenciosamente** ni recurre a mocks si el entorno no está disponible. La función `ensureLiveSupabase()` comprueba el endpoint `/auth/v1/health` antes de cada suite con un timeout de 3 segundos; si el servicio no responde, aborta la ejecución con un error explícito y accionable:
```
REAL SUPABASE TEST ENVIRONMENT UNAVAILABLE: Integration tests require a live Supabase instance at http://127.0.0.1:54321. Ensure local stack is started with 'npx supabase start'.
```

### 1.3 Clientes de Prueba y Gestión de Sesiones (`helpers/test-client.ts`)
| Helper | Rol / Privilegios | Propósito en Pruebas |
| :--- | :--- | :--- |
| `getAdminClient()` | Service Role (`service_role`) | Setup de fixtures, creación controlada y limpieza en cascada. |
| `createAnonClient()` | Público / Anónimo (`anon`) | Verificación de denegación de acceso público y protección RLS para endpoints no autenticados. |
| `createAuthenticatedClient(email, password)` | Usuario autenticado (`authenticated`) | Inicia sesión contra GoTrue real, recibe un JWT válido y opera estrictamente bajo las políticas RLS del usuario. |
| `createTestCompanyUser(...)` | Auth user con `role: "company"` | Dispara `handle_new_user()`, crea `profiles` y `company_profiles`. |
| `createTestCandidateUser(...)` | Auth user con `role: "candidate"` | Dispara `handle_new_user()`, crea `profiles` y `candidate_profiles`. |
| `cleanupTestUsers(userIds)` | Service Role | Elimina usuarios de `auth.users`; las FK en PostgreSQL ejecutan borrado en cascada de todos los registros asociados. |
| `generateTestEmail(prefix)` | N/A | Genera emails únicos (`test-{ts}-{rand}@kanpro-test.local`) para garantizar aislamiento entre ejecuciones. |

---

## 2. Inventario de Tests de Integración

Ubicación: `src/tests/integration/`

| Archivo | Tests | Enfoque | Tablas Involucradas |
| :--- | :---: | :--- | :--- |
| `01-employee-invitation-db.test.ts` | 4 | Persistencia en DB, restricciones de esquema e integridad referencial | `company_employees`, `employee_invitations`, `company_profiles`, `auth.users` |
| `02-employee-invitation-trigger.test.ts` | 4 | Ejecución del trigger PostgreSQL `handle_employee_invitation_acceptance` | `profiles`, `candidate_profiles`, `employee_invitations`, `company_employees`, `notifications` |
| `03-company-multitenant-rls.test.ts` | 6 | Aislamiento multi-tenant real con PostgreSQL Row Level Security | `company_employees`, `employee_invitations` |
| `04-company-server-actions.test.ts` | 9 | Ejecución de Server Actions con base de datos real | `employee_invitations`, `company_employees`, `company_profiles` |
| **TOTAL** | **23** | **100% Real PostgreSQL & Supabase** | — |

---

## 3. Cobertura de Requisitos Prioritarios (P0)

### P0 #1: Persistencia en Base de Datos y Restricciones de Esquema
- **Archivo**: `src/tests/integration/01-employee-invitation-db.test.ts`
- **Validaciones**:
  1. Inserción y persistencia real en PostgreSQL de `company_employees` y `employee_invitations`.
  2. Verificación de campos obligatorios (`id`, `company_id`, `email`, `full_name`, `position`, `salary`, `status`, `token_hash`, `expires_at`).
  3. Comprobación de restricción `UNIQUE (token_hash)`: PostgreSQL rechaza duplicados con código de error `23505` (`unique_violation`).
  4. Comprobación de restricción `CHECK (status IN (...))`: PostgreSQL rechaza estados inválidos con código de error `23514` (`check_violation`).
  5. Cascada de eliminación: La eliminación de una empresa en `auth.users` elimina en cascada sus invitaciones y colaboradores asociados.

### P0 #2: Ejecución del Trigger PostgreSQL de Aceptación
- **Archivo**: `src/tests/integration/02-employee-invitation-trigger.test.ts`
- **Validaciones**:
  1. **Flujo de invitación pendiente**: Cuando un candidato se registra en `auth.users` con el correo de una invitación previa:
     - El trigger `handle_new_user()` crea el perfil en `public.profiles`.
     - El trigger `on_candidate_profile_linked_invitation` ejecuta `handle_employee_invitation_acceptance()`.
     - La invitación cambia a `status = 'accepted'` con `accepted_at` no nulo.
     - El colaborador en `company_employees` cambia de `status = 'pending'` a `status = 'active'`.
     - `company_employees.employee_id` queda enlazado al `id` del candidato en `auth.users`.
     - Se genera una notificación en `public.notifications` para la empresa (`type = 'employee_joined'`).
  2. **Flujo de invitación enviada (`sent`)**: Se valida la transición idéntica cuando la invitación estaba en estado `sent`.
  3. **Invitación expirada**: Si `expires_at < now()`, el trigger no altera los estados (`pending` permanece inalterado).
  4. **Invitación cancelada**: Si `status = 'cancelled'`, el trigger no enlaza al candidato.

### P0 #3: Aislamiento Multi-tenant RLS en PostgreSQL
- **Archivo**: `src/tests/integration/03-company-multitenant-rls.test.ts`
- **Validaciones**:
  1. **Listado filtrado**: La Empresa A solo ve sus propios colaboradores e invitaciones; jamás ve los de la Empresa B.
  2. **SELECT directo por ID**: La Empresa A intenta consultar directamente por UUID un colaborador o invitación de la Empresa B; PostgREST devuelve `null` (cero fuga de datos o de existencia).
  3. **UPDATE entre tenants**: La Empresa A intenta modificar un registro de la Empresa B; RLS bloquea la operación afectando 0 filas y el registro de la Empresa B permanece intacto.
  4. **DELETE entre tenants**: La Empresa A intenta borrar un registro de la Empresa B; RLS bloquea la operación afectando 0 filas y el registro continúa existiendo en PostgreSQL.
  5. **Acceso anónimo (no autenticado)**: Clientes anónimos reciben listas vacías y son rechazados en intentos de inserción.

### P0 #4: Integración de Server Actions con PostgreSQL Real
- **Archivo**: `src/tests/integration/04-company-server-actions.test.ts`
- **Validaciones**:
  1. `getInvitationByTokenAction`:
     - Búsqueda exitosa por hash SHA-256 del token en crudo.
     - Token inexistente retorna `{ status: "not_found" }`.
     - Token inválido (< 10 caracteres) retorna `{ status: "invalid" }`.
     - Token expirado retorna `{ status: "expired" }`.
     - Token cancelado retorna `{ status: "cancelled" }`.
     - Token previamente aceptado retorna `{ status: "already_accepted" }`.
  2. `acceptEmployeeInvitationAction`:
     - Enlaza en PostgreSQL `company_employees.employee_id` y transiciona `employee_invitations.status` a `accepted`.
     - **Idempotencia**: Llamadas repetidas retornan éxito sin error (`"Invitación ya aceptada previamente"`).
  3. `resendEmployeeInvitationAction`:
     - Genera un nuevo token seguro, extiende `expires_at` a 7 días y actualiza el estado a `sent` en PostgreSQL.
  4. `cancelEmployeeInvitationAction`:
     - Actualiza la invitación a `cancelled` y marca el registro de colaborador como `terminated` con motivo `"Invitación cancelada por la empresa"`.

---

## 4. Hallazgo Forense Crítico Descubierto y Corregido

> [!CAUTION]
> **Bug Crítico en Base de Datos Descubierto Durante la Ejecución de Tests Reales**:
> Durante la primera corrida del test de trigger real `02-employee-invitation-trigger.test.ts`, el registro del candidato falló con el siguiente error de PostgreSQL:
> ```
> ERROR: insert or update on table "company_employees" violates foreign key constraint "company_employees_employee_id_fkey"
> DETAIL: Key (employee_id)=(f9a2ba45-5357-4eca-9737-c6687cc89c3d) is not present in table "candidate_profiles".
> CONTEXT: SQL statement "UPDATE public.company_employees SET employee_id = NEW.id, status = 'active' ..."
> PL/pgSQL function handle_employee_invitation_acceptance() line 16 at SQL statement
> ```

### Causa Raíz
1. La tabla `company_employees` define una clave foránea:
   `employee_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE`.
2. Cuando se crea un usuario en `auth.users`, se dispara la función `handle_new_user()`.
3. `handle_new_user()` realiza primero el `INSERT INTO public.profiles`.
4. El trigger `on_candidate_profile_linked_invitation` estaba configurado como `AFTER INSERT ON public.profiles`.
5. Por lo tanto, el trigger `handle_employee_invitation_acceptance()` se ejecutaba sincrónicamente **antes** de que `handle_new_user()` alcanzara a insertar la fila correspondiente en `public.candidate_profiles`.
6. Al intentar actualizar `company_employees.employee_id = NEW.id`, PostgreSQL verificaba la FK contra `candidate_profiles` (que aún no contenía el registro) y abortaba toda la transacción de registro del candidato.

### ¿Por qué los 57 tests unitarios previos no detectaron este fallo?
Los tests unitarios utilizaban un mock en memoria de Supabase (`MockDatabaseRLS`). Dicho mock emulaba selects y updates filtrando arreglos de JavaScript en memoria, sin evaluar claves foráneas de PostgreSQL ni respetar la secuencia de ejecución de triggers del motor relacional.

### Solución Implementada
En la migración `supabase/migrations/20260909000000_employee_invitations.sql`, dentro de la función `handle_employee_invitation_acceptance()`, se añadió la inserción idempotente del perfil de candidato antes de actualizar la tabla `company_employees`:
```sql
-- Ensure candidate_profiles exists so company_employees_employee_id_fkey constraint is satisfied
INSERT INTO public.candidate_profiles (id)
VALUES (NEW.id)
ON CONFLICT (id) DO NOTHING;
```
Tras aplicar la corrección a PostgreSQL, la transacción se completa con éxito y todos los tests pasan al 100%.

---

## 5. Guía de Ejecución

### Comandos de Test en `package.json`
```bash
# Ejecutar capa unitaria (57 tests rápidos con mocks)
npm run test:unit

# Ejecutar capa de integración real (23 tests contra PostgreSQL vivo)
npm run test:integration

# Ejecutar capa E2E real con Playwright (4 tests contra UI viva, Auth y PostgreSQL real)
npm run test:e2e

# Ejecutar tests unitarios e integración
npm test
```

### Resumen de Resultados Actuales
```text
Capa Unitaria:
  5 test files passed (5/5)
  57 tests passed (57/57)
  Duration: ~250ms

Capa de Integración Real (Validada tras supabase db reset en limpio):
  4 test files passed (4/4)
  23 tests passed (23/23)
  Duration: ~700ms

Capa E2E Real (Playwright + Chromium + UI viva + Supabase real):
  1 test file passed (1/1)
  4 tests passed (4/4)
  Duration: ~11s

TOTAL DEL PROYECTO:
  10 test files passed (10/10)
  84 tests passed (84/84)
  0 failed
  TypeScript: 0 errors (tsc --noEmit)
  ESLint: 0 errors
```
