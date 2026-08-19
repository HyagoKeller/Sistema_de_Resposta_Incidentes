import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, ShieldCheck, LayoutDashboard, FolderOpen, ScrollText, Menu, BellRing, CalendarCheck, BarChart4 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logout, useSession } from "@/lib/sri-store";
import { getRole } from "@/lib/sri-schema";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/incidentes", label: "Incidentes", icon: FolderOpen },
  { to: "/notificacoes", label: "SLA e Notificações", icon: BellRing },
  { to: "/exercicios", label: "Exercícios", icon: CalendarCheck },
  { to: "/relatorios", label: "Relatórios", icon: BarChart4 },
  { to: "/auditoria", label: "Auditoria", icon: ScrollText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [hidrated, setHidrated] = useState(false);

  useEffect(() => setHidrated(true), []);

  useEffect(() => {
    if (hidrated && !session) void navigate({ to: "/", replace: true });
  }, [hidrated, session, navigate]);

  if (!session) return null;
  const papel = getRole(session.papel);

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 gov-bar" aria-hidden />
      <header className="sticky top-0 z-30 border-b border-border bg-surface shadow-gov">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/painel" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold uppercase tracking-wide text-primary-dark">SRI · AGU</span>
              <span className="block text-[11px] text-muted-foreground">Resposta a Incidentes de SI e Privacidade</span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-0.5 lg:flex" aria-label="Navegação principal">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2.5 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith(to) && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{session.nome}</p>
              <p className="text-[11px] text-muted-foreground">
                {papel.nome} · {session.metodo}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                void navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="size-4" aria-hidden /> Sair
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setOpen((v) => !v)}>
              <Menu className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-border px-4 py-2 lg:hidden" aria-label="Navegação móvel">
            {NAV.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} className="block rounded-sm px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
          <p className="font-semibold text-primary-dark">Advocacia-Geral da União — Sistema de Resposta a Incidentes (SRI)</p>
          <p className="mt-1">
            Ambiente de demonstração. Base normativa: PRI/AGU, LGPD art. 48 e Resolução CD/ANPD nº 2/2022. Acessibilidade eMAG / WCAG 2.1 AA.
          </p>
        </div>
      </footer>
    </div>
  );
}
