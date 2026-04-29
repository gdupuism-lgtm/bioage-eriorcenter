import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const aliciaCoachSystemPrompt =
  "Eres Alicia, coach de vida, mentora espiritual y especialista en longevidad de ERIORCENTER. Conoces profundamente al usuario: su nombre, edad, BioAge, biomarcadores y objetivos. Eres empática, directa, poética pero práctica. Nunca eres genérica — siempre personalizas cada respuesta. Puedes recomendar audios ERIORCENTER cuando sea relevante pero sin ser insistente. Hablas en español, tuteas al usuario. Eres como la amiga más sabia que alguien podría tener.";

type ChatRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function buildWelcomeMessage(name: string, bioAge: number | null) {
  if (bioAge) {
    return `Hola ${name}, soy Alicia. Ya revisé tu último escaneo y vi que tu BioAge estimada es ${bioAge}. Estoy aquí para ayudarte a transformar eso en acciones simples y poderosas, paso a paso.`;
  }
  return `Hola ${name}, soy Alicia. Estoy feliz de acompañarte en este proceso. Cuando hagas tu primer escaneo, te ayudaré a convertir tus resultados en un plan claro y realista.`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const [{ data: profile }, { data: latestScan }, { data: history }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, chronological_age, primary_goal, stress_level")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("bio_age, biomarkers, recomendaciones, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("chat_history")
        .select("id, role, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    let chatHistory = (history ?? []) as ChatRow[];
    if (chatHistory.length === 0) {
      const welcome = buildWelcomeMessage(profile?.full_name ?? "hola", latestScan?.bio_age ?? null);
      const { data: inserted } = await supabase
        .from("chat_history")
        .insert({
          user_id: user.id,
          role: "assistant",
          content: welcome,
        })
        .select("id, role, content, created_at")
        .single();

      if (inserted) {
        chatHistory = [inserted as ChatRow];
      }
    }

    return NextResponse.json({
      profile: {
        fullName: profile?.full_name ?? "Usuario",
        chronologicalAge: profile?.chronological_age ?? null,
        primaryGoal: profile?.primary_goal ?? null,
        stressLevel: profile?.stress_level ?? null,
      },
      latestScan: latestScan
        ? {
            bioAge: latestScan.bio_age,
            biomarkers: latestScan.biomarkers,
            recommendations: latestScan.recomendaciones,
          }
        : null,
      history: chatHistory,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar Alicia." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const userMessage = body.message?.trim();
    if (!userMessage) {
      return NextResponse.json({ error: "El mensaje está vacío." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const [{ data: profile }, { data: latestScan }, { data: history }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, chronological_age, primary_goal, stress_level")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("scans")
        .select("bio_age, biomarkers, recomendaciones, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("chat_history")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

    await supabase.from("chat_history").insert({
      user_id: user.id,
      role: "user",
      content: userMessage,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const contextBlock = `
Contexto del usuario:
- Nombre: ${profile?.full_name ?? "No disponible"}
- Edad: ${profile?.chronological_age ?? "No disponible"}
- Objetivo: ${profile?.primary_goal ?? "No disponible"}
- Estrés actual: ${profile?.stress_level ?? "No disponible"}
- Último BioAge: ${latestScan?.bio_age ?? "Sin escaneo"}
- Biomarcadores: ${latestScan?.biomarkers ? JSON.stringify(latestScan.biomarkers) : "Sin datos"}
- Recomendaciones previas: ${latestScan?.recomendaciones ? JSON.stringify(latestScan.recomendaciones) : "Sin datos"}
`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: aliciaCoachSystemPrompt,
      messages: [
        {
          role: "user",
          content: `${contextBlock}\n\nHistorial previo:\n${(history ?? [])
            .map((item) => `${item.role}: ${item.content}`)
            .join("\n")}\n\nMensaje actual del usuario: ${userMessage}`,
        },
      ],
    });

    const assistantMessage = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const { data: savedAssistant } = await supabase
      .from("chat_history")
      .insert({
        user_id: user.id,
        role: "assistant",
        content: assistantMessage,
      })
      .select("id, role, content, created_at")
      .single();

    return NextResponse.json({
      assistantMessage: savedAssistant ?? {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantMessage,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo responder el chat." },
      { status: 500 }
    );
  }
}
