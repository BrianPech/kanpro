"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChartAreaInteractiveProps {
  data?: Array<{
    date: string;
    applications: number;
    vacancies: number;
  }>;
}

const chartConfig = {
  applications: {
    label: "Postulaciones",
    color: "var(--primary)",
  },
  vacancies: {
    label: "Vacantes publicadas",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const TIME_RANGE_LABELS: Record<"90d" | "30d" | "7d", string> = {
  "90d": "Últimos 90 días",
  "30d": "Últimos 30 días",
  "7d": "Últimos 7 días",
};

export function ChartAreaInteractive({ data = [] }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [selectedRange, setSelectedRange] = React.useState<"90d" | "30d" | "7d" | null>(null);
  const timeRange = selectedRange ?? (isMobile ? "7d" : "30d");

  const dataset = React.useMemo(() => {
    if (data && data.length > 0) return data;
    const zeroFilled: Array<{
      date: string;
      applications: number;
      vacancies: number;
    }> = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      zeroFilled.push({
        date: d.toISOString().slice(0, 10),
        applications: 0,
        vacancies: 0,
      });
    }
    return zeroFilled;
  }, [data]);

  const filteredData = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return dataset.slice(-days);
  }, [dataset, timeRange]);

  const totals = React.useMemo(() => {
    const totalApps = filteredData.reduce((acc, curr) => acc + curr.applications, 0);
    const totalVacs = filteredData.reduce((acc, curr) => acc + curr.vacancies, 0);
    const dailyAvg = Math.round(totalApps / (filteredData.length || 1));
    return { totalApps, totalVacs, dailyAvg };
  }, [filteredData]);

  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      {/* Header compacto */}
      <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="text-[15px] font-semibold leading-[20px] text-foreground">
            Dinámica de actividad
          </h2>
          <p className="text-[12px] text-muted-foreground">
            Postulaciones recibidas vs. vacantes publicadas
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ToggleGroup
            value={[timeRange]}
            onValueChange={(val) => {
              if (val.length > 0 && val[0]) {
                setSelectedRange(val[0] as "90d" | "30d" | "7d");
              }
            }}
            variant="outline"
            className="hidden sm:flex bg-muted/50 p-0.5 rounded-[8px] border-border"
          >
            <ToggleGroupItem
              value="90d"
              className="h-7 text-[12px] font-medium px-2.5 rounded-[6px]"
            >
              90d
            </ToggleGroupItem>
            <ToggleGroupItem
              value="30d"
              className="h-7 text-[12px] font-medium px-2.5 rounded-[6px]"
            >
              30d
            </ToggleGroupItem>
            <ToggleGroupItem
              value="7d"
              className="h-7 text-[12px] font-medium px-2.5 rounded-[6px]"
            >
              7d
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="sm:hidden w-full">
            <Select
              value={timeRange}
              onValueChange={(val) => {
                if (val) setSelectedRange(val as "90d" | "30d" | "7d");
              }}
            >
              <SelectTrigger className="h-8 rounded-[8px] text-[12px] font-medium border-control-border bg-background w-full">
                <SelectValue>{TIME_RANGE_LABELS[timeRange]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-border bg-popover">
                <SelectItem value="90d" className="text-[12px]">
                  Últimos 90 días
                </SelectItem>
                <SelectItem value="30d" className="text-[12px]">
                  Últimos 30 días
                </SelectItem>
                <SelectItem value="7d" className="text-[12px]">
                  Últimos 7 días
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cinta de resumen compacta */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/30 px-3 py-2">
        <div className="px-2 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary shrink-0" />
            <span className="truncate">Postulaciones</span>
          </span>
          <span className="text-[16px] font-bold text-foreground tabular-nums leading-tight">
            {totals.totalApps.toLocaleString("es-MX")}
          </span>
        </div>

        <div className="px-2 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-2 shrink-0" />
            <span className="truncate">Vacantes</span>
          </span>
          <span className="text-[16px] font-bold text-foreground tabular-nums leading-tight">
            {totals.totalVacs.toLocaleString("es-MX")}
          </span>
        </div>

        <div className="px-2 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-muted-foreground truncate">
            Promedio diario
          </span>
          <span className="text-[16px] font-bold text-foreground tabular-nums leading-tight">
            {totals.dailyAvg}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">
              / día
            </span>
          </span>
        </div>
      </div>

      {/* Área del gráfico */}
      <div className="p-3.5 pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[215px] sm:h-[230px] w-full"
        >
          <AreaChart
            data={filteredData}
            margin={{ top: 6, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillVacs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              minTickGap={28}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                });
              }}
              className="text-[11px] text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              className="text-[11px] tabular-nums text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="applications"
              type="monotone"
              fill="url(#fillApps)"
              stroke="var(--primary)"
              strokeWidth={2}
            />
            <Area
              dataKey="vacancies"
              type="monotone"
              fill="url(#fillVacs)"
              stroke="var(--chart-2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </section>
  );
}
