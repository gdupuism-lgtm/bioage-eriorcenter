"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Completa tu escaneo inicial",
    description:
      "Responde un cuestionario guiado sobre hábitos, energía, sueño y bienestar integral.",
    icon: Brain,
  },
  {
    title: "IA analiza tu perfil biológico",
    description:
      "Nuestro motor estima tu edad biológica real y detecta factores de aceleración o rejuvenecimiento.",
    icon: Sparkles,
  },
  {
    title: "Recibe tu plan consciente",
    description:
      "Obtienes protocolos personalizados con nutrición, movimiento, gestión emocional y enfoque mental.",
    icon: HeartPulse,
  },
  {
    title: "Evoluciona cada semana",
    description:
      "Mide progreso con reportes inteligentes y recomendaciones dinámicas para sostener resultados.",
    icon: Zap,
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "para siempre",
    description: "Ideal para comenzar tu diagnostico inicial.",
    features: ["1 escaneo mensual", "Resumen de edad biológica", "Recomendaciones base"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$349 MXN",
    period: "al mes",
    description: "Transformación constante con seguimiento inteligente.",
    features: [
      "Escaneos ilimitados",
      "Plan personalizado con IA",
      "Tracking semanal y recordatorios",
      "Soporte prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Anual",
    price: "$2,990 MXN",
    period: "al año",
    description: "Compromiso total para una nueva versión de ti.",
    features: [
      "Todo en Pro",
      "2 meses de ahorro",
      "Mentorias grupales ERIORCENTER",
      "Acceso anticipado a nuevas funciones",
    ],
    highlighted: false,
  },
];

const testimonials = [
  {
    quote: "En 8 semanas bajé mi edad biológica y recuperé energía para mi negocio y mi familia.",
    name: "Valeria M.",
    location: "Ciudad de Mexico, Mexico",
  },
  {
    quote: "BioAge me ayudó a convertir hábitos sueltos en una estrategia clara de longevidad.",
    name: "Santiago R.",
    location: "Bogota, Colombia",
  },
  {
    quote:
      "La experiencia se siente premium, humana y basada en datos. Es justo lo que buscaba.",
    name: "Camila A.",
    location: "Lima, Peru",
  },
];

const faqs = [
  {
    question: "¿Qué es la edad biológica y por qué importa?",
    answer:
      "Es una estimación de cómo está envejeciendo tu cuerpo según tus hábitos y señales de bienestar, más allá de tu edad cronológica.",
  },
  {
    question: "¿Necesito estudios de laboratorio para iniciar?",
    answer:
      "No. Puedes comenzar solo con tu evaluación digital. Después puedes integrar datos adicionales para mayor precisión.",
  },
  {
    question: "¿La plataforma reemplaza atención médica?",
    answer:
      "No. BioAge es una herramienta de prevención y acompañamiento. No sustituye diagnóstico ni tratamiento médico profesional.",
  },
  {
    question: "¿En qué países de LATAM funciona?",
    answer:
      "Actualmente damos soporte digital para toda Latinoamérica con contenido en español y enfoque cultural regional.",
  },
  {
    question: "¿Cuánto tiempo toma ver resultados?",
    answer:
      "Muchos usuarios perciben cambios en energía y enfoque en 2 a 4 semanas, dependiendo de adherencia y contexto personal.",
  },
  {
    question: "¿Puedo cancelar mi plan cuando quiera?",
    answer:
      "Sí, puedes cancelar desde tu perfil en cualquier momento. No hay contratos forzosos en el plan mensual.",
  },
  {
    question: "¿Cómo protegen mis datos?",
    answer:
      "Usamos infraestructura segura y buenas prácticas de privacidad. Tu información se procesa con controles de acceso estrictos.",
  },
  {
    question: "¿El plan anual incluye beneficios extra?",
    answer:
      "Sí, incluye ahorro frente al mensual y acceso a experiencias exclusivas de la comunidad ERIORCENTER.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(127,119,221,0.28),transparent_45%)]" />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 md:pb-24 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-semibold tracking-wide text-accent">
            <ShieldCheck className="h-4 w-4" />
            Plataforma de transformación consciente para LATAM
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl md:text-6xl">
            Descubre tu Edad Biológica Real
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
            BioAge by ERIORCENTER combina IA, ciencia del bienestar y acción diaria
            para ayudarte a rejuvenecer desde adentro.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              Iniciar Escaneo Gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver demo de la plataforma
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-semibold sm:text-4xl">Cómo funciona</h2>
          <p className="mt-3 max-w-2xl text-white/70">
            Un sistema guiado en 4 pasos para transformar datos personales en
            decisiones conscientes.
          </p>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1, duration: 0.45 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/20 p-2 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.2em] text-accent">
                    PASO {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-white/70">{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold sm:text-4xl">Planes para evolucionar</h2>
        <p className="mt-3 text-white/70">
          Comienza gratis y escala tu transformación a tu ritmo.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className={cn(
                "rounded-2xl border p-6 backdrop-blur-lg",
                plan.highlighted
                  ? "border-accent/70 bg-accent/15 shadow-[0_0_40px_rgba(127,119,221,0.28)]"
                  : "border-white/10 bg-white/5"
              )}
            >
              <p className="text-sm font-semibold text-accent">{plan.name}</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-3xl font-semibold">{plan.price}</p>
                <p className="pb-1 text-sm text-white/65">{plan.period}</p>
              </div>
              <p className="mt-3 text-sm text-white/75">{plan.description}</p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/85">
                    <Check className="mt-0.5 h-4 w-4 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={cn(
                  "mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  plan.highlighted
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                Elegir plan {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold sm:text-4xl">Voces de nuestra comunidad</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.blockquote
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg"
            >
              <p className="text-sm leading-relaxed text-white/85">&quot;{item.quote}&quot;</p>
              <footer className="mt-4">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-white/65">{item.location}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold sm:text-4xl">Preguntas frecuentes</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.question} className="rounded-xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold sm:text-base">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-accent transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm text-white/75">{faq.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold">BioAge by ERIORCENTER</p>
            <p className="mt-1 text-sm text-white/65">
              Transformación consciente con IA para una vida más larga y plena.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-white/75">
            <a href="#" className="transition hover:text-accent">
              Programa ERIORCENTER
            </a>
            <a href="#" className="transition hover:text-accent">
              Blog de Longevidad
            </a>
            <a href="#" className="transition hover:text-accent">
              Comunidad LATAM
            </a>
            <a href="#" className="transition hover:text-accent">
              Contacto
            </a>
            <a href="#" className="transition hover:text-accent">
              Política de Privacidad
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
