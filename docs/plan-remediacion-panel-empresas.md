# Plan de Remediación — Panel de Empresa de K'anPro

- **Rama base:** `dev` (auditada sobre commit `08ca91e`)
- **Stack:** Next.js 16 + React 19 + TypeScript + Supabase + Base UI (`@base-ui/react`)
- **Fuente:** Auditoría completa en local (`http://localhost:3000`) con Playwright MCP + Chrome (`1440×900`) del 16 de noviembre de 2026
- **Estado:** Solo plan (sin cambios de código aplicados)

> [!IMPORTANT]
> Este plan aplica criterio mínimo de cambio: reutilizar patrones existentes, corregir causas raíz en código compartido cuando aplique, y no inventar requisitos donde falte una decisión de producto.

---

## 0. Bloqueantes

- **Ninguno (0).** Todas las rutas del panel (`/dashboard/company` y sus 15+ subvistas/modales) respondieron `200 OK` sin pantallas en blanco ni errores 500.

---

## 1. Decisiones pendientes de Brian (antes de ejecutar)

| ID | Tema | Opciones | Recomendación Ponytail | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **D1** | **Acceso Anticipado vs. `demo_rollout` (Fase 1)** | **Opción A:** Habilitar Fase 4 (los 6 módulos desbloqueados) o respetar `is_early_access` para cuentas piloto y alinear el copy en Inicio/Configuración.<br>**Opción B:** Mantener Fase 1 en `demo_rollout`, corregir el copy de `Suscripción y Facturación` y `Inicio` para reflejar el despliegue semanal real, y proteger todos los enlaces directos. | **Opción B si el piloto sigue por semanas**, corrigiendo primero los textos contradictorios y enlaces rotos; **Opción A** si la promesa actual de negocio para cuentas nuevas ya es Acceso Anticipado completo. En ambos casos **corregir el bug de `getLockedModuleBadge` (`(null)`)**. | **Pendiente** |
| **D2** | **Radar de Talento: ¿Mapa o solo lista?** | **Opción A:** Agregar mapa interactivo (Leaflet/OSM reutilizando `OnboardingLeafletMap` o similar) con pines por ciudad/zona.<br>**Opción B:** Confirmar que Radar de Talento es directorio/lista con filtro por ciudad y ajustar la expectativa de QA/diseño. | **Opción B** salvo que Figma especifique mapa en `/radar`: actualmente `candidate_directory` no expone coordenadas precisas de candidatos en `CandidateRadarView` y añadir un mapa con coordenadas reales requiere revisar privacidad (LFPDPPP) y campos en la vista SQL. | **Pendiente** |
| **D3** | **QR de Sucursal: ¿Mostrar geocerca en el modal?** | **Opción A:** Mostrar solo un resumen compacto de solo lectura (ej. `Radio de geocerca: 150 m · Lat/Lng configurada`) dentro de `BranchQrKioskModal`.<br>**Opción B:** Mantener la geocerca fuera del modal QR y dejar un enlace directo a `Perfil de empresa` para editar coordenadas. | **Opción A**: `branchConfig` ya llega como prop a `BranchQrKioskModal` (`latitude`, `longitude`, `radiusMeters`); mostrar el dato en 1 línea no requiere nuevas queries ni edición duplicada. | **Pendiente** |
| **D4** | **Nómina cuando `base_salary_monthly` es `$0`** | **Opción A:** No sustituir `$0` por `$8,500`; calcular `$0` y mostrar badge/alerta `"Sin salario configurado"` con enlace al expediente.<br>**Opción B:** Mantener un mínimo/fallback explícito documentado (ej. SMG) y avisar en UI. | **Opción A**: usar `$8,500` silenciosamente (`Number(emp.base_salary_monthly) || 8500`) distorsiona totales, ISR e IMSS con dinero ficticio. | **Pendiente** |
| **D5** | **Contratos manuales sin empleado ligado** | **Opción A:** Exigir seleccionar un empleado activo o agregar columna `employee_name` (migración SQL) en `company_contracts` para contratos externos.<br>**Opción B:** Guardar el nombre en `notes` o restringir el modal a empleados existentes en `company_employees`. | **Opción A (agregar `employee_name text` nullable en `company_contracts` con nueva migración)** si se permiten contratos manuales; o **Opción B (obligar selección de empleado)** si todo contrato debe pertenecer a un registro de `company_employees`. | **Pendiente** |

---

## 2. Incidencias Mayores (6)

### MJR-1. Error global de consola Base UI (`nativeButton`) en todo el panel

- **Severidad:** Mayor
- **Descripción:** En consola aparece `[ERROR] Base UI: A component that acts as a button expected a native <button> because the nativeButton prop is true...`. Ocurre en todas las vistas por `NotificationBell`, y adicionalmente en `VacanciesManager` (x2), `VacancyWizardContainer`, `ApplicationsInbox`, `CompanyEmployeesView`, `CompanyRouteGuard` (x2) y `CompanyReportsView`.
- **Causa raíz verificada:**
  - `src/components/ui/button.tsx` envuelve `@base-ui/react/button` (`ButtonPrimitive`), cuyo prop `nativeButton` es `true` por defecto.
  - Cuando se usa `<Button render={<Link href="..." />} />` sin `nativeButton={false}`, Base UI inyecta atributos de botón sobre un `<a>` y emite el error en desarrollo (incluso si está oculto con `md:hidden`, porque React lo monta en el árbol).
  - Sitios verificados:
    - `src/modules/notifications/components/notification-bell.tsx:78-83` (`md:hidden`, además apunta a `/dashboard/candidate/inbox` incluso en contexto empresa — ver pregunta abierta).
    - `src/modules/company/components/vacancies-manager.tsx:909, 1012, 1264`
    - `src/modules/company/components/wizard/vacancy-wizard-container.tsx:628`
    - `src/modules/company/components/applications-inbox.tsx:1216`
    - `src/modules/company/components/company-employees-view.tsx:1420`
    - `src/modules/company/components/navigation/company-route-guard.tsx:67, 75`
    - `src/modules/company/components/reports/company-reports-view.tsx:374`
    - Otros detectados en el mismo módulo con el mismo patrón: `vacancies-table.tsx:373`, `company-leaves-view.tsx:350`, `payroll-view.tsx:507`, `vacancy-preview.tsx:554` y tarjetas de `src/modules/company/components/dashboard/*.tsx`.
- **Solución propuesta:**
  - Agregar `nativeButton={false}` en cada `<Button render={<Link ... />} ... />` listado arriba (cambio directo en las llamadas, sin tocar el contrato global de `src/components/ui/button.tsx` para respetar `AGENTS.md`).
  - Verificar con `grep -rn "render={<Link" src/` si existen más ocurrencias en rutas del panel de empresa antes de cerrar.
- **Criterio de aceptación:** Navegar por las 16+ opciones del panel en `1440×900` con `0` errores de consola relacionados con `nativeButton`.
- **Esfuerzo y dependencias:** **S** | Sin dependencias; debe ejecutarse primero para limpiar el ruido de consola en todas las pruebas posteriores.
- **Pregunta abierta:** En `notification-bell.tsx:81`, el enlace móvil apunta fijo a `/dashboard/candidate/inbox` aunque el usuario sea empresa; confirmar con Brian si en móvil debe navegar a una ruta de notificaciones de empresa o abrir el mismo menú/drawer.

---

### MJR-2. Inconsistencia `Acceso Anticipado` vs. `demo_rollout` (Fase 1) y toast roto `"Nómina (null)"`

- **Severidad:** Mayor
- **Descripción:**
  1. `Configuración → Suscripción y Facturación` afirma que todas las funciones premium/LFT están activas por *Acceso Anticipado*, mientras el pie de `Inicio` muestra `Plan Básico` y `demo_rollout` (Fase 1) bloquea 6 módulos (`Permisos y vacaciones`, `Incidencias`, `Contratos`, `Nómina`, `Evaluaciones`, `Reportes`).
  2. Al hacer clic en cualquier módulo bloqueado del sidebar (o en botones bloqueados de Acciones rápidas), el toast muestra `"Nómina (null)"`.
  3. En `Inicio`, `SectionCardHeader` deja activos los enlaces `Ver contratos →` (`/dashboard/company/contracts`) y `Ver nómina →` (`/dashboard/company/payroll`) aun estando bloqueados, enviando al usuario al muro de `CompanyRouteGuard`.
- **Causa raíz verificada:**
  - **Toast `(null)`:** `src/modules/company/components/navigation/company-sidebar.tsx:249-251` y `src/modules/company/components/dashboard-view.tsx:464-466` llaman a `getLockedModuleBadge(item.url)` / `getLockedModuleBadge(action.href)` **sin pasar `enabledModules`**. En `src/modules/company/config/demo-rollout.ts:246-255`, si `enabledModules` es `undefined`, `isCompanyRouteAllowed` devuelve `true` y `getLockedModuleBadge` retorna `null`.
  - **Copy contradictorio:** `src/modules/company/components/company-settings-dialog.tsx:940-989` renderiza de forma fija el banner `Periodo de Pruebas • Acceso Anticipado` indicando que todas las funciones están activas, mientras `src/modules/company/services/company-dashboard.ts:250-265` lee `subscription_plan || "basic"` (`Plan Básico`) y `src/modules/auth/services/dashboard-session.ts:194-220` lee `system_settings.demo_rollout` (`activePhase: 1`).
  - **Enlaces en `Inicio`:** `src/modules/company/components/dashboard-view.tsx:253-257` (`Contratos por vencer`) y `326-330` (`Nómina`) usan `<SectionCardHeader>` sin validar `isCompanyRouteAllowed(href, enabledModules)`.
- **Solución propuesta:**
  - **Corrección técnica obligatoria (independiente de D1):**
    1. Pasar `enabledModules` como segundo argumento en `getLockedModuleBadge(item.url, enabledModules)` en `company-sidebar.tsx:250` y `getLockedModuleBadge(action.href, enabledModules)` en `dashboard-view.tsx:465`, con fallback defensivo si `lockedBadge` fuera `null`.
    2. En `dashboard-view.tsx` (`SectionCardHeader`), ocultar o deshabilitar el enlace `Ver contratos →` / `Ver nómina →` (mostrando badge `Semana X`) cuando `!isCompanyRouteAllowed(href, enabledModules)`.
  - **Alineación de negocio (sujeta a Decisión D1):**
    - Si **D1 = Opción A:** Actualizar `demo_rollout` a Fase 4 (o hacer que `isCompanyEarlyAccess` desbloquee módulos si esa es la regla) y mostrar `Acceso Anticipado` en el pie de `dashboard-view.tsx`.
    - Si **D1 = Opción B:** Condicionar el texto de `company-settings-dialog.tsx:940-989` para explicar la liberación gradual por fases/semanas (o mostrar el estado real de `subscriptionSummary`) y reflejarlo igual en `dashboard-view.tsx`.
- **Criterio de aceptación:** Al hacer clic en un módulo bloqueado nunca aparece `(null)` en el toast; no existen enlaces directos desde `Inicio` hacia pantallas bloqueadas; el estado de plan/acceso coincide entre `Inicio`, Sidebar y `Configuración`.
- **Esfuerzo y dependencias:** **M** | Bloqueado por **D1** para el texto definitivo; el fix de `getLockedModuleBadge` y `SectionCardHeader` puede hacerse de inmediato.

---

### MJR-3. Nombre de empleado incorrecto (`"Empleado"`) en la tabla de Contratos

- **Severidad:** Mayor
- **Descripción:** Al crear un contrato manual para `"Empleado Prueba QA"` en `/dashboard/company/contracts`, el modal de detalle y el toast muestran `"Empleado Prueba QA"`, pero la fila en la tabla muestra `"Empleado"`.
- **Causa raíz verificada:**
  1. `src/modules/company/components/contracts/contract-builder-modal.tsx:80-150` inicia `selectedEmployeeId` en `"manual"` y permite capturar `employeeName` libre sin `employeeId` real.
  2. `src/modules/company/components/contracts-view.tsx:362-378` llama a `createContractAction(...)` **sin enviar `employeeName`**.
  3. `src/modules/company/services/company-service.ts:1065-1094` (`CompanyContractService.createContract`) inserta en `public.company_contracts` con `employee_id: null` (la tabla `company_contracts` tampoco tiene columna `employee_name`).
  4. Al revalidar `/dashboard/company/contracts`, `src/app/(dashboard)/dashboard/company/contracts/page.tsx:127-128` resuelve `const employeeName = emp?.full_name || baseProfile?.full_name || "Empleado";`, cayendo en `"Empleado"`.
- **Solución propuesta (según Decisión D5):**
  - **Si D5 = Opción A (soportar contratos manuales):**
    1. Crear una **nueva migración SQL** en `supabase/migrations/` agregando `employee_name text` (nullable) a `public.company_contracts`, y regenerar/actualizar tipos en `src/types/supabase.ts`.
    2. Añadir `employeeName` opcional en `src/modules/company/schemas/contracts.schema.ts`, enviarlo desde `contracts-view.tsx:362` y persistirlo en `CompanyContractService.createContract`.
    3. Actualizar `src/app/(dashboard)/dashboard/company/contracts/page.tsx:127-128` a `emp?.full_name || baseProfile?.full_name || c.employee_name || "Empleado"`.
  - **Si D5 = Opción B (solo empleados de plantilla):** Hacer obligatorio elegir un empleado en `ContractBuilderModal` (eliminar `"manual"`).
- **Criterio de aceptación:** Crear un contrato con nombre `"Empleado Prueba QA"`, recargar `/dashboard/company/contracts` y verificar que la tabla muestra `"Empleado Prueba QA"` (y no `"Empleado"`).
- **Esfuerzo y dependencias:** **M** | Depende de **D5** (requiere nueva migración si se elige Opción A).

---

### MJR-4. Texto roto `"desempeñándose como en null."` en diagnóstico de Reportes

- **Severidad:** Mayor
- **Descripción:** En `/dashboard/company/reports` (tarjeta *Consultas Rápidas & Diagnóstico Laboral*), cuando el colaborador con mayor antigüedad no tiene puesto o departamento asignado, imprime literal: `"Ingresó el 2026-11-17 desempeñándose como en null. La tasa de retención global de la empresa es del 100%."`.
- **Causa raíz verificada:**
  - `src/modules/company/services/company-reports.ts:275` interpola directamente `mostSenior.job_title` (vacío/`""` o `null`) y `mostSenior.department` (`null`):
    ```ts
    explanation: `Ingresó el ${mostSenior.hire_date || "inicio de operaciones"} desempeñándose como ${mostSenior.job_title} en ${mostSenior.department}. La tasa de retención global de la empresa es del ${retentionRate}%.`
    ```
  - Además, revisar si otros `insights` en `company-reports.ts` interpolan campos nullable sin fallback legible.
- **Solución propuesta:**
  - En `src/modules/company/services/company-reports.ts:263-278`, normalizar antes de interpolar:
    - Si existen ambos (`jobTitle` y `department`): `desempeñándose como ${jobTitle} en ${department}`.
    - Si falta alguno o ambos: construir la frase sin `null` (ej. `desempeñándose como ${jobTitle || "colaborador"}` y omitir `en ${department}` si es `null`/vacío).
  - Auditar los demás `insights` en `company-reports.ts` (líneas 295-450) por interpolaciones similares.
- **Criterio de aceptación:** Con un empleado sin puesto ni departamento (`department = null`, `job_title = ""`), `/dashboard/company/reports` no muestra `"null"` ni dobles espacios en el texto de diagnóstico.
- **Esfuerzo y dependencias:** **S** | Sin dependencias.

---

### MJR-5. El timbrado CFDI no refresca la insignia `Sin Timbre` en Nómina

- **Severidad:** Mayor
- **Descripción:** En `/dashboard/company/payroll`, tras dispersar la nómina y pulsar `Timbrar SAT 4.0`, aparece el toast de éxito (`Nómina timbrada exitosamente ante el SAT (CFDI 4.0)`), pero la fila del empleado conserva la insignia `Sin Timbre` hasta recargar manualmente la página.
- **Causa raíz verificada:**
  1. `src/modules/company/components/payroll-view.tsx:223-248` (`handleDispersePayout`): al dispersar cuando el periodo aún no existía en DB (`periodId` era `"payroll-YYYY-MM-DD"`), solo llama `setCurrentStatus("pagada")` sin actualizar `periodId` ni llamar `router.refresh()`. (Esto incluso provocaría que `handleStampPayroll` en la línea 263 falle si no se sincronizó `periodId`, o que tras recargar cambie).
  2. `src/modules/company/components/payroll-view.tsx:257-288` (`handleStampPayroll`): al terminar `stampPayrollPeriodAction`, solo llama `setCurrentStatus("timbrada")` y **no actualiza `employees[i].cfdi`** (`emp.cfdi?.status === "timbrado"` en línea 545) ni invoca `router.refresh()` + `useEffect` de sincronización de props.
- **Solución propuesta:**
  - En `src/modules/company/components/payroll-view.tsx`:
    1. En `handleDispersePayout`, si `res.data?.payrollId` regresa, actualizar el estado local de `periodId` (y llamar `router.refresh()`).
    2. En `handleStampPayroll`, invocar `router.refresh()` al completar y sincronizar `employees` y `currentStatus` cuando `initialSummary` cambie (o actualizar optimista/inmediatamente `emp.cfdi` con los resultados devueltos por `stampPayrollPeriodAction` para que `SAT CFDI` aparezca al instante).
- **Criterio de aceptación:** Dispersar y pulsar `Timbrar SAT 4.0` en `/dashboard/company/payroll`; la insignia en la fila cambia inmediatamente de `Sin Timbre` a `SAT CFDI` sin recargar la página.
- **Esfuerzo y dependencias:** **S** | Sin dependencias.

---

### MJR-6. Cálculos y desfases por fallback y zona horaria

Agrupa cuatro problemas de lógica/datos detectados en el flujo operativo:

#### MJR-6a. Fechas por defecto en UTC (`2026-11-17` cuando localmente era `16 nov`)
- **Severidad:** Mayor
- **Descripción:** Al operar por la noche en horario de México (`America/Mexico_City` / `America/Cancun`, UTC-5/UTC-6), `Asistencia`, `Empleados` (fecha de ingreso en dossier/alta), `Contratos` y `Reportes` mostraron `2026-11-17` en lugar de `2026-11-16`.
- **Causa raíz verificada:** Uso extendido de `new Date().toISOString().split("T")[0]` (y `.slice(0, 10)`) tanto en servidor (`company-attendance.ts:88, 416`, `company-service.ts:77, 148, 514, 544, 594, 1013`, `company-dashboard.ts:100, 101, 142, 146, 571`, `company-evaluations.ts:65, 155`) como en componentes cliente (`contract-builder-modal.tsx:89`, `employee-dossier-modal.tsx:110`, `hire-candidate-wizard-modal.tsx:79`, `new-incident-modal.tsx:69`, `vacation-request-modal.tsx:60, 63`, `company-reports-view.tsx:127`). `toISOString()` siempre convierte a UTC.
- **Solución propuesta:**
  - Crear/reutilizar un único helper puro de fecha local (ej. `getLocalISODate(date = new Date(), timeZone = "America/Mexico_City")` usando `Intl.DateTimeFormat("en-CA", { timeZone })` o un helper en `src/lib/` / `src/modules/company/utils/`), y reemplazar los `.toISOString().split("T")[0]` que representan fechas de negocio ("hoy" en el panel, `workDate`, `hire_date`, `start_date`, `evaluationDate`, `incidentDate`).
  - *Nota Ponytail:* En servidor (Vercel corre en UTC), `Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(date)` da `"YYYY-MM-DD"` exacto en hora de México sin librerías externas.
- **Criterio de aceptación:** Probando después de las 19:00 hora local de México (cuando ya es día siguiente en UTC), Asistencia, Alta de empleado, Nuevo contrato y Reportes muestran la fecha local correcta (`YYYY-MM-DD` de México).
- **Esfuerzo:** **M** | Sin dependencias (conviene hacer antes de MJR-6b).

#### MJR-6b. `Asistencia` muestra `Puntualidad: 100 %` con `0 Presentes` y `1 Ausencia`
- **Severidad:** Mayor
- **Descripción:** Cuando hay 1 colaborador con estatus `Ausencia` y `0` entradas puntuales, el KPI `Puntualidad` marca `100 %`.
- **Causa raíz verificada:**
  - `src/modules/company/services/company-attendance.ts:698-699`:
    ```ts
    const attended = presentCount + lateCount;
    const punctualityRate = attended > 0 ? Math.round((presentCount / attended) * 100) : 100;
    ```
  - Idéntico en `src/modules/company/services/company-dashboard.ts:538-540` (`totalAttended > 0 ? ... : 100`) y `company-attendance.ts:732, 811`. Cuando nadie ha asistido (`attended === 0`), devuelve `100` por defecto.
- **Solución propuesta:**
  - Si `attended === 0`: si existen ausencias injustificadas (`unjustifiedAbsences > 0`), devolver `0` (o mostrar `"—"` / `null` cuando `totalScheduled === 0` o no hay marcajes aún), en lugar de `100 %`. Unificar el cálculo en una sola función compartida usada por `company-attendance.ts` y `company-dashboard.ts` para no duplicar lógica.
- **Criterio de aceptación:** Con 1 empleado en `Ausencia` y 0 `Presentes`, `Puntualidad` no muestra `100 %` (muestra `0 %` si hay falta o `—` si aún no hay registros).
- **Esfuerzo:** **S** | Relacionado con MJR-6a (fecha correcta del día).

#### MJR-6c. `Nómina` calcula sobre `$4,250` aunque el empleado tiene salario `$0`
- **Severidad:** Mayor
- **Descripción:** Un colaborador registrado manualmente (salario `$0 MXN` en su expediente) aparece en `/dashboard/company/payroll` con `Sueldo Base: $4,250` quincenal, bonos de `$426`, IMSS/ISR y neto de `$4,202 MXN`.
- **Causa raíz verificada:**
  - `src/modules/company/services/company-payroll.ts:133` y `308`:
    `const monthlySalary = Number(emp.base_salary_monthly) || 8500;`
  - Al usar `|| 8500`, cualquier salario `0` o `null` se reemplaza silenciosamente por `$8,500` mensuales (`$4,250` quincenales), y además `payroll-calculator` aplica `defaultPunctuality` y `defaultAttendance` del 5% sobre ese monto ficticio.
- **Solución propuesta (sujeta a Decisión D4):**
  - **Si D4 = Opción A:** Cambiar a `const monthlySalary = Math.max(0, Number(emp.base_salary_monthly) || 0);` en `company-payroll.ts:133` y `308`. Cuando `monthlySalary === 0`, calcular percepciones/deducciones en `$0` (sin inventar IMSS/ISR/bonos) y mostrar aviso en la tarjeta del colaborador en `payroll-view.tsx` con enlace a su expediente para capturar salario.
- **Criterio de aceptación:** Un empleado con `base_salary_monthly = 0` aparece con `$0` en pre-nómina (y alerta visible) en lugar de `$4,250`.
- **Esfuerzo:** **S** | Depende de **D4**.

#### MJR-6d. `Radar de talento` sin mapa y `QR de sucursal` sin geocerca visible
- **Severidad:** Mayor (condicionada a definición de producto D2/D3)
- **Descripción:**
  - `/dashboard/company/radar` (`CandidateRadarView`) solo muestra la lista/tabla de perfiles y el filtro por ciudad; no hay mapa.
  - El modal `QR de sucursal` (`BranchQrKioskModal`) genera el QR (que codifica `lat`, `lng` y `r=${branchConfig.radiusMeters}` en la URL), pero no muestra al usuario en el modal cuál es la geocerca activa (coordenadas / radio en metros).
- **Causa raíz verificada:**
  - `src/modules/company/components/radar/candidate-radar-view.tsx`: implementado únicamente como `<Table>` + `<Select>` de ciudades; `candidate_directory` no provee mapa en esa vista.
  - `src/modules/company/components/attendance/branch-qr-kiosk-modal.tsx:92-96` incluye `lat`, `lng`, `r` en `qrCodeData`, pero el panel derecho del modal (líneas ~218-235) solo muestra nombre de sucursal, formato de papel y opciones de proyección/copia.
- **Solución propuesta:**
  - **QR / Geocerca (sujeta a D3):** Mostrar en `BranchQrKioskModal` una fila compacta con `Geocerca: ${branchConfig.radiusMeters} m · ${branchConfig.latitude.toFixed(4)}, ${branchConfig.longitude.toFixed(4)}` (o indicador si usa ubicación por defecto vs. configurada en Perfil).
  - **Radar (sujeta a D2):** Si Brian decide mantener lista, actualizar el criterio de prueba; si decide agregar mapa, planear componente en `candidate-radar-view.tsx` agrupando por ciudad/zona usando `src/config/geo.ts` (sin exponer coordenadas personales exactas).
- **Criterio de aceptación:** En `QR de sucursal` se visualiza el radio y estado de geocerca de la sucursal; en `Radar` se cumple la opción elegida en D2.
- **Esfuerzo:** **S** (para QR) / **M** (si se añade mapa en Radar). | Depende de **D2** y **D3**.

---

## 3. Incidencias Menores

### MNR-1. Botón `X` encimado sobre botón `PDF` y `CURP ,` en modal de Contrato
- **Severidad:** Menor
- **Causa raíz verificada:**
  - `src/components/ui/dialog.tsx:64-76` posiciona el botón cerrar (`X`) de forma absoluta en `top-4 right-4`. `src/modules/company/components/contracts/contract-preview-modal.tsx:84-120` coloca los botones `Imprimir` y `PDF` en la esquina superior derecha del `DialogHeader` sin margen derecho (`pr-10`).
  - `src/modules/company/components/contracts/contract-preview-modal.tsx:151` renderiza `, CURP <u>{contract.employeeCurp}</u>,` aun cuando `employeeCurp` es `""` (generando `CURP ,`).
- **Solución propuesta:** Añadir `pr-10` al contenedor de botones en `DialogHeader` de `contract-preview-modal.tsx:84` y condicionar `CURP`: `contract.employeeCurp ? <>, CURP <u>{contract.employeeCurp}</u></> : null`.
- **Criterio de aceptación:** `X` y `PDF` tienen separación visible sin traslape; si `CURP` está vacío no aparece coma suelta.
- **Esfuerzo:** **S** | Sin dependencias.

### MNR-2. Píldora suelta `"0"` junto a botones de cabecera en Contratos y Evaluaciones
- **Severidad:** Menor
- **Causa raíz verificada:**
  - `src/modules/company/components/contracts-view.tsx:1195-1197` renderiza `<Badge variant="outline" className="font-mono">{contracts.length + terminations.length}</Badge>` sin etiqueta descriptiva.
  - `src/modules/company/components/evaluations-view.tsx:871-873` renderiza `<Badge variant="outline" className="font-mono">{evaluations.length}</Badge>` sin etiqueta.
- **Solución propuesta:** Eliminar esa píldora redundante (los KPIs y pestañas ya muestran los conteos) o añadir texto claro (ej. `{count} registros`) siguiendo la consistencia de `Vacantes` y `Plantilla` (que no tienen ese número suelto). Se recomienda **eliminar** por ser redundante.
- **Criterio de aceptación:** Cabeceras de Contratos y Evaluaciones sin números huérfanos junto a los botones.
- **Esfuerzo:** **S** | Sin dependencias.

### MNR-3. Valores internos crudos en `<Select>` (`"all"`, `"este_mes"`, `"manual"`, `"indeterminado"`, `"quincenal"`, `"persona_moral"`)
- **Severidad:** Menor
- **Causa raíz verificada:** `src/components/ui/select.tsx:21-29` envuelve `@base-ui/react/select` (`SelectPrimitive.Value`). En Base UI, cuando no se pasa `items` a `<Select>` ni función/children explícitos a `<SelectValue />`, `SelectPrimitive.Value` imprime el `value` crudo seleccionado en lugar del texto de `<SelectItem>`.
  - Afectados confirmados:
    - `src/modules/company/components/evaluations-view.tsx:1116` (9-Box muestra `"all"` porque tiene `<SelectValue placeholder="Todas las áreas">{...}</SelectValue>` o mismatch en render)
    - `src/modules/company/components/leaves/company-leaves-view.tsx:241` (`"all"`)
    - `src/modules/company/components/incidents-view.tsx:292, 314` (`"all"`)
    - `src/modules/company/components/reports/company-reports-view.tsx:193` (`"este_mes"`)
    - `src/modules/company/components/contracts/contract-builder-modal.tsx:206, 232, 317` (`"manual"`, `"indeterminado"`, `"quincenal"`)
    - `src/modules/company/components/company-verification-view.tsx:953` (`"persona_moral"`)
- **Solución propuesta:** Pasar un mapa/array `items` al `<Select>` (patrón nativo de Base UI `Select.Root items={...}`) o renderizar explícitamente la etiqueta mapeada dentro de `<SelectValue>{(val) => LABELS[val] ?? val}</SelectValue>` / etiqueta directa en los componentes afectados. Conviene buscar todos los `<SelectValue` en `src/modules/company/` para corregirlos juntos de una vez.
- **Criterio de aceptación:** Todos los selectores de filtros y formularios muestran etiquetas en español legible (`Todas las áreas`, `Este Mes`, `Registro manual`, `Tiempo indeterminado`, `Quincenal`, `Persona moral`), nunca claves internas.
- **Esfuerzo:** **M** | Sin dependencias.

### MNR-4. Textos en inglés y `<title>` duplicando `"| K'anPro | K'anPro"`
- **Severidad:** Menor
- **Causa raíz verificada:**
  - `"About"`: `src/modules/company/components/applications-inbox.tsx:1766` tiene literal `About`.
  - `"Question 1 of 13"`: `src/modules/company/components/evaluations/evaluation-questionnaire-modal.tsx:731` usa `<QuestionnaireProgress />` (`@shadcn/react/questionnaire`), cuya implementación por defecto formatea `"Question {current} of {total}"` cuando no se le pasan `children` personalizados.
  - `<title>` duplicado: `src/app/layout.tsx:11` define `template: "%s | K'anPro"`, pero 7 páginas exportan `metadata.title` ya terminando en `| K'anPro`:
    - `src/app/(login)/onboarding/page.tsx:8`
    - `src/app/(dashboard)/dashboard/company/employees/page.tsx:7`
    - `src/app/(dashboard)/dashboard/company/employees/[id]/page.tsx:9`
    - `src/app/(dashboard)/dashboard/company/attendance/page.tsx:10`
    - `src/app/(dashboard)/dashboard/company/evaluations/page.tsx:9`
    - `src/app/(dashboard)/dashboard/company/reports/page.tsx:6`
    - `src/app/(dashboard)/dashboard/company/leaves/page.tsx:10`
- **Solución propuesta:**
  1. Cambiar `"About"` a `"Acerca del candidato"` (o `"Resumen"`) en `applications-inbox.tsx:1766`.
  2. Revisar si `QuestionnaireProgress` acepta `format` o `children` (ej. función `(current, total) => \`Pregunta \${current} de \${total}\`` o texto calculado desde `activeItem` en `evaluation-questionnaire-modal.tsx:731`) — verificar props de `@shadcn/react/questionnaire` al implementar.
  3. Quitar el sufijo `" | K'anPro"` de `metadata.title` en las 7 páginas listadas para que el `template` de `src/app/layout.tsx` lo agregue una sola vez.
- **Criterio de aceptación:** Sin textos en inglés en Aplicaciones ni Evaluaciones; pestañas del navegador muestran `"Título | K'anPro"` una sola vez.
- **Esfuerzo:** **S** | Sin dependencias.

### MNR-5. Layout, sincronización menor y warning de `scroll-behavior`
- **Severidad:** Menor
- **Incidencias y causas raíz verificadas:**
  1. **Píldoras de consulta rápida recortadas en Reportes:** `src/modules/company/components/reports/company-reports-view.tsx:322` usa `flex items-center gap-1.5 overflow-x-auto ... scrollbar-none` con `shrink-0` en cada botón; a `1440px` corta el texto sin indicación visual. **Solución:** cambiar a `flex-wrap` (2 líneas limpias sin recorte).
  2. **Tarjeta `Nómina` en `Inicio` sigue en `"En preparación"` tras dispersar:** `src/modules/company/services/company-dashboard.ts:97-108` calcula `payrollSummary.status` solo con `daysToPay <= 3 ? "calculada" : "preparacion"` y nunca consulta `public.company_payrolls` para el periodo actual. **Solución:** consultar `company_payrolls` por `company_id` y `start_date`/`period_name` del periodo activo y mapear `pagada`/`timbrada`/`dispersada` a `PAYROLL_STATUS_LABELS`.
  3. **`"Permisos y vacacio..."` truncado en el sidebar:** `src/components/ui/sidebar.tsx:31` fija `SIDEBAR_WIDTH = "16rem"` (`256px`) y `company-sidebar.tsx:235, 297` usa `px-5` + icono + `<Lock />` + `truncate`. **Solución:** reducir padding horizontal del menú o usar etiqueta corta `"Permisos y vacaciones"` con menor `px` (`px-3` en `ScrollArea` / item) o texto `"Vacaciones y permisos"` / `"Permisos"`. *(Si se cambia texto, validar con Brian).*
  4. **Columna `"Sueldo mensual"` en Vacantes aunque sea quincenal:** `src/modules/company/components/vacancies-manager.tsx:643` tiene encabezado fijo `Sueldo mensual` sin mostrar la frecuencia (`payment_frequency`) en la celda `formatSalary(...)`. **Solución:** cambiar cabecera a `"Sueldo"` e incluir frecuencia en la celda (ej. `$5,000–$7,000 / quincena` o si ya existe en el row data).
  5. **Warning Next.js `scroll-behavior: smooth`:** `src/app/globals.css:178` declara `scroll-behavior: smooth;` sobre `html` pero `src/app/layout.tsx:78` no tiene `data-scroll-behavior="smooth"`. **Solución:** añadir `data-scroll-behavior="smooth"` al tag `<html>` en `src/app/layout.tsx:78` *(pedir aprobación antes de editar `layout.tsx` global conforme a `AGENTS.md`)*.
- **Criterio de aceptación:** Píldoras de Reportes visibles completas en 1440×900; tarjeta Nómina en Inicio muestra `Pagada`/`Timbrada` tras dispersar; sidebar legible; sueldo en Vacantes indica periodicidad; 0 warnings de `scroll-behavior` en consola.
- **Esfuerzo total MNR-5:** **S** | `layout.tsx` requiere aprobación previa por ser archivo compartido/global.

---

## 4. Orden de ejecución recomendado

1. **Bloque 0 — Decisiones de Brian:** Resolver **D1–D5** (especialmente **D1**: Acceso Anticipado vs. Fase 1, y **D5**: Contratos manuales).
2. **Bloque 1 — Higiene global de consola y errores transversales (sin dependencias):**
   - **MJR-1** (`nativeButton={false}` en `NotificationBell` y los componentes del panel).
   - **MNR-5e** (`data-scroll-behavior="smooth"` en `src/app/layout.tsx` con aprobación).
3. **Bloque 2 — Coherencia de permisos, módulos y navegación:**
   - **MJR-2** (corregir `getLockedModuleBadge(..., enabledModules)`, proteger `SectionCardHeader` en `Inicio`, y aplicar **D1** en `company-settings-dialog.tsx` / `dashboard-view.tsx` / `demo_rollout`).
4. **Bloque 3 — Corrección de datos reales, cálculos y flujos Mayores:**
   - **MJR-6a** (helper de fecha local en zona de México para reemplazar `toISOString().split("T")[0]`).
   - **MJR-6b** (cálculo real de `punctualityRate` en `company-attendance.ts` y `company-dashboard.ts`).
   - **MJR-6c** (eliminar fallback `$8,500` en `company-payroll.ts` según **D4**).
   - **MJR-5** (refresco inmediato de `SAT CFDI` y `periodId` en `payroll-view.tsx` + **MNR-5b** estado real en `Inicio`).
   - **MJR-3** (nombre de empleado en Contratos según **D5**, con migración si aplica).
   - **MJR-4** (texto sin `null` en diagnóstico de `company-reports.ts`).
   - **MJR-6d** (geocerca visible en `BranchQrKioskModal` y Radar según **D2/D3**).
5. **Bloque 4 — Pulido de UI y textos (Menores):**
   - **MNR-3** (`<SelectValue>` legible en todos los selects con valores crudos).
   - **MNR-1** (cabecera del modal de Contrato y `CURP`).
   - **MNR-2** (quitar píldora `"0"` en Contratos y Evaluaciones).
   - **MNR-4** (`"About"`, `"Question X of Y"` y `<title>` duplicados).
   - **MNR-5a, MNR-5c, MNR-5d** (chips en Reportes, sidebar, columna de sueldo en Vacantes).

---

## 5. Esfuerzo total estimado

| Categoría | Cantidad | Esfuerzo |
| :--- | :--- | :--- |
| Mayores | 6 (`MJR-1` a `MJR-6`, con 4 subítems en `MJR-6`) | ~3 M + 5 S |
| Menores | 5 grupos (`MNR-1` a `MNR-5`) | ~1 M + 4 S |
| **Total estimado** | **Todas las incidencias del reporte** | **~1–2 jornadas de desarrollo enfocado** (sin contar la implementación opcional de mapa en Radar si en D2 se pide) |

---

## 6. Verificación final (criterio de cierre)

1. `pnpm lint` y `pnpm typecheck` / `tsc --noEmit` sin errores nuevos, más pruebas unitarias existentes (`vitest`) para nómina, asistencia y `demo-rollout`.
2. Re-ejecución completa en local (`pnpm dev`, `http://localhost:3000`) con **Playwright MCP + Chrome (`1440×900`)**:
   - Registro/Onboarding + Login con empresa de prueba limpia.
   - Recorrido completo de las **16 opciones + 2 extras** (`Permisos y vacaciones`, `Incidencias`), creando datos mínimos de prueba (vacante, postulación, empleado, marcaje manual, contrato, dispersión/timbrado de nómina) para validar estados con datos y vacíos.
   - Confirmar: **0 errores de consola**, **0 peticiones 4xx/5xx**, **0 textos con `null` / inglés / claves crudas** y limpieza posterior de datos de prueba en la BD local.
