import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Server, ShieldCheck, KeyRound, CheckCircle2, Copy, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações - SRI/AGU" },
      { name: "description", content: "Provisionamento da aplicação SRI/AGU (identidade federada, domínio, ambiente) e configuração do MFA local (TOTP)." },
      { property: "og:title", content: "Configurações do SRI/AGU" },
      { property: "og:description", content: "Provisione a aplicação e configure o MFA local do Sistema de Resposta a Incidentes." },
    ],
  }),
  component: ConfiguracoesPage,
});

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
};

const CHAVE = "sri.config";

function Card({ icon: Icon, titulo, descricao, children }: { icon: typeof Server; titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface shadow-gov">
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

  useEffect(() => {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      try {
        setCfg({ ...PADRAO, ...(JSON.parse(bruto) as Partial<Config>) });
      } catch {
        /* ignora configuração inválida */
      }
    }
  }, []);

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setCfg((c) => ({ ...c, [k]: v }));

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

        <div className="flex justify-end">
          <Button onClick={salvar}>
            <CheckCircle2 className="size-4" aria-hidden /> Salvar configurações
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
