(async()=>{
  'use strict';
  const api=window.OTTHOS_TEST_API,results=[],errors=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
  const add=(name,ok,detail='')=>results.push({Teste:name,Status:ok?'OK':'FALHOU',Detalhes:detail});
  const clone=v=>JSON.parse(JSON.stringify(v));
  const onError=e=>errors.push(e.message||String(e));
  const onReject=e=>errors.push(String(e.reason?.message||e.reason||'Promise rejeitada'));
  window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onReject);
  if(!api){console.error('OTTHOS_TEST_API não encontrada. Abra a V613 publicada e execute novamente.');return;}

  const original=clone(api.getGame().player),originalState=clone(api.getState()),originalWasVehicle=!!original.vehicle;
  try{
    add('Versão V613 carregada',api.version==='V613_GAMEPLAY_ART_DIRECTION',api.version);
    if(!api.getGame().running){document.querySelector('#continueBtn')?.click();await wait(1600);}
    add('Jogo em execução',!!api.getGame().running,JSON.stringify(api.getGame().objects));

    const prepared=api.prepareVehicleTest();
    add('Área de teste livre preparada',prepared.active&&prepared.z===-70&&prepared.heading===0,JSON.stringify(prepared));
    const initial=api.vehicle();
    add('Otthos oculto no carro',!initial.playerVisible&&!initial.accessoriesVisible,JSON.stringify({playerVisible:initial.playerVisible,accessoriesVisible:initial.accessoriesVisible}));
    add('Carro em escala independente',Math.abs(initial.rootScale.x-1)<.02&&Math.abs(initial.rootScale.y-1)<.02&&Math.abs(initial.rootScale.z-1)<.02,JSON.stringify(initial.rootScale));
    add('Quatro rodas e duas dianteiras',initial.wheelCount===4&&initial.frontWheelCount===2,`rodas=${initial.wheelCount}, dianteiras=${initial.frontWheelCount}`);

    const override=api.setDriveInput(.45,1);
    const resolved=api.refreshInput();
    add('Entrada virtual não é apagada pelo teclado',override.active&&resolved.z===1&&Math.abs(resolved.x-.45)<.001,JSON.stringify({override,resolved,vehicle:api.vehicle().driveInput}));
    api.clearDriveInput();

    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',key:'w',bubbles:true}));
    const keyDown=api.refreshInput();
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',key:'w',bubbles:true}));
    const keyUp=api.refreshInput();
    add('Teclado W entra e sai do resolvedor de movimento',keyDown.z===1&&keyUp.z===0,JSON.stringify({keyDown,keyUp}));

    api.prepareVehicleTest();
    const sim=api.stepVehicleSimulation(120,.35,1);
    add('Física determinística acelera e desloca o carro',sim.distance>8&&sim.speed>8&&sim.impacts===0,JSON.stringify(sim));

    const beforeBalls=api.vehicle().fireballs;api.fire();await wait(80);
    add('Buzina não dispara poder',api.vehicle().fireballs===beforeBalls,`antes=${beforeBalls}, depois=${api.vehicle().fireballs}`);
    const y=api.getGame().player.y;api.jump();await wait(80);
    add('Pulo bloqueado no carro',Math.abs(api.getGame().player.y-y)<.01,`y=${y}`);

    window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));await wait(80);
    add('ESC pausa e desliga motor',api.getGame().paused&&!api.vehicle().engineActive,`paused=${api.getGame().paused}, engine=${api.vehicle().engineActive}`);
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));await wait(80);
    add('ESC continua o jogo',!api.getGame().paused,`paused=${api.getGame().paused}`);

    api.exitVehicle();await wait(80);const out=api.vehicle();
    add('Sair restaura Otthos',!out.active&&out.playerVisible&&out.accessoriesVisible&&!out.vehicleVisible,JSON.stringify(out));
    const restoredScale=api.vehicle().rootScale;const expected=original.scaleMode==='mini'?.58:original.scaleMode==='giant'?1.42:1;const expectedY=expected*(original.crouched?.68:1);
    add('Escala anterior do Otthos é restaurada',Math.abs(restoredScale.x-expected)<.02&&Math.abs(restoredScale.y-expectedY)<.02&&Math.abs(restoredScale.z-expected)<.02,JSON.stringify({original:{scaleMode:original.scaleMode,crouched:original.crouched},rootScale:restoredScale,expected:{x:expected,y:expectedY,z:expected}}));

    const db=await window.OTTHOS_DB?.status?.();
    add('IndexedDB schema preservado em 610',db?.schema===610,JSON.stringify(db));
    const base=new URL('./',location.href).href;
    const regs=(await navigator.serviceWorker?.getRegistrations?.()||[]).filter(r=>r.scope===base);
    const urls=regs.map(r=>r.active?.scriptURL||r.installing?.scriptURL||'');
    add('Service Worker do escopo atual é V613',regs.length===0||urls.some(u=>u.includes('v=612')),urls.join(' | ')||'Não disponível');
    add('Nenhum erro JavaScript novo',errors.length===0,errors.join(' | '));
  }catch(e){add('Execução completa',false,e.stack||String(e));}
  finally{
    try{
      window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',key:'w',bubbles:true}));
      api.clearDriveInput?.();
      if(api.getGame().player.vehicle)api.exitVehicle();
      api.teleport(original.x,original.z);api.setSize(original.scaleMode||'normal');
      if(!!api.getGame().player.crouched!==!!original.crouched)api.crouch();
      if(originalWasVehicle)api.enterVehicle();
      localStorage.setItem('otthos_life_world_roleplay_v613',JSON.stringify({...originalState,version:613}));
      if(window.OTTHOS_DB)await window.OTTHOS_DB.save({...originalState,version:613}).catch(()=>false);
    }catch(e){add('Restaurar estado',false,String(e));}
    window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onReject);
  }

  const ok=results.filter(x=>x.Status==='OK').length,score=Math.round(ok/results.length*100);
  console.group(`OTTHOS V613 — TESTE VEÍCULO/ENTRADAS ${score}%`);console.table(results);console.log({score,aprovados:ok,total:results.length,results});console.groupEnd();
  document.getElementById('v613-test-panel')?.remove();
  const panel=document.createElement('div');panel.id='v613-test-panel';panel.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#071522f5;color:white;border:2px solid #5de1ff;border-radius:18px;padding:16px;overflow:auto;font:14px system-ui';
  panel.innerHTML=`<button style="float:right;padding:10px" onclick="this.parentElement.remove()">Fechar</button><h2>Teste V613 — ${score}%</h2><p>${ok} de ${results.length} aprovados.</p><p><b>Nota:</b> a física é validada por passos fixos, sem depender do requestAnimationFrame, que pode ser reduzido enquanto o foco está no DevTools.</p><table style="width:100%;border-collapse:collapse">${results.map(x=>`<tr style="background:${x.Status==='OK'?'#164c2c':'#692132'}"><td style="padding:8px;border-bottom:1px solid #ffffff22">${x.Teste}</td><td style="padding:8px"><b>${x.Status}</b></td><td style="padding:8px">${x.Detalhes}</td></tr>`).join('')}</table>`;
  document.body.appendChild(panel);
})();
