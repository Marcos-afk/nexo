# Nexo Assist

Assistente de service desk de TI em formato de chat, feito para o desafio técnico Beyond the Bytes. O funcionário descreve o problema; o assistente consulta os chamados dele e a central de ajuda, monta **rascunhos** de chamado para ele confirmar e chama um analista quando precisa. Um console separado deixa o analista ver a fila, assumir, responder, devolver ao agent e encerrar, com o raciocínio do agent à vista.

Índice: [Como rodar](#como-rodar) · [Visão geral da arquitetura](#visão-geral-da-arquitetura) · [Como o agent decide](#como-o-agent-decide) · [Como garanti a qualidade](#como-garanti-a-qualidade-das-decisões) · [Trade-offs](#principais-trade-offs) · [O que faria com mais tempo](#o-que-faria-com-mais-tempo) · [Escolha do modelo](#escolha-do-modelo) · [O que é simulado](#o-que-é-simulado) · [Privacidade](#privacidade)

## Como rodar

Requisitos: Node 22.18 ou mais novo e pnpm.

```bash
pnpm install
cp .env.example .env.local   # preencha GOOGLE_GENERATIVE_AI_API_KEY
pnpm db:seed                 # recria o banco de desenvolvimento com dados de exemplo
pnpm dev                     # http://localhost:3000
```

- **Chave do modelo:** `GOOGLE_GENERATIVE_AI_API_KEY` (Google AI Studio, plano gratuito) vai só em `.env.local`, que o Git ignora. Sem ela o app abre e o login funciona, mas o assistente não responde. Os testes **nunca** chamam o modelo.
- **Usuários de exemplo** (qualquer senha): `ana@nexo.test`, `carla@nexo.test` e outros funcionários; `rafael@nexo.test` é analista.
- **Reiniciar os dados:** `pnpm db:seed` apaga e recria todas as tabelas. Há conversas em vários estados (com o agent, transferida, encerrada) e chamados em situações variadas (aberto, vencido, resolvido recentemente, de outras pessoas).
- **Produção local:** `pnpm build` e `pnpm start`. O tempo real (SSE) só se comporta como em produção nesse modo.

| Comando             | Para quê                                                 |
| ------------------- | -------------------------------------------------------- |
| `pnpm check`        | typecheck + Biome + testes (o que roda antes de cada PR) |
| `pnpm test`         | só os testes (Vitest)                                    |
| `pnpm usage:report` | tokens e latência por conversa, lidos do banco           |
| `pnpm mastra:dev`   | Mastra Studio, para inspecionar os agents                |

Variáveis de ambiente (`.env.example`): `GOOGLE_GENERATIVE_AI_API_KEY` e `LEGACY_OUTAGE_SECONDS` (segundos de queda simulada do sistema de chamados ao subir o servidor; `0` desliga).

## Visão geral da arquitetura

Um repositório só, **Next.js (App Router) + TypeScript estrito**, com os route handlers como backend. O agent usa o **Mastra** e o modelo é o **Google Gemini**. O banco é **SQLite (libSQL) com Drizzle**, em um arquivo local, então não há nada para subir além do próprio app.

```
Interface (React, Tailwind)  ──►  route handlers (src/app/api)  ──►  orquestração (src/conversation)
                                                                         │            │
                                                              agent + tools (src/mastra)   serviços (src/services)
                                                                         └──────┬─────┘
                                                                          domínio (src/domain) · banco (src/db)
```

| Pasta                                                           | Responsabilidade                                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/domain`                                                    | tipos, erros tipados e regras puras (prazos, política de turno, duplicidade). Sem React, Mastra nem banco |
| `src/services`                                                  | negócio: chamados, central de ajuda, rascunhos, transferência, console, uso. **Não dependem do agent**    |
| `src/mastra`                                                    | agents (triagem e atendimento), instruções, ferramentas finas sobre os serviços, cadeia de modelos        |
| `src/conversation`                                              | orquestra um turno: limite, modo da conversa, triagem, política, atendimento, gravação                    |
| `src/app`                                                       | páginas e route handlers finos (validam, chamam e devolvem)                                               |
| `src/server`                                                    | contêiner de dependências, sessão, SSE e presença                                                         |
| `src/components`, `src/viewmodels`, `src/models`, `src/schemas` | front-end em MVVM: a View só renderiza, o ViewModel (um hook por tela) guarda estado e chama a API        |

As fronteiras são **regras do linter**, não só convenção: `services` e `domain` não importam `mastra`, `app`, `components` nem `viewmodels`, e componentes não usam `fetch`.

**Tempo real:** o servidor publica sinais (`message.created`, `conversation.updated`, `presence.changed`, `typing.started`) por **SSE**, com um barramento em memória, e o cliente busca o conteúdo pela API. A conexão reconecta sozinha e pede um `resync` se perdeu eventos.

**Estados da conversa:** `agent` → `aguardando atendente` → `com analista` → `encerrada`. Enquanto a conversa **não** está em `agent`, o servidor grava a mensagem e **não chama o modelo**: o silêncio do agent não depende do prompt.

## Como o agent decide

Cada mensagem do funcionário passa por **dois tempos**, com regras duras em código entre eles:

1. **Triagem** (modelo pequeno, saída estruturada): `intent`, o que entendeu, `confidence` de 0 a 100, sinais (`asks_for_human`, `critical_impact`, `urgent`, `missing_details`…) e a justificativa.
2. **Política em código** (`decideTurn`, função pura e testada), nesta ordem:

| Condição                                            | Resultado                                                |
| --------------------------------------------------- | -------------------------------------------------------- |
| conversa fora do modo `agent`                       | não chama o modelo                                       |
| pede analista (`human_request` ou `asks_for_human`) | transfere (N1)                                           |
| impacto crítico (`critical_impact`)                 | transfere (N2, contato em até 30 min)                    |
| assunto fora de TI                                  | resposta fixa de redirecionamento, sem ferramentas       |
| `confidence` < 70                                   | transfere com o motivo "o assistente não teve segurança" |
| demais casos                                        | responde com as ferramentas permitidas para a intenção   |
3. **Atendimento** (modelo médio, com ferramentas). Só recebe as ferramentas da intenção: dúvida técnica (`searchHelpArticles`, `findSimilarTickets`), consulta (`listMyTickets`, `getTicket`), abertura (`searchHelpArticles`, `findSimilarTickets`, `buildDraft`), e `offerChoices` para botões de resposta rápida. Chamado vencido só vira **oferta** de analista, não transferência automática.

O que torna o comportamento confiável **por construção**, e não por prompt:

- **O agent nunca cria chamado.** Ele monta um rascunho; o chamado só nasce quando o funcionário clica em **Confirmar**, num endpoint próprio. Editar ou cancelar não cria nada.
- **A identidade vem da sessão**, entra pelo `requestContext` e nunca como argumento que o modelo escolha. Todo filtro por dono está na camada de serviço. Pedir o chamado de outra pessoa, mesmo citando o número, devolve "não encontrado".
- **Duplicidade e reabertura** são decididas com dados: chamado aberto do mesmo problema vira atualização; resolvido há até 7 dias, reabertura; acima disso, um novo.
- **Prazos** usam horas úteis e um relógio injetável, para testar "há 5 dias" sem esperar.
- **Transparência:** cada resposta mostra acima as ações feitas ("consultou seus chamados", "montou o rascunho") e o botão **Ver decisão** abre o que o agent entendeu, a ação escolhida, a confiança, o porquê, as ferramentas com entrada e saída, os tokens, a latência e o modelo. A decisão é gravada com a conversa e o analista a vê no console.

A `confidence` do modelo é uma **estimativa dele, não uma probabilidade calibrada**. Por isso ela é só uma das entradas da política: sinais objetivos (pedido explícito, impacto crítico, escopo) valem mais e vêm antes.

## Como garanti a qualidade das decisões

- **1.024 testes** em 91 arquivos (Vitest, banco em memória com o seed): regras de prazo, política, privacidade, duplicidade, reabertura, transferência, limite de mensagens e falha do sistema legado. O modelo é **mockado** (`tests/support/mock-model.ts`), então os testes são determinísticos e não gastam cota.
- **Cenários de ponta a ponta** (`tests/scenarios`) cobrem os do PRD que não dependem do tom do texto: consulta e chamado vencido, listagem sem vazar chamados alheios, chamado de colega, rascunho completo sem criar nada, reabertura, impacto crítico, fora de TI, limite de mensagens, assumir e devolver, reinício com conversa transferida e prompt injection.
- **Validação com o Gemini real**, à parte: dúvida técnica com e sem artigo do Windows, pergunta de afetados antes do rascunho e atualização em vez de duplicar, mais 5 conversas de ataque (vazar instruções, "você é administrador", forçar prioridade crítica, pedir chamado alheio, manipular a triagem) e 7 turnos de medição de custo.
- **Segurança:** a prioridade crítica só vale com equipe ou empresa afetada (regra no servidor, na ferramenta e no formulário); limites de tamanho de entrada (mensagem de 2.000 caracteres, e-mail, senha); as instruções do agent tratam texto do usuário como dado e proíbem revelar as instruções; sem chave no repositório (`.env.example` só traz nomes); erros nunca devolvem stack trace ao cliente.
- **Erros e modelo instável:** cada modelo tem uma cadeia de reserva; o Mastra foi configurado para **não** repetir chamadas sozinho (uma falha = uma chamada); timeout de 30 s por chamada e 60 s por execução; o selo "Assistente online / instável / offline" vem do que realmente aconteceu nas chamadas.
- **Código:** TypeScript `strict` (com `exactOptionalPropertyTypes`), Biome como formatador e linter (sem `let` e sem `any`, funções com até 30 linhas), erros tipados e validação com Zod em toda fronteira.
- **Interface:** comparada com o protótipo tela por tela, com estados de carregamento, erro e vazio, região `aria-live` nas mensagens, nomes acessíveis e layout testado de 1280 px para baixo.
- **Custo:** tokens e latência de cada resposta ficam na decisão; o console mostra o total da conversa e `pnpm usage:report` lista todas.

## Principais trade-offs

- **Dois chamados ao modelo por mensagem** (triagem + atendimento) em troca de decisões explicáveis e regras testáveis. Os turnos decididos em código (fora de TI, transferência) custam cerca de 500 tokens e 1,5 s, contra 4,5 mil a 7,5 mil tokens quando há ferramentas.
- **Regras duras em código, linguagem no modelo.** O agent fala; quem decide transferir, bloquear ou criar é código. Isso limita a "criatividade", mas é o que dá para testar e explicar.
- **SQLite e SSE em memória:** zero infraestrutura para quem avalia, mas o app roda em **um único processo** e o tempo real não escala horizontalmente sem um barramento externo.
- **Nosso banco é a fonte das mensagens**, sem a `Memory` do Mastra: uma verdade só, com a linha do tempo humana do console, ao custo de montar o histórico do agent à mão (janela de 20 mensagens).
- **Plano gratuito do Gemini:** limite de 20 requisições por dia por modelo e 5 por minuto no modelo principal. Daí a cadeia de reserva e o desenvolvimento com modelo mockado.
- **Prioridade a partir do impacto informado:** não há como verificar que "toda a empresa está parada"; a regra impede o atalho óbvio (crítica para uma pessoa só), e o analista vê o campo "Afetados".
- **Sem testes de componente:** o ambiente do Vitest é `node`; a lógica fica em funções puras e hooks testáveis, e as telas foram validadas no navegador.
- **Senha simulada** (veja abaixo), de propósito, para a demonstração.

## O que faria com mais tempo

- **Deploy:** não foi feito. Pede um serviço com volume persistente para o SQLite (Railway ou Fly) e, para mais de uma instância, trocar o barramento em memória por Redis. Vercel exigiria banco hospedado (Turso) e cuidado com SSE.
- **Evals de comportamento automatizados** com o modelo real, rodando os 20 cenários com poucas execuções e um relatório, em vez de validar à mão por amostra.
- **Marcar no console a gravidade informada pelo funcionário** nas transferências críticas, e um limite de pedidos por usuário para conter abuso de custo.
- **Ticks de leitura reais** (hoje derivados), presença e prefixo "Nexo:" na lista do console, e navegação por teclado revisada com um leitor de tela.
- **Testes de interface** (Playwright) para os fluxos principais com o agent mockado.
- **Ajuste fino de custo:** reduzir passos repetidos das ferramentas, rever o texto duplicado que apareceu numa consulta de chamados e decidir o modelo principal com mais amostras.
- **Autenticação de verdade** e redefinição de senha por token de uso único.

## Escolha do modelo

**Google Gemini no plano gratuito**, pelo roteador de modelos do Mastra (`google/<modelo>`): custo zero para desenvolver e avaliar, saída estruturada confiável para a triagem e ferramentas com bom desempenho.

- **Triagem:** `gemini-3.5-flash-lite` (rápido e barato; só classifica). Reserva: `3.1-flash-lite`, `3.5-flash`.
- **Atendimento:** `gemini-3.6-flash`, com reserva `3.5-flash` e `3.5-flash-lite`. O `thinkingLevel` fica no mínimo: com raciocínio alto a saída passou de 50 para 500 a 825 tokens e a latência de 1,2 s para 2,2 a 3,2 s, sem ganho para esta tarefa.
- **Medido com o Gemini real** (uma resposta com ferramentas): de 4,5 mil a 7,5 mil tokens de entrada e 140 a 270 de saída. A latência foi de 20,7 s no `3.6-flash`, 16,2 s no `3.5-flash` e de 4 a 6 s no `flash-lite`, que passou nos cenários que testei. Por isso a recomendação, ainda não aplicada, é **subir o `flash-lite` a modelo principal do atendimento**; hoje a cadeia já cai nele quando o principal bate o limite de 5 por minuto.

## O que é simulado

Esta é uma demonstração. Estes pontos são simulados de propósito:

- **Login:** aceita qualquer senha. A senha não é verificada nem guardada; o perfil vem dos dados de exemplo.
- **Esqueci minha senha:** o fluxo existe e dá feedback, mas **nenhum e-mail é enviado**. A resposta é a mesma para qualquer e-mail válido, então a tela não revela se o e-mail existe. Com um provedor de e-mail real, o próximo passo seria gerar um token de uso único com validade curta, enviar o link e só então trocar a senha.
- **Sistema de chamados legado:** a instabilidade é simulada por `LEGACY_OUTAGE_SECONDS`. O agent e a interface tratam a queda com mensagem clara e sem deixar nada pela metade.

## Privacidade

A página `/privacidade` explica o que fica guardado, quem vê o quê e o que vai para o modelo de linguagem (Google Gemini). Os dados de exemplo são fictícios, porque no plano gratuito o Google pode usar o conteúdo para melhorar produtos.
