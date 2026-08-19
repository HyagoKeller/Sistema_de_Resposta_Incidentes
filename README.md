# Secure Sentinel

Requisitos de Alto Nível — Sistema de Resposta a Incidentes de Segurança da Informação e Privacidade (SRI/AGU)

Base de referência: Plano de Resposta a Incidentes de Segurança da Informação – PRI/AGU (Playbook de Vazamento de Dados), Formulário de Comunicação de Incidente à ANPD (art. 48 LGPD, Resolução CD/ANPD nº 2/2022), protótipo de checklist de 7 fases, e protótipo de tela de login com SSO Microsoft 365 + acesso local.

Plataforma de desenvolvimento: Lovable (front-end + backend Supabase).

1. Contexto e objetivo do sistema

O sistema deve automatizar a geração e o preenchimento estruturado de formulários de resposta a incidentes para as equipes de Segurança da Informação (ETIR/SOC/Gestor de SI) e de Privacidade (Encarregado de Dados/DPO), a partir dos dados coletados ao longo do próprio processo de resposta (classificação, criticidade, evidências, sistemas afetados, datas, responsáveis, encaminhamentos).

Objetivos centrais:

Padronizar a estrutura dos registros de incidente conforme o PRI/AGU (4 fases: Identificação, Análise e Classificação, Contenção/Erradicação/Recuperação, Pós-Incidente).

Aplicar validações que impeçam avanço de fase sem os campos obrigatórios definidos no Playbook ("Ações Obrigatórias" de cada fase).

Produzir, ao final, documentos prontos para auditoria e para comunicação interna/externa — incluindo o Formulário ANPD (art. 48 LGPD) quando aplicável.

Operar separado do ITSM atual (AGU Serviços), pois este trata dados de incidente de forma identificada, sem suporte a pseudonimização/anonimização de titulares nem aos controles de confidencialidade exigidos para dados pessoais sensíveis em investigação.

2. Escopo e não-escopo

Dentro do escopo:

Registro, workflow e trilha de auditoria do ciclo de vida do incidente (as 4 fases do PRI/AGU).

Geração automática do Formulário ANPD (8 seções) a partir dos dados já coletados no incidente, evitando redigitação.

Geração do Relatório Final de Incidente (conforme conteúdo mínimo exigido no Playbook: descrição, cronologia, causa raiz, impacto, dados/titulares afetados, medidas, recomendações, responsáveis e prazos).

Gestão de papéis, permissões e SLAs dos atores do Playbook.

Pseudonimização/anonimização de dados de titulares no armazenamento e nas visualizações não autorizadas.

Fora do escopo (assumido, a confirmar com AGU):

Ferramentas de detecção/monitoramento (SIEM/EDR/SOC) — o sistema recebe alertas/eventos delas, não as substitui.

Gestão de chamados de TI não relacionados a incidentes de segurança/privacidade (permanece no AGU Serviços).

Envio automatizado e definitivo de notificações à ANPD/titulares sem validação humana (o sistema prepara e formata; o envio/protocolo é decisão humana registrada).

3. Perfis de usuário e papéis (RBAC)

Baseado nos atores do Playbook, cada um com permissões distintas:

Papel Escopo de acesso Notificador Cria registro inicial de suspeita; sem acesso a dados de outros incidentes. Acionador / Triagem Registra formalmente o incidente, aciona ETIR e Encarregado. ETIR (Equipe de Resposta) Acesso técnico completo às fases de Análise, Contenção, Erradicação, Recuperação. SOC Registra evidências técnicas, IOCs, correlações; leitura das fases relacionadas. Gestor de Segurança da Informação Aprova classificação de criticidade, autoriza contenção/retorno à operação, valida encerramento. Encarregado de Dados (DPO) / equipe de Privacidade Único perfil com acesso a dados pessoais/titulares não pseudonimizados; preenche e aprova o Formulário ANPD. Jurídico Leitura das avaliações regulatórias; valida providências legais na fase pós-incidente. ASCOM/Comunicação Acesso somente às seções de comunicação institucional/externa. SGE / Governança Leitura consolidada, indicadores, aprovação de encerramento em casos críticos. Administrador do sistema Gestão de usuários, papéis, integrações, parametrização, sem acesso automático a dados de titulares (princípio de necessidade).

RF-001 O sistema deve implementar RBAC granular por fase, por seção do formulário e por campo sensível (ex.: identificação de titulares). RF-002 O acesso a dados pessoais não pseudonimizados deve ser restrito ao Encarregado de Dados e a quem ele explicitamente autorizar, com registro da autorização. RF-003 Deve existir segregação de função entre quem registra o incidente, quem o classifica e quem autoriza o encerramento (princípio de quatro olhos nas etapas críticas).

4. Autenticação, identidade e MFA

Com base no protótipo de login enviado:

RF-010 Autenticação primária via SSO corporativo (Azure AD / Microsoft 365), usando OAuth2/OIDC, com escopos mínimos necessários (openid, profile, email, User.Read). RF-011 Suporte a conta local (para usuários sem AD — ex.: fornecedores/terceiros notificadores) obrigatoriamente com MFA local (TOTP — Google/Microsoft Authenticator, ou WebAuthn/chave de segurança), independentemente do MFA condicional do Azure AD. RF-012 Contas locais devem ter política de senha forte, expiração, bloqueio por tentativas e obrigatoriedade de troca no primeiro acesso. RF-013 Mapeamento de grupos do AD para papéis do sistema (ex.: grupo "ETIR-AGU" → papel ETIR), com sincronização periódica e revogação automática de acesso ao remover o usuário do grupo. RF-014 Sessões devem expirar por inatividade (parametrizável, sugestão: 15–30 min para módulos com dados sensíveis) e exigir reautenticação para ações críticas (aprovar encerramento, gerar comunicação à ANPD). RF-015 Registro de todo login/logout/tentativa falha em log de auditoria imutável.

Observação técnica para o Lovable/Supabase: o Supabase Auth suporta OIDC com Azure AD como provedor externo e MFA (TOTP) nativo para contas locais — ambos os fluxos descritos acima são viáveis nessa stack, mas a configuração do provedor Azure precisa ser feita no Azure Portal (registro de App) e replicada no Supabase, não apenas no front-end.

5. Workflow e máquina de estados do incidente

RF-020 O incidente deve seguir uma máquina de estados alinhada às 4 fases do Playbook, com subestados por atividade obrigatória:

Identificação → Análise e Classificação → Contenção/Erradicação/Recuperação → Pós-Incidente → Encerrado
                         ↘ (paralelo, quando envolve dados pessoais) → Fluxo ANPD/Titulares


RF-021 Transição de fase somente permitida quando todos os campos marcados como obrigatórios ("Ações Obrigatórias") da fase atual estiverem preenchidos — validação bloqueante, não apenas alerta visual. RF-022 O sistema deve permitir abertura simultânea/antecipada da fase de Contenção quando houver "risco crítico ou vazamento ativo" (conforme Playbook), sem esperar a conclusão formal da Análise — ou seja, o workflow precisa suportar fast-track com justificativa obrigatória. RF-023 Cada mudança de estado deve registrar: usuário, papel, timestamp, dados alterados (versionamento/histórico completo, não apenas o estado atual). RF-024 SLAs automatizados com alertas/notificações:

Acionar Encarregado de Dados em até 24h quando houver indício de dados pessoais (conforme Playbook).

Alertar prazo de notificação à ANPD/titulares (prazo sugerido de 3 dias úteis, conforme Playbook e Resolução ANPD).

Alertas de vencimento de RTO aprovado na fase de Recuperação. RF-025 Critérios de escalonamento de cada fase (definidos no Playbook) devem ser campos estruturados (não texto livre), permitindo disparo automático de notificação à ETIR/Gestor de SI quando marcados.

6. Estrutura de dados e formulários por fase

Cada fase do checklist prototipado deve virar um formulário estruturado e versionado. Resumo dos campos-chave (já validados no protótipo checklist.html) que o sistema deve suportar nativamente:

Fase 1 — Identificação e Registro Inicial

ID do incidente (gerado automaticamente, não editável), data/hora de detecção e de registro, origem/forma de detecção, descrição preliminar, preservação de evidências e cadeia de custódia (com responsável e tipo de evidência).

Fase 2 — Análise e Classificação

Acionamento do DPO (data/hora), tipo/classificação do incidente, envolvimento de dados pessoais/sensíveis (booleano estruturado, não texto), criticidade (Baixa/Média/Alta/Crítica), ativos afetados, vetor de ataque, IOCs.

Fase 3, 4, 5 — Contenção, Erradicação, Recuperação

Listas dinâmicas de ações (data/hora, ação, responsável) — repetíveis (o protótipo já usa "+ Adicionar Ação"), bloqueios/isolamentos, causa-raiz, testes pré-retorno, autorização formal de retorno.

Fase 6 — Comunicação Corporativa e Regulatória

Comunicação interna, CTIR.GOV (protocolo), avaliação jurídico/DPO, notificação ANPD (protocolo, data), notificação a titulares (canal), ASCOM/porta-voz/mensagens aprovadas.

Fase 7 — Pós-Incidente

Relatório final, lições aprendidas, impacto (operacional/financeiro/reputacional), plano de ação corretivo (ação, prazo, responsável — lista dinâmica), encerramento formal (aprovador, data).

RF-030 Todos os campos de data/hora devem registrar automaticamente timezone e usuário responsável pelo preenchimento (não apenas o valor). RF-031 Listas dinâmicas (ações de contenção, erradicação, recuperação, plano corretivo) devem suportar número ilimitado de itens, edição e exclusão com trilha de auditoria (soft delete, nunca exclusão física de item já salvo). RF-032 Campos de "Ativos/Sistemas Afetados" e "Proprietário do Ativo" devem, idealmente, referenciar um CMDB/inventário de ativos (integração futura) — no MVP, campo estruturado com autocomplete a partir de lista cadastrada.

7. Módulo do Formulário ANPD (art. 48 LGPD)

RF-040 O sistema deve reproduzir fielmente as 8 seções do formulário ANPD já mapeadas no protótipo: (1) Dados do Controlador, (2) Encarregado/DPO e Notificante, (3) Tipo de Comunicação e Avaliação de Risco, (4) Ciência da Ocorrência e Tempestividade, (5) Comunicação aos Titulares, (6) Descrição do Incidente, (7) Impactos/Titulares, (8) Medidas de Segurança. RF-041 Campos que já existem no registro do incidente (datas, descrição, sistemas afetados, medidas de contenção) devem ser pré-preenchidos automaticamente a partir das fases 1–6, exigindo apenas complementação — não redigitação. RF-042 O tipo de comunicação (Completa/Preliminar/Complementar) deve controlar quais campos são obrigatórios, replicando a lógica condicional do protótipo (ex.: "Preliminar" exige complementação em até 20 dias úteis — o sistema deve criar um lembrete/tarefa automática nesse prazo). RF-043 O formulário ANPD só pode ser criado/editado pelo Encarregado de Dados ou por quem ele delegar explicitamente, mesmo que os dados de origem venham de outras fases preenchidas por ETIR/SOC. RF-044 Deve existir exportação do Formulário ANPD em formato compatível com protocolo (PDF/DOCX) e, se a ANPD disponibilizar API/portal oficial no futuro, o desenho deve permitir integração posterior — não é requisito de MVP. RF-045 Justificativas de não cumprimento de prazo (ex.: "Justifique, se cabível, a não realização da comunicação completa à ANPD... no prazo de 3 dias úteis") devem ser campos obrigatórios condicionais quando o prazo for ultrapassado, e não apenas texto opcional.

8. Geração de documentos e exportação

RF-050 Geração automática de Relatório Final de Incidente em .docx, com layout institucional AGU (timbre, rodapé conforme o Playbook original), contendo os 8 elementos mínimos exigidos: descrição, cronologia, causa raiz, impacto, dados/titulares afetados, medidas adotadas, recomendações, responsáveis/prazos. RF-051 Geração do Formulário ANPD em PDF/DOCX pronto para protocolo, com numeração de seções e campos idênticos ao modelo oficial. RF-052 Toda exportação deve ser assinada digitalmente ou, no mínimo, registrada com hash/checksum e log de quem gerou, quando e a partir de qual versão dos dados (para garantir integridade probatória). RF-053 Documentos gerados devem ser armazenados de forma imutável (WORM — write once, read many) vinculados ao incidente, distintos dos dados "vivos" que continuam sendo editados.

9. Privacidade by design — pseudonimização e anonimização

Este é o motivo central para não usar o ITSM atual — deve ser tratado como requisito não funcional crítico, não incidental.

RNF-001 Dados de titulares (nome, CPF, e-mail etc.) devem ser armazenados de forma pseudonimizada por padrão nas tabelas de trabalho consultadas por ETIR/SOC; o mapeamento reverso (dado real) fica em tabela segregada, acessível apenas ao Encarregado de Dados (ou via função privilegiada com log obrigatório). RNF-002 Campos de "Impactos/Titulares" e "Descrição do Incidente" devem ter mecanismo de mascaramento de PII na exibição para papéis sem autorização (ex.: ETIR vê "titular #A231" em vez do nome). RNF-003 Deve existir função de anonimização irreversível para dados retidos além do prazo legal de retenção, preservando estatísticas agregadas para indicadores de governança. RNF-004 Minimização de dados: campos que não sejam estritamente necessários para a resposta técnica ao incidente não devem ser replicados para os módulos técnicos (ETIR/SOC) — permanecem restritos ao módulo de privacidade. RNF-005 Toda visualização/exportação de dados não mascarados deve gerar entrada em log de acesso a dados pessoais (quem, quando, qual finalidade declarada).

10. Segurança da informação (requisitos não funcionais)

RNF-010 Criptografia em trânsito (TLS 1.2+) e em repouso para todo dado do sistema, com atenção especial a evidências digitais e dados de titulares. RNF-011 Trilha de auditoria imutável (append-only) de todas as ações: criação, edição, mudança de fase, geração de documento, acesso a dados sensíveis, login/logout — retenção conforme política institucional (a definir com AGU, sugestão mínima 5 anos dado o caráter probatório). RNF-012 Cadeia de custódia digital para evidências anexadas (logs, prints, imagens de disco): hash no momento do upload, registro de quem anexou, e bloqueio de alteração/substituição do arquivo original (apenas versionamento aditivo). RNF-013 Backup e recuperação com RPO/RTO definidos (a alinhar com política de continuidade da AGU) — o próprio sistema de resposta a incidentes não pode ficar indisponível durante um incidente que afete a infraestrutura geral (considerar isolamento de rede/hospedagem). RNF-014 Segregação de ambientes (desenvolvimento, homologação, produção) com dados sintéticos em não produção — nunca dados reais de titulares fora de produção. RNF-015 Testes de segurança (pentest/análise de vulnerabilidade) antes de go-live e periodicamente, dado que o sistema concentra dados de incidentes de segurança (alvo de alto valor). RNF-016 Princípio do menor privilégio em toda integração (AD, e-mail, futura integração ITSM) — tokens/credenciais de integração com escopo mínimo e rotação periódica.

11. Integrações

RF-060 Active Directory / Azure AD: autenticação (RF-010/013), e opcionalmente leitura de atributos organizacionais (departamento, gestor) para preenchimento automático de "Responsável" nos formulários. RF-061 AGU Serviços (ITSM): integração leve e unidirecional (ou por referência) — ex.: o incidente no SRI pode referenciar um número de chamado do ITSM (para rastreabilidade operacional geral) sem replicar dados pessoais/sensíveis para lá. A definir com a equipe de TI se será via API, webhook, ou apenas campo de referência manual no MVP. RF-062 E-mail corporativo: disparo de notificações de SLA e alertas de escalonamento (ex.: acionamento automático da ETIR, do DPO, do Gestor de SI). RF-063 CTIR.GOV: no MVP, campo estruturado para registrar protocolo de notificação (processo manual); integração automática é melhoria futura, não requisito inicial. RF-064 Todas as integrações externas devem passar por camada de auditoria e não devem expor dados pseudonimizados/pessoais sem controle explícito de finalidade.

12. Modelo de dados — entidades de alto nível

Para orientar a modelagem no Lovable/Supabase:

Incidente (ID, fase atual, criticidade, datas-chave, status)

Evidência (tipo, hash, responsável, incidente_id, cadeia de custódia)

AçãoResposta (fase, tipo — contenção/erradicação/recuperação/corretiva, data/hora, responsável, incidente_id)

TitularAfetado (identificador pseudonimizado, categoria de dado, mapeamento reverso em tabela restrita)

ComunicaçãoRegulatória (tipo — interna/ANPD/CTIR/titulares, protocolo, data, canal)

FormularioANPD (vinculado 1:1 ou 1:N ao incidente, com as 8 seções, status de preenchimento)

RelatorioFinal (versão gerada, hash, data de geração, autor)

LogAuditoria (ator, ação, entidade afetada, timestamp, IP/dispositivo)

Usuário/Papel (vínculo com AD, papel no sistema, MFA ativo)

RF-070 O modelo deve permitir 1 incidente → N ações de resposta, N evidências, N comunicações, e no máximo 1 formulário ANPD ativo por tipo (Completa/Preliminar/Complementar) por incidente, com versionamento entre eles (Preliminar → Complementar referencia a Preliminar original).

13. Requisitos de usabilidade e acessibilidade

RF-080 Interface deve seguir o padrão wizard multi-seção já prototipado (barra de progresso "X/N seções", navegação Anterior/Próxima), mantendo dados salvos automaticamente a cada seção (autosave) para evitar perda em incidentes que se estendem por dias. RF-081 Indicadores visuais claros de campo obrigatório vs. opcional vs. condicional (já presentes no protótipo com *). RF-082 Acessibilidade mínima WCAG 2.1 AA, por se tratar de sistema de órgão público federal (exigência do Modelo de Acessibilidade em Governo Eletrônico — eMAG).

14. Governança, indicadores e melhoria contínua

RF-090 Painel de indicadores para SGE/Gestor de SI: número de incidentes por criticidade/tipo, tempo médio por fase, % de cumprimento de SLA (24h DPO, 3 dias ANPD), incidentes com plano corretivo pendente. RF-091 Registro estruturado (não texto livre) de "Lições Aprendidas" e "Plano de Ação Corretivo" com responsável, prazo e status, permitindo acompanhamento e reabertura se vencido. RF-092 Suporte a exercícios/simulações (tabletop exercises) mencionados no Playbook — possibilidade de criar incidentes marcados como "simulação", que seguem o mesmo fluxo mas não geram notificação real à ANPD/titulares nem contam nos indicadores de incidentes reais.

15. Pontos em aberto para validar com a AGU antes de especificar no Lovable

Qual será o repositório de identidade oficial para o mapeamento de grupos AD → papéis do sistema, e quem administra esse mapeamento?

Existe política de retenção documental já definida para incidentes (prazo de guarda de evidências/relatórios) ou isso precisa ser definido junto com este projeto?

A integração com o AGU Serviços será obrigatória no MVP ou pode ficar para uma fase 2 (apenas campo de referência manual no início)?

Quem, formalmente, poderá ver dados de titulares não pseudonimizados além do Encarregado — existe um adjunto/substituto formal (o Playbook já lista Débora Cristina de Carvalho Rodrigues como substituta)?

Hospedagem: dado tratar-se de órgão público federal, há exigência de hospedagem em nuvem governamental/soberana que restrinja o uso do Supabase padrão (pode exigir avaliação jurídica/SI antes de confirmar a stack do Lovable)?

Qual o volume esperado de incidentes/ano, para dimensionar retenção e performance?

Este documento consolida: (i) o Playbook PRI/AGU de resposta a vazamento de dados, (ii) o formulário ANPD prototipado, (iii) o checklist de 7 fases prototipado, e (iv) a tela de login prototipada. Ele foi organizado como requisitos de alto nível (RF = requisito funcional, RNF = requisito não funcional) para servir de base a um prompt de especificação técnica no Lovable — recomenda-se detalhar cada RF em user stories antes da implementação.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://incident-guardian-shield.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0de1c13b-c2fc-460a-828a-a874b9754f40).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
