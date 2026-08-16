import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyApplicationsLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <Skeleton className="size-12 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4.5 w-40 rounded-md" />
                <Skeleton className="h-3.5 w-60 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
