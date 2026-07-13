(() => {
  const out = [];
  const ok = (name, pass, detail='') => out.push({teste:name,status:pass?'OK':'FALHOU',detalhe:detail});
  const api = window.ATHOS_TEST_API || {};
  const qs = s => document.querySelector(s);
  ok('Athos API disponível', !!api);
  ok('Modo mundo aberto', !!api.getV590OpenWorld?.()?.openWorld || !!api.getV591ProfessionalOpenWorld?.()?.openWorld);
  ok('Canvas 3D existe', !!qs('#three-canvas'));
  ok('Sem imagem de referência colada no jogo', !/athos_v442_visual_alvo|render-exigido|reference/i.test(getComputedStyle(document.body).backgroundImage + getComputedStyle(qs('.lobby')||document.body).backgroundImage));
  ok('AR preservado', !!qs('#arAnchorViewer'));
  ok('Quiz preservado', !!qs('#quizBtn'));
  ok('Conversa preservada', !!qs('#askBtn'));
  ok('Botões de ação preservados', document.querySelectorAll('.action-grid .action-btn').length >= 8);
  ok('Joystick preservado', !!qs('#joystick'));
  console.table(out);
  window.ATHOS_V591_TEST_RESULTS = out;
  alert(`V591 teste rápido\nOK: ${out.filter(x=>x.status==='OK').length}\nFalhas: ${out.filter(x=>x.status!=='OK').length}`);
})();