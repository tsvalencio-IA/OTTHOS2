(()=>{
'use strict';
const api = window.ATHOS_TEST_API || {};
const out = [];
function add(name, ok, detail=''){ out.push({teste:name,status:ok?'OK':'FALHOU',detalhe:detail}); console[ok?'log':'warn'](`${ok?'OK':'FALHOU'} - ${name}`, detail); }
setTimeout(()=>{
  const ow = api.getV59OpenWorld ? api.getV59OpenWorld() : null;
  add('API V59 existe', !!ow, JSON.stringify(ow||{}));
  add('Modo openworld ativo', !!ow && ow.openWorld === true, JSON.stringify(ow||{}));
  add('Chunks criados', !!ow && ow.chunks >= 4, JSON.stringify(ow||{}));
  add('Casas/portas criadas', !!ow && ow.doors >= 4, JSON.stringify(ow||{}));
  add('Baús criados', !!ow && ow.chests >= 2, JSON.stringify(ow||{}));
  add('Região detectada', !!ow && !!ow.region, JSON.stringify(ow||{}));
  console.table(out);
  window.ATHOS_V590_OPEN_WORLD_TEST_RESULTS = out;
  alert(`ATHOS V59 Open World\nOK: ${out.filter(x=>x.status==='OK').length}\nFalhas: ${out.filter(x=>x.status==='FALHOU').length}`);
}, 3800);
})();