# OTTHOS LIFE WORLD — V600 COMPLETE

Base limpa e integrada para novo repositório GitHub Pages ou Vercel.

## O que está incluído

### Vida e casas
- Casa inicial do Otthos.
- Entrada confirmada por botão e modal.
- Câmera interna isométrica.
- Teto e parede frontal ocultados no interior.
- Cama, geladeira, fogão, pia, chuveiro, sofá, televisão e baú.
- Necessidades: fome, energia, diversão e higiene.
- Compra de casas.
- Trancar e destrancar propriedades.
- Casas públicas: mercado e oficina.

### Bairro e Second Life Kids
- Cinco NPCs com movimento e amizade.
- Conversas contextuais.
- Moedas, reputação e tarefas.
- Trabalho infantil de entrega com carrinho de brinquedo.
- Loja, comida, água e materiais.

### Minecraft Kids
- Coleta de madeira e pedra.
- Inventário persistente.
- Construção controlada em áreas permitidas.
- Blocos, cercas e postes.
- Conserto da ponte.
- Construções salvas no navegador.

### Aventura / Mario World
- Percurso de plataformas.
- Cristais.
- Baú secreto.
- Slimes, morcegos e golem de fantasia.
- Ataque próximo e poder de fogo.
- Castelo, floresta, lago, vale e garagem.

### Recursos preservados
- AR com `athos.glb`.
- Quiz.
- Conversar com Otthos.
- Coleção e medalhas.
- Moldes 3D em `assets/moldes/`.
- Instalação PWA por botão.
- Service Worker.
- Retrato e paisagem.
- Joystick, teclado e gamepad.
- Progresso local.

### Preparação multiplayer
- `playerId` individual.
- Contrato `window.OTTHOS_MULTIPLAYER`.
- Sincronização local entre duas abas por `BroadcastChannel` para validar o formato de presença.
- Adaptadores futuros previstos: Firebase ou WebSocket.

> Multiplayer pela internet ainda exige configuração do backend e regras de segurança. A estrutura do jogador e o adaptador já estão separados para essa integração.

## Publicar

Suba todo o conteúdo do ZIP na raiz do repositório e ative GitHub Pages.

Acesse:

```text
https://SEU-USUARIO.github.io/SEU-REPOSITORIO/?v=600
```

## Limpar cache após atualização

Abra uma vez com:

```text
?v=600
```

O Service Worker V600 remove caches antigos do Athos/Otthos.

## Teste F12

Depois de clicar em **ENTRAR NO MUNDO**, cole no console o conteúdo de:

```text
F12_TESTE_OTTHOS_V600_COMPLETE.js
```

## Testes realizados antes da entrega

- Validação sintática do JavaScript com Node.
- Execução de inicialização com DOM e Three.js simulados.
- Criação do mundo em teste: 6 casas, 5 NPCs, 5 inimigos e mais de 100 interações.
- Entrada e saída da Casa do Otthos.
- Troca do modo de câmera para interior.
- Verificação de IDs HTML e seletores JavaScript.
- Verificação de estrutura PWA, moldes, AR, quiz e conversa.

Powered by thIAguinho Soluções Digitais.
