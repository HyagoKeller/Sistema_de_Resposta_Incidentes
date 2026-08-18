import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, KeyRound, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLES, type RoleId } from "@/lib/sri-schema";
import { login } from "@/lib/sri-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SRI/AGU — Acesso ao Sistema de Resposta a Incidentes" },
      { name: "description", content: "Acesso ao Sistema de Resposta a Incidentes de Segurança da Informação e Privacidade da AGU, com SSO Microsoft 365 e conta local com MFA." },
      { property: "og:title", content: "SRI/AGU — Sistema de Resposta a Incidentes" },
      { property: "og:description", content: "Registro, workflow das 7 fases do PRI/AGU e Formulário ANPD (art. 48 LGPD) em um só lugar." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [papel, setPapel] = useState<RoleId>("etir");
  const [etapaMfa, setEtapaMfa] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [erro, setErro] = useState("");

  const entrar = (metodo: "SSO Microsoft 365" | "Conta local + MFA", nome: string) => {
    login({ nome, email: `${nome.toLowerCase().replace(/\s+/g, ".")}@agu.gov.br`, papel, metodo });
    void navigate({ to: "/painel" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1.5 gov-bar" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <section>
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <ShieldCheck className="size-7" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Advocacia-Geral da União</p>
              <h1 className="text-2xl font-bold text-primary-dark">Sistema de Resposta a Incidentes</h1>
            </div>
          </div>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Registro, condução e documentação de incidentes de Segurança da Informação e Privacidade conforme o
            <strong className="text-foreground"> Plano de Resposta a Incidentes (PRI/AGU)</strong>, com geração automática do
            Formulário de Comunicação à ANPD (art. 48 da LGPD).
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Checklist obrigatório em 7 fases com validação bloqueante de transição",
              "Formulário ANPD pré-preenchido a partir das fases 1 a 6",
              "Pseudonimização de titulares e mascaramento de PII por perfil",
              "Trilha de auditoria append-only e SLAs de 24h (DPO) e 3 dias úteis (ANPD)",
            ].map((t) => (
              <li key={t} className="flex gap-2.5 text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                {t}
              </li>
            ))}
          </ul>

          <p className="mt-8 flex items-start gap-2 rounded-sm border-l-4 border-warning bg-warning/10 p-3 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Ambiente de demonstração front-end. Nenhum dado real de titular deve ser inserido (RNF-014).
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface p-6 shadow-gov-lg">
          <h2 className="text-lg font-bold text-primary-dark">Acessar o sistema</h2>
          <p className="mt-1 text-sm text-muted-foreground">Autenticação corporativa ou conta local com MFA obrigatório.</p>

          <div className="mt-5 space-y-2">
            <Label htmlFor="papel">Perfil de acesso (RBAC)</Label>
            <Select value={papel} onValueChange={(v) => setPapel(v as RoleId)}>
              <SelectTrigger id="papel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLES.find((r) => r.id === papel)?.descricao}</p>
          </div>

          <Tabs defaultValue="sso" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sso">SSO Microsoft 365</TabsTrigger>
              <TabsTrigger value="local">Conta local</TabsTrigger>
            </TabsList>

            <TabsContent value="sso" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Autenticação via Azure AD (OAuth2/OIDC) com escopos mínimos <code className="text-xs">openid profile email User.Read</code>. Papéis
                derivados dos grupos do AD (ex.: <em>ETIR-AGU</em>).
              </p>
              <Button className="w-full" size="lg" onClick={() => entrar("SSO Microsoft 365", "Servidor AGU")}>
                <KeyRound className="size-4" aria-hidden /> Entrar com Microsoft 365
              </Button>
            </TabsContent>

            <TabsContent value="local" className="space-y-4 pt-4">
              {!etapaMfa ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="usuario">Usuário</Label>
                    <Input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="nome.sobrenome" autoComplete="username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input id="senha" type="password" autoComplete="current-password" placeholder="••••••••••" />
                  </div>
                  {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      if (!usuario.trim()) {
                        setErro("Informe o usuário para continuar.");
                        return;
                      }
                      setErro("");
                      setEtapaMfa(true);
                    }}
                  >
                    Continuar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Senha forte, expiração periódica, bloqueio por tentativas e troca obrigatória no primeiro acesso (RF-012).
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-sm border border-border bg-muted p-3 text-sm">
                    <Smartphone className="size-4 text-primary" aria-hidden />
                    Informe o código de 6 dígitos do seu autenticador (TOTP).
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totp">Código MFA</Label>
                    <Input id="totp" inputMode="numeric" maxLength={6} placeholder="000000" />
                  </div>
                  <Button className="w-full" size="lg" onClick={() => entrar("Conta local + MFA", usuario || "Usuário local")}>
                    Validar e entrar
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setEtapaMfa(false)}>
                    Voltar
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
