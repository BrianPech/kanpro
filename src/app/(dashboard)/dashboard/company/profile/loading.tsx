import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyProfileLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Profile Banner Skeleton */}
      <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-border/40">
          <Skeleton className="size-24 rounded-2xl shrink-0" />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <Skeleton className="h-6 w-52 rounded-md mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-36 rounded-md mx-auto sm:mx-0" />
            <div className="flex gap-2 justify-center sm:justify-start pt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
        </div>

        {/* Profile Form Fields Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/40">
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </Card>
    </div>
  );
}
