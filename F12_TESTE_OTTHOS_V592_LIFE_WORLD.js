(() => {
  const api = window.ATHOS_TEST_API || {};
  const s = api.getV592OtthosLifeWorld?.() || {};
  const checks = [
    ['API V592', !!api.getV592OtthosLifeWorld, JSON.stringify(s)],
    ['Mundo aberto', s.openWorld === true, s.region],
    ['NPCs', (s.npcs||0) >= 4, s.npcs],
    ['Atividades', (s.activities||0) >= 6, s.activities],
    ['Interiores', (s.interiors||0) >= 5, s.interiors],
    ['Recursos', (s.resources||0) >= 12, s.resources],
    ['Portas e casas', (s.doors||0) >= 5, s.doors],
    ['Baús', (s.chests||0) >= 3, s.chests],
    ['AR preservado', !!document.querySelector('#arAnchorViewer'), 'model-viewer'],
    ['Quiz preservado', !!document.querySelector('#quizBtn'), 'quiz'],
    ['Conversa preservada', !!document.querySelector('#askBtn'), 'ask']
  ].map(([teste,ok,detalhe])=>({teste,status:ok?'OK':'FALHOU',detalhe}));
  console.table(checks);
  window.ATHOS_V592_TEST_RESULTS = checks;
  alert(`V592 Otthos Life World\nOK: ${checks.filter(x=>x.status==='OK').length}\nFalhas: ${checks.filter(x=>x.status!=='OK').length}`);
})();