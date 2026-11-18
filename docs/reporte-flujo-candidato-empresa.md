# Reporte de Prueba E2E: Flujo Candidato ↔ Empresa (2 Instancias de Chrome)

- **Fecha:** 2026-11-17
- **Rama:** `dev`
- **Entorno:** Local (`pnpm build` + `pnpm start` en `http://localhost:3000` + Supabase local en `http://127.0.0.1:54321`)
- **Herramienta:** Playwright MCP con 2 contextos aislados sin cookies compartidas (`isolatedContext: empresa` e `isolatedContext: candidato`)
- **Alcance:** Auditoría inicial (17 nov 2026) y **re-prueba integral post-correcciones** sobre la rama `dev` en local. Datos de prueba creados y limpiados al finalizar.

---

## Resultado de la Re-prueba (Post-Correcciones — 17 nov 2026)

| Incidencia | Estado tras re-prueba | Evidencia verificada en local (2 contextos Chrome) |
| :--- | :--- | :--- |
| **1. Alta de empleados sin puesto/sueldo ni áreas** | **Corregida** | En `/dashboard/company/employees`, `Registrar empleado` incluye `Puesto de trabajo`, `Sueldo bruto`, `Periodicidad de pago` (con salario diario en vivo) y creación inline `+ Crear nueva área` cuando no hay áreas previas (`Cocina`). Se registró a `Mateo Torres QA` (`Cocinero A`, `$8,500`, `quincenal`, `2025-11-17`) y se editó después vía `Editar puesto y sueldo` a `Subchef QA` (`$9,500`), persistiendo tras recargar. |
| **2. Asistente con valores fijos y contrato con placeholders** | **Corregida** | El asistente de contratación cargó automáticamente `Recepcionista Bilingüe QA`, `Hotelería y Turismo` y `$10,500` (punto medio de `$9,000–$12,000` MXN, sin `16500` ni `"Empleado K'anPro"`). El contrato `KAN-CTR-2026-649` imprimió RFC real `HCA240101AB1`, razón social `Hotelera Cenote Azul S.A. de C.V.`, CURP `HERS960514MDFNRR09` y nombre real `Sofía Hernández QA`. |
| **3. Desajuste salarial y salario diario (`/30` vs `/15`)** | **Corregida** | `calculateDailySalary` calcula según periodicidad (`quincenal / 15`, `mensual / 30`, `semanal / 7`, `catorcenal / 14`). El asistente, contrato empresa (`/dashboard/company/contracts`), contrato candidato (`/dashboard/candidate/contracts`) y dossier en Plantilla mostraron `$10,500 MXN quincenales` con salario diario base de `$700.00 MXN`. |
| **4. Expediente vacío y CURP no registrada tras contratar** | **Corregida** | `hireCandidate` enlaza `curp`/`rfc` desde `candidate_private_profiles` a `company_employees` y `getEmployeeDossierDetailsAction` hidrata `profile_documents` (con URLs firmadas) y contratos. Tras contratar, `Detalles del Empleado` mostró `CURP: HERS960514MDFNRR09` y `Expediente (4)` con el contrato `KAN-CTR-2026-649` y los 3 PDFs (`sample-doc.pdf`) del candidato. |
| **5. Verificación SAT no persiste con `Guardar cambios`** | **Corregida** | En `/dashboard/company/verification`, `Guardar cambios` en los modales de edición fiscal y contacto persiste directo en `company_profiles` sin requerir `Guardar borrador` (`RFC: HCA240101AB1`, `Hotelera Cenote Azul S.A. de C.V.`, `Lic. Valeria Mendoza QA`, teléfono `9841234567` confirmados tras recarga). |
| **6. Módulo de Contratos bloqueado (`Semana 3`)** | **Corregida (confirmado por producto)** | Por confirmación de producto, el módulo `contracts` quedó habilitado desde **Semana 1** (`week: 1, alwaysEnabled: true` en `demo-rollout.ts`). `/dashboard/company/contracts` mostró el listado y vista previa de `KAN-CTR-2026-649` para cualquier cuenta empresa desde la fase inicial. |
| **7. Sin botón de WhatsApp en candidato + doble `5252`** | **Corregida** | `/dashboard/candidate/discovery` y `/dashboard/candidate/vacancies/[id]` muestran el botón `WhatsApp` cuando la vacante usa `Ambos canales` o `WhatsApp`. Todas las URLs `wa.me` se normalizaron con `buildWhatsAppUrl`: `wa.me/529841234567` (vacante) y `wa.me/529992345678` (dossier de empleado), sin duplicar `5252`. |
| **8. Firma de empresa con datos fijos y folio volátil** | **Corregida** | La firma muestra el representante real (`Lic. Valeria Mendoza QA`), el folio (`KAN-CTR-2026-649`) se genera una sola vez por apertura del modal sin mutar entre pasos, y el hash se calcula con `crypto.subtle.digest("SHA-256", ...)` sobre el contrato (`SHA256:5f45430b2f256150`). |
| **9. Menores (`nativeButton`, Discovery, Wizard, LCP)** | **Corregida** | 0 errores `Base UI nativeButton` en `/`, panel empresa y layout candidato; 0 warnings LCP en `/dashboard/company/employees`; Discovery muestra el nombre real `Hotel Cenote Azul QA` sin badge falso `"Empresa Verificada"` cuando está en borrador; banner `"Borrador previo"` ausente durante el wizard activo en pasos 2–4; etiqueta de salario en Discovery/Dashboard/Vacante refleja `Quincenal`. |

- **Consola y Red en Re-prueba:**
  - `0` errores `Base UI nativeButton`, `0` errores de hidratación/JS en `/`, empresa y candidato.
  - `0` errores HTTP 4xx/5xx en flujos de dashboard/REST/Storage/Server Actions (solo prefetches preexistentes de Next `<Link>` hacia `/terms` y `/privacy`, rutas aún no implementadas en landing/auth).
  - **Limpieza de datos de re-prueba:** usuarios `qa-retest-company-1794970271988@kanpro-qa.local`, `qa-retest-emp-1794970505144@kanpro-qa.local`, `qa-retest-cand-1794970638344@kanpro-qa.local`, empresa `Hotel Cenote Azul QA` (`5e962a72-1a08-4f51-b0ca-975dcbad7eab`) y los 3 archivos en `profile_documents` eliminados de DB y Storage local.

---

## Auditoría Base (17 nov 2026 — Línea base original)

## Tabla por Fase

| Fase | Instancia | Estado | Observación | Captura | Error de consola / red |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Precondiciones** (`/`) | A (Empresa) y B (Candidato) | **OK (con obs.)** | `dev` actualizado, Supabase local y `pnpm dev` en `:3000`. Dos contextos aislados creados correctamente. | — | Consola: 3 errores `Base UI nativeButton` en `/` (`FeaturesSplit`, `CtaBanner` x2). Red: 0 errores 4xx/5xx. |
| **Fase 1: Registro y Onboarding Empresa** | A (Empresa) | **OK (con obs.)** | Registro con `empresa.qa.20261117@example.com` y onboarding 2 pasos (`Director Prueba QA`, `Empresa Prueba QA`, `Calle 60 445, Mérida`) sin bloqueo por verificación de correo. En `/dashboard/company/profile` se guardó descripción y WhatsApp (`200`). En `/dashboard/company/verification` (SAT 13 puntos), editar RFC (`EPQ260101QA1`) y Razón Social actualizó el contador local (`9 de 13`) sin rechazar el RFC de prueba, pero **no persiste en BD** si no se pulsa `Guardar borrador`. | `page-2026-11-18T01-40-25-259Z.png`<br>`page-2026-11-18T01-40-37-360Z.png`<br>`page-2026-11-18T01-41-51-445Z.png` | Consola: 0 errores nuevos en onboarding/panel. Red: 0 errores 4xx/5xx. |
| **Fase 2: Registro de 3 Empleados (antigüedad y puestos)** | A (Empresa) | **Problema** | Se crearon áreas (`Operaciones`, `Administración & Finanzas`) en `/dashboard/company/areas` porque el combo `Área de trabajo` abría vacío sin áreas previas. Se registraron 3 empleados con fechas `2024-11-17` (`2 años`), `2025-11-17` (`1 año`) y `2026-08-17` (`3 meses`). La antigüedad se calculó correctamente (`2 años`, `1 año`, `3 meses`), **pero el modal `Registrar empleado` no pide `Puesto` ni `Sueldo`** (quedan como `"Sin puesto asignado"` / `"Puesto General"` y `$0 MXN`) y tampoco existen campos para editarlos después. | `page-2026-11-18T01-46-11-475Z.png` | Consola: 0 errores, 1 warning LCP de Next.js Image (guía del módulo). Red: 0 errores 4xx/5xx. |
| **Fase 3: Publicar Vacante (Wizard 4 pasos)** | A (Empresa) | **OK (con obs.)** | Wizard de 4 pasos completado: `Mesero de Restaurante Prueba QA`, 2 plazas, Tiempo Completo · Matutino, Centro Mérida, `$9,000–$12,000 MXN` (`Quincenal`), prestaciones (`Prestaciones de ley`, `Propinas diarias / semanales`, `Comedor de empleados gratuito`, `Transporte de personal`), canal `Ambos canales` (WhatsApp + Bandeja Kanpro). Quedó `Activa` en `/dashboard/company/vacancies`. En pasos 3 y 4 aparece un banner de `"Borrador previo"` durante la edición activa. | `page-2026-11-18T01-47-34-538Z.png` | Consola: 0 errores. Red: 0 errores 4xx/5xx. |
| **Fase 4: Registro y Dossier de Candidato** | B (Candidato) | **OK (con obs.)** | Cuenta creada (`candidato.qa.20261117@example.com`, `Candidato Prueba QA`, nacimiento `2006-11-01`) sin bloqueo de email. Perfil público actualizado (WhatsApp `9991112233`, titular, bio, habilidad `Atención al cliente`). En `/dashboard/candidate/documents` se guardó CURP (`PRQA061101HYNRRN09`) y se subieron 3 PDFs de prueba: INE (`ine-prueba-qa.pdf`), Comprobante de Domicilio (`domicilio-prueba-qa.pdf`) y CV (`cv-prueba-qa.pdf`), quedando marcados como `"Documento Verificado"`. | `page-2026-11-18T01-48-24-376Z.png`<br>`page-2026-11-18T01-50-34-842Z.png` | Consola: 1 error `Base UI nativeButton` en `CandidateDashboardLayout` / `CandidateTopbar`. Red: 0 errores 4xx/5xx (`200`/`201`/`204` en Storage y REST). |
| **Fase 5: Búsqueda y Postulación (1 clic)** | B (Candidato) | **Problema** | La vacante apareció en `/dashboard/candidate` y `/dashboard/candidate/discovery`. Búsqueda por título funcionó y la postulación en 1 clic (`Postularme`) registró la solicitud (`Pendiente` en `/dashboard/candidate/applications`). **Hallazgos:** 1) No hay botón de WhatsApp visible para el candidato en Discovery ni en `/dashboard/candidate/vacancies/[id]` (aunque se eligió `Ambos canales`). 2) En Discovery el detalle muestra `"Empresa"` y badge `"Empresa Verificada"` (cuando la empresa está en `Borrador`). 3) Muestra `"Salario mensual"` aunque se capturó `Quincenal`. | `page-2026-11-18T01-51-05-627Z.png`<br>`page-2026-11-18T01-51-27-126Z.png` | Consola: 1 error `Base UI nativeButton` (persistente del layout). Red: 0 errores 4xx/5xx. |
| **Fase 6: Pipeline ATS y Contratación** | A (Empresa) y B (Candidato) | **Problema** | La postulación llegó a `/dashboard/company/applications` en `Por revisar` (`Pendiente`). Transiciones verificadas en ambas instancias: `En revisión` → `Preseleccionado` → `Entrevista` (cita `2026-11-19 10:00` presencial + confirmación del candidato) → `Contratado`. Asistente de contratación generó contrato `KAN-CTR-2026-398` (firmado digitalmente por empresa y posteriormente por candidato) y el candidato apareció como `Activo` en `/dashboard/company/employees`. **Hallazgos:** 1) `/dashboard/company/contracts` está bloqueado como `"Liberación Programada • Semana 3"`. 2) En `Detalles del Empleado`, `Expediente (0)` aparece vacío y `CURP: No registrado`. 3) El diálogo de firma de empresa muestra `"Lic. Andrea Garza Ramos"` hardcoded y cambia el folio en cada render antes de confirmar. | `page-2026-11-18T01-52-20-972Z.png`<br>`page-2026-11-18T01-54-06-977Z.png`<br>`page-2026-11-18T01-54-51-400Z.png`<br>`page-2026-11-18T01-55-21-445Z.png`<br>`page-2026-11-18T01-55-52-085Z.png` | Consola: 0 errores en empresa, 1 error `Base UI nativeButton` en candidato. Red: 0 errores 4xx/5xx. |
| **Fase 7: Verificación Cruzada** | A (Empresa) y B (Candidato) | **Problema** | Vacante, etapa `Contratado`, entrevista y folio `KAN-CTR-2026-398` coinciden entre empresa y candidato (y en `/dashboard/candidate/contracts` aparece `Vigente y Firmado` con ambas firmas). **Discrepancias cruzadas:** 1) En contrato el trabajador figura con `CURP Pendiente de cotejo` y el patrón con `RFC XAXX010101000` / `"Representante Legal Autorizado"`. 2) Periodicidad mezclada: el asistente de contratación pidió `"Salario Mensual Bruto (MXN): 10500"`, pero contrato y `Mis Contratos` dicen `$10,500.00 MXN` `quincenal` con salario diario de `$350.00 MXN` (`10500/30`). 3) Enlace WhatsApp del empleado en Plantilla duplica prefijo (`wa.me/52529991112233`). | `page-2026-11-18T01-56-41-586Z.png`<br>`page-2026-11-18T01-57-18-512Z.png`<br>`page-2026-11-18T01-57-32-524Z.png` | Consola: 1 error `Base UI nativeButton` en candidato. Red: 0 errores 4xx/5xx en todo el flujo. |

---

## Resumen de Problemas Ordenados por Severidad

### Bloqueante
- *Ninguno.* Todas las vistas cargaron (sin pantallas en blanco ni errores HTTP 500/4xx) y el flujo completo candidato ↔ empresa se pudo ejecutar de principio a fin.

### Mayor
1. **Alta manual de empleados no permite asignar `Puesto` ni `Sueldo` (ni editarlos luego):**
   En `/dashboard/company/employees`, el formulario `Registrar empleado` omite puesto y sueldo (los colaboradores quedan como `"Sin puesto asignado"` / `"Puesto General"` y `$0 MXN`), y ni las acciones de fila ni el modal `Detalles del Empleado` permiten editarlos. Además, `Área de trabajo` se despliega vacío si no se crearon áreas previamente en `/dashboard/company/areas`, sin mensaje guía.
2. **Expediente digital y CURP del candidato contratado no se reflejan en `Detalles del Empleado` ni en el Contrato:**
   Tras contratar a `Candidato Prueba QA` (quien ya había subido INE, comprobante de domicilio y CV y capturado su CURP `PRQA061101HYNRRN09`), en `/dashboard/company/employees` el tab `Expediente (0)` muestra `"Sin documentos digitalizados"`, `Fiscal & Contacto` muestra `CURP: No registrado` y `Ubicación / Domicilio: Administración & Finanzas`, y el contrato generado (`KAN-CTR-2026-398`) imprime `CURP Pendiente de cotejo`.
3. **Inconsistencia entre salario de vacante, asistente de contratación y periodicidad del contrato:**
   - El asistente de contratación inicia con valores fijos (`"Empleado K'anPro"`, `16500`, `"Administración & Finanzas"`) en lugar de tomar los de la vacante (`Mesero de Restaurante Prueba QA`, `$9,000–$12,000`).
   - La vacante se publicó con frecuencia `Quincenal`, pero las vistas de candidato dicen `"Sueldo mensual"` / `"Salario mensual ofrecido"`. El asistente de contratación etiqueta `"Salario Mensual Bruto (MXN)"` (`10500`), pero el contrato y `/dashboard/candidate/contracts` muestran `$10,500.00 MXN` con periodicidad `quincenal` y salario diario de `$350.00 MXN` (`10500 / 30`).
4. **Módulo de Contratos del panel empresa bloqueado como "Semana 3":**
   `/dashboard/company/contracts` (y el botón `Contratos` del sidebar) muestra pantalla de `"Liberación Programada • Semana 3"`, por lo que la empresa no cuenta con vista para consultar contratos formalizados ni verificar la firma posterior del trabajador (que sí es visible en `/dashboard/candidate/contracts`).
5. **Ausencia de botón de WhatsApp en vista de candidato para vacantes con canal WhatsApp/Ambos:**
   Aunque la vacante se configuró con `Ambos canales` y número `+52 999 000 0199`, ni `/dashboard/candidate/discovery` ni `/dashboard/candidate/vacancies/[id]` muestran botón de contacto por WhatsApp para el candidato. (En empresa sí aparece el botón de WhatsApp hacia el candidato).
6. **Edición en Verificación SAT (`Guardar cambios`) no persiste en BD sin `Guardar borrador`:**
   En `/dashboard/company/verification`, al editar `RFC` (`EPQ260101QA1`) y `Razón social` y pulsar `Guardar cambios`, el progreso visual cambia a `9 de 13`, pero en `company_profiles` el `rfc` permanece como `XAXX010101000` (lo que luego se arrastra al contrato) si no se pulsa adicionalmente `Guardar borrador`.

### Menor
1. **Errores de consola por `Base UI nativeButton`:**
   - 3 errores en `/` (`FeaturesSplit` y `CtaBanner` x2).
   - 1 error en todo el dashboard de candidato (`CandidateDashboardLayout` / `CandidateTopbar`).
2. **Nombre genérico y badge de verificación falso en Discovery (`/dashboard/candidate/discovery`):**
   Las tarjetas muestran `"Empresa Verificada"` aunque la empresa está en `Borrador` (sin verificar), el panel de detalle muestra `"Empresa"` / `"Sobre Empresa"` en lugar de `"Empresa Prueba QA"`, y el toast de postulación dice `"Tu postulación ha sido enviada a Empresa."`.
3. **Datos estáticos y folio volátil en modal de firma de contrato (Empresa):**
   El modal de firma muestra `"Firma de Contrato • Lic. Andrea Garza Ramos"` en lugar de `"Director Prueba QA"`, el hash mostrado es estático (`SHA256:0x4f8b91a2e37c`), el folio cambia en cada re-render (`KAN-CTR-2026-626` → `590` → `398`) antes de confirmar, y la declaración del patrón en el contrato usa `"Representante Legal Autorizado"`.
4. **Doble código de país en enlace de WhatsApp de Plantilla:**
   En `Detalles del Empleado`, el enlace genera `https://wa.me/52529991112233` (duplicando el `52`).
5. **Banner de "Borrador previo" visible durante el flujo activo del wizard de vacantes:**
   En los pasos 3 y 4 de `/dashboard/company/vacancies/new`, aparece el aviso para restaurar o descartar el borrador de la vacante que se está capturando en la misma sesión.
6. **Warning de Next.js Image LCP en `/dashboard/company/employees`:**
   Advertencia en consola sugiriendo `loading="eager"` para la imagen de la guía del módulo.

---

## Limpieza de Datos de Prueba
Todos los registros generados en la base de datos local y Storage durante esta prueba fueron eliminados al finalizar:
- **Usuarios (`auth.users`):**
  - `3e403d25-4677-4c70-b3bb-34c4006bc9dd` (`empresa.qa.20261117@example.com`)
  - `e83e0373-a6fa-4b21-9a60-2341a6e6d78b` (`candidato.qa.20261117@example.com`)
  - `6838d49e-7f07-473a-ab15-a466f122404e` (`empleado1.qa.20261117@example.com`)
  - `0f2922f7-e62a-4cce-b02d-3041acefde8a` (`empleado2.qa.20261117@example.com`)
  - `01828f46-ae4a-43d3-89af-985f784f526b` (`empleado3.qa.20261117@example.com`)
- **Empresa (`company_profiles`):** `f6665925-a79b-471b-a289-ec67b778187f` (`Empresa Prueba QA`)
- **Áreas (`company_departments`):** `Operaciones` (`f05ac9aa-7cf0-416a-95d2-54829fda2980`), `Administración & Finanzas` (`c0fe174e-12df-4a01-9235-e89cb98b1400`)
- **Vacante (`vacancies`):** `e3a7ff0a-f703-4a68-a938-079149dcfbf7` (`Mesero de Restaurante Prueba QA`)
- **Postulación (`applications`):** `fd411bf7-7852-482c-beaf-89b7eaf42b5b`
- **Contrato (`company_contracts`):** `1766e923-3fbd-448e-95a1-064b379c03bc` (`KAN-CTR-2026-398`)
- **Empleados (`company_employees`):** 4 filas asociadas a la empresa de prueba
- **Documentos (`profile_documents` + bucket `profile_documents`):** 3 archivos (`ine-prueba-qa.pdf`, `domicilio-prueba-qa.pdf`, `cv-prueba-qa.pdf`)
