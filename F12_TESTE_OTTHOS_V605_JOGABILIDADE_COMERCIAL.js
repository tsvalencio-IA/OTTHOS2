
(async () => {
  'use strict';

  const VERSION = 'V606_COMMERCIAL_GAMEPLAY_AUDIT_1';
  const STORAGE_KEY = 'otthos_life_world_roleplay_v606';
  const CONFIG = {
    autoStartGame: true,
    movementHoldMs: 650,
    movementTimeoutMs: 1600,
    jumpTimeoutMs: 2600,
    fpsFrames: 150,
    fpsWarmupMs: 350,
    minDesktopFPS: 48,
    maxP95FrameMs: 30,
    maxJankPercent: 12,
    minTouchSize: 38,
    viewportTolerance: 3,
    restoreAfterTest: true
  };

  if (window.__OTTHOS_COMMERCIAL_AUDIT_RUNNING__) {
    console.warn('O teste comercial do Otthos já está em execução.');
    return;
  }
  window.__OTTHOS_COMMERCIAL_AUDIT_RUNNING__ = true;

  document.getElementById('otthos-commercial-audit-panel')?.remove();

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const now = () => performance.now();
  const clone = value => JSON.parse(JSON.stringify(value));
  const round = (n, digits = 2) => Number(Number(n || 0).toFixed(digits));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const results = [];
  const runtimeErrors = [];
  const startTime = now();

  const severityWeight = {
    critical: 5,
    high: 3,
    medium: 2,
    low: 1,
    info: 0
  };

  const onError = event => {
    runtimeErrors.push({
      type: 'error',
      message: event.message || 'Erro JavaScript',
      source: event.filename || '',
      line: event.lineno || 0
    });
  };

  const onRejection = event => {
    runtimeErrors.push({
      type: 'promise',
      message: String(event.reason?.message || event.reason || 'Promise rejeitada')
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  function add(area, test, passed, details = '', severity = 'medium', metrics = null) {
    results.push({
      area,
      test,
      status: passed ? 'OK' : 'FALHOU',
      passed: !!passed,
      severity,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      metrics
    });
  }

  async function safe(area, test, severity, fn) {
    try {
      const value = await fn();
      if (value && typeof value === 'object' && 'passed' in value) {
        add(area, test, value.passed, value.details || '', severity, value.metrics || null);
      } else {
        add(area, test, !!value, String(value ?? ''), severity);
      }
    } catch (error) {
      add(area, test, false, error?.stack || error?.message || String(error), severity);
    }
  }

  function visible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return !el.hidden &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity || 1) > 0.01 &&
      rect.width > 0 &&
      rect.height > 0;
  }

  function rectInsideViewport(el, tolerance = CONFIG.viewportTolerance) {
    if (!visible(el)) return false;
    const rect = el.getBoundingClientRect();
    const width = window.visualViewport?.width || innerWidth;
    const height = window.visualViewport?.height || innerHeight;
    return rect.left >= -tolerance &&
      rect.top >= -tolerance &&
      rect.right <= width + tolerance &&
      rect.bottom <= height + tolerance;
  }

  function rectIntersection(a, b) {
    const left = Math.max(a.left, b.left);
    const top = Math.max(a.top, b.top);
    const right = Math.min(a.right, b.right);
    const bottom = Math.min(a.bottom, b.bottom);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    return width * height;
  }

  function overlapRatio(elA, elB) {
    const a = elA.getBoundingClientRect();
    const b = elB.getBoundingClientRect();
    const overlap = rectIntersection(a, b);
    const minArea = Math.min(a.width * a.height, b.width * b.height);
    return minArea > 0 ? overlap / minArea : 0;
  }

  function closeModal() {
    const modal = qs('#modal');
    if (modal && !modal.hidden) {
      qs('#modalClose')?.click();
    }
  }

  async function waitFor(predicate, timeoutMs = 5000, intervalMs = 50) {
    const started = now();
    while (now() - started < timeoutMs) {
      try {
        const result = predicate();
        if (result) return result;
      } catch {}
      await wait(intervalMs);
    }
    return null;
  }

  async function ensureGameRunning(api) {
    if (api?.getGame?.().running) return true;
    if (!CONFIG.autoStartGame) return false;

    const continueBtn = qs('#continueBtn');
    const playBtn = qs('#playBtn');
    const target = visible(continueBtn) ? continueBtn : playBtn;
    if (!target) return false;

    target.click();
    return !!(await waitFor(() => {
      const state = api?.getGame?.();
      return state?.running && qs('#stage canvas');
    }, 10000, 100));
  }

  function dispatchKey(type, code, key) {
    const event = new KeyboardEvent(type, {
      code,
      key,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  }

  async function measureMovement(api) {
    api.exitHouse?.();
    api.setSize?.('normal');
    api.teleport?.(0, 8);
    await wait(180);

    const start = clone(api.getGame().player);
    const startedAt = now();
    let firstMotionAt = 0;

    dispatchKey('keydown', 'KeyW', 'w');

    while (now() - startedAt < CONFIG.movementHoldMs) {
      await nextFrame();
      const current = api.getGame().player;
      const dist = Math.hypot(current.x - start.x, current.z - start.z);
      if (!firstMotionAt && dist > 0.04) firstMotionAt = now();
    }

    dispatchKey('keyup', 'KeyW', 'w');
    await wait(180);

    const end = clone(api.getGame().player);
    const distance = Math.hypot(end.x - start.x, end.z - start.z);
    const latency = firstMotionAt ? firstMotionAt - startedAt : Infinity;

    return {
      start,
      end,
      distance,
      latency,
      passed: distance >= 1.2 && distance <= 10 && latency <= 180
    };
  }

  async function measureJump(api) {
    api.exitHouse?.();
    api.setSize?.('normal');
    api.teleport?.(0, 8);
    await wait(220);

    const base = clone(api.getGame().player);
    const baseY = Number(base.y || 0);
    const calledAt = now();

    api.jump?.();

    let takeoffAt = 0;
    let landedAt = 0;
    let apexY = baseY;
    let last = base;
    const samples = [];

    while (now() - calledAt < CONFIG.jumpTimeoutMs) {
      await nextFrame();
      const p = clone(api.getGame().player);
      const elapsed = now() - calledAt;
      apexY = Math.max(apexY, Number(p.y || 0));
      samples.push({ t: round(elapsed, 1), y: round(p.y, 3), vy: round(p.vy, 3), grounded: !!p.grounded });

      if (!takeoffAt && Number(p.y || 0) > baseY + 0.035) takeoffAt = now();
      if (takeoffAt && p.grounded && Math.abs(Number(p.y || 0) - baseY) < 0.12 && elapsed > 180) {
        landedAt = now();
        last = p;
        break;
      }

      last = p;
    }

    const latency = takeoffAt ? takeoffAt - calledAt : Infinity;
    const airborne = takeoffAt && landedAt ? landedAt - takeoffAt : Infinity;
    const height = apexY - baseY;
    const landed = !!landedAt;

    return {
      baseY,
      apexY,
      height,
      latency,
      airborne,
      landed,
      finalY: Number(last.y || 0),
      samples,
      passed:
        landed &&
        latency <= 190 &&
        height >= 0.75 &&
        height <= 4.5 &&
        airborne >= 320 &&
        airborne <= 1900 &&
        Math.abs(Number(last.y || 0) - baseY) <= 0.14
    };
  }

  async function measureFPS() {
    await wait(CONFIG.fpsWarmupMs);
    const frames = [];
    let previous = 0;

    for (let i = 0; i < CONFIG.fpsFrames; i++) {
      const t = await new Promise(resolve => requestAnimationFrame(resolve));
      if (previous) frames.push(t - previous);
      previous = t;
    }

    const sorted = [...frames].sort((a, b) => a - b);
    const averageFrame = frames.reduce((sum, value) => sum + value, 0) / Math.max(1, frames.length);
    const averageFPS = 1000 / averageFrame;
    const p95Frame = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const jankFrames = frames.filter(ms => ms > 34).length;
    const jankPercent = (jankFrames / Math.max(1, frames.length)) * 100;

    return {
      averageFPS,
      averageFrame,
      p95Frame,
      jankFrames,
      jankPercent,
      passed:
        averageFPS >= CONFIG.minDesktopFPS &&
        p95Frame <= CONFIG.maxP95FrameMs &&
        jankPercent <= CONFIG.maxJankPercent
    };
  }

  async function fetchAsset(path) {
    const response = await fetch(path, { cache: 'no-store' });
    return {
      path,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      size: Number(response.headers.get('content-length') || 0)
    };
  }

  function buildPanel(report) {
    const panel = document.createElement('section');
    panel.id = 'otthos-commercial-audit-panel';
    panel.innerHTML = `
      <style>
        #otthos-commercial-audit-panel{
          position:fixed;inset:14px;z-index:2147483647;
          background:#071321f5;color:#f7fbff;border:2px solid #59d7ff;
          border-radius:18px;box-shadow:0 24px 80px #000a;
          font:13px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;
          overflow:auto;padding:16px;backdrop-filter:blur(12px);
        }
        #otthos-commercial-audit-panel *{box-sizing:border-box}
        #otthos-commercial-audit-panel header{
          display:flex;align-items:center;justify-content:space-between;gap:12px;
          position:sticky;top:-16px;background:#071321;padding:14px 0 10px;z-index:2;
        }
        #otthos-commercial-audit-panel h2{margin:0;font-size:22px}
        #otthos-commercial-audit-panel .score{
          min-width:92px;text-align:center;padding:9px 14px;border-radius:14px;
          background:${report.score >= 90 ? '#176d2b' : report.score >= 75 ? '#8a5b09' : '#8a2330'};
          font-size:20px;font-weight:900;
        }
        #otthos-commercial-audit-panel .summary{
          display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:8px 0 14px;
        }
        #otthos-commercial-audit-panel .summary div{
          background:#13263a;border:1px solid #ffffff20;border-radius:12px;padding:10px;
        }
        #otthos-commercial-audit-panel .summary b{display:block;font-size:18px}
        #otthos-commercial-audit-panel table{width:100%;border-collapse:collapse}
        #otthos-commercial-audit-panel th,#otthos-commercial-audit-panel td{
          text-align:left;padding:8px;border-bottom:1px solid #ffffff18;vertical-align:top
        }
        #otthos-commercial-audit-panel th{position:sticky;top:62px;background:#0b1b2c}
        #otthos-commercial-audit-panel tr.fail{background:#5d162344}
        #otthos-commercial-audit-panel tr.ok{background:#14522522}
        #otthos-commercial-audit-panel .actions{
          display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px
        }
        #otthos-commercial-audit-panel button{
          border:0;border-radius:10px;padding:10px 14px;font-weight:800;
          background:#2a5f88;color:#fff;cursor:pointer
        }
        #otthos-commercial-audit-panel button.primary{background:#2d9b46}
        #otthos-commercial-audit-panel button.danger{background:#a33442}
        #otthos-commercial-audit-panel pre{
          white-space:pre-wrap;background:#020912;border-radius:12px;padding:12px;overflow:auto
        }
        @media(max-width:760px){
          #otthos-commercial-audit-panel{inset:4px;padding:10px}
          #otthos-commercial-audit-panel .summary{grid-template-columns:repeat(2,1fr)}
          #otthos-commercial-audit-panel th:nth-child(4),
          #otthos-commercial-audit-panel td:nth-child(4){display:none}
        }
      </style>
      <header>
        <div>
          <h2>Auditoria de Jogabilidade Comercial — Otthos V606</h2>
          <div>${report.verdict}</div>
        </div>
        <div class="score">${report.score}/100</div>
      </header>

      <div class="summary">
        <div><span>Total</span><b>${report.total}</b></div>
        <div><span>Aprovados</span><b>${report.passed}</b></div>
        <div><span>Falhas</span><b>${report.failed}</b></div>
        <div><span>Duração</span><b>${report.durationSeconds}s</b></div>
      </div>

      <div class="actions">
        <button class="primary" data-copy>Copiar relatório</button>
        <button data-json>Baixar JSON</button>
        <button data-console>Mostrar falhas no console</button>
        <button class="danger" data-close>Fechar</button>
      </div>

      <table>
        <thead>
          <tr><th>Área</th><th>Teste</th><th>Status</th><th>Detalhes</th><th>Severidade</th></tr>
        </thead>
        <tbody>
          ${report.results.map(item => `
            <tr class="${item.passed ? 'ok' : 'fail'}">
              <td>${escapeHTML(item.area)}</td>
              <td>${escapeHTML(item.test)}</td>
              <td><b>${item.status}</b></td>
              <td>${escapeHTML(item.details || '')}</td>
              <td>${escapeHTML(item.severity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>Observação</h3>
      <pre>Este script valida a base técnica e a jogabilidade principal no navegador do PC. Ele não substitui teste humano com crianças, teste de acessibilidade, teste em celulares reais, controle parental, revisão jurídica, segurança online e teste de multiplayer.</pre>
    `;

    qs('[data-close]', panel).onclick = () => panel.remove();

    qs('[data-copy]', panel).onclick = async () => {
      const text = reportToText(report);
      try {
        await navigator.clipboard.writeText(text);
        qs('[data-copy]', panel).textContent = 'Copiado!';
      } catch {
        console.log(text);
        qs('[data-copy]', panel).textContent = 'Veja no console';
      }
    };

    qs('[data-json]', panel).onclick = () => {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `otthos-v606-auditoria-comercial-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    qs('[data-console]', panel).onclick = () => {
      console.table(report.results.filter(item => !item.passed));
    };

    document.body.appendChild(panel);
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function reportToText(report) {
    const lines = [
      `OTTHOS V606 — AUDITORIA DE JOGABILIDADE COMERCIAL`,
      `Pontuação: ${report.score}/100`,
      `Veredito: ${report.verdict}`,
      `Aprovados: ${report.passed}/${report.total}`,
      `Falhas: ${report.failed}`,
      ''
    ];

    for (const item of report.results) {
      lines.push(`[${item.status}] ${item.area} — ${item.test}`);
      if (item.details) lines.push(`  ${item.details}`);
    }

    return lines.join('\n');
  }

  let api = null;
  let original = null;
  let snapshotState = null;
  let snapshotLocal = null;

  try {
    api = window.OTTHOS_TEST_API;

    await safe('Inicialização', 'API pública de testes V606 disponível', 'critical', () => ({
      passed: !!api && api.version === 'V606_STABLE_VEHICLE_UPDATE',
      details: api?.version || 'OTTHOS_TEST_API ausente'
    }));

    if (!api) throw new Error('OTTHOS_TEST_API não foi encontrada. Abra a V606 e execute novamente.');

    snapshotState = clone(api.getState());
    snapshotLocal = localStorage.getItem(STORAGE_KEY);

    original = {
      game: clone(api.getGame()),
      player: clone(api.getGame().player),
      scaleMode: api.getGame().player.scaleMode,
      crouched: api.getGame().player.crouched,
      currentHouse: api.getGame().currentHouse
    };

    await safe('Inicialização', 'Jogo iniciou e canvas 3D carregou', 'critical', async () => {
      const started = await ensureGameRunning(api);
      return {
        passed: started && !!qs('#stage canvas'),
        details: started ? 'Game loop ativo e canvas presente' : 'Não foi possível iniciar o jogo'
      };
    });

    await safe('Conteúdo', 'Quantidade mínima de sistemas jogáveis', 'critical', () => {
      const game = api.getGame();
      const objects = game.objects || {};
      const passed =
        objects.houses >= 4 &&
        objects.npcs >= 5 &&
        objects.enemies >= 5 &&
        objects.interactables >= 40;

      return {
        passed,
        details: `Casas ${objects.houses}, NPCs ${objects.npcs}, inimigos ${objects.enemies}, interações ${objects.interactables}`,
        metrics: objects
      };
    });

    const requiredControls = [
      ['#joystick', 'Joystick'],
      ['#actionBtn', 'Ação'],
      ['#jumpBtn', 'Pular'],
      ['#specialBtn', 'Poder'],
      ['#crouchBtn', 'Abaixar'],
      ['#miniBtn', 'Mini'],
      ['#normalBtn', 'Normal'],
      ['#giantBtn', 'Grande'],
      ['#spinBtn', 'Girar']
    ];

    await safe('Controles', 'Todos os controles obrigatórios existem', 'critical', () => {
      const missing = requiredControls.filter(([selector]) => !qs(selector)).map(([, label]) => label);
      return {
        passed: missing.length === 0,
        details: missing.length ? `Ausentes: ${missing.join(', ')}` : 'Todos os controles foram encontrados'
      };
    });

    await safe('Controles', 'Controles visíveis permanecem dentro da tela', 'critical', () => {
      const failures = [];
      for (const [selector, label] of requiredControls) {
        const el = qs(selector);
        if (!el) {
          failures.push(`${label}: ausente`);
          continue;
        }
        if (!visible(el)) {
          failures.push(`${label}: oculto`);
          continue;
        }
        if (!rectInsideViewport(el)) {
          const r = el.getBoundingClientRect();
          failures.push(`${label}: fora da tela (${round(r.left)},${round(r.top)},${round(r.right)},${round(r.bottom)})`);
        }
      }

      return {
        passed: failures.length === 0,
        details: failures.length ? failures.join(' | ') : `Viewport ${innerWidth}x${innerHeight}`
      };
    });

    await safe('Controles', 'Áreas de toque possuem tamanho comercial mínimo', 'high', () => {
      const failures = [];
      for (const [selector, label] of requiredControls) {
        const el = qs(selector);
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < CONFIG.minTouchSize || r.height < CONFIG.minTouchSize) {
          failures.push(`${label} ${round(r.width)}x${round(r.height)}`);
        }
      }

      return {
        passed: failures.length === 0,
        details: failures.length ? `Pequenos: ${failures.join(', ')}` : `Todos têm ao menos ${CONFIG.minTouchSize}px`
      };
    });

    await safe('Controles', 'Botões principais não se sobrepõem', 'critical', () => {
      const selectors = ['#actionBtn', '#jumpBtn', '#specialBtn', '#crouchBtn', '#miniBtn', '#normalBtn', '#giantBtn', '#spinBtn'];
      const els = selectors.map(selector => qs(selector)).filter(visible);
      const collisions = [];

      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const ratio = overlapRatio(els[i], els[j]);
          if (ratio > 0.22) {
            collisions.push(`${els[i].id} x ${els[j].id}: ${round(ratio * 100)}%`);
          }
        }
      }

      return {
        passed: collisions.length === 0,
        details: collisions.length ? collisions.join(' | ') : 'Sem sobreposição relevante'
      };
    });

    await safe('Movimento', 'Resposta ao teclado e deslocamento contínuo', 'critical', async () => {
      const data = await measureMovement(api);
      return {
        passed: data.passed,
        details: `Distância ${round(data.distance)}m, latência ${round(data.latency)}ms`,
        metrics: {
          distance: round(data.distance),
          latencyMs: round(data.latency),
          start: data.start,
          end: data.end
        }
      };
    });

    await safe('Pulo', 'Pulo responde rápido, sobe, cai e aterrissa', 'critical', async () => {
      const data = await measureJump(api);
      return {
        passed: data.passed,
        details: `Latência ${round(data.latency)}ms, altura ${round(data.height)}m, ar ${round(data.airborne)}ms, pousou ${data.landed ? 'sim' : 'não'}`,
        metrics: {
          latencyMs: round(data.latency),
          height: round(data.height),
          airborneMs: round(data.airborne),
          landed: data.landed,
          baseY: round(data.baseY),
          finalY: round(data.finalY)
        }
      };
    });

    await safe('Física', 'Personagem não afunda no terreno após o pouso', 'critical', async () => {
      api.teleport(0, 8);
      await wait(280);
      const p = api.getGame().player;
      return {
        passed: Number(p.y) >= -0.08 && !!p.grounded,
        details: `y=${round(p.y, 3)}, grounded=${!!p.grounded}`,
        metrics: { y: p.y, grounded: !!p.grounded }
      };
    });

    await safe('Física', 'Modelo procedural do Otthos está ancorado pela sola dos pés', 'critical', () => {
      const visual = api.getVisual?.();
      return {
        passed: !!visual?.procedural && visual.visualBottom >= -0.02 && visual.visualBottom <= 0.12,
        details: visual ? `Procedural=${visual.procedural}; base visual=${round(visual.visualBottom, 3)}m; raiz=${round(visual.rootY, 3)}m` : 'API visual ausente',
        metrics: visual || null
      };
    });

    await safe('Habilidades', 'Mini, normal e grande funcionam sem remover controles', 'critical', async () => {
      const seen = {};
      for (const mode of ['mini', 'normal', 'giant']) {
        api.setSize(mode);
        await wait(120);
        seen[mode] = api.getGame().player.scaleMode;
      }
      api.setSize('normal');

      return {
        passed: seen.mini === 'mini' && seen.normal === 'normal' && seen.giant === 'giant',
        details: JSON.stringify(seen),
        metrics: seen
      };
    });

    await safe('Habilidades', 'Abaixar alterna corretamente', 'high', async () => {
      const before = !!api.getGame().player.crouched;
      api.crouch();
      await wait(100);
      const after = !!api.getGame().player.crouched;
      api.crouch();
      await wait(80);

      return {
        passed: before !== after,
        details: `Antes ${before}, depois ${after}`
      };
    });

    await safe('Casa', 'Entrada muda para câmera interna', 'critical', async () => {
      api.exitHouse?.();
      const entered = api.enterHouseById('home');
      await wait(220);
      const game = api.getGame();

      return {
        passed: entered === true && game.currentHouse === 'home' && game.cameraMode === 'interior',
        details: `Casa=${game.currentHouse}, câmera=${game.cameraMode}`
      };
    });

    await safe('Casa', 'Fogão prioriza Cozinhar em vez de Inventário', 'critical', async () => {
      api.enterHouseById('home');
      api.teleport(-1.7, 19.25);
      await wait(180);
      const context = api.getContext();

      if (context?.activity === 'stove') {
        api.action();
        await wait(120);
      }

      const title = qs('#modalTitle')?.textContent?.trim() || '';
      const bodyText = qs('#modalBody')?.textContent?.trim() || '';
      const passed =
        context?.activity === 'stove' &&
        /cozinha|cozinhar|refei/i.test(`${title} ${bodyText}`) &&
        !/inventário geral/i.test(`${title} ${bodyText}`);

      closeModal();

      return {
        passed,
        details: `Contexto=${context?.id || 'nenhum'} / ${context?.activity || 'nenhum'}; modal="${title}"`
      };
    });

    await safe('Casa', 'Presente/baú não vira inventário genérico', 'critical', async () => {
      api.enterHouseById('home');
      api.teleport(3.0, 16.2);
      await wait(180);
      const context = api.getContext();

      return {
        passed: context?.activity === 'chest' && context?.id === 'chest-home',
        details: JSON.stringify(context)
      };
    });

    await safe('Casa', 'Sair restaura câmera de mundo aberto', 'critical', async () => {
      api.exitHouse();
      await wait(160);
      const game = api.getGame();

      return {
        passed: game.currentHouse === null && game.cameraMode === 'openworld',
        details: `Casa=${game.currentHouse}, câmera=${game.cameraMode}`
      };
    });

    await safe('Social', 'Vizinho abre menu social completo', 'critical', async () => {
      api.exitHouse?.();
      const searchPoints = [
        [4, 3], [5, 3], [3, 3], [4, 4], [4, 2],
        [7, 3], [1, 3], [4, 6], [4, 0]
      ];

      let context = null;
      for (const [x, z] of searchPoints) {
        api.teleport(x, z);
        await wait(90);
        context = api.getContext();
        if (context?.type === 'npc') break;
      }

      if (context?.type === 'npc') {
        api.action();
        await wait(160);
      }

      const bodyText = qs('#modalBody')?.textContent || '';
      const required = [
        'Conversar',
        'Contar piada',
        'Dar presente',
        'Discutir',
        'Desafiar corrida',
        'Pega-moedas',
        'Disputar casa',
        'Perguntar trabalho',
        'Convidar para casa'
      ];
      const missing = required.filter(label => !bodyText.includes(label));
      closeModal();

      return {
        passed: context?.type === 'npc' && missing.length === 0,
        details: context?.type !== 'npc'
          ? 'Nenhum NPC foi encontrado próximo aos pontos de teste'
          : missing.length ? `Opções ausentes: ${missing.join(', ')}` : `NPC=${context.label}`
      };
    });

    await safe('Mapa', 'Mapa usa coordenadas e pontos reais', 'high', () => {
      const map = api.map();
      const passed =
        Number.isFinite(map?.player?.x) &&
        Number.isFinite(map?.player?.z) &&
        Array.isArray(map?.locations) &&
        map.locations.length >= 9;

      return {
        passed,
        details: `Marcadores=${map?.locations?.length || 0}, jogador=(${round(map?.player?.x)}, ${round(map?.player?.z)})`,
        metrics: map
      };
    });

    await safe('Roleplay', 'Perfil, carreira, amizades e casas existem', 'critical', () => {
      const state = api.getState();
      const passed =
        !!state.profile?.playerId &&
        !!state.career &&
        Object.keys(state.friendship || {}).length >= 5 &&
        Object.keys(state.houses || {}).length >= 4 &&
        !!state.avatar;

      return {
        passed,
        details: `playerId=${state.profile?.playerId || 'ausente'}, carreira=${state.career?.title || 'ausente'}, amizades=${Object.keys(state.friendship || {}).length}, casas=${Object.keys(state.houses || {}).length}`
      };
    });

    await safe('Salvamento', 'IndexedDB possui schema e save válido', 'critical', async () => {
      if (!window.OTTHOS_DB) {
        return { passed: false, details: 'OTTHOS_DB ausente' };
      }

      const status = await window.OTTHOS_DB.status();
      const loaded = await window.OTTHOS_DB.load();

      return {
        passed: status.schema === 605 && !!loaded?.profile?.playerId,
        details: `DB=${status.database}, schema=${status.schema}, persistente=${status.persisted}, último save=${status.savedAt ? new Date(status.savedAt).toLocaleString() : 'não encontrado'}`,
        metrics: status
      };
    });

    await safe('Salvamento', 'Cópia local de emergência é válida', 'high', () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      let parsed = null;
      try { parsed = JSON.parse(raw || 'null'); } catch {}

      return {
        passed: !!parsed?.profile?.playerId && parsed.version === 605,
        details: parsed ? `Versão ${parsed.version}, playerId ${parsed.profile?.playerId}` : 'Save local inválido ou ausente'
      };
    });

    await safe('PWA', 'Instalação aparece somente no lobby e não se repete', 'critical', () => {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        navigator.standalone === true ||
        localStorage.getItem('otthos_installed') === '1';

      const visibleInstall = qsa('button,a').filter(el =>
        visible(el) && /instalar\s+(aplicativo|jogo|app)/i.test(el.textContent || '')
      );

      const outsideLobby = visibleInstall.filter(el => !el.closest('#lobby'));
      const passed = standalone
        ? visibleInstall.length === 0
        : visibleInstall.length <= 1 && outsideLobby.length === 0;

      return {
        passed,
        details: `Standalone=${standalone}; visíveis=${visibleInstall.length}; fora do lobby=${outsideLobby.length}`
      };
    });

    await safe('PWA', 'Manifest e Service Worker estão ativos', 'high', async () => {
      const manifest = qs('link[rel="manifest"]');
      const registrations = 'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistrations()
        : [];

      return {
        passed: !!manifest && registrations.length >= 1,
        details: `Manifest=${manifest?.getAttribute('href') || 'ausente'}, SW=${registrations.length}`
      };
    });

    await safe('AR', 'Modelo principal e AR permanecem disponíveis', 'critical', () => {
      const viewer = qs('#nativeViewer');
      const src = viewer?.getAttribute('src') || '';
      const arEnabled = viewer?.hasAttribute('ar');

      return {
        passed: !!viewer && /athos\.glb/i.test(src) && arEnabled,
        details: `src=${src || 'ausente'}, ar=${!!arEnabled}`
      };
    });

    await safe('Recursos', 'Arquivos essenciais respondem pelo servidor', 'critical', async () => {
      const paths = [
        './athos.glb',
        './manifest.webmanifest',
        './assets/js/save-db.js',
        './icons/icon-192.png',
        './assets/moldes/modelo_referencia_athos.png'
      ];

      const fetched = [];
      for (const path of paths) fetched.push(await fetchAsset(path));
      const failed = fetched.filter(item => !item.ok);

      return {
        passed: failed.length === 0,
        details: failed.length ? `Falharam: ${failed.map(x => `${x.path} (${x.status})`).join(', ')}` : 'Todos os arquivos essenciais responderam',
        metrics: fetched
      };
    });

    await safe('Desempenho', 'FPS, frame time e engasgos em padrão desktop', 'critical', async () => {
      const perf = await measureFPS();
      return {
        passed: perf.passed,
        details: `FPS médio ${round(perf.averageFPS)}, p95 ${round(perf.p95Frame)}ms, jank ${round(perf.jankPercent)}%`,
        metrics: {
          averageFPS: round(perf.averageFPS),
          averageFrameMs: round(perf.averageFrame),
          p95FrameMs: round(perf.p95Frame),
          jankFrames: perf.jankFrames,
          jankPercent: round(perf.jankPercent)
        }
      };
    });

    await safe('Estabilidade', 'Nenhum erro JavaScript novo durante o teste', 'critical', () => ({
      passed: runtimeErrors.length === 0,
      details: runtimeErrors.length ? JSON.stringify(runtimeErrors) : 'Nenhum erro capturado'
    }));

  } catch (fatalError) {
    add('Execução', 'Teste completo executou sem erro fatal', false, fatalError?.stack || String(fatalError), 'critical');
  } finally {
    try {
      dispatchKey('keyup', 'KeyW', 'w');
      dispatchKey('keyup', 'ArrowUp', 'ArrowUp');
      closeModal();

      if (CONFIG.restoreAfterTest && api && original) {
        api.exitHouse?.();

        if (original.currentHouse) {
          api.enterHouseById?.(original.currentHouse);
        }

        api.teleport?.(original.player.x, original.player.z);
        api.setSize?.(original.scaleMode || 'normal');

        const currentCrouch = !!api.getGame?.().player?.crouched;
        if (currentCrouch !== !!original.crouched) api.crouch?.();

        if (snapshotState && window.OTTHOS_DB) {
          await window.OTTHOS_DB.save(snapshotState).catch(() => false);
        }

        if (snapshotLocal !== null) {
          localStorage.setItem(STORAGE_KEY, snapshotLocal);
        }
      }
    } catch (restoreError) {
      add('Restauração', 'Estado do jogador restaurado após teste', false, restoreError?.message || String(restoreError), 'high');
    }

    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    window.__OTTHOS_COMMERCIAL_AUDIT_RUNNING__ = false;
  }

  const weightedTotal = results.reduce((sum, item) => sum + severityWeight[item.severity], 0);
  const weightedPassed = results.reduce((sum, item) => sum + (item.passed ? severityWeight[item.severity] : 0), 0);
  const score = weightedTotal > 0 ? Math.round((weightedPassed / weightedTotal) * 100) : 0;
  const passed = results.filter(item => item.passed).length;
  const failed = results.length - passed;
  const criticalFailures = results.filter(item => !item.passed && item.severity === 'critical').length;

  const verdict =
    criticalFailures === 0 && score >= 92
      ? 'APROVADO PARA BETA COMERCIAL CONTROLADO'
      : criticalFailures === 0 && score >= 82
        ? 'BASE BOA, MAS AINDA EXIGE POLIMENTO'
        : criticalFailures <= 2 && score >= 70
          ? 'NÃO APROVADO: CORRIGIR FALHAS IMPORTANTES'
          : 'REPROVADO PARA USO COMERCIAL';

  const report = {
    product: 'Otthos Life World',
    gameVersion: api?.version || 'desconhecida',
    auditVersion: VERSION,
    executedAt: new Date().toISOString(),
    url: location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.visualViewport?.width || innerWidth,
      height: window.visualViewport?.height || innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    },
    score,
    verdict,
    total: results.length,
    passed,
    failed,
    criticalFailures,
    durationSeconds: round((now() - startTime) / 1000, 1),
    runtimeErrors,
    results
  };

  window.OTTHOS_COMMERCIAL_AUDIT_REPORT = report;

  console.group(`%cOTTHOS V606 — AUDITORIA COMERCIAL ${score}/100`, 'font-size:16px;font-weight:bold;color:#52d8ff');
  console.log(verdict);
  console.table(results.map(item => ({
    Área: item.area,
    Teste: item.test,
    Status: item.status,
    Severidade: item.severity,
    Detalhes: item.details
  })));
  if (runtimeErrors.length) console.error('Erros capturados:', runtimeErrors);
  console.log('Relatório completo:', report);
  console.groupEnd();

  buildPanel(report);
})();
