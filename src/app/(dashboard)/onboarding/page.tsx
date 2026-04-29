"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type OnboardingData = {
  full_name: string;
  chronological_age: string;
  gender: string;
  timezone: string;
  sleep_hours: string;
  diet_type: string;
  stress_level: string;
  exercise_days: string;
  goals: string[];
  onboarding_completed: boolean;
};

const totalSteps = 4;
const goalOptions = ["energia", "apariencia", "longevidad", "consciencia", "todos"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OnboardingData>({
    full_name: "",
    chronological_age: "",
    gender: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City",
    sleep_hours: "7",
    diet_type: "",
    stress_level: "5",
    exercise_days: "3",
    goals: [],
    onboarding_completed: false,
  });

  const progress = (step / totalSteps) * 100;

  function toggleGoal(goal: string) {
    if (goal === "todos") {
      setForm((prev) => ({
        ...prev,
        goals: prev.goals.includes("todos") ? [] : ["todos"],
      }));
      return;
    }

    setForm((prev) => {
      const withoutTodos = prev.goals.filter((item) => item !== "todos");
      const exists = withoutTodos.includes(goal);
      return {
        ...prev,
        goals: exists ? withoutTodos.filter((item) => item !== goal) : [...withoutTodos, goal],
      };
    });
  }

  function validateCurrentStep() {
    if (step === 1) {
      if (!form.full_name || !form.chronological_age || !form.gender || !form.timezone) {
        return "Completa todos los campos del paso 1.";
      }
    }

    if (step === 2) {
      if (!form.sleep_hours || !form.diet_type || !form.stress_level || !form.exercise_days) {
        return "Completa todos los campos del paso 2.";
      }
    }

    if (step === 3 && form.goals.length === 0) {
      return "Selecciona al menos un objetivo.";
    }

    return null;
  }

  async function onNext() {
    setError(null);
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  }

  async function onFinish() {
    setError(null);
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Tu sesión expiró. Inicia sesión de nuevo.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const payload = {
      id: user.id,
      full_name: form.full_name,
      chronological_age: Number(form.chronological_age),
      gender: form.gender,
      timezone: form.timezone,
      sleep_hours: Number(form.sleep_hours),
      diet_type: form.diet_type,
      stress_level: Number(form.stress_level),
      exercise_days: Number(form.exercise_days),
      goals: form.goals,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });

    setLoading(false);

    if (upsertError) {
      setError("No pudimos guardar tu onboarding. Intentalo de nuevo.");
      return;
    }

    router.push("/scan");
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/70">
          <span>Paso {step} de 4</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <motion.div
            className="h-2 rounded-full bg-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Tu perfil base</h1>
              <p className="text-sm text-white/70">
                Empecemos con tus datos esenciales para calcular tu BioAge.
              </p>
              <input
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                placeholder="Nombre completo"
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={10}
                  max={120}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                  placeholder="Edad cronológica"
                  value={form.chronological_age}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, chronological_age: e.target.value }))
                  }
                />
                <select
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="">Género</option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="no_binario">No binario</option>
                  <option value="prefiero_no_decir">Prefiero no decir</option>
                </select>
              </div>
              <input
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                placeholder="Zona horaria"
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Tu estilo de vida</h2>
              <p className="text-sm text-white/70">
                Estos hábitos impactan directamente en tu envejecimiento biológico.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={3}
                  max={12}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                  placeholder="Horas de sueño"
                  value={form.sleep_hours}
                  onChange={(e) => setForm((prev) => ({ ...prev, sleep_hours: e.target.value }))}
                />
                <select
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                  value={form.diet_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, diet_type: e.target.value }))}
                >
                  <option value="">Tipo de dieta</option>
                  <option value="balanceada">Balanceada</option>
                  <option value="vegetariana">Vegetariana</option>
                  <option value="vegana">Vegana</option>
                  <option value="keto">Keto</option>
                  <option value="libre">Sin plan definido</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                  placeholder="Nivel de estrés (1-10)"
                  value={form.stress_level}
                  onChange={(e) => setForm((prev) => ({ ...prev, stress_level: e.target.value }))}
                />
                <input
                  type="number"
                  min={0}
                  max={7}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                  placeholder="Días de ejercicio por semana"
                  value={form.exercise_days}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, exercise_days: e.target.value }))
                  }
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Tus objetivos</h2>
              <p className="text-sm text-white/70">
                Elige los focos que quieres potenciar desde hoy.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {goalOptions.map((goal) => {
                  const isActive = form.goals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                        isActive
                          ? "border-accent/70 bg-accent/20 text-white"
                          : "border-white/15 bg-black/40 text-white/75 hover:border-accent/40"
                      )}
                    >
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-accent">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-semibold">Todo listo, {form.full_name || "vamos"}!</h2>
              <p className="mx-auto max-w-md text-sm text-white/70">
                Ya tenemos tu perfil inicial. Ahora toca hacer tu primer escaneo para obtener
                tu BioAge y activar recomendaciones personalizadas.
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {error ? (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          disabled={step === 1 || loading}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-40"
        >
          Atrás
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinish}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Hacer mi primer escaneo"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
