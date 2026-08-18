import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CriticidadeBadge({ value }: { value?: string | undefined }) {
  if (!value) return <Badge variant="outline">Não classificado</Badge>;
  const map: Record<string, string> = {
    Baixa: "bg-muted text-muted-foreground",
    Média: "bg-info/15 text-info",
    Alta: "bg-warning/30 text-warning-foreground",
    Crítica: "bg-destructive text-destructive-foreground",
  };
  return <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", map[value] ?? "bg-muted")}>{value}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Em andamento": "bg-primary/10 text-primary",
    Encerrado: "bg-success/15 text-success",
    "Fast-track": "bg-destructive/15 text-destructive",
  };
  return <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", map[status] ?? "bg-muted")}>{status}</span>;
}

export function SlaBadge({ status }: { status: "ok" | "pendente" | "vencido" }) {
  const map = {
    ok: "bg-success/15 text-success",
    pendente: "bg-warning/30 text-warning-foreground",
    vencido: "bg-destructive text-destructive-foreground",
  } as const;
  const label = { ok: "Cumprido", pendente: "Em prazo", vencido: "Vencido" }[status];
  return <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase", map[status])}>{label}</span>;
}
