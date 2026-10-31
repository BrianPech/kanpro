import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyEmployeesLoading() {
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-7 w-12 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </Card>
        ))}
      </div>

      {/* Unified Table/Grid Card Skeleton */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-5 space-y-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Skeleton className="h-10 flex-1 max-w-md rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-xl" />
              <Skeleton className="h-8 w-20 rounded-xl" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-44 rounded-xl" />
          </div>
        </div>

        <div className="p-5 space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </Card>
    </div>
  );
}
