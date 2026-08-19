import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, FileText } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { CriticidadeBadge, StatusBadge, TipoBadge } from "@/components/sri/Badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { baixarDocx, type TipoDocumento } from "@/lib/docx-export";
import { PHASES } from "@/lib/sri-schema";
import { useIncidents } from "@/lib/sri-store";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios e Consolidação - SRI/AGU" },
      { name: "description", content: "Indicadores consolidados de incidentes e geração de relatórios preliminares, finais e formulário ANPD em .docx." },
      { property: "og:title", content: "Relatórios e Consolidação - SRI/AGU" },
      { property: "og:description", content: "Exporte relatórios institucionais em Word a partir das 7 fases do PRI/AGU." },
    ],
  }),
  component: Relatorios,
});

const DOCS: TipoDocumento[] = ["Relatório Preliminar", "Relatório Final", "Formulário ANPD"];

function Relatorios() {
  const incidents = useIncidents();
  const [gerando, setGerando] = useState<string | null>(null);

  const reais = incidents.filter((i) => !i.simulacao);
  const kpis = [
    { label: "Incidentes registrados", valor: reais.length },
    { label: "Trilha de privacidade", valor: reais.filter((i) => i.tipo === "privacidade").length },
    { label: "Encerrados", valor: reais.filter((i) => i.status === "Encerrado").length },
    { label: "Com dever de ANPD", valor: reais.filter((i) => i.data["notificar_anpd"] === true).length },
  ];

  const porFase = PHASES.map((f) => ({ fase: f, total: reais.filter((i) => i.faseAtual === f.numero).length }));
  const maior = Math.max(1, ...porFase.map((p) => p.total));

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">Relatórios e consolidação</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Visão consolidada dos registros e geração de documentos institucionais em formato Word (.docx), com brasão textual e trilha de auditoria anexa.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-primary">{k.valor}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Distribuição por fase do PRI/AGU</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {porFase.map(({ fase, total }) => (
            <div key={fase.numero} className="flex items-center gap-3">
              <span className="w-56 shrink-0 truncate text-xs text-muted-foreground">
                {fase.numero}. {fase.titulo}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-sm bg-muted">
                <span className="block h-full rounded-sm bg-primary" style={{ width: `${(total / maior) * 100}%` }} />
              </span>
              <span className="w-6 text-right text-xs font-semibold text-foreground">{total}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <h2 className="mt-8 text-lg font-bold text-foreground">Geração de documentos</h2>
      <div className="mt-3 space-y-3">
        {incidents.map((inc) => (
          <Card key={inc.id}>
            <CardContent className="flex flex-wrap items-center gap-3 pt-6">
              <div className="min-w-64 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TipoBadge tipo={inc.tipo} />
                  <StatusBadge status={inc.status} />
                  <CriticidadeBadge value={inc.data["criticidade"] as string | undefined} />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  <Link to="/incidentes/$id" params={{ id: inc.id }} className="hover:underline">
                    {inc.codigo} - {String(inc.data["titulo"] ?? "Sem título")}
                  </Link>
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="size-3.5" aria-hidden />
                  Fase atual {inc.faseAtual} de 7 · aberto em {new Date(inc.criadoEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DOCS.map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant="outline"
                    disabled={gerando === `${inc.id}:${d}` || (d === "Formulário ANPD" && !inc.anpd)}
                    onClick={async () => {
                      setGerando(`${inc.id}:${d}`);
                      try {
                        await baixarDocx(d, inc);
                      } finally {
                        setGerando(null);
                      }
                    }}
                  >
                    <FileDown className="size-4" aria-hidden /> {d}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
