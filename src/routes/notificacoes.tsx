import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, Gavel } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { CriticidadeBadge, TipoBadge } from "@/components/sri/Badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NOTIFICATION_TARGETS, getRole } from "@/lib/sri-schema";
import { toggleNotification, useIncidents, useNotifDone, useSession } from "@/lib/sri-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "SLA e Notificações Legais - SRI/AGU" },
      { name: "description", content: "Controle dos prazos legais de comunicação a Encarregado, CTIR.Gov, ANPD, titulares e Alta Administração." },
      { property: "og:title", content: "SLA e Notificações Legais - SRI/AGU" },
      { property: "og:description", content: "Checklist de prazos legais por incidente com contagem regressiva e confirmação registrada em auditoria." },
    ],
  }),
  component: Notificacoes,
});

const HORA = 3600 * 1000;

function prazoInfo(criadoEm: string, horas: number, feitoEm?: string) {
  const limite = new Date(new Date(criadoEm).getTime() + horas * HORA);
  const ref = feitoEm ? new Date(feitoEm) : new Date();
  const restanteH = (limite.getTime() - ref.getTime()) / HORA;
  return {
    limite,
    restanteH,
    vencido: restanteH < 0,
    rotulo:
      restanteH < 0
        ? `${Math.abs(Math.round(restanteH))} h em atraso`
        : restanteH < 24
          ? `${Math.round(restanteH)} h restantes`
          : `${Math.floor(restanteH / 24)} d restantes`,
  };
}

function Notificacoes() {
  const incidents = useIncidents();
  const done = useNotifDone();
  const session = useSession();
  const podeConfirmar = session ? getRole(session.papel).editaFases.length > 0 : false;

  const abertos = incidents.filter((i) => i.status !== "Encerrado");

  const pendentes = abertos.flatMap((inc) =>
    NOTIFICATION_TARGETS.filter((t) => t.aplicaA.includes(inc.tipo) && (!t.condicao || t.condicao(inc.data)))
      .filter((t) => !done[`${inc.id}:${t.id}`])
      .map((t) => prazoInfo(inc.criadoEm, t.horas)),
  );
  const vencidas = pendentes.filter((p) => p.vencido).length;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SLA e notificações legais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Obrigações de comunicação derivadas de cada incidente aberto. A confirmação é registrada na trilha de auditoria.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-sm border border-border bg-surface px-3 py-2">
            <strong className="text-foreground">{pendentes.length}</strong> pendentes
          </span>
          <span className={cn("rounded-sm border px-3 py-2", vencidas ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-surface")}>
            <strong>{vencidas}</strong> em atraso
          </span>
        </div>
      </div>

      {abertos.length === 0 && <p className="mt-8 text-sm text-muted-foreground">Nenhum incidente em andamento.</p>}

      <div className="mt-6 space-y-5">
        {abertos.map((inc) => {
          const alvos = NOTIFICATION_TARGETS.filter((t) => t.aplicaA.includes(inc.tipo) && (!t.condicao || t.condicao(inc.data)));
          return (
            <Card key={inc.id}>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <TipoBadge tipo={inc.tipo} />
                  <CriticidadeBadge value={inc.data["criticidade"] as string | undefined} />
                  {inc.simulacao && <span className="rounded-sm bg-muted px-2 py-0.5 text-[11px] font-bold uppercase">Simulação</span>}
                </div>
                <CardTitle className="text-base">
                  <Link to="/incidentes/$id" params={{ id: inc.id }} className="hover:underline">
                    {inc.codigo} - {String(inc.data["titulo"] ?? "Sem título")}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alvos.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma obrigação legal acionada até o momento.</p>}
                {alvos.map((t) => {
                  const feitoEm = done[`${inc.id}:${t.id}`];
                  const info = prazoInfo(inc.criadoEm, t.horas, feitoEm);
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "flex flex-wrap items-start gap-3 rounded-sm border p-3",
                        feitoEm ? "border-success/40 bg-success/5" : info.vencido ? "border-destructive/40 bg-destructive/5" : "border-border bg-muted/40",
                      )}
                    >
                      <span className="mt-0.5">
                        {feitoEm ? (
                          <CheckCircle2 className="size-4 text-success" aria-hidden />
                        ) : info.vencido ? (
                          <AlertTriangle className="size-4 text-destructive" aria-hidden />
                        ) : (
                          <Clock className="size-4 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-56 flex-1">
                        <p className="text-sm font-semibold text-foreground">{t.destinatario}</p>
                        <p className="text-xs text-muted-foreground">{t.descricao}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                          <Gavel className="size-3" aria-hidden />
                          {t.base}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-foreground">Prazo: {t.prazo}</p>
                        <p className="text-muted-foreground">Limite: {info.limite.toLocaleString("pt-BR")}</p>
                        <p className={cn("font-semibold", feitoEm ? "text-success" : info.vencido ? "text-destructive" : "text-muted-foreground")}>
                          {feitoEm ? `Confirmado em ${new Date(feitoEm).toLocaleString("pt-BR")}` : info.rotulo}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={feitoEm ? "outline" : "default"}
                        disabled={!podeConfirmar}
                        onClick={() => toggleNotification(inc.id, t.id, t.destinatario)}
                      >
                        {feitoEm ? "Reverter" : "Confirmar envio"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
