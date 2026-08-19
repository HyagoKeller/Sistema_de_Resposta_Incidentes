# Manual da Solução - SRI/AGU

**Sistema de Resposta a Incidentes de Segurança da Informação e Privacidade**
Advocacia-Geral da União · Secretaria de Governança e Gestão Estratégica · DTI - Coordenação de Segurança da Informação

Versão do documento: 1.0 · Documento de apresentação funcional e técnica.

---

## 1. Visão geral

O SRI/AGU é o sistema institucional para registro, condução, documentação e prestação de contas de incidentes de **Segurança da Informação (ISI)** e de **Privacidade de Dados Pessoais (IPD)**.

A solução cobre o ciclo completo:

```text
Notificação -> Triagem -> Contenção -> Erradicação -> Recuperação -> Lições aprendidas -> Encerramento
                                   \
                                    -> Formulário de comunicação à ANPD (trilha de privacidade)
```

Objetivos atendidos:

- Padronizar o registro conforme o PRI/AGU e as orientações da ANPD.
- Garantir rastreabilidade completa (trilha de auditoria imutável, versionamento dos documentos).
- Controlar prazos regulatórios (SLA de acionamento e comunicação).
- Proteger dados pessoais por mascaramento automático conforme o perfil do usuário.
- Produzir evidência documental pronta para envio (.docx).

---

## 2. Perfis de acesso e segurança

### 2.1 Autenticação

Acesso exclusivamente por identidade federada institucional:

- **Microsoft 365** (Azure AD / OIDC)
- **Google Workspace**

Não há login local com senha na tela inicial, e o perfil de acesso **nunca** é exposto antes da autenticação - ele é derivado da identidade e dos grupos do diretório.

### 2.2 Os três perfis

| Perfil | Escopo | Descrição |
|---|---|---|
| **Administrador** | Segurança e Privacidade | Acesso integral: provisionamento, perfis, notificações, auditoria. |
| **Gestor** | Segurança, Privacidade ou ambas | Conduz e aprova o tratamento na sua trilha. |
| **Colaborador** | Escopo designado | Registra e atualiza informações; não aprova nem exclui. |

### 2.3 Granularidade de permissões

Cada perfil possui uma matriz **módulo x ação** configurável em *Configurações -> Perfis de acesso*:

- Ações: **Leitura, Inserção, Edição, Exclusão, Aprovação, Exportação**
- Módulos: Incidentes, Formulário ANPD, SLAs e notificações, Exercícios, Relatórios, Dashboards, Auditoria, Configurações
- Chave adicional: **visualizar dados pessoais sem mascaramento** (todo acesso a PII é registrado na auditoria)

### 2.4 Proteção de dados pessoais

Campos marcados como *Dado pessoal* são automaticamente mascarados (CPF, e-mail e nomes próprios) para quem não tem a permissão de visualização irrestrita. Cada visualização autorizada gera registro de auditoria.

---

## 3. Módulos do sistema

### 3.1 Painel
Visão executiva: incidentes abertos, criticidade, prazos em risco e ações pendentes do usuário.

### 3.2 Incidentes - fluxo de 7 fases
Abertura separada por trilha, com numeração automática **ISI-xxxx** (segurança) e **IPD-xxxx** (privacidade).

Fases:
1. **Notificação / Relatório Preliminar** - inclui todos os campos dos relatórios preliminares de Segurança e de Privacidade (chamado ITSM, origem da notificação, criticidade, categoria, ativos acometidos, causa aparente, categorias de dados pessoais, titulares afetados, situação de contenção, custódia de evidências, próximos passos etc.), exibidos condicionalmente conforme a trilha.
2. **Triagem e classificação**
3. **Contenção**
4. **Erradicação**
5. **Recuperação**
6. **Lições aprendidas**
7. **Encerramento**

Regras aplicadas: bloqueio de fase por campos obrigatórios, critérios de escalonamento sinalizados, suporte a *fast-track* para incidentes críticos e registro de cada transição na auditoria.

### 3.3 Formulário ANPD
Módulo com as 8 seções do formulário de comunicação de incidente de dados pessoais, com **pré-preenchimento automático** a partir dos dados já registrados no incidente e controle do prazo regulatório.

### 3.4 SLAs e notificações
Acompanhamento de prazos (acionamento em 24h, comunicação à ANPD em 3 dias úteis), com indicadores *no prazo*, *em risco* e *estourado*.

### 3.5 Exercícios de resposta
Planejamento por **calendário**, com tipo (Tabletop, Simulado, Funcional), trilha, responsável e formulários **pré-exercício** (equipes, soluções, playbook, comunicação) e **pós-exercício** (melhorias, soluções efetivas, riscos expostos).

### 3.6 Relatórios
Geração de documentos institucionais em **.docx** (Relatório Preliminar e Relatório Final), separados por trilha de Segurança ou Privacidade.

### 3.7 Dashboards
Métricas consolidadas: volume por período, distribuição por criticidade, categoria, trilha e cumprimento de SLA.

### 3.8 Trilha de auditoria
Registro imutável de criação, edição, mudança de fase, exportação, exclusão lógica (*soft delete*) e acesso a dados pessoais - com autor, data/hora e conteúdo alterado.

### 3.9 Configurações
- **Provisionar aplicação**: órgão, domínio, ambiente, Tenant/Client ID do Microsoft 365 e Google Workspace, provisionamento automático (SCIM) e URL de callback.
- **Perfis de acesso**: matriz granular descrita no item 2.3.
- **Notificações por e-mail**: remetente institucional, cópia permanente, antecedência do aviso de SLA e matriz *evento x perfil* (novo incidente, mudança de fase, criticidade alta, SLA em risco, SLA estourado, comunicação à ANPD, exercícios e resumo diário).
- **MFA local (TOTP)**: parâmetros de segundo fator e códigos de recuperação para contingência.

---

## 4. Identidade visual

- Design System **gov.br** adaptado ao tema institucional escuro da AGU.
- Paleta: azul institucional, amarelo gov.br e acentos em plum/magenta para hierarquia visual.
- Tipografia Raleway, contraste ajustado para acessibilidade (WCAG AA).
- Layout responsivo: navegação lateral no desktop e menu em gaveta no mobile.

---

## 5. Arquitetura técnica

| Camada | Tecnologia |
|---|---|
| Framework | TanStack Start (React 19 + Vite 7) |
| Roteamento | TanStack Router (rotas em `src/routes`) |
| Estilo | Tailwind CSS v4 com tokens semânticos em `src/styles.css` |
| Componentes | shadcn/ui |
| Gráficos | Recharts |
| Exportação | biblioteca `docx` (geração no navegador) |
| Estado/persistência | store própria (`src/lib/sri-store.ts`) com `useSyncExternalStore` + localStorage |

Estrutura principal:

```text
src/
  routes/            telas (login, painel, incidentes, ANPD, notificações,
                     exercícios, relatórios, dashboards, auditoria, configurações)
  components/sri/    AppShell, FieldInput (com mascaramento de PII), Badges
  lib/sri-schema.ts  campos das 7 fases, RBAC, formulário ANPD
  lib/sri-store.ts   estado, SLAs, versionamento e trilha de auditoria
  lib/docx-export.ts geração dos relatórios institucionais
```

**Estágio atual**: protótipo funcional de alta fidelidade, com persistência local no navegador. Não há backend nem banco de dados ainda.

---

## 6. Próximos passos sugeridos

1. Backend gerenciado (banco PostgreSQL, autenticação federada real e RLS por perfil).
2. Integração real com o SSO Microsoft 365/Google e provisionamento SCIM.
3. Disparo efetivo das notificações por e-mail já parametrizadas.
4. Integração com a ferramenta de ITSM para importar o número do chamado.
5. Assinatura digital dos relatórios e retenção WORM em armazenamento auditável.

---

## 7. Roteiro sugerido de demonstração

1. Tela inicial: identidade institucional e acesso por SSO.
2. Painel: leitura rápida da situação.
3. Abertura de um incidente de **Privacidade (IPD)** com relatório preliminar completo.
4. Avanço pelas fases mostrando bloqueio por campo obrigatório e escalonamento.
5. Formulário ANPD pré-preenchido e prazo regulatório.
6. Exportação do relatório em .docx.
7. Exercícios: agendamento pelo calendário e formulários pré/pós.
8. Dashboards e trilha de auditoria.
9. Configurações: perfis granulares e notificações por e-mail.
