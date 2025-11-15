"use client";

import { Suspense } from "react";
import SuccessContent from "./success-content";

export default function PaymentSuccessWrapper() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
