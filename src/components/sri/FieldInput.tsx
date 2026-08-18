import { Plus, Trash2, Lock, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { FieldDef } from "@/lib/sri-schema";
import { TIMEZONE } from "@/lib/sri-store";
import { cn } from "@/lib/utils";

export function maskPii(value: string): string {
  return value
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF mascarado]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[e-mail mascarado]")
    .replace(/\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-zà-ú]{2,})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-zà-ú]{2,})\b/g, (_m, _a, _b, offset: number) => `titular #${String(offset).padStart(3, "0")}`);
}

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
  /** Usuário autorizado a ver dados pessoais não pseudonimizados. */
  podeVerPII: boolean;
  invalid?: boolean;
}

export function FieldInput({ field, value, onChange, disabled, podeVerPII, invalid }: Props) {
  const mascarado = Boolean(field.pii) && !podeVerPII;
  const required = field.required;

  const label = (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={field.id} className={cn("text-sm font-semibold", invalid && "text-destructive")}>
        {field.label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {field.pii && (
        <Badge variant="outline" className="gap-1 border-warning bg-warning/15 text-[10px] font-semibold uppercase text-warning-foreground">
          <Lock className="size-3" aria-hidden /> Dado pessoal
        </Badge>
      )}
      {field.escalation && (
        <Badge variant="outline" className="border-info text-[10px] font-semibold uppercase text-info">
          Critério de escalonamento
        </Badge>
      )}
      {field.readOnly && <Badge variant="secondary" className="text-[10px] uppercase">Automático</Badge>}
    </div>
  );

  const help = field.help ? (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
      {field.help}
    </p>
  ) : null;

  if (mascarado) {
    const texto = typeof value === "string" && value ? maskPii(value) : "—";
    return (
      <div className={cn("space-y-2", field.full && "md:col-span-2")}>
        {label}
        <div className="rounded-sm border border-dashed border-warning bg-warning/10 p-3 text-sm text-foreground">{texto}</div>
        <p className="text-xs text-muted-foreground">Conteúdo mascarado para o seu perfil. Acesso irrestrito é exclusivo do Encarregado de Dados.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", (field.full || field.type === "list" || field.type === "textarea") && "md:col-span-2")}>
      {label}

      {field.type === "text" && (
        <Input id={field.id} value={(value as string) ?? ""} placeholder={field.placeholder ?? ""} disabled={disabled || field.readOnly} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} />
      )}

      {field.type === "number" && (
        <Input id={field.id} type="number" value={(value as string) ?? ""} disabled={disabled || field.readOnly} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} />
      )}

      {field.type === "textarea" && (
        <Textarea id={field.id} rows={4} value={(value as string) ?? ""} placeholder={field.placeholder ?? ""} disabled={disabled || field.readOnly} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} />
      )}

      {(field.type === "datetime" || field.type === "date") && (
        <div className="space-y-1">
          <Input
            id={field.id}
            type={field.type === "datetime" ? "datetime-local" : "date"}
            value={(value as string) ?? ""}
            disabled={disabled || field.readOnly}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid}
          />
          <p className="text-[11px] text-muted-foreground">Fuso registrado: {TIMEZONE}</p>
        </div>
      )}

      {field.type === "select" && (
        <Select value={(value as string) ?? ""} disabled={disabled} onValueChange={onChange}>
          <SelectTrigger id={field.id} aria-invalid={invalid}>
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "bool" && (
        <div className={cn("flex items-center gap-3 rounded-sm border border-border bg-surface px-3 py-2.5", invalid && "border-destructive")}>
          <Switch id={field.id} checked={value === true} disabled={disabled} onCheckedChange={(c) => onChange(c)} />
          <span className="text-sm text-foreground">{value === true ? "Sim" : value === false ? "Não" : "Não informado"}</span>
          {value === undefined && !disabled && (
            <Button type="button" variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => onChange(false)}>
              Registrar "Não"
            </Button>
          )}
        </div>
      )}

      {field.type === "list" && (
        <DynamicList field={field} value={Array.isArray(value) ? (value as Record<string, string>[]) : []} onChange={onChange} disabled={disabled} invalid={invalid} />
      )}

      {help}
    </div>
  );
}

function DynamicList({
  field,
  value,
  onChange,
  disabled,
  invalid,
}: {
  field: FieldDef;
  value: Record<string, string>[];
  onChange: (v: unknown) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const itens = field.itemFields ?? [];

  const setItem = (idx: number, key: string, v: string) => {
    onChange(value.map((it, i) => (i === idx ? { ...it, [key]: v } : it)));
  };

  return (
    <div className={cn("space-y-3 rounded-sm border border-border bg-muted/40 p-3", invalid && "border-destructive")}>
      {value.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item registrado.</p>}

      {value.map((item, idx) => (
        <div key={idx} className="rounded-sm border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-primary">Item {idx + 1}</span>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                aria-label={`Remover item ${idx + 1}`}
              >
                <Trash2 className="size-4" aria-hidden /> Remover
              </Button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {itens.map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={`${field.id}-${idx}-${f.id}`} className="text-xs font-semibold text-muted-foreground">
                  {f.label}
                </Label>
                {f.type === "select" ? (
                  <Select value={item[f.id] ?? ""} disabled={disabled} onValueChange={(v) => setItem(idx, f.id, v)}>
                    <SelectTrigger id={`${field.id}-${idx}-${f.id}`}>
                      <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" ? (
                  <Textarea id={`${field.id}-${idx}-${f.id}`} rows={2} value={item[f.id] ?? ""} disabled={disabled} onChange={(e) => setItem(idx, f.id, e.target.value)} />
                ) : (
                  <Input
                    id={`${field.id}-${idx}-${f.id}`}
                    type={f.type === "datetime" ? "datetime-local" : f.type === "date" ? "date" : "text"}
                    value={item[f.id] ?? ""}
                    disabled={disabled}
                    onChange={(e) => setItem(idx, f.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, {}])}>
          <Plus className="size-4" aria-hidden /> {field.addLabel ?? "Adicionar item"}
        </Button>
      )}
      <p className="text-[11px] text-muted-foreground">Exclusões são registradas na trilha de auditoria (soft delete).</p>
    </div>
  );
}
