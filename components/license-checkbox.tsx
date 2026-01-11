"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface LicenseCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  text: string
  variant?: "upload" | "checkout"
}

export function LicenseCheckbox({ checked, onCheckedChange, text, variant = "checkout" }: LicenseCheckboxProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-accent/30 border border-border rounded-xl">
      <Checkbox id={`license-${variant}`} checked={checked} onCheckedChange={onCheckedChange} className="mt-1" />
      <div className="flex-1">
        <Label htmlFor={`license-${variant}`} className="text-sm text-foreground leading-relaxed cursor-pointer">
          {text}
        </Label>
        <Link
          href="/license"
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 font-medium"
        >
          Leer licencia completa
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
