# Kanpro — Agent Instructions

<!-- BEGIN:nextjs-agent-rules -->
**# This is NOT the Next.js you know**

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Architecture

Kanpro is a SaaS platform built with Next.js App Router, TypeScript, and Supabase.

Before implementing changes:
- Inspect the existing project architecture.
- Reuse established patterns and components.
- Follow the installed Next.js documentation.
- Preserve existing public interfaces and behavior.
- Avoid unnecessary dependencies and large refactors.

## Diseño de interfaces en Figma

Antes de diseñar o modificar una interfaz de Kanpro en Figma, consulta las
secciones pertinentes de las [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/).
Aplica sus principios de UX y accesibilidad al sistema de diseño de Kanpro.
En la entrega, enlaza las secciones que guiaron las decisiones.

## Rediseño de Empleados y Candidatos — reglas obligatorias

Estas reglas se aplican al diseño, revisión e implementación de la experiencia
de Empleados y Candidatos. Antes de cada tarea en este ámbito, volver a
consultarlas y revisar la documentación pertinente de Material Design 3.

- Archivo de trabajo: [Kanpro — Design Workspace](https://www.figma.com/design/OympTqYgBkrElSXSV0HVoT/Kanpro--Design-Workspace?node-id=191-9224).
- Página de Figma: `Empleado/Candidato UI` (`191:9224`).
- Base de patrones móviles: [Material Design 3](https://m3.material.io/get-started).
  Las Apple HIG complementan UX y accesibilidad; conservar la identidad visual
  de Kanpro y estas reglas explícitas cuando las referencias difieran.

### Interacción y navegación móvil

- Área táctil mínima de **48 × 48 px** para todo elemento interactivo,
  incluidos iconos, enlaces, controles y destinos de navegación. El icono puede
  ser menor, pero su área interactiva no; evitar áreas superpuestas.
- Navegación inferior con **máximo 5 destinos**.
- Acciones principales, como **Aplicar** y **WhatsApp**, en la zona baja y al
  alcance del pulgar. Acciones secundarias o destructivas en la zona superior.
- **Una sola acción principal por pantalla**. Si Aplicar y WhatsApp conviven,
  solo una tendrá jerarquía principal según el contexto.
- El estatus de la postulación debe permanecer visible en las vistas de
  seguimiento, incluso al desplazarse: **Por revisar → Preselección →
  Entrevista → Contratado**. Mostrar la etapa actual con texto y una señal
  adicional al color. No inventar un estatus si todavía no existe postulación.

### Accesibilidad — WCAG 2.1 AA

- Cumplir WCAG 2.1 AA. Mantener **contraste mínimo de 4.5:1 en todo texto**
  como regla del proyecto, también en texto grande.
- Nunca comunicar información solo por color: acompañar estados, errores y
  selección con texto, iconos u otras señales.
- El texto debe responder al tamaño de fuente del sistema y permitir ampliación
  al **200 %** sin perder contenido ni funcionalidad. Usar tamaños relativos y
  contenedores adaptables en web; no bloquear el zoom.
- Toda la experiencia debe ser usable con **TalkBack y VoiceOver**: nombres
  accesibles, roles, estados y orden de lectura/foco coherentes. Contemplar
  también teclado y foco visible.
- Anotar en Figma el comportamiento esperado de escalado y lectura accesible;
  verificarlo en la implementación. Un mockup por sí solo no acredita conformidad.

### Sistema de diseño

- Reutilizar los **tokens y componentes existentes de shadcn/ui + Tailwind**:
  mismos colores, tipografía y espaciados. **No crear una paleta nueva** ni
  sustituir la identidad de Kanpro por el tema visual de Material.
- Usar una **retícula base de 8 px**, respetando los tokens existentes.
- No añadir la línea negra inferior (indicador de inicio del dispositivo) en
  nuevos frames de Figma, incluidas copias de pantallas existentes.
- Construir componentes reutilizables con **variantes** para los estados y
  tamaños necesarios; usar instancias en las pantallas.
- Nombrar los componentes en Figma **igual que en el código**. Comprobar los
  nombres reales antes de crear o renombrar componentes.
- Si los tokens existentes no permiten cumplir contraste, documentar el
  conflicto y proponer un ajuste para aprobación antes de cambiar tokens o
  componentes globales.

### Comprobación antes de entregar

- Revisar áreas táctiles, máximo de destinos, jerarquía única de acción,
  ubicación de acciones y visibilidad del estatus.
- Medir contraste y comprobar señales adicionales al color.
- Revisar escalado del texto y documentar la verificación pendiente con
  TalkBack/VoiceOver cuando todavía no exista implementación.
- Comprobar reutilización de tokens, retícula, variantes y nombres del código.

### Referencias

- [Material Design 3 — inicio](https://m3.material.io/get-started).
- [Material Design 3 — navegación inferior](https://m3.material.io/components/navigation-bar/guidelines).
- [Android — áreas táctiles accesibles](https://support.google.com/accessibility/android/answer/7101858?hl=en).
- [Apple HIG — accesibilidad: visión y movilidad](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- [WCAG 2.1 AA](https://www.w3.org/TR/WCAG21/).
- [WCAG 1.4.4 — ampliación del texto](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html).

## Parallel Agent Development

Multiple coding agents may work on Kanpro simultaneously.

- Work only within the assigned Git branch and worktree.
- Respect module ownership boundaries.
- Never overwrite or revert another agent's changes.
- Avoid unrelated modifications.
- Do not merge into `main` without explicit approval.
- Request approval before changing shared interfaces, dependencies, configuration, or global components.

## Supabase and Security

- Respect existing database schemas and RLS policies.
- Never expose service-role credentials to the browser.
- Validate authorization on the server.
- Create new migrations instead of editing previously applied migrations.
- Do not execute destructive database operations.
- Do not apply migrations to shared or production databases without approval.

## Quality Requirements

- Use strict TypeScript practices.
- Handle errors and loading states.
- Follow existing UI conventions.
- Run relevant tests and static checks.
- Report changes, tests, limitations, and potential integration conflicts.

## Delivery

Before implementing a substantial feature, explain the proposed approach and affected files.

Never assume that a successful build guarantees functional correctness.
