"use client"

import { create } from "zustand"

interface Pack {
  id: string
  title: string
  producer: string
  image: string
  audioUrl: string
}

interface AudioPlayerState {
  currentPack: Pack | null
  isPlaying: boolean
  playPack: (pack: Pack) => void
  togglePlay: () => void
  closePlayer: () => void
}

export const useAudioPlayer = create<AudioPlayerState>((set) => ({
  currentPack: null,
  isPlaying: false,
  playPack: (pack) => set({ currentPack: pack, isPlaying: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  closePlayer: () => set({ currentPack: null, isPlaying: false }),
}))
