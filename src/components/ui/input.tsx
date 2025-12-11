import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400",
        "focus-visible:border-blue-500 focus-visible:ring-blue-500/50 focus-visible:ring-[3px]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
        "selection:bg-blue-600 selection:text-white",
        className
      )}
      {...props}
    />
  )
}

export { Input }
