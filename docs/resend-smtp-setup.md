# Guía de Configuración: Resend SMTP con Supabase Auth para K'anPro

Esta guía explica cómo conectar **Resend** a tu proyecto de **Supabase** para enviar correos de verificación, restablecimiento de contraseña y notificaciones sin restricciones ni límites de tarifa por defecto.

---

## 1. Obtener API Key en Resend
1. Regístrate o inicia sesión en [Resend.com](https://resend.com).
2. Ve a la sección **API Keys** y genera una nueva clave con permisos de envío (`Sending access`).
3. Copia el token generado (inicia con `re_...`).

---

## 2. Configurar Dominio en Resend (Producción o Staging)
- **Para pruebas rápidas / Staging**: Puedes usar el remitente de pruebas de Resend: `onboarding@resend.dev`.
- **Para Producción (`kanpro.mx`)**:
  1. En Resend, ve a **Domains** > **Add Domain** e ingresa `kanpro.mx`.
  2. Agrega los registros DNS (DKIM, SPF y MX) proporcionados por Resend en tu proveedor de dominio (Cloudflare, GoDaddy, Namecheap, etc.).
  3. Una vez verificado, podrás enviar desde `noreply@kanpro.mx` o `hola@kanpro.mx`.

---

## 3. Conectar SMTP en el Dashboard de Supabase
1. Ingresa a tu proyecto en el [Dashboard de Supabase](https://supabase.com/dashboard).
2. En el menú lateral, ve a **Authentication** > **SMTP Settings** (o **Email Settings**).
3. Activa la opción **Enable Custom SMTP**.
4. Completa los siguientes campos:
   - **Sender email**: `noreply@kanpro.mx` (o `onboarding@resend.dev` en staging).
   - **Sender name**: `K'anPro Sureste`
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) o `587` (TLS)
   - **Minimum TLS Version**: `1.2`
   - **User**: `resend`
   - **Password**: Tu clave API de Resend (`re_...`)
5. Haz clic en **Save**.

---

## 4. Configurar URLs de Redirección en Supabase Auth
En **Authentication** > **URL Configuration**:
- **Site URL**: `https://tu-proyecto.vercel.app` (o `https://kanpro.mx`)
- **Redirect URLs**:
  - `https://tu-proyecto.vercel.app/**`
  - `http://localhost:3000/**`
  - `https://kanpro.mx/**`
