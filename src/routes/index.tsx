import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Lock, ShieldCheck, ScrollText, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoleId } from "@/lib/sri-schema";
import { login } from "@/lib/sri-store";
import aguLogo from "@/assets/agu-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SRI/AGU — Acesso ao Sistema de Resposta a Incidentes" },
      { name: "description", content: "Acesso institucional ao Sistema de Resposta a Incidentes de Segurança da Informação e Privacidade da AGU, com SSO Microsoft 365 e Google Workspace." },
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.8H12z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();

  const entrar = (metodo: "SSO Microsoft 365" | "SSO Google Workspace", nome: string) => {
    login({
      nome,
      email: `${nome.toLowerCase().replace(/\s+/g, ".")}@agu.gov.br`,
      papel: perfilDoDiretorio(nome),
      metodo,
    });
    void navigate({ to: "/painel" });
  };

  return (
    <div className="relative flex min-h-screen flex-col gov-deep text-primary-foreground">
      <div className="absolute inset-0 gov-grid opacity-60" aria-hidden />
      <div className="fixed top-0 left-0 right-0 h-1.5 gov-stripe" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 px-5 py-5 lg:flex-row lg:items-center lg:gap-12 lg:py-10">
        {/* Coluna institucional */}
        <section className="text-center lg:text-left">
          <div className="relative inline-flex overflow-hidden rounded-sm">
            <img
              src={aguLogo.url}
              alt="Brasão da Advocacia-Geral da União"
              className="h-12 w-auto"
              width={96}
              height={48}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary to-primary-dark"
              style={{ mixBlendMode: "color", opacity: 0.92 }}
              aria-hidden
            />
          </div>

          <div className="mt-2 space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground/80">
              Advocacia-Geral da União
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/55">
              Departamento de Segurança da Informação
            </p>
          </div>

          <h1 className="mt-3 text-xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-2xl">
            Sistema de Resposta <span className="text-warning">a Incidentes</span>
          </h1>

          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-primary-foreground/80 mx-auto lg:mx-0">
            Registro, condução e documentação de incidentes de Segurança da Informação e Privacidade.
          </p>

          <dl className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, k: "7 fases", v: "Checklist validado" },
              { icon: ScrollText, k: "Art. 48", v: "ANPD pré-preenchido" },
              { icon: Activity, k: "24h / 3 dias", v: "SLAs monitorados" },
            ].map(({ icon: Icon, k, v }) => (
              <div
                key={k}
                className="rounded-sm border border-primary-foreground/10 bg-primary-foreground/[0.05] p-2 text-center backdrop-blur-sm"
              >
                <Icon className="mx-auto size-3.5 text-warning" aria-hidden />
                <dt className="mt-1 text-[11px] font-bold text-primary-foreground">{k}</dt>
                <dd className="mt-0.5 text-[10px] leading-snug text-primary-foreground/65">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Coluna de acesso */}
        <div className="mx-auto w-full max-w-xs">
          <section className="overflow-hidden rounded-md border border-primary-foreground/10 bg-primary-foreground/[0.04] shadow-gov backdrop-blur-md">
            <div className="h-1 gov-stripe" aria-hidden />
            <div className="p-3.5">
              <h2 className="text-center text-sm font-bold text-primary-foreground">Acesso institucional</h2>
              <p className="mt-1 text-center text-[11px] text-primary-foreground/70">
                Perfil atribuído automaticamente pelo diretório corporativo.
              </p>

              <div className="mt-3 space-y-2">
                <Button className="w-full" size="sm" onClick={() => entrar("SSO Microsoft 365", "Servidor AGU")}>
                  <KeyRound className="size-3.5" aria-hidden /> Entrar com Microsoft 365
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
                <Button
                  className="w-full bg-white text-black hover:bg-white/90"
                  size="sm"
                  onClick={() => entrar("SSO Google Workspace", "Servidor AGU")}
                >
                  <GoogleIcon className="size-3.5" /> Entrar com Google
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              </div>

              <p className="mt-2 text-[10px] text-primary-foreground/60">
                OAuth2/OIDC com escopos mínimos <code className="text-[10px]">openid profile email</code>.
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-primary-foreground/10 pt-2 text-[10px] text-primary-foreground/60">
                <span>Suporte: AGU Serviços</span>
                <span className="hover:text-primary-foreground/85 cursor-pointer transition-colors">Ajuda</span>
              </div>
            </div>
          </section>

          <p className="mx-auto mt-3 flex max-w-xs items-start justify-center gap-1.5 text-center text-[10px] text-primary-foreground/60">
            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
            Acesso monitorado em trilha de auditoria. Não insira dados reais de titulares.
          </p>
        </div>
      </div>
    </div>
  );
}
