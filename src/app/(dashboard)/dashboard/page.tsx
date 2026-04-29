"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Plus, Sparkles } from "lucide-react";
import NotificationSetup from "@/components/NotificationSetup";

const protocoloHoy = [
  "Hidratate con 500 ml de agua al despertar",
  "10 minutos de respiracion consciente",
  "30 minutos de movimiento funcional",
  "Cena ligera 3 horas antes de dormir",
];

export default function DashboardPage() {
  const hasScans = false;
  const streakDays = 0;

  return (
    <div className="space-y-6">
      <NotificationSetup />
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
              {hasScans ? "31" : "--"}
            </motion.p>
            <span className="pb-2 text-sm text-white/60">años biológicos</span>
          </div>
          <p className="mt-4 text-sm text-white/70">
            {hasScans
              ? "Vas mejorando respecto al mes pasado. Sigue con tu protocolo."
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
              <p className="text-3xl font-semibold">{streakDays}</p>
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
          <h2 className="text-xl font-semibold">Historial de escaneos</h2>
          <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/30 p-8 text-center">
            <p className="text-sm text-white/75">
              Tu historial aún está vacío. Haz tu primer escaneo y empieza a medir tu
              transformación.
            </p>
          </div>
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
