# Reporte de Verificación Pre-Producción en Preview (Vercel + Supabase Staging)

- **Fecha:** 2026-11-18
- **Rama / Commit:** `dev` @ `e8256c4a7fa57f3d3edd7774c2c7ec92148ad51c`
- **Preview URL:** `https://kanpro-75qn2al0k-brianpechs-projects.vercel.app/` (Deployment `dpl_7pp3Jdutd82hG5dgK2K2833aWZEL`, estado `READY`)
- **Base de datos:** Supabase `kanpro-staging` (ref `zoxtlrjwymzrlrqsganh`)
- **Herramienta:** Playwright MCP con 2 contextos aislados (`isolatedContext: empresa` e `isolatedContext: candidato`) autenticados vía Shareable Link de Vercel (`get_access_to_vercel_url`).
- **Alcance:** Solo lectura/operación E2E sobre Preview + staging. Sin modificaciones de código fuente.

---

## Parte 0 — Sanity Check (Preview ↔ Staging)

| Verificación | Estado | Evidencia |
| :--- | :--- | :--- |
| Staging aislado sin datos de producción | **OK** | Consulta inicial en `zoxtlrjwymzrlrqsganh`: `1` usuario (`brianpech224@gmail.com`), `1` empresa (`K'anPro`), `0` vacantes. En `/dashboard/company` solo figuró `Hotel Coral Preview QA`. |
| Confirmación de correo en registro QA | **OK** | El registro de `qa-preview-empresa-1794980458945@kanpro-qa.local` y `qa-preview-cand-1794980981293@kanpro-qa.local` avanzó directo al onboarding/dashboard sin bloqueo por confirmación de correo. |
| Acceso a `/dashboard/company/contracts` | **OK** | Accesible con `200 OK` para empresa recién creada desde Semana 1, sin pantalla de `"Liberación Programada"`. |

- **Captura Parte 0:** `page-2026-11-18T05-41-25-433Z.png`

---

## Parte 1 — Panel de Empresa (16 Opciones + Pendientes de 1ª Auditoría)

| Opción / Módulo | Ruta / Elemento | Estado HTTP | Consola (JS / Base UI) | Red (`>=400`) | Resultado y Observación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1. Inicio | `/dashboard/company` | `200` | `0` errores | `0` | Muestra `"18 de noviembre de 2026"` (hora local Cancún). Sin errores `nativeButton`. |
| 2. Vacantes | `/dashboard/company/vacancies` | `200` | `0` errores | `0` | Carga limpia, KPIs en 0 inicialmente y vacante publicada en Parte 2. |
| 3. Aplicaciones | `/dashboard/company/applications` | `200` | `0` errores | `0` | Bandeja ATS operativa en todas las etapas. |
| 4. Radar | `/dashboard/company/radar` | `200` | `0` errores | `0` | Carga limpia sin errores de consola ni red. |
| 5. Empleados | `/dashboard/company/employees` | `200` | `0` errores (sin warning LCP) | `0` | Alta con puesto/sueldo/área inline, edición posterior y dossier 360 verificados (`page-2026-11-18T05-47-17-494Z.png`, `page-2026-11-18T05-54-46-933Z.png`). |
| 6. Asistencia | `/dashboard/company/attendance` | `200` | `0` errores | `0` | Ver captura `page-2026-11-18T05-49-03-675Z.png`. Ver nota de zona horaria abajo. |
| 7. QR | Botón `QR de sucursal` en `/dashboard/company/attendance` | `200` | `0` errores | `0` | Abre diálogo `"QR de sucursal • Vista previa · Carta"` para `Hotel Coral Preview QA`. |
| 8. Contratos | `/dashboard/company/contracts` | `200` | `0` errores | `0` | Desbloqueado desde Semana 1; tabla muestra nombre real `Sofía Castro Preview QA` (sin `"Empleado"` genérico). (`page-2026-11-18T05-54-29-726Z.png`). |
| 9. Áreas | `/dashboard/company/areas` | `200` | `0` errores | `0` | Carga limpia y refleja el área creada inline (`Recepción`). |
| 10. Verificación | `/dashboard/company/verification` | `200` | `0` errores | `0` | `Guardar cambios` en modales persiste directo en `company_profiles` (`page-2026-11-18T05-46-42-634Z.png`). |
| 11. Perfil | `/dashboard/company/profile` | `200` | `0` errores | `0` | Carga limpia sin errores. |
| 12. Notificaciones | Campana `Abrir notificaciones` | — | `0` errores | `0` | Abre popover correctamente (`"Sin actividad / Aún no tienes notificaciones"`). |
| 13. Ajustes | `/dashboard/company/settings` | `200` | `0` errores | `0` | Carga limpia sin errores. |
| 14. Nómina | Sidebar + `/dashboard/company/payroll` | `200` | `0` errores | `0` | Bloqueada por `demo_rollout` de staging en `Semana 4`. Toast muestra `"Nómina (Semana 4)"` (ya **no** aparece `"Nómina (null)"`). |
| 15. Evaluaciones | Sidebar + `/dashboard/company/evaluations` | `200` | `0` errores | `0` | Bloqueada por `Semana 3`. Toast correcto: `"Evaluaciones (Semana 3)"`. |
| 16. Reportes | Sidebar + `/dashboard/company/reports` | `200` | `0` errores | `0` | Bloqueada por `Semana 4`. Toast correcto: `"Reportes (Semana 4)"`. |
| *(Extra sidebar)* Permisos / Incidencias | Sidebar buttons | — | `0` errores | `0` | Toasts correctos: `"Permisos y vacaciones (Semana 2)"`, `"Incidencias (Semana 2)"`. |

### Revisión de los 3 pendientes de la 1ª auditoría en Preview
1. **Timbrado CFDI en Nómina:** **No verificable** en esta corrida contra staging porque `system_settings.demo_rollout` en `kanpro-staging` tiene `activePhase: 1` (`enabledModules` no incluye `payroll`) y `CompanyRouteGuard` bloquea `/dashboard/company/payroll` con `"Liberación Programada • Semana 4"`.
2. **Fechas en UTC vs hora local:** **Parcialmente resuelto (Observación menor).** A las `00:49` EST (`2026-11-18T05:49Z`), `Inicio` muestra `18 de noviembre de 2026` (sin salto erróneo de UTC), pero el selector de fecha de `Asistencia` y la fecha de inicio por defecto del asistente de contratación mostraron `2026-11-17` (`17 nov 2026`) porque `getMexicoDateISO` usa `America/Mexico_City` (`UTC-6`, donde a las `00:49` de Quintana Roo aún son las `23:49` del día 17) en lugar de `America/Cancun` (`UTC-5`).
3. **Reportes (`"desempeñándose como en null."`):** **No verificable** en esta corrida contra staging por el mismo bloqueo de `Semana 4` en `demo_rollout`.

---

## Parte 2 — Flujo Candidato ↔ Empresa (2 Contextos Aislados)

| Fase | Contexto | Resultado | Evidencia verificada | Captura |
| :--- | :--- | :--- | :--- | :--- |
| **Verificación SAT** | Empresa (`empresa`) | **OK** | `HCP240101AB1`, `Hotelera Coral Preview S.A. de C.V.`, `Lic. Valeria Preview QA` y `9845550101` guardados directo desde modales (`Guardar cambios`) y persistentes tras `reload` sin usar `Guardar borrador`. | `page-2026-11-18T05-46-42-634Z.png` |
| **Plantilla: Alta y Edición** | Empresa (`empresa`) | **OK** | Modal `Registrar empleado` mostró guía de área vacía (`Sin áreas creadas`) y permitió crear `Recepción` inline; alta de `Mateo Rivera QA` (`Botones`, `$7,500`, `quincenal`, `2025-11-18`) y edición posterior a `Concierge QA` (`$9,000`, diario `$600.00`) persistentes tras `reload`. | `page-2026-11-18T05-47-17-494Z.png` |
| **Publicar Vacante** | Empresa (`empresa`) | **OK** | `Recepcionista Bilingüe Preview` (`Hotelería y Turismo`, `$9,000–$12,000 MXN`, `Quincenal`, `Ambos canales`, `9845550101`). Banner `"Borrador previo"` **ausente** en pasos 2, 3 y 4. | `page-2026-11-18T05-49-25-645Z.png` |
| **Dossier Candidato** | Candidato (`candidato`) | **OK** | Registro `Sofía Castro Preview QA` (`qa-preview-cand-1794980981293@kanpro-qa.local`), `CURP: CAST960514MDFNRR09`, teléfono `+52 (999) 555-0199` y `3` PDFs (`Documento Verificado`) persistentes tras `reload`. | `page-2026-11-18T05-50-05-130Z.png` |
| **Discovery y Vacante** | Candidato (`candidato`) | **OK** | Muestra `Hotel Coral Preview QA` (sin `"Empresa"` genérico), **sin** badge falso `"Empresa Verificada"`, etiqueta `Quincenal` / `Salario quincenal ofrecido`, botón `WhatsApp` con `https://wa.me/529845550101...` y postulación en 1 clic (`Postulado`). | `page-2026-11-18T05-50-19-685Z.png`<br>`page-2026-11-18T05-50-36-484Z.png` |
| **Pipeline ATS** | Ambos contextos | **OK** | Transiciones verificadas en ambos lados: `En Revisión` (visto por candidato) → `Preseleccionado` (visto por candidato) → `Entrevista` (visto y confirmado por candidato con `Confirmar Asistencia`) → `Contratado` (visto por candidato). En candidato se validó `wa.me/529845550101`. | — |
| **Asistente & Contratos** | Empresa + Candidato | **OK** | Asistente precargó `Recepcionista Bilingüe Preview`, `Hotelería y Turismo`, `$10,500`, `quincenal` (diario `$700.00`, sin `16500` ni `"Empleado K'anPro"`). Folio estable `KAN-CTR-2026-816`, firma con `Lic. Valeria Preview QA` y `SHA256:940a366672c80c5d`. Contrato empresa y candidato muestran RFC `HCP240101AB1`, CURP `CAST960514MDFNRR09`, `$10,500 MXN quincenales` + `$700.00` diario. Candidato firmó contrato exitosamente (`Firmado`/`Vigente`). | `page-2026-11-18T05-54-29-726Z.png`<br>`page-2026-11-18T05-55-47-822Z.png` |
| **Expediente en Plantilla** | Empresa (`empresa`) | **OK** | `Detalles del Empleado` para `Sofía Castro Preview QA` mostró `$10,500 MXN`, `Pago Quincenal • Diario $700.00`, `CURP: CAST960514MDFNRR09`, `Expediente (4)` (contrato + 3 PDFs) y enlace `https://wa.me/529995550199...` (un solo `52`). | `page-2026-11-18T05-54-46-933Z.png` |

---

## Hallazgos Ordenados por Severidad

### Bloqueante
- *Ninguno* en las vistas habilitadas en Semana 1 ni en el flujo candidato ↔ empresa. *(Ver nota sobre cobertura pendiente de Semana 4 abajo).*

### Mayor
- **Cobertura no verificada en Preview de `Nómina` (Timbrado CFDI) y `Reportes`:** Debido a que `kanpro-staging` tiene `system_settings.demo_rollout` en `activePhase: 1`, `/dashboard/company/payroll` y `/dashboard/company/reports` muestran el bloqueo de `Semana 4`, por lo que los 2 pendientes históricos de esos módulos (`estado tras timbrar CFDI sin recarga` y texto `"desempeñándose como en null."` en Reportes) no pudieron probarse en vivo en esta corrida.
  - **Pasos para reproducir el bloqueo actual:** Iniciar sesión como empresa nueva en Preview y abrir `/dashboard/company/payroll` o `/dashboard/company/reports` → aparece `Liberación Programada • Semana 4`.

### Menor
1. **Prefetches `404` a `/terms` y `/privacy`:**
   - **Consola / Red:** `5` errores `404` en contexto candidato (`/privacy?_rsc=...`, `/terms?_rsc=...`) y `17` en contexto empresa al navegar por landing, registro y barra inferior/footer de layout porque las rutas `/terms` y `/privacy` no existen aún.
   - **Pasos para reproducir:** Abrir `/` o `/register/candidate` o `/register/company` con DevTools → Console / Network activo.
2. **Desfase horario de 1 hora entre `America/Cancun` (`UTC-5`) y `America/Mexico_City` (`UTC-6`):**
   - **Observación:** Entre las `00:00` y `00:59` hora de Quintana Roo (`2026-11-18 00:49 EST`), `Inicio` muestra `18 de noviembre de 2026`, mientras `Asistencia` (filtro de fecha y fecha por defecto del asistente de contratación via `getMexicoDateISO`) muestra `2026-11-17`.
   - **Pasos para reproducir:** Entrar a `/dashboard/company` y luego a `/dashboard/company/attendance` entre las `00:00` y `00:59` (`UTC-5`).

---

## Estado de Datos QA en Staging (`zoxtlrjwymzrlrqsganh`)
Por seguridad del harness MCP, la confirmación automática de `execute_sql` canceló la sentencia `DELETE` destructiva, por lo que los siguientes registros QA **quedaron en staging** pendientes de borrado manual por Brian (ninguno en producción):
- **Empresa (`company_profiles`):** `34a7adcb-73bb-425b-8f67-b78dfcaea190` (`Hotel Coral Preview QA`)
- **Usuarios (`auth.users`):**
  - `fce6199e-2eb6-449b-ae14-f9c29cda2697` (`qa-preview-empresa-1794980458945@kanpro-qa.local`)
  - `e88b87e5-d097-4d77-bc80-a8cd87cff074` (`qa-preview-cand-1794980981293@kanpro-qa.local`)
  - `900716fa-a02c-4629-ae74-b5f60d4b52a5` (`qa-preview-emp-1794980814397@kanpro-qa.local`)
- **Storage (`profile_documents`):**
  - `e88b87e5-d097-4d77-bc80-a8cd87cff074/ine_passport.pdf`
  - `e88b87e5-d097-4d77-bc80-a8cd87cff074/proof_of_address.pdf`
  - `e88b87e5-d097-4d77-bc80-a8cd87cff074/cv.pdf`

```sql
-- Limpieza segura en kanpro-staging (zoxtlrjwymzrlrqsganh):
DELETE FROM public.company_profiles WHERE id = '34a7adcb-73bb-425b-8f67-b78dfcaea190';
DELETE FROM auth.users WHERE email LIKE 'qa-preview-%@kanpro-qa.local';
```
*(Y eliminar los 3 objetos de `e88b87e5-d097-4d77-bc80-a8cd87cff074/` desde Storage > `profile_documents`).*

---

## Dictamen de Fusión (`dev` → `main`)
- **Semana 1 y flujo candidato ↔ empresa (registro, perfil/verificación, plantilla con puesto/sueldo, vacantes, discovery, WhatsApp, ATS completo, asistente, contratos firma empresa/candidato y expediente 360):** **Verificados al 100% en Preview + staging** (`0` errores `Base UI nativeButton`, `0` errores de consola propios, `0` fallos 4xx/5xx en APIs/Storage).
- **Condición antes de fusionar a `main` si necesitas cerrar toda la lista:** **Nómina (Timbrado CFDI sin recarga)** y **Reportes (`"en null."`)** no pudieron comprobarse en runtime porque en staging `demo_rollout` está en `Semana 1`. Si el lanzamiento a producción sale en **Semana 1**, el Preview **está listo para fusionar `dev` a `main`**; si necesitas validar Nómina y Reportes antes del merge, habilita temporalmente `activePhase: 4` en `kanpro-staging` y re-prueba esas 2 vistas.
