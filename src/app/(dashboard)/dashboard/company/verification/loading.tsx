import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyVerificationLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-60 rounded-md" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/40">
          <Skeleton className="size-12 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3.5 w-72 rounded-md" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full shrink-0" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-5 w-40 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-dashed border-border/70 space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-48 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-lg mt-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/40">
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </Card>
    </div>
  );
}
