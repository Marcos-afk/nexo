# Nexo Assist — Plano de desenvolvimento

> Documentos irmãos: `PRD_Nexo_Assist_Mapeamento.md` (o que o PRD exige) e `Plus_Prototipo_Fora_do_PRD.md` (extras do protótipo, IDs `X-nn`).
> Critérios citados aqui usam os IDs desses arquivos (por exemplo `T6`, `V3`, `X-39`).
>
> **Como ler:** a seção 2 ensina o Mastra do zero. A seção 5 (Fase 0) é um treino com saída verificável antes de construir o produto. Do resto em diante é o plano de construção.
>
> Legenda: **[Verificado]** = conferi na documentação oficial do Mastra nesta sessão. **[Validar]** = suposição minha que a Fase 0 precisa confirmar. **[Decisão]** = escolha de arquitetura, com motivo.

---

## 1. Decisões de arquitetura

| # | Decisão | Motivo | Alternativa descartada |
|---|---|---|---|
| A1 | **Next.js (App Router) + TypeScript `strict`**, um único repositório | O PRD sugere Next/React; um repositório simplifica rodar e avaliar | Front e back separados: mais peças para o avaliador subir |
| A2 | **Mastra** para o agent | Preferência do PRD; já traz tools, tracing, Studio e evals | LangGraph.js: sem ganho aqui |
| A3 | **Serviço de chamados como módulo próprio** (`src/services`), sem importar nada de `src/agent` | PRD: "separado do agent". As tools do agent são adaptadores finos sobre o serviço | Lógica de negócio dentro das tools |
| A4 | **O agent nunca cria chamado.** Ele só monta um **rascunho**. Quem cria é um endpoint chamado pelo botão "Confirmar" | Garante "só cria depois da confirmação" **por construção**, sem depender do prompt | Confiar no modelo para pedir confirmação |
| A5 | **Identidade do usuário vem da sessão**, entra no agent via `requestContext` e nunca como argumento que o modelo escolhe | Garante privacidade (P1 a P3) mesmo com prompt injection | Passar `userId` no prompt ou como parâmetro da tool |
| A6 | **Conversa fora do modo "agent" não chama o LLM** | Garante o silêncio do agent (T6) e custo zero nesse período | Instruir o modelo a ficar quieto |
| A7 | **Banco de domínio em SQLite via libSQL**, arquivo separado do banco do Mastra | Roda local sem infraestrutura, sobrevive a reinício (S1, S2) e o mesmo driver aponta para Turso no deploy | Postgres: exige serviço extra para quem avalia |
| A8 | **Nosso banco é a fonte da verdade das mensagens** (funcionário, agent, analista, eventos de sistema) | O console precisa de uma linha do tempo única, com mensagens humanas | Memory do Mastra como histórico: dividiria a verdade em dois lugares. **Confirmada no spike S2** (ver `Spikes_Resultados.md`) |
| A9 | **Pipeline em dois tempos:** (1) triagem com saída estruturada, (2) resposta com tools. Regras duras ficam em **código** entre os dois | Entrega o "entendeu / ação / confiança / por quê" (V3) e permite regras determinísticas (transferir por baixa confiança, crítico, vencido) | Um agent único com prompt gigante: opaco e difícil de testar |
| A10 | **Tempo real por SSE** dentro do próprio Next, com *pub/sub* em memória | Suficiente para uma instância; simples de explicar | WebSocket ou serviço externo: peso sem necessidade |
| A11 | **Relógio injetável** (`Clock`) em toda regra de prazo | Permite testar "há 5 dias", horas úteis e 13:43 sem esperar | `Date.now()` espalhado |
| A13 | **ORM: Drizzle** sobre libSQL; o projeto vive na raiz `nexo/`, com `src/` e `doc/` lado a lado | Tipos fortes no schema e migrations versionadas; sem pasta extra para quem avalia | SQL puro: mais código repetido |
| A12 | **Provedor de LLM: Google Gemini**, pela API do Google AI Studio, no plano gratuito | Gratuito; o Mastra suporta pelo roteador de modelos (`google/<modelo>`). Detalhes e cuidados na seção 12 | Provedores pagos: custo desde o primeiro teste |

> **Honestidade sobre A9:** a "confiança" que o modelo informa é uma estimativa dele, não uma probabilidade calibrada. Vamos combiná-la com **sinais determinísticos** (acerto da busca na central, ambiguidade, falhas de ferramenta) e dizer isso no README. Isso é bom ponto de entrevista.

---

## 2. Mastra em uma página

Tudo abaixo vem da documentação oficial **[Verificado]**. Fontes na seção 14.

### 2.1 Conceitos e onde cada um entra no projeto

| Conceito | O que é | Uso no Nexo Assist |
|---|---|---|
| **Agent** | Classe `Agent` (`@mastra/core/agent`) com `id`, `name`, `instructions`, `model`, `tools` | Dois agents: **triagem** e **atendimento** |
| **Model router** | O modelo é uma string `provider/model`; cada provedor lê sua própria variável de ambiente (ex.: `OPENAI_API_KEY`) | Trocar de provedor vira troca de string e de variável |
| **Tool** | `createTool` (`@mastra/core/tools`) com `id`, `description`, `inputSchema` (Zod), `execute` | Consultar chamados, buscar artigo, montar rascunho, transferir |
| **requestContext** | Objeto tipado (`RequestContext` em `@mastra/core/request-context`) passado em `generate`/`stream` e lido no 2º argumento do `execute` da tool | Carrega `employeeId` e `conversationId` da sessão para as tools |
| **Structured output** | Opção `structuredOutput: { schema }`; resultado em `response.object` (ou `await stream.object`) | Saída da triagem: intenção, entendimento, confiança, motivo |
| **Streaming** | `agent.stream()` expõe `textStream`, `fullStream`; `toolCalls`, `toolResults`, `steps`, `usage` são promessas que resolvem no fim | Mostrar texto em tempo real e registrar as ações |
| **Mastra instance** | `new Mastra({ agents, storage, observability, ... })` em `src/mastra/index.ts` | Registro central |
| **Storage** | `LibSQLStore` (`@mastra/libsql`) passado à instância; **com Next.js, usar caminho `file:` absoluto** | Guarda traces e snapshots de aprovação |
| **Memory** | `Memory` (`@mastra/memory`) ligada ao agent, com `thread` e `resource` por chamada; `lastMessages` controla o histórico | **Não vamos usar no início** (A8); decisão revista no spike S2 |
| **Observability** | `Observability` (`@mastra/observability`) com exportador `MastraStorageExporter`; cada agent run, tool call e chamada ao modelo vira um *span*, com duração, tokens e custo estimado | Base para o painel de decisão (X-39) e métricas de custo |
| **Studio** | Interface local do Mastra para conversar com agents e ver traces | Depurar sem construir UI |
| **Workflows** | `createStep` / `createWorkflow` (`@mastra/core/workflows`) com `.then()` e `.commit()`; suspend/resume | Opcional: pipeline de transferência (resumo + atribuição) |
| **Aprovação de tool** | `requireApproval: true` na tool pausa antes de executar; retoma com `approveToolCall` / `declineToolCall` | **Alternativa** ao rascunho do A4. Ver 2.3 |
| **Scorers / Evals** | `@mastra/evals`: `checks.calledTool(...)`, `checks.includes(...)` e *scorers* prebuilt | Testes de comportamento do agent (seção 9) |

### 2.2 Esqueleto mínimo que você vai escrever no spike S1

```ts
// src/mastra/tools/search-help-articles.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const searchHelpArticles = createTool({
  id: "search-help-articles",
  description: "Busca artigos da central de ajuda de TI",
  inputSchema: z.object({ query: z.string() }),
  execute: async (inputData, context) => {
    // services nunca são importados do agent; a tool só adapta
    return { articles: [] };
  },
});
```

```ts
// src/mastra/agents/support-agent.ts
import { Agent } from "@mastra/core/agent";

export const supportAgent = new Agent({
  id: "support-agent",
  name: "Nexo Assist",
  instructions: "…",
  model: "provedor/modelo",
  tools: { searchHelpArticles },
});
```

```ts
// src/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

export const mastra = new Mastra({
  agents: { supportAgent },
  storage: new LibSQLStore({ id: "mastra-storage", url: "file:/CAMINHO/ABSOLUTO/mastra.db" }),
});
```

### 2.3 Dois jeitos de "confirmar antes de agir" (e por que escolhi um)

| | **Rascunho + endpoint (A4)** | **`requireApproval` do Mastra** |
|---|---|---|
| Como funciona | O agent chama `montar_rascunho`; o cartão aparece com Confirmar / Editar / Cancelar; o botão chama `POST /drafts/:id/confirm` | A tool `criar_chamado` pausa antes de rodar; a UI responde com aprovar ou recusar |
| Combina com o protótipo | **Sim.** O protótipo tem "Rascunho D-381" e botão "Editar" | Parcial: "Editar" não existe nesse modelo |
| Garantia | O agent **não tem** a ferramenta de criar | O agent tem a ferramenta; a pausa protege |
| Sobrevive a reinício | Sim (rascunho no nosso banco) | Depende de *snapshots* no storage |
| Valor didático | Mostra desenho de domínio | Mostra recurso do framework |

**Decisão:** rascunho + endpoint. Em contrapartida, o **spike S5** experimenta `requireApproval` numa tool de brinquedo, para você poder falar do recurso na entrevista.

### 2.4 Limites que a documentação deixa claros

- **Estrutura + tools no mesmo chamado:** alguns modelos não aceitam os dois juntos. A documentação lista três saídas (`jsonPromptInjection`, um modelo separado só para estruturar, ou `prepareStep`). Nosso desenho de dois tempos (A9) **evita o problema**: a triagem usa só saída estruturada, e o atendimento usa só tools.
- **Next.js:** o pacote do Mastra usa módulos só de Node. O guia de integração recomenda marcá-lo como externo ao empacotamento. A busca trouxe isso, mas a página do guia que li não mostrou a configuração exata **[Validar no spike S3]**.
- **Leitura programática de traces:** a documentação não mostra uma API para ler traces dentro do app **[Validar]**. Por isso o painel de decisão (X-39) **grava as decisões no nosso banco** em vez de depender da leitura de traces.
- **`runEvals`:** a página de evals cita, mas não mostra código **[Validar]**. Plano B na seção 9.

---

## 3. Arquitetura

### 3.1 Camadas

```
┌──────────────────────────── Interface (Next.js, React) ─────────────────────────────┐
│  /login   /chat   /perfil          /console (analista)                              │
│  useChat + SSE                      lista · conversa · painel de chamados           │
└───────────────▲──────────────────────────────────▲──────────────────────────────────┘
                │ route handlers (src/app/api)     │ SSE
┌───────────────┴──────────────────────────────────┴──────────────────────────────────┐
│ Orquestração de conversa (src/conversation)                                         │
│  1. checa sessão e limite de 30    4. política em código (regras duras)             │
│  2. conversa em modo "agent"?      5. atendimento (agent + tools)                   │
│     senão: grava e NÃO chama LLM   6. grava mensagem + decisão + eventos           │
│  3. triagem (saída estruturada)    7. publica no pub/sub                            │
└───────▲───────────────────────────────────────────▲─────────────────────────────────┘
        │ chama                                      │ chama
┌───────┴────────────────┐                  ┌────────┴───────────────────────────────┐
│ Agent (src/mastra)     │   tools finas    │ Serviços de domínio (src/services)     │
│ triagem · atendimento  ├─────────────────►│ tickets · help-center · conversations  │
│ tools · instruções     │ requestContext   │ drafts · sla · employees · analysts    │
└────────────────────────┘ (employeeId)     └────────┬───────────────────────────────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       │ Persistência (src/db)     │
                                       │ app.db (domínio)          │
                                       │ mastra.db (traces)        │
                                       └───────────────────────────┘
```

**Regra de dependência:** `services` não importa `mastra` nem `app`. `mastra` importa `services`. `conversation` importa os dois. `app` importa `conversation`. Podemos reforçar isso com uma regra de lint de fronteira de módulos.

### 3.2 Fluxo de uma mensagem do funcionário

1. **Entrada.** `POST /api/chat` recebe o texto. A sessão fornece `employeeId`.
2. **Limite.** Se a sessão já tem 30 mensagens do usuário, responde com erro tipado e a UI bloqueia (X-17).
3. **Modo.** Se a conversa **não** está em `agent`, grava a mensagem, publica para o console e **para aqui**, sem LLM (A6).
4. **Triagem (LLM 1, modelo pequeno).** Saída estruturada: `intent`, `entities`, `understood`, `confidence`, `rationale`, `signals`.
5. **Política (código).** Funções puras decidem, por exemplo:
   - pedido explícito de analista → transferir;
   - prioridade crítica → transferir;
   - chamado vencido → oferecer analista;
   - `confidence` abaixo do limiar → transferir com motivo "agent sem segurança";
   - assunto fora de TI → resposta fixa de redirecionamento, sem tools.
6. **Atendimento (LLM 2, com tools).** Recebe a intenção, o histórico e **só as tools permitidas** para aquela intenção. As tools leem `employeeId` do `requestContext`.
7. **Gravação.** Mensagem do agent, **decisão completa** (triagem + política + tools com entrada, saída e duração + tokens + latência) e eventos de sistema.
8. **Publicação.** Evento SSE para o chat e para o console.

> **Custo:** são dois chamados ao modelo por mensagem em fluxos com ferramentas. A triagem usa um modelo menor. Respostas de política (escopo, limite, transferência direta) **não** chamam o segundo modelo. Isso responde ao critério de eficiência do PRD.

### 3.3 Estados da conversa

```
            ┌───────────── devolver ao agent ─────────────┐
            ▼                                              │
        ┌───────┐  transferir   ┌────────────────────┐  assumir   ┌────────────────┐
 início ► agent ├─────────────► │ aguardando_atendente├──────────► │ com_analista   │
        └───┬───┘               └─────────┬──────────┘            └───────┬────────┘
            │                             │ devolver ao agent             │ encerrar
            │ resolvida                   ▼                               ▼
            └──────────────────────► encerrada ◄──────────────────────────┘
```

| Estado | Quem responde | Etiqueta no console |
|---|---|---|
| `agent` | Agent | "Agent atendendo" |
| `aguardando_atendente` | Ninguém (fila) | "Transferida · …" ou "Agent pediu ajuda · confiança N%" |
| `com_analista` | Analista | "Você está atendendo" |
| `encerrada` | — | "Resolvida pelo agent" ou encerrada pelo analista |

Cada transição grava um **evento de sistema** (X-31) e muda o status do chamado quando há um vinculado (X-34).

### 3.4 Modelo de dados (resumo)

| Tabela | Campos principais |
|---|---|
| `employees` | id, name, email, department, role (`employee` / `analyst`), level (N1/N2), availability, password_changed_at |
| `sessions` | id, employee_id, remember, user_message_count, created_at, expires_at |
| `help_articles` | id, title, body, tags, conditions (ex.: versão do Windows) |
| `tickets` | id, number (`INC-…` / `REQ-…`), type, category, subcategory, title, description, priority, status, owner_id, affected, created_at, updated_at, due_at, resolved_at |
| `ticket_events` | id, ticket_id, kind (criado, atualizado, reaberto, transferido, assumido, resolvido), actor, payload, created_at |
| `drafts` | id (`D-…`), conversation_id, mode (`create` / `update` / `reopen`), target_ticket_id, payload, status (`pending` / `confirmed` / `cancelled`) |
| `conversations` | id, employee_id, mode, assigned_analyst_id, handoff_reason, handoff_summary, contact_due_at, ticket_id, created_at, updated_at |
| `messages` | id, conversation_id, author_kind (`employee` / `agent` / `analyst` / `system`), author_id, content, parts, created_at, delivered_at, read_at |
| `decisions` | id, message_id, intent, understood, action, confidence, rationale, signals, tool_calls, tokens_in, tokens_out, latency_ms, model |

---

## 4. Estrutura de pastas

```
nexo/                       # raiz do projeto (repositório)
├─ src/
│  ├─ app/                    # rotas Next (páginas e route handlers)
│  │  ├─ (auth)/login
│  │  ├─ (employee)/chat · perfil
│  │  ├─ (analyst)/console
│  │  └─ api/chat · drafts · conversations · stream · stats · auth
│  ├─ ui/                     # componentes (sidebar, balão, cartão, selo…)
│  ├─ conversation/           # orquestração: limite, modo, triagem, política, gravação
│  ├─ mastra/                 # agents, tools, instruções, índice do Mastra
│  ├─ services/               # tickets, help-center, drafts, sla, handoff, stats
│  ├─ domain/                 # tipos, enums, erros tipados, regras puras
│  ├─ db/                     # schema, migrations, seed
│  ├─ realtime/               # pub/sub e SSE
│  └─ lib/                    # clock, ids, logger estruturado
├─ tests/                     # unit · integration · agent-evals
├─ doc/                       # PRD, plano, protótipo (nexo.pen, nexo.html)
├─ .env.example
└─ README.md
```

Convenções (do seu `coding-guide`): identificadores em inglês, textos de interface em português, erros tipados, logs estruturados, imutabilidade e mapas de busca no lugar de `if/else` encadeado. Vou carregar o guia antes de escrever código.

---

## 5. Fase 0 — Aprender o Mastra com spikes

Objetivo: tirar o medo da ferramenta e **validar as suposições [Validar]** antes de construir. Cada spike é pequeno, com saída verificável. Faça num projeto descartável (`spikes/`), fora do repositório final.

**Pré-requisito:** Node 22.18 ou superior. O seu é o 24.19, então está certo. Você precisa de uma **chave de API do Gemini** (Google AI Studio, plano gratuito) em `GOOGLE_GENERATIVE_AI_API_KEY`.

> **Segurança de dependências:** antes de cada `pnpm add`, rodamos o checklist da sua skill `dep-install-audit` (idade da versão, scripts de instalação, versão exata). O Mastra tem muitas dependências transitivas, então vale o cuidado.

### S1 — Primeiro agent com uma tool (alvo: 1 sessão)

1. Criar um projeto com `npm create mastra@latest` **ou** instalar na mão: `@mastra/core`, `zod`, `typescript`, `@types/node` e `mastra`.
2. Escrever a tool `search-help-articles` e o agent da seção 2.2.
3. Rodar `mastra dev` e conversar pelo **Studio**.
4. Ver no Studio qual tool foi chamada, com que entrada e saída.

**Pronto quando:** você pergunta "erro 809 na VPN" e vê a tool sendo chamada no Studio.

### S2 — `requestContext`, histórico e memória ✅ (concluído em 27/10/2026)

1. Passar `employeeId` por `RequestContext` e lê-lo dentro da tool (`context.requestContext.get(...)`).
2. Provar que a tool **ignora** qualquer `employeeId` que o modelo tente passar (A5).
3. Chamar o agent com um **array de mensagens** vindo do seu banco, **sem** `Memory` **[Verificado no S2: aceita array]**.
4. Comparar com `Memory` (`thread` e `resource`) e decidir A8.

**Pronto quando:** o histórico do seu banco chega ao modelo, e uma tool consegue ler o dono vindo do contexto.

### S3 — Next.js com streaming (alvo: 1 sessão)

1. Criar o app Next e rodar `npx mastra@latest init`.
2. Instalar `@mastra/ai-sdk`, `@ai-sdk/react` e `ai`.
3. Criar `/api/chat` com `handleChatStream` e uma página com `useChat`.
4. Resolver a configuração de pacote externo do Next **[Validar]**.
5. Usar caminho **absoluto** `file:` no `LibSQLStore`.

**Pronto quando:** o texto aparece em tempo real no navegador e a conversa sobrevive a um reinício do servidor.

### S4 — Saída estruturada e confiança (alvo: 1 sessão)

1. Criar um agent de triagem com `structuredOutput: { schema }` (Zod) e ler `response.object`.
2. Schema: `intent` (enum), `understood`, `confidence` (0–100), `rationale`, `signals`.
3. Rodar 10 frases (inclusive ambíguas e fora de TI) e olhar a distribuição da confiança.
4. Anotar: a confiança varia de forma útil? Qual limiar parece razoável?

**Pronto quando:** a triagem devolve objeto válido nas 10 frases e você tem um limiar candidato.

### S5 — Aprovação de tool e workflow (alvo: 1 sessão, só aprendizado)

1. Marcar uma tool de brinquedo com `requireApproval: true`.
2. Tratar `tool-call-approval` no stream e responder com `approveToolCall` / `declineToolCall`.
3. Criar um workflow de 2 passos com `createStep`, `createWorkflow`, `.then()` e `.commit()`.

**Pronto quando:** você consegue explicar a diferença entre aprovar, suspender/retomar e workflow, e por que escolhemos o rascunho (2.3).

### S6 — Observabilidade, custo e latência (alvo: 1 sessão)

1. Configurar `Observability` com `MastraStorageExporter` e `SensitiveDataFilter`.
2. Ver os spans no Studio: modelo, tools, tokens, duração.
3. Medir tokens e tempo por mensagem nos dois modelos.
4. Descobrir se dá para **ler** os dados de traces dentro do app **[Validar]**. Se não der, seguimos gravando decisões no nosso banco.

**Pronto quando:** você tem um número de tokens e latência por mensagem e sabe de onde cada dado vem.

### Saída da Fase 0

Um arquivo curto `doc/Spikes_Resultados.md` com: o que funcionou, o que mudou no plano, versões exatas dos pacotes e o limiar de confiança. **Se algum spike derrubar uma decisão (A8, A9), ajustamos o plano aqui antes da Fase 1.**

---

## 6. Fases de construção

Tamanho: **P** pequeno (meia sessão) · **M** médio (1 sessão) · **G** grande (2 ou mais sessões).

### Fase 1 — Fundação (M)

- Projeto Next + TS `strict`, lint, formatação, teste (Vitest), `.env.example`.
- Tokens de design do protótipo como variáveis CSS (X-44).
- Logger estruturado, `Clock`, geração de IDs, erros tipados.
- Estrutura de pastas e regra de fronteira entre camadas.

**Pronto quando:** `pnpm dev` sobe uma página vazia e `pnpm test` roda um teste.

### Fase 2 — Domínio e serviços (G)

- Schema e migrations; **seed** alinhado ao protótipo (seção 5 do arquivo de plus, D-02, D-13).
- `sla`: horas úteis, prazo, vencido (**testes primeiro**: exemplo 09:43 + 4 h úteis = 13:43; INC-20311 "há 5 dias" vencido).
- `tickets`: consultar (sempre por dono), criar, atualizar, reabrir (≤ 7 dias), transferir, eventos.
- `help-center`: busca de artigos, com a condição de versão do Windows.
- `drafts`, `conversations`, `handoff` (resumo).
- Simulação de indisponibilidade do sistema legado, com *retry*.

**Pronto quando:** testes cobrem prazo, duplicidade, reabertura, privacidade e falha simulada, **sem nenhum LLM**.
**Cobre:** D1 a D5, Q5, P1 a P3, T7, S1, S2.

### Fase 3 — Agent e orquestração (G)

- Tools finas: `list_my_tickets`, `get_ticket`, `search_help_articles`, `find_similar_tickets`, `build_draft`, `request_handoff`.
- Agent de triagem (saída estruturada) e agent de atendimento (tools), com instruções em português.
- Política em código (transferência, escopo, vencido, confiança).
- `conversation`: limite de 30, modo, gravação de decisões.
- Tolerância a falhas: *retry* do serviço, erro tipado, mensagem clara.

**Pronto quando:** os cenários 1 a 20 do arquivo de mapeamento passam como **evals automatizados** (seção 9).
**Cobre:** H1 a H5, Q1 a Q4, A1 a A9, D1 a D5, T1 a T6, P5, V1 a V5.

### Fase 4 — API e tempo real (M)

- `POST /api/chat` (streaming), `GET` do histórico, endpoints de rascunho (confirmar, editar, cancelar).
- Autenticação simulada, cookie de sessão com "manter conectado" (X-03), perfis (X-10).
- SSE para chat e console, com reconexão (X-41).
- `GET /api/stats` (métricas do login, X-01) e saúde do assistente (X-09).

**Pronto quando:** dá para conversar por `curl`/cliente HTTP, ver o streaming, confirmar rascunho e receber evento no console.

### Fase 5 — Interface do funcionário (G)

- Login (X-01 a X-06), barra lateral (X-07 a X-10).
- Chat: linha de ações, chips, cartão de rascunho com prazo e atalho (X-11 a X-18), seletor e cartão de chamado, contador, estados (X-19, X-20).
- **Painel de decisão (X-39):** abre a decisão gravada de cada resposta.
- Meu perfil (X-21 a X-23).

**Pronto quando:** as Telas 1, 2, 3 e 6 funcionam ponta a ponta e batem com o protótipo.

### Fase 6 — Console do analista (G)

- Trilho, disponibilidade, busca, filtros com contadores, lista com etiquetas (X-24 a X-28).
- Conversa: cabeçalho, mensagens com identificação, eventos, barra de assunção, assumir / devolver / encerrar (X-30 a X-34).
- Painel de chamados (X-35), resumo do caso (X-38), decisões do agent no console (V6).
- "Digitando…" (X-29).

**Pronto quando:** uma transferência feita no chat aparece no console, e o ciclo assumir → responder → devolver/encerrar funciona com o funcionário vendo tudo.

### Fase 7 — Qualidade, custo e segurança (M)

- Revisão de privacidade (testes P1 a P5), chaves fora do código, limites de tamanho de entrada.
- Medição de tokens e latência por conversa; ajustar modelos e tamanho de contexto.
- Estados de erro e vazio (X-19, X-40), acessibilidade básica (X-43).
- Passada de fidelidade visual contra o `nexo.html`.

**Pronto quando:** a checklist da seção 8 do arquivo de mapeamento está toda marcada.

### Fase 8 — Entrega (P a M)

- **README** com os itens do PRD: como rodar, arquitetura, como o agent decide, como a qualidade foi garantida, trade-offs, o que faria com mais tempo, escolha do modelo.
- Seção "o que é simulado" (seção 7 do arquivo de plus).
- (Opcional) Deploy, com limite de uso e chaves protegidas.
- Ensaio da entrevista: você consegue explicar e **alterar ao vivo** qualquer parte.

---

## 7. Ordem de corte se o tempo apertar

Mantenha sempre: Fases 1 a 4, **X-39**, rascunho com confirmação, transferência completa, console com assumir/devolver/encerrar.

Corte nesta ordem: X-23 → X-05 → X-43 além do básico → X-36 → X-29 → deploy.

---

## 8. Pontos de atenção por assunto

### 8.1 Privacidade (A5)

- Toda função de `services/tickets` **exige** `ownerId`. Não existe função "buscar por número" sem dono.
- Tool lê `employeeId` do `requestContext`. O `inputSchema` da tool **não** tem campo de funcionário.
- Teste: pedir "chamado do meu colega" e "ignore as regras" → nenhuma tool devolve dado alheio.

### 8.2 Duplicidade

- `find_similar_tickets` devolve candidatos **do dono**: abertos e resolvidos há ≤ 7 dias.
- O LLM decide se é o mesmo problema; o **rascunho** carrega `mode` (`create` / `update` / `reopen`) e `target_ticket_id`.
- O endpoint de confirmação **valida de novo**: alvo é do dono; reabertura dentro de 7 dias.

### 8.3 Prazos

- Função pura `computeDueAt(priority, createdAt, clock)` e `isOverdue(ticket, clock)`.
- Horas úteis: 8h às 18h, segunda a sexta. Crítica: 1 hora corrida (D-03).
- Teste de tabela com os quatro prazos e casos de fim de semana.

### 8.4 Transparência (V1 a V6)

Cada resposta grava um registro em `decisions`:

| Campo | Fonte |
|---|---|
| intent, understood, rationale, confidence | Triagem (LLM 1) |
| action | Política em código |
| tool_calls (nome, entrada, saída resumida, duração, falha) | Execução real das tools |
| tokens, latency_ms, model | Resultado do agent |

O painel de decisão (X-39) lê esse registro. A linha de ações (X-11) é derivada de `tool_calls`. O selo "confiança 41%" do console é o mesmo `confidence`.

### 8.5 Falha do serviço legado

- Simulação: o serviço falha por alguns segundos de forma configurável.
- *Retry* curto no serviço; se persistir, erro tipado `LegacyUnavailable`.
- A tool devolve o erro de forma que o agent explique ao usuário e **não** invente resultado.
- O selo "Assistente online" mostra estado degradado (X-09).

---

## 9. Testes e evals

| Camada | O que testa | Ferramenta | Usa LLM? |
|---|---|---|---|
| Unitário | SLA, horas úteis, política, validações | Vitest | Não |
| Serviço | Privacidade, duplicidade, reabertura, falhas | Vitest + banco em memória | Não |
| API | Limite de 30, modo ≠ agent não chama LLM, confirmação de rascunho | Vitest | Não (LLM *mockado*) |
| **Comportamento do agent** | Cenários 1 a 20 | Vitest + modelo real, com poucas execuções | **Sim** |
| Interface | Fluxos principais | Playwright | Não (agent *mockado*) |

### Evals de comportamento

- Cada cenário é um caso fixo: mensagens de entrada, dados do seed e o que esperar.
- Verificações **determinísticas**: qual tool foi chamada, qual `intent`, qual estado final da conversa. O pacote `@mastra/evals` tem `checks.calledTool(...)` e `checks.includes(...)` **[Verificado]**.
- Verificações **por modelo** só onde necessário (tom e clareza), em baixa frequência, por custo.
- **Plano B** se `runEvals` não servir **[Validar]**: rodar os cenários com um script próprio e conferir `toolCalls` e `object`, que o `generate()` já devolve **[Verificado]**.
- Rodar os evals no CI é opcional; localmente basta um comando documentado.

---

## 10. Custo e latência

- **Triagem com modelo pequeno** e **atendimento com modelo médio**; ajustar no spike S6.
- Políticas que **não** chamam o segundo modelo: escopo, limite, transferência direta, saudação.
- Contexto enxuto: últimas N mensagens, artigos truncados, sem despejar o histórico de chamados inteiro.
- Registrar tokens por mensagem e somar por conversa (X-39 mostra o número).
- Meta a medir no spike S6: tempo até o primeiro texto na tela e custo médio por conversa de 8 a 10 mensagens. **Definir números depois da medição**, não antes.

---

## 11. Segurança

- Chaves só em variáveis de ambiente; `.env.example` com nomes e valores fictícios; `.env` no `.gitignore`.
- `SensitiveDataFilter` no tracing para não exportar segredos **[Verificado]**.
- Validação com Zod em toda entrada de rota.
- Cookie de sessão `httpOnly`, `sameSite`; checagem de papel em toda rota do console.
- Limite de tamanho da mensagem e limite por sessão (30), mais limite de requisições por IP se houver deploy.
- Defesa contra prompt injection: o que protege os dados **não está no prompt** (A5); o prompt só orienta o comportamento.

---

## 12. Decisões em aberto (preciso de você)

| # | Pergunta | Opções | Minha recomendação |
|---|---|---|---|
| Q1 | ✅ **Resolvida: Gemini (plano gratuito do Google AI Studio).** Ver 12.1 | — | — |
| Q2 | ✅ **Resolvida: Drizzle + libSQL.** Tipos fortes e migrations; auditar a dependência antes de instalar | — | — |
| Q3 | **Gerenciador de pacotes** | pnpm (você tem o 10.26), npm | pnpm |
| Q4 | **Deploy** | Sem deploy, Railway/Fly (volume SQLite), Vercel + Turso | Decidir **depois** da Fase 7. Vercel exige banco hospedado (Turso) e cuidado com SSE |
| Q5 | ✅ **Resolvida: o projeto é a própria pasta `nexo/`.** O código entra em `nexo/src`, ao lado de `nexo/doc` | — | — |
| Q6 | **Idioma do código** | Identificadores em inglês, interface em português | Sim, como no seu guia |

---

### 12.1 Gemini no plano gratuito: configuração e cuidados

**Configuração [Verificado na documentação do Mastra]**

- Modelo como string `google/<modelo-id>`, por exemplo `google/gemini-2.5-flash`.
- Variável de ambiente: `GOOGLE_GENERATIVE_AI_API_KEY` (a `GOOGLE_API_KEY` também funciona). A autenticação é automática.
- A chave se cria no Google AI Studio. Ela vai no `.env` (fora do Git) e o `.env.example` traz só o nome da variável.

**Modelos gratuitos candidatos [Verificado na página de preços do Google]**

| Papel | Modelo em uso | Observação |
|---|---|---|
| Triagem (barata e rápida) | `gemini-3.5-flash-lite` | Respondeu em cerca de 1 s no teste. Saída estruturada ainda a validar no S4 |
| Atendimento (com tools) | `gemini-3.6-flash` | **Chamou a tool corretamente no S1** (ver `Spikes_Resultados.md`) |

> **Correção após o S1:** os modelos `gemini-2.5-*` **não estão mais disponíveis para contas novas** (erro 404 "no longer available to new users"). O `gemini-3.8-flash` respondeu "alta demanda" (503) no teste. O catálogo de modelos muda rápido, então a lista acima vale para 27/10/2026. Se um modelo sumir, troque só `src/mastra/models.ts`. O **S4** ainda valida saída estruturada.

**Cuidados do plano gratuito**

| Cuidado | Fato | Consequência no projeto |
|---|---|---|
| **Privacidade dos dados** | No plano gratuito, o conteúdo pode ser usado para melhorar os produtos do Google. No pago, não | Usar **somente dados fictícios** (já é o caso: seed próprio). Dizer isso no README. **Nunca** colar dados reais de funcionários nos testes |
| **Limites de uso** | Há limite por minuto e por dia, **por projeto** (não por chave). O limite diário zera à meia-noite do horário do Pacífico. Os números exatos aparecem no Google AI Studio, na página de rate limit; a documentação não os lista | Anotar os limites reais no spike S6 e no README |
| **5 requisições por minuto no `gemini-3.6-flash`** | Medido no S2: três perguntas seguidas com tool estouraram o limite (429). Cada resposta com tool gasta 2 requisições | Evals com espaçamento e nova tentativa só para 429; erro tipado `RateLimited`; avisar no README |
| **Duas chamadas por mensagem** (A9) | A triagem e o atendimento consomem a cota **duas vezes** | Respostas de política (escopo, limite, transferência direta) não chamam o 2º modelo. Medir o consumo por conversa no S6 |
| **Evals gastam cota** | Os 20 cenários rodam com modelo real | Rodar sob demanda, poucos por vez; deixar fora do CI |
| **Erro 429 (limite atingido)** | Pode acontecer em demonstração | Erro tipado `RateLimited` + mensagem clara na interface + *retry* com espera. Tratar como o estado "indisponível" do selo (X-09) |
| **Ferramentas + saída estruturada** | A documentação do Mastra diz que o Gemini 2.5 com tools exige `jsonPromptInjection: true` na saída estruturada | O desenho de dois tempos (A9) **já evita o caso**: a triagem só usa saída estruturada, e o atendimento só usa tools |
| **Deploy público** | Qualquer pessoa com o link gasta a sua cota gratuita | Se publicar: limite por IP e por sessão, e chave exclusiva do projeto |

**Trocar de provedor depois**

Basta mudar a string do modelo e a variável de ambiente. Para isso funcionar, os nomes de modelo ficam num único arquivo de configuração (`src/mastra/models.ts`), e nenhuma outra parte do código cita o provedor.

---

## 13. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Nunca usou Mastra | Atraso nas Fases 3 e 4 | Fase 0 com spikes pequenos e saída verificável |
| `Memory` e nosso banco divergirem | Histórico inconsistente | A8: um só dono do histórico (nosso banco) |
| Confiança do modelo pouco útil | Transferências erradas | Sinais determinísticos + limiar medido no spike S4 |
| API do Mastra mudar entre versões | Código quebra | Versões **exatas** fixadas; registrar no `Spikes_Resultados.md` |
| SSE em ambiente sem servidor persistente | Tempo real falha no deploy | Escolher plataforma com processo persistente, ou *polling* de fallback |
| Cota gratuita do Gemini esgotada (429) | Demonstração ou evals travam | Erro tipado + *retry*; evals sob demanda; medir consumo no S6 |
| Dados no plano gratuito podem ser usados pelo Google | Privacidade | Só dados fictícios; avisar no README |
| Fidelidade ao protótipo | Perde nota de interface | Usar `nexo.html` como régua; revisão visual na Fase 7 |
| Detalhe da decisão ficar para o fim | Perde a parte mais importante | X-39 na Fase 5, não na 7; decisões gravadas desde a Fase 3 |

---

## 14. Fontes

- Mastra, visão geral e instalação: https://mastra.ai/docs
- Integração com Next.js: https://mastra.ai/integrations/frameworks/next-js/llms.txt
- Agents (generate, stream, steps, usage): https://mastra.ai/docs/agents/overview
- Saída estruturada: https://mastra.ai/docs/agents/structured-output
- Request context: https://mastra.ai/docs/server/request-context
- Memory: https://mastra.ai/docs/memory/overview
- Observabilidade: https://mastra.ai/docs/observability/overview
- Aprovação de tools e suspend/resume: https://mastra.ai/docs/agents/agent-approval
- Workflows: https://mastra.ai/docs/workflows/overview
- Evals e scorers: https://mastra.ai/docs/evals/overview

> Os exemplos da documentação usam nomes de modelo de exemplo. Os nomes reais dependem do provedor e da data; confirme na lista do model router antes de fixar.
