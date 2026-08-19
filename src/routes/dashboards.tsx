import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeSlas, useIncidents } from "@/lib/sri-store";
import { CRITICIDADES, PHASES } from "@/lib/sri-schema";

export const Route = createFileRoute("/dashboards")({
  head: () => ({
    meta: [
      { title: "Dashboards Analíticos — SRI/AGU" },
      {
        name: "description",
        content:
          "Painéis analíticos do SRI/AGU: criticidade, fases do playbook, evolução mensal de registros e cumprimento de prazos legais.",
      },
      { property: "og:title", content: "Dashboards Analíticos — SRI/AGU" },
      { property: "og:description", content: "Gráficos consolidados de incidentes de segurança e privacidade da AGU." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboards,
});

const CHART = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function Dashboards() {
  const incidents = useIncidents();
  const reais = useMemo(() => incidents.filter((i) => !i.simulacao), [incidents]);

  const porCriticidade = CRITICIDADES.map((c) => ({
    nome: c,
    total: reais.filter((i) => i.data["criticidade"] === c).length,
  }));

  const porFase = PHASES.map((p) => ({
    nome: `F${p.numero}`,
    titulo: p.titulo,
    total: reais.filter((i) => i.faseAtual === p.numero).length,
  }));

  const porTipo = [
    { nome: "Segurança", total: reais.filter((i) => i.tipo !== "privacidade").length },
    { nome: "Privacidade", total: reais.filter((i) => i.tipo === "privacidade").length },
    { nome: "Simulações", total: incidents.length - reais.length },
  ];

  const evolucao = useMemo(() => {
    const map = new Map<string, number>();
    for (let k = 5; k >= 0; k--) {
      const d = new Date();
      d.setMonth(d.getMonth() - k);
      map.set(d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), 0);
    }
    reais.forEach((i) => {
      const label = new Date(i.criadoEm).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (map.has(label)) map.set(label, (map.get(label) ?? 0) + 1);
    });
    return [...map].map(([nome, total]) => ({ nome, total }));
  }, [reais]);

  const slas = reais.flatMap((i) => computeSlas(i));
  const vencidos = slas.filter((s) => s.status === "vencido").length;
  const cumpridos = slas.filter((s) => s.status === "cumprido").length;
  const emCurso = slas.length - vencidos - cumpridos;
  const aderencia = slas.length ? Math.round((cumpridos / slas.length) * 100) : 100;

  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl">Dashboards analíticos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão executiva consolidada · {reais.length} registros reais · {incidents.length - reais.length} simulações
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Mini icon={Activity} label="Registros totais" value={String(incidents.length)} detalhe="incluindo simulações" />
        <Mini icon={CheckCircle2} label="Aderência de prazos" value={`${aderencia}%`} detalhe={`${cumpridos} prazos cumpridos`} tone="success" />
        <Mini icon={Clock} label="Prazos em curso" value={String(emCurso)} detalhe="dentro da janela legal" tone="warning" />
        <Mini icon={AlertTriangle} label="Prazos vencidos" value={String(vencidos)} detalhe="24h DPO · 3 dias úteis ANPD" tone="destructive" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <ChartCard title="Incidentes por criticidade" className="xl:col-span-2">
          <BarChart data={porCriticidade}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="nome" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.35 }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {porCriticidade.map((_, idx) => (
                <Cell key={idx} fill={CHART[idx % CHART.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Segurança x Privacidade">
          <PieChart>
            <Pie data={porTipo} dataKey="total" nameKey="nome" innerRadius={52} outerRadius={84} paddingAngle={3}>
              {porTipo.map((_, idx) => (
                <Cell key={idx} fill={CHART[idx % CHART.length]} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ChartCard>

        <ChartCard title="Evolução de registros (6 meses)" className="xl:col-span-2">
          <LineChart data={evolucao}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="nome" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="total" stroke="var(--color-magenta)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Distribuição por fase do playbook">
          <BarChart data={porFase} layout="vertical" margin={{ left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="nome" width={34} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.35 }} />
            <Bar dataKey="total" fill="var(--color-plum)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </AppShell>
  );
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  color: "var(--color-popover-foreground)",
  fontSize: 12,
} as const;

function ChartCard({ title, className, children }: { title: string; className?: string; children: React.ReactElement }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  detalhe,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detalhe: string;
  tone?: "primary" | "destructive" | "warning" | "success";
}) {
  const toneClass = {
    primary: "bg-primary/15 text-primary",
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/25 text-warning-foreground",
    success: "bg-success/15 text-success",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${toneClass}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{detalhe}</p>
        </div>
      </CardContent>
    </Card>
  );
}
