"use client"

import { Waves, Menu, Upload, User, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      // <CHANGE> Fetch user profile for avatar
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, username, display_name")
          .eq("id", user.id)
          .single()
        setProfile(profileData)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url, username, display_name")
          .eq("id", session.user.id)
          .single()
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  // <CHANGE> Get user initials for avatar fallback
  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    // <CHANGE> Cleaner header with minimal colors
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* <CHANGE> Simplified logo without glow effects */}
          <Link href="/" className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-foreground" strokeWidth={2} />
            <span className="text-xl font-bold tracking-tight text-foreground">ARSOUND</span>
          </Link>

          {/* <CHANGE> Removed "Buscar" tab, kept only Inicio/Explorar/Productores */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md hover:bg-accent"
            >
              Inicio
            </Link>
            <Link
              href="/#packs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md hover:bg-accent"
            >
              Explorar
            </Link>
            <Link
              href="/producers"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md hover:bg-accent"
            >
              Productores
            </Link>
          </nav>

          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/upload" className="hidden sm:block">
                {/* <CHANGE> Transparent button with dark gray stroke */}
                <Button
                  variant="outline"
                  className="gap-2 h-9 px-4 bg-transparent border-2 border-foreground/20 hover:bg-accent hover:border-foreground/30 text-foreground font-medium"
                >
                  <Upload className="h-4 w-4" />
                  Subir pack
                </Button>
              </Link>
            )}
            {user ? (
              <>
                {/* <CHANGE> Profile avatar with initials fallback */}
                <Link href="/profile" className="hidden l
