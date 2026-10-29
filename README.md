# Nexo Assist

Assistente de service desk de TI em formato de chat, feito para o desafio técnico Beyond the Bytes. O funcionário descreve o problema, o assistente consulta chamados e a central de ajuda, monta rascunhos de chamado para confirmação e chama um analista quando precisa.

## Como rodar

Requisitos: Node 22.18 ou mais novo e pnpm.

```bash
pnpm install
pnpm db:seed   # recria o banco de desenvolvimento com dados de exemplo
pnpm dev       # http://localhost:3000
```

Para o assistente responder é preciso a variável `GOOGLE_GENERATIVE_AI_API_KEY` em `.env.local`. Os testes não chamam o modelo.

Outros comandos: `pnpm check` (typecheck, Biome e testes), `pnpm build` e `pnpm start`.

Usuários de exemplo: `ana@nexo.test` e `carla@nexo.test` (funcionárias) e `rafael@nexo.test` (analista).

## O que é simulado

Esta é uma demonstração. Estes pontos são simulados de propósito:

- **Login:** aceita qualquer senha. A senha não é verificada nem guardada; o perfil vem dos dados de exemplo.
- **Esqueci minha senha:** o fluxo existe e dá feedback, mas **nenhum e-mail é enviado**. A resposta é a mesma para qualquer e-mail válido, então a tela não revela se o e-mail existe. Com um provedor de e-mail real, o próximo passo seria gerar um token de uso único com validade curta, enviar o link e só então trocar a senha.
- **Sistema de chamados legado:** a instabilidade é simulada por `LEGACY_OUTAGE_SECONDS`.

## Privacidade

A página `/privacidade` explica o que fica guardado, quem vê o quê e o que vai para o modelo de linguagem (Google Gemini). Os dados de exemplo são fictícios.
