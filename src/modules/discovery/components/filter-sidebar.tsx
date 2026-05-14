"use client"

import { Search, RotateCcw, SlidersHorizontal, X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

function CheckboxGroup({
  label,
  items,
  selected,
  onChange,
}: {
  label?: string
  items: string[]
  selected: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <label
          key={item}
          className="flex cursor-pointer items-center gap-3 py-1"
        >
          <Checkbox
            checked={selected.includes(item)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...selected, item])
              } else {
                onChange(selected.filter((s) => s !== item))
              }
            }}
            className="size-5 rounded-md data-checked:bg-[#494fdf] data-checked:border-[#494fdf]"
          />
          <span className="text-sm text-[#1f2226]">{item}</span>
        </label>
      ))}
    </div>
  )
}

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

  return (
    <aside className={cn("w-full", className)}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#191c1f]">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-[#505a63] transition-colors hover:text-[#191c1f]"
          >
            <RotateCcw className="size-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#505a63]" />
        <Input
          placeholder="Search..."
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          className="h-12 rounded-full border-[#e2e2e7] bg-white pl-10 text-sm text-[#191c1f] placeholder:text-[#8d969e]"
        />
      </div>

      <Accordion type="multiple" defaultValue={["type", "salary", "category", "location", "experience"]}>
        {mode === "jobs" && (
          <AccordionItem value="type" className="border-[#e2e2e7] data-open:bg-transparent">
            <AccordionTrigger className="px-0 text-sm font-medium text-[#191c1f] hover:no-underline">
              Job Type
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <CheckboxGroup
                items={jobTypes}
                selected={filter.types}
                onChange={(items) => onChange({ ...filter, types: items })}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="salary" className="border-[#e2e2e7] data-open:bg-transparent">
          <AccordionTrigger className="px-0 text-sm font-medium text-[#191c1f] hover:no-underline">
            {mode === "jobs" ? "Salary Range" : "Rate Range"}
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <div className="space-y-3">
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
              <div className="flex items-center justify-between text-xs text-[#505a63]">
                <span>{mode === "jobs" ? "$0k" : "$0/hr"}</span>
                <span className="rounded-lg bg-[#f4f4f4] px-3 py-1.5 text-sm font-medium text-[#191c1f]">
                  {mode === "jobs"
                    ? `$${filter.salary[0]}k – $${filter.salary[1]}k`
                    : `$${filter.salary[0]}/hr – $${filter.salary[1]}/hr`}
                </span>
                <span>{mode === "jobs" ? "$300k+" : "$300/hr"}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="category" className="border-[#e2e2e7] data-open:bg-transparent">
          <AccordionTrigger className="px-0 text-sm font-medium text-[#191c1f] hover:no-underline">
            Category
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <CheckboxGroup
              items={categories}
              selected={filter.categories}
              onChange={(items) => onChange({ ...filter, categories: items })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location" className="border-[#e2e2e7] data-open:bg-transparent">
          <AccordionTrigger className="px-0 text-sm font-medium text-[#191c1f] hover:no-underline">
            Location
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <CheckboxGroup
              items={locations}
              selected={filter.locations}
              onChange={(items) => onChange({ ...filter, locations: items })}
            />
          </AccordionContent>
        </AccordionItem>

        {mode === "jobs" && (
          <AccordionItem value="experience" className="border-[#e2e2e7] data-open:bg-transparent">
            <AccordionTrigger className="px-0 text-sm font-medium text-[#191c1f] hover:no-underline">
              Experience
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <CheckboxGroup
                items={experienceLevels}
                selected={filter.experience}
                onChange={(items) => onChange({ ...filter, experience: items })}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </aside>
  )
}
