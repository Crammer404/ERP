"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleRowProps {
  children: React.ReactNode
  trigger: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
}

const CollapsibleRow = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleRowProps
>(({ 
  children, 
  trigger, 
  defaultOpen = false, 
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  ...props 
}, ref) => {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <CollapsiblePrimitive.Root
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      className={cn("w-full", className)}
      {...props}
    >
      <CollapsiblePrimitive.Trigger
        className={cn(
          "flex w-full items-center justify-between transition-all",
          disabled && "cursor-not-allowed opacity-50",
          triggerClassName
        )}
        disabled={disabled}
      >
        <div className="flex-1">{trigger}</div>
        {!disabled && (
          <ChevronDown 
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )} 
          />
        )}
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content
        className={cn(
          "overflow-hidden text-sm transition-all",
          "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
          contentClassName
        )}
      >
        <div className="pt-2">{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
})
CollapsibleRow.displayName = "CollapsibleRow"

export { CollapsibleRow }
