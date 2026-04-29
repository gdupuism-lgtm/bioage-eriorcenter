"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { signIn, signInWithGoogle } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  async function onGoogleLogin() {
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
      <h1 className="text-3xl font-semibold">Inicia sesión</h1>
      <p className="mt-2 text-sm text-white/70">
        Accede a tu panel BioAge y continúa tu transformación.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-accent"
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
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-white/35 focus:border-accent"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || isGooglePending}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={isPending || isGooglePending}
        className="mt-3 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGooglePending ? "Conectando..." : "Continuar con Google"}
      </button>

      <p className="mt-6 text-center text-sm text-white/70">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-accent hover:text-accent/80">
          Regístrate aquí
        </Link>
      </p>
    </section>
  );
}
