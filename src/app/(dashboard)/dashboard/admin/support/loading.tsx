import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminSupportLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-4 space-y-2 shadow-xs">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </Card>
        ))}
      </div>

      <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-3 border-b border-border/20 last:border-0">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-1/3 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        ))}
      </Card>
    </div>
  );
}
