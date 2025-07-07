import { CheckCircle } from "lucide-react"

export interface VerifiedBadgeProps {
  size?: number
}

export function VerifiedBadge({ size = 16 }: VerifiedBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
      <CheckCircle className="text-green-600" width={size} height={size} />
      Verified
    </span>
  )
}

export default VerifiedBadge; 