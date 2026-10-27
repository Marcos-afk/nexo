# Resultados dos spikes (Fase 0)

> Plano: `Plano_de_Desenvolvimento.md`, seção 5.

## Versões fixadas

| Pacote | Versão | Publicada há (em 27/10/2026) |
|---|---|---|
| `@mastra/core` | 1.79.0 | 5,7 dias |
| `mastra` (CLI, dev) | 1.35.0 | 5,6 dias |
| `zod` | 4.6.7 | 14,5 dias |
| `typescript` (dev) | 7.0.2 | 110 dias |
| `@types/node` (dev) | 26.6.5 | 17,4 dias |

Auditoria: nenhum pacote direto declara hook de instalação. Entre os 1.019 `package.json` instalados, só o `esbuild` tem `postinstall` (baixa o binário da plataforma do registro oficial do npm, se faltar). O pnpm o bloqueou e não precisamos liberá-lo.

---

## S1 — Primeiro agent com uma tool ✅

**Data:** 27/10/2026

**O que foi feito**
- Tool `search-help-articles` (adaptador fino sobre `src/services/help-center`).
- Agent `supportAgent` com instruções em português.
- Servidor `mastra dev` (Studio em `http://localhost:4111`, API em `/api`).
- Teste pela API: `POST /api/agents/supportAgent/generate`.

**Resultados**

| Cenário | Tool chamada | Resposta |
|---|---|---|
| "Windows 10 mostra erro 809 na VPN" | `searchHelpArticlesTool` com `{"query":"VPN erro 809 Windows 10"}` | Passos do artigo (reinstalar o cliente e reiniciar) |
| "Erro 809 na VPN, meu notebook é Windows 11" | `searchHelpArticlesTool` com `{"query":"erro 809 VPN"}` | Explica que o artigo vale só para Windows 10 e oferece abrir chamado |

**Descobertas que mudam o plano**

1. **Modelos 2.5 indisponíveis.** `gemini-2.5-flash`, `-flash-lite` e `-pro` retornam 404 "no longer available to new users". Estado atual: `gemini-3.5-flash-lite`, `gemini-3.5-flash` e `gemini-3.6-flash` respondem; `gemini-3.8-flash` e `gemini-flash-latest` deram 503 "alta demanda". Modelos escolhidos: triagem `gemini-3.5-flash-lite`, atendimento `gemini-3.6-flash`.
2. **Erro de modelo vira chamada pendurada.** Com o 503, a requisição ao agent levou cerca de 27 s até falhar (o Mastra repete a chamada). Na Fase 3, precisamos de **timeout próprio** e do erro tipado `RateLimited` / `ModelUnavailable` com mensagem clara na interface.
3. **Tokens de raciocínio pesam.** Em cada resposta, cerca de 80% dos tokens de saída foram de raciocínio do modelo (por exemplo, 346 de 417). Isso consome a cota gratuita e aumenta a latência. Investigar no S6 como reduzir (a documentação cita a opção `thinkingConfig` do provedor; ainda não testei).
4. **Storage em memória.** O Studio avisa que, sem `storage`, os dados somem a cada reinício. Esperado no S1; resolvido no S6 com `@mastra/libsql`.
5. **A chave funciona via `.env.local`.** O `mastra dev` leu a variável sem configuração extra.

**Ainda não verificado:** o teste foi pela API. A conferência visual no Studio (aba de traces) fica para quando você abrir `http://localhost:4111`.

---

## Pendentes

- S2 `requestContext` e histórico por array de mensagens
- S3 Next.js com streaming
- S4 saída estruturada e confiança (e limiar)
- S5 aprovação de tool e workflow (aprendizado)
- S6 observabilidade, custo, latência e `thinkingConfig`
