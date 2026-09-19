import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex field-sizing-content w-full resize-none font-medium transition-[color,box-shadow,background-color] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
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
      textareaSize: {
        sm: "min-h-16 px-2.5 py-1.5 text-xs rounded-xl",
        default: "min-h-20 px-3 py-2 text-sm rounded-xl md:text-sm",
        lg: "min-h-24 px-3.5 py-2.5 text-sm rounded-2xl",
        xl: "min-h-28 px-4 py-3 text-base md:text-sm rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
)

export interface TextareaProps
  extends Omit<React.ComponentProps<"textarea">, "size">,
    VariantProps<typeof textareaVariants> {
  size?: VariantProps<typeof textareaVariants>["textareaSize"]
}

function Textarea({
  className,
  variant = "default",
  size = "default",
  textareaSize,
  ...props
}: TextareaProps) {
  const resolvedSize = size || textareaSize || "default"

  return (
    <textarea
      data-slot="textarea"
      data-variant={variant || "default"}
      data-size={resolvedSize}
      className={cn(
        textareaVariants({
          variant,
          textareaSize: resolvedSize,
        }),
        className
      )}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
