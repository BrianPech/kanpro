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
  defaultMonth?: Date
  startYear?: number
  endYear?: number
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  disabledDates?: (date: Date) => boolean
  hidePastDates?: boolean
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  disabled = false,
  className,
  minDate,
  maxDate,
  defaultMonth,
  startYear,
  endYear,
  captionLayout = "label",
  disabledDates,
  hidePastDates = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse current date in local timezone to prevent 1-day shifts
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return isValid(value) ? value : undefined
    if (typeof value === "string" && value.trim()) {
      const cleanStr = value.includes("T") ? value.split("T")[0] : value.trim()
      const parts = cleanStr.split("-").map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const localDate = new Date(parts[0], parts[1] - 1, parts[2])
        if (isValid(localDate)) return localDate
      }
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

  const initialMonth =
    defaultMonth ||
    selectedDate ||
    (minDate && minDate > new Date() ? minDate : new Date())

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
              "w-full h-10 rounded-xl justify-between px-3 text-left font-normal bg-background border-border/70 text-xs sm:text-sm hover:bg-muted/40 transition-colors shadow-2xs",
              !selectedDate && "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50 bg-muted/40",
              className
            )}
          />
        }
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="size-4 text-primary shrink-0 pointer-events-none" />
          <span className="truncate">
            {selectedDate ? (
              <span className="capitalize text-foreground font-medium">
                {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
        </div>

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
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 rounded-2xl border border-border/80 shadow-2xl bg-card overflow-hidden z-[70]"
      >
        {(() => {
          const now = new Date()
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          return (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              locale={es}
              captionLayout={captionLayout}
              startMonth={
                hidePastDates
                  ? startOfToday
                  : minDate || (startYear !== undefined ? new Date(startYear, 0) : undefined)
              }
              endMonth={maxDate || (endYear !== undefined ? new Date(endYear, 11) : undefined)}
              defaultMonth={initialMonth}
              hidden={hidePastDates ? (date: Date) => date < startOfToday : undefined}
              disabled={(date) => {
                if (hidePastDates && date < startOfToday) return true
                if (minDate) {
                  const startOfMin = new Date(minDate)
                  startOfMin.setHours(0, 0, 0, 0)
                  if (date < startOfMin) return true
                }
                if (maxDate) {
                  const endOfMax = new Date(maxDate)
                  endOfMax.setHours(23, 59, 59, 999)
                  if (date > endOfMax) return true
                }
                if (disabledDates && disabledDates(date)) return true
                return false
              }}
              className="p-3"
            />
          )
        })()}
      </PopoverContent>
    </Popover>
  )
}
