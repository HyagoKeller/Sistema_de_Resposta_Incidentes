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
    <div className="relative flex min-h-screen flex-col items-center justify-center gov-deep text-primary-foreground">
      <div className="absolute inset-0 gov-grid opacity-60" aria-hidden />
      <div className="fixed top-0 left-0 right-0 h-1.5 gov-stripe" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-lg px-5 py-12">
        <section className="text-center">
          <div className="relative mx-auto inline-flex overflow-hidden rounded-sm">
            <img
              src={aguLogo.url}
              alt="Brasão da Advocacia-Geral da União"
              className="h-16 w-auto"
              width={128}
              height={64}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary to-primary-dark"
              style={{ mixBlendMode: "color", opacity: 0.92 }}
              aria-hidden
            />
          </div>

          <div className="mt-4 space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground/70">
              Advocacia-Geral da União
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/50">
              Departamento de Segurança da Informação
            </p>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-4xl">
            Sistema de Resposta <span className="text-warning">a Incidentes</span>
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/75">
            Registro, condução e documentação de incidentes de Segurança da Informação e Privacidade, em conformidade
            com o PRI/AGU, o art. 48 da LGPD e a Resolução CD/ANPD nº 2/2022.
          </p>
        </section>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, k: "7 fases", v: "Checklist validado" },
            { icon: ScrollText, k: "Art. 48", v: "ANPD pré-preenchido" },
            { icon: Activity, k: "24h / 3 dias", v: "SLAs monitorados" },
          ].map(({ icon: Icon, k, v }) => (
            <div
              key={k}
              className="rounded-sm border border-primary-foreground/10 bg-primary-foreground/[0.05] p-3 text-center backdrop-blur-sm"
            >
              <Icon className="mx-auto size-4 text-warning" aria-hidden />
              <dt className="mt-2 text-xs font-bold text-primary-foreground">{k}</dt>
              <dd className="mt-0.5 text-[11px] leading-snug text-primary-foreground/60">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-6 overflow-hidden rounded-md border border-primary-foreground/10 bg-primary-foreground/[0.04] shadow-gov backdrop-blur-md">
          <div className="h-1 gov-stripe" aria-hidden />
          <div className="p-5">
            <h2 className="text-center text-base font-bold text-primary-foreground">Acesso institucional</h2>
            <p className="mt-1 text-center text-xs text-primary-foreground/65">
              O perfil é atribuído automaticamente pelos grupos do diretório corporativo após a autenticação.
            </p>

            <Tabs defaultValue="sso" className="mt-5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sso">Microsoft 365</TabsTrigger>
                <TabsTrigger value="local">Conta local</TabsTrigger>
              </TabsList>

              <TabsContent value="sso" className="space-y-3 pt-4">
                <p className="text-xs text-primary-foreground/70">
                  Autenticação federada via Azure AD (OAuth2/OIDC) com escopos mínimos{" "}
                  <code className="text-[10px]">openid profile email User.Read</code>.
                </p>
                <Button className="w-full" size="default" onClick={() => entrar("SSO Microsoft 365", "Servidor AGU")}>
                  <KeyRound className="size-4" aria-hidden /> Entrar com Microsoft 365
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </TabsContent>

              <TabsContent value="local" className="space-y-3 pt-4">
                {!etapaMfa ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="usuario" className="text-xs">
                        Usuário Rede AGU
                      </Label>
                      <Input
                        id="usuario"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        placeholder="ex.: joao.silva"
                        autoComplete="username"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="senha" className="text-xs">
                        Senha
                      </Label>
                      <Input
                        id="senha"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••••"
                        className="h-9"
                      />
                    </div>
                    {erro && <p className="text-xs font-medium text-destructive">{erro}</p>}
                    <Button
                      className="w-full"
                      size="default"
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
                    <p className="text-[11px] text-primary-foreground/55">
                      Senha forte, expiração periódica, bloqueio por tentativas e troca obrigatória no primeiro acesso.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 rounded-sm border border-primary-foreground/10 bg-primary-foreground/[0.05] p-2.5 text-xs">
                      <Smartphone className="size-4 text-warning" aria-hidden />
                      Informe o código de 6 dígitos do seu autenticador (TOTP).
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="totp" className="text-xs">
                        Código MFA
                      </Label>
                      <Input id="totp" inputMode="numeric" maxLength={6} placeholder="000000" className="h-9" />
                    </div>
                    <Button
                      className="w-full"
                      size="default"
                      onClick={() => entrar("Conta local + MFA", usuario || "Usuário local")}
                    >
                      Validar e entrar
                    </Button>
                    <Button variant="ghost" className="w-full" size="sm" onClick={() => setEtapaMfa(false)}>
                      Voltar
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-primary-foreground/10 pt-3 text-[11px] text-primary-foreground/55">
              <span>Suporte: AGU Serviços</span>
              <span className="hover:text-primary-foreground/80 cursor-pointer transition-colors">Esqueceu sua senha?</span>
            </div>
          </div>
        </section>

        <p className="mx-auto mt-6 flex max-w-md items-start justify-center gap-2 text-center text-[11px] text-primary-foreground/55">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Acesso monitorado e registrado em trilha de auditoria. Ambiente de demonstração — não insira dados reais de
          titulares.
        </p>
      </div>
    </div>
  );
}
