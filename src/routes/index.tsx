import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Smartphone, Lock, ShieldCheck, ScrollText, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RoleId } from "@/lib/sri-schema";
import { login } from "@/lib/sri-store";
import aguLogo from "@/assets/agu-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SRI/AGU — Acesso ao Sistema de Resposta a Incidentes" },
      { name: "description", content: "Acesso institucional ao Sistema de Resposta a Incidentes de Segurança da Informação e Privacidade da AGU, com SSO Microsoft 365 e conta local com MFA." },
      { property: "og:title", content: "SRI/AGU — Sistema de Resposta a Incidentes" },
      { property: "og:description", content: "Registro, workflow das 7 fases do PRI/AGU e Formulário ANPD (art. 48 LGPD) em um só lugar." },
    ],
  }),
  component: LoginPage,
});

/**
 * O perfil NÃO é escolhido pelo usuário (falha de segurança): é derivado do
 * diretório corporativo / grupos do Azure AD após a autenticação.
 */
function perfilDoDiretorio(identidade: string): RoleId {
  const chave = identidade.toLowerCase();
  if (chave.includes("dpo") || chave.includes("encarregado")) return "dpo";
  if (chave.includes("soc")) return "soc";
  if (chave.includes("gestor")) return "gestor_si";
  if (chave.includes("juridico") || chave.includes("jurídico")) return "juridico";
  if (chave.includes("admin")) return "admin";
  return "etir";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [etapaMfa, setEtapaMfa] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [erro, setErro] = useState("");

  const entrar = (metodo: "SSO Microsoft 365" | "Conta local + MFA", nome: string) => {
    login({
      nome,
      email: `${nome.toLowerCase().replace(/\s+/g, ".")}@agu.gov.br`,
      papel: perfilDoDiretorio(nome),
      metodo,
    });
    void navigate({ to: "/painel" });
  };

  return (
    <div className="relative min-h-screen gov-deep text-primary-foreground">
      <div className="absolute inset-0 gov-grid opacity-60" aria-hidden />
      <div className="h-1.5 gov-stripe" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <section>
          <div className="flex items-center gap-4">
            <img
              src={aguLogo.url}
              alt="Brasão da Advocacia-Geral da União"
              className="h-14 w-auto rounded-sm shadow-gov-lg"
              width={112}
              height={56}
            />
            <div className="border-l border-primary-foreground/25 pl-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground/70">
                Advocacia-Geral da União
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/50">
                Departamento de Segurança da Informação
              </p>
            </div>
          </div>

          <h1 className="mt-9 text-4xl font-extrabold leading-[1.08] tracking-tight text-primary-foreground sm:text-5xl">
            Sistema de Resposta
            <span className="block text-warning">a Incidentes</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-primary-foreground/75">
            Ambiente institucional para registro, condução e documentação de incidentes de Segurança da Informação e
            Privacidade, em conformidade com o Plano de Resposta a Incidentes (PRI/AGU), o art. 48 da LGPD e a
            Resolução CD/ANPD nº 2/2022.
          </p>

          <dl className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, k: "7 fases", v: "Checklist com transição validada" },
              { icon: ScrollText, k: "Art. 48", v: "Formulário ANPD pré-preenchido" },
              { icon: Activity, k: "24h / 3 dias", v: "SLAs de DPO e ANPD monitorados" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="rounded-sm border border-primary-foreground/15 bg-primary-foreground/[0.06] p-4 backdrop-blur-sm">
                <Icon className="size-5 text-warning" aria-hidden />
                <dt className="mt-3 text-sm font-bold text-primary-foreground">{k}</dt>
                <dd className="mt-0.5 text-xs leading-snug text-primary-foreground/65">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-9 flex items-start gap-2 text-xs text-primary-foreground/55">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Acesso monitorado e registrado em trilha de auditoria. Ambiente de demonstração — não insira dados reais de
            titulares (RNF-014).
          </p>
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-surface text-foreground shadow-gov-lg">
          <div className="h-1.5 gov-stripe" aria-hidden />
          <div className="p-7">
            <h2 className="text-lg font-bold text-primary-dark">Acesso institucional</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O perfil de acesso é atribuído automaticamente pelos grupos do diretório corporativo após a autenticação.
            </p>

            <Tabs defaultValue="sso" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sso">SSO Microsoft 365</TabsTrigger>
                <TabsTrigger value="local">Conta local</TabsTrigger>
              </TabsList>

              <TabsContent value="sso" className="space-y-4 pt-5">
                <p className="text-sm text-muted-foreground">
                  Autenticação federada via Azure AD (OAuth2/OIDC) com escopos mínimos{" "}
                  <code className="text-xs">openid profile email User.Read</code>.
                </p>
                <Button className="w-full" size="lg" onClick={() => entrar("SSO Microsoft 365", "Servidor AGU")}>
                  <KeyRound className="size-4" aria-hidden /> Entrar com Microsoft 365
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </TabsContent>

              <TabsContent value="local" className="space-y-4 pt-5">
                {!etapaMfa ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="usuario">Usuário Rede AGU</Label>
                      <Input
                        id="usuario"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        placeholder="ex.: joao.silva"
                        autoComplete="username"
                      />
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
                      Senha forte, expiração periódica, bloqueio por tentativas e troca obrigatória no primeiro acesso
                      (RF-012).
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

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>Suporte: Central de Serviços de TI</span>
              <span>Esqueceu sua senha?</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
