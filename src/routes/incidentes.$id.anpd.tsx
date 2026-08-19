import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FileDown, ShieldAlert, Sparkles } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { FieldInput } from "@/components/sri/FieldInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ANPD_SECTIONS, ANPD_PREFILL, getRole } from "@/lib/sri-schema";
import { createAnpdForm, generateDoc, setAnpdField, useIncident, useSession } from "@/lib/sri-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incidentes/$id/anpd")({
  head: () => ({
    meta: [
      { title: "Formulário ANPD (art. 48 LGPD) - SRI/AGU" },
      { name: "description", content: "Comunicação de incidente à ANPD em 8 seções, pré-preenchida a partir das fases 1 a 6 do incidente registrado." },
      { property: "og:title", content: "Formulário ANPD (art. 48 LGPD) - SRI/AGU" },
      { property: "og:description", content: "Preenchimento e exportação do formulário de comunicação de incidente à ANPD." },
    ],
  }),
  component: FormularioAnpd,
});

function FormularioAnpd() {
  const { id } = Route.useParams();
  const inc = useIncident(id);
  const session = useSession();
  const [secao, setSecao] = useState(1);
  const [tentou, setTentou] = useState(false);

  const papel = session ? getRole(session.papel) : null;
  const anpd = useMemo(() => inc?.anpd ?? {}, [inc]);
  const secaoDef = ANPD_SECTIONS.find((s) => s.numero === secao)!;

  const faltantes = secaoDef.fields.filter((f) => {
    if (f.showWhen && !f.showWhen(anpd)) return false;
    const obrig = f.required || (f.requiredWhen ? f.requiredWhen(anpd) : false);
    if (!obrig) return false;
    const v = anpd[f.id];
    return v === undefined || v === null || v === "";
  });

  if (!inc || !papel) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Incidente não encontrado.</p>
      </AppShell>
    );
  }

  const podeEditar = papel.podeEditarANPD && inc.status !== "Encerrado";
  const totalPreenchidos = ANPD_SECTIONS.flatMap((s) => s.fields).filter((f) => anpd[f.id] !== undefined && anpd[f.id] !== "").length;
  const totalCampos = ANPD_SECTIONS.flatMap((s) => s.fields).length;

  return (
    <AppShell>
      <Button variant="ghost" size="sm" asChild className="mb-3">
        <Link to="/incidentes/$id" params={{ id: inc.id }}>
          <ArrowLeft className="size-4" aria-hidden /> Voltar ao checklist
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-bold text-primary">{inc.codigo}</p>
          <h1 className="mt-1 text-2xl font-bold text-primary-dark">Comunicação de Incidente à ANPD</h1>
          <p className="mt-1 text-sm text-muted-foreground">Art. 48 da LGPD · Resolução CD/ANPD nº 2/2022 · 8 seções</p>
        </div>
        {inc.anpd && (
          <Button variant="outline" onClick={() => generateDoc(inc.id, "Formulário ANPD")}>
            <FileDown className="size-4" aria-hidden /> Exportar para protocolo (PDF/DOCX)
          </Button>
        )}
      </div>

      {inc.simulacao && (
        <p className="mt-4 rounded-sm border-l-4 border-warning bg-warning/10 p-3 text-sm">
          Incidente marcado como <strong>simulação</strong>: nenhuma comunicação real será emitida à ANPD ou aos titulares.
        </p>
      )}

      {!papel.podeEditarANPD && (
        <p className="mt-4 flex items-start gap-2 rounded-sm border-l-4 border-destructive bg-destructive/10 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          Apenas o Encarregado de Dados (ou delegação explícita registrada) pode criar e editar este formulário (RF-043). Visualização em modo leitura.
        </p>
      )}

      {!inc.anpd ? (
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" aria-hidden /> Iniciar com pré-preenchimento automático
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O sistema reaproveita datas, descrição, sistemas afetados, medidas de contenção e canais de comunicação já registrados nas fases 1 a 6 -
              sem redigitação (RF-041). Estão mapeados {Object.keys(ANPD_PREFILL).length} campos.
            </p>
            <Button disabled={!podeEditar} onClick={() => createAnpdForm(inc.id)}>
              Criar formulário pré-preenchido
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-5 flex items-center gap-4">
            <Progress value={(totalPreenchidos / totalCampos) * 100} className="h-2.5" />
            <span className="shrink-0 text-sm font-semibold">
              Seção {secao}/8 · {totalPreenchidos}/{totalCampos} campos
            </span>
          </div>

          <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ANPD_SECTIONS.map((s) => (
              <li key={s.numero}>
                <button
                  type="button"
                  onClick={() => setSecao(s.numero)}
                  className={cn(
                    "w-full rounded-sm border p-2.5 text-left text-xs transition-colors",
                    s.numero === secao ? "border-primary bg-primary/10 font-semibold" : "border-border bg-surface hover:border-primary/50",
                  )}
                  aria-current={s.numero === secao ? "step" : undefined}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Seção {s.numero}</span>
                  <p className="mt-0.5 leading-tight text-foreground">{s.titulo}</p>
                </button>
              </li>
            ))}
          </ol>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {secaoDef.numero}. {secaoDef.titulo}
              </CardTitle>
              {secao === 3 && anpd["tipo_comunicacao"] === "Preliminar" && (
                <Badge variant="outline" className="w-fit border-warning text-warning-foreground">
                  Comunicação preliminar - complementação obrigatória em até 20 dias úteis
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 md:grid-cols-2">
                {secaoDef.fields
                  .filter((f) => !f.showWhen || f.showWhen(anpd))
                  .map((f) => (
                    <FieldInput
                      key={f.id}
                      field={{ ...f, required: f.required || (f.requiredWhen ? f.requiredWhen(anpd) : false) }}
                      value={anpd[f.id]}
                      podeVerPII={papel.acessoPII}
                      disabled={!podeEditar}
                      invalid={tentou && faltantes.some((x) => x.id === f.id)}
                      onChange={(v) => setAnpdField(inc.id, f.id, v)}
                    />
                  ))}
              </div>

              {tentou && faltantes.length > 0 && (
                <div className="mt-6 rounded-sm border-l-4 border-destructive bg-destructive/10 p-4 text-sm">
                  <p className="font-semibold text-destructive">Preencha os campos obrigatórios desta seção antes de avançar:</p>
                  <ul className="mt-2 list-inside list-disc">
                    {faltantes.map((f) => (
                      <li key={f.id}>{f.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <Button variant="outline" disabled={secao === 1} onClick={() => setSecao(secao - 1)}>
                  <ArrowLeft className="size-4" aria-hidden /> Anterior
                </Button>
                <p className="text-xs text-muted-foreground">Autosave ativo · alterações versionadas na auditoria do incidente.</p>
                <Button
                  disabled={secao === 8}
                  onClick={() => {
                    setTentou(true);
                    if (faltantes.length === 0) {
                      setSecao(secao + 1);
                      setTentou(false);
                    }
                  }}
                >
                  Próxima <ArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
