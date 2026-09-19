import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function CandidateVacancyLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-pulse">
      {/* Top back button skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Hero card skeleton */}
      <Card className="p-8 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Skeleton className="size-20 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-8 w-64 md:w-80 rounded" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-28 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="space-y-2 w-full md:w-auto md:text-right">
            <Skeleton className="h-4 w-32 md:ml-auto rounded" />
            <Skeleton className="h-8 w-44 md:ml-auto rounded" />
            <Skeleton className="h-11 w-full md:w-40 rounded-2xl" />
          </div>
        </div>
      </Card>

      {/* Two-column layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8 rounded-3xl space-y-4">
            <Skeleton className="h-6 w-48 rounded" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </Card>
          <Card className="p-8 rounded-3xl space-y-4">
            <Skeleton className="h-6 w-48 rounded" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 rounded-3xl space-y-4">
            <Skeleton className="h-6 w-40 rounded" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-full rounded" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
