---
trigger: always_on
description: "Límites arquitectónicos, convención Handler-Service y flujo de capas en KanPro."
---
# Convenciones de Arquitectura Modular de KanPro

Toda interacción de mutación de datos debe seguir de forma estricta el patrón **Schema ➔ Handler ➔ Service**:

## 1. Capa de Validación (`schemas/*.schema.ts`)
- Define los contratos de entrada mediante esquemas Zod inmutables.
- Infiere los tipos de datos directamente del esquema (`z.infer<typeof schema>`).

## 2. Capa Handler (`actions/*.ts` o `route.ts`)
- Actúa únicamente como receptor y adaptador del entorno web.
- **Responsabilidades exclusivas:**
  1. Validar la entrada cruda contra el esquema Zod (`safeParse`).
  2. Obtener y verificar la sesión/permisos del usuario autenticado vía `src/lib/supabase/server.ts`.
  3. Instanciar e invocar el Service correspondiente pasándole los datos ya limpios.
  4. Gestionar revalidación de caché (`revalidatePath`), redirecciones y retornar la respuesta estándar:
     `{ success: true, data: T } | { success: false, error: string }`.
- **Prohibido:** No realices queries directas a tablas de Supabase dentro de un Action/Handler.

## 3. Capa Service (`services/*.ts`)
- Concentra la lógica de negocio pura y las operaciones sobre la base de datos.
- **Responsabilidades exclusivas:**
  1. Recibir parámetros primitivos o interfaces desacopladas del protocolo HTTP.
  2. Implementar las validaciones de negocio (geocercas, estados permitidos, multitenancy).
  3. Ejecutar consultas y mutaciones a través del cliente de base de datos inyectado.
- **Prohibido:** No utilices `revalidatePath`, `redirect`, `headers()`, `cookies()`, ni dependencias de Next.js dentro de los Services. Deben ser testeables de forma aislada.
