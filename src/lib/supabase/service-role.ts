import { createClient } from "@supabase/supabase-js";

/**
 * Solo usar en el servidor (Server Actions / Route Handlers).
 * Insertar perfil tras signUp requiere bypass de RLS porque la sesión
 * aún no está en cookies cuando hay confirmación por email o el SSR
 * no ha persistido tokens en la misma petición.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
