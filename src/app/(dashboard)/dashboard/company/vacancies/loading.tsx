import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyVacanciesLoading() {
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* 4 KPI Summary Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </Card>
        ))}
      </div>

      {/* Unified Filters & Table Skeleton Card */}
      <Card className="bg-card border border-border/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Skeleton className="h-10 flex-1 max-w-md rounded-xl" />
            <div className="flex gap-2 justify-end">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>

        <div className="p-6 space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </Card>
    </div>
  );
}
