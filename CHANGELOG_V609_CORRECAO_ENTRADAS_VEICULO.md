# OTTHOS LIFE WORLD V609 — Correção das entradas do veículo

## Causa raiz confirmada

A V608 tinha dois problemas diferentes:

1. `OTTHOS_TEST_API.setDriveInput()` gravava diretamente em `input.targetX/targetZ`, mas `updateInputFromKeys()` zerava esses valores no frame seguinte quando nenhuma tecla ou joystick físico estava ativo.
2. O gamepad também escrevia diretamente no mesmo alvo e podia ser apagado pela rotina de teclado logo depois.

Além disso, testes baseados em `await wait(...)` dentro do Console podem observar poucos frames quando o navegador reduz o `requestAnimationFrame` enquanto o foco está no DevTools. Isso tornava a medição por tempo real inadequada para validar a física.

## Alterações

- Entrada de movimento separada em canais:
  - teclado;
  - joystick de tela;
  - gamepad;
  - entrada virtual de auditoria.
- Um canal não apaga mais o outro acidentalmente.
- Joystick e gamepad passam pelo mesmo resolvedor de entrada usado pela movimentação.
- Entrada virtual permanece ativa até ser explicitamente limpa.
- Ao entrar e sair do carro, todas as entradas são zeradas para evitar aceleração presa.
- Área de teste do veículo alterada para uma região livre do mapa.
- Adicionado teste determinístico de física com passo fixo de 1/60 s, independente do FPS e do foco do DevTools.
- Adicionados diagnóstico de colisões e informações das fontes de entrada na API de teste.
- Cadeia completa atualizada para V609:
  - save;
  - IndexedDB;
  - Service Worker;
  - cache;
  - manifest;
  - HTML;
  - 404;
  - BroadcastChannel.

## Preservado

Não foram removidos ou simplificados:

- casas e interiores;
- NPCs e interações sociais;
- missões e empregos;
- ginásio, corridas e pega-moedas;
- construção;
- Mini, Normal, Grande, Abaixar e Girar;
- AR e `athos.glb` no lobby/visualizador;
- quiz;
- coleção;
- moldes;
- PWA;
- salvamento e migração dos saves anteriores.
