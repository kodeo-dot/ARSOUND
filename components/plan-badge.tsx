import { Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

export type PlanBadgeType = "de_0_a_hit" | "studio_plus"

interface PlanBadgeProps {
  plan: string | null | undefined
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const PLAN_BADGE_CONFIG: Record<
  PlanBadgeType,
  {
    icon: typeof Zap
    bgColor: string
    iconColor: string
    label: string
  }
> = {
  de_0_a_hit: {
    icon: Zap,
    bgColor: "bg-orange-500",
    iconColor: "text-white",
    label: "De 0 a Hit",
  },
  studio_plus: {
    icon: Crown,
    bgColor: "bg-purple-500",
    iconColor: "text-white",
    label: "Studio Plus",
  },
}

const SIZE_CONFIG = {
  xs: {
    container: "w-4 h-4",
    icon: "w-2.5 h-2.5",
  },
  sm: {
    container: "w-5 h-5",
    icon: "w-3 h-3",
  },
  md: {
    container: "w-6 h-6",
    icon: "w-3.5 h-3.5",
  },
  lg: {
    container: "w-8 h-8",
    icon: "w-5 h-5",
  },
}

export function PlanBadge({ plan, size = "sm", className }: PlanBadgeProps) {
  // Only show badge for paid plans
  if (!plan || plan === "free") {
    return null
  }

  const config = PLAN_BADGE_CONFIG[plan as PlanBadgeType]
  if (!config) {
    return null
  }

  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0",
        config.bgColor,
        sizeConfig.container,
        className,
      )}
      title={config.label}
    >
      <Icon className={cn(sizeConfig.icon, config.iconColor)} />
    </div>
  )
}

export function hasPlanBadgeIcon(plan: string | null | undefined): boolean {
  if (!plan || plan === "free") return false
  return plan in PLAN_BADGE_CONFIG
}
