import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/sri/AppShell";
import { CriticidadeBadge, StatusBadge } from "@/components/sri/Badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { progressoGeral, useIncidents } from "@/lib/sri-store";

export const Route = createFileRoute("/incidentes/")({
  head: () => ({
    meta: [
      { title: "Incidentes registrados — SRI/AGU" },
      { name: "description", content: "Lista de incidentes de segurança da informação e privacidade com fase atual, criticidade e progresso do checklist." },
      { property: "og:title", content: "Incidentes registrados — SRI/AGU" },
      { property: "og:description", content: "Acompanhe o ciclo de vida de cada incidente nas 7 fases do PRI/AGU." },
    ],
  }),
  component: ListaIncidentes,
});

function ListaIncidentes() {
  const incidents = useIncidents();
  const [busca, setBusca] = useState("");

  const filtrados = incidents.filter((i) =>
    `${i.codigo} ${String(i.data["titulo"] ?? "")} ${String(i.data["tipo_incidente"] ?? "")}`.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Incidentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtrados.length} registro(s) visíveis para o seu perfil.</p>
        </div>
        <Button asChild>
          <Link to="/incidentes/novo">
            <Plus className="size-4" aria-hidden /> Registrar incidente
          </Link>
        </Button>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input className="pl-9" placeholder="Buscar por código, título ou tipo" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar incidentes" />
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Criticidade</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs font-bold text-primary">
                  <Link to="/incidentes/$id" params={{ id: i.id }} className="hover:underline">
                    {i.codigo}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs">
                  <Link to="/incidentes/$id" params={{ id: i.id }} className="text-sm font-medium hover:underline">
                    {String(i.data["titulo"] ?? "Sem título")}
                  </Link>
                  {i.simulacao && (
                    <Badge variant="outline" className="ml-2">
                      Simulação
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <CriticidadeBadge value={i.data["criticidade"] as string} />
                </TableCell>
                <TableCell className="text-sm">{i.faseAtual}/7</TableCell>
                <TableCell className="w-40">
                  <Progress value={progressoGeral(i)} className="h-2" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={i.status} />
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum incidente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
