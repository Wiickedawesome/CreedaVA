import { HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-20 text-gray-80",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-[#8A6D00]",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", className = "", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center px-2.5 py-0.5
          text-xs font-medium rounded-full
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
export { Badge, type BadgeProps, type BadgeVariant };
