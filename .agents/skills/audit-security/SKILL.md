---
name: audit-security
description: "Audita Server Actions, rutas y servicios en busca de llamadas indebidas a admin.ts o consultas sin filtro multitenant."
---
# Auditoría de Seguridad y Multitenancy

Revisa los archivos modificados siguiendo estos pasos:

1. **Uso de Service Role:**
   - Comprueba que `src/lib/supabase/admin.ts` no esté importado fuera de `src/lib/auth/require-admin.ts` o procesos de sistema.
2. **Fugas de Tenant:**
   - Verifica que las consultas a tablas empresariales incluyan `.eq('company_id', companyId)`.
3. **Manejo de Errores:**
   - Asegura que ningún mensaje de error exponga trazas internas de Postgres o variables de entorno.
