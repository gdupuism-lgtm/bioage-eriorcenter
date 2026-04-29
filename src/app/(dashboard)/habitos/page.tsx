"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type HabitItem = {
  key: string;
  icon: string;
  label: string;
};

type HabitLogRow = {
  date: string;
  habits: Record<string, boolean> | null;
  completion_percentage: number | null;
};

const dailyHabits: HabitItem[] = [
  { key: "agua", icon: "💧", label: "Tomé mis 2.5L de agua hoy" },
  { key: "ejercicio", icon: "🏃", label: "Hice ejercicio (tipo y duración libre)" },
  { key: "sol", icon: "☀️", label: "Me expuse al sol 10-15 min" },
  { key: "sueno", icon: "😴", label: "Dormí 7-8 horas anoche" },
  { key: "audio", icon: "🎧", label: "Escuché mi audio ERIORCENTER" },
  { key: "meditacion", icon: "🧘", label: "Hice mi meditación" },
  { key: "respiracion", icon: "🫁", label: "Practiqué respiración consciente" },
  { key: "comida", icon: "🥗", label: "Comí saludable hoy" },
  { key: "suplementos", icon: "💊", label: "Tomé mis suplementos" },
  { key: "gratitudes", icon: "🙏", label: "Escribí mis 3 gratitudes" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function playDing() {
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.04;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function motivational(percent: number) {
  if (percent === 0) return "Hoy es un nuevo día. ¿Por dónde empezamos?";
  if (percent <= 30) return "Buen comienzo. Cada hábito cuenta.";
  if (percent <= 60) return "Vas a la mitad. Alicia está orgullosa de ti.";
  if (percent <= 90) return "¡Casi lo logras! Unos pasos más.";
  return "¡PERFECTO! Día completo. Tu BioAge lo agradece. 🔥";
}

function cellColor(completed: number) {
  if (completed <= 0) return "bg-white/10";
  if (completed <= 3) return "bg-emerald-900/70";
  if (completed <= 6) return "bg-emerald-600/70";
  return "bg-emerald-400";
}

export default function HabitosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [habitsState, setHabitsState] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<HabitLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const completedCount = dailyHabits.filter((habit) => habitsState[habit.key]).length;
  const completionPercentage = Math.round((completedCount / dailyHabits.length) * 100);

  useEffect(() => {
    async function loadHabits() {
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

      const { data: logs, error: logsError } = await supabase
        .from("habit_logs")
        .select("date, habits, completion_percentage")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (logsError) {
        setError("No se pudieron cargar tus hábitos.");
      } else {
        const list = (logs ?? []) as HabitLogRow[];
        setHistory(list);
        const today = list.find((item) => item.date === todayISO());
        if (today?.habits) {
          setHabitsState(today.habits);
        }
      }
      setLoading(false);
    }
    void loadHabits();
  }, [supabase]);

  async function persist(nextState: Record<string, boolean>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const completed = dailyHabits.filter((habit) => nextState[habit.key]).length;
    const percent = Math.round((completed / dailyHabits.length) * 100);

    await supabase.from("habit_logs").upsert(
      {
        user_id: user.id,
        date: todayISO(),
        habits: nextState,
        completion_percentage: percent,
      },
      { onConflict: "user_id,date" }
    );

    const { data: logs } = await supabase
      .from("habit_logs")
      .select("date, habits, completion_percentage")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);
    setHistory((logs ?? []) as HabitLogRow[]);
  }

  function toggleHabit(key: string) {
    setHabitsState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) {
        playDing();
      }
      void persist(next);
      return next;
    });
  }

  const streak = useMemo(() => {
    const sorted = history
      .filter((row) => (row.completion_percentage ?? 0) >= 50)
      .map((row) => row.date)
      .sort((a, b) => (a < b ? 1 : -1));
    if (sorted.length === 0) return 0;
    let s = 1;
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) s += 1;
      else break;
    }
    return s;
  }, [history]);

  const last30Days = useMemo(() => {
    const map = new Map(history.map((h) => [h.date, h]));
    return Array.from({ length: 30 }, (_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - idx));
      const key = date.toISOString().slice(0, 10);
      const row = map.get(key);
      const completed = row?.habits
        ? Object.values(row.habits).filter(Boolean).length
        : 0;
      return { key, completed };
    });
  }, [history]);

  return (
    <div className="space-y-6">
      {loading ? <p className="text-sm text-white/70">Cargando hábitos...</p> : null}
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <article className="glass-card rounded-3xl border border-white/10 p-6">
        <h1 className="text-2xl font-semibold">Check-in diario</h1>
        <div className="mt-4 h-3 rounded-full bg-white/10">
          <motion.div
            className="h-3 rounded-full bg-accent"
            initial={false}
            animate={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-white/80">{motivational(completionPercentage)}</p>
        <p className="text-xs text-white/60">Racha actual (&gt;=5 hábitos): {streak} días</p>
        <AnimatePresence>
          {completionPercentage === 100 ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/20 px-3 py-1 text-sm text-accent"
            >
              <Sparkles className="h-4 w-4" />
              ¡Día perfecto!
            </motion.p>
          ) : null}
        </AnimatePresence>
      </article>

      <div className="grid gap-3 md:grid-cols-2">
        {dailyHabits.map((habit) => {
          const checked = Boolean(habitsState[habit.key]);
          return (
            <button
              key={habit.key}
              type="button"
              onClick={() => toggleHabit(habit.key)}
              className={cn(
                "glass-card relative rounded-2xl border p-4 text-left transition",
                checked
                  ? "border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-accent/20"
                  : "border-white/10 bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{habit.icon}</div>
                <p className="text-sm font-medium">{habit.label}</p>
              </div>
              {checked ? (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-3 right-3 rounded-full bg-emerald-400 p-1 text-black"
                >
                  <Check className="h-4 w-4" />
                </motion.div>
              ) : null}
            </button>
          );
        })}
      </div>

      <article className="glass-card rounded-3xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Historial de hábitos (30 días)</h2>
        <div className="mt-4 grid grid-cols-10 gap-2 sm:grid-cols-15">
          {last30Days.map((day) => (
            <div
              key={day.key}
              title={`${day.key}: ${day.completed} hábitos`}
              className={cn("h-5 rounded-md", cellColor(day.completed))}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-white/60">
          Verde oscuro = 1-3, verde medio = 4-6, verde brillante = 7-10
        </p>
      </article>

      {streak >= 7 ? (
        <article className="glass-card rounded-3xl border border-accent/40 bg-accent/10 p-6">
          <h2 className="text-xl font-semibold">Mensaje especial de Alicia</h2>
          <p className="mt-2 text-sm text-white/90">
            Completaste 5+ hábitos por 7 días consecutivos. ¡Es un gran momento para hacer un nuevo
            escaneo y medir tu evolución real!
          </p>
        </article>
      ) : null}
    </div>
  );
}
