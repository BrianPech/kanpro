import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "w-full min-w-0 font-medium transition-[color,box-shadow,background-color] duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-input/50 focus-visible:bg-background focus-visible:border-ring",
        outline:
          "border border-border/80 bg-background hover:border-border focus-visible:border-ring",
        ghost:
          "border border-transparent bg-transparent hover:bg-input/40 focus-visible:bg-background focus-visible:border-ring",
        filled:
          "border border-transparent bg-muted/60 hover:bg-muted/80 focus-visible:bg-background focus-visible:border-ring",
      },
      inputSize: {
        sm: "h-8 px-2.5 py-1 text-xs rounded-xl",
        default: "h-9 px-3 py-1.5 text-sm rounded-xl md:text-sm",
        lg: "h-10 px-3.5 py-2 text-sm rounded-2xl",
        xl: "h-11 px-4 py-2 text-base md:text-sm rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  size?: VariantProps<typeof inputVariants>["inputSize"]
}

function Input({
  className,
  type,
  variant = "default",
  size = "default",
  inputSize,
  ...props
}: InputProps) {
  const resolvedSize = size || inputSize || "default"

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-variant={variant || "default"}
      data-size={resolvedSize}
      className={cn(
        inputVariants({
          variant,
          inputSize: resolvedSize,
        }),
        className
      )}
      {...props}
    />
  )
}

export { Input, inputVariants }
