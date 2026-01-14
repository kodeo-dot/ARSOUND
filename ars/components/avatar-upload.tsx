"use client"

import type React from "react"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, Camera } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  username: string
  onAvatarChange: (newAvatarUrl: string) => void
  onFileSelected?: (file: File) => void
  previewUrl?: string | null
}

export function AvatarUpload({
  currentAvatarUrl,
  username,
  onAvatarChange,
  onFileSelected,
  previewUrl,
}: AvatarUploadProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { toast } = useToast()
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  function getInitials() {
    return (username || "US").substring(0, 2).toUpperCase()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("La imagen no debe superar 5MB")
      toast({
        title: "Imagen muy grande",
        description: "La imagen no debe superar 5MB",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Solo se permiten archivos de imagen")
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    if (onFileSelected) {
      onFileSelected(file)
      return
    }

    await uploadAvatar(file)
  }

  async function uploadAvatar(file: File) {
    try {
      setIsUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/avatars/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.error || "Upload failed")
      }

      onAvatarChange(result.avatar_url)
      toast({
        title: "Foto de perfil actualizada",
        description: "Tu foto se ha subido correctamente",
      })
    } catch (error: any) {
      const message = error.message || "Error al subir la foto"
      setUploadError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemoveAvatar() {
    try {
      setIsUploading(true)
      setUploadError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("profiles")
          .update({ avatar_url: null })
          .eq("id", user.id)
        onAvatarChange("")
        toast({
          title: "Foto removida",
          description: "Tu foto de perfil ha sido eliminada",
        })
      }
    } catch (error: any) {
      setUploadError("Error al eliminar la foto")
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la foto",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  function handleClick() {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Label className="text-foreground font-semibold">Foto de Perfil</Label>

      <div className="relative w-32 h-32">
        {previewUrl || currentAvatarUrl ? (
          <img
            src={previewUrl || currentAvatarUrl}
            alt="Avatar preview"
            className="w-full h-full rounded-full object-cover border-4 border-primary/20"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-black text-white">
            {getInitials()}
          </div>
        )}

        <button
          onClick={handleClick}
          className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2.5 shadow-lg transition-all"
          disabled={isUploading}
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={isUploading}
          className="gap-2 rounded-full bg-transparent"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Cambiar Foto
            </>
          )}
        </Button>

        {(currentAvatarUrl || previewUrl) && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="gap-2 rounded-full text-red-600 hover:text-red-600 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm font-medium border border-red-500/20">
          {uploadError}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Formato: JPG, PNG. Tamaño máximo: 5MB</p>
    </div>
  )
}
