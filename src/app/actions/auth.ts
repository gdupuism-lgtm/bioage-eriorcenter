"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function formatPostgresProfileError(
  err: PostgrestError,
  context: { usedServiceRole: boolean }
) {
  const parts = [
    err.message,
    err.code ? `code=${err.code}` : null,
    err.details ? `details=${err.details}` : null,
    err.hint ? `hint=${err.hint}` : null,
    `client=${context.usedServiceRole ? "service_role" : "anon_cookie_session"}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

type AuthResult = {
  error: string | null;
  success: boolean;
  url?: string;
};

type RegisterProfileInput = {
  chronologicalAge: number;
  gender: "hombre" | "mujer" | "prefiero_no_decir";
  primaryGoal: "apariencia" | "energia" | "longevidad" | "consciencia" | "todo";
  stressLevel: number;
};

function mapAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("already registered")) {
    return "Este correo ya está registrado. Prueba iniciar sesión.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirma tu correo electrónico para continuar.";
  }

  return "Ocurrio un error de autenticacion. Intentalo de nuevo.";
}

async function getBaseUrlFromHeaders() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  profile: RegisterProfileInput
): Promise<AuthResult> {
  const supabase = await createClient();
  const baseUrl = await getBaseUrlFromHeaders();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        primary_goal: profile.primaryGoal,
      },
      emailRedirectTo: `${baseUrl}/api/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  if (data.user) {
    const age = Number(profile.chronologicalAge);
    const stress = Number(profile.stressLevel);
    if (!Number.isFinite(age) || !Number.isFinite(stress)) {
      return { success: false, error: "Edad o nivel de estrés no válidos." };
    }

    const row = {
      id: data.user.id,
      full_name: name,
      name,
      chronological_age: Math.round(age),
      gender: profile.gender,
      primary_goal: profile.primaryGoal,
      stress_level: Math.round(stress),
      updated_at: new Date().toISOString(),
    };

    const admin = createServiceRoleClient();
    const usedServiceRole = Boolean(admin);
    const target = admin ?? supabase;
    const { error: profileError } = await target.from("profiles").upsert(row, { onConflict: "id" });

    if (profileError) {
      const diagnostic = formatPostgresProfileError(profileError, { usedServiceRole });
      console.error("[signUp] profiles upsert failed — Supabase PostgREST error:", {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
        usedServiceRole,
        row,
      });
      return {
        success: false,
        error: `No se pudo guardar tu perfil inicial. Supabase: ${diagnostic}`,
      };
    }
  }

  return { success: true, error: null };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  return { success: true, error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = await createClient();
  const baseUrl = await getBaseUrlFromHeaders();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseUrl}/api/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data.url) {
    return {
      success: false,
      error: "No se pudo continuar con Google. Intentalo de nuevo.",
    };
  }

  return { success: true, error: null, url: data.url };
}
