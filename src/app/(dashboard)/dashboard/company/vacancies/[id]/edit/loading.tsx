import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function EditVacancyLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36 rounded-md" />
      </div>

      {/* Stepper Card Skeleton */}
      <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </Card>

      {/* Form Content Card Skeleton */}
      <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <Skeleton className="h-20 w-full rounded-2xl" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-border/40">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </Card>
    </div>
  );
}
