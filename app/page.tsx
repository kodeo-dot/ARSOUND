"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { PackGrid } from "@/components/pack-grid"
import { FeaturedProducers } from "@/components/featured-producers"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="text-4xl font-black">Alta Calidad</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Samples profesionales creados por productores verificados
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl font-black">Sonidos Urbanos</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ritmos y melodías auténticas para tus producciones
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="text-4xl font-black">Licencias Claras</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Usa los samples en tus producciones sin complicaciones
              </p>
            </div>
          </div>
        </div>
      </section>

      <PackGrid />
      <FeaturedProducers />
      <Footer />
    </div>
  )
}
