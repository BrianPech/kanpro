import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyDashboardLoading() {
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Resumen */}
        <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36 rounded-md" />
              <div className="flex gap-1.5">
                <Skeleton className="size-6 rounded-md" />
                <Skeleton className="size-6 rounded-md" />
              </div>
            </div>
            <div className="mt-5 flex gap-6">
              <div className="space-y-2">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
              <div className="border-l border-border/50 h-10 my-auto" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </Card>

        {/* Card 2: Flujo Semanal */}
        <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="my-3">
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        </Card>

        {/* Card 3: Efectividad del Mes */}
        <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            <Skeleton className="size-6 rounded-md" />
          </div>
          <div className="flex items-center justify-between gap-3 my-2">
            <Skeleton className="size-24 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-5/6 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </Card>

        {/* Card 4: Pendientes del día */}
        <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-7 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-4 rounded-md shrink-0" />
                <Skeleton className="h-3.5 flex-1 rounded-md" />
              </div>
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-4 rounded-md shrink-0" />
                <Skeleton className="h-3.5 w-4/5 rounded-md" />
              </div>
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-4 rounded-md shrink-0" />
                <Skeleton className="h-3.5 w-2/3 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
        </Card>

        {/* Vacancies Section Skeleton */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-md" />
            </div>
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
