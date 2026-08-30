"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  id?: string
  value?: string | Date | null
  onChange?: (value: string, date?: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  startYear?: number
  endYear?: number
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  disabled = false,
  className,
  minDate = new Date(1940, 0, 1),
  maxDate = new Date(),
  startYear = 1940,
  endYear = new Date().getFullYear(),
  captionLayout = "dropdown",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse current date
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return isValid(value) ? value : undefined
    if (typeof value === "string" && value.trim()) {
      // Handles both "YYYY-MM-DD" and ISO strings safely
      const cleanStr = value.includes("T") ? value.split("T")[0] : value.trim()
      const parsed = parseISO(cleanStr)
      if (isValid(parsed)) return parsed
      const fallback = new Date(value)
      if (isValid(fallback)) return fallback
    }
    return undefined
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const formattedIso = `${year}-${month}-${day}`
      onChange?.(formattedIso, date)
      setOpen(false)
    } else {
      onChange?.("", undefined)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("", undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-9.5 rounded-xl justify-between px-3 text-left font-normal bg-background border-border/70 text-xs sm:text-sm hover:bg-muted/40 transition-colors shadow-2xs",
              !selectedDate && "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50 bg-muted/40",
              className
            )}
          />
        }
      >
        <span className="truncate">
          {selectedDate ? (
            <span className="capitalize text-foreground font-medium">
              {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground ml-2">
          {selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 rounded-md hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
              title="Limpiar fecha"
            >
              <X className="size-3.5" />
            </span>
          )}
          <CalendarIcon className="size-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 rounded-2xl border border-border/80 shadow-xl bg-card overflow-hidden"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={es}
          captionLayout={captionLayout}
          startMonth={minDate || new Date(startYear, 0)}
          endMonth={maxDate || new Date(endYear, 11)}
          defaultMonth={selectedDate || new Date(1998, 0)}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  )
}
