import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      player_id?: string;
      notifications_enabled?: boolean;
      timezone?: string;
    };
    if (!body.player_id) {
      return NextResponse.json({ error: "Falta player_id." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { error } = await supabase.from("notification_prefs").upsert(
      {
        user_id: user.id,
        onesignal_player_id: body.player_id,
        notifications_enabled: body.notifications_enabled ?? true,
        timezone: body.timezone ?? "America/Mexico_City",
      },
      { onConflict: "user_id" }
    );
    if (error) {
      return NextResponse.json(
        { error: "No se pudo guardar la suscripción de notificaciones." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al suscribirse." },
      { status: 500 }
    );
  }
}
