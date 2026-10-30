# AGENTS.md

Guia para agentes de código trabalhando no **Nexo Assist**: assistente de service desk de TI em chat (funcionário) com um console para analistas. Next.js (App Router) + TypeScript estrito, Mastra + Google Gemini, SQLite (libSQL) com Drizzle. Visão completa do produto e das decisões no `README.md`.

## Comandos

Gerenciador: **pnpm**. Node >= 22.18.

| Comando | Para quê |
| --- | --- |
| `pnpm dev` | servidor em `http://localhost:3000` |
| `pnpm db:seed` | apaga e recria o banco com dados de exemplo (rodar uma vez antes do primeiro `dev`) |
| `pnpm db:generate` | gera migração após mudar `src/db/schema.ts` (migrações aplicam sozinhas) |
| `pnpm check` | typecheck + Biome + testes; **rode antes de dar algo por pronto** |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm lint:fix` | Biome com correções |
| `pnpm usage:report` | tokens e latência por conversa |
| `pnpm mastra:dev` | Mastra Studio |

Setup: `cp .env.example .env.local`. A `GOOGLE_GENERATIVE_AI_API_KEY` é opcional para abrir o app (sem ela o chat responde "indisponível"). Login aceita qualquer senha; usuários de exemplo estão no README (`ana@nexo.test`, `rafael@nexo.test` no console).

## Arquitetura e fronteiras de camadas

```
src/domain        tipos, erros tipados e regras puras (sem React, Mastra nem banco)
src/services      negócio (chamados, rascunhos, handoff, console, uso); não dependem do agent
src/mastra        agents, instruções, tools finas sobre os serviços, cadeia de modelos
src/conversation  orquestra um turno (limite, modo, triagem, política, atendimento, gravação)
src/app           páginas e route handlers finos (validam, chamam, devolvem)
src/server        contêiner de dependências, sessão, SSE, presença
src/db            schema Drizzle, migrações, seed
src/lib           utilitários de infra (api, clock, ids, logger, retry, event-bus)
src/constants     constantes por assunto (rotas, chat, ticket...)
```

Front-end em **MVVM** (decisão A14), estruturado como a `magh-shop`:

- `src/models` e `src/schemas` (zod): tipos e validação de fronteira
- `src/viewmodels/use-*.ts`: um hook por tela/assunto, sem JSX; guarda estado e chama a API por `lib/api.ts`
- `src/components/ui` (compostos como `Button.Root`, `Input.Root/Field/...` com `cva`), `components/layouts/<área>`, `components/features/<área>`
- `src/providers`: contexts globais (status do assistente, eventos e estado do console)
- `src/utils`: funções puras de formatação/derivação

Regras impostas pelo Biome (não contorne):

- `services` e `domain` **não importam** `mastra`, `app`, `components` nem `viewmodels`.
- Componentes `.tsx` **não usam `fetch`**; a chamada vai pelo ViewModel.
- Route groups: `(auth)`, `(app)` (funcionário) e `(console)` (analista). Redirecionamentos ficam no `src/proxy.ts`, não em layouts.
- Páginas são Server Components finos; `"use client"` só no componente que usa hooks. Não há Server Actions: mutações vão por `/api/*`.

## Regras do agent (não quebrar)

- Cada mensagem tem dois tempos: **triagem** (saída estruturada) → **política em código** (`decideTurn`, função pura) → **atendimento** com as tools da intenção. Decisões de transferir/bloquear/criar são código, não prompt.
- Conversa fora do modo `agent` **não chama o modelo**.
- O agent **nunca cria chamado**: só monta rascunho; o chamado nasce no endpoint de confirmar.
- Identidade vem da sessão via `requestContext`, **nunca** como argumento escolhido pelo modelo. Filtro por dono fica na camada de serviço.
- Prioridade crítica só com equipe/empresa afetada (regra no servidor, na tool e no formulário).
- Mastra não repete chamadas sozinho; timeouts de 30 s/chamada e 60 s/execução.
- Tempo real: SSE com barramento em memória (processo único). Eventos são sinais; o cliente busca o conteúdo pela API.

## Convenções de código

Siga o skill `coding-guide` do usuário. Em resumo, o que o repositório já impõe ou espera:

- Nomes de código em **inglês**; textos de interface e mensagens ao usuário em **pt-BR** com acentuação correta.
- **Sem comentários** no código; sem `let` (plugin `biome-plugins/no-let.grit`), sem `any`, sem `!` (non-null), sem `console` (use `lib/logger.ts`), sem `process.env` fora de `src/env.ts`.
- `interface` em vez de `type` para objetos; `useBlockStatements`; sem ternário aninhado; sem `else` inútil; sem `await` em loop; promises sempre tratadas.
- Mapas de busca em vez de `if/else` encadeado; imutabilidade; erros tipados (`src/domain/errors.ts`); funções até 30 linhas e complexidade cognitiva <= 10.
- Formatação: aspas duplas, ponto e vírgula, vírgula final, 2 espaços, largura 100. Alias `@/*` aponta para `src/*`.
- TypeScript `strict` com `exactOptionalPropertyTypes`.
- Validação com **zod** em toda fronteira; formulários com **react-hook-form + zod**. Com o React Compiler ativo, leia erros do RHF por `useFormState({ control })` no ViewModel, nunca por `form.formState`.
- **Estilização só com Tailwind** e os tokens de `src/app/globals.css` (`bg-cta`, `text-ink`, `border-rule`, `font-display`, `font-data`...). Nada de `style={}` nem `CSSProperties`; prefira classes da escala a valores arbitrários.
- Dependências: versões **exatas** (sem `^`); antes de instalar ou atualizar, aplique o skill `dep-install-audit`.

## Testes

- Vitest em ambiente `node`, arquivos em `tests/**` (espelhando `src/`) e `src/**/*.test.ts`. Banco em memória com o seed.
- O modelo é **sempre mockado** (`tests/support/mock-model.ts`); testes **nunca** chamam o Gemini (cota de 20 req/dia por modelo no plano gratuito). Validação com Gemini real só pontual e a pedido.
- Relógio e ids são injetáveis (`tests/support/clock.ts`, `ids.ts`); use-os em vez de esperar tempo.
- Cenários de ponta a ponta do agent em `tests/scenarios`. Não há testes de componente: mantenha a lógica em funções puras e hooks.
- Lógica nova de domínio/serviço/util entra com teste.

## Git e fluxo

- Branch protegida `main`; trabalhe em branch (`feat/...`, `fix/...`, `docs/...`) e abra PR. Siga o skill `commit-pr-guide` (mensagem de commit com data/hora, template do PR).
- `doc/`, `spikes/`, `data/`, `.env*`, `.session-artifacts/` e `*.db` estão no `.gitignore`; **não os versione**. Cuidado: `git checkout`/`pull` entre branches que rastreavam `doc/` ou `spikes/` pode apagá-los do disco.
- Nunca imprima o conteúdo de `.env.local` (skill `secret-safe-output`).

## Antes de terminar uma tarefa

1. `pnpm check` passa (typecheck, Biome, testes).
2. Nenhum `style={` novo, nenhum comentário, nenhum `let`/`any`.
3. A fronteira de camadas e a regra "View sem fetch" continuam respeitadas.
4. Mudou o schema do banco? Gerou a migração com `pnpm db:generate` e atualizou o seed se preciso.
