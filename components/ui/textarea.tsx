import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "glass-border placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/60 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive backdrop-blur-xl flex field-sizing-content min-h-16 w-full rounded-md px-3 py-2 text-base transition-all outline-none focus-visible:ring-[3px] focus-visible:shadow-lg focus-visible:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
