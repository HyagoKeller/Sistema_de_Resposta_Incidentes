import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, FileWarning, Plus, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { computeSlas, progressoGeral, useIncidents, useSession } from "@/lib/sri-store";
import { PHASES, getRole } from "@/lib/sri-schema";
import { CriticidadeBadge, StatusBadge } from "@/components/sri/Badges";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel de Incidentes - SRI/AGU" },
      { name: "description", content: "Indicadores de incidentes por criticidade, cumprimento de SLA do DPO e da ANPD e planos corretivos pendentes." },
      { property: "og:title", content: "Painel de Incidentes - SRI/AGU" },
      { property: "og:description", content: "Visão consolidada dos incidentes de segurança e privacidade da AGU." },
    ],
  }),
  component: Painel,
});

function Painel() {
  const incidents = useIncidents();
  const session = useSession();
  const reais = incidents.filter((i) => !i.simulacao);
  const abertos = reais.filter((i) => i.status !== "Encerrado");
  const criticos = abertos.filter((i) => i.data["criticidade"] === "Crítica" || i.data["criticidade"] === "Alta");
  const slasVencidos = reais.flatMap((i) => computeSlas(i).filter((s) => s.status === "vencido"));
  const comANPD = reais.filter((i) => i.data["notificar_anpd"] === true);

  const porFase = PHASES.map((p) => ({ fase: p.numero, titulo: p.titulo, total: abertos.filter((i) => i.faseAtual === p.numero).length }));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Painel de governança</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Perfil ativo: <strong>{session ? getRole(session.papel).nome : "-"}</strong> · simulações não compõem os indicadores (RF-092).
          </p>
        </div>
        <Button asChild>
          <Link to="/incidentes/novo">
            <Plus className="size-4" aria-hidden /> Registrar incidente
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={FileWarning} label="Incidentes abertos" value={abertos.length} detalhe={`${reais.length} registros no total`} />
        <Kpi icon={AlertTriangle} label="Alta / Crítica" value={criticos.length} detalhe="Exigem aprovação do Gestor de SI" tone="destructive" />
        <Kpi icon={Clock} label="SLAs vencidos" value={slasVencidos.length} detalhe="24h DPO · 3 dias úteis ANPD" tone="warning" />
        <Kpi icon={CheckCircle2} label="Com dever de ANPD" value={comANPD.length} detalhe="Formulário art. 48 aplicável" tone="success" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Incidentes em andamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidents.length === 0 && <p className="text-sm text-muted-foreground">Nenhum incidente registrado.</p>}
            {incidents.slice(0, 6).map((i) => (
              <Link
                key={i.id}
                to="/incidentes/$id"
                params={{ id: i.id }}
                className="block rounded-sm border border-border bg-surface p-4 transition-colors hover:border-primary"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{i.codigo}</span>
                  <CriticidadeBadge value={i.data["criticidade"] as string} />
                  <StatusBadge status={i.status} />
                  {i.simulacao && <Badge variant="outline">Simulação</Badge>}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-foreground">{String(i.data["titulo"] ?? "Sem título")}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={progressoGeral(i)} className="h-2" />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Fase {i.faseAtual}/7 · {progressoGeral(i)}%
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" aria-hidden /> Distribuição por fase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {porFase.map((f) => (
              <div key={f.fase}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {f.fase}. {f.titulo}
                  </span>
                  <span className="text-muted-foreground">{f.total}</span>
                </div>
                <Progress value={abertos.length ? (f.total / abertos.length) * 100 : 0} className="mt-1 h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  detalhe,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  detalhe: string;
  tone?: "primary" | "destructive" | "warning" | "success";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/25 text-warning-foreground",
    success: "bg-success/10 text-success",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <span className={`flex size-10 items-center justify-center rounded-sm ${toneClass}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{detalhe}</p>
        </div>
      </CardContent>
    </Card>
  );
}
