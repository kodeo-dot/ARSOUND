import { Button } from "@/components/ui/button"
import { Play, ChevronRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative bg-background">
      <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-semibold text-foreground border border-border">
            <Play className="h-3 w-3 fill-current" />
            Sample Packs para LATAM
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-balance leading-[1.05]">
            ARSOUND
          </h1>

          <p className="text-xl md:text-2xl lg:text-3xl text-foreground/80 font-medium text-balance max-w-3xl mx-auto leading-relaxed">
            Sample Packs para productores de LATAM
          </p>

          <p className="text-base md:text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            Sonidos profesionales creados por productores latinoamericanos. Trap, reggaetón, cumbia y todos los géneros
            urbanos en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/#packs">
              <Button
                size="lg"
                className="gap-2 text-base h-12 px-8 rounded-full font-semibold w-full sm:w-auto min-w-[200px]"
              >
                Explorar Sample Packs
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/producers">
              <Button
                size="lg"
                variant="outline"
                className="text-base h-12 px-8 rounded-full font-semibold bg-background w-full sm:w-auto min-w-[200px]"
              >
                Ver Creadores
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-foreground">1000+</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium">Sample Packs</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-foreground">500+</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium">Productores</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-foreground">LATAM</div>
              <div className="text-xs md:text-sm text-muted-foreground font-medium">Comunidad</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}
