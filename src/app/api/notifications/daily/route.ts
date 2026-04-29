import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/onesignal";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.floor(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: prefsRows } = await supabase
      .from("notification_prefs")
      .select("user_id, onesignal_player_id, notifications_enabled")
      .eq("notifications_enabled", true)
      .not("onesignal_player_id", "is", null);

    const prefs = prefsRows ?? [];
    const today = todayISO();

    for (const pref of prefs) {
      const [{ data: profile }, { data: latestScan }, { data: todayHabit }, { data: habitsRecent }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("name, full_name")
            .eq("id", pref.user_id)
            .maybeSingle(),
          supabase
            .from("scans")
            .select("created_at")
            .eq("user_id", pref.user_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("habit_logs")
            .select("completion_percentage")
            .eq("user_id", pref.user_id)
            .eq("date", today)
            .maybeSingle(),
          supabase
            .from("habit_logs")
            .select("date")
            .eq("user_id", pref.user_id)
            .order("date", { ascending: false })
            .limit(3),
        ]);

      const name =
        (typeof profile?.full_name === "string" && profile.full_name) ||
        (typeof profile?.name === "string" && profile.name) ||
        "Tu energía";

      const completion = todayHabit?.completion_percentage ?? 0;
      const lastScanDays = latestScan?.created_at
        ? daysBetween(latestScan.created_at, new Date().toISOString())
        : 999;
      const recentHabitDays = (habitsRecent ?? []).length;

      let title = "✨ Alicia tiene un mensaje para ti hoy. Entra y léelo.";
      let message = "Tu proceso importa. Hoy puedes dar un paso pequeño pero poderoso.";

      if (completion >= 100) {
        title = `🏆 ${name} completó todos sus hábitos hoy. ¡Tu BioAge lo nota!`;
        message = "Sostén este nivel y verás cambios cada semana.";
      } else if (!todayHabit || completion < 10) {
        title = `⚡ ${name}, tu check-in de hoy está pendiente. 5 minutos pueden cambiar tu BioAge.`;
        message = "Marca tus hábitos del día y mantiene tu consistencia.";
      } else if (recentHabitDays >= 2 && completion < 20) {
        title = "🔥 Tu racha está en riesgo. No pierdas lo que has construido.";
        message = "Un pequeño check-in hoy puede salvar tu racha.";
      } else if (lastScanDays >= 7) {
        title = "🔮 Han pasado 7 días. ¿Cómo está tu BioAge hoy?";
        message = "Haz un nuevo escaneo y mide tu evolución real.";
      }

      if (pref.onesignal_player_id) {
        await sendNotification(pref.onesignal_player_id, title, message, "/dashboard");
      }
    }

    return NextResponse.json({ ok: true, processed: prefs.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en notificaciones diarias." },
      { status: 500 }
    );
  }
}
