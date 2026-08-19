/**
 * Store de demonstração (front-end apenas) - persistido em localStorage.
 * Quando o Lovable Cloud for ativado, este módulo é substituído por
 * server functions + tabelas com RLS, mantendo a mesma interface.
 */

import { useSyncExternalStore } from "react";
import type { Criticidade, RoleId, TipoRegistro, TipoExercicio } from "./sri-schema";
import { PHASES, ANPD_PREFILL } from "./sri-schema";

export interface AuditEntry {
  id: string;
  ts: string;
  ator: string;
  papel: RoleId;
  acao: string;
  entidade: string;
  detalhe?: string | undefined;
  ip: string;
}

export interface Incident {
  id: string;
  codigo: string;
  faseAtual: number;
  status: "Em andamento" | "Encerrado" | "Fast-track";
  simulacao: boolean;
  tipo: TipoRegistro;
  criadoEm: string;
  criadoPor: string;
  fastTrack: boolean;
  fastTrackJustificativa?: string;
  data: Record<string, unknown>;
  anpd: Record<string, unknown> | null;
  anpdCriadoEm?: string;
  auditoria: AuditEntry[];
  documentos: GeneratedDoc[];
}

export interface GeneratedDoc {
  id: string;
  tipo: "Relatório Final" | "Formulário ANPD";
  versao: number;
  geradoEm: string;
  geradoPor: string;
  hash: string;
}

export interface Session {
  nome: string;
  email: string;
  papel: RoleId;
  metodo: "SSO Microsoft 365" | "SSO Google Workspace";
  entradaEm: string;
}

export interface ExercisePre {
  equipes: string;
  solucoes: string;
  playbook: string;
  comunicacao: string;
  observacoes?: string;
}

export interface ExercisePos {
  dataRealizacao: string;
  concluido: "Sim" | "Não" | "Parcial";
  melhorias: string;
  solucoesEfetivas: string;
  riscosExpostos: string;
  observacoes?: string;
}

export interface Exercise {
  id: string;
  tema: string;
  tipo: TipoExercicio;
  trilha: string;
  data: string;
  responsavel: string;
  criadoEm: string;
  pre?: ExercisePre;
  pos?: ExercisePos;
}

interface StoreState {
  session: Session | null;
  incidents: Incident[];
  exercises: Exercise[];
  /** chave `${incidentId}:${targetId}` -> timestamp da confirmação. */
  notifDone: Record<string, string>;
  auditoriaGlobal: AuditEntry[];
}

const KEY = "sri-agu-state-v1";

const EMPTY: StoreState = { session: null, incidents: [], exercises: [], notifDone: {}, auditoriaGlobal: [] };

let state: StoreState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function hydrate() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    try {
      state = { ...EMPTY, ...(JSON.parse(raw) as StoreState) };
      return;
    } catch {
      /* ignora estado corrompido */
    }
  }
  state = { ...EMPTY, incidents: seedIncidents(), exercises: seedExercises() };
}

function subscribe(l: () => void) {
  hydrate();
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSnapshot: StoreState = EMPTY;

export function useStore(): StoreState {
  return useSyncExternalStore(
    subscribe,
    () => {
      hydrate();
      return state;
    },
    () => serverSnapshot,
  );
}

export function useSession(): Session | null {
  return useStore().session;
}

export function useIncidents(): Incident[] {
  return useStore().incidents;
}

export function useIncident(id: string): Incident | undefined {
  return useStore().incidents.find((i) => i.id === id);
}

export function useExercises(): Exercise[] {
  return useStore().exercises;
}

export function useNotifDone(): Record<string, string> {
  return useStore().notifDone;
}

/* ---------------- helpers ---------------- */

const uid = () => Math.random().toString(36).slice(2, 10);

export function fakeHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    h1 = (h1 ^ input.charCodeAt(i)) >>> 0;
    h1 = (h1 * 16777619) >>> 0;
    h2 = (h2 + h1 * (i + 7)) >>> 0;
  }
  return (h1.toString(16) + h2.toString(16)).padStart(16, "0").repeat(4).slice(0, 64);
}

export function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const TIMEZONE = "America/Sao_Paulo (UTC-03:00)";

function audit(acao: string, entidade: string, detalhe?: string): AuditEntry {
  const s = state.session;
  return {
    id: uid(),
    ts: new Date().toISOString(),
    ator: s?.nome ?? "sistema",
    papel: s?.papel ?? "admin",
    acao,
    entidade,
    detalhe,
    ip: "10.12.4.87",
  };
}

function logGlobal(acao: string, entidade: string, detalhe?: string) {
  state.auditoriaGlobal = [audit(acao, entidade, detalhe), ...state.auditoriaGlobal].slice(0, 400);
}

/* ---------------- ações ---------------- */

export function login(session: Omit<Session, "entradaEm">) {
  hydrate();
  state = { ...state, session: { ...session, entradaEm: new Date().toISOString() } };
  logGlobal("Login realizado", `Usuário ${session.nome}`, session.metodo);
  emit();
}

export function logout() {
  logGlobal("Logout", `Usuário ${state.session?.nome ?? "-"}`);
  state = { ...state, session: null };
  emit();
}

export function createIncident(input: { titulo: string; simulacao: boolean; tipo: TipoRegistro }): Incident {
  hydrate();
  const ano = new Date().getFullYear();
  const seq = String(state.incidents.length + 1).padStart(4, "0");
  const prefixo = input.tipo === "privacidade" ? "IPD" : "ISI";
  const inc: Incident = {
    id: uid(),
    codigo: `${prefixo}-${ano}-${seq}`,
    faseAtual: 1,
    status: "Em andamento",
    simulacao: input.simulacao,
    tipo: input.tipo,
    criadoEm: new Date().toISOString(),
    criadoPor: state.session?.nome ?? "-",
    fastTrack: false,
    data: {
      titulo: input.titulo,
      tipo_registro: input.tipo,
      id_incidente: `${prefixo}-${ano}-${seq}`,
      dt_registro: nowLocalInput(),
      notificante: state.session?.nome ?? "",
    },
    anpd: null,
    auditoria: [],
    documentos: [],
  };
  inc.auditoria = [audit("Incidente criado", inc.codigo, input.simulacao ? "Registro de simulação (tabletop)" : undefined)];
  state = { ...state, incidents: [inc, ...state.incidents] };
  logGlobal("Incidente criado", inc.codigo);
  emit();
  return inc;
}

function update(id: string, fn: (i: Incident) => Incident) {
  state = { ...state, incidents: state.incidents.map((i) => (i.id === id ? fn(i) : i)) };
  emit();
}

export function setField(id: string, field: string, value: unknown) {
  update(id, (i) => ({
    ...i,
    data: { ...i.data, [field]: value },
    auditoria: [audit("Campo alterado", `${i.codigo} · ${field}`, describe(value)), ...i.auditoria],
  }));
}

export function setAnpdField(id: string, field: string, value: unknown) {
  update(id, (i) => ({
    ...i,
    anpd: { ...(i.anpd ?? {}), [field]: value },
    auditoria: [audit("Formulário ANPD alterado", `${i.codigo} · ${field}`, describe(value)), ...i.auditoria],
  }));
}

function describe(value: unknown): string {
  if (Array.isArray(value)) return `${value.length} item(ns)`;
  const s = String(value ?? "");
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

export function advancePhase(id: string) {
  update(id, (i) => {
    const proxima = Math.min(7, i.faseAtual + 1);
    return {
      ...i,
      faseAtual: proxima,
      auditoria: [audit("Transição de fase", i.codigo, `Fase ${i.faseAtual} → ${proxima}`), ...i.auditoria],
    };
  });
}

export function goToPhase(id: string, fase: number) {
  update(id, (i) => ({ ...i, faseAtual: fase }));
}

export function enableFastTrack(id: string, justificativa: string) {
  update(id, (i) => ({
    ...i,
    fastTrack: true,
    faseAtual: 3,
    status: "Fast-track",
    fastTrackJustificativa: justificativa,
    auditoria: [audit("Fast-track ativado", i.codigo, justificativa), ...i.auditoria],
  }));
}

export function closeIncident(id: string) {
  update(id, (i) => ({
    ...i,
    status: "Encerrado",
    auditoria: [audit("Encerramento formal", i.codigo), ...i.auditoria],
  }));
  logGlobal("Incidente encerrado", state.incidents.find((i) => i.id === id)?.codigo ?? id);
}

export function reopenIncident(id: string) {
  update(id, (i) => ({
    ...i,
    status: "Em andamento",
    auditoria: [audit("Incidente reaberto", i.codigo), ...i.auditoria],
  }));
}

export function createAnpdForm(id: string) {
  update(id, (i) => {
    const prefill: Record<string, unknown> = {};
    for (const [k, fn] of Object.entries(ANPD_PREFILL)) {
      const v = fn(i.data);
      if (v !== undefined && v !== null && v !== "") prefill[k] = v;
    }
    return {
      ...i,
      anpd: prefill,
      anpdCriadoEm: new Date().toISOString(),
      auditoria: [audit("Formulário ANPD iniciado", i.codigo, `${Object.keys(prefill).length} campos pré-preenchidos`), ...i.auditoria],
    };
  });
}

export function generateDoc(id: string, tipo: GeneratedDoc["tipo"]) {
  update(id, (i) => {
    const versao = i.documentos.filter((d) => d.tipo === tipo).length + 1;
    const doc: GeneratedDoc = {
      id: uid(),
      tipo,
      versao,
      geradoEm: new Date().toISOString(),
      geradoPor: state.session?.nome ?? "-",
      hash: fakeHash(JSON.stringify(tipo === "Formulário ANPD" ? i.anpd : i.data) + versao),
    };
    return {
      ...i,
      documentos: [doc, ...i.documentos],
      auditoria: [audit("Documento gerado", `${i.codigo} · ${tipo} v${versao}`, `SHA-256 ${doc.hash.slice(0, 16)}…`), ...i.auditoria],
    };
  });
}

export function logPiiAccess(id: string, finalidade: string) {
  update(id, (i) => ({
    ...i,
    auditoria: [audit("Acesso a dados pessoais não mascarados", i.codigo, finalidade), ...i.auditoria],
  }));
}

/* ---------------- SLA ---------------- */

export interface Sla {
  label: string;
  prazo: string;
  status: "ok" | "pendente" | "vencido";
  detalhe: string;
}

const HORA = 3600 * 1000;

export function computeSlas(inc: Incident): Sla[] {
  const slas: Sla[] = [];
  const base = inc.data["dt_registro"] ? new Date(String(inc.data["dt_registro"])).getTime() : new Date(inc.criadoEm).getTime();
  const agora = Date.now();

  if (inc.data["indicio_dados_pessoais"] === true) {
    const limite = base + 24 * HORA;
    const feito = inc.data["dpo_acionado"] === true;
    slas.push({
      label: "Acionamento do Encarregado (DPO)",
      prazo: "24 horas",
      status: feito ? "ok" : agora > limite ? "vencido" : "pendente",
      detalhe: feito ? "Encarregado acionado" : `Limite: ${new Date(limite).toLocaleString("pt-BR")}`,
    });
  }

  if (inc.data["notificar_anpd"] === true) {
    const limite = base + 5 * 24 * HORA; // 3 dias úteis ≈ 5 dias corridos
    const feito = Boolean(inc.data["anpd_protocolo"]);
    slas.push({
      label: "Comunicação à ANPD (art. 48)",
      prazo: "3 dias úteis",
      status: feito ? "ok" : agora > limite ? "vencido" : "pendente",
      detalhe: feito ? `Protocolo ${String(inc.data["anpd_protocolo"])}` : `Limite: ${new Date(limite).toLocaleDateString("pt-BR")}`,
    });
  }

  if (inc.anpd?.["tipo_comunicacao"] === "Preliminar") {
    slas.push({
      label: "Comunicação complementar à ANPD",
      prazo: "20 dias úteis",
      status: inc.anpd["prazo_complementacao"] ? "pendente" : "vencido",
      detalhe: inc.anpd["prazo_complementacao"] ? `Previsto para ${String(inc.anpd["prazo_complementacao"])}` : "Prazo não informado",
    });
  }

  if (inc.data["rto_acordado"]) {
    const rto = Number(inc.data["rto_acordado"]);
    const feito = Boolean(inc.data["dt_retorno"]);
    slas.push({
      label: "RTO aprovado na Recuperação",
      prazo: `${rto} h`,
      status: feito ? "ok" : agora > base + rto * HORA ? "vencido" : "pendente",
      detalhe: feito ? `Retorno em ${String(inc.data["dt_retorno"])}` : "Retorno à operação pendente",
    });
  }

  return slas;
}

/* ---------------- validação de fase ---------------- */

export interface Missing {
  id: string;
  label: string;
}

export function missingFields(inc: Incident, fase: number): Missing[] {
  const phase = PHASES.find((p) => p.numero === fase);
  if (!phase) return [];
  const out: Missing[] = [];
  for (const f of phase.fields) {
    if (f.showWhen && !f.showWhen(inc.data)) continue;
    const obrigatorio = f.required || (f.requiredWhen ? f.requiredWhen(inc.data) : false);
    if (!obrigatorio) continue;
    const v = inc.data[f.id];
    const vazio = f.type === "list" ? !Array.isArray(v) || v.length === 0 : v === undefined || v === null || v === "";
    if (vazio) out.push({ id: f.id, label: f.label });
  }
  return out;
}

export function phaseComplete(inc: Incident, fase: number): boolean {
  return missingFields(inc, fase).length === 0;
}

export function progressoGeral(inc: Incident): number {
  const total = PHASES.length;
  const completas = PHASES.filter((p) => phaseComplete(inc, p.numero)).length;
  return Math.round((completas / total) * 100);
}

/* ---------------- seed ---------------- */

function seedIncidents(): Incident[] {
  const mk = (
    codigo: string,
    titulo: string,
    fase: number,
    criticidade: Criticidade,
    status: Incident["status"],
    extra: Record<string, unknown> = {},
    simulacao = false,
    tipo: TipoRegistro = "seguranca",
  ): Incident => ({
    id: uid(),
    codigo,
    faseAtual: fase,
    status,
    simulacao,
    tipo,
    criadoEm: new Date(Date.now() - Math.random() * 20 * 24 * HORA).toISOString(),
    criadoPor: "Central de Serviços",
    fastTrack: false,
    data: {
      id_incidente: codigo,
      tipo_registro: tipo,
      titulo,
      criticidade,
      dt_registro: nowLocalInput(),
      dt_deteccao: nowLocalInput(),
      origem_deteccao: "SIEM/SOC",
      notificante: "Central de Serviços",
      descricao_preliminar: titulo,
      ...extra,
    },
    anpd: null,
    auditoria: [],
    documentos: [],
  });

  return [
    mk("IPD-2026-0001", "Exposição de planilha com dados de servidores em compartilhamento público", 6, "Crítica", "Em andamento", {
      indicio_dados_pessoais: true,
      envolve_dados_pessoais: true,
      envolve_dados_sensiveis: true,
      dpo_acionado: true,
      notificar_anpd: true,
      tipo_incidente: "Vazamento de dados",
      notificar_titulares: true,
      priv_cat_dados: "Nome, CPF, matrícula SIAPE, lotação",
      priv_num_titulares: 1240,
      priv_risco_preliminar: "Alto",
      priv_extensao: "Pública / internet",
      priv_enc_24h: true,
    }, false, "privacidade"),
    mk("ISI-2026-0002", "Tentativa de ransomware contida em estação de trabalho", 5, "Alta", "Em andamento", {
      indicio_dados_pessoais: false,
      tipo_incidente: "Ransomware",
      rto_acordado: 8,
    }),
    mk("IPD-2026-0003", "Phishing direcionado a advogados públicos", 7, "Média", "Encerrado", {
      indicio_dados_pessoais: true,
      dpo_acionado: true,
      tipo_incidente: "Phishing / Engenharia social",
    }, false, "privacidade"),
    mk("ISI-2026-0004", "Simulação tabletop - vazamento via fornecedor", 2, "Alta", "Em andamento", { tipo_incidente: "Vazamento de dados" }, true),
  ];
}

/* ---------------- Exercícios de resposta ---------------- */

export function createExercise(input: Omit<Exercise, "id" | "criadoEm">): Exercise {
  hydrate();
  const ex: Exercise = { ...input, id: uid(), criadoEm: new Date().toISOString() };
  state = { ...state, exercises: [ex, ...state.exercises] };
  logGlobal("Exercício planejado", ex.tema, `${ex.tipo} · ${ex.data}`);
  emit();
  return ex;
}

export function saveExercisePre(id: string, pre: ExercisePre) {
  state = { ...state, exercises: state.exercises.map((e) => (e.id === id ? { ...e, pre } : e)) };
  logGlobal("Formulário pré-exercício salvo", state.exercises.find((e) => e.id === id)?.tema ?? id);
  emit();
}

export function saveExercisePos(id: string, pos: ExercisePos) {
  state = { ...state, exercises: state.exercises.map((e) => (e.id === id ? { ...e, pos } : e)) };
  logGlobal("Formulário pós-exercício salvo", state.exercises.find((e) => e.id === id)?.tema ?? id);
  emit();
}

export function deleteExercise(id: string) {
  const alvo = state.exercises.find((e) => e.id === id);
  state = { ...state, exercises: state.exercises.filter((e) => e.id !== id) };
  logGlobal("Exercício removido", alvo?.tema ?? id);
  emit();
}

/* ---------------- Checklist de notificações legais ---------------- */

export function toggleNotification(incidentId: string, targetId: string, destinatario: string) {
  hydrate();
  const key = `${incidentId}:${targetId}`;
  const next = { ...state.notifDone };
  if (next[key]) delete next[key];
  else next[key] = new Date().toISOString();
  state = { ...state, notifDone: next };
  const inc = state.incidents.find((i) => i.id === incidentId);
  logGlobal(next[key] ? "Notificação legal confirmada" : "Confirmação de notificação revertida", `${inc?.codigo ?? incidentId} · ${destinatario}`);
  emit();
}

function seedExercises(): Exercise[] {
  return [
    {
      id: uid(),
      tema: "Vazamento de base de servidores via fornecedor",
      tipo: "Tabletop",
      trilha: "Incidente com fornecedor",
      data: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      responsavel: "ETIR Central",
      criadoEm: new Date().toISOString(),
      pre: {
        equipes: "ETIR, SOC, Encarregado de Dados, Procuradoria",
        solucoes: "SIEM, EDR, DLP, canal de comunicação seguro",
        playbook: "PRI/AGU - trilha de vazamento de dados pessoais",
        comunicacao: "Alta Administração, ANPD (simulada), titulares (simulado)",
      },
    },
    {
      id: uid(),
      tema: "Ransomware em servidor de arquivos regional",
      tipo: "Simulado",
      trilha: "Ransomware",
      data: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      responsavel: "SOC",
      criadoEm: new Date().toISOString(),
      pre: {
        equipes: "SOC, ETIR, Infraestrutura",
        solucoes: "EDR, backup imutável, isolamento de rede",
        playbook: "PRI/AGU - contenção e recuperação",
        comunicacao: "CTIR.Gov, Comitê de SI",
      },
      pos: {
        dataRealizacao: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        concluido: "Parcial",
        melhorias: "Reduzir tempo de isolamento de rede; revisar matriz de acionamento noturno.",
        solucoesEfetivas: "EDR e backup imutável responderam dentro do RTO acordado.",
        riscosExpostos: "Dependência de um único analista para acionar o isolamento.",
      },
    },
  ];
}
