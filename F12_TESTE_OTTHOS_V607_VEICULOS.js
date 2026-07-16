(async()=>{
  'use strict';
  const api=window.OTTHOS_TEST_API;
  const results=[];
  const errors=[];
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const add=(name,ok,detail='')=>results.push({Teste:name,Status:ok?'OK':'FALHOU',Detalhes:detail});
  const clone=v=>JSON.parse(JSON.stringify(v));
  const onError=e=>errors.push(e.message||String(e));
  const onReject=e=>errors.push(String(e.reason?.message||e.reason||'Promise rejeitada'));
  window.addEventListener('error',onError);
  window.addEventListener('unhandledrejection',onReject);

  if(!api){console.error('OTTHOS_TEST_API não encontrada. Abra o jogo V607 publicado e execute novamente.');return;}

  const original=clone(api.getGame().player);
  const originalState=clone(api.getState());
  const originalWasVehicle=!!original.vehicle;
  try{
    add('Versão V607 carregada',api.version==='V607_VEHICLE_INTEGRATION_SAFE',api.version);
    if(!api.getGame().running){document.querySelector('#continueBtn')?.click();await wait(1400);}
    add('Jogo em execução',!!api.getGame().running,JSON.stringify(api.getGame().objects));

    if(api.getGame().player.vehicle)api.exitVehicle();
    api.teleport(0,-18);
    api.setSize('giant');
    const before=clone(api.getGame().player);
    const entered=api.enterVehicle();
    await wait(160);
    const inCar=api.vehicle();
    const gameIn=api.getGame();

    add('Entrar no carro',entered&&inCar.active,'active='+inCar.active);
    add('Otthos oculto durante a direção',!inCar.playerVisible&&!inCar.accessoriesVisible,JSON.stringify({playerVisible:inCar.playerVisible,accessoriesVisible:inCar.accessoriesVisible}));
    add('Carro visível e estacionado oculto',inCar.vehicleVisible&&!inCar.parkedVisible,JSON.stringify({vehicleVisible:inCar.vehicleVisible,parkedVisible:inCar.parkedVisible}));
    add('Tamanho forçado para normal no carro',gameIn.player.scaleMode==='normal'&&!gameIn.player.crouched,JSON.stringify({scaleMode:gameIn.player.scaleMode,crouched:gameIn.player.crouched}));
    add('Habilidade anterior preservada',inCar.preVehicleAbilities?.scaleMode===before.scaleMode,JSON.stringify(inCar.preVehicleAbilities));
    add('Carro não recebe escala Mini/Grande',Math.abs(inCar.rootScale.x-1)<.02&&Math.abs(inCar.rootScale.y-1)<.02&&Math.abs(inCar.rootScale.z-1)<.02,JSON.stringify(inCar.rootScale));
    add('Quatro rodas e duas dianteiras',inCar.wheelCount===4&&inCar.frontWheelCount===2,`rodas=${inCar.wheelCount}, dianteiras=${inCar.frontWheelCount}`);
    add('Poder vira buzina',inCar.specialLabel==='Buzina',inCar.specialLabel);

    const ballsBefore=inCar.fireballs;
    api.fire();await wait(150);
    const afterHorn=api.vehicle();
    add('Buzina não dispara bola de fogo',afterHorn.fireballs===ballsBefore,`antes=${ballsBefore}, depois=${afterHorn.fireballs}`);

    const yBefore=api.getGame().player.y;
    api.jump();await wait(160);
    const yAfter=api.getGame().player.y;
    add('Pulo bloqueado ao dirigir',Math.abs(yAfter-yBefore)<.01,`y antes=${yBefore}, depois=${yAfter}`);

    const pos0=clone(api.getGame().player);
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',key:'w',bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',key:'d',bubbles:true}));
    await wait(950);
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',key:'w',bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD',key:'d',bubbles:true}));
    const pos1=clone(api.getGame().player);const driven=Math.hypot(pos1.x-pos0.x,pos1.z-pos0.z);
    add('Aceleração e direção movimentam o carro',driven>.7&&Math.abs(api.vehicle().speed)>.5,`distância=${driven.toFixed(2)}, velocidade=${api.vehicle().speed.toFixed(2)}`);

    window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));
    await wait(100);
    const paused=api.getGame();const pauseTitle=document.querySelector('#modalTitle')?.textContent||'';
    add('ESC abre pausa real',paused.paused&&/pausado/i.test(pauseTitle),`paused=${paused.paused}, modal=${pauseTitle}`);
    add('Motor para na pausa',!api.vehicle().engineActive,'engineActive='+api.vehicle().engineActive);
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));
    await wait(120);
    add('ESC volta ao jogo',!api.getGame().paused&&document.querySelector('#modal')?.hidden===true,`paused=${api.getGame().paused}`);

    api.exitVehicle();await wait(120);
    const out=api.vehicle();const gameOut=api.getGame();
    add('Sair restaura Otthos',!out.active&&out.playerVisible&&out.accessoriesVisible&&!out.vehicleVisible,JSON.stringify(out));
    add('Tamanho anterior restaurado',gameOut.player.scaleMode===before.scaleMode,`antes=${before.scaleMode}, depois=${gameOut.player.scaleMode}`);
    add('Poder restaurado após sair',out.specialLabel==='Poder',out.specialLabel);

    const db=await window.OTTHOS_DB?.status?.();
    add('IndexedDB schema V607',db?.schema===607,JSON.stringify(db));
    const sw=(await navigator.serviceWorker?.getRegistrations?.()||[]).map(r=>r.active?.scriptURL||r.installing?.scriptURL||'');
    add('Service Worker V607',sw.length===0||sw.some(u=>u.includes('v=607')),sw.join(' | ')||'Não disponível neste contexto');
    add('Nenhum erro JavaScript durante o teste',errors.length===0,errors.join(' | '));
  }catch(e){add('Execução completa',false,e.stack||String(e));}
  finally{
    try{
      window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',key:'w',bubbles:true}));
      window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD',key:'d',bubbles:true}));
      if(api.getGame().player.vehicle)api.exitVehicle();
      api.teleport(original.x,original.z);
      api.setSize(original.scaleMode||'normal');
      if(!!api.getGame().player.crouched!==!!original.crouched)api.crouch();
      if(originalWasVehicle)api.enterVehicle();
      if(originalState){localStorage.setItem('otthos_life_world_roleplay_v607',JSON.stringify(originalState));if(window.OTTHOS_DB)await window.OTTHOS_DB.save(originalState).catch(()=>false);}
    }catch(e){results.push({Teste:'Restaurar estado após teste',Status:'FALHOU',Detalhes:String(e)});}
    window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onReject);
  }

  const ok=results.filter(x=>x.Status==='OK').length;
  const score=Math.round(ok/results.length*100);
  console.group(`OTTHOS V607 — TESTE DE VEÍCULOS ${score}%`);
  console.table(results);
  console.log({score,aprovados:ok,total:results.length,results});
  console.groupEnd();
  const old=document.getElementById('v607-test-panel');if(old)old.remove();
  const panel=document.createElement('div');panel.id='v607-test-panel';panel.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#071522f5;color:white;border:2px solid #5de1ff;border-radius:18px;padding:16px;overflow:auto;font:14px system-ui';
  panel.innerHTML=`<button style="float:right;padding:10px" onclick="this.parentElement.remove()">Fechar</button><h2>Teste V607 — ${score}%</h2><p>${ok} de ${results.length} aprovados.</p><table style="width:100%;border-collapse:collapse">${results.map(x=>`<tr style="background:${x.Status==='OK'?'#164c2c':'#692132'}"><td style="padding:8px;border-bottom:1px solid #ffffff22">${x.Teste}</td><td style="padding:8px"><b>${x.Status}</b></td><td style="padding:8px">${x.Detalhes}</td></tr>`).join('')}</table>`;
  document.body.appendChild(panel);
})();
