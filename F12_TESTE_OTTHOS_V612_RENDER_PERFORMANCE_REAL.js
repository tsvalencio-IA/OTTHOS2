(async()=>{
  'use strict';
  const api=window.OTTHOS_TEST_API;
  const results=[],errors=[];
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const raf=()=>new Promise(r=>requestAnimationFrame(r));
  const add=(name,status,detail='',metrics=null)=>results.push({Teste:name,Status:status,Detalhes:detail,Metrics:metrics});
  const clone=v=>JSON.parse(JSON.stringify(v));
  const onError=e=>errors.push(e.message||String(e));
  const onReject=e=>errors.push(String(e.reason?.message||e.reason||'Promise rejeitada'));
  window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onReject);
  if(!api){console.error('OTTHOS_TEST_API não encontrada. Abra a V612 publicada e execute novamente.');return;}

  async function sampleFrames(count,label){
    const frames=[];let prev=0;
    for(let i=0;i<count;i++){
      const t=await raf();
      if(prev)frames.push(t-prev);
      prev=t;
    }
    const sorted=[...frames].sort((a,b)=>a-b);
    const avg=frames.reduce((a,b)=>a+b,0)/Math.max(1,frames.length);
    const pct=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]||0;
    const fps=1000/avg,jank=frames.filter(v=>v>34).length/Math.max(1,frames.length)*100,long=frames.filter(v=>v>50).length;
    return {label,frames:frames.length,fps:+fps.toFixed(1),avgMs:+avg.toFixed(2),p95Ms:+pct(.95).toFixed(2),p99Ms:+pct(.99).toFixed(2),jankPercent:+jank.toFixed(1),longFrames:long};
  }

  const originalPlayer=clone(api.getGame().player),originalState=clone(api.getState()),wasVehicle=!!originalPlayer.vehicle;
  try{
    add('Versão V612 carregada',api.version==='V612_RENDER_COMERCIAL_SAFE'?'OK':'FALHOU',api.version);
    if(!api.getGame().running){document.querySelector('#continueBtn')?.click();await wait(1800);}
    add('Jogo em execução',api.getGame().running?'OK':'FALHOU',JSON.stringify(api.getGame().objects));

    const initial=api.render?.()||{};
    add('Renderizador ativo',initial.drawCalls>0&&initial.triangles>0?'OK':'FALHOU',JSON.stringify(initial),initial);
    add('Limite de partículas',initial.fxParticleCount<=40?'OK':'FALHOU',`${initial.fxParticleCount}/40`);
    add('Nuvens controladas',initial.cloudCount<=14?'OK':'FALHOU',String(initial.cloudCount));

    const hidden=document.hidden;
    if(hidden){
      add('Aba visível para medir FPS','AVISO','A aba está oculta; o navegador pode reduzir requestAnimationFrame.');
    }else{
      const idle=await sampleFrames(240,'mundo parado');
      const idleOk=idle.fps>=45&&idle.p95Ms<=34&&idle.jankPercent<=12;
      add('FPS real — mundo parado',idleOk?'OK':'AVISO',`FPS ${idle.fps}, p95 ${idle.p95Ms} ms, jank ${idle.jankPercent}%`,idle);

      api.prepareVehicleTest?.();api.setDriveInput?.(.28,1);
      const moving=await sampleFrames(240,'veículo em movimento');
      api.clearDriveInput?.();
      const movingOk=moving.fps>=40&&moving.p95Ms<=38&&moving.jankPercent<=16;
      add('FPS real — veículo em movimento',movingOk?'OK':'AVISO',`FPS ${moving.fps}, p95 ${moving.p95Ms} ms, jank ${moving.jankPercent}%`,moving);
    }

    const after=api.render?.()||{};
    const geometryGrowth=(after.geometryCount||0)-(initial.geometryCount||0);
    const textureGrowth=(after.textureCount||0)-(initial.textureCount||0);
    add('Memória 3D não cresce sem controle',geometryGrowth<=8&&textureGrowth<=4?'OK':'AVISO',`geometrias +${geometryGrowth}, texturas +${textureGrowth}`,{initial,after});

    const viewerDefined=!!customElements.get('model-viewer');
    const viewerReady=document.querySelector('#viewerShell')?.classList.contains('viewer-ready');
    add('AR/model-viewer sob demanda',(!viewerDefined||viewerReady)?'OK':'AVISO',`definido=${viewerDefined}, visualizador aberto=${!!viewerReady}`);
    add('Nenhum erro JavaScript novo',errors.length===0?'OK':'FALHOU',errors.join(' | '));
  }catch(e){add('Execução completa','FALHOU',e.stack||String(e));}
  finally{
    try{
      api.clearDriveInput?.();
      if(api.getGame().player.vehicle)api.exitVehicle();
      api.teleport(originalPlayer.x,originalPlayer.z);api.setSize(originalPlayer.scaleMode||'normal');
      if(!!api.getGame().player.crouched!==!!originalPlayer.crouched)api.crouch();
      if(wasVehicle)api.enterVehicle();
      localStorage.setItem('otthos_life_world_roleplay_v612',JSON.stringify({...originalState,version:612}));
      if(window.OTTHOS_DB)await window.OTTHOS_DB.save({...originalState,version:612}).catch(()=>false);
    }catch(e){add('Restaurar estado','FALHOU',String(e));}
    window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onReject);
  }

  const fail=results.filter(x=>x.Status==='FALHOU').length,ok=results.filter(x=>x.Status==='OK').length,warn=results.filter(x=>x.Status==='AVISO').length;
  const verdict=fail?'REPROVADO':warn?'APROVADO COM AVISOS DE DESEMPENHO':'APROVADO';
  console.group(`OTTHOS V612 — RENDER/PERFORMANCE REAL — ${verdict}`);console.table(results);console.log({verdict,ok,warn,fail,results});console.groupEnd();
  document.getElementById('v612-perf-panel')?.remove();
  const panel=document.createElement('div');panel.id='v612-perf-panel';panel.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#071522f5;color:white;border:2px solid #5de1ff;border-radius:18px;padding:16px;overflow:auto;font:14px system-ui';
  panel.innerHTML=`<button style="float:right;padding:10px" onclick="this.parentElement.remove()">Fechar</button><h2>V612 — ${verdict}</h2><p>${ok} OK • ${warn} avisos • ${fail} falhas.</p><table style="width:100%;border-collapse:collapse">${results.map(x=>`<tr style="background:${x.Status==='OK'?'#164c2c':x.Status==='AVISO'?'#70520f':'#692132'}"><td style="padding:8px;border-bottom:1px solid #ffffff22">${x.Teste}</td><td style="padding:8px"><b>${x.Status}</b></td><td style="padding:8px">${x.Detalhes}</td></tr>`).join('')}</table>`;
  document.body.appendChild(panel);
})();
