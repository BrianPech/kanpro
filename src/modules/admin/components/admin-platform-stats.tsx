"use client";

import * as React from "react";
import { Area, AreaChart } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const dataCard1 = [
  { day: "Lunes", value: 12 },
  { day: "Martes", value: 18 },
  { day: "Miércoles", value: 15 },
  { day: "Jueves", value: 14 },
  { day: "Viernes", value: 13 },
  { day: "Sábado", value: 15 },
  { day: "Domingo", value: 14 },
];

const dataCard2 = [
  { day: "Lunes", value: 18 },
  { day: "Martes", value: 22 },
  { day: "Miércoles", value: 20 },
  { day: "Jueves", value: 24 },
  { day: "Viernes", value: 21 },
  { day: "Sábado", value: 23 },
  { day: "Domingo", value: 24 },
];

const dataCard3 = [
  { day: "Lunes", value: 120 },
  { day: "Martes", value: 135 },
  { day: "Miércoles", value: 142 },
  { day: "Jueves", value: 138 },
  { day: "Viernes", value: 150 },
  { day: "Sábado", value: 145 },
  { day: "Domingo", value: 156 },
];

const dataCard4 = [
  { day: "Lunes", value: 38 },
  { day: "Martes", value: 40 },
  { day: "Miércoles", value: 39 },
  { day: "Jueves", value: 41 },
  { day: "Viernes", value: 40 },
  { day: "Sábado", value: 42 },
  { day: "Domingo", value: 42 },
];

const chartConfig: ChartConfig = {
  value: {
    label: "Valor",
    color: "var(--color-primary)",
  },
};

export function AdminPlatformStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Card 1 */}
      <Card className="bg-white dark:bg-zinc-900 border border-border/10 shadow-none rounded-2xl p-6 flex flex-col justify-between h-44 group hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tiempo promedio (SLA)</span>
          <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mt-1.5 font-mono">14h</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto">
            <AreaChart data={dataCard1} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent hideLabel labelKey="day" nameKey="value" />} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorValue1)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>
 
      {/* Card 2 */}
      <Card className="bg-white dark:bg-zinc-900 border border-border/10 shadow-none rounded-2xl p-6 flex flex-col justify-between h-44 group hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mensajes abiertos</span>
          <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mt-1.5 font-mono">24</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto">
            <AreaChart data={dataCard2} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent hideLabel labelKey="day" nameKey="value" />} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorValue2)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>
 
      {/* Card 3 */}
      <Card className="bg-white dark:bg-zinc-900 border border-border/10 shadow-none rounded-2xl p-6 flex flex-col justify-between h-44 group hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Postulaciones en espera</span>
          <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mt-1.5 font-mono">156</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto">
            <AreaChart data={dataCard3} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent hideLabel labelKey="day" nameKey="value" />} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorValue3)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>
 
      {/* Card 4 */}
      <Card className="bg-white dark:bg-zinc-900 border border-border/10 shadow-none rounded-2xl p-6 flex flex-col justify-between h-44 group hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Vacantes activas</span>
          <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mt-1.5 font-mono">42</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto">
            <AreaChart data={dataCard4} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent hideLabel labelKey="day" nameKey="value" />} 
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorValue4)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>
    </div>
  );
}
