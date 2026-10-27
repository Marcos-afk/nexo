# Nexo Assist — Plus do protótipo (itens fora do PRD)

> Decisão: **vamos implementar todas as telas do protótipo**, inclusive o que o PRD não pede, e **ajustar os dados e regras para ficarem coerentes com o protótipo**.
> Este arquivo lista cada item, como vamos construí-lo, como saberemos que está pronto e o que dizer na entrevista.
>
> Documento irmão: `PRD_Nexo_Assist_Mapeamento.md` (o que o PRD exige).
> Fonte visual: `nexo.pen` / `nexo.html`.
>
> Legenda: **[PRD]** = vem do PRD · **[Protótipo]** = só aparece no protótipo · **[Sugestão]** = proposta minha.

---

## 1. Como usar isto na entrevista

O PRD diz que haverá conversa sobre o código e pedidos de pequenas mudanças ao vivo. Estes extras servem para mostrar três coisas:

1. **Cuidado com o produto:** não parei no mínimo do PRD; entreguei a experiência inteira do protótipo.
2. **Critério:** para cada extra, sei dizer por que ele existe, quanto custa e o que é real ou simulado.
3. **Honestidade técnica:** onde o protótipo e o PRD divergem, escolhi um lado e documentei (seção 4).

**Roteiro de 2 minutos para falar do plus:**

- "O PRD pedia 5 telas; o protótipo tinha 6. Implementei as 6."
- "Além disso, o protótipo trazia comportamentos que o PRD não descreve: contador de mensagens, prazo no rascunho, confiança do agent na fila do analista, presença e digitação, redefinição de senha. Implementei todos e marquei o que é real e o que é simulado."
- "Onde o PRD e o protótipo se contradiziam (por exemplo, 6 dias × 5 dias no chamado INC-20311), segui o protótipo e ajustei os dados de exemplo. Está tudo na tabela de reconciliação."

---

## 2. Visão geral dos extras

| Grupo | Itens | Real ou simulado |
|---|---|---|
| Login | X-01 a X-06 | Misto |
| Navegação e identidade | X-07 a X-10 | Real |
| Chat do funcionário | X-11 a X-20 | Real |
| Meu perfil | X-21 a X-23 | Simulado (sem e-mail de verdade) |
| Console do analista | X-24 a X-38 | Real |
| Lacunas do protótipo (estados que ele não desenha) | X-39 a X-45 | Real |

Todos os itens têm **critérios de aceitação** na seção 3.

---

## 3. Catálogo de extras

Cada item traz: **o que o protótipo mostra** → **como vamos construir** → **critérios de aceitação** → **ponto de entrevista**.

### 3.1 Login (Tela 1)

#### X-01 · Painel de apresentação com métricas [Protótipo]

- **Protótipo:** painel escuro à esquerda com título "Seu problema de TI, resolvido em uma conversa.", prévia de conversa com chip `INC-20517` e três métricas: **8 s** primeira resposta, **72%** resolvidos sem fila, **6** analistas online agora.
- **Construção:** a prévia é conteúdo estático. As métricas saem de um endpoint de estatísticas calculado sobre os dados reais (tempo médio da primeira resposta, % de conversas resolvidas pelo agent, analistas com disponibilidade ativa). Os dados de exemplo são preparados para dar valores plausíveis.
- **Critérios:**
  - [ ] As três métricas são calculadas a partir dos dados, não escritas no código.
  - [ ] "Analistas online" muda quando um analista altera a disponibilidade (X-25).
  - [ ] Se o endpoint falhar, o painel mostra "—" e não quebra o login.
  - [ ] O painel é a mesma métrica que o Nexo Assist usa para medir sucesso no PRD (resolução sem fila).
- **Entrevista:** "As métricas da tela de login são as mesmas métricas de sucesso do PRD. Calculei a partir dos dados para provar que o agent é mensurável."

#### X-02 · Mostrar e ocultar senha [Protótipo]

- **Protótipo:** ícone de olho no campo de senha.
- **Critérios:**
  - [ ] Clicar alterna entre senha oculta e visível.
  - [ ] O botão tem rótulo acessível ("Mostrar senha" / "Ocultar senha").

#### X-03 · "Manter conectado neste computador" [Protótipo]

- **Protótipo:** caixa de seleção marcada por padrão.
- **Construção:** controla a duração do cookie de sessão (sessão do navegador × persistente).
- **Critérios:**
  - [ ] Desmarcado: a sessão termina ao fechar o navegador.
  - [ ] Marcado: a sessão persiste por um período definido (documentado no README).
  - [ ] Isso conversa com a história F6 do PRD ("voltar outro dia e continuar de onde parei"): sem a opção marcada, a conversa continua salva, mas o funcionário precisa entrar de novo.

#### X-04 · "Esqueci minha senha" [Protótipo] — simulado

- **Protótipo:** link ao lado do rótulo "Senha".
- **Conflito com o PRD:** o PRD diz que o login aceita **qualquer senha**. Então a redefinição é só demonstração.
- **Construção:** abre um fluxo simples. O e-mail informado recebe a confirmação "Enviamos um link", sem enviar e-mail real.
- **Critérios:**
  - [ ] O fluxo existe e dá feedback claro.
  - [ ] Não revela se o e-mail existe (mesma mensagem para qualquer e-mail).
  - [ ] O README diz explicitamente que nenhum e-mail é enviado.
- **Entrevista:** "Deixei simulado de propósito, porque o PRD manda aceitar qualquer senha. Documentei o que faria com um provedor de e-mail e tokens de uso único."

#### X-05 · Ajuda para entrar e rodapé [Protótipo]

- **Protótipo:** "Problema para entrar? Ligue no ramal 4000" no topo; rodapé "© 2026 Nexo · Service desk de TI" e "Privacidade e uso de dados".
- **Critérios:**
  - [ ] O ramal 4000 aparece como texto.
  - [ ] "Privacidade e uso de dados" abre uma página ou painel curto explicando o que é guardado (conversas, chamados) e que cada funcionário só vê o que é seu. Isso reforça a regra de privacidade do PRD.

#### X-06 · Estados do formulário que o protótipo não desenha [Sugestão]

- **Critérios:**
  - [ ] E-mail vazio ou inválido: mensagem no campo.
  - [ ] E-mail desconhecido: mensagem genérica de falha.
  - [ ] Botão "Entrar" com estado de carregamento e desabilitado durante a chamada.
  - [ ] Enter envia o formulário.

---

### 3.2 Navegação e identidade (Telas 2, 3 e 6)

#### X-07 · Barra lateral do funcionário [Protótipo]

- **Protótipo:** logo, itens "Atendimento" e "Meu perfil", cartão do usuário (iniciais "AS", nome, e-mail) e botão "Sair".
- **Critérios:**
  - [ ] O item ativo fica destacado.
  - [ ] Iniciais do avatar vêm do nome do usuário.
  - [ ] "Sair" encerra a sessão e volta ao login.

#### X-08 · Breadcrumb [Protótipo]

- **Protótipo:** "Service desk de TI › Atendimento" e "Service desk de TI › Meu perfil".
- **Critério:**
  - [ ] O trecho final acompanha a rota.

#### X-09 · Indicador "Assistente online" [Protótipo]

- **Protótipo:** selo verde no canto superior direito do chat.
- **Construção:** reflete a saúde real do agent (provedor de LLM e serviço de chamados).
- **Critérios:**
  - [ ] Verde "Assistente online" quando o agent responde ao health check.
  - [ ] Estado degradado quando o serviço de chamados está indisponível (liga com o requisito do PRD sobre o sistema legado instável).
  - [ ] Estado offline quando o modelo não responde, com o campo de mensagem avisando.
- **Entrevista:** "O selo não é decorativo; ele reflete a saúde das duas dependências externas."

#### X-10 · Perfis e rotas [Sugestão]

- O protótipo usa dois layouts: o do funcionário (barra lateral larga) e o do analista (trilho estreito). Isso implica **dois perfis**.
- **Critérios:**
  - [ ] Funcionário nunca acessa o console; analista tem acesso ao console.
  - [ ] Cada perfil cai na sua tela inicial depois do login.

---

### 3.3 Chat do funcionário (Telas 2 e 3)

#### X-11 · Linha de ações do agent com checks [Protótipo + PRD]

- **Protótipo:** "Nexo Assist ✓ consultou seus chamados ✓ buscou na central de ajuda".
- **Observação:** o PRD exige essa linha **e** o detalhe da decisão. O protótipo só desenha a linha. O detalhe é a lacuna X-39.
- **Critérios:**
  - [ ] Cada ação listada corresponde a uma ferramenta realmente executada, em ordem.
  - [ ] Uma ação que falhou aparece marcada como falha (não como check).

#### X-12 · Opções rápidas na resposta [Protótipo + PRD]

- **Protótipo:** chips "Só eu · Minha equipe · Toda a empresa · Não sei".
- **Critérios:**
  - [ ] Clicar em uma opção envia a escolha como mensagem do usuário.
  - [ ] As opções ficam desabilitadas depois de escolhidas.
  - [ ] "Não sei" é tratado como resposta válida e influencia a prioridade e a confiança.

#### X-13 · Cartão de rascunho com prazo e atalho [Protótipo + PRD]

- **Protótipo:** "Novo chamado · Rascunho D-381 · Aguardando confirmação"; título, descrição, categoria, prioridade com "resposta até 13:43", afetados; botões **Confirmar ⌘↵**, **Editar**, **Cancelar**.
- **Detalhes que o PRD não pede:**
  - código do rascunho (`D-381`);
  - horário-limite calculado ("resposta até 13:43");
  - atalho de teclado **⌘↵** (Ctrl+Enter no Windows e Linux).
- **Critérios:**
  - [ ] O rascunho tem identificador próprio, persistido com a conversa.
  - [ ] O horário-limite respeita horas úteis (ver D-03 na seção 4). Exemplo do protótipo: agora 09:43 + 4 h úteis = 13:43.
  - [ ] Atalho confirma o rascunho; o rótulo mostra ⌘↵ no macOS e Ctrl+↵ nos demais sistemas.
  - [ ] "Editar" permite alterar campos e volta ao rascunho; "Cancelar" não cria nada.
  - [ ] Depois de confirmado, o cartão vira o chamado criado (número `INC-xxxxx`) e deixa de ser editável.

#### X-14 · Seletor de chamados [Protótipo + PRD]

- **Protótipo:** lista com número, título, selo de status e data; clique seleciona e envia "INC-20311 · Notebook lento após atualização".
- **Critérios:**
  - [ ] Mostra só chamados do usuário logado.
  - [ ] Cada linha tem número, título, status e data.
  - [ ] Selecionar envia a escolha como mensagem do usuário.

#### X-15 · Cartão de chamado com subcategoria e prazo vencido [Protótipo]

- **Protótipo:** categoria "**Hardware › Notebook**", prioridade, "Aberto em 16 out, 14:20", "Última atualização há 5 dias · **prazo vencido**" em destaque.
- **Extra:** **subcategoria** (o PRD só tem categorias).
- **Critérios:**
  - [ ] Subcategoria é opcional e pertence a uma categoria do PRD.
  - [ ] "Prazo vencido" aparece quando a regra de prazo é violada (D-03).
  - [ ] Datas relativas ("há 5 dias") e absolutas ("16 out, 14:20") aparecem juntas.

#### X-16 · Ações sugeridas depois da consulta [Protótipo + PRD]

- **Protótipo:** botões "Falar com um analista", "Adicionar informação", "Não, obrigado".
- **Critérios:**
  - [ ] "Falar com um analista" inicia a transferência (T1, T5).
  - [ ] "Adicionar informação" leva ao fluxo de complemento do chamado (F3).
  - [ ] "Não, obrigado" encerra a oferta sem transferir.

#### X-17 · Contador "n/30 mensagens nesta sessão" [Protótipo + PRD]

- **Critérios:**
  - [ ] O contador é atualizado a cada mensagem do usuário.
  - [ ] Perto do limite (por exemplo, 25/30), o contador muda de aparência.
  - [ ] Em 30/30, o campo de mensagem é bloqueado com explicação e saída (por exemplo, falar com analista ou entrar de novo).
  - [ ] O número vem do servidor, não só do navegador.

#### X-18 · Campo de mensagem [Protótipo]

- **Protótipo:** "Escreva para o Nexo…" e botão "Enviar" com seta.
- **Critérios:**
  - [ ] Enter envia e Shift+Enter quebra linha.
  - [ ] Botão desabilitado com campo vazio ou enquanto o agent responde.
  - [ ] Foco volta ao campo depois do envio.

#### X-19 · Estados que o protótipo não desenha no chat [Sugestão]

- **Critérios:**
  - [ ] Carregando: indicador de "Nexo está digitando" e ações aparecendo uma a uma conforme o agent trabalha.
  - [ ] Erro de rede ou de modelo: mensagem no fluxo, com "Tentar de novo".
  - [ ] Serviço de chamados indisponível: mensagem específica, sem culpar o usuário (liga com T7).
  - [ ] Conversa transferida: banner "Um analista vai atender; o Nexo não responde mais por aqui" e campo ajustado (liga com T6).
  - [ ] Conversa vazia: saudação e sugestões iniciais.
  - [ ] Limite de mensagens atingido (X-17).

#### X-20 · Resposta do analista dentro do chat do funcionário [Sugestão]

- O protótipo mostra, no console, mensagens humanas com selo "Suporte N2". O funcionário precisa **ver** essas mensagens no chat dele.
- **Critérios:**
  - [ ] Mensagem do analista aparece no chat do funcionário em tempo real, com nome e selo do analista.
  - [ ] O aviso de que o agent está pausado é claro para o funcionário.
  - [ ] Quando o analista devolve ao agent, o chat avisa que o Nexo voltou.

---

### 3.4 Meu perfil (Tela 6 — fora do PRD)

#### X-21 · Tela "Meu perfil" [Protótipo]

- **Protótipo:** "Meu perfil · Seus dados de acesso ao service desk de TI.", nome "Ana Souza", e-mail "ana.souza@nexo.com.br" com cadeado e o texto "**Gerenciado pela TI**".
- **Critérios:**
  - [ ] Mostra nome e e-mail do usuário logado.
  - [ ] O e-mail aparece **somente leitura**, com o selo "Gerenciado pela TI".
  - [ ] Nenhum dado de outro funcionário aparece.

#### X-22 · Senha: "Alterada há 42 dias" e "Redefinir senha" [Protótipo] — simulado

- **Construção:** a data da última alteração vem dos dados de exemplo. "Redefinir senha" registra a solicitação e mostra confirmação.
- **Critérios:**
  - [ ] O texto "Alterada há N dias" é calculado da data guardada.
  - [ ] Ao redefinir, aparece a mensagem "Enviaremos um link de redefinição para <e-mail>" (como no protótipo).
  - [ ] Nenhum e-mail real é enviado, e isso está documentado.
  - [ ] A senha simulada **não** passa a ser exigida no login (o PRD manda aceitar qualquer senha).

#### X-23 · Ligação com o chat [Sugestão]

- Possível ponto extra: o agent entende "quero redefinir minha senha" e aponta para essa tela, em vez de abrir chamado. Se não houver tempo, fica como "o que faria com mais tempo".

---

### 3.5 Console do analista (Telas 4 e 5)

#### X-24 · Trilho lateral com contador [Protótipo]

- **Protótipo:** trilho estreito com logo, ícone de conversas com selo **5**, e avatar do analista "RL".
- **Critérios:**
  - [ ] O selo mostra quantas conversas precisam de atenção (definição em D-09).
  - [ ] Atualiza em tempo real.
  - [ ] O avatar do analista mostra as iniciais e dá acesso a sair da sessão.

#### X-25 · Disponibilidade do analista [Protótipo]

- **Protótipo:** selo verde "Disponível" no título da lista.
- **Construção:** alternável (Disponível / Ausente). Alimenta a métrica "analistas online" do login (X-01).
- **Critérios:**
  - [ ] O analista alterna sua disponibilidade.
  - [ ] Ausente não recebe atribuição automática (se houver atribuição).
  - [ ] O contador de analistas online muda.

#### X-26 · Busca de conversa ou chamado [Protótipo]

- **Protótipo:** "Pesquisar conversa ou chamado".
- **Critérios:**
  - [ ] Busca por nome do funcionário, número do chamado e trecho de mensagem.
  - [ ] Resultado atualiza enquanto digita, com pequena espera para não sobrecarregar o servidor.
  - [ ] Sem resultado: estado vazio com mensagem.

#### X-27 · Filtros com contadores [Protótipo + PRD]

- **Protótipo:** **Todas** · **Para você 3** · **Com o agent 9** · **Minhas 1**.
- **Critérios:**
  - [ ] "Para você": conversas aguardando atendente, incluindo as em que o agent pediu ajuda.
  - [ ] "Com o agent": conversas em que o agent atende.
  - [ ] "Minhas": conversas que o analista logado assumiu.
  - [ ] Os números vêm dos dados e acompanham as mudanças em tempo real.
  - [ ] No protótipo, "Todas" tem 7 conversas na lista; os totais dos filtros (3 + 9 + 1) mostram que a fila é maior do que a lista visível. A lista precisa de rolagem ou paginação.

#### X-28 · Itens da lista de conversas [Protótipo]

- **Protótipo:** avatar colorido com iniciais, nome, horário, prévia da última mensagem, contador de não lidas, ticks de leitura (✓✓), e uma **etiqueta de estado**.
- **Etiquetas vistas no protótipo:**

| Etiqueta | Significa |
|---|---|
| Transferida · INC-20311 | Funcionário ou regra transferiu; mostra o chamado |
| Transferida · contato em 25 min | Transferida com **tempo restante** para o primeiro contato |
| Agent pediu ajuda · confiança 41% | O agent transferiu por **baixa confiança** (liga com T4 e V3) |
| Agent atendendo | Conversa sob responsabilidade do agent |
| Resolvida pelo agent | Resolvida sem fila |
| Você está atendendo | Assumida pelo analista logado |

- **Critérios:**
  - [ ] Cada etiqueta é derivada do estado real da conversa.
  - [ ] "Contato em N min" é uma contagem regressiva do prazo de primeiro contato (D-05).
  - [ ] "Confiança 41%" mostra o valor que o agent registrou na decisão e leva à decisão detalhada (X-39).
  - [ ] Contador de não lidas zera quando o analista abre a conversa.
  - [ ] Horários: "agora", hora do dia (10:05) ou "ontem".
  - [ ] Ordenação: primeiro as que precisam do analista, mais antigas primeiro (D-09).

#### X-29 · Indicador "digitando…" [Protótipo]

- **Protótipo:** "digitando…" na conversa de Diego Ramos.
- **Construção:** presença em tempo real (evento de digitação do funcionário).
- **Critérios:**
  - [ ] Aparece quando o funcionário está digitando e some depois de alguns segundos sem digitar.
  - [ ] Não é persistido.

#### X-30 · Cabeçalho da conversa [Protótipo]

- **Protótipo:** avatar, nome, "online · Financeiro · INC-20311", selo de modo **"Aguardando atendente"**, busca na conversa, menu de três pontos.
- **Extra:** **departamento** do funcionário e **presença** (online).
- **Critérios:**
  - [ ] Departamento vem dos dados do funcionário.
  - [ ] "online" reflete a presença real.
  - [ ] O selo de modo reflete o estado: Aguardando atendente / Agent atendendo / Em atendimento (você) / Encerrada.
  - [ ] Busca dentro da conversa destaca resultados.
  - [ ] Menu de três pontos tem ao menos uma ação útil (por exemplo, ver decisões do agent, copiar resumo do caso).

#### X-31 · Mensagens com identificação, ticks e eventos de sistema [Protótipo]

- **Protótipo:** separador "Hoje"; selo **IA** nas mensagens do agent; ticks ✓✓; mensagens do analista com nome e selo "Suporte N2"; linhas de sistema ("Transferida para Suporte N2 · 10:05", "Rafael Lima assumiu · agent pausado · 10:12").
- **Critérios:**
  - [ ] Todo remetente é identificável: funcionário, **Nexo Assist (IA)**, analista (nome e nível).
  - [ ] Eventos de transferência, assunção, devolução e encerramento viram linhas de sistema, **persistidas** com a conversa.
  - [ ] Separadores de dia aparecem entre dias diferentes.
  - [ ] Ticks indicam entregue/lido de forma coerente (ver D-10).

#### X-32 · Barra de assunção [Protótipo + PRD]

- **Protótipo:** "Ana espera um atendente · Agent pausado · até 12:05", botões **Devolver ao agent** e **Assumir atendimento**; campo bloqueado com "Assuma o atendimento para responder".
- **Extra:** o **horário-limite "até 12:05"** e a regra de que o campo só libera depois de assumir.
- **Critérios:**
  - [ ] O campo de resposta permanece bloqueado até o analista assumir.
  - [ ] O horário "até 12:05" corresponde ao prazo de primeiro contato da transferência (D-05).
  - [ ] "Devolver ao agent" está disponível mesmo antes de assumir.

#### X-33 · Atendimento assumido [Protótipo + PRD]

- **Protótipo:** cabeçalho com **Devolver ao agent** e **Encerrar atendimento**; campo de resposta ativo com botão de envio.
- **Critérios:**
  - [ ] Assumir atribui a conversa ao analista, pausa o agent e adiciona a linha de sistema.
  - [ ] Enviar mensagem chega ao funcionário em tempo real (X-20).
  - [ ] **Devolver ao agent** reativa o agent e registra a linha de sistema.
  - [ ] **Encerrar atendimento** finaliza a conversa; pede confirmação se o chamado ainda estiver aberto.
  - [ ] Dois analistas não assumem a mesma conversa ao mesmo tempo (D-08).

#### X-34 · Status do chamado muda com a assunção [Protótipo]

- **Protótipo:** INC-20311 passa de "Aguardando analista" para "**Em atendimento**" e o último evento muda para "Assumido por Rafael Lima · 10:12".
- **Critérios:**
  - [ ] O status do chamado muda automaticamente ao assumir.
  - [ ] Ao devolver ou encerrar, o status também reflete o novo estado.
  - [ ] O evento é registrado no histórico do chamado.

#### X-35 · Painel "Chamados da Ana" [Protótipo + PRD]

- **Protótipo:** "Chamados da Ana · 3 abertos · 2 encerrados"; seção **Desta conversa** (chamado atual e último evento); seção **Outros chamados** (4 itens com chevron); rodapé "**Ver todos os chamados da Ana**"; botão de fechar.
- **Critérios:**
  - [ ] Os totais de abertos e encerrados batem com os chamados listados.
  - [ ] "Desta conversa" mostra o chamado vinculado e o último evento relevante.
  - [ ] Clicar em um chamado abre o detalhe (ver X-36).
  - [ ] "Ver todos os chamados" leva à lista completa do funcionário.
  - [ ] O painel pode ser fechado e reaberto, e a conversa ocupa o espaço.

#### X-36 · Detalhe e lista completa de chamados [Sugestão]

- O protótipo tem chevrons e o link "Ver todos", mas **não desenha** o destino.
- **Critérios:**
  - [ ] Detalhe do chamado: campos completos, histórico de eventos, comentários.
  - [ ] Lista completa do funcionário, com filtro por status.
  - [ ] Apenas analistas acessam (o funcionário usa o chat).

#### X-37 · Papéis N1 e N2 [Protótipo + PRD]

- O PRD fala em "Suporte N1 e N2". O protótipo transfere para **Suporte N2** e mostra "Rafael Lima · Suporte N2".
- **Critérios:**
  - [ ] Analistas têm nível (N1 ou N2).
  - [ ] A transferência indica o nível de destino e o motivo da escolha (D-07).
  - [ ] O nível aparece nas mensagens do analista.

#### X-38 · Resumo do caso na transferência [PRD]

- O PRD diz que a transferência "leva um resumo do caso". O protótipo mostra a mensagem do agent ("Encaminhei para o Suporte N2…") e o painel de chamados, mas não mostra o resumo explicitamente.
- **Critérios:**
  - [ ] Resumo gerado na transferência (problema, o que já foi tentado, chamado ligado, prioridade, motivo da transferência).
  - [ ] Resumo visível ao analista antes de assumir (por exemplo, no topo da conversa ou no menu de três pontos).

---

### 3.6 Lacunas do protótipo (estados e telas que ele não desenha)

#### X-39 · Detalhe da decisão do agent [PRD exige; protótipo não desenha]

- **O PRD diz que esta é a parte mais importante do desafio.** O protótipo só tem a linha de ações e a etiqueta "confiança 41%".
- **Construção:** detalhe expansível por resposta, também acessível no console. Mesmo estilo visual do protótipo.
- **Critérios:**
  - [ ] Mostra **o que o agent entendeu**, **ação**, **confiança (%)** e **por quê**.
  - [ ] A confiança exibida na lista do console (41%) é a mesma gravada na decisão.
  - [ ] Cada ferramenta chamada aparece com entrada, saída resumida e duração.
  - [ ] Funciona para respostas antigas (decisões persistidas).
- **Entrevista:** "Esta foi a parte que mais cuidei. O protótipo não tinha o desenho, então criei o detalhe seguindo o mesmo sistema visual."

#### X-40 · Estados de erro e vazio do console [Sugestão]

- **Critérios:**
  - [ ] Lista vazia, filtro sem resultado, busca sem resultado.
  - [ ] Falha ao carregar conversas, com "Tentar de novo".
  - [ ] Falha ao enviar mensagem como analista.

#### X-41 · Tempo real [Sugestão]

- O protótipo mostra tudo "vivo" (digitando, não lidas, contadores).
- **Critérios:**
  - [ ] Mensagens, mudanças de estado e contadores chegam sem recarregar a página (SSE ou WebSocket, decisão documentada).
  - [ ] Se a conexão cair, a interface reconecta e recupera o que perdeu.

#### X-42 · Responsividade [Sugestão]

- O protótipo é **somente desktop (1440 px)**. O PRD diz "siga o protótipo".
- **Decisão:** o alvo é desktop. Em telas menores, a interface não precisa ser perfeita, mas não pode quebrar de forma ilegível.
- **Critério:**
  - [ ] Funciona de 1280 px para cima; abaixo disso, degrada sem perder função.

#### X-43 · Acessibilidade básica [Sugestão]

- **Critérios:**
  - [ ] Navegação por teclado nos fluxos principais (login, enviar, confirmar, assumir).
  - [ ] Rótulos nos botões só com ícone (olho, enviar, fechar, três pontos).
  - [ ] Contraste suficiente nos selos de status.
  - [ ] Anúncio de nova mensagem para leitores de tela (região "live").

#### X-44 · Tokens de design e componentes [Sugestão]

- Os tokens do protótipo viram variáveis do projeto: `primary`, `cta`, `ink`, `paper`, `desk`, `rule`, mais os pares suave/texto de success, warning, danger e violet.
- **Critérios:**
  - [ ] Nenhuma cor escrita direto nos componentes; tudo vem de tokens.
  - [ ] Componentes compartilhados entre as telas: barra lateral, balão, selo de status, cartão de chamado, avatar, chip de opção.

#### X-45 · Dados de exemplo alinhados ao protótipo [Sugestão]

- Ver reconciliação na seção 4.
- **Critérios:**
  - [ ] Os dados de exemplo reproduzem as 6 telas, com os mesmos nomes, números e situações.
  - [ ] Existe um comando de *seed* para restaurar esse estado.

---

## 4. Reconciliação PRD × protótipo (decisões)

Onde os dois divergem ou o PRD é omisso, **seguimos o protótipo** e registramos a decisão. Isso evita surpresa na entrevista.

| ID | Assunto | PRD diz | Protótipo mostra | Decisão |
|---|---|---|---|---|
| D-01 | Quantidade de telas | 5 | **6** (inclui "Meu perfil") | Implementar as 6 |
| D-02 | INC-20311: última atualização | "Há 6 dias" | "há 5 dias", aberto em 16 out 14:20 | Seguir o protótipo: 5 dias. Continua **vencido** (Média = 3 dias úteis) |
| D-03 | Cálculo de prazo | 1 h / 4 h úteis / 3 d úteis / 5 d úteis | Rascunho "resposta até 13:43" com "agora" ≈ 09:43 | Horas úteis de 8h às 18h, segunda a sexta. 09:43 + 4 h úteis = 13:43. Crítica é 1 h corrida |
| D-04 | Status de chamado | Aguardando analista, Aprovado, Resolvido | + **Em andamento**, + **Em atendimento** | Enum: Aberto, Em andamento, Aguardando analista, Em atendimento, Aprovado, Resolvido |
| D-05 | Prazo de contato após transferência | Não define | "em até 2 h úteis" (Suporte N2), "contato em 25 min", "agent pausado · até 12:05" | Prazo de primeiro contato humano por nível/prioridade; contagem regressiva no console |
| D-06 | O que é "chamado aberto" | Não define | "3 abertos" inclui REQ-10442 **Aprovado** | Aberto = qualquer status diferente de Resolvido e Encerrado. Aprovado conta como aberto |
| D-07 | Escolha do nível N1/N2 | Não define | Transferência da Ana vai para **N2** | Regra simples: crítico, vencido e baixa confiança vão para N2; pedido do usuário vai para N1. Documentar |
| D-08 | Concorrência de analistas | Não define | — | Primeiro a assumir ganha; o segundo recebe aviso |
| D-09 | Conta do selo "5" e ordenação da fila | Não define | Selo 5, "Para você 3" | Selo = conversas que exigem ação (aguardando atendente + agent pediu ajuda + minhas com mensagem nova). Ordenar mais antigas primeiro |
| D-10 | Ticks ✓✓ | Não define | ✓✓ nas mensagens do agent e do analista | ✓ enviada, ✓✓ entregue (lida pelo destinatário, se possível). Simples e documentado |
| D-11 | Confiança do agent | "Grau de segurança" sem formato | **"confiança 41%"** | Percentual 0–100. Abaixo de um limiar documentado, o agent transfere |
| D-12 | Subcategoria | Só categorias | "Hardware › Notebook" | Subcategoria opcional |
| D-13 | Exemplos de chamado do Anexo B | INC-20311, REQ-10442, **INC-20150** | INC-20311, INC-20298, REQ-10442, INC-19877, INC-19410 | Incluir **todos**. INC-20150 (SAP, resolvido há 4 dias) pertence a outro funcionário, por exemplo Carla Mendes (o console mostra "Preciso de acesso ao SAP ainda hoje"), para testar a reabertura e a privacidade |
| D-14 | Contador de mensagens | "Limite de 30 por sessão" | 18/30 e 16/30 em telas diferentes | Contar mensagens do **usuário** na sessão; valores do protótipo são ilustrativos |
| D-15 | Login e senha | "Aceita qualquer senha" | "Esqueci minha senha", "Redefinir senha" | Redefinição simulada (X-04, X-22) |
| D-16 | Responsividade | Não define | Só desktop 1440 | Desktop primeiro (X-42) |
| D-17 | Relógio dos dados de exemplo | Datas relativas ("há 6 dias") | Datas absolutas ("16 out, 14:20") e relativas | O seed grava datas **relativas ao momento do seed**, para os textos "há N dias" sempre baterem |

---

## 5. Dados de exemplo que o protótipo exige

Para as 6 telas ficarem iguais ao protótipo, o seed precisa conter pelo menos:

### Funcionários e analistas

| Pessoa | Papel | Observações |
|---|---|---|
| Ana Souza | Funcionária | Financeiro; conta principal do chat e da transferência |
| Carla Mendes | Funcionária | Pedido de acesso ao SAP; dona do INC-20150 |
| Bruno Tavares | Funcionário | Conversa em que o agent pediu ajuda (confiança 41%) |
| Diego Ramos | Funcionário | Conversa com o agent atendendo, "digitando…" |
| Elisa Prado | Funcionária | Chamado INC-20519 criado pelo agent |
| Fábio Nunes | Funcionário | Conversa resolvida pelo agent |
| Gabriela Rocha | Funcionária | Conversa resolvida pelo agent ("ontem") |
| Rafael Lima | Analista N2 | Atende no console |

### Chamados da Ana

| Chamado | Título | Status | Situação |
|---|---|---|---|
| INC-20311 | Notebook lento após atualização do Windows | Aguardando analista | Hardware › Notebook, Média, aberto em 16 out, vencido |
| INC-20298 | Acesso à pasta Financeiro (SharePoint) | Em andamento | Aberto, 14 out |
| REQ-10442 | Segundo monitor para home office | Aprovado | Aberto, 09 out |
| INC-19877 | Outlook não sincroniza no celular | Resolvido | Resolvido em 02 set |
| INC-19410 | Troca de senha da rede | Resolvido | Resolvido em 11 jul |

Totais esperados no painel: **3 abertos · 2 encerrados**.

### Outros

- Chamados `INC-20517` (da prévia do login) e `INC-20519` (da Elisa).
- Rascunho `D-381`.
- Conversas em todos os estados da lista do console: transferida (com chamado), transferida (com contagem), agent pediu ajuda, agent atendendo, resolvida pelo agent, assumida.
- Artigos da central de ajuda (5 a 10), incluindo VPN 809, horário do service desk e o artigo de Wi-Fi citado na conversa da Gabriela.
- Todos os extras de login: ramal 4000, métricas calculáveis.

---

## 6. Escopo e ordem sugerida

O PRD tem prioridade. Os extras entram depois do núcleo funcionar.

| Fase | Conteúdo | Itens |
|---|---|---|
| 1. Núcleo do PRD | Serviço, agent, chat, console, transparência | ver `PRD_Nexo_Assist_Mapeamento.md` |
| 2. Fidelidade visual | Telas iguais ao protótipo, tokens, componentes | X-07, X-08, X-13 a X-18, X-24, X-28, X-31, X-44 |
| 3. Comportamentos do protótipo | Contador, prazo no rascunho, confiança, presença, tempo real | X-11 a X-17, X-27 a X-35, X-38, X-41 |
| 4. Telas extras | Meu perfil, esqueci senha, privacidade | X-01 a X-06, X-21 a X-23 |
| 5. Lacunas | Detalhe da decisão, estados de erro e vazio, acessibilidade | X-19, X-36, X-39, X-40, X-42, X-43 |

> **Atenção ao risco:** X-39 (detalhe da decisão) pertence ao núcleo do PRD, não ao plus. Não deixe para a fase 5.

### O que cortar se faltar tempo (do menos para o mais importante)

1. X-23 (agent apontar para Meu perfil)
2. X-05 (página de privacidade)
3. X-43 (acessibilidade além do básico)
4. X-36 (detalhe e lista completa de chamados)
5. X-29 (digitando…)

Nunca cortar: X-39, X-13, X-17, X-27, X-28, X-32, X-33, X-35.

---

## 7. O que dizer sobre o que é simulado

Honestidade vale ponto na entrevista. Itens simulados e como justificar:

| Item | Simulado porque | O que faria em produção |
|---|---|---|
| Redefinição de senha (X-04, X-22) | O PRD manda aceitar qualquer senha | Provedor de e-mail, token de uso único com expiração, política de senha |
| Autenticação | Mesmo motivo | SSO corporativo (SAML ou OIDC) |
| Sistema de chamados legado | O PRD pede serviço simulado | Integração com o service desk real, com *retry* e *circuit breaker* |
| Métricas do login (X-01) | Poucos dados | Janela móvel sobre dados reais |
| Presença e digitação (X-29) | Escopo local | Canal de presença com expiração |
