---
name: scaffold-flow
description: "Genera el andamiaje completo de un nuevo caso de uso o mutación en KanPro siguiendo el patrón Schema -> Service -> Action Handler."
---
# Generador de Flujos Handler-Service

Cuando se solicite implementar una nueva mutación o endpoint para un módulo de KanPro:

## 1. Schema de Entrada
- Ubicación: `src/modules/<modulo>/schemas/<entidad>.schema.ts`
- Define el esquema con Zod validando precondiciones (formatos, rangos, obligatoriedad).
- Exporta el tipo inferido: `export type <Entidad>Input = z.infer<typeof <entidad>Schema>;`.

## 2. Service de Dominio
- Ubicación: `src/modules/<modulo>/services/<modulo>-<entidad>.ts`
- Implementa una clase o funciones que reciban el `SupabaseClient` y los datos validados.
- Aplica las reglas de negocio (invariantes, cálculos, filtros multitenant `company_id`).
- Lanza excepciones explícitas si se violan reglas (`throw new Error(...)`).

## 3. Server Action (Handler)
- Ubicación: `src/modules/<modulo>/actions/<entidad>.ts`
- Incluye `"use server"`.
- Valida con `safeParse`.
- Obtiene la sesión con `createServerClient()`.
- Llama al Service dentro de `try/catch` y revalida la ruta afectada con `revalidatePath`.
- Retorna `{ success: true, data }` o `{ success: false, error }`.

## 4. Test Unitario Base
- Crea el test en `src/tests/<modulo>/` comprobando el Service con un mock de base de datos.
