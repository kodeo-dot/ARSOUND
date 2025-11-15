import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
              Sonidos 100% Argentinos
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-balance leading-[1.1]">
              El marketplace de <span className="text-primary">samples</span> de Argentina
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground text-balance leading-relaxed">
              Descubrí sonidos únicos creados por productores argentinos. Trap, reggaetón, cumbia y todos los géneros
              urbanos en un solo lugar.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2 text-base h-14 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <TrendingUp className="h-5 w-5" />
                Explorar Packs
              </Button>
              <Link href="/plans">
                <Button size="lg" variant="outline" className="text-base h-14 px-8 rounded-full bg-transparent">
                  Mejorar Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-accent py-3 border-t border-border">
        <p className="text-center text-xs text-muted-foreground">
          Creado con ❤️ por <span className="font-bold text-foreground">mixflp</span>
        </p>
      </div>
    </section>
  )
}
