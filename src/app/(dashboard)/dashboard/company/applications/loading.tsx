import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyApplicationsLoading() {
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* 4 KPI Metrics Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
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

      {/* Unified Master-Detail Inbox Skeleton */}
      <Card className="bg-card border border-border/60 rounded-3xl shadow-xs overflow-hidden">
        {/* Toolbar Header Skeleton */}
        <div className="p-4 sm:p-5 space-y-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Skeleton className="h-10 flex-1 max-w-md rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-44 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-8 w-24 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Master-Detail Body Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
          {/* Left Roster Skeleton */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-border/60 p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-40 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Detail Skeleton */}
          <div className="md:col-span-7 lg:col-span-8 p-6 space-y-4 bg-muted/10">
            <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-44 rounded-md" />
                  <Skeleton className="h-3.5 w-64 rounded-md" />
                </div>
              </div>
            </div>
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      </Card>
    </div>
  );
}
