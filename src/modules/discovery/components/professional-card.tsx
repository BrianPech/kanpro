"use client"

import { MapPin, Star, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Professional } from "../data/mock"

export function ProfessionalCard({
  professional: pro,
}: {
  professional: Professional
}) {
  return (
    <div className="flex flex-col rounded-[20px] border border-border bg-card text-card-foreground p-8 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-base font-semibold tracking-tight text-foreground">
            {pro.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium leading-tight text-foreground">
                {pro.name}
              </h3>
              {pro.available && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#428619]/40" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#428619]" />
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{pro.title}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Star className="size-3.5 fill-[#b09000] text-[#b09000]" />
          <span className="text-sm font-medium text-foreground">
            {pro.rating}
          </span>
          <span className="text-xs text-[#8d969e]">
            ({pro.reviewCount})
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-3.5" />
        {pro.location}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8d969e]">
          Services
        </p>
        <div className="space-y-2">
          {pro.services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Briefcase className="size-3.5 text-muted-foreground" />
                {service.name}
              </span>
              <span className="text-sm font-medium text-foreground">
                ${service.rate}
                <span className="text-xs font-normal text-muted-foreground">/hr</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {pro.skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="h-7 rounded-full border-0 bg-muted px-3 text-xs font-normal text-muted-foreground"
          >
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="outline" className="h-11 w-full rounded-full text-sm font-medium">
          View Profile
        </Button>
      </div>
    </div>
  )
}
