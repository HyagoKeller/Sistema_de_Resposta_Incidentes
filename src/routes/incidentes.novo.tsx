import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getRole } from "@/lib/sri-schema";
import { createIncident, useSession } from "@/lib/sri-store";

export const Route = createFileRoute("/incidentes/novo")({
  head: () => ({
    meta: [
      { title: "Registrar incidente — SRI/AGU" },
      { name: "description", content: "Abertura do registro inicial de suspeita de incidente de segurança da informação ou privacidade na AGU." },
      { property: "og:title", content: "Registrar incidente — SRI/AGU" },
      { property: "og:description", content: "Inicie o checklist de 7 fases do Plano de Resposta a Incidentes da AGU." },
    ],
  }),
  component: NovoIncidente,
});

function NovoIncidente() {
  const navigate = useNavigate();
  const session = useSession();
  const [titulo, setTitulo] = useState("");
  const [simulacao, setSimulacao] = useState(false);
  const [erro, setErro] = useState("");

  const podeCriar = session ? getRole(session.papel).podeCriarIncidente : false;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-primary-dark">Registrar novo incidente</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        O registro inicia a Fase 1 (Identificação). O ID é gerado automaticamente e a data/hora de registro é carimbada pelo sistema.
      </p>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Dados mínimos de abertura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!podeCriar && (
            <p className="flex items-start gap-2 rounded-sm border-l-4 border-destructive bg-destructive/10 p-3 text-sm">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
              Seu perfil não possui permissão para abrir incidentes (RF-001).
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título do incidente <span className="text-destructive">*</span>
            </Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} placeholder="Ex.: Exposição indevida de planilha com dados de servidores" disabled={!podeCriar} />
            <p className="text-xs text-muted-foreground">Evite incluir nomes, CPFs ou outros dados pessoais no título (minimização — RNF-004).</p>
          </div>

          <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/50 p-3">
            <Switch id="simulacao" checked={simulacao} onCheckedChange={setSimulacao} disabled={!podeCriar} />
            <Label htmlFor="simulacao" className="text-sm font-normal">
              Registro de <strong>simulação (tabletop exercise)</strong> — segue o mesmo fluxo, sem notificação real e sem entrar nos indicadores.
            </Label>
          </div>

          {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}

          <Button
            disabled={!podeCriar}
            onClick={() => {
              const t = titulo.trim();
              if (t.length < 5) {
                setErro("Informe um título com pelo menos 5 caracteres.");
                return;
              }
              const inc = createIncident({ titulo: t, simulacao });
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
