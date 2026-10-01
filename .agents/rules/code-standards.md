---
trigger: always_on
description: "Estándares transversales de Clean Code, TypeScript estricto y programación estructurada para KanPro."
---
# Estándares de Clean Code y Programación Estructurada

Aplica estas directrices en cualquier archivo TypeScript/TSX del proyecto:

## 1. Programación Estructurada y Control de Flujo
- **Cláusulas de Guarda (Early Returns):** Prohibido el anidamiento profundo de bloques `if/else`. Valida precondiciones y sal inmediatamente de la función.
- **Funciones Pequeñas de Responsabilidad Única:** Cada función o componente debe resolver exactamente un objetivo. Si una función supera las 30 líneas, evalúa extraer subtareas.
- **Inmutabilidad por Defecto:** Trata los datos como de solo lectura. Prefiere transformaciones funcionales (`map`, `filter`, `reduce`) sobre mutaciones con bucles `for` imperativos.

## 2. TypeScript Estricto
- **Cero `any`:** Está estrictamente prohibido el tipo `any`. Usa `unknown` si el tipo es verdaderamente incierto y redúcelo con discriminadores de tipo o esquemas Zod.
- **Tipado Explícito en Contratos:** Tipa siempre los parámetros de entrada y los retornos de funciones públicas, Server Actions y servicios.
- **Single Source of Truth:** Reutiliza las definiciones generadas de Supabase (`src/types/supabase.ts`) o los esquemas Zod mediante `z.infer<typeof schema>`. No dupliques interfaces manuales.

## 3. Manejo Limpio de Errores
- No uses `catch (error) {}` vacíos.
- En Server Actions (`actions.ts`), no dejes que excepciones no controladas lleguen al cliente. Devuelve siempre una estructura uniforme de respuesta:
  `{ success: true, data: T } | { success: false, error: string }`.
