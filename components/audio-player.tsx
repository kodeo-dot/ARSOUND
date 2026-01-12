"use client"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from "lucide-react"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export function AudioPlayer() {
  const { currentPack, isPlaying, togglePlay, closePlayer } = useAudioPlayer()
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playRegistered, setPlayRegistered] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!currentPack?.audioUrl) return

    setPlayRegistered(false)

    // Create or update audio element
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = "metadata"

      // Set up event listeners
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0)
      })

      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
        }
      })

      audioRef.current.addEventListener("ended", () => {
        setProgress(0)
        setCurrentTime(0)
        togglePlay()
      })
    }

    audioRef.current.src = currentPack.audioUrl
    audioRef.current.load()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [currentPack?.audioUrl])

  useEffect(() => {
    if (!currentPack || playRegistered) return

    if (progress >= 30 && !playRegistered) {
      registerPlay()
    }
  }, [progress, currentPack, playRegistered])

  async function registerPlay() {
    if (!currentPack?.id || playRegistered) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: pack } = await supabase.from("packs").select("user_id").eq("id", currentPack.id).single()

      if (pack?.user_id === user?.id) {
        console.log("[v0] Play not registered: user is pack owner")
        setPlayRegistered(true)
        return
      }

      await supabase.from("pack_plays").insert({
        pack_id: currentPack.id,
        user_id: user?.id || null,
        ip_address: null,
      })

      console.log("[v0] Play registered for pack:", currentPack.id)
      setPlayRegistered(true)
    } catch (error) {
      console.error("[v0] Error registering play:", error)
    }
  }

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    setProgress(newProgress)
    if (audioRef.current && duration) {
      const newTime = (newProgress / 100) * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  if (!currentPack) return null

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground min-w-[40px]">{formatTime(currentTime)}</span>
            <Slider value={[progress]} onValueChange={handleProgressChange} max={100} step={0.1} className="flex-1" />
            <span className="text-xs text-muted-foreground min-w-[40px]">{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={currentPack.image || "/placeholder.svg"}
                alt={currentPack.title}
                className="h-14 w-14 rounded-md object-cover shadow-md"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm text-foreground truncate">{currentPack.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{currentPack.producer}</p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-9 w-9 hidden sm:flex">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay}>
                {isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                )}
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 hidden sm:flex">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume & Close */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="hidden md:flex items-center gap-2 w-32">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider value={[volume]} onValueChange={(value) => setVolume(value[0])} max={100} step={1} />
              </div>
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={closePlayer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
