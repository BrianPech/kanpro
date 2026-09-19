"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { TrendingUp, Send, Briefcase } from "lucide-react";
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
    label: "Vacantes Publicadas",
    color: "#10b981", // Emerald 500
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({ data = [] }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState<"90d" | "30d" | "7d">("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const dataset = React.useMemo(() => {
    if (data && data.length > 0) return data;
    const zeroFilled: Array<{ date: string; applications: number; vacancies: number }> = [];
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
    <Card className="bg-card border border-border/60 rounded-3xl shadow-xs overflow-hidden mx-4 lg:mx-6">
      <CardHeader className="p-4 sm:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-extrabold text-foreground">
              Dinámica de Contratación & Actividad
            </CardTitle>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              <TrendingUp className="size-3" />
              <span>Sureste de México</span>
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground font-medium">
            Comparativa de postulaciones de candidatos vs. nuevas vacantes publicadas.
          </CardDescription>
        </div>

        {/* Time range switcher */}
        <div className="flex items-center gap-2">
          {/* Desktop Toggle Group */}
          <ToggleGroup
            value={[timeRange]}
            onValueChange={(val) => {
              if (val.length > 0 && val[0]) setTimeRange(val[0] as "90d" | "30d" | "7d");
            }}
            variant="outline"
            className="hidden sm:flex bg-muted/40 p-0.5 rounded-xl border-border/60"
          >
            <ToggleGroupItem value="90d" className="text-xs font-bold px-3 py-1 rounded-lg">
              90 Días
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="text-xs font-bold px-3 py-1 rounded-lg">
              30 Días
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="text-xs font-bold px-3 py-1 rounded-lg">
              7 Días
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Mobile Select */}
          <div className="sm:hidden w-full">
            <Select
              value={timeRange}
              onValueChange={(val) => {
                if (val) setTimeRange(val as "90d" | "30d" | "7d");
              }}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs font-bold border-border/60 bg-muted/40 w-full">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg">
                <SelectItem value="90d" className="text-xs font-semibold rounded-lg">90 Días</SelectItem>
                <SelectItem value="30d" className="text-xs font-semibold rounded-lg">30 Días</SelectItem>
                <SelectItem value="7d" className="text-xs font-semibold rounded-lg">7 Días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40 bg-muted/20 text-center py-3 px-4">
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Send className="size-3 text-primary" />
            <span>Postulaciones</span>
          </span>
          <p className="text-base sm:text-xl font-extrabold text-foreground font-mono">
            {totals.totalApps.toLocaleString()}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Briefcase className="size-3 text-emerald-500" />
            <span>Nuevas Vacantes</span>
          </span>
          <p className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {totals.totalVacs.toLocaleString()}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Promedio Diario
          </span>
          <p className="text-base sm:text-xl font-extrabold text-foreground font-mono">
            {totals.dailyAvg} <span className="text-[10px] text-muted-foreground font-sans">apps/día</span>
          </p>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] sm:h-[290px] w-full">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillVacs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                });
              }}
              className="text-[11px] font-semibold text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[11px] font-mono text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="applications"
              type="monotone"
              fill="url(#fillApps)"
              stroke="var(--primary)"
              strokeWidth={2.5}
            />
            <Area
              dataKey="vacancies"
              type="monotone"
              fill="url(#fillVacs)"
              stroke="#10b981"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
