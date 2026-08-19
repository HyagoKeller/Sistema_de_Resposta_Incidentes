import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  FolderOpen,
  ScrollText,
  Menu,
  BellRing,
  CalendarCheck,
  BarChart4,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logout, useSession } from "@/lib/sri-store";
import { getRole } from "@/lib/sri-schema";
import { cn } from "@/lib/utils";
import agustin from "@/assets/agustin.jpg";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hidrated, setHidrated] = useState(false);

  useEffect(() => setHidrated(true), []);

  useEffect(() => {
    if (hidrated && !session) void navigate({ to: "/", replace: true });
  }, [hidrated, session, navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (!session) return null;
  const papel = getRole(session.papel);

  const sidebar = (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div className="h-1 gov-stripe" aria-hidden />
      <div className={cn("flex items-center gap-2.5 px-4 py-4", collapsed && "justify-center px-2")}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm gov-plum text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold uppercase tracking-wide text-foreground">SRI · AGU</span>
            <span className="block truncate text-[11px] text-muted-foreground">Resposta a Incidentes</span>
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2" aria-label="Navegação principal">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-0",
                active && "bg-accent text-accent-foreground",
              )}
            >
              {active && <span className="absolute left-0 h-6 w-1 rounded-r-sm bg-magenta" aria-hidden />}
              <Icon className={cn("size-4 shrink-0", active && "text-plum")} aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>


      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 rounded-md bg-accent/40 p-2", collapsed && "justify-center bg-transparent p-0")}>
          <img
            src={agustin}
            alt="AGUstin, assistente virtual do SRI/AGU"
            className="size-10 shrink-0 rounded-full object-cover ring-2 ring-warning/60"
            loading="lazy"
          />
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-bold text-foreground">AGUstin</span>
              <span className="block truncate text-[11px] text-muted-foreground">Assistente do SRI</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full">
        {/* Sidebar desktop */}
        <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>

        {/* Sidebar mobile */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-primary-dark/70"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 shadow-gov-lg">{sidebar}</div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar menu"
              className="absolute right-3 top-3 text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" aria-hidden />
            </Button>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:inline-flex"
                  aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                  onClick={() => setCollapsed((v) => !v)}
                >
                  {collapsed ? <PanelLeftOpen className="size-5" aria-hidden /> : <PanelLeftClose className="size-5" aria-hidden />}
                </Button>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setMobileOpen(true)}>
                  <Menu className="size-5" aria-hidden />
                </Button>
                <p className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">
                  Advocacia-Geral da União · Segurança da Informação e Privacidade
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
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
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>

          <footer className="border-t border-border bg-surface">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-6 text-xs text-muted-foreground">
              <img src={agustin} alt="" aria-hidden className="size-8 rounded-full object-cover opacity-80" />
              <div>
                <p className="font-semibold text-foreground">Advocacia-Geral da União — Sistema de Resposta a Incidentes (SRI)</p>
                <p className="mt-1">
                  Ambiente de demonstração. Base normativa: PRI/AGU, LGPD art. 48 e Resolução CD/ANPD nº 2/2022. Acessibilidade eMAG / WCAG 2.1 AA.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
