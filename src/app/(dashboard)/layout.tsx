import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, CheckCheck, LayoutDashboard, ScanLine, Sparkles, TrendingUp } from "lucide-react";
import DnaBackground from "@/components/DnaBackground";
import OneSignalInit from "@/components/OneSignalInit";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Escaneo", icon: ScanLine },
  { href: "/habitos", label: "Hábitos", icon: CheckCheck },
  { href: "/coach", label: "Coach Alicia", icon: Sparkles },
  { href: "/progreso", label: "Progreso", icon: TrendingUp },
];

function initialsFromName(fullName: string | null, email: string | null) {
  if (fullName && fullName.trim().length > 0) {
    return fullName
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return (email?.[0] ?? "U").toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  const displayName = fullName || user.email || "Usuario";
  const initials = initialsFromName(fullName, user.email ?? null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OneSignalInit />
      <DnaBackground />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(127,119,221,0.24),transparent_45%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-accent" />
            <span>BioAge</span>
          </Link>
          <div className="flex items-center gap-3">
            <p className="max-w-[9rem] truncate text-sm text-white/80">{displayName}</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-xs font-semibold text-accent">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass-card rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl lg:sticky lg:top-24 lg:h-fit">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="neo-button inline-flex min-w-max items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 transition hover:border-accent/50 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-accent" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}
