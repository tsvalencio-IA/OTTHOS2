(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpAngle = (a, b, t) => { let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI; if(d<-Math.PI)d+=Math.PI*2; return a+d*t; };
  const distance2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const STORAGE_KEY = 'otthos_life_world_roleplay_v613';
  const LEGACY_STORAGE_KEYS = ['otthos_life_world_roleplay_v612','otthos_life_world_roleplay_v611','otthos_life_world_roleplay_v610','otthos_life_world_roleplay_v609','otthos_life_world_roleplay_v608','otthos_life_world_roleplay_v607','otthos_life_world_roleplay_v606','otthos_life_world_roleplay_v605','otthos_life_world_roleplay_v604','otthos_life_world_roleplay_v603','otthos_life_world_roleplay_v602','otthos_life_world_roleplay_v601','otthos_life_world_complete_v600'];
  const safeLocalGet = key => { try { return window.localStorage?.getItem(key) ?? null; } catch { return null; } };
  const safeLocalSet = (key, value) => { try { window.localStorage?.setItem(key, value); return true; } catch { return false; } };
  const safeLocalRemove = key => { try { window.localStorage?.removeItem(key); return true; } catch { return false; } };

  const els = {
    lobby: $('#lobby'), game: $('#game'), stage: $('#stage'), screenTint: $('#screenTint'),
    playBtn: $('#playBtn'), continueBtn: $('#continueBtn'), installBtn: $('#installBtn'), installHint: $('#installHint'),
    arBtn: $('#arBtn'), quizBtn: $('#quizBtn'), talkBtn: $('#talkBtn'), collectionBtn: $('#collectionBtn'), avatarBtn: $('#avatarBtn'), moldsBtn: $('#moldsBtn'), howBtn: $('#howBtn'), settingsBtn: $('#settingsBtn'),
    lobbyLevel: $('#lobbyLevel'), lobbyCoins: $('#lobbyCoins'), lobbyRep: $('#lobbyRep'), lobbyMedals: $('#lobbyMedals'),
    hudLevel: $('#hudLevel'), xpFill: $('#xpFill'), xpText: $('#xpText'), hudCoins: $('#hudCoins'),
    needHunger: $('#needHunger'), needEnergy: $('#needEnergy'), needFun: $('#needFun'), needHygiene: $('#needHygiene'),
    missionChapter: $('#missionChapter'), missionTitle: $('#missionTitle'), missionStep: $('#missionStep'), missionFill: $('#missionFill'),
    quickToggleBtn: $('#quickToggleBtn'), quickBar: $('#quickBar'), needsToggleBtn: $('#needsToggleBtn'), missionCard: $('#missionCard'), avatarGameBtn: $('#avatarGameBtn'), inventoryBtn: $('#inventoryBtn'), buildBtn: $('#buildBtn'), mapBtn: $('#mapBtn'), gameSettingsBtn: $('#gameSettingsBtn'),
    contextPrompt: $('#contextPrompt'), contextIcon: $('#contextIcon'), contextLabel: $('#contextLabel'), contextHint: $('#contextHint'),
    joystick: $('#joystick'), joystickKnob: $('#joystickKnob'), runBtn: $('#runBtn'), specialBtn: $('#specialBtn'), actionBtn: $('#actionBtn'), jumpBtn: $('#jumpBtn'), crouchBtn: $('#crouchBtn'), miniBtn: $('#miniBtn'), normalBtn: $('#normalBtn'), giantBtn: $('#giantBtn'), spinBtn: $('#spinBtn'), secondaryActions: document.querySelector('.secondary-actions'),
    miniNav: $('#miniNav'), miniMapCanvas: $('#miniMapCanvas'), miniNavName: $('#miniNavName'), miniNavDistance: $('#miniNavDistance'), miniNavArrow: $('#miniNavArrow'),
    cameraControls: $('#cameraControls'), cameraNearBtn: $('#cameraNearBtn'), cameraResetBtn: $('#cameraResetBtn'), cameraFarBtn: $('#cameraFarBtn'),
    buildBadge: $('#buildBadge'), buildTypeLabel: $('#buildTypeLabel'), vehicleBadge: $('#vehicleBadge'), raceBadge: $('#raceBadge'), raceTitle: $('#raceTitle'), raceStatus: $('#raceStatus'), toast: $('#toast'),
    modal: $('#modal'), modalTitle: $('#modalTitle'), modalBody: $('#modalBody'), modalClose: $('#modalClose'),
    nativeViewer: $('#nativeViewer'), viewerShell: $('#viewerShell'), viewerPlaceholder: $('#viewerPlaceholder'), viewerLoadBtn: $('#viewerLoadBtn'), viewerStatus: $('#viewerStatus'), insideArBtn: $('#insideArBtn')
  };

  const defaultState = () => ({
    version: 613,
    profile: { playerId: uid(), name: 'Otthos', level: 1, xp: 0, coins: 500, reputation: 0 },
    needs: { hunger: 92, energy: 92, fun: 86, hygiene: 88 },
    inventory: { wood: 0, stone: 0, food: 2, water: 2, crystals: 0, blocks: 4, fences: 2, keys: 0 },
    homeStorage: { wood: 0, stone: 0, food: 0, water: 0, crystals: 0 },
    houses: {
      home: { owned: true, locked: false, home: true },
      blue: { owned: false, locked: true, price: 250 },
      pink: { owned: false, locked: true, price: 420 },
      cabin: { owned: false, locked: false, price: 180 }
    },
    friendship: { nino: 0, luna: 0, teo: 0, bia: 0, maya: 0 },
    avatar: { outfit: 'classic', hat: 'none', accessory: 'none' },
    career: { title: 'Morador da Vila', level: 1, xp: 0, completed: 0, activeJob: null },
    social: { invited: [], gifts: 0, jokes: 0, arguments: 0 },
    abilities: { scaleMode: 'normal', crouched: false },
    races: { wins: 0, losses: 0, coinWins: 0, houseWins: 0, bestTime: 0 },
    waypoint: null,
    ui: { quickOpen: false, needsOpen: false, missionOpen: false },
    flags: {},
    completedChapters: [],
    medals: [],
    builds: [],
    defeated: 0,
    position: { x: 0, y: 0, z: 8, yaw: 0 },
    settings: { sound: true, quality: 'high', vibration: true, cameraZoom: 0, joystickNatural: true },
    lastSaved: Date.now()
  });

  function normalizeState(saved = {}) {
    const fresh = defaultState();
    const oldFriendship = saved.friendship || {};
    const friendship = { ...fresh.friendship, ...oldFriendship };
    if (oldFriendship.otto !== undefined && oldFriendship.nino === undefined) friendship.nino = oldFriendship.otto;
    delete friendship.otto;
    const flags = { ...(saved.flags || {}) };
    if (flags.talkedOtto && !flags.talkedNeighbor) flags.talkedNeighbor = true;
    return {
      ...fresh,
      ...saved,
      version: 613,
      profile: { ...fresh.profile, ...(saved.profile || {}) },
      needs: { ...fresh.needs, ...(saved.needs || {}) },
      inventory: { ...fresh.inventory, ...(saved.inventory || {}) },
      homeStorage: { ...fresh.homeStorage, ...(saved.homeStorage || {}) },
      houses: { ...fresh.houses, ...(saved.houses || {}) },
      friendship,
      flags,
      settings: { ...fresh.settings, ...(saved.settings || {}) },
      avatar: { ...fresh.avatar, ...(saved.avatar || {}) },
      career: { ...fresh.career, ...(saved.career || {}) },
      social: { ...fresh.social, ...(saved.social || {}) },
      abilities: { ...fresh.abilities, ...(saved.abilities || {}) },
      races: { ...fresh.races, ...(saved.races || {}) },
      ui: { ...fresh.ui, ...(saved.ui || {}) },
      builds: Array.isArray(saved.builds) ? saved.builds : [],
      medals: Array.isArray(saved.medals) ? saved.medals : [],
      completedChapters: Array.isArray(saved.completedChapters) ? saved.completedChapters : []
    };
  }

  function loadState() {
    const fresh = defaultState();
    try {
      let raw = safeLocalGet(STORAGE_KEY);
      if (!raw) {
        for (const key of LEGACY_STORAGE_KEYS) {
          raw = safeLocalGet(key);
          if (raw) break;
        }
      }
      if (!raw) return fresh;
      const saved = JSON.parse(raw);
      return normalizeState(saved);
    } catch (error) {
      console.warn('Falha ao ler progresso; usando estado novo.', error);
      return fresh;
    }
  }

  let state = loadState();
  let dbReady = Promise.resolve();
  if (window.OTTHOS_DB) {
    dbReady = window.OTTHOS_DB.load().then(saved => {
      if (saved && saved.profile) {
        state = normalizeState(saved);
        safeLocalSet(STORAGE_KEY, JSON.stringify(state));
      } else {
        window.OTTHOS_DB.save(state).catch(console.warn);
      }
      updateLobbyStats();
      updateHUD();
      return state;
    }).catch(error => { console.warn('IndexedDB indisponível; usando armazenamento local.', error); return state; });
    window.OTTHOS_DB.requestPersistentStorage().catch(() => false);
  }
  let saveTimer = 0;
  let lastSavePromise = Promise.resolve(true);
  function commitState() {
    state.version = 612;
    state.lastSaved = Date.now();
    const snapshot = JSON.parse(JSON.stringify(state));
    safeLocalSet(STORAGE_KEY, JSON.stringify(snapshot));
    lastSavePromise = window.OTTHOS_DB
      ? lastSavePromise.catch(()=>true).then(()=>window.OTTHOS_DB.save(snapshot)).catch(error => {
          console.warn('Falha no IndexedDB; cópia local mantida.', error);
          return false;
        })
      : Promise.resolve(true);
    updateLobbyStats();
    return lastSavePromise;
  }
  function saveState(immediate = false) {
    state.lastSaved = Date.now();
    clearTimeout(saveTimer);
    if (immediate) return commitState();
    saveTimer = setTimeout(commitState, 140);
    return lastSavePromise;
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
    queueMicrotask(() => typeof updateInstallUI === 'function' && updateInstallUI());
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
    state.ui.quickOpen = false;
    if (els.quickBar) els.quickBar.hidden = true;
    els.quickToggleBtn?.classList.remove('active');
    input.keys?.clear?.();
    input.targetX = input.targetZ = input.x = input.z = 0;
    if (typeof player !== 'undefined' && player.vehicle) player.car.speed *= .7;
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = html;
    els.modal.hidden = false;
    document.body.classList.add('modal-open');
    els.game?.setAttribute('aria-hidden', 'true');
    if (onReady) onReady(els.modalBody);
  }
  function closeModal() {
    const resumePausedGame = pauseMenuOpen;
    els.modal.hidden = true;
    els.modal.classList.remove('map-modal');
    els.modalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    els.game?.removeAttribute('aria-hidden');
    input.keys?.clear?.();
    input.targetX = input.targetZ = input.x = input.z = 0;
    if (resumePausedGame) {
      pauseMenuOpen = false;
      paused = false;
      if (running && player.vehicle) startEngineSound();
    }
  }
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

  /* PWA — instalação aparece somente no lobby e apenas quando realmente disponível */
  let deferredInstallPrompt = null;
  const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true || safeLocalGet('otthos_installed') === '1';
  function updateInstallUI() {
    const installed = isStandalone();
    const canInstall = !installed && !!deferredInstallPrompt;
    if (els.installBtn) els.installBtn.hidden = !canInstall;
    if (els.installHint) {
      els.installHint.hidden = !canInstall;
      els.installHint.textContent = canInstall ? 'Instale uma única vez e continue do ponto salvo.' : '';
    }
    document.documentElement.classList.toggle('app-installed', installed);
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUI();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    safeLocalSet('otthos_installed', '1');
    updateInstallUI();
    toast('Aplicativo instalado!', 'good');
  });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', updateInstallUI);
  async function installApp() {
    if (isStandalone()) { updateInstallUI(); return; }
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      updateInstallUI();
      return;
    }
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    openModal('Instalar aplicativo', isiOS
      ? '<p>No iPhone/iPad, toque em <b>Compartilhar</b> e escolha <b>Adicionar à Tela de Início</b>.</p>'
      : '<p>No Chrome, abra o menu ⋮ e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</p>');
  }
  if (els.installBtn) els.installBtn.onclick = installApp;
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=613').catch(console.warn));
  updateInstallUI();

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
    { keys: ['amigo','vizinho'], text: 'Converse com Nino, Luna, Teo, Bia e Maya. A amizade aumenta quando você fala e ajuda.' },
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

  const avatarCatalog = {
    outfit: [
      ['classic','Clássico','⬛'], ['blue','Jaqueta azul','🟦'], ['red','Jaqueta vermelha','🟥'], ['explorer','Explorador','🟩']
    ],
    hat: [
      ['none','Sem chapéu','🚫'], ['cap','Boné','🧢'], ['crown','Coroa','👑'], ['helmet','Capacete','⛑️']
    ],
    accessory: [
      ['none','Sem acessório','🚫'], ['backpack','Mochila','🎒'], ['glasses','Óculos','🕶️'], ['cape','Capa','🦸']
    ]
  };
  function avatarChoiceGroup(type, title) {
    return `<section class="avatar-section"><h3>${title}</h3><div class="avatar-grid">${avatarCatalog[type].map(([id,name,icon]) => `<button class="avatar-option ${state.avatar[type]===id?'selected':''}" data-avatar-type="${type}" data-avatar-id="${id}"><b>${icon}</b><span>${name}</span></button>`).join('')}</div></section>`;
  }
  function openAvatarStudio() {
    openModal('Meu Otthos', `<div class="avatar-summary"><div class="avatar-face"><i></i><i></i></div><div><b>Personalize seu personagem</b><span>Roupas e acessórios ficam salvos no celular.</span></div></div>${avatarChoiceGroup('outfit','Roupa')}${avatarChoiceGroup('hat','Chapéu')}${avatarChoiceGroup('accessory','Acessório')}<div class="modal-actions"><button class="btn primary" data-avatar-save>Salvar visual</button></div>`, root => {
      $$('[data-avatar-type]', root).forEach(btn => btn.onclick = () => {
        state.avatar[btn.dataset.avatarType] = btn.dataset.avatarId;
        $$(`[data-avatar-type="${btn.dataset.avatarType}"]`, root).forEach(x => x.classList.toggle('selected', x === btn));
        applyAvatarCustomization();
      });
      $('[data-avatar-save]', root).onclick = () => { setFlag('customizedAvatar'); saveState(true); closeModal(); toast('Visual do Otthos salvo!', 'good'); };
    });
  }
  function openLifePanel() {
    const c = state.career;
    const friendships = Object.entries(state.friendship).sort((a,b)=>b[1]-a[1]).map(([id,value])=>`<div class="friend-row"><span>${({nino:'Nino',luna:'Luna',teo:'Teo',bia:'Bia',maya:'Maya'})[id]||id}</span><b>${value}/100</b></div>`).join('');
    openModal('Minha vida', `<div class="roleplay-card"><small>CARREIRA</small><h3>${c.title}</h3><p>Nível ${c.level} • ${c.xp} XP profissional • ${c.completed} trabalhos</p></div><div class="choice-grid"><button class="choice" data-life-avatar><b>👕 Meu Otthos</b><span>Roupas e acessórios</span></button><button class="choice" data-life-jobs><b>💼 Trabalhos</b><span>Ganhe moedas e reputação</span></button></div><h3>Amizades</h3><div class="friend-list">${friendships}</div>`, root => {
      $('[data-life-avatar]', root).onclick = openAvatarStudio;
      $('[data-life-jobs]', root).onclick = openJobCenter;
    });
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
      <div class="choice"><b>✋ Ação contextual</b><span>O texto da tela é exatamente a ação executada: cozinhar, abrir, conversar, coletar ou atacar.</span></div>
      <div class="choice"><b>▼ Abaixar</b><span>Use em passagens baixas e túneis.</span></div>
      <div class="choice"><b>◱ Mini</b><span>Entre em espaços pequenos e desafios especiais.</span></div>
      <div class="choice"><b>N Normal</b><span>Volta ao tamanho padrão.</span></div>
      <div class="choice"><b>⬡ Grande</b><span>Abra portões pesados e enfrente desafios fortes.</span></div>
      <div class="choice"><b>↻ Girar</b><span>Executa o giro do Otthos.</span></div>
      <div class="choice"><b>⬆ Pular</b><span>Pulo rápido com peso. Use nas plataformas e corridas.</span></div>
      <div class="choice"><b>🔥 Poder</b><span>Lança fogo contra monstros de fantasia.</span></div>
      <div class="choice"><b>🏃 Ginásio</b><span>Dispute corridas e desafios pega-moedas com os vizinhos.</span></div>
      <div class="choice"><b>🧱 Construir</b><span>Escolha um item e coloque em áreas autorizadas.</span></div>
      <div class="choice"><b>💾 Salvar</b><span>O jogo salva automaticamente no celular e também permite exportar backup.</span></div>
    </div>`);
  }


  const missionChapters = [
    {
      id: 'home', title: 'Arrume sua casa', chapter: 'CAPÍTULO 1 — VIDA EM CASA', reward: { coins: 100, medal: 'Minha Primeira Casa' },
      steps: [
        ['enteredHome', 'Entre na Casa do Otthos.'],
        ['slept', 'Durma na cama para recuperar energia.'],
        ['ateMeal', 'Prepare e coma uma refeição.'],
        ['talkedNeighbor', 'Converse com Nino na praça.']
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
    },
    {
      id: 'roleplay', title: 'Construa sua história', chapter: 'CAPÍTULO 6 — ROLE PLAY', reward: { coins: 500, medal: 'Vida de Otthos' },
      steps: [
        ['customizedAvatar', 'Escolha uma roupa e um acessório.'],
        ['completedJob', 'Conclua um trabalho da vila.'],
        ['friend10', 'Alcance amizade 10 com um vizinho.'],
        ['decoratedHome', 'Construa ou decore perto da sua casa.']
      ]
    },
    {
      id: 'sports', title: 'Campeão da Vila', chapter: 'CAPÍTULO 7 — GINÁSIO E DESAFIOS', reward: { coins: 650, medal: 'Campeão do Ginásio' },
      steps: [
        ['wonRace', 'Vença uma corrida de velocidade.'],
        ['wonCoinRace', 'Vença a corrida pega-moedas.'],
        ['wonHouseChallenge', 'Conquiste uma casa em uma disputa.']
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
    state.flags.friend10 = Object.values(state.friendship).some(v => v >= 10);
    state.flags.completedJob = (state.career?.completed || 0) > 0;
    state.flags.decoratedHome = state.builds.some(b => Math.hypot((b.x||0), (b.z||0)-18) < 12);
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
    const job = state.career?.activeJob;
    if (job) {
      const progress = activeJobProgress(job);
      els.missionChapter.textContent = 'TRABALHO ATIVO';
      els.missionTitle.textContent = `${job.icon || '💼'} ${job.title}`;
      els.missionStep.textContent = `${job.description} — ${progress.label}`;
      els.missionFill.style.width = `${progress.percent}%`;
      return;
    }
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
    const lowest = Math.min(...Object.values(state.needs));
    if (els.needsToggleBtn) { els.needsToggleBtn.textContent = lowest < 20 ? '⚠️' : lowest < 50 ? '💛' : '❤️'; els.needsToggleBtn.classList.toggle('warning', lowest < 35); }
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

  const ROAD_GUIDE_NODES = [
    {x:0,z:0},{x:0,z:18},{x:0,z:50},{x:0,z:78},{x:0,z:-18},{x:0,z:-55},
    {x:-25,z:0},{x:-55,z:0},{x:-88,z:0},{x:25,z:0},{x:55,z:0},{x:88,z:0},
    {x:-25,z:18},{x:25,z:18},{x:-22,z:-18},{x:22,z:-18},{x:-22,z:50},{x:52,z:48},{x:45,z:78},{x:88,z:62},{x:70,z:-60}
  ];
  function routeLength(points){let total=0;for(let i=1;i<points.length;i++)total+=Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);return total;}
  function compactRoute(points){
    const result=[];for(const p of points){const last=result[result.length-1];if(!last||Math.hypot(last.x-p.x,last.z-p.z)>.4)result.push({x:p.x,z:p.z});}
    return result;
  }
  function buildRoutePoints(from,to){
    const start={x:from.x,z:from.z},end={x:to.x,z:to.z};
    const candidates=[
      compactRoute([start,{x:start.x,z:0},{x:end.x,z:0},end]),
      compactRoute([start,{x:0,z:start.z},{x:0,z:end.z},end]),
      compactRoute([start,{x:start.x,z:18},{x:0,z:18},{x:0,z:end.z},end]),
      compactRoute([start,{x:start.x,z:-18},{x:0,z:-18},{x:end.x,z:-18},end])
    ];
    return candidates.sort((a,b)=>routeLength(a)-routeLength(b))[0];
  }
  function sampleRoute(points,spacing=4){
    const samples=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);const steps=Math.max(1,Math.floor(len/spacing));for(let s=1;s<=steps;s++){const t=s/steps;samples.push({x:a.x+dx*t,z:a.z+dz*t,angle:Math.atan2(dx,dz)});}}
    return samples;
  }
  function createRouteGuide(){
    if(world.routeGuide)return;
    world.routeGuide=new THREE.Group();world.routeGuide.name='OTTHOS_ROUTE_GUIDE';worldGroup.add(world.routeGuide);
    const routeMat=mat(0x53e8ff,{emissive:0x0a9fc0,emissiveIntensity:1.2,roughness:.25,transparent:true,opacity:.9});
    for(let i=0;i<28;i++){const arrow=new THREE.Mesh(new THREE.ConeGeometry(.34,.75,4),routeMat.clone());arrow.rotation.x=Math.PI/2;arrow.visible=false;world.routeGuide.add(arrow);world.routeArrows.push(arrow);}
  }
  function updateRouteGuide(force=false){
    createRouteGuide();if(!state.waypoint){world.routeArrows.forEach(a=>a.visible=false);return;}
    const moved=Math.hypot(player.x-world.routeLastX,player.z-world.routeLastZ);if(!force&&performance.now()-world.routeLastBuild<550&&moved<2.2)return;
    world.routeLastBuild=performance.now();world.routeLastX=player.x;world.routeLastZ=player.z;
    const samples=sampleRoute(buildRoutePoints(player,state.waypoint),4.2).slice(0,world.routeArrows.length);
    world.routeArrows.forEach((arrow,i)=>{const p=samples[i];arrow.visible=!!p;if(!p)return;arrow.position.set(p.x,groundHeightAt(p.x,p.z)+.24,p.z);arrow.rotation.z=-p.angle;arrow.material.opacity=.62+.28*Math.sin(performance.now()*.004+i*.6);});
  }
  function drawMiniMap(){
    const canvas=els.miniMapCanvas;if(!canvas)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
    const tx=x=>(x+116)/232*w,tz=z=>(116-z)/232*h;const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#70c8ff');grad.addColorStop(.22,'#74d764');grad.addColorStop(1,'#3f9f4a');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#236c38';ctx.beginPath();ctx.arc(tx(-88),tz(-42),34,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2ab8e7';ctx.fillRect(0,tz(58),w,11);
    const roads=[[[-105,0],[105,0]],[[0,-105],[0,105]],[[-55,-105],[-55,0]],[[55,0],[55,92]]];
    ctx.strokeStyle='#d2d5d9';ctx.lineWidth=13;ctx.lineCap='round';roads.forEach(seg=>{ctx.beginPath();ctx.moveTo(tx(seg[0][0]),tz(seg[0][1]));ctx.lineTo(tx(seg[1][0]),tz(seg[1][1]));ctx.stroke();});
    ctx.strokeStyle='#4a5058';ctx.lineWidth=8;roads.forEach(seg=>{ctx.beginPath();ctx.moveTo(tx(seg[0][0]),tz(seg[0][1]));ctx.lineTo(tx(seg[1][0]),tz(seg[1][1]));ctx.stroke();});
    if(state.waypoint){const route=buildRoutePoints(player,state.waypoint);ctx.strokeStyle='#5ff5ff';ctx.lineWidth=4;ctx.setLineDash([7,5]);ctx.beginPath();route.forEach((p,i)=>i?ctx.lineTo(tx(p.x),tz(p.z)):ctx.moveTo(tx(p.x),tz(p.z)));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffe44f';ctx.beginPath();ctx.arc(tx(state.waypoint.x),tz(state.waypoint.z),6,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(tx(player.x),tz(player.z));ctx.rotate(-(player.facing||0));ctx.fillStyle='#1e79ff';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6,7);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function updateNavigation(dt=0,force=false){
    updateNavigation.acc=(updateNavigation.acc||0)+dt;if(!force&&updateNavigation.acc<.12)return;updateNavigation.acc=0;drawMiniMap();updateRouteGuide(force);if(!els.miniNav)return;
    if(state.waypoint){const dx=state.waypoint.x-player.x,dz=state.waypoint.z-player.z,dist=Math.round(Math.hypot(dx,dz));els.miniNavName.textContent=state.waypoint.name;els.miniNavDistance.textContent=dist<4?'Você chegou!':`${dist} m • siga as setas azuis`;const targetAngle=Math.atan2(dx,dz),relative=targetAngle-player.facing;els.miniNavArrow.style.transform=`rotate(${relative}rad)`;els.miniNav.classList.add('active');}
    else{els.miniNavName.textContent='Mapa da Vila';els.miniNavDistance.textContent='Toque para escolher um destino';els.miniNavArrow.style.transform='rotate(0deg)';els.miniNav.classList.remove('active');}
  }
  function routeSvgMarkup(points){const mapped=points.map(p=>worldToMap(p.x,p.z));return `<svg class="map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${mapped.map(p=>`${p.left},${p.top}`).join(' ')}"/></svg>`;}

  const MAP_LOCATIONS = [
    { id:'home', name:'Casa do Otthos', icon:'🏠', x:0, z:18, group:'Casa' },
    { id:'village', name:'Praça da Vila', icon:'🏘', x:0, z:0, group:'Vila' },
    { id:'blue', name:'Casa Azul', icon:'🏡', x:-25, z:17, group:'Casas' },
    { id:'pink', name:'Casa Rosa', icon:'🏡', x:25, z:17, group:'Casas' },
    { id:'shop', name:'Mercadinho', icon:'🛒', x:-22, z:-18, group:'Serviços' },
    { id:'workshop', name:'Oficina', icon:'🛠', x:22, z:-18, group:'Serviços' },
    { id:'forest', name:'Floresta', icon:'🌲', x:-88, z:-42, group:'Exploração' },
    { id:'lake', name:'Lago e Ponte', icon:'🌊', x:-22, z:50, group:'Exploração' },
    { id:'crystal', name:'Vale dos Cristais', icon:'💎', x:70, z:-60, group:'Desafios' },
    { id:'garage', name:'Garagem e Fazenda', icon:'🚗', x:52, z:48, group:'Trabalho' },
    { id:'gym', name:'Ginásio', icon:'🏃', x:45, z:78, group:'Desafios' },
    { id:'castle', name:'Castelo', icon:'🏰', x:88, z:62, group:'Aventura' },
    { id:'mini', name:'Passagem Mini', icon:'◱', x:-38, z:42, group:'Habilidades' },
    { id:'crouch', name:'Túnel Baixo', icon:'▼', x:-53, z:24, group:'Habilidades' },
    { id:'giant', name:'Portão Grande', icon:'⬡', x:36, z:-35, group:'Habilidades' }
  ];
  function worldToMap(x,z){ return { left:clamp((x+116)/232*100,2.5,97.5), top:clamp((116-z)/232*100,2.5,97.5) }; }
  function mapDistance(point){ return Math.round(Math.hypot(player.x-point.x,player.z-point.z)); }
  function setWaypoint(id){
    const point=MAP_LOCATIONS.find(p=>p.id===id);if(!point)return;
    state.waypoint={id:point.id,name:point.name,x:point.x,z:point.z};
    updateWaypointMarker();updateNavigation(0,true);saveState(true);closeModal();toast(`Destino marcado: ${point.name} • siga as setas azuis`,'good',2600);
  }
  function clearWaypoint(){ state.waypoint=null; updateWaypointMarker(); updateNavigation(0,true); saveState(true); closeModal(); toast('Destino removido.','good'); }
  function openMap() {
    const pp=worldToMap(player.x,player.z);
    const angleDeg=((player.facing||0)*180/Math.PI)+180;
    const wp=state.waypoint?worldToMap(state.waypoint.x,state.waypoint.z):null;
    const markers=MAP_LOCATIONS.map(loc=>{const pos=worldToMap(loc.x,loc.z);const dist=mapDistance(loc);return `<button class="map-marker" style="left:${pos.left}%;top:${pos.top}%" data-waypoint="${loc.id}" title="Marcar ${loc.name}"><b>${loc.icon}</b><span>${loc.name}</span><small>${dist} m</small></button>`;}).join('');
    const nearby=[...MAP_LOCATIONS].sort((a,b)=>mapDistance(a)-mapDistance(b)).slice(0,6).map(loc=>`<button class="map-destination" data-waypoint="${loc.id}"><b>${loc.icon} ${loc.name}</b><span>${mapDistance(loc)} m • ${loc.group}</span></button>`).join('');
    const route=wp?routeSvgMarkup(buildRoutePoints(player,state.waypoint)):'';
    const waypointText=state.waypoint?`<div class="active-waypoint"><div><small>DESTINO ATUAL</small><b>◎ ${state.waypoint.name}</b><span>${Math.round(Math.hypot(player.x-state.waypoint.x,player.z-state.waypoint.z))} m de distância</span></div><button class="btn danger" data-clear-waypoint>Remover</button></div>`:'<div class="active-waypoint empty"><b>Nenhum destino marcado</b><span>Toque em um ponto do mapa ou na lista abaixo.</span></div>';
    openModal('Mapa GPS da Vila do Sol', `<div class="map-layout"><div><div class="world-map">
      <i class="map-road horizontal"></i><i class="map-road vertical"></i><i class="map-road diagonal"></i><i class="map-river"></i>
      <div class="map-region forest">FLORESTA</div><div class="map-region city">VILA</div><div class="map-region adventure">AVENTURA</div>
      ${route}${markers}
      ${wp?`<span class="waypoint-dot" style="left:${wp.left}%;top:${wp.top}%">◎</span>`:''}
      <span class="player-dot" style="left:${pp.left}%;top:${pp.top}%;--player-angle:${angleDeg}deg"><i></i><b>VOCÊ</b></span>
    </div>${waypointText}</div><aside class="map-sidebar"><h3>Mais próximos</h3><div class="map-destinations">${nearby}</div><div class="map-legend"><span>🔵 Sua posição</span><span>▲ Direção</span><span>◎ Destino</span><span>➜ Rota guiada</span></div></aside></div>`,root=>{
      $$('[data-waypoint]',root).forEach(btn=>btn.onclick=()=>setWaypoint(btn.dataset.waypoint));
      $('[data-clear-waypoint]',root)?.addEventListener('click',clearWaypoint);
    });
    els.modal.classList.add('map-modal');
  }


  let deferredSettingsRefresh = null;
  function openSettings(inGame = false) {
    const sound = state.settings.sound, vibration = state.settings.vibration, high = state.settings.quality === 'high';
    const savedAt = state.lastSaved ? new Date(state.lastSaved).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : 'ainda não salvo';
    const isiOSInstall = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const installOption = !isStandalone() && (!!deferredInstallPrompt || isiOSInstall) ? '<button class="btn" data-install>Instalar aplicativo</button>' : '';
    openModal('Configurações', `<div class="settings-list">
      <div class="settings-row"><div><b>Som</b><small>Interface, coleta e combate</small></div><button class="toggle ${sound ? 'on' : ''}" data-toggle="sound"><i></i></button></div>
      <div class="settings-row"><div><b>Vibração</b><small>Feedback no celular</small></div><button class="toggle ${vibration ? 'on' : ''}" data-toggle="vibration"><i></i></button></div>
      <div class="settings-row"><div><b>Qualidade gráfica</b><small>${high ? 'Alta' : 'Econômica'}</small></div><button class="toggle ${high ? 'on' : ''}" data-toggle="quality"><i></i></button></div>
      <div class="settings-row"><div><b>Salvamento automático</b><small>IndexedDB no celular + cópia local. Último: ${savedAt}</small></div><span class="db-status">✓ Ativo</span></div>
    </div><div class="modal-actions">
      <button class="btn primary" data-save-now>Salvar agora</button>
      <button class="btn" data-export>Exportar backup</button>
      <button class="btn" data-import>Importar backup</button>
      ${installOption}
      <input data-import-file type="file" accept="application/json" hidden>
      ${inGame ? '<button class="btn" data-home>Voltar para casa</button><button class="btn" data-exit>Sair para o menu</button>' : ''}
      <button class="btn danger" data-reset>Apagar progresso</button>
    </div>`, root => {
      $$('[data-toggle]', root).forEach(btn => btn.onclick = () => {
        const key = btn.dataset.toggle;
        if (key === 'quality') state.settings.quality = state.settings.quality === 'high' ? 'low' : 'high';
        else state.settings[key] = !state.settings[key];
        saveState(true); closeModal(); applyQuality(); openSettings(inGame);
      });
      $('[data-save-now]',root).onclick=async()=>{ if(running) savePlayerPosition(true); else await commitState(); toast('Progresso salvo no celular.','good'); closeModal(); };
      $('[data-export]', root).onclick = () => window.OTTHOS_DB?.exportFile(state);
      const install=$('[data-install]',root);if(install)install.onclick=installApp;
      const fileInput = $('[data-import-file]', root);
      $('[data-import]', root).onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        const file = fileInput.files?.[0]; if (!file) return;
        try { state = normalizeState(await window.OTTHOS_DB.importFile(file)); await window.OTTHOS_DB.save(state); safeLocalSet(STORAGE_KEY, JSON.stringify(state)); location.reload(); }
        catch (error) { toast(error.message || 'Backup inválido.', 'bad'); }
      };
      const home = $('[data-home]', root); if (home) home.onclick = () => { closeModal(); returnHome(); };
      const exit = $('[data-exit]', root); if (exit) exit.onclick = () => { closeModal(); stopGame(); };
      $('[data-reset]', root).onclick = async () => {
        if (await confirmModal('Apagar progresso', 'Tem certeza? Casas, moedas, amizade e construções serão apagadas.', 'Apagar', 'Cancelar')) {
          state = defaultState(); safeLocalRemove(STORAGE_KEY); await window.OTTHOS_DB?.clear(); await commitState(); location.reload();
        }
      };
    });
  }


  els.quizBtn.onclick = openQuiz;
  els.talkBtn.onclick = openTalk;
  els.collectionBtn.onclick = openCollection;
  els.avatarBtn.onclick = openAvatarStudio;
  els.moldsBtn.onclick = openMolds;
  els.howBtn.onclick = openHow;
  els.settingsBtn.onclick = () => openSettings(false);
  els.avatarGameBtn.onclick = openLifePanel;
  els.inventoryBtn.onclick = openInventory;
  els.mapBtn.onclick = openMap;
  els.gameSettingsBtn.onclick = () => openSettings(true);
  els.quickToggleBtn.onclick = () => { state.ui.quickOpen = !state.ui.quickOpen; els.quickBar.hidden = !state.ui.quickOpen; els.quickToggleBtn.classList.toggle('active', state.ui.quickOpen); saveState(); };
  els.needsToggleBtn.onclick = () => { state.ui.needsOpen = !state.ui.needsOpen; els.game.classList.toggle('needs-expanded', state.ui.needsOpen); saveState(); };
  const toggleMission = () => { state.ui.missionOpen = !state.ui.missionOpen; els.missionCard.classList.toggle('expanded', state.ui.missionOpen); saveState(); };
  els.missionCard.onclick = toggleMission;
  els.missionCard.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMission(); } };
  [els.avatarGameBtn,els.inventoryBtn,els.buildBtn,els.mapBtn,els.gameSettingsBtn].forEach(btn => btn?.addEventListener('click', () => { state.ui.quickOpen=false; els.quickBar.hidden=true; els.quickToggleBtn.classList.remove('active'); }));
  async function ensureModelViewerReady({activateAR=false}={}) {
    if (!els.nativeViewer || !window.loadModelViewerLib) throw new Error('Visualizador indisponível');
    if (els.viewerStatus) els.viewerStatus.textContent = 'Carregando visualizador 3D…';
    if (els.viewerLoadBtn) els.viewerLoadBtn.disabled = true;
    els.nativeViewer.hidden = false;
    try {
      await window.loadModelViewerLib();
      await Promise.race([
        customElements.whenDefined('model-viewer'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado carregando model-viewer')), 15000))
      ]);
      if (!els.nativeViewer.loaded) {
        await Promise.race([
          new Promise((resolve, reject) => {
            const done = () => { cleanup(); resolve(true); };
            const fail = () => { cleanup(); reject(new Error('Falha carregando athos.glb')); };
            const cleanup = () => { els.nativeViewer.removeEventListener('load', done); els.nativeViewer.removeEventListener('error', fail); };
            els.nativeViewer.addEventListener('load', done, {once:true});
            els.nativeViewer.addEventListener('error', fail, {once:true});
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado carregando o modelo 3D')), 20000))
        ]);
      }
      if (els.viewerPlaceholder) els.viewerPlaceholder.hidden = true;
      if (els.viewerShell) els.viewerShell.classList.add('viewer-ready');
      if (activateAR) await els.nativeViewer.activateAR();
      return true;
    } catch (error) {
      if (els.viewerPlaceholder) els.viewerPlaceholder.hidden = false;
      if (els.viewerStatus) els.viewerStatus.textContent = 'Não foi possível carregar. Toque para tentar novamente.';
      throw error;
    } finally {
      if (els.viewerLoadBtn) els.viewerLoadBtn.disabled = false;
    }
  }
  if (els.viewerLoadBtn) els.viewerLoadBtn.onclick = () => ensureModelViewerReady().catch(() => toast('Visualizador 3D indisponível agora.','warn',2400));
  els.arBtn.onclick = async () => {
    try { await ensureModelViewerReady({activateAR:true}); }
    catch { openModal('Realidade aumentada', '<p>Não foi possível iniciar o AR agora. Verifique a internet e o suporte do aparelho e tente novamente.</p>'); }
  };

  /* THREE.JS GAME */
  let scene, camera, renderer, clock, worldGroup, playerGroup, playerModel, playerMixer, avatarLayer, contactShadow, vehicleVisual;
  let running = false, paused = false, pauseMenuOpen = false, raf = 0, cameraYaw = 0, cameraPitch = .38, cameraZoom = Number(state.settings?.cameraZoom || 0), cameraMode = 'openworld';
  let currentHouse = null, buildMode = null, currentContext = null, lastContextId = '', lastActionSource = 'none', actionLockedUntil = 0, activeRace = null;
  const player = { x: 0, y: 0, z: 8, vx: 0, vy: 0, vz: 0, facing: Math.PI, grounded: true, vehicle: false, sitUntil: 0, lastGrounded: 0, jumpBuffer: 0, attackUntil: 0, damageUntil: 0, scaleMode: state.abilities?.scaleMode || 'normal', crouched: !!state.abilities?.crouched, spinUntil: 0, preVehicleAbilities: null, hornUntil: 0, car: { heading: Math.PI, speed: 0, steerVisual: 0, drift: 0, _prevSpeed: 0 } };
  const input = {
    x:0,z:0,targetX:0,targetZ:0,
    joyId:null,joyX:0,joyZ:0,
    gamepadX:0,gamepadZ:0,gamepadActive:false,
    virtualX:0,virtualZ:0,virtualActive:false,
    touchSprint:false,gamepadSprint:false,isSprinting:false,
    keys:new Set(),cameraDrag:null,cameraPointers:new Map(),pinchDistance:0
  };
  const world = {
    houses: [], npcs: [], interactables: [], enemies: [], fireballs: [], resources: [], crystals: [], platforms: [], colliders: [], hazards: [], builds: [], ghosts: new Map(),
    bridgeParts: [], secretChest: null, vehicle: null, deliveryPoint: null, raceCoins: [], waypointMarker: null, gym: null, routeGuide: null, routeArrows: [], routeLastBuild: 0, routeLastX: Infinity, routeLastZ: Infinity, landmarks: []
  };
  const textures = {};
  const materials = {};

  function playerScaleValue(mode = player.scaleMode) { return mode === 'mini' ? .58 : mode === 'giant' ? 1.42 : 1; }
  function syncPlayerRootScale(){
    if(!playerGroup)return;
    if(player.vehicle){
      // O veículo nunca herda Mini/Grande/Abaixar do Otthos.
      playerGroup.scale.set(1,1,1);
      return;
    }
    const scale=playerScaleValue();
    playerGroup.scale.set(scale,scale*(player.crouched?.68:1),scale);
  }
  function setScaleMode(mode) {
    if(!els.modal.hidden||paused||player.vehicle)return;
    if (!['mini','normal','giant'].includes(mode)) return;
    player.scaleMode = mode;
    player.crouched = false;
    state.abilities.scaleMode = mode;
    state.abilities.crouched = false;
    updateAbilityUI(); saveState(true);
    toast(mode === 'mini' ? 'Modo mini: entre em passagens pequenas.' : mode === 'giant' ? 'Modo grande: força para desafios pesados.' : 'Tamanho normal.', 'good');
  }
  function toggleCrouch(force) {
    if(!els.modal.hidden||paused||player.vehicle)return;
    player.crouched = typeof force === 'boolean' ? force : !player.crouched;
    state.abilities.crouched = player.crouched;
    updateAbilityUI(); saveState();
    toast(player.crouched ? 'Otthos abaixou.' : 'Otthos levantou.', 'good');
  }
  function spinPlayer(){ if(!els.modal.hidden||paused||player.vehicle)return; player.spinUntil=performance.now()+720; addXP(1); beep(430,50,'sine'); }
  function updateAbilityUI(){
    els.crouchBtn?.classList.toggle('active',player.crouched);
    els.miniBtn?.classList.toggle('active',player.scaleMode==='mini');
    els.normalBtn?.classList.toggle('active',player.scaleMode==='normal');
    els.giantBtn?.classList.toggle('active',player.scaleMode==='giant');
  }

  function canvasTexture(kind, colors) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, 128, 128);
    if (kind === 'grass') {
      for (let i = 0; i < 260; i++) { ctx.fillStyle = colors[1 + (i % (colors.length - 1))]; ctx.fillRect(Math.random() * 128, Math.random() * 128, 4 + Math.random() * 7, 4 + Math.random() * 7); }
      ctx.fillStyle='rgba(20,60,15,.10)'; for(let i=0;i<40;i++)ctx.fillRect(Math.random()*128,Math.random()*128,10+Math.random()*16,2);
    } else if (kind === 'road') {
      ctx.fillStyle=colors[0]; ctx.fillRect(0,0,128,128);
      for (let i = 0; i < 70; i++) { ctx.fillStyle = colors[1]; ctx.fillRect(Math.random() * 128, Math.random() * 128, 8 + Math.random() * 14, 3 + Math.random() * 6); }
    } else if (kind === 'wood') {
      ctx.strokeStyle = colors[1]; ctx.lineWidth = 7; for (let x = 0; x < 128; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke(); }
      ctx.strokeStyle='rgba(0,0,0,.12)'; for(let x=14;x<128;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,128);ctx.stroke();}
    } else if (kind === 'brick') {
      ctx.strokeStyle = colors[1]; ctx.lineWidth = 5; for (let y = 0; y < 128; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke(); for (let x = (y / 30 % 2) * 30; x < 128; x += 60) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 30); ctx.stroke(); } }
    } else if (kind === 'sidewalk') {
      for (let y=0;y<128;y+=32){ctx.strokeStyle='rgba(0,0,0,.14)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();}
      for (let i=0;i<50;i++){ctx.fillStyle=colors[1];ctx.globalAlpha=.25;ctx.fillRect(Math.random()*128,Math.random()*128,3+Math.random()*4,3+Math.random()*4);ctx.globalAlpha=1;}
    } else if (kind === 'water') {
      ctx.fillStyle=colors[0]; ctx.fillRect(0,0,128,128);
      ctx.strokeStyle=colors[1]; ctx.lineWidth=3; ctx.globalAlpha=.5;
      for(let y=8;y<128;y+=18){ctx.beginPath();ctx.moveTo(0,y+Math.sin(y)*4);for(let x=0;x<=128;x+=16)ctx.lineTo(x,y+Math.sin((x+y)*.15)*5);ctx.stroke();}
      ctx.globalAlpha=1;
    }
    const tex = new THREE.CanvasTexture(c); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = (renderer && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 4; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
  }
  function initMaterials() {
    textures.grass = canvasTexture('grass', ['#3f9f35','#77d858','#2c7f2d','#a2ec69']); textures.grass.repeat.set(46, 46);
    textures.road = canvasTexture('road', ['#303741','#49515d']); textures.road.repeat.set(10, 30);
    textures.sidewalk = canvasTexture('sidewalk', ['#c7cdd6','#aab2bd']); textures.sidewalk.repeat.set(6,14);
    textures.water = canvasTexture('water', ['#2fb8ec','#bdf1ff']); textures.water.repeat.set(5,5);
    textures.wood = canvasTexture('wood', ['#9a5a28','#693819']); textures.wood.repeat.set(2, 2);
    textures.brick = canvasTexture('brick', ['#c38142','#8a4e25']); textures.brick.repeat.set(3, 2);
    materials.grass = new THREE.MeshStandardMaterial({ map: textures.grass, roughness: .88 });
    materials.road = new THREE.MeshStandardMaterial({ map: textures.road, roughness: .82 });
    materials.sidewalk = new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: .92 });
    materials.wood = new THREE.MeshStandardMaterial({ map: textures.wood, roughness: .8 });
    materials.brick = new THREE.MeshStandardMaterial({ map: textures.brick, roughness: .82 });
    materials.water = new THREE.MeshStandardMaterial({ map:textures.water, color:0x2fc8f4, emissive:0x087aa7, emissiveIntensity:.18, transparent:true, opacity:.76, roughness:.2, metalness:.1 });
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
    const black = mat(0x0a0d12,{roughness:.55}), blackSoft = mat(0x14181f,{roughness:.6}), white = mat(0xf4f6ff,{roughness:.35,emissive:0xffffff,emissiveIntensity:.06});
    const red = mat(0xff263d,{emissive:0xb00019,emissiveIntensity:.55}), orange = mat(0xff7a13,{emissive:0xc84a00,emissiveIntensity:.35}), yellow = mat(0xffd83d,{emissive:0xcc8f00,emissiveIntensity:.28});
    const parts = {};
    // Corpo: caixa principal (mantém o pivô/escala usados pela respiração) + placas que dão silhueta mais arredondada.
    parts.body = new THREE.Group(); parts.body.position.set(0,1.55,0); playerModel.add(parts.body);
    box(1.0,1.25,.72,black,0,0,0,parts.body);
    box(.86,.62,.08,blackSoft,0,.28,.375,parts.body); // placa de peito, dá profundidade
    box(1.1,.22,.78,blackSoft,0,-.6,0,parts.body); // cinto
    box(.2,.16,.06,red,0,-.6,.4,parts.body).rotation.z=Math.PI/4; // fivela
    box(1.14,.3,.8,blackSoft,0,.66,0,parts.body); // ombros/gola
    parts.head = box(1.08,1.02,1.02,black,0,2.72,0,playerModel);
    box(1.0,.2,.94,blackSoft,0,3.18,0,playerModel); // topo da cabeça arredondando a silhueta
    // olhos: base branca com detalhe vermelho por cima (leitura clara em telas pequenas)
    box(.26,.22,.05,white,-.27,2.78,.545,playerModel); box(.26,.22,.05,white,.27,2.78,.545,playerModel);
    box(.15,.09,.06,red,-.27,2.76,.575,playerModel); box(.15,.09,.06,red,.27,2.76,.575,playerModel);
    parts.leftArm = new THREE.Group(); parts.rightArm = new THREE.Group(); parts.leftLeg = new THREE.Group(); parts.rightLeg = new THREE.Group();
    parts.leftArm.position.set(-.72,2.0,0); parts.rightArm.position.set(.72,2.0,0); parts.leftLeg.position.set(-.28,.92,0); parts.rightLeg.position.set(.28,.92,0);
    playerModel.add(parts.leftArm,parts.rightArm,parts.leftLeg,parts.rightLeg);
    for(const arm of [parts.leftArm,parts.rightArm]){
      box(.34,.5,.34,black,0,-.24,0,arm); // ombro/braço
      box(.30,.46,.30,orange,0,-.72,0,arm); // antebraço em chama
      box(.30,.22,.34,yellow,0,-1.0,0,arm); // mão/punho em chama clara
      box(.13,.13,.13,red,0,-1.1,.12,arm); // brasa na ponta
    }
    for(const leg of [parts.leftLeg,parts.rightLeg]){
      box(.38,.5,.38,black,0,-.24,0,leg); // coxa
      box(.36,.42,.36,blackSoft,0,-.68,.02,leg); // canela
      box(.4,.26,.44,orange,0,-.96,.05,leg); // pé em chama
      box(.4,.09,.44,yellow,0,-1.1,.05,leg); // sola incandescente
    }
    // O ponto zero do playerGroup é a sola dos pés. O pé visual termina em -0.23,
    // por isso o modelo fica permanentemente +0.24 acima da raiz física.
    playerModel.userData.parts = parts;
    playerModel.userData.baseY = .24;
    playerModel.userData.minFootY = -.23;
    playerModel.userData.proceduralOtthos = true;
    // Assinatura visual do Otthos: núcleo de fogo no peito (3 tons) e chamas nos punhos/pés.
    const core=box(.34,.34,.08,red,0,.07,.41,parts.body);core.rotation.z=Math.PI/4;
    box(.2,.2,.09,orange,0,.07,.44,parts.body).rotation.z=Math.PI/4;
    box(.1,.1,.1,yellow,0,.07,.47,parts.body).rotation.z=Math.PI/4;

    const shadowMat = new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide});
    contactShadow = new THREE.Mesh(new THREE.CircleGeometry(.85,32),shadowMat); contactShadow.rotation.x = -Math.PI/2; contactShadow.position.y=.025; scene.add(contactShadow);

    vehicleVisual = new THREE.Group(); vehicleVisual.visible=false; playerGroup.add(vehicleVisual);
    const body=mat(0x35a8ff,{roughness:.35,metalness:.25});
    const bodyLower=box(1.86,.5,2.5,body,0,.4,0,vehicleVisual);
    const cabin=box(1.5,.46,1.25,mat(0x2489e6,{roughness:.3,metalness:.3}),0,.86,-.15,vehicleVisual);
    const glass=mat(0x0d1b2a,{roughness:.15,metalness:.4,transparent:true,opacity:.82});
    box(1.42,.32,1.1,glass,0,.96,-.15,vehicleVisual);
    box(1.6,.14,2.62,mat(0x1c65b8,{roughness:.4}),0,.15,0,vehicleVisual); // saia/spoiler inferior
    // para-lamas sobre as 4 rodas (só estética, não interfere na física)
    [[-.82,-.78],[.82,-.78],[-.82,.78],[.82,.78]].forEach(([x,z])=>{
      const fender=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.32,10,1,false,Math.PI,Math.PI),mat(0x2f8fe0,{roughness:.4,metalness:.2}));
      fender.rotation.z=Math.PI/2; fender.position.set(x,.4,z); vehicleVisual.add(fender);
    });
    // banco e volante visíveis pelo para-brisa (detalhe pedido para leitura infantil)
    box(.7,.4,.55,mat(0x1c2733,{roughness:.6}),0,.72,.18,vehicleVisual);
    const wheelRing=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,8,14),mat(0x1c2733,{roughness:.5}));
    wheelRing.position.set(-.32,.95,.42); wheelRing.rotation.x=Math.PI/2.3; vehicleVisual.add(wheelRing);
    const headlight=mat(0xfff6c9,{emissive:0xfff2a0,emissiveIntensity:.9});
    box(.28,.16,.08,headlight,-.62,.42,1.24,vehicleVisual); box(.28,.16,.08,headlight,.62,.42,1.24,vehicleVisual);
    const taillight=mat(0xff3b3b,{emissive:0xc41f1f,emissiveIntensity:.85});
    box(.26,.16,.06,taillight,-.62,.42,-1.24,vehicleVisual); box(.26,.16,.06,taillight,.62,.42,-1.24,vehicleVisual);
    vehicleVisual.userData.wheels=[]; vehicleVisual.userData.frontWheels=[];
    const wheelMat=mat(0x111827,{roughness:.85});
    [[-.82,.22,-.78,false],[.82,.22,-.78,false],[-.82,.22,.78,true],[.82,.22,.78,true]].forEach(([x,y,z,front])=>{
      const holder=new THREE.Group(); holder.position.set(x,y,z); vehicleVisual.add(holder);
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.26,14),wheelMat); wheel.rotation.z=Math.PI/2; wheel.castShadow=true; holder.add(wheel);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.28,8),mat(0xcfd6e0,{roughness:.4,metalness:.6})); hub.rotation.z=Math.PI/2; holder.add(hub);
      vehicleVisual.userData.wheels.push(wheel); if(front)vehicleVisual.userData.frontWheels.push(holder);
    });
  }

  function loadFaithfulAthosModel() {
    // Regra V606 (herdada da V605): athos.glb pertence apenas ao visualizador/AR do lobby.
    // A jogabilidade usa o Otthos procedural animado para preservar física, escala e desempenho.
    return false;
  }

  function clearAvatarLayer() {
    if (avatarLayer && playerGroup) playerGroup.remove(avatarLayer);
    avatarLayer = new THREE.Group();
    avatarLayer.name = 'OTTHOS_AVATAR_ACCESSORIES';
    playerGroup?.add(avatarLayer);
  }
  function applyAvatarCustomization() {
    if (!playerGroup || !window.THREE) return;
    clearAvatarLayer();
    const outfit = state.avatar?.outfit || 'classic', hat = state.avatar?.hat || 'none', accessory = state.avatar?.accessory || 'none';
    const outfitColors = { blue:0x2477d4, red:0xd93645, explorer:0x3f9b4b };
    if (outfit !== 'classic') {
      const vest = box(1.02,1.08,.76,outfitColors[outfit]||0x2477d4,0,1.55,0,avatarLayer);
      vest.material.transparent = true; vest.material.opacity = .86;
    }
    if (hat === 'cap') { box(1.0,.22,1.0,0x2477d4,0,3.28,0,avatarLayer); box(.55,.10,.55,0x2477d4,0,3.18,.58,avatarLayer); }
    else if (hat === 'crown') { box(.92,.25,.92,0xffd84d,0,3.32,0,avatarLayer); [[-.32,.22],[0,.34],[.32,.22]].forEach(([x,h])=>box(.18,h,.18,0xffd84d,x,3.48+h/2,0,avatarLayer)); }
    else if (hat === 'helmet') { const helm = new THREE.Mesh(new THREE.SphereGeometry(.62,12,8,0,Math.PI*2,0,Math.PI*.62),mat(0xf97316,{metalness:.08})); helm.position.set(0,3.08,0); avatarLayer.add(helm); }
    if (accessory === 'backpack') { box(.78,1.05,.42,0x9a5b2b,0,1.65,-.58,avatarLayer); }
    else if (accessory === 'glasses') { box(.38,.18,.08,0x111827,-.26,2.78,.59,avatarLayer); box(.38,.18,.08,0x111827,.26,2.78,.59,avatarLayer); box(.18,.06,.08,0x111827,0,2.78,.59,avatarLayer); }
    else if (accessory === 'cape') { const cape=box(.92,1.35,.08,0x8b5cf6,0,1.58,-.60,avatarLayer); cape.rotation.x=-.08; }
    avatarLayer.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
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
  function createSignpost(x,z,text,rotationY=0){
    const post=box(.16,2.1,.16,materials.wood,x,1.05,z);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.6),new THREE.MeshStandardMaterial({map:signTexture(text,'#2a3f2c','#f4ede1'),roughness:.85,side:THREE.DoubleSide}));
    board.position.set(x,1.95,z); board.rotation.y=rotationY; worldGroup.add(board);
    return post;
  }
  function createFenceLine(x1,z1,x2,z2,segments=8){
    for(let i=0;i<=segments;i++){const t=i/segments;box(.18,1.0,.18,materials.wood,lerp(x1,x2,t),.5,lerp(z1,z2,t));}
    const mx=(x1+x2)/2,mz=(z1+z2)/2,w=Math.abs(x2-x1)||.15,d=Math.abs(z2-z1)||.15;box(w+.2,.13,d+.2,materials.wood,mx,.73,mz);
  }
  function createRoad(x,z,w,d){
    box(w,.09,d,materials.road,x,.045,z);
    const horizontal = w>=d;
    const curbColor = 0xd8dbe0;
    if (horizontal) {
      box(w+2.4,.1,1.4,materials.sidewalk,x,.05,z-d/2-.9); box(w+2.4,.1,1.4,materials.sidewalk,x,.05,z+d/2+.9);
      box(w+2.6,.02,.16,curbColor,x,.11,z-d/2-.2); box(w+2.6,.02,.16,curbColor,x,.11,z+d/2+.2);
      for(let lx=-w/2+3;lx<w/2-1.5;lx+=6) box(2.2,.005,.32,0xffe066,x+lx,.096,z);
    } else {
      box(1.4,.1,d+2.4,materials.sidewalk,x-w/2-.9,.05,z); box(1.4,.1,d+2.4,materials.sidewalk,x+w/2+.9,.05,z);
      box(.16,.02,d+2.6,curbColor,x-w/2-.2,.11,z); box(.16,.02,d+2.6,curbColor,x+w/2+.2,.11,z);
      for(let lz=-d/2+3;lz<d/2-1.5;lz+=6) box(.32,.005,2.2,0xffe066,x,.096,z+lz);
    }
  }
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
    if(type==='wardrobe'){box(1.5,2.1,.65,0x7b4a27,0,1.05,0,group);box(.06,.7,.08,0xffd84d,-.12,1.05,.35,group);box(.06,.7,.08,0xffd84d,.12,1.05,.35,group);}
    house.interiorObjects.push(group);
    return {group,x,z,type,label};
  }

  function signTexture(text, bg='#f4ede1', fg='#2a2118'){
    const c=document.createElement('canvas'); c.width=512; c.height=192;
    const ctx=c.getContext('2d');
    ctx.fillStyle=bg; ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.lineWidth=10; ctx.strokeRect(6,6,c.width-12,c.height-12);
    const words=String(text||'').trim().split(/\s+/).filter(Boolean);
    let lines=[''];
    const maxWidth=438;
    for(const word of words){
      const candidate=(lines[lines.length-1]+' '+word).trim();
      ctx.font='900 68px system-ui, sans-serif';
      if(ctx.measureText(candidate).width<=maxWidth||!lines[lines.length-1]) lines[lines.length-1]=candidate;
      else if(lines.length<2) lines.push(word);
      else lines[1]+=' '+word;
    }
    let fontSize=68;
    while(fontSize>30){
      ctx.font=`900 ${fontSize}px system-ui, sans-serif`;
      if(lines.every(line=>ctx.measureText(line).width<=maxWidth)) break;
      fontSize-=2;
    }
    ctx.fillStyle=fg; ctx.font=`900 ${fontSize}px system-ui, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    const lineHeight=fontSize*1.02;
    const startY=c.height/2-(lines.length-1)*lineHeight/2;
    lines.slice(0,2).forEach((line,i)=>ctx.fillText(line, c.width/2, startY+i*lineHeight));
    const tex=new THREE.CanvasTexture(c);
    tex.magFilter=THREE.LinearFilter; tex.minFilter=THREE.LinearMipmapLinearFilter; tex.generateMipmaps=true;
    tex.anisotropy=(renderer&&renderer.capabilities)?Math.min(8,renderer.capabilities.getMaxAnisotropy()):4;
    tex.encoding=THREE.sRGBEncoding;
    return tex;
  }
  function shadeColor(hex,amount){
    const r=Math.max(0,Math.min(255,((hex>>16)&255)+amount));
    const g=Math.max(0,Math.min(255,((hex>>8)&255)+amount));
    const b=Math.max(0,Math.min(255,(hex&255)+amount));
    return (r<<16)|(g<<8)|b;
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
    box(10.1,.12,8.1,shadeColor(roofColor,-28),x,2.86,z,house.roof); // friso escuro na borda do telhado, dá acabamento
    const door=box(1.45,2.25,.18,materials.wood,x,1.12,z+3.48); door.userData.houseId=id;
    const shutter=shadeColor(color,-34);
    box(1.05,.82,.12,0xa7e9ff,x-2.4,1.45,z+3.5,house.front); box(1.05,.82,.12,0xa7e9ff,x+2.4,1.45,z+3.5,house.front);
    box(.14,.9,.1,shutter,x-2.98,1.45,z+3.46,house.front); box(.14,.9,.1,shutter,x-1.82,1.45,z+3.46,house.front);
    box(.14,.9,.1,shutter,x+1.82,1.45,z+3.46,house.front); box(.14,.9,.1,shutter,x+2.98,1.45,z+3.46,house.front);
    // placa com o nome da casa, acima da porta (ajuda a criança a reconhecer o mundo sem abrir o mapa)
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.64),new THREE.MeshStandardMaterial({map:signTexture(name),roughness:.8,side:THREE.DoubleSide}));
    sign.position.set(x,2.32,z+3.56); house.front.add(sign);
    // caixa de correio ao lado do caminho
    box(.16,.55,.16,materials.wood,x-1.55,.28,z+4.7); box(.32,.24,.2,shadeColor(color,10),x-1.55,.62,z+4.7);
    if(!publicBuilding){ createFlower(x-3.1,z+4.7,shadeColor(0xff70c8,(id.charCodeAt(0)%3)*20-20)); createFlower(x+3.1,z+4.7,0xffdf55); }
    createLamp(x-3.7,z+4.0); createLamp(x+3.7,z+4.0);
    house.door=door;
    registerCollider(x,z-3.32,9,.35,{houseId:id}); registerCollider(x-4.32,z,.35,7,{houseId:id}); registerCollider(x+4.32,z,.35,7,{houseId:id}); registerCollider(x-2.7,z+3.32,3.6,.35,{houseId:id}); registerCollider(x+2.7,z+3.32,3.6,.35,{houseId:id});
    world.houses.push(house);
    registerInteractable({id:`door-${id}`,type:'door',icon:'🚪',label:`Abrir: ${name}`,x,z:z+4.0,radius:2.5,priority:230,action:()=>handleHouseDoor(house)});
    return house;
  }

  function addHouseInterior(house, type='home') {
    if(type==='home'){
      const bed=createFurniture(house,'bed',-2.85,-1.95,0,'Dormir');
      const sofa=createFurniture(house,'sofa',.85,-1.95,0x8b5cf6,'Sentar no sofá');
      const tv=createFurniture(house,'tv',2.85,-.25,0,'Assistir televisão');
      const fridge=createFurniture(house,'fridge',-3.05,1.55,0,'Abrir geladeira');
      const stove=createFurniture(house,'stove',-1.65,1.55,0,'Cozinhar');
      const sink=createFurniture(house,'sink',-.25,1.55,0,'Beber água');
      const shower=createFurniture(house,'shower',3.1,1.6,0,'Tomar banho');
      const chest=createFurniture(house,'chest',3.15,-2.05,0,'Abrir baú');
      const wardrobe=createFurniture(house,'wardrobe',2.95,.65,0,'Trocar roupa');
      box(3.5,.03,2.2,0xd6a65d,house.x-1.7,.17,house.z+1.45);
      box(3.2,.03,2.0,0x7057b7,house.x+1.1,.17,house.z-1.85);
      registerActivity(house,bed,'bed');registerActivity(house,sofa,'sofa');registerActivity(house,tv,'tv');registerActivity(house,fridge,'fridge');registerActivity(house,stove,'stove');registerActivity(house,sink,'sink');registerActivity(house,shower,'shower');registerActivity(house,chest,'chest');registerActivity(house,wardrobe,'wardrobe');
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
    registerInteractable({id:`exit-${house.id}`,type:'exit',icon:'🚪',label:'Sair da casa',x:house.x,z:house.z+2.65,radius:1.5,priority:240,houseId:house.id,action:()=>exitHouse()});
  }
  function registerActivity(house,item,activity){
    const priority=({stove:180,fridge:170,sink:165,bed:160,shower:155,tv:150,sofa:145,wardrobe:140,chest:120,shop:170,workshop:170})[activity]||100;
    registerInteractable({id:`${activity}-${house.id}`,type:'activity',activity,icon:activityIcon(activity),label:item.label,x:item.x,z:item.z,radius:1.75,priority,houseId:house.id,action:()=>useActivity(activity,house)});
  }
  function activityIcon(type){return ({bed:'🛏',sofa:'🛋',tv:'📺',fridge:'🍎',stove:'🍳',sink:'💧',shower:'🚿',chest:'🎁',shop:'🛒',workshop:'🛠',wardrobe:'👕'})[type]||'✋';}

  function createNPC(id,name,x,z,color,pathRadius=3){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);
    const hairPalette=[0x3b2415,0x111214,0xd9b45a,0xa4471f,0x2b3a55,0x8a8f99];
    const hash=String(id).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const hairColor=hairPalette[hash%hairPalette.length];
    const body=box(.78,1.12,.55,color,0,1.1,0,group);const head=box(.68,.68,.68,0xffd3a0,0,2.0,0,group);
    box(.72,.16,.58,hairColor,0,2.32,0,group);
    if(hash%2===0) box(.7,.1,.06,hairColor,0,1.98,.32,group);
    box(.08,.08,.04,0x111827,-.15,2.05,.36,group);box(.08,.08,.04,0x111827,.15,2.05,.36,group);
    box(.2,.1,.58,shadeColor(color,-30),0,.6,0,group);
    const leftArm=new THREE.Group(),rightArm=new THREE.Group(),leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
    leftArm.position.set(-.5,1.36,0);rightArm.position.set(.5,1.36,0);leftLeg.position.set(-.2,.72,0);rightLeg.position.set(.2,.72,0);
    group.add(leftArm,rightArm,leftLeg,rightLeg);
    box(.22,.68,.22,color,0,-.31,0,leftArm);box(.22,.68,.22,color,0,-.31,0,rightArm);
    box(.2,.62,.2,0xffd3a0,0,-.29,0,leftLeg);box(.2,.62,.2,0xffd3a0,0,-.29,0,rightLeg);
    const npc={id,name,x,z,baseX:x,baseZ:z,color,group,pathRadius,phase:Math.random()*6.28,friendship:state.friendship[id]||0,body,head,limbs:{leftArm,rightArm,leftLeg,rightLeg}};world.npcs.push(npc);
    registerInteractable({id:`npc-${id}`,type:'npc',icon:'💬',label:`Conversar com ${name}`,radius:2.7,priority:160,getPos:()=>({x:npc.group.position.x,z:npc.group.position.z}),action:()=>talkToNPC(npc)});
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
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);box(1.2,.72,.9,materials.wood,0,.36,0,group);const lid=box(1.25,.22,.95,secret?0xa855f7:0xffd84d,0,.84,0,group);const chest={id,x,z,group,lid,opened:!!state.flags[`chest_${id}`],secret};if(chest.opened)lid.rotation.x=-.6;registerInteractable({id:`chest-${id}`,type:'chest',icon:'🎁',label:secret?'Pegar presente secreto':'Abrir presente/baú',x,z,radius:2,priority:200,action:()=>openChest(chest)});return chest;
  }
  function createPlatform(x,y,z,w=3,d=3,color=0x8b5a2b){box(w,y,d,color,x,y/2,z);registerPlatform(x,z,w,d,y);}
  function createToyCar(x,z){
    const group=new THREE.Group();group.position.set(x,0,z);worldGroup.add(group);
    const body=mat(0x35a8ff,{roughness:.35,metalness:.25});
    box(1.86,.5,2.5,body,0,.4,0,group);
    box(1.5,.46,1.25,mat(0x2489e6,{roughness:.3,metalness:.3}),0,.86,-.15,group);
    box(1.42,.32,1.1,mat(0x0d1b2a,{roughness:.15,metalness:.4,transparent:true,opacity:.82}),0,.96,-.15,group);
    box(1.6,.14,2.62,mat(0x1c65b8,{roughness:.4}),0,.15,0,group);
    const headlight=mat(0xfff6c9,{emissive:0xfff2a0,emissiveIntensity:.9});
    box(.28,.16,.08,headlight,-.62,.42,1.24,group); box(.28,.16,.08,headlight,.62,.42,1.24,group);
    for(const p of [[-.82,.22,-.78],[.82,.22,-.78],[-.82,.22,.78],[.82,.22,.78]]){const wheel=cylinder(.32,.26,0x111827,p[0],p[1],p[2],group,14);wheel.rotation.z=Math.PI/2;}
    world.vehicle={x,z,group};registerInteractable({id:'toy-car',type:'vehicle',icon:'🚗',label:'Entrar no carro',x,z,radius:2.4,action:()=>enterVehicle()});
  }

  function createWaypointMarker(){
    const group=new THREE.Group();
    const beam=box(.32,6,.32,0x38d8ff,0,3,0,group);beam.material.transparent=true;beam.material.opacity=.48;
    const top=new THREE.Mesh(new THREE.OctahedronGeometry(.65,0),mat(0x6ee94b,{emissive:0x35c728,emissiveIntensity:.75}));top.position.y=6.4;group.add(top);
    group.visible=false;worldGroup.add(group);world.waypointMarker=group;updateWaypointMarker();
  }
  function updateWaypointMarker(){
    if(!world.waypointMarker)return;
    const wp=state.waypoint;world.waypointMarker.visible=!!wp;
    if(wp)world.waypointMarker.position.set(wp.x,0,wp.z);
  }
  function createAthleticsGym(){
    const gym={x:45,z:78,startX:26,finishX:76,lane1Z:73,lane2Z:78};world.gym=gym;
    box(58,.16,15,0xc46a3b,51,.08,75.5);box(54,.06,3.2,0xf4d35e,51,.18,73);box(54,.06,3.2,0x5ad8ff,51,.18,78);
    for(let x=28;x<=76;x+=6){box(.12,.05,14,0xffffff,x,.22,75.5);}
    box(.45,3.2,15,0xffffff,gym.finishX,1.6,75.5);box(12,3.6,6,0x315779,45,1.8,88);box(10,.7,5,0xffd84d,45,3.95,88);
    createLamp(27,67);createLamp(75,67);createLamp(27,84);createLamp(75,84);
    registerInteractable({id:'athletics-gym',type:'race',icon:'🏃',label:'Abrir desafios do ginásio',x:45,z:84,radius:3.2,priority:120,action:()=>openRaceCenter()});
  }
  function createSizeChallenges(){
    // Passagem mini
    box(.7,2.5,5,0x64748b,-41,1.25,42);box(.7,2.5,5,0x64748b,-35,1.25,42);box(6.7,.65,5,0x64748b,-38,2.2,42);
    registerInteractable({id:'mini-tunnel',type:'challenge',icon:'◱',label:'Passagem pequena',x:-38,z:44.5,radius:3,priority:110,action:()=>{
      if(player.scaleMode!=='mini'){toast('Use o botão MINI para passar.','warn',2200);return;}player.z=39.5;setFlag('miniPassage');addXP(25);toast('Passagem mini concluída!','good');
    }});
    // Túnel baixo
    box(.7,1.55,4,0x8b5a2b,-56,.78,24);box(.7,1.55,4,0x8b5a2b,-50,.78,24);box(6.7,.45,4,0x8b5a2b,-53,1.55,24);
    registerInteractable({id:'crouch-tunnel',type:'challenge',icon:'▼',label:'Túnel baixo',x:-53,z:26,radius:3,priority:110,action:()=>{
      if(!player.crouched){toast('Use ABAIXAR para entrar.','warn',2200);return;}player.z=21.5;setFlag('crouchPassage');addXP(25);toast('Túnel baixo concluído!','good');
    }});
    // Portão grande
    box(8,4,.6,0x6b7280,36,2,-35);box(1,5,1,0x94a3b8,31.5,2.5,-35);box(1,5,1,0x94a3b8,40.5,2.5,-35);
    registerInteractable({id:'giant-gate',type:'challenge',icon:'⬡',label:'Abrir portão pesado',x:36,z:-32,radius:3.2,priority:110,action:()=>{
      if(player.scaleMode!=='giant'){toast('Use GRANDE para abrir o portão.','warn',2200);return;}setFlag('giantGate');addXP(35);toast('Portão pesado aberto!','good');
    }});
  }

  function createSkyDome(){
    const c=document.createElement('canvas'); c.width=8; c.height=256;
    const ctx=c.getContext('2d'); const g=ctx.createLinearGradient(0,0,0,256);
    g.addColorStop(0,'#4a9dff'); g.addColorStop(.45,'#8fd0ff'); g.addColorStop(.72,'#d8f0ff'); g.addColorStop(1,'#eef8f2');
    ctx.fillStyle=g; ctx.fillRect(0,0,8,256);
    const tex=new THREE.CanvasTexture(c); tex.magFilter=THREE.LinearFilter; tex.minFilter=THREE.LinearFilter;
    const sky=new THREE.Mesh(new THREE.SphereGeometry(400,16,16),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false}));
    scene.add(sky);
    // sol visível (disco emissivo simples, não projeta sombra)
    const sun=new THREE.Mesh(new THREE.CircleGeometry(18,24),new THREE.MeshBasicMaterial({color:0xfff3c4,transparent:true,opacity:.9,depthWrite:false,fog:false}));
    sun.position.set(160,150,-260); sun.lookAt(0,80,0); scene.add(sun);
    // nuvens simples: alguns blocos brancos achatados flutuando (leve, com deriva real)
    const cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,fog:false});
    world.clouds=[];
    for(let i=0;i<9;i++){
      const cx=(Math.random()-.5)*380,cz=(Math.random()-.5)*380,cy=55+Math.random()*30;
      const cloud=new THREE.Group();
      for(let k=0;k<3;k++){const puff=new THREE.Mesh(new THREE.SphereGeometry(4+Math.random()*3,7,6),cloudMat);puff.position.set(k*4.5-4.5,Math.random()*1.5,Math.random()*2);cloud.add(puff);}
      cloud.position.set(cx,cy,cz); cloud.scale.setScalar(1.4+Math.random()*1.2); scene.add(cloud);
      world.clouds.push({group:cloud,speed:1.2+Math.random()*1.8});
    }
  }
  function updateClouds(dt){
    if(textures.water){textures.water.offset.x=(textures.water.offset.x+dt*.012)%1;textures.water.offset.y=(textures.water.offset.y+dt*.007)%1;}
    if(!world.clouds)return;
    for(const c of world.clouds){c.group.position.x+=c.speed*dt;if(c.group.position.x>210)c.group.position.x=-210;}
  }

  function createVoxelMushroom(x,z,scale=1,color=0xe34242){
    const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);
    const stem=mat(0xe8c78f,{roughness:.82});box(1.35*scale,3.2*scale,1.35*scale,stem,0,1.6*scale,0,g);
    const capMat=mat(color,{roughness:.58});const light=mat(0xfff4df,{roughness:.5});
    box(4.3*scale,1.0*scale,3.6*scale,capMat,0,3.4*scale,0,g);box(3.4*scale,.8*scale,4.3*scale,capMat,0,3.45*scale,0,g);box(2.7*scale,.65*scale,2.7*scale,shadeColor(color,18),0,4.05*scale,0,g);
    [[-1.25,.35],[1.1,.5],[0,-1.1],[.45,1.25]].forEach(([sx,sz])=>box(.62*scale,.16*scale,.62*scale,light,sx*scale,4.42*scale,sz*scale,g));
    world.landmarks.push(g);return g;
  }
  function iconTexture(symbol,bg='#f5c739',fg='#10263f'){
    const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,256,256);ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=18;ctx.strokeRect(12,12,232,232);ctx.fillStyle=fg;ctx.font='900 150px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbol,128,137);const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;return tex;
  }
  function createChallengeCube(x,y,z,symbol='◆',color='#ffd33f'){const material=new THREE.MeshStandardMaterial({map:iconTexture(symbol,color),roughness:.5,emissive:0x5c3f00,emissiveIntensity:.16});const cube=box(1.75,1.75,1.75,material,x,y,z);cube.userData.floatBase=y;world.landmarks.push(cube);return cube;}
  function createPortalArch(x,z){
    const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);const stone=mat(0x46546c,{roughness:.55,metalness:.08}),glow=mat(0x28ddff,{emissive:0x00a9d6,emissiveIntensity:1.6,roughness:.15});
    box(1.2,7,1.2,stone,-3,3.5,0,g);box(1.2,7,1.2,stone,3,3.5,0,g);box(7.2,1.2,1.2,stone,0,7,0,g);
    for(let i=0;i<9;i++){const ang=Math.PI*i/8;const p=new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.35),glow);p.position.set(Math.cos(ang)*2.35,3.3+Math.sin(ang)*2.35,.25);p.rotation.z=-ang;g.add(p);}
    addGlow(x,3.4,z,0x2de8ff,14);world.landmarks.push(g);return g;
  }
  function createPlayground(x,z){
    const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);box(8,.18,6,0x64bf49,0,.09,0,g);box(1.2,2.2,1.2,0x3b82f6,-2,1.1,0,g);box(1.2,2.2,1.2,0xf97316,2,1.1,0,g);
    const slide=box(1.35,.22,4.2,0xfacc15,1.7,1.1,1.5,g);slide.rotation.x=-.42;for(const sx of [-2.4,2.4]){box(.18,3.4,.18,materials.wood,sx,1.7,-2,g);box(.18,3.4,.18,materials.wood,sx+1.1,1.7,-2,g);}box(5.3,.18,.18,0xef4444,.55,3.25,-2,g);world.landmarks.push(g);return g;
  }
  function createFountain(x,z){const g=new THREE.Group();g.position.set(x,0,z);worldGroup.add(g);cylinder(3,.32,0x9aa9b8,0,.16,0,g,16);cylinder(2.35,.22,0x31b7e8,0,.36,0,g,16);cylinder(.45,2.3,0xb8c4cf,0,1.35,0,g,12);const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),mat(0x42e7ff,{emissive:0x05a8cc,emissiveIntensity:1.2,roughness:.2}));orb.position.y=2.8;g.add(orb);addGlow(x,2.8,z,0x42e7ff,7);world.landmarks.push(g);return g;}
  function createAwning(x,z,color=0xef4444,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;worldGroup.add(g);for(let i=-3;i<=3;i++)box(.55,.18,1.25,i%2?0xfff7e8:color,i*.55,2.15,0,g);world.landmarks.push(g);return g;}
  function createDistrictVisuals(){
    [[-13,34,1.05,0xe64343],[-37,35,.82,0x4b78e8],[14,-34,.95,0xec4c4c],[40,-5,.78,0x8b5cf6],[-70,-20,1.35,0xdf3f3f],[-82,-76,.9,0x5c7ce2],[72,28,1.1,0xe94d4d],[92,22,.82,0x8b5cf6]].forEach(v=>createVoxelMushroom(...v));
    createPlayground(-8,-38);createFountain(0,-2);createPortalArch(88,51);createChallengeCube(36,1.3,-27,'◆','#ffd43b');createChallengeCube(66,1.3,-50,'★','#53d8ff');createChallengeCube(-43,1.3,35,'◈','#ff756f');createAwning(-22,-14,0xef4444,0);createAwning(22,-14,0x2563eb,0);
  }

  function buildWorld(){
    worldGroup=new THREE.Group();scene.add(worldGroup);
    const ground=box(250,.3,250,materials.grass,0,-.15,0);ground.receiveShadow=true;
    createSkyDome();
    scene.background=new THREE.Color(0xbfe4ff);scene.fog=new THREE.Fog(0xcdeeff,170,430);
    // roads
    createRoad(0,0,18,210);createRoad(0,0,210,18);createRoad(-55,-55,9,105);createRoad(55,48,9,92);
    createDistrictVisuals();
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
    createNPC('nino','Nino',4,3,0xffd84d,4);createNPC('luna','Luna',-22,8,0xff72b6,4);createNPC('teo','Teo',22,7,0x54c7ff,4);createNPC('bia','Bia',-10,-10,0x8ee15c,3);createNPC('maya','Maya',65,54,0xa66bff,3);
    // farm and garage
    createFenceLine(38,22,65,22,10);createFenceLine(65,22,65,43,8);for(let x=42;x<62;x+=4)for(let z=27;z<40;z+=4){box(2.8,.12,2.8,0x75451f,x,.06,z);box(.18,.55,.18,0x54c93e,x,.33,z);}
    createToyCar(52,48);registerInteractable({id:'job-board',type:'job',icon:'📦',label:'Central de trabalhos',x:49,z:45,radius:2.3,action:openJobCenter});world.deliveryPoint={x:65,z:54};
    createAthleticsGym();createSizeChallenges();createWaypointMarker();
    // placas de bairro/orientação (somente decorativas, não alteram colisão nem interação)
    createSignpost(12,4,'Vila do Sol',Math.PI/2); createSignpost(-30,-5,'Mercado e Oficina',Math.PI/2);
    createSignpost(-62,-30,'Floresta',Math.PI*.15); createSignpost(48,26,'Fazenda e Garagem',-Math.PI/2);
    createSignpost(70,40,'Castelo',Math.PI*.7); createSignpost(-58,50,'Lago',Math.PI*.4);
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
    addXP(8);toast(resource.type==='wood'?'Madeira coletada!':'Pedra coletada!','good');beep(620);vibrate(25);evaluateMissions();checkActiveJob();saveState();
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
      openModal(house.name,`<p>Esta casa custa <b>${house.price} moedas</b>. Você pode comprar ou conquistar no ginásio.</p><div class="modal-actions"><button class="btn primary" data-buy-house>Comprar</button><button class="btn" data-race-house>Disputar em corrida</button><button class="btn" data-cancel>Cancelar</button></div>`,root=>{
        $('[data-buy-house]',root).onclick=()=>{if(state.profile.coins<house.price){toast('Moedas insuficientes.','warn');return;}addCoins(-house.price);state.houses[house.id]={...(record||{}),owned:true,locked:false,price:house.price};setFlag('boughtHouse');awardMedal('Nova Propriedade');saveState(true);closeModal();handleHouseDoor(house);};
        $('[data-race-house]',root).onclick=()=>{closeModal();startRace('sprint',world.npcs[0],house.id);};
        $('[data-cancel]',root).onclick=closeModal;
      });
      return;
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

  function openHomeChest(){
    const keys=[['wood','Madeira','🪵'],['stone','Pedra','🪨'],['food','Comida','🍎'],['water','Água','💧'],['crystals','Cristais','💎']];
    const rows=keys.map(([key,name,icon])=>`<div class="storage-row"><span>${icon} ${name}</span><b>Mochila ${state.inventory[key]||0} • Baú ${state.homeStorage[key]||0}</b><div><button data-store="${key}">Guardar 1</button><button data-take="${key}">Retirar 1</button></div></div>`).join('');
    openModal('Baú da Casa do Otthos',`<p>Guarde recursos sem abrir o inventário geral.</p><div class="storage-list">${rows}</div>`,root=>{
      $$('[data-store]',root).forEach(btn=>btn.onclick=()=>{const key=btn.dataset.store;if((state.inventory[key]||0)<=0){toast('Você não tem esse item.','warn');return;}state.inventory[key]--;state.homeStorage[key]=(state.homeStorage[key]||0)+1;saveState(true);openHomeChest();});
      $$('[data-take]',root).forEach(btn=>btn.onclick=()=>{const key=btn.dataset.take;if((state.homeStorage[key]||0)<=0){toast('O baú não tem esse item.','warn');return;}state.homeStorage[key]--;state.inventory[key]=(state.inventory[key]||0)+1;saveState(true);openHomeChest();});
    });
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
    }else if(type==='chest')openHomeChest();
    else if(type==='shop')openShop();
    else if(type==='workshop')openWorkshop();
    else if(type==='wardrobe')openAvatarStudio();
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

  function friendshipTier(value){ return value>=60?'Melhor amigo':value>=30?'Amigo':value>=10?'Conhecido':'Vizinho'; }
  function changeFriendship(npc, amount, message){
    state.friendship[npc.id]=clamp((state.friendship[npc.id]||0)+amount,0,100);npc.friendship=state.friendship[npc.id];
    if(npc.id==='nino')setFlag('talkedNeighbor');
    if(message)toast(message,'good');addXP(Math.max(2,amount*2));addReputation(Math.max(1,Math.floor(amount/2)));evaluateMissions();saveState();
  }
  function talkToNPC(npc){
    if(npc.id==='maya'&&state.flags.deliveryActive&&player.vehicle&&distance2D(player,npc)<3.5){state.flags.deliveryActive=false;state.inventory.package=0;setFlag('deliveryDone');if(state.career.activeJob?.id==='delivery')completeActiveJob();else{addCoins(120);addReputation(30);}toast('Entrega concluída para Maya!','good',2400);}
    const value=state.friendship[npc.id]||0;
    const greetings={nino:'Sou Nino. A vila tem casas, corridas e desafios esperando por você.',luna:'Quero ver sua casa cheia de estilo! Vamos decorar?',teo:'Trabalho e criatividade transformam materiais em conquistas.',bia:'Há cristais e caminhos secretos esperando por você.',maya:'Na garagem sempre existe um trabalho para quem quer crescer.'};
    openModal(npc.name,`<div class="dialogue-box">${greetings[npc.id]||'Olá, vizinho!'}</div><div class="friend-meter"><span>Amizade — ${friendshipTier(value)}</span><b>${value}/100</b><i style="width:${value}%"></i></div><div class="choice-grid social-actions">
      <button class="choice" data-social="talk"><b>💬 Conversar</b><span>Conhecer melhor</span></button>
      <button class="choice" data-social="joke"><b>😄 Contar piada</b><span>Aumenta diversão</span></button>
      <button class="choice" data-social="gift"><b>🎁 Dar presente</b><span>Usa comida ou cristal</span></button>
      <button class="choice" data-social="argue"><b>😠 Discutir</b><span>Diminui amizade</span></button>
      <button class="choice" data-social="race"><b>🏃 Desafiar corrida</b><span>Corrida de velocidade</span></button>
      <button class="choice" data-social="coinrace"><b>🪙 Pega-moedas</b><span>Quem coleta mais?</span></button>
      <button class="choice" data-social="house"><b>🏠 Disputar casa</b><span>Ganhe uma propriedade</span></button>
      <button class="choice" data-social="job"><b>💼 Perguntar trabalho</b><span>Ganhar moedas</span></button>
      <button class="choice" data-social="invite"><b>🏡 Convidar para casa</b><span>Precisa de amizade 10</span></button>
    </div>`,root=>{
      $$('[data-social]',root).forEach(btn=>btn.onclick=()=>{
        const action=btn.dataset.social;
        if(action==='talk'){changeFriendship(npc,2,`${npc.name} gostou da conversa.`);closeModal();}
        else if(action==='joke'){state.social.jokes++;state.needs.fun=clamp(state.needs.fun+12,0,100);changeFriendship(npc,3,`${npc.name} riu da piada!`);closeModal();}
        else if(action==='gift'){
          if(state.inventory.food>0){state.inventory.food--;state.social.gifts++;changeFriendship(npc,7,'Presente entregue!');closeModal();}
          else if(state.inventory.crystals>0){state.inventory.crystals--;state.social.gifts++;changeFriendship(npc,10,'Cristal presenteado!');closeModal();}
          else toast('Você não tem comida nem cristal para presentear.','warn');
        } else if(action==='argue'){
          state.social.arguments=(state.social.arguments||0)+1;state.friendship[npc.id]=clamp((state.friendship[npc.id]||0)-5,0,100);state.profile.reputation=Math.max(0,state.profile.reputation-1);state.needs.fun=clamp(state.needs.fun+4,0,100);saveState(true);updateHUD();closeModal();toast(`${npc.name} não gostou da discussão.`,'warn');
        } else if(action==='race'){closeModal();startRace('sprint',npc);}
        else if(action==='coinrace'){closeModal();startRace('coins',npc);}
        else if(action==='house'){closeModal();openHouseChallenge(npc);}
        else if(action==='job'){closeModal();openJobCenter(npc.id);}
        else if(action==='invite'){
          if((state.friendship[npc.id]||0)<10){toast('A amizade precisa chegar a 10.','warn');return;}
          if(!state.social.invited.includes(npc.id))state.social.invited.push(npc.id);changeFriendship(npc,2,`${npc.name} aceitou visitar sua casa!`);closeModal();
        }
      });
    });
  }

  function openHouseChallenge(npc){
    const options=world.houses.filter(h=>!h.publicBuilding&&!state.houses[h.id]?.owned);
    if(!options.length){toast('Você já conquistou todas as casas disponíveis.','good');return;}
    openModal('Disputa de propriedade',`<p>Vença ${npc.name} numa corrida para conquistar a casa escolhida.</p><div class="choice-grid">${options.map(h=>`<button class="choice" data-house-race="${h.id}"><b>🏠 ${h.name}</b><span>Prêmio: propriedade destrancada</span></button>`).join('')}</div>`,root=>{
      $$('[data-house-race]',root).forEach(btn=>btn.onclick=()=>{const id=btn.dataset.houseRace;closeModal();startRace('sprint',npc,id);});
    });
  }
  function openRaceCenter(npc=null){
    const name=npc?.name||'um corredor da vila';
    openModal('Ginásio de Atletismo',`<p>Desafie ${name}. Os controles normais continuam funcionando.</p><div class="choice-grid"><button class="choice" data-race="sprint"><b>🏃 Corrida de velocidade</b><span>Chegue primeiro à linha final</span></button><button class="choice" data-race="coins"><b>🪙 Corrida pega-moedas</b><span>Colete 8 moedas antes do rival</span></button></div>`,root=>{
      $$('[data-race]',root).forEach(btn=>btn.onclick=()=>{closeModal();startRace(btn.dataset.race,npc||world.npcs[0]);});
    });
  }
  function createRaceOpponent(npc){
    const group=new THREE.Group();worldGroup.add(group);box(.78,1.12,.55,npc?.color||0xff72b6,0,1.1,0,group);box(.68,.68,.68,0xffd3a0,0,2.0,0,group);box(.08,.08,.04,0x111827,-.15,2.05,.36,group);box(.08,.08,.04,0x111827,.15,2.05,.36,group);return group;
  }
  function clearRaceObjects(){
    if(activeRace?.opponent)worldGroup.remove(activeRace.opponent);
    for(const coin of world.raceCoins)worldGroup.remove(coin.mesh);
    world.raceCoins=[];
  }
  function spawnRaceCoins(){
    world.raceCoins=[];
    for(let i=0;i<12;i++){
      const x=30+i*3.7,z=i%2?73:78;const mesh=cylinder(.35,.12,0xffd84d,x,.7,z,worldGroup,18);mesh.rotation.x=Math.PI/2;world.raceCoins.push({x,z,mesh,got:false});
    }
  }
  function startRace(type,npc,housePrize=null){
    if(activeRace){toast('Termine o desafio atual.','warn');return;}
    if(currentHouse)exitHouse();
    const gym=world.gym;if(!gym){toast('Ginásio ainda não carregou.','warn');return;}
    const opponent=createRaceOpponent(npc||world.npcs[0]);opponent.position.set(gym.startX,0,gym.lane2Z);
    activeRace={type,npcId:npc?.id||'nino',npcName:npc?.name||'Nino',housePrize,startAt:performance.now()+3000,started:false,opponent,opponentX:gym.startX,opponentScore:0,playerScore:0,timeLimit:type==='coins'?45:30,lastOpponentCoin:0};
    player.x=gym.startX;player.z=gym.lane1Z;player.y=0;player.vx=player.vz=player.vy=0;cameraYaw=Math.PI/2;cameraMode='openworld';state.waypoint={id:'gym',name:'Ginásio',x:gym.x,z:gym.z};updateWaypointMarker();
    if(type==='coins')spawnRaceCoins();
    els.raceBadge.hidden=false;els.raceTitle.textContent=type==='coins'?'Pega-moedas':housePrize?'Corrida pela casa':'Corrida de velocidade';els.raceStatus.textContent='3...';
    toast(`Desafio contra ${activeRace.npcName}!`,'good',2200);saveState(true);
  }
  function finishRace(won){
    if(!activeRace)return;const race=activeRace;clearRaceObjects();activeRace=null;els.raceBadge.hidden=true;
    if(won){
      state.races.wins++;if(race.type==='coins')state.races.coinWins++;
      addCoins(race.type==='coins'?90:120);addReputation(18);addXP(70);setFlag(race.type==='coins'?'wonCoinRace':'wonRace');
      if(race.housePrize){const old=state.houses[race.housePrize]||{};state.houses[race.housePrize]={...old,owned:true,locked:false};state.races.houseWins++;setFlag('wonHouseChallenge');setFlag('boughtHouse');awardMedal('Casa Conquistada');}
      toast(race.housePrize?'Você venceu e conquistou a casa!':'Você venceu o desafio!','good',2600);
    }else{state.races.losses++;toast(`${race.npcName} venceu. Tente novamente!`,'warn',2400);}
    player.x=45;player.z=82;player.y=0;player.vx=player.vz=player.vy=0;state.waypoint=null;updateWaypointMarker();saveState(true);evaluateMissions();
  }
  function updateRace(dt){
    if(!activeRace)return;const race=activeRace,gym=world.gym,now=performance.now();
    if(now<race.startAt){els.raceStatus.textContent=`${Math.max(1,Math.ceil((race.startAt-now)/1000))}...`;return;}
    if(!race.started){race.started=true;race.startedAt=now;els.raceStatus.textContent='VALENDO!';beep(880,100);}
    const elapsed=(now-race.startedAt)/1000;race.timeLeft=Math.max(0,race.timeLimit-elapsed);
    if(race.type==='sprint'){
      race.opponentX+=6.15*dt;race.opponent.position.x=race.opponentX;race.opponent.position.z=gym.lane2Z;race.opponent.rotation.y=Math.PI/2;
      els.raceStatus.textContent=`Chegue em ${gym.finishX}m • ${race.timeLeft.toFixed(1)}s`;
      if(player.x>=gym.finishX)finishRace(true);else if(race.opponentX>=gym.finishX||race.timeLeft<=0)finishRace(false);
    }else{
      race.opponent.position.x=lerp(race.opponent.position.x,gym.startX+Math.min(46,elapsed*1.1),dt*2);race.opponent.position.z=gym.lane2Z;
      if(elapsed-race.lastOpponentCoin>3.2){race.lastOpponentCoin=elapsed;race.opponentScore++;}
      for(const coin of world.raceCoins){if(coin.got)continue;coin.mesh.rotation.y+=dt*5;if(Math.hypot(player.x-coin.x,player.z-coin.z)<1.25){coin.got=true;coin.mesh.visible=false;race.playerScore++;beep(920,45);}}
      els.raceStatus.textContent=`Você ${race.playerScore}/8 • ${race.npcName} ${race.opponentScore}/8 • ${Math.ceil(race.timeLeft)}s`;
      if(race.playerScore>=8)finishRace(true);else if(race.opponentScore>=8)finishRace(false);else if(race.timeLeft<=0)finishRace(race.playerScore>race.opponentScore);
    }
  }


  const JOBS = [
    {id:'delivery',title:'Entregador da Vila',icon:'📦',reward:120,rep:30,description:'Pegue o carrinho e entregue o pacote para Maya.'},
    {id:'gather',title:'Ajudante da Oficina',icon:'🪵',reward:90,rep:18,description:'Colete 3 madeiras e 2 pedras.',target:{wood:3,stone:2}},
    {id:'crystals',title:'Explorador de Cristais',icon:'💎',reward:140,rep:24,description:'Colete 3 novos cristais.',target:{crystals:3}},
    {id:'builder',title:'Decorador do Bairro',icon:'🧱',reward:110,rep:20,description:'Construa 2 objetos perto de uma casa.',target:{builds:2}}
  ];
  function activeJobProgress(job){
    if(!job)return{percent:0,label:'0%'};
    const start=job.start||{};
    if(job.id==='delivery')return{percent:state.flags.deliveryDone?100:(player.vehicle?55:25),label:state.flags.deliveryDone?'concluído':player.vehicle?'Leve o pacote até Maya':'Pegue o carrinho'};
    if(job.id==='gather'){const w=Math.max(0,state.inventory.wood-(start.wood||0)),r=Math.max(0,state.inventory.stone-(start.stone||0));return{percent:clamp((w/3+r/2)*50,0,100),label:`${Math.min(w,3)}/3 madeiras • ${Math.min(r,2)}/2 pedras`};}
    if(job.id==='crystals'){const n=Math.max(0,state.inventory.crystals-(start.crystals||0));return{percent:clamp(n/3*100,0,100),label:`${Math.min(n,3)}/3 cristais`};}
    if(job.id==='builder'){const n=Math.max(0,state.builds.length-(start.builds||0));return{percent:clamp(n/2*100,0,100),label:`${Math.min(n,2)}/2 construções`};}
    return{percent:0,label:'Em andamento'};
  }
  function openJobCenter(){
    const active=state.career.activeJob;
    openModal('Central de Trabalhos',`${active?`<div class="roleplay-card active-job"><small>TRABALHO ATIVO</small><h3>${active.title}</h3><p>${active.description}</p></div>`:'<p>Escolha uma atividade para ganhar moedas, reputação e experiência profissional.</p>'}<div class="choice-grid">${JOBS.map(j=>`<button class="choice" data-job="${j.id}" ${active?'disabled':''}><b>${j.icon} ${j.title}</b><span>${j.description}<br><strong>${j.reward} moedas</strong></span></button>`).join('')}</div>`,root=>{
      $$('[data-job]',root).forEach(btn=>btn.onclick=()=>{const job=JOBS.find(j=>j.id===btn.dataset.job);startJob(job);closeModal();});
    });
  }
  function startJob(job){
    if(!job||state.career.activeJob){toast('Conclua o trabalho atual primeiro.','warn');return;}
    const inv=state.inventory;
    state.career.activeJob={...job,start:{wood:inv.wood,stone:inv.stone,crystals:inv.crystals,builds:state.builds.length}};
    if(job.id==='delivery'){state.flags.deliveryActive=true;state.inventory.package=1;}
    toast(`Trabalho iniciado: ${job.title}`,'good',2200);saveState();updateMissionHUD();
  }
  function completeActiveJob(){
    const job=state.career.activeJob;if(!job)return;
    addCoins(job.reward);addReputation(job.rep);state.career.completed++;state.career.xp+=100;state.career.level=Math.floor(state.career.xp/300)+1;state.career.title=state.career.level>=4?'Profissional da Vila':state.career.level>=2?'Ajudante da Vila':'Morador da Vila';state.career.activeJob=null;setFlag('completedJob');evaluateMissions();updateMissionHUD();toast(`Trabalho concluído! +${job.reward} moedas`,'good',2600);saveState();
  }
  function checkActiveJob(){
    const job=state.career.activeJob;if(!job)return;
    const start=job.start||{};
    if(job.id==='gather'&&state.inventory.wood-(start.wood||0)>=3&&state.inventory.stone-(start.stone||0)>=2)completeActiveJob();
    else if(job.id==='crystals'&&state.inventory.crystals-(start.crystals||0)>=3)completeActiveJob();
    else if(job.id==='builder'&&state.builds.length-(start.builds||0)>=2)completeActiveJob();
  }

  function startDeliveryJob(){
    if(state.flags.deliveryActive){toast('Você já está fazendo uma entrega.','warn');return;}state.flags.deliveryActive=true;state.inventory.package=1;toast('Pacote recebido. Leve até Maya!','good',2200);saveState();
  }
  let fxParticles=[];
  const FX_MAX_PARTICLES=40;
  function spawnDust(x,z,color=0xcfc6a8){
    if(fxParticles.length>=FX_MAX_PARTICLES){const oldest=fxParticles.shift();worldGroup.remove(oldest.mesh);oldest.mesh.geometry.dispose();oldest.mesh.material.dispose();}
    const mesh=new THREE.Mesh(new THREE.CircleGeometry(.2+Math.random()*.12,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2; mesh.position.set(x,.06,z); worldGroup.add(mesh);
    fxParticles.push({mesh,life:.55,vx:(Math.random()-.5)*1.1,vz:(Math.random()-.5)*1.1});
  }
  function updateFX(dt){
    for(let i=fxParticles.length-1;i>=0;i--){
      const p=fxParticles[i]; p.life-=dt;
      p.mesh.position.x+=p.vx*dt; p.mesh.position.z+=p.vz*dt;
      p.mesh.scale.setScalar(1+(.55-p.life)*2.2);
      p.mesh.material.opacity=Math.max(0,p.life/.55*.5);
      if(p.life<=0){worldGroup.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();fxParticles.splice(i,1);}
    }
  }
  let engineAudio=null,driftSoundCooldown=0,vehicleImpactCount=0;
  function startEngineSound(){
    if(!state.settings.sound||engineAudio)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      const ctx=beep.ctx||(beep.ctx=new Ctx());
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sawtooth';osc.frequency.value=65;gain.gain.value=0;
      osc.connect(gain);gain.connect(ctx.destination);osc.start();
      engineAudio={ctx,osc,gain};gain.gain.linearRampToValueAtTime(.018,ctx.currentTime+.18);
    }catch(_){}
  }
  function stopEngineSound(){
    if(!engineAudio)return;
    try{engineAudio.gain.gain.linearRampToValueAtTime(0,engineAudio.ctx.currentTime+.12);engineAudio.osc.stop(engineAudio.ctx.currentTime+.16);}catch(_){}
    engineAudio=null;
  }
  function updateVehicleFX(dt){
    if(!player.vehicle){if(engineAudio)stopEngineSound();return;}
    const car=player.car,wheels=vehicleVisual.userData.wheels,fronts=vehicleVisual.userData.frontWheels;
    const spin=car.speed*dt*3.4;
    wheels.forEach(w=>w.rotation.x-=spin);
    fronts.forEach(h=>h.rotation.y=lerp(h.rotation.y,car.steerVisual*.5,Math.min(1,dt*10)));
    const speedDelta=car.speed-(car._prevSpeed??car.speed);car._prevSpeed=car.speed;
    const targetTiltX=clamp(-speedDelta*.55,-.13,.13);
    vehicleVisual.rotation.x=lerp(vehicleVisual.rotation.x,targetTiltX,Math.min(1,dt*6));
    vehicleVisual.rotation.z=lerp(vehicleVisual.rotation.z,-car.steerVisual*car.drift*.4,Math.min(1,dt*6));
    if(car.drift>.4&&Math.abs(car.speed)>3){
      updateVehicleFX.acc=(updateVehicleFX.acc||0)+dt;
      if(updateVehicleFX.acc>.045){updateVehicleFX.acc=0;spawnDust(player.x-Math.sin(car.heading)*1.05,player.z-Math.cos(car.heading)*1.05);}
      driftSoundCooldown-=dt;if(driftSoundCooldown<=0){driftSoundCooldown=.5;beep(180,55,'sawtooth');}
    }
    if(els.vehicleBadge)els.vehicleBadge.textContent=`🚗 ${Math.round(Math.abs(car.speed)*6)} km/h${sprintRequested()?' • TURBO':''} — AÇÃO para sair`;
    if(!state.settings.sound&&engineAudio)stopEngineSound();
    else if(state.settings.sound&&!engineAudio)startEngineSound();
    else if(state.settings.sound&&engineAudio){
      const freq=68+Math.abs(car.speed)*11.5;
      try{engineAudio.osc.frequency.setTargetAtTime(freq,engineAudio.ctx.currentTime,.05);}catch(_){}
    }
  }

  function updateVehicleControlsUI(){
    els.secondaryActions?.classList.toggle('vehicle-hidden',player.vehicle);
    els.jumpBtn?.classList.toggle('vehicle-disabled',player.vehicle);
    els.specialBtn?.classList.toggle('vehicle-horn',player.vehicle);
    const specialIcon=$('b',els.specialBtn),specialLabel=$('span',els.specialBtn);
    if(specialIcon)specialIcon.textContent=player.vehicle?'📣':'🔥';
    if(specialLabel)specialLabel.textContent=player.vehicle?'Buzina':'Poder';
    if(els.specialBtn)els.specialBtn.setAttribute('aria-label',player.vehicle?'Buzina do carro':'Poder do Otthos');
  }
  function vehicleHorn(){
    if(!player.vehicle||paused||!els.modal.hidden)return;
    const t=performance.now();if(t<player.hornUntil)return;player.hornUntil=t+360;
    beep(410,95,'square');setTimeout(()=>{if(player.vehicle)beep(520,70,'square');},105);vibrate(18);
    vehicleVisual.scale.set(1.015,.99,1.015);setTimeout(()=>vehicleVisual?.scale?.set(1,1,1),120);
  }
  function enterVehicle(){
    if(player.vehicle)return;
    player.preVehicleAbilities={scaleMode:player.scaleMode,crouched:player.crouched};
    // Estados de ações domésticas/personagem não podem congelar a física do carro.
    player.sitUntil=0;player.attackUntil=0;player.spinUntil=0;player.jumpBuffer=0;player.vy=0;player.grounded=true;
    clearMovementInputs();
    player.vehicle=true;player.car.heading=player.facing;player.car.speed=0;player.car.steerVisual=0;player.car.drift=0;player.car._prevSpeed=0;
    player.scaleMode='normal';player.crouched=false; // carro nunca herda escala/agachamento do personagem
    syncPlayerRootScale(); // imediato: não espera o próximo frame para corrigir a raiz
    updateAbilityUI();
    if(playerModel)playerModel.visible=false; if(avatarLayer)avatarLayer.visible=false;
    vehicleVisual.visible=true;vehicleVisual.scale.set(1,1,1);vehicleVisual.rotation.set(0,0,0);
    if(world.vehicle)world.vehicle.group.visible=false;els.vehicleBadge.hidden=false;updateVehicleControlsUI();updateRunUI();setFlag('gotVehicle');toast('Carro ligado! Use o manche para dirigir.','good');startEngineSound();saveState();
  }
  function exitVehicle(silent=false){
    if(!player.vehicle)return;
    player.vehicle=false;player.vx=0;player.vz=0;player.car.speed=0;player.car._prevSpeed=0;clearMovementInputs();
    const prior=player.preVehicleAbilities||state.abilities||{scaleMode:'normal',crouched:false};
    player.scaleMode=['mini','normal','giant'].includes(prior.scaleMode)?prior.scaleMode:'normal';player.crouched=!!prior.crouched;player.preVehicleAbilities=null;
    syncPlayerRootScale(); // restaura imediatamente Mini/Normal/Grande e Abaixar do Otthos
    if(playerModel)playerModel.visible=true; if(avatarLayer)avatarLayer.visible=true;
    vehicleVisual.visible=false;vehicleVisual.rotation.set(0,0,0);els.vehicleBadge.hidden=true;updateVehicleControlsUI();updateRunUI();updateAbilityUI();stopEngineSound();
    if(world.vehicle){world.vehicle.group.visible=true;world.vehicle.group.position.set(player.x,groundHeightAt(player.x,player.z),player.z);world.vehicle.group.rotation.y=player.car.heading;}if(!silent)toast('Saiu do carro.','good');
  }

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
    const data={id:uid(),type:buildMode,x,z};state.builds.push(data);spawnBuild(data,true);addXP(12);evaluateMissions();checkActiveJob();saveState();toast('Construção colocada!','good');
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
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,state.settings.quality==='high'?1.6:1));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;els.stage.innerHTML='';els.stage.appendChild(renderer.domElement);
    initMaterials();
    scene.add(new THREE.HemisphereLight(0xe8f8ff,0x355126,.88));const sun=new THREE.DirectionalLight(0xfff0c4,1.18);sun.position.set(32,46,24);sun.castShadow=true;sun.shadow.mapSize.set(state.settings.quality==='high'?2048:1024,state.settings.quality==='high'?2048:1024);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;sun.shadow.camera.far=160;sun.shadow.bias=-.0015;scene.add(sun);
    const fill=new THREE.DirectionalLight(0xbfe0ff,.28);fill.position.set(-28,20,-18);scene.add(fill); // preenchimento barato (sem sombra) para suavizar o lado escuro dos objetos
    createPlayerModel();playerModel.position.y=playerModel.userData.baseY;applyAvatarCustomization();buildWorld();restorePosition();initLocalMultiplayer();applyQuality();resize();return true;
  }
  function applyQuality(){
    if(!renderer)return;const high=state.settings.quality==='high';renderer.setPixelRatio(Math.min(devicePixelRatio||1,high?1.6:1));renderer.shadowMap.enabled=high;renderer.toneMappingExposure=high?1.04:.98;
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
  const autoSaveInterval=setInterval(()=>{if(running){savePlayerPosition(true);}},5000);
  window.addEventListener('pagehide',()=>{if(running)savePlayerPosition(true);else commitState();});
  window.addEventListener('beforeunload',()=>{if(running)savePlayerPosition(true);else commitState();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(running)savePlayerPosition(true);else commitState();}});

  function groundHeightAt(x,z){
    let top=0;for(const p of world.platforms){if(p.bridgePart!==undefined&&!state.flags.bridgeFixed&&p.bridgePart%2===1)continue;if(Math.abs(x-p.x)<=p.w/2+.35&&Math.abs(z-p.z)<=p.d/2+.35&&p.top>top&&player.y>=p.top-.75)top=p.top;}return top;
  }
  function vehicleHitsCollider(x,z){
    const h=player.car.heading,fx=Math.sin(h),fz=Math.cos(h),rx=Math.cos(h),rz=-Math.sin(h);
    const probes=[
      [0,0,.38],[fx*1.12,fz*1.12,.34],[-fx*1.08,-fz*1.08,.34],
      [fx*.88+rx*.72,fz*.88+rz*.72,.30],[fx*.88-rx*.72,fz*.88-rz*.72,.30],
      [-fx*.84+rx*.72,-fz*.84+rz*.72,.30],[-fx*.84-rx*.72,-fz*.84-rz*.72,.30]
    ];
    return world.colliders.some(c=>{
      if(c.houseId&&currentHouse&&c.houseId===currentHouse.id)return false;
      return probes.some(([ox,oz,pad])=>Math.abs(x+ox-c.x)<=c.w/2+pad&&Math.abs(z+oz-c.z)<=c.d/2+pad);
    });
  }
  function registerVehicleImpact(){
    vehicleImpactCount++;player.car.speed*=.08;player.vx*=.1;player.vz*=.1;
    const t=performance.now();if(!registerVehicleImpact._cool||t>registerVehicleImpact._cool){registerVehicleImpact._cool=t+240;vibrate([18,35,18]);beep(135,65,'square');toast('Cuidado com a batida!','warn',900);}
  }
  function resolveCollisions(prevX,prevZ){
    if(player.vehicle){
      if(vehicleHitsCollider(player.x,player.z)){player.x=prevX;player.z=prevZ;registerVehicleImpact();}
      return;
    }
    const radius=.43*playerScaleValue()*(player.crouched?.82:1);
    for(const c of world.colliders){
      if(c.houseId&&currentHouse&&c.houseId===currentHouse.id)continue;
      if(Math.abs(player.x-c.x)>c.w/2+radius||Math.abs(player.z-c.z)>c.d/2+radius)continue;
      const fromLeft=prevX<=c.x-c.w/2-radius,fromRight=prevX>=c.x+c.w/2+radius,fromTop=prevZ<=c.z-c.d/2-radius,fromBottom=prevZ>=c.z+c.d/2+radius;
      if(fromLeft)player.x=c.x-c.w/2-radius;else if(fromRight)player.x=c.x+c.w/2+radius;else if(fromTop)player.z=c.z-c.d/2-radius;else if(fromBottom)player.z=c.z+c.d/2+radius;else{player.x=prevX;player.z=prevZ;}
    }
    if(currentHouse){player.x=clamp(player.x,currentHouse.x-4.0,currentHouse.x+4.0);player.z=clamp(player.z,currentHouse.z-3.02,currentHouse.z+3.02);}
  }
  function resolveMovementInput(){
    const left=input.keys.has('ArrowLeft')||input.keys.has('KeyA');
    const right=input.keys.has('ArrowRight')||input.keys.has('KeyD');
    const up=input.keys.has('ArrowUp')||input.keys.has('KeyW');
    const down=input.keys.has('ArrowDown')||input.keys.has('KeyS');
    const keyboardX=(right?1:0)-(left?1:0);
    const keyboardZ=(up?1:0)-(down?1:0);
    let sourceX=0,sourceZ=0;
    if(input.virtualActive){sourceX=input.virtualX;sourceZ=input.virtualZ;}
    else if(Math.abs(keyboardX)+Math.abs(keyboardZ)>0){sourceX=keyboardX;sourceZ=keyboardZ;}
    else if(input.joyId!==null||Math.abs(input.joyX)+Math.abs(input.joyZ)>.02){sourceX=input.joyX;sourceZ=input.joyZ;}
    else if(input.gamepadActive){sourceX=input.gamepadX;sourceZ=input.gamepadZ;}
    input.targetX=clamp(sourceX,-1,1);input.targetZ=clamp(sourceZ,-1,1);
    return {x:input.targetX,z:input.targetZ};
  }
  function sprintRequested(){return !!(input.touchSprint||input.gamepadSprint||input.keys.has('ShiftLeft')||input.keys.has('ShiftRight'));}
  function updateRunUI(){
    if(!els.runBtn)return;const active=sprintRequested();els.runBtn.classList.toggle('active',active);
    const icon=$('b',els.runBtn),label=$('span',els.runBtn);if(icon)icon.textContent=player.vehicle?'⚡':'🏃';if(label)label.textContent=player.vehicle?'Turbo':'Correr';
  }
  function clearMovementInputs(){
    input.keys.clear();input.joyId=null;input.joyX=0;input.joyZ=0;
    input.gamepadX=0;input.gamepadZ=0;input.gamepadActive=false;
    input.virtualX=0;input.virtualZ=0;input.virtualActive=false;
    input.touchSprint=false;input.gamepadSprint=false;input.isSprinting=false;
    input.x=0;input.z=0;input.targetX=0;input.targetZ=0;updateRunUI();
    if(els.joystickKnob)els.joystickKnob.style.transform='translate(-50%,-50%)';
  }
  function canJump(){return !player.vehicle&&(player.grounded||performance.now()-player.lastGrounded<125);}
  function requestJump(){if(!els.modal.hidden||paused||player.vehicle)return;player.jumpBuffer=performance.now()+150;if(canJump())doJump();}
  function doJump(){if(!canJump())return;player.vy=10.2;player.grounded=false;player.jumpBuffer=0;beep(540);vibrate(18);}
  function updatePlayer(dt){
    // Entrada é atualizada em todos os estados. O veículo tem prioridade absoluta:
    // uma animação anterior de sofá/cama/TV nunca pode bloquear aceleração ou direção.
    resolveMovementInput();
    input.x=lerp(input.x,input.targetX,Math.min(1,dt*18));
    input.z=lerp(input.z,input.targetZ,Math.min(1,dt*18));
    const mag=Math.hypot(input.x,input.z);let ix=input.x,iz=input.z;if(mag>1){ix/=mag;iz/=mag;}

    if(player.vehicle){
      updateVehiclePhysics(dt,ix,iz);
    }else if(performance.now()<player.sitUntil){
      player.vx*=.82;player.vz*=.82;
    }else{
      const forwardX=Math.sin(cameraYaw),forwardZ=-Math.cos(cameraYaw),rightX=Math.cos(cameraYaw),rightZ=Math.sin(cameraYaw);
      const wantsSprint=sprintRequested()&&mag>.14&&!player.crouched&&state.needs.energy>4;input.isSprinting=wantsSprint;
      const needsPenalty=state.needs.energy<15?.72:state.needs.hunger<15?.82:1;const sizeSpeed=player.scaleMode==='mini'?1.12:player.scaleMode==='giant'?.84:1;
      const speed=(wantsSprint?11.4:7.35)*needsPenalty*sizeSpeed*(player.crouched?.54:1);
      const targetVx=(rightX*ix+forwardX*iz)*speed,targetVz=(rightZ*ix+forwardZ*iz)*speed;const accel=player.grounded?(wantsSprint?25:20):8;
      player.vx=lerp(player.vx,targetVx,Math.min(1,dt*accel));player.vz=lerp(player.vz,targetVz,Math.min(1,dt*accel));if(mag<.03){player.vx*=Math.pow(.0008,dt);player.vz*=Math.pow(.0008,dt);}
    }
    const prevX=player.x,prevZ=player.z;player.x+=player.vx*dt;player.z+=player.vz*dt;player.x=clamp(player.x,-116,116);player.z=clamp(player.z,-116,116);resolveCollisions(prevX,prevZ);
    const ground=groundHeightAt(player.x,player.z);if(!player.grounded)player.vy-=31*dt;player.y+=player.vy*dt;
    if(player.y<=ground&&player.vy<=0){const landed=!player.grounded&&player.vy<-4;player.y=ground;player.vy=0;player.grounded=true;player.lastGrounded=performance.now();if(landed){vibrate(20);beep(180,35,'sine');}}
    else if(player.y>ground+.03)player.grounded=false;
    if(player.jumpBuffer&&player.jumpBuffer>performance.now()&&canJump())doJump();
    if(!player.vehicle&&Math.hypot(player.vx,player.vz)>.15)player.facing=Math.atan2(player.vx,player.vz);
    playerGroup.position.set(player.x,player.y,player.z);playerGroup.rotation.y=performance.now()<player.spinUntil?player.facing+(1-(player.spinUntil-performance.now())/720)*Math.PI*4:player.facing;syncPlayerRootScale();contactShadow.position.set(player.x,ground+.025,player.z);const air=Math.max(0,player.y-ground);const ss=clamp(1-air*.08,.48,1);contactShadow.scale.setScalar(ss);contactShadow.material.opacity=clamp(.27-air*.035,.06,.27);vehicleVisual.visible=player.vehicle;
    animatePlayer(dt);checkHazards();collectNearbyCrystals();updateContext();
  }
  function updateVehiclePhysics(dt,ix,iz){
    const car=player.car;
    const turbo=sprintRequested();const maxSpeed=turbo?29:23.5,maxReverse=-8.5;
    const accelFactor=car.speed>=0?Math.max(.22,1-car.speed/maxSpeed):1;
    const braking=(car.speed>0.2&&iz<0)?2.7:1;
    const throttleAccel=iz>=0?iz*(turbo?23:16.5)*accelFactor:iz*10.5*braking;
    car.speed+=throttleAccel*dt;
    if(Math.abs(iz)<.05)car.speed*=Math.pow(.05,dt);
    car.speed=clamp(car.speed,maxReverse,maxSpeed);
    const speedRatio=clamp(Math.abs(car.speed)/7,0,1);
    const highSpeedDamp=1/(1+Math.abs(car.speed)/20);
    const lowSpeedAssist=.72+speedRatio*.48;const turnRate=3.05*lowSpeedAssist*highSpeedDamp*(car.speed<0?-1:1);
    car.heading+=ix*turnRate*dt;
    const fx=Math.sin(car.heading),fz=Math.cos(car.heading);
    const desiredVx=fx*car.speed,desiredVz=fz*car.speed;
    const turnHarshness=Math.abs(ix)*speedRatio;
    const grip=clamp(1-turnHarshness*.6,.32,1);
    player.vx=lerp(player.vx,desiredVx,Math.min(1,dt*9.5*grip));
    player.vz=lerp(player.vz,desiredVz,Math.min(1,dt*9.5*grip));
    car.drift=clamp((1-grip)*clamp(Math.abs(car.speed)/8,0,1),0,1);
    car.steerVisual=lerp(car.steerVisual,ix,Math.min(1,dt*10));
    player.facing=car.heading;
  }
  let animTime=0;
  function animatePlayer(dt){
    if (!playerModel) return;
    animTime+=dt; playerMixer?.update(dt);
    const parts=playerModel.userData.parts;const speed=Math.hypot(player.vx,player.vz);const walking=speed>.25&&player.grounded&&!player.vehicle;const swing=walking?Math.sin(animTime*(8+speed*.45))*.62:0;
    if(parts){
      parts.leftArm.rotation.x=lerp(parts.leftArm.rotation.x,player.grounded?swing:-.65,.22);parts.rightArm.rotation.x=lerp(parts.rightArm.rotation.x,player.grounded?-swing:-.65,.22);parts.leftLeg.rotation.x=lerp(parts.leftLeg.rotation.x,player.grounded?-swing*.8:.38,.22);parts.rightLeg.rotation.x=lerp(parts.rightLeg.rotation.x,player.grounded?swing*.8:.38,.22);
      const breathe=Math.sin(animTime*2.2)*.02;parts.body.scale.y=(player.crouched?.78:1)+breathe;
      const visualBase=playerModel.userData.baseY??.24;
      const walkBob=walking?Math.abs(Math.sin(animTime*10))*.035:0;
      playerModel.position.y=visualBase+walkBob;
      if(performance.now()<player.sitUntil){parts.leftLeg.rotation.x=1.25;parts.rightLeg.rotation.x=1.25;playerModel.position.y=Math.max(.12,visualBase-.10);}
      // Defesa de regressão: nenhuma animação pode empurrar a sola para baixo do chão.
      playerModel.position.y=Math.max((-(playerModel.userData.minFootY??-.23))+.005,playerModel.position.y);
    } else {
      const base=playerModel.userData.baseY||0;
      const bob=walking?Math.abs(Math.sin(animTime*(8+speed*.4)))*.045:Math.sin(animTime*2.1)*.012;
      const jumpTilt=player.grounded?0:clamp(-player.vy*.012,-.12,.10);
      playerModel.position.y=base+bob+(performance.now()<player.sitUntil?-.22:0);
      playerModel.rotation.x=lerp(playerModel.rotation.x,jumpTilt,.18);
      playerModel.rotation.z=lerp(playerModel.rotation.z,walking?Math.sin(animTime*8)*.025:0,.18);
    }
    if(avatarLayer){avatarLayer.position.y=playerModel.position.y;avatarLayer.rotation.x=playerModel.rotation.x;avatarLayer.rotation.z=playerModel.rotation.z;}
  }
  function checkHazards(){
    for(const h of world.hazards){if(Math.abs(player.x-h.x)<=h.w/2&&Math.abs(player.z-h.z)<=h.d/2&&player.y<.6){if(h.type==='water'){player.vx*=.9;player.vz*=.9;}else if(performance.now()>player.damageUntil){player.damageUntil=performance.now()+1200;state.needs.energy=clamp(state.needs.energy-18,0,100);toast('Cuidado com a lava!','bad');returnHome();}}}
  }
  function collectNearbyCrystals(){
    for(const c of world.crystals){if(c.got)continue;c.mesh.rotation.y+=.035;c.mesh.position.y=c.y+Math.sin(animTime*2+c.x)*.12;if(Math.hypot(player.x-c.x,player.z-c.z)<1.25&&Math.abs(player.y-c.mesh.position.y)<2){c.got=true;c.mesh.visible=false;state.inventory.crystals++;addXP(15);addCoins(5);toast('Cristal coletado!','good');beep(880);vibrate(20);evaluateMissions();checkActiveJob();saveState();}}
  }

  function updateNPCs(dt){
    for(const npc of world.npcs){
      const near=distance2D(player,npc.group.position)<3.2;
      const oldX=npc.group.position.x,oldZ=npc.group.position.z;
      if(near){
        const look=Math.atan2(player.x-npc.group.position.x,player.z-npc.group.position.z);
        npc.group.rotation.y=lerpAngle(npc.group.rotation.y,look,Math.min(1,dt*5.5));
      }else{
        npc.phase+=dt*.45;
        const tx=npc.baseX+Math.sin(npc.phase)*npc.pathRadius,tz=npc.baseZ+Math.cos(npc.phase*.83)*npc.pathRadius;
        npc.group.position.x=lerp(npc.group.position.x,tx,dt*.45);npc.group.position.z=lerp(npc.group.position.z,tz,dt*.45);
        npc.group.rotation.y=lerpAngle(npc.group.rotation.y,Math.atan2(tx-npc.group.position.x,tz-npc.group.position.z),Math.min(1,dt*5));
      }
      const moved=Math.hypot(npc.group.position.x-oldX,npc.group.position.z-oldZ);
      const walk=moved>.001?Math.sin(animTime*8+npc.phase)*.52:0;
      const gesture=near?Math.sin(animTime*2.4+npc.phase)*.12:0;
      if(npc.limbs){
        npc.limbs.leftArm.rotation.x=lerp(npc.limbs.leftArm.rotation.x,walk+gesture,.18);
        npc.limbs.rightArm.rotation.x=lerp(npc.limbs.rightArm.rotation.x,-walk-gesture,.18);
        npc.limbs.leftLeg.rotation.x=lerp(npc.limbs.leftLeg.rotation.x,-walk*.78,.18);
        npc.limbs.rightLeg.rotation.x=lerp(npc.limbs.rightLeg.rotation.x,walk*.78,.18);
      }
      npc.body.position.y=1.1+(moved>.001?Math.abs(Math.sin(animTime*8+npc.phase))*.035:Math.sin(animTime*2+npc.phase)*.012);
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
    if(!els.modal.hidden||paused)return;
    if(player.vehicle){vehicleHorn();return;}
    if(currentHouse){toast('Use o poder do lado de fora.','warn');return;}
    const dir={x:Math.sin(player.facing),z:Math.cos(player.facing)};const mesh=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.42),mat(0xff5a12,{emissive:0xff2a00,emissiveIntensity:.9}));mesh.position.set(player.x,player.y+1.35,player.z);worldGroup.add(mesh);world.fireballs.push({mesh,x:player.x,y:player.y+1.35,z:player.z,vx:dir.x*12,vz:dir.z*12,life:1.4});beep(220,90,'sawtooth');vibrate(18);
  }
  function updateFireballs(dt){
    for(let i=world.fireballs.length-1;i>=0;i--){const f=world.fireballs[i];f.life-=dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.mesh.position.set(f.x,f.y,f.z);f.mesh.rotation.x+=dt*7;f.mesh.rotation.y+=dt*9;let hit=false;for(const e of world.enemies){if(!e.dead&&Math.hypot(f.x-e.group.position.x,f.z-e.group.position.z)<1.1){damageEnemy(e,1);hit=true;break;}}if(hit||f.life<=0){worldGroup.remove(f.mesh);world.fireballs.splice(i,1);}}
  }

  function updateCamera(dt){
    let desiredPos,look;
    if(currentHouse&&cameraMode==='interior'){
      const h=currentHouse;const portrait=innerHeight>innerWidth;const orbit=clamp(cameraYaw,-1.18,1.18);const dist=clamp((portrait?8.2:7.2)+cameraZoom,5.2,12.5);const height=clamp((portrait?5.6:4.6)+cameraPitch*2.4+cameraZoom*.18,3.8,8.8);
      desiredPos=new THREE.Vector3(player.x+Math.sin(orbit)*dist,player.y+height,player.z+Math.cos(orbit)*dist);look=new THREE.Vector3(player.x,player.y+1.15,player.z);camera.fov=portrait?54:50;
    }else{
      const portrait=innerHeight>innerWidth;const speed=Math.hypot(player.vx,player.vz);
      if(player.vehicle&&!input.cameraDrag)cameraYaw=lerpAngle(cameraYaw,player.car.heading,Math.min(1,dt*3.2));
      const speedKick=clamp(Math.abs(player.vehicle?player.car.speed:speed)/9,0,1.6);
      const dist=clamp((portrait?12.5:10.2)+(player.vehicle?3.4:0)+speedKick*1.6+cameraZoom,6.5,24);const height=clamp((portrait?6.6:5.4)+(player.vehicle?.4:0)+cameraPitch*2.2+cameraZoom*.16,3.5,12);
      desiredPos=new THREE.Vector3(player.x-Math.sin(cameraYaw)*dist,player.y+height,player.z+Math.cos(cameraYaw)*dist);const visualHeight=1.4*playerScaleValue()*(player.crouched?.72:1);look=new THREE.Vector3(player.x+Math.sin(cameraYaw)*3.5,player.y+visualHeight,player.z-Math.cos(cameraYaw)*3.5);
      camera.fov=(portrait?57:60)+speedKick*(player.vehicle?7:2);
    }
    const t=1-Math.exp(-dt*7.5);camera.position.lerp(desiredPos,t);camera.lookAt(look);camera.updateProjectionMatrix();
  }

  function nearestInteractable(){
    if(activeRace)return null;
    if(player.vehicle)return{id:'exit-vehicle',type:'vehicle',icon:'🚗',label:'Sair do carrinho',radius:999,priority:999,action:exitVehicle};
    if(buildMode)return{id:'place-build',type:'build',icon:'🧱',label:'Colocar construção',radius:999,priority:999,action:placeBuild};
    let nearest=null,best=Infinity;
    for(const it of world.interactables){
      if(!isInteractionAvailable(it))continue;
      const pos=worldPos(it),d=Math.hypot(player.x-pos.x,player.z-pos.z);
      if(d>(it.radius||2))continue;
      const score=d-(it.priority||0)*.006;
      if(score<best){best=score;nearest=it;}
    }
    return nearest;
  }
  function updateContext(force=false){
    const next=nearestInteractable();const id=next?.id||'';if(!force&&id===lastContextId)return;lastContextId=id;currentContext=next;els.contextPrompt.hidden=!next;els.actionBtn.classList.toggle('pulse',!!next);els.contextIcon.textContent=next?.icon||'⚔';els.contextLabel.textContent=next?.label||'Atacar';els.contextHint.textContent=next?'Toque em AÇÃO':'Ataque próximo';const span=$('span',els.actionBtn);const icon=$('b',els.actionBtn);if(span)span.textContent=next?'Ação':'Espada';if(icon)icon.textContent=next?.icon||'⚔';
  }
  function doAction(){
    if(paused||!els.modal.hidden||performance.now()<actionLockedUntil)return;
    actionLockedUntil=performance.now()+180;
    if(state.ui.quickOpen){state.ui.quickOpen=false;els.quickBar.hidden=true;els.quickToggleBtn.classList.remove('active');}
    let target=currentContext;
    if(target&&target.radius!==999){const pos=worldPos(target);if(!isInteractionAvailable(target)||Math.hypot(player.x-pos.x,player.z-pos.z)>(target.radius||2)+.2)target=null;}
    if(!target)target=nearestInteractable();
    currentContext=target;lastActionSource=target?.id||'melee';
    if(target){target.action();updateContext(true);return;}
    meleeAttack();
  }

  function updateNeeds(dt){
    updateNeeds.acc=(updateNeeds.acc||0)+dt;if(updateNeeds.acc<1)return;const sec=updateNeeds.acc;updateNeeds.acc=0;state.needs.hunger=clamp(state.needs.hunger-sec*.065,0,100);state.needs.energy=clamp(state.needs.energy-sec*(player.vehicle?(sprintRequested()?.085:.035):(input.isSprinting?.16:.045)),0,100);state.needs.fun=clamp(state.needs.fun-sec*.025,0,100);state.needs.hygiene=clamp(state.needs.hygiene-sec*.028,0,100);if(state.needs.hunger<8&&Math.random()<.08)toast('Otthos está com fome.','warn');updateHUD();saveState();
  }

  let localChannel=null,lastPublish=0;
  function initLocalMultiplayer(){
    if(typeof BroadcastChannel!=='function')return;localChannel=new BroadcastChannel('otthos-life-world-v613');localChannel.onmessage=e=>{const data=e.data;if(!data||data.id===state.profile.playerId)return;if(data.type==='leave'){const ghost=world.ghosts.get(data.id);if(ghost){scene.remove(ghost);world.ghosts.delete(data.id);}return;}let ghost=world.ghosts.get(data.id);if(!ghost){ghost=createGhost(data.color||0x5ad8ff);world.ghosts.set(data.id,ghost);}ghost.userData.target=data;};window.addEventListener('beforeunload',()=>localChannel.postMessage({type:'leave',id:state.profile.playerId}));
    window.OTTHOS_MULTIPLAYER={version:3,playerId:state.profile.playerId,mode:'local-preview',connect:()=>true,publish:payload=>localChannel?.postMessage(payload),adapter:'BroadcastChannel',futureAdapters:['Firebase','WebSocket']};
  }
  function createGhost(color){const g=new THREE.Group();box(.82,1.2,.58,color,0,1.3,0,g);box(.72,.72,.72,0xffd2a0,0,2.25,0,g);scene.add(g);return g;}
  function updateMultiplayer(dt){
    if(localChannel&&performance.now()-lastPublish>120){lastPublish=performance.now();localChannel.postMessage({type:'position',id:state.profile.playerId,x:player.x,y:player.y,z:player.z,r:player.facing,color:0x5ad8ff});}
    for(const ghost of world.ghosts.values()){const t=ghost.userData.target;if(!t)continue;ghost.position.x=lerp(ghost.position.x,t.x,dt*8);ghost.position.y=lerp(ghost.position.y,t.y,dt*8);ghost.position.z=lerp(ghost.position.z,t.z,dt*8);ghost.rotation.y=lerp(ghost.rotation.y,t.r,dt*8);}
  }

  function gameLoop(){
    if(!running)return;raf=requestAnimationFrame(gameLoop);const dt=Math.min(.033,clock.getDelta());if(!paused){pollGamepad();updatePlayer(dt);updateVehicleFX(dt);updateFX(dt);updateClouds(dt);updateNPCs(dt);updateEnemies(dt);updateFireballs(dt);updateRace(dt);updateNeeds(dt);updateMultiplayer(dt);updateCamera(dt);updateNavigation(dt);}
    renderer.render(scene,camera);
  }

  function setupControls(){
    const resetJoy=()=>{input.joyId=null;input.joyX=0;input.joyZ=0;els.joystickKnob.style.transform='translate(-50%,-50%)';};
    els.joystick.addEventListener('pointerdown',e=>{e.preventDefault();input.joyId=e.pointerId;els.joystick.setPointerCapture(e.pointerId);updateJoy(e);});
    els.joystick.addEventListener('pointermove',e=>{if(e.pointerId===input.joyId)updateJoy(e);});
    els.joystick.addEventListener('pointerup',resetJoy);els.joystick.addEventListener('pointercancel',resetJoy);
    function updateJoy(e){const r=els.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.32;let dx=e.clientX-cx,dy=e.clientY-cy;const mag=Math.hypot(dx,dy);if(mag>max){dx=dx/mag*max;dy=dy/mag*max;}input.joyX=-dx/max;input.joyZ=-dy/max;els.joystickKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
    const press=(el,fn)=>el?.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn();},{passive:false});
    press(els.jumpBtn,requestJump);press(els.actionBtn,doAction);
    const setTouchSprint=active=>{input.touchSprint=!!active;updateRunUI();};
    els.runBtn?.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();setTouchSprint(true);els.runBtn.setPointerCapture?.(e.pointerId);},{passive:false});
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>els.runBtn?.addEventListener(type,()=>setTouchSprint(false)));
    const adjustCamera=delta=>{cameraZoom=clamp(cameraZoom+delta,-4.5,9);state.settings.cameraZoom=+cameraZoom.toFixed(2);saveState();};
    press(els.cameraNearBtn,()=>adjustCamera(-1.6));press(els.cameraFarBtn,()=>adjustCamera(1.6));press(els.cameraResetBtn,()=>{cameraZoom=0;cameraPitch=.38;cameraYaw=currentHouse?0:player.facing;state.settings.cameraZoom=0;saveState();toast('Câmera centralizada.','good',900);});
    els.miniNav?.addEventListener('click',openMap);press(els.specialBtn,firePower);press(els.crouchBtn,()=>toggleCrouch());press(els.miniBtn,()=>setScaleMode('mini'));press(els.normalBtn,()=>setScaleMode('normal'));press(els.giantBtn,()=>setScaleMode('giant'));press(els.spinBtn,spinPlayer);
    [els.quickBar,els.inventoryBtn,els.buildBtn,els.mapBtn,els.gameSettingsBtn].forEach(el=>el?.addEventListener('pointerdown',e=>e.stopPropagation()));
    window.addEventListener('keydown',e=>{input.keys.add(e.code);if(['Space','KeyE','KeyF','KeyC','Digit1','Digit2','Digit3','KeyR','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();updateRunUI();if(e.code==='Space')requestJump();if(e.code==='KeyE')doAction();if(e.code==='KeyF')firePower();if(e.code==='KeyC')toggleCrouch();if(e.code==='Digit1')setScaleMode('mini');if(e.code==='Digit2')setScaleMode('normal');if(e.code==='Digit3')setScaleMode('giant');if(e.code==='KeyR')spinPlayer();if(e.code==='Escape'){e.preventDefault();if(!running)return;if(pauseMenuOpen)closeModal();else if(!els.modal.hidden)closeModal();else openPauseMenu();}});window.addEventListener('keyup',e=>{input.keys.delete(e.code);updateRunUI();});
    els.stage.addEventListener('pointerdown',e=>{if(e.target!==renderer?.domElement)return;input.cameraDrag={id:e.pointerId,x:e.clientX,y:e.clientY};els.stage.setPointerCapture?.(e.pointerId);});
    els.stage.addEventListener('pointermove',e=>{const d=input.cameraDrag;if(!d||d.id!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;cameraYaw-=dx*.006;cameraPitch=clamp(cameraPitch+dy*.003,.05,.9);d.x=e.clientX;d.y=e.clientY;});
    const endDrag=e=>{if(input.cameraDrag?.id===e.pointerId)input.cameraDrag=null;};els.stage.addEventListener('pointerup',endDrag);els.stage.addEventListener('pointercancel',endDrag);
    els.stage.addEventListener('wheel',e=>{if(!running||!els.modal.hidden)return;e.preventDefault();cameraZoom=clamp(cameraZoom+Math.sign(e.deltaY)*.9,-4.5,9);state.settings.cameraZoom=+cameraZoom.toFixed(2);},{passive:false});
  }
  let gamepadJump=false,gamepadAction=false,gamepadPower=false,gamepadCrouch=false,gamepadSize=false;
  function pollGamepad(){
    const gp=[...(navigator.getGamepads?.()||[])].find(Boolean);
    if(!gp){input.gamepadX=0;input.gamepadZ=0;input.gamepadActive=false;input.gamepadSprint=false;updateRunUI();return;}
    const ax=gp.axes[0]||0,az=-(gp.axes[1]||0);
    input.gamepadActive=Math.hypot(ax,az)>.16;input.gamepadX=input.gamepadActive?ax:0;input.gamepadZ=input.gamepadActive?az:0;input.gamepadSprint=!!(gp.buttons[10]?.pressed||gp.buttons[7]?.value>.45);updateRunUI();
    const jump=!!gp.buttons[0]?.pressed,action=!!gp.buttons[2]?.pressed,power=!!gp.buttons[1]?.pressed,crouch=!!gp.buttons[4]?.pressed,size=!!gp.buttons[5]?.pressed;
    if(jump&&!gamepadJump)requestJump();if(action&&!gamepadAction)doAction();if(power&&!gamepadPower)firePower();if(crouch&&!gamepadCrouch)toggleCrouch();if(size&&!gamepadSize)setScaleMode(player.scaleMode==='normal'?'mini':player.scaleMode==='mini'?'giant':'normal');
    gamepadJump=jump;gamepadAction=action;gamepadPower=power;gamepadCrouch=crouch;gamepadSize=size;
    const camX=gp.axes[2]||0;if(Math.abs(camX)>.18)cameraYaw-=camX*.035;const camY=gp.axes[3]||0;if(Math.abs(camY)>.18)cameraPitch=clamp(cameraPitch+camY*.018,.05,.9);
  }

  async function startGame(resetPosition=false){
    await dbReady; closeModal();showScreen('game');
    state.ui.quickOpen=false;els.quickBar.hidden=true;els.quickToggleBtn.classList.remove('active');els.game.classList.toggle('needs-expanded',!!state.ui.needsOpen);els.missionCard.classList.toggle('expanded',!!state.ui.missionOpen);if(!scene){if(!initThree()){showScreen('lobby');return;}setupControls();}else{applyAvatarCustomization();}
    if(resetPosition){player.x=0;player.z=8;player.y=0;}else restorePosition();player.scaleMode=state.abilities?.scaleMode||'normal';player.crouched=!!state.abilities?.crouched;updateAbilityUI();running=true;paused=false;clock.start();evaluateMissions();updateHUD();updateContext(true);updateNavigation(0,true);resize();cancelAnimationFrame(raf);gameLoop();toast('Bem-vindo à Vila do Sol!','good',2200);
  }
  function stopGame(){
    if(player.vehicle)exitVehicle(true);running=false;paused=false;pauseMenuOpen=false;cancelAnimationFrame(raf);stopEngineSound();savePlayerPosition(true);showScreen('lobby');updateLobbyStats();
  }
  els.playBtn.onclick=()=>startGame(true);els.continueBtn.onclick=()=>startGame(false);

  function openPauseMenu(){
    if(!running||pauseMenuOpen)return;
    paused=true;pauseMenuOpen=true;if(engineAudio)stopEngineSound();openModal('Jogo pausado',`<div class="choice-grid"><button class="choice" data-resume><b>▶ Continuar</b><span>Voltar ao mundo</span></button><button class="choice" data-life><b>👤 Minha vida</b><span>Carreira, amizades e visual</span></button><button class="choice" data-home><b>🏠 Casa</b><span>Voltar para a Casa do Otthos</span></button><button class="choice" data-menu><b>↩ Menu inicial</b><span>Salvar e sair</span></button></div>`,root=>{
      $('[data-resume]',root).onclick=()=>closeModal();
      $('[data-life]',root).onclick=()=>{pauseMenuOpen=false;paused=false;closeModal();if(player.vehicle)startEngineSound();openLifePanel();};
      $('[data-home]',root).onclick=()=>{pauseMenuOpen=false;paused=false;closeModal();returnHome();};
      $('[data-menu]',root).onclick=()=>{pauseMenuOpen=false;paused=false;closeModal();stopGame();};
    });
  }
  els.gameSettingsBtn.addEventListener('contextmenu',e=>e.preventDefault());

  function updateBridgeVisual(){world.bridgeParts.forEach((p,i)=>{p.visible=state.flags.bridgeFixed||i%2===0;});}


  function prepareVehicleTestArea(){
    if(currentHouse){
      const h=currentHouse;h.roof.visible=true;h.front.visible=true;h.door.visible=true;currentHouse=null;cameraMode='openworld';
    }
    if(player.vehicle)exitVehicle(true);
    clearMovementInputs();
    player.x=0;player.z=-70;player.y=groundHeightAt(0,-70);
    player.vx=0;player.vy=0;player.vz=0;player.grounded=true;player.sitUntil=0;
    player.facing=0;player.car.heading=0;player.car.speed=0;player.car.steerVisual=0;player.car.drift=0;player.car._prevSpeed=0;
    vehicleImpactCount=0;
    enterVehicle();
    return {x:player.x,z:player.z,active:player.vehicle,heading:player.car.heading};
  }
  function stepVehicleSimulation(frames=120,steer=.35,throttle=1){
    if(!player.vehicle)prepareVehicleTestArea();
    const count=clamp(Math.round(Number(frames)||120),1,600);
    const sx=clamp(Number(steer)||0,-1,1),sz=clamp(Number(throttle)||0,-1,1);
    const dt=1/60,startX=player.x,startZ=player.z,startImpacts=vehicleImpactCount;
    const wasPaused=paused;paused=true;
    for(let i=0;i<count;i++){
      updateVehiclePhysics(dt,sx,sz);
      const prevX=player.x,prevZ=player.z;
      player.x=clamp(player.x+player.vx*dt,-116,116);
      player.z=clamp(player.z+player.vz*dt,-116,116);
      resolveCollisions(prevX,prevZ);
      const ground=groundHeightAt(player.x,player.z);player.y=ground;player.vy=0;player.grounded=true;
    }
    playerGroup?.position?.set(player.x,player.y,player.z);
    paused=wasPaused;
    return {frames:count,seconds:count*dt,distance:Math.hypot(player.x-startX,player.z-startZ),speed:player.car.speed,x:player.x,z:player.z,impacts:vehicleImpactCount-startImpacts};
  }

  // Public test/audit API
  window.OTTHOS_TEST_API={
    version:'V613_GAMEPLAY_ART_DIRECTION',
    getState:()=>JSON.parse(JSON.stringify(state)),
    getGame:()=>({running,paused,currentHouse:currentHouse?.id||null,cameraMode,player:{...player},objects:{houses:world.houses.length,npcs:world.npcs.length,enemies:world.enemies.length,interactables:world.interactables.length,builds:world.builds.length}}),
    getVisual:()=>{const parts=playerModel?.userData?.parts||{};const modelY=playerModel?.position?.y||0;const minFootY=playerModel?.userData?.minFootY??0;const scaleY=playerGroup?.scale?.y||1;const rootY=playerGroup?.position?.y||0;return {procedural:!!playerModel?.userData?.proceduralOtthos,rootY,modelY,minFootY,scaleY,visualBottom:rootY+(modelY+minFootY)*scaleY,limbs:{leftArm:parts.leftArm?.rotation?.x||0,rightArm:parts.rightArm?.rotation?.x||0,leftLeg:parts.leftLeg?.rotation?.x||0,rightLeg:parts.rightLeg?.rotation?.x||0}};},
    teleport:(x,z)=>{player.x=x;player.z=z;player.y=groundHeightAt(x,z);player.vx=player.vy=player.vz=0;player.grounded=true;updateContext(true);},
    getContext:()=>currentContext?{id:currentContext.id,label:currentContext.label,type:currentContext.type,activity:currentContext.activity||null}:null,
    getLastAction:()=>lastActionSource,
    action:()=>doAction(),
    jump:()=>requestJump(),
    fire:()=>firePower(),
    enterVehicle:()=>{enterVehicle();return player.vehicle;},
    prepareVehicleTest:prepareVehicleTestArea,
    exitVehicle:()=>{exitVehicle();return !player.vehicle;},
    setDriveInput:(steer=0,throttle=0)=>{input.virtualX=clamp(Number(steer)||0,-1,1);input.virtualZ=clamp(Number(throttle)||0,-1,1);input.virtualActive=Math.abs(input.virtualX)+Math.abs(input.virtualZ)>.001;resolveMovementInput();return {active:input.virtualActive,x:input.targetX,z:input.targetZ};},
    clearDriveInput:()=>{input.virtualX=0;input.virtualZ=0;input.virtualActive=false;resolveMovementInput();return {x:input.targetX,z:input.targetZ};},
    refreshInput:()=>resolveMovementInput(),
    stepVehicleSimulation,
    vehicle:()=>({active:player.vehicle,speed:player.car.speed,heading:player.car.heading,drift:player.car.drift,sitUntilRemaining:Math.max(0,player.sitUntil-performance.now()),driveInput:{x:input.x,z:input.z,targetX:input.targetX,targetZ:input.targetZ,virtualActive:input.virtualActive,joyX:input.joyX,joyZ:input.joyZ,gamepadActive:input.gamepadActive},playerVisible:playerModel?.visible!==false,accessoriesVisible:avatarLayer?.visible!==false,vehicleVisible:!!vehicleVisual?.visible,parkedVisible:world.vehicle?.group?.visible!==false,preVehicleAbilities:player.preVehicleAbilities?{...player.preVehicleAbilities}:null,specialLabel:$('span',els.specialBtn)?.textContent||'',fireballs:world.fireballs.length,engineActive:!!engineAudio,wheelCount:vehicleVisual?.userData?.wheels?.length||0,frontWheelCount:vehicleVisual?.userData?.frontWheels?.length||0,impactCount:vehicleImpactCount,rootScale:{x:playerGroup?.scale?.x||0,y:playerGroup?.scale?.y||0,z:playerGroup?.scale?.z||0}}),
    pause:()=>openPauseMenu(),
    crouch:()=>toggleCrouch(),
    setSize:setScaleMode,
    spin:spinPlayer,
    controls:()=>({crouch:!!els.crouchBtn,mini:!!els.miniBtn,normal:!!els.normalBtn,giant:!!els.giantBtn,spin:!!els.spinBtn,action:!!els.actionBtn,jump:!!els.jumpBtn,power:!!els.specialBtn}),
    race:()=>activeRace?{type:activeRace.type,npc:activeRace.npcName,playerScore:activeRace.playerScore,opponentScore:activeRace.opponentScore,timeLeft:activeRace.timeLeft}:null,
    startRace:(type='sprint')=>startRace(type,world.npcs[0]),
    map:()=>({player:{x:player.x,z:player.z},waypoint:state.waypoint,route:state.waypoint?buildRoutePoints(player,state.waypoint):[],locations:MAP_LOCATIONS.map(x=>({...x}))}),
    setWaypoint:id=>{setWaypoint(id);return state.waypoint;},
    clearWaypoint:()=>{state.waypoint=null;updateWaypointMarker();updateNavigation(0,true);return true;},
    camera:()=>({yaw:cameraYaw,pitch:cameraPitch,zoom:cameraZoom,mode:cameraMode}),
    setCameraZoom:value=>{cameraZoom=clamp(Number(value)||0,-4.5,9);state.settings.cameraZoom=cameraZoom;return cameraZoom;},
    sprint:active=>{input.touchSprint=!!active;updateRunUI();return sprintRequested();},
    enterHouseById:(id)=>{const h=world.houses.find(x=>x.id===id);if(!h)return false;enterHouse(h);return true;},
    exitHouse,
    returnHome,
    evaluateMissions,
    installReady:()=>!!deferredInstallPrompt,
    avatar:()=>({...state.avatar}),
    career:()=>({...state.career}),
    openAvatarStudio,
    openJobCenter,
    database:()=>({available:!!window.OTTHOS_DB,name:window.OTTHOS_DB?.name||null,schema:window.OTTHOS_DB?.schema||null,lastSaved:state.lastSaved,autoSaveMs:5000}),
    render:()=>({
      pixelRatio:renderer?.getPixelRatio?.()||0,
      drawCalls:renderer?.info?.render?.calls||0,
      triangles:renderer?.info?.render?.triangles||0,
      textureCount:renderer?.info?.memory?.textures||0,
      geometryCount:renderer?.info?.memory?.geometries||0,
      running,paused,currentHouse:currentHouse?.id||null,vehicleActive:!!player.vehicle,
      shadowMapEnabled:!!renderer?.shadowMap?.enabled,
      cloudCount:world.clouds?.length||0,
      fxParticleCount:(typeof fxParticles!=='undefined'?fxParticles.length:0),
      modelViewerDefined:!!(window.customElements&&customElements.get('model-viewer')),
      wheelFrontCount:vehicleVisual?.userData?.frontWheels?.length||0,
      wheelTotalCount:vehicleVisual?.userData?.wheels?.length||0
    }),
    multiplayer:()=>window.OTTHOS_MULTIPLAYER||null
  };

  updateLobbyStats();evaluateMissions();updateInstallUI();
})();
