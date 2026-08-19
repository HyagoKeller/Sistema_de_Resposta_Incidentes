import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Server, ShieldCheck, KeyRound, CheckCircle2, Copy, RefreshCw, Users, Mail, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações - SRI/AGU" },
      { name: "description", content: "Provisionamento da aplicação SRI/AGU, perfis de acesso granulares, notificações por e-mail e MFA local (TOTP)." },
      { property: "og:title", content: "Configurações do SRI/AGU" },
      { property: "og:description", content: "Provisione a aplicação, defina perfis de acesso granulares e as notificações por e-mail do Sistema de Resposta a Incidentes." },
    ],
  }),
  component: ConfiguracoesPage,
});

/* ------------------------------ Perfis de acesso ------------------------------ */

export const PERFIS = ["Administrador", "Gestor", "Colaborador"] as const;
export type Perfil = (typeof PERFIS)[number];

const MODULOS = [
  { id: "incidentes", label: "Incidentes (7 fases)" },
  { id: "anpd", label: "Formulário ANPD" },
  { id: "notificacoes", label: "SLAs e notificações" },
  { id: "exercicios", label: "Exercícios de resposta" },
  { id: "relatorios", label: "Relatórios e exportações" },
  { id: "dashboards", label: "Dashboards e métricas" },
  { id: "auditoria", label: "Trilha de auditoria" },
  { id: "configuracoes", label: "Configurações do sistema" },
] as const;

const ACOES = [
  { id: "ler", label: "Leitura" },
  { id: "inserir", label: "Inserção" },
  { id: "editar", label: "Edição" },
  { id: "excluir", label: "Exclusão" },
  { id: "aprovar", label: "Aprovação" },
  { id: "exportar", label: "Exportação" },
] as const;

type Acao = (typeof ACOES)[number]["id"];
type Permissoes = Record<string, Acao[]>;

interface PerfilCfg {
  descricao: string;
  escopo: "Segurança" | "Privacidade" | "Segurança e Privacidade";
  verPii: boolean;
  permissoes: Permissoes;
}

const TODAS: Acao[] = ACOES.map((a) => a.id);

const PERFIS_PADRAO: Record<Perfil, PerfilCfg> = {
  Administrador: {
    descricao: "Acesso integral ao sistema, incluindo provisionamento, perfis e auditoria.",
    escopo: "Segurança e Privacidade",
    verPii: true,
    permissoes: Object.fromEntries(MODULOS.map((m) => [m.id, [...TODAS]])),
  },
  Gestor: {
    descricao: "Conduz e aprova o tratamento na sua trilha (segurança e/ou privacidade).",
    escopo: "Segurança e Privacidade",
    verPii: true,
    permissoes: {
      incidentes: ["ler", "inserir", "editar", "aprovar", "exportar"],
      anpd: ["ler", "inserir", "editar", "aprovar", "exportar"],
      notificacoes: ["ler", "editar", "aprovar"],
      exercicios: ["ler", "inserir", "editar", "exportar"],
      relatorios: ["ler", "exportar"],
      dashboards: ["ler", "exportar"],
      auditoria: ["ler"],
      configuracoes: [],
    },
  },
  Colaborador: {
    descricao: "Registra e atualiza informações designadas, sem aprovar nem excluir.",
    escopo: "Segurança",
    verPii: false,
    permissoes: {
      incidentes: ["ler", "inserir", "editar"],
      anpd: ["ler"],
      notificacoes: ["ler"],
      exercicios: ["ler", "inserir"],
      relatorios: ["ler"],
      dashboards: ["ler"],
      auditoria: [],
      configuracoes: [],
    },
  },
};

/* --------------------------- Notificações por e-mail --------------------------- */

const EVENTOS_EMAIL = [
  { id: "novoIncidente", label: "Novo incidente registrado", hint: "Enviado ao abrir um registro em qualquer trilha." },
  { id: "mudancaFase", label: "Mudança de fase", hint: "Transições do fluxo de 7 fases, inclusive fast-track." },
  { id: "criticidadeAlta", label: "Criticidade alta ou crítica", hint: "Acionamento imediato do gestor responsável." },
  { id: "slaRisco", label: "SLA em risco", hint: "Disparado no limiar configurado antes do vencimento." },
  { id: "slaEstourado", label: "SLA estourado", hint: "Notificação de descumprimento com escalonamento." },
  { id: "anpd", label: "Comunicação à ANPD", hint: "Prazo de 3 dias úteis e envio do formulário." },
  { id: "exercicios", label: "Exercícios de resposta", hint: "Lembrete de exercício planejado e pendência de avaliação." },
  { id: "resumoDiario", label: "Resumo diário", hint: "Consolidado de incidentes abertos e prazos do dia." },
] as const;

type EventoEmail = (typeof EVENTOS_EMAIL)[number]["id"];

interface EmailCfg {
  ativo: boolean;
  remetente: string;
  copiaEncarregado: string;
  horasAntesSla: number;
  eventos: Record<EventoEmail, Perfil[]>;
}

const EMAIL_PADRAO: EmailCfg = {
  ativo: true,
  remetente: "sri@agu.gov.br",
  copiaEncarregado: "encarregado@agu.gov.br",
  horasAntesSla: 6,
  eventos: {
    novoIncidente: ["Administrador", "Gestor"],
    mudancaFase: ["Gestor"],
    criticidadeAlta: ["Administrador", "Gestor"],
    slaRisco: ["Administrador", "Gestor"],
    slaEstourado: ["Administrador", "Gestor"],
    anpd: ["Administrador", "Gestor"],
    exercicios: ["Gestor", "Colaborador"],
    resumoDiario: ["Administrador"],
  },
};

function Card({ icon: Icon, titulo, descricao, children, className }: { icon: typeof Server; titulo: string; descricao: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-md border border-border bg-surface shadow-gov ${className ?? ""}`}>
      <div className="h-1 gov-stripe" aria-hidden />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-sm gov-plum text-primary-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground">{titulo}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">{children}</div>
      </div>
    </section>
  );
}

interface Config {
  orgao: string;
  dominio: string;
  ambiente: string;
  tenantId: string;
  clientId: string;
  googleClientId: string;
  ssoMicrosoft: boolean;
  ssoGoogle: boolean;
  provisionamentoScim: boolean;
  mfaObrigatorio: boolean;
  mfaDigitos: number;
  mfaJanela: number;
  mfaEmissor: string;
  codigosBackup: boolean;
  perfis: Record<Perfil, PerfilCfg>;
  email: EmailCfg;
}

const PADRAO: Config = {
  orgao: "Advocacia-Geral da União",
  dominio: "agu.gov.br",
  ambiente: "Homologação",
  tenantId: "",
  clientId: "",
  googleClientId: "",
  ssoMicrosoft: true,
  ssoGoogle: true,
  provisionamentoScim: false,
  mfaObrigatorio: true,
  mfaDigitos: 6,
  mfaJanela: 30,
  mfaEmissor: "SRI AGU",
  codigosBackup: true,
  perfis: PERFIS_PADRAO,
  email: EMAIL_PADRAO,
};

const CHAVE = "sri.config";


function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-sm border border-border/70 bg-accent/20 p-3">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function ConfiguracoesPage() {
  const [cfg, setCfg] = useState<Config>(PADRAO);
  const [segredo, setSegredo] = useState("");
  const [perfilAtivo, setPerfilAtivo] = useState<Perfil>("Administrador");

  useEffect(() => {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      try {
        const salvo = JSON.parse(bruto) as Partial<Config>;
        setCfg({
          ...PADRAO,
          ...salvo,
          perfis: { ...PADRAO.perfis, ...(salvo.perfis ?? {}) },
          email: { ...PADRAO.email, ...(salvo.email ?? {}), eventos: { ...PADRAO.email.eventos, ...(salvo.email?.eventos ?? {}) } },
        });
      } catch {
        /* ignora configuração inválida */
      }
    }
  }, []);

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const perfil = cfg.perfis[perfilAtivo];

  const setPerfil = (patch: Partial<PerfilCfg>) =>
    setCfg((c) => ({ ...c, perfis: { ...c.perfis, [perfilAtivo]: { ...c.perfis[perfilAtivo], ...patch } } }));

  const togglePermissao = (modulo: string, acao: Acao) => {
    const atual = perfil.permissoes[modulo] ?? [];
    const novo = atual.includes(acao) ? atual.filter((a) => a !== acao) : [...atual, acao];
    setPerfil({ permissoes: { ...perfil.permissoes, [modulo]: novo } });
  };

  const toggleEvento = (evento: EventoEmail, p: Perfil) =>
    setCfg((c) => {
      const atual = c.email.eventos[evento] ?? [];
      const novo = atual.includes(p) ? atual.filter((x) => x !== p) : [...atual, p];
      return { ...c, email: { ...c.email, eventos: { ...c.email.eventos, [evento]: novo } } };
    });


  const salvar = () => {
    localStorage.setItem(CHAVE, JSON.stringify(cfg));
    toast.success("Configurações salvas", { description: "Parâmetros aplicados ao ambiente de demonstração." });
  };

  const gerarSegredo = () => {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let s = "";
    for (let i = 0; i < 32; i++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
    setSegredo(s);
    toast.success("Segredo TOTP gerado", { description: "Cadastre no autenticador antes de sair da tela." });
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Provisionamento da aplicação e parâmetros de autenticação multifator local.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            icon={Server}
            titulo="Provisionar aplicação"
            descricao="Identificação do órgão, ambiente e registro das aplicações de identidade federada."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="orgao" className="text-xs">Órgão</Label>
                <Input id="orgao" className="h-9" value={cfg.orgao} onChange={(e) => set("orgao", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dominio" className="text-xs">Domínio institucional</Label>
                <Input id="dominio" className="h-9" value={cfg.dominio} onChange={(e) => set("dominio", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ambiente" className="text-xs">Ambiente</Label>
                <Input id="ambiente" className="h-9" value={cfg.ambiente} onChange={(e) => set("ambiente", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant" className="text-xs">Tenant ID (Azure AD)</Label>
                <Input id="tenant" className="h-9" placeholder="00000000-0000-0000-0000-000000000000" value={cfg.tenantId} onChange={(e) => set("tenantId", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client" className="text-xs">Client ID Microsoft 365</Label>
                <Input id="client" className="h-9" value={cfg.clientId} onChange={(e) => set("clientId", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gclient" className="text-xs">Client ID Google Workspace</Label>
                <Input id="gclient" className="h-9" value={cfg.googleClientId} onChange={(e) => set("googleClientId", e.target.value)} />
              </div>
            </div>

            <Toggle
              label="SSO Microsoft 365"
              hint="Login federado via Azure AD (OAuth2/OIDC), escopos openid profile email User.Read."
              checked={cfg.ssoMicrosoft}
              onChange={(v) => set("ssoMicrosoft", v)}
            />
            <Toggle
              label="SSO Google Workspace"
              hint="Login federado via Google Identity, escopos openid profile email."
              checked={cfg.ssoGoogle}
              onChange={(v) => set("ssoGoogle", v)}
            />
            <Toggle
              label="Provisionamento automático (SCIM)"
              hint="Criação, atualização e desativação de contas e papéis a partir dos grupos do diretório."
              checked={cfg.provisionamentoScim}
              onChange={(v) => set("provisionamentoScim", v)}
            />

            <div className="rounded-sm border border-border/70 bg-accent/20 p-3">
              <p className="text-[11px] font-semibold text-foreground">URL de redirecionamento (callback)</p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-sm bg-background px-2 py-1.5 text-[11px] text-muted-foreground">
                  https://sri.{cfg.dominio}/auth/callback
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(`https://sri.${cfg.dominio}/auth/callback`);
                    toast.success("URL copiada");
                  }}
                >
                  <Copy className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Copiar</span>
                </Button>
              </div>
            </div>
          </Card>

          <Card
            icon={ShieldCheck}
            titulo="MFA local (TOTP)"
            descricao="Segundo fator para contas locais, usado quando o SSO federado não está disponível."
          >
            <Toggle
              label="Exigir MFA em contas locais"
              hint="Bloqueia o acesso até a validação do código do autenticador."
              checked={cfg.mfaObrigatorio}
              onChange={(v) => set("mfaObrigatorio", v)}
            />
            <Toggle
              label="Códigos de recuperação"
              hint="Gera 10 códigos de uso único para perda do dispositivo autenticador."
              checked={cfg.codigosBackup}
              onChange={(v) => set("codigosBackup", v)}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="digitos" className="text-xs">Dígitos</Label>
                <Input id="digitos" type="number" min={6} max={8} className="h-9" value={cfg.mfaDigitos} onChange={(e) => set("mfaDigitos", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="janela" className="text-xs">Janela (s)</Label>
                <Input id="janela" type="number" min={30} max={60} step={30} className="h-9" value={cfg.mfaJanela} onChange={(e) => set("mfaJanela", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emissor" className="text-xs">Emissor</Label>
                <Input id="emissor" className="h-9" value={cfg.mfaEmissor} onChange={(e) => set("mfaEmissor", e.target.value)} />
              </div>
            </div>

            <div className="rounded-sm border border-border/70 bg-accent/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold text-foreground">Segredo TOTP do autenticador</p>
                <Button variant="outline" size="sm" onClick={gerarSegredo}>
                  <RefreshCw className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Gerar</span>
                </Button>
              </div>
              <code className="mt-2 block truncate rounded-sm bg-background px-2 py-1.5 text-[11px] tracking-wider text-muted-foreground">
                {segredo || "- gere um segredo para cadastrar no aplicativo autenticador -"}
              </code>
              {segredo && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <KeyRound className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
                  otpauth://totp/{encodeURIComponent(cfg.mfaEmissor)}:usuario@{cfg.dominio}?secret={segredo}&digits={cfg.mfaDigitos}&period={cfg.mfaJanela}
                </p>
              )}
            </div>
          </Card>
        </div>

        <Card
          icon={Users}
          titulo="Perfis de acesso"
          descricao="Três perfis institucionais com permissões granulares por módulo: leitura, inserção, edição, exclusão, aprovação e exportação."
        >
          <div className="flex flex-wrap gap-2">
            {PERFIS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPerfilAtivo(p)}
                aria-pressed={perfilAtivo === p}
                className={`rounded-sm border px-3 py-1.5 text-xs font-bold transition ${
                  perfilAtivo === p ? "gov-plum border-transparent text-primary-foreground" : "border-border bg-accent/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => {
                setPerfil(PERFIS_PADRAO[perfilAtivo]);
                toast.success(`Perfil ${perfilAtivo} restaurado ao padrão`);
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> Restaurar padrão
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="desc-perfil" className="text-xs">Descrição do perfil</Label>
              <Input id="desc-perfil" className="h-9" value={perfil.descricao} onChange={(e) => setPerfil({ descricao: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Escopo de atuação</Label>
              <Select value={perfil.escopo} onValueChange={(v) => setPerfil({ escopo: v as PerfilCfg["escopo"] })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Segurança", "Privacidade", "Segurança e Privacidade"].map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Toggle
            label="Visualizar dados pessoais sem mascaramento"
            hint="Acesso a PII é registrado na trilha de auditoria a cada consulta."
            checked={perfil.verPii}
            onChange={(v) => setPerfil({ verPii: v })}
          />

          <div className="overflow-x-auto rounded-sm border border-border/70">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-accent/30">
                <tr>
                  <th scope="col" className="px-3 py-2 font-bold text-foreground">Módulo</th>
                  {ACOES.map((a) => (
                    <th key={a.id} scope="col" className="px-2 py-2 text-center font-semibold text-muted-foreground">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((m) => (
                  <tr key={m.id} className="border-t border-border/60">
                    <th scope="row" className="px-3 py-2 text-left font-medium text-foreground">{m.label}</th>
                    {ACOES.map((a) => (
                      <td key={a.id} className="px-2 py-2 text-center">
                        <Checkbox
                          checked={(perfil.permissoes[m.id] ?? []).includes(a.id)}
                          onCheckedChange={() => togglePermissao(m.id, a.id)}
                          aria-label={`${a.label} em ${m.label} para ${perfilAtivo}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Perfis são atribuídos pelos grupos do diretório quando o provisionamento automático (SCIM) está ativo.
          </p>
        </Card>

        <Card
          icon={Mail}
          titulo="Notificações por e-mail"
          descricao="Defina o remetente institucional e quais perfis recebem cada evento do fluxo de resposta."
        >
          <Toggle
            label="Habilitar notificações por e-mail"
            hint="Desativa todos os disparos sem perder a configuração de destinatários."
            checked={cfg.email.ativo}
            onChange={(v) => set("email", { ...cfg.email, ativo: v })}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="remetente" className="text-xs">Remetente</Label>
              <Input id="remetente" className="h-9" value={cfg.email.remetente} onChange={(e) => set("email", { ...cfg.email, remetente: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="copia" className="text-xs">Cópia permanente</Label>
              <Input id="copia" className="h-9" value={cfg.email.copiaEncarregado} onChange={(e) => set("email", { ...cfg.email, copiaEncarregado: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="antecedencia" className="text-xs">Aviso de SLA (h antes)</Label>
              <Input
                id="antecedencia"
                type="number"
                min={1}
                max={48}
                className="h-9"
                value={cfg.email.horasAntesSla}
                onChange={(e) => set("email", { ...cfg.email, horasAntesSla: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-sm border border-border/70">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-accent/30">
                <tr>
                  <th scope="col" className="px-3 py-2 font-bold text-foreground">Evento</th>
                  {PERFIS.map((p) => (
                    <th key={p} scope="col" className="px-2 py-2 text-center font-semibold text-muted-foreground">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVENTOS_EMAIL.map((ev) => (
                  <tr key={ev.id} className="border-t border-border/60">
                    <th scope="row" className="px-3 py-2 text-left font-medium text-foreground">
                      {ev.label}
                      <span className="block text-[11px] font-normal text-muted-foreground">{ev.hint}</span>
                    </th>
                    {PERFIS.map((p) => (
                      <td key={p} className="px-2 py-2 text-center">
                        <Checkbox
                          checked={(cfg.email.eventos[ev.id] ?? []).includes(p)}
                          disabled={!cfg.email.ativo}
                          onCheckedChange={() => toggleEvento(ev.id, p)}
                          aria-label={`Notificar ${p} sobre ${ev.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase">Ambiente de demonstração - disparos simulados</Badge>
        </Card>



        <div className="flex justify-end">
          <Button onClick={salvar}>
            <CheckCircle2 className="size-4" aria-hidden /> Salvar configurações
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
