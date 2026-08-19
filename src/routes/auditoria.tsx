import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRole } from "@/lib/sri-schema";
import { useStore } from "@/lib/sri-store";

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: "Trilha de auditoria - SRI/AGU" },
      { name: "description", content: "Registro append-only de logins, alterações de campos, transições de fase, geração de documentos e acessos a dados pessoais." },
      { property: "og:title", content: "Trilha de auditoria - SRI/AGU" },
      { property: "og:description", content: "Evidência probatória das ações realizadas no sistema de resposta a incidentes." },
    ],
  }),
  component: Auditoria,
});

function Auditoria() {
  const { incidents, auditoriaGlobal } = useStore();
  const [busca, setBusca] = useState("");

  const todos = [...auditoriaGlobal, ...incidents.flatMap((i) => i.auditoria)].sort((a, b) => b.ts.localeCompare(a.ts));
  const filtrados = todos.filter((a) => `${a.acao} ${a.entidade} ${a.ator} ${a.detalhe ?? ""}`.toLowerCase().includes(busca.toLowerCase()));

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-primary-dark">Trilha de auditoria</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 text-success" aria-hidden />
        Registro append-only, imutável, com retenção mínima sugerida de 5 anos (RNF-011).
      </p>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input className="pl-9" placeholder="Buscar por ação, entidade ou ator" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar na auditoria" />
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/hora</TableHead>
              <TableHead>Ator</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.slice(0, 200).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="whitespace-nowrap text-xs">{new Date(a.ts).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-xs font-medium">{a.ator}</TableCell>
                <TableCell className="text-xs">{getRole(a.papel).nome}</TableCell>
                <TableCell className="text-xs font-semibold text-primary">{a.acao}</TableCell>
                <TableCell className="text-xs">{a.entidade}</TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{a.detalhe ?? "-"}</TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">{a.ip}</TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum evento registrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
