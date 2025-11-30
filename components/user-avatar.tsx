"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserAvatarProps {
  avatarUrl?: string | null
  username?: string
  displayName?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UserAvatar({ avatarUrl, username, displayName, size = "md", className }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const getInitials = () => {
    const name = displayName || username || "US"
    const words = name.trim().split(" ")
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className} ring-2 ring-border/50 transition-all`}>
      <AvatarImage src={avatarUrl || undefined} alt={username || displayName} />
      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-semibold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  )
}
