import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Lock, ShieldCheck, ScrollText, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoleId } from "@/lib/sri-schema";
import { login } from "@/lib/sri-store";
import aguLogo from "@/assets/agu-logo-1024.png.asset.json";

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

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-5 py-4 lg:gap-6 lg:py-6">
        {/* Coluna institucional */}
        <section className="text-center">
          <div className="relative mx-auto inline-flex items-center justify-center overflow-hidden rounded-lg bg-white/95 p-2 shadow-gov">
            <img
              src={aguLogo.url}
              alt="Brasão da Advocacia-Geral da União"
              className="h-20 w-auto scale-110 sm:h-24"
              width={192}
              height={96}
            />
          </div>

          <div className="mt-2 space-y-0.5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary-foreground/90 sm:text-base">
              Advocacia-Geral da União
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/65 sm:text-sm">
              Departamento de Segurança da Informação
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-3xl lg:text-4xl">
            Sistema de Resposta <span className="text-warning">a Incidentes</span>
          </h1>

          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base mx-auto">
            Registro, condução e documentação de incidentes de Segurança da Informação e Privacidade.
          </p>

          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
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
                <dt className="mt-1 text-xs font-bold text-primary-foreground">{k}</dt>
                <dd className="mt-0.5 text-[10px] leading-snug text-primary-foreground/65">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Coluna de acesso */}
        <div className="mx-auto w-full max-w-[18rem]">
          <section className="overflow-hidden rounded-md border border-primary-foreground/10 bg-primary-foreground/[0.04] shadow-gov backdrop-blur-md">
            <div className="h-1 gov-stripe" aria-hidden />
            <div className="p-3">
              <h2 className="text-center text-xs font-bold text-primary-foreground">Acesso institucional</h2>
              <p className="mt-0.5 text-center text-[10px] text-primary-foreground/70">
                Perfil atribuído pelo diretório corporativo.
              </p>

              <div className="mt-2 space-y-1.5">
                <Button className="w-full" size="sm" onClick={() => entrar("SSO Microsoft 365", "Servidor AGU")}>
                  <KeyRound className="size-3.5" aria-hidden /> Microsoft 365
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
                <Button
                  className="w-full bg-white text-black hover:bg-white/90"
                  size="sm"
                  onClick={() => entrar("SSO Google Workspace", "Servidor AGU")}
                >
                  <GoogleIcon className="size-3.5" /> Google
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              </div>

              <p className="mt-1.5 text-[10px] text-primary-foreground/60">
                OAuth2/OIDC <code className="text-[10px]">openid profile email</code>.
              </p>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-primary-foreground/10 pt-1.5 text-[10px] text-primary-foreground/60">
                <span>Suporte: AGU Serviços</span>
                <span className="hover:text-primary-foreground/85 cursor-pointer transition-colors">Ajuda</span>
              </div>
            </div>
          </section>

          <p className="mx-auto mt-2 flex max-w-[18rem] items-start justify-center gap-1.5 text-center text-[10px] text-primary-foreground/60">
            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
            Acesso monitorado em trilha de auditoria.
          </p>
        </div>
      </div>
    </div>
  );
}
