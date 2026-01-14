"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { LayoutDashboard, Package, Users, Shield, DollarSign, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Packs",
    href: "/admin/packs",
    icon: Package,
  },
  {
    title: "Usuarios",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Compras",
    href: "/admin/purchases",
    icon: ShoppingCart,
  },
  {
    title: "Apelaciones",
    href: "/admin/appeals",
    icon: Shield,
  },
  {
    title: "Precios de Planes",
    href: "/admin/pricing",
    icon: DollarSign,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <Card className="p-4 rounded-2xl border-border sticky top-24">
      <div className="mb-4 pb-4 border-b border-border">
        <h2 className="font-black text-foreground text-lg">Panel de Admin</h2>
        <p className="text-sm text-muted-foreground">Gestión de la plataforma</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </Card>
  )
}
