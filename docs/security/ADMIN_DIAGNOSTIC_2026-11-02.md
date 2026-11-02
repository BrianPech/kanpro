# Diagnóstico y plan del panel administrativo de Kanpro

Fecha: 2 de noviembre de 2026. Alcance: revisión de código administrativo y dependencias de autorización, catálogo de la base Supabase conectada y pruebas aisladas. Rama observada: `dev`, con cambios previos de otro trabajo. Esta revisión añade únicamente este documento.

## Resumen ejecutivo

Postura estimada: **D — bloqueadores para producción**. Existe una base funcional amplia, pero el modelo de permisos administrativos no se aplica de forma uniforme en servidor y base de datos. Las operaciones de suspensión, moderación y verificación presentan errores que afectan controles esenciales de operación.

Se consultó el proyecto Supabase `kanpro` (`jlousiupvazrhhhclfxe`) mediante consultas de lectura de catálogos y advisors. No se modificaron datos, usuarios, políticas, funciones ni migraciones. No se verificó que este proyecto sea el destino del despliegue productivo ni que coincida con el entorno local de ejecución. Los riesgos derivados de políticas se deducen de sus definiciones y grants efectivos; no se ejecutaron ataques ni mutaciones de prueba sobre la base compartida.

La ruta solicitada `src/app/(dashboard)/admin` no existe. La implementación está en `src/app/(dashboard)/dashboard/admin`, accesible mediante `/dashboard/admin`.

## Arquitectura e inventario

Las páginas y Server Actions residen en el árbol de rutas. `src/modules/admin` concentra componentes, tipos y dos servicios. Gran parte de la lógica de negocio y las consultas sigue dentro de `actions.ts`; no hay una capa administrativa uniforme de esquemas y servicios. Hay que evolucionar por caso de uso y reutilizar los componentes existentes.

| Área | Implementación encontrada | Estado operativo |
|---|---|---|
| Inicio | Tarjetas, serie temporal de 90 días y actividad; `services/admin-analytics.ts` | Parcial: consultas sujetas a RLS de tenant, errores y ceros ambiguos, sin permiso `analytics_access` en el servicio |
| Usuarios | Directorio, detalle, edición, cambio de rol y estado | Parcial: estado visual fijo, suspensión inefectiva y promoción sin flujo consistente de staff |
| Staff | Alta con Auth Admin, edición de permisos, suspensión y baja; cinco subroles | Implementado con guardas parciales; RLS permite eludir el control de superadministrador |
| Verificaciones | Empresas, candidatos, documentos, vistas de expediente y dictámenes | Implementado; URLs firmadas de 600 segundos, validación de documentos posterior a escrituras |
| Moderación | Reportes de vacantes, desactivación, bloqueo e insignia empresarial | Parcial: estados incompatibles con la base y permisos insuficientes en mutaciones |
| Soporte | Tickets, conversación, notas internas, prioridad, notificaciones y herramientas | Amplio pero incompleto: permisos genéricos, operaciones sin transacción y herramientas incompatibles con RLS |
| Empresa 360 | `/companies/[id]`, diagnóstico de equipo, vacantes, contratos, nómina y soporte | Servicio con `manage_companies` y cliente privilegiado; revisar exposición mínima de PII y permisos de lectura |
| Configuración | Lectura y persistencia en `system_settings`, incluido demo rollout | Persistencia real; no se encontraron consumidores operativos de varias opciones de seguridad y privacidad |
| Impersonación | Cookies firmadas HMAC, inicio, salida y resolución del objetivo | Falta validar membresía de staff y permiso específico; no basta cambiar identidad visual para cambiar el contexto RLS |

No se identificaron en el árbol administrativo pantallas dedicadas a solicitudes ARCO, bitácora administrativa, conciliación de créditos/facturas ni un directorio empresarial independiente. Sí existen `arco_requests`, `company_invoices`, datos de suscripción y créditos en la base: son capacidades parciales, no módulos completos de operación.

## Esquema, roles y RLS efectivos

- Roles generales: `candidate`, `company`, `admin` en `profiles.role`.
- Subroles definidos en aplicación: `super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`.
- Permisos definidos: `manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`. No hay un permiso específico de impersonación o soporte.
- Las 37 tablas públicas encontradas tienen RLS habilitado. Esto no garantiza autorización suficiente: los predicados y grants siguen siendo determinantes.
- `app_private.is_admin()` comprueba únicamente `profiles.role = 'admin'`; omite `profiles.status`, membresía, estado de staff y permisos.
- `app_private.has_admin_permission(text)` sí exige perfil no suspendido, staff activo y permiso o subrol de superadministrador. En las políticas inspeccionadas se usa para `candidate_private_profiles`, pero no de forma generalizada.
- `admin_staff_members` permite `ALL` a `authenticated` con `is_admin()`. El mismo rol dispone de grants de lectura y escritura. Las políticas de perfiles, empresas, documentos, tickets y reportes también usan el permiso administrativo general.
- `system_settings`, `arco_requests` y lectura administrativa de Storage consultan directamente el rol general, sin exigir staff activo.
- `vacancies`, `applications`, `employee_invitations`, `company_employees` y `company_attendance` no tienen una política general para los casos administrativos encontrados. Una sesión admin con cliente normal puede obtener cero filas o no mutar registros de otra empresa.
- `candidate_directory` y `company_directory` tienen `security_invoker=true` y `security_barrier=true`.
- `profile_documents` es un bucket privado; `avatars` y `company_assets` son públicos. Los expedientes generan firmas de 600 segundos, pero aceptan URLs HTTP preexistentes sin normalizarlas.
- El trigger de creación de usuarios limita los roles públicos a candidato/empresa, aunque alguien envíe `role=admin` en metadata. El alta administrativa usa Auth Admin y después eleva el perfil explícitamente.
- Hay diferencias de versiones entre archivos de migración locales y el historial remoto: desde `create_system_settings`, varias migraciones remotas conservan el nombre pero tienen versiones del 31 de octubre. No debe aplicarse todo lo local a ciegas; comparar contenido y reconciliar historial antes de desplegar cambios.

## Matriz de hallazgos

| ID | Severidad / prioridad | Vector | Evidencia | Riesgo y corrección |
|---|---|---|---|---|
| A01 | Crítica / P0 | OWASP A01: control de acceso | Política efectiva de `admin_staff_members`; `app_private.is_admin()` | Un perfil admin puede modificar directamente su subrol/permisos y los de otros, incluso estando suspendido en staff. Restringir escrituras a superadministradores activos y proteger integridad del último superadministrador en base de datos. |
| A02 | Alta / P0 | OWASP A01 | `users/actions.ts:68`, `reports/actions.ts`, `support/actions.ts` | `updateUserProfile` cambia `role` con una guarda genérica y omite protecciones de `updateUserRole`. Muchas mutaciones no exigen permisos por operación. Separar promoción administrativa, exigir superadministrador y aplicar una matriz común en acciones y RLS. |
| A03 | Alta / P0 | OWASP A01 | `users/actions.ts:30`, `reports/actions.ts:111`, `users/page.tsx:34` | Suspender/banear escribe `location` e `is_verified`, no `status`; reactivar tampoco limpia el marcador anterior. El directorio presenta todos como activos. Implementar estado real y denegación efectiva en accesos y mutaciones; revisar sesiones existentes. |
| A04 | Alta / P0 | Integridad de negocio | `reports/actions.ts:80`, `:111`; constraint remoto `vacancies_status_check` | Se escriben `hidden`/`banned`, pero solo se admiten `Activa`, `Pausada`, `Cerrada`, `Borrador`. Además, RLS no autoriza al admin a modificar vacantes ajenas. La acción puede fallar o declarar éxito con cero filas; en ban se ignora el error secundario. Usar estados válidos, comprobar filas afectadas y autorización específica. |
| A05 | Alta / P0 | Integridad de negocio | `verifications/actions.ts:481`, `:552` | Empresa: actualiza `verification_status` antes de comprobar documentos. Candidato: establece `is_verified` antes de comprobarlos. Un error deja cambios persistidos. Validar antes y ejecutar el dictamen completo de forma transaccional con control de concurrencia. |
| A06 | Alta / P0 | OWASP A01 | Políticas propias de `profiles` y `company_profiles`; grants UPDATE y ausencia de triggers protectores | Los propietarios pueden modificar `profiles.is_verified`/`status` y `company_profiles.verification_status`; las políticas no restringen esas columnas. La integridad de insignias y suspensiones no puede depender del formulario. Proteger columnas operativas mediante grants, funciones controladas o triggers según el diseño acordado. |
| A07 | Alta / P1 | OWASP A01/A07 | `require-admin.ts:52`, `:186`; `impersonation.ts` | `requireAdmin()` no consulta staff. `requireAdminAuth()` contiene rutas permisivas ante respuestas incompletas, permisos ausentes y subrol ausente. Impersonación solo consulta perfil y omite staff. Denegar ante errores/campos faltantes, requerir estado activo y centralizar comprobaciones. |
| A08 | Alta / P1 | OWASP A01: privacidad | Políticas de `profiles`, `company_profiles`, `profile_documents` y `storage.objects` | El directorio de candidatos permite leer filas completas a usuarios autenticados, incluidas columnas de contacto; las empresas tienen lectura pública de filas completas. Documentos/Storage se autorizan por rol admin general. Usar proyecciones seguras y permiso de expediente en metadatos y archivos. Revisar alcance de campos públicos con el otro agente. |
| A09 | Alta / P1 | Integridad operativa | `support/actions.ts:565`, `:682` | Invitaciones se consultan con un cliente que RLS limita al propietario. El reset de kiosco genera un token, pero solo persiste `updated_at` y una notificación: no demuestra revocar credenciales anteriores. Integrar contratos reales de invitación/kiosco y verificar efecto de extremo a extremo. |
| A10 | Media / P1 | Integridad/concurrencia | `support/actions.ts:194`, `:467`; staff/actions.ts | Número de ticket derivado de COUNT, créditos con lectura-modificación-escritura, alta/baja/edición en varias operaciones. Riesgo de colisiones, actualizaciones perdidas y cambios parciales. Usar secuencia, actualización atómica, transacciones e idempotencia. La protección del último superadmin es una lectura previa sin bloqueo. |
| A11 | Media / P1 | OWASP A04/A09 | `settings/actions.ts:55`, `settings-dialog.tsx`, `admin-analytics.ts`, listados | Configuración admite claves con `unknown`; MFA, timeout, intentos, retención y alertas se guardan sin consumidores encontrados. Listados sin paginación real de servidor y errores convertidos en vacío/cero; métricas pueden estar limitadas por RLS y límites del API. Validar estructura, distinguir error de ausencia y conectar cada opción a comportamiento verificable. |
| A12 | Media / P1 | OWASP A09 | Acciones administrativas y catálogo de tablas | No se encontró una bitácora administrativa estructurada para actor, motivo, objetivo y cambios. Notificaciones y notas no cubren auditoría. Añadir registro transaccional protegido con trazabilidad de acciones y accesos sensibles. |

### Cambios recomendados: antes y después

Ejemplos conceptuales; no constituyen código aplicado ni una migración lista para ejecutar.

1. **Staff:** antes, `is_admin()` autoriza `ALL`; después, lectura mínima para consultar la propia membresía y escritura exclusivamente para superadministrador activo. La consulta propia debe seguir funcionando sin provocar recursión RLS. Probar degradación, suspensión, acceso REST directo y último superadministrador.
2. **Edición de usuarios:** antes, `requireAdminAuth()` y `{ full_name, role }` en una sola edición; después, esquema estricto de campos editables más `manage_users`. La promoción de rol será una operación independiente para superadministrador, con staff coherente y auditoría.
3. **Suspensión:** antes, `{ location: 'SUSPENDIDO', is_verified: false }`; después, transición validada de `profiles.status`, motivo auditado y enforcement del estado en servidor/base de datos, considerando tokens ya emitidos.
4. **Verificación:** antes, escritura y luego validación documental; después, comprobar permiso, documentos y estado esperado antes de una transacción que persista dictamen, insignia y auditoría de manera conjunta. La notificación deberá ser confiable y reintentable.
5. **Moderación:** antes, `status: 'hidden'` y éxito basado solo en ausencia de `error`; después, un estado admitido y una operación autorizada que confirme exactamente el objetivo actualizado y registre el resultado.

## Advisors y límites de interpretación

Supabase Advisor señala EXECUTE público sobre `public.auto_confirm_user_email()` y EXECUTE autenticado sobre `public.sign_employee_contract(...)`. La primera retorna `trigger`: la advertencia no demuestra que pueda ejecutarse como una RPC ordinaria. Revisar y reducir grants innecesarios. La segunda puede requerir EXECUTE para cumplir su función; revisar autorización interna, no revocarla automáticamente.

El trigger efectivo `on_auth_user_auto_confirm_email` confirma correos en cada inserción. Esto debe conciliarse con la política de identidad esperada antes de producción: disponer del correo declarado no queda demostrado por ese trigger.

Remediaciones oficiales del advisor: [funciones definer para anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) y [para authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Referencia de grants y RLS: [documentación de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

No se observó exposición de service role en los componentes administrativos revisados; el cliente privilegiado está marcado `server-only`. Se encontró su uso en `modules/company/actions/employees.ts` para registro directo. Según el skill local de auditoría, es un hallazgo crítico a derivar al responsable del módulo; el impacto explotable requiere revisar el servicio completo y no se deduce de la importación por sí sola. No se modifica ese flujo en este alcance.

## Plan de implementación por fases

### Fase 0 — Preparar trabajo aislado y contrato de acceso

- Crear/asignar una rama `codex/admin-*` y un worktree exclusivo antes de implementar; no desarrollar sobre la rama compartida `dev` observada.
- Acordar con el responsable de empresa/auth la matriz de permisos, columnas protegidas y transiciones de estado. Mantener interfaces públicas existentes mediante adaptadores cuando sea posible.
- Comparar definiciones y versiones de migración locales/remotas; preparar una base desechable y datos de prueba sin PII real.
- Archivos: este diagnóstico, documentación de RBAC y futuras pruebas administrativas. Sin nuevas dependencias.
- Salida: alcance de propiedad claro y entorno reproducible.

### Fase 1 — Cerrar bloqueadores de seguridad y operación (P0)

- Resolver A01–A06: staff sin autoescalamiento, permisos por acción, suspensión efectiva, moderación compatible y verificación atómica.
- Endurecer guardas con denegación ante datos incompletos y proteger último superadministrador en base de datos.
- Añadir esquemas estrictos de entrada y trazabilidad mínima a mutaciones críticas.
- Archivos previstos: `src/app/(dashboard)/dashboard/admin/{users,staff,reports,verifications}/actions.ts`, `src/modules/admin/{schemas,services}/`, pruebas administrativas y una nueva migración.
- Dependencias compartidas que requieren aprobación previa según AGENTS.md: `src/lib/auth/require-admin.ts`, `src/lib/auth/impersonation.ts` si se interviene, autorización fuera del módulo y cambios de contrato de base de datos. Aplicar migraciones a entornos compartidos requiere aprobación independiente.
- Salida: pruebas reales de denegación para anon/candidato/empresa/staff sin permiso/suspendido; permisos válidos funcionan; suspensiones no se autorrevierten; ningún dictamen fallido persiste aprobación; no se pierde el último superadministrador por concurrencia.

### Fase 2 — Completar la operación diaria (P1)

- Directorio con estado real, búsqueda/paginación/orden del servidor y detalle con datos mínimos.
- Verificaciones con requisitos documentales explícitos, motivo de rechazo, historial y coherencia de insignia al reemplazar/rechazar documentos.
- Soporte con asignación, colas/prioridades, conversación y notas internas verificadas; secuencia de tickets y notificaciones confiables.
- Herramientas de créditos, invitaciones e impersonación con permisos específicos y auditoría. Kiosco solo tras acordar el contrato con el responsable de asistencia.
- Archivos: componentes y acciones administrativos existentes, servicios/esquemas del módulo, pruebas de integración/E2E. Coordinar cualquier ampliación de permisos o contratos con el otro agente antes de editar archivos compartidos.
- Salida: flujo completo usuario → solicitud → gestión administrativa → persistencia → notificación, con casos de error y repetición comprobados.

### Fase 3 — Observabilidad, privacidad y puesta en producción (P1)

- Métricas globales autorizadas y agregadas, sin descargas completas para calcular totales; separar resultados vacíos de fallas y eliminar porcentajes fijos del directorio.
- Bitácora consultable con acceso limitado y política de retención. Bandeja ARCO sobre la tabla existente.
- Configuración con esquemas por categoría; cada opción debe tener un consumidor real y validación de efecto, o quedar identificada como no disponible.
- MFA de staff y sesiones según una política acordada; revisar confirmación de correo y grants de funciones señaladas por advisors.
- Corregir lint, ejecutar regresión de permisos y E2E en un entorno aislado; validar recuperación y rollback del despliegue.
- Salida: todas las pruebas de aceptación pasan, auditoría utilizable y procedimientos de alta/baja de staff documentados.

### Fase 4 — Administración comercial y optimización (P2)

- Gestión operativa de suscripciones, créditos y facturas sobre el esquema existente, sin introducir un sistema de cobros nuevo dentro de este alcance.
- Exportaciones autorizadas, SLA automatizados, indicadores de conversión y optimización de consultas basadas en mediciones.
- Posponer rediseños generales y refactors extensos hasta cerrar las fases de seguridad y operación.

## Validación ejecutada

- `pnpm vitest run src/__tests__/admin/ src/__tests__/security/admin-privilege-hardening.test.ts src/tests/admin-security-hardening.test.ts`: **4 archivos, 39 pruebas aprobadas**. Son pruebas aisladas con mocks; algunos mocks de autorización no representan registros de staff completos, por lo que no acreditan RLS ni rechazo ante datos faltantes.
- `pnpm exec tsc --noEmit --incremental false`: **aprobado**, sin errores.
- `pnpm exec eslint 'src/app/(dashboard)/dashboard/admin' src/modules/admin src/lib/auth/require-admin.ts src/lib/auth/impersonation.ts`: **11 errores y 61 advertencias**. Incluye `any`, apóstrofes sin escapar y actualización síncrona de estado desde un efecto; advertencias de imports, dependencias de hooks y TanStack/React Compiler.
- Consultas remotas de lectura: políticas, grants, funciones de autorización, triggers, constraints, tablas/RLS, vistas, buckets e historial de migraciones; Advisor de seguridad consultado.
- No se ejecutó la suite general `src/tests/integration/`: sus helpers cargan `.env.local`, crean usuarios reales y hacen limpieza destructiva. La prohibición del proyecto de ejecutar operaciones destructivas y el alcance de diagnóstico prevalecen sobre el comando genérico del skill. Debe ejecutarse en una base desechable tras preparar el entorno. `src/tests/security/` no existe; hay pruebas en `src/__tests__/security/`.
- No se ejecutó build ni prueba funcional en navegador. Este informe no certifica el despliegue ni funcionamiento E2E.

## Orden mínimo para producción

1. Aislar el trabajo y alinear historial de migraciones.
2. Cerrar autoescalamiento, proteger columnas operativas y aplicar permisos/estado de staff de extremo a extremo.
3. Hacer efectivas suspensión, moderación y verificación, con transacciones y resultados comprobables.
4. Completar soporte básico, trazabilidad y manejo visible de errores.
5. Aprobar pruebas reales de autorización, persistencia y recorridos E2E antes de liberar.

Los informes históricos `RBAC_POST_HARDENING_AUDIT.md` y `RBAC_HARDENING_BLUEPRINT.md` son antecedentes. Sus cifras y afirmaciones no deben interpretarse como el estado actual; esta revisión encontró avances parciales y riesgos todavía presentes.
