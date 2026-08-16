import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminUsersLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-52 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs space-y-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-3 border-b border-border/20 last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-48 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
