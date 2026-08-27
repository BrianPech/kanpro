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
