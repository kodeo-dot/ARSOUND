"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { PackGrid } from "@/components/pack-grid"
import { FeaturedProducers } from "@/components/featured-producers"
import { Footer } from "@/components/footer"
import { DynamicPricingCard } from "@/components/dynamic-pricing-card"
import { SubscriptionPlans } from "@/components/subscription-plans"
import { CheckoutModal } from "@/components/checkout-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Music, CreditCard, Tag, Shield, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      {/* Value props section */}
      <section className="py-20 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-2">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground">Alta Calidad</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Samples profesionales creados por productores verificados de toda LATAM
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-2">
                <Tag className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-black text-foreground">Precios LATAM</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Precios accesibles en pesos argentinos con descuentos regionales
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground">Licencias Claras</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Usa los samples en tus producciones royalty-free sin complicaciones
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Showcase */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/15 text-primary border-primary/25 px-4 py-1.5 text-xs font-bold rounded-full">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              PRECIOS REGIONALES
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 text-balance">
              Precios pensados para LATAM
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Convertimos automaticamente a tu moneda local. Todos los packs incluyen descuento regional para productores latinoamericanos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <DynamicPricingCard
              title="Neon Cumbia Vol. 3"
              producer="mixflp"
              priceARS={4500}
              genre="Cumbia Digital"
              bpm={98}
              format="WAV 24bit"
              tracksCount={47}
            />
            <DynamicPricingCard
              title="Trap LATAM Essentials"
              producer="beatmaker_ar"
              priceARS={6200}
              genre="Trap"
              bpm={140}
              format="WAV + MIDI"
              tracksCount={62}
            />
            <div className="hidden lg:block">
              <DynamicPricingCard
                title="RKT Underground Kit"
                producer="dj_rkt"
                priceARS={3800}
                genre="RKT"
                bpm={130}
                format="WAV 24bit"
                tracksCount={35}
              />
            </div>
          </div>

          {/* Checkout demo */}
          <div className="flex justify-center mt-10">
            <CheckoutModal
              packTitle="Neon Cumbia Vol. 3"
              packPrice={4500}
              packProducer="mixflp"
            >
              <Button
                variant="outline"
                size="lg"
                className="rounded-full font-bold gap-2 bg-transparent"
              >
                <CreditCard className="h-4 w-4" />
                Ver checkout de ejemplo
              </Button>
            </CheckoutModal>
          </div>
        </div>
      </section>

      <PackGrid />

      {/* Subscription Plans */}
      <SubscriptionPlans />

      <FeaturedProducers />
      <Footer />
    </div>
  )
}
