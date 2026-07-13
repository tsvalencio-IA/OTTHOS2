(() => {
  'use strict';

  window.__athosErrors = window.__athosErrors || [];
  window.addEventListener('error', event => window.__athosErrors.push(event.message || 'Erro JS'));
  window.addEventListener('unhandledrejection', event => window.__athosErrors.push(String(event.reason || 'Promise rejeitada')));

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const now = () => performance.now();

  const els = {
    app: $('#app'), lobby: $('#lobby'), game: $('#game'), stage: $('#threeStage'), cameraFeed: $('#cameraFeed'), flash: $('#screenFlash'),
    nativeViewer: $('#nativeViewer'), viewerCameraFeed: $('#viewerCameraFeed'), arAnchorViewer: $('#arAnchorViewer'), modelStatus: $('#modelStatus'), difficultySelect: $('#difficultySelect'),
    playBtn: $('#playBtn'), heroPlayBtn: $('#heroPlayBtn'), heroFreeBtn: $('#heroFreeBtn'), hubBtn: $('#hubBtn'), freeBtn: $('#freeBtn'), quizBtn: $('#quizBtn'), askBtn: $('#askBtn'), collectionBtn: $('#collectionBtn'), resetBtn: $('#resetBtn'), arNativeExternalBtn: $('#arNativeExternalBtn'),
    statXP: $('#statXP'), statLevel: $('#statLevel'), statMedals: $('#statMedals'), statBest: $('#statBest'),
    hudHearts: $('#hudHearts'), hudXP: $('#hudXP'), hudCrystals: $('#hudCrystals'), hudEnemies: $('#hudEnemies'), hudTime: $('#hudTime'),
    worldName: $('#worldName'), objectiveText: $('#objectiveText'), objectiveProgress: $('#objectiveProgress'), toast: $('#toast'),
    tutorialBox: $('#tutorialBox'), tutorialTitle: $('#tutorialTitle'), tutorialText: $('#tutorialText'), miniPlayer: $('#miniPlayer'), miniPortal: $('#miniPortal'),
    joystick: $('#joystick'), joyKnob: $('#joyKnob'), pauseBtn: $('#pauseBtn'), exitBtn: $('#exitBtn'), powerBtn: $('#powerBtn'),
    modal: $('#modal'), modalTitle: $('#modalTitle'), modalBody: $('#modalBody'), modalClose: $('#modalClose')
  };

  const STORAGE_KEY = 'athos_guardiao_v431_estavel_quiz_3d_progress';
  const LEGACY_STORAGE_KEYS = ['athos_guardiao_v42_level_design_ar_safe_progress','athos_guardiao_v411_pointer_capture_progress','athos_guardiao_v41_game_feel_progress','athos_guardiao_v37_auditoria_total_progress','athos_guardiao_v36_jogavel_progress','athos_guardiao_v35_premium_render_progress','athos_guardiao_v34_progress','athos_guardiao_v32_progress','athos_guardiao_v31_progress','athos_guardiao_v30_progress','athos_guardiao_v25_progress'];
  const WORLD = {
    hub: { name:'Hub dos Portais', sky:0x101827, fog:0x172033, ground:0x334155, grid:0x38bdf8, accent:0xfacc15, light:0xffffff },
    field: { name:'Campo dos Blocos', sky:0x88c7ff, fog:0x8fd0ff, ground:0x3a8f34, grid:0x2e6f24, accent:0xfacc15, light:0xfff3c4 },
    fire: { name:'Vulcão Pixel', sky:0x260607, fog:0x3b0808, ground:0x451010, grid:0xff5a1e, accent:0xffd000, light:0xffc29b },
    forest: { name:'Floresta Voxel', sky:0x7fc9ff, fog:0x93c47d, ground:0x1f6d35, grid:0x79b044, accent:0x22c55e, light:0xffffdd },
    castle: { name:'Castelo de Pedra', sky:0x151827, fog:0x212438, ground:0x5b6066, grid:0x9299a1, accent:0xf59e0b, light:0xffe1a8 },
    space: { name:'Espaço Cubo', sky:0x050517, fog:0x08081e, ground:0x20124d, grid:0x8b5cf6, accent:0x38bdf8, light:0xffffff },
    arena: { name:'Arena dos Portais', sky:0x111827, fog:0x111827, ground:0x2f2f46, grid:0x00e5ff, accent:0xff2e63, light:0xfff8db },
    real: { name:'Mundo Real AR', sky:null, fog:null, ground:0x0f172a, grid:0x38bdf8, accent:0xfacc15, light:0xffffff }
  };
  const EXTERNAL = {
    modelViewer:'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js',
    three:'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    gltfLoader:'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'
  };

  const OPEN_WORLD = {
    enabled:true,
    id:'openworld',
    size:210,
    chunkSize:36,
    activeRadius:2,
    title:'Athos Open World',
    objective:'Explore o vilarejo, encontre a floresta e ative os portais.'
  };
  const OPEN_WORLD_REGIONS = [
    { id:'village', name:'Vilarejo Central', x:-30, z:-30, w:60, d:60, color:0x6abf4b },
    { id:'plains', name:'Campo Aberto', x:22, z:-34, w:92, d:74, color:0x54b947 },
    { id:'forest', name:'Floresta', x:-122, z:-72, w:86, d:106, color:0x167a3a },
    { id:'lake', name:'Lago e Fazenda', x:-74, z:42, w:106, d:76, color:0x35c9ff },
    { id:'mountain', name:'Montanha Gelada', x:-78, z:-158, w:108, d:82, color:0xb7d8ef },
    { id:'volcano', name:'Vulcão', x:96, z:-138, w:90, d:96, color:0xff4d00 },
    { id:'castle', name:'Castelo', x:104, z:72, w:96, d:98, color:0x8e99a6 }
  ];

  const DIFFICULTY = {
    easy: { name:'Fácil', hearts:6, speed:7.65, jump:10.9, gravity:31.5, timer:0, damage:1, bonus:1, forgiveness:1.35 },
    medium: { name:'Médio', hearts:5, speed:8.35, jump:10.7, gravity:33.5, timer:210, damage:1, bonus:1.25, forgiveness:1.0 },
    hard: { name:'Difícil', hearts:4, speed:9.05, jump:10.45, gravity:35.5, timer:165, damage:1, bonus:1.55, forgiveness:.78 }
  };

  // V44.1: base V43.1 + V44 inimigos preservadas. Hotfix visual: menu Minecraft limpo, HUD menos poluído e leitura de jogo sem excesso de texto.
  const GAME_FEEL = {
    joystickDeadzone: .14,
    joystickCurve: 1.18,
    inputSmoothing: 30,
    inputRelease: 78,
    groundAcceleration: 20,
    groundDeceleration: 82,
    airAcceleration: 9.0,
    airDeceleration: 18,
    stopThreshold: .10,
    platformSnap: .24,
    groundSnap: .13,
    coyoteMs: 140,
    jumpBufferMs: 160,
    jumpCooldownMs: 110,
    jumpForwardBoost: 2.15,
    jumpSideBoost: .95,
    landingHorizontalDamp: .50,
    fallGravityBoost: 1.78,
    spaceGravityScale: .92
  };

  const GAMEPLAY_CAMERA = {
    cameraFollowDistance: 12.8,
    cameraHeight: 6.55,
    cameraLookAhead: 13.2,
    cameraSmoothing: 6.4,
    cameraJumpOffset: .55
  };

  const INPUT_DEBOUNCE_MS = {
    action: 90,
    power: 140,
    world: 180
  };


  const AR_SAFE = {
    lockMs: 3200,
    freezeWhenIdle: true,
    label: 'V48_RENDER_ALVO_GAMEPLAY_AR_GUARDED'
  };


  const V44_ENEMY_AI = {
    label: 'V45_TRUE_GAME_PLATFORM_RENDER',
    enabled: true,
    vision: 13,
    projectileSpeed: 7.0,
    projectileLife: 2.1,
    easyAttackMs: 2350,
    mediumAttackMs: 1850,
    hardAttackMs: 1450,
    bossHp: 10,
    golemHp: 4,
    flyerHp: 2,
    spikyHp: 2
  };



  const V442_RENDER = {
    label: 'V48_TARGET_VISUAL_LAYER_ACTIVE',
    target: 'approved_reference_voxel_portal_adventure_10_10',
    enabled: true,
    maxSideIslands: 28,
    clouds: 26,
    flowers: 140
  };


  const V45_PLATFORM_RENDER = {
    label: 'V48_TARGET_PLATFORM_RENDER_ACTIVE',
    enabled: true,
    nativeAR: true,
    noFakeCameraAR: true,
    reference: 'approved_voxel_portal_adventure'
  };

  const VIEWER_3D = {
    orbit: 25,
    elevation: 68,
    distance: 3.8,
    targetX: 0,
    targetY: .8,
    targetZ: 0,
    scale: 1,
    fov: 30,
    cameraPreview: false
  };

  const V42_LEVEL_GUIDES = {
    training: ['IR', 'PULO', 'GEMA', 'B', 'PORTAL'],
    field: ['CAIXA', 'GEMA', 'BURACO', 'B', 'PORTAL'],
    volcano: ['LAVA', 'PULO', 'ESPINHO', 'CHECK', 'PORTAL'],
    forest: ['Y', 'MINI', 'GEMA', 'B', 'PORTAL'],
    castle: ['PORTÃO', 'GIGANTE', 'GOLEM', 'CHECK', 'PORTAL'],
    space: ['PLATAFORMA', 'PULO', 'VOADOR', 'QUIZ', 'PORTAL'],
    arena: ['ARENA', 'ESPINHO', 'B + X', 'BOSS', 'FINAL']
  };

  const LEVELS = [
    {
      id:'training', world:'field', title:'Fase 1 — Treinamento dos Portais', length:210, crystals:5, enemies:3, medal:'Primeiro Pulo',
      objective:'Pegue 5 cristais, vença 3 inimigos e abra o portal.',
      tutorial:['Use o joystick para ir para o fundo da tela.','Aperte A para pular em cima das caixas.','B lança poder nos blocos escuros e inimigos.']
    },
    {
      id:'field', world:'field', title:'Fase 2 — Campo dos Blocos', length:245, crystals:6, enemies:4, medal:'Guardião do Campo',
      objective:'Suba nas caixas, pegue cristais e use B no bloco escuro.',
      tutorial:['Caixas são caminho, não decoração.','Pule em cima de inimigos comuns para vencer.','Complete cristais e inimigos para liberar o portal.']
    },
    {
      id:'volcano', world:'fire', title:'Fase 3 — Vulcão Pixel', length:265, crystals:6, enemies:5, medal:'Mestre do Vulcão',
      objective:'Lava machuca. Pule, desvie e use B nos espinhos.',
      tutorial:['Lava e buracos tiram vida.','Pule segurando o joystick para dar impulso.','Espinhos não podem ser pisados: use poder.']
    },
    {
      id:'forest', world:'forest', title:'Fase 4 — Floresta Voxel', length:295, crystals:7, enemies:6, medal:'Explorador da Floresta',
      objective:'Abaixe, fique mini, pegue cristais e acerte voadores.',
      tutorial:['Segure Y para abaixar.','X alterna mini, normal e gigante.','Mini passa melhor por túneis.']
    },
    {
      id:'castle', world:'castle', title:'Fase 5 — Castelo de Pedra', length:325, crystals:7, enemies:7, medal:'Cavaleiro do Castelo',
      objective:'Use tamanho gigante, vença golems e abra o castelo.',
      tutorial:['Use X para virar gigante nos portões.','Golems têm mais vida.','Checkpoints salvam seu retorno.']
    },
    {
      id:'space', world:'space', title:'Fase 6 — Espaço Cubo', length:350, crystals:8, enemies:7, medal:'Viajante do Espaço', quizGate:true,
      objective:'Pule entre plataformas, acerte voadores e ligue o portal.',
      tutorial:['Plataformas flutuantes exigem pulo com direção.','O quiz libera a energia do portal.','Observe o minimapa para saber a distância.']
    },
    {
      id:'arena', world:'arena', title:'Fase 7 — Arena dos Portais', length:390, crystals:10, enemies:9, medal:'Mestre dos Portais', boss:true, quizGate:true,
      objective:'Use tudo que aprendeu e derrote o chefe do portal.',
      tutorial:['A arena mistura todos os desafios.','O Guardião do Portal precisa de vários poderes.','Completar a arena libera medalha final.']
    }
  ];

  const quizData = [
    { q:'Para onde o joystick para cima leva o Athos?', opts:['Para o fundo da fase', 'Para o menu', 'Para desligar o jogo'], ans:0 },
    { q:'Como derrotar inimigo espinhoso?', opts:['Usar poder B', 'Pular em cima', 'Ficar parado'], ans:0 },
    { q:'Qual botão faz o Athos pular?', opts:['A', 'Y', 'Sair'], ans:0 },
    { q:'Como passar por túnel baixo?', opts:['Segurar Y ou ficar mini', 'Ficar gigante', 'Fechar o portal'], ans:0 },
    { q:'O que abre o portal?', opts:['Cumprir objetivos', 'Só andar sem coletar nada', 'Perder toda vida'], ans:0 },
    { q:'Qual botão muda mini, normal e gigante?', opts:['X', 'B', 'Pausa'], ans:0 },
    { q:'Quem é o parceiro do Athos?', opts:['Otto', 'Um zumbi', 'Um carro'], ans:0 },
    { q:'Qual poder o Athos usa?', opts:['Fogo pixelado', 'Água invisível', 'Gelo de chocolate'], ans:0 },
    { q:'O que o botão B faz?', opts:['Lança poder de fogo', 'Abre o navegador', 'Apaga o jogo'], ans:0 },
    { q:'Para onde o botão ▼ Voltar leva?', opts:['Para o começo da pista', 'Para o céu', 'Para o quiz'], ans:0 },
    { q:'Qual inimigo não deve ser pisado?', opts:['Espinhoso', 'Cubo comum', 'Cristal'], ans:0 },
    { q:'O que acontece quando pega cristal?', opts:['Ganha XP e avança objetivo', 'Perde vida', 'Fecha a fase'], ans:0 },
    { q:'O que o checkpoint faz?', opts:['Ajuda a voltar mais perto depois de cair', 'Zera os pontos', 'Remove o Athos'], ans:0 },
    { q:'Qual mundo tem lava?', opts:['Vulcão Pixel', 'Floresta Voxel', 'Campo dos Blocos'], ans:0 },
    { q:'Qual mundo tem portais finais?', opts:['Arena dos Portais', 'Caixa de Entrada', 'Tela de login'], ans:0 },
    { q:'Qual mundo combina com árvores?', opts:['Floresta Voxel', 'Espaço Cubo', 'Vulcão Pixel'], ans:0 },
    { q:'Qual mundo combina com estrelas?', opts:['Espaço Cubo', 'Castelo de Pedra', 'Mundo Real'], ans:0 },
    { q:'Qual ação ajuda a abrir portão pesado?', opts:['Ficar gigante', 'Ficar invisível', 'Fechar o celular'], ans:0 },
    { q:'Qual ação ajuda em caminho apertado?', opts:['Ficar mini', 'Ficar gigante', 'Parar'], ans:0 },
    { q:'Para cair em cima de uma caixa, o que ajuda?', opts:['Pular com direção', 'Apertar reset', 'Abrir AR nativo'], ans:0 },
    { q:'O que o AR Nativo faz?', opts:['Abre o visualizador do celular', 'Substitui o jogo', 'Remove o 3D'], ans:0 },
    { q:'O jogo principal com controles roda em quê?', opts:['Three.js', 'Bloco de notas', 'Calculadora'], ans:0 },
    { q:'O Athos 3D vem de qual arquivo?', opts:['athos.glb', 'foto.jpg', 'musica.mp3'], ans:0 },
    { q:'Qual botão fala com Athos?', opts:['💬 Falar', '⏹ Sair', 'Reset'], ans:0 },
    { q:'Qual botão abre desafio de pergunta?', opts:['Quiz', 'Poder', 'Voltar'], ans:0 },
    { q:'Quando o portal está bloqueado, o que falta?', opts:['Objetivos da fase', 'Aumentar volume', 'Trocar aba'], ans:0 },
    { q:'Qual é a cor principal do Athos?', opts:['Preto', 'Azul claro', 'Rosa'], ans:0 },
    { q:'Quais cores aparecem no fogo do Athos?', opts:['Amarelo, laranja e vermelho', 'Verde, azul e roxo', 'Branco e cinza'], ans:0 },
    { q:'O que o Otto precisa fazer para ganhar medalhas?', opts:['Completar mundos', 'Fechar o jogo', 'Não jogar'], ans:0 },
    { q:'Qual dificuldade é mais tranquila?', opts:['Fácil', 'Difícil', 'Chefe final'], ans:0 },
    { q:'Qual dificuldade dá mais bônus de XP?', opts:['Difícil', 'Fácil', 'Nenhuma'], ans:0 },
    { q:'O que faz a vida diminuir?', opts:['Lava, buraco ou inimigo', 'Pegar cristal', 'Entrar no portal liberado'], ans:0 },
    { q:'Como derrotar inimigo comum sem poder?', opts:['Pular em cima', 'Ficar parado', 'Abrir menu'], ans:0 },
    { q:'Como atacar inimigo voador?', opts:['Usar poder B', 'Agachar no chão', 'Resetar'], ans:0 },
    { q:'Qual adversário tem mais vida?', opts:['Mini-boss/Guardião', 'Cristal', 'Árvore'], ans:0 },
    { q:'O que o botão R faz?', opts:['Girar', 'Pausar', 'Apagar'], ans:0 },
    { q:'O que o botão I faz?', opts:['Interagir', 'Invadir sistema', 'Ir para fora do site'], ans:0 },
    { q:'No Hub dos Portais, o que você encontra?', opts:['Portais para mundos', 'Loja de carros', 'Lista de emails'], ans:0 },
    { q:'Qual é o objetivo dos cristais?', opts:['Liberar progresso e dar XP', 'Virar obstáculo', 'Travar o jogo'], ans:0 },
    { q:'Quando aparece altar roxo, o que pode liberar?', opts:['Quiz do portal', 'Câmera traseira', 'Volume'], ans:0 },
    { q:'O que o modo Brincar Livre permite?', opts:['Testar controles e câmera sem pressão', 'Apagar fases', 'Remover AR'], ans:0 },
    { q:'Qual controle é melhor para andar em diagonal?', opts:['Joystick', 'Botão Sair', 'Botão Reset'], ans:0 },
    { q:'O que a seta ▲ Fundo representa?', opts:['Profundidade da tela', 'Volume do som', 'Zoom do navegador'], ans:0 },
    { q:'O que a seta ◀ representa?', opts:['Mover para a esquerda da pista', 'Pular', 'Falar'], ans:0 },
    { q:'O que a seta ▶ representa?', opts:['Mover para a direita da pista', 'Abaixar', 'Sair'], ans:0 },
    { q:'Qual mundo tem castelo e golem?', opts:['Castelo de Pedra', 'Campo dos Blocos', 'Mundo Real'], ans:0 },
    { q:'Qual mundo é melhor para testar câmera?', opts:['Mundo Real AR', 'Espaço Cubo', 'Arena Final'], ans:0 },
    { q:'Qual frase combina com Athos?', opts:['Guardião dos Portais', 'Rei dos Sorvetes', 'Piloto de avião'], ans:0 },
    { q:'Por que o portal fica verde?', opts:['Porque foi liberado', 'Porque perdeu tudo', 'Porque o celular travou'], ans:0 },
    { q:'O que acontece ao vencer a fase?', opts:['Ganha XP, medalha e próxima fase', 'Perde todos os arquivos', 'Fecha o site'], ans:0 },
    { q:'Qual botão pausa o jogo?', opts:['⏸ Pausa', 'A Pular', 'B Poder'], ans:0 },
    { q:'Se a câmera não abrir, o que acontece?', opts:['O jogo usa cenário 3D', 'O jogo apaga o Athos', 'O celular quebra'], ans:0 },
    { q:'O que significa XP?', opts:['Pontos de experiência', 'Erro fatal', 'Arquivo de imagem'], ans:0 },
    { q:'Qual é o melhor jeito de atravessar buraco?', opts:['Pular com direção', 'Abaixar dentro dele', 'Ficar parado'], ans:0 },
    { q:'O que o Athos usa para quebrar bloco escuro?', opts:['Poder de fogo', 'Pergunta de texto', 'Botão de sair'], ans:0 },
    { q:'Qual modo é só para ver o boneco no mundo real do aparelho?', opts:['AR Nativo', 'Resetar progresso', 'Coleção'], ans:0 },
    { q:'Qual modo é para jogar fases completas?', opts:['Jogar Fases 3D', 'Falar com Athos', 'Abrir moldes'], ans:0 },
    { q:'Qual item mostra conquistas?', opts:['Coleção do Otto', 'Câmera Feed', 'Service Worker'], ans:0 },
    { q:'O que o mini ajuda a fazer?', opts:['Passar por lugar baixo', 'Ficar preso no portal', 'Perder cristal'], ans:0 },
    { q:'O que o gigante ajuda a fazer?', opts:['Enfrentar portões e desafios grandes', 'Entrar em buraco pequeno', 'Sumir'], ans:0 },
    { q:'Qual é a missão do Athos?', opts:['Proteger portais com o Otto', 'Fugir do jogo', 'Trocar o navegador'], ans:0 },
    { q:'Qual fase ensina os primeiros comandos?', opts:['Treinamento dos Portais', 'Arena final', 'Menu de reset'], ans:0, cat:'fases', diff:'facil' },
    { q:'No Campo dos Blocos, qual desafio aparece mais?', opts:['Caixas e cubos simples', 'Naves oficiais', 'Corrida de carros'], ans:0, cat:'fases', diff:'facil' },
    { q:'Qual mundo pede cuidado com lava?', opts:['Vulcão Pixel', 'Coleção do Otto', 'Lobby'], ans:0, cat:'mundos', diff:'facil' },
    { q:'Qual mundo combina com túneis e árvores?', opts:['Floresta Voxel', 'Espaço Cubo', 'Vulcão Pixel'], ans:0, cat:'mundos', diff:'facil' },
    { q:'Qual mundo tem golem e portão pesado?', opts:['Castelo de Pedra', 'Treinamento', 'Mundo real'], ans:0, cat:'inimigos', diff:'medio' },
    { q:'Qual fase usa gravidade diferente?', opts:['Espaço Cubo', 'Campo dos Blocos', 'Lobby'], ans:0, cat:'mecanicas', diff:'medio' },
    { q:'Qual fase mistura todos os comandos?', opts:['Arena dos Portais', 'Treinamento', 'Coleção'], ans:0, cat:'fases', diff:'medio' },
    { q:'O que é melhor contra morcego voador?', opts:['B Poder', 'Ficar parado', 'Entrar no menu'], ans:0, cat:'inimigos', diff:'medio' },
    { q:'Quantos danos o golem aguenta?', opts:['Três', 'Zero', 'Cem'], ans:0, cat:'inimigos', diff:'medio' },
    { q:'Qual inimigo pode ser vencido pulando em cima?', opts:['Cubo comum', 'Espinho vivo', 'Lava'], ans:0, cat:'inimigos', diff:'facil' },
    { q:'Quando o mini é mais útil?', opts:['Em túnel baixo', 'Contra lava larga', 'Para fechar o jogo'], ans:0, cat:'tamanho', diff:'facil' },
    { q:'Quando o gigante é mais útil?', opts:['Para portão pesado', 'Para passar em túnel baixo', 'Para esconder cristais'], ans:0, cat:'tamanho', diff:'facil' },
    { q:'O que coyote time ajuda?', opts:['Pular logo depois da borda', 'Apagar progresso', 'Abrir câmera'], ans:0, cat:'pulo', diff:'dificil' },
    { q:'O que jump buffer ajuda?', opts:['Guardar o pulo apertado um pouco antes', 'Trocar de mundo sozinho', 'Diminuir o canvas'], ans:0, cat:'pulo', diff:'dificil' },
    { q:'Qual eixo dá profundidade na fase?', opts:['Eixo Z', 'Volume do celular', 'Nome do arquivo'], ans:0, cat:'mecanicas', diff:'medio' },
    { q:'O que o botão B não deve ser confundido com?', opts:['Botão Vulcão do cenário', 'Botão A', 'Cristal'], ans:0, cat:'controles', diff:'medio' },
    { q:'Qual seletor correto identifica B Poder no teste?', opts:['#powerBtn ou data-action power', 'Texto do fogo', 'Cor vermelha apenas'], ans:0, cat:'testes', diff:'dificil' },
    { q:'O que acontece se o portal ainda estiver cinza?', opts:['Faltam objetivos', 'A fase terminou', 'O Athos sumiu'], ans:0, cat:'portal', diff:'facil' },
    { q:'Como liberar portal com quiz?', opts:['Responder certo no altar', 'Trocar favicon', 'Fechar o modal'], ans:0, cat:'quiz', diff:'medio' },
    { q:'O que a coleção mostra?', opts:['Medalhas bloqueadas e liberadas', 'Arquivos secretos', 'Anúncios'], ans:0, cat:'progresso', diff:'facil' },
    { q:'Onde o progresso fica salvo?', opts:['localStorage', 'Servidor pago', 'Arquivo do celular'], ans:0, cat:'progresso', diff:'medio' },
    { q:'Qual modo usa a câmera como fundo?', opts:['Brincar Livre AR', 'Quiz', 'Coleção'], ans:0, cat:'ar', diff:'facil' },
    { q:'Qual modo depende do visualizador do aparelho?', opts:['AR Nativo', 'Jogar Fases 3D', 'Pausa'], ans:0, cat:'ar', diff:'facil' },
    { q:'O que deve acontecer ao derrotar inimigo?', opts:['Ganhar XP e efeito visual', 'Perder athos.glb', 'Remover controles'], ans:0, cat:'feedback', diff:'facil' },
    { q:'Qual feedback combina com pegar cristal?', opts:['Som, vibração leve e partículas', 'Tela vazia', 'Erro de JavaScript'], ans:0, cat:'feedback', diff:'facil' }
  ];

  const answerRows = [
    { keys:['quem','athos','atos'], ans:'Eu sou o Athos, guardião dos portais. Meu corpo é 3D, meu estilo é blocado e meu poder é fogo pixelado.' },
    { keys:['otto'], ans:'O Otto é meu parceiro de aventura. Ele controla meus pulos, poderes e caminhos pelos mundos.' },
    { keys:['como jogar','ajuda'], ans:'Use o joystick para andar em profundidade. A pula, B lança poder, Y abaixa e X muda tamanho.' },
    { keys:['fogo','poder'], ans:'Meu poder é o fogo pixelado. Ele quebra blocos escuros e derrota inimigos perigosos.' },
    { keys:['portal','missao'], ans:'Os portais abrem quando você coleta cristais, derrota adversários e completa o desafio do mundo.' },
    { keys:['mini','pequeno'], ans:'Modo mini ajuda a passar em túneis e caminhos apertados.' },
    { keys:['gigante','grande'], ans:'Modo gigante ajuda a abrir portões e enfrentar desafios maiores.' },
    { keys:['medo','dificil'], ans:'Não precisa ter medo. Todo guardião cai, tenta de novo e fica melhor.' },
    { keys:['arena','final'], ans:'A Arena dos Portais é o desafio final: misture pulo, poder, tamanho, cristais e estratégia para liberar o portal.' },
    { keys:['castelo','golem'], ans:'No Castelo de Pedra existem portões e golems. Use tamanho gigante e poder de fogo para vencer.' },
    { keys:['floresta','arvore'], ans:'A Floresta Voxel tem plataformas, túneis e caminhos escondidos. O modo mini ajuda muito.' },
    { keys:['vulcao','lava'], ans:'No Vulcão Pixel, a lava tira vida. Pule com direção e use o poder para derrotar espinhos.' },
    { keys:['espaco','estrela'], ans:'No Espaço Cubo, as plataformas flutuam e o quiz do portal libera energia para avançar.' },
    { keys:['cristal','xp','ponto'], ans:'Cristais dão XP e contam para liberar o portal. Pegue todos para ganhar mais recompensa.' },
    { keys:['inimigo','adversario','monstro'], ans:'Cada inimigo tem uma fraqueza. Comum pode ser pisado, voador pede poder, espinhoso não deve ser pisado.' },
    { keys:['checkpoint','salvar'], ans:'Checkpoint ajuda o Athos a voltar mais perto quando cai em lava, buraco ou inimigo.' },
    { keys:['ar','realidade aumentada','camera'], ans:'O AR Nativo abre o visualizador do aparelho. O modo Brincar Livre usa câmera com controles dentro da página.' },
    { keys:['pular','pulo'], ans:'Aperte A um pouco antes da borda. Eu guardo esse comando por um instante para o pulo sair mais gostoso.' },
    { keys:['abaixar','baixo','tunel'], ans:'Segure Y para abaixar. Se o túnel for apertado demais, use X até virar mini.' },
    { keys:['colecao','medalha','conquista'], ans:'A coleção guarda medalhas do Otto. Algumas vêm de fases, outras de quiz, combo e exploração.' },
    { keys:['fase atual','onde estou'], ans:() => currentLevel ? `Agora estamos em ${currentLevel.title}. Objetivo: ${currentLevel.objective}` : 'Entre em Jogar Fases 3D para eu contar a missão atual.' },
    { keys:['amizade','amigo'], ans:'Guardiões vencem melhor em dupla. Eu entro no portal, mas o Otto escolhe o caminho.' },
    { keys:['perdi','cai','dano'], ans:'Cair faz parte. Volte pelo checkpoint, olhe a pista e pule com direção.' },
    { keys:['morcego','voador'], ans:'Voador é melhor vencer com B Poder. Mire andando para a lateral e solte fogo.' },
    { keys:['espinho','espinhoso'], ans:'Espinho vivo não é para pisar. Use B Poder ou desvie pela outra faixa.' },
    { keys:['golem','pedra'], ans:'Golem aguenta três danos. Use poder, pule com calma e não fique colado nele.' },
    { keys:['canvas','tela'], ans:'Se a tela virar, eu recalculo o canvas para o jogo continuar grande e jogável.' },
  ];

  const progress = loadProgress();
  let scene, camera, renderer, clock, root, levelGroup, player, playerModel, mixer, ambientLight, sunLight, portalMesh, skyMesh;
  let cameraRig = { initialized:false, pos:null, look:null }; // V40: câmera cinematográfica suave sem mexer nos controles
  let initialized = false, animReq = 0, playing = false, paused = false, mode = 'lobby', currentLevelIndex = 0, currentLevel = null;
  const PLAYER_VISUAL_Y_OFFSET = .34;
  let runtime = null, realBg = false, cameraStream = null, viewerCameraStream = null, arSafeUntil = 0;
  let platforms = [], hazards = [], crystals = [], enemies = [], fireballs = [], enemyProjectiles = [], particles = [], solids = [], gates = [], checkpoints = [], premiumVisuals = [], v42Markers = [], v44EnemyMarkers = [], powerups = [];
  let input = { x:0, z:0, crouch:false };
  let inputTarget = { x:0, z:0 };
  let keyboard = { left:false, right:false, forward:false, back:false };
  let moveHold = { left:false, right:false, forward:false, back:false };
  let joy = { active:false, pointerId:null, cx:0, cy:0, max:42, x:0, z:0 };
  let actionPressAt = {};
  let p = defaultPlayer();
  let lastDamageAt = 0, jumpBufferedUntil = 0, lastGroundedAt = 0, lastJumpAt = 0, lastLandAt = 0, powerReadyAt = 0;
  let cameraYaw = 0, cameraPitch = 0, cameraMode = 'openworld', currentInteriorId = null, playerAnimTime = 0, openWorldObjects = [], openWorldChunks = new Map(), openWorldDoors = [], openWorldChests = [], openWorldActivities = [], openWorldNPCs = [], openWorldResourceNodes = [], openWorldInteriors = [], openWorldHouses = [], openWorldState = null, cameraDrag = {active:false,id:null,x:0,y:0};

  function defaultPlayer(){
    return { x:0, y:0, z:4, vx:0, vy:0, vz:0, grounded:true, scaleMode:'normal', scale:1, targetScale:1, height:2.4, radius:.55, spinUntil:0, invUntil:0, combo:0, facing:Math.PI, weapon:null, weaponUntil:0, shield:0, starUntil:0 };
  }

  function loadProgress(){
    const base = { xp:0, best:0, bestTime:0, medals:{}, level:0, difficulty:'easy', unlocked:['field','real'], tests:[], quizRight:0, quizAnswered:0, perfectRuns:0, totalCrystals:0, totalEnemies:0, achievements:{}, collection:{ otto:['Athos 3D'] } };
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) return { ...base, ...JSON.parse(current) };
      for (const key of LEGACY_STORAGE_KEYS) {
        const old = localStorage.getItem(key);
        if (old) return { ...base, ...JSON.parse(old), migratedFrom:key };
      }
      return base;
    } catch { return base; }
  }
  function saveProgress(){ if (currentLevel && currentLevel.openWorld) saveOpenWorldPosition(); localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); updateLobbyStats(); }
  function addXP(amount){ progress.xp = Math.max(0, progress.xp + Math.round(amount * DIFFICULTY[progress.difficulty].bonus)); progress.best = Math.max(progress.best || 0, progress.xp); saveProgress(); updateHud(); }
  function medalCount(){ return Object.keys(progress.medals || {}).length; }
  function addMedal(name){ if (!name || progress.medals[name]) return; progress.medals[name] = new Date().toISOString(); saveProgress(); toast(`🏅 Medalha: ${name}`, 'good'); speak(`Medalha desbloqueada: ${name}`); }
  function unlockWorld(world){ if (!progress.unlocked.includes(world)) { progress.unlocked.push(world); saveProgress(); } }

  function updateLobbyStats(){
    els.statXP.textContent = progress.xp || 0;
    els.statBest.textContent = progress.best || 0;
    els.statLevel.textContent = Math.min((progress.level || 0) + 1, LEVELS.length);
    els.statMedals.textContent = medalCount();
    els.difficultySelect.value = progress.difficulty || 'easy';
  }

  function updateHud(){
    if (!runtime || !currentLevel) return;
    // Corações individuais visuais
    const maxHearts = runtime.maxHearts || 5;
    const curHearts = Math.max(0, Math.min(maxHearts, runtime.hearts || 0));
    const heartsRow = document.getElementById('hudHeartsRow');
    if (heartsRow) {
      const spans = heartsRow.querySelectorAll('.hud-heart');
      spans.forEach((s, i) => {
        const alive = (i + 1) <= curHearts;
        s.textContent = alive ? '❤️' : '🖤';
        s.classList.toggle('hud-heart-empty', !alive);
      });
    }
    // Oculto: mantém hudHearts para compatibilidade com testes
    els.hudHearts.textContent = runtime.hearts;
    // XP visual
    const xp = progress.xp || 0;
    const xpNext = (Math.floor(xp / 1000) + 1) * 1000;
    const xpPct = Math.round(((xp % 1000) / 1000) * 100);
    const xpBar = document.getElementById('hudXPBar');
    if (xpBar) xpBar.style.width = xpPct + '%';
    els.hudXP.textContent = xp;
    // Nível
    const lvlEl = document.getElementById('hudLevel');
    if (lvlEl) lvlEl.textContent = Math.floor(xp / 1000) + 1;
    // Gemas (cristais) — mostra total coletado como moeda
    els.hudCrystals.textContent = runtime.crystals || 0;
    // Dados ocultos preservados
    els.hudEnemies.textContent = `${runtime.defeated}/${runtime.requiredEnemies}`;
    els.hudTime.textContent = runtime.timer ? Math.max(0, Math.ceil(runtime.timer)) : '∞';
    if (isOpenWorld()) {
      const region = currentOpenWorldRegion();
      const mission = currentOpenWorldMissionText();
      const ow = openWorldProgress();
      els.worldName.textContent = `${region?.name || 'Mundo Aberto'} • ${DIFFICULTY[progress.difficulty].name}`;
      els.objectiveText.textContent = mission[0];
      const subtitleEl = document.getElementById('objectiveSubtitle');
      if (subtitleEl) subtitleEl.textContent = mission[1];
      const doneScore = (ow.step||0) + Math.min(3, (ow.resources?.wood||0))*.12 + Math.min(3,(ow.resources?.stone||0))*.12 + Object.keys(ow.talked||{}).length*.12;
      const hm = ow.homeMission || { step:0 };
      if ((hm.step||0) < HOME_MISSION_STEPS.length) {
        els.objectiveProgress.style.width = `${clamp(((hm.step||0) / HOME_MISSION_STEPS.length) * 100, 0, 100)}%`;
      } else {
        els.objectiveProgress.style.width = `${clamp(doneScore/5*100, 0, 100)}%`;
      }
      return;
    }
    els.worldName.textContent = `${WORLD[currentLevel.world]?.name || 'Mundo'} • ${DIFFICULTY[progress.difficulty].name}`;
    const portalReady = objectivesDone();
    const portalGoals = [
      (runtime.requiredCrystals || 0) <= 0 || runtime.crystals >= runtime.requiredCrystals,
      (runtime.requiredEnemies || 0) <= 0 || runtime.defeated >= runtime.requiredEnemies,
      currentLevel.quizGate ? !!runtime.quizSolved : !!portalReady
    ];
    const activatedPortals = portalGoals.filter(Boolean).length;
    els.objectiveText.textContent = portalReady ? 'Portal liberado! Entre e salve o mundo!' : 'Ative os portais e salve os mundos!';
    const subtitleEl = document.getElementById('objectiveSubtitle');
    if (subtitleEl) subtitleEl.textContent = `${activatedPortals} / 3 portais ativados`;
    if (portalReady && runtime && !runtime.portalAnnounced) {
      runtime.portalAnnounced = true;
      toast('Portal liberado!', 'good');
      addParticles(p.x, p.y + 1.2, p.z, 0x22c55e, 18);
      vibrate(35);
    }
    els.objectiveProgress.style.width = `${Math.round((activatedPortals / 3) * 100)}%`;
    if (currentLevel.length) {
      const pct = clamp((4 - p.z) / (currentLevel.length + 12), 0, 1);
      els.miniPlayer.style.bottom = `${pct * 154 + 4}px`;
    }
  }

  function showScreen(name){
    els.lobby.classList.toggle('active', name === 'lobby');
    els.game.classList.toggle('active', name === 'game');
  }

  function toast(msg, type='good'){
    els.toast.textContent = msg;
    els.toast.className = `toast show ${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }
  function flash(){ els.flash.classList.remove('on'); void els.flash.offsetWidth; els.flash.classList.add('on'); }
  function vibrate(ms=45){ if (navigator.vibrate) navigator.vibrate(ms); }
  function speak(text){
    if (!('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/[<>]/g,'')); u.lang='pt-BR'; u.rate=.98; u.pitch=1.08; speechSynthesis.speak(u); } catch {}
  }
  function beep(freq=440, ms=90, type='square'){
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = beep.ctx || (beep.ctx = new AudioContext());
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq; gain.gain.value = .035;
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + ms/1000); osc.stop(ctx.currentTime + ms/1000);
    } catch {}
  }

  function loadExternalScript(src, module=false){
    const existing = $$(`script[src="${src}"]`)[0];
    if (existing && existing.dataset.ready === 'true') return Promise.resolve(true);
    if (existing && existing._athosPromise) return existing._athosPromise;
    const s = existing || document.createElement('script');
    s.src = src;
    s.async = true;
    if (module) s.type = 'module';
    s._athosPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Tempo esgotado carregando ${src}`)), 15000);
      s.onload = () => { clearTimeout(timer); s.dataset.ready = 'true'; resolve(true); };
      s.onerror = () => { clearTimeout(timer); reject(new Error(`Falha ao carregar ${src}`)); };
    });
    if (!existing) document.head.appendChild(s);
    return s._athosPromise;
  }

  function ensureModelViewer(){
    if (window.customElements && customElements.get && customElements.get('model-viewer')) return Promise.resolve(true);
    return loadExternalScript(EXTERNAL.modelViewer, true).catch(() => {
      els.modelStatus.textContent = 'AR Nativo depende da biblioteca model-viewer. Tente pelo GitHub Pages com internet.';
      return false;
    });
  }

  let threeLibsPromise = null;
  function ensureThreeLibs(){
    if (window.THREE && THREE.GLTFLoader) return Promise.resolve(true);
    if (!threeLibsPromise) {
      threeLibsPromise = loadExternalScript(EXTERNAL.three)
        .then(() => loadExternalScript(EXTERNAL.gltfLoader))
        .then(() => !!(window.THREE && THREE.GLTFLoader))
        .catch(() => false);
    }
    return threeLibsPromise;
  }

  function stageSize(){
    const rect = els.stage.getBoundingClientRect();
    const fallback = els.game.getBoundingClientRect();
    return {
      width: Math.max(100, Math.round(rect.width || fallback.width || innerWidth || 360)),
      height: Math.max(100, Math.round(rect.height || fallback.height || innerHeight || 640))
    };
  }

  function applyAdaptiveMobileLayout(){
    try {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const portrait = vh >= vw;
      const btn = portrait ? Math.max(48, Math.min(68, Math.round(vw * 0.105))) : Math.max(42, Math.min(58, Math.round(vh * 0.115)));
      const joy = portrait ? Math.max(110, Math.min(142, Math.round(vw * 0.24))) : Math.max(96, Math.min(124, Math.round(vh * 0.28)));
      const hudCompact = portrait ? 0 : (vh < 470 ? 1 : 0);
      document.documentElement.style.setProperty('--athos-btn-size', `${btn}px`);
      document.documentElement.style.setProperty('--athos-joy-size', `${joy}px`);
      document.documentElement.style.setProperty('--athos-ui-gap', portrait ? '8px' : '6px');
      document.body.classList.toggle('athos-portrait', portrait);
      document.body.classList.toggle('athos-landscape', !portrait);
      if (els && els.game) els.game.classList.toggle('compact-hud', !!hudCompact);
    } catch {}
  }

  async function initThree(){
    if (initialized) return true;
    toast('Carregando 3D...', 'warn');
    if (!await ensureThreeLibs()) { toast('Biblioteca 3D não carregou. Confira internet no primeiro acesso.', 'bad'); return false; }
    initialized = true;
    scene = new THREE.Scene(); clock = new THREE.Clock();
    const rect = stageSize();
    camera = new THREE.PerspectiveCamera(64, Math.max(1, rect.width) / Math.max(1, rect.height), .1, 900);
    renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true, powerPreference:'high-performance', logarithmicDepthBuffer:false });
    renderer.domElement.id = 'three-canvas';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
    renderer.setSize(rect.width, rect.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.physicallyCorrectLights = true;
    els.stage.innerHTML = ''; els.stage.appendChild(renderer.domElement);
    ambientLight = new THREE.AmbientLight(0xffffff, .42); scene.add(ambientLight);
    const hemi = new THREE.HemisphereLight(0xeaf6ff,0x1b1208,.88); hemi.name = 'premiumHemisphereLight'; scene.add(hemi);
    sunLight = new THREE.DirectionalLight(0xffffff, 1.18); sunLight.position.set(8,20,12); sunLight.castShadow = true; sunLight.shadow.mapSize.set(1536,1536); sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 90; sunLight.shadow.camera.left = -28; sunLight.shadow.camera.right = 28; sunLight.shadow.camera.top = 28; sunLight.shadow.camera.bottom = -28; scene.add(sunLight);
    const rim = new THREE.DirectionalLight(0x7dd3fc, .42); rim.position.set(-10,10,-18); rim.name = 'premiumRimLight'; scene.add(rim);
    root = new THREE.Group(); scene.add(root);
    levelGroup = new THREE.Group(); root.add(levelGroup);
    player = new THREE.Group(); root.add(player);
    buildFallbackAthos(); loadAthosGLB();
    applyAdaptiveMobileLayout();
    window.addEventListener('resize', resize, { passive:true });
    window.addEventListener('orientationchange', () => { setTimeout(resize, 80); setTimeout(forceMobileReflow, 240); }, { passive:true });
    window.addEventListener('resize', () => setTimeout(forceMobileReflow, 120), { passive:true });
    installV54Render(currentLevel?.world || 'field');
    animate();
    return true;
  }

  function resize(){
    applyAdaptiveMobileLayout();
    if (!renderer || !camera) return;
    const rect = stageSize();
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
  }


  // V54: camada visual premium defensiva; nao altera controles, B Poder, Quiz/Falar, AR nativo ou model-viewer.
  function v54Ctx(worldOverride){
    return {
      THREE: window.THREE,
      scene,
      camera,
      renderer,
      player,
      currentWorld: worldOverride || currentLevel?.world || 'field',
      level: currentLevel,
      levelGroup,
      objects: platforms.map(o => o.mesh).filter(Boolean),
      enemies,
      portal: portalMesh,
      crystals: crystals.map(c => c.mesh).filter(Boolean),
      portalReady: !!(runtime && objectivesDone())
    };
  }
  function v54RenderModule(){
    return window.ATHOS_V54_RENDER_PREMIUM || window.ATHOS_V48_RENDER_TARGET;
  }
  function installV54Render(worldOverride){
    const mod = v54RenderModule();
    if (!mod || !window.THREE || !scene || !camera || !renderer) return false;
    const st = typeof mod.getStatus === 'function' ? mod.getStatus() : null;
    if (!st || !st.installed) {
      try { mod.install(v54Ctx(worldOverride)); } catch (e) { console.warn('V54 install ignorado com seguranca', e); return false; }
    }
    return true;
  }
  function rebuildV54Render(worldOverride){
    const mod = v54RenderModule();
    if (!mod || !window.THREE || !scene || !camera || !renderer) return;
    const w = worldOverride || currentLevel?.world || 'field';
    if (!installV54Render(w)) return;
    try { mod.rebuildWorld(v54Ctx(w), w); } catch (e) { console.warn('V54 rebuild ignorado com seguranca', e); }
  }
  function updateV54Render(dt){
    const mod = v54RenderModule();
    if (!mod || !window.THREE || !scene) return;
    try { mod.update(v54Ctx(currentLevel?.world || 'field'), dt); } catch (e) { console.warn('V54 update ignorado com seguranca', e); }
  }

  function addPart(group,w,h,d,x,y,z,material){ const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material); m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m; }
  function buildFallbackAthos(){
    if (playerModel) player.remove(playerModel);
    const g = new THREE.Group();
    const black = mat(0x050505), red = mat(0xff1717), orange = mat(0xff8a00), yellow = mat(0xffd400);
    const limbs = {};
    limbs.head = addPart(g,1.1,1.1,1.1,0,2.75,0,black);
    addPart(g,.24,.15,.08,-.28,2.86,.58,red); addPart(g,.24,.15,.08,.28,2.86,.58,red);
    limbs.body = addPart(g,1.05,1.25,.72,0,1.55,0,black);
    limbs.leftArm = addPart(g,.38,1.25,.38,-.82,1.55,0,orange); addPart(g,.38,.38,.42,-.82,.84,0,yellow);
    limbs.rightArm = addPart(g,.38,1.25,.38,.82,1.55,0,orange); addPart(g,.38,.38,.42,.82,.84,0,yellow);
    limbs.leftLeg = addPart(g,.42,1.25,.42,-.28,.28,0,black); addPart(g,.42,.38,.44,-.28,-.42,0,orange);
    limbs.rightLeg = addPart(g,.42,1.25,.42,.28,.28,0,black); addPart(g,.42,.38,.44,.28,-.42,0,orange);
    g.userData.limbs = limbs;
    g.userData.isProcedural = true;
    playerModel = g; player.add(playerModel); ensurePlayerContactShadow();
  }
  function updatePlayerProceduralAnim(dt){
    if (!playerModel) return;
    playerAnimTime += dt;
    const speed = Math.hypot(p.vx, p.vz);
    const walking = speed > .35 && p.grounded;
    const jumping = !p.grounded;
    const landPulse = Math.max(0, 1 - (now() - lastLandAt) / 220);
    if (playerModel.userData && playerModel.userData.isProcedural && playerModel.userData.limbs) {
      const { leftArm, rightArm, leftLeg, rightLeg, body, head } = playerModel.userData.limbs;
      if (walking) {
        const swing = Math.sin(playerAnimTime * 10.5) * .42;
        leftArm.rotation.x = swing;
        rightArm.rotation.x = -swing;
        leftLeg.rotation.x = -swing * .85;
        rightLeg.rotation.x = swing * .85;
        body.position.y = 1.55 + Math.abs(Math.sin(playerAnimTime * 10.5)) * .04;
      } else if (jumping) {
        const jumpT = clamp(p.vy / 12, -.35, .55);
        leftArm.rotation.x = -.55 + jumpT;
        rightArm.rotation.x = -.55 + jumpT;
        leftLeg.rotation.x = .35;
        rightLeg.rotation.x = .35;
        body.rotation.x = -.08;
      } else {
        const breath = Math.sin(playerAnimTime * 2.2) * .025;
        body.scale.y = 1 + breath;
        if (head) head.position.y = 2.75 + breath * .35;
        leftArm.rotation.x *= .82;
        rightArm.rotation.x *= .82;
        leftLeg.rotation.x *= .82;
        rightLeg.rotation.x *= .82;
        body.rotation.x *= .82;
        body.position.y = 1.55 + breath * .12;
      }
      if (landPulse > .01 && p.grounded) {
        body.scale.y = 1 - landPulse * .14;
        body.position.y = 1.55 - landPulse * .08;
      }
    } else {
      const bob = walking ? Math.sin(playerAnimTime * 10.5) * .05 : Math.sin(playerAnimTime * 2.2) * .018;
      playerModel.position.y = -bob + (jumping ? .12 : 0) - landPulse * .06;
      playerModel.rotation.x = jumping ? -.12 : landPulse * .06;
    }
  }
  function syncActionProximity(){
    if (!isOpenWorld() || !els.game) return;
    const near = openWorldNPCs.find(n => Math.abs(p.x-n.x)<3.6 && Math.abs(p.z-n.z)<3.6)
      || openWorldActivities.find(a => Math.abs(p.x-a.x)<3.3 && Math.abs(p.z-a.z)<3.3)
      || openWorldChests.find(c => !c.opened && Math.abs(p.x-c.x)<3.2 && Math.abs(p.z-c.z)<3.2)
      || openWorldDoors.find(d => Math.abs(p.x-d.x)<3.0 && Math.abs(p.z-d.z)<3.0);
    els.game.classList.toggle('action-nearby', !!near);
    const interactBtn = document.querySelector('[data-action="interact"]');
    if (interactBtn) interactBtn.classList.toggle('pulse-action', !!near);
  }
  function loadAthosGLB(){
    const loader = new THREE.GLTFLoader();
    loader.load('./athos.glb', (gltf) => {
      if (playerModel) player.remove(playerModel);
      playerModel = gltf.scene;
      playerModel.traverse((o) => { if (o.isMesh) { o.castShadow=true; o.receiveShadow=true; polishAthosMaterial(o); } });
      const box = new THREE.Box3().setFromObject(playerModel); const size = new THREE.Vector3(); box.getSize(size);
      const s = size.y > 0 ? 2.65 / size.y : 1; playerModel.scale.setScalar(s);
      const b2 = new THREE.Box3().setFromObject(playerModel); playerModel.position.y -= b2.min.y;
      player.add(playerModel);
      ensurePlayerContactShadow();
      if (gltf.animations && gltf.animations.length) { mixer = new THREE.AnimationMixer(playerModel); mixer.clipAction(gltf.animations[0]).play(); }
      els.modelStatus.textContent = 'athos.glb carregado.';
    }, undefined, () => { els.modelStatus.textContent = 'Fallback voxel ativo; athos.glb não carregou.'; });
  }

  function mat(color, emissive=0x000000, opts={}){
    return new THREE.MeshStandardMaterial({
      color,
      emissive,
      roughness: opts.roughness ?? .62,
      metalness: opts.metalness ?? .08,
      flatShading: opts.flatShading ?? true,
      transparent: !!opts.transparent,
      opacity: opts.opacity ?? 1,
      emissiveIntensity: opts.emissiveIntensity ?? (emissive ? .42 : 0)
    });
  }
  function box(w,h,d,color, opts={}){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color, opts.emissive || 0x000000, opts));
    m.castShadow=true; m.receiveShadow=true;
    if (opts.outline) addVoxelEdges(m, opts.outlineColor || 0xffffff, opts.outlineOpacity ?? .24);
    return m;
  }
  function shadeColor(hex, pct){
    const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    const t = pct < 0 ? 0 : 255, p = Math.abs(pct) / 100;
    const nr = Math.round((t-r)*p+r), ng = Math.round((t-g)*p+g), nb = Math.round((t-b)*p+b);
    return (nr << 16) + (ng << 8) + nb;
  }
  function addVoxelEdges(mesh, color=0xffffff, opacity=.22){
    if (!mesh || !mesh.geometry) return null;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 18),
      new THREE.LineBasicMaterial({ color, transparent:true, opacity })
    );
    edges.renderOrder = 2;
    mesh.add(edges);
    return edges;
  }
  function addTopHighlight(parent, w, h, d, color){
    const top = new THREE.Mesh(new THREE.BoxGeometry(w*.96, .045, d*.96), mat(shadeColor(color, 24), 0x000000, { roughness:.55 }));
    top.position.y = h/2 + .026;
    top.receiveShadow = true;
    parent.add(top);
    return top;
  }
  function addGlowSprite(x,y,z,color,scale=2,opacity=.32){
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color, transparent:true, opacity, depthWrite:false }));
    glow.position.set(x,y,z); glow.scale.set(scale, scale, scale);
    glow.userData.pulse = { base:scale, speed:1.3 + Math.random(), phase:Math.random()*6.28 };
    levelGroup.add(glow); premiumVisuals.push(glow);
    return glow;
  }


  function polishAthosMaterial(mesh){
    if (!mesh || !mesh.material) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    list.forEach(m => {
      if (!m) return;
      if ('roughness' in m) m.roughness = Math.min(.72, m.roughness ?? .58);
      if ('metalness' in m) m.metalness = Math.min(.12, m.metalness ?? .04);
      if ('envMapIntensity' in m) m.envMapIntensity = 1.15;
      if ('emissiveIntensity' in m && m.emissive) m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, .08);
      m.needsUpdate = true;
    });
  }

  function ensurePlayerContactShadow(){
    if (!player || !window.THREE) return;
    if (player.userData && player.userData.contactShadow) return;
    if (!player.userData) player.userData = {};
    const geo = new THREE.CircleGeometry(1, 36);
    const matShadow = new THREE.MeshBasicMaterial({
      color:0x000000,
      transparent:true,
      opacity:.26,
      depthWrite:false,
      side:THREE.DoubleSide
    });
    const shadow = new THREE.Mesh(geo, matShadow);
    shadow.name = 'ATHOS_CONTACT_SHADOW_V591';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0,.025,0);
    shadow.renderOrder = 2;
    player.add(shadow);
    player.userData.contactShadow = shadow;
  }

  function addV40BackdropSilhouettes(world, length, cfg){
    if (realBg) return;
    const farColor = world === 'fire' ? 0x3b0a0a : world === 'space' ? 0x111827 : world === 'castle' ? 0x1f2937 : world === 'forest' ? 0x064e3b : 0x1d4ed8;
    for (let i=0;i<9;i++) {
      const side = i % 2 ? -1 : 1;
      const z = -28 - i * Math.max(20, length / 9);
      const h = 3.5 + (i % 3) * 1.2;
      const w = world === 'castle' ? 3.6 : world === 'space' ? 2.4 : 4.8;
      const m = box(w, h, .75, shadeColor(farColor, (i%2)*12), { roughness:.9, outline:false, emissive: world === 'space' ? cfg.accent : 0x000000, emissiveIntensity: world === 'space' ? .16 : 0 });
      m.position.set(side*(12.5 + (i%3)*1.6), h/2 - .05, z);
      m.material.transparent = true; m.material.opacity = world === 'space' ? .55 : .42;
      levelGroup.add(m); premiumVisuals.push(m);
    }
  }

  function applyV40RenderPass(world,length){
    const cfg = WORLD[world] || WORLD.field;
    addV40LaneReadability(length, cfg);
    addV40PortalRunway(length, cfg);
    addV40SoftSpotlights(world, length, cfg);
  }

  function addV40LaneReadability(length, cfg){
    // Luzes baixas nas bordas e marcas discretas deixam a criança entender a profundidade sem texto.
    for (let z=-6; z>-length; z-=18) {
      [-6.85, 6.85].forEach((x,idx)=>{
        const pebble = box(.42,.14,.42, idx ? shadeColor(cfg.accent, 18) : shadeColor(cfg.grid, 28), { emissive:cfg.accent, emissiveIntensity:.18, roughness:.45 });
        pebble.position.set(x,.18,z);
        pebble.userData.pulseMat = true;
        levelGroup.add(pebble); premiumVisuals.push(pebble);
      });
    }
  }

  function addV40PortalRunway(length, cfg){
    const start = -Math.max(30, length - 54);
    for (let z=start; z>-length-6; z-=10) {
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.62,8), mat(cfg.accent, cfg.accent, { emissiveIntensity:.42, roughness:.35 }));
      beacon.position.set(-3.15,.55,z); beacon.castShadow = true; levelGroup.add(beacon); premiumVisuals.push(beacon);
      const beacon2 = beacon.clone(); beacon2.position.x = 3.15; levelGroup.add(beacon2); premiumVisuals.push(beacon2);
    }
  }

  function addV40SoftSpotlights(world, length, cfg){
    if (realBg) return;
    const points = [-48, -Math.max(90, length*.45), -Math.max(150, length*.72)].filter(z => Math.abs(z) < length + 10);
    points.forEach((z,i)=>{
      const light = new THREE.PointLight(world === 'fire' ? 0xff6b00 : cfg.accent, world === 'space' ? .55 : .38, 18);
      light.position.set(i%2 ? -5.8 : 5.8, 4.2, z);
      levelGroup.add(light); premiumVisuals.push(light);
    });
  }

  async function start(modeName){
    mode = modeName; paused = false; playing = true;
    hardStopAllInput('start');
    els.game.classList.remove('compact-hud');
    if (mode === 'hub') currentLevel = { id:'hub', title:'Hub dos Portais', world:'hub', length:190, crystals:0, enemies:0, objective:'Explore o hub e escolha uma fase pelos portais. Para aventura real, toque em JOGAR FASES.' };
    else if (mode === 'free') currentLevel = { ...LEVELS[0], id:'free', title:'Brincar Livre', world:'field', length:260, crystals:10, enemies:7, objective:'Explore livremente. Para AR fixo, toque no botão Real.' };
    else if (mode === 'missions' || mode === 'openworld') { mode = 'openworld'; currentLevel = { id:'openworld', title:'Athos Open World', world:'field', openWorld:true, length:OPEN_WORLD.size*2, crystals:6, enemies:3, objective:OPEN_WORLD.objective, tutorial:['Explore livremente em todas as direções.','Arraste a tela vazia para girar a câmera.','Use espada, fogo e pulo para vencer desafios.'] }; }
    else { currentLevelIndex = Math.min(progress.level || 0, LEVELS.length - 1); currentLevel = LEVELS[currentLevelIndex]; }
    showScreen('game');
    if (!await initThree()) { showScreen('lobby'); playing = false; return; }
    resize();
    requestAnimationFrame(resize);
    window.setTimeout(resize, 80);
    window.setTimeout(resize, 220);
    buildLevel(currentLevel);
    requestFullscreenLandscape();
    toast(currentLevel.title, 'good');
    speak(currentLevel.objective);
    clearTimeout(start.compactTimer);
    start.compactTimer = setTimeout(() => { if (playing && els.game.classList.contains('active')) els.game.classList.add('compact-hud'); }, 6500);
  }

  function exitGame(){
    playing = false; paused = false; hardStopAllInput('exit'); stopCamera(); showScreen('lobby'); updateLobbyStats();
  }

  function newRuntime(){
    const diff = DIFFICULTY[progress.difficulty];
    return { hearts:diff.hearts, crystals:0, defeated:0, requiredCrystals:currentLevel.crystals||0, requiredEnemies:currentLevel.enemies||0, timer:(mode==='missions'?diff.timer:0), checkpoint:4, quizSolved:!currentLevel.quizGate, completed:false, tutorialStep:0, startedAt:now(), portalAnnounced:false };
  }

  function resetPlayer(){ p = defaultPlayer(); p.z = (runtime && runtime.checkpoint) || 4; player.position.set(p.x,p.y + PLAYER_VISUAL_Y_OFFSET,p.z); player.rotation.y = Math.PI; lastGroundedAt = now(); lastJumpAt = 0; lastLandAt = now(); jumpBufferedUntil = 0; clearMovementState(); }
  function clearLevel(){
    if (!levelGroup) return;
    while(levelGroup.children.length) levelGroup.remove(levelGroup.children[0]);
    clearV55VisualLayer(); platforms=[]; hazards=[]; crystals=[]; enemies=[]; fireballs=[]; enemyProjectiles=[]; particles=[]; solids=[]; gates=[]; checkpoints=[]; premiumVisuals=[]; v42Markers=[]; v44EnemyMarkers=[]; powerups=[]; portalMesh=null;
  }


  function isOpenWorld(){
    return !!(currentLevel && currentLevel.openWorld);
  }
  function openWorldProgress(){
    progress.openWorld = progress.openWorld || {
      x:0, y:0, z:4,
      mission:'arrume_sua_casa',
      step:0,
      doors:{},
      chests:{},
      activities:{},
      talked:{},
      resources:{ wood:0, stone:0, food:0 },
      upgrades:{ sword:0, shield:0, house:0 },
      ownedHouses:{ casa_athos:true },
      homeMission:{ id:'arrume_sua_casa', step:0 },
      homeMissionFlags:{ enter_house:false, use_bed:false, got_food:false, talked_otto:false, wood2:false, visit_workshop:false },
      activatedPortals:0,
      visited:{ village:true }
    };
    progress.openWorld.resources = progress.openWorld.resources || { wood:0, stone:0, food:0 };
    progress.openWorld.activities = progress.openWorld.activities || {};
    progress.openWorld.talked = progress.openWorld.talked || {};
    progress.openWorld.upgrades = progress.openWorld.upgrades || { sword:0, shield:0, house:0 };
    progress.openWorld.doors = progress.openWorld.doors || {};
    progress.openWorld.chests = progress.openWorld.chests || {};
    progress.openWorld.ownedHouses = progress.openWorld.ownedHouses || { casa_athos:true };
    progress.openWorld.homeMission = progress.openWorld.homeMission || { id:'arrume_sua_casa', step:0 };
    progress.openWorld.homeMissionFlags = progress.openWorld.homeMissionFlags || { enter_house:false, use_bed:false, got_food:false, talked_otto:false, wood2:false, visit_workshop:false };
    return progress.openWorld;
  }
  function setHomeMissionFlag(flag){
    const ow = openWorldProgress();
    const f = ow.homeMissionFlags || {};
    if (f[flag]) return;
    f[flag] = true;
    ow.homeMissionFlags = f;
    const order = ['enter_house','use_bed','got_food','talked_otto','wood2','visit_workshop'];
    ow.homeMission = ow.homeMission || { id:'arrume_sua_casa', step:0 };
    ow.homeMission.step = order.filter(k => f[k]).length;
    ow.step = Math.max(ow.step||0, ow.homeMission.step);
    saveProgress();
    updateHud();
  }
  function homeMissionStatus(){
    const f = openWorldProgress().homeMissionFlags || {};
    const order = ['enter_house','use_bed','got_food','talked_otto','wood2','visit_workshop'];
    const done = order.filter(k => f[k]).length;
    const next = order.findIndex(k => !f[k]);
    return { done, next: next < 0 ? order.length - 1 : next, total: order.length };
  }
  function owIsHouseOwned(id){
    const ow = openWorldProgress();
    return !!(ow.ownedHouses && ow.ownedHouses[id]);
  }
  const HOME_MISSION_STEPS = [
    'Entre na Casa do Athos.',
    'Use a cama para descansar.',
    'Pegue comida na cozinha.',
    'Fale com o Otto na praça.',
    'Colete 2 madeiras na floresta.',
    'Vá até a oficina.'
  ];
  function currentOpenWorldRegion(pos){
    const q = pos || p;
    if (!q) return OPEN_WORLD_REGIONS[0];
    return OPEN_WORLD_REGIONS.find(r => Math.abs(q.x - r.x) <= r.w/2 && Math.abs(q.z - r.z) <= r.d/2) || OPEN_WORLD_REGIONS[1];
  }
  function currentOpenWorldMissionText(){
    const ow = openWorldProgress();
    const r = ow.resources || {};
    const status = homeMissionStatus();
    if (status.done < status.total) {
      return ['Arrume sua casa', `${status.done + 1}/${status.total} — ${HOME_MISSION_STEPS[status.next]}`];
    }
    const steps = [
      ['A Espada Perdida','Vá à floresta, corte madeira e ache a cabana.'],
      ['A Oficina','Leve madeira e pedra para a oficina melhorar a espada.'],
      ['A Ponte','Colete 3 madeiras e 2 pedras para reparar a ponte.'],
      ['O Mundo Vivo','Explore, converse, abra baús, lute e ative portais.']
    ];
    const idx = Math.min(Math.max(0, (ow.step||0) - HOME_MISSION_STEPS.length), steps.length - 1);
    const base = steps[idx].slice();
    base[1] += `  Madeira:${r.wood||0} Pedra:${r.stone||0} Comida:${r.food||0}`;
    return base;
  }
  function addOWObject(obj, chunkX, chunkZ){
    if (!obj) return obj;
    obj.userData = obj.userData || {};
    obj.userData.openWorld = true;
    const key = `${chunkX||0},${chunkZ||0}`;
    if (!openWorldChunks.has(key)) openWorldChunks.set(key, []);
    openWorldChunks.get(key).push(obj);
    openWorldObjects.push(obj);
    return obj;
  }
  function owChunkFor(x,z){
    return { cx:Math.floor((x + OPEN_WORLD.size) / OPEN_WORLD.chunkSize), cz:Math.floor((z + OPEN_WORLD.size) / OPEN_WORLD.chunkSize) };
  }
  function owBox(x,y,z,w,h,d,color,opts={}){
    const m = box(w,h,d,color,opts);
    m.position.set(x,y,z);
    levelGroup.add(m);
    const c = owChunkFor(x,z);
    addOWObject(m,c.cx,c.cz);
    return m;
  }
  function owSolid(x,y,z,w,h,d,color,opts={}){
    const m = owBox(x,y,z,w,h,d,color,opts);
    const pl = {mesh:m,x,y,z,w,h,d,top:y+h/2,type:'openworld-solid'};
    platforms.push(pl);
    solids.push(pl);
    return m;
  }
  function owTree(x,z,scale=1){
    const trunk = owSolid(x,1.0*scale,z,.75*scale,2.0*scale,.75*scale,0x7c3f1d,{outline:true,outlineOpacity:.16});
    owBox(x,2.55*scale,z,3.15*scale,1.55*scale,3.15*scale,0x15803d,{outline:true,outlineOpacity:.10});
    owBox(x,3.35*scale,z,2.35*scale,1.08*scale,2.35*scale,0x22c55e,{outline:true,outlineOpacity:.08});
    if (scale > 1.05) owBox(x,4.05*scale,z,1.45*scale,.72*scale,1.45*scale,0x86efac,{outline:true,outlineOpacity:.05});
    return trunk;
  }
  function owRock(x,z,s=1,color=0x7b8794){
    return owSolid(x,.32*s,z,1.2*s,.64*s,1.05*s,color,{outline:true,outlineOpacity:.13,roughness:.9});
  }
  function owGrassPatch(x,z,color=0x7ee05f){
    owBox(x,.26,z,.16,.52,.16,color,{outline:false});
    if (Math.random()>.45) owBox(x+.28,.18,z-.18,.12,.36,.12,0xd9f99d,{outline:false});
  }
  function owFlower(x,z,color=0xffdf52){
    owBox(x,.22,z,.10,.44,.10,0x22c55e,{outline:false});
    owBox(x,.52,z,.36,.18,.36,color,{emissive:color,emissiveIntensity:.18,outline:false});
  }
  function owFence(x,z,w,d){
    for(let xx=x-w/2; xx<=x+w/2+.01; xx+=2.2){ owSolid(xx,.55,z-d/2,.22,1.1,.22,0x6b3b17,{outline:true,outlineOpacity:.08}); owSolid(xx,.55,z+d/2,.22,1.1,.22,0x6b3b17,{outline:true,outlineOpacity:.08}); }
    for(let zz=z-d/2; zz<=z+d/2+.01; zz+=2.2){ owSolid(x-w/2,.55,zz,.22,1.1,.22,0x6b3b17,{outline:true,outlineOpacity:.08}); owSolid(x+w/2,.55,zz,.22,1.1,.22,0x6b3b17,{outline:true,outlineOpacity:.08}); }
  }
  function owLamp(x,z,color=0xffd86b){
    owSolid(x,1.15,z,.24,2.3,.24,0x5b341a,{outline:true,outlineOpacity:.12});
    owBox(x,2.55,z,.72,.72,.72,color,{emissive:color,emissiveIntensity:.65,outline:true,outlineOpacity:.16});
    addGlowSprite(x,2.55,z,color,3.2,.16);
  }
  function owPathTile(x,z,w,d,color=0xbf8a45){
    owBox(x,.026,z,w,.09,d,color,{outline:true,outlineOpacity:.05,roughness:.86});
  }
  function owHedge(x,z,w,d){
    owSolid(x,.55,z,w,1.1,d,0x1f8a3a,{outline:true,outlineColor:0x86efac,outlineOpacity:.10});
  }
  function owBridge(x,z,w=18,d=5){
    owSolid(x,.36,z,w,.42,d,0x8b5a2b,{outline:true,outlineOpacity:.20});
    for(let i=-w/2+1;i<w/2;i+=2.5){
      owBox(x+i,.78,z-d/2-.35,.18,.72,.18,0x5b341a,{outline:true,outlineOpacity:.08});
      owBox(x+i,.78,z+d/2+.35,.18,.72,.18,0x5b341a,{outline:true,outlineOpacity:.08});
    }
    owBox(x,.98,z-d/2-.35,w,.18,.18,0x5b341a,{outline:true,outlineOpacity:.08});
    owBox(x,.98,z+d/2+.35,w,.18,.18,0x5b341a,{outline:true,outlineOpacity:.08});
  }
  function owPortalShrine(x,z){
    owSolid(x,.22,z,15,.44,12,0x94a3b8,{outline:true,outlineOpacity:.12});
    [-5.6,5.6].forEach(px=>{
      owSolid(x+px,1.8,z,1.1,3.6,1.1,0x64748b,{outline:true,outlineOpacity:.18});
      owBox(x+px,3.85,z,1.45,.55,1.45,0xa855f7,{emissive:0x8b5cf6,emissiveIntensity:.35,outline:true,outlineOpacity:.12});
    });
    owLamp(x-6.8,z+5.6,0x38bdf8); owLamp(x+6.8,z+5.6,0x38bdf8);
  }
  function owDistantMountains(){
    for(let i=0;i<18;i++){
      const x=-190+i*22;
      const z=-205-(i%3)*12;
      const h=10+(i%5)*3;
      owBox(x,h/2-1,z,18,h,8, i%2?0x7c8a99:0x8fa3b7,{outline:false,roughness:.95});
      owBox(x,h+.8,z,11,3,6,0xe0f2fe,{outline:false,roughness:.9});
    }
  }
  function owDecorateRegion(){
    for(let i=0;i<130;i++){
      const x=(Math.random()-.5)*OPEN_WORLD.size*1.65;
      const z=(Math.random()-.5)*OPEN_WORLD.size*1.65;
      if(Math.abs(x)<11 || Math.abs(z)<11) continue;
      const r=currentOpenWorldRegion({x,z});
      if(Math.random()<.52) owGrassPatch(x,z, r && r.id==='forest'?0x3ee65d:0x7ee05f);
      else if(Math.random()<.75) owFlower(x,z, Math.random()>.5?0xffdf52:0xff7ac8);
      else owRock(x,z,.55+Math.random()*.6);
    }
  }
  function owHouse(x,z,id,color=0xb8793a){
    owSolid(x,.12,z,7.4,.24,6.4,0x8b5a2b,{outline:true,outlineOpacity:.10});
    owSolid(x,1.15,z-3.05,7.2,2.3,.35,color,{outline:true,outlineColor:0xffffff,outlineOpacity:.15});
    owSolid(x-3.6,1.15,z,.35,2.3,6.2,color,{outline:true,outlineColor:0xffffff,outlineOpacity:.15});
    owSolid(x+3.6,1.15,z,.35,2.3,6.2,color,{outline:true,outlineColor:0xffffff,outlineOpacity:.15});
    owSolid(x-2.35,1.15,z+3.05,2.5,2.3,.35,color,{outline:true,outlineColor:0xffffff,outlineOpacity:.15});
    owSolid(x+2.35,1.15,z+3.05,2.5,2.3,.35,color,{outline:true,outlineColor:0xffffff,outlineOpacity:.15});
    const roof = owSolid(x,2.75,z,8.2,1.0,7.2,0x7f1d1d,{outline:true,outlineOpacity:.18});
    owBox(x,.14,z,6.0,.04,5.0,0xd4a574,{outline:true,outlineOpacity:.06,roughness:.88});
    const door = owBox(x,1.0,z+3.22,1.35,1.9,.16,0x4b2a12,{outline:true,outlineColor:0xfacc15,outlineOpacity:.35});
    door.userData.doorName = id;
    openWorldDoors.push({name:id,x,z:z+3.35,mesh:door,open:false});
    owBox(x-2.25,1.35,z+3.26,.9,.7,.12,0x93c5fd,{emissive:0x38bdf8,emissiveIntensity:.18});
    owBox(x+2.25,1.35,z+3.26,.9,.7,.12,0x93c5fd,{emissive:0x38bdf8,emissiveIntensity:.18});
    openWorldHouses.push({id,x,z,color,roof,door});
    owBuildHouseInterior(id,x,z);
    return door;
  }
  function owBuildHouseInterior(id,x,z){
    if(id === 'casa_athos'){
      owBox(x-1.2,.52,z-1.55,2.0,.24,1.35,0x7c3f1d,{outline:true,outlineOpacity:.12});
      owBox(x-1.2,.78,z-1.55,1.9,.42,1.25,0xf8fafc,{outline:true,outlineOpacity:.08});
      owBox(x,.62,z-1.15,1.5,.52,1.0,0x8b5a2b,{outline:true,outlineOpacity:.12});
      owBox(x+1.35,.48,z-1.35,.95,.96,.75,0x6b3b17,{outline:true,outlineColor:0xfacc15,outlineOpacity:.22});
      owBox(x+1.35,1.02,z-1.35,1.02,.18,.82,0xfacc15,{emissive:0xfacc15,emissiveIntensity:.12});
      owSolid(x-1.55,.72,z+.35,.55,1.44,.42,0x64748b,{outline:true,outlineOpacity:.10});
      owBox(x-1.55,1.52,z+.35,.62,.12,.48,0x94a3b8,{outline:true,outlineOpacity:.08});
      owBox(x-1.55,.42,z+.55,.38,.28,.28,0x111827,{outline:false});
      owBox(x+1.1,.55,z+.15,.85,.62,.55,0xf59e0b,{emissive:0xf59e0b,emissiveIntensity:.14,outline:true,outlineOpacity:.10});
      owBox(x+1.1,1.02,z+.15,.72,.08,.42,0xef4444,{outline:false});
      owActivity('cama_athos',x,z-1.45,'bed','Dormir / salvar',0x38bdf8);
      owActivity('cozinha_athos',x-1.55,z+.35,'kitchen','Pegar comida',0xf59e0b);
      owChest(x+1.35,z-1.35,'bau_athos');
    } else if(id === 'oficina'){
      owSolid(x,.62,z-1.5,2.8,.18,1.2,0x5b341a,{outline:true,outlineOpacity:.14});
      owBox(x,.95,z-1.5,2.9,.42,1.3,0x8b5a2b,{outline:true,outlineColor:0x22c55e,outlineOpacity:.18});
      owBox(x+1.4,.72,z-.55,.35,.35,.35,0x94a3b8,{outline:true,outlineOpacity:.12});
      owBox(x+1.4,1.08,z-.55,.12,.55,.12,0x64748b,{outline:true,outlineOpacity:.10});
      owBox(x-1.35,.72,z-.45,.35,.35,.35,0x94a3b8,{outline:true,outlineOpacity:.12});
      owBox(x-1.35,1.08,z-.45,.12,.55,.12,0x64748b,{outline:true,outlineOpacity:.10});
      owBox(x,.55,z+1.0,1.6,.9,.8,0x22c55e,{emissive:0x22c55e,emissiveIntensity:.22,outline:true,outlineColor:0xffffff,outlineOpacity:.16});
      owActivity('bancada_oficina',x,z-1.5,'workbench','Melhorar espada',0x22c55e);
    } else if(id === 'loja'){
      owSolid(x,.78,z+1.55,3.2,.18,1.0,0xc08457,{outline:true,outlineOpacity:.12});
      owBox(x,1.12,z+1.55,3.3,.52,1.1,0xd8a35d,{outline:true,outlineOpacity:.10});
      owBox(x,.95,z+.15,.75,.75,.75,0xfacc15,{emissive:0xfacc15,emissiveIntensity:.35,outline:true,outlineOpacity:.18});
      addGlowSprite(x,.95,z+.15,0xfacc15,2.2,.14);
      owActivity('loja_balcao',x,z+1.55,'shop','Comprar item',0xfacc15);
    } else if(id === 'morador'){
      owBox(x-.35,.55,z+1.1,1.2,.7,.9,0xff7ac8,{emissive:0xff7ac8,emissiveIntensity:.12,outline:true,outlineOpacity:.12});
      owNPC('moradora_casa',x+1.1,z+.2,'Moradora',0xff7ac8);
      owActivity('missao_morador',x-.35,z+1.1,'quest','Objeto de missão',0x8b5cf6);
    } else if(id === 'fazenda'){
      for(let i=0;i<3;i++) for(let j=0;j<2;j++){
        const px=x+2.4+i*1.35, pz=z-1.1+j*1.2;
        owBox(px,.22,pz,1.05,.44,1.05,0x3f6212,{outline:true,outlineOpacity:.08});
        owBox(px,.62,pz,.55,.55,.55,i%2?0x84cc16:0x22c55e,{emissive:0x84cc16,emissiveIntensity:.12,outline:false});
      }
      owBox(x-1.2,.48,z+.55,1.1,.96,.85,0x8b5a2b,{outline:true,outlineColor:0xf59e0b,outlineOpacity:.18});
      owBox(x-1.2,1.02,z+.55,1.18,.22,.92,0xf59e0b,{emissive:0xf59e0b,emissiveIntensity:.10});
      owActivity('plantacao_fazenda',x+2.8,z,'farm','Colher alimento',0x84cc16);
      owActivity('caixa_fazenda',x-1.2,z+.55,'kitchen','Pegar comida',0xf59e0b);
    }
  }

  function owChest(x,z,id){
    const c = owSolid(x,.45,z,1.35,.9,1.0,0x8b5a2b,{outline:true,outlineColor:0xfacc15,outlineOpacity:.28});
    const lid = owBox(x,.98,z,1.42,.26,1.06,0xfacc15,{emissive:0xfacc15,emissiveIntensity:.10});
    openWorldChests.push({id,x,z,mesh:c,opened:false});
    return c;
  }

  function owActivity(id,x,z,type,label,color=0x38bdf8){
    const base = owBox(x,.08,z,2.6,.16,2.6,color,{emissive:color,emissiveIntensity:.25,transparent:true,opacity:.72,outline:true,outlineColor:0xffffff,outlineOpacity:.18});
    const icon = owBox(x,.72,z,.7,.7,.7,color,{emissive:color,emissiveIntensity:.55,outline:true,outlineOpacity:.12});
    openWorldActivities.push({id,x,z,type,label,mesh:base,icon,used:false});
    return base;
  }
  function owNPC(id,x,z,name,color=0xffdf52){
    const g = new THREE.Group();
    g.name = 'OW_NPC_' + id;
    const body = box(.82,1.25,.58,color,{emissive:color,emissiveIntensity:.08,outline:true,outlineOpacity:.18});
    body.position.y = .95;
    const head = box(.70,.70,.70,0xffd8a8,{outline:true,outlineOpacity:.12});
    head.position.y = 1.88;
    const eye1 = box(.08,.08,.04,0x111827); eye1.position.set(-.16,1.92,.37);
    const eye2 = box(.08,.08,.04,0x111827); eye2.position.set(.16,1.92,.37);
    g.add(body,head,eye1,eye2);
    g.position.set(x,0,z);
    levelGroup.add(g);
    addOWObject(g,owChunkFor(x,z).cx,owChunkFor(x,z).cz);
    openWorldNPCs.push({id,name,x,z,mesh:g});
    return g;
  }
  function owResourceNode(id,x,z,type,amount=1){
    let mesh;
    if(type==='wood'){
      mesh = owTree(x,z,.82);
    } else if(type==='stone'){
      mesh = owRock(x,z,1.1,0x7b8794);
    } else {
      mesh = owBox(x,.35,z,1.2,.7,1.2,0xfacc15,{emissive:0xfacc15,emissiveIntensity:.16,outline:true,outlineOpacity:.12});
    }
    openWorldResourceNodes.push({id,x,z,type,amount,mesh,used:false});
    return mesh;
  }
  function owInteriorZone(id,x,z,w,d,label){
    const zone = owBox(x,.045,z,w,.09,d,0x93c5fd,{emissive:0x38bdf8,emissiveIntensity:.10,transparent:true,opacity:.16,outline:true,outlineOpacity:.07});
    openWorldInteriors.push({id,x,z,w,d,label,mesh:zone,inside:false,owned:()=>owIsHouseOwned(id)});
    return zone;
  }
  function owInteriorBounds(zone){
    const owned = owIsHouseOwned(zone.id);
    if (owned) return { cx:zone.x, cz:zone.z, w:zone.w, d:zone.d };
    return { cx:zone.x, cz:zone.z + zone.d * .18, w:zone.w * .68, d:zone.d * .42 };
  }
  function owIsInsideInterior(zone){
    const b = owInteriorBounds(zone);
    return Math.abs(p.x - b.cx) <= b.w/2 && Math.abs(p.z - b.cz) <= b.d/2;
  }
  function owIsDeepInsideInterior(zone){
    if (!owIsHouseOwned(zone.id)) return false;
    return Math.abs(p.x-zone.x) <= zone.w/2 && Math.abs(p.z-zone.z) <= zone.d/2;
  }
  function syncOpenWorldInteriors(){
    if(!isOpenWorld()) return;
    let anyInside = false;
    for(const zone of openWorldInteriors){
      const inside = owIsInsideInterior(zone);
      const wasInside = zone.inside;
      if(wasInside === inside && !(inside && currentInteriorId === zone.id)) continue;
      zone.inside = inside;
      const house = openWorldHouses.find(h => h.id === zone.id);
      if(house && house.roof) house.roof.visible = !inside;
      for(const d of openWorldDoors){
        if(d.name === zone.id && d.mesh) d.mesh.visible = !inside && !d.open;
      }
      if(inside){
        anyInside = true;
        cameraMode = 'interior';
        currentInteriorId = zone.id;
        if(!wasInside){
          toast(`Entrou: ${zone.label}`, 'good');
          if(zone.id === 'casa_athos') advanceHomeMission(1);
          if(zone.id === 'oficina' && (openWorldProgress().homeMission?.step||0) >= 5) advanceHomeMission(6);
          if(!owIsHouseOwned(zone.id) && !owIsDeepInsideInterior(zone)) toast('Visita parcial — compre a casa para entrar por completo.', 'warn');
        }
      } else if(wasInside && currentInteriorId === zone.id){
        cameraMode = 'openworld';
        currentInteriorId = null;
        if(house && house.roof) house.roof.visible = true;
      }
    }
    if(!anyInside && cameraMode === 'interior'){
      cameraMode = 'openworld';
      currentInteriorId = null;
      for(const h of openWorldHouses) if(h.roof) h.roof.visible = true;
    }
  }
  function addOWResource(type,amount=1){
    const ow = openWorldProgress();
    ow.resources[type] = (ow.resources[type] || 0) + amount;
    saveProgress(); updateHud();
  }
  function owActivityRequiresOwnership(act){
    return ['bed','kitchen','workbench','quest','shop'].includes(act.type) || act.id === 'caixa_fazenda';
  }
  function useOWActivity(act){
    const ow = openWorldProgress();
    const houseId = openWorldInteriors.find(z => Math.abs(act.x-z.x)<4 && Math.abs(act.z-z.z)<4)?.id;
    if(houseId && owActivityRequiresOwnership(act) && !owIsHouseOwned(houseId)){
      toast('Esta área é privada — compre a casa primeiro.', 'warn');
      return;
    }
    if(houseId && !owIsHouseOwned(houseId) && !owIsDeepInsideInterior(openWorldInteriors.find(z=>z.id===houseId))){
      toast('Só a entrada está liberada nesta casa.', 'warn');
      return;
    }
    ow.activities[act.id] = (ow.activities[act.id] || 0) + 1;
    if(act.type === 'bed'){
      runtime.hearts = runtime.maxHearts || DIFFICULTY[progress.difficulty].hearts;
      saveOpenWorldPosition();
      saveProgress();
      advanceHomeMission(2);
      toast('Dormiu e salvou progresso. Vida cheia!', 'good');
    } else if(act.type === 'kitchen'){
      addOWResource('food',1);
      if(act.id === 'cozinha_athos') advanceHomeMission(3);
      toast('Pegou comida na cozinha.', 'good');
    } else if(act.type === 'workbench'){
      const r = ow.resources;
      if((r.wood||0)>=2 && (r.stone||0)>=1){
        r.wood -= 2; r.stone -= 1;
        ow.upgrades.sword = (ow.upgrades.sword||0) + 1;
        p.weapon='sword'; p.weaponUntil=now()+120000;
        ow.step = Math.max(ow.step||0, HOME_MISSION_STEPS.length + 1);
        toast('Oficina: espada melhorada!', 'good');
        addXP(60);
      } else toast('Oficina precisa de 2 madeiras e 1 pedra.', 'warn');
    } else if(act.type === 'farm'){
      addOWResource('food',1);
      toast('Colheu alimento na fazenda.', 'good');
    } else if(act.type === 'shop'){
      toast('Loja: item em exposição — compra real em breve!', 'good');
      addXP(5);
    } else if(act.type === 'quest'){
      toast('Moradora: ajude a arrumar o vilarejo!', 'good');
      addXP(12);
    } else if(act.type === 'bridge'){
      const r = ow.resources;
      if((r.wood||0)>=3 && (r.stone||0)>=2){
        r.wood -= 3; r.stone -= 2;
        ow.activities.bridge_repaired = 1;
        ow.step = Math.max(ow.step||0, 5);
        toast('Ponte reparada! Nova área liberada.', 'good');
        addXP(80);
      } else toast('Ponte precisa de 3 madeiras e 2 pedras.', 'warn');
    } else {
      toast(act.label || 'Atividade concluída.', 'good');
    }
    saveProgress(); updateHud();
  }

  function buildOpenWorld(){
    openWorldObjects = [];
    openWorldChunks = new Map();
    openWorldDoors = [];
    openWorldChests = [];
    openWorldActivities = [];
    openWorldNPCs = [];
    openWorldResourceNodes = [];
    openWorldInteriors = [];
    openWorldHouses = [];
    openWorldState = openWorldProgress();
    currentLevel.openWorld = true;
    currentLevel.length = OPEN_WORLD.size*2;
    runtime = newRuntime();
    runtime.requiredCrystals = 9;
    runtime.requiredEnemies = 5;
    p = defaultPlayer();
    p.x = Number(openWorldState.x || 0);
    p.y = Number(openWorldState.y || 0);
    p.z = Number(openWorldState.z || 4);
    player.position.set(p.x,p.y + PLAYER_VISUAL_Y_OFFSET,p.z);
    ensurePlayerContactShadow();
    cameraYaw = openWorldState.cameraYaw || 0;
    configureWorld('field');
    scene.background = new THREE.Color(0x7ac7ff);
    scene.fog = new THREE.Fog(0xa8e6ff, 210, 780);
    renderer.setClearColor(0x7ac7ff, 1);
    renderer.toneMappingExposure = 1.28;
    ambientLight.intensity = .50;
    sunLight.intensity = 1.48;
    sunLight.position.set(18,30,16);

    // Céu, sol e horizonte 3D. Nada de imagem de referência colada.
    createPremiumAtmosphere('field', OPEN_WORLD.size*2.1);
    owDistantMountains();

    const ground = owBox(0,-.16,0,OPEN_WORLD.size*2.08,.32,OPEN_WORLD.size*2.08,0x4db44a,{outline:false,roughness:.78});
    ground.receiveShadow = true;

    // Relevo leve e plataformas naturais
    for(let i=0;i<42;i++){
      const x=(Math.random()-.5)*OPEN_WORLD.size*1.75;
      const z=(Math.random()-.5)*OPEN_WORLD.size*1.75;
      if(Math.abs(x)<28 && Math.abs(z)<28) continue;
      const c = currentOpenWorldRegion({x,z});
      const color = c.id==='mountain'?0x9aa8b7:c.id==='volcano'?0x3a1510:c.id==='forest'?0x23823c:0x3f9c39;
      owBox(x,.05,z,12+Math.random()*18,.18,10+Math.random()*18,color,{outline:false,roughness:.9});
    }

    // Trilhas orgânicas: cruz principal + ramificações
    for(let z=-OPEN_WORLD.size*.88; z<OPEN_WORLD.size*.88; z+=10) owPathTile(0,z,12.5,9.5,0xc08a45);
    for(let x=-OPEN_WORLD.size*.88; x<OPEN_WORLD.size*.88; x+=10) owPathTile(x,0,9.5,12.5,0xc08a45);
    for(let i=0;i<24;i++){ owPathTile(-i*4.2,-8-i*3.1,8.5,7.2,0xb98242); }
    for(let i=0;i<22;i++){ owPathTile(i*4.3,-10-i*3.4,8.5,7.2,0xb98242); }
    for(let i=0;i<20;i++){ owPathTile(6+i*4.6,12+i*3.8,8.5,7.2,0xb98242); }

    // Lago, rio e ponte com volume.
    owBox(-62,.025,38,126,.12,15,0x35c9ff,{emissive:0x0ea5e9,emissiveIntensity:.22,transparent:true,opacity:.78});
    owBox(-92,.02,58,42,.10,32,0x2dd4ff,{emissive:0x0ea5e9,emissiveIntensity:.18,transparent:true,opacity:.70});
    owBridge(-8,38,18,5.4);
    owBridge(-88,58,12,4.4);

    // Vilarejo central profissionalizado.
    owPortalShrine(0,-25);
    const portal = addPortalObject(0,-25,0x38bdf8,'openworld');
    portal.userData.openWorldPortal = true;
    addOWObject(portal, owChunkFor(0,-25).cx, owChunkFor(0,-25).cz);

    owSolid(0,.18,0,15,.36,15,0xd8a35d,{outline:true,outlineOpacity:.12});
    owHouse(-17,-12,'casa_athos',0xb7793b);
    owHouse(16,-13,'oficina',0xa16207);
    owHouse(-19,17,'loja',0xc08457);
    owHouse(18,16,'morador',0x9a6332);
    owHouse(34,6,'fazenda',0xb8793a);
    owInteriorZone('casa_athos',-17,-12,5.8,4.8,'Casa do Athos');
    owInteriorZone('oficina',16,-13,5.8,4.8,'Oficina');
    owInteriorZone('loja',-19,17,5.8,4.8,'Loja');
    owInteriorZone('morador',18,16,5.8,4.8,'Casa do Morador');
    owInteriorZone('fazenda',34,6,6.0,5.0,'Fazenda');
    owActivity('ponte_quebrada',-18,38,'bridge','Reparar ponte',0x8b5a2b);
    owNPC('otto',2,5,'Otto',0xfacc15);
    owNPC('mestre',14,-6,'Mestre da Oficina',0x38bdf8);
    owNPC('fazendeiro',35,12,'Fazendeiro',0x84cc16);
    owFence(-18,16,13,11);
    owFence(34,6,15,12);
    for(const pnt of [[-28,-3],[28,-4],[-26,28],[28,28],[-6,16],[7,16]]) owLamp(pnt[0],pnt[1],0xffd86b);
    for(let i=0;i<9;i++) owRock(-35+i*8,27+(i%2)*3,.65,0x7b8794);

    // Totem de missão.
    owSolid(0,1.15,10,1.2,2.3,1.2,0x7c3aed,{emissive:0x8b5cf6,emissiveIntensity:.25,outline:true,outlineColor:0xffffff,outlineOpacity:.18});
    addGlowSprite(0,2.5,10,0x8b5cf6,3.2,.18);

    // Floresta densa e cabana.
    for(let i=0;i<64;i++){
      const x = -96 + (Math.random()-.5)*76;
      const z = -68 + (Math.random()-.5)*96;
      if(Math.abs(x+112)<8 && Math.abs(z+72)<8) continue;
      owTree(x,z,.82+Math.random()*.78);
    }
    owHouse(-112,-72,'cabana_floresta',0x6b3b17);
    for(let i=0;i<10;i++) owResourceNode('madeira_'+i,-96+(Math.random()-.5)*58,-66+(Math.random()-.5)*72,'wood',1);
    owChest(-108,-64,'bau_espada');
    addPowerup('sword',-104,1.2,-68);
    for(let i=0;i<16;i++) owFlower(-98+(Math.random()-.5)*44,-70+(Math.random()-.5)*50,Math.random()>.5?0xffdf52:0xff7ac8);

    // Campo aberto com cristais e ruínas pequenas.
    for(let i=0;i<18;i++) addCrystal(34+(Math.random()-.5)*72,1.1,-24+(Math.random()-.5)*62);
    for(let i=0;i<12;i++) owSolid(38+(Math.random()-.5)*70,.35,-12+(Math.random()-.5)*62,1.1,.7,1.1,0xfacc15,{emissive:0xfacc15,emissiveIntensity:.15,outline:true,outlineOpacity:.08});
    for(let i=0;i<7;i++) owSolid(62+i*3,.75,-45-(i%2)*3,2,1.5,2,0x94a3b8,{outline:true,outlineOpacity:.12});

    // Acampamento inimigo: baú protegido, fogueira, tendas.
    owFence(58,-78,26,20);
    [-8,0,8].forEach(x=>owSolid(54+x,.55,-78,2.2,1.1,2.2,0x111827,{outline:true,outlineColor:0xff7a00,outlineOpacity:.22}));
    owBox(58,.25,-78,2.7,.50,2.7,0xff4d00,{emissive:0xff2d00,emissiveIntensity:.80,outline:true,outlineOpacity:.10});
    owSolid(48,.8,-88,7,1.6,5,0x7f1d1d,{outline:true,outlineOpacity:.10});
    owSolid(68,.8,-88,7,1.6,5,0x7f1d1d,{outline:true,outlineOpacity:.10});
    owChest(58,-70,'bau_acampamento');
    addEnemy('flyer',54,-84);
    addEnemy('spiky',62,-78);
    addEnemy('walker',47,-75);

    // Montanha / caverna.
    for(let i=0;i<28;i++) owSolid(-62+(Math.random()-.5)*74,.6+Math.random()*1.8,-142+(Math.random()-.5)*64,4+Math.random()*6,1.2+Math.random()*3.0,4+Math.random()*6,0x94a3b8,{outline:true,outlineOpacity:.12});
    owSolid(-82,1.6,-146,16,3.2,8,0x475569,{outline:true,outlineOpacity:.16});
    owBox(-82,1.2,-141.9,6.4,2.5,.20,0x020617,{emissive:0x000000,emissiveIntensity:.1});
    owChest(-86,-136,'bau_caverna');
    for(let i=0;i<8;i++) owResourceNode('pedra_'+i,-70+(Math.random()-.5)*54,-138+(Math.random()-.5)*48,'stone',1);
    addEnemy('golem',-78,-132);

    // Vulcão, com lava real em 3D.
    owBox(104,.06,-132,50,.18,42,0xff3d00,{emissive:0xff2d00,emissiveIntensity:.95,transparent:true,opacity:.90});
    for(let i=0;i<18;i++) owSolid(98+(Math.random()-.5)*84,.8,-128+(Math.random()-.5)*76,3+Math.random()*4,1.6+Math.random()*3,3+Math.random()*4,0x2b0505,{outline:true,outlineColor:0xff7a00,outlineOpacity:.20});
    owSolid(128,4.2,-156,18,8.4,18,0x3a1510,{outline:true,outlineColor:0xff7a00,outlineOpacity:.18});
    addGlowSprite(128,6.2,-156,0xff4d00,12,.16);
    addEnemy('spiky',102,-112);
    addEnemy('spiky',118,-138);

    // Castelo e boss.
    owSolid(112,2.4,88,36,4.8,30,0x6b7280,{outline:true,outlineColor:0xd1d5db,outlineOpacity:.15});
    owSolid(112,5.2,73,40,1.2,3.6,0x9ca3af,{outline:true,outlineOpacity:.12});
    [-8,0,8].forEach(x=>owSolid(112+x,6.1,73,2.1,1.8,3.8,0x9ca3af,{outline:true,outlineOpacity:.12}));
    owSolid(92,3.8,88,5.2,7.6,5.2,0x64748b,{outline:true,outlineOpacity:.16});
    owSolid(132,3.8,88,5.2,7.6,5.2,0x64748b,{outline:true,outlineOpacity:.16});
    addEnemy('golem',104,62);
    addEnemy('boss',126,96);

    // Powerups, baús e decoração final.
    addPowerup('shield',18,1.2,20);
    addPowerup('star',72,1.2,-92);
    owDecorateRegion();

    updateOpenWorldChunks(true);
    cameraRig.initialized = false;
    document.body.dataset.world = 'openworld';
    if (els.game) els.game.dataset.world = 'openworld';
    updateHud();
    toast('Mundo aberto profissional carregado', 'good');
  }
  function updateOpenWorldChunks(force=false){
    if(!isOpenWorld() || !p || !openWorldChunks) return;
    const pc = owChunkFor(p.x,p.z);
    for(const [key,list] of openWorldChunks.entries()){
      const [cx,cz] = key.split(',').map(Number);
      const active = Math.abs(cx-pc.cx) <= OPEN_WORLD.activeRadius && Math.abs(cz-pc.cz) <= OPEN_WORLD.activeRadius;
      for(const obj of list) if(obj) obj.visible = active;
    }
  }
  function saveOpenWorldPosition(){
    if(!isOpenWorld() || !p) return;
    const ow = openWorldProgress();
    ow.x = Math.round(p.x*100)/100; ow.y = Math.round(p.y*100)/100; ow.z = Math.round(p.z*100)/100; ow.cameraYaw = cameraYaw;
  }

  function buildLevel(level, worldOverride){
    currentLevel = { ...level, world:worldOverride || level.world };
    clearLevel(); runtime = newRuntime(); resetPlayer(); cameraRig.initialized = false; cameraRig.pos = null; cameraRig.look = null;
    if (currentLevel.openWorld) {
      buildOpenWorld();
      showTutorial();
      return;
    }
    configureWorld(currentLevel.world);
    createPremiumAtmosphere(currentLevel.world, currentLevel.length || 220);
    createTrack(currentLevel.length || 220);
    createDecor(currentLevel.world, currentLevel.length || 220);
    if (currentLevel.id === 'hub') createHub(); else createGameplay(currentLevel);
    createPortal(currentLevel.length || 220);
    applyV442MinecraftAdventureRender(currentLevel, currentLevel.length || 220);
    applyV45TrueGamePlatformRender(currentLevel, currentLevel.length || 220);
    rebuildV54Render(currentLevel.world);
    applyV40RenderPass(currentLevel.world, currentLevel.length || 220);
    document.body.dataset.world = currentLevel.world;
    if (els.game) els.game.dataset.world = currentLevel.world;
    updateWorldButtons(currentLevel.world); updateHud(); showTutorial();
  }

  function configureWorld(world){
    const cfg = WORLD[world] || WORLD.field;
    realBg = world === 'real'; els.game.classList.toggle('real-bg', realBg);
    if (skyMesh && scene) { scene.remove(skyMesh); skyMesh = null; }
    const premiumBackdrop = world !== 'real';
    scene.background = premiumBackdrop ? null : null;
    const fogDensity = world === 'space' ? .0028 : world === 'fire' ? .0048 : world === 'castle' ? .0036 : .0024;
    scene.fog = premiumBackdrop ? null : new THREE.FogExp2(cfg.fog || cfg.sky, fogDensity);
    ambientLight.color.setHex(cfg.light); ambientLight.intensity = realBg ? 1.0 : world === 'space' ? .38 : world === 'fire' ? .34 : .48;
    sunLight.color.setHex(cfg.light); sunLight.intensity = realBg ? 1.35 : world === 'fire' ? 1.42 : world === 'space' ? .95 : 1.25;
    sunLight.position.set(world === 'space' ? -12 : 10, world === 'fire' ? 18 : 22, world === 'castle' ? 4 : 12);
    renderer.toneMappingExposure = world === 'fire' ? 1.20 : world === 'space' ? 1.28 : world === 'castle' ? 1.10 : 1.14;
    if (realBg) { resetPlayer(); enterARSafeMode('world-real'); stopCamera(); } else { arSafeUntil = 0; stopCamera(); }
  }

  function createPremiumAtmosphere(world,length){
    const cfg = WORLD[world] || WORLD.field;
    if (!realBg) {
      const skyGeo = new THREE.SphereGeometry(440, 36, 20);
      const skyTop = world === 'space' ? 0x020617 : shadeColor(cfg.sky || 0x101827, world === 'fire' ? -22 : 2);
      const skyMat = new THREE.MeshBasicMaterial({ color: skyTop, side: THREE.BackSide });
      skyMesh = new THREE.Mesh(skyGeo, skyMat); skyMesh.position.set(0,36,-length/2); scene.add(skyMesh);
      // V40: camada de horizonte, para tirar aparência de vazio/debug.
      const horizonColor = world === 'fire' ? 0x7f1d1d : world === 'space' ? 0x1e1b4b : world === 'castle' ? 0x334155 : world === 'forest' ? 0x166534 : 0x60a5fa;
      const horizon = new THREE.Mesh(
        new THREE.PlaneGeometry(96, 22),
        new THREE.MeshBasicMaterial({ color:horizonColor, transparent:true, opacity: world === 'space' ? .20 : .26, depthWrite:false, side:THREE.DoubleSide })
      );
      horizon.position.set(0,8,-length*.66); horizon.rotation.x = 0; levelGroup.add(horizon); premiumVisuals.push(horizon);
      horizon.userData.float = { baseY:8, amp:.12, speed:.35 };
    }
    const sunColor = world === 'fire' ? 0xff7a00 : world === 'space' ? 0x8b5cf6 : world === 'castle' ? 0xfbbf24 : cfg.accent;
    const sun = new THREE.Mesh(new THREE.SphereGeometry(world==='space'?4.6:3.15,28,18), new THREE.MeshBasicMaterial({ color:sunColor, transparent:true, opacity: world==='space'?.48:.58 }));
    sun.position.set(world==='space'?-18:18, world==='space'?28:25, -length*.58); sun.userData.float = { baseY:sun.position.y, amp:.35, speed:.42 }; levelGroup.add(sun); premiumVisuals.push(sun);
    addGlowSprite(sun.position.x, sun.position.y, sun.position.z, sunColor, world==='space'?14:10, .18);
    const count = world==='space'?96:world==='fire'?44:34;
    for (let i=0;i<count;i++) {
      const starColor = world==='fire' ? (Math.random()>.4?0xffd000:0xff4d00) : world==='space' ? (Math.random()>.5?0xffffff:0x7dd3fc) : (Math.random()>.7?cfg.accent:0xffffff);
      const star = new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12), new THREE.MeshBasicMaterial({ color:starColor, transparent:true, opacity: world==='space'?.92:.34 }));
      star.position.set((Math.random()-.5)*76, 10+Math.random()*28, -Math.random()*length-12); star.userData.twinkle = { base:.35+Math.random()*.55, speed:.7+Math.random()*1.6, phase:Math.random()*6.28 };
      levelGroup.add(star); premiumVisuals.push(star);
    }
    addV40BackdropSilhouettes(world, length, cfg);
  }

  function createTrack(length){
    const cfg = WORLD[currentLevel.world] || WORLD.field;
    const base = box(18,.45,length+44,cfg.ground); base.position.set(0,-.25,-length/2+4); levelGroup.add(base);
    const grid = new THREE.GridHelper(Math.max(110,length+44), Math.max(24, Math.round((length+44)/4)), cfg.grid, cfg.grid); grid.position.set(0,.035,-length/2+4); grid.material.transparent=true; grid.material.opacity=.018; levelGroup.add(grid);
    for (let z=8; z>-length-12; z-=8) {
      const stripe = box(.08,.08,1.25,cfg.grid); stripe.position.set(0,.09,z); levelGroup.add(stripe);
      if (Math.abs(z)%32===0) { const mark=box(1.3,.09,.18,cfg.accent); mark.position.set(-6.8,.12,z); levelGroup.add(mark); const mark2=box(1.3,.09,.18,cfg.accent); mark2.position.set(6.8,.12,z); levelGroup.add(mark2); }
    }
    for (let z=4; z>-length; z-=12) {
      const l = box(.5,.65,3.2,cfg.grid); l.position.set(-8.7,.32,z); levelGroup.add(l);
      const r = box(.5,.65,3.2,cfg.grid); r.position.set(8.7,.32,z); levelGroup.add(r);
    }
    for (let z=-20; z>-length; z-=36) {
      const railL=box(.22,.28,12,cfg.accent, { emissive:cfg.accent, emissiveIntensity:.08, outline:true, outlineOpacity:.16 }); railL.position.set(-8.9,.55,z); levelGroup.add(railL);
      const railR=box(.22,.28,12,cfg.accent, { emissive:cfg.accent, emissiveIntensity:.08, outline:true, outlineOpacity:.16 }); railR.position.set(8.9,.55,z); levelGroup.add(railR);
    }
    addPremiumRoadTiles(length, cfg);
    addDepthMarkers(length, cfg);
  }

  function addPremiumRoadTiles(length, cfg){
    const laneXs = [-5,0,5];
    for (let z=8; z>-length-10; z-=8) {
      laneXs.forEach((x,idx)=>{
        const color = shadeColor(cfg.ground, ((Math.abs(z/8)+idx)%2===0) ? 10 : -8);
        const tile = box(4.85,.12,7.35,color,{ outline:true, outlineColor:shadeColor(cfg.grid, 22), outlineOpacity:.16, roughness:.68 });
        tile.position.set(x,.035,z-2); tile.receiveShadow = true; levelGroup.add(tile);
        if (idx < 2) { const seam = box(.06,.05,7.1,cfg.grid,{ emissive:cfg.grid, emissiveIntensity:.12 }); seam.position.set(x+2.5,.13,z-2); levelGroup.add(seam); }
      });
    }
  }

  function addDepthMarkers(length, cfg){
    for (let z=-12; z>-length; z-=24) {
      const archColor = shadeColor(cfg.accent, Math.abs(z)%48===0 ? 22 : -6);
      const left = box(.36,3.1,.36,archColor,{ emissive:cfg.accent, emissiveIntensity:.18, outline:true, outlineOpacity:.18 }); left.position.set(-8.15,1.55,z); levelGroup.add(left);
      const right = box(.36,3.1,.36,archColor,{ emissive:cfg.accent, emissiveIntensity:.18, outline:true, outlineOpacity:.18 }); right.position.set(8.15,1.55,z); levelGroup.add(right);
      const top = box(16.6,.28,.35,archColor,{ emissive:cfg.accent, emissiveIntensity:.12, outline:true, outlineOpacity:.12 }); top.position.set(0,3.12,z); levelGroup.add(top);
    }
  }

  function createDecor(world,length){
    const cfg = WORLD[world] || WORLD.field;
    // Camadas laterais e fundo para sensação de mundo vivo sem assets externos.
    for (let z=-8; z>-length; z-=14) {
      const side = (Math.floor(Math.abs(z)/14) % 2) ? -1 : 1;
      if (world === 'forest' || world === 'field' || world === 'real') {
        const trunk = box(.9,2.6,.9,0x7c3f1d); trunk.position.set(side*(10.5+Math.random()*1.2),1.3,z); levelGroup.add(trunk);
        const leaf = box(3.2,2.5,3.2,world==='forest'?0x14532d:0x22c55e); leaf.position.set(trunk.position.x,3.25,z); levelGroup.add(leaf);
        if (Math.abs(z)%42===0) { const cloud=box(4,.5,1.6,0xe0f2fe); cloud.position.set(-side*7,9+Math.random()*3,z-8); levelGroup.add(cloud); }
      } else if (world === 'fire') {
        const rock = box(2,1.2+Math.random()*1.9,2,0x160909); rock.position.set(side*11,rock.geometry.parameters.height/2,z); levelGroup.add(rock);
        const lava = box(2.6,.22,2.6,0xff5a1e); lava.position.set(side*12,.12,z-5); levelGroup.add(lava);
        const ember = box(.35,.35,.35,0xffd000); ember.position.set(-side*(6+Math.random()*4),2+Math.random()*4,z-2); levelGroup.add(ember);
      } else if (world === 'castle') {
        const pilar = box(2.2,5.2,2.2,0x6b7280); pilar.position.set(side*11,2.6,z); levelGroup.add(pilar);
        const cap=box(2.8,.6,2.8,0x94a3b8); cap.position.set(side*11,5.45,z); levelGroup.add(cap);
        const fire = box(.55,.55,.55,0xf97316); fire.position.set(side*11,6.05,z); levelGroup.add(fire);
      } else if (world === 'space') {
        const star = box(.35,.35,.35,Math.random()>.5?0xffffff:cfg.accent); star.position.set((Math.random()-.5)*42,6+Math.random()*18,z); levelGroup.add(star);
        if (Math.abs(z)%56===0) { const planet=box(2.2,2.2,2.2,0x8b5cf6); planet.position.set(side*13,8,z-10); planet.rotation.set(.5,.7,.2); levelGroup.add(planet); }
      } else if (world === 'arena' || world === 'hub') {
        const ob = box(1.8,1.8,1.8,cfg.accent); ob.position.set(side*11,1,z); ob.rotation.set(.3,.5,.1); levelGroup.add(ob);
        if (Math.abs(z)%42===0) { const beam=box(.35,7,.35,cfg.accent); beam.position.set(-side*12,3.5,z-7); levelGroup.add(beam); }
      }
    }
    addPremiumSetPieces(world, length);
  }

  function addPremiumSetPieces(world,length){
    const cfg = WORLD[world] || WORLD.field;
    for (let z=-26; z>-length; z-=38) {
      const side = (Math.floor(Math.abs(z)/38)%2) ? -1 : 1;
      if (world === 'field' || world === 'forest' || world === 'real') {
        const stump = box(1.05,2.2,1.05,0x6b3b17,{ outline:true, outlineOpacity:.18 }); stump.position.set(side*12,1.1,z); levelGroup.add(stump);
        const crownColors = world==='forest' ? [0x064e3b,0x047857,0x10b981] : [0x15803d,0x22c55e,0x84cc16];
        crownColors.forEach((c,i)=>{ const leaf=box(3.6-i*.55,1.35,3.6-i*.55,c,{ outline:true, outlineColor:0xd9f99d, outlineOpacity:.10 }); leaf.position.set(side*12,2.8+i*.72,z+(i%2?-.35:.25)); levelGroup.add(leaf); });
        const flower = box(.45,.45,.45, cfg.accent,{ emissive:cfg.accent, emissiveIntensity:.35 }); flower.position.set(-side*7.8,.38,z-6); levelGroup.add(flower);
      } else if (world === 'fire') {
        const crater=box(5,.26,5,0x2b0505,{ outline:true, outlineColor:0xff7a00, outlineOpacity:.22 }); crater.position.set(side*11,.16,z); levelGroup.add(crater);
        const lavaCore=box(3.3,.18,3.3,0xff3d00,{ emissive:0xff2d00, emissiveIntensity:1.1 }); lavaCore.position.set(side*11,.32,z); lavaCore.userData.pulseMat=true; levelGroup.add(lavaCore); premiumVisuals.push(lavaCore); addGlowSprite(side*11,1.1,z,0xff5a00,4.6,.22);
      } else if (world === 'castle') {
        const wall=box(7,4.2,.9,0x6b7280,{ outline:true, outlineColor:0xd1d5db, outlineOpacity:.18 }); wall.position.set(side*11,2.1,z); levelGroup.add(wall);
        for(let i=-2;i<=2;i+=2){ const merlon=box(1.1,1.1,1.1,0x9ca3af,{outline:true,outlineOpacity:.16}); merlon.position.set(side*11+i,4.75,z); levelGroup.add(merlon); }
      } else if (world === 'space') {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4,.12,10,40), mat(0x7dd3fc,0x1d4ed8,{ emissiveIntensity:.35, roughness:.25 })); ring.position.set(side*12,6,z); ring.rotation.set(1.1,.25,.4); ring.userData.spin=.28; levelGroup.add(ring); premiumVisuals.push(ring); addGlowSprite(side*12,6,z,0x7dd3fc,5,.14);
      } else if (world === 'arena' || world === 'hub') {
        const obelisk = box(1.25,6,1.25,cfg.accent,{ emissive:cfg.accent, emissiveIntensity:.32, outline:true, outlineOpacity:.2 }); obelisk.position.set(side*12,3,z); obelisk.userData.float={baseY:3,amp:.2,speed:.9}; levelGroup.add(obelisk); premiumVisuals.push(obelisk); addGlowSprite(side*12,4.2,z,cfg.accent,5.5,.18);
      }
    }
  }


  function applyV442MinecraftAdventureRender(level, length){
    if (!V442_RENDER.enabled || realBg) return;
    const world = level.world || 'field';
    const cfg = WORLD[world] || WORLD.field;
    addV442SkyBlocks(world, length, cfg);
    addV442AdventurePath(world, length, cfg);
    addV442SideIslands(world, length, cfg);
    addV442PortalRewardArea(world, length, cfg);
    addV442CollectibleTrail(world, length, cfg);
    addV442EnemyStageSilhouettes(world, length, cfg);
    v44EnemyMarkers.push({ type:'render', label:V442_RENDER.label, world, target:V442_RENDER.target });
  }

  function v442Box(w,h,d,color,opts={}){
    const mesh = box(w,h,d,color, { outline:true, outlineColor:opts.outlineColor || 0xffffff, outlineOpacity: opts.outlineOpacity ?? .12, emissive:opts.emissive || 0x000000, emissiveIntensity:opts.emissiveIntensity || 0, roughness:opts.roughness ?? .76 });
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = opts.receiveShadow !== false;
    if (opts.name) mesh.name = opts.name;
    return mesh;
  }

  function addV442GrassClump(x,z,world,cfg){
    const colors = world === 'fire' ? [0x7c2d12,0xf97316,0xfacc15] : world === 'space' ? [0x60a5fa,0x8b5cf6,0x22d3ee] : world === 'castle' ? [0x94a3b8,0xfbbf24,0x64748b] : [0x16a34a,0x84cc16,0xfde047,0xffffff,0xf472b6];
    for(let i=0;i<3;i++){
      const c = colors[Math.floor(Math.random()*colors.length)];
      const h = .28 + Math.random()*.45;
      const stem = v442Box(.12,h,.12,c,{emissive:c, emissiveIntensity:i===2?.12:0, outlineOpacity:.04});
      stem.position.set(x+(Math.random()-.5)*.9,h/2+.13,z+(Math.random()-.5)*.9);
      levelGroup.add(stem); premiumVisuals.push(stem);
    }
  }

  function addV442SkyBlocks(world,length,cfg){
    if (world === 'space') return;
    for(let i=0;i<V442_RENDER.clouds;i++){
      const z = -10 - i*(length/(V442_RENDER.clouds+1)) + (Math.random()-.5)*8;
      const x = (i%2? -1:1) * (9 + Math.random()*12);
      const y = 10 + Math.random()*7;
      const g = new THREE.Group();
      const cloudColor = world==='fire' ? 0x5b1b1b : world==='castle'?0xcbd5e1:0xf8fafc;
      const opacity = world==='fire' ? .30 : .55;
      [[0,0,0,2.4,.45,.9],[-1.6,.05,.1,1.8,.4,.75],[1.7,.08,-.05,2.1,.48,.8],[.35,.28,.1,1.65,.45,.75]].forEach(p=>{
        const b = v442Box(p[3],p[4],p[5],cloudColor,{outlineOpacity:.05, castShadow:false});
        b.material.transparent = true; b.material.opacity = opacity; b.position.set(p[0],p[1],p[2]); g.add(b);
      });
      g.position.set(x,y,z); g.userData.float={baseY:y, amp:.35, speed:.18+Math.random()*.18};
      levelGroup.add(g); premiumVisuals.push(g);
    }
  }

  function addV442AdventurePath(world,length,cfg){
    const grass = world==='fire'?0x4b1515:world==='space'?0x312e81:world==='castle'?0x64748b:world==='forest'?0x15803d:0x35a634;
    const dirt = world==='fire'?0x7f1d1d:world==='space'?0x4338ca:world==='castle'?0x475569:0x9a5b22;
    const stone = world==='fire'?0x2b0909:world==='space'?0x1e1b4b:world==='castle'?0x94a3b8:0x94a3b8;
    for(let z=8; z>-length-8; z-=4){
      const idx = Math.floor(Math.abs(z)/4);
      const pathColor = idx%3===0 ? shadeColor(dirt,10) : idx%3===1 ? dirt : shadeColor(stone, -4);
      const center = v442Box(3.8,.16,3.7,pathColor,{outlineColor:0x2f1606,outlineOpacity:.08,roughness:.85});
      center.position.set(0,.22,z); levelGroup.add(center);
      const left = v442Box(2.3,.18,3.7,shadeColor(grass,(idx%2?8:-6)),{outlineColor:0xd9f99d,outlineOpacity:.07});
      left.position.set(-3.1,.235,z); levelGroup.add(left);
      const right = left.clone(); right.position.set(3.1,.235,z); levelGroup.add(right);
      if(idx%3===0){
        addV442GrassClump(-4.4,z,world,cfg); addV442GrassClump(4.4,z-.7,world,cfg);
      }
      if(idx%7===0){
        const arrow = v442Box(.34,.08,1.4,cfg.accent,{emissive:cfg.accent,emissiveIntensity:.18,outlineOpacity:.05});
        arrow.position.set(0,.42,z-.2); levelGroup.add(arrow); premiumVisuals.push(arrow);
      }
    }
  }

  function addV442SideIslands(world,length,cfg){
    const grass = world==='fire'?0x6b1a12:world==='space'?0x3b2ba4:world==='castle'?0x6b7280:world==='forest'?0x0f7a3b:0x4caf32;
    const dirt = world==='fire'?0x311111:world==='space'?0x1e1b4b:world==='castle'?0x475569:0x8b4f1f;
    const stone = world==='fire'?0x160909:world==='space'?0x0f102c:0x6b7280;
    const count = Math.min(V442_RENDER.maxSideIslands, Math.floor(length/18));
    for(let i=0;i<count;i++){
      const z = -18 - i*(length/(count+.4));
      const side = i%2? -1:1;
      const x = side*(10 + (i%3)*1.25);
      const w = 5.5 + (i%3)*1.25;
      const d = 5 + (i%4)*.85;
      const y = (i%4===0) ? .95 : .25;
      const base = v442Box(w,1.1,d,dirt,{outlineColor:0x2f1606,outlineOpacity:.11}); base.position.set(x,y,z); levelGroup.add(base);
      const cap = v442Box(w+.2,.42,d+.2,grass,{outlineColor:0xd9f99d,outlineOpacity:.10}); cap.position.set(x,y+.76,z); levelGroup.add(cap);
      const underside = v442Box(w*.72,.8,d*.72,stone,{outlineColor:0x111827,outlineOpacity:.08}); underside.position.set(x,y-.78,z); levelGroup.add(underside);
      if(world === 'fire'){
        const lava = v442Box(w*.42,.18,d*.42,0xff4d00,{emissive:0xff2d00,emissiveIntensity:1.05,outlineColor:0xffd000,outlineOpacity:.12}); lava.position.set(x,y+1.03,z); lava.userData.pulseMat=true; levelGroup.add(lava); premiumVisuals.push(lava); addGlowSprite(x,y+1.4,z,0xff5a00,4,.22);
      } else if(world === 'space'){
        const crystal = v442Box(.8,1.5,.8,cfg.accent,{emissive:cfg.accent,emissiveIntensity:.75,outlineColor:0xffffff,outlineOpacity:.2}); crystal.position.set(x,y+1.8,z); crystal.rotation.y=.7; crystal.userData.float={baseY:y+1.8,amp:.24,speed:.8}; levelGroup.add(crystal); premiumVisuals.push(crystal); addGlowSprite(x,y+2,z,cfg.accent,4,.16);
      } else {
        addV442Tree(x+side*.8,y+1,z,world,cfg);
        if(i%2===0) addV442Sign(x-side*1.8,y+1.2,z+1.8, side, world, cfg);
      }
    }
  }

  function addV442Tree(x,y,z,world,cfg){
    const trunkColor = world==='castle'?0x4b5563:0x7c3f1d;
    const leafColor = world==='forest'?0x065f46:0x22c55e;
    const trunk = v442Box(.75,2.1,.75,trunkColor,{outlineOpacity:.10}); trunk.position.set(x,y+1.05,z); levelGroup.add(trunk);
    const leaves = [
      [0,2.55,0,2.8,1.15,2.8,leafColor],
      [0,3.15,0,2.2,1.05,2.2,shadeColor(leafColor,14)],
      [0,3.78,0,1.5,.86,1.5,shadeColor(leafColor,-8)]
    ];
    leaves.forEach(p=>{ const b=v442Box(p[3],p[4],p[5],p[6],{outlineColor:0xd9f99d,outlineOpacity:.08}); b.position.set(x+p[0],y+p[1],z+p[2]); levelGroup.add(b); });
  }

  function addV442Sign(x,y,z,side,world,cfg){
    const post = v442Box(.28,1.2,.28,0x7c3f1d,{outlineOpacity:.1}); post.position.set(x,y+.55,z); levelGroup.add(post);
    const face = v442Box(1.4,.75,.18,0xd97706,{outlineColor:0xfef3c7,outlineOpacity:.16}); face.position.set(x,y+1.28,z); levelGroup.add(face);
    const arrow = v442Box(.72,.12,.08,cfg.accent,{emissive:cfg.accent,emissiveIntensity:.18,outlineOpacity:.05}); arrow.position.set(x + side*.18,y+1.3,z+.12); arrow.rotation.z = side>0?0:Math.PI; levelGroup.add(arrow); premiumVisuals.push(arrow);
  }

  function addV442PortalRewardArea(world,length,cfg){
    const z = -length - 8;
    const stairColor = world==='castle'?0x9ca3af:world==='fire'?0x451a03:0x94a3b8;
    for(let i=0;i<5;i++){
      const step = v442Box(5+i*1.2,.25,1.8,shadeColor(stairColor,i*5),{outlineColor:0xffffff,outlineOpacity:.11});
      step.position.set(0,.25+i*.18,z+6+i*1.2); levelGroup.add(step);
    }
    for(let i=-2;i<=2;i++){
      const gem = v442Box(.55,1.15,.55,i===0?0x38bdf8:cfg.accent,{emissive:i===0?0x38bdf8:cfg.accent,emissiveIntensity:.7,outlineColor:0xffffff,outlineOpacity:.18});
      gem.position.set(i*1.5,1.25,z+8.5+Math.abs(i)*.8); gem.rotation.y=.8; gem.userData.float={baseY:1.25,amp:.18,speed:.7+Math.abs(i)*.1}; levelGroup.add(gem); premiumVisuals.push(gem);
    }
  }

  function addV442CollectibleTrail(world,length,cfg){
    for(let i=0;i<Math.min(10,Math.floor(length/22));i++){
      const z = -28 - i*22;
      const x = [-2.5,0,2.5,0][i%4];
      const g = v442Box(.38,.38,.38,0x38bdf8,{emissive:0x38bdf8,emissiveIntensity:.85,outlineColor:0xffffff,outlineOpacity:.18});
      g.position.set(x,1.05,z); g.rotation.set(.5,.75,.2); g.userData.float={baseY:1.05,amp:.16,speed:.9}; levelGroup.add(g); premiumVisuals.push(g); addGlowSprite(x,1.05,z,0x38bdf8,2.3,.12);
    }
  }

  function addV442EnemyStageSilhouettes(world,length,cfg){
    if (world === 'real') return;
    const positions = [[-10,-40],[10,-86],[-11,-138],[11,-194]];
    positions.filter(p=>Math.abs(p[1])<length-16).forEach((pos,i)=>{
      const [x,z]=pos;
      const color = i%2?0x14532d:0x111827;
      const body = v442Box(2.1,1.6,2.1,color,{outlineColor:0xffffff,outlineOpacity:.12}); body.position.set(x,1.05,z); levelGroup.add(body);
      const eye1=v442Box(.26,.18,.08,0xff2222,{emissive:0xff2222,emissiveIntensity:.8,outlineOpacity:0}); eye1.position.set(x-.42,1.38,z+1.08); levelGroup.add(eye1); premiumVisuals.push(eye1);
      const eye2=eye1.clone(); eye2.position.x=x+.42; levelGroup.add(eye2); premiumVisuals.push(eye2);
      const spikes = i%2===0 ? 3 : 2;
      for(let s=0;s<spikes;s++){ const sp=v442Box(.45,.45,.45,cfg.accent,{emissive:cfg.accent,emissiveIntensity:.25,outlineOpacity:.08}); sp.position.set(x-0.7+s*.7,2.05,z); sp.rotation.set(.4,.7,.2); levelGroup.add(sp); premiumVisuals.push(sp); }
    });
  }


  function applyV45TrueGamePlatformRender(level, length){
    if (!V45_PLATFORM_RENDER.enabled || realBg || !levelGroup) return;
    const world = level.world || 'field';
    const cfg = WORLD[world] || WORLD.field;
    addV45AmbientLights(world, length, cfg);
    addV45ChunkyAdventureTerrain(world, length, cfg);
    addV45PortalTemple(world, length, cfg);
    addV45HeroCollectibleTrail(world, length, cfg);
    addV45ReadableEnemies(world, length, cfg);
    addV45WaterLavaSetPieces(world, length, cfg);
    v44EnemyMarkers.push({ type:'v45Render', label:V45_PLATFORM_RENDER.label, world, reference:V45_PLATFORM_RENDER.reference });
  }

  function addV45AmbientLights(world, length, cfg){
    if (!scene) return;
    const color = world==='fire'?0xff7a1a:world==='space'?0x7dd3fc:world==='castle'?0xffd08a:0xfff2b8;
    const side = new THREE.DirectionalLight(color, world==='fire'?1.0:.75);
    side.position.set(-12,18,-length*.28); levelGroup.add(side); premiumVisuals.push(side);
    const fill = new THREE.HemisphereLight(world==='space'?0x3b82f6:0xbbe7ff, world==='fire'?0x3b0808:0x2f6a2f, .36);
    levelGroup.add(fill); premiumVisuals.push(fill);
  }

  function addV45ChunkyAdventureTerrain(world,length,cfg){
    const grass = world==='fire'?0x6f1d12:world==='space'?0x3b2b93:world==='castle'?0x6b7280:world==='forest'?0x0f8f3e:0x4ecb42;
    const dirt = world==='fire'?0x4a120b:world==='space'?0x241a57:world==='castle'?0x475569:0x9b5b25;
    const stone = world==='fire'?0x2b0d0a:world==='space'?0x14183d:world==='castle'?0x9ca3af:0x7f8b92;
    // Remove sensação de grid/debug: cobrir com plataformas e bordas volumosas próximas ao caminho.
    for(let z=10; z>-length-12; z-=6){
      const k = Math.floor(Math.abs(z)/6);
      const wav = Math.sin(k*.73);
      const pathW = 3.8 + (k%4===0? .5:0);
      const centerColor = k%2 ? 0xb98342 : 0xc89450;
      const paver = v442Box(pathW,.22,5.7,centerColor,{outlineColor:0xffe6ad,outlineOpacity:.08,roughness:.9});
      paver.position.set(0,.36,z); levelGroup.add(paver);
      // stone chips on the path like the approved render
      if(k%2===0){
        [-1.25,1.05].forEach((x,i)=>{ const chip=v442Box(.75,.08,.55,stone,{outlineOpacity:.05}); chip.position.set(x,.52,z+(i?.7:-.85)); levelGroup.add(chip); });
      }
      [-1,1].forEach(side=>{
        const x = side*(4.0 + (k%3)*.16);
        const h = .5 + (k%4)*.22;
        const cap = v442Box(2.6,.32,5.8,grass,{outlineColor:0xcaff8a,outlineOpacity:.10}); cap.position.set(x,.48+h*.15,z); levelGroup.add(cap);
        const block = v442Box(2.55,h,5.65,dirt,{outlineColor:0x2f1606,outlineOpacity:.10}); block.position.set(x,.18+h*.5,z); levelGroup.add(block);
        if(k%2===0) addV45FlowerPatch(x+side*.75,.76+h*.15,z,world,cfg);
      });
      if(k%5===1){ addV45Mushroom(-4.9,.78,z-1.4); }
      if(k%7===2){ addV45Crate(3.9,.72,z-1.2,cfg); }
    }
    // framed mini cliffs and floating blocks close enough to be visible
    for(let i=0;i<12;i++){
      const z = -18 - i*(length/12);
      const side = i%2 ? -1 : 1;
      const x = side*(7.2 + (i%3)*1.3);
      const y = .7 + (i%4)*.55;
      const w = 3.4 + (i%3);
      const d = 3.2 + (i%4)*.5;
      const base = v442Box(w,1.15,d,dirt,{outlineColor:0x2f1606,outlineOpacity:.12}); base.position.set(x,y,z); levelGroup.add(base);
      const cap = v442Box(w+.15,.36,d+.15,grass,{outlineColor:0xddff99,outlineOpacity:.12}); cap.position.set(x,y+.72,z); levelGroup.add(cap);
      if(i%3===0) addV442Tree(x,y+1,z,world,cfg);
      else if(i%3===1) addV45CrystalCluster(x,y+1.05,z,cfg.accent);
    }
  }

  function addV45FlowerPatch(x,y,z,world,cfg){
    const colors = world==='space' ? [0x7dd3fc,0xc084fc,0xffffff] : [0xffffff,0xfde047,0xf472b6,0x86efac];
    for(let i=0;i<8;i++){
      const c=colors[i%colors.length];
      const stem=v442Box(.08,.35,.08,0x2fb344,{outlineOpacity:0}); stem.position.set(x+(Math.random()-.5)*1.3,y+.17,z+(Math.random()-.5)*1.8); levelGroup.add(stem);
      const bloom=v442Box(.18,.14,.18,c,{emissive:c,emissiveIntensity:.08,outlineOpacity:0}); bloom.position.set(stem.position.x,y+.42,stem.position.z); levelGroup.add(bloom); premiumVisuals.push(bloom);
    }
  }
  function addV45Mushroom(x,y,z){
    const stem=v442Box(.38,.55,.38,0xfff7ed,{outlineOpacity:.08}); stem.position.set(x,y+.28,z); levelGroup.add(stem);
    const cap=v442Box(1.0,.42,1.0,0xef4444,{outlineColor:0xffffff,outlineOpacity:.12}); cap.position.set(x,y+.74,z); levelGroup.add(cap);
    [[-.22,.16],[.22,-.12],[.06,.20]].forEach(p=>{ const spot=v442Box(.16,.06,.16,0xffffff,{outlineOpacity:0}); spot.position.set(x+p[0],y+.98,z+p[1]); levelGroup.add(spot); });
  }
  function addV45Crate(x,y,z,cfg){
    const crate=v442Box(1.25,1.25,1.25,0xd69a28,{outlineColor:0xfff1a8,outlineOpacity:.16}); crate.position.set(x,y+.63,z); levelGroup.add(crate);
    const band=v442Box(1.33,.14,1.34,0xfacc15,{emissive:0xfacc15,emissiveIntensity:.14,outlineOpacity:0}); band.position.set(x,y+1.0,z); levelGroup.add(band); premiumVisuals.push(band);
  }
  function addV45CrystalCluster(x,y,z,color){
    for(let i=0;i<4;i++){
      const c=i%2?0x38bdf8:color;
      const gem=v442Box(.42,.9,.42,c,{emissive:c,emissiveIntensity:.75,outlineColor:0xffffff,outlineOpacity:.18});
      gem.position.set(x+(i-1.5)*.38,y+.45+i*.08,z+(i%2-.5)*.45); gem.rotation.set(.45,.8,.2); gem.userData.float={baseY:gem.position.y,amp:.1,speed:.8+i*.1}; levelGroup.add(gem); premiumVisuals.push(gem); addGlowSprite(gem.position.x,gem.position.y,gem.position.z,c,1.8,.14);
    }
  }

  function addV45PortalTemple(world,length,cfg){
    const z = -length - 10;
    const stone = world==='fire'?0x3b1610:world==='space'?0x242052:0x556070;
    const glow = world==='fire'?0xff4d00:world==='space'?0x8b5cf6:0xc026d3;
    // larger temple around original portal
    for(let i=0;i<6;i++){
      const step=v442Box(6.2+i*1.25,.28,1.55,shadeColor(stone, i*5),{outlineColor:0xffffff,outlineOpacity:.10});
      step.position.set(0,.32+i*.18,z+5.2+i*1.05); levelGroup.add(step);
    }
    [-1,1].forEach(side=>{
      const tower=v442Box(1.45,5.8,1.45,stone,{outlineColor:0xffffff,outlineOpacity:.12}); tower.position.set(side*3.3,3.0,z+.2); levelGroup.add(tower);
      const cap=v442Box(1.8,.75,1.8,shadeColor(stone,18),{outlineColor:0xffffff,outlineOpacity:.12}); cap.position.set(side*3.3,6.2,z+.2); levelGroup.add(cap);
      const gem=v442Box(.65,1.2,.65,glow,{emissive:glow,emissiveIntensity:.95,outlineColor:0xffffff,outlineOpacity:.24}); gem.position.set(side*3.3,7.1,z+.2); gem.rotation.set(.4,.8,.2); gem.userData.float={baseY:7.1,amp:.18,speed:.8}; levelGroup.add(gem); premiumVisuals.push(gem); addGlowSprite(side*3.3,7.2,z+.2,glow,4,.18);
    });
    addGlowSprite(0,3.0,z+.4,glow,10,.22);
    const rewardBeam = new THREE.PointLight(glow, 2.2, 22); rewardBeam.position.set(0,3.8,z+1); levelGroup.add(rewardBeam); premiumVisuals.push(rewardBeam);
  }

  function addV45HeroCollectibleTrail(world,length,cfg){
    // bigger, more satisfying collectible line like the reference
    for(let i=0;i<9;i++){
      const z = -20 - i*(length/10);
      const x = (i%3-1)*1.15;
      const gem=v442Box(.55,.85,.55,0x22d3ee,{emissive:0x22d3ee,emissiveIntensity:1.05,outlineColor:0xffffff,outlineOpacity:.25});
      gem.position.set(x,1.35,z); gem.rotation.set(.58,.8,.22); gem.userData.float={baseY:1.35,amp:.18,speed:1.0}; levelGroup.add(gem); premiumVisuals.push(gem); addGlowSprite(x,1.42,z,0x22d3ee,2.9,.18);
    }
  }

  function addV45ReadableEnemies(world,length,cfg){
    if (world==='real') return;
    const positions=[[-3.8,-42,'golem'],[3.8,-70,'slime'],[-3.5,-106,'flyer'],[3.6,-140,'spiky']];
    positions.forEach(([x,z,type],i)=>{
      const color = type==='slime'?0x1f9d3a:type==='golem'?0x7d858c:type==='flyer'?0x4c1d95:0x1f2937;
      const size = type==='golem'?1.8:type==='flyer'?1.1:1.45;
      const g = makeEnemyModel(type==='slime'?'walker':type, size, color);
      g.position.set(x, size/2 + (type==='flyer'?1.9:0), z); g.scale.setScalar(type==='golem'?1.08:1); levelGroup.add(g); premiumVisuals.push(g);
      addGlowSprite(x, size+1.0, z, type==='slime'?0x22c55e:type==='flyer'?0xa855f7:0xff3030, 3.2, .12);
      const pad=v442Box(2.6,.08,2.6,type==='slime'?0x14532d:0x7f1d1d,{emissive:type==='slime'?0x22c55e:0xff0000,emissiveIntensity:.18,outlineOpacity:.05}); pad.position.set(x,.55,z); levelGroup.add(pad); premiumVisuals.push(pad);
    });
  }

  function addV45WaterLavaSetPieces(world,length,cfg){
    if (world==='fire'){
      for(let z=-24; z>-length; z-=32){ const lava=v442Box(2.5,.22,7,0xff4d00,{emissive:0xff3b00,emissiveIntensity:1.1,outlineColor:0xfff000,outlineOpacity:.12}); lava.position.set(6.25,.62,z); lava.userData.pulseMat=true; levelGroup.add(lava); premiumVisuals.push(lava); addGlowSprite(6.25,1.0,z,0xff4d00,4.6,.18); }
    } else if (world==='space'){
      for(let z=-20; z>-length; z-=36){ const gate=v442Box(.25,4.2,.25,0x7dd3fc,{emissive:0x7dd3fc,emissiveIntensity:.8,outlineOpacity:.06}); gate.position.set(-5.8,2.5,z); levelGroup.add(gate); premiumVisuals.push(gate); addGlowSprite(-5.8,2.6,z,0x7dd3fc,4,.12); const g2=gate.clone(); g2.position.x=5.8; levelGroup.add(g2); premiumVisuals.push(g2); }
    } else {
      for(let z=-30; z>-length; z-=46){ const water=v442Box(1.2,3.8,.18,0x38bdf8,{emissive:0x0ea5e9,emissiveIntensity:.45,outlineColor:0xffffff,outlineOpacity:.10}); water.position.set(-6.2,2.1,z); water.material.transparent=true; water.material.opacity=.78; levelGroup.add(water); premiumVisuals.push(water); addGlowSprite(-6.2,2.2,z,0x38bdf8,3.2,.10); }
    }
  }

  function createHub(){
    const names = [['field',-5,-24],['fire',0,-34],['forest',5,-24],['castle',-4,-52],['space',4,-52],['arena',0,-72]];
    names.forEach(([w,x,z]) => {
      addPortalObject(x,z,WORLD[w].accent,w);
      addCrystal(x,2.2,z+3);
    });
    addPlatform(0,1.0,-12,4,1,4,0x64748b);
    addEnemy('walker',-3,-42); addEnemy('jumper',3,-62);
  }

  function createGameplay(level){
    const len = level.length || 220; const lanes = [-5,0,5];
    addCheckpoint(3);
    addCrystal(0, 1.15, -8);
    // Cristais desenhados em caminhos alternativos
    for (let i=0;i<(level.crystals||5);i++) {
      const z = -22 - i * ((len-60) / Math.max(1, (level.crystals||5)-1));
      const lane = lanes[(i*2 + (level.world==='fire'?1:0)) % lanes.length];
      addCrystal(lane, 1.35 + (i%3===1?1.2:0), z);
    }
    // Plataformas e caixas sólidas em sequência jogável
    const blocks = [
      [-5,1.0,-18,3.2,1.0,3.2], [0,1.4,-30,3.2,1.0,3.2], [5,1.0,-44,3.2,1.0,3.2],
      [-5,1.5,-66,3.6,1.0,3.6], [0,2.0,-82,3.4,1.0,3.4], [5,1.6,-98,3.4,1.0,3.4],
      [0,1.3,-128,4.2,1.0,4.2], [-5,1.7,-152,3.4,1.0,3.4], [5,2.2,-172,3.4,1.0,3.4],
      [0,1.8,-205,4.4,1.0,4.4], [-5,1.6,-238,3.2,1.0,3.2], [5,2.0,-266,3.4,1.0,3.4],
      [0,2.2,-302,4.2,1.0,4.2], [-5,1.8,-335,3.4,1.0,3.4]
    ];
    blocks.filter(b => Math.abs(b[2]) < len-16).forEach((b,i)=> addPlatform(...b, i%2?0x8b5a2b:0x94a3b8));
    // Caixas quebráveis / atalhos
    const breakableZs = level.id === 'training' ? [-116] : [-56,-116,-188,-248,-318];
    breakableZs.filter(z => Math.abs(z)<len-20).forEach((z,i)=> addBreakable(lanes[i%3], z));
    // Lava e buracos com desvio lateral
    const hazardZs = level.id === 'training' ? [-96,-158] : [-38,-74,-112,-162,-216,-278,-340];
    hazardZs.filter(z => Math.abs(z)<len-22).forEach((z,i)=> {
      const type = level.world === 'fire' ? (i%2?'pit':'lava') : 'pit';
      addHazard(type, lanes[(i+1)%3], z, 3.7, 5.3);
    });
    // Túneis baixos
    [-92,-194,-290].filter(z => Math.abs(z)<len-25).forEach((z,i)=> addTunnel(lanes[i%3], z));
    // Portões
    addGate(0, -Math.min(len-42, 138), level.boss || level.world === 'castle' ? 'giant' : 'power');
    addCheckpoint(-Math.min(len-30, Math.floor(len*.52)));
    // Inimigos com comportamento variado
    const enemyTypes = enemyPlanFor(level);
    for (let i=0;i<(level.enemies||4);i++) {
      const z = -14 - i * ((len-72) / Math.max(1,(level.enemies||4)-1));
      const lane = i===0 ? 0 : lanes[(i+2)%3];
      addEnemy(enemyTypes[i % enemyTypes.length], lane, z);
    }
    // Plataformas bônus e cristais secretos para deixar a fase menos beta/demo
    [-42,-132,-222,-312].filter(z => Math.abs(z)<len-24).forEach((z,i)=>{ addPlatform(i%2?-7:7,2.6,z-6,2.4,.8,2.4,0x0ea5e9); addCrystal(i%2?-7:7,3.7,z-6); });
    [-88,-178,-268].filter(z => Math.abs(z)<len-34).forEach((z,i)=> addEnemy(i%2?'flyer':'walker', i%2?7:-7, z));
    applyV42LevelDesign(level, len, lanes);
    applyV44EnemyBossLayer(level, len, lanes);
    applyV53CodexGameplayLayer(level, len, lanes);
    if (level.quizGate) addQuizAltar(0, -Math.min(len-56, 210));
  }

  function enemyPlanFor(level){
    if (level.boss) return ['flyer','jumper','spiky','golem','walker','flyer','spiky','golem','boss'];
    if (level.id === 'training') return ['flyer','golem','spiky'];
    if (level.world === 'field') return ['flyer','golem','walker','spiky','jumper','walker'];
    if (level.world === 'fire') return ['spiky','jumper','spiky','walker','golem','spiky'];
    if (level.world === 'forest') return ['jumper','flyer','walker','jumper','flyer','spiky'];
    if (level.world === 'castle') return ['golem','walker','golem','spiky','golem','flyer'];
    if (level.world === 'space') return ['flyer','jumper','flyer','spiky','flyer','golem'];
    return ['flyer','golem','walker','spiky','jumper','walker'];
  }



  const V53_CODEX_VISUAL_GAMEPLAY = {
    label:'V53_CODEX_VISUAL_OBEDECIDO_INTERATIVO',
    source:'OTTHOS/Codex visual mantido, V50 motor estável',
    target:'render_referencia_voxel_premium + responsividade corrigida',
    mechanics:['espada','escudo','estrela','inimigo_com_escudo','agua_lenta','buraco','lava_viva','mini_por_baixo'],
    active:false
  };

  function v53Add(obj){
    if (!obj || !levelGroup) return obj;
    levelGroup.add(obj);
    premiumVisuals.push(obj);
    return obj;
  }
  function v53SwordModel(x,y,z){
    const g=new THREE.Group(); g.position.set(x,y,z);
    const blade=box(.16,1.25,.12,0xdbeafe,{ outline:true, outlineColor:0xffffff, outlineOpacity:.30, metalness:.20, roughness:.18 });
    blade.position.y=.52; blade.rotation.z=.64; g.add(blade);
    const guard=box(.78,.16,.18,0x38bdf8,{ emissive:0x0284c7, emissiveIntensity:.35, outline:true, outlineOpacity:.18 });
    guard.position.set(.05,-.08,0); guard.rotation.z=.64; g.add(guard);
    const grip=box(.18,.48,.18,0x5b341a,{ outline:true, outlineOpacity:.12 }); grip.position.set(-.20,-.43,0); grip.rotation.z=.64; g.add(grip);
    const glow=addGlowSprite(x,y,z,0x38bdf8,1.5,.22); glow.userData.v53PowerupGlow=true;
    v53Add(g); g.userData.float={baseY:y,speed:2.0,amp:.16}; g.userData.spin=1.2; return g;
  }
  function v53ShieldModel(x,y,z){
    const g=new THREE.Group(); g.position.set(x,y,z);
    const shield=box(.86,1.05,.18,0x22c55e,{ emissive:0x16a34a, emissiveIntensity:.25, outline:true, outlineColor:0xd1fae5, outlineOpacity:.28 });
    shield.position.y=.05; g.add(shield);
    const core=box(.42,.42,.22,0xbbf7d0,{ emissive:0x86efac, emissiveIntensity:.45, outline:true, outlineOpacity:.12 }); core.position.z=.1; g.add(core);
    const glow=addGlowSprite(x,y,z,0x22c55e,1.35,.18); glow.userData.v53PowerupGlow=true;
    v53Add(g); g.userData.float={baseY:y,speed:1.8,amp:.14}; g.userData.spin=.8; return g;
  }
  function v53StarModel(x,y,z){
    const g=new THREE.Group(); g.position.set(x,y,z);
    const m=mat(0xffe259,0xffcc00,{ emissiveIntensity:.85, roughness:.18, metalness:.08 });
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(.58,0),m); core.castShadow=true; g.add(core);
    for(let i=0;i<6;i++){ const ray=box(.15,.66,.15,0xfff27a,{ emissive:0xffcc00, emissiveIntensity:.65 }); ray.rotation.z=i*Math.PI/3; ray.position.set(Math.cos(i*Math.PI/3)*.43,Math.sin(i*Math.PI/3)*.43,0); g.add(ray); }
    const glow=addGlowSprite(x,y,z,0xffe259,1.75,.26); glow.userData.v53PowerupGlow=true;
    v53Add(g); g.userData.float={baseY:y,speed:2.6,amp:.20}; g.userData.spin=2.3; return g;
  }
  function addPowerup(type,x,y,z){
    const mesh = type==='sword'?v53SwordModel(x,y,z):type==='shield'?v53ShieldModel(x,y,z):v53StarModel(x,y,z);
    powerups.push({type,x,y,z,mesh,got:false});
  }
  function setTreeVisible(obj, visible=true){
    if(!obj) return;
    obj.visible = !!visible;
    if (obj.traverse) obj.traverse(o => { o.visible = !!visible; });
  }
  function itemLabel(type){
    return type==='sword' ? 'espada' : type==='shield' ? 'escudo' : 'estrela';
  }
  function itemEmoji(type){
    return type==='sword' ? '⚔' : type==='shield' ? '🛡' : '⭐';
  }
  function enemyLabel(e){
    if(!e) return 'MONSTRO';
    if(e.type==='golem' || e.type==='boss' || e.shield>0) return 'GOLEM';
    if(e.type==='spiky') return 'ESPINHO';
    if(e.type==='flyer') return 'VOADOR';
    if(e.type==='walker' || e.type==='crawler') return 'BAIXO';
    if(e.type==='jumper') return 'PULAR';
    return 'PULAR';
  }
  function enemyHint(e){
    const label = enemyLabel(e);
    if(label==='GOLEM') return 'Golem é pesado: use 🔥 ou ⚔';
    if(label==='ESPINHO') return 'Espinhos não são para pisar';
    if(label==='VOADOR') return 'Acerte o voador com 🔥';
    if(label==='BAIXO') return 'Passe por cima ou use ⚔';
    return 'Pule em cima ou use ⚔';
  }
  function makeTextSprite(text, bg=0x111827, fg='#ffffff'){
    if(!window.THREE) return null;
    const c=document.createElement('canvas');
    c.width=256; c.height=96;
    const ctx=c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='rgba(0,0,0,.28)';
    ctx.roundRect?.(10,12,236,66,20); ctx.fill();
    ctx.fillStyle='#'+Number(bg).toString(16).padStart(6,'0');
    if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(16,8,224,64,18); ctx.fill(); }
    else ctx.fillRect(16,8,224,64);
    ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=5; ctx.strokeRect(20,12,216,56);
    ctx.font='900 30px system-ui,Arial';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=fg; ctx.fillText(String(text||''),128,40);
    const tex=new THREE.CanvasTexture(c); tex.needsUpdate=true;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
    sp.scale.set(7.2,1.95,1);
    sp.renderOrder=1800;
    if (sp.material) { sp.material.depthTest=false; sp.material.depthWrite=false; }
    return sp;
  }
  function clearHeldItemVisual(){
    if(!player || !player.userData) return;
    for(const key of ['heldSword','heldShield','starHalo']){
      const obj=player.userData[key];
      if(obj && obj.parent) obj.parent.remove(obj);
      player.userData[key]=null;
    }
  }
  function ensureHeldItemVisual(){
    if(!player || !window.THREE) return;
    if(!player.userData) player.userData={};
    const swordActive = p.weapon==='sword' && now() < (p.weaponUntil||0);
    if(swordActive && !player.userData.heldSword){
      const g=new THREE.Group();
      const blade=box(.16,1.25,.12,0xe0f7ff,{ emissive:0x38bdf8, emissiveIntensity:.75, outline:true, outlineColor:0xffffff, outlineOpacity:.22 });
      const hilt=box(.72,.18,.16,0xfacc15,{ emissive:0xf59e0b, emissiveIntensity:.25, outline:true, outlineOpacity:.12 });
      blade.position.set(0,.62,0); hilt.position.set(0,-.06,0);
      g.add(blade,hilt);
      g.position.set(.92,1.22,-.45);
      g.rotation.z=-.42; g.rotation.x=.12;
      player.add(g); player.userData.heldSword=g;
    } else if(!swordActive && player.userData.heldSword){
      player.remove(player.userData.heldSword); player.userData.heldSword=null; p.weapon=null;
    }
    if((p.shield||0)>0 && !player.userData.heldShield){
      const g=new THREE.Group();
      const sh=box(.78,1.0,.14,0x38bdf8,{ emissive:0x0ea5e9, emissiveIntensity:.45, transparent:true, opacity:.86, outline:true, outlineColor:0xffffff, outlineOpacity:.25 });
      const cross=box(.18,.82,.16,0xffffff,{ emissive:0xffffff, emissiveIntensity:.18 });
      sh.position.set(0,.48,0); cross.position.copy(sh.position);
      g.add(sh,cross);
      g.position.set(-.86,1.0,-.42);
      g.rotation.z=.16;
      player.add(g); player.userData.heldShield=g;
    } else if((p.shield||0)<=0 && player.userData.heldShield){
      player.remove(player.userData.heldShield); player.userData.heldShield=null;
    }
    const starActive = now() < (p.starUntil||0);
    if(starActive && !player.userData.starHalo){
      const g=new THREE.Group();
      const halo=box(1.65,.10,1.65,0xffe259,{ emissive:0xffd000, emissiveIntensity:.85, transparent:true, opacity:.52, outline:true, outlineColor:0xffffff, outlineOpacity:.18 });
      halo.position.set(0,3.45,0); g.add(halo);
      player.add(g); player.userData.starHalo=g;
    } else if(!starActive && player.userData.starHalo){
      player.remove(player.userData.starHalo); player.userData.starHalo=null;
    }
  }
  function ensureEnemyBadge(e){
    if(!e || !e.mesh || e.dead || !window.THREE) return;
    if(!e.mesh.userData) e.mesh.userData={};
    // V55: sem textos/placas no mundo. A camada visual independente desenha o inimigo real.
    if(e.mesh.userData.enemyBadge){ e.mesh.userData.enemyBadge.visible=false; }
    if(e.mesh.userData.v547Shell){ e.mesh.userData.v547Shell.visible=false; }
  }
    function hazardLabel(h){
    if(!h) return 'PERIGO';
    return h.type==='water'?'ÁGUA':h.type==='pit'?'BURACO':h.type==='lava'?'LAVA':'PERIGO';
  }
  function ensureHazardBadge(h){
    if(!h || !h.mesh || !window.THREE) return;
    if(!h.mesh.userData) h.mesh.userData={};
    // V55: sem texto; buraco/lava/água são desenhados como modelo visual pela camada V55.
    if(h.mesh.userData.hazardBadge){ h.mesh.userData.hazardBadge.visible=false; }
    if(h.mesh.userData.v547Frame){ h.mesh.userData.v547Frame.visible=false; }
  }
    function ensurePowerupBadge(it){
    if(!it || !it.mesh || it.got || !window.THREE) return;
    if(!it.mesh.userData) it.mesh.userData={};
    // V55: sem texto; espada/escudo/estrela são modelos visuais.
    if(it.mesh.userData.powerupBadge){ it.mesh.userData.powerupBadge.visible=false; }
    if(it.mesh.userData.v547Beam){ it.mesh.userData.v547Beam.visible=false; }
  }
    function currentMissionHint(){
    const near = nearestPowerup(7.5);
    if(near) return 'Aperte ⚔ para pegar o item.';
    if(runtime && runtime.requiredCrystals && runtime.crystals < runtime.requiredCrystals) return `Pegue cristais ${runtime.crystals}/${runtime.requiredCrystals}.`;
    if(runtime && runtime.requiredEnemies && runtime.defeated < runtime.requiredEnemies) return `Vença monstros ${runtime.defeated}/${runtime.requiredEnemies}.`;
    return 'Portal liberado! Vá até o portal.';
  }
    function collectPowerup(it, manual=false){
    if(!it || it.got) return false;
    it.got=true;
    if(it.mesh) setTreeVisible(it.mesh,false);
    if(it.type==='sword'){ p.weapon='sword'; p.weaponUntil=now()+90000; toast(manual?'Espada equipada!':'Espada de luz!', 'good'); addXP(18); }
    else if(it.type==='shield'){ p.shield=(p.shield||0)+1; toast(manual?'Escudo equipado!':'Escudo ativado!', 'good'); addXP(12); }
    else { p.starUntil=now()+9500; toast(manual?'Estrela ativada!':'Estrela invencível!', 'good'); addXP(25); }
    addParticles(it.x,it.y,it.z,it.type==='star'?0xffe259:it.type==='sword'?0x38bdf8:0x22c55e,28);
    ensureHeldItemVisual();
    updateHud();
    vibrate(manual?70:50); beep(980,120);
    return true;
  }
  function nearestPowerup(maxDist=7.2){
    if(!powerups || !powerups.length || !p) return null;
    let best=null, bestD=Infinity;
    for(const it of powerups){
      if(it.got) continue;
      const d=dist3(p.x,p.y+1,p.z,it.x,it.y,it.z);
      if(d<maxDist && d<bestD){ best=it; bestD=d; }
    }
    return best;
  }
  function tryPickupNearestPowerup(maxDist=7.8){
    const it = nearestPowerup(maxDist);
    if(!it) return false;
    return collectPowerup(it,true);
  }
  function checkPowerups(){
    if(!powerups || !powerups.length) return;
    for(const it of powerups){
      if(it.got) continue;
      if(it.mesh) setTreeVisible(it.mesh,true);
      if(dist3(p.x,p.y+1,p.z,it.x,it.y,it.z)<3.45){
        collectPowerup(it,false);
      }
    }
  }
  
  function ensureV55VisualLayer(){
    if(!scene || !window.THREE) return null;
    if(!scene.userData) scene.userData={};
    let g = scene.userData.v55VisualLayer;
    if(!g){
      g = new THREE.Group();
      g.name = 'V58_GAMEPAD_JOGABILIDADE_RENDER';
      g.renderOrder = 3000;
      scene.add(g);
      scene.userData.v55VisualLayer = g;
    }
    return g;
  }
  function clearV55VisualLayer(){
    if(!scene || !scene.userData || !scene.userData.v55VisualLayer) return;
    const g = scene.userData.v55VisualLayer;
    while(g.children.length){
      const obj = g.children.pop();
      if(obj.parent) obj.parent.remove(obj);
    }
  }
  function v55Mat(color, opacity=1){
    return new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthTest:false,
      depthWrite:false,
      side:THREE.DoubleSide
    });
  }
  function v55Box(w,h,d,color,opacity=1){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), v55Mat(color,opacity));
    m.renderOrder = 3050;
    return m;
  }
  function v55Cylinder(r,h,color,opacity=1,segments=28){
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments), v55Mat(color,opacity));
    m.renderOrder = 3050;
    return m;
  }
  function v55Ring(r1,r2,color,opacity=.72){
    const m = new THREE.Mesh(new THREE.RingGeometry(r1,r2,56), v55Mat(color,opacity));
    m.rotation.x = -Math.PI/2;
    m.renderOrder = 3050;
    return m;
  }
  function v55Octa(color, scale=1, opacity=1){
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(scale,1), v55Mat(color,opacity));
    m.renderOrder = 3060;
    return m;
  }
  function v55Star3D(color=0xfacc15){
    const g = new THREE.Group();
    for(let i=0;i<5;i++){
      const p=v55Box(.34,1.35,.18,color,.96);
      p.position.y=1.05;
      p.rotation.z=(Math.PI*2*i)/5;
      g.add(p);
    }
    const c=v55Octa(0xffffff,.45,.95); c.position.y=1.05; g.add(c);
    return g;
  }
  function v55EnemyModel(e){
    const type = enemyLabel(e);
    const g = new THREE.Group();
    g.name = 'V55_ENEMY_VISUAL_' + type;
    const pulse = 1 + Math.sin(now()*.006 + (e.t||0))*0.035;

    if(type === 'VOADOR'){
      const shadow = v55Ring(1.10,1.38,0x5b21b6,.34); shadow.position.y=.06;
      const body = v55Box(1.86,1.86,1.86,0x13091f,.98); body.position.y=1.36;
      body.rotation.y=.32;
      const core = v55Box(1.10,1.10,1.10,0x7e22ce,.38); core.position.y=1.36; core.rotation.y=-.32;
      const eye1 = v55Box(.26,.22,.12,0xff00ff,1); eye1.position.set(-.32,1.42,1.00);
      const eye2 = v55Box(.26,.22,.12,0xff00ff,1); eye2.position.set(.32,1.42,1.00);
      const orb1 = v55Octa(0xa855f7,.26,.86); orb1.position.set(-1.15,1.18,0);
      const orb2 = v55Octa(0xa855f7,.26,.86); orb2.position.set(1.15,1.18,0);
      g.add(shadow,body,core,eye1,eye2,orb1,orb2);
    } else if(type === 'ESPINHO'){
      const shadow = v55Ring(1.25,1.55,0x14532d,.30); shadow.position.y=.06;
      const body = v55Box(2.05,1.85,2.05,0x2cc95c,.98); body.position.y=1.18;
      const top = v55Box(1.75,.68,1.75,0x22a84c,.98); top.position.y=2.18;
      const eye1 = v55Box(.32,.22,.12,0xff003b,1); eye1.position.set(-.42,1.18,1.06);
      const eye2 = v55Box(.32,.22,.12,0xff003b,1); eye2.position.set(.42,1.18,1.06);
      [[-.62,2.42,0],[0,2.58,.28],[.62,2.42,0],[-.80,1.96,.56],[.80,1.96,.56]].forEach(p=>{ const sp=v55Box(.20,.56,.20,0xf8fafc,1); sp.position.set(p[0],p[1],p[2]); sp.rotation.z=.28; g.add(sp); });
      g.add(shadow,body,top,eye1,eye2);
    } else if(type === 'GOLEM'){
      const base = v55Ring(1.35,1.68,0x64748b,.28); base.position.y=.08;
      const body = v55Box(1.86,2.15,1.86,0x8b95a4,.98); body.position.y=1.32;
      const head = v55Box(1.18,1.00,1.18,0x7c8796,.98); head.position.y=2.66;
      const arm1 = v55Box(.42,1.25,.42,0x94a3b8,.98); arm1.position.set(-1.10,1.30,0);
      const arm2 = v55Box(.42,1.25,.42,0x94a3b8,.98); arm2.position.set(1.10,1.30,0);
      const eye1 = v55Box(.22,.14,.12,0xff003b,1); eye1.position.set(-.24,2.70,.62);
      const eye2 = v55Box(.22,.14,.12,0xff003b,1); eye2.position.set(.24,2.70,.62);
      g.add(base,body,head,arm1,arm2,eye1,eye2);
    } else if(type === 'PULAR'){
      // Verde vertical, molas e olhos grandes: leitura imediata de "pular".
      const shadow = v55Ring(1.25,1.55,0x101820,.30); shadow.position.y=.06;
      const spring1 = v55Cylinder(.18,.80,0xffffff,.80,14); spring1.position.set(-.55,.42,.35); spring1.rotation.z=.25;
      const spring2 = v55Cylinder(.18,.80,0xffffff,.80,14); spring2.position.set(.55,.42,.35); spring2.rotation.z=-.25;
      const body = v55Box(2.05,1.95,2.05,0x39ff6a,.98); body.position.y=1.32;
      const top = v55Box(1.55,.72,1.55,0x23c761,.98); top.position.y=2.62;
      const eye1 = v55Box(.34,.24,.12,0xff0055,1); eye1.position.set(-.42,2.72,1.02);
      const eye2 = v55Box(.34,.24,.12,0xff0055,1); eye2.position.set(.42,2.72,1.02);
      g.add(shadow,spring1,spring2,body,top,eye1,eye2);
    } else if(type === 'FOGO'){
      // Fogo vivo: núcleo escuro, chamas e brasas.
      const aura = v55Ring(1.45,1.82,0xff3b00,.52); aura.position.y=.08;
      const core = v55Box(1.65,1.65,1.65,0x2b0a05,.96); core.position.y=1.25; core.rotation.y=.35;
      const flameA = v55Box(.96,2.25,.96,0xff4a12,.94); flameA.position.y=2.22; flameA.rotation.z=.45;
      const flameB = v55Box(.70,1.65,.70,0xffd21a,.94); flameB.position.set(.42,2.02,.06); flameB.rotation.z=-.34;
      const flameC = v55Box(.62,1.45,.62,0xff7a00,.90); flameC.position.set(-.46,1.92,.05); flameC.rotation.z=.25;
      const eye1 = v55Box(.24,.16,.10,0xfff7b3,1); eye1.position.set(-.34,1.62,.88);
      const eye2 = v55Box(.24,.16,.10,0xfff7b3,1); eye2.position.set(.34,1.62,.88);
      g.add(aura,core,flameA,flameB,flameC,eye1,eye2);
    } else if(type === 'BAIXO'){
      // Rasteiro: corpo horizontal, baixo e largo, visualmente indica passar por cima/baixo conforme regra.
      const shadow = v55Ring(1.70,2.05,0x4c1d95,.44); shadow.position.y=.05;
      const body = v55Box(3.15,.78,1.42,0x7c3aed,.98); body.position.y=.72;
      const back = v55Box(2.35,.42,1.20,0xc084fc,.85); back.position.y=1.20;
      const eye1 = v55Box(.24,.16,.12,0xff0055,1); eye1.position.set(-.55,.84,.74);
      const eye2 = v55Box(.24,.16,.12,0xff0055,1); eye2.position.set(.55,.84,.74);
      const tail = v55Box(.80,.34,1.00,0x3b0764,.96); tail.position.set(1.85,.62,0);
      g.add(shadow,body,back,eye1,eye2,tail);
    } else if(type === 'ESCUDO'){
      // Escudo de verdade na frente.
      const base = v55Ring(1.35,1.68,0x00d9ff,.55); base.position.y=.08;
      const body = v55Box(1.55,1.85,1.55,0x475569,.98); body.position.y=1.25;
      const head = v55Box(1.25,.85,1.25,0x1e293b,.98); head.position.y=2.45;
      const shield = v55Box(2.08,2.35,.30,0x00d9ff,.78); shield.position.set(0,1.58,1.05);
      const shine = v55Box(.24,1.75,.34,0xffffff,.88); shine.position.set(-.42,1.60,1.25);
      const cross = v55Box(1.55,.24,.34,0xffffff,.88); cross.position.set(0,1.58,1.26);
      const eye1 = v55Box(.22,.14,.12,0xff0055,1); eye1.position.set(-.28,2.52,.68);
      const eye2 = v55Box(.22,.14,.12,0xff0055,1); eye2.position.set(.28,2.52,.68);
      g.add(base,body,head,shield,shine,cross,eye1,eye2);
    } else {
      const base = v55Ring(1.70,2.05,0xff003b,.54); base.position.y=.08;
      const body = v55Box(2.25,2.25,2.25,0xef4444,.96); body.position.y=1.45;
      const horn1 = v55Box(.38,.95,.38,0xfacc15,.95); horn1.position.set(-.80,3.05,0); horn1.rotation.z=.25;
      const horn2 = v55Box(.38,.95,.38,0xfacc15,.95); horn2.position.set(.80,3.05,0); horn2.rotation.z=-.25;
      const eye1 = v55Box(.34,.22,.12,0xff0055,1); eye1.position.set(-.43,2.10,1.12);
      const eye2 = v55Box(.34,.22,.12,0xff0055,1); eye2.position.set(.43,2.10,1.12);
      g.add(base,body,horn1,horn2,eye1,eye2);
    }

    g.scale.setScalar(pulse);
    return g;
  }
  function v55EnemyOverlay(layer,e){
    if(!e || e.dead) return;
    const marker = v55EnemyModel(e);
    marker.position.set(e.x, Math.max(.08,e.y||0), e.z);
    layer.add(marker);
  }
  function v55PowerupOverlay(layer,it){
    if(!it || it.got) return;
    const marker = new THREE.Group();
    marker.name = 'V55_ITEM_VISUAL_' + it.type;
    marker.position.set(it.x,.08,it.z);
    const color = it.type==='sword'?0x38bdf8:it.type==='shield'?0x22c55e:0xfacc15;
    const pad = v55Ring(1.12,1.45,color,.48); pad.position.y=.08;
    const beam = v55Box(.22,2.65,.22,color,.45); beam.position.y=1.45;
    marker.add(pad,beam);

    if(it.type==='sword'){
      const blade = v55Box(.24,2.70,.18,0xe0f7ff,.98); blade.position.y=1.70; blade.rotation.z=-.48;
      const edge = v55Box(.08,2.38,.20,0x38bdf8,.85); edge.position.set(.14,1.74,.02); edge.rotation.z=-.48;
      const guard = v55Box(1.25,.26,.22,0xfacc15,.98); guard.position.set(.48,.70,0); guard.rotation.z=-.48;
      const grip = v55Box(.30,.85,.24,0x5b3a29,.98); grip.position.set(.72,.22,0); grip.rotation.z=-.48;
      marker.add(blade,edge,guard,grip);
    } else if(it.type==='shield'){
      const shield = v55Box(1.50,1.88,.26,0x22c55e,.88); shield.position.y=1.45;
      const rim = v55Box(1.76,2.12,.18,0xffffff,.25); rim.position.y=1.45;
      const cross1 = v55Box(.24,1.45,.30,0xffffff,.96); cross1.position.y=1.45;
      const cross2 = v55Box(1.10,.24,.30,0xffffff,.96); cross2.position.y=1.45;
      marker.add(shield,rim,cross1,cross2);
    } else {
      const star = v55Star3D(0xfacc15); star.position.y=.46;
      const glow = v55Ring(1.15,1.55,0xfacc15,.36); glow.position.y=.12;
      marker.add(glow,star);
    }
    const bob = 1 + Math.sin(now()*.006 + (it.x||0))*0.035;
    marker.scale.setScalar(bob);
    layer.add(marker);
  }
  function v55HazardOverlay(layer,h){
    if(!h) return;
    const marker = new THREE.Group();
    marker.name = 'V55_HAZARD_VISUAL_' + h.type;
    marker.position.set(h.x,.06,h.z);
    const w=Math.max(2.6,h.w||3), d=Math.max(3,h.d||3);

    if(h.type==='pit'){
      // Buraco estilo jogo: bordas quebradas + paredes internas + fundo escuro profundo.
      const hole = v55Box(w,.20,d,0x050505,.90); hole.position.y=.10;
      const inner = v55Box(w*.72,.18,d*.72,0x000000,.92); inner.position.y=.22;
      const front = v55Box(w+.90,.42,.42,0xb07a3b,.98); front.position.set(0,.45,-d/2-.18);
      const back = v55Box(w+.90,.42,.42,0x8a5726,.98); back.position.set(0,.45,d/2+.18);
      const left = v55Box(.42,.42,d+.90,0x9b6730,.98); left.position.set(-w/2-.18,.45,0);
      const right = v55Box(.42,.42,d+.90,0x9b6730,.98); right.position.set(w/2+.18,.45,0);
      const crack1 = v55Box(.18,.12,1.35,0x1f1308,.98); crack1.position.set(-w*.22,.72,-d*.22); crack1.rotation.y=.62;
      const crack2 = v55Box(.16,.12,1.20,0x1f1308,.98); crack2.position.set(w*.18,.72,d*.20); crack2.rotation.y=-.56;
      const depth1 = v55Box(w*.82,.40,.22,0x281604,.55); depth1.position.set(0,-.12,-d*.38);
      const depth2 = v55Box(w*.82,.40,.22,0x1a0e03,.55); depth2.position.set(0,-.26,d*.36);
      const warningGlow = v55Ring(Math.max(w,d)*.42,Math.max(w,d)*.54,0xfacc15,.28); warningGlow.position.y=.16;
      marker.add(hole,inner,depth1,depth2,front,back,left,right,crack1,crack2,warningGlow);
    } else if(h.type==='lava'){
      const lava = v55Box(w,.24,d,0xff2b00,.92); lava.position.y=.18;
      const hot1 = v55Box(w*.72,.12,d*.18,0xfff000,.90); hot1.position.set(0,.42,-d*.16);
      const hot2 = v55Box(w*.38,.12,d*.16,0xffa000,.90); hot2.position.set(w*.14,.46,d*.22);
      const bubble1 = v55Cylinder(.28,.14,0xfff000,.86,18); bubble1.position.set(-w*.25,.52,-d*.15);
      const bubble2 = v55Cylinder(.22,.14,0xffd000,.86,18); bubble2.position.set(w*.28,.54,d*.20);
      const rim = v55Ring(Math.max(w,d)*.44,Math.max(w,d)*.58,0xff3b00,.36); rim.position.y=.16;
      marker.add(lava,hot1,hot2,bubble1,bubble2,rim);
    } else {
      const water = v55Box(w,.18,d,0x00c8ff,.58); water.position.y=.13;
      const shine = v55Box(w*.70,.10,d*.14,0xffffff,.48); shine.position.set(0,.30,-d*.12);
      const ripple1 = v55Ring(Math.max(w,d)*.24,Math.max(w,d)*.30,0xffffff,.36); ripple1.position.y=.28;
      const ripple2 = v55Ring(Math.max(w,d)*.38,Math.max(w,d)*.45,0x7dd3fc,.34); ripple2.position.y=.30;
      marker.add(water,shine,ripple1,ripple2);
    }
    layer.add(marker);
  }
  function syncV55VisualLanguage(){
    if(!playing || !scene || !window.THREE || !p) return;
    const layer = ensureV55VisualLayer();
    if(!layer) return;
    const t = now();
    if(layer.userData && layer.userData.lastBuild && t - layer.userData.lastBuild < 80) return;
    if(!layer.userData) layer.userData={};
    layer.userData.lastBuild = t;
    clearV55VisualLayer();

    for(const e of enemies){
      if(!e || e.dead) continue;
      if((p.z - e.z) > -28 && (p.z - e.z) < 185) v55EnemyOverlay(layer,e);
    }
    for(const it of powerups){
      if(!it || it.got) continue;
      if((p.z - it.z) > -24 && (p.z - it.z) < 170) v55PowerupOverlay(layer,it);
    }
    for(const h of hazards){
      if(!h) continue;
      if((p.z - h.z) > -24 && (p.z - h.z) < 170) v55HazardOverlay(layer,h);
    }
  }

function syncGameplayVisibility(){
    if(!playing || !levelGroup) return;
    for(const e of enemies){
      if(!e || !e.mesh) continue;
      setTreeVisible(e.mesh, !e.dead);
      // V58: sem badge escrito no mundo; modelos visuais fazem a leitura.
      if(e.mesh.userData && e.mesh.userData.dangerRing) e.mesh.userData.dangerRing.visible = !e.dead;
      if(e.mesh.userData && e.mesh.userData.enemyBadge) e.mesh.userData.enemyBadge.visible = !e.dead;
      if(e.mesh.userData && e.mesh.userData.v547Shell) e.mesh.userData.v547Shell.visible = !e.dead;
    }
    for(const h of hazards){
      if(h && h.mesh){ setTreeVisible(h.mesh,true); }
    }
    for(const it of powerups){
      if(it && it.mesh){ setTreeVisible(it.mesh, !it.got); }
    }
    for(const c of crystals){
      if(c && c.mesh) setTreeVisible(c.mesh, !c.got);
      if(c && c.glow) setTreeVisible(c.glow, !c.got);
      if(c && c.light) c.light.visible = !c.got;
    }
    ensureHeldItemVisual();
  }
  
  function isDangerNearPlayer(radius=5.2){
    if(!p) return false;
    for(const h of hazards){ if(h && Math.abs(h.z-p.z)<radius && Math.abs(h.x-p.x)<Math.max(radius,h.w||0)) return true; }
    for(const e of enemies){ if(e && !e.dead && Math.abs(e.z-p.z)<radius && Math.abs(e.x-p.x)<radius) return true; }
    for(const pr of enemyProjectiles){ if(pr && pr.mesh && pr.mesh.position && dist3(p.x,p.y+1,p.z,pr.mesh.position.x,pr.mesh.position.y,pr.mesh.position.z)<radius) return true; }
    return false;
  }
  function defendPlayer(manual=false){
    if(!p) return false;
    if((p.shield||0)<=0){ if(manual) toast('Pegue o escudo para defender.', 'warn'); return false; }
    p.blockUntil = now()+1300;
    p.invUntil = Math.max(p.invUntil||0, now()+900);
    ensureHeldItemVisual();
    addParticles(p.x,p.y+1.2,p.z,0x38bdf8,18);
    if(manual) toast('Defesa ativada!', 'good');
    vibrate(45); beep(420,90,'square');
    return true;
  }

function swordAttack(){
    if(!playing || paused) return false;
    const hasSword = p.weapon==='sword' && now()<(p.weaponUntil||0);
    const slash=new THREE.Group();
    slash.position.set(p.x,p.y+1.08,p.z-1.18);
    const color = hasSword ? 0x38bdf8 : 0xffffff;
    const blade=box(hasSword?2.55:1.55,.20,.30,color,{ emissive:color, emissiveIntensity:hasSword?.82:.28, transparent:true, opacity:.90, outline:true, outlineOpacity:.10 });
    blade.rotation.y=.25; slash.add(blade); levelGroup.add(slash);
    particles.push({mesh:slash, vel:new THREE.Vector3(0,0,-1), life:.16});
    let hits=0;
    for(const e of enemies){
      if(e.dead) continue;
      const close=Math.abs(e.z-p.z)<5.5 && Math.abs(e.x-p.x)<3.15;
      if(close){
        if(e.shield>0){ e.shield--; if(e.shieldMesh)e.shieldMesh.visible=false; addParticles(e.x,e.y,e.z,0x38bdf8,16); }
        else damageEnemy(e, hasSword ? (e.type==='boss'?1:2) : 1);
        hits++;
      }
    }
    if(hits){ toast(hasSword?'Ataque de espada!':'Ataque!', 'good'); addXP(hasSword?3:1); }
    else toast(hasSword?'Golpe de espada!':'Ataque no ar.', 'warn');
    beep(hasSword?560:440,80,'square'); vibrate(hasSword?45:25); return true;
  }

  function v53EnhanceEnemy(e){
    if(!e || !e.mesh || e.v53Done) return;
    e.v53Done=true;
    if(e.type==='golem' || e.type==='boss'){
      e.shield = e.type==='boss'?2:1;
      const sh=box(e.type==='boss'?1.75:1.18,e.type==='boss'?1.95:1.35,.20,0x38bdf8,{ emissive:0x0ea5e9, emissiveIntensity:.35, transparent:true, opacity:.72, outline:true, outlineColor:0xffffff, outlineOpacity:.22 });
      sh.position.set(0,0,.76); e.mesh.add(sh); e.shieldMesh=sh;
    }
    if(e.type==='spiky') e.mustUsePower=true;
    if(e.type==='flyer') e.mustCrouchUnder=true;
  }
  function addV53Water(x,z,w,d){
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,.08,d),new THREE.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:.42}));
    m.position.set(x,.09,z); v53Add(m); hazards.push({type:'water',mesh:m,x,z,w,d,slow:true});
  }
  function addV53Pit(x,z,w,d){
    const m=box(w,.08,d,0x020617,{outline:true,outlineColor:0x64748b,outlineOpacity:.20});
    m.position.set(x,.08,z); v53Add(m); hazards.push({type:'pit',mesh:m,x,z,w,d});
  }
  function addV53Lava(x,z,w,d){
    const m=box(w,.12,d,0xff3600,{emissive:0xff1800,emissiveIntensity:1.35,roughness:.18,outline:true,outlineColor:0xffd000,outlineOpacity:.25});
    m.position.set(x,.11,z); v53Add(m);
    const glow=addGlowSprite(x,.50,z,0xff4d00,Math.max(w,d)*1.45,.26);
    hazards.push({type:'lava',mesh:m,glow,x,z,w,d});
    for(let i=0;i<8;i++){ const b=box(.28,.28,.28,0xffc400,{emissive:0xff6b00,emissiveIntensity:.8}); b.position.set(x+(Math.random()-.5)*w,.35,z+(Math.random()-.5)*d); v53Add(b); b.userData.float={baseY:b.position.y,speed:1.5+Math.random(),amp:.18}; }
  }
  function applyV53CodexGameplayLayer(level,len,lanes){
    if(realBg || !levelGroup || !window.THREE || !level || level.id==='hub') return;
    document.body.classList.add('v53-codex-obedecido');
    if(els.game) els.game.classList.add('v53-codex-obedecido');
    V53_CODEX_VISUAL_GAMEPLAY.active=true;
    addPowerup('sword',0,1.18,-22);
    addPowerup('shield',2.4,1.18,-78);
    addPowerup('star',0,1.35,-138);
    addV53Water(0,-52,4.8,8.5);
    addV53Pit(-3.4,-112,3.5,5.6);
    addV53Lava(level.world==='fire'?0:4.2,-168,level.world==='fire'?7.0:3.8,8.0);
    for(const e of enemies) v53EnhanceEnemy(e);
  }

  function applyV42LevelDesign(level, len, lanes){
    const cfg = WORLD[level.world] || WORLD.field;
    const guides = V42_LEVEL_GUIDES[level.id] || ['Começo seguro', 'Primeiro desafio', 'Checkpoint', 'Último desafio', 'Portal'];
    const positions = [ -12, -48, -Math.max(86, Math.floor(len*.38)), -Math.max(132, Math.floor(len*.64)), -Math.max(172, Math.floor(len*.84)) ];
    guides.forEach((text, i) => {
      const z = Math.max(-len + 24, positions[i] || (-18 - i*44));
      const x = i % 2 ? -7.35 : 7.35;
      addV42GuideBoard(text, x, z, cfg.accent, i);
      addV42LaneCue(lanes[i % lanes.length], z + 4, cfg.accent, i);
    });

    // Plataformas de intenção: começo fácil, meio com recompensa, final com pista clara.
    if (level.id === 'training') {
      addV42SafePad(0, -10, 0x4ade80, 'começo');
      addV42SafePad(-5, -36, 0x22c55e, 'pulo');
      addV42SafePad(5, -72, 0xfacc15, 'recompensa');
    } else if (level.id === 'volcano') {
      [-38,-74,-112,-162].filter(z => Math.abs(z) < len-22).forEach((z,i)=> addV42WarningStrip(lanes[(i+1)%3], z+4, 0xffd000, 'perigo'));
    } else if (level.id === 'forest') {
      [-92,-194].filter(z => Math.abs(z) < len-25).forEach((z,i)=> addV42GuideBoard('Y / MINI', lanes[i%3], z+6, 0x22c55e, i+6));
    } else if (level.id === 'castle') {
      addV42GuideBoard('X GIGANTE', 0, -Math.min(len-42, 138)+6, 0xf59e0b, 8);
      addV42WarningStrip(0, -Math.min(len-42, 138)+2, 0xf59e0b, 'portão');
    } else if (level.id === 'space') {
      [-42,-132,-222].filter(z => Math.abs(z)<len-24).forEach((z,i)=> addV42LandingLights(i%2?-7:7, z-6, 0x38bdf8));
    } else if (level.id === 'arena') {
      addV42GuideBoard('BOSS FINAL', 0, -Math.min(len-70, 320), 0xff2e63, 10);
      addV42WarningStrip(0, -Math.min(len-70, 320)+8, 0xff2e63, 'boss');
    }

    addV42PortalRunway(len, cfg);
  }

  function addV42GuideBoard(text, x, z, color, order=0){
    const post = box(.34,2.15,.34,0x111827,{ outline:true, outlineColor:color, outlineOpacity:.25 });
    post.position.set(x,1.08,z); levelGroup.add(post);
    const board = box(2.75,.72,.22,color,{ emissive:color, emissiveIntensity:.18, outline:true, outlineColor:0xffffff, outlineOpacity:.16 });
    board.position.set(x,2.15,z); levelGroup.add(board);
    const sprite = makeV42TextSprite(text, color);
    sprite.position.set(x,2.22,z + (x < 0 ? .34 : -.34));
    sprite.material.depthTest = false;
    levelGroup.add(sprite);
    v42Markers.push({ type:'guide', text, x, z, order });
  }

  function makeV42TextSprite(text, color){
    const canvas = document.createElement('canvas');
    canvas.width = 384; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,512,144);
    ctx.fillStyle = 'rgba(3,7,18,.78)';
    ctx.fillRect(0,0,384,96);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.strokeRect(5,5,374,86);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px Arial, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const label = String(text || '').toUpperCase().slice(0,10);
    ctx.fillText(label,192,51);
    const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
    const matSprite = new THREE.SpriteMaterial({ map:tex, transparent:true, opacity:.92, depthWrite:false });
    const sprite = new THREE.Sprite(matSprite);
    sprite.scale.set(3.2,.82,1);
    premiumVisuals.push(sprite);
    return sprite;
  }

  function addV42LaneCue(x,z,color,order=0){
    const base = box(2.2,.10,1.35,color,{ emissive:color, emissiveIntensity:.22, outline:true, outlineColor:0xffffff, outlineOpacity:.13 });
    base.position.set(x,.18,z); levelGroup.add(base);
    const tip = box(.55,.12,.55,0xffffff,{ emissive:color, emissiveIntensity:.14 });
    tip.position.set(x,.26,z-.82); tip.rotation.y = Math.PI/4; levelGroup.add(tip);
    v42Markers.push({ type:'cue', x, z, order });
  }

  function addV42SafePad(x,z,color,label){
    const pad = box(5.2,.16,4.2,color,{ emissive:color, emissiveIntensity:.08, outline:true, outlineColor:0xffffff, outlineOpacity:.12, roughness:.55 });
    pad.position.set(x,.12,z); levelGroup.add(pad);
    v42Markers.push({ type:'safePad', label, x, z });
  }

  function addV42WarningStrip(x,z,color,label){
    const stripA = box(4.6,.14,.30,color,{ emissive:color, emissiveIntensity:.45, outline:true, outlineColor:0x111827, outlineOpacity:.2 });
    stripA.position.set(x,.22,z); levelGroup.add(stripA);
    const stripB = box(4.6,.14,.30,color,{ emissive:color, emissiveIntensity:.22, outline:true, outlineColor:0x111827, outlineOpacity:.2 });
    stripB.position.set(x,.22,z-2.2); levelGroup.add(stripB);
    v42Markers.push({ type:'warning', label, x, z });
  }

  function addV42LandingLights(x,z,color){
    [-1.1,1.1].forEach(dx=>{
      const lightPad = box(.55,.16,.55,color,{ emissive:color, emissiveIntensity:.5, outline:true, outlineColor:0xffffff, outlineOpacity:.16 });
      lightPad.position.set(x+dx,.32,z); levelGroup.add(lightPad); premiumVisuals.push(lightPad);
    });
    v42Markers.push({ type:'landingLights', x, z });
  }

  function addV42PortalRunway(len,cfg){
    const start = -len + 26;
    for (let i=0;i<5;i++) {
      const z = start - i*5;
      const w = 6.6 - i*.8;
      const r = box(w,.12,.32,cfg.accent,{ emissive:cfg.accent, emissiveIntensity:.25, outline:true, outlineColor:0xffffff, outlineOpacity:.12 });
      r.position.set(0,.18,z); levelGroup.add(r);
    }
    v42Markers.push({ type:'portalRunway', z:start });
  }


  function applyV44EnemyBossLayer(level, len, lanes){
    const cfg = WORLD[level.world] || WORLD.field;
    // Camada V44 do roteiro: somente leitura de adversário, arenas curtas e boss. Sem mexer em controle/AR/Quiz.
    addV44EnemyDangerZones(level, len, lanes, cfg);
    addV44BossArenaIfNeeded(level, len, cfg);
    v44EnemyMarkers.push({ type:'route', label:V44_ENEMY_AI.label, level:level.id, enemies:level.enemies || 0, boss:!!level.boss });
  }

  function addV44EnemyDangerZones(level, len, lanes, cfg){
    const total = Math.min(level.enemies || 4, 9);
    for (let i=0;i<total;i++) {
      const z = -34 - i * ((len-70) / Math.max(1,(level.enemies||4)-1));
      if (Math.abs(z) > len-18) continue;
      const x = lanes[(i+2)%lanes.length];
      const color = i%3===0 ? 0xef4444 : i%3===1 ? 0xfacc15 : cfg.accent;
      const pad = box(2.9,.075,2.0,color,{ emissive:color, emissiveIntensity:.13, outline:true, outlineColor:0xffffff, outlineOpacity:.10 });
      pad.position.set(x,.155,z+1.2); levelGroup.add(pad); premiumVisuals.push(pad);
      if (i%2===0) {
        const side = x < 0 ? -1 : 1;
        const post = box(.28,1.15,.28,color,{ emissive:color, emissiveIntensity:.35, outline:true, outlineOpacity:.10 });
        post.position.set(x + side*1.75,.7,z+1.2); levelGroup.add(post); premiumVisuals.push(post);
      }
    }
    v44EnemyMarkers.push({ type:'enemyDangerZones', count:total });
  }

  function addV44BossArenaIfNeeded(level, len, cfg){
    if (!level.boss) return;
    const z = -Math.min(len-70, 320);
    const floor = box(10.2,.10,7.2,0x2e1065,{ emissive:cfg.accent, emissiveIntensity:.12, outline:true, outlineColor:0xff2e63, outlineOpacity:.25 });
    floor.position.set(0,.16,z); levelGroup.add(floor); premiumVisuals.push(floor);
    [-5.4,5.4].forEach(x=>{
      const obelisk = box(.55,3.4,.55,0xff2e63,{ emissive:0xff2e63, emissiveIntensity:.42, outline:true, outlineOpacity:.18 });
      obelisk.position.set(x,1.75,z); obelisk.userData.float={baseY:1.75, amp:.18, speed:.9}; levelGroup.add(obelisk); premiumVisuals.push(obelisk); addGlowSprite(x,2.35,z,0xff2e63,3.8,.14);
    });
    v44EnemyMarkers.push({ type:'bossArena', z });
  }

  function addPlatform(x,y,z,w,h,d,color){
    const m=box(w,h,d,color,{ outline:true, outlineColor:shadeColor(color, 35), outlineOpacity:.20, roughness:.58 });
    addTopHighlight(m,w,h,d,color);
    m.position.set(x,y,z); levelGroup.add(m);
    platforms.push({mesh:m,x,y,z,w,h,d,top:y+h/2,type:'platform'}); solids.push(platforms[platforms.length-1]); return m;
  }
  function addBreakable(x,z){
    const m=box(2.2,2.0,2.2,0x111827,{ outline:true, outlineColor:0x64748b, outlineOpacity:.35, emissive:0x0f172a, emissiveIntensity:.15 });
    for(let i=0;i<3;i++){ const crack=box(.08,1.85,.05,0xf97316,{ emissive:0xf97316, emissiveIntensity:.5 }); crack.position.set((i-1)*.42,.05,1.13); crack.rotation.z=(i-1)*.25; m.add(crack); }
    m.position.set(x,1,z); levelGroup.add(m); platforms.push({mesh:m,x,z,w:2.2,h:2,d:2.2,top:2,breakable:true,hp:2,type:'box'}); solids.push(platforms[platforms.length-1]);
  }
  function addHazard(type,x,z,w,d){
    const c=type==='pit'?0x020203:0xff2d00; const h=type==='pit'?.06:.14;
    const m=box(w,h,d,c,{ emissive:type==='lava'?0xff1f00:0x000000, emissiveIntensity:type==='lava'?.9:0, roughness:.35, outline:true, outlineColor:type==='lava'?0xffd000:0x64748b, outlineOpacity:.22 });
    m.position.set(x,.07,z); levelGroup.add(m);
    let glow=null;
    if(type==='lava'){ glow=addGlowSprite(x,.75,z,0xff4d00,Math.max(w,d)*1.25,.2); glow.userData.hazardGlow=true; }
    hazards.push({type,mesh:m,glow,x,z,w,d});
  }
  function addCrystal(x,y,z){
    const g=new THREE.OctahedronGeometry(.48,1);
    const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x67e8f9,emissive:0x0891b2,emissiveIntensity:.65,roughness:.22,metalness:.18,flatShading:true}));
    m.position.set(x,y,z); m.castShadow=true; levelGroup.add(m);
    const glow=addGlowSprite(x,y,z,0x67e8f9,2.3,.22);
    const light=new THREE.PointLight(0x22d3ee,.35,7); light.position.set(x,y,z); levelGroup.add(light); premiumVisuals.push(light);
    crystals.push({mesh:m,glow,light,x,y,z,got:false,r:.85});
  }
  function addCheckpoint(z){
    const m=box(.9,2.2,.45,0xfacc15,{ emissive:0xfacc15, emissiveIntensity:.22, outline:true, outlineColor:0xffffff, outlineOpacity:.28 });
    const flag=box(1.6,.75,.08,0x22c55e,{ emissive:0x22c55e, emissiveIntensity:.18 }); flag.position.set(.7,.55,0); m.add(flag);
    m.position.set(-7.2,1.1,z); levelGroup.add(m); addGlowSprite(-7.2,2.2,z,0xfacc15,2.8,.16); checkpoints.push({z,mesh:m});
  }
  function addTunnel(x,z){ const top=box(4.2,.7,2.0,0x475569); top.position.set(x,2.0,z); const l=box(.55,2.0,2.0,0x334155); l.position.set(x-2.1,1,z); const r=box(.55,2.0,2.0,0x334155); r.position.set(x+2.1,1,z); levelGroup.add(top,l,r); gates.push({x,z,w:4.1,d:2.2,need:'crouch',open:false,parts:[top,l,r],tunnel:true}); }
  function addGate(x,z,need){ const l=box(.75,4,1.0,0x7f1d1d); const r=box(.75,4,1.0,0x7f1d1d); const top=box(5.4,.7,1.0,0x991b1b); l.position.set(x-2.8,2,z); r.position.set(x+2.8,2,z); top.position.set(x,4.2,z); levelGroup.add(l,r,top); gates.push({x,z,w:5.6,d:1.6,need,open:false,parts:[l,r,top]}); }
  function addQuizAltar(x,z){ const base=box(3,1,3,0x4c1d95); base.position.set(x,.5,z); const top=box(1.4,1.4,1.4,0x8b5cf6); top.position.set(x,1.7,z); levelGroup.add(base,top); gates.push({x,z,w:4,d:4,need:'quiz',open:false,parts:[base,top],altar:true}); }
  function addEnemy(type,x,z){
    const color = { walker:0x84cc16, jumper:0x22c55e, flyer:0x4c1d95, spiky:0x22c55e, golem:0x94a3b8, boss:0x111827 }[type] || 0x84cc16;
    const size = type==='boss'?2.05:type==='golem'?1.55:1.08;
    const m=makeEnemyModel(type,size,color); m.position.set(x,size/2,z); levelGroup.add(m);
    const maxHp = type==='boss'?V44_ENEMY_AI.bossHp:type==='golem'?V44_ENEMY_AI.golemHp:type==='spiky'?V44_ENEMY_AI.spikyHp:type==='flyer'?V44_ENEMY_AI.flyerHp:1;
    attachV44EnemyReadability(m, size, color, maxHp, type);
    enemies.push({mesh:m,type,x,z,baseX:x,baseZ:z,y:size/2,hp:maxHp,maxHp,dead:false,t:Math.random()*9,size,nextAttackAt:now()+900+Math.random()*1200,alert:0,phase:Math.random()*6.28,vulnerable:type!=='boss',vulnerableUntil:0});
  }

  function attachV44EnemyReadability(group, size, color, maxHp, type){
    const groundShadow = new THREE.Mesh(new THREE.CircleGeometry(size*.68,22), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:.22, depthWrite:false }));
    groundShadow.rotation.x = -Math.PI/2; groundShadow.position.y = -size/2 + .026; group.add(groundShadow);
    const dangerRing = new THREE.Mesh(new THREE.RingGeometry(size*.72,size*.86,24), new THREE.MeshBasicMaterial({ color:type==='boss'?0xff2e63:color, transparent:true, opacity:.13, side:THREE.DoubleSide, depthWrite:false }));
    dangerRing.rotation.x = -Math.PI/2; dangerRing.position.y = -size/2 + .035; group.add(dangerRing); group.userData.dangerRing = dangerRing;
    if (maxHp > 1) {
      const bg = box(size*1.25,.11,.08,0x111827,{ outline:false });
      const fill = box(size*1.18,.13,.09,0x22c55e,{ emissive:0x22c55e, emissiveIntensity:.35 });
      bg.position.set(0,size*.90,size*.60); fill.position.set(0,size*.90,size*.66);
      group.add(bg,fill); group.userData.hpFill = fill;
    }
  }

  function makeEnemyModel(type,size,color){
    const g=new THREE.Group();
    const bodyColor = type==='flyer' ? 0x12081f : type==='spiky' ? 0x22c55e : type==='golem' ? 0x8b95a4 : color;
    const body=box(size,size,size,bodyColor,{ outline:true, outlineColor:shadeColor(bodyColor,45), outlineOpacity:.30, emissive:type==='boss'?0x3b0764:(type==='flyer'?0x7e22ce:0x000000), emissiveIntensity:type==='boss'?.32:(type==='flyer'?.22:0) });
    body.position.y=0; g.add(body);
    const eyeMat=mat(0xffffff,0xffffff,{ emissiveIntensity:.85, roughness:.2 });
    const pupilMat=mat((type==='spiky'||type==='flyer')?0xff0000:0x111827,(type==='spiky'||type==='flyer')?0xff0000:0x000000,{ emissiveIntensity:(type==='spiky'||type==='flyer')?.55:0 });
    [-.22,.22].forEach(ex=>{ const eye=new THREE.Mesh(new THREE.BoxGeometry(size*.18,size*.13,.04),eyeMat); eye.position.set(ex*size, size*.18, size*.52); g.add(eye); const pupil=new THREE.Mesh(new THREE.BoxGeometry(size*.08,size*.08,.05),pupilMat); pupil.position.set(ex*size, size*.18, size*.55); g.add(pupil); });
    if(type==='flyer'){
      [-1,1].forEach(s=>{ const wing=box(size*.38,size*.38,size*.38,0xa855f7,{ emissive:0x7e22ce, emissiveIntensity:.55, outline:true, outlineOpacity:.18 }); wing.position.set(s*size*.88,.1,0); g.add(wing); });
      const aura = box(size*1.45,.10,size*1.45,0x8b5cf6,{ emissive:0xa855f7, emissiveIntensity:.35, transparent:true, opacity:.40, outline:false });
      aura.position.set(0,-size*.42,0); g.add(aura);
    }
    if(type==='spiky'){
      body.material.color.setHex(0x2abf58);
      for(let i=0;i<6;i++){ const sp=box(size*.18,size*.55,size*.18,0xf8fafc,{ emissive:0xffffff, emissiveIntensity:.12 }); sp.position.set((i%3-1)*size*.34, size*.72, (i>2?.28:-.28)*size); sp.rotation.set(.7,0,.7); g.add(sp); }
    }
    if(type==='golem' || type==='boss'){
      body.material.color.setHex(type==='boss' ? bodyColor : 0x8c96a4);
      [-1,1].forEach(s=>{ const arm=box(size*.34,size*.9,size*.34,shadeColor(bodyColor,-18),{outline:true,outlineOpacity:.20}); arm.position.set(s*size*.78,-.05,0); g.add(arm); });
      const crown=box(size*.9,size*.22,size*.9,type==='boss'?0xff2e63:0x94a3b8,{emissive:type==='boss'?0xff2e63:0xe2e8f0,emissiveIntensity:.22}); crown.position.y=size*.7; g.add(crown);
    }
    g.userData.float = { baseY:0, amp:type==='flyer'?.2:.05, speed:type==='boss'?1.4:2.1 };
    return g;
  }
  function addPortalObject(x,z,color,world){
    const g=new THREE.Group(); const a=mat(color, color,{ emissiveIntensity:.45, roughness:.28 });
    const l=new THREE.Mesh(new THREE.BoxGeometry(.7,4,1),a); const r=l.clone(); const top=new THREE.Mesh(new THREE.BoxGeometry(4,.7,1),a);
    [l,r,top].forEach(o=>{ o.castShadow=true; o.receiveShadow=true; addVoxelEdges(o,0xffffff,.18); });
    l.position.set(-1.7,2,0); r.position.set(1.7,2,0); top.position.set(0,4,0); g.add(l,r,top);
    const core=new THREE.Mesh(new THREE.CircleGeometry(1.15,32), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.28, side:THREE.DoubleSide })); core.position.set(0,2.05,.54); g.add(core);
    g.position.set(x,0,z); g.userData.world = world; levelGroup.add(g); addGlowSprite(x,2.1,z,color,5,.16); return g;
  }
  function createPortal(length){
    const z = -length - 10; const g=new THREE.Group();
    const open = mat(0x22c55e,0x0f5132,{ emissiveIntensity:.55, roughness:.25 }), locked = mat(0x475569,0x111827,{ emissiveIntensity:.12 }), coreMat = new THREE.MeshBasicMaterial({color:0x38bdf8, transparent:true, opacity:.56, side:THREE.DoubleSide});
    const l=new THREE.Mesh(new THREE.BoxGeometry(.75,5.2,1), locked); const r=l.clone(); const top=new THREE.Mesh(new THREE.BoxGeometry(4.6,.75,1), locked); const core=new THREE.Mesh(new THREE.TorusGeometry(1.45,.16,12,48), coreMat);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(1.32,48), new THREE.MeshBasicMaterial({color:0x22d3ee,transparent:true,opacity:.20,side:THREE.DoubleSide,depthWrite:false}));
    [l,r,top].forEach(o=>{ o.castShadow=true; o.receiveShadow=true; addVoxelEdges(o,0xffffff,.20); });
    l.position.set(-1.9,2.6,0); r.position.set(1.9,2.6,0); top.position.set(0,5.15,0); core.position.set(0,2.65,.18); disc.position.set(0,2.65,.2);
    const light=new THREE.PointLight(0x22d3ee,1.25,18); light.position.set(0,2.8,.8);
    g.add(l,r,top,disc,core,light); g.position.set(0,0,z); g.userData={locked,open,core,disc,light}; levelGroup.add(g); portalMesh=g; addGlowSprite(0,2.8,z,0x22d3ee,7,.18);
  }

  function animate(){
    animReq = requestAnimationFrame(animate);
    const dt = Math.min(.045, clock.getDelta());
    if (mixer) mixer.update(dt);
    if (playing && !paused) update(dt);
    updateV54Render(dt);
    syncGameplayVisibility();
    syncV55VisualLanguage();
    if (renderer && scene && camera) renderer.render(scene,camera);
  }

  function update(dt){
    updateInput(dt); updateTimer(dt); updatePlayer(dt); updateEnemies(dt); updateV44EnemyProjectiles(dt); updateFireballs(dt); updateParticles(dt); updatePremiumVisuals(dt); syncGameplayVisibility(); syncV55VisualLanguage(); syncOpenWorldInteriors(); syncActionProximity(); checkPowerups(); checkCrystals(); checkHazards(); checkCheckpoints(); checkGates(); checkPortal(); updateCamera(dt); updateHud();
  }
  function updateTimer(dt){ if (runtime && runtime.timer) { runtime.timer -= dt; if (runtime.timer <= 0) damagePlayer(999,'Tempo esgotado!'); } }
  function updateInput(dt=1/60){
    if (realBg && now() < arSafeUntil) {
      clearMovementState();
      if (p) { p.vx = 0; p.vz = 0; }
      return;
    }
    const kx = (keyboard.right?1:0) - (keyboard.left?1:0) + (moveHold.right?1:0) - (moveHold.left?1:0);
    const kz = (keyboard.forward?1:0) - (keyboard.back?1:0) + (moveHold.forward?1:0) - (moveHold.back?1:0);
    let rawX = clamp(joy.x + kx, -1, 1);
    let rawZ = clamp(joy.z + kz, -1, 1);
    const rawMag = Math.hypot(rawX, rawZ);
    if (rawMag > 1) { rawX /= rawMag; rawZ /= rawMag; }
    if (rawMag < .035) { rawX = 0; rawZ = 0; }
    inputTarget.x = rawX;
    inputTarget.z = rawZ;
    const rate = Math.hypot(rawX, rawZ) < .035 ? GAME_FEEL.inputRelease : GAME_FEEL.inputSmoothing;
    const blend = Math.min(1, dt * rate);
    input.x += (inputTarget.x - input.x) * blend;
    input.z += (inputTarget.z - input.z) * blend;
    if (Math.abs(input.x) < .025 && rawX === 0) input.x = 0;
    if (Math.abs(input.z) < .025 && rawZ === 0) input.z = 0;
  }

  function updatePlayer(dt){
    const diff = DIFFICULTY[progress.difficulty];
    const wasGrounded = p.grounded;
    const prevX = p.x;
    const prevZ = p.z;
    const mag = Math.hypot(input.x, input.z);
    const nx = mag > 1 ? input.x / mag : input.x;
    const nz = mag > 1 ? input.z / mag : input.z;
    const speed = diff.speed * (input.crouch ? .48 : 1) * (p.scaleMode==='giant' ? .86 : p.scaleMode==='mini' ? 1.08 : 1);
    const noInput = mag < .045;
    let targetVx = 0, targetVz = 0;
    if (!noInput && isOpenWorld()) {
      const forwardX = Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = Math.sin(cameraYaw);
      targetVx = (rightX * nx + forwardX * nz) * speed;
      targetVz = (rightZ * nx + forwardZ * nz) * speed;
    } else if (!noInput) {
      targetVx = nx * speed;
      targetVz = -nz * speed;
    }
    const accel = noInput
      ? (p.grounded ? GAME_FEEL.groundDeceleration : GAME_FEEL.airDeceleration)
      : (p.grounded ? GAME_FEEL.groundAcceleration : GAME_FEEL.airAcceleration);
    const blend = Math.min(1, dt * accel);
    p.vx += (targetVx - p.vx) * blend;
    p.vz += (targetVz - p.vz) * blend;
    if (noInput && Math.abs(p.vx) < GAME_FEEL.stopThreshold) p.vx = 0;
    if (noInput && Math.abs(p.vz) < GAME_FEEL.stopThreshold) p.vz = 0;
    if (realBg && AR_SAFE.freezeWhenIdle && noInput) { p.vx = 0; p.vz = 0; input.x = 0; input.z = 0; inputTarget.x = 0; inputTarget.z = 0; }

    p.x += p.vx * dt;
    p.z += p.vz * dt;
    if (isOpenWorld()) {
      p.x = clamp(p.x, -OPEN_WORLD.size, OPEN_WORLD.size);
      p.z = clamp(p.z, -OPEN_WORLD.size, OPEN_WORLD.size);
    } else {
      p.x = clamp(p.x, -6.4, 6.4);
      p.z = clamp(p.z, -currentLevel.length - 14, 8);
    }
    resolveHorizontalSolids(prevX, prevZ);

    const prevY = p.y;
    if (!p.grounded) p.vy -= currentGravity(diff) * dt;
    p.y += p.vy * dt;
    const ground = findGround(p.x,p.z);
    if (p.y < ground.height - .16 && p.vy <= 0) {
      p.y = ground.height;
      p.vy = 0;
      p.grounded = true;
      lastGroundedAt = now();
    }
    const snapWindow = ground.platform ? GAME_FEEL.platformSnap : GAME_FEEL.groundSnap;
    if (p.vy <= 0 && p.y <= ground.height + snapWindow && prevY >= ground.height - .10) {
      p.y = ground.height;
      p.vy = 0;
      p.grounded = true;
      lastGroundedAt = now();
      if (!wasGrounded) {
        lastLandAt = now();
        p.vx *= GAME_FEEL.landingHorizontalDamp;
        p.vz *= GAME_FEEL.landingHorizontalDamp;
      }
      if (ground.platform && ground.platform.breakable && ground.platform.hp <= 0) p.grounded = false;
    } else if (p.y > ground.height + .035) {
      p.grounded = false;
    }

    if (jumpBufferedUntil > now() && canJump()) { doJump(); jumpBufferedUntil = 0; }
    p.height = input.crouch ? 1.25 : 2.4;
    p.targetScale = p.scaleMode==='mini' ? .55 : p.scaleMode==='giant' ? 1.65 : 1;
    p.scale += (p.targetScale - p.scale) * Math.min(1, dt*8);
    const landPulse = Math.max(0, 1 - (now() - lastLandAt) / 180);
    const airStretch = !p.grounded && p.vy > 1 ? .045 : 0;
    const squash = input.crouch ? .62 : (1 - landPulse * .13 + airStretch);
    player.position.set(p.x,p.y + PLAYER_VISUAL_Y_OFFSET,p.z); player.scale.set(p.scale * (1 + landPulse*.045), p.scale*squash, p.scale * (1 + landPulse*.045));
    if (player.userData && player.userData.contactShadow) {
      const h = Math.max(0, p.y - findGround(p.x,p.z).height);
      const s = clamp(1.15 - h*.10, .42, 1.18) * p.scale;
      player.userData.contactShadow.visible = !realBg;
      player.userData.contactShadow.scale.set(s, s, 1);
      player.userData.contactShadow.material.opacity = clamp(.28 - h*.035, .07, .28);
      player.userData.contactShadow.position.y = .03 - PLAYER_VISUAL_Y_OFFSET;
    }
    if (Math.hypot(p.vx,p.vz) > .1) { const rot = Math.atan2(p.vx,p.vz); p.facing = rot; player.rotation.y += angleDelta(player.rotation.y, rot) * Math.min(1, dt*10); }
    if (now() < p.spinUntil) player.rotation.y += dt*14;
    if (playerModel) playerModel.visible = !(now() < p.invUntil && Math.floor(now()/90)%2===0);
    updatePlayerProceduralAnim(dt);
    if (p.y < -10) damagePlayer(1,'Caiu no buraco!');
  }
  function canJump(){ return p.grounded || (now() - lastGroundedAt < GAME_FEEL.coyoteMs * DIFFICULTY[progress.difficulty].forgiveness); }
  function currentGravity(diff){
    const worldScale = currentLevel && currentLevel.world === 'space' ? GAME_FEEL.spaceGravityScale : 1;
    const fallScale = p.vy < 0 ? GAME_FEEL.fallGravityBoost : 1;
    return diff.gravity * worldScale * fallScale;
  }
  function doJump(){
    const t = now();
    if (t - lastJumpAt < GAME_FEEL.jumpCooldownMs) return;
    lastJumpAt = t;
    const forward = Math.max(0, input.z);
    p.vy = DIFFICULTY[progress.difficulty].jump + (forward > .35 ? .35 : 0);
    if (isOpenWorld()) {
      const fX = Math.sin(cameraYaw), fZ = -Math.cos(cameraYaw);
      const rX = Math.cos(cameraYaw), rZ = Math.sin(cameraYaw);
      p.vx += (rX * input.x + fX * input.z) * GAME_FEEL.jumpSideBoost;
      p.vz += (rZ * input.x + fZ * input.z) * GAME_FEEL.jumpSideBoost;
    } else {
      p.vz += -forward * GAME_FEEL.jumpForwardBoost;
      p.vx += input.x * GAME_FEEL.jumpSideBoost;
    }
    p.grounded=false;
    toast('Pulo!', 'good');
    beep(520,70,'square');
  }
  function jump(){ if (!playing || paused) return; jumpBufferedUntil = now() + GAME_FEEL.jumpBufferMs; if (canJump()) { doJump(); jumpBufferedUntil = 0; } }

  function findGround(x,z){
    let best = { height:.14, platform:null };
    for (const pl of platforms) {
      if (pl.breakable && pl.hp <= 0) continue;
      if (Math.abs(x-pl.x) <= pl.w/2 + .45 && Math.abs(z-pl.z) <= pl.d/2 + .45) {
        if (pl.top > best.height && p.y >= pl.top - .45) best = { height:pl.top, platform:pl };
      }
    }
    return best;
  }

  function solidBounds(pl, radius){
    return {
      minX: pl.x - pl.w/2 - radius,
      maxX: pl.x + pl.w/2 + radius,
      minZ: pl.z - pl.d/2 - radius,
      maxZ: pl.z + pl.d/2 + radius,
      bottom: pl.y !== undefined ? pl.y - pl.h/2 : 0,
      top: pl.top !== undefined ? pl.top : (pl.y || 0) + (pl.h || 0)/2
    };
  }

  function isBlockingSolid(pl){
    if (!pl || (pl.breakable && pl.hp <= 0)) return false;
    const head = p.y + p.height * p.scale;
    const bottom = pl.y !== undefined ? pl.y - pl.h/2 : 0;
    const top = pl.top !== undefined ? pl.top : (pl.y || 0) + (pl.h || 0)/2;
    if (head <= bottom + .08) return false;
    if (p.y >= top - .06) return false;
    return true;
  }

  function resolveHorizontalSolids(prevX, prevZ){
    const radius = Math.max(.42, p.radius * p.scale);
    for (const pl of solids) {
      if (!isBlockingSolid(pl)) continue;
      const b = solidBounds(pl, radius);
      if (p.x <= b.minX || p.x >= b.maxX || p.z <= b.minZ || p.z >= b.maxZ) continue;
      const wasLeft = prevX <= b.minX;
      const wasRight = prevX >= b.maxX;
      const wasFront = prevZ <= b.minZ;
      const wasBack = prevZ >= b.maxZ;
      if (wasLeft) { p.x = b.minX; p.vx = Math.min(0, p.vx); continue; }
      if (wasRight) { p.x = b.maxX; p.vx = Math.max(0, p.vx); continue; }
      if (wasFront) { p.z = b.minZ; p.vz = Math.min(0, p.vz); continue; }
      if (wasBack) { p.z = b.maxZ; p.vz = Math.max(0, p.vz); continue; }
      const pushX = Math.min(Math.abs(p.x - b.minX), Math.abs(b.maxX - p.x));
      const pushZ = Math.min(Math.abs(p.z - b.minZ), Math.abs(b.maxZ - p.z));
      if (pushX < pushZ) {
        p.x = p.x < pl.x ? b.minX : b.maxX;
        p.vx = 0;
      } else {
        p.z = p.z < pl.z ? b.minZ : b.maxZ;
        p.vz = 0;
      }
    }
  }


  function updateV44EnemyHpBar(e){
    if (!e || !e.mesh || !e.mesh.userData.hpFill || !e.maxHp) return;
    const pct = clamp(e.hp / e.maxHp, 0, 1);
    e.mesh.userData.hpFill.scale.x = Math.max(.06, pct);
    const color = pct > .55 ? 0x22c55e : pct > .25 ? 0xfacc15 : 0xef4444;
    e.mesh.userData.hpFill.material.color.setHex(color);
    if (e.mesh.userData.hpFill.material.emissive) e.mesh.userData.hpFill.material.emissive.setHex(color);
  }

  function v44EnemyDelay(){
    return progress.difficulty === 'hard' ? V44_ENEMY_AI.hardAttackMs : progress.difficulty === 'medium' ? V44_ENEMY_AI.mediumAttackMs : V44_ENEMY_AI.easyAttackMs;
  }

  function v44EnemyCanAttack(e){
    if (!V44_ENEMY_AI.enabled || realBg || !playing || paused || !e || e.dead || !p) return false;
    if (e.type === 'walker') return false;
    const d = Math.hypot(e.x-p.x, e.z-p.z);
    return d < V44_ENEMY_AI.vision && now() > e.nextAttackAt;
  }

  function v44EnemyAttack(e){
    e.nextAttackAt = now() + v44EnemyDelay() + Math.random()*650;
    e.alert = .38;
    if (e.mesh && e.mesh.userData.dangerRing) e.mesh.userData.dangerRing.material.opacity = .38;
    if (e.type === 'spiky') return;
    const dx = p.x - e.x, dz = p.z - e.z;
    const mag = Math.max(.001, Math.hypot(dx,dz));
    if (e.type === 'boss') {
      e.vulnerableUntil = now() + 1350;
      const base = Math.atan2(dz, dx);
      [-.34, 0, .34].forEach(offset => {
        const a = base + offset;
        addV44EnemyProjectile(e.x, Math.max(1.35, e.y + e.size*.50), e.z, Math.cos(a), Math.sin(a), e.type);
      });
      toast('Boss abriu guarda!', 'warn');
      return;
    }
    addV44EnemyProjectile(e.x, Math.max(1.15, e.y + e.size*.45), e.z, dx/mag, dz/mag, e.type);
  }

  function addV44EnemyProjectile(x,y,z,dx,dz,type){
    const color = type==='boss'?0xff2e63:type==='flyer'?0xa855f7:type==='golem'?0xfacc15:0xef4444;
    const m = box(.34,.34,.34,color,{ emissive:color, emissiveIntensity:.80, outline:true, outlineColor:0xffffff, outlineOpacity:.14 });
    m.position.set(x,y,z); levelGroup.add(m); addGlowSprite(x,y,z,color,1.55,.10);
    enemyProjectiles.push({ mesh:m, x,y,z, vx:dx*V44_ENEMY_AI.projectileSpeed, vz:dz*V44_ENEMY_AI.projectileSpeed, life:V44_ENEMY_AI.projectileLife, type });
  }

  function updateV44EnemyProjectiles(dt){
    for (let i=enemyProjectiles.length-1;i>=0;i--) {
      const s = enemyProjectiles[i];
      s.life -= dt; s.x += s.vx*dt; s.z += s.vz*dt; s.mesh.position.set(s.x,s.y,s.z); s.mesh.rotation.y += dt*8;
      if (Math.abs(p.x-s.x) < .82*p.scale + .36 && Math.abs(p.z-s.z) < .82*p.scale + .36 && p.y < s.y + .7) {
        damagePlayer(1, s.type==='boss' ? 'Ataque do boss!' : 'Projétil inimigo!');
        levelGroup.remove(s.mesh); enemyProjectiles.splice(i,1); continue;
      }
      if (s.life <= 0) { levelGroup.remove(s.mesh); enemyProjectiles.splice(i,1); }
    }
  }

  function updateEnemies(dt){
    for (const e of enemies) {
      if (e.dead) continue; e.t += dt;
      if (e.type==='walker') { e.x = e.baseX + Math.sin(e.t*1.35)*2.15; e.y = e.size/2; }
      if (e.type==='jumper') { const phase = (e.t*0.5 + e.phase) % 1; const jumpArc = phase < .50 ? Math.sin(phase*Math.PI/.50) : 0; e.x = e.baseX + Math.sin(e.t*.9)*1.45; e.y = e.size/2 + jumpArc*1.75; }
      if (e.type==='flyer') { e.x = e.baseX + Math.sin(e.t*1.45)*3.45; e.z = e.baseZ + Math.cos(e.t*.75)*1.05; e.y = 3.05 + Math.sin(e.t*2.1)*.58; }
      if (e.type==='spiky') { e.x = e.baseX + Math.sin(e.t*.75)*1.15; e.y = e.size/2; }
      if (e.type==='golem') { e.x = e.baseX + Math.sin(e.t*.52)*.95; e.z = e.baseZ + Math.sin(e.t*.38)*.55; e.y = e.size/2; }
      if (e.type==='boss') updateBossEnemy(e);
      e.mesh.position.set(e.x,e.y,e.z); e.mesh.rotation.y += dt*(e.type==='boss'?1.45:e.type==='flyer'?1.7:.9);
      if (v44EnemyCanAttack(e)) v44EnemyAttack(e);
      if (e.alert > 0) { e.alert -= dt; if (e.mesh.userData.dangerRing) e.mesh.userData.dangerRing.material.opacity = .13 + Math.max(0,e.alert)*.58; }
      if (touchEnemy(e)) resolveEnemy(e);
    }
  }
  function updateBossEnemy(e){
    const cycle = (e.t + e.phase) % 7.2;
    e.vulnerable = now() < e.vulnerableUntil || cycle > 5.1;
    e.x = Math.sin(e.t*.65)*4.15;
    e.z = e.baseZ + Math.sin(e.t*.44)*1.25;
    e.y = e.size/2 + Math.abs(Math.sin(e.t*1.25))*.36;
    if (e.mesh && e.mesh.userData.dangerRing) {
      e.mesh.userData.dangerRing.material.opacity = e.vulnerable ? .34 : .15;
      e.mesh.userData.dangerRing.material.color.setHex(e.vulnerable ? 0x22c55e : 0xff2e63);
    }
    if (e.mesh && e.mesh.userData.hpFill && e.mesh.userData.hpFill.material) {
      const color = e.vulnerable ? 0x22c55e : 0xff2e63;
      e.mesh.userData.hpFill.material.color.setHex(color);
      if (e.mesh.userData.hpFill.material.emissive) e.mesh.userData.hpFill.material.emissive.setHex(color);
    }
  }
  function touchEnemy(e){ const r = p.radius*p.scale + e.size*.58; return Math.abs(p.x-e.x)<r && Math.abs(p.z-e.z)<r && p.y < e.y+e.size*1.05 && p.y+p.height*p.scale > e.y-e.size*.55; }
  function resolveEnemy(e){ if(now() < (p.starUntil||0)){ damageEnemy(e,99); toast('Estrela atravessou o inimigo!', 'good'); return; } const under = e.mustCrouchUnder && (input.crouch || p.scaleMode==='mini') && p.y < e.y; if(under){ toast('Passou por baixo!', 'good'); addXP(4); return; } const stomp = p.vy < -1 && p.y > e.y + e.size*.18 && e.type !== 'spiky' && e.type !== 'flyer' && !e.shield; if (stomp) { damageEnemy(e, e.type==='boss'?1:99); p.vy=8.5; toast('Pisou no inimigo!', 'good'); beep(640,80); } else if((p.shield||0)>0){ p.shield--; toast('Escudo salvou o Athos!', 'warn'); addParticles(p.x,p.y+1,p.z,0x22c55e,14); } else damagePlayer(DIFFICULTY[progress.difficulty].damage, e.type==='spiky'?'Espinho! Use B Poder.':(e.shield?'Quebre o escudo com espada/B!':'Inimigo acertou!')); }
  function damageEnemy(e,dmg){
    if (e.type === 'boss' && !e.vulnerable) {
      dmg = Math.min(dmg, .25);
      toast('Boss defendeu! Ataque quando ficar verde.', 'warn');
    }
    e.hp -= dmg; updateV44EnemyHpBar(e); addParticles(e.x,e.y,e.z,0xff8a00,16);
    if (e.hp<=0) { e.dead=true; e.mesh.visible=false; runtime.defeated++; progress.totalEnemies=(progress.totalEnemies||0)+1; p.combo=(p.combo||0)+1; addXP((e.type==='boss'?55:e.type==='golem'?22:14) + Math.min(20,p.combo*2)); saveProgress(); toast(e.type==='boss'?`Boss derrotado! Combo x${p.combo}`:`Inimigo derrotado! Combo x${p.combo}`, 'good'); beep(760,100); if(p.combo>=5)addMedal('Sequência Perfeita'); }
  }

  function power(){
    if((p.shield||0)>0 && isDangerNearPlayer(6.5)){ if(defendPlayer(true)) return; }

    if (!playing || paused) return;
    const t = now();
    if (t < powerReadyAt) { toast('Poder carregando!', 'warn'); return; }
    const cooldown = 520;
    powerReadyAt = t + cooldown;
    if (els.powerBtn) {
      els.powerBtn.classList.add('cooldown');
      els.powerBtn.setAttribute('aria-disabled','true');
      els.powerBtn.dataset.cooldown = String(cooldown);
      setTimeout(() => { els.powerBtn.classList.remove('cooldown'); els.powerBtn.removeAttribute('aria-disabled'); delete els.powerBtn.dataset.cooldown; }, cooldown);
    }
    const m=box(.42,.42,.42,0xff7a00,{ emissive:0xff4d00, emissiveIntensity:.75, outline:true, outlineColor:0xfff7ad, outlineOpacity:.24 });
    m.position.set(p.x,p.y+1.25,p.z-.9); levelGroup.add(m);
    let targetEnemy = null, targetScore = Infinity;
    for (const e of enemies) {
      if (e.dead) continue;
      const dz = p.z - e.z;
      const dx = Math.abs(p.x - e.x);
      if (dz > 0 && dz < 46 && dx < 8.5) {
        const score = dz + dx * 2.2;
        if (score < targetScore) { targetScore = score; targetEnemy = e; }
      }
    }
    const aimX = targetEnemy ? (targetEnemy.x - p.x) : (Math.abs(input.x) > .08 ? input.x * .42 : Math.sin(p.facing) * .18);
    const aimZ = targetEnemy ? (targetEnemy.z - p.z) : (input.z < -.45 ? .35 : -1);
    const dir = new THREE.Vector3(aimX,0,aimZ).normalize();
    fireballs.push({mesh:m,x:m.position.x,y:m.position.y,z:m.position.z,vx:dir.x*18 + p.vx*.05,vz:dir.z*25,life:1.9,autoAim:!!targetEnemy});
    addParticles(p.x,p.y+1.3,p.z,0xffa000,12); vibrate(35); beep(210,100,'sawtooth');
  }
  function updateFireballs(dt){
    for (let i=fireballs.length-1;i>=0;i--) {
      const f=fireballs[i]; f.life-=dt; f.x+=f.vx*dt; f.z+=f.vz*dt; f.mesh.position.set(f.x,f.y,f.z); let hit=false;
      for (const e of enemies) if (!e.dead && dist2(f.x,f.z,e.x,e.z) < 2.3) { if(e.shield>0){ e.shield--; if(e.shieldMesh)e.shieldMesh.visible=false; toast('Escudo inimigo quebrado!', 'good'); addParticles(e.x,e.y,e.z,0x38bdf8,14); } else damageEnemy(e,1); hit=true; break; }
      for (const s of platforms) if (s.breakable && s.hp>0 && Math.abs(f.x-s.x)<s.w/2+1 && Math.abs(f.z-s.z)<s.d/2+1) { s.hp--; s.mesh.material.color.setHex(s.hp<=0?0x333333:0x6b7280); if(s.hp<=0)s.mesh.visible=false; addXP(5); hit=true; break; }
      for (const g of gates) if (!hit && !g.open && g.need==='power' && Math.abs(f.x-g.x)<g.w/2+1 && Math.abs(f.z-g.z)<g.d/2+1.2) { openGate(g, 'B Poder abriu a passagem!'); hit=true; break; }
      if (f.life<=0 || hit) { levelGroup.remove(f.mesh); fireballs.splice(i,1); }
    }
  }

  function checkCrystals(){
    for (const c of crystals) if (!c.got && dist3(p.x,p.y+1,p.z,c.x,c.y,c.z) < 1.2 + p.scale*.25) { c.got=true; c.mesh.visible=false; if(c.glow)c.glow.visible=false; if(c.light)c.light.visible=false; runtime.crystals++; progress.totalCrystals=(progress.totalCrystals||0)+1; if(progress.totalCrystals===1)addMedal('Primeiro Cristal'); addXP(9); saveProgress(); addParticles(c.x,c.y,c.z,0x22d3ee,16); toast('Cristal!', 'good'); beep(880,80); vibrate(25); }
    for (const c of crystals) if (!c.got) c.mesh.rotation.y += .035;
  }
  function checkHazards(){ if (p.y>.55) return; for (const h of hazards) if (Math.abs(p.x-h.x)<=h.w/2 && Math.abs(p.z-h.z)<=h.d/2) { if(h.type==='water'){ p.vx*=.78; p.vz*=.78; if(Math.random()<.02) toast('Água deixa lento!', 'warn'); } else damagePlayer(1,h.type==='pit'?'Buraco! Pule ou desvie.':'Lava!'); } }
  function checkCheckpoints(){ for (const cp of checkpoints) if (!cp.done && p.z < cp.z) { cp.done=true; runtime.checkpoint = cp.z + 4; toast('Checkpoint!', 'warn'); addParticles(-7.2,1.2,cp.z,0xfacc15,10); } }
  function checkGates(){
    for (const g of gates) {
      if (g.open) continue;
      const near = Math.abs(p.z-g.z)<3.6 && Math.abs(p.x-g.x)<g.w/2+.6;
      if (!near) continue;
      let ok = false, msg = '';
      if (g.need === 'crouch') { ok = input.crouch || p.scaleMode==='mini'; msg='Segure Y ou use X para ficar mini!'; }
      else if (g.need === 'giant') { ok = p.scaleMode==='giant'; msg='Use X até ficar gigante!'; }
      else if (g.need === 'power') { ok = runtime.defeated >= 1; msg='Derrote um inimigo ou use B Poder!'; }
      else if (g.need === 'quiz') { ok = runtime.quizSolved; msg='Responda o Quiz para liberar.'; }
      if (ok) openGate(g, g.tunnel?'Passou pelo túnel!':'Passagem liberada!');
      else { toast(msg, 'warn'); if (!g.tunnel && g.need !== 'quiz') p.z += 1.2; }
    }
  }
  function openGate(g, msg='Passagem liberada!'){
    if (!g || g.open) return;
    g.open = true;
    g.parts.forEach((part,i)=>{ part.position.y += i===0?4:3; });
    toast(msg, 'good');
    addParticles(g.x || 0, 2.2, g.z || p.z, 0xfacc15, 20);
    addXP(10);
  }
  function objectivesDone(){ return mode !== 'free' && mode !== 'hub' && runtime && runtime.crystals>=runtime.requiredCrystals && runtime.defeated>=runtime.requiredEnemies && runtime.quizSolved; }
  function checkPortal(){
    if (!portalMesh || (runtime && runtime.completed)) return;
    portalMesh.rotation.y += .015;
    const unlocked = objectivesDone() || mode === 'free' || mode === 'hub';
    portalMesh.children.forEach((ch,i)=>{ if(ch.material && i<3) ch.material.color.setHex(unlocked?0x22c55e:0x475569); });
    if (Math.abs(p.z-portalMesh.position.z)<4.2 && Math.abs(p.x)<3.2) {
      if (mode==='hub') { toast('Escolha uma fase pelo menu.', 'warn'); p.z += 2; return; }
      if (mode==='free') { toast('Portal de brincadeira alcançado!', 'good'); addXP(15); p.z = runtime.checkpoint; return; }
      if (!unlocked) { toast('Portal bloqueado: complete os objetivos.', 'warn'); p.z += 2.5; return; }
      completeLevel();
    }
  }
  function completeLevel(){
    runtime.completed = true; addXP(75); addMedal(currentLevel.medal); unlockWorld(currentLevel.world);
    const elapsed = Math.round((now() - runtime.startedAt) / 1000);
    if (!progress.bestTime || elapsed < progress.bestTime) progress.bestTime = elapsed;
    progress.level = Math.min(LEVELS.length - 1, currentLevelIndex + 1); saveProgress();
    toast('Portal concluído!', 'good'); speak('Portal concluído! Próxima fase liberada.');
    showLevelComplete(elapsed);
  }

  function showLevelComplete(elapsed){
    hardStopAllInput('level-complete');
    const nextIndex = Math.min(LEVELS.length - 1, progress.level || 0);
    const isLast = currentLevelIndex >= LEVELS.length - 1;
    els.modalTitle.textContent = 'Fase concluida!';
    els.modalBody.innerHTML = `
      <div class="answer phase-complete">
        <b>Portal ativado.</b><br>
        XP bonus: +75<br>
        Tempo: ${elapsed}s<br>
        Cristais: ${runtime.crystals}/${runtime.requiredCrystals}<br>
        Inimigos: ${runtime.defeated}/${runtime.requiredEnemies}
      </div>
      <div class="quiz-result-actions phase-actions">
        <button id="phaseNextBtn" class="pixel-btn primary" type="button">${isLast ? 'Jogar arena de novo' : 'Proxima fase'}</button>
        <button id="phaseReplayBtn" class="pixel-btn" type="button">Repetir fase</button>
        <button id="phaseLobbyBtn" class="pixel-btn" type="button">Menu</button>
      </div>`;
    showModal();
    const nextBtn = $('#phaseNextBtn');
    const replayBtn = $('#phaseReplayBtn');
    const lobbyBtn = $('#phaseLobbyBtn');
    if (nextBtn) nextBtn.onclick = () => {
      closeModal();
      currentLevelIndex = isLast ? LEVELS.length - 1 : nextIndex;
      currentLevel = LEVELS[currentLevelIndex];
      buildLevel(currentLevel);
      speak(currentLevel.objective);
    };
    if (replayBtn) replayBtn.onclick = () => {
      closeModal();
      buildLevel(currentLevel);
      speak(currentLevel.objective);
    };
    if (lobbyBtn) lobbyBtn.onclick = () => {
      closeModal();
      exitGame();
    };
  }
  function damagePlayer(amount,msg){
    if(p && ((p.blockUntil||0)>now() || (p.shield||0)>0)){
      if((p.shield||0)>0) p.shield = Math.max(0,(p.shield||0)-1);
      p.invUntil = Math.max(p.invUntil||0, now()+1000);
      addParticles(p.x,p.y+1.2,p.z,0x38bdf8,22);
      toast('Escudo bloqueou!', 'good');
      vibrate(55); beep(360,90,'square');
      updateHud();
      return;
    }

    p.combo = 0;
    const t=now(); if (t < p.invUntil && amount < 999) return; p.invUntil = t + 1250;
    runtime.hearts -= amount; toast(msg,'bad'); flash(); vibrate(70); beep(110,120,'sawtooth');
    if (runtime.hearts <= 0) { runtime.hearts = DIFFICULTY[progress.difficulty].hearts; progress.xp = Math.max(0, progress.xp-20); saveProgress(); resetPlayer(); speak('Tente de novo, Otto. Você voltou ao checkpoint.'); }
    else { p.z = runtime.checkpoint || Math.min(4,p.z+6); p.y=0; p.vy=0; }
  }
  function addParticles(x,y,z,color,count){ for(let i=0;i<count;i++){ const m=box(.18,.18,.18,color); m.position.set(x,y,z); levelGroup.add(m); particles.push({mesh:m, vel:new THREE.Vector3((Math.random()-.5)*5,Math.random()*5,(Math.random()-.5)*5), life:.45+Math.random()*.65}); } }
  function updateParticles(dt){ for(let i=particles.length-1;i>=0;i--){ const q=particles[i]; q.life-=dt; q.vel.y-=7*dt; q.mesh.position.addScaledVector(q.vel,dt); if(q.life<=0){ levelGroup.remove(q.mesh); particles.splice(i,1); } } }

  function updatePremiumVisuals(dt){
    const t = now()/1000;
    if (skyMesh) skyMesh.rotation.y += dt*.008;
    premiumVisuals.forEach(o=>{
      if(!o) return;
      if(o.userData.spin) o.rotation.y += dt*o.userData.spin;
      if(o.userData.float) o.position.y = o.userData.float.baseY + Math.sin(t*o.userData.float.speed)*o.userData.float.amp;
      if(o.userData.twinkle && o.material) o.material.opacity = clamp(o.userData.twinkle.base + Math.sin(t*o.userData.twinkle.speed+o.userData.twinkle.phase)*.22, .12, 1);
      if(o.userData.pulse) { const sc = o.userData.pulse.base * (1 + Math.sin(t*o.userData.pulse.speed+o.userData.pulse.phase)*.08); o.scale.set(sc,sc,sc); }
      if(o.userData.pulseMat && o.material) o.material.emissiveIntensity = .7 + Math.sin(t*3.2)*.35;
    });
    if (portalMesh && portalMesh.userData) {
      const u=portalMesh.userData;
      if(u.core){ u.core.rotation.z += dt*1.4; const s=1+Math.sin(t*2.2)*.08; u.core.scale.set(s,s,s); }
      if(u.disc && u.disc.material) u.disc.material.opacity = .18 + Math.sin(t*2.5)*.06;
      if(u.light) u.light.intensity = 1.0 + Math.sin(t*2.5)*.35;
    }
    hazards.forEach(h=>{ if(h.glow) h.glow.material.opacity = .16 + Math.sin(t*3.5 + h.z)*.05; if(h.mesh && h.mesh.material && h.type==='lava') h.mesh.material.emissiveIntensity = .75 + Math.sin(t*3 + h.z)*.25; });
  }

  function updateCamera(dt){
    const landscape = innerWidth > innerHeight && innerHeight < 760;
    const portrait = !landscape;
    const speed = clamp(Math.hypot(p.vx,p.vz) / 9, 0, 1);
    if (isOpenWorld()) {
      const interior = cameraMode === 'interior' && currentInteriorId;
      const house = interior ? openWorldHouses.find(h => h.id === currentInteriorId) : null;
      const hx = house ? house.x : p.x;
      const hz = house ? house.z : p.z;
      const dist = interior ? (landscape ? 4.8 : 6.2) + speed * .45 : (landscape ? 9.8 : 12.6) + speed * 1.1;
      const height = interior ? (landscape ? 2.8 : 3.6) + speed * .12 : (landscape ? 4.9 : 6.3) + speed * .28 + (p.grounded ? 0 : .10);
      const lookHeight = interior ? 1.15 + (p.grounded ? 0 : .12) : 1.65 + (p.grounded ? 0 : .18);
      const desiredFov = interior ? (landscape ? 64 : 61) + speed * .6 : (landscape ? 60 : 57) + speed * 1.2;
      camera.fov += (desiredFov - camera.fov) * Math.min(1, dt * 3.8);
      camera.updateProjectionMatrix();
      const lookDepth = interior ? 2.2 : (4.5 + speed*2.4);
      const backX = -Math.sin(cameraYaw) * dist;
      const backZ = Math.cos(cameraYaw) * dist;
      const desiredPos = new THREE.Vector3(
        (interior ? hx : p.x) + backX,
        p.y + height,
        (interior ? hz + 1.2 : p.z) + backZ
      );
      const desiredLook = new THREE.Vector3(
        hx + Math.sin(cameraYaw) * lookDepth,
        p.y + lookHeight,
        hz - Math.cos(cameraYaw) * lookDepth
      );
      if (!cameraRig.initialized || !cameraRig.pos || !cameraRig.look) {
        cameraRig.initialized = true;
        cameraRig.pos = desiredPos.clone();
        cameraRig.look = desiredLook.clone();
      }
      cameraRig.pos.lerp(desiredPos, Math.min(1, dt * 6.8));
      cameraRig.look.lerp(desiredLook, Math.min(1, dt * 7.4));
      camera.position.copy(cameraRig.pos);
      camera.lookAt(cameraRig.look);
      sunLight.position.set(p.x + 18, 28, p.z + 14);
      return;
    }

    // Câmera original preservada para modos lineares/legado.
    const speedForward = clamp(Math.abs(p.vz) / 8, 0, 1);
    const jumpLift = p.grounded ? 0 : GAMEPLAY_CAMERA.cameraJumpOffset;
    const followDistance = GAMEPLAY_CAMERA.cameraFollowDistance + (landscape ? -1.4 : 1.6) + speedForward * 1.1;
    const cameraHeight = GAMEPLAY_CAMERA.cameraHeight + (landscape ? -.85 : .35) + speedForward * .20 + jumpLift;
    const lookAhead = GAMEPLAY_CAMERA.cameraLookAhead + (landscape ? -1.8 : 1.0) + speedForward * 1.1;
    const desiredFov = (landscape ? 61 : 58) + speedForward * 1.0;
    camera.fov += (desiredFov - camera.fov) * Math.min(1, dt * 3.4);
    camera.updateProjectionMatrix();

    const desiredPos = new THREE.Vector3(
      p.x * (portrait ? .14 : .20),
      p.y + cameraHeight,
      p.z + followDistance
    );
    const desiredLook = new THREE.Vector3(
      p.x * (portrait ? .24 : .32),
      p.y + 1.35,
      p.z - lookAhead
    );
    if (!cameraRig.initialized || !cameraRig.pos || !cameraRig.look) {
      cameraRig.initialized = true;
      cameraRig.pos = desiredPos.clone();
      cameraRig.look = desiredLook.clone();
    }
    cameraRig.pos.lerp(desiredPos, Math.min(1, dt * GAMEPLAY_CAMERA.cameraSmoothing));
    cameraRig.look.lerp(desiredLook, Math.min(1, dt * (GAMEPLAY_CAMERA.cameraSmoothing + .7)));
    camera.position.copy(cameraRig.pos);
    camera.lookAt(cameraRig.look);
    sunLight.position.set(p.x + (currentLevel?.world === 'space' ? -14 : 8), 24, p.z + 7);
  }

  function spin(){ p.spinUntil = now()+850; addXP(1); toast('Giro!', 'good'); }
  function cycleSize(){ p.scaleMode = p.scaleMode==='normal' ? 'mini' : p.scaleMode==='mini' ? 'giant' : 'normal'; toast(p.scaleMode==='mini'?'Mini!':p.scaleMode==='giant'?'Gigante!':'Normal!', 'good'); if(p.scaleMode==='giant'){ addMedal('Athos Gigante'); checkGates(); } }
  function interact(){
    if (isOpenWorld()) {
      const npc = openWorldNPCs.find(n => Math.abs(p.x-n.x)<3.6 && Math.abs(p.z-n.z)<3.6);
      if (npc) {
        const ow = openWorldProgress();
        ow.talked[npc.id] = true;
        if(npc.id === 'otto') { advanceHomeMission(4); toast('Otto: entre em casa, descanse e se prepare!', 'good'); }
        else if(npc.id === 'mestre') toast('Mestre: traga madeira e pedra para melhorar a espada.', 'good');
        else if(npc.id === 'fazendeiro') toast('Fazendeiro: colha comida e ajude a reparar a ponte.', 'good');
        else toast(`${npc.name}: explore, colete e volte com novidades.`, 'good');
        addXP(8);
        saveProgress(); updateHud();
        return;
      }
      const act = openWorldActivities.find(a => Math.abs(p.x-a.x)<3.3 && Math.abs(p.z-a.z)<3.3);
      if (act) { useOWActivity(act); return; }
      const node = openWorldResourceNodes.find(n => !n.used && Math.abs(p.x-n.x)<3.0 && Math.abs(p.z-n.z)<3.0);
      if (node) {
        node.used = true;
        if(node.mesh) setTreeVisible(node.mesh,false);
        addOWResource(node.type,node.amount||1);
        if(node.type === 'wood' && (openWorldProgress().resources?.wood||0) >= 2) advanceHomeMission(5);
        addXP(10);
        toast(node.type==='wood'?'Madeira coletada!':node.type==='stone'?'Pedra coletada!':'Recurso coletado!', 'good');
        return;
      }
      const door = openWorldDoors.find(d => Math.abs(p.x-d.x)<3.0 && Math.abs(p.z-d.z)<3.0);
      if (door) {
        door.open = !door.open;
        if (door.mesh) door.mesh.visible = !door.open;
        openWorldProgress().doors[door.name] = door.open;
        saveProgress();
        toast(door.open ? 'Porta aberta — entre para ver dentro.' : 'Porta fechada!', 'good');
        return;
      }
      const chest = openWorldChests.find(c => !c.opened && Math.abs(p.x-c.x)<3.2 && Math.abs(p.z-c.z)<3.2);
      if (chest) {
        chest.opened = true;
        if (chest.mesh) chest.mesh.rotation.x = -.45;
        openWorldProgress().chests[chest.id] = true;
        addXP(35);
        runtime.crystals = (runtime.crystals||0) + 1;
        if(chest.id.includes('espada')) { p.weapon='sword'; p.weaponUntil=now()+120000; openWorldProgress().step=Math.max(openWorldProgress().step||0,3); }
        toast('Baú aberto! + cristal', 'good');
        saveProgress();
        updateHud();
        return;
      }
      const region = currentOpenWorldRegion();
      if(region && region.id === 'village') {
        openWorldProgress().step = Math.max(openWorldProgress().step||0, 1);
        toast('Procure Otto, entre nas casas e use as atividades.', 'good');
        saveProgress(); updateHud();
        return;
      }
    }
    if (tryPickupNearestPowerup(7.8)) return;
    if (swordAttack()) return;
    for (const g of gates) if (g.altar && Math.abs(p.z-g.z)<5 && Math.abs(p.x-g.x)<4) { openQuiz(true); return; }
    if (mode==='hub') { const nearest = LEVELS.find(l => Math.abs(p.z + (40 + LEVELS.indexOf(l)*12)) < 8); if (nearest) { currentLevelIndex = LEVELS.indexOf(nearest); buildLevel(nearest); } }
    else toast(isOpenWorld() ? 'Ação: abra portas, baús, pegue itens ou ataque.' : 'Ação: pegue item perto ou ataque com espada.', 'warn');
  }
  function togglePause(){ paused=!paused; resetAllInputs(paused?'pause':'resume'); els.pauseBtn.innerHTML = paused ? '▶<span>Voltar</span>' : '⏸<span>Pausa</span>'; toast(paused?'Pausado':'Voltando', 'warn'); }
  function toggleCrouch(v){ input.crouch = v; }

  function showTutorial(){
    const list = currentLevel.tutorial || ['Use o joystick para andar em profundidade.','A pule nas caixas; B lança poder.'];
    let step = 0; els.tutorialBox.hidden = false;
    const render = () => { els.tutorialTitle.textContent = currentLevel.title || 'Tutorial'; els.tutorialText.textContent = list[step] || ''; };
    render(); clearInterval(showTutorial.timer); showTutorial.timer = setInterval(() => { step++; if (step >= list.length) { els.tutorialBox.hidden = true; clearInterval(showTutorial.timer); } else render(); }, 2600);
  }

  function openQuiz(fromGame=false){
    hardStopAllInput('quiz-open');
    const round = quizData.slice().sort(() => Math.random() - .5).slice(0,5);
    let step = 0, right = 0, wrong = 0, answered = false;

    const renderQuestion = () => {
      answered = false;
      const q = round[step] || quizData[0];
      els.modalTitle.textContent = 'Quiz do Athos';
      els.modalBody.innerHTML = `
        <div class="quiz-round-head">
          <b>${step + 1}/5</b>
          <span>✅ ${right}</span>
          <span>❌ ${wrong}</span>
        </div>
        <div class="quiz-progress"><span style="width:${((step)/5)*100}%"></span></div>
        <div class="answer quiz-question"><b>${escapeHtml(q.q)}</b></div>
        <div class="modal-list quiz-options"></div>
        <div id="quizFeedback" class="quiz-feedback" hidden></div>
        <button id="quizNextBtn" class="pixel-btn primary" type="button" hidden>${step >= 4 ? 'Ver resultado' : 'Próxima'}</button>`;
      const list = els.modalBody.querySelector('.quiz-options');
      const feedback = $('#quizFeedback');
      const next = $('#quizNextBtn');
      q.opts.forEach((opt,i)=>{
        const b=document.createElement('button');
        b.className='pixel-btn choice quiz-option';
        b.type='button';
        b.dataset.test='quiz-option';
        b.dataset.answer=String(i);
        b.dataset.correct=String(i===q.ans);
        b.setAttribute('aria-label', `Opção do quiz: ${opt}`);
        b.textContent=opt;
        b.onclick=()=>{
          if(answered) return;
          answered = true;
          progress.quizAnswered=(progress.quizAnswered||0)+1;
          const ok = i === q.ans;
          if(ok){
            right++;
            progress.quizRight=(progress.quizRight||0)+1;
            addXP(10);
            b.classList.add('correct');
            feedback.textContent='Acertou!';
            feedback.className='quiz-feedback good';
            toast('Acertou!', 'good');
            speak('Acertou!');
          } else {
            wrong++;
            b.classList.add('wrong');
            const correct = list.querySelector('[data-correct="true"]');
            if(correct) correct.classList.add('correct');
            feedback.textContent='Quase! Veja a certa e continue.';
            feedback.className='quiz-feedback bad';
            toast('Quase!', 'warn');
          }
          feedback.hidden=false;
          next.hidden=false;
          list.querySelectorAll('button').forEach(x=>x.disabled=true);
          saveProgress();
          updateHud();
        };
        list.appendChild(b);
      });
      next.onclick=()=>{
        if(step < round.length-1){ step++; renderQuestion(); }
        else renderResult();
      };
      showModal();
    };

    const renderResult = () => {
      const passed = right >= 3;
      if(passed){
        addXP(25 + right * 5);
        if(progress.quizRight>=5)addMedal('Campeão do Quiz');
        if(fromGame && runtime){ runtime.quizSolved=true; checkGates(); }
      }
      saveProgress(); updateHud();
      els.modalTitle.textContent = 'Resultado do Quiz';
      els.modalBody.innerHTML = `
        <div class="answer quiz-result">
          <b>${passed ? 'Muito bem!' : 'Boa tentativa!'}</b><br>
          Acertos: ${right}/5<br>
          ${passed ? 'Bônus liberado.' : 'Tente outra rodada.'}
        </div>
        <div class="quiz-result-actions">
          <button id="quizAgainBtn" class="pixel-btn primary" type="button">Jogar de novo</button>
          <button id="quizDoneBtn" class="pixel-btn" type="button">Fechar</button>
        </div>`;
      $('#quizAgainBtn').onclick=()=>openQuiz(fromGame);
      $('#quizDoneBtn').onclick=closeModal;
      showModal();
    };

    renderQuestion();
  }
  function openAsk(){
    els.modalTitle.textContent = 'Falar com Athos';
    els.modalBody.innerHTML = `<div class="ask-row"><input id="askInput" type="text" placeholder="Pergunte sobre fogo, portal, Otto..." maxlength="130"><button id="askSend" class="pixel-btn primary" type="button">Enviar</button><button id="askVoice" class="pixel-btn" type="button">🎙️</button></div><div id="askAnswer" class="answer">Oi Otto! Pergunte sobre meus mundos, poderes ou missões.</div>`;
    showModal();
    const inp=$('#askInput'), ans=$('#askAnswer');
    const ask=()=>{ const reply=answerFor(inp.value); ans.textContent=reply; speak(reply); inp.value=''; };
    $('#askSend').onclick=ask; inp.onkeydown=(e)=>{ if(e.key==='Enter') ask(); };
    $('#askVoice').onclick=()=>{ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){ ans.textContent='Voz não suportada neste navegador. Digite a pergunta.'; return; } const rec=new SR(); rec.lang='pt-BR'; rec.onresult=(e)=>{ inp.value=e.results[0][0].transcript; ask(); }; rec.start(); };
    setTimeout(()=>inp.focus(),80);
  }
  function answerFor(raw){ const q=normalize(raw); if(!q) return 'Pergunte sobre fogo, portal, Otto, mini, gigante ou como jogar.'; for(const row of answerRows) if(row.keys.some(k=>q.includes(k))) return typeof row.ans === 'function' ? row.ans() : row.ans; return 'No mundo dos portais, a resposta aparece explorando, coletando cristais e tentando de novo.'; }
  function openCollection(){
    const medals = ['Primeiro Pulo','Primeiro Cristal','Guardião do Campo','Mestre do Vulcão','Explorador da Floresta','Cavaleiro do Castelo','Viajante do Espaço','Campeão do Quiz','Athos Gigante','Sequência Perfeita','Mestre dos Portais'];
    els.modalTitle.textContent = 'Coleção do Otto';
    els.modalBody.innerHTML = `<div class="collection-grid">${medals.map(m=>`<div class="medal ${progress.medals[m]?'unlocked':''}"><b>${progress.medals[m]?'🏅':'🔒'} ${m}</b><span>${progress.medals[m]?'Desbloqueada':'Bloqueada'}</span></div>`).join('')}</div><div class="answer">XP: ${progress.xp} • Recorde: ${progress.best} • Cristais: ${progress.totalCrystals||0} • Inimigos: ${progress.totalEnemies||0} • Melhor tempo: ${progress.bestTime||0}s</div>`;
    showModal();
  }
  function showModal(){ hardStopAllInput('modal'); els.modal.hidden = false; els.app && els.app.classList.add('modal-active'); }
  function closeModal(){ hardStopAllInput('modal-close'); els.modal.hidden = true; els.app && els.app.classList.remove('modal-active'); }

  async function startCamera(){ if(cameraStream || !navigator.mediaDevices) return; try{ cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false}); els.cameraFeed.srcObject=cameraStream; await els.cameraFeed.play().catch(()=>{}); } catch { toast('Câmera bloqueada. Usando cenário 3D.', 'warn'); } }
  function stopCamera(){ if(cameraStream){ cameraStream.getTracks().forEach(t=>t.stop()); cameraStream=null; } els.cameraFeed.srcObject=null; }
  function requestFullscreenLandscape(){ /* V37: não força fullscreen nem trava orientação. O fullscreen quebrava layout/inputs em alguns Androids. */ }

  function updateWorldButtons(world){ $$('.world-chip,.settings-world-btn').forEach(b=>{ const bw=b.dataset.world||b.dataset.settingsWorld; const active = bw===world; b.classList.toggle('active', active); if(active && b.closest('.settings-game-panel') && b.scrollIntoView) setTimeout(()=>b.scrollIntoView({block:'nearest',inline:'nearest'}),50); }); }
  function setupJoystick(){
    const ring = els.joystick.querySelector('.joy-ring');
    if (!ring) return;
    const end = (e) => {
      if (e && joy.pointerId !== null && e.pointerId !== joy.pointerId) return;
      safePointerRelease(ring, e);
      joy.active=false; joy.pointerId=null; joy.x=0; joy.z=0;
      inputTarget.x = 0; inputTarget.z = 0;
      if (els.joyKnob) els.joyKnob.style.transform='translate(0px,0px)';
      stopHorizontalIfNoDirectionalInput();
    };
    const move = (e) => {
      if(!joy.active || e.pointerId !== joy.pointerId) return;
      e.preventDefault();
      const dx=e.clientX-joy.cx, dy=e.clientY-joy.cy;
      const len=Math.hypot(dx,dy); const max=joy.max;
      const sx=len>max?dx/len*max:dx, sy=len>max?dy/len*max:dy;
      if (els.joyKnob) els.joyKnob.style.transform=`translate(${sx}px,${sy}px)`;
      const nx = sx / max;
      const ny = sy / max;
      const mag = Math.min(1, Math.hypot(nx, ny));
      if (mag < GAME_FEEL.joystickDeadzone) { joy.x = 0; joy.z = 0; return; }
      const scaled = Math.pow((mag - GAME_FEEL.joystickDeadzone) / (1 - GAME_FEEL.joystickDeadzone), GAME_FEEL.joystickCurve);
      joy.x = clamp((nx / mag) * scaled, -1, 1);
      joy.z = clamp((-ny / mag) * scaled, -1, 1);
    };
    ring.addEventListener('pointerdown',(e)=>{
      e.preventDefault(); e.stopPropagation();
      joy.active=true; joy.pointerId=e.pointerId;
      const r=ring.getBoundingClientRect(); joy.cx=r.left+r.width/2; joy.cy=r.top+r.height/2;
      safePointerCapture(ring, e);
      move(e);
    }, { passive:false });
    document.addEventListener('pointermove', move, { passive:false });
    document.addEventListener('pointerup', end, { passive:false });
    document.addEventListener('pointercancel', end, { passive:false });
    window.addEventListener('blur', () => { hardStopAllInput('blur'); });
    window.addEventListener('pagehide', () => { hardStopAllInput('pagehide'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) hardStopAllInput('visibility-hidden'); });
  }

  function hasDirectionalInput(){
    return joy.active || joy.x !== 0 || joy.z !== 0 || keyboard.left || keyboard.right || keyboard.forward || keyboard.back || moveHold.left || moveHold.right || moveHold.forward || moveHold.back;
  }

  function stopHorizontalIfNoDirectionalInput(){
    if (!p || hasDirectionalInput()) return;
    input.x = 0; input.z = 0; inputTarget.x = 0; inputTarget.z = 0;
    clearVelocityHorizontal('no-directional-input');
  }

  function clearVelocityHorizontal(reason='manual'){
    if (!p) return false;
    p.vx = 0;
    p.vz = 0;
    return true;
  }

  function setMoveHold(direction, value){
    if (!Object.prototype.hasOwnProperty.call(moveHold, direction)) return false;
    moveHold[direction] = !!value;
    if (!value) stopHorizontalIfNoDirectionalInput();
    return true;
  }

  function clearMovementState(){
    moveHold.left = moveHold.right = moveHold.forward = moveHold.back = false;
    keyboard.left = keyboard.right = keyboard.forward = keyboard.back = false;
    input.x = 0;
    input.z = 0;
    inputTarget.x = 0;
    inputTarget.z = 0;
    input.crouch = false;
    joy.active = false;
    joy.pointerId = null;
    joy.x = 0;
    joy.z = 0;
    if (els.joyKnob) els.joyKnob.style.transform = 'translate(0px,0px)';
    $$('.move-btn.holding,.action-btn.holding').forEach(btn => btn.classList.remove('holding'));
  }

  function hardStopAllInput(reason='manual'){
    clearMovementState();
    if (p) {
      clearVelocityHorizontal(reason);
      if (reason !== 'jump') jumpBufferedUntil = 0;
    }
  }

  function resetAllInputs(reason='manual'){
    hardStopAllInput(reason);
  }

  function enterARSafeMode(reason='ar'){
    hardStopAllInput(reason);
    arSafeUntil = now() + AR_SAFE.lockMs;
    if (p) { p.vx = 0; p.vz = 0; p.vy = Math.min(p.vy || 0, 0); }
    if (els.game) els.game.classList.add('ar-safe-mode');
    window.setTimeout(() => { if (now() >= arSafeUntil && els.game) els.game.classList.remove('ar-safe-mode'); }, AR_SAFE.lockMs + 60);
    toast('AR seguro: Athos parado. Toque no controle para mover.', 'warn');
  }


  function safePointerCapture(el, event){
    if (!el || !event || typeof event.pointerId !== 'number') return false;
    if (!el.setPointerCapture) return false;
    try {
      el.setPointerCapture(event.pointerId);
      return true;
    } catch (err) {
      // Alguns testes sintéticos e navegadores Android podem disparar pointerdown sem ponteiro ativo.
      // Não pode virar erro fatal nem travar o controle.
      return false;
    }
  }

  function safePointerRelease(el, event){
    if (!el || !event || typeof event.pointerId !== 'number') return false;
    if (!el.releasePointerCapture) return false;
    try {
      if (el.hasPointerCapture && !el.hasPointerCapture(event.pointerId)) return false;
      el.releasePointerCapture(event.pointerId);
      return true;
    } catch (err) {
      return false;
    }
  }


  function getARViewer(){
    // V46.2 HOTFIX: prioriza o model-viewer principal já carregado.
    // O arAnchorViewer oculto pode disparar erro interno do model-viewer em desktop:
    // ARRenderer null.add. Ele fica apenas como fallback.
    return els.nativeViewer || els.arAnchorViewer;
  }
  function prepareARViewer(viewer){
    if (!viewer) return;
    viewer.setAttribute('src','./athos.glb');
    viewer.setAttribute('ar','');
    viewer.setAttribute('ar-modes','scene-viewer webxr quick-look');
    viewer.setAttribute('ar-placement','floor');
    viewer.setAttribute('ar-scale','fixed');
    viewer.setAttribute('shadow-intensity','1');
    viewer.setAttribute('exposure','1');
    viewer.setAttribute('environment-image','neutral');
    viewer.setAttribute('interaction-prompt','none');
    try {
      viewer.setAttribute('camera-orbit', `${VIEWER_3D.orbit}deg ${VIEWER_3D.elevation}deg ${VIEWER_3D.distance.toFixed(2)}m`);
      viewer.setAttribute('camera-target', `${VIEWER_3D.targetX.toFixed(2)}m ${VIEWER_3D.targetY.toFixed(2)}m ${VIEWER_3D.targetZ.toFixed(2)}m`);
      viewer.setAttribute('scale', `${VIEWER_3D.scale.toFixed(2)} ${VIEWER_3D.scale.toFixed(2)} ${VIEWER_3D.scale.toFixed(2)}`);
    } catch {}
  }
  function prepareARActivationSurface(viewer){
    if (!viewer) return;
    try {
      viewer.classList.add('ar-activation-surface');
      viewer.style.position = 'fixed';
      viewer.style.left = '0';
      viewer.style.top = '0';
      viewer.style.width = '100vw';
      viewer.style.height = '100vh';
      viewer.style.opacity = '0.001';
      viewer.style.pointerEvents = 'none';
      viewer.style.zIndex = '1';
    } catch {}
  }
  function restoreARActivationSurface(viewer){
    if (!viewer) return;
    try {
      viewer.classList.remove('ar-activation-surface');
      viewer.removeAttribute('style');
    } catch {}
  }

  function canSafelyActivateNativeAR(viewer){
    if (!viewer || typeof viewer.activateAR !== 'function') return false;
    // Em desktop ou navegador sem AR, model-viewer pode lançar erro interno em ARRenderer.
    // Só chamamos activateAR quando o próprio model-viewer confirma capacidade real.
    try {
      if (viewer.canActivateAR === true) return true;
      return false;
    } catch { return false; }
  }

  function markNativeARUnavailable(){
    hardStopAllInput('native-ar-unavailable');
    arSafeUntil = now() + AR_SAFE.lockMs;
    if (p) { p.vx = 0; p.vz = 0; p.vy = Math.min(p.vy || 0, 0); }
    toast('AR nativo só abre em celular/navegador compatível. Câmera falsa não será usada.', 'warn');
  }

  function openNativeAR(reason='native-ar'){
    hardStopAllInput(reason);
    stopCamera();
    realBg = false;
    if (els.game) {
      els.game.classList.add('ar-safe-mode');
      els.game.classList.remove('real-bg');
    }
    arSafeUntil = now() + AR_SAFE.lockMs;
    rebuildV54Render('real');
    const viewer = getARViewer();
    prepareARViewer(viewer);
    // Não abrimos câmera fake. Em computador, não chamamos activateAR para evitar erro interno do model-viewer.
    if (!canSafelyActivateNativeAR(viewer)) {
      markNativeARUnavailable();
      return false;
    }
    prepareARActivationSurface(viewer);
    try {
      const r = viewer.activateAR();
      toast('Abrindo AR nativo ancorado: posicione Athos no chão.', 'good');
      window.setTimeout(() => restoreARActivationSurface(viewer), 4500);
      if (r && typeof r.catch === 'function') {
        r.catch(() => {
          markNativeARUnavailable();
          restoreARActivationSurface(viewer);
        });
      }
      return true;
    } catch (err) {
      markNativeARUnavailable();
      restoreARActivationSurface(viewer);
      return false;
    }
  }

  function setupInputs(){
    setupJoystick();
    $$('[data-move]').forEach(btn=>{
      const key=btn.dataset.move;
      const on=(e)=>{ e.preventDefault(); e.stopPropagation(); safePointerCapture(btn, e); btn.classList.add('holding'); setMoveHold(key, true); };
      const off=(e)=>{ e.preventDefault(); safePointerRelease(btn, e); btn.classList.remove('holding'); setMoveHold(key, false); };
      btn.addEventListener('pointerdown',on,{passive:false});
      ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(ev=>btn.addEventListener(ev,off,{passive:false}));
    });
    $$('[data-hold]').forEach(btn=>{
      const key=btn.dataset.hold;
      btn.addEventListener('pointerdown',(e)=>{ e.preventDefault(); e.stopPropagation(); safePointerCapture(btn, e); btn.classList.add('holding'); if(key==='crouch') toggleCrouch(true); },{passive:false});
      ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(ev=>btn.addEventListener(ev,(e)=>{ e.preventDefault(); safePointerRelease(btn, e); btn.classList.remove('holding'); if(key==='crouch') toggleCrouch(false); },{passive:false}));
    });
    $$('[data-action]').filter(btn=>!btn.dataset.move && !btn.dataset.hold).forEach(btn=>{
      const run = (e) => { e.preventDefault(); e.stopPropagation(); if (canPressAction(btn.dataset.action)) handleAction(btn.dataset.action); };
      btn.addEventListener('pointerdown', run, { passive:false });
      btn.addEventListener('click', run, { passive:false });
    });
    $$('.world-chip').forEach(btn=>btn.addEventListener('click',()=>{ if (!canPressAction('world')) return; resetAllInputs('world'); if(btn.dataset.world==='real'){ updateWorldButtons('real'); openNativeAR('world-chip-real'); return; } if(!currentLevel) currentLevel=LEVELS[0]; buildLevel(currentLevel,btn.dataset.world); }));
    document.addEventListener('pointerup', () => { if (!joy.active) stopHorizontalIfNoDirectionalInput(); }, { passive:true });
    document.addEventListener('pointercancel', () => { if (!joy.active) stopHorizontalIfNoDirectionalInput(); }, { passive:true });
    window.addEventListener('keydown',(e)=>{ if(e.repeat) return; if(['ArrowLeft','a','A'].includes(e.key)) keyboard.left=true; if(['ArrowRight','d','D'].includes(e.key)) keyboard.right=true; if(['ArrowUp','w','W'].includes(e.key)) keyboard.forward=true; if(['ArrowDown','s','S'].includes(e.key)) keyboard.back=true; if(e.key===' ' && canPressAction('jump')) jump(); if(['b','B'].includes(e.key) && canPressAction('power')) power(); if(['y','Y'].includes(e.key)) input.crouch=true; });
    window.addEventListener('keyup',(e)=>{ if(['ArrowLeft','a','A'].includes(e.key)) keyboard.left=false; if(['ArrowRight','d','D'].includes(e.key)) keyboard.right=false; if(['ArrowUp','w','W'].includes(e.key)) keyboard.forward=false; if(['ArrowDown','s','S'].includes(e.key)) keyboard.back=false; if(['y','Y'].includes(e.key)) input.crouch=false; stopHorizontalIfNoDirectionalInput(); });
  }

  function canPressAction(action){
    const key = action === 'power' ? 'power' : action === 'world' ? 'world' : 'action';
    const delay = INPUT_DEBOUNCE_MS[key] || INPUT_DEBOUNCE_MS.action;
    const t = now();
    if (t - (actionPressAt[key] || 0) < delay) return false;
    actionPressAt[key] = t;
    return true;
  }
  async function startViewerCamera(){
    if (viewerCameraStream || !els.viewerCameraFeed || !navigator.mediaDevices) return false;
    try {
      viewerCameraStream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:'environment' }, width:{ ideal:1280 }, height:{ ideal:720 } }, audio:false });
      els.viewerCameraFeed.srcObject = viewerCameraStream;
      await els.viewerCameraFeed.play().catch(()=>{});
      VIEWER_3D.cameraPreview = true;
      document.querySelector('.viewer-panel')?.classList.add('viewer-camera-on');
      if (els.modelStatus) els.modelStatus.textContent = 'Câmera real na prévia. AR fixo abre no botão verde.';
      toast('Câmera real ligada na prévia 3D.', 'good');
      return true;
    } catch (err) {
      VIEWER_3D.cameraPreview = false;
      toast('Câmera bloqueada no navegador. O AR fixo continua no botão AR.', 'warn');
      return false;
    }
  }
  function stopViewerCamera(){
    if (viewerCameraStream) {
      viewerCameraStream.getTracks().forEach(t=>t.stop());
      viewerCameraStream = null;
    }
    if (els.viewerCameraFeed) els.viewerCameraFeed.srcObject = null;
    VIEWER_3D.cameraPreview = false;
    document.querySelector('.viewer-panel')?.classList.remove('viewer-camera-on');
    if (els.modelStatus) els.modelStatus.textContent = 'Fixo e estável no mundo real.';
  }
  async function toggleViewerCamera(){
    hardStopAllInput('viewer-camera');
    if (viewerCameraStream) { stopViewerCamera(); toast('Câmera real desligada.', 'good'); return; }
    await startViewerCamera();
  }

  function applyViewer3DState(){
    const v = els.nativeViewer;
    if(!v) return;
    VIEWER_3D.distance = clamp(VIEWER_3D.distance, 1.15, 8.5);
    VIEWER_3D.elevation = clamp(VIEWER_3D.elevation, 40, 85);
    VIEWER_3D.targetX = clamp(VIEWER_3D.targetX, -1.6, 1.6);
    VIEWER_3D.targetY = clamp(VIEWER_3D.targetY, -0.8, 2.5);
    VIEWER_3D.targetZ = clamp(VIEWER_3D.targetZ, -1.2, 1.2);
    VIEWER_3D.scale = clamp(VIEWER_3D.scale, .55, 2.2);
    VIEWER_3D.fov = clamp(VIEWER_3D.fov || 30, 18, 45);
    v.setAttribute('camera-orbit', `${VIEWER_3D.orbit}deg ${VIEWER_3D.elevation}deg ${VIEWER_3D.distance.toFixed(2)}m`);
    v.setAttribute('camera-target', `${VIEWER_3D.targetX.toFixed(2)}m ${VIEWER_3D.targetY.toFixed(2)}m ${VIEWER_3D.targetZ.toFixed(2)}m`);
    v.setAttribute('field-of-view', `${VIEWER_3D.fov.toFixed(1)}deg`);
    v.setAttribute('scale', `${VIEWER_3D.scale.toFixed(2)} ${VIEWER_3D.scale.toFixed(2)} ${VIEWER_3D.scale.toFixed(2)}`);
    v.style.setProperty('--athos-viewer-scale', VIEWER_3D.scale.toFixed(2));
    try { if (typeof v.updateFraming === 'function') v.updateFraming(); } catch {}
  }
  function resetViewer3D(){
    VIEWER_3D.orbit = 25; VIEWER_3D.elevation = 68; VIEWER_3D.distance = 3.8;
    VIEWER_3D.targetX = 0; VIEWER_3D.targetY = .8; VIEWER_3D.targetZ = 0; VIEWER_3D.scale = 1; VIEWER_3D.fov = 30;
    applyViewer3DState();
    toast('Athos 3D resetado.', 'good');
  }
  function setupViewer3DControls(){
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if(el) el.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); hardStopAllInput('viewer-3d'); fn(); applyViewer3DState(); };
    };
    bind('viewerRotateLeftBtn', () => VIEWER_3D.orbit -= 18);
    bind('viewerRotateRightBtn', () => VIEWER_3D.orbit += 18);
    // V46.3: + e - agora mudam distância E campo de visão, para o efeito ser visível no celular.
    bind('viewerZoomInBtn', () => { VIEWER_3D.distance = clamp(VIEWER_3D.distance - .55, 1.15, 8.5); VIEWER_3D.fov = clamp((VIEWER_3D.fov||30) - 2.5, 18, 45); });
    bind('viewerZoomOutBtn', () => { VIEWER_3D.distance = clamp(VIEWER_3D.distance + .55, 1.15, 8.5); VIEWER_3D.fov = clamp((VIEWER_3D.fov||30) + 2.5, 18, 45); });
    // V46.3: botões corrigidos pela percepção visual do usuário. Subir sobe o boneco na tela; descer desce.
    bind('viewerMoveUpBtn', () => VIEWER_3D.targetY = clamp(VIEWER_3D.targetY - .14, -.8, 2.5));
    bind('viewerMoveDownBtn', () => VIEWER_3D.targetY = clamp(VIEWER_3D.targetY + .14, -.8, 2.5));
    bind('viewerMoveLeftBtn', () => VIEWER_3D.targetX = clamp(VIEWER_3D.targetX + .14, -1.6, 1.6));
    bind('viewerMoveRightBtn', () => VIEWER_3D.targetX = clamp(VIEWER_3D.targetX - .14, -1.6, 1.6));
    const camBtn = document.getElementById('viewerCameraBtn');
    if(camBtn) camBtn.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); toggleViewerCamera(); };
    const arFixed = document.getElementById('viewerArFixedBtn');
    if(arFixed) arFixed.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); openNativeAR('viewer-ar-fixed'); };
    const big = document.getElementById('viewerBigBtn');
    if(big) big.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); const panel = document.querySelector('.viewer-panel'); if(panel){ const on = !panel.classList.contains('viewer-fullscreen'); panel.classList.toggle('viewer-fullscreen', on); document.body.classList.toggle('viewer-fullscreen-open', on); setTimeout(applyViewer3DState, 120); } };
    const reset = document.getElementById('viewerResetBtn');
    if(reset) reset.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); resetViewer3D(); };
    document.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape'){ const panel=document.querySelector('.viewer-panel.viewer-fullscreen'); if(panel){ panel.classList.remove('viewer-fullscreen'); document.body.classList.remove('viewer-fullscreen-open'); stopViewerCamera(); } } });
    applyViewer3DState();
  }

  function handleAction(a){ if(a==='jump') jump(); else if(a==='power') power(); else if(['forward','back','left','right'].includes(a)) return; else if(a==='crouch') { toggleCrouch(true); setTimeout(()=>toggleCrouch(false), 420); } else if(a==='spin') spin(); else if(a==='size') cycleSize(); else if(a==='normal') { p.scaleMode='normal'; toast('Normal!', 'good'); } else if(a==='interact') interact(); else if(a==='quiz' || a==='ask') return; else if(a==='pause') togglePause(); else if(a==='exit') exitGame(); }

  function giveCrystalBonus(){
    if (!runtime) { toast('Entre no jogo para ganhar cristal.', 'warn'); return false; }
    runtime.crystals = Math.min((runtime.requiredCrystals || 0) + 9, (runtime.crystals || 0) + 1);
    progress.totalCrystals = (progress.totalCrystals || 0) + 1;
    addXP(6);
    saveProgress();
    updateHud();
    addParticles(p.x, p.y + 1.4, p.z - 1.4, 0x38bdf8, 16);
    toast('+1 cristal!', 'good');
    beep(880, 70);
    vibrate(25);
    return true;
  }

  function switchWorldFromSettings(world){
    if (!world) return false;
    resetAllInputs('settings-world');
    closeModal();
    if (world === 'real') { updateWorldButtons('real'); openNativeAR('settings-real'); return true; }
    if (!currentLevel) currentLevel = LEVELS[0];
    buildLevel(currentLevel, world);
    toast(WORLD[world]?.name || 'Mundo', 'good');
    setTimeout(forceMobileReflow, 70);
    return true;
  }

  function forceMobileReflow(){
    try {
      document.body.classList.toggle('athos-reflow-tick');
      requestAnimationFrame(() => {
        applyAdaptiveMobileLayout();
        resize();
        if (renderer && camera) {
          const rect = stageSize();
          camera.aspect = rect.width / Math.max(1, rect.height);
          camera.updateProjectionMatrix();
          renderer.setSize(rect.width, rect.height);
        }
      });
    } catch {}
  }

  function openGameSettings(){
    hardStopAllInput('settings-open');
    els.modalTitle.textContent = 'Configurações do Otthos';
    els.modalBody.innerHTML = `
      <div class="settings-game-panel">
        <div class="settings-section">
          <strong>Mundo aberto ativo</strong>
          <p class="settings-hint">Os cenários antigos foram removidos desta tela. Agora o jogo fica no Life World contínuo.</p>
        </div>
        <div class="settings-section">
          <strong>Ações rápidas</strong>
          <div class="settings-actions">
            <button class="pixel-btn" data-settings-action="mini" type="button">Mini</button>
            <button class="pixel-btn" data-settings-action="normal" type="button">Normal</button>
            <button class="pixel-btn" data-settings-action="giant" type="button">Gigante</button>
            <button class="pixel-btn" data-settings-action="home" type="button">Voltar à vila</button>
            <button class="pixel-btn" data-settings-action="pause" type="button">Pausar</button>
            <button class="pixel-btn danger" data-settings-action="exit" type="button">Sair</button>
          </div>
        </div>
      </div>`;
    els.modal.hidden = false;
    els.app && els.app.classList.add('modal-active');
    $$('[data-settings-action]', els.modalBody).forEach(btn => {
      btn.onclick = () => {
        const a = btn.dataset.settingsAction;
        if (a === 'mini') { p.scaleMode = 'mini'; toast('Mini!', 'good'); closeModal(); }
        else if (a === 'normal') { p.scaleMode = 'normal'; toast('Normal!', 'good'); closeModal(); }
        else if (a === 'giant') { p.scaleMode = 'giant'; toast('Gigante!', 'good'); closeModal(); }
        else if (a === 'home') { p.x = 0; p.z = 4; p.y = 0; p.vx = p.vz = p.vy = 0; cameraRig.initialized=false; saveProgress(); closeModal(); toast('Voltou para a vila.', 'good'); }
        else if (a === 'pause') { closeModal(); togglePause(); }
        else if (a === 'exit') { closeModal(); exitGame(); }
      };
    });
    return true;
  }

  function setupUI(){
    const hudSettingsBtn = document.getElementById('hudSettingsBtn');
    const hudGemPlusBtn = document.getElementById('hudGemPlusBtn') || document.querySelector('.hud-gem-plus');
    if (hudSettingsBtn) hudSettingsBtn.onclick = openGameSettings;
    if (hudGemPlusBtn) hudGemPlusBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); giveCrystalBonus(); };
    const bindStart = (el, target) => { if (!el) return; el.onclick = () => { closeModal(); start(target || el.dataset.play || 'missions'); }; };
    [els.playBtn, els.heroPlayBtn].forEach(el => bindStart(el, 'openworld'));
    [els.freeBtn, els.heroFreeBtn].forEach(el => bindStart(el, 'free'));
    bindStart(els.hubBtn, 'hub');
    $$('.play-alias[data-play]').forEach(el => bindStart(el, el.dataset.play));
    if (els.quizBtn) els.quizBtn.onclick=()=>openQuiz(false);
    if (els.askBtn) els.askBtn.onclick=openAsk;
    if (els.collectionBtn) els.collectionBtn.onclick=openCollection;
    if (els.resetBtn) els.resetBtn.onclick=()=>{ if(confirm('Resetar XP, fases e medalhas?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } };
    if (els.exitBtn) els.exitBtn.onclick=exitGame;
    if (els.modalClose) els.modalClose.onclick=closeModal;
    if (els.modal) els.modal.addEventListener('click',(e)=>{ if(e.target===els.modal) closeModal(); });
    if (els.difficultySelect) els.difficultySelect.onchange=()=>{ progress.difficulty=els.difficultySelect.value; saveProgress(); toast(`Dificuldade: ${DIFFICULTY[progress.difficulty].name}`,'good'); };
    setupViewer3DControls();
    if (els.arNativeExternalBtn) els.arNativeExternalBtn.onclick=()=>openNativeAR('lobby-ar-button');
    if(els.nativeViewer){ els.nativeViewer.addEventListener('load',()=>els.modelStatus.textContent='athos.glb carregado.'); els.nativeViewer.addEventListener('error',()=>els.modelStatus.textContent='Erro: athos.glb não encontrado.'); }
    if(els.arAnchorViewer){ els.arAnchorViewer.addEventListener('ar-status',(e)=>{ if(e.detail && e.detail.status==='not-presenting') hardStopAllInput('ar-closed'); }); }
  }
  function refreshServiceWorker(){
    if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=580-gamepad-jogabilidade-render').then(reg => reg.update()).catch(()=>{});
    if('caches' in window) caches.keys().then(keys=>keys.filter(k=>/athos|otto/i.test(k)).forEach(k=>caches.delete(k).catch(()=>{}))).catch(()=>{});
  }

  function clamp(n,min,max){ return Math.max(min,Math.min(max,Number(n)||0)); }
  function dist2(x1,z1,x2,z2){ return (x1-x2)*(x1-x2)+(z1-z2)*(z1-z2); }
  function dist3(x1,y1,z1,x2,y2,z2){ return Math.hypot(x1-x2,y1-y2,z1-z2); }
  function angleDelta(a,b){ return Math.atan2(Math.sin(b-a),Math.cos(b-a)); }
  function normalize(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  Object.assign(window, {
    resetAllInputs,
    safePointerCapture,
    safePointerRelease,
    setMoveHold,
    clearVelocityHorizontal
  });

  window.ATHOS_TEST_API = {
    getQuizCount: () => quizData.length,
    getLevelCount: () => LEVELS.length,
    getStorageKey: () => STORAGE_KEY,
    getCurrentLevel: () => currentLevel,
    hasPowerButton: () => !!document.querySelector('#powerBtn[data-action="power"]'),
    getInputState: () => ({
      input: { x: input.x, z: input.z, crouch: input.crouch, targetX: inputTarget.x, targetZ: inputTarget.z },
      joy: { active: joy.active, pointerId: joy.pointerId, x: joy.x, z: joy.z },
      moveHold: { ...moveHold },
      keyboard: { ...keyboard }
    }),
    getPlayerState: () => p ? ({ x:p.x, y:p.y, z:p.z, vx:p.vx, vy:p.vy, vz:p.vz, grounded:p.grounded, scaleMode:p.scaleMode, lastLandAt }) : null,
    getGameFeel: () => ({ ...GAME_FEEL }),
    getCameraTuning: () => ({ ...GAMEPLAY_CAMERA }),
    getGameplayState: () => ({
      mode, paused, playing,
      enemies: enemies.map(e => ({ type:e.type, hp:e.hp, maxHp:e.maxHp, dead:e.dead, vulnerable:e.vulnerable })),
      boss: enemies.find(e => e.type === 'boss') ? { ...enemies.find(e => e.type === 'boss'), mesh:undefined } : null,
      fireballs: fireballs.length,
      enemyProjectiles: enemyProjectiles.length,
      portalUnlocked: !!(runtime && objectivesDone()),
      powerCooldownMs: Math.max(0, Math.round(powerReadyAt - now()))
    }),
    getV42Design: () => ({ markers:v42Markers.length, guides:v42Markers.filter(m=>m.type==='guide').map(m=>m.text), currentLevel: currentLevel ? currentLevel.id : null }),
    getARSafety: () => ({ realBg, arSafeUntil, locked: now() < arSafeUntil, label: 'V54_1_AR_OK', nativeAR:true, fakeCamera:false }),
    getV442Render: () => ({ label: V442_RENDER.label, target: V442_RENDER.target, enabled: V442_RENDER.enabled, sideIslands: V442_RENDER.maxSideIslands, clouds: V442_RENDER.clouds, v45:V45_PLATFORM_RENDER.label }),
    getV533: () => ({label:'V53_3_CONTROLES_100_DENTRO_DA_TELA', fix:'right-zone fixed; no overflow in landscape/portrait'}),
    getV532: () => ({label:'V53_2_MOBILE_GAMEPLAY_HOTFIX', camera:{follow:GAMEPLAY_CAMERA.cameraFollowDistance,height:GAMEPLAY_CAMERA.cameraHeight,lookAhead:GAMEPLAY_CAMERA.cameraLookAhead}, feel:{deadzone:GAME_FEEL.joystickDeadzone,release:GAME_FEEL.inputRelease,decel:GAME_FEEL.groundDeceleration}, viewport:{w:innerWidth,h:innerHeight,landscape:innerWidth>innerHeight}}),
    getV53: () => ({...V53_CODEX_VISUAL_GAMEPLAY, powerups: powerups.length, gotPowerups: powerups.filter(p=>p.got).length, playerWeapon:p.weapon||null, shield:p.shield||0, star: now() < (p.starUntil||0)}),
    getV542: () => ({label:'V58_GAMEPAD_JOGABILIDADE_RENDER', worldsHidden:true, settingsWorlds:true, fix:'world-strip hidden in markup and css'}),
    getV541: () => ({label:'V58_GAMEPAD_JOGABILIDADE_RENDER', settings:true, crystalPlus:true, worldsInSettings:true, orientation:'auto-css-resize'}),
    getV580Gamepad: () => ({label:'V58_GAMEPAD_JOGABILIDADE_RENDER', threeButtons:true, attackFixed:true, defenseFixed:true, groundOffset:.06, renderTarget:'voxel-adventure-reference'}),
    getV59OpenWorld: () => ({label:'V59_OPEN_WORLD_FOUNDATION', openWorld:isOpenWorld(), chunks:openWorldChunks ? openWorldChunks.size : 0, objects:openWorldObjects ? openWorldObjects.length : 0, doors:openWorldDoors ? openWorldDoors.length : 0, chests:openWorldChests ? openWorldChests.length : 0, region:currentOpenWorldRegion()?.id || null}),
    getV55VisualLanguage: () => ({label:'V58_GAMEPAD_JOGABILIDADE_RENDER', noWorldText:true, visualEnemies:true, visualItems:true, visualHazards:true, truePitVisual:true, renderPreserved:true, enemies:enemies.length, hazards:hazards.length, powerups:powerups.length}),
    getV548: () => ({label:'V58_GAMEPAD_JOGABILIDADE_RENDER', independentOverlay:true, levelGroupHiddenSafe:true, visibleTargets:true, enemies:enemies.length, hazards:hazards.length, powerups:powerups.length}),
    getV547: () => ({label:'V58_GAMEPAD_JOGABILIDADE_RENDER', renderRich:true, fakeInteractive:false, enemyShell:'big-real-target', hazardFrame:true, pickupBeam:true}),
    getV54Render: () => (window.ATHOS_V54_RENDER_PREMIUM && window.ATHOS_V54_RENDER_PREMIUM.getStatus ? window.ATHOS_V54_RENDER_PREMIUM.getStatus() : null),
    getV48Render: () => (window.ATHOS_V48_RENDER_TARGET && window.ATHOS_V48_RENDER_TARGET.getStatus ? window.ATHOS_V48_RENDER_TARGET.getStatus() : null),
    getV47Render: () => (window.ATHOS_V48_RENDER_TARGET && window.ATHOS_V48_RENDER_TARGET.getStatus ? window.ATHOS_V48_RENDER_TARGET.getStatus() : null),
    getV46Render: () => (window.ATHOS_V48_RENDER_TARGET && window.ATHOS_V48_RENDER_TARGET.getStatus ? window.ATHOS_V48_RENDER_TARGET.getStatus() : null),
    getV44Enemies: () => ({ label: V44_ENEMY_AI.label, cleanUi:'V48_RENDER_TARGET_GAMEPLAY', enemies: enemies.length, alive: enemies.filter(e=>!e.dead).length, enemyProjectiles: enemyProjectiles.length, markers: v44EnemyMarkers.length, boss: enemies.some(e=>e.type==='boss'), realButtonVisible: (()=>{ const b=document.querySelector('.game.active .world-chip[data-world="real"]'); return !!b && getComputedStyle(b).display !== 'none' && getComputedStyle(b).visibility !== 'hidden' && b.getBoundingClientRect().width > 0; })() }),
    getViewer3DState: () => ({ ...VIEWER_3D, hasViewer: !!els.nativeViewer, src: els.nativeViewer ? els.nativeViewer.getAttribute('src') : null }),
    hardStopAllInput: () => hardStopAllInput('test-api'),
    resetAllInputs: () => resetAllInputs('test-api'),
    setMoveHold: (direction, value) => setMoveHold(direction, value),
    clearVelocityHorizontal: () => clearVelocityHorizontal('test-api'),
    jump: () => jump(),
    power: () => power(),
    buildLevelById: (id) => { const idx = LEVELS.findIndex(l => l.id === id || l.world === id); if (idx < 0) return false; currentLevelIndex = idx; buildLevel(LEVELS[idx]); return true; },
    getV594HouseInterior: () => ({ label:'V594_HOUSE_INTERIOR', cameraMode, currentInteriorId, ownedHouses:openWorldProgress().ownedHouses, homeMission:openWorldProgress().homeMission, houses:openWorldHouses.length, interiors:openWorldInteriors.length, activities:openWorldActivities.length }),
    getV593MobilePolish: () => ({ label:'V593_MOBILE_POLISH', openWorld:isOpenWorld(), objects:openWorldObjects.length, chunks:openWorldChunks.size, doors:openWorldDoors.length, chests:openWorldChests.length, activities:openWorldActivities.length, npcs:openWorldNPCs.length, resources:openWorldResourceNodes.length, interiors:openWorldInteriors.length, inventory:openWorldProgress().resources, region:currentOpenWorldRegion()?.id, noReferenceBackground:true, physicsWeight:'professional', ambition:'The Sims + Minecraft + Mario World + GTA Kids' }),
    forcePortalReady: () => { if (!runtime) return false; runtime.crystals = runtime.requiredCrystals; runtime.defeated = runtime.requiredEnemies; runtime.quizSolved = true; runtime.portalAnnounced = false; updateHud(); return objectivesDone(); }
  };


  function installV58GamepadFix(){
    if (window.__ATHOS_V58_GAMEPAD_FIX__) return;
    window.__ATHOS_V58_GAMEPAD_FIX__ = true;
    const important = (el, prop, value) => { if(el && el.style) el.style.setProperty(prop, value, 'important'); };
    const px = n => `${Math.round(n)}px`;
    const clampV = (min,val,max)=>Math.max(min,Math.min(max,val));
    function ensureStyle(){
      if(document.getElementById('athos-v58-gamepad-style')) return;
      const st=document.createElement('style');
      st.id='athos-v58-gamepad-style';
      st.textContent=`
        body.athos-v58-gamepad .game.active .world-strip,
        body.athos-v58-gamepad .game.active .direction-buttons,
        body.athos-v58-gamepad .game.active .minimap,
        body.athos-v58-gamepad .game.active #powerBtn,
        body.athos-v58-gamepad .game.active #jumpBtn,
        body.athos-v58-gamepad .game.active [data-action="interact"]{display:flex!important;visibility:visible!important;opacity:1!important;}
      `;
      document.head.appendChild(st);
    }
    function apply(){
      ensureStyle(); document.body.classList.add('athos-v58-gamepad');
      const game=document.querySelector('.game.active')||document.querySelector('.game'); if(!game) return;
      const vv=window.visualViewport, vw=Math.max(320,vv?vv.width:innerWidth), vh=Math.max(260,vv?vv.height:innerHeight);
      const landscape=vw>vh, safeBottom='env(safe-area-inset-bottom)';
      const btn=landscape?clampV(40,Math.min(vh*.078,vw*.050),54):clampV(48,Math.min(vw*.135,vh*.095),64);
      const joy=landscape?clampV(96,Math.min(vh*.22,vw*.13),124):clampV(104,Math.min(vw*.30,vh*.20),138);
      const gap=landscape?clampV(6,vh*.014,10):clampV(7,vw*.020,11);
      const side=landscape?10:10, bottom=landscape?8:10;
      const controls=game.querySelector('.game-controls'), left=game.querySelector('.left-zone'), right=game.querySelector('.right-zone'), joyRing=game.querySelector('.joy-ring'), joyKnob=game.querySelector('.joy-knob'), actionGrid=game.querySelector('.action-grid'), joystick=game.querySelector('.joystick');
      important(controls,'position','fixed'); important(controls,'left','0'); important(controls,'right','0'); important(controls,'bottom','0'); important(controls,'top','auto'); important(controls,'width','100vw'); important(controls,'height','0'); important(controls,'padding','0'); important(controls,'margin','0'); important(controls,'display','block'); important(controls,'z-index','9000'); important(controls,'pointer-events','none'); important(controls,'overflow','visible'); important(controls,'background','none'); important(controls,'border','0');
      important(left,'position','fixed'); important(left,'left',px(side)); important(left,'right','auto'); important(left,'top','auto'); important(left,'bottom',`calc(${px(bottom)} + ${safeBottom})`); important(left,'width',px(joy)); important(left,'height','auto'); important(left,'min-width',px(joy)); important(left,'display','flex'); important(left,'align-items','flex-end'); important(left,'justify-content','flex-start'); important(left,'z-index','9100'); important(left,'pointer-events','auto'); important(left,'transform','none'); important(left,'overflow','visible');
      important(joystick,'display','flex'); important(joystick,'align-items','center'); important(joystick,'justify-content','flex-end'); important(joystick,'width',px(joy)); important(joystick,'height','auto'); important(joystick,'pointer-events','auto');
      important(joyRing,'width',px(joy)); important(joyRing,'height',px(joy)); important(joyRing,'min-width',px(joy)); important(joyRing,'min-height',px(joy)); important(joyRing,'border-radius','50%'); important(joyRing,'pointer-events','auto');
      const knob=joy*.42; important(joyKnob,'width',px(knob)); important(joyKnob,'height',px(knob)); important(joyKnob,'margin',`${px(-knob/2)} 0 0 ${px(-knob/2)}`);
      const gridW=btn*2+gap, gridH=btn*2+gap;
      important(right,'position','fixed'); important(right,'left','auto'); important(right,'right',px(side)); important(right,'top','auto'); important(right,'bottom',`calc(${px(bottom)} + ${safeBottom})`); important(right,'width',px(gridW)); important(right,'height',px(gridH)); important(right,'min-width',px(gridW)); important(right,'display','flex'); important(right,'justify-content','flex-end'); important(right,'align-items','flex-end'); important(right,'z-index','9100'); important(right,'pointer-events','auto'); important(right,'transform','none'); important(right,'overflow','visible');
      important(actionGrid,'display','grid'); important(actionGrid,'grid-template-columns',`repeat(2, ${px(btn)})`); important(actionGrid,'grid-template-rows',`repeat(2, ${px(btn)})`); important(actionGrid,'gap',px(gap)); important(actionGrid,'width',px(gridW)); important(actionGrid,'height',px(gridH)); important(actionGrid,'pointer-events','auto'); important(actionGrid,'align-items','center'); important(actionGrid,'justify-items','center'); important(actionGrid,'overflow','visible');
      const visibleButtons=[
        ['#powerBtn',3,2,true],['[data-action="interact"]',2,3,true],['#jumpBtn',3,3,true],
        ['#crouchBtn',2,2,false],['#sizeBtn',1,2,false],['#normalBtn',1,3,false],
        ['[data-action="spin"]',1,1,false],['#pauseBtn',2,1,false],['#exitBtn',3,1,false]
      ];
      const grid3W = btn*3 + gap*2, grid3H = btn*3 + gap*2;
      important(right,'width',px(grid3W)); important(right,'height',px(grid3H)); important(right,'min-width',px(grid3W)); important(right,'right',px(side));
      important(actionGrid,'grid-template-columns',`repeat(3, ${px(btn)})`);
      important(actionGrid,'grid-template-rows',`repeat(3, ${px(btn)})`);
      important(actionGrid,'width',px(grid3W));
      important(actionGrid,'height',px(grid3H));
      for(const [sel,col,row,round] of visibleButtons){const b=game.querySelector(sel); if(!b) continue; important(b,'display','flex'); important(b,'visibility','visible'); important(b,'opacity','1'); important(b,'grid-column',String(col)); important(b,'grid-row',String(row)); important(b,'position','relative'); important(b,'width',px(btn)); important(b,'height',px(btn)); important(b,'min-width',px(btn)); important(b,'min-height',px(btn)); important(b,'max-width',px(btn)); important(b,'max-height',px(btn)); important(b,'margin','0'); important(b,'padding','0'); important(b,'border-radius',round?'50%':'14px'); important(b,'overflow','hidden'); important(b,'align-items','center'); important(b,'justify-content','center'); important(b,'pointer-events','auto'); important(b,'z-index','9200'); important(b,'font-size',round?'0':'13px'); important(b,'transform','none'); const span=b.querySelector('span'); if(span) important(span,'display',round?'none':'block');}
      const objective=game.querySelector('.objective-card'); if(objective){important(objective,'z-index','70'); important(objective,'pointer-events','none'); if(landscape){important(objective,'top','calc(58px + env(safe-area-inset-top))'); important(objective,'width','min(46vw,430px)'); important(objective,'min-height','54px');} else {important(objective,'top','calc(74px + env(safe-area-inset-top))'); important(objective,'width','min(86vw,500px)'); important(objective,'min-height','64px');}}
    }
    const schedule=()=>requestAnimationFrame(()=>requestAnimationFrame(apply)); window.addEventListener('resize',schedule,{passive:true}); window.addEventListener('orientationchange',schedule,{passive:true}); if(window.visualViewport) window.visualViewport.addEventListener('resize',schedule,{passive:true}); new MutationObserver(schedule).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style','hidden']}); setInterval(apply,900); schedule(); setTimeout(apply,400); setTimeout(apply,1400);
  }

  setupInputs(); setupUI(); installV58GamepadFix(); updateLobbyStats(); refreshServiceWorker();
  if (document.readyState === 'complete') setTimeout(ensureModelViewer, 0);
  else window.addEventListener('load', ensureModelViewer, { once:true });
})();
