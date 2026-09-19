# Original User Request

## Initial Request — 2026-08-26T11:00:46Z

Implementar el endurecimiento completo del flujo de creación de administradores de K'anPro y corregir la vulnerabilidad P0/P1 existente relacionada con `handle_new_user()`, `createAdminStaffMember()`, `auth/callback` y `dashboard-session`, garantizando que ningún usuario público pueda elevar privilegios a `admin` mediante metadata o inputs del cliente.

Working directory: /Users/brianpech/Developer/Commercial/kanpro
Integrity mode: development

---

## 1. Principio Fundamental de Seguridad y Arquitectura

`public.handle_new_user()` **NO debe tener ninguna capacidad de crear un administrador**.
La elevación a `profiles.role = 'admin'` durante el flujo normal ocurre exclusivamente desde el backend privilegiado autorizado:

```
PÚBLICO:
Usuario público → Supabase Auth → auth.users → handle_new_user() → candidate / company (NUNCA admin)

ADMINISTRATIVO:
Admin autenticado → requireAdminAuth() → Server Action (createAdminStaffMember)
  → createAdminClient() (Service Role, server-only)
  → supabaseAdmin.auth.admin.createUser()
  → auth.users (UUID real)
  → handle_new_user() crea perfil base
  → Promoción explícita: UPDATE profiles SET role = 'admin', is_verified = true
  → INSERT/UPSERT admin_staff_members
```

---

## 2. Requerimientos Técnicos

### R1. Blindaje del Trigger `public.handle_new_user()` y Migración SQL
- Crear una nueva migración SQL idempotente. **NO modificar migraciones históricas ya aplicadas**.
- Inspeccionar la versión actual completa de `handle_new_user()` y reproducir fielmente su comportamiento legítimo (`candidate_profiles`, `candidate_private_profiles`, `company_profiles`, `birth_date`, timestamps, enums y columnas reales).
- Configuración: `SECURITY DEFINER` y `SET search_path = public, auth, pg_temp;` (verificando dependencias reales).
- **Regla estricta de asignación**:
  - Si `raw_user_meta_data->>'role' = 'company'` → asignar `'company'`.
  - Cualquier otro valor (incluyendo `'admin'`, `'super_admin'`, ausente o arbitrario) → asignar `'candidate'`.
  - **PROHIBIDO** otorgar privilegios administrativos desde `raw_user_meta_data`, `raw_app_meta_data` o cualquier metadata de usuario.
- **Protección `ON CONFLICT`**: Si el perfil existente ya tiene `role = 'admin'`, jamás degradarlo ni sobrescribir su rol.

### R2. Módulo de Cliente Administrativo Server-Only (`createAdminClient`)
- Crear `src/lib/supabase/admin.ts` con protección explícita `import "server-only";`.
- Instanciar el cliente usando `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- Configurar:
  ```typescript
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
  ```
- Añadir validación estricta de variables de entorno (fallar de manera controlada sin revelar valores).
- Asegurar que `SUPABASE_SERVICE_ROLE_KEY` o este módulo jamás sean importados por componentes cliente, hooks o código ejecutado en el navegador.

### R3. Rediseño de `createAdminStaffMember()` y Manejo de Identidad
- En `src/app/(dashboard)/dashboard/admin/staff/actions.ts`, eliminar completamente `supabase.auth.signUp()` y cualquier uso de `crypto.randomUUID()` para representar identidades de `auth.users`. La identidad debe originarse siempre en `auth.users.id`.
- **Flujo para nuevo usuario**:
  1. Validar autorización del administrador ejecutor (`requireAdminAuth`).
  2. Inicializar cliente con Service Role.
  3. Comprobar existencia del usuario en Auth/profiles.
  4. Si no existe: crear mediante `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, ... })`.
  5. Obtener el UUID real generado (`authData.user.id`).
  6. Esperar/asegurar que el trigger cree el perfil base.
  7. Promover explícitamente: `UPDATE profiles SET role = 'admin', is_verified = true WHERE id = authData.user.id`.
  8. Crear/actualizar `admin_staff_members` vinculando `profile_id`, `sub_role`, `department`, `permissions`, `status`.
- **Regla para usuarios existentes**:
  - Si ya es `admin`: permitir actualizar su registro de staff.
  - Si es `candidate` o `company`: **RECHAZAR** con un mensaje de error seguro indicando que el usuario ya existe y requiere un flujo explícito de promoción. **NO modificar `profiles.role`** ni promover silenciosamente.
- **Rollback Compensatorio Explícito**:
  - Si `createUser()` crea el usuario en Auth pero falla la promoción en `profiles` o la inserción en `admin_staff_members`: ejecutar `supabaseAdmin.auth.admin.deleteUser(newUserId)` **únicamente** si el usuario fue creado por esta misma operación.
  - No eliminar ni alterar usuarios que ya existían previamente.
- **Gestión Segura de Contraseñas y Sesión**:
  - Preservar la sesión y cookies del administrador ejecutor al 100%.
  - La contraseña solo se transmite a `auth.admin.createUser()`; **NUNCA** se persiste en tablas de base de datos, logs, errores, analytics ni respuestas al cliente.
  - Mantener compatibilidad total con el formulario `new-staff-form.tsx` sin cambios visuales.

### R4. Saneamiento de `auth/callback` y `dashboard-session`
- En `src/app/(auth)/auth/callback/route.ts`: eliminar cualquier asignación o whitelist de rol que permita `admin`. Aceptar únicamente `candidate` o `company` desde query params/metadata; cualquier otro valor debe ignorarse o mapearse a candidate.
- En `src/modules/auth/services/dashboard-session.ts`: `public.profiles.role` debe ser la única fuente de verdad para autorización administrativa. Prohibido usar `user_metadata.role === 'admin'` para otorgar acceso.

### R5. Procedimiento Seguro de Bootstrap del Primer Administrador
- **NO crear endpoints públicos ni Server Actions desprotegidas** para bootstrap.
- Documentar el procedimiento operacional mediante SQL Editor / Supabase Dashboard para aprovisionar el primer `super_admin`:
  1. Crear usuario en Supabase Auth.
  2. `UPDATE public.profiles SET role = 'admin', is_verified = true WHERE id = '<USER_UUID>';`
  3. `INSERT INTO public.admin_staff_members (profile_id, sub_role, department, status, permissions) VALUES ('<USER_UUID>', 'super_admin', 'Management', 'active', '["*"]');`

---

## 3. Asignación y Reglas del Equipo Multi-Agente

1. **Security / Auth Auditor**:
   - Analizar vectores de escalada, `auth/callback`, `dashboard-session`, exposición de variables, políticas RLS y tests de seguridad.
   - Revisar y dar visto bueno a los cambios de Database y Backend antes de darlos por concluidos.
2. **Database / Supabase Agent**:
   - Inspeccionar versión actual de `handle_new_user()`, esquemas reales y RLS.
   - Diseñar y aplicar la nueva migración SQL.
   - Documentar el procedimiento seguro de bootstrap.
3. **Backend Agent**:
   - Implementar `src/lib/supabase/admin.ts`.
   - Refactorizar `createAdminStaffMember()`, rollback compensatorio y manejo de usuarios existentes.
4. **Testing / QA Agent**:
   - Implementar y ejecutar la suite completa de 12 tests de seguridad automatizados.
   - Ejecutar typecheck, linter y build.
   - Validar ausencia de regresiones.

*Regla de coordinación*: No permitir ediciones concurrentes no coordinadas sobre los mismos archivos.

---

## 4. Acceptance Criteria & Verification Plan

### Test Suite de Seguridad (12 Casos Obligatorios)
- [ ] **Test 1**: Registro público con `signUp({ data: { role: "admin" } })` resulta en `profiles.role === 'candidate'`.
- [ ] **Test 2**: Registro público con `role: "super_admin"` resulta en `profiles.role === 'candidate'`.
- [ ] **Test 3**: Registro público con `role: "company"` resulta en `profiles.role === 'company'`.
- [ ] **Test 4**: Callback con `?role=admin` no otorga privilegios administrativos.
- [ ] **Test 5**: Modificación de `user_metadata.role = "admin"` tras registro no eleva privilegios en `dashboard-session`.
- [ ] **Test 6**: Intento de ejecución de `createAdminStaffMember` por usuario anónimo es rechazado.
- [ ] **Test 7**: Intento de ejecución de `createAdminStaffMember` por usuario `candidate` o `company` autenticado es rechazado.
- [ ] **Test 8**: Admin autenticado crea nuevo staff exitosamente con su sesión intacta.
- [ ] **Test 9**: Nuevo staff creado tiene UUID real idéntico en `auth.users.id === profiles.id` (sin violación FK).
- [ ] **Test 10**: Nuevo staff tiene `profiles.role === 'admin'` y registro asociado en `admin_staff_members`.
- [ ] **Test 11**: Intento de crear staff con email de candidato/empresa existente es rechazado sin modificar su rol original.
- [ ] **Test 12**: Fallo simulado durante la creación de staff activa rollback compensatorio (`auth.admin.deleteUser`) sin dejar huérfanos ni alterar usuarios preexistentes.

### Criterios de Código, Secretos y Calidad
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no aparece en ningún componente cliente, bundle público, log ni error.
- [ ] `tsc --noEmit` (typecheck) pasa con 0 errores.
- [ ] Linter del proyecto pasa sin errores.
- [ ] Build del proyecto compila exitosamente.
- [ ] Se entrega informe final con el resumen de cambios, estado de pruebas y guía de bootstrap.

---

## 2026-08-27T10:41:05Z

Implementar una arquitectura RBAC de Defense-in-Depth verificable, donde ningún límite de seguridad crítico dependa exclusivamente de la UI, Server Actions o datos controlados por el cliente, erradicando el paradigma plano "admin = root", garantizando que `sub_role`, `permissions` y `status` sean forzados estrictamente tanto en Server Actions como en PostgreSQL RLS, protegiendo contra escalada de privilegios y auto-promoción, restringiendo la gestión de staff exclusivamente a `super_admin`, inhabilitando efectivamente cuentas suspendidas, firmando criptográficamente sesiones de impersonación con revalidación continua, blindando el acceso a PII sensible y eliminando el bypass comercial de suscripciones.

Working directory: /Users/brianpech/Developer/Commercial/kanpro
Integrity mode: development

---

## 1. Principio Fundamental y Reglas de Seguridad Absolutas

1. **Nunca confiar en inputs del cliente para autorización**: Prohibido autorizar mediante `user_metadata.role`, `sub_role` o `permissions` enviados en formularios o parámetros HTTP. La autorización debe derivarse exclusivamente de datos confiables almacenados en PostgreSQL.
2. **Defensa en Profundidad Real (Defense-in-Depth)**: La autorización debe existir y ser forzada en: (1) Base de datos (PostgreSQL RLS y funciones SQL `SECURITY DEFINER`), (2) Backend (Server Actions y helpers centralizados), (3) Ciclo de vida y (4) UI. La UI es puramente UX; jamás actúa como barrera de seguridad.
3. **Cálculo de Capacidades Efectivas y Precedencia de Permisos**: `permissions` nunca puede ser modificado por un administrador no autorizado. Las capacidades efectivas deben calcularse exclusivamente a partir de datos confiables de BD:
   - `sub_role` $\to$ conjunto base de permisos.
   - `permissions` $\to$ capacidades adicionales/revocaciones explícitas.
   - `status = 'active'` $\to$ condición obligatoria (si está inactivo o suspendido, capacidades = $\emptyset$).
   - `super_admin` $\to$ autoridad ejecutiva y bypass de permisos operacionales.
   Ningún valor proveniente del cliente puede modificar, ampliar o sustituir las capacidades efectivas del usuario.
4. **Protección Explícita de `company_profiles` contra Bypass Comercial**: Para proteger columnas sensibles de `company_profiles`, no asumir que una política RLS por sí sola puede distinguir columnas modificadas. Implementar una protección explícita mediante políticas apropiadas, trigger `BEFORE UPDATE` de integridad o API/RPC server-only. La empresa debe poder modificar únicamente los campos comerciales permitidos, mientras que `subscription_plan`, `subscription_status`, créditos, allowances y estados de verificación deberán ser inmutables para el tenant.
5. **Protección Exhaustiva del Último Super Admin**: `prevent_last_super_admin_removal()` debe impedir cualquier transición que provoque que el sistema quede con cero `super_admin` activos, incluyendo `DELETE`, cambio de `sub_role`, cambio de `profiles.role`, suspensión (`status`), desactivación o cualquier combinación de operaciones equivalente. La protección debe ejecutarse en PostgreSQL y no depender exclusivamente de Server Actions.
6. **Impersonación Criptográfica con Revalidación Continua**: El modelo de token de impersonación debe incluir: `issuer`, `actor_user_id`, `target_user_id`, `issued_at`, `expires_at`, `nonce/session_id`, `purpose` y `signature` (HMAC-SHA256).
   Validación requerida en cada uso: firma válida + no expirado + actor sigue activo en BD + actor sigue autorizado + target sigue permitido (prohibido impersonar administradores) + actor $\neq$ target.
   La firma HMAC no debe convertirse en autorización permanente: revocar/suspender al actor debe invalidar inmediatamente la capacidad de impersonación aunque la cookie aún no haya expirado.
7. **Principio de Fail Closed**: Administradores huérfanos sin fila en `admin_staff_members` o con estado inválido/suspendido deben tener acceso administrativo completamente denegado. Jamás auto-promover a `super_admin`.
8. **Preservación del Hardening Previo**: Mantener intacto el blindaje de `handle_new_user()`, `createAdminClient()` server-only, aislamiento de `SUPABASE_SERVICE_ROLE_KEY`, integridad de UUIDs con `auth.users.id` y sanitización de OAuth callbacks.
9. **Integridad de Pruebas y Cero Manipulación de Tests**: Los tests existentes no pueden modificarse, eliminarse, deshabilitarse, hacerse skip ni relajarse para conseguir PASS. Si un test existente contradice el nuevo modelo de seguridad, detener la implementación y documentar el conflicto antes de modificarlo. No marcar como PASS una prueba únicamente mediante mocks que no representen las restricciones reales de PostgreSQL/RLS cuando el acceptance criterion requiere comportamiento de base de datos.
10. **STOP CONDITION OBLIGATORIA**: Si durante la implementación se descubre que una decisión arquitectónica existente impide cumplir un requisito de seguridad sin realizar una migración destructiva, modificar datos de producción, romper compatibilidad o introducir un bypass temporal, **detener la implementación de ese componente, documentar el conflicto y presentar una propuesta antes de continuar**.

---

## 2. Requerimientos Técnicos por Fases de Ejecución

### Fase 0 — Blueprint de Arquitectura RBAC (`docs/security/RBAC_HARDENING_BLUEPRINT.md`)
- Generar el blueprint técnico exhaustivo antes de modificar código o aplicar migraciones, conteniendo:
  1. **Inventario Completo**: Todas las 33 Server Actions administrativas, funciones SQL, tablas (`profiles`, `admin_staff_members`, etc.) y políticas RLS.
  2. **Matriz RBAC Formal**: Mapeo riguroso de capacidades por subrol (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`).
  3. **Modelo de Autorización**: Interacción formal entre `profiles.role` (identidad), `sub_role` (rol administrativo), `permissions` (capacidades) y `status` (ciclo de vida).
  4. **Defense in Depth**: Especificación de capas (Application, Database RLS, SQL Functions, UI) y comportamiento si una capa es vulnerada.
  5. **Principio de Fail Closed**: Comportamiento ante admins huérfanos, suspendidos o inconsistentes.
  6. **Staff Lifecycle**: Reglas para creación, promoción, modificación, suspensión y baja de personal.
  7. **Threat Model**: Modelo de amenazas STRIDE para cada operación crítica.
  8. **Priorización**: Clasificación P0, P1, P2, P3.
- **PUNTO DE CONTROL**: El subagente orquestador validará el blueprint antes de proceder a la fase de implementación.

### Fase 1 — Implementación en 10 Pasos Ordenados

#### Paso 1: Primitivas y Guards Centralizados (`src/lib/auth/rbac-guards.ts`)
- Implementar helpers reutilizables y tipados en servidor:
  - `requireAdminStaffAuth(requiredPermission?: AdminPermissionKey)`: Valida sesión activa, rol `admin`, registro de staff con `status = 'active'`, y verifica el permiso requerido (o bypass si es `super_admin`).
  - `requireSuperAdminAuth()`: Exige estrictamente `sub_role = 'super_admin'` y `status = 'active'`.
  - `requireActiveAdmin()`: Valida liveness y estado activo del administrador.
- Eliminar la duplicación de `requireAdminAuth()` inlined en múltiples archivos.

#### Paso 2: Funciones SQL de Autorización y Migración PostgreSQL
- Crear migración SQL idempotente con funciones `SECURITY DEFINER` y `SET search_path = public, pg_temp`:
  - `public.is_active_admin(user_id uuid)`: Comprueba `profiles.role = 'admin'` y `admin_staff_members.status = 'active'`.
  - `public.is_super_admin(user_id uuid)`: Comprueba `sub_role = 'super_admin'` y `status = 'active'`.
  - `public.has_admin_permission(perm_key text, user_id uuid)`: Comprueba permisos efectivos y estado activo.
  - Trigger `public.prevent_last_super_admin_removal()`: Bloquea cualquier operación (`DELETE`, `UPDATE` de subrol, rol o status) que deje 0 `super_admin` activos.

#### Paso 3: Reestructuración de Políticas PostgreSQL RLS
- `public.admin_staff_members`: `SELECT` para personal activo (`is_active_admin()`); `INSERT`, `UPDATE`, `DELETE` restringido estrictamente a `is_super_admin()`.
- `public.candidate_private_profiles`: `SELECT` restringido al candidato dueño o administradores con `has_admin_permission('verify_documents')`.
- `public.company_profiles`: Proteger columnas sensibles (`subscription_plan`, `subscription_status`, créditos, allowances, verificación) mediante trigger `BEFORE UPDATE` de integridad o políticas RLS específicas, permitiendo al tenant mutar únicamente campos permitidos.
- `public.profiles`: Reparar la fuga de directorio de candidatos en la política `SELECT` para evitar recolección masiva de emails y teléfonos.

#### Paso 4: Endurecimiento de la Gestión de Staff (`staff/actions.ts`)
- Restringir `createAdminStaffMember`, `updateAdminStaffMember`, `deleteAdminStaffMember` y `toggleAdminStaffStatus` a `requireSuperAdminAuth()`.
- Bloquear la auto-modificación de subrol, permisos o estado.
- Prevenir la eliminación o degradación del último `super_admin`.

#### Paso 5: Enforzamiento Real del Estado Suspendido/Inactivo
- Asegurar que `status = 'suspended'` o `'inactive'` bloquee inmediatamente el acceso en:
  - Proxy de rutas (`src/proxy.ts` / `src/lib/supabase/proxy.ts`).
  - Layout guards (`src/app/(dashboard)/dashboard/admin/layout.tsx`).
  - Server Actions (`requireAdminStaffAuth`).
  - PostgreSQL RLS (`is_active_admin()`).

#### Paso 6: Fail-Closed para Admins Huérfanos
- Eliminar cualquier fallback en `getAdminStaffMembers` que otorgue `super_admin` o permisos a admins sin fila en `admin_staff_members`. Asignar acceso denegado / menor privilegio por defecto.

#### Paso 7: Motor Criptográfico de Impersonación (`src/lib/auth/impersonation.ts`)
- Implementar tokens de impersonación firmados con HMAC-SHA256 con payload completo (`issuer`, `actorId`, `targetId`, `issuedAt`, `expiresAt`, `nonce`, `purpose`).
- Prohibir la impersonación de administradores.
- Revalidar en cada solicitud que el actor continúe activo y autorizado en la BD.

#### Paso 8: Aislamiento de PII Privado y Verificaciones (`verifications/actions.ts`)
- Exigir estrictamente el permiso `verify_documents` para leer CURP, RFC, Cédula y firmar URLs de descarga de documentos en Storage.

#### Paso 9: Remediación de Billing y Suscripciones (`company/actions/settings.ts`)
- Eliminar la autoasignación no autenticada de planes Enterprise en `updateSubscriptionPlan`. Exigir webhook validado o acción administrativa de `super_admin`.
- Aserciones de pertenencia (`companyId === user.id`) en `modules/company/actions/employees.ts` y `settings.ts`.

#### Paso 10: Sincronización de UI y Experiencia de Usuario
- Actualizar `src/modules/admin/components/app-sidebar.tsx`, tablas y modales para que la UI refleje fielmente los permisos del usuario activo y maneje errores 403 de forma limpia.

---

## 3. Acceptance Criteria & Verification Plan

### Suite de Pruebas de Seguridad Adversarial (Mínimo 33 Casos Obligatorios)
- [ ] **Perímetro Público**: Bloqueo de signup con `role: admin`, `role: super_admin`, manipulación de metadata y OAuth injection.
- [ ] **RBAC Administrativo**:
  - `support` intentando `manage_users` o `system_settings` $\to$ **403 Denegado**.
  - `verification_admin` intentando `system_settings` $\to$ **403 Denegado**.
  - Admin no-super intentando crear `super_admin` $\to$ **403 Denegado**.
  - Admin no-super intentando auto-elevarse o modificar a otro admin $\to$ **403 Denegado**.
  - Admin no-super intentando suspender a un `super_admin` $\to$ **403 Denegado**.
- [ ] **Lifecycle & Fail-Closed**:
  - Admin suspendido intentando ejecutar Server Actions o acceder vía proxy/RLS $\to$ **403 Denegado / Sesión Inactiva**.
  - Admin huérfano (sin fila en `admin_staff_members`) $\to$ **Fail Closed (Acceso Denegado)**.
  - Intento de eliminar/suspender al último `super_admin` $\to$ **Abortado por Trigger de PostgreSQL**.
- [ ] **PostgreSQL RLS**:
  - Mutación directa vía SDK en `admin_staff_members` por no-super-admin $\to$ **RLS Denied (0 filas)**.
  - Mutación directa de `subscription_plan` en `company_profiles` por empresa $\to$ **Rechazado por Trigger / RLS**.
  - Lectura directa de CURP/RFC en `candidate_private_profiles` sin `verify_documents` $\to$ **RLS Denied (0 filas)**.
- [ ] **Impersonación**:
  - Admin intentando impersonar a otro admin $\to$ **403 Denegado**.
  - Cookie de impersonación forjada o sin firma HMAC válida $\to$ **Rechazada**.
  - Impersonación iniciada por admin posteriormente suspendido $\to$ **Rechazada por revalidación continua**.
- [ ] **Billing & Tenant Isolation**:
  - Empresa intentando auto-asignarse plan Enterprise $\to$ **400/403 Denegado**.
  - Empresa A intentando mutar empleados o configuración de Empresa B $\to$ **403 Denegado**.
- [ ] **Integridad Concurrente**:
  - Rollback compensatorio ante fallo de creación y protección contra condiciones de carrera.

### Criterios de Calidad de Código y Entrega
- [ ] Los 93 tests preexistentes del repositorio continúan en estado PASS (100%) sin modificaciones que relajen assertions.
- [ ] La nueva suite de tests adversariales pasa al 100%.
- [ ] `tsc --noEmit` compila con 0 errores.
- [ ] ESLint pasa sin errores ni advertencias.
- [ ] `next build --webpack` compila exitosamente en modo producción.
- [ ] Se entregan los documentos:
  1. [`docs/security/RBAC_HARDENING_BLUEPRINT.md`](file:///Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md)
  2. [`docs/security/RBAC_HARDENING_FINAL_AUDIT.md`](file:///Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_FINAL_AUDIT.md)

