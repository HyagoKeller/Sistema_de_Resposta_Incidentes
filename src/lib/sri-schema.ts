/**
 * Estrutura de dados do SRI/AGU — 7 fases do checklist + Formulário ANPD (art. 48 LGPD).
 * Definições declarativas: os formulários são renderizados a partir daqui.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "datetime"
  | "date"
  | "select"
  | "bool"
  | "number"
  | "list";

export interface ListItemField {
  id: string;
  label: string;
  type: "text" | "textarea" | "datetime" | "date" | "select";
  options?: string[];
  pii?: boolean;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Obrigatório apenas quando a condição for verdadeira (RF-021 / RF-045). */
  requiredWhen?: (data: Record<string, unknown>) => boolean;
  showWhen?: (data: Record<string, unknown>) => boolean;
  options?: string[];
  help?: string;
  placeholder?: string;
  /** Campo contém dado pessoal — mascarado para papéis sem autorização (RNF-002). */
  pii?: boolean;
  /** Campo gerado pelo sistema, não editável (RF-030). */
  readOnly?: boolean;
  itemFields?: ListItemField[];
  addLabel?: string;
  /** Marca critério estruturado de escalonamento (RF-025). */
  escalation?: boolean;
  full?: boolean;
}

export interface PhaseDef {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  /** Fase do PRI/AGU (macro) à qual o passo pertence. */
  macroFase: "Identificação" | "Análise e Classificação" | "Contenção / Erradicação / Recuperação" | "Pós-Incidente";
  /** Papéis responsáveis pelo preenchimento (RF-001). */
  papeis: RoleId[];
  fields: FieldDef[];
}

/* ------------------------------------------------------------------ */
/* RBAC                                                                */
/* ------------------------------------------------------------------ */

export type RoleId =
  | "notificador"
  | "triagem"
  | "etir"
  | "soc"
  | "gestor_si"
  | "dpo"
  | "juridico"
  | "ascom"
  | "sge"
  | "admin";

export interface RoleDef {
  id: RoleId;
  nome: string;
  descricao: string;
  /** Fases (numero) que o papel pode editar. */
  editaFases: number[];
  /** Fases que o papel pode ler. */
  leFases: number[];
  /** Acesso a dados pessoais não pseudonimizados (RF-002 / RNF-001). */
  acessoPII: boolean;
  podeCriarIncidente: boolean;
  podeClassificar: boolean;
  podeAutorizarEncerramento: boolean;
  podeEditarANPD: boolean;
  veIndicadores: boolean;
}

const TODAS = [1, 2, 3, 4, 5, 6, 7];

export const ROLES: RoleDef[] = [
  {
    id: "notificador",
    nome: "Notificador",
    descricao: "Registra a suspeita inicial. Sem acesso a outros incidentes.",
    editaFases: [1],
    leFases: [1],
    acessoPII: false,
    podeCriarIncidente: true,
    podeClassificar: false,
    podeAutorizarEncerramento: false,
    podeEditarANPD: false,
    veIndicadores: false,
  },
  {
    id: "triagem",
    nome: "Acionador / Triagem",
    descricao: "Formaliza o registro, aciona ETIR e Encarregado.",
    editaFases: [1, 2],
    leFases: TODAS,
    acessoPII: false,
    podeCriarIncidente: true,
    podeClassificar: false,
    podeAutorizarEncerramento: false,
    podeEditarANPD: false,
    veIndicadores: false,
  },
  {
    id: "etir",
    nome: "ETIR — Equipe de Resposta",
    descricao: "Análise, contenção, erradicação e recuperação.",
    editaFases: [1, 2, 3, 4, 5, 7],
    leFases: TODAS,
    acessoPII: false,
    podeCriarIncidente: true,
    podeClassificar: true,
    podeAutorizarEncerramento: false,
    podeEditarANPD: false,
    veIndicadores: true,
  },
  {
    id: "soc",
    nome: "SOC",
    descricao: "Evidências técnicas, IOCs e correlações.",
    editaFases: [1, 2],
    leFases: [1, 2, 3, 4, 5],
    acessoPII: false,
    podeCriarIncidente: true,
    podeClassificar: false,
    podeAutorizarEncerramento: false,
    podeEditarANPD: false,
    veIndicadores: true,
  },
  {
    id: "gestor_si",
    nome: "Gestor de Segurança da Informação",
    descricao: "Aprova criticidade, autoriza contenção/retorno e valida encerramento.",
    editaFases: [2, 3, 4, 5, 6, 7],
    leFases: TODAS,
    acessoPII: false,
    podeCriarIncidente: true,
    podeClassificar: true,
    podeAutorizarEncerramento: true,
    podeEditarANPD: false,
    veIndicadores: true,
  },
  {
    id: "dpo",
    nome: "Encarregado de Dados (DPO)",
    descricao: "Único perfil com acesso a dados de titulares não pseudonimizados.",
    editaFases: [2, 6, 7],
    leFases: TODAS,
    acessoPII: true,
    podeCriarIncidente: true,
    podeClassificar: false,
    podeAutorizarEncerramento: false,
    podeEditarANPD: true,
    veIndicadores: true,
  },
  {
    id: "juridico",
    nome: "Jurídico",
    descricao: "Avaliação regulatória e providências legais.",
    editaFases: [6, 7],
    leFases: [1, 2, 6, 7],
    acessoPII: false,
    podeCriarIncidente: false,
    podeClassificar: false,
    podeAutorizarEncerramento: false,
    podeEditarANPD: false,
    veIndicadores: false,
  },
  {
    id: "ascom",
    nome: "ASCOM / Comunicação",
    descricao: "Somente seções de comunicação institucional e externa.",
    editaFases: [6],
    leFases: [6],
    acessoPII: false,
    podeCriarIncidente: false,
    podeClassificar: false,
    podeAutorizarEncerramento: false,
    podeEditarANPD: false,
    veIndicadores: false,
  },
  {
    id: "sge",
    nome: "SGE / Governança",
    descricao: "Leitura consolidada, indicadores e aprovação de encerramento crítico.",
    editaFases: [7],
    leFases: TODAS,
    acessoPII: false,
    podeCriarIncidente: false,
    podeClassificar: false,
    podeAutorizarEncerramento: true,
    podeEditarANPD: false,
    veIndicadores: true,
  },
  {
    id: "admin",
    nome: "Administrador do Sistema",
    descricao: "Usuários, papéis e parametrização. Sem acesso a dados de titulares.",
    editaFases: [],
    leFases: TODAS,
    acessoPII: false,
    podeCriarIncidente: false,
    podeClassificar: false,
    podeAutorizarEncerramento: false,
    podeEditarANPD: false,
    veIndicadores: true,
  },
];

export const getRole = (id: RoleId): RoleDef => ROLES.find((r) => r.id === id) ?? ROLES[0]!;

/* ------------------------------------------------------------------ */
/* Listas de apoio                                                     */
/* ------------------------------------------------------------------ */

export const CRITICIDADES = ["Baixa", "Média", "Alta", "Crítica"] as const;
export type Criticidade = (typeof CRITICIDADES)[number];

export const TIPOS_INCIDENTE = [
  "Vazamento de dados",
  "Acesso não autorizado",
  "Ransomware",
  "Phishing / Engenharia social",
  "Indisponibilidade (DoS)",
  "Malware",
  "Perda/extravio de dispositivo",
  "Erro humano / envio indevido",
  "Outro",
];

export const ATIVOS_CADASTRADOS = [
  "AGU Serviços (ITSM)",
  "Sapiens",
  "SICAU",
  "e-AGU Doc",
  "Active Directory AGU",
  "Exchange Online / M365",
  "Portal AGU (institucional)",
  "Data Center Brasília",
  "VPN corporativa",
  "Estação de trabalho de usuário",
];

/* ------------------------------------------------------------------ */
/* Fases 1 a 7                                                         */
/* ------------------------------------------------------------------ */

const yes = (v: unknown) => v === true || v === "Sim";

export const PHASES: PhaseDef[] = [
  {
    id: "identificacao",
    numero: 1,
    titulo: "Identificação e Registro Inicial",
    descricao: "Detecção, registro formal e preservação de evidências com cadeia de custódia.",
    macroFase: "Identificação",
    papeis: ["notificador", "triagem", "etir", "soc"],
    fields: [
      { id: "id_incidente", label: "ID do incidente", type: "text", readOnly: true, help: "Gerado automaticamente pelo sistema." },
      { id: "titulo", label: "Título do incidente", type: "text", required: true, full: true },
      { id: "dt_deteccao", label: "Data/hora da detecção", type: "datetime", required: true },
      { id: "dt_registro", label: "Data/hora do registro", type: "datetime", required: true, readOnly: true },
      {
        id: "origem_deteccao",
        label: "Origem / forma de detecção",
        type: "select",
        required: true,
        options: ["Monitoramento automático (SIEM/SOC)", "EDR/Antivírus", "E-mail institucional", "Telefone", "Denúncia de usuário", "Relato de terceiro", "Titular de dados", "Encarregado de Dados", "Órgão externo (CTIR.GOV/ANPD)", "Auditoria interna", "Mídia/Imprensa", "Outro"],
      },
      { id: "notificante", label: "Notificante (nome / unidade)", type: "text", required: true },
      { id: "descricao_preliminar", label: "Descrição preliminar do ocorrido", type: "textarea", required: true, full: true, pii: true },
      {
        id: "indicio_dados_pessoais",
        label: "Há indício de envolvimento de dados pessoais?",
        type: "bool",
        required: true,
        escalation: true,
        help: "Se sim, o Encarregado de Dados deve ser acionado em até 24h (SLA do Playbook).",
      },
      { id: "vazamento_ativo", label: "Vazamento ativo ou risco crítico em curso?", type: "bool", required: true, escalation: true, help: "Habilita o fast-track para contenção antecipada (RF-022)." },
      { id: "evidencias_preservadas", label: "Evidências preservadas?", type: "bool", required: true },
      {
        id: "evidencias",
        label: "Evidências e cadeia de custódia",
        type: "list",
        required: true,
        full: true,
        addLabel: "Adicionar evidência",
        showWhen: (d) => yes(d["evidencias_preservadas"]),
        itemFields: [
          { id: "tipo", label: "Tipo de evidência", type: "select", options: ["Log de sistema", "Captura de tela", "Imagem de disco", "Captura de rede (pcap)", "E-mail", "Documento", "Outro"] },
          { id: "descricao", label: "Descrição", type: "text" },
          { id: "responsavel", label: "Responsável pela coleta", type: "text" },
          { id: "dt_coleta", label: "Data/hora da coleta", type: "datetime" },
          { id: "hash", label: "Hash (SHA-256)", type: "text" },
        ],
      },
      { id: "chamado_itsm", label: "Nº de chamado no AGU Serviços (referência)", type: "text", help: "Rastreabilidade operacional — sem replicar dados pessoais (RF-061)." },

      /* --- Bloco específico de incidentes de PRIVACIDADE (LGPD) --- */
      {
        id: "priv_cat_dados",
        label: "Categorias de dados pessoais atingidas",
        type: "textarea",
        full: true,
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
        placeholder: "Ex.: nome, CPF, matrícula SIAPE, endereço, dados de saúde…",
      },
      {
        id: "priv_natureza",
        label: "Natureza do tratamento afetado",
        type: "select",
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
        options: ["Coleta", "Armazenamento", "Compartilhamento", "Transferência internacional", "Eliminação", "Outro"],
      },
      {
        id: "priv_num_titulares",
        label: "Número estimado de titulares afetados",
        type: "number",
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
      },
      {
        id: "priv_vulneraveis",
        label: "Há titulares vulneráveis (crianças, adolescentes, idosos)?",
        type: "bool",
        required: true,
        escalation: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
      },
      {
        id: "priv_fonte",
        label: "Fonte / origem da exposição",
        type: "text",
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
      },
      {
        id: "priv_extensao",
        label: "Extensão da exposição",
        type: "select",
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
        options: ["Interna à unidade", "Interna à AGU", "Terceiro determinado", "Pública / internet", "Indeterminada"],
      },
      {
        id: "priv_risco_preliminar",
        label: "Risco preliminar aos direitos dos titulares",
        type: "select",
        required: true,
        escalation: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
        options: ["Baixo", "Médio", "Alto", "Não avaliado"],
      },
      {
        id: "priv_enc_24h",
        label: "Encarregado comunicado em até 24 horas?",
        type: "bool",
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
        help: "Prazo interno do Playbook AGU para acionamento do Encarregado.",
      },

      /* --- Campos do Relatório Preliminar de PRIVACIDADE --- */
      {
        id: "priv_classe_dados",
        label: "Categoria de dados pessoais",
        type: "select",
        required: true,
        escalation: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
        options: ["Dados pessoais", "Dados pessoais sensíveis", "Dados de crianças ou adolescentes"],
      },
      {
        id: "priv_natureza_violacao",
        label: "Natureza da violação",
        type: "select",
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
        options: ["Confidencialidade", "Integridade", "Disponibilidade", "Autenticidade"],
      },
      {
        id: "priv_causa",
        label: "Vulnerabilidade explorada ou causa aparente",
        type: "textarea",
        full: true,
        required: true,
        showWhen: (d) => d["tipo_registro"] === "privacidade",
      },

      /* --- Campos do Relatório Preliminar de SEGURANÇA --- */
      {
        id: "sec_categoria",
        label: "Categoria de segurança",
        type: "select",
        required: true,
        showWhen: (d) => d["tipo_registro"] !== "privacidade",
        options: [
          "Conteúdo abusivo",
          "Código malicioso",
          "Prospecção por informações",
          "Tentativa de intrusão",
          "Intrusão confirmada",
          "Indisponibilidade de serviço",
          "Acesso ou modificação não autorizada",
          "Fraude ou uso indevido",
          "Outros",
        ],
      },
      {
        id: "sec_ativos_acometidos",
        label: "Sistemas / ativos acometidos",
        type: "textarea",
        full: true,
        required: true,
        showWhen: (d) => d["tipo_registro"] !== "privacidade",
        placeholder: "Ex.: Sapiens, VPN corporativa, Exchange Online…",
      },
      {
        id: "sec_fornecedores",
        label: "Impactos em fornecedores contratados?",
        type: "bool",
        required: true,
        showWhen: (d) => d["tipo_registro"] !== "privacidade",
      },
      {
        id: "sec_fatores_risco",
        label: "Características do incidente / fatores de risco",
        type: "textarea",
        full: true,
        showWhen: (d) => d["tipo_registro"] !== "privacidade",
      },

      /* --- Comuns ao Relatório Preliminar --- */
      {
        id: "criticidade_preliminar",
        label: "Criticidade preliminar",
        type: "select",
        required: true,
        escalation: true,
        options: ["Baixo", "Médio", "Alto", "Crítico"],
        help: "Classificação inicial do notificador; confirmada pelo Gestor de SI na Fase 2.",
      },
      { id: "dt_resposta_pri", label: "Data/hora da resposta (acionamento do PRI)", type: "datetime", required: true },
      { id: "situacao_atual", label: "Situação atual da resposta (contenção)", type: "textarea", full: true, required: true },
      { id: "proximos_passos", label: "Próximos passos recomendados", type: "textarea", full: true, required: true },
      { id: "custodia_conservacao", label: "Custódia e conservação de evidências", type: "textarea", full: true, help: "Local de guarda, responsável e prazo de conservação." },
      {
        id: "base_legal_relatorio",
        label: "Base legal / normativa do relatório",
        type: "text",
        placeholder: "Ex.: IN GSI/PR nº 1/2020; Resolução ANPD nº 15/2024; Portaria AGU/PRI",
        full: true,
      },
    ],

  },
  {
    id: "analise",
    numero: 2,
    titulo: "Análise e Classificação",
    descricao: "Acionamento do DPO, classificação do incidente, criticidade, ativos e IOCs.",
    macroFase: "Análise e Classificação",
    papeis: ["etir", "soc", "gestor_si", "dpo"],
    fields: [
      {
        id: "dpo_acionado",
        label: "Encarregado de Dados acionado?",
        type: "bool",
        requiredWhen: (d) => yes(d["indicio_dados_pessoais"]),
        escalation: true,
      },
      { id: "dt_acionamento_dpo", label: "Data/hora do acionamento do DPO", type: "datetime", requiredWhen: (d) => yes(d["dpo_acionado"]) },
      { id: "tipo_incidente", label: "Tipo / classificação do incidente", type: "select", required: true, options: TIPOS_INCIDENTE },
      { id: "envolve_dados_pessoais", label: "Confirma envolvimento de dados pessoais?", type: "bool", required: true },
      {
        id: "envolve_dados_sensiveis",
        label: "Envolve dados pessoais sensíveis?",
        type: "bool",
        requiredWhen: (d) => yes(d["envolve_dados_pessoais"]),
        escalation: true,
      },
      {
        id: "categorias_dados",
        label: "Categorias de dados envolvidas",
        type: "textarea",
        requiredWhen: (d) => yes(d["envolve_dados_pessoais"]),
        full: true,
        placeholder: "Ex.: nome, CPF, e-mail funcional, dados de saúde…",
      },
      { id: "criticidade", label: "Criticidade", type: "select", required: true, options: [...CRITICIDADES] },
      { id: "justificativa_criticidade", label: "Justificativa da criticidade", type: "textarea", required: true, full: true },
      {
        id: "ativos_afetados",
        label: "Ativos / sistemas afetados",
        type: "list",
        required: true,
        full: true,
        addLabel: "Adicionar ativo",
        itemFields: [
          { id: "ativo", label: "Ativo (inventário)", type: "select", options: ATIVOS_CADASTRADOS },
          { id: "proprietario", label: "Proprietário do ativo", type: "text" },
          { id: "impacto", label: "Impacto observado", type: "text" },
        ],
      },
      { id: "vetor_ataque", label: "Vetor de ataque / causa provável", type: "textarea", required: true, full: true },
      { id: "iocs", label: "Indicadores de comprometimento (IOCs)", type: "textarea", full: true, placeholder: "IPs, hashes, domínios, contas comprometidas…" },
      { id: "classificacao_aprovada", label: "Classificação aprovada pelo Gestor de SI?", type: "bool", required: true, help: "Segregação de função: quem registra não aprova (RF-003)." },
    ],
  },
  {
    id: "contencao",
    numero: 3,
    titulo: "Contenção",
    descricao: "Bloqueios, isolamentos e medidas imediatas para conter o incidente.",
    macroFase: "Contenção / Erradicação / Recuperação",
    papeis: ["etir", "gestor_si"],
    fields: [
      { id: "contencao_autorizada_por", label: "Contenção autorizada por (Gestor de SI)", type: "text", required: true },
      {
        id: "acoes_contencao",
        label: "Ações de contenção",
        type: "list",
        required: true,
        full: true,
        addLabel: "Adicionar ação",
        itemFields: [
          { id: "dt", label: "Data/hora", type: "datetime" },
          { id: "acao", label: "Ação executada", type: "text" },
          { id: "responsavel", label: "Responsável", type: "text" },
        ],
      },
      { id: "bloqueios", label: "Bloqueios / isolamentos aplicados", type: "textarea", required: true, full: true },
      { id: "contencao_efetiva", label: "Contenção considerada efetiva?", type: "bool", required: true },
      { id: "escalonamento_contencao", label: "Necessário escalonar (incidente não contido)?", type: "bool", escalation: true },
    ],
  },
  {
    id: "erradicacao",
    numero: 4,
    titulo: "Erradicação",
    descricao: "Eliminação da causa raiz e remoção dos artefatos maliciosos.",
    macroFase: "Contenção / Erradicação / Recuperação",
    papeis: ["etir", "gestor_si"],
    fields: [
      { id: "causa_raiz", label: "Causa raiz identificada", type: "textarea", required: true, full: true },
      {
        id: "acoes_erradicacao",
        label: "Ações de erradicação",
        type: "list",
        required: true,
        full: true,
        addLabel: "Adicionar ação",
        itemFields: [
          { id: "dt", label: "Data/hora", type: "datetime" },
          { id: "acao", label: "Ação executada", type: "text" },
          { id: "responsavel", label: "Responsável", type: "text" },
        ],
      },
      { id: "vulnerabilidade_corrigida", label: "Vulnerabilidade corrigida / mitigada?", type: "bool", required: true },
      { id: "verificacao_persistencia", label: "Verificação de persistência do agente malicioso", type: "textarea", required: true, full: true },
    ],
  },
  {
    id: "recuperacao",
    numero: 5,
    titulo: "Recuperação",
    descricao: "Testes de validação e autorização formal de retorno à operação.",
    macroFase: "Contenção / Erradicação / Recuperação",
    papeis: ["etir", "gestor_si"],
    fields: [
      {
        id: "acoes_recuperacao",
        label: "Ações de recuperação",
        type: "list",
        required: true,
        full: true,
        addLabel: "Adicionar ação",
        itemFields: [
          { id: "dt", label: "Data/hora", type: "datetime" },
          { id: "acao", label: "Ação executada", type: "text" },
          { id: "responsavel", label: "Responsável", type: "text" },
        ],
      },
      { id: "testes_pre_retorno", label: "Testes realizados antes do retorno", type: "textarea", required: true, full: true },
      { id: "rto_acordado", label: "RTO aprovado (horas)", type: "number", required: true },
      { id: "dt_retorno", label: "Data/hora do retorno à operação", type: "datetime", required: true },
      { id: "autorizacao_retorno", label: "Autorização formal de retorno (nome/cargo)", type: "text", required: true },
      { id: "monitoramento_pos_retorno", label: "Monitoramento reforçado pós-retorno definido?", type: "bool", required: true },
    ],
  },
  {
    id: "comunicacao",
    numero: 6,
    titulo: "Comunicação Corporativa e Regulatória",
    descricao: "Comunicação interna, CTIR.GOV, avaliação jurídica, ANPD, titulares e ASCOM.",
    macroFase: "Pós-Incidente",
    papeis: ["gestor_si", "dpo", "juridico", "ascom"],
    fields: [
      { id: "comunicacao_interna", label: "Comunicação interna realizada (destinatários e data)", type: "textarea", required: true, full: true },
      { id: "ctir_notificado", label: "CTIR.GOV notificado?", type: "bool", required: true },
      { id: "ctir_protocolo", label: "Protocolo CTIR.GOV", type: "text", requiredWhen: (d) => yes(d["ctir_notificado"]) },
      { id: "ctir_data", label: "Data da notificação ao CTIR.GOV", type: "date", requiredWhen: (d) => yes(d["ctir_notificado"]) },
      { id: "avaliacao_juridica", label: "Avaliação Jurídico / DPO sobre obrigações legais", type: "textarea", required: true, full: true },
      { id: "notificar_anpd", label: "Há obrigação de comunicar à ANPD?", type: "bool", required: true, escalation: true, help: "Se sim, o Formulário ANPD deve ser preenchido pelo Encarregado." },
      { id: "anpd_protocolo", label: "Protocolo da comunicação à ANPD", type: "text", showWhen: (d) => yes(d["notificar_anpd"]) },
      { id: "anpd_data", label: "Data da comunicação à ANPD", type: "date", showWhen: (d) => yes(d["notificar_anpd"]) },
      { id: "notificar_titulares", label: "Há obrigação de comunicar aos titulares?", type: "bool", required: true },
      {
        id: "canal_titulares",
        label: "Canal de comunicação aos titulares",
        type: "select",
        options: ["E-mail", "Correspondência", "Telefone", "Site institucional", "Imprensa", "Aplicativo/Portal", "Outro"],
        requiredWhen: (d) => yes(d["notificar_titulares"]),
      },
      { id: "ascom_acionada", label: "ASCOM acionada?", type: "bool", required: true },
      { id: "porta_voz", label: "Porta-voz designado", type: "text", requiredWhen: (d) => yes(d["ascom_acionada"]) },
      { id: "mensagens_aprovadas", label: "Mensagens-chave aprovadas", type: "textarea", full: true, requiredWhen: (d) => yes(d["ascom_acionada"]) },
    ],
  },
  {
    id: "pos_incidente",
    numero: 7,
    titulo: "Pós-Incidente",
    descricao: "Relatório final, lições aprendidas, plano corretivo e encerramento formal.",
    macroFase: "Pós-Incidente",
    papeis: ["etir", "gestor_si", "dpo", "sge", "juridico"],
    fields: [
      { id: "resumo_final", label: "Descrição consolidada do incidente", type: "textarea", required: true, full: true },
      { id: "cronologia", label: "Cronologia dos fatos", type: "textarea", required: true, full: true },
      { id: "impacto_operacional", label: "Impacto operacional", type: "textarea", required: true, full: true },
      { id: "impacto_financeiro", label: "Impacto financeiro estimado (R$)", type: "text" },
      { id: "impacto_reputacional", label: "Impacto reputacional", type: "textarea", full: true },
      {
        id: "licoes_aprendidas",
        label: "Lições aprendidas",
        type: "list",
        required: true,
        full: true,
        addLabel: "Adicionar lição aprendida",
        itemFields: [
          { id: "licao", label: "Lição aprendida", type: "text" },
          { id: "categoria", label: "Categoria", type: "select", options: ["Processo", "Tecnologia", "Pessoas", "Governança", "Fornecedor"] },
        ],
      },
      {
        id: "plano_corretivo",
        label: "Plano de ação corretivo",
        type: "list",
        required: true,
        full: true,
        addLabel: "Adicionar ação corretiva",
        itemFields: [
          { id: "acao", label: "Ação corretiva", type: "text" },
          { id: "responsavel", label: "Responsável", type: "text" },
          { id: "prazo", label: "Prazo", type: "date" },
          { id: "status", label: "Status", type: "select", options: ["Pendente", "Em andamento", "Concluída", "Atrasada"] },
        ],
      },
      { id: "recomendacoes", label: "Recomendações", type: "textarea", required: true, full: true },
      { id: "aprovador_encerramento", label: "Aprovador do encerramento (nome/cargo)", type: "text", required: true, help: "Somente Gestor de SI ou SGE podem concluir (RF-003)." },
      { id: "dt_encerramento", label: "Data do encerramento formal", type: "date", required: true },
    ],
  },
];

export const getPhase = (numero: number): PhaseDef => PHASES.find((p) => p.numero === numero) ?? PHASES[0]!;

/* ------------------------------------------------------------------ */
/* Formulário ANPD — 8 seções (art. 48 LGPD / Resolução CD/ANPD 2/2022) */
/* ------------------------------------------------------------------ */

export interface AnpdSection {
  numero: number;
  titulo: string;
  fields: FieldDef[];
}

const isPreliminar = (d: Record<string, unknown>) => d["tipo_comunicacao"] === "Preliminar";
const foraPrazo = (d: Record<string, unknown>) => d["dentro_prazo_3_dias"] === false;

export const ANPD_SECTIONS: AnpdSection[] = [
  {
    numero: 1,
    titulo: "Dados do Controlador",
    fields: [
      { id: "controlador_nome", label: "Nome/Razão social do controlador", type: "text", required: true },
      { id: "controlador_cnpj", label: "CNPJ", type: "text", required: true },
      { id: "controlador_natureza", label: "Natureza jurídica", type: "select", required: true, options: ["Órgão público federal", "Órgão público estadual/municipal", "Pessoa jurídica de direito privado", "Pessoa natural"] },
      { id: "controlador_endereco", label: "Endereço", type: "text", required: true, full: true },
      { id: "controlador_email", label: "E-mail institucional", type: "text", required: true },
      { id: "controlador_telefone", label: "Telefone", type: "text", required: true },
    ],
  },
  {
    numero: 2,
    titulo: "Encarregado (DPO) e Notificante",
    fields: [
      { id: "dpo_nome", label: "Nome do Encarregado", type: "text", required: true },
      { id: "dpo_email", label: "E-mail do Encarregado", type: "text", required: true },
      { id: "dpo_telefone", label: "Telefone do Encarregado", type: "text", required: true },
      { id: "dpo_substituto", label: "Substituto formal do Encarregado", type: "text" },
      { id: "notificante_nome", label: "Nome do notificante", type: "text", required: true },
      { id: "notificante_cargo", label: "Cargo/função do notificante", type: "text", required: true },
      { id: "notificante_email", label: "E-mail do notificante", type: "text", required: true },
    ],
  },
  {
    numero: 3,
    titulo: "Tipo de Comunicação e Avaliação de Risco",
    fields: [
      {
        id: "tipo_comunicacao",
        label: "Tipo de comunicação",
        type: "select",
        required: true,
        options: ["Completa", "Preliminar", "Complementar"],
        help: "Preliminar exige complementação em até 20 dias úteis (tarefa criada automaticamente).",
      },
      { id: "comunicacao_referencia", label: "Protocolo da comunicação anterior (se complementar)", type: "text", requiredWhen: (d) => d["tipo_comunicacao"] === "Complementar" },
      { id: "risco_relevante", label: "O incidente pode acarretar risco ou dano relevante aos titulares?", type: "bool", required: true },
      { id: "justificativa_risco", label: "Justificativa da avaliação de risco", type: "textarea", required: true, full: true },
      { id: "criterios_risco", label: "Critérios considerados na avaliação", type: "textarea", full: true, placeholder: "Volume de titulares, natureza dos dados, facilidade de identificação, consequências prováveis…" },
      { id: "prazo_complementacao", label: "Prazo previsto para a comunicação complementar", type: "date", requiredWhen: isPreliminar },
    ],
  },
  {
    numero: 4,
    titulo: "Ciência da Ocorrência e Tempestividade",
    fields: [
      { id: "dt_ocorrencia", label: "Data/hora da ocorrência do incidente", type: "datetime", required: true },
      { id: "dt_ciencia", label: "Data/hora da ciência pelo controlador", type: "datetime", required: true },
      { id: "dentro_prazo_3_dias", label: "Comunicação realizada em até 3 dias úteis da ciência?", type: "bool", required: true },
      {
        id: "justificativa_atraso",
        label: "Justificativa da não comunicação no prazo de 3 dias úteis",
        type: "textarea",
        full: true,
        requiredWhen: foraPrazo,
        help: "Obrigatório quando o prazo legal foi ultrapassado (RF-045).",
      },
      { id: "forma_ciencia", label: "Como o controlador tomou ciência", type: "textarea", full: true, required: true },
    ],
  },
  {
    numero: 5,
    titulo: "Comunicação aos Titulares",
    fields: [
      { id: "titulares_comunicados", label: "Os titulares foram comunicados?", type: "bool", required: true },
      { id: "dt_comunicacao_titulares", label: "Data da comunicação aos titulares", type: "date", requiredWhen: (d) => yes(d["titulares_comunicados"]) },
      { id: "canal_comunicacao_titulares", label: "Canal utilizado", type: "select", options: ["E-mail", "Correspondência", "Telefone", "Site institucional", "Imprensa", "Aplicativo/Portal", "Outro"], requiredWhen: (d) => yes(d["titulares_comunicados"]) },
      { id: "conteudo_comunicacao", label: "Conteúdo da comunicação aos titulares", type: "textarea", full: true, requiredWhen: (d) => yes(d["titulares_comunicados"]) },
      { id: "motivo_nao_comunicacao", label: "Motivo da não comunicação aos titulares", type: "textarea", full: true, requiredWhen: (d) => d["titulares_comunicados"] === false },
    ],
  },
  {
    numero: 6,
    titulo: "Descrição do Incidente",
    fields: [
      { id: "descricao_incidente", label: "Descrição do incidente", type: "textarea", required: true, full: true, pii: true },
      { id: "causa_incidente", label: "Causa do incidente", type: "textarea", required: true, full: true },
      { id: "tipo_violacao", label: "Tipo de violação", type: "select", required: true, options: ["Confidencialidade", "Integridade", "Disponibilidade", "Confidencialidade e Integridade", "Todas"] },
      { id: "sistemas_envolvidos", label: "Sistemas/ativos envolvidos", type: "textarea", required: true, full: true },
      { id: "dados_ainda_expostos", label: "Os dados ainda estão expostos?", type: "bool", required: true },
    ],
  },
  {
    numero: 7,
    titulo: "Impactos e Titulares Afetados",
    fields: [
      { id: "qtd_titulares", label: "Número de titulares afetados (estimado)", type: "number", required: true },
      { id: "categorias_titulares", label: "Categorias de titulares", type: "textarea", required: true, full: true, placeholder: "Servidores, advogados públicos, cidadãos requerentes…" },
      { id: "categorias_dados_afetados", label: "Categorias de dados afetados", type: "textarea", required: true, full: true },
      { id: "dados_sensiveis_afetados", label: "Envolve dados sensíveis (art. 5º, II, LGPD)?", type: "bool", required: true },
      { id: "dados_criancas", label: "Envolve dados de crianças e adolescentes?", type: "bool", required: true },
      { id: "consequencias", label: "Consequências prováveis para os titulares", type: "textarea", required: true, full: true },
      { id: "titulares_identificados", label: "Relação de titulares afetados", type: "textarea", full: true, pii: true, help: "Dado pessoal — visível apenas ao Encarregado (RNF-001/002)." },
    ],
  },
  {
    numero: 8,
    titulo: "Medidas de Segurança",
    fields: [
      { id: "medidas_previas", label: "Medidas de segurança adotadas antes do incidente", type: "textarea", required: true, full: true },
      { id: "dados_criptografados", label: "Os dados afetados estavam criptografados/pseudonimizados?", type: "bool", required: true },
      { id: "medidas_apos", label: "Medidas adotadas após o incidente", type: "textarea", required: true, full: true },
      { id: "medidas_mitigacao", label: "Medidas para mitigar efeitos aos titulares", type: "textarea", required: true, full: true },
      { id: "medidas_preventivas", label: "Medidas preventivas para evitar recorrência", type: "textarea", required: true, full: true },
    ],
  },
];

/** Pré-preenchimento do Formulário ANPD a partir das fases 1–6 (RF-041). */
export const ANPD_PREFILL: Record<string, (d: Record<string, unknown>) => unknown> = {
  controlador_nome: () => "Advocacia-Geral da União — AGU",
  controlador_cnpj: () => "26.994.558/0001-23",
  controlador_natureza: () => "Órgão público federal",
  controlador_endereco: () => "SIG Quadra 06, Lote 800 — Brasília/DF, CEP 70610-460",
  controlador_email: () => "encarregado.dados@agu.gov.br",
  controlador_telefone: () => "(61) 2026-8000",
  dpo_nome: () => "Encarregado de Dados — AGU",
  dpo_email: () => "encarregado.dados@agu.gov.br",
  dpo_substituto: () => "Débora Cristina de Carvalho Rodrigues",
  notificante_nome: (d) => d["notificante"],
  dt_ocorrencia: (d) => d["dt_deteccao"],
  dt_ciencia: (d) => d["dt_registro"],
  forma_ciencia: (d) => d["origem_deteccao"],
  descricao_incidente: (d) => d["descricao_preliminar"],
  causa_incidente: (d) => d["causa_raiz"] ?? d["vetor_ataque"],
  sistemas_envolvidos: (d) => {
    const ativos = d["ativos_afetados"];
    if (!Array.isArray(ativos)) return undefined;
    return ativos.map((a) => `${(a as Record<string, string>)["ativo"] ?? ""}${(a as Record<string, string>)["impacto"] ? ` — ${(a as Record<string, string>)["impacto"]}` : ""}`).join("\n");
  },
  categorias_dados_afetados: (d) => d["categorias_dados"],
  dados_sensiveis_afetados: (d) => d["envolve_dados_sensiveis"],
  titulares_comunicados: (d) => d["notificar_titulares"],
  canal_comunicacao_titulares: (d) => d["canal_titulares"],
  medidas_apos: (d) => {
    const acoes = d["acoes_contencao"];
    if (!Array.isArray(acoes)) return undefined;
    return acoes.map((a) => `${(a as Record<string, string>)["dt"] ?? ""} — ${(a as Record<string, string>)["acao"] ?? ""}`).join("\n");
  },
  medidas_preventivas: (d) => d["recomendacoes"],
};

/* ------------------------------------------------------------------ */
/* Módulo: SLA e Notificações Legais                                   */
/* ------------------------------------------------------------------ */

export type TipoRegistro = "seguranca" | "privacidade";

export interface NotificationTarget {
  id: string;
  destinatario: string;
  prazo: string;
  horas: number;
  base: string;
  descricao: string;
  aplicaA: TipoRegistro[];
  /** Só é exigível quando a condição do incidente for verdadeira. */
  condicao?: (d: Record<string, unknown>) => boolean;
}

export const NOTIFICATION_TARGETS: NotificationTarget[] = [
  {
    id: "encarregado",
    destinatario: "Encarregado de Dados (DPO/AGU)",
    prazo: "24 horas",
    horas: 24,
    base: "Playbook AGU · LGPD art. 41",
    descricao: "Acionamento imediato do Encarregado sempre que houver indício de dados pessoais.",
    aplicaA: ["seguranca", "privacidade"],
    condicao: (d) => d["indicio_dados_pessoais"] === true || d["tipo_registro"] === "privacidade",
  },
  {
    id: "ctir",
    destinatario: "CTIR.Gov",
    prazo: "5 dias",
    horas: 120,
    base: "IN GSI/PR nº 1/2020 · Decreto nº 10.748/2021",
    descricao: "Comunicação do incidente de segurança à equipe central de tratamento do governo federal.",
    aplicaA: ["seguranca", "privacidade"],
  },
  {
    id: "anpd",
    destinatario: "ANPD",
    prazo: "3 dias úteis",
    horas: 120,
    base: "LGPD art. 48 · Resolução CD/ANPD nº 15/2024",
    descricao: "Comunicação de incidente com risco relevante aos direitos dos titulares.",
    aplicaA: ["seguranca", "privacidade"],
    condicao: (d) => d["notificar_anpd"] === true || d["priv_risco_preliminar"] === "Alto",
  },
  {
    id: "titulares",
    destinatario: "Titulares afetados",
    prazo: "3 dias úteis",
    horas: 120,
    base: "LGPD art. 48, §1º",
    descricao: "Comunicação individual aos titulares quando houver risco relevante.",
    aplicaA: ["privacidade"],
    condicao: (d) => d["notificar_titulares"] === true || d["priv_risco_preliminar"] === "Alto",
  },
  {
    id: "alta_administracao",
    destinatario: "Alta Administração / Comitê de SI",
    prazo: "48 horas",
    horas: 48,
    base: "POSIN-AGU",
    descricao: "Reporte executivo em incidentes de criticidade Alta ou Crítica.",
    aplicaA: ["seguranca", "privacidade"],
    condicao: (d) => d["criticidade"] === "Alta" || d["criticidade"] === "Crítica",
  },
];

/* ------------------------------------------------------------------ */
/* Módulo: Exercícios de Resposta                                      */
/* ------------------------------------------------------------------ */

export const TIPOS_EXERCICIO = ["Tabletop", "Simulado", "Funcional"] as const;
export type TipoExercicio = (typeof TIPOS_EXERCICIO)[number];

export const TRILHAS_EXERCICIO = [
  "Vazamento de dados pessoais",
  "Ransomware",
  "Indisponibilidade de serviço crítico",
  "Comprometimento de credenciais",
  "Incidente com fornecedor",
];
