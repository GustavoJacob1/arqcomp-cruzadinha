/* ==========================================================================
   The Legend of CPU — data.js
   FONTE ÚNICA de conteúdo do jogo. Tudo é montado a partir daqui:
   tabuleiro, pistas, conferência, flashcards, associação e quiz.

   Cada conceito tem:
   - id ........ identificador único
   - label ..... grafia adequada para mostrar fora do tabuleiro
   - fullName .. nome por extenso (usado só nas áreas de revisão)
   - answer .... resposta no tabuleiro (maiúsculas, sem espaços e sem acentos)
   - clue ...... pista da cruzadinha (no máximo 15 palavras)
   - avoid ..... fragmentos que NÃO podem aparecer na pista (entregariam a resposta)
   - grid ...... posição inicial (linha/coluna começando em 0) e direção (H ou V)
   - group ..... grupo temático (usado nas conquistas)
   - card ...... flashcard: frente (pergunta), verso (explicação) e dica/analogia
   - match ..... associação: função curta e explicação do par

   A numeração das pistas NÃO fica aqui: ela é calculada a partir das posições,
   da esquerda para a direita e de cima para baixo (crossword-model.js).
   ========================================================================== */
(function (root) {
  'use strict';

  var LCPU = root.LCPU = root.LCPU || {};

  LCPU.CONCEPTS = [
    {
      id: 'dualcore',
      label: 'Dual core',
      fullName: 'Processador de dois núcleos',
      answer: 'DUALCORE',
      clue: 'Processador com um par de unidades de execução completas, capazes de trabalhar simultaneamente.',
      avoid: ['DUAL', 'CORE', 'NUCLE', 'DOIS', 'DUAS'],
      grid: { row: 0, col: 0, dir: 'V' },
      group: 'nucleos',
      card: {
        front: 'O que significa um processador ser dual core?',
        back: 'Significa que ele tem dois núcleos físicos no mesmo chip. Cada núcleo é uma unidade de execução completa, com unidade de controle, ULA e registradores próprios. Assim, duas instruções podem ser executadas de verdade ao mesmo tempo — desde que o software divida o trabalho em mais de uma tarefa.',
        tip: 'Dois caixas abertos no mercado: a fila anda mais rápido se houver clientes para os dois.'
      },
      match: {
        func: 'Processador com dois núcleos físicos no mesmo chip',
        explain: 'Dual core = 2 núcleos, cada um capaz de executar instruções de forma independente.'
      }
    },
    {
      id: 'microcontrolador',
      label: 'Microcontrolador',
      fullName: 'Microcontrolador',
      answer: 'MICROCONTROLADOR',
      clue: 'Chip que integra processador, memória e periféricos, como o ATmega328P do Arduino.',
      avoid: ['MICRO', 'CONTROL'],
      grid: { row: 0, col: 9, dir: 'V' },
      group: 'processamento',
      card: {
        front: 'Qual é a diferença entre uma CPU e um microcontrolador?',
        back: 'A CPU é apenas o processador: depende de memória e de periféricos externos. O microcontrolador reúne em um único chip o processador, memórias (Flash, RAM e EEPROM) e periféricos de entrada e saída, como o conversor analógico-digital. É o cérebro de sistemas embarcados — no Arduino Uno, é o ATmega328P.',
        tip: 'A CPU é um motor; o microcontrolador é um carro compacto que já sai montado.'
      },
      match: {
        func: 'Processador, memórias e periféricos integrados em um só chip',
        explain: 'O microcontrolador é um computador completo em um chip, comum em sistemas embarcados como o Arduino.'
      }
    },
    {
      id: 'dma',
      label: 'DMA',
      fullName: 'Direct Memory Access (acesso direto à memória)',
      answer: 'DMA',
      clue: 'Recurso que permite a periféricos trocar dados com a memória sem ocupar o processador.',
      avoid: ['DIRET', 'ACESSO'],
      grid: { row: 1, col: 2, dir: 'H' },
      group: 'sistema',
      card: {
        front: 'Como um disco ou uma placa de rede transfere muitos dados sem travar a CPU?',
        back: 'Usando DMA (acesso direto à memória). A CPU apenas configura a transferência — origem, destino e tamanho — e um controlador de DMA move os dados entre o periférico e a memória. Ao terminar, ele avisa a CPU com uma interrupção. Enquanto isso, o processador fica livre para outras tarefas.',
        tip: 'É como contratar um entregador: você passa o endereço e continua trabalhando enquanto ele faz a entrega.'
      },
      match: {
        func: 'Transfere dados entre periféricos e memória sem ocupar a CPU',
        explain: 'Com DMA, a CPU só configura a transferência; o controlador de DMA faz o restante e avisa no final.'
      }
    },
    {
      id: 'addressbus',
      label: 'Address bus — barramento de endereço',
      fullName: 'Address bus (barramento de endereço)',
      answer: 'ADDRESSBUS',
      clue: 'Vias que o processador usa para indicar qual posição da memória será acessada.',
      avoid: ['ADDRESS', 'BUS', 'ENDERE', 'BARRAMENT'],
      grid: { row: 1, col: 4, dir: 'V' },
      group: 'barramentos',
      card: {
        front: 'Como a CPU informa à memória qual posição quer ler ou escrever?',
        back: 'Pelo barramento de endereço (address bus): a CPU coloca nele o número da posição desejada. Ele é unidirecional — o endereço parte do processador (ou de quem controla a transferência) em direção à memória e aos dispositivos. A largura dele define quantas posições existem: com 32 linhas são 2³² endereços, ou seja, 4 GiB.',
        tip: 'É o CEP da carta: diz para onde ir, mas não carrega o conteúdo.'
      },
      match: {
        func: 'Informa a posição de memória que será lida ou escrita',
        explain: 'O address bus leva o endereço; a quantidade de linhas define quanta memória pode ser endereçada.'
      }
    },
    {
      id: 'memoriademassa',
      label: 'Memória de massa',
      fullName: 'Memória de massa (armazenamento secundário)',
      answer: 'MEMORIADEMASSA',
      clue: 'Guarda arquivos de forma permanente e em grande volume, como HDs e SSDs.',
      avoid: ['MEMORI', 'MASSA', 'ARMAZENAMENT'],
      grid: { row: 2, col: 6, dir: 'V' },
      group: 'memoria',
      card: {
        front: 'Onde seus arquivos ficam quando o computador está desligado?',
        back: 'Na memória de massa, também chamada de armazenamento secundário: HDs, SSDs, pendrives e cartões. Ela é não volátil e tem grande capacidade, mas é a mais lenta da hierarquia. Para um programa ser executado, ele é copiado da memória de massa para a RAM.',
        tip: 'É o armazém: cabe tudo, mas buscar alguma coisa lá leva tempo.'
      },
      match: {
        func: 'Armazenamento permanente e de grande capacidade, como HD e SSD',
        explain: 'A memória de massa guarda arquivos sem energia e em grande volume, mas é a mais lenta da hierarquia.'
      }
    },
    {
      id: 'eeprom',
      label: 'EEPROM',
      fullName: 'Electrically Erasable Programmable Read-Only Memory',
      answer: 'EEPROM',
      clue: 'Memória não volátil que permite reescrever cada byte individualmente; guarda pequenas configurações.',
      avoid: ['ELETRIC', 'APAGAV', 'PROGRAMAV', 'PROM'],
      grid: { row: 3, col: 6, dir: 'H' },
      group: 'memoria',
      card: {
        front: 'Que memória não volátil permite alterar um único byte por vez?',
        back: 'A EEPROM. Ela é não volátil e pode ser apagada e regravada eletricamente, byte a byte, sem retirar o chip do circuito. É ótima para guardar pequenas configurações que mudam de vez em quando. Em troca, tem pouca capacidade e grava devagar. O ATmega328P, do Arduino Uno, tem 1 KB de EEPROM.',
        tip: 'Um caderno escrito a lápis: dá para apagar e reescrever só uma palavra.'
      },
      match: {
        func: 'Memória não volátil regravável eletricamente, byte a byte',
        explain: 'A EEPROM apaga e regrava bytes individuais e mantém os dados sem energia.'
      }
    },
    {
      id: 'cpu',
      label: 'CPU',
      fullName: 'Unidade Central de Processamento',
      answer: 'CPU',
      clue: 'Cérebro do PC: executa as instruções, mas depende de memória e periféricos externos.',
      avoid: ['CENTRAL', 'PROCESSAMENT', 'PROCESSADOR', 'UNIDADE'],
      grid: { row: 4, col: 0, dir: 'H' },
      group: 'processamento',
      card: {
        front: 'O que a CPU faz e por que ela precisa de outros componentes?',
        back: 'A CPU (Unidade Central de Processamento) busca, decodifica e executa as instruções dos programas, repetindo esse ciclo bilhões de vezes por segundo. Ela é formada principalmente pela unidade de controle, pela ULA e pelos registradores. Sozinha, porém, não guarda os programas nem se comunica com o mundo: depende da memória e dos dispositivos de entrada e saída.',
        tip: 'É o chef da cozinha: executa as receitas, mas precisa da despensa (memória) e dos garçons (periféricos).'
      },
      match: {
        func: 'Executa as instruções dos programas no ciclo buscar–decodificar–executar',
        explain: 'A CPU é o processador: busca cada instrução na memória, decodifica e executa.'
      }
    },
    {
      id: 'rom',
      label: 'ROM',
      fullName: 'Read-Only Memory (memória somente de leitura)',
      answer: 'ROM',
      clue: 'Memória não volátil cujo conteúdo é definido na fabricação e não muda depois.',
      avoid: ['LEITURA', 'SOMENTE', 'READ'],
      grid: { row: 4, col: 4, dir: 'H' },
      group: 'memoria',
      card: {
        front: 'Que memória já sai de fábrica com um conteúdo fixo?',
        back: 'A ROM. Ela é não volátil (não perde os dados sem energia) e seu conteúdo é gravado na fabricação, sem que o usuário possa alterá-lo. Serve para guardar programas fixos. Hoje, muitos firmwares ficam em memórias regraváveis, como a Flash, justamente para permitir atualizações.',
        tip: 'Um livro impresso: você lê quantas vezes quiser, mas não reescreve.'
      },
      match: {
        func: 'Memória não volátil com conteúdo gravado na fabricação',
        explain: 'A ROM mantém os dados sem energia, mas seu conteúdo não é alterado depois de fabricado.'
      }
    },
    {
      id: 'registradores',
      label: 'Registradores',
      fullName: 'Registradores',
      answer: 'REGISTRADORES',
      clue: 'Memórias minúsculas dentro do processador; as mais rápidas, guardam valores da instrução atual.',
      avoid: ['REGISTR'],
      grid: { row: 6, col: 0, dir: 'H' },
      group: 'memoria',
      card: {
        front: 'Onde ficam os valores que a CPU está usando exatamente agora?',
        back: 'Nos registradores: pequenas memórias dentro da própria CPU e as mais rápidas da hierarquia. Eles guardam operandos, resultados e endereços da instrução em andamento — como o contador de programa, que aponta a próxima instrução. Cada um tem capacidade minúscula, de poucos bytes.',
        tip: 'São as mãos do cozinheiro: seguram apenas o que está sendo usado neste instante.'
      },
      match: {
        func: 'Guardam, dentro da CPU, os valores da instrução em andamento',
        explain: 'Registradores são as memórias menores e mais rápidas; ficam dentro do processador.'
      }
    },
    {
      id: 'uc',
      label: 'UC — Unidade de Controle',
      fullName: 'Unidade de Controle',
      answer: 'UC',
      clue: 'No processador, decodifica cada instrução e envia sinais que coordenam os demais componentes.',
      avoid: ['CONTROL', 'UNIDADE'],
      grid: { row: 8, col: 11, dir: 'H' },
      group: 'processamento',
      card: {
        front: 'Se a ULA faz as contas, quem decide qual conta fazer e quando?',
        back: 'A Unidade de Controle (UC). Ela busca a instrução, decodifica o que ela significa e gera os sinais de controle que coordenam a ULA, os registradores, a memória e os barramentos. A UC não calcula nada: organiza o trabalho de todos.',
        tip: 'É a coordenação da obra: não assenta tijolos, mas diz quem faz o quê e em que ordem.'
      },
      match: {
        func: 'Decodifica instruções e gera sinais que coordenam os componentes',
        explain: 'A UC interpreta cada instrução e comanda os outros componentes por meio de sinais de controle.'
      }
    },
    {
      id: 'cache',
      label: 'Cache',
      fullName: 'Memória cache',
      answer: 'CACHE',
      clue: 'Memória intermediária e veloz que guarda cópias dos dados mais usados da memória principal.',
      avoid: [],
      grid: { row: 8, col: 12, dir: 'V' },
      group: 'memoria',
      card: {
        front: 'Por que a CPU precisa de memória cache se já existe a RAM?',
        back: 'Porque a RAM é lenta perto da CPU, que passaria muito tempo esperando os dados chegarem (o gargalo de von Neumann). A cache é uma memória pequena e rápida, entre os registradores e a RAM, que guarda cópias dos dados e instruções mais usados. Costuma ser dividida em níveis (L1, L2, L3): quanto mais perto do núcleo, menor e mais rápida.',
        tip: 'É a geladeira da cozinha: você não vai ao mercado (RAM) toda vez que precisa de leite.'
      },
      match: {
        func: 'Guarda cópias dos dados mais usados para evitar esperar a RAM',
        explain: 'A cache reduz a espera da CPU mantendo por perto aquilo que é usado com mais frequência.'
      }
    },
    {
      id: 'quadcore',
      label: 'Quad core',
      fullName: 'Processador de quatro núcleos',
      answer: 'QUADCORE',
      clue: 'Processador com dois pares de unidades de execução completas, trabalhando simultaneamente.',
      avoid: ['QUAD', 'CORE', 'NUCLE', 'QUATRO'],
      grid: { row: 9, col: 3, dir: 'H' },
      group: 'nucleos',
      card: {
        front: 'Um quad core é sempre duas vezes mais rápido que um dual core?',
        back: 'Não. O quad core tem quatro núcleos físicos e pode executar até quatro fluxos de instruções em paralelo, mas o ganho depende de o programa dividir o trabalho entre os núcleos. O desempenho também depende do clock, de quantas instruções são concluídas por ciclo e da arquitetura.',
        tip: 'Quatro cozinheiros só aceleram o jantar se a receita puder ser dividida entre eles.'
      },
      match: {
        func: 'Processador com quatro núcleos físicos no mesmo chip',
        explain: 'Quad core = 4 núcleos; o ganho real depende de o software usar vários núcleos.'
      }
    },
    {
      id: 'ula',
      label: 'ULA',
      fullName: 'Unidade Lógica e Aritmética',
      answer: 'ULA',
      clue: 'Calculadora do processador: faz somas, subtrações e operações como E, OU e NÃO.',
      avoid: ['LOGIC', 'ARITMETIC', 'UNIDADE'],
      grid: { row: 11, col: 1, dir: 'V' },
      group: 'processamento',
      card: {
        front: 'Qual parte da CPU faz as contas — e que tipos de operação ela realiza?',
        back: 'A ULA (Unidade Lógica e Aritmética). Ela realiza operações aritméticas (somar, subtrair, comparar valores) e lógicas (E, OU, NÃO) sobre os dados que recebe dos registradores. A ULA não decide o que fazer: quem manda é a unidade de controle.',
        tip: 'É a calculadora da CPU: resolve a conta que alguém mandou resolver.'
      },
      match: {
        func: 'Realiza operações aritméticas e lógicas sobre os dados',
        explain: 'A ULA faz as contas (soma, subtração, comparação) e as operações lógicas (E, OU, NÃO).'
      }
    },
    {
      id: 'flash',
      label: 'Flash',
      fullName: 'Memória Flash',
      answer: 'FLASH',
      clue: 'Memória não volátil apagada em blocos inteiros; tecnologia de pendrives e cartões de memória.',
      avoid: [],
      grid: { row: 11, col: 8, dir: 'H' },
      group: 'memoria',
      card: {
        front: 'Qual é a diferença entre a memória Flash e a EEPROM?',
        back: 'A Flash é uma evolução da EEPROM: também é não volátil e regravável eletricamente, mas apaga os dados em blocos inteiros, e não byte a byte. Isso a torna mais barata e densa, ideal para grandes volumes: pendrives, cartões, SSDs e a memória de programa de microcontroladores (o ATmega328P tem 32 KB de Flash).',
        tip: 'Em vez de apagar uma palavra, você arranca a página inteira e reescreve — mais eficiente para grandes volumes.'
      },
      match: {
        func: 'Memória não volátil regravável em blocos, usada em pendrives e SSDs',
        explain: 'A Flash apaga e regrava em blocos, o que a torna densa e barata para grandes volumes.'
      }
    },
    {
      id: 'ram',
      label: 'RAM',
      fullName: 'Random Access Memory (memória de acesso aleatório)',
      answer: 'RAM',
      clue: 'Memória principal e volátil que guarda os programas em execução e seus dados.',
      avoid: ['ALEATORI', 'ACESSO', 'RANDOM'],
      grid: { row: 12, col: 3, dir: 'V' },
      group: 'memoria',
      card: {
        front: 'Por que um trabalho não salvo some quando o computador desliga?',
        back: 'Porque ele estava apenas na RAM, a memória principal. Ela é volátil: só mantém os dados enquanto recebe energia. A RAM guarda os programas em execução e seus dados; é muito mais rápida que a memória de massa, porém mais lenta que a cache e os registradores.',
        tip: 'É a bancada de trabalho: espaçosa e prática, mas é esvaziada toda vez que a oficina fecha.'
      },
      match: {
        func: 'Memória principal volátil, com os programas em execução',
        explain: 'A RAM é a memória principal; por ser volátil, perde o conteúdo quando falta energia.'
      }
    },
    {
      id: 'databus',
      label: 'Data bus — barramento de dados',
      fullName: 'Data bus (barramento de dados)',
      answer: 'DATABUS',
      clue: 'Vias de mão dupla que transportam as informações lidas ou gravadas na memória.',
      avoid: ['DATA', 'BUS', 'DADO', 'BARRAMENT'],
      grid: { row: 13, col: 0, dir: 'H' },
      group: 'barramentos',
      card: {
        front: 'Depois que o endereço foi informado, por onde o conteúdo viaja?',
        back: 'Pelo barramento de dados (data bus). Ele é bidirecional: leva dados da CPU para a memória na escrita e da memória para a CPU na leitura. A largura dele (8, 16, 32, 64 bits...) indica quantos bits viajam de uma vez.',
        tip: 'Se o endereço é o CEP, o barramento de dados é o caminhão que leva e traz a carga.'
      },
      match: {
        func: 'Transporta, nos dois sentidos, os valores lidos ou gravados',
        explain: 'O data bus é bidirecional: leva e traz os dados entre CPU, memória e dispositivos.'
      }
    }
  ];

  /* ------------------------------------------------------------------------
     Quiz "Desafio dos Circuitos": cada questão tem exatamente uma alternativa
     com correct: true. As alternativas são embaralhadas a cada rodada.
     "concept" liga a questão a um flashcard para revisão.
     ------------------------------------------------------------------------ */
  LCPU.QUIZ = [
    {
      id: 'q-ula',
      concept: 'ula',
      question: 'Um programa precisa somar dois valores e verificar se o resultado é maior que zero. Qual componente realiza essas operações?',
      options: [
        { text: 'A ULA', correct: true },
        { text: 'A unidade de controle' },
        { text: 'O barramento de endereço' },
        { text: 'A memória cache' }
      ],
      explain: 'Somar e comparar são operações aritméticas e lógicas — trabalho da ULA. A unidade de controle apenas coordena qual operação será feita e quando.'
    },
    {
      id: 'q-uc',
      concept: 'uc',
      question: 'Durante o ciclo de instrução, qual é o papel da unidade de controle?',
      options: [
        { text: 'Decodificar a instrução e gerar os sinais que coordenam os componentes', correct: true },
        { text: 'Fazer os cálculos aritméticos da instrução' },
        { text: 'Guardar permanentemente os programas instalados' },
        { text: 'Manter cópias dos dados mais usados da RAM' }
      ],
      explain: 'A UC interpreta a instrução e comanda os demais componentes. Calcular é papel da ULA; guardar programas é da memória de massa; manter cópias rápidas é da cache.'
    },
    {
      id: 'q-ram',
      concept: 'ram',
      question: 'Você digitava um trabalho e a energia caiu antes de salvar. O texto sumiu porque estava:',
      options: [
        { text: 'Na RAM, que é volátil', correct: true },
        { text: 'Na ROM, que é apagada quando falta energia' },
        { text: 'Na memória de massa, que só grava ao desligar' },
        { text: 'No barramento de dados, que foi desconectado' }
      ],
      explain: 'Enquanto você edita, o documento fica na RAM, que é volátil: sem energia, o conteúdo se perde. Só ao salvar ele vai para a memória de massa, que é não volátil.'
    },
    {
      id: 'q-hierarquia',
      concept: 'registradores',
      question: 'Qual sequência ordena as memórias da MAIS rápida para a MAIS lenta?',
      options: [
        { text: 'Registradores → cache → RAM → memória de massa', correct: true },
        { text: 'Cache → registradores → memória de massa → RAM' },
        { text: 'RAM → cache → registradores → memória de massa' },
        { text: 'Memória de massa → RAM → cache → registradores' }
      ],
      explain: 'Quanto mais perto do núcleo, mais rápida e menor é a memória: os registradores ficam dentro da CPU, a cache é intermediária, a RAM é a principal e a memória de massa é a maior e mais lenta.'
    },
    {
      id: 'q-cache',
      concept: 'cache',
      question: 'Por que a memória cache aumenta o desempenho do processador?',
      options: [
        { text: 'Porque guarda cópias dos dados mais usados, evitando esperas pela RAM', correct: true },
        { text: 'Porque aumenta a capacidade de armazenamento permanente' },
        { text: 'Porque transfere dados entre periféricos sem passar pela CPU' },
        { text: 'Porque substitui a ULA nas operações mais simples' }
      ],
      explain: 'A RAM é lenta perto da CPU. A cache mantém por perto o que é usado com frequência e reduz o tempo de espera — um alívio para o gargalo entre processador e memória.'
    },
    {
      id: 'q-registradores',
      concept: 'registradores',
      question: 'Qual é a principal diferença entre registradores e cache?',
      options: [
        { text: 'Registradores ficam no núcleo com os valores da instrução atual; a cache guarda cópias de dados da RAM', correct: true },
        { text: 'A cache é mais rápida que os registradores' },
        { text: 'Registradores são um tipo de memória de massa' },
        { text: 'A cache guarda os arquivos de forma permanente' }
      ],
      explain: 'Registradores são o nível mais rápido e menor, usados diretamente na execução da instrução. A cache é o nível seguinte: maior, um pouco mais lenta e com cópias de dados da RAM.'
    },
    {
      id: 'q-address',
      concept: 'addressbus',
      question: 'A CPU vai ler o conteúdo da posição 2000 da memória. O que viaja pelo barramento de endereço?',
      options: [
        { text: 'O número da posição (2000)', correct: true },
        { text: 'O valor guardado na posição 2000' },
        { text: 'Os sinais que ligam e desligam a ULA' },
        { text: 'Uma cópia do programa inteiro' }
      ],
      explain: 'O address bus carrega apenas o endereço. O valor guardado naquela posição volta para a CPU pelo barramento de dados.'
    },
    {
      id: 'q-databus',
      concept: 'databus',
      question: 'Qual característica diferencia o barramento de dados do barramento de endereço?',
      options: [
        { text: 'O de dados é bidirecional; o de endereço leva informação em um só sentido', correct: true },
        { text: 'O de dados guarda os valores de forma permanente' },
        { text: 'O de endereço transporta os valores lidos da memória' },
        { text: 'Somente computadores de mesa têm barramento de dados' }
      ],
      explain: 'Os dados vão e voltam (leitura e escrita), por isso o data bus é bidirecional. O endereço só parte de quem controla o acesso em direção à memória.'
    },
    {
      id: 'q-largura',
      concept: 'addressbus',
      question: 'Com um barramento de endereço de 16 bits, quantas posições de memória podem ser endereçadas?',
      options: [
        { text: '65.536 (2¹⁶)', correct: true },
        { text: '16' },
        { text: '256 (2⁸)' },
        { text: '1.024 (2¹⁰)' }
      ],
      explain: 'Com n linhas de endereço existem 2ⁿ combinações, ou seja, 2ⁿ posições. Com 16 bits: 2¹⁶ = 65.536. É o mesmo raciocínio que explica por que 32 bits enxergam no máximo 4 GiB.'
    },
    {
      id: 'q-dma',
      concept: 'dma',
      question: 'Uma placa de rede precisa copiar muitos dados para a RAM sem que a CPU mova byte por byte. Qual recurso resolve isso?',
      options: [
        { text: 'DMA', correct: true },
        { text: 'Cache' },
        { text: 'Registradores' },
        { text: 'ROM' }
      ],
      explain: 'Com DMA, a CPU só configura a transferência e é avisada no final; o controlador de DMA move os dados entre o periférico e a memória.'
    },
    {
      id: 'q-flash',
      concept: 'flash',
      question: 'O que diferencia a memória Flash da EEPROM?',
      options: [
        { text: 'A Flash apaga em blocos; a EEPROM permite apagar byte a byte', correct: true },
        { text: 'A Flash é volátil e a EEPROM não' },
        { text: 'A EEPROM só pode ser gravada uma vez, na fábrica' },
        { text: 'A Flash fica dentro dos registradores da CPU' }
      ],
      explain: 'As duas são não voláteis e regraváveis eletricamente. A diferença está na granularidade: a Flash trabalha com blocos (mais densa e barata) e a EEPROM com bytes individuais.'
    },
    {
      id: 'q-rom',
      concept: 'rom',
      question: 'Um fabricante quer gravar, na produção, um programa que nunca precisará ser alterado. Qual memória atende a isso de forma mais simples?',
      options: [
        { text: 'ROM', correct: true },
        { text: 'RAM' },
        { text: 'Cache' },
        { text: 'Registradores' }
      ],
      explain: 'A ROM é não volátil e tem o conteúdo definido na fabricação. RAM, cache e registradores são voláteis: perderiam o programa ao desligar.'
    },
    {
      id: 'q-micro',
      concept: 'microcontrolador',
      question: 'Um termostato precisa de um único chip barato que já tenha processador, memória e entradas e saídas. A melhor escolha é:',
      options: [
        { text: 'Um microcontrolador', correct: true },
        { text: 'Uma CPU quad core de computador' },
        { text: 'Um módulo de memória RAM' },
        { text: 'Um pendrive com memória Flash' }
      ],
      explain: 'O microcontrolador integra processador, memórias e periféricos em um chip só — ideal para sistemas embarcados como termostatos e o Arduino.'
    },
    {
      id: 'q-nucleos',
      concept: 'quadcore',
      question: 'Comparado a um dual core de mesma arquitetura e mesmo clock, um quad core tende a:',
      options: [
        { text: 'Executar mais tarefas em paralelo, se o software usar vários núcleos', correct: true },
        { text: 'Ser sempre exatamente duas vezes mais rápido em qualquer programa' },
        { text: 'Ter o dobro de memória RAM instalada' },
        { text: 'Dispensar o uso de memória cache' }
      ],
      explain: 'Quatro núcleos permitem mais execução simultânea, mas o ganho depende de o programa dividir o trabalho. Um programa com uma única tarefa usa só um núcleo.'
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
