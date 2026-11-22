# The Legend of CPU — A Cruzada dos Bits

> O Reino de Silício parou. Um surto de Ruído embaralhou os bits do Núcleo e apagou os **16 Fragmentos de Conhecimento** que mantinham tudo funcionando. Decifre as pistas, preencha o Painel do Núcleo e devolva o clock a este mundo.

Jogo acadêmico de **Arquitetura Computacional** com uma cruzadinha de 16 conceitos e três áreas de estudo interativas: flashcards, quiz e associação. Tudo em HTML, CSS e JavaScript puros, pronto para o GitHub Pages.

**Site publicado:** _pendente — o link será adicionado aqui depois da publicação no GitHub Pages._

---

## Sumário

- [Objetivo acadêmico](#objetivo-acadêmico)
- [Situação do conteúdo](#situação-do-conteúdo)
- [Tecnologias](#tecnologias)
- [Como executar localmente](#como-executar-localmente)
- [Como jogar](#como-jogar)
- [Atividades de estudo](#atividades-de-estudo)
- [Palavras e pistas](#palavras-e-pistas)
- [Validação da grade](#validação-da-grade)
- [Estrutura dos arquivos](#estrutura-dos-arquivos)
- [Publicação no GitHub Pages](#publicação-no-github-pages)
- [Versionamento](#versionamento)
- [Privacidade e autoria dos commits](#privacidade-e-autoria-dos-commits)
- [Acessibilidade](#acessibilidade)

---

## Objetivo acadêmico

Ajudar a revisar, de forma ativa e divertida, os componentes e conceitos básicos de um computador:

- **Processamento:** CPU, ULA, unidade de controle, registradores e microcontrolador.
- **Memórias:** RAM, ROM, EEPROM, Flash, cache e memória de massa.
- **Barramentos e transferência:** barramento de endereço, barramento de dados e DMA.
- **Núcleos:** dual core e quad core.

A cruzadinha treina a recordação dos termos; os flashcards, o quiz e a associação trabalham o **entendimento** (diferenças entre memórias, papel de cada barramento, CPU × microcontrolador etc.).

## Situação do conteúdo

- As pistas, os flashcards, as questões e as explicações foram escritos com base em conceitos clássicos de Arquitetura Computacional e alinhados ao que aparece nas aulas da disciplina (ciclo buscar–decodificar–executar, gargalo de von Neumann, núcleo como unidade de execução completa, endereçamento 2ⁿ, ATmega328P do Arduino).
- **Pendente:** conferir todas as pistas com o **e-book da disciplina**, que não estava disponível quando o projeto foi criado. Nenhuma página ou afirmação foi atribuída ao e-book. Se algum termo ou definição do e-book for diferente, ajuste o campo `clue` (e os demais textos) em `assets/js/data.js` e rode `node tools/verificar.js`.

## Tecnologias

- **HTML5** semântico (uma página, telas trocadas pelo `#hash` da URL).
- **CSS3** com variáveis, grid, flexbox e animações (respeitando “reduzir movimento”).
- **JavaScript puro** (sem frameworks, sem bibliotecas, sem etapa de compilação), em scripts clássicos com `defer` — funciona até abrindo o `index.html` direto no navegador.
- **Web Audio API** para os efeitos sonoros (nenhum arquivo de áudio).
- **SVG gerado por código** para a pixel art (logotipo, mascote e ícones).
- **localStorage** para salvar o progresso, com tratamento de erros.
- Nenhuma chave de API, serviço pago, fonte, imagem ou áudio externo.

## Como executar localmente

**Opção 1 — direto no navegador:** dê dois cliques no `index.html`.

**Opção 2 — servidor local** (simula melhor o GitHub Pages), na pasta do projeto:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`. Também funciona com a extensão *Live Server* do VS Code.

**Verificação opcional** (precisa do Node.js, mas o site não depende dele):

```bash
node tools/verificar.js
```

## Como jogar

1. Escolha uma palavra tocando numa **pista** ou numa **casa** do tabuleiro.
2. Digite as letras: o cursor avança sozinho na direção ativa (**→** horizontal, **↓** vertical). Acentos e Ç são convertidos automaticamente; números e símbolos são bloqueados.
3. Clique em **Conferir** quando quiser. O painel de pistas mostra cada palavra como **✓ Correta**, **✗ Incorreta** ou **… Incompleta** — sem revelar respostas.
4. Corrija e confira de novo. Editar uma palavra já conferida faz ela voltar a “não conferida”.
5. Com as 16 palavras certas, o Registrador do Núcleo chega a `0xFFFF` e aparece a tela de vitória.

### Controles

| Ação | Teclado | Toque / mouse |
| --- | --- | --- |
| Escrever uma letra | Letras A–Z | Teclado do celular |
| Andar pelas casas | Setas ← ↑ → ↓ | Tocar na casa |
| Alternar horizontal/vertical num cruzamento | `Espaço` | Tocar de novo na casa ativa ou botão ⇄ |
| Próxima / anterior palavra | `Enter` / `Shift` + `Enter` | Botões ▶ e ◀ da pista ativa |
| Apagar | `Backspace` (apaga e volta) · `Delete` | Tecla de apagar |
| Início / fim da palavra | `Home` / `End` | — |
| Sair do tabuleiro | `Tab` (o foco nunca fica preso) | Tocar fora |

### Pontuação, tempo e conquistas

- **+100** por palavra, na primeira vez que ela é confirmada correta. **Conferir nunca tira pontos.**
- Ao concluir: **+300** de bônus e **bônus de tempo** de até 500 (perde 1 ponto a cada 2 segundos, nunca negativo). Máximo: 2.400.
- O cronômetro começa na primeira interação e **pausa** quando a aba fica oculta, quando você vai para outra área do site ou abre uma janela.
- **Conquistas:** Primeiro Bit, Um Byte Inteiro, Mestre dos Barramentos, Guardião da Hierarquia, Multinúcleo, Cruzada Concluída, Clock Turbo, Inventário Completo, Circuito Perfeito e Conexão Perfeita.
- **Salvamento automático** no navegador (letras, conferências, tempo, pontos, conquistas, recorde e preferência de som). Dados salvos inválidos são descartados com aviso; se o armazenamento estiver bloqueado, o jogo funciona normalmente sem salvar.
- **Reiniciar** pede confirmação e apaga só a partida atual — conquistas, recorde e som continuam.

## Atividades de estudo

As áreas de revisão ficam **separadas** da cruzadinha: o aluno escolhe quando consultar.

- **Inventário do Conhecimento (flashcards):** pergunta na frente, explicação e dica de memorização no verso. Botões **Já sei** e **Preciso revisar**, filtro dos cards para revisar, embaralhar e um inventário visual com os 16 conceitos. O progresso fica salvo.
- **Desafio dos Circuitos (quiz):** 14 questões de situação (ex.: “a energia caiu antes de salvar — por que o texto sumiu?”), cada uma com uma única alternativa correta. Ordem e alternativas embaralhadas sem trocar a resposta, explicação após cada resposta, rank final (S, A, B, C) e opção de **refazer só as erradas**. Atalhos: teclas 1 a 4.
- **Conecte os Componentes (associação):** rodadas de 6 pares para ligar componente e função por clique, toque ou teclado, com feedback imediato e explicação de cada par. **Nova rodada** sorteia e embaralha tudo de novo.

## Palavras e pistas

> ⚠️ **Contém as respostas da cruzadinha.** O site não mostra este gabarito.

A numeração segue a posição no tabuleiro (esquerda → direita, cima → baixo). Todas as pistas têm no máximo 15 palavras e não citam a resposta nem a sigla por extenso.

### Horizontais

| Nº | Conceito | Resposta | Pista |
| --- | --- | --- | --- |
| 3 | DMA | DMA | Recurso que permite a periféricos trocar dados com a memória sem ocupar o processador. |
| 6 | EEPROM | EEPROM | Memória não volátil que permite reescrever cada byte individualmente; guarda pequenas configurações. |
| 7 | CPU | CPU | Cérebro do PC: executa as instruções, mas depende de memória e periféricos externos. |
| 8 | ROM | ROM | Memória não volátil cujo conteúdo é definido na fabricação e não muda depois. |
| 9 | Registradores | REGISTRADORES | Memórias minúsculas dentro do processador; as mais rápidas, guardam valores da instrução atual. |
| 10 | UC — Unidade de Controle | UC | No processador, decodifica cada instrução e envia sinais que coordenam os demais componentes. |
| 12 | Quad core | QUADCORE | Processador com dois pares de unidades de execução completas, trabalhando simultaneamente. |
| 14 | Flash | FLASH | Memória não volátil apagada em blocos inteiros; tecnologia de pendrives e cartões de memória. |
| 16 | Data bus — barramento de dados | DATABUS | Vias de mão dupla que transportam as informações lidas ou gravadas na memória. |

### Verticais

| Nº | Conceito | Resposta | Pista |
| --- | --- | --- | --- |
| 1 | Dual core | DUALCORE | Processador com um par de unidades de execução completas, capazes de trabalhar simultaneamente. |
| 2 | Microcontrolador | MICROCONTROLADOR | Chip que integra processador, memória e periféricos, como o ATmega328P do Arduino. |
| 4 | Address bus — barramento de endereço | ADDRESSBUS | Vias que o processador usa para indicar qual posição da memória será acessada. |
| 5 | Memória de massa — armazenamento | MEMORIADEMASSA | Guarda arquivos de forma permanente e em grande volume, como HDs e SSDs. |
| 11 | Cache | CACHE | Memória intermediária e veloz que guarda cópias dos dados mais usados da memória principal. |
| 13 | ULA | ULA | Calculadora do processador: faz somas, subtrações e operações como E, OU e NÃO. |
| 15 | RAM | RAM | Memória principal e volátil que guarda os programas em execução e seus dados. |

<details>
<summary>Ver a solução no tabuleiro (16 linhas × 13 colunas)</summary>

```
 1  D · · · · · · · · M · · ·
 2  U · D M A · · · · I · · ·
 3  A · · · D · M · · C · · ·
 4  L · · · D · E E P R O M ·
 5  C P U · R O M · · O · · ·
 6  O · · · E · O · · C · · ·
 7  R E G I S T R A D O R E S
 8  E · · · S · I · · N · · ·
 9  · · · · B · A · · T · U C
10  · · · Q U A D C O R E · A
11  · · · · S · E · · O · · C
12  · U · · · · M · F L A S H
13  · L · R · · A · · A · · E
14  D A T A B U S · · D · · ·
15  · · · M · · S · · O · · ·
16  · · · · · · A · · R · · ·
```

</details>

## Validação da grade

A grade é **fixa e pré-calculada** (encontrada por um gerador com busca aleatória e conferida automaticamente). Os dados ficam centralizados em `assets/js/data.js` — identificador, resposta, pista, posição inicial e direção — e o tabuleiro, as pistas, a numeração e a conferência são montados a partir deles.

Ao abrir a página, `assets/js/crossword-model.js` valida a grade. Se algo falhar, o tabuleiro não é montado e o erro aparece na tela e no console. O resultado também aparece em **Como jogar → Sobre o conteúdo e a grade**.

| Verificação | Resultado |
| --- | --- |
| Palavras usadas | 16 de 16 (9 horizontais, 7 verticais) |
| Cruzamentos com letras iguais | 19 de 19 |
| Todas conectadas em um único bloco | Sim |
| Cada palavra cruza ao menos uma outra | Sim (de 1 a 5 cruzamentos por palavra) |
| Sequências de letras sem pista | Nenhuma |
| Casas antes/depois de cada palavra bloqueadas ou fora da grade | Sim |
| Casas preenchíveis sem resposta | Nenhuma |
| Sobreposição na mesma direção | Nenhuma |
| Numeração em ordem de leitura (e compartilhada quando H e V começam juntas) | Sim |
| Pistas com até 15 palavras e sem entregar a resposta | 16 de 16 |

## Estrutura dos arquivos

```
arqcomp-cruzadinha/
├── index.html                # página única com todas as telas e janelas
├── README.md
├── .nojekyll                 # publica no GitHub Pages sem processamento Jekyll
├── .gitattributes / .gitignore
├── assets/
│   ├── css/
│   │   ├── base.css          # cores, tipografia, foco visível, reduzir movimento
│   │   ├── layout.css        # cabeçalho, navegação, telas e rodapé
│   │   ├── components.css    # botões, painéis, selos, barras de progresso
│   │   ├── pages.css         # tela inicial e cartões de missão
│   │   ├── crossword.css     # tabuleiro, pista ativa e painel de pistas
│   │   ├── game.css          # HUD, janelas, notificações, conquistas, Como jogar
│   │   ├── activities.css    # flashcards, quiz e associação
│   │   └── effects.css       # animações
│   ├── img/
│   │   └── favicon.svg
│   └── js/
│       ├── utils.js          # funções auxiliares e barramento de eventos
│       ├── storage.js        # localStorage seguro (com cópia em memória)
│       ├── pixel.js          # fonte pixelada, mascote e ícones em SVG
│       ├── audio.js          # sons sintetizados e botão de som
│       ├── ui.js             # notificações e janelas de confirmação
│       ├── data.js           # FONTE ÚNICA: conceitos, pistas, posições, quiz
│       ├── crossword-model.js# monta e valida a grade (sem DOM)
│       ├── crossword.js      # tabuleiro interativo (seleção, digitação, teclado)
│       ├── achievements.js   # conquistas
│       ├── game.js           # conferência, pontuação, tempo, salvamento, vitória
│       ├── flashcards.js     # Inventário do Conhecimento
│       ├── quiz.js           # Desafio dos Circuitos
│       ├── matching.js       # Conecte os Componentes
│       ├── pages.js          # tela inicial e relatório de validação
│       └── app.js            # navegação entre telas e inicialização
└── tools/
    └── verificar.js          # verificação opcional com Node.js
```

## Publicação no GitHub Pages

1. Crie um repositório **público** chamado `arqcomp-cruzadinha` no GitHub (sem README, para não conflitar).
2. Na pasta do projeto, conecte e envie (troque `SEU-USUARIO`):

   ```bash
   git remote add origin https://github.com/SEU-USUARIO/arqcomp-cruzadinha.git
   git push -u origin main
   ```

3. No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, escolha **main** e **/ (root)** e salve.
4. Em alguns minutos o site fica em `https://SEU-USUARIO.github.io/arqcomp-cruzadinha/`.
5. Teste o link publicado e **substitua a linha “Site publicado: pendente”** no topo deste README pelo endereço real.

Todos os caminhos do projeto são relativos (`assets/...`), então o site funciona dentro do subdiretório `/arqcomp-cruzadinha/`.

## Versionamento

O projeto usa commits no padrão `tipo: descrição curta` (`feat`, `fix`, `style`, `docs`), cada um representando mudanças reais. A entrega exige **no mínimo 6 commits em pelo menos 2 dias diferentes**: os commits do primeiro dia foram feitos durante a construção do projeto; os do segundo dia devem nascer de trabalho real, como:

- `fix: ajusta pistas conforme o e-book da disciplina`
- `fix: corrige ajustes encontrados no teste em celular`
- `docs: adiciona link do site publicado`

Nunca altere datas de commits.

## Privacidade e autoria dos commits

- Nenhum arquivo, comentário ou tela contém RA, e-mail, telefone ou outros dados pessoais.
- **Antes de publicar**, confira o nome e o e-mail gravados nos commits:

  ```bash
  git log --format="%h %an <%ae> %ad"
  ```

- Para não expor seu e-mail, use o endereço *noreply* do GitHub (em **Settings → Emails**, ative “Keep my email addresses private” e copie o endereço `...@users.noreply.github.com`) e configure **só neste repositório**:

  ```bash
  git config user.name "Seu Nome"
  git config user.email "ID+usuario@users.noreply.github.com"
  ```

## Acessibilidade

- Navegação completa pelo teclado, foco sempre visível e “pular para o conteúdo”.
- Cada casa informa linha, coluna, número e direção; anúncios para leitores de tela nas trocas de palavra e nas conferências.
- Resultados com ícones e texto, nunca só com cor; contraste confortável no tema escuro.
- Sons discretos, opcionais e sempre acompanhados de informação visual; o áudio só começa após uma interação.
- Animações desligadas quando o sistema pede menos movimento.
- Celular: casas de no mínimo 28 px; quando o tabuleiro não cabe, ele rola dentro da moldura, sem rolagem horizontal da página.

---

Projeto acadêmico de Arquitetura Computacional. Conteúdo de apoio ao estudo: confira sempre com o material oficial da disciplina.
