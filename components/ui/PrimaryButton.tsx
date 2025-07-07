import { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline"
  size?: "sm" | "md" | "lg"
}

const sizeClasses: Record<NonNullable<PrimaryButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
}

export function PrimaryButton({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: PrimaryButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none"

  const solid =
    "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:from-orange-600 hover:to-amber-600"

  const outline =
    "border-2 border-orange-500 text-orange-600 hover:bg-orange-50"

  return (
    <button
      className={cn(base, sizeClasses[size], variant === "solid" ? solid : outline, className)}
      {...props}
    >
      {children}
    </button>
  )
}

export default PrimaryButton; 