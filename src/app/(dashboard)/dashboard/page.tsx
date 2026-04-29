"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Plus, Sparkles } from "lucide-react";
import NotificationSetup from "@/components/NotificationSetup";
import { createClient } from "@/lib/supabase/client";

type ScanRow = {
  id: string;
  bio_age: number | null;
  biomarkers: Record<string, number> | null;
  created_at: string;
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function calculateStreak(scans: ScanRow[]) {
  const uniqueDays = Array.from(
    new Set(scans.map((scan) => new Date(scan.created_at).toISOString().slice(0, 10)))
  ).sort((a, b) => (a < b ? 1 : -1));

  if (uniqueDays.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

const protocoloHoy = [
  "Hidratate con 500 ml de agua al despertar",
  "10 minutos de respiracion consciente",
  "30 minutos de movimiento funcional",
  "Cena ligera 3 horas antes de dormir",
];

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScans() {
      setLoading(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sesión no válida.");
        setLoading(false);
        return;
      }

      const { data: scanRows, error: scansError } = await supabase
        .from("scans")
        .select("id, bio_age, biomarkers, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (scansError) {
        setError("No se pudieron cargar tus escaneos.");
        setScans([]);
      } else {
        setScans((scanRows ?? []) as ScanRow[]);
      }
      setLoading(false);
    }
    void loadScans();
  }, [supabase]);

  const scansWithBioAge = scans.filter((scan) => typeof scan.bio_age === "number");
  const latestBioAge = scansWithBioAge.at(-1)?.bio_age ?? null;
  const hasScans = scansWithBioAge.length > 0;
  const streakDays = calculateStreak(scans);
  const historialDesc = [...scansWithBioAge].reverse();

  return (
    <div className="space-y-6">
      <NotificationSetup />
      {loading ? <p className="text-sm text-white/70">Cargando tu panel...</p> : null}
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card xl:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <p className="text-sm font-medium text-white/75">Tu BioAge</p>
          <div className="mt-3 flex items-end gap-3">
            <motion.p
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-6xl font-semibold tracking-tight"
            >
              {!loading && hasScans && latestBioAge !== null ? Math.round(latestBioAge) : "--"}
            </motion.p>
            <span className="pb-2 text-sm text-white/60">años biológicos</span>
          </div>
          <p className="mt-4 text-sm text-white/70">
            {loading
              ? "Cargando tu último resultado…"
              : hasScans
                ? "Tu último escaneo está reflejado arriba. Sigue con tu protocolo."
                : "Aún no tienes escaneos. Tu primer resultado aparecerá aquí."}
          </p>

          <Link
            href="/scan"
            className="neo-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/50 bg-accent/20 px-5 py-4 text-sm font-semibold text-white shadow-[0_0_32px_rgba(127,119,221,0.35)] transition hover:bg-accent/30 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo Escaneo
          </Link>
        </motion.article>

        <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-white/75">Racha activa</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="rounded-xl bg-accent/20 p-2 text-accent">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-semibold">{loading ? "--" : streakDays}</p>
              <p className="text-sm text-white/65">dias activos</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-white/70">
            Tu consistencia construye longevidad. Hoy puede ser tu dia 1.
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="glass-card xl:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Historial de escaneos</h2>
            {hasScans ? (
              <Link href="/progreso" className="text-sm font-medium text-accent hover:underline">
                Ver progreso completo
              </Link>
            ) : null}
          </div>
          {!loading && historialDesc.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/30 p-8 text-center">
              <p className="text-sm text-white/75">
                Tu historial aún está vacío. Haz tu primer escaneo y empieza a medir tu transformación.
              </p>
            </div>
          ) : null}
          {!loading && historialDesc.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {historialDesc.map((scan) => (
                <li
                  key={scan.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                >
                  <span className="text-sm text-white/70">{formatDate(scan.created_at)}</span>
                  <span className="text-sm font-semibold text-white">
                    {typeof scan.bio_age === "number" ? `${Math.round(scan.bio_age)} años` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-lg font-semibold">Protocolo de hoy</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {protocoloHoy.map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
