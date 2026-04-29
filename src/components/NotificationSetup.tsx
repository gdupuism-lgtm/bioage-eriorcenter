"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

type OneSignalWeb = {
  init: (opts: {
    appId: string;
    allowLocalhostAsSecureOrigin?: boolean;
  }) => Promise<void>;
  Notifications: {
    permission: boolean;
    requestPermission: () => Promise<boolean>;
  };
  User: {
    PushSubscription: { id?: string | null; token?: string | null };
  };
};

declare global {
  interface Window {
    OneSignal?: unknown;
    OneSignalDeferred?: Array<(oneSignal: OneSignalWeb) => void>;
  }
}

function useOneSignalInstance() {
  const ref = useRef<OneSignalWeb | null>(null);
  const resolveRef = useRef<((os: OneSignalWeb) => void)[]>([]);

  const whenReady = useCallback((): Promise<OneSignalWeb> => {
    if (ref.current) return Promise.resolve(ref.current);
    return new Promise((resolve) => {
      resolveRef.current.push(resolve);
    });
  }, []);

  const setInstance = useCallback((os: OneSignalWeb) => {
    ref.current = os;
    for (const fn of resolveRef.current) fn(os);
    resolveRef.current = [];
  }, []);

  return { whenReady, setInstance, instance: ref };
}

export default function NotificationSetup() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(APP_ID));
  const [error, setError] = useState<string | null>(null);
  const initStarted = useRef(false);
  const { whenReady, setInstance, instance } = useOneSignalInstance();

  useEffect(() => {
    if (!APP_ID || typeof window === "undefined") return;
    const appId = APP_ID;

    window.OneSignal = window.OneSignal || [];
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    if (initStarted.current) return;
    initStarted.current = true;

    window.OneSignalDeferred.push(async (OneSignal: OneSignalWeb) => {
      setInstance(OneSignal);
      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
        });
        setEnabled(Boolean(OneSignal.Notifications.permission));
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo inicializar OneSignal."
        );
      } finally {
        setLoading(false);
      }
    });
  }, [setInstance]);

  const activateNotifications = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined") return;

    window.OneSignal = window.OneSignal || [];
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    try {
      const OneSignal = instance.current ?? (await whenReady());

      const permission = await OneSignal.Notifications.requestPermission();
      if (!permission) {
        setError("Permiso de notificaciones rechazado.");
        return;
      }

      const playerId = OneSignal.User.PushSubscription.id;
      if (!playerId) {
        setError("No se pudo obtener el ID de suscripción de OneSignal.");
        return;
      }

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          notifications_enabled: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "No se pudo guardar la suscripción.");
        return;
      }

      setEnabled(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudieron activar las notificaciones."
      );
    }
  }, [instance, whenReady]);

  if (!APP_ID) {
    return (
      <article className="glass-card rounded-2xl border border-white/10 p-4">
        <p className="text-xs text-red-300">
          Falta NEXT_PUBLIC_ONESIGNAL_APP_ID en el entorno.
        </p>
      </article>
    );
  }

  return (
    <article className="glass-card rounded-2xl border border-white/10 p-4">
      {loading ? (
        <p className="text-sm text-white/70">Configurando notificaciones...</p>
      ) : null}
      {!loading && enabled ? (
        <p className="text-sm text-emerald-300">✅ Notificaciones activas</p>
      ) : null}
      {!loading && !enabled ? (
        <button
          type="button"
          onClick={activateNotifications}
          className="neo-button rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Activar notificaciones
        </button>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </article>
  );
}
