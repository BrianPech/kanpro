import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CandidateDiscoveryLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Search Input Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Grid of Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-5 space-y-3.5 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Skeleton className="size-12 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4.5 w-36 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="size-6 rounded-md" />
            </div>
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
