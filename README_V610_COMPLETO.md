# OTTHOS LIFE WORLD V610 — VEÍCULO COM ESCALA ISOLADA

Base: V609 completa.

## Correção cirúrgica

- A raiz física do carro é forçada para escala 1×1×1 imediatamente ao entrar.
- Mini, Grande e Abaixar continuam salvos, mas não deformam a carroceria.
- A restauração do tamanho do Otthos acontece imediatamente ao sair, sem esperar outro frame.
- O loop principal reaplica a regra em todos os frames: carro em escala 1; Otthos em Mini/Normal/Grande e Abaixar conforme o perfil.
- Entradas de teclado, joystick, gamepad e auditoria da V609 foram preservadas.
- Casas, interiores, NPCs, missões, mapa, construção, AR, quiz, coleção, moldes, PWA e salvamento foram preservados.

## Avisos do console

Os avisos de múltiplas instâncias do Three.js e mensagens do model-viewer pertencem ao visualizador AR do lobby. Eles não foram tratados como falhas de física e não bloqueiam o jogo.

## Teste

Execute `F12_TESTE_OTTHOS_V610_VEICULO_ESCALA_ISOLADA.js` no Console da versão publicada.
