(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const distance2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const STORAGE_KEY = 'otthos_life_world_complete_v600';

  const els = {
    lobby: $('#lobby'), game: $('#game'), stage: $('#stage'), screenTint: $('#screenTint'),
    playBtn: $('#playBtn'), continueBtn: $('#continueBtn'), installBtn: $('#installBtn'), installHint: $('#installHint'),
    arBtn: $('#arBtn'), quizBtn: $('#quizBtn'), talkBtn: $('#talkBtn'), collectionBtn: $('#collectionBtn'), moldsBtn: $('#moldsBtn'), howBtn: $('#howBtn'), settingsBtn: $('#settingsBtn'),
    lobbyLevel: $('#lobbyLevel'), lobbyCoins: $('#lobbyCoins'), lobbyRep: $('#lobbyRep'), lobbyMedals: $('#lobbyMedals'),
    hudLevel: $('#hudLevel'), xpFill: $('#xpFill'), xpText: $('#xpText'), hudCoins: $('#hudCoins'),
    needHunger: $('#needHunger'), needEnergy: $('#needEnergy'), needFun: $('#needFun'), needHygiene: $('#needHygiene'),
    missionChapter: $('#missionChapter'), missionTitle: $('#missionTitle'), missionStep: $('#missionStep'), missionFill: $('#missionFill'),
    inventoryBtn: $('#inventoryBtn'), buildBtn: $('#buildBtn'), mapBtn: $('#mapBtn'), gameSettingsBtn: $('#gameSettingsBtn'),
    contextPrompt: $('#contextPrompt'), contextIcon: $('#contextIcon'), contextLabel: $('#contextLabel'), contextHint: $('#contextHint'),
    joystick: $('#joystick'), joystickKnob: $('#joystickKnob'), specialBtn: $('#specialBtn'), actionBtn: $('#actionBtn'), jumpBtn: $('#jumpBtn'),
    buildBadge: $('#buildBadge'), buildTypeLabel: $('#buildTypeLabel'), vehicleBadge: $('#vehicleBadge'), toast: $('#toast'),
    modal: $('#modal'), modalTitle: $('#modalTitle'), modalBody: $('#modalBody'), modalClose: $('#modalClose'),
    installBanner: $('#installBanner'), installBannerBtn: $('#installBannerBtn'), installBannerClose: $('#installBannerClose'),
    nativeViewer: $('#nativeViewer')
  };

  const defaultState = () => ({
    version: 600,
    profile: { playerId: uid(), name: 'Otto', level: 1, xp: 0, coins: 500, reputation: 0 },
    needs: { hunger: 92, energy: 92, fun: 86, hygiene: 88 },
    inventory: { wood: 0, stone: 0, food: 2, water: 2, crystals: 0, blocks: 4, fences: 2, keys: 0 },
    houses: {
      home: { owned: true, locked: false, home: true },
      blue: { owned: false, locked: true, price: 250 },
      pink: { owned: false, locked: true, price: 420 },
      cabin: { owned: false, locked: false, price: 180 }
    },
    friendship: { otto: 0, luna: 0, teo: 0, bia: 0, maya: 0 },
    flags: {},
    completedChapters: [],
    medals: [],
    builds: [],
    defeated: 0,
    position: { x: 0, y: 0, z: 8, yaw: 0 },
    settings: { sound: true, quality: 'high', vibration: true },
    lastSaved: Date.now()
  });

  function loadState() {
    const fresh = defaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh;
      const saved = JSON.parse(raw);
      return {
        ...fresh,
        ...saved,
        profile: { ...fresh.profile, ...(saved.profile || {}) },
        needs: { ...fresh.needs, ...(saved.needs || {}) },
        inventory: { ...fresh.inventory, ...(saved.inventory || {}) },
        houses: { ...fresh.houses, ...(saved.houses || {}) },
        friendship: { ...fresh.friendship, ...(saved.friendship || {}) },
        flags: { ...(saved.flags || {}) },
        settings: { ...fresh.settings, ...(saved.settings || {}) },
        builds: Array.isArray(saved.builds) ? saved.builds : [],
        medals: Array.isArray(saved.medals) ? saved.medals : [],
        completedChapters: Array.isArray(saved.completedChapters) ? saved.completedChapters : []
      };
    } catch (error) {
      console.warn('Falha ao ler progresso; usando estado novo.', error);
      return fresh;
    }
  }

  let state = loadState();
  let saveTimer = 0;
  function saveState(immediate = false) {
    state.lastSaved = Date.now();
    const commit = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      updateLobbyStats();
    };
    clearTimeout(saveTimer);
    if (immediate) commit(); else saveTimer = setTimeout(commit, 160);
  }

  function addXP(amount) {
    state.profile.xp += Math.max(0, Math.round(amount));
    const nextLevel = Math.floor(state.profile.xp / 1000) + 1;
    if (nextLevel > state.profile.level) {
      state.profile.level = nextLevel;
      toast(`Nível ${nextLevel}!`, 'good');
      awardMedal(`Nível ${nextLevel}`);
    }
    saveState();
    updateHUD();
  }
  function addCoins(amount) {
    state.profile.coins = Math.max(0, state.profile.coins + Math.round(amount));
    saveState(); updateHUD();
  }
  function addReputation(amount) {
    state.profile.reputation = Math.max(0, state.profile.reputation + Math.round(amount));
    saveState(); updateHUD();
  }
  function awardMedal(name) {
    if (state.medals.includes(name)) return;
    state.medals.push(name);
    toast(`🏅 ${name}`, 'good');
    saveState();
  }
  function setFlag(flag, value = true) {
    if (state.flags[flag] === value) return;
    state.flags[flag] = value;
    evaluateMissions();
    saveState();
  }

  function showScreen(name) {
    els.lobby.classList.toggle('active', name === 'lobby');
    els.game.classList.toggle('active', name === 'game');
  }
  function toast(text, type = 'good', ms = 1700) {
    els.toast.textContent = text;
    els.toast.className = `toast show ${type}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('show'), ms);
  }
  function vibrate(pattern = 30) {
    if (state.settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
  }
  function beep(freq = 500, duration = 70, type = 'square') {
    if (!state.settings.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = beep.ctx || (beep.ctx = new Ctx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq; gain.gain.value = .025;
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration / 1000);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }

  function openModal(title, html, onReady) {
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = html;
    els.modal.hidden = false;
    if (onReady) onReady(els.modalBody);
  }
  function closeModal() { els.modal.hidden = true; els.modalBody.innerHTML = ''; }
  function confirmModal(title, text, yesLabel = 'Sim', noLabel = 'Não') {
    return new Promise(resolve => {
      openModal(title, `<p>${text}</p><div class="modal-actions"><button class="btn primary" data-yes>${yesLabel}</button><button class="btn" data-no>${noLabel}</button></div>`, root => {
        $('[data-yes]', root).onclick = () => { closeModal(); resolve(true); };
        $('[data-no]', root).onclick = () => { closeModal(); resolve(false); };
      });
    });
  }
  els.modalClose.onclick = closeModal;
  els.modal.addEventListener('pointerdown', e => { if (e.target === els.modal) closeModal(); });

  /* PWA */
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installBanner.hidden = false;
    els.installHint.textContent = 'Aplicativo pronto para instalar.';
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    els.installBanner.hidden = true;
    els.installHint.textContent = 'Otthos instalado como aplicativo.';
    toast('Aplicativo instalado!', 'good');
  });
  async function installApp() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.installBanner.hidden = true;
      return;
    }
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    openModal('Instalar aplicativo', isiOS
      ? '<p>No iPhone/iPad, toque no botão <b>Compartilhar</b> do Safari e escolha <b>Adicionar à Tela de Início</b>.</p>'
      : '<p>No Chrome, abra o menu ⋮ e toque em <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</p>');
  }
  els.installBtn.onclick = installApp;
  els.installBannerBtn.onclick = installApp;
  els.installBannerClose.onclick = () => { els.installBanner.hidden = true; };
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=600').catch(console.warn));

  const quizQuestions = [
    ['O que recupera energia?', ['Dormir na cama', 'Pular na lava', 'Fechar o jogo'], 0],
    ['O que é necessário para construir?', ['Madeira e pedra', 'Apenas moedas', 'Nenhum item'], 0],
    ['Como fazer amizade?', ['Conversando e ajudando', 'Batendo nos vizinhos', 'Ignorando todos'], 0],
    ['Quem pode entrar em uma casa trancada?', ['O proprietário', 'Qualquer inimigo', 'Ninguém nunca'], 0],
    ['Qual botão serve para interagir?', ['AÇÃO', 'PODER', 'MAPA'], 0],
    ['Onde fica a aventura de plataformas?', ['No Vale dos Cristais', 'Dentro do menu', 'No céu invisível'], 0],
    ['O que melhora a reputação?', ['Completar tarefas', 'Perder itens', 'Sair do mapa'], 0],
    ['Qual item conserta a ponte?', ['Madeira e pedra', 'Televisão', 'Água'], 0],
    ['O modo AR faz o quê?', ['Mostra o Otthos no mundo real', 'Apaga o progresso', 'Remove o 3D'], 0],
    ['O que o Otthos pode fazer em casa?', ['Dormir, comer e se divertir', 'Somente ficar parado', 'Apenas lutar'], 0]
  ];
  function openQuiz() {
    let index = Math.floor(Math.random() * quizQuestions.length), score = 0, answered = 0;
    const render = () => {
      const [q, options, correct] = quizQuestions[index];
      openModal(`Quiz — ${score} ponto${score === 1 ? '' : 's'}`, `<h3>${q}</h3><div>${options.map((o, i) => `<button class="quiz-option" data-opt="${i}">${o}</button>`).join('')}</div>`, root => {
        $$('[data-opt]', root).forEach(btn => btn.onclick = () => {
          const choice = Number(btn.dataset.opt); answered++;
          if (choice === correct) { score++; btn.classList.add('correct'); addXP(10); beep(760); }
          else { btn.classList.add('wrong'); $$('[data-opt]', root)[correct].classList.add('correct'); beep(190, 100, 'sawtooth'); }
          setTimeout(() => {
            if (answered >= 5) {
              awardMedal(score >= 4 ? 'Mestre do Quiz' : 'Aprendiz do Quiz');
              addCoins(score * 8);
              openModal('Resultado', `<h3>${score}/5</h3><p>Você ganhou ${score * 8} moedas.</p><div class="modal-actions"><button class="btn primary" data-close>Concluir</button></div>`, r => $('[data-close]', r).onclick = closeModal);
            } else { index = (index + 1 + Math.floor(Math.random() * 3)) % quizQuestions.length; render(); }
          }, 550);
        });
      });
    };
    render();
  }

  const talkAnswers = [
    { keys: ['casa','moradia'], text: 'Você pode comprar casas, trancar as suas portas e usar cada cômodo. A Casa do Otthos já é sua.' },
    { keys: ['amigo','vizinho'], text: 'Converse com Otto, Luna, Teo, Bia e Maya. A amizade aumenta quando você fala e ajuda.' },
    { keys: ['construir','bloco'], text: 'Colete madeira e pedra. No botão Construir você escolhe blocos, cercas e decoração.' },
    { keys: ['emprego','trabalho'], text: 'A Garagem oferece entregas com o carrinho. Elas dão moedas e reputação.' },
    { keys: ['missão','objetivo'], text: 'Siga o cartão de missão no alto. Ele muda quando você completa cada objetivo.' },
    { keys: ['multiplayer'], text: 'A base já possui identidade de jogador e sincronização local de teste. O servidor online entra na próxima conexão de backend.' },
    { keys: ['ar','realidade'], text: 'Use Realidade Aumentada para colocar o Otthos no chão do mundo real.' }
  ];
  function openTalk() {
    openModal('Conversar com Otthos', `<p>Pergunte sobre casa, vizinhos, construção, trabalho, missões ou AR.</p><div class="talk-row"><input id="talkInput" placeholder="Digite sua pergunta"><button id="talkSend" class="btn primary">Perguntar</button></div><div id="talkAnswer" class="dialogue-box">Estou ouvindo!</div>`, root => {
      const input = $('#talkInput', root), answer = $('#talkAnswer', root);
      const send = () => {
        const value = input.value.toLowerCase().trim();
        const found = talkAnswers.find(row => row.keys.some(k => value.includes(k)));
        answer.textContent = found ? found.text : 'Explore o mundo, entre nas casas e converse com os moradores. Cada atividade melhora sua vida e libera novas missões.';
        input.value = '';
      };
      $('#talkSend', root).onclick = send;
      input.onkeydown = e => { if (e.key === 'Enter') send(); };
    });
  }

  function openCollection() {
    const medals = state.medals.length ? state.medals.map(m => `<div class="inventory-item"><b>🏅</b><span>${m}</span></div>`).join('') : '<p>Nenhuma medalha ainda. Complete missões, quiz e desafios.</p>';
    openModal('Coleção e conquistas', `<div class="inventory-grid">${medals}</div>`);
  }
  const moldFiles = [
    ['athos_moldes_caneta_3d.png','Moldes para caneta 3D'],
    ['athos_moldes_para_caneta_3d.png','Peças do Otthos'],
    ['modelo-referencia-athos.png','Modelo de referência'],
    ['modelo_referencia.png','Referência frontal'],
    ['modelo_referencia_athos.png','Referência completa'],
    ['moldes-athos-caneta-3d.png','Kit de moldes']
  ];
  function openMolds() {
    openModal('Moldes 3D do Otthos', `<p>Abra a imagem em tamanho maior para usar como referência.</p><div class="mold-grid">${moldFiles.map(([file, title]) => `<a class="mold-card" href="./assets/moldes/${file}" target="_blank" rel="noopener"><img src="./assets/moldes/${file}" alt="${title}"><b>${title}</b></a>`).join('')}</div>`);
  }
  function openHow() {
    openModal('Como jogar', `<div class="choice-grid">
      <div class="choice"><b>🕹 Andar</b><span>Use o joystick. O movimento acompanha a direção da câmera.</span></div>
      <div class="choice"><b>✋ Ação</b><span>Abre portas, conversa, usa móveis, compra casas, coleta e ataca de perto.</span></div>
      <div class="choice"><b>⬆ Pular</b><span>Pulo rápido com peso. Use nas plataformas e áreas secretas.</span></div>
      <div class="choice"><b>🔥 Poder</b><span>Lança fogo contra monstros de fantasia.</span></div>
      <div class="choice"><b>🧱 Construir</b><span>Escolha um item e coloque em áreas autorizadas.</span></div>
      <div class="choice"><b>🏠 Casas</b><span>Compre, tranque, entre e faça atividades dentro delas.</span></div>
    </div>`);
  }

  const missionChapters = [
    {
      id: 'home', title: 'Arrume sua casa', chapter: 'CAPÍTULO 1 — VIDA EM CASA', reward: { coins: 100, medal: 'Minha Primeira Casa' },
      steps: [
        ['enteredHome', 'Entre na Casa do Otthos.'],
        ['slept', 'Durma na cama para recuperar energia.'],
        ['ateMeal', 'Prepare e coma uma refeição.'],
        ['talkedOtto', 'Converse com Otto na praça.']
      ]
    },
    {
      id: 'neighbors', title: 'Vida de bairro', chapter: 'CAPÍTULO 2 — VIZINHOS', reward: { coins: 160, medal: 'Bom Vizinho' },
      steps: [
        ['metNeighbors', 'Converse com três vizinhos diferentes.'],
        ['boughtHouse', 'Compre uma segunda casa.'],
        ['lockedHouse', 'Tranque uma casa que pertence a você.']
      ]
    },
    {
      id: 'builder', title: 'Construtor do vale', chapter: 'CAPÍTULO 3 — MINECRAFT KIDS', reward: { coins: 220, medal: 'Construtor do Vale' },
      steps: [
        ['hasMaterials', 'Colete 3 madeiras e 2 pedras.'],
        ['bridgeFixed', 'Conserte a ponte quebrada.'],
        ['builtThree', 'Construa três objetos na sua área.']
      ]
    },
    {
      id: 'adventure', title: 'Vale dos Cristais', chapter: 'CAPÍTULO 4 — AVENTURA', reward: { coins: 280, medal: 'Herói dos Cristais' },
      steps: [
        ['fiveCrystals', 'Colete cinco cristais no percurso.'],
        ['threeEnemies', 'Derrote três monstros de fantasia.'],
        ['secretChest', 'Encontre e abra o baú secreto.']
      ]
    },
    {
      id: 'city', title: 'Cidade em movimento', chapter: 'CAPÍTULO 5 — SECOND LIFE KIDS', reward: { coins: 350, medal: 'Estrela da Cidade' },
      steps: [
        ['gotVehicle', 'Pegue o carrinho na garagem.'],
        ['deliveryDone', 'Faça a entrega para Maya.'],
        ['rep50', 'Alcance 50 pontos de reputação.']
      ]
    }
  ];

  let activeMission = null;
  function deriveMissionFlags() {
    const friendCount = Object.values(state.friendship).filter(v => v > 0).length;
    state.flags.metNeighbors = friendCount >= 3;
    state.flags.hasMaterials = state.inventory.wood >= 3 && state.inventory.stone >= 2;
    state.flags.builtThree = state.builds.length >= 3;
    state.flags.fiveCrystals = state.inventory.crystals >= 5;
    state.flags.threeEnemies = state.defeated >= 3;
    state.flags.rep50 = state.profile.reputation >= 50;
  }
  function evaluateMissions() {
    deriveMissionFlags();
    for (const chapter of missionChapters) {
      const complete = chapter.steps.every(([flag]) => !!state.flags[flag]);
      if (complete && !state.completedChapters.includes(chapter.id)) {
        state.completedChapters.push(chapter.id);
        addCoins(chapter.reward.coins);
        awardMedal(chapter.reward.medal);
        toast(`Capítulo concluído: ${chapter.title}`, 'good', 2600);
      }
    }
    const chapter = missionChapters.find(c => !c.steps.every(([flag]) => !!state.flags[flag])) || missionChapters[missionChapters.length - 1];
    const nextIndex = chapter.steps.findIndex(([flag]) => !state.flags[flag]);
    activeMission = { chapter, stepIndex: nextIndex < 0 ? chapter.steps.length : nextIndex };
    updateMissionHUD();
  }
  function updateMissionHUD() {
    if (!activeMission) return;
    const { chapter, stepIndex } = activeMission;
    els.missionChapter.textContent = chapter.chapter;
    els.missionTitle.textContent = chapter.title;
    els.missionStep.textContent = stepIndex < chapter.steps.length ? chapter.steps[stepIndex][1] : 'Capítulo concluído!';
    els.missionFill.style.width = `${Math.round((Math.min(stepIndex, chapter.steps.length) / chapter.steps.length) * 100)}%`;
  }

  function updateLobbyStats() {
    els.lobbyLevel.textContent = state.profile.level;
    els.lobbyCoins.textContent = state.profile.coins;
    els.lobbyRep.textContent = state.profile.reputation;
    els.lobbyMedals.textContent = state.medals.length;
  }
  function updateHUD() {
    els.hudLevel.textContent = state.profile.level;
    const xpBase = (state.profile.level - 1) * 1000;
    const xpInLevel = state.profile.xp - xpBase;
    els.xpFill.style.width = `${clamp(xpInLevel / 1000 * 100, 0, 100)}%`;
    els.xpText.textContent = `${xpInLevel} / 1000`;
    els.hudCoins.textContent = state.profile.coins;
    const needs = [['hunger', els.needHunger], ['energy', els.needEnergy], ['fun', els.needFun], ['hygiene', els.needHygiene]];
    needs.forEach(([key, el]) => el.style.width = `${clamp(state.needs[key], 0, 100)}%`);
    updateMissionHUD();
  }

  function openInventory() {
    const inv = state.inventory;
    openModal('Inventário', `<div class="inventory-grid">
      <div class="inventory-item"><b>🪵 ${inv.wood}</b><span>Madeira</span></div>
      <div class="inventory-item"><b>🪨 ${inv.stone}</b><span>Pedra</span></div>
      <div class="inventory-item"><b>🍎 ${inv.food}</b><span>Comida</span></div>
      <div class="inventory-item"><b>💧 ${inv.water}</b><span>Água</span></div>
      <div class="inventory-item"><b>💎 ${inv.crystals}</b><span>Cristais</span></div>
      <div class="inventory-item"><b>🧱 ${inv.blocks}</b><span>Blocos</span></div>
      <div class="inventory-item"><b>🪵 ${inv.fences}</b><span>Cercas</span></div>
      <div class="inventory-item"><b>🪙 ${state.profile.coins}</b><span>Moedas</span></div>
    </div>`);
  }
  function openMap() {
    openModal('Mapa da Vila do Sol', `<div class="map-grid">
      <span class="map-place" style="left:50%;top:54%">🏘 Vila</span>
      <span class="map-place" style="left:18%;top:35%">🌲 Floresta</span>
      <span class="map-place" style="left:20%;top:76%">🌊 Lago</span>
      <span class="map-place" style="left:76%;top:32%">💎 Vale</span>
      <span class="map-place" style="left:83%;top:68%">🏰 Castelo</span>
      <span class="map-place" style="left:56%;top:82%">🚗 Garagem</span>
    </div><p>O ponto verde no mundo indica seu objetivo atual.</p>`);
  }

  let deferredSettingsRefresh = null;
  function openSettings(inGame = false) {
    const sound = state.settings.sound, vibration = state.settings.vibration, high = state.settings.quality === 'high';
    openModal('Configurações', `<div class="settings-list">
      <div class="settings-row"><div><b>Som</b><small>Interface, coleta e combate</small></div><button class="toggle ${sound ? 'on' : ''}" data-toggle="sound"><i></i></button></div>
      <div class="settings-row"><div><b>Vibração</b><small>Feedback no celular</small></div><button class="toggle ${vibration ? 'on' : ''}" data-toggle="vibration"><i></i></button></div>
      <div class="settings-row"><div><b>Qualidade gráfica</b><small>${high ? 'Alta' : 'Econômica'}</small></div><button class="toggle ${high ? 'on' : ''}" data-toggle="quality"><i></i></button></div>
    </div><div class="modal-actions">
      <button class="btn primary" data-install>Instalar aplicativo</button>
      ${inGame ? '<button class="btn" data-home>Voltar para casa</button><button class="btn" data-exit>Sair para o menu</button>' : ''}
      <button class="btn" data-reset>Apagar progresso</button>
    </div>`, root => {
      $$('[data-toggle]', root).forEach(btn => btn.onclick = () => {
        const key = btn.dataset.toggle;
        if (key === 'quality') state.settings.quality = state.settings.quality === 'high' ? 'low' : 'high';
        else state.settings[key] = !state.settings[key];
        saveState(true); closeModal(); applyQuality(); openSettings(inGame);
      });
      $('[data-install]', root).onclick = installApp;
      const home = $('[data-home]', root); if (home) home.onclick = () => { closeModal(); returnHome(); };
      const exit = $('[data-exit]', root); if (exit) exit.onclick = () => { closeModal(); stopGame(); };
      $('[data-reset]', root).onclick = async () => {
        if (await confirmModal('Apagar progresso', 'Tem certeza? Casas, moedas, amizade e construções serão apagadas.', 'Apagar', 'Cancelar')) {
          state = defaultState(); saveState(true); location.reload();
        }
      };
    });
  }

  els.quizBtn.onclick = openQuiz;
  els.talkBtn.onclick = openTalk;
  els.collectionBtn.onclick = openCollection;
  els.moldsBtn.onclick = openMolds;
  els.howBtn.onclick = openHow;
  els.settingsBtn.onclick = () => openSettings(false);
  els.inventoryBtn.onclick = openInventory;
  els.mapBtn.onclick = openMap;
  els.gameSettingsBtn.onclick = () => openSettings(true);
  els.arBtn.onclick = async () => {
    try { await els.nativeViewer.activateAR(); }
    catch { openModal('Realidade aumentada', '<p>Use o botão <b>Ver em AR</b> no visualizador 3D. O recurso depende do suporte do aparelho.</p>'); }
  };

  /* THREE.JS GAME */
  let scene, camera, renderer, clock, worldGroup, playerGroup, playerModel, contactShadow, vehicleVisual;
  let running = false, paused = false, raf = 0, cameraYaw = 0, cameraPitch = .38, cameraMode = 'openworld';
  let currentHouse = null, buildMode = null, currentContext = null, lastContextId = '';
  const player = { x: 0, y: 0, z: 8, vx: 0, vy: 0, vz: 0, facing: Math.PI, grounded: true, vehicle: false, sitUntil: 0, lastGrounded: 0, jumpBuffer: 0, attackUntil: 0, damageUntil: 0 };
  const input = { x: 0, z: 0, targetX: 0, targetZ: 0, joyId: null, keys: new Set(), cameraDrag: null };
  const world = {
    houses: [], npcs: [], interactables: [], enemies: [], fireballs: [], resources: [], crystals: [], platforms: [], colliders: [], hazards: [], builds: [], ghosts: new Map(),
    bridgeParts: [], secretChest: null, vehicle: null, deliveryPoint: null
  };
  const textures = {};
  const materials = {};

  function canvasTexture(kind, colors) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, 64, 64);
    if (kind === 'grass') {
      for (let i = 0; i < 80; i++) { ctx.fillStyle = colors[1 + (i % (colors.length - 1))]; ctx.fillRect(Math.random() * 64, Math.random() * 64, 2 + Math.random() * 4, 2 + Math.random() * 4); }
    } else if (kind === 'road') {
      for (let i = 0; i < 32; i++) { ctx.fillStyle = colors[1]; ctx.fillRect(Math.random() * 64, Math.random() * 64, 5 + Math.random() * 8, 2 + Math.random() * 4); }
    } else if (kind === 'wood') {
      ctx.strokeStyle = colors[1]; ctx.lineWidth = 4; for (let x = 0; x < 64; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 64); ctx.stroke(); }
    } else if (kind === 'brick') {
      ctx.strokeStyle = colors[1]; ctx.lineWidth = 3; for (let y = 0; y < 64; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke(); for (let x = (y / 16 % 2) * 16; x < 64; x += 32) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); } }
    }
    const tex = new THREE.CanvasTexture(c); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestMipMapNearestFilter; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
  }
  function initMaterials() {
    textures.grass = canvasTexture('grass', ['#4caf3d','#72d54c','#2f8d31','#8be65b']); textures.grass.repeat.set(28, 28);
    textures.road = canvasTexture('road', ['#c29150','#d9aa67']); textures.road.repeat.set(18, 18);
    textures.wood = canvasTexture('wood', ['#9a5a28','#693819']); textures.wood.repeat.set(2, 2);
    textures.brick = canvasTexture('brick', ['#c38142','#8a4e25']); textures.brick.repeat.set(3, 2);
    materials.grass = new THREE.MeshStandardMaterial({ map: textures.grass, roughness: .88 });
    materials.road = new THREE.MeshStandardMaterial({ map: textures.road, roughness: .9 });
    materials.wood = new THREE.MeshStandardMaterial({ map: textures.wood, roughness: .8 });
    materials.brick = new THREE.MeshStandardMaterial({ map: textures.brick, roughness: .82 });
    materials.water = new THREE.MeshStandardMaterial({ color:0x2fc8f4, emissive:0x087aa7, emissiveIntensity:.18, transparent:true, opacity:.72, roughness:.2, metalness:.1 });
    materials.stone = new THREE.MeshStandardMaterial({ color:0x8795a6, roughness:.9, flatShading:true });
    materials.dark = new THREE.MeshStandardMaterial({ color:0x080b11, roughness:.55, flatShading:true });
  }
  function mat(color, opts = {}) { return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? .72, metalness: opts.metalness ?? .03, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, flatShading: opts.flatShading ?? true }); }
  function box(w, h, d, materialOrColor, x = 0, y = 0, z = 0, parent = worldGroup) {
    const material = typeof materialOrColor === 'number' ? mat(materialOrColor) : materialOrColor;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(r, h, color, x, y, z, parent = worldGroup, sides = 10) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, sides), mat(color)); mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function addGlow(x, y, z, color = 0x5ae5ff, size = 4) {
    const light = new THREE.PointLight(color, .5, size * 3); light.position.set(x,y,z); worldGroup.add(light); return light;
  }

  function createPlayerModel() {
    playerGroup = new THREE.Group();
    playerGroup.name = 'OTTHOS_PLAYER';
    scene.add(playerGroup);
    playerModel = new THREE.Group();
    playerGroup.add(playerModel);
    const black = mat(0x050608), red = mat(0xff263d,{emissive:0x400008,emissiveIntensity:.22}), orange = mat(0xff7a13), yellow = mat(0xffd83d);
    const parts = {};
    parts.body = box(1.0,1.25,.72,black,0,1.55,0,playerModel);
    parts.head = box(1.08,1.08,1.08,black,0,2.72,0,playerModel);
    box(.22,.12,.06,red,-.27,2.78,.56,playerModel); box(.22,.12,.06,red,.27,2.78,.56,playerModel);
    parts.leftArm = new THREE.Group(); parts.rightArm = new THREE.Group(); parts.leftLeg = new THREE.Group(); parts.rightLeg = new THREE.Group();
    parts.leftArm.position.set(-.72,2.0,0); parts.rightArm.position.set(.72,2.0,0); parts.leftLeg.position.set(-.28,.92,0); parts.rightLeg.position.set(.28,.92,0);
    playerModel.add(parts.leftArm,parts.rightArm,parts.leftLeg,parts.rightLeg);
    box(.36,.95,.36,orange,0,-.46,0,parts.leftArm); box(.36,.30,.4,yellow,0,-1.08,0,parts.leftArm);
    box(.36,.95,.36,orange,0,-.46,0,parts.rightArm); box(.36,.30,.4,yellow,0,-1.08,0,parts.rightArm);
    box(.4,.92,.4,black,0,-.44,0,parts.leftLeg); box(.42,.30,.46,orange,0,-1.00,.05,parts.leftLeg);
    box(.4,.92,.4,black,0,-.44,0,parts.rightLeg); box(.42,.30,.46,orange,0,-1.00,.05,parts.rightLeg);
    playerModel.userData.parts = parts;

    const shadowMat = new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide});
    contactShadow = new THREE.Mesh(new THREE.CircleGeometry(.85,32),shadowMat); contactShadow.rotation.x = -Math.PI/2; contactShadow.position.y=.025; scene.add(contactShadow);

    vehicleVisual = new THREE.Group(); vehicleVisual.visible=false; playerGroup.add(vehicleVisual);
    box(1.8,.45,2.3,0x35a8ff,0,.42,0,vehicleVisual); box(1.5,.5,1.1,0xffd83d,0,.85,-.1,vehicleVisual);
    [[-.75,.18,-.75],[.75,.18,-.75],[-.75,.18,.75],[.75,.18,.75]].forEach(([x,y,z])=>cylinder(.25,.25,0x111827,x,y,z,vehicleVisual,12).rotation.z=Math.PI/2);
  }

  function registerCollider(x,z,w,d,options={}) { world.colliders.push({x,z,w,d,...options}); }
  function registerPlatform(x,z,w,d,top,options={}) { world.platforms.push({x,z,w,d,top,...options}); }
  function registerInteractable(data) { world.interactables.push({...data}); return data; }
  function worldPos(entry) {
    if (entry.getPos) return entry.getPos();
    return {x:entry.x,z:entry.z,y:entry.y||0};
  }
  function isInteractionAvailable(entry) {
    if (entry.disabled) return false;
    if (currentHouse) return entry.houseId === currentHouse.id || entry.globalInside;
    return !entry.houseId;
  }

  function createTree(x,z,scale=1,resource=true) {
    const group = new THREE.Group(); group.position.set(x,0,z); worldGroup.add(group);
    box(.75*scale,2.3*scale,.75*scale,materials.wood,0,1.15*scale,0,group);
    box(2.7*scale,1.45*scale,2.7*scale,0x249644,0,2.75*scale,0,group);
    box(1.9*scale,1.0*scale,1.9*scale,0x49c85a,0,3.65*scale,0,group);
    if(resource){
      const id=`tree-${x.toFixed(1)}-${z.toFixed(1)}`;
      world.resources.push({id,type:'wood',x,z,mesh:group,collected:false});
      registerInteractable({id,type:'resource',icon:'🪵',label:'Coletar madeira',x,z,radius:2.4,action:()=>collectResource(id)});
    }
    return group;
  }
  function createRock(x,z,scale=1,resource=true) {
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(.8*scale,0),materials.stone); mesh.position.set(x,.55*scale,z); mesh.castShadow=true; mesh.receiveShadow=true; worldGroup.add(mesh);
    if(resource){const id=`rock-${x.toFixed(1)}-${z.toFixed(1)}`;world.resources.push({id,type:'stone',x,z,mesh,collected:false});registerInteractable({id,type:'resource',icon:'🪨',label:'Coletar pedra',x,z,radius:2.2,action:()=>collectResource(id)});} return mesh;
  }
  function createFlower(x,z,color=0xff70c8){
    box(.08,.42,.08,0x2f9a42,x,.21,z); box(.35,.18,.35,color,x,.5,z);
  }
  function createLamp(x,z){
    box(.22,2.5,.22,materials.wood,x,1.25,z); box(.68,.68,.68,0xffdf75,x,2.72,z); addGlow(x,2.72,z,0xffd56b,4);
  }
  function createFenceLine(x1,z1,x2,z2,segments=8){
    for(let i=0;i<=segments;i++){const t=i/segments;box(.18,1.0,.18,materials.wood,lerp(x1,x2,t),.5,lerp(z1,z2,t));}
    const mx=(x1+x2)/2,mz=(z1+z2)/2,w=Math.abs(x2-x1)||.15,d=Math.abs(z2-z1)||.15;box(w+.2,.13,d+.2,materials.wood,mx,.73,mz);
  }
  function createRoad(x,z,w,d){box(w,.08,d,materials.road,x,.04,z);}
  function createWater(x,z,w,d){box(w,.12,d,materials.water,x,.02,z);world.hazards.push({type:'water',x,z,w,d});}
  function createLava(x,z,w,d){const m=box(w,.12,d,mat(0xff3a00,{emissive:0xff2200,emissiveIntensity:.9}),x,.03,z);world.hazards.push({type:'lava',x,z,w,d});return m;}

  function createFurniture(house, type, lx, lz, color=0xffffff, label='Usar') {
    const x=house.x+lx,z=house.z+lz; let group=new THREE.Group(); group.position.set(x,0,z); worldGroup.add(group);
    if(type==='bed'){box(2.2,.45,1.2,0x78503c,0,.25,0,group);box(2.0,.32,1.05,0x4db7ff,0,.63,0,group);box(.65,.22,1.0,0xf5f5f5,-.65,.86,0,group);}
    if(type==='sofa'){box(2.2,.55,.85,color,0,.38,0,group);box(2.2,.8,.28,color,0,.9,-.34,group);}
    if(type==='tv'){box(1.6,1.0,.18,0x10151e,0,1.25,0,group);box(1.35,.74,.05,0x47cfff,0,1.25,.12,group);box(.65,.55,.55,0x5b3b21,0,.35,0,group);}
    if(type==='fridge'){box(.9,1.8,.8,0xe6f4ff,0,.9,0,group);box(.06,.55,.08,0x607487,.28,1.0,.43,group);}
    if(type==='stove'){box(1.1,.9,.85,0x909bab,0,.45,0,group);for(const ox of [-.28,.28])for(const oz of [-.2,.2])cylinder(.12,.04,0x111827,ox,.94,oz,group,12);}
    if(type==='sink'){box(1.2,.85,.75,0xe4edf5,0,.43,0,group);box(.65,.12,.45,0x5bc7e8,0,.89,0,group);}
    if(type==='shower'){box(1.1,.08,1.1,0x7dd9fa,0,.04,0,group);box(.08,2.1,.08,0x8ba0b4,.45,1.05,-.42,group);}
    if(type==='chest'){box(1.2,.7,.8,materials.wood,0,.35,0,group);box(1.25,.18,.85,0xffd84d,0,.79,0,group);}
    if(type==='table'){box(1.5,.16,1.0,materials.wood,0,.9,0,group);for(const ox of [-.55,.55])for(const oz of [-.32,.32])box(.12,.82,.12,materials.wood,ox,.42,oz,group);}
    house.interiorObjects.push(group);
    return {group,x,z,type,label};
  }

  function createHouse(config) {
    const {id,name,x,z,color,roofColor,price=0,publicBuilding=false} = config;
    const house={id,name,x,z,w:9,d:7,color,roofColor,price,publicBuilding,roof:new THREE.Group(),front:new THREE.Group(),interiorObjects:[],owned:!!state.houses[id]?.owned};
    worldGroup.add(house.roof,house.front);
    box(9,.25,7,materials.wood,x,.12,z);
    box(9,2.8,.35,materials.brick,x,1.5,z-3.32);
    box(.35,2.8,7,materials.brick,x-4.32,1.5,z); box(.35,2.8,7,materials.brick,x+4.32,1.5,z);
    box(3.6,2.8,.35,materials.brick,x-2.7,1.5,z+3.32,house.front); box(3.6,2.8,.35,materials.brick,x+2.7,1.5,z+3.32,house.front);
    box(9.7,.65,7.7,roofColor,x,3.18,z,house.roof); box(8.8,.35,6.8,color,x,2.72,z,house.roof);
    const door=box(1.45,2.25,.18,materials.wood,x,1.12,z+3.48); door.userData.houseId=id;
    box(1.05,.82,.12,0xa7e9ff,x-2.4,1.45,z+3.5,house.front); box(1.05,.82,.12,0xa7e9ff,x+2.4,1.45,z+3.5,house.front);
    createLamp(x-3.7,z+4.0); createLamp(x+3.7,z+4.0);
    house.door=door;
    registerCollider(x,z-3.32,9,.35,{houseId:id}); registerCollider(x-4.32,z,.35,7,{houseId:id}); registerCollider(x+4.32,z,.35,7,{houseId:id}); registerCollider(x-2.7,z+3.32,3.6,.35,{houseId:id}); registerCollider(x+2.7,z+3.32,3.6,.35,{houseId:id});
    world.houses.push(house);
    registerInteractable({id:`door-${id}`,type:'door',icon:'🚪',label:`Porta: ${name}`,x,z:z+4.0,radius:2.5,action:()=>handleHouseDoor(house)});
    return house;
  }

  function addHouseInterior(house, type='home') {
    if(type==='home'){
      const bed=createFurniture(house,'bed',-2.6,-1.8,0,'Dormir');
      const sofa=createFurniture(house,'sofa',1.4,-1.7,0x8b5cf6,'Sentar no sofá');
      const tv=createFurniture(house,'tv',1.4,.1,0,'Assistir televisão');
      const fridge=createFurniture(house,'fridge',-2.9,1.1,0,'Abrir geladeira');
      const stove=createFurniture(house,'stove',-1.7,1.25,0,'Cozinhar');
      const sink=createFurniture(house,'sink',-.5,1.25,0,'Beber água');
      const shower=createFurniture(house,'shower',3.2,1.5,0,'Tomar banho');
      const chest=createFurniture(house,'chest',3.0,-1.8,0,'Abrir baú');
      registerActivity(house,bed,'bed');registerActivity(house,sofa,'sofa');registerActivity(house,tv,'tv');registerActivity(house,fridge,'fridge');registerActivity(house,stove,'stove');registerActivity(house,sink,'sink');registerActivity(house,shower,'shower');registerActivity(house,chest,'chest');
    } else if(type==='shop'){
      const table=createFurniture(house,'table',0,-1.2,0,'Comprar itens');registerActivity(house,table,'shop');
    } else if(type==='workshop'){
      const table=createFurniture(house,'table',0,-1.0,0,'Usar oficina');registerActivity(house,table,'workshop');
      createFurniture(house,'chest',2.8,-1.8,0,'Baú de ferramentas');
    } else if(type==='neighbor'){
      const sofa=createFurniture(house,'sofa',1,-1.5,0xef6c9d,'Sentar');registerActivity(house,sofa,'sofa');
      const tv=createFurniture(house,'tv',1,.2,0,'Assistir TV');registerActivity(house,tv,'tv');
      createFurniture(house,'bed',-2.5,-1.7,0,'Cama');
    }
    registerInteractable({id:`exit-${house.id}`,type:'exit',icon:'🚪',label:'Sair da casa',x:house.x,z:house.z+2.65,radius:1.5,houseId:house.id,action:()=>exitHouse()});
  }
  function registerActivity(house,item,activity){registerInteractable({id:`${activity}-${house.id}`,type:'activity',icon:activityIcon(activity),label:item.label,x:item.x,z:item.z,radius:1.55,houseId:house.id,action:()=>useActivity(activity,house)});}
  function activityIcon(type){return ({bed:'🛏',sofa:'🛋',tv:'📺',fridge:'🍎',stove:'🍳',sink:'💧',shower:'🚿',chest:'🎁',shop:'🛒',workshop:'🛠'})[type]||'✋';}

  function createNPC(id,name,x,z,color,pathRadius=3){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);
    const body=box(.78,1.12,.55,color,0,1.1,0,group);const head=box(.68,.68,.68,0xffd3a0,0,2.0,0,group);
    box(.08,.08,.04,0x111827,-.15,2.05,.36,group);box(.08,.08,.04,0x111827,.15,2.05,.36,group);
    const npc={id,name,x,z,baseX:x,baseZ:z,color,group,pathRadius,phase:Math.random()*6.28,friendship:state.friendship[id]||0,body,head};world.npcs.push(npc);
    registerInteractable({id:`npc-${id}`,type:'npc',icon:'💬',label:`Conversar com ${name}`,radius:2.7,getPos:()=>({x:npc.group.position.x,z:npc.group.position.z}),action:()=>talkToNPC(npc)});
    return npc;
  }
  function createEnemy(type,x,z){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);
    if(type==='slime'){box(1.35,.85,1.35,0x31c65b,0,.45,0,group);box(.18,.12,.05,0xff2441,-.28,.55,.7,group);box(.18,.12,.05,0xff2441,.28,.55,.7,group);}
    else if(type==='bat'){box(1.0,.75,1.0,0x35165e,0,1.4,0,group);box(.8,.18,.45,0x8c4ddb,-.8,1.4,0,group);box(.8,.18,.45,0x8c4ddb,.8,1.4,0,group);box(.12,.1,.05,0xff31f5,-.22,1.48,.54,group);box(.12,.1,.05,0xff31f5,.22,1.48,.54,group);}
    else {box(1.5,1.8,1.2,0x788495,0,1.0,0,group);box(1.0,.8,1.0,0x647080,0,2.2,0,group);box(.14,.1,.05,0xff293f,-.22,2.25,.52,group);box(.14,.1,.05,0xff293f,.22,2.25,.52,group);}
    const enemy={id:`enemy-${type}-${world.enemies.length}`,type,x,z,baseX:x,baseZ:z,group,hp:type==='golem'?3:1,phase:Math.random()*6.28,dead:false,lastHit:0};world.enemies.push(enemy);return enemy;
  }
  function createCrystal(x,y,z,secret=false){
    const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.48,0),mat(secret?0xa855f7:0x38d8ff,{emissive:secret?0x7e22ce:0x0a9dc0,emissiveIntensity:.7,metalness:.08,roughness:.22}));mesh.position.set(x,y,z);mesh.castShadow=true;worldGroup.add(mesh);addGlow(x,y,z,secret?0xa855f7:0x38d8ff,3);
    world.crystals.push({id:`crystal-${world.crystals.length}`,x,y,z,mesh,got:false,secret});
  }
  function createChest(id,x,z,secret=false){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);box(1.2,.72,.9,materials.wood,0,.36,0,group);const lid=box(1.25,.22,.95,secret?0xa855f7:0xffd84d,0,.84,0,group);const chest={id,x,z,group,lid,opened:!!state.flags[`chest_${id}`],secret};if(chest.opened)lid.rotation.x=-.6;registerInteractable({id:`chest-${id}`,type:'chest',icon:'🎁',label:secret?'Abrir baú secreto':'Abrir baú',x,z,radius:2,action:()=>openChest(chest)});return chest;
  }
  function createPlatform(x,y,z,w=3,d=3,color=0x8b5a2b){box(w,y,d,color,x,y/2,z);registerPlatform(x,z,w,d,y);}
  function createToyCar(x,z){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);box(1.9,.45,2.3,0x35a8ff,0,.42,0,group);box(1.5,.5,1.1,0xffd84d,0,.85,-.1,group);for(const p of [[-.78,.18,-.78],[.78,.18,-.78],[-.78,.18,.78],[.78,.18,.78]]){const wheel=cylinder(.25,.25,0x111827,p[0],p[1],p[2],group,12);wheel.rotation.z=Math.PI/2;}
    world.vehicle={x,z,group};registerInteractable({id:'toy-car',type:'vehicle',icon:'🚗',label:'Entrar no carrinho',x,z,radius:2.4,action:()=>enterVehicle()});
  }

  function buildWorld(){
    worldGroup=new THREE.Group();scene.add(worldGroup);
    const ground=box(250,.3,250,materials.grass,0,-.15,0);ground.receiveShadow=true;
    scene.background=new THREE.Color(0x76cfff);scene.fog=new THREE.Fog(0xa8e7ff,150,520);
    // roads
    createRoad(0,0,18,210);createRoad(0,0,210,18);createRoad(-55,-55,9,105);createRoad(55,48,9,92);
    // water, bridge, lava/secret zone
    createWater(-72,52,92,18);createWater(-100,70,38,34);
    // bridge visual and fixed flag
    for(let i=-5;i<=5;i++){const part=box(2.1,.35,5,materials.wood,-12+i*2.15,.25,52);world.bridgeParts.push(part);registerPlatform(-12+i*2.15,52,2.1,5,.43,{bridgePart:i+5});}
    createLava(96,-82,34,26);
    // trees forest
    for(let i=0;i<48;i++){const x=-92+(Math.random()-.5)*68,z=-52+(Math.random()-.5)*84;if(Math.abs(x+68)<10&&Math.abs(z-52)<12)continue;createTree(x,z,.75+Math.random()*.55,true);}
    for(let i=0;i<18;i++)createRock(-44+(Math.random()-.5)*60,-95+(Math.random()-.5)*54,.7+Math.random()*.6,true);
    for(let i=0;i<80;i++)createFlower((Math.random()-.5)*190,(Math.random()-.5)*190,Math.random()>.5?0xff74c9:0xffdf55);
    // village houses
    const home=createHouse({id:'home',name:'Casa do Otthos',x:0,z:18,color:0xc4843e,roofColor:0xd93a38});addHouseInterior(home,'home');
    const blue=createHouse({id:'blue',name:'Casa Azul',x:-25,z:17,color:0x4f9fd7,roofColor:0x225fa5,price:250});addHouseInterior(blue,'neighbor');
    const pink=createHouse({id:'pink',name:'Casa Rosa',x:25,z:17,color:0xe58aae,roofColor:0xb63871,price:420});addHouseInterior(pink,'neighbor');
    const cabin=createHouse({id:'cabin',name:'Cabana da Floresta',x:-88,z:-42,color:0x7e4a28,roofColor:0x4d2b1c,price:180});addHouseInterior(cabin,'neighbor');
    const shop=createHouse({id:'shop',name:'Mercadinho',x:-22,z:-18,color:0xf1b83e,roofColor:0xc83a2f,publicBuilding:true});addHouseInterior(shop,'shop');
    const workshop=createHouse({id:'workshop',name:'Oficina',x:22,z:-18,color:0x8c96a4,roofColor:0x3d4a5a,publicBuilding:true});addHouseInterior(workshop,'workshop');
    // yards/fences/lamps
    createFenceLine(-36,26,-14,26,9);createFenceLine(14,26,36,26,9);createFenceLine(-10,29,10,29,8);for(const p of [[-9,9],[9,9],[-33,8],[33,8],[-10,-7],[10,-7]])createLamp(p[0],p[1]);
    // NPCs
    createNPC('otto','Otto',4,3,0xffd84d,4);createNPC('luna','Luna',-22,8,0xff72b6,4);createNPC('teo','Teo',22,7,0x54c7ff,4);createNPC('bia','Bia',-10,-10,0x8ee15c,3);createNPC('maya','Maya',65,54,0xa66bff,3);
    // farm and garage
    createFenceLine(38,22,65,22,10);createFenceLine(65,22,65,43,8);for(let x=42;x<62;x+=4)for(let z=27;z<40;z+=4){box(2.8,.12,2.8,0x75451f,x,.06,z);box(.18,.55,.18,0x54c93e,x,.33,z);}
    createToyCar(52,48);registerInteractable({id:'job-board',type:'job',icon:'📦',label:'Pegar trabalho de entrega',x:49,z:45,radius:2.3,action:startDeliveryJob});world.deliveryPoint={x:65,z:54};
    // platform challenge
    const coords=[[48,0,-48],[53,1.2,-55],[59,2.3,-61],[66,3.5,-67],[74,4.6,-72],[82,5.8,-76]];coords.forEach(([x,y,z],i)=>{createPlatform(x,y+.5,z,3.2,3.2,i%2?0x7a4ed0:0x3e9fd8);createCrystal(x,y+1.7,z,i===coords.length-1);});world.secretChest=createChest('secret',86,-78,true);
    // castle and enemies
    box(32,4,26,0x737f8c,88,2,62);box(36,1.2,3,0x9aa5b1,88,4.8,49);for(const x of [73,103])box(5,8,5,0x647180,x,4,62);
    createEnemy('slime',48,-25);createEnemy('slime',58,-32);createEnemy('bat',72,-43);createEnemy('golem',82,48);createEnemy('slime',96,56);
    // crystals spread
    for(const p of [[12,1,-2],[-14,1,-8],[36,1,-15],[-45,1,18],[-63,1,-35],[78,1,15],[95,1,-20]])createCrystal(...p);
    // public interactables
    registerInteractable({id:'bridge-repair',type:'repair',icon:'🛠',label:'Consertar/inspecionar ponte',x:-12,z:47,radius:3.2,action:repairBridge});
    createChest('village',8,-5,false);createChest('forest',-82,-50,false);
    // restored builds
    state.builds.forEach(data=>spawnBuild(data,false));
    updateBridgeVisual();
    // boundaries mountains
    for(let i=0;i<34;i++){const a=i/34*Math.PI*2,r=118+Math.random()*10,x=Math.cos(a)*r,z=Math.sin(a)*r;box(12,12+Math.random()*16,12,0x6d7d8a,x,6,z);}
  }

  function collectResource(id){
    const resource=world.resources.find(r=>r.id===id);if(!resource||resource.collected)return;
    resource.collected=true;resource.mesh.visible=false;state.inventory[resource.type]=(state.inventory[resource.type]||0)+1;
    addXP(8);toast(resource.type==='wood'?'Madeira coletada!':'Pedra coletada!','good');beep(620);vibrate(25);evaluateMissions();saveState();
  }
  function openChest(chest){
    if(chest.opened){toast('Este baú já foi aberto.','warn');return;}
    chest.opened=true;chest.lid.rotation.x=-.65;state.flags[`chest_${chest.id}`]=true;
    state.inventory.crystals+=chest.secret?3:1;addCoins(chest.secret?100:25);addXP(chest.secret?80:25);
    if(chest.secret)setFlag('secretChest');toast(chest.secret?'Baú secreto! +3 cristais e 100 moedas':'Baú aberto!','good',2200);evaluateMissions();saveState();
  }

  async function handleHouseDoor(house){
    const record=state.houses[house.id]||{};
    if(!record.owned&&!house.publicBuilding){
      const buy=await confirmModal(house.name,`Esta casa custa <b>${house.price} moedas</b>. Deseja comprar?`,'Comprar','Agora não');
      if(!buy)return;
      if(state.profile.coins<house.price){toast('Moedas insuficientes.','warn');return;}
      addCoins(-house.price);state.houses[house.id]={...(record||{}),owned:true,locked:false,price:house.price};setFlag('boughtHouse');awardMedal('Nova Propriedade');saveState();
    }
    const refreshed=state.houses[house.id]||{};
    if(refreshed.locked&&!refreshed.owned&&!house.publicBuilding){toast('A casa está trancada.','warn');return;}
    if(refreshed.owned){
      openModal(house.name,`<p>Esta casa pertence a você.</p><div class="modal-actions"><button class="btn primary" data-enter>Entrar</button><button class="btn" data-lock>${refreshed.locked?'Destrancar':'Trancar'}</button><button class="btn" data-cancel>Cancelar</button></div>`,root=>{
        $('[data-enter]',root).onclick=()=>{closeModal();enterHouse(house);};
        $('[data-lock]',root).onclick=()=>{refreshed.locked=!refreshed.locked;state.houses[house.id]=refreshed;if(refreshed.locked)setFlag('lockedHouse');saveState(true);closeModal();toast(refreshed.locked?'Casa trancada.':'Casa destrancada.','good');};
        $('[data-cancel]',root).onclick=closeModal;
      });
      return;
    }
    if(await confirmModal(house.name,'Deseja entrar nesta casa?','Entrar','Cancelar'))enterHouse(house);
  }
  function enterHouse(house){
    currentHouse=house;cameraMode='interior';house.roof.visible=false;house.front.visible=false;house.door.visible=false;
    player.x=house.x;player.z=house.z+1.0;player.y=0;player.vx=player.vz=player.vy=0;player.grounded=true;
    state.position={x:player.x,y:0,z:player.z,yaw:cameraYaw};
    if(house.id==='home')setFlag('enteredHome');
    toast(`Entrou: ${house.name}`,'good');updateContext(true);saveState();
  }
  function exitHouse(){
    if(!currentHouse)return;const h=currentHouse;h.roof.visible=true;h.front.visible=true;h.door.visible=true;currentHouse=null;cameraMode='openworld';player.x=h.x;player.z=h.z+5.3;player.y=0;player.vx=player.vz=player.vy=0;toast('Saiu da casa.','good');saveState();
  }

  function useActivity(type,house){
    if(type==='bed'){
      player.sitUntil=performance.now()+1400;state.needs.energy=100;state.needs.hunger=Math.max(0,state.needs.hunger-4);setFlag('slept');addXP(20);toast('Você dormiu e salvou o jogo.','good');saveState(true);
    }else if(type==='sofa'){
      player.sitUntil=performance.now()+2400;state.needs.fun=clamp(state.needs.fun+20,0,100);toast('Sentou no sofá.','good');addXP(5);
    }else if(type==='tv'){
      player.sitUntil=performance.now()+3000;state.needs.fun=clamp(state.needs.fun+34,0,100);state.needs.energy=clamp(state.needs.energy-3,0,100);toast('Assistindo ao desenho do Otthos!','good');addXP(8);
    }else if(type==='fridge'){
      openModal('Geladeira',`<p>Comida disponível: <b>${state.inventory.food}</b></p><div class="modal-actions"><button class="btn primary" data-eat>Comer lanche</button><button class="btn" data-close>Fechar</button></div>`,root=>{
        $('[data-eat]',root).onclick=()=>{if(state.inventory.food<=0){toast('A geladeira está vazia.','warn');return;}state.inventory.food--;state.needs.hunger=clamp(state.needs.hunger+32,0,100);setFlag('ateMeal');addXP(12);saveState();closeModal();toast('Lanche delicioso!','good');};$('[data-close]',root).onclick=closeModal;
      });
    }else if(type==='stove'){
      openModal('Cozinha',`<p>Cozinhar custa 1 comida e recupera muita fome.</p><div class="modal-actions"><button class="btn primary" data-cook>Cozinhar refeição</button><button class="btn" data-close>Cancelar</button></div>`,root=>{
        $('[data-cook]',root).onclick=()=>{if(state.inventory.food<=0){toast('Você precisa comprar ou colher comida.','warn');return;}state.inventory.food--;state.needs.hunger=100;state.needs.fun=clamp(state.needs.fun+8,0,100);setFlag('ateMeal');addXP(20);saveState();closeModal();toast('Refeição pronta!','good');};$('[data-close]',root).onclick=closeModal;
      });
    }else if(type==='sink'){
      if(state.inventory.water>0)state.inventory.water--;state.needs.hunger=clamp(state.needs.hunger+5,0,100);state.needs.hygiene=clamp(state.needs.hygiene+8,0,100);toast('Bebeu água.','good');saveState();
    }else if(type==='shower'){
      state.needs.hygiene=100;state.needs.energy=clamp(state.needs.energy-2,0,100);player.sitUntil=performance.now()+1800;toast('Banho tomado!','good');addXP(8);saveState();
    }else if(type==='chest')openInventory();
    else if(type==='shop')openShop();
    else if(type==='workshop')openWorkshop();
    updateHUD();
  }
  function openShop(){
    const items=[['Comida',15,'food',2,'🍎'],['Água',8,'water',2,'💧'],['Blocos',25,'blocks',4,'🧱'],['Cercas',20,'fences',3,'🪵']];
    openModal('Mercadinho da Vila',`<p>Moedas: <b>${state.profile.coins}</b></p><div class="choice-grid">${items.map(([name,price,key,amount,icon],i)=>`<button class="choice" data-buy="${i}"><b>${icon} ${name}</b><span>${price} moedas — +${amount}</span></button>`).join('')}</div>`,root=>{
      $$('[data-buy]',root).forEach(btn=>btn.onclick=()=>{const [name,price,key,amount]=items[Number(btn.dataset.buy)];if(state.profile.coins<price){toast('Moedas insuficientes.','warn');return;}addCoins(-price);state.inventory[key]+=amount;addXP(5);saveState();closeModal();toast(`${name} comprado!`,'good');});
    });
  }
  function openWorkshop(){
    openModal('Oficina do Teo',`<p>Melhore seus equipamentos.</p><div class="choice-grid"><button class="choice" data-sword><b>⚔ Espada</b><span>2 madeiras + 2 pedras</span></button><button class="choice" data-blocks><b>🧱 Kit construção</b><span>1 madeira + 1 pedra</span></button></div>`,root=>{
      $('[data-sword]',root).onclick=()=>{if(state.inventory.wood<2||state.inventory.stone<2){toast('Faltam materiais.','warn');return;}state.inventory.wood-=2;state.inventory.stone-=2;state.flags.swordUpgrade=(state.flags.swordUpgrade||0)+1;addXP(35);saveState();closeModal();toast('Espada melhorada!','good');};
      $('[data-blocks]',root).onclick=()=>{if(state.inventory.wood<1||state.inventory.stone<1){toast('Faltam materiais.','warn');return;}state.inventory.wood--;state.inventory.stone--;state.inventory.blocks+=3;state.inventory.fences+=2;saveState();closeModal();toast('Kit de construção pronto!','good');};
    });
  }

  function talkToNPC(npc){
    state.friendship[npc.id]=(state.friendship[npc.id]||0)+1;npc.friendship=state.friendship[npc.id];if(npc.id==='otto')setFlag('talkedOtto');
    const messages={
      otto:'Bem-vindo! Sua casa fica logo ali. Cuide dela e conheça a vizinhança.',
      luna:'Adoro decoração! Quando comprar outra casa, experimente construir um jardim.',
      teo:'Na oficina eu transformo madeira e pedra em itens melhores.',
      bia:'O Vale dos Cristais tem plataformas e um baú secreto.',
      maya:state.flags.deliveryActive?'Você trouxe meu pacote? Estacione o carrinho aqui!':'Quando tiver um carrinho, pode trabalhar com entregas.'
    };
    let extra='';
    if(npc.id==='maya'&&state.flags.deliveryActive&&player.vehicle&&distance2D(player,npc)<3){state.flags.deliveryActive=false;setFlag('deliveryDone');addCoins(120);addReputation(30);extra=' Entrega concluída!';}
    openModal(npc.name,`<div class="dialogue-box">${messages[npc.id]||'Olá, vizinho!'}${extra}</div><p>Amizade: <b>${state.friendship[npc.id]}</b></p><div class="modal-actions"><button class="btn primary" data-ok>Continuar</button></div>`,root=>$('[data-ok]',root).onclick=closeModal);
    addXP(6);addReputation(2);evaluateMissions();saveState();
  }
  function startDeliveryJob(){
    if(state.flags.deliveryActive){toast('Você já está fazendo uma entrega.','warn');return;}state.flags.deliveryActive=true;state.inventory.package=1;toast('Pacote recebido. Leve até Maya!','good',2200);saveState();
  }
  function enterVehicle(){
    player.vehicle=true;vehicleVisual.visible=true;if(world.vehicle)world.vehicle.group.visible=false;els.vehicleBadge.hidden=false;setFlag('gotVehicle');toast('Carrinho ativado!','good');saveState();
  }
  function exitVehicle(){player.vehicle=false;vehicleVisual.visible=false;els.vehicleBadge.hidden=true;if(world.vehicle){world.vehicle.group.visible=true;world.vehicle.group.position.set(player.x,0,player.z);}toast('Saiu do carrinho.','good');}

  function repairBridge(){
    if(state.flags.bridgeFixed){toast('A ponte já está consertada.','good');return;}
    if(state.inventory.wood<3||state.inventory.stone<2){toast('Precisa de 3 madeiras e 2 pedras.','warn');return;}
    state.inventory.wood-=3;state.inventory.stone-=2;setFlag('bridgeFixed');addXP(70);addReputation(20);toast('Ponte consertada!','good',2200);saveState();
  }

  function openBuildMenu(){
    openModal('Construção Minecraft Kids',`<p>Você só pode construir perto das casas que possui e na praça de construção.</p><div class="choice-grid"><button class="choice" data-type="block"><b>🧱 Bloco</b><span>Custa 1 bloco</span></button><button class="choice" data-type="fence"><b>🪵 Cerca</b><span>Custa 1 cerca</span></button><button class="choice" data-type="lamp"><b>💡 Poste</b><span>1 madeira + 1 pedra</span></button><button class="choice" data-type="remove"><b>🧹 Remover</b><span>Remove sua construção mais próxima</span></button></div><div class="modal-actions"><button class="btn" data-cancel>Cancelar construção</button></div>`,root=>{
      $$('[data-type]',root).forEach(btn=>btn.onclick=()=>{const type=btn.dataset.type;if(type==='remove'){removeNearestBuild();closeModal();return;}buildMode=type;els.buildTypeLabel.textContent=({block:'Bloco',fence:'Cerca',lamp:'Poste'})[type];els.buildBadge.hidden=false;closeModal();toast('Modo construção ativo. Use AÇÃO.','good');updateContext(true);});
      $('[data-cancel]',root).onclick=()=>{buildMode=null;els.buildBadge.hidden=true;closeModal();};
    });
  }
  function canBuildAt(x,z){
    if(Math.abs(x)<18&&z>27&&z<48)return true;
    return world.houses.some(h=>state.houses[h.id]?.owned&&Math.abs(x-h.x)<10&&Math.abs(z-h.z)<10);
  }
  function placeBuild(){
    const x=Math.round((player.x+Math.sin(player.facing)*2.2)*2)/2,z=Math.round((player.z+Math.cos(player.facing)*2.2)*2)/2;
    if(!canBuildAt(x,z)){toast('Construa no seu quintal ou na praça de construção.','warn');return;}
    const cost=buildMode==='block'?['blocks',1]:buildMode==='fence'?['fences',1]:['wood',1];
    if((state.inventory[cost[0]]||0)<cost[1]||(buildMode==='lamp'&&state.inventory.stone<1)){toast('Faltam materiais.','warn');return;}
    state.inventory[cost[0]]-=cost[1];if(buildMode==='lamp')state.inventory.stone--;
    const data={id:uid(),type:buildMode,x,z};state.builds.push(data);spawnBuild(data,true);addXP(12);evaluateMissions();saveState();toast('Construção colocada!','good');
  }
  function spawnBuild(data,persist){
    let mesh;if(data.type==='block'){mesh=box(1.5,1.5,1.5,0xc07d3e,data.x,.75,data.z);registerPlatform(data.x,data.z,1.5,1.5,1.5,{buildId:data.id});registerCollider(data.x,data.z,1.5,1.5,{buildId:data.id});}
    else if(data.type==='fence'){mesh=box(2.0,1.05,.22,materials.wood,data.x,.52,data.z);registerCollider(data.x,data.z,2,.22,{buildId:data.id});}
    else{mesh=new THREE.Group();mesh.position.set(data.x,0,data.z);worldGroup.add(mesh);box(.22,2.4,.22,materials.wood,0,1.2,0,mesh);box(.65,.65,.65,0xffdc6a,0,2.65,0,mesh);addGlow(data.x,2.65,data.z,0xffd56a,4);}
    world.builds.push({data,mesh});
  }
  function removeNearestBuild(){
    const nearest=world.builds.filter(b=>distance2D(player,b.data)<3).sort((a,b)=>distance2D(player,a.data)-distance2D(player,b.data))[0];if(!nearest){toast('Nenhuma construção sua por perto.','warn');return;}
    worldGroup.remove(nearest.mesh);world.builds=world.builds.filter(b=>b!==nearest);state.builds=state.builds.filter(b=>b.id!==nearest.data.id);saveState();toast('Construção removida.','good');
  }
  els.buildBtn.onclick=openBuildMenu;

  function initThree(){
    if(!window.THREE){openModal('Erro ao carregar 3D','<p>A biblioteca Three.js não carregou. Verifique a internet e recarregue a página.</p>');return false;}
    scene=new THREE.Scene();clock=new THREE.Clock();camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,700);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,state.settings.quality==='high'?1.6:1));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;els.stage.innerHTML='';els.stage.appendChild(renderer.domElement);
    initMaterials();
    scene.add(new THREE.HemisphereLight(0xe8f8ff,0x385022,.95));const sun=new THREE.DirectionalLight(0xfff4d1,1.35);sun.position.set(32,46,24);sun.castShadow=true;sun.shadow.mapSize.set(state.settings.quality==='high'?2048:1024,state.settings.quality==='high'?2048:1024);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;sun.shadow.camera.far=160;scene.add(sun);
    createPlayerModel();playerModel.position.y=.24;buildWorld();restorePosition();initLocalMultiplayer();applyQuality();resize();return true;
  }
  function applyQuality(){
    if(!renderer)return;const high=state.settings.quality==='high';renderer.setPixelRatio(Math.min(devicePixelRatio||1,high?1.6:1));renderer.shadowMap.enabled=high;renderer.toneMappingExposure=high?1.12:1.0;
  }
  function resize(){
    if(!renderer||!camera)return;const rect=els.stage.getBoundingClientRect();const w=Math.max(320,rect.width||innerWidth),h=Math.max(260,rect.height||innerHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
    const landscape=w>h;const action=landscape?clamp(h*.13,48,64):clamp(w*.18,60,78);const joy=landscape?clamp(h*.25,98,126):clamp(w*.31,112,145);document.documentElement.style.setProperty('--action',`${Math.round(action)}px`);document.documentElement.style.setProperty('--joy',`${Math.round(joy)}px`);document.documentElement.style.setProperty('--gap',`${landscape?7:9}px`);
  }
  window.addEventListener('resize',()=>requestAnimationFrame(resize),{passive:true});window.addEventListener('orientationchange',()=>setTimeout(resize,120),{passive:true});if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>requestAnimationFrame(resize),{passive:true});

  function restorePosition(){
    const pos=state.position||{x:0,y:0,z:8,yaw:0};player.x=Number.isFinite(pos.x)?pos.x:0;player.z=Number.isFinite(pos.z)?pos.z:8;player.y=0;cameraYaw=Number.isFinite(pos.yaw)?pos.yaw:0;
    if(Math.abs(player.x)>110||Math.abs(player.z)>110){player.x=0;player.z=8;}
  }
  function returnHome(){
    if(currentHouse)exitHouse();player.x=0;player.z=23;player.y=0;player.vx=player.vz=player.vy=0;cameraYaw=Math.PI;toast('Você voltou para casa.','good');savePlayerPosition(true);
  }
  function savePlayerPosition(immediate=false){state.position={x:+player.x.toFixed(2),y:+player.y.toFixed(2),z:+player.z.toFixed(2),yaw:+cameraYaw.toFixed(3)};saveState(immediate);}

  function groundHeightAt(x,z){
    let top=0;for(const p of world.platforms){if(p.bridgePart!==undefined&&!state.flags.bridgeFixed&&p.bridgePart%2===1)continue;if(Math.abs(x-p.x)<=p.w/2+.35&&Math.abs(z-p.z)<=p.d/2+.35&&p.top>top&&player.y>=p.top-.75)top=p.top;}return top;
  }
  function resolveCollisions(prevX,prevZ){
    const radius=player.vehicle?.65:.43;
    for(const c of world.colliders){
      if(c.houseId&&currentHouse&&c.houseId===currentHouse.id)continue;
      if(Math.abs(player.x-c.x)>c.w/2+radius||Math.abs(player.z-c.z)>c.d/2+radius)continue;
      const fromLeft=prevX<=c.x-c.w/2-radius,fromRight=prevX>=c.x+c.w/2+radius,fromTop=prevZ<=c.z-c.d/2-radius,fromBottom=prevZ>=c.z+c.d/2+radius;
      if(fromLeft)player.x=c.x-c.w/2-radius;else if(fromRight)player.x=c.x+c.w/2+radius;else if(fromTop)player.z=c.z-c.d/2-radius;else if(fromBottom)player.z=c.z+c.d/2+radius;else{player.x=prevX;player.z=prevZ;}
    }
    if(currentHouse){player.x=clamp(player.x,currentHouse.x-3.75,currentHouse.x+3.75);player.z=clamp(player.z,currentHouse.z-2.75,currentHouse.z+2.75);}
  }
  function updateInputFromKeys(){
    const left=input.keys.has('ArrowLeft')||input.keys.has('KeyA'),right=input.keys.has('ArrowRight')||input.keys.has('KeyD'),up=input.keys.has('ArrowUp')||input.keys.has('KeyW'),down=input.keys.has('ArrowDown')||input.keys.has('KeyS');
    const kx=(right?1:0)-(left?1:0),kz=(up?1:0)-(down?1:0);if(Math.abs(kx)+Math.abs(kz)>0){input.targetX=clamp(kx,-1,1);input.targetZ=clamp(kz,-1,1);}
    else if(input.joyId===null){input.targetX=0;input.targetZ=0;}
  }
  function canJump(){return player.grounded||performance.now()-player.lastGrounded<125;}
  function requestJump(){player.jumpBuffer=performance.now()+150;if(canJump())doJump();}
  function doJump(){if(!canJump())return;player.vy=10.2;player.grounded=false;player.jumpBuffer=0;beep(540);vibrate(18);}
  function updatePlayer(dt){
    if(performance.now()<player.sitUntil){player.vx*=.82;player.vz*=.82;}else{
      updateInputFromKeys();input.x=lerp(input.x,input.targetX,Math.min(1,dt*18));input.z=lerp(input.z,input.targetZ,Math.min(1,dt*18));
      const mag=Math.hypot(input.x,input.z);let ix=input.x,iz=input.z;if(mag>1){ix/=mag;iz/=mag;}
      const forwardX=Math.sin(cameraYaw),forwardZ=-Math.cos(cameraYaw),rightX=Math.cos(cameraYaw),rightZ=Math.sin(cameraYaw);
      const needsPenalty=state.needs.energy<15?.72:state.needs.hunger<15?.82:1;const speed=(player.vehicle?13.5:6.7)*needsPenalty;
      const targetVx=(rightX*ix+forwardX*iz)*speed,targetVz=(rightZ*ix+forwardZ*iz)*speed;const accel=player.grounded?18:7;
      player.vx=lerp(player.vx,targetVx,Math.min(1,dt*accel));player.vz=lerp(player.vz,targetVz,Math.min(1,dt*accel));if(mag<.03){player.vx*=Math.pow(.0008,dt);player.vz*=Math.pow(.0008,dt);}
    }
    const prevX=player.x,prevZ=player.z;player.x+=player.vx*dt;player.z+=player.vz*dt;player.x=clamp(player.x,-116,116);player.z=clamp(player.z,-116,116);resolveCollisions(prevX,prevZ);
    const ground=groundHeightAt(player.x,player.z);if(!player.grounded)player.vy-=31*dt;player.y+=player.vy*dt;
    if(player.y<=ground&&player.vy<=0){const landed=!player.grounded&&player.vy<-4;player.y=ground;player.vy=0;player.grounded=true;player.lastGrounded=performance.now();if(landed){vibrate(20);beep(180,35,'sine');}}
    else if(player.y>ground+.03)player.grounded=false;
    if(player.jumpBuffer&&player.jumpBuffer>performance.now()&&canJump())doJump();
    if(Math.hypot(player.vx,player.vz)>.15)player.facing=Math.atan2(player.vx,player.vz);
    playerGroup.position.set(player.x,player.y,player.z);playerGroup.rotation.y=player.facing;contactShadow.position.set(player.x,ground+.025,player.z);const air=Math.max(0,player.y-ground);const ss=clamp(1-air*.08,.48,1);contactShadow.scale.setScalar(ss);contactShadow.material.opacity=clamp(.27-air*.035,.06,.27);vehicleVisual.visible=player.vehicle;
    animatePlayer(dt);checkHazards();collectNearbyCrystals();updateContext();
  }
  let animTime=0;
  function animatePlayer(dt){
    animTime+=dt;const parts=playerModel.userData.parts;if(!parts)return;const speed=Math.hypot(player.vx,player.vz);const walking=speed>.25&&player.grounded&&!player.vehicle;const swing=walking?Math.sin(animTime*(8+speed*.45))*.62:0;
    parts.leftArm.rotation.x=lerp(parts.leftArm.rotation.x,player.grounded?swing:-.65,.22);parts.rightArm.rotation.x=lerp(parts.rightArm.rotation.x,player.grounded?-swing:-.65,.22);parts.leftLeg.rotation.x=lerp(parts.leftLeg.rotation.x,player.grounded?-swing*.8:.38,.22);parts.rightLeg.rotation.x=lerp(parts.rightLeg.rotation.x,player.grounded?swing*.8:.38,.22);
    const breathe=Math.sin(animTime*2.2)*.02;parts.body.scale.y=1+breathe;playerModel.position.y=.24+(walking?Math.abs(Math.sin(animTime*10))*.035:0);
    if(performance.now()<player.sitUntil){parts.leftLeg.rotation.x=1.25;parts.rightLeg.rotation.x=1.25;playerModel.position.y=-.18;}
  }
  function checkHazards(){
    for(const h of world.hazards){if(Math.abs(player.x-h.x)<=h.w/2&&Math.abs(player.z-h.z)<=h.d/2&&player.y<.6){if(h.type==='water'){player.vx*=.9;player.vz*=.9;}else if(performance.now()>player.damageUntil){player.damageUntil=performance.now()+1200;state.needs.energy=clamp(state.needs.energy-18,0,100);toast('Cuidado com a lava!','bad');returnHome();}}}
  }
  function collectNearbyCrystals(){
    for(const c of world.crystals){if(c.got)continue;c.mesh.rotation.y+=.035;c.mesh.position.y=c.y+Math.sin(animTime*2+c.x)*.12;if(Math.hypot(player.x-c.x,player.z-c.z)<1.25&&Math.abs(player.y-c.mesh.position.y)<2){c.got=true;c.mesh.visible=false;state.inventory.crystals++;addXP(15);addCoins(5);toast('Cristal coletado!','good');beep(880);vibrate(20);evaluateMissions();saveState();}}
  }

  function updateNPCs(dt){
    for(const npc of world.npcs){
      const near=distance2D(player,npc)<3.2;if(near)continue;
      npc.phase+=dt*.45;const tx=npc.baseX+Math.sin(npc.phase)*npc.pathRadius,tz=npc.baseZ+Math.cos(npc.phase*.83)*npc.pathRadius;npc.group.position.x=lerp(npc.group.position.x,tx,dt*.45);npc.group.position.z=lerp(npc.group.position.z,tz,dt*.45);npc.group.rotation.y=Math.atan2(tx-npc.group.position.x,tz-npc.group.position.z);
      npc.body.position.y=1.1+Math.abs(Math.sin(animTime*5+npc.phase))*.03;
    }
  }
  function updateEnemies(dt){
    for(const e of world.enemies){
      if(e.dead){if(performance.now()-e.lastHit>18000){e.dead=false;e.hp=e.type==='golem'?3:1;e.group.visible=true;e.group.position.set(e.baseX,0,e.baseZ);}continue;}
      const d=distance2D(player,e);let tx=e.baseX+Math.sin(animTime*.55+e.phase)*4,tz=e.baseZ+Math.cos(animTime*.48+e.phase)*4;
      if(d<9&&!currentHouse){tx=player.x;tz=player.z;}
      const speed=e.type==='bat'?2.1:e.type==='golem'?1.0:1.45;e.group.position.x=lerp(e.group.position.x,tx,dt*speed);e.group.position.z=lerp(e.group.position.z,tz,dt*speed);e.group.position.y=e.type==='bat'?1.2+Math.sin(animTime*3+e.phase)*.35:0;e.group.rotation.y=Math.atan2(tx-e.group.position.x,tz-e.group.position.z);
      if(d<1.45&&performance.now()>player.damageUntil){player.damageUntil=performance.now()+1100;state.needs.energy=clamp(state.needs.energy-12,0,100);state.needs.fun=clamp(state.needs.fun-4,0,100);toast('Monstro acertou!','bad');vibrate([35,40,35]);saveState();}
    }
  }
  function meleeAttack(){
    const target=world.enemies.filter(e=>!e.dead).sort((a,b)=>distance2D(player,a.group.position)-distance2D(player,b.group.position))[0];
    if(!target||distance2D(player,target.group.position)>2.35){toast('Nada para atacar por perto.','warn');return;}
    damageEnemy(target,1);player.attackUntil=performance.now()+280;beep(360,60,'sawtooth');
  }
  function damageEnemy(enemy,amount){
    if(enemy.dead)return;enemy.hp-=amount;enemy.lastHit=performance.now();enemy.group.scale.set(1.18,.82,1.18);setTimeout(()=>enemy.group&&enemy.group.scale.set(1,1,1),130);
    if(enemy.hp<=0){enemy.dead=true;enemy.group.visible=false;state.defeated++;addXP(enemy.type==='golem'?45:20);addCoins(enemy.type==='golem'?35:12);toast('Monstro derrotado!','good');evaluateMissions();saveState();}
  }
  function firePower(){
    if(currentHouse){toast('Use o poder do lado de fora.','warn');return;}
    const dir={x:Math.sin(player.facing),z:Math.cos(player.facing)};const mesh=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.42),mat(0xff5a12,{emissive:0xff2a00,emissiveIntensity:.9}));mesh.position.set(player.x,player.y+1.35,player.z);worldGroup.add(mesh);world.fireballs.push({mesh,x:player.x,y:player.y+1.35,z:player.z,vx:dir.x*12,vz:dir.z*12,life:1.4});beep(220,90,'sawtooth');vibrate(18);
  }
  function updateFireballs(dt){
    for(let i=world.fireballs.length-1;i>=0;i--){const f=world.fireballs[i];f.life-=dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.mesh.position.set(f.x,f.y,f.z);f.mesh.rotation.x+=dt*7;f.mesh.rotation.y+=dt*9;let hit=false;for(const e of world.enemies){if(!e.dead&&Math.hypot(f.x-e.group.position.x,f.z-e.group.position.z)<1.1){damageEnemy(e,1);hit=true;break;}}if(hit||f.life<=0){worldGroup.remove(f.mesh);world.fireballs.splice(i,1);}}
  }

  function updateCamera(dt){
    let desiredPos,look;
    if(currentHouse&&cameraMode==='interior'){
      const h=currentHouse;const portrait=innerHeight>innerWidth;desiredPos=new THREE.Vector3(h.x+(portrait?8.4:10.8),portrait?9.5:7.4,h.z+10.5);look=new THREE.Vector3(h.x,1.0,h.z-.2);camera.fov=portrait?51:48;
    }else{
      const portrait=innerHeight>innerWidth;const speed=Math.hypot(player.vx,player.vz);const dist=(portrait?12.5:10.2)+(player.vehicle?2.5:0)+clamp(speed/10,0,1);const height=portrait?6.6:5.4;desiredPos=new THREE.Vector3(player.x-Math.sin(cameraYaw)*dist,player.y+height,player.z+Math.cos(cameraYaw)*dist);look=new THREE.Vector3(player.x+Math.sin(cameraYaw)*3.5,player.y+1.4,player.z-Math.cos(cameraYaw)*3.5);camera.fov=portrait?57:60;
    }
    const t=1-Math.exp(-dt*7.5);camera.position.lerp(desiredPos,t);camera.lookAt(look);camera.updateProjectionMatrix();
  }

  function nearestInteractable(){
    if(player.vehicle)return{id:'exit-vehicle',icon:'🚗',label:'Sair do carrinho',radius:999,action:exitVehicle};
    if(buildMode)return{id:'place-build',icon:'🧱',label:'Colocar construção',radius:999,action:placeBuild};
    let nearest=null,best=Infinity;for(const it of world.interactables){if(!isInteractionAvailable(it))continue;const pos=worldPos(it),d=Math.hypot(player.x-pos.x,player.z-pos.z);if(d<=(it.radius||2)&&d<best){best=d;nearest=it;}}
    return nearest;
  }
  function updateContext(force=false){
    const next=nearestInteractable();const id=next?.id||'';if(!force&&id===lastContextId)return;lastContextId=id;currentContext=next;els.contextPrompt.hidden=!next;els.actionBtn.classList.toggle('pulse',!!next);els.contextIcon.textContent=next?.icon||'⚔';els.contextLabel.textContent=next?.label||'Atacar';els.contextHint.textContent=next?'Toque em AÇÃO':'Ataque próximo';const span=$('span',els.actionBtn);const icon=$('b',els.actionBtn);if(span)span.textContent=next?'Ação':'Espada';if(icon)icon.textContent=next?.icon||'⚔';
  }
  function doAction(){if(paused)return;if(currentContext){currentContext.action();return;}meleeAttack();}

  function updateNeeds(dt){
    updateNeeds.acc=(updateNeeds.acc||0)+dt;if(updateNeeds.acc<1)return;const sec=updateNeeds.acc;updateNeeds.acc=0;state.needs.hunger=clamp(state.needs.hunger-sec*.065,0,100);state.needs.energy=clamp(state.needs.energy-sec*(player.vehicle?.035:.045),0,100);state.needs.fun=clamp(state.needs.fun-sec*.025,0,100);state.needs.hygiene=clamp(state.needs.hygiene-sec*.028,0,100);if(state.needs.hunger<8&&Math.random()<.08)toast('Otthos está com fome.','warn');updateHUD();saveState();
  }

  let localChannel=null,lastPublish=0;
  function initLocalMultiplayer(){
    if(typeof BroadcastChannel!=='function')return;localChannel=new BroadcastChannel('otthos-life-world-v600');localChannel.onmessage=e=>{const data=e.data;if(!data||data.id===state.profile.playerId)return;if(data.type==='leave'){const ghost=world.ghosts.get(data.id);if(ghost){scene.remove(ghost);world.ghosts.delete(data.id);}return;}let ghost=world.ghosts.get(data.id);if(!ghost){ghost=createGhost(data.color||0x5ad8ff);world.ghosts.set(data.id,ghost);}ghost.userData.target=data;};window.addEventListener('beforeunload',()=>localChannel.postMessage({type:'leave',id:state.profile.playerId}));
    window.OTTHOS_MULTIPLAYER={version:1,playerId:state.profile.playerId,mode:'local-preview',connect:()=>true,publish:payload=>localChannel?.postMessage(payload),adapter:'BroadcastChannel',futureAdapters:['Firebase','WebSocket']};
  }
  function createGhost(color){const g=new THREE.Group();box(.82,1.2,.58,color,0,1.3,0,g);box(.72,.72,.72,0xffd2a0,0,2.25,0,g);scene.add(g);return g;}
  function updateMultiplayer(dt){
    if(localChannel&&performance.now()-lastPublish>120){lastPublish=performance.now();localChannel.postMessage({type:'position',id:state.profile.playerId,x:player.x,y:player.y,z:player.z,r:player.facing,color:0x5ad8ff});}
    for(const ghost of world.ghosts.values()){const t=ghost.userData.target;if(!t)continue;ghost.position.x=lerp(ghost.position.x,t.x,dt*8);ghost.position.y=lerp(ghost.position.y,t.y,dt*8);ghost.position.z=lerp(ghost.position.z,t.z,dt*8);ghost.rotation.y=lerp(ghost.rotation.y,t.r,dt*8);}
  }

  function gameLoop(){
    if(!running)return;raf=requestAnimationFrame(gameLoop);const dt=Math.min(.033,clock.getDelta());if(!paused){pollGamepad();updatePlayer(dt);updateNPCs(dt);updateEnemies(dt);updateFireballs(dt);updateNeeds(dt);updateMultiplayer(dt);updateCamera(dt);}
    renderer.render(scene,camera);
  }

  function setupControls(){
    const resetJoy=()=>{input.joyId=null;input.targetX=0;input.targetZ=0;els.joystickKnob.style.transform='translate(-50%,-50%)';};
    els.joystick.addEventListener('pointerdown',e=>{e.preventDefault();input.joyId=e.pointerId;els.joystick.setPointerCapture(e.pointerId);updateJoy(e);});
    els.joystick.addEventListener('pointermove',e=>{if(e.pointerId===input.joyId)updateJoy(e);});
    els.joystick.addEventListener('pointerup',resetJoy);els.joystick.addEventListener('pointercancel',resetJoy);
    function updateJoy(e){const r=els.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32;let dx=e.clientX-cx,dy=e.clientY-cy;const mag=Math.hypot(dx,dy);if(mag>max){dx=dx/mag*max;dy=dy/mag*max;}input.targetX=dx/max;input.targetZ=-dy/max;els.joystickKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
    els.jumpBtn.addEventListener('pointerdown',e=>{e.preventDefault();requestJump();});els.actionBtn.addEventListener('pointerdown',e=>{e.preventDefault();doAction();});els.specialBtn.addEventListener('pointerdown',e=>{e.preventDefault();firePower();});
    window.addEventListener('keydown',e=>{input.keys.add(e.code);if(['Space','KeyE','KeyF'].includes(e.code))e.preventDefault();if(e.code==='Space')requestJump();if(e.code==='KeyE')doAction();if(e.code==='KeyF')firePower();if(e.code==='Escape')paused=!paused;});window.addEventListener('keyup',e=>input.keys.delete(e.code));
    els.stage.addEventListener('pointerdown',e=>{if(e.target!==renderer?.domElement)return;input.cameraDrag={id:e.pointerId,x:e.clientX,y:e.clientY};els.stage.setPointerCapture?.(e.pointerId);});
    els.stage.addEventListener('pointermove',e=>{const d=input.cameraDrag;if(!d||d.id!==e.pointerId||currentHouse)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;cameraYaw-=dx*.006;cameraPitch=clamp(cameraPitch+dy*.003,.2,.75);d.x=e.clientX;d.y=e.clientY;});
    const endDrag=e=>{if(input.cameraDrag?.id===e.pointerId)input.cameraDrag=null;};els.stage.addEventListener('pointerup',endDrag);els.stage.addEventListener('pointercancel',endDrag);
  }
  let gamepadJump=false,gamepadAction=false,gamepadPower=false;
  function pollGamepad(){
    const gp=[...(navigator.getGamepads?.()||[])].find(Boolean);if(!gp)return;const ax=gp.axes[0]||0,az=-(gp.axes[1]||0);if(Math.hypot(ax,az)>.16&&input.joyId===null){input.targetX=ax;input.targetZ=az;}
    const jump=!!gp.buttons[0]?.pressed,action=!!gp.buttons[2]?.pressed,power=!!gp.buttons[1]?.pressed;if(jump&&!gamepadJump)requestJump();if(action&&!gamepadAction)doAction();if(power&&!gamepadPower)firePower();gamepadJump=jump;gamepadAction=action;gamepadPower=power;
    const camX=gp.axes[2]||0;if(Math.abs(camX)>.18&&!currentHouse)cameraYaw-=camX*.035;
  }

  async function startGame(resetPosition=false){
    closeModal();showScreen('game');if(!scene){if(!initThree()){showScreen('lobby');return;}setupControls();}
    if(resetPosition){player.x=0;player.z=8;player.y=0;}else restorePosition();running=true;paused=false;clock.start();evaluateMissions();updateHUD();updateContext(true);resize();cancelAnimationFrame(raf);gameLoop();toast('Bem-vindo à Vila do Sol!','good',2200);
  }
  function stopGame(){
    running=false;paused=false;cancelAnimationFrame(raf);savePlayerPosition(true);showScreen('lobby');updateLobbyStats();
  }
  els.playBtn.onclick=()=>startGame(true);els.continueBtn.onclick=()=>startGame(false);

  function openPauseMenu(){
    paused=true;openModal('Jogo pausado',`<div class="choice-grid"><button class="choice" data-resume><b>▶ Continuar</b><span>Voltar ao mundo</span></button><button class="choice" data-home><b>🏠 Casa</b><span>Voltar para a Casa do Otthos</span></button><button class="choice" data-install><b>⬇ Instalar</b><span>Adicionar como aplicativo</span></button><button class="choice" data-menu><b>↩ Menu inicial</b><span>Salvar e sair</span></button></div>`,root=>{
      $('[data-resume]',root).onclick=()=>{paused=false;closeModal();};$('[data-home]',root).onclick=()=>{paused=false;closeModal();returnHome();};$('[data-install]',root).onclick=installApp;$('[data-menu]',root).onclick=()=>{paused=false;closeModal();stopGame();};
    });
  }
  els.gameSettingsBtn.addEventListener('contextmenu',e=>e.preventDefault());

  function updateBridgeVisual(){world.bridgeParts.forEach((p,i)=>{p.visible=state.flags.bridgeFixed||i%2===0;});}

  // Public test/audit API
  window.OTTHOS_TEST_API={
    version:'V600_COMPLETE_LIFE_WORLD',
    getState:()=>JSON.parse(JSON.stringify(state)),
    getGame:()=>({running,paused,currentHouse:currentHouse?.id||null,cameraMode,player:{...player},objects:{houses:world.houses.length,npcs:world.npcs.length,enemies:world.enemies.length,interactables:world.interactables.length,builds:world.builds.length}}),
    teleport:(x,z)=>{player.x=x;player.z=z;player.y=0;updateContext(true);},
    getContext:()=>currentContext?{id:currentContext.id,label:currentContext.label,type:currentContext.type}:null,
    action:()=>doAction(),
    jump:()=>requestJump(),
    fire:()=>firePower(),
    enterHouseById:(id)=>{const h=world.houses.find(x=>x.id===id);if(!h)return false;enterHouse(h);return true;},
    exitHouse,
    returnHome,
    evaluateMissions,
    installReady:()=>!!deferredInstallPrompt,
    multiplayer:()=>window.OTTHOS_MULTIPLAYER||null
  };

  updateLobbyStats();evaluateMissions();
})();
