// Product type constants and configurations

export const PRODUCT_TYPES = {
  sample_pack: {
    label: "Sample Pack",
    description: "Paquete de samples de audio",
    icon: "🎵",
    fields: ["bpm", "key", "genre"],
  },
  midi_pack: {
    label: "MIDI Pack",
    description: "Paquete de archivos MIDI",
    icon: "🎹",
    fields: ["bpm", "genre"],
  },
  preset: {
    label: "Preset",
    description: "Preset para plugins e instrumentos",
    icon: "🎛️",
    fields: ["plugin"],
  },
} as const

export const DAW_OPTIONS = [
  "FL Studio",
  "Ableton Live",
  "Logic Pro",
  "Cubase",
  "Reaper",
  "Pro Tools",
  "Studio One",
  "Bitwig",
  "Universal",
] as const

export type ProductTypeKey = keyof typeof PRODUCT_TYPES
export type DAWOption = (typeof DAW_OPTIONS)[number]
