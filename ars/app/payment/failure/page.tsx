"use client";

import { Suspense } from "react";
import FailureContent from "./failure-content";

export default function PaymentFailurePageWrapper() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FailureContent />
    </Suspense>
  );
}
