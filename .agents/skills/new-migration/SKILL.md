---
name: new-migration
description: "Genera una nueva migración SQL para Supabase con RLS habilitado, índices de rendimiento y convenciones de nombrado."
---
# Generador de Migraciones Supabase

Al crear una migración en `supabase/migrations/`:

## 1. Nombrado y Timestamp
- Formato de archivo: `YYYYMMDDHHMMSS_<descripcion_corta>.sql`.
- Usa la fecha actual en formato UTC de 14 dígitos.

## 2. Checklist Obligatorio de Seguridad
Toda tabla creada debe incluir:
1. `ALTER TABLE <nombre_tabla> ENABLE ROW LEVEL SECURITY;`
2. Políticas RLS explícitas para `SELECT`, `INSERT`, `UPDATE` y `DELETE`.
3. Aislamiento por `company_id` o `user_id` vinculado a `auth.uid()`.
4. Índices para claves foráneas y columnas de filtrado frecuente:
   `CREATE INDEX IF NOT EXISTS idx_<tabla>_<columna> ON <tabla>(<columna>);`
