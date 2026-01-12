import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminGuard } from "@/components/admin/admin-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <AdminNav />
            </aside>
            <main className="lg:col-span-3">{children}</main>
          </div>
        </div>
        <Footer />
      </div>
    </AdminGuard>
  )
}
