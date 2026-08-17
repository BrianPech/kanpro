export interface VacancyPreset {
  id: string;
  name: string;
  category: string;
  title: string;
  employment_type: string;
  shift_schedule: string;
  salary_min: number;
  salary_max: number;
  payment_frequency: "semanal" | "quincenal" | "mensual";
  benefits: string[];
  description: string;
  skills: string[];
  experience_required: string;
  education_level: string;
}

export const VACANCY_PRESETS: VacancyPreset[] = [
  {
    id: "cocinero",
    name: "🍳 Cocinero / Cocinera",
    category: "Alimentos y Bebidas",
    title: "Cocinero B (Línea Caliente y Fría)",
    employment_type: "Tiempo Completo",
    shift_schedule: "Mixto / Rolado",
    salary_min: 12000,
    salary_max: 16000,
    payment_frequency: "quincenal",
    benefits: [
      "Prestaciones de Ley (IMSS, Infonavit, Aguinaldo)",
      "Propinas diarias / semanales",
      "Comedor de empleados gratuito",
      "Uniformes incluidos",
    ],
    description: `<h2>Responsabilidades del Puesto:</h2>
<ul>
  <li>Preparación y ensamble de platillos en línea fría y caliente siguiendo estándares de recetas.</li>
  <li>Control de temperatura, porcionamiento e higiene en la estación de trabajo.</li>
  <li>Apoyo en recepción e inventario de insumos diarios.</li>
</ul>
<h2>Requisitos:</h2>
<ul>
  <li>Experiencia previa mínima de 6 meses a 1 año en cocina de restaurante u hotel.</li>
  <li>Conocimiento de distintivo H y manejo higiénico de alimentos.</li>
  <li>Trabajo en equipo y agilidad en horas pico.</li>
</ul>`,
    skills: ["Manejo Higiénico", "Línea Caliente", "Control de Mermas", "Trabajo en Equipo"],
    experience_required: "6 meses a 1 año",
    education_level: "Indistinto",
  },
  {
    id: "recepcionista",
    name: "🛎️ Recepcionista de Hotel",
    category: "Hotelería y Turismo",
    title: "Recepcionista Bilingüe de Hotel",
    employment_type: "Tiempo Completo",
    shift_schedule: "Turno Rotativo",
    salary_min: 14000,
    salary_max: 18000,
    payment_frequency: "quincenal",
    benefits: [
      "Prestaciones de Ley (IMSS, Infonavit, Aguinaldo)",
      "Transporte de personal",
      "Capacitación pagada",
      "Oportunidad de crecimiento",
    ],
    description: `<h2>Responsabilidades del Puesto:</h2>
<ul>
  <li>Atender la llegada (Check-in) y salida (Check-out) de huéspedes locales e internacionales.</li>
  <li>Brindar atención telefónica y gestionar reservas en sistema de recepción.</li>
  <li>Orientación sobre amenidades, tours y recomendaciones de la zona.</li>
</ul>
<h2>Requisitos:</h2>
<ul>
  <li>Inglés conversacional fluido (intermedio a avanzado).</li>
  <li>Excelente actitud de servicio, proactividad y presentación.</li>
  <li>Manejo básico de computación y sistemas de reservas.</li>
</ul>`,
    skills: ["Inglés Conversacional", "Atención a Huéspedes", "Sistemas PMS", "Proactividad"],
    experience_required: "Sin experiencia previa",
    education_level: "Preparatoria / Bachillerato",
  },
  {
    id: "mesero",
    name: "🍽️ Mesero / Mesera",
    category: "Alimentos y Bebidas",
    title: "Mesero / Mesera de Restaurante",
    employment_type: "Tiempo Completo",
    shift_schedule: "Vespertino (Tarde)",
    salary_min: 10000,
    salary_max: 15000,
    payment_frequency: "semanal",
    benefits: [
      "Prestaciones de Ley (IMSS, Infonavit, Aguinaldo)",
      "Propinas diarias / semanales",
      "Comedor de empleados gratuito",
      "Uniformes incluidos",
    ],
    description: `<h2>Responsabilidades del Puesto:</h2>
<ul>
  <li>Atención personalizada a comensales en mesa, toma de comandas y sugerencia de platillos.</li>
  <li>Montaje, limpieza y sanitización de mesas antes y después del servicio.</li>
  <li>Coordinación con barra y cocina para entrega oportuna de alimentos.</li>
</ul>
<h2>Requisitos:</h2>
<ul>
  <li>Experiencia mínima de 6 meses en atención a comensales.</li>
  <li>Actitud alegre, cordialidad y agilidad.</li>
</ul>`,
    skills: ["Atención al Cliente", "Toma de Comandas", "Venta Sugestiva", "Agilidad"],
    experience_required: "6 meses a 1 año",
    education_level: "Secundaria / Preparatoria",
  },
  {
    id: "mantenimiento",
    name: "🛠️ Auxiliar de Mantenimiento",
    category: "Mantenimiento y Limpieza",
    title: "Auxiliar de Mantenimiento General",
    employment_type: "Tiempo Completo",
    shift_schedule: "Matutino (Mañana)",
    salary_min: 11000,
    salary_max: 14000,
    payment_frequency: "quincenal",
    benefits: [
      "Prestaciones de Ley (IMSS, Infonavit, Aguinaldo)",
      "Vales de despensa",
      "Uniformes incluidos",
      "Bono de puntualidad y asistencia",
    ],
    description: `<h2>Responsabilidades del Puesto:</h2>
<ul>
  <li>Mantenimiento preventivo y correctivo de instalaciones (electricidad básica, plomería, pintura).</li>
  <li>Revisión periódica de equipos de aire acondicionado y bombas de agua.</li>
  <li>Reporte diario de incidencias y estado de herramientas.</li>
</ul>
<h2>Requisitos:</h2>
<ul>
  <li>Conocimientos prácticos en electricidad, plomería y acabados.</li>
  <li>Responsabilidad, puntualidad y trabajo con equipo de seguridad.</li>
</ul>`,
    skills: ["Electricidad Básica", "Plomería", "Pintura", "Mantenimiento Preventivo"],
    experience_required: "1 a 2 años",
    education_level: "Indistinto",
  },
  {
    id: "vendedor",
    name: "🛍️ Asesor / Vendedor de Mostrador",
    category: "Ventas y Comercio",
    title: "Asesor de Ventas y Atención en Tienda",
    employment_type: "Tiempo Completo",
    shift_schedule: "Matutino (Mañana)",
    salary_min: 9500,
    salary_max: 15000,
    payment_frequency: "quincenal",
    benefits: [
      "Prestaciones de Ley (IMSS, Infonavit, Aguinaldo)",
      "Comisiones por venta sin tope",
      "Descuentos de la empresa",
      "Capacitación pagada",
    ],
    description: `<h2>Responsabilidades del Puesto:</h2>
<ul>
  <li>Atención a clientes en tienda, asesoría personalizada y cierre de ventas.</li>
  <li>Acomodo, etiquetado e inventario de mercancía en piso de venta.</li>
  <li>Cobro en caja registradora y arqueos diarios.</li>
</ul>
<h2>Requisitos:</h2>
<ul>
  <li>Gusto por las ventas y trato con el cliente.</li>
  <li>Facilidad de palabra y dinamismo.</li>
</ul>`,
    skills: ["Ventas", "Atención al Cliente", "Manejo de Caja", "Inventarios"],
    experience_required: "Sin experiencia previa",
    education_level: "Preparatoria / Bachillerato",
  },
];
