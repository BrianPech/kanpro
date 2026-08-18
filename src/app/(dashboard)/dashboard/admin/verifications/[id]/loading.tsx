import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function VerificationDetailLoading() {
  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header bar skeleton */}
      <div className="flex justify-between items-center bg-card p-5 rounded-3xl border border-border/60">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-6 w-60 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* 2 column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-card border border-border/60 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-border/40">
              <Skeleton className="size-12 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-3.5 w-60 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </Card>
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>

        <div className="lg:col-span-7 space-y-5">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <Skeleton className="h-[550px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
