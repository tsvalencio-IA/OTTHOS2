(async()=>{
  'use strict';
  const api=window.OTTHOS_TEST_API,results=[],errors=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
  const add=(name,ok,detail='')=>results.push({Teste:name,Status:ok?'OK':'FALHOU',Detalhes:detail});
  const clone=v=>JSON.parse(JSON.stringify(v));
  const onError=e=>errors.push(e.message||String(e));const onReject=e=>errors.push(String(e.reason?.message||e.reason||'Promise rejeitada'));
  window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onReject);
  if(!api){console.error('OTTHOS_TEST_API não encontrada. Abra a V608 publicada e execute novamente.');return;}
  const original=clone(api.getGame().player),originalState=clone(api.getState()),originalWasVehicle=!!original.vehicle;
  try{
    add('Versão V608 carregada',api.version==='V608_VEHICLE_INPUT_STABLE',api.version);
    if(!api.getGame().running){document.querySelector('#continueBtn')?.click();await wait(1600);}
    add('Jogo em execução',!!api.getGame().running,JSON.stringify(api.getGame().objects));

    const prepared=api.prepareVehicleTest();await wait(180);
    add('Entrada de teste em área livre',prepared.active&&prepared.z===-40,JSON.stringify(prepared));
    const inCar=api.vehicle();
    add('Estado doméstico não bloqueia o carro',inCar.sitUntilRemaining===0,`sitUntil=${inCar.sitUntilRemaining}`);
    add('Otthos oculto durante a direção',!inCar.playerVisible&&!inCar.accessoriesVisible,JSON.stringify({playerVisible:inCar.playerVisible,accessoriesVisible:inCar.accessoriesVisible}));
    add('Carro em escala independente',Math.abs(inCar.rootScale.x-1)<.02&&Math.abs(inCar.rootScale.y-1)<.02&&Math.abs(inCar.rootScale.z-1)<.02,JSON.stringify(inCar.rootScale));
    add('Quatro rodas e duas dianteiras',inCar.wheelCount===4&&inCar.frontWheelCount===2,`rodas=${inCar.wheelCount}, dianteiras=${inCar.frontWheelCount}`);

    // Teste determinístico da física, sem depender de KeyboardEvent sintético do console.
    const p0=clone(api.getGame().player);api.setDriveInput(.45,1);await wait(1500);api.setDriveInput(0,0);await wait(80);
    const p1=clone(api.getGame().player),v1=api.vehicle(),dist=Math.hypot(p1.x-p0.x,p1.z-p0.z);
    add('Física acelera, esterça e desloca o carro',dist>2&&Math.abs(v1.speed)>1.2,`distância=${dist.toFixed(2)}, velocidade=${v1.speed.toFixed(2)}, input=${JSON.stringify(v1.driveInput)}`);

    // Teste separado da ponte teclado -> input do jogo.
    api.prepareVehicleTest();await wait(120);const k0=clone(api.getGame().player);
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',key:'w',bubbles:true}));
    await wait(700);
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',key:'w',bubbles:true}));
    const k1=clone(api.getGame().player),kd=Math.hypot(k1.x-k0.x,k1.z-k0.z),kv=api.vehicle();
    add('Teclado W chega à física do carro',kd>.45||Math.abs(kv.speed)>.8,`distância=${kd.toFixed(2)}, velocidade=${kv.speed.toFixed(2)}, input=${JSON.stringify(kv.driveInput)}`);

    const balls=api.vehicle().fireballs;api.fire();await wait(100);add('Buzina não dispara poder',api.vehicle().fireballs===balls,`antes=${balls}, depois=${api.vehicle().fireballs}`);
    const y=api.getGame().player.y;api.jump();await wait(120);add('Pulo bloqueado no carro',Math.abs(api.getGame().player.y-y)<.01,`y=${y}`);

    window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));await wait(100);
    add('ESC pausa e para motor',api.getGame().paused&&!api.vehicle().engineActive,`paused=${api.getGame().paused}, engine=${api.vehicle().engineActive}`);
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));await wait(100);
    add('ESC continua o jogo',!api.getGame().paused,`paused=${api.getGame().paused}`);

    api.exitVehicle();await wait(100);const out=api.vehicle();
    add('Sair restaura Otthos',!out.active&&out.playerVisible&&out.accessoriesVisible&&!out.vehicleVisible,JSON.stringify(out));
    const db=await window.OTTHOS_DB?.status?.();add('IndexedDB schema V608',db?.schema===608,JSON.stringify(db));
    const base=new URL('./',location.href).href;const regs=(await navigator.serviceWorker?.getRegistrations?.()||[]).filter(r=>r.scope===base);const urls=regs.map(r=>r.active?.scriptURL||r.installing?.scriptURL||'');
    add('Service Worker do escopo atual é V608',regs.length===0||urls.some(u=>u.includes('v=608')),urls.join(' | ')||'Não disponível');
    add('Nenhum erro JavaScript novo',errors.length===0,errors.join(' | '));
  }catch(e){add('Execução completa',false,e.stack||String(e));}
  finally{
    try{window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',key:'w',bubbles:true}));api.setDriveInput?.(0,0);if(api.getGame().player.vehicle)api.exitVehicle();api.teleport(original.x,original.z);api.setSize(original.scaleMode||'normal');if(!!api.getGame().player.crouched!==!!original.crouched)api.crouch();if(originalWasVehicle)api.enterVehicle();localStorage.setItem('otthos_life_world_roleplay_v608',JSON.stringify(originalState));if(window.OTTHOS_DB)await window.OTTHOS_DB.save(originalState).catch(()=>false);}catch(e){add('Restaurar estado',false,String(e));}
    window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onReject);
  }
  const ok=results.filter(x=>x.Status==='OK').length,score=Math.round(ok/results.length*100);
  console.group(`OTTHOS V608 — TESTE VEÍCULO/ENTRADA ${score}%`);console.table(results);console.log({score,aprovados:ok,total:results.length,results});console.groupEnd();
  document.getElementById('v608-test-panel')?.remove();const panel=document.createElement('div');panel.id='v608-test-panel';panel.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#071522f5;color:white;border:2px solid #5de1ff;border-radius:18px;padding:16px;overflow:auto;font:14px system-ui';panel.innerHTML=`<button style="float:right;padding:10px" onclick="this.parentElement.remove()">Fechar</button><h2>Teste V608 — ${score}%</h2><p>${ok} de ${results.length} aprovados.</p><table style="width:100%;border-collapse:collapse">${results.map(x=>`<tr style="background:${x.Status==='OK'?'#164c2c':'#692132'}"><td style="padding:8px;border-bottom:1px solid #ffffff22">${x.Teste}</td><td style="padding:8px"><b>${x.Status}</b></td><td style="padding:8px">${x.Detalhes}</td></tr>`).join('')}</table>`;document.body.appendChild(panel);
})();
