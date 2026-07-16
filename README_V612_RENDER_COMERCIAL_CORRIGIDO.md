# OTTHOS LIFE WORLD V612 — Render comercial corrigido

Base: V610 estável (veículos 18/18) + melhorias visuais aproveitadas da V611, com correções de arquitetura e limpeza do pacote.

## Correções desta versão

- pacote reconstruído sobre a estrutura completa da V610, sem os 66 arquivos históricos/duplicados adicionados indevidamente na V611;
- `model-viewer` e `athos.glb` não são carregados no boot;
- visualizador 3D/AR passa a ser carregado apenas após ação explícita do usuário;
- nova tentativa automática é possível se o CDN ou o modelo falhar;
- `athos.glb` removido do cache inicial do Service Worker e armazenado apenas após o primeiro uso;
- Service Worker não apaga caches de outros projetos no mesmo domínio;
- placas com texto adaptativo, quebra em até duas linhas e material visível dos dois lados;
- NPCs com pivôs reais nos braços/pernas, caminhada e reação visual ao Otthos próximo;
- teste F12 de performance agora mede FPS, frame time p95/p99 e frames engasgados por `requestAnimationFrame`;
- teste de regressão do veículo V612 preservado;
- schema do IndexedDB mantido em 610 porque a estrutura de dados não mudou;
- versão do jogo, cache, manifest e estado atualizados para 612.

## Preservado

Física e escala do veículo, teclado, joystick, gamepad, buzina, pausa, personagem procedural, Mini/Normal/Grande/Abaixar, casas, interiores, NPCs, missões, mapa, construção, AR, quiz, coleção, moldes, PWA e salvamento.

## Publicação

Substitua todo o conteúdo do repositório pelo conteúdo deste ZIP e abra uma vez com `?v=612`.

## Testes incluídos

- `F12_TESTE_OTTHOS_V612_REGRESSAO_VEICULO.js`
- `F12_TESTE_OTTHOS_V612_RENDER_PERFORMANCE_REAL.js`

A validação estrutural e sintática foi executada. O ambiente de geração bloqueou a abertura de páginas locais no Chromium por política administrativa, portanto render WebGL, FPS real e AR devem ser confirmados no endereço publicado e no celular.
