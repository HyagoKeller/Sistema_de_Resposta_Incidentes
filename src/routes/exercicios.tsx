import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, ClipboardList, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppShell } from "@/components/sri/AppShell";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_EXERCICIO, TRILHAS_EXERCICIO, getRole, type TipoExercicio } from "@/lib/sri-schema";
import {
  createExercise,
  deleteExercise,
  saveExercisePos,
  saveExercisePre,
  useExercises,
  useSession,
  type Exercise,
} from "@/lib/sri-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exercicios")({
  head: () => ({
    meta: [
      { title: "Exercícios de Resposta - SRI/AGU" },
      { name: "description", content: "Planejamento e avaliação de exercícios tabletop, simulados e funcionais de resposta a incidentes na AGU." },
      { property: "og:title", content: "Exercícios de Resposta - SRI/AGU" },
      { property: "og:description", content: "Formulários pré e pós-exercício com lições aprendidas e riscos expostos." },
    ],
  }),
  component: Exercicios,
});

function Exercicios() {
  const exercises = useExercises();
  const session = useSession();
  const podeEditar = session ? getRole(session.papel).editaFases.length > 0 : false;
  const [novo, setNovo] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);

  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState<TipoExercicio>("Tabletop");
  const [trilha, setTrilha] = useState(TRILHAS_EXERCICIO[0]!);
  const [data, setData] = useState("");
  const [responsavel, setResponsavel] = useState("");

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exercícios de resposta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planeje exercícios tabletop, simulados e funcionais, registre o formulário prévio e consolide as lições aprendidas.
          </p>
        </div>
        {podeEditar && (
          <Button onClick={() => setNovo((v) => !v)}>
            <Plus className="size-4" aria-hidden /> Planejar exercício
          </Button>
        )}
      </div>

      {novo && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
          <Card className="w-fit">
            <CardHeader>
              <CardTitle className="text-base">Calendário de exercícios</CardTitle>
              <p className="text-xs text-muted-foreground">Selecione a data prevista. Dias destacados já possuem exercícios planejados.</p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                locale={ptBR}
                selected={data ? new Date(`${data}T12:00:00`) : undefined}
                onSelect={(d) => setData(d ? format(d, "yyyy-MM-dd") : "")}
                modifiers={{ agendado: exercises.filter((e) => e.data).map((e) => new Date(`${e.data}T12:00:00`)) }}
                modifiersClassNames={{ agendado: "bg-primary/20 text-primary font-bold rounded-sm" }}
                className="rounded-sm border border-border bg-surface p-3"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Novo exercício</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tema">Tema do exercício</Label>
                <Input id="tema" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: Vazamento de base de dados via fornecedor" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoExercicio)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EXERCICIO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trilha</Label>
                <Select value={trilha} onValueChange={setTrilha}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRILHAS_EXERCICIO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dt">Data prevista</Label>
                <Input id="dt" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp">Responsável</Label>
                <Input id="resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Ex.: ETIR Central" />
              </div>
              <div className="md:col-span-2">
                <Button
                  disabled={tema.trim().length < 5 || !data}
                  onClick={() => {
                    createExercise({ tema: tema.trim(), tipo, trilha, data, responsavel: responsavel.trim() || "Não definido" });
                    setTema("");
                    setData("");
                    setResponsavel("");
                    setNovo(false);
                  }}
                >
                  Registrar exercício
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      <div className="mt-6 space-y-4">
        {exercises.length === 0 && <p className="text-sm text-muted-foreground">Nenhum exercício planejado.</p>}
        {exercises.map((ex) => (
          <Card key={ex.id}>
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-primary">{ex.tipo}</span>
                <span className="rounded-sm bg-muted px-2 py-0.5 text-muted-foreground">{ex.trilha}</span>
                <span className={cn("rounded-sm px-2 py-0.5", ex.pos ? "bg-success/15 text-success" : "bg-warning/25 text-warning-foreground")}>
                  {ex.pos ? "Avaliado" : "Pendente de avaliação"}
                </span>
              </div>
              <CardTitle className="text-base">{ex.tema}</CardTitle>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarCheck className="size-3.5" aria-hidden />
                {new Date(`${ex.data}T12:00:00`).toLocaleDateString("pt-BR")} · Responsável: {ex.responsavel}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setAberto(aberto === ex.id ? null : ex.id)}>
                  <ClipboardList className="size-4" aria-hidden /> {aberto === ex.id ? "Fechar formulários" : "Formulários pré e pós"}
                </Button>
                {podeEditar && (
                  <Button size="sm" variant="ghost" onClick={() => deleteExercise(ex.id)}>
                    <Trash2 className="size-4" aria-hidden /> Remover
                  </Button>
                )}
              </div>
              {aberto === ex.id && <Formularios ex={ex} podeEditar={podeEditar} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function Formularios({ ex, podeEditar }: { ex: Exercise; podeEditar: boolean }) {
  const [pre, setPre] = useState(ex.pre ?? { equipes: "", solucoes: "", playbook: "", comunicacao: "", observacoes: "" });
  const [pos, setPos] = useState(
    ex.pos ?? { dataRealizacao: ex.data, concluido: "Sim" as const, melhorias: "", solucoesEfetivas: "", riscosExpostos: "", observacoes: "" },
  );

  return (
    <div className="grid gap-6 border-t border-border pt-4 lg:grid-cols-2">
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Formulário pré-exercício</h3>
        <Campo label="Equipes envolvidas" value={pre.equipes} onChange={(v) => setPre({ ...pre, equipes: v })} disabled={!podeEditar} />
        <Campo label="Soluções e ferramentas previstas" value={pre.solucoes} onChange={(v) => setPre({ ...pre, solucoes: v })} disabled={!podeEditar} />
        <Campo label="Playbook / procedimento aplicado" value={pre.playbook} onChange={(v) => setPre({ ...pre, playbook: v })} disabled={!podeEditar} />
        <Campo label="Plano de comunicação" value={pre.comunicacao} onChange={(v) => setPre({ ...pre, comunicacao: v })} disabled={!podeEditar} />
        <Campo label="Observações" value={pre.observacoes ?? ""} onChange={(v) => setPre({ ...pre, observacoes: v })} disabled={!podeEditar} />
        {podeEditar && (
          <Button size="sm" onClick={() => saveExercisePre(ex.id, pre)}>
            Salvar pré-exercício
          </Button>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Formulário pós-exercício</h3>
        <div className="space-y-2">
          <Label>Data de realização</Label>
          <Input type="date" value={pos.dataRealizacao} disabled={!podeEditar} onChange={(e) => setPos({ ...pos, dataRealizacao: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Exercício concluído conforme planejado?</Label>
          <Select value={pos.concluido} onValueChange={(v) => setPos({ ...pos, concluido: v as typeof pos.concluido })} disabled={!podeEditar}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Sim", "Não", "Parcial"].map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Campo label="Melhorias identificadas" value={pos.melhorias} onChange={(v) => setPos({ ...pos, melhorias: v })} disabled={!podeEditar} />
        <Campo label="Soluções que se mostraram efetivas" value={pos.solucoesEfetivas} onChange={(v) => setPos({ ...pos, solucoesEfetivas: v })} disabled={!podeEditar} />
        <Campo label="Riscos expostos pelo exercício" value={pos.riscosExpostos} onChange={(v) => setPos({ ...pos, riscosExpostos: v })} disabled={!podeEditar} />
        <Campo label="Observações" value={pos.observacoes ?? ""} onChange={(v) => setPos({ ...pos, observacoes: v })} disabled={!podeEditar} />
        {podeEditar && (
          <Button size="sm" onClick={() => saveExercisePos(ex.id, pos)}>
            Salvar pós-exercício
          </Button>
        )}
      </section>
    </div>
  );
}

function Campo({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea rows={2} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
