import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CompanyVacanciesLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Grid of Vacancies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
