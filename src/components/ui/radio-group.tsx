"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  name?: string
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
} | null>(null)

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, disabled, name, children, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(defaultValue)
    const isControlled = value !== undefined
    const activeValue = isControlled ? value : localValue

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setLocalValue(newValue)
        }
        if (onValueChange) {
          onValueChange(newValue)
        }
      },
      [isControlled, onValueChange]
    )

    return (
      <RadioGroupContext.Provider
        value={{
          value: activeValue,
          onValueChange: handleValueChange,
          name,
          disabled,
        }}
      >
        <div
          ref={ref}
          role="radiogroup"
          className={cn("grid gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, id, children, disabled: itemDisabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    if (!context) {
      throw new Error("RadioGroupItem must be used within a RadioGroup")
    }

    const isChecked = context.value === value
    const isDisabled = context.disabled || itemDisabled
    const uniqueId = id || `radio-${value}-${Math.random().toString(36).substring(2, 9)}`

    const handleChange = () => {
      if (!isDisabled && context.onValueChange) {
        context.onValueChange(value)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isChecked}
        disabled={isDisabled}
        id={uniqueId}
        onClick={handleChange}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-all duration-200",
          isChecked ? "border-primary bg-background" : "border-neutral-300 dark:border-neutral-700 hover:border-primary/50",
          className
        )}
        {...props}
      >
        {children || (
          isChecked && (
            <span className="flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          )
        )}
      </button>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem, RadioGroupContext }
