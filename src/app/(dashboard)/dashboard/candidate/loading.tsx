import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CandidateDashboardLoading() {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-200">
      {/* 1. Featured Section Skeleton */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="w-[300px] shrink-0 bg-card border border-border/60 rounded-3xl p-6 flex flex-col justify-between h-[200px] shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-11 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
                <Skeleton className="size-6 rounded-md" />
              </div>
              <Skeleton className="h-5 w-4/5 rounded-md my-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Nearby Section Skeleton */}
      <section className="space-y-4 pt-2">
        <Skeleton className="h-6 w-48 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
              <Skeleton className="size-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
