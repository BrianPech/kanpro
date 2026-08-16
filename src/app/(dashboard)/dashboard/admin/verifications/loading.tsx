import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminVerificationsLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-60 rounded-md" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex gap-3 border-b border-border/40 pb-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md ml-auto" />
        </div>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 py-2.5 border-b border-border/20 last:border-0">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-44 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </Card>
    </div>
  );
}
