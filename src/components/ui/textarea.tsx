import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400",
        "focus-visible:border-blue-500 focus-visible:ring-blue-500/50 focus-visible:ring-[3px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
