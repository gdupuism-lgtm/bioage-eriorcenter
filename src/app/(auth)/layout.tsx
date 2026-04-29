import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(127,119,221,0.28),transparent_45%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-wide text-accent">
            BioAge by ERIORCENTER
          </Link>
          <Link href="/" className="text-sm text-white/70 transition hover:text-accent">
            Volver al inicio
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center">{children}</div>
      </div>
    </div>
  );
}
