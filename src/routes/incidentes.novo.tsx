import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getRole, type TipoRegistro } from "@/lib/sri-schema";
import { createIncident, useSession } from "@/lib/sri-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incidentes/novo")({
  head: () => ({
    meta: [
      { title: "Registrar incidente - SRI/AGU" },
      { name: "description", content: "Abertura do registro inicial de incidente de segurança da informação ou de privacidade na AGU." },
      { property: "og:title", content: "Registrar incidente - SRI/AGU" },
      { property: "og:description", content: "Escolha a trilha (segurança ou privacidade) e inicie o checklist de 7 fases do PRI/AGU." },
    ],
  }),
  component: NovoIncidente,
});

const TRILHAS: { id: TipoRegistro; nome: string; icone: typeof ShieldCheck; resumo: string; base: string }[] = [
  {
    id: "seguranca",
    nome: "Incidente de segurança da informação",
    icone: ShieldCheck,
    resumo: "Comprometimento de disponibilidade, integridade ou confidencialidade de ativos da AGU.",
    base: "IN GSI/PR nº 1/2020 · Decreto nº 10.748/2021 · POSIN-AGU",
  },
  {
    id: "privacidade",
    nome: "Incidente de privacidade (dados pessoais)",
    icone: UserCheck,
    resumo: "Exposição, perda ou acesso indevido a dados pessoais, com avaliação de risco aos titulares.",
    base: "LGPD art. 48 · Resolução CD/ANPD nº 15/2024 · POSIN-AGU",
  },
];

function NovoIncidente() {
  const navigate = useNavigate();
  const session = useSession();
  const [tipo, setTipo] = useState<TipoRegistro | null>(null);
  const [titulo, setTitulo] = useState("");
  const [simulacao, setSimulacao] = useState(false);
  const [erro, setErro] = useState("");

  const podeCriar = session ? getRole(session.papel).podeCriarIncidente : false;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-foreground">Registrar novo incidente</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolha a trilha do registro. O ID é gerado automaticamente (ISI para segurança, IPD para privacidade) e a data/hora é carimbada pelo sistema.
      </p>

      {!podeCriar && (
        <p className="mt-6 flex max-w-2xl items-start gap-2 rounded-sm border-l-4 border-destructive bg-destructive/10 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          Seu perfil não possui permissão para abrir incidentes (RF-001).
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {TRILHAS.map((t) => {
          const Icon = t.icone;
          const ativo = tipo === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={!podeCriar}
              onClick={() => setTipo(t.id)}
              aria-pressed={ativo}
              className={cn(
                "rounded-md border p-5 text-left transition-colors disabled:opacity-50",
                ativo ? "border-primary bg-primary/10 shadow-gov" : "border-border bg-surface hover:border-primary/60",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Icon className="size-5 text-primary" aria-hidden />
                {t.nome}
              </span>
              <span className="mt-2 block text-sm text-muted-foreground">{t.resumo}</span>
              <span className="mt-3 block text-[11px] uppercase tracking-wide text-muted-foreground">{t.base}</span>
            </button>
          );
        })}
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Dados mínimos de abertura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título do incidente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={160}
              placeholder="Ex.: Exposição indevida de planilha com dados de servidores"
              disabled={!podeCriar}
            />
            <p className="text-xs text-muted-foreground">Evite incluir nomes, CPFs ou outros dados pessoais no título (minimização - RNF-004).</p>
          </div>

          <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/50 p-3">
            <Switch id="simulacao" checked={simulacao} onCheckedChange={setSimulacao} disabled={!podeCriar} />
            <Label htmlFor="simulacao" className="text-sm font-normal">
              Registro de <strong>simulação</strong> - segue o mesmo fluxo, sem notificação real e fora dos indicadores.
            </Label>
          </div>

          {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}

          <Button
            disabled={!podeCriar}
            onClick={() => {
              if (!tipo) {
                setErro("Selecione a trilha do incidente (segurança ou privacidade).");
                return;
              }
              const t = titulo.trim();
              if (t.length < 5) {
                setErro("Informe um título com pelo menos 5 caracteres.");
                return;
              }
              const inc = createIncident({ titulo: t, simulacao, tipo });
              void navigate({ to: "/incidentes/$id", params: { id: inc.id } });
            }}
          >
            Criar registro e abrir Fase 1
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
