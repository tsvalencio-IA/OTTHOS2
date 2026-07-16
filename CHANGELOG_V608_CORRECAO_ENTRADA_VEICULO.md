# V608 — correção da entrada e física do veículo

Base: V607 completa.

## Falha comprovada no teste V607
O teste registrou `distância=0.01` e `velocidade=0.45`. O veículo podia herdar `sitUntil` de ações como sofá, cama, TV ou banho. Em `updatePlayer`, esse estado era processado antes da física do carro e congelava aceleração/direção até o temporizador terminar.

## Correções
- Física do veículo agora tem prioridade sobre estados de animação doméstica.
- Entrar no veículo limpa `sitUntil`, ataque, giro, pulo pendente e velocidades verticais.
- Entrada do joystick/teclado é atualizada em todos os estados.
- Save corrigido: a V607 ainda gravava internamente `state.version = 606`; agora grava 608.
- Migração automática inclui a V607.
- Cache, manifest, Service Worker, IndexedDB e referências atualizados para V608.
- Novo teste separa física determinística, teclado e escopo real do Service Worker.

Nenhum sistema de casas, NPCs, missões, mapa, AR, quiz, coleção, moldes ou construção foi removido.
