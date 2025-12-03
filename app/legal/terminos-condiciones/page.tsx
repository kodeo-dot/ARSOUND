import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Términos y Condiciones - ARSOUND",
  description: "Términos y Condiciones de uso de ARSOUND",
}

export default function TerminosCondiciones() {
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
          <h1 className="text-4xl font-black text-foreground mb-8">Términos y Condiciones</h1>

          <p className="text-muted-foreground mb-6">Última actualización: Noviembre 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceptación de Términos</h2>
              <p className="text-muted-foreground mb-4">
                Al acceder y utilizar ARSOUND ("la Plataforma"), aceptas estar vinculado por estos Términos y
                Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás usar la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground mb-4">
                ARSOUND es un marketplace de sample packs y loops para productores. La Plataforma permite a los usuarios
                subir, vender y descargar contenido de audio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Registro y Cuenta</h2>
              <p className="text-muted-foreground mb-4">
                Para usar la Plataforma debes crear una cuenta con información precisa y actual. Eres responsable de
                mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran en tu cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Propiedad Intelectual</h2>
              <p className="text-muted-foreground mb-4">
                Al subir contenido a la Plataforma, declaras y garantizas que posees todos los derechos sobre el
                contenido o tienes la autorización necesaria para hacerlo. No puedes violar derechos de autor, marcas
                registradas u otros derechos de propiedad intelectual de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Comportamiento del Usuario</h2>
              <p className="text-muted-foreground mb-4">Aceptas no utilizar la Plataforma para:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Violar leyes o regulaciones aplicables</li>
                <li>Subir contenido ofensivo, ilegal o que infrinja derechos de terceros</li>
                <li>Realizar actividades fraudulentas o engañosas</li>
                <li>Interferir con el funcionamiento de la Plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Pagos y Comisiones</h2>
              <p className="text-muted-foreground mb-4">
                ARSOUND aplica comisiones sobre las ventas según el plan del usuario. Los pagos se procesan según los
                términos especificados en cada plan de suscripción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground mb-4">
                ARSOUND no es responsable por pérdidas, daños o problemas derivados del uso de la Plataforma. La
                Plataforma se proporciona "tal como está" sin garantías de ningún tipo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Cambios en los Términos</h2>
              <p className="text-muted-foreground mb-4">
                ARSOUND se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán
                efectivos inmediatamente después de su publicación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contacto</h2>
              <p className="text-muted-foreground mb-4">
                Para preguntas sobre estos Términos y Condiciones, contáctanos en:
              </p>
              <p className="text-muted-foreground">
                <a href="mailto:soporte@arsound.com.ar" className="text-primary hover:underline">
                  soporte@arsound.com.ar
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
