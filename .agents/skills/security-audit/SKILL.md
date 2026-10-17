---
name: security-audit
description: "Auditoría exhaustiva de ciberseguridad, multitenancy, RLS y vulnerabilidades OWASP para KanPro (Next.js + Supabase)."
---
# Protocolo de Auditoría de Ciberseguridad

Cuando se invoque este skill (vía `/security-audit` o por solicitud de auditoría), ejecuta una inspección forense exhaustiva sobre el módulo o archivo indicado (o sobre todo el proyecto si no se especifica) siguiendo estas fases:

## Fase 1: Escaneo de Fugas de Service Role y Secretos
1. Busca en todo `src/` importaciones de `@/lib/supabase/admin` o uso de `SUPABASE_SERVICE_ROLE_KEY`.
2. **Criterio de Fallo Crítico:** Si el cliente admin se utiliza en `modules/company/` o `modules/candidate/` fuera de tareas de sistema o validaciones de `require-admin.ts`, márcalo como **Vulnerabilidad Crítica**.
3. Verifica que no existan variables de entorno secretas con el prefijo `NEXT_PUBLIC_`.

## Fase 2: Control de Acceso en Server Actions (Anti-Bypass HTTP)
1. Revisa cada archivo en `src/modules/**/actions/*.ts` y `src/app/**/actions.ts`.
2. Confirma que **todos** los Server Actions:
   - Verifiquen la sesión del usuario con `supabase.auth.getUser()`.
   - Si la acción es de empresa, comprueben la vinculación del usuario con el `company_id`.
   - Si la acción es de candidato, restrinjan los cambios a registros donde `candidate_id === user.id`.
   - Si la acción es de administrador, llamen a `requireAdmin()`.
3. **Criterio de Fallo:** Cualquier mutación accesible sin verificación de sesión o sin validar pertenencia tenant debe marcarse como **Vulnerabilidad Alta (IDOR / Broken Access Control)**.

## Fase 3: Protección de Documentos Sensibles y PII (LFT / SAT)
1. Revisa las consultas y descargas de identificadores (`MexicanRFC`, `MexicanCURP`, `MexicanNSS`, CLABE) y archivos en Supabase Storage (INE, constancias fiscales, contratos).
2. Verifica que las descargas de Storage utilicen URLs firmadas (`createSignedUrl`) con tiempo de expiración máximo de 900 a 3600 segundos y nunca enlaces públicos directos.

## Fase 4: Validación de Entradas e Inyecciones
1. Confirma que ningún Action ni Service concatene texto dinámico en consultas RPC o filtros de Supabase.
2. Comprueba que toda entrada esté parseada con esquemas Zod estrictos (`safeParse`).

## Fase 5: Ejecución de Tests Adversariales
1. Ejecuta en el sandbox la suite de pruebas de penetración lógica:
   `pnpm vitest run src/tests/security/ src/tests/integration/`
2. Identifica si algún test de seguridad arroja advertencias o fallas.

## Fase 6: Entregable - Reporte de Auditoría
Genera un informe con la siguiente estructura:
- **Resumen Ejecutivo:** Nivel de postura de seguridad general (A / B / C / D).
- **Matriz de Hallazgos:**
  | ID | Severidad (Crítica/Alta/Media/Baja) | Vector OWASP | Archivo Afectado | Descripción del Riesgo |
- **Detalle de Vulnerabilidades:** Código vulnerable (Before) y corrección recomendada (After).
- **Checklist de Remediación:** Pasos priorizados para mitigar los riesgos encontrados.
