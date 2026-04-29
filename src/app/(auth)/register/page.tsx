"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { signInWithGoogle, signUp } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chronologicalAge, setChronologicalAge] = useState("30");
  const [gender, setGender] = useState<"hombre" | "mujer" | "prefiero_no_decir">("prefiero_no_decir");
  const [primaryGoal, setPrimaryGoal] = useState<
    "apariencia" | "energia" | "longevidad" | "consciencia" | "todo"
  >("todo");
  const [stressLevel, setStressLevel] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (step === 1) {
      setStep(2);
      return;
    }

    startTransition(async () => {
      const result = await signUp(email, password, name, {
        chronologicalAge: Number(chronologicalAge),
        gender,
        primaryGoal,
        stressLevel: Number(stressLevel),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/onboarding");
      router.refresh();
    });
  }

  async function onGoogleRegister() {
    setError(null);
    startGoogleTransition(async () => {
      const result = await signInWithGoogle();
      if (result.error || !result.url) {
        setError(result.error ?? "No se pudo continuar con Google. Intentalo de nuevo.");
        return;
      }
      router.push(result.url);
    });
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <h1 className="text-3xl font-semibold">Crea tu cuenta</h1>
      <p className="mt-2 text-sm text-white/70">Paso {step} de 2</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {step === 1 ? (
          <>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/80">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-accent"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-accent"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-accent"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Edad cronológica</label>
              <input
                type="number"
                min={10}
                max={100}
                value={chronologicalAge}
                onChange={(event) => setChronologicalAge(event.target.value)}
                required
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Género</label>
              <select
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as "hombre" | "mujer" | "prefiero_no_decir")
                }
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Objetivo principal</label>
              <select
                value={primaryGoal}
                onChange={(event) =>
                  setPrimaryGoal(
                    event.target.value as
                      | "apariencia"
                      | "energia"
                      | "longevidad"
                      | "consciencia"
                      | "todo"
                  )
                }
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="apariencia">Apariencia</option>
                <option value="energia">Energía</option>
                <option value="longevidad">Longevidad</option>
                <option value="consciencia">Consciencia</option>
                <option value="todo">Todo</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Nivel de estrés actual (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={stressLevel}
                onChange={(event) => setStressLevel(event.target.value)}
                required
                className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
          </>
        )}

        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || isGooglePending}
          className="neo-button w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando cuenta..." : step === 1 ? "Continuar" : "Crear cuenta"}
        </button>
        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Volver al paso 1
          </button>
        ) : null}
      </form>

      <button
        type="button"
        onClick={onGoogleRegister}
        disabled={isPending || isGooglePending}
        className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGooglePending ? "Conectando..." : "Continuar con Google"}
      </button>

      <p className="mt-6 text-center text-sm text-white/70">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-accent hover:text-accent/80">
          Inicia sesión
        </Link>
      </p>
    </section>
  );
}
