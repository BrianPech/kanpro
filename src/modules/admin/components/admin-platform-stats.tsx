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
      <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 rounded-[24px] p-8 flex flex-col justify-between h-48 group">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-muted-foreground">Tiempo promedio (SLA)</span>
          <h3 className="text-[48px] font-bold text-primary tracking-tight leading-none">14h</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto">
            <AreaChart data={dataCard1} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
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
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue1)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>

      {/* Card 2 */}
      <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 rounded-[24px] p-8 flex flex-col justify-between h-48 group">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-muted-foreground">Mensajes abiertos</span>
          <h3 className="text-[48px] font-bold text-primary tracking-tight leading-none">24</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto opacity-70 group-hover:opacity-100 transition-opacity">
            <AreaChart data={dataCard2} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
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
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue2)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>

      {/* Card 3 */}
      <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 rounded-[24px] p-8 flex flex-col justify-between h-48 group">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-muted-foreground">Postulaciones en espera</span>
          <h3 className="text-[48px] font-bold text-primary tracking-tight leading-none">156</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto">
            <AreaChart data={dataCard3} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
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
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue3)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </Card>

      {/* Card 4 */}
      <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 rounded-[24px] p-8 flex flex-col justify-between h-48 group">
        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-medium text-muted-foreground">Vacantes activas</span>
          <h3 className="text-[48px] font-bold text-primary tracking-tight leading-none">42</h3>
        </div>
        <div className="w-full h-16 overflow-hidden mt-2">
          <ChartContainer config={chartConfig} className="w-full h-full min-h-[48px] aspect-auto opacity-80 group-hover:opacity-100 transition-opacity">
            <AreaChart data={dataCard4} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorValue4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
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
                strokeWidth={2}
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
