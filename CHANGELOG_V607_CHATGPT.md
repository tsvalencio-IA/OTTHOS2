# CHANGELOG V607 — Revisão sênior sobre a versão Claude

## Bugs corrigidos após a auditoria

1. Registro do Service Worker ainda apontava para V605.
2. Schema e teste de salvamento estavam inconsistentes com a versão do jogo.
3. Mini/Grande/Abaixar eram forçados para normal ao entrar, mas não eram restaurados ao sair.
4. A interface de habilidades podia ficar divergente do estado salvo.
5. `Esc` pausava apenas uma variável e podia deixar o motor tocando.
6. Fechar o modal de pausa pelo X podia deixar o jogo travado em pausa sem janela.
7. Poder ainda disparava fogo com Otthos oculto dentro do carro.
8. Colisão usava uma aproximação circular única, permitindo cortes nos cantos da carroceria.
9. Abrir modal dirigindo podia deixar entrada de aceleração ativa.
10. Instalar aplicativo ainda podia aparecer nas configurações sem uma instalação realmente disponível.

## Evoluções seguras

- Buzina contextual no botão Poder durante a direção.
- Velocímetro no aviso do carro.
- Colisão multiponto orientada pela direção do veículo, sem reescrever as colisões do personagem.
- API de teste ampliada para inspecionar veículo, rodas, visibilidade, escala, motor e entrada/saída.
- Teste F12 específico para veículos.

## O que não foi reescrito

Nenhuma lógica de casas, interiores, NPCs, missões, mapa, construção, inventário, AR, quiz, coleção ou moldes foi substituída.
