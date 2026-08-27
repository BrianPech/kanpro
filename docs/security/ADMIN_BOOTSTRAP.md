# Guía Operacional: Bootstrap Seguro del Primer Super Administrador (R5)

**Proyecto**: K'anPro  
**Módulo**: Seguridad y Control de Acceso (RBAC)  
**Clasificación**: Confidencial / Operaciones de Seguridad  
**Última actualización**: 2026-08-26  

---

## 1. Principio de Seguridad y Arquitectura

Para garantizar una superficie de ataque cero en la inicialización y administración de la plataforma K'anPro:

1. **Sin Endpoints Públicos de Bootstrap**: No existe ningún endpoint HTTP público, ruta de API ni Server Action desprotegida capaz de otorgar el rol `admin`.
2. **Trigger Protegido contra Escalada**: El trigger `public.handle_new_user()` asigna estrictamente el rol `candidate` o `company`. Jamás asigna `admin` desde metadatos de registro (`raw_user_meta_data`).
3. **Aprovisionamiento Inicial Exclusivo por Base de Datos**: El primer usuario con privilegios de `super_admin` debe aprovisionarse directamente desde una sesión administrativa de base de datos (Supabase Studio SQL Editor o conexión autenticada por CLI/psql).
4. **Administradores Posteriores**: Una vez activo el primer `super_admin`, los administradores adicionales se crean exclusivamente desde el panel administrativo interno (`/dashboard/admin/staff`) utilizando el Server Action protegido `createAdminStaffMember` respaldado por `createAdminClient()` (Service Role).

---

## 2. Requisitos Previos

- Acceso con rol de Propietario u Operador al **Supabase Dashboard** del proyecto (o acceso `psql` con privilegios `postgres` / `service_role`).
- Dirección de correo electrónico corporativo designada para el Super Administrador inicial.
- Contraseña segura que cumpla con las políticas de complejidad institucional.

---

## 3. Procedimiento Operativo Paso a Paso

### Paso 1: Crear la Identidad en Supabase Auth

1. Ingrese a la consola de **Supabase Studio**.
2. Navegue a la sección **Authentication** > **Users**.
3. Haga clic en **Add User** > **Create User**.
4. Ingrese los datos:
   - **Email**: Correo del administrador (ejemplo: `admin@kanpro.mx`).
   - **Password**: Contraseña segura inicial.
   - **Auto Confirm Email**: Marcar como **Checked / Activado** (para habilitar el login inmediato).
5. Haga clic en **Create User**.

### Paso 2: Obtener el UUID del Usuario

1. En la lista de **Authentication** > **Users**, localice el usuario recién creado.
2. Copie el valor de la columna **User UID** (un identificador con formato UUID v4, por ejemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

---

### Paso 3: Ejecutar el Script de Aprovisionamiento SQL

1. En Supabase Studio, diríjase a **SQL Editor**.
2. Abra una nueva consulta SQL.
3. Copie y pegue el siguiente bloque `DO $$ ... $$;`, reemplazando:
   - `<USER_UUID>` por el UUID obtenido en el Paso 2.
   - `<USER_EMAIL>` por el correo correspondiente.
4. Haga clic en **Run** (Ejecutar).

```sql
-- ============================================================================
-- SCRIPT DE BOOTSTRAP: PROVISIÓN DEL PRIMER SUPER ADMINISTRADOR DE K'ANPRO
-- Ejecutar en Supabase Studio > SQL Editor
-- ============================================================================

DO $$
DECLARE
  -- >>> REEMPLAZAR ESTOS VALORES CON LOS DATOS REALES <<<
  target_user_id UUID := '<USER_UUID>'::uuid;
  target_email TEXT := '<USER_EMAIL>';
  target_name TEXT := 'Super Administrador K’anPro';
  target_phone TEXT := '+529990000000';
BEGIN
  -- 1. Validar que el usuario exista en auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Error de Validación: El UUID % no existe en auth.users. Cree el usuario en Supabase Auth primero.', target_user_id;
  END IF;

  -- 2. Asegurar y promover el registro en public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    whatsapp_number,
    role,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    target_email,
    target_name,
    target_phone,
    'admin'::public.user_role,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::public.user_role,
    is_verified = true,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    email = EXCLUDED.email,
    updated_at = NOW();

  -- 3. Crear o actualizar el registro en public.admin_staff_members
  INSERT INTO public.admin_staff_members (
    profile_id,
    sub_role,
    department,
    status,
    permissions,
    notes,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    'super_admin',
    'Dirección General',
    'active',
    ARRAY[
      'manage_users',
      'manage_companies',
      'verify_documents',
      'manage_vacancies',
      'analytics_access',
      'system_settings'
    ]::text[],
    'Super Administrador inicial aprovisionado mediante procedimiento seguro de bootstrap operacional.',
    NOW(),
    NOW()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    sub_role = EXCLUDED.sub_role,
    department = EXCLUDED.department,
    status = EXCLUDED.status,
    permissions = EXCLUDED.permissions,
    notes = EXCLUDED.notes,
    updated_at = NOW();

  RAISE NOTICE 'Éxito: Super Administrador (%) aprovisionado con rol "admin" y perfil de staff activo (UUID: %).', target_email, target_user_id;
END $$;
```

---

### Paso 4: Ejecutar la Consulta de Verificación

Ejecute la siguiente consulta en el **SQL Editor** para comprobar el estado final de la cuenta:

```sql
-- ============================================================================
-- CONSULTA DE VERIFICACIÓN DE PERFIL ADMINISTRATIVO
-- ============================================================================

SELECT 
  p.id AS profile_id,
  p.email,
  p.full_name,
  p.role AS profile_role,
  p.is_verified,
  s.id AS staff_id,
  s.sub_role,
  s.department,
  s.status AS staff_status,
  s.permissions,
  s.created_at AS staff_created_at
FROM public.profiles p
JOIN public.admin_staff_members s ON s.profile_id = p.id
WHERE p.id = '<USER_UUID>'::uuid;
```

**Resultado esperado:**
- `profile_role`: `'admin'`
- `is_verified`: `true`
- `sub_role`: `'super_admin'`
- `staff_status`: `'active'`
- `permissions`: contiene `['manage_users', 'manage_companies', 'verify_documents', 'manage_vacancies', 'analytics_access', 'system_settings']`

---

### Paso 5: Verificación de Inicio de Sesión en la Aplicación

1. Navegue a la pantalla de login de K'anPro: `/login` o `/auth/login`.
2. Inicie sesión con el correo y contraseña configurados.
3. El sistema redirigirá al panel administrativo en `/dashboard/admin`.
4. Compruebe el acceso a la sección de **Gestión de Personal** (`/dashboard/admin/staff`).

---

## 4. Gestión de Contingencias y Desactivación

Si es necesario suspender o revocar el acceso del Super Administrador:

```sql
-- Desactivación operacional de un administrador
UPDATE public.admin_staff_members
SET status = 'suspended', updated_at = NOW()
WHERE profile_id = '<USER_UUID>'::uuid;

-- Revocación de rol en profiles
UPDATE public.profiles
SET role = 'candidate'::public.user_role, updated_at = NOW()
WHERE id = '<USER_UUID>'::uuid;
```

---

## 5. Resumen de Controles de Seguridad Aplicados

| Control | Mecanismo | Garantía |
|---|---|---|
| **Cero superficie pública** | Exclusión de APIs públicas de bootstrap | Ningún atacante puede invocar un endpoint para autoproclamarse admin. |
| **Integridad de Trigger** | `public.handle_new_user()` con `search_path = public, pg_temp` | Bloquea inyecciones en `raw_user_meta_data`. |
| **Invariante de Degradación** | `ON CONFLICT` con preservación de rol `admin` | Actualizaciones posteriores no degradan ni corrompen el perfil. |
| **RLS y Políticas** | RLS activo en `profiles` y `admin_staff_members` | Los datos de staff solo son legibles y modificables por administradores autenticados. |
