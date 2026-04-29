"use client";

import { useEffect } from "react";

const SDK_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
const SCRIPT_ID = "onesignal-sdk-v16";

declare global {
  interface Window {
    OneSignal?: unknown;
    OneSignalDeferred?: Array<(oneSignal: unknown) => void>;
  }
}

/**
 * Carga el Web SDK de OneSignal una sola vez y define las colas globales
 * antes de que se ejecute el script. Evita next/script en el layout del servidor
 * y reduce warnings/errores de hidratación o de orden de carga.
 */
export default function OneSignalInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.OneSignal = window.OneSignal || [];
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    if (document.getElementById(SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SDK_URL;
    script.defer = true;
    script.async = true;
    script.setAttribute("data-onesignal", "bioage");
    document.head.appendChild(script);
  }, []);

  return null;
}
