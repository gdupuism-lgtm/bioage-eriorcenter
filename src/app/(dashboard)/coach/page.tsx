"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircleHeart, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type CoachPayload = {
  profile: {
    fullName: string;
    chronologicalAge: number | null;
    primaryGoal: string | null;
    stressLevel: number | null;
  };
  latestScan: {
    bioAge: number | null;
    biomarkers: Record<string, number> | null;
    recommendations: unknown[] | null;
  } | null;
  history: ChatMessage[];
};

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("Usuario");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => (fullName[0] ?? "G").toUpperCase(), [fullName]);

  useEffect(() => {
    async function loadCoach() {
      try {
        const response = await fetch("/api/coach");
        const payload = (await response.json()) as CoachPayload & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "No se pudo cargar el chat.");
        setMessages(payload.history);
        setFullName(payload.profile.fullName || "Usuario");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }
    void loadCoach();
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value || sending) return;

    const optimisticMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: value,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
      });
      const payload = (await response.json()) as {
        assistantMessage?: ChatMessage;
        error?: string;
      };

      if (!response.ok || !payload.assistantMessage) {
        throw new Error(payload.error ?? "No se pudo obtener respuesta de Alicia.");
      }

      setMessages((prev) => [...prev, payload.assistantMessage as ChatMessage]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Error inesperado.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <article className="glass-card rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircleHeart className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-semibold">Alicia Virtual</h1>
        </div>

        <div className="max-h-[62vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4">
          {loading ? <p className="text-sm text-white/70">Cargando conversación...</p> : null}

          {messages.map((message) => {
            const isAssistant = message.role === "assistant";
            return (
              <div
                key={message.id}
                className={cn("flex items-end gap-2", isAssistant ? "justify-start" : "justify-end")}
              >
                {isAssistant ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    A
                  </div>
                ) : null}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    isAssistant ? "bg-accent/20 text-white" : "bg-white/10 text-white"
                  )}
                >
                  {message.content}
                </div>
                {!isAssistant ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                    {userInitial}
                  </div>
                ) : null}
              </div>
            );
          })}

          {sending ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                A
              </div>
              <div className="rounded-2xl bg-accent/20 px-3 py-2 text-sm text-white/85">
                Alicia está escribiendo...
              </div>
            </div>
          ) : null}

          <div ref={listEndRef} />
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu mensaje para Alicia..."
            className="neo-input w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="neo-button inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </article>

      <a
        href="https://wa.me/5214432311761"
        target="_blank"
        rel="noreferrer"
        className="neo-button inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
      >
        Hablar con Alicia por WhatsApp
      </a>
    </div>
  );
}
