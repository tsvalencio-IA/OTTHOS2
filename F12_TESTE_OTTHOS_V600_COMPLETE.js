(async () => {
  const rows = [];
  const test = (name, ok, detail = '') => rows.push({ teste: name, status: ok ? 'OK' : 'FALHOU', detalhe: String(detail ?? '') });
  const q = s => document.querySelector(s);
  const api = window.OTTHOS_TEST_API;

  test('API de auditoria', !!api, api?.version || 'ausente');
  test('Botão instalar aplicativo', !!q('#installBtn'));
  test('Realidade aumentada', !!q('#nativeViewer') && !!q('#arBtn'));
  test('Quiz', !!q('#quizBtn'));
  test('Conversa', !!q('#talkBtn'));
  test('Coleção', !!q('#collectionBtn'));
  test('Moldes 3D', !!q('#moldsBtn'));
  test('Manifest PWA', !!q('link[rel="manifest"]'));
  test('Sem seletor de cenários antigos', !document.body.textContent.includes('Escolher mundo'));
  test('Controles infantis principais', !!q('#joystick') && !!q('#actionBtn') && !!q('#jumpBtn') && !!q('#specialBtn'));
  test('Atalhos de itens/construção/mapa', !!q('#inventoryBtn') && !!q('#buildBtn') && !!q('#mapBtn'));

  if (api) {
    const g = api.getGame();
    test('Mundo iniciado', g.running === true, 'Entre no mundo antes de rodar o teste completo.');
    if (g.running) {
      test('Casas', g.objects.houses >= 6, g.objects.houses);
      test('NPCs/vizinhos', g.objects.npcs >= 5, g.objects.npcs);
      test('Inimigos e desafios', g.objects.enemies >= 5, g.objects.enemies);
      test('Interações', g.objects.interactables >= 50, g.objects.interactables);
      api.teleport(0, 22);
      const ctx = api.getContext();
      test('Porta contextual', ctx?.type === 'door', ctx?.label || 'sem contexto');
      const entered = api.enterHouseById('home');
      const inside = api.getGame();
      test('Entrada na casa', entered && inside.currentHouse === 'home');
      test('Câmera interna', inside.cameraMode === 'interior');
      api.exitHouse();
      test('Saída da casa', api.getGame().currentHouse === null);
      api.returnHome();
      test('Multiplayer-ready', !!api.multiplayer(), JSON.stringify(api.multiplayer()));
    }
  }

  const checkBounds = element => {
    if (!element) return false;
    const r = element.getBoundingClientRect();
    return r.left >= -2 && r.top >= -2 && r.right <= innerWidth + 2 && r.bottom <= innerHeight + 2;
  };
  test('Joystick dentro da tela', checkBounds(q('#joystick')));
  test('Ações dentro da tela', checkBounds(q('.primary-actions')));
  test('HUD dentro da tela', checkBounds(q('.game-hud')));

  console.table(rows);
  window.OTTHOS_V600_TEST_RESULTS = rows;
  alert(`OTTHOS V600\nOK: ${rows.filter(r => r.status === 'OK').length}\nFalhas: ${rows.filter(r => r.status !== 'OK').length}\nVeja console.table para detalhes.`);
})();
