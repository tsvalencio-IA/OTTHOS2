(async()=>{
'use strict';
const api=window.OTTHOS_TEST_API,results=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
const add=(name,ok,details='')=>results.push({Teste:name,Status:ok?'OK':'FALHOU',Detalhes:details});
if(!api){console.error('OTTHOS_TEST_API ausente. Abra a V613 publicada.');return;}
const original=JSON.parse(JSON.stringify(api.getGame().player));
try{
 add('Versão V613',api.version==='V613_GAMEPLAY_ART_DIRECTION',api.version);
 if(!api.getGame().running){document.querySelector('#continueBtn')?.click();await wait(1200);}
 const controls=['joystick','runBtn','actionBtn','jumpBtn','specialBtn','cameraNearBtn','cameraFarBtn','cameraResetBtn','miniNav'];
 const missing=controls.filter(id=>!document.getElementById(id));add('Controles completos',missing.length===0,missing.join(', ')||'todos presentes');
 api.teleport(0,8);const p0=api.getGame().player;api.sprint(true);
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',key:'w',bubbles:true}));await wait(800);
 window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',key:'w',bubbles:true}));api.sprint(false);
 const p1=api.getGame().player,dist=Math.hypot(p1.x-p0.x,p1.z-p0.z);add('Corrida desloca o Otthos',dist>3.5,`distância=${dist.toFixed(2)}`);
 api.setWaypoint('gym');await wait(100);const map=api.map();add('Rota calculada',Array.isArray(map.route)&&map.route.length>=2,JSON.stringify(map.route));
 add('Minimapa ativo',!!document.getElementById('miniMapCanvas')&&document.getElementById('miniNavName').textContent.length>0,document.getElementById('miniNavName').textContent);
 const z0=api.camera().zoom;api.setCameraZoom(z0+2);add('Zoom da câmera',Math.abs(api.camera().zoom-(z0+2))<.01,JSON.stringify(api.camera()));
 api.clearWaypoint();add('Execução completa',true,'sem exceção');
}catch(e){add('Execução completa',false,e.stack||String(e));}
finally{try{api.sprint(false);api.clearWaypoint();api.teleport(original.x,original.z);api.setCameraZoom(0);}catch{}}
const ok=results.filter(x=>x.Status==='OK').length,score=Math.round(ok/results.length*100);
console.group(`OTTHOS V613 — TESTE GAMEPLAY/ROTA ${score}%`);console.table(results);console.groupEnd();
document.getElementById('v613-test-panel')?.remove();const p=document.createElement('div');p.id='v613-test-panel';p.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#071522f5;color:#fff;border:2px solid #5de1ff;border-radius:18px;padding:16px;overflow:auto;font:14px system-ui';
p.innerHTML=`<button style="float:right;padding:10px" onclick="this.parentElement.remove()">Fechar</button><h2>Teste V613 — ${score}%</h2><p>${ok} de ${results.length} aprovados.</p><table style="width:100%;border-collapse:collapse">${results.map(x=>`<tr style="background:${x.Status==='OK'?'#164c2c':'#692132'}"><td style="padding:8px">${x.Teste}</td><td style="padding:8px"><b>${x.Status}</b></td><td style="padding:8px">${x.Detalhes}</td></tr>`).join('')}</table>`;document.body.appendChild(p);
})();