# OTTHOS LIFE WORLD V607 — VEÍCULOS CORRIGIDOS E INTEGRADOS

Versão completa baseada no ZIP corrigido do Claude, preservando integralmente a base V605/V606 e aplicando correções cirúrgicas na integração do carro, cache, salvamento e pausa.

## Correções aplicadas

- Cadeia inteira de versão e cache atualizada para **V607**.
- Migração automática dos saves V606, V605 e anteriores.
- Service Worker registrado com `sw.js?v=607`.
- IndexedDB identificado como schema 607, mantendo a mesma estrutura física do banco.
- Tamanho e estado de abaixar são guardados antes de entrar no carro e restaurados ao sair.
- Otthos e acessórios ficam ocultos durante a direção e reaparecem ao sair.
- Carro permanece em escala normal, sem deformação por Mini/Grande/Abaixar.
- Pular continua bloqueado enquanto dirige.
- Poder vira **Buzina** dentro do carro e volta a ser Poder ao sair.
- O carro não dispara bolas de fogo acidentalmente.
- Pausa pelo botão ou pela tecla `Esc` usa a mesma lógica; o motor para e volta corretamente.
- Fechar o modal de pausa pelo X ou pelo fundo também retoma o jogo, sem travar em pausa invisível.
- Colisão do carro evoluída de um único círculo central para sete sondas orientadas pela direção da carroceria.
- Impacto devolve o carro à posição anterior, reduz velocidade e aplica feedback curto.
- Velocímetro aparece no aviso do veículo.
- Abrir mapa/configurações zera os comandos de movimento para o carro não continuar acelerando atrás do modal.
- Opção de instalação nas configurações aparece somente quando a instalação é realmente oferecida ou no iOS, e desaparece quando instalado.
- `.nojekyll` preservado.

## Sistemas preservados

Casas, interiores, NPCs, diálogos, necessidades, profissões, construção, quiz, corridas a pé, mapa, coleção, moldes, AR, personalização, salvamento automático, joystick, teclado, gamepad e multiplayer local experimental não foram removidos.

## Publicação

1. Apague os arquivos antigos do repositório de teste.
2. Envie todo o conteúdo deste ZIP para a raiz.
3. Aguarde o GitHub Pages concluir o deploy.
4. Abra uma vez com `?v=607`.
5. Em PWA já instalada, feche totalmente o aplicativo e abra novamente após o deploy.

## Teste F12

Use `F12_TESTE_OTTHOS_V607_VEICULOS.js` no Console depois de publicar. Ele testa entrada/saída, preservação das habilidades, buzina, bloqueio de pulo, direção, pausa, motor, banco e Service Worker.

## Limites honestos da validação

A lógica foi executada em Chromium headless com DOM real e uma camada Three.js simulada, além de validações estáticas e testes de layout. O render WebGL real, áudio real e sensação de direção ainda precisam ser confirmados no celular publicado.
