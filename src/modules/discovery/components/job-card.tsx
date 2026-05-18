"use client"

import { Bookmark, MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Job } from "../data/mock"

function formatSalary(min: number, max: number) {
  const f = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString()}`
  return `${f(min)} – ${f(max)}`
}

export function JobCard({ job }: { job: Job }) {
  return (
    <div
      className={cn(
        "group flex flex-col rounded-[20px] border bg-card text-card-foreground p-8 transition-all",
        job.featured
          ? "border-[#494fdf]/20 bg-[#494fdf]/[0.02]"
          : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tracking-tight",
              job.featured
                ? "bg-[#494fdf] text-white"
                : "bg-muted text-foreground",
            )}
          >
            {job.companyLogo}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{job.company}</p>
            <h3 className="mt-0.5 text-lg font-medium leading-tight text-foreground">
              {job.title}
            </h3>
          </div>
        </div>
        <button
          type="button"
          className="mt-1 shrink-0 text-[#c9c9cd] transition-colors hover:text-[#494fdf]"
        >
          <Bookmark className="size-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {job.location}
        </span>
        <span className="font-medium text-foreground">
          {formatSalary(job.salaryMin, job.salaryMax)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#8d969e]">
          <Clock className="size-3.5" />
          {job.postedAt}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {job.skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="h-7 rounded-full border-0 bg-muted px-3 text-xs font-normal text-muted-foreground"
          >
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Apply Now
        </Button>
        <span className="text-xs text-[#8d969e]">
          {job.type}
        </span>
      </div>
    </div>
  )
}
