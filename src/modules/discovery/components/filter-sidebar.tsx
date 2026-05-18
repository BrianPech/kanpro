"use client"

import { Search, RotateCcw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface FilterState {
  search: string
  types: string[]
  salary: [number, number]
  categories: string[]
  locations: string[]
  experience: string[]
}

interface FilterSidebarProps {
  filter: FilterState
  onChange: (filter: FilterState) => void
  mode: "jobs" | "professionals"
  className?: string
}

const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance"]
const categories = ["Design", "Development", "Marketing", "Finance", "Data"]
const locations = ["Remote", "San Francisco", "New York", "London", "Berlin", "Austin", "Seattle", "Mexico City", "Barcelona"]
const experienceLevels = ["Junior", "Mid", "Senior", "Lead"]

export function FilterSidebar({ filter, onChange, mode, className }: FilterSidebarProps) {
  const hasActiveFilters =
    filter.types.length > 0 ||
    filter.salary[0] > 30 ||
    filter.salary[1] < 200 ||
    filter.categories.length > 0 ||
    filter.locations.length > 0 ||
    filter.experience.length > 0

  const clearAll = () => {
    onChange({
      ...filter,
      types: [],
      salary: [30, 200],
      categories: [],
      locations: [],
      experience: [],
    })
  }

  const toggleItem = (list: string[], item: string) => {
    if (list.includes(item)) {
      return list.filter((i) => i !== item)
    } else {
      return [...list, item]
    }
  }

  return (
    <aside className={cn("w-full px-6 space-y-8", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          className="h-14 rounded-xl border-border bg-muted/50 pl-10 text-sm text-foreground placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Salary Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {mode === "jobs" ? "Salary Range" : "Rate Range"}
          </h3>
          <span className="text-xs font-medium text-muted-foreground">
            {mode === "jobs"
              ? `$${filter.salary[0]}k – $${filter.salary[1]}k`
              : `$${filter.salary[0]}/hr – $${filter.salary[1]}/hr`}
          </span>
        </div>
        <Slider
          value={filter.salary}
          onValueChange={(value) =>
            onChange({ ...filter, salary: value as [number, number] })
          }
          min={0}
          max={300}
          step={5}
          className="py-2"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{mode === "jobs" ? "$0k" : "$0/hr"}</span>
          <span>{mode === "jobs" ? "$300k+" : "$300/hr"}</span>
        </div>
      </div>

      {/* Job Type */}
      {mode === "jobs" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Job Type</h3>
          <div className="flex flex-wrap gap-2">
            {jobTypes.map((type) => {
              const isSelected = filter.types.includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ ...filter, types: toggleItem(filter.types, type) })}
                  className={cn(
                    "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {type}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Category */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = filter.categories.includes(category)
            return (
              <button
                key={category}
                type="button"
                onClick={() => onChange({ ...filter, categories: toggleItem(filter.categories, category) })}
                className={cn(
                  "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Location</h3>
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => {
            const isSelected = filter.locations.includes(loc)
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onChange({ ...filter, locations: toggleItem(filter.locations, loc) })}
                className={cn(
                  "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {loc}
              </button>
            )
          })}
        </div>
      </div>

      {/* Experience */}
      {mode === "jobs" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Experience</h3>
          <div className="flex flex-wrap gap-2">
            {experienceLevels.map((level) => {
              const isSelected = filter.experience.includes(level)
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange({ ...filter, experience: toggleItem(filter.experience, level) })}
                  className={cn(
                    "h-9 px-4 rounded-full text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
