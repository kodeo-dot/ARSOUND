"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button variant="outline" className="gap-2 rounded-full h-11 px-6 bg-transparent" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      Salir
    </Button>
  )
}
