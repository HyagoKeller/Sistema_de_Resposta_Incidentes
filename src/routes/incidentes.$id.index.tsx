import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  History,
  Lock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { CriticidadeBadge, SlaBadge, StatusBadge } from "@/components/sri/Badges";
import { FieldInput } from "@/components/sri/FieldInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PHASES, getPhase, getRole } from "@/lib/sri-schema";
import {
  advancePhase,
  closeIncident,
  computeSlas,
  createAnpdForm,
  enableFastTrack,
  generateDoc,
  goToPhase,
  logPiiAccess,
  missingFields,
  phaseComplete,
  progressoGeral,
  reopenIncident,
  setField,
  useIncident,
  useSession,
} from "@/lib/sri-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incidentes/$id/")({
  head: () => ({
    meta: [
      { title: "Checklist do incidente — SRI/AGU" },
      { name: "description", content: "Wizard das 7 fases do PRI/AGU com validação bloqueante, SLAs, evidências e trilha de auditoria do incidente." },
      { property: "og:title", content: "Checklist do incidente — SRI/AGU" },
      { property: "og:description", content: "Conduza o incidente da identificação ao encerramento formal." },
    ],
  }),
  component: IncidenteWizard,
});

function IncidenteWizard() {
  const { id } = Route.useParams();
  const inc = useIncident(id);
  const session = useSession();
  const navigate = useNavigate();
  const [tentouAvancar, setTentouAvancar] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [finalidadePii, setFinalidadePii] = useState("");
  const [piiLiberado, setPiiLiberado] = useState(false);

  const papel = session ? getRole(session.papel) : null;
  const fase = inc ? getPhase(inc.faseAtual) : null;
  const faltantes = useMemo(() => (inc ? missingFields(inc, inc.faseAtual) : []), [inc]);
  const slas = useMemo(() => (inc ? computeSlas(inc) : []), [inc]);

  if (!inc || !fase || !papel) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Incidente não encontrado.</p>
      </AppShell>
    );
  }

  const podeEditar = papel.editaFases.includes(fase.numero) && inc.status !== "Encerrado";
  const podeLer = papel.leFases.includes(fase.numero);
  const podeVerPII = papel.acessoPII || piiLiberado;
  const faltamIds = new Set(faltantes.map((f) => f.id));

  return (
    <AppShell>
      <Button variant="ghost" size="sm" asChild className="mb-3">
        <Link to="/incidentes">
          <ArrowLeft className="size-4" aria-hidden /> Voltar aos incidentes
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary">{inc.codigo}</span>
            <CriticidadeBadge value={inc.data["criticidade"] as string} />
            <StatusBadge status={inc.status} />
            {inc.simulacao && <Badge variant="outline">Simulação — sem notificação real</Badge>}
          </div>
          <h1 className="mt-2 max-w-3xl text-2xl font-bold text-primary-dark">{String(inc.data["titulo"] ?? "Sem título")}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/incidentes/$id/anpd" params={{ id: inc.id }}>
              <FileText className="size-4" aria-hidden /> Formulário ANPD
            </Link>
          </Button>
          {!inc.fastTrack && inc.data["vazamento_ativo"] === true && inc.faseAtual < 3 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Zap className="size-4" aria-hidden /> Fast-track de contenção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir contenção antecipada</DialogTitle>
                  <DialogDescription>
                    Permitido em risco crítico ou vazamento ativo, sem aguardar a conclusão da Análise. A justificativa é obrigatória e registrada na trilha
                    de auditoria (RF-022).
                  </DialogDescription>
                </DialogHeader>
                <Textarea rows={4} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Justifique a antecipação da contenção…" />
                <DialogFooter>
                  <Button disabled={justificativa.trim().length < 10} onClick={() => enableFastTrack(inc.id, justificativa.trim())}>
                    Ativar fast-track
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Progress value={progressoGeral(inc)} className="h-2.5" />
        <span className="shrink-0 text-sm font-semibold text-foreground">
          Seção {fase.numero} de 7 · {progressoGeral(inc)}% concluído
        </span>
      </div>

      {/* Navegação por fases */}
      <ol className="mt-6 grid gap-2 md:grid-cols-4 lg:grid-cols-7" aria-label="Fases do incidente">
        {PHASES.map((p) => {
          const completa = phaseComplete(inc, p.numero);
          const ativa = p.numero === fase.numero;
          return (
            <li key={p.numero}>
              <button
                type="button"
                onClick={() => goToPhase(inc.id, p.numero)}
                className={cn(
                  "w-full rounded-sm border p-2.5 text-left transition-colors",
                  ativa ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/50",
                )}
                aria-current={ativa ? "step" : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("flex size-5 items-center justify-center rounded-full text-[10px] font-bold", completa ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                    {completa ? "✓" : p.numero}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fase {p.numero}</span>
                </div>
                <p className="mt-1 text-xs font-medium leading-tight text-foreground">{p.titulo}</p>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">{fase.macroFase}</p>
                  <CardTitle className="text-lg">
                    {fase.numero}. {fase.titulo}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{fase.descricao}</p>
                </div>
                {!podeEditar && (
                  <Badge variant="outline" className="gap-1 border-warning text-warning-foreground">
                    <Lock className="size-3" aria-hidden /> Somente leitura
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!podeLer ? (
                <p className="flex items-start gap-2 rounded-sm border-l-4 border-destructive bg-destructive/10 p-3 text-sm">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  Seu perfil ({papel.nome}) não tem acesso a esta fase.
                </p>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {fase.fields
                    .filter((f) => !f.showWhen || f.showWhen(inc.data))
                    .map((f) => (
                      <FieldInput
                        key={f.id}
                        field={{ ...f, required: f.required || (f.requiredWhen ? f.requiredWhen(inc.data) : false) }}
                        value={inc.data[f.id]}
                        podeVerPII={podeVerPII}
                        disabled={!podeEditar}
                        invalid={tentouAvancar && faltamIds.has(f.id)}
                        onChange={(v) => setField(inc.id, f.id, v)}
                      />
                    ))}
                </div>
              )}

              {tentouAvancar && faltantes.length > 0 && (
                <div className="mt-6 rounded-sm border-l-4 border-destructive bg-destructive/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="size-4" aria-hidden /> Transição bloqueada — ações obrigatórias pendentes
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-foreground">
                    {faltantes.map((f) => (
                      <li key={f.id}>{f.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <Button variant="outline" disabled={fase.numero === 1} onClick={() => goToPhase(inc.id, fase.numero - 1)}>
                  <ArrowLeft className="size-4" aria-hidden /> Anterior
                </Button>
                <p className="text-xs text-muted-foreground">Alterações salvas automaticamente (autosave) e registradas na auditoria.</p>
                {fase.numero < 7 ? (
                  <Button
                    onClick={() => {
                      setTentouAvancar(true);
                      if (faltantes.length === 0) {
                        advancePhase(inc.id);
                        setTentouAvancar(false);
                      }
                    }}
                  >
                    Próxima fase <ArrowRight className="size-4" aria-hidden />
                  </Button>
                ) : inc.status !== "Encerrado" ? (
                  <Button
                    disabled={!papel.podeAutorizarEncerramento}
                    onClick={() => {
                      setTentouAvancar(true);
                      if (faltantes.length === 0) closeIncident(inc.id);
                    }}
                    title={papel.podeAutorizarEncerramento ? undefined : "Somente Gestor de SI ou SGE podem encerrar"}
                  >
                    <CheckCircle2 className="size-4" aria-hidden /> Encerrar formalmente
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => reopenIncident(inc.id)}>
                    Reabrir incidente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLAs e prazos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {slas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum SLA aplicável até o momento.</p>}
              {slas.map((s) => (
                <div key={s.label} className="rounded-sm border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    <SlaBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prazo {s.prazo} · {s.detalhe}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {!papel.acessoPII && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acesso a dados de titulares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Dados pessoais aparecem pseudonimizados para o seu perfil. A exibição temporária exige finalidade declarada e gera log de acesso (RNF-005).
                </p>
                {piiLiberado ? (
                  <Button variant="outline" size="sm" onClick={() => setPiiLiberado(false)}>
                    Reativar mascaramento
                  </Button>
                ) : (
                  <>
                    <Textarea rows={2} placeholder="Finalidade da consulta" value={finalidadePii} onChange={(e) => setFinalidadePii(e.target.value)} />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={finalidadePii.trim().length < 8}
                      onClick={() => {
                        logPiiAccess(inc.id, finalidadePii.trim());
                        setPiiLiberado(true);
                      }}
                    >
                      Solicitar exibição autorizada
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos (WORM)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => generateDoc(inc.id, "Relatório Final")}>
                  Gerar relatório final
                </Button>
                {inc.anpd && (
                  <Button size="sm" variant="outline" onClick={() => generateDoc(inc.id, "Formulário ANPD")}>
                    Gerar ANPD
                  </Button>
                )}
                {!inc.anpd && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!papel.podeEditarANPD}
                    onClick={() => {
                      createAnpdForm(inc.id);
                      void navigate({ to: "/incidentes/$id/anpd", params: { id: inc.id } });
                    }}
                  >
                    Iniciar Formulário ANPD
                  </Button>
                )}
              </div>
              {inc.documentos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum documento gerado.</p>}
              {inc.documentos.map((d) => (
                <div key={d.id} className="rounded-sm border border-border p-2.5 text-xs">
                  <p className="font-semibold text-foreground">
                    {d.tipo} — v{d.versao}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(d.geradoEm).toLocaleString("pt-BR")} · {d.geradoPor}
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">SHA-256 {d.hash.slice(0, 32)}…</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4 text-primary" aria-hidden /> Trilha de auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="recentes">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="recentes">Recentes</TabsTrigger>
                  <TabsTrigger value="tudo">Tudo ({inc.auditoria.length})</TabsTrigger>
                </TabsList>
                {(["recentes", "tudo"] as const).map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {(tab === "recentes" ? inc.auditoria.slice(0, 6) : inc.auditoria).map((a) => (
                      <div key={a.id} className="border-l-2 border-primary/40 pl-3 text-xs">
                        <p className="font-semibold text-foreground">{a.acao}</p>
                        <p className="text-muted-foreground">{a.entidade}</p>
                        {a.detalhe && <p className="text-muted-foreground">{a.detalhe}</p>}
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(a.ts).toLocaleString("pt-BR")} · {a.ator} ({a.papel}) · {a.ip}
                        </p>
                      </div>
                    ))}
                    {inc.auditoria.length === 0 && <p className="text-xs text-muted-foreground">Sem registros.</p>}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
