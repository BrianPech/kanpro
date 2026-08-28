# Original User Request

## 2026-08-27T09:42:24Z

Realizar una auditoría exhaustiva del sistema actual de autorización administrativa de K'anPro y diseñar una arquitectura RBAC granular que diferencie correctamente entre `admin`, `super_admin` y futuros subroles administrativos, garantizando cero modificaciones a código o migraciones en esta fase.

Working directory: /Users/brianpech/Developer/Commercial/kanpro
Integrity mode: development

---

## 1. Principio Fundamental y Reglas de Ejecución

- **Fase Exclusiva de Auditoría y Diseño Técnico**:
  - **PROHIBIDO** modificar código fuente, Server Actions, componentes UI o tests existentes.
  - **PROHIBIDO** crear, editar o ejecutar migraciones SQL o alterar RLS.
  - **PROHIBIDO** instalar nuevas dependencias o alterar configuraciones.
  - **PERMITIDO**: Lectura de código, análisis estático, inspección de dependencias, grafos de importación, ejecución de tests existentes y validación de tipos no destructiva.

---

## 2. Requerimientos Técnicos

### R1. Auditoría Integral del Modelo Actual y Mapeo de Autorización
- Analizar qué significa en el código real `public.profiles.role = 'admin'` frente a `public.admin_staff_members.sub_role` y el campo `permissions`.
- Determinar si `permissions` tiene autoridad funcional real o puramente informativa/UI en cada Server Action y endpoint.
- Identificar posibles estados inconsistentes (perfiles admin sin registro de staff, registros de staff sin perfil admin, huérfanos).
- Construir el mapa de decisión de autorización desde la autenticación hasta la ejecución de cada operación.

### R2. Inventario Completo de Privilegios y Server Actions
- Inventariar todas las operaciones y Server Actions administrativas del proyecto (gestión de personal, usuarios, empresas, candidatos, vacantes, documentos, reportes, moderación, tickets, facturación, etc.).
- Para cada operación documentar: archivo, función, guardia actual (`requireAdminAuth`, direct checks), RLS asociado, subrol o permisos necesarios y nivel de riesgo.
- Identificar cualquier discrepancia donde la UI oculte botones pero el backend carezca de protección.

### R3. Análisis Forense de Escalada Admin $\to$ Super Admin
- Analizar exhaustivamente los escenarios de escalada horizontal y vertical entre administradores (Casos A a G):
  - Admin creando o promoviendo a `super_admin`.
  - Admin modificando permisos o subrol de otro administrador o de sí mismo (self-escalation).
  - Admin eliminando o desactivando a un `super_admin`.
  - Capacidad de manipulación directa vía cliente SDK y qué bloquea efectivamente RLS.

### R4. Diseño de Arquitectura RBAC Granular Futura
- Proponer 3 opciones arquitectónicas (Opción A: Mínima, Opción B: Recomendada, Opción C: Escalable a futuro) comparando complejidad, seguridad, impacto en BD/RLS, Server Actions y facilidad de extensión.
- Definir las reglas de jerarquía de subroles (`super_admin`, `admin`, `moderator`, `support`, `document_verifier`, etc.).
- Formular las invariantes de seguridad obligatorias (I1 a I8+) y el Threat Model completo.
- Diseñar la matriz de permisos y capacidades por subrol.

### R5. Plan de Implementación por Fases y Suite de Pruebas Propuesta
- Diseñar un roadmap técnico por fases (Fase 1: Modelo RBAC, Fase 2: Helpers Server-side, Fase 3: Server Actions, Fase 4: RLS, Fase 5: Frontend, Fase 6: Tests, Fase 7: Migración, Fase 8: Auditoría final).
- Especificar la nueva matriz de pruebas de seguridad RBAC (mínimo 16 casos de prueba adversariales).
- Identificar riesgos de migración y compatibilidad hacia atrás.

---

## 3. Entregables y Estructura del Informe Final

El informe final consolidado (`RBAC Security Audit — K'anPro`) debe estructurarse en las 17 secciones requeridas:
1. Executive Summary
2. Current Authorization Architecture
3. Roles and Subroles
4. Privilege Inventory (tabla detallada)
5. Server Action Audit
6. RLS & SQL Function Audit (`is_admin`, `get_user_role`, `profiles`, `admin_staff_members`)
7. Permission System Audit (análisis de semántica real vs UI)
8. Admin $\to$ Super Admin Escalation Analysis (Casos A–G)
9. Other Findings (clasificados en P0 Critical, P1 High, P2 Medium, P3 Low, INFO)
10. Recommended RBAC Architecture (Opción A, B, C con comparativa y recomendación)
11. Security Invariants
12. Proposed Permission Matrix
13. Threat Model
14. Phased Implementation Plan
15. Proposed RBAC Test Matrix (mínimo 16 casos)
16. Migration & Compatibility Risks
17. Final Recommendation & Conclusion

---

## 4. Acceptance Criteria & Verification Plan

### Criterios de Integridad y Cobertura
- [ ] No se ha modificado ni creado ningún archivo de código de producción, migración SQL o configuración en el repositorio.
- [ ] El informe responde de forma demostrada a todas las preguntas sobre el modelo actual (`profiles.role`, `sub_role`, `permissions`).
- [ ] El inventario de privilegios incluye el 100% de las Server Actions y operaciones administrativas existentes.
- [ ] Se analizan detalladamente los vectores de escalada de admin $\to$ super_admin (Casos A–G).
- [ ] Se evalúan las 3 opciones de arquitectura RBAC (Mínima, Recomendada, Escalable) con recomendación fundamentada.
- [ ] Se formulan las invariantes de seguridad y el Threat Model para todos los actores.
- [ ] Se entrega el plan de implementación por fases con matriz de riesgos y suite de 16+ tests propuesta.
- [ ] Los tests existentes del proyecto continúan en estado 93/93 PASS.
- [ ] Typecheck (`tsc --noEmit`) y ESLint continúan en 0 errores.

---

## 2026-08-27T10:05:55Z

Realizar una auditoría de seguridad forense y empírica, exclusivamente en modo de solo lectura, sobre el estado actual del repositorio K'anPro, verificando la validez real de los hallazgos de autorización administrativa, escalada de privilegios entre subroles (`admin` vs `super_admin`), efectividad de `status` y `permissions`, bypass comercial de suscripciones y consistencia RLS/Server Actions, generando el informe consolidado en `docs/security/RBAC_POST_HARDENING_AUDIT.md`.

Working directory: /Users/brianpech/Developer/Commercial/kanpro
Integrity mode: development

---

## 1. Principio Fundamental y Reglas de Ejecución

- **MODO ESTRICTO DE SOLO LECTURA (READ-ONLY)**:
  - **PROHIBIDO** modificar código fuente en TypeScript, componentes UI, hooks o utilidades.
  - **PROHIBIDO** crear, editar o ejecutar migraciones SQL, alterar tablas o modificar políticas RLS.
  - **PROHIBIDO** implementar "fixes" o refactors en esta fase.
  - **PROHIBIDO** alterar `package.json`, configuraciones o dependencias.
  - **PERMITIDO EXCLUSIVAMENTE**: Lectura de código, análisis estático, inspección de dependencias/grafos, ejecución de pruebas aisladas no destructivas de solo lectura y creación del informe final en `docs/security/RBAC_POST_HARDENING_AUDIT.md`.

---

## 2. Requerimientos Técnicos

### R1. Inventario Completo de Autorización y Mapeo End-to-End
- Auditar la totalidad de Server Actions, Route Handlers, middleware/proxy (`proxy.ts`), layouts, helpers de autorización (`requireAdminAuth`, `requireAdmin`, etc.), servicios y políticas RLS.
- Mapear el flujo completo: `ENTRYPOINT → AUTHENTICATION → AUTHORIZATION → ROLE CHECK → SUB_ROLE CHECK → PERMISSION CHECK → STATUS CHECK → DATABASE OPERATION`.
- Documentar si existen discrepancias donde la UI oculta botones pero el backend permite la ejecución.

### R2. Verificación Empírica del Hallazgo Central (¿`profiles.role = 'admin'` equivale a Root?)
- Verificar con evidencia de código si `profiles.role = 'admin'` otorga acceso irrestricto de "root administrator" a todos los subroles (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`).
- Responder con evidencia (`PASS/FAIL`, archivo, función, líneas, mecanismo, impacto y exploitability) a las 10 preguntas críticas:
  1. ¿Todos los admins pueden ejecutar todas las Server Actions administrativas?
  2. ¿Todos los admins pueden crear otros admins?
  3. ¿Todos los admins pueden asignar `sub_role = 'super_admin'`?
  4. ¿Todos los admins pueden asignar permisos arbitrarios?
  5. ¿Todos los admins pueden modificar otros admins?
  6. ¿Todos los admins pueden modificar su propio `sub_role`?
  7. ¿Todos los admins pueden modificar sus propios `permissions`?
  8. ¿Un `support` admin puede convertirse en `super_admin`?
  9. ¿Un admin ordinario puede eliminar o degradar a un `super_admin`?
  10. ¿Un admin con `status = 'suspended'` o `'inactive'` conserva acceso a Server Actions y RLS?

### R3. Análisis Forense de Escalada, Deleción, Lockout y Defaults Peligrosos
- **Auto-escalada**: Verificar `updateAdminStaffMember(self.id, { subRole: 'super_admin', permissions: [...] })` y determinar si un admin de bajo nivel puede auto-elevarse.
- **Creación de Super Admins**: Verificar `createAdminStaffMember()` y si valida la jerarquía del actor.
- **Deleción y Bloqueo**: Verificar `deleteAdminStaffMember()` y `toggleAdminStaffStatus()`, evaluando si un rol inferior puede degradar al último `super_admin` o provocar un bloqueo ejecutivo del sistema.
- **Split-Brain / Defaults Inseguros**: Identificar código que asigne `subRole = "super_admin"` o todos los permisos por defecto a perfiles admin huérfanos sin fila en `admin_staff_members`.

### R4. Auditoría de RLS Directo, Impersonación y Bypass Comercial
- **RLS Adversarial**: Auditar si un usuario autenticado con `profiles.role = 'admin'` y `sub_role = 'support'` puede ejecutar mutaciones directas (`UPDATE/INSERT/DELETE`) en `admin_staff_members` o `profiles` vía el SDK de Supabase saltándose las Server Actions.
- **Impersonación (`lib/auth/impersonation.ts`)**: Auditar si un admin puede impersonar a un `super_admin`, si las cookies son manipulables o carecen de firma criptográfica HMAC, y qué permisos se heredan.
- **Bypass Comercial (`updateSubscriptionPlan`)**: Auditar si una empresa puede auto-asignarse el plan `'enterprise'` o generar facturas pagadas falsas sin verificación de pasarela de pago (Stripe/webhooks).
- **Acceso a PII Sensible**: Auditar si subroles no autorizados (`support`, `content_admin`) pueden acceder a `candidate_private_profiles` (CURP, RFC, Cédula) o documentos confidenciales sin permiso `verify_documents`.

### R5. Clasificación de Findings y Generación del Entregable
- Contrastar cada finding de la auditoría anterior (`F-01` a `F-22`) clasificándolo como: `CONFIRMED`, `FIXED`, `PARTIALLY FIXED`, `FALSE POSITIVE` o `NOT VERIFIABLE`.
- Clasificar severidades bajo estándar: `P0` (Compromiso crítico / takeover / lockout), `P1` (Escalada significativa / acceso PII / bypass), `P2` (Riesgo moderado), `P3` (Mejora arquitectónica), `INFO`.
- Diseñar y registrar resultados de la suite conceptual de 12 pruebas adversariales (Casos A a L).
- Generar el documento final estructurado en `docs/security/RBAC_POST_HARDENING_AUDIT.md` cumpliendo con las 16 secciones obligatorias.

---

## 3. Acceptance Criteria

### Integridad del Repositorio y Cero Modificaciones
- [ ] No se ha modificado ningún archivo de código fuente TypeScript, componente, hook, migración SQL o configuración en el repositorio.
- [ ] No se han instalado paquetes ni dependencias adicionales.
- [ ] El único archivo nuevo creado es `docs/security/RBAC_POST_HARDENING_AUDIT.md`.
- [ ] La suite existente de 93/93 tests pasa al 100% y `tsc --noEmit` / `eslint` se mantienen limpios.

### Rigor Forense y Cobertura del Informe
- [ ] El informe responde con evidencia empírica (rutas de archivo, nombres de función, números de línea y extractos) a las 10 preguntas centrales de autorización.
- [ ] Se documenta con exactitud el comportamiento de `updateAdminStaffMember`, `createAdminStaffMember`, `deleteAdminStaffMember` y `toggleAdminStaffStatus`.
- [ ] Se audita el impacto de `admin_staff_members.status = 'suspended'` demostrando si revoca o no el acceso en backend y RLS.
- [ ] Se evalúa la seguridad de `startImpersonating` (firmas, validación de target, contexto) y `updateSubscriptionPlan` (bypass comercial).
- [ ] Se clasifican formalmente todos los findings previos (`F-01` a `F-22`) y los nuevos hallazgos con severidad P0–P3 / INFO.
- [ ] Se entrega la matriz de 12 pruebas adversariales evaluadas y el orden recomendado de remediación para el siguiente sprint.

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

