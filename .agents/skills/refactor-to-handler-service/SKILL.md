---
name: refactor-to-handler-service
description: "Refactoriza un Server Action o componente acoplado de KanPro para adoptar la arquitectura estricta Schema -> Handler -> Service."
---
# Protocolo de Migración a Handler-Service

Cuando se te solicite migrar un flujo legacy o acoplado:

## 1. Análisis de Responsabilidades
1. Revisa el archivo objetivo (Server Action en `actions/*.ts` o lógica embebida en componentes).
2. Identifica:
   - Parámetros de entrada sin validar o con tipos laxos.
   - Verificaciones de sesión o auth de Supabase.
   - Lógica de negocio y consultas directas a base de datos (`.from(...)`).
   - Efectos secundarios (`revalidatePath`, `redirect`).

## 2. Extraer el Schema (`schemas/<entidad>.schema.ts`)
1. Define el esquema Zod estricto para las entradas.
2. Infiere y exporta el tipo TypeScript: `export type <Accion>Input = z.infer<typeof <accion>Schema>;`.

## 3. Extraer el Service (`services/<modulo>-<entidad>.ts`)
1. Crea o extiende la clase/servicio.
2. Inyecta el cliente de Supabase (`SupabaseClient`).
3. Mueve aquí todas las consultas a tablas, filtros `company_id`, transacciones y validaciones de negocio.
4. Lanza errores con `throw new Error(...)` si las condiciones no se cumplen.
5. **No uses** `cookies()`, `headers()`, ni funciones de Next.js aquí.

## 4. Limpiar el Handler (`actions/<entidad>.ts`)
1. Mantén `"use server"`.
2. Valida la entrada con `safeParse`.
3. Obtén la sesión con `createServerClient()`.
4. Instancia el Service, ejecuta el método dentro de `try/catch`.
5. Ejecuta `revalidatePath` si aplica.
6. Retorna `{ success: true, data }` o `{ success: false, error: error.message }`.

## 5. Pruebas de Regresión
1. Ejecuta los tests del módulo para comprobar que no hubo roturas.
