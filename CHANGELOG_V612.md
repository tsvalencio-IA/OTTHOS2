# CHANGELOG V612

## Base segura
- V610 preservada como núcleo funcional.
- Melhorias visuais da V611 integradas sem importar arquivos de render/testes antigos que não pertenciam à base.

## AR e visualizador
- Removido carregamento por `requestIdleCallback`.
- Criado carregamento explícito e reutilizável por Promise.
- Tratamento de timeout, erro de rede e nova tentativa.
- `athos.glb` fora do precache inicial.

## Render
- Otthos visual V611 preservado.
- Água animada preservada.
- Detalhes de casas e veículo preservados.
- Placas com fonte adaptativa, duas linhas e `DoubleSide`.
- NPCs com membros em pivôs e animação de caminhada/conversa.
- Limite de partículas preservado em 40.

## PWA
- Jogo/cache/manifest: V612.
- IndexedDB: schema 610, sem migração desnecessária de estrutura.
- Cache com nome exclusivo e sem exclusão global de caches de outros repositórios.

## Validação
- Sintaxe JavaScript.
- IDs HTML.
- referências locais.
- manifest.
- integridade do pacote.
- comparação das funções críticas de veículo com a V610.
