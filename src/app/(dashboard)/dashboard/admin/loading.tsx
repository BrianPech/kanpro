import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminDashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* 4 Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="size-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </Card>
        ))}
      </div>

      {/* Main Charts / Activity grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-32 rounded-md" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </Card>

        <Card className="lg:col-span-1 bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-xs">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
