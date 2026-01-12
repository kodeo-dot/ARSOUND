export const GENRES = [
  "Todos",
  "RKT",
  "Trap",
  "Reggaeton",
  "Cumbia",
  "Drill",
  "Cuarteto",
  "Dancehall",
  "Latin Urbano",
  "Afrotrap",
  "Hip Hop",
  "Dembow",
] as const

export type Genre = (typeof GENRES)[number]

export const SUBGENRES: Record<string, string[]> = {
  RKT: ["RKT Turreo", "RKT Villero", "RKT Romántico"],
  Trap: ["Trap Latino", "Trap Melódico", "Trap Street"],
  Reggaeton: ["Reggaetón Clásico", "Reggaetón Romántico", "Perreo"],
  Cumbia: ["Cumbia Romántica", "Cumbia Villera", "RKT"],
  Drill: ["UK Drill", "NY Drill", "Latin Drill"],
  Cuarteto: ["Cuarteto Clásico", "Cuarteto Moderno", "Cuarteto Romántico"],
  Dancehall: ["Dancehall Old School", "Dancehall Bashment", "Dancehall Moderno"],
  "Latin Urbano": ["Latin Pop Urbano", "Reggaetón Urbano", "Dance Urbano"],
  Afrotrap: ["Afrotrap Francés", "Afrotrap Latino", "Afrotrap Melódico"],
  "Hip Hop": ["Boom Bap", "Hip Hop Latino", "Hip Hop Alternativo"],
  Dembow: ["Dembow Clásico", "Dembow Dominicano", "Dembow Fusión"],
}

export function getSubgenres(genre: string): string[] {
  return SUBGENRES[genre] || []
}

export function formatGenreDisplay(genre: string, subgenre?: string | null): string {
  if (!subgenre) return genre
  return `${genre} — ${subgenre}`
}
