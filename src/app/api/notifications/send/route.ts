import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scheduleNotification, sendNotification } from "@/lib/onesignal";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      user_id?: string;
      title?: string;
      message?: string;
      url?: string;
      send_after?: string;
    };
    if (!body.user_id || !body.title || !body.message) {
      return NextResponse.json(
        { error: "Faltan user_id, title o message." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: prefs } = await supabase
      .from("notification_prefs")
      .select("onesignal_player_id, notifications_enabled")
      .eq("user_id", body.user_id)
      .maybeSingle();

    if (!prefs?.onesignal_player_id || prefs.notifications_enabled === false) {
      return NextResponse.json(
        { error: "Usuario sin player_id de OneSignal o notificaciones desactivadas." },
        { status: 400 }
      );
    }

    if (body.send_after) {
      await scheduleNotification(
        prefs.onesignal_player_id,
        body.title,
        body.message,
        body.send_after
      );
    } else {
      await sendNotification(
        prefs.onesignal_player_id,
        body.title,
        body.message,
        body.url
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al enviar notificación." },
      { status: 500 }
    );
  }
}
