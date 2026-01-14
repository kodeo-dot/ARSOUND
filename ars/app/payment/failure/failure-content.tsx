"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function FailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reason = searchParams.get("reason") || "desconocida";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2 text-red-600">Pago rechazado</h1>
          <p className="text-muted-foreground mb-6">
            El pago no pudo procesarse. Por favor intenta con otro método de pago o contacta a soporte.
          </p>

          {reason !== "desconocida" && (
            <div className="bg-muted p-4 rounded-md mb-6 text-sm text-muted-foreground">
              Razón: {reason}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              Volver
            </Button>
            <Button onClick={() => router.push("/")} className="flex-1">
              Ir al inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
