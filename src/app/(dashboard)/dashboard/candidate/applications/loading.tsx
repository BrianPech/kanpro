import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CandidateApplicationsLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-12 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-44 rounded-md" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between items-center text-xs">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
