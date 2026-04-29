"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ScanRow = {
  id: string;
  bio_age: number | null;
  biomarkers: Record<string, number> | null;
  created_at: string;
};

type ProfileRow = {
  chronological_age: number | null;
  full_name: string | null;
};

type HabitLogRow = {
  date: string;
  completion_percentage: number | null;
};

const biomarkerColors: Record<string, string> = {
  piel: "#7F77DD",
  ojos: "#60A5FA",
  vitalidad: "#00E676",
  sonrisa: "#F59E0B",
  cabello: "#A78BFA",
  postura: "#22D3EE",
  hidratacion: "#38BDF8",
  tension: "#FF4444",
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

export default function ProgresoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLogRow[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [goalAge, setGoalAge] = useState("25");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleBiomarkers, setVisibleBiomarkers] = useState<Record<string, boolean>>({
    piel: true,
    ojos: false,
    vitalidad: true,
    sonrisa: false,
    cabello: false,
    postura: false,
    hidratacion: true,
    tension: true,
  });

  useEffect(() => {
    async function loadData() {
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

      const [
        { data: scanRows, error: scansError },
        { data: profileRow, error: profileError },
        { data: habitRows },
      ] =
        await Promise.all([
          supabase
            .from("scans")
            .select("id, bio_age, biomarkers, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("habit_logs")
            .select("date, completion_percentage")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(30),
        ]);

      if (scansError) {
        setError("No se pudo cargar tu progreso.");
      } else {
        setScans((scanRows ?? []) as ScanRow[]);
        if (profileError) {
          setProfile(null);
        } else {
          setProfile(
            profileRow
              ? ({
                  chronological_age:
                    typeof profileRow.chronological_age === "number"
                      ? profileRow.chronological_age
                      : null,
                  full_name:
                    (typeof profileRow.full_name === "string" && profileRow.full_name) ||
                    (typeof profileRow.name === "string" && profileRow.name) ||
                    null,
                } as ProfileRow)
              : null
          );
        }
        setHabitLogs((habitRows ?? []) as HabitLogRow[]);
      }
      setLoading(false);
    }
    void loadData();
  }, [supabase]);

  const scansWithBioAge = scans.filter((scan) => typeof scan.bio_age === "number");
  const latest = scansWithBioAge.at(-1);
  const first = scansWithBioAge[0];
  const bestBioAge =
    scansWithBioAge.length > 0 ? Math.min(...scansWithBioAge.map((scan) => scan.bio_age ?? 999)) : null;
  const streakDays = calculateStreak(scans);
  const totalScans = scans.length;
  const diffFirstLast =
    first && latest && typeof first.bio_age === "number" && typeof latest.bio_age === "number"
      ? latest.bio_age - first.bio_age
      : null;

  const scansLast30 = scansWithBioAge.filter((scan) => {
    if (!latest) return false;
    const days =
      (new Date(latest.created_at).getTime() - new Date(scan.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    return days <= 30;
  });
  const average30 =
    scansLast30.length > 0
      ? scansLast30.reduce((acc, item) => acc + (item.bio_age ?? 0), 0) / scansLast30.length
      : null;

  const trendData = scansWithBioAge.map((scan) => ({
    fecha: formatDate(scan.created_at),
    bioAge: scan.bio_age ?? 0,
    chronologicalAge: profile?.chronological_age ?? null,
  }));

  const trendIsGood =
    scansWithBioAge.length > 1 &&
    (latest?.bio_age ?? 0) <= (scansWithBioAge.at(-2)?.bio_age ?? Number.MAX_SAFE_INTEGER);
  const trendColor = scansWithBioAge.length <= 1 ? "#7F77DD" : trendIsGood ? "#00E676" : "#FF4444";

  const biomarkerTrendData = scans.map((scan) => {
    const b = scan.biomarkers ?? {};
    return {
      fecha: formatDate(scan.created_at),
      piel: b.piel ?? null,
      ojos: b.ojos ?? null,
      vitalidad: b.vitalidad ?? null,
      sonrisa: b.sonrisa ?? null,
      cabello: b.cabello ?? null,
      postura: b.postura ?? null,
      hidratacion: b.hidratacion ?? null,
      tension: b.tension ?? null,
    };
  });

  const currentAge = latest?.bio_age ?? null;
  const targetAge = Number(goalAge);
  const progressToGoal =
    currentAge && first?.bio_age
      ? Math.max(
          0,
          Math.min(100, ((first.bio_age - currentAge) / Math.max(1, first.bio_age - targetAge)) * 100)
        )
      : 0;
  const habitsBoost =
    habitLogs.length > 0
      ? habitLogs.reduce((acc, row) => acc + (row.completion_percentage ?? 0), 0) / habitLogs.length / 10
      : 0;
  const adjustedProgressToGoal = Math.min(100, progressToGoal + habitsBoost);

  const estimatedDate = useMemo(() => {
    if (
      !first?.bio_age ||
      !latest?.bio_age ||
      scansWithBioAge.length < 3 ||
      (currentAge ?? 0) <= (targetAge ?? 0)
    ) {
      return "Meta ya alcanzada o sin datos suficientes";
    }
    const totalDays =
      (new Date(latest.created_at).getTime() - new Date(first.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const slopePerDay = (first.bio_age - latest.bio_age) / Math.max(1, totalDays);
    if (slopePerDay <= 0.001) return "No estimable con tendencia actual";
    const daysNeeded = ((currentAge ?? 0) - (targetAge ?? 0)) / slopePerDay;
    const estimated = new Date(new Date(latest.created_at).getTime() + daysNeeded * 24 * 60 * 60 * 1000);
    return formatDate(estimated.toISOString());
  }, [first, latest, scansWithBioAge.length, currentAge, targetAge]);

  const selectedScan = scans.find((scan) => scan.id === selectedScanId) ?? null;

  const motivationalMessage = useMemo(() => {
    if (!latest?.bio_age) {
      return "Tu progreso empieza con tu siguiente escaneo. Estoy lista para acompañarte en cada paso.";
    }
    if ((diffFirstLast ?? 0) < 0) {
      return "Estás rejuveneciendo con consistencia. Lo que haces sí está cambiando tu biología.";
    }
    return "No te desanimes: cada ajuste cuenta. Vamos a recalibrar hábitos y volver a bajar tu BioAge.";
  }, [latest, diffFirstLast]);

  return (
    <div className="space-y-6">
      {loading ? <p className="text-sm text-white/70">Cargando progreso...</p> : null}
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {!loading && !error && scans.length === 0 ? (
        <article className="glass-card rounded-3xl border border-white/10 p-6">
          <p className="text-sm text-white/80">
            Aún no tienes escaneos. ¡Haz tu primer escaneo para ver tu progreso!
          </p>
        </article>
      ) : null}

      <article className="glass-card rounded-3xl border border-white/10 p-6">
        <h1 className="text-2xl font-semibold">Progreso BioAge</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-white/65">Racha activa</p>
            <p className="text-xl font-semibold">{streakDays} días</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-white/65">Total de escaneos</p>
            <p className="text-xl font-semibold">{totalScans}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-white/65">Mejor BioAge</p>
            <p className="text-xl font-semibold">{bestBioAge ?? "--"}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-white/65">Promedio últimos 30 días</p>
            <p className="text-xl font-semibold">{average30 ? average30.toFixed(1) : "--"}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xs text-white/65">Primer vs último</p>
            <p className="text-xl font-semibold">
              {diffFirstLast === null ? "--" : `${diffFirstLast > 0 ? "+" : ""}${diffFirstLast}`}
            </p>
          </div>
        </div>
      </article>

      <article className="glass-card rounded-3xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Tendencia de BioAge</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="fecha" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(127,119,221,0.4)",
                  borderRadius: "12px",
                }}
                formatter={(value) => [`${value ?? 0} años`, "BioAge"]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="bioAge"
                stroke={trendColor}
                strokeWidth={3}
                dot={{ r: 4 }}
                name="BioAge"
              />
              {profile?.chronological_age ? (
                <ReferenceLine
                  y={profile.chronological_age}
                  stroke="#7F77DD"
                  strokeDasharray="6 4"
                  label={{ value: "Edad cronológica", fill: "#c7c3ff", position: "insideTopRight" }}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass-card rounded-3xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Biomarcadores históricos</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.keys(biomarkerColors).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setVisibleBiomarkers((prev) => ({
                  ...prev,
                  [key]: !prev[key],
                }))
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                visibleBiomarkers[key]
                  ? "border-accent bg-accent/20 text-white"
                  : "border-white/20 bg-black/40 text-white/65"
              )}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={biomarkerTrendData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="fecha" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(127,119,221,0.4)",
                  borderRadius: "12px",
                }}
              />
              <Legend />
              {Object.entries(biomarkerColors).map(([key, color]) =>
                visibleBiomarkers[key] ? (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.12}
                    name={key}
                  />
                ) : null
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass-card rounded-3xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Meta de BioAge</h2>
        <div className="mt-4 flex flex-col gap-3 sm:max-w-xs">
          <input
            value={goalAge}
            onChange={(event) => setGoalAge(event.target.value)}
            className="neo-input rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
            placeholder="Quiero llegar a 25"
          />
          <div className="h-3 rounded-full bg-white/10">
            <div
              className="h-3 rounded-full bg-accent transition-all"
              style={{ width: `${adjustedProgressToGoal}%` }}
            />
          </div>
          <p className="text-sm text-white/75">
            Progreso hacia la meta: {adjustedProgressToGoal.toFixed(0)}%
          </p>
          <p className="text-xs text-white/60">
            Incluye consistencia de hábitos diarios de los últimos 30 días.
          </p>
          <p className="text-sm text-white/65">Fecha estimada para lograrla: {estimatedDate}</p>
        </div>
      </article>

      <article className="glass-card rounded-3xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">Historial de escaneos</h2>
        <div className="mt-4 space-y-3">
          {scansWithBioAge.length === 0 ? (
            <p className="text-sm text-white/70">Aún no tienes escaneos registrados.</p>
          ) : null}
          {scansWithBioAge
            .slice()
            .reverse()
            .map((scan, index, arr) => {
              const previous = arr[index + 1];
              const delta =
                previous && scan.bio_age !== null && previous.bio_age !== null
                  ? scan.bio_age - previous.bio_age
                  : null;
              return (
                <div
                  key={scan.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div>
                    <p className="text-sm text-white/70">{formatDate(scan.created_at)}</p>
                    <p className="text-lg font-semibold">{scan.bio_age} años</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {delta === null ? <Minus className="h-4 w-4 text-white/50" /> : null}
                    {delta !== null && delta < 0 ? <ArrowDownRight className="h-4 w-4 text-emerald-400" /> : null}
                    {delta !== null && delta > 0 ? <ArrowUpRight className="h-4 w-4 text-red-400" /> : null}
                    <button
                      type="button"
                      onClick={() => setSelectedScanId(scan.id)}
                      className="neo-button rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </article>

      {selectedScan ? (
        <article className="glass-card rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold">Detalle del escaneo</h2>
          <p className="mt-2 text-sm text-white/70">Fecha: {formatDate(selectedScan.created_at)}</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 p-3 text-xs text-white/80">
            {JSON.stringify(selectedScan.biomarkers ?? {}, null, 2)}
          </pre>
        </article>
      ) : null}

      <article className="glass-card rounded-3xl border border-accent/40 bg-accent/10 p-6">
        <h2 className="text-xl font-semibold">Mensaje motivacional de Alicia</h2>
        <p className="mt-3 text-white/90">{motivationalMessage}</p>
      </article>
    </div>
  );
}
