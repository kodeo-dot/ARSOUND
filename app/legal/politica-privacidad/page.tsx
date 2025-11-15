import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Privacidad - ARSOUND",
  description: "Política de Privacidad de ARSOUND",
}

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="gap-2 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-black text-foreground mb-8">Política de Privacidad</h1>

          <p className="text-muted-foreground mb-6">Última actualización: Noviembre 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introducción</h2>
              <p className="text-muted-foreground mb-4">
                ARSOUND ("nosotros", "nuestro" o "la Plataforma") respeta tu privacidad. Esta Política de Privacidad
                explica cómo recopilamos, usamos y protegemos tu información personal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Información que Recopilamos</h2>
              <p className="text-muted-foreground mb-4">Recopilamos la siguiente información:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Información de registro (nombre, email, nombre de usuario)</li>
                <li>Información de perfil (avatar, bio, redes sociales)</li>
                <li>Información de pago y transacciones</li>
                <li>Contenido que subes (packs, demostraciones)</li>
                <li>Datos de interacción con la Plataforma</li>
                <li>Información técnica (dirección IP, navegador)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Cómo Usamos tu Información</h2>
              <p className="text-muted-foreground mb-4">Utilizamos tu información para:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Procesar pagos y transacciones</li>
                <li>Comunicarnos contigo sobre tu cuenta</li>
                <li>Enviar actualizaciones y ofertas (con tu consentimiento)</li>
                <li>Prevenir fraude y actividades ilegales</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Protección de Datos</h2>
              <p className="text-muted-foreground mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra
                acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Compartir Información</h2>
              <p className="text-muted-foreground mb-4">
                No vendemos tu información personal a terceros. Podemos compartir información con:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Proveedores de servicios que nos ayudan a operar la Plataforma</li>
                <li>Autoridades legales cuando sea requerido por ley</li>
                <li>Tu información de perfil público es visible para otros usuarios</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Usamos cookies y tecnologías similares para mejorar tu experiencia en la Plataforma. Puedes controlar
                las cookies a través de la configuración de tu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Tus Derechos</h2>
              <p className="text-muted-foreground mb-4">Tienes derecho a:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Acceder a tu información personal</li>
                <li>Corregir información inexacta</li>
                <li>Solicitar la eliminación de tu datos</li>
                <li>Optar por no recibir comunicaciones de marketing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Cambios en esta Política</h2>
              <p className="text-muted-foreground mb-4">
                Podemos actualizar esta Política de Privacidad en cualquier momento. Te notificaremos de cambios
                significativos por email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contacto</h2>
              <p className="text-muted-foreground mb-4">
                Si tienes preguntas sobre esta Política de Privacidad, contáctanos en:
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:contacto@arsound.com" className="text-primary hover:underline">
                  contacto@arsound.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
