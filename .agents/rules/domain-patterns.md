---
trigger: model_decision
description: "Aplica cuando se implementen o refactoricen cálculos complejos, exportadores, generadores de layouts, o motores de nómina/asistencia."
---
# Patrones de Diseño y POO en Motores de Dominio

Aplica estos principios exclusivamente en la capa de utilidades y servicios de dominio (`modules/**/utils/` y `modules/**/services/`):

## 1. Dónde Aplicar POO
- **Calculadoras y Motores de Reglas:** Utiliza clases para encapsular motores de cálculo con estado de configuración (ej. `PayrollCalculator`, `Nom035Engine`, `VacationCalculator`).
- **Encapsulamiento e Invariantes:** Las clases deben proteger su estado interno contra combinaciones inválidas (por ejemplo, cálculo de SDI o deducciones del SAT que dependen de antigüedades o salarios mínimos).

## 2. Patrones de Diseño Recomendados
- **Strategy Pattern:** Utilízalo cuando existan múltiples algoritmos para una misma tarea.
  - *Ejemplo:* `BankLayoutGenerator` con estrategias concretas para `BbvaLayoutStrategy`, `BanorteLayoutStrategy` implementando una interfaz común `IBankLayoutStrategy`.
  - *Ejemplo:* Exportadores en `report-csv-exporter.ts` desacoplando el formateador de datos del origen de datos.
- **Factory Pattern:** Úsalo para instanciar la estrategia adecuada basándote en la configuración de la empresa o el banco destino.
- **Value Objects:** Modela conceptos de negocio con validación interna inmutable:
  ```typescript
  export class MexicanRFC {
    private readonly value: string;
    constructor(raw: string) {
      if (!MexicanRFC.isValid(raw)) throw new Error("RFC inválido");
      this.value = raw.toUpperCase().trim();
    }
    public getValue(): string { return this.value; }
    public isMoral(): boolean { return this.value.length === 12; }
    public isFisica(): boolean { return this.value.length === 13; }
  }
  ```
