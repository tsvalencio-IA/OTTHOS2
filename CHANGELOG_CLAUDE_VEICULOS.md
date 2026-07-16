# CHANGELOG — Passe de melhoria "Mundo aberto / Veículos" (Claude)

Base: OTTHOS LIFE WORLD V605 (recebida em
`OTTHOS_LIFE_WORLD_V605_COMPLETO_BASE_ESTAVEL.zip`). Nenhum sistema de vida
(NPCs, casas, necessidades, construção, quiz, IndexedDB) foi tocado — a
mudança foi cirúrgica, focada em **1) visual geral** e **2) dirigir o carro**,
como combinamos.

## Por que o jogo parecia "sem graça" (causa raiz, não falta de arte)

1. **Bug real de textura**: o chão usava uma textura de 64×64px repetida
   28×28 vezes com `NearestMipMapNearestFilter` sem anisotropia. A uma
   distância normal de câmera, isso faz o mipmap "lavar" a textura para uma
   cor quase sólida — por isso o chão parecia liso e sem grama no vídeo,
   mesmo o código já desenhando grama.
2. **O "carro" era só um multiplicador de velocidade**: ao entrar no
   carrinho, o jogador continuava se movendo exatamente como a pé (mesmo
   joystick de 8 direções, sem inércia, sem curva, virando instantaneamente
   pra qualquer lado) — só que mais rápido. Não existia física de veículo
   nenhuma, por isso "dirigir" não tinha graça nenhuma.
3. Céu era uma cor sólida chapada, sem gradiente, sem sol, sem nuvens.

## O que foi mudado

### Visual (chão, céu, estrada)
- Textura procedural em 128×128 (antes 64×64), com `LinearMipmapLinearFilter`
  + anisotropia máxima da GPU — a grama, a estrada, a madeira e o tijolo não
  "lavam" mais para cor sólida à distância.
- Estrada agora é **asfalto cinza-escuro com faixa amarela central tracejada
  e calçada com meio-fio**, em vez do caminho marrom-terra anterior — lê como
  rua de verdade, não trilha de terra.
- Céu com gradiente (azul no topo → quase branco no horizonte), sol visível e
  nuvens simples flutuando, no lugar da cor sólida chapada.

### Dirigir o carro (o pilar pedido)
- **Física real de carro** em `updateVehiclePhysics()`: aceleração e frenagem
  com curva (acelera mais forte a baixa velocidade, perde força perto da
  velocidade máxima; frear é mais forte que dar ré), direção com raio de
  curva dependente da velocidade (quase não vira parado, vira melhor em
  velocidade média, fica mais "pesado" para virar em alta velocidade) e
  **derrapagem real**: em curva fechada e velocidade alta, a velocidade do
  carro atrasa em relação para onde ele está apontando — o carro escorrega de
  lado, com poeira saindo dos pneus e um som de derrapagem.
- **Carro com carroceria de verdade**: para-brisa, faróis e lanternas
  emissivos, spoiler inferior, e 4 rodas independentes que giram de verdade
  conforme a velocidade e viram para os lados ao curvar.
- **Suspensão simples**: o carro inclina de leve para trás ao acelerar e para
  frente ao frear (efeito de "squat/dive"), e inclina de lado ao derrapar.
- **Som de motor contínuo** (não só um "beep"): o tom sobe com a velocidade,
  liga ao entrar no carro e desliga ao sair.
- **Câmera de perseguição estilo GTA**: no carro, a câmera se reposiciona
  sozinha atrás da direção do carro (em vez de ficar presa ao ângulo livre de
  quando você estava a pé), recua e ganha campo de visão (FOV) conforme a
  velocidade aumenta, para dar sensação de velocidade.
- O carro estacionado no mundo (antes de entrar) usa a mesma carroceria nova,
  para não haver troca brusca de visual ao entrar.

## O que **não** foi mexido (por escolha, para não desestabilizar o resto)

- Sistemas de casas, interiores, NPCs, diálogos, necessidades (fome/energia/
  higiene/diversão), construção, quiz, corridas a pé, mapa GPS, salvamento em
  IndexedDB, multiplayer-ready — tudo isso continua exatamente como estava.
- O layout de ruas (posições) não mudou, só o material/visual delas — não
  quis arriscar reposicionar casas/NPCs que dependem das coordenadas atuais.

## Limitações conhecidas desta passada

- É uma melhoria de **profundidade média** ("os dois, mas mais raso"), como
  você pediu — não é um motor de física de carro completo (sem suspensão por
  roda independente, sem dano de colisão, sem múltiplos veículos ainda).
- Colisão do carro contra paredes/casas continua simples (para na parede),
  sem ricochete — igual já era para o personagem a pé.
- Não há tráfego de outros carros nem semáforos — a "cidade viva" de GTA
  (NPCs dirigindo, trânsito) fica para uma próxima leva, se for essa a
  prioridade depois.
- Testes executados foram estáticos (sintaxe via esbuild, checagem de chaves
  balanceadas, revisão de código) — não há navegador neste ambiente para
  gravar um vídeo de teste real; recomendo testar no celular e me mandar
  feedback específico do que ainda incomoda na direção.

## Próximos passos sugeridos (se quiser continuar nessa pilar)

1. Adicionar 1-2 veículos diferentes (moto ágil / caminhão pesado) com curvas
   de física distintas.
2. Trânsito simples: 2-3 carros de NPC andando em loop pelas ruas existentes.
3. Dano visual leve ao bater (arranhado/fumaça) sem mexer no sistema de vida.
4. Rampas/obstáculos de manobra para curtir a derrapagem (parte divertida do
   GTA/arcade racing).

---

## Correções após revisão técnica externa (V606.1)

Uma segunda IA revisou o ZIP anterior comparando-o linha a linha com a base
V605. A revisão foi tecnicamente correta em praticamente todos os pontos —
conferi cada um no código antes de corrigir. Nada disso é cosmético; eram
bugs reais introduzidos pela pressa da primeira entrega. Lista do que foi
corrigido:

1. **`.nojekyll` sumiu por engano.** Causa raiz: eu usei `cp pasta/* destino`
   no terminal, e o `*` do shell não copia arquivos ocultos (que começam com
   `.`). Não foi uma remoção intencional, foi um bug de cópia. Restaurado.

2. **O Otthos ficava visível dentro do carro** (pernas/corpo atravessando a
   carroceria). Corrigido: `playerModel.visible=false` e
   `avatarLayer.visible=false` ao entrar no carro (e `true` de novo ao sair).

3. **Mini/Grande/Abaixar deformavam o carro**, porque o carro é filho do
   mesmo grupo 3D que recebe a escala do tamanho do personagem. Corrigido na
   raiz: ao entrar no carro, o tamanho é forçado para `normal` e o agachar é
   desligado; e agora **não dá mais para trocar de tamanho, agachar ou girar
   enquanto dirige** (os botões ficam visualmente apagados/bloqueados, sem
   sumir do jogo, e voltam ao normal ao sair do carro).

4. **O carro ainda pulava** com o botão normal de pular. Corrigido:
   `canJump()` agora retorna falso enquanto `player.vehicle` é verdadeiro, e
   o botão de pular fica visualmente desativado durante a direção.

5. **As rodas dianteiras que viravam eram, na verdade, as de trás.** Os
   faróis estão no lado `z=+1.24` (frente), mas eu tinha marcado como
   dianteiras as rodas em `z=-0.78`. Invertido — agora as rodas do lado dos
   faróis são as que viram ao curvar.

6. **Colisão do carro menor que a carroceria** (raio de 0,65 contra uma
   carroceria de ~1,86×2,50). Aumentado para um raio de 1,1 — ainda é uma
   colisão simplificada (círculo, não uma caixa orientada de verdade), mas
   agora não deixa mais a carroceria visualmente atravessar paredes/cercas.

7. **Bater na parede não tirava velocidade real.** O carro ficava "vibrando"
   contra o obstáculo com o motor ainda acelerado. Agora, ao bater, a
   velocidade do carro e a velocidade física caem de verdade (para ~10-15%),
   com uma vibração e um som curto de impacto (com um pequeno intervalo
   mínimo entre sons, para não spammar enquanto o botão fica pressionado
   contra a parede).

8. **Ciclo do som do motor incompleto**: religar o som nas configurações
   durante a direção não voltava a tocar o motor; e pausar o jogo ou sair
   para o Lobby deixava o oscilador de áudio tocando escondido (nunca era
   parado). Corrigido: o motor liga/desliga corretamente com o som das
   configurações, para ao abrir o menu de pausa, volta ao continuar (se
   ainda estiver no carro) e é sempre encerrado ao sair para o Lobby.

9. **Nuvens paradas**, apesar do changelog anterior dizer "flutuando". Isso
   estava errado da minha parte — elas não tinham nenhuma atualização por
   quadro. Agora elas realmente se movem (deriva horizontal lenta com
   wraparound), e o número de malhas caiu de 56 para 27 (9 nuvens × 3
   partes, antes 14×4), para pesar menos em celulares de entrada.

10. **Versão e cache travados em "605" em todo lugar**, mesmo o ZIP se
    chamando V606 — isso incluía a chave de save no `localStorage`, o nome
    do cache do service worker, as strings `?v=` de cache-busting no HTML, o
    nome do app no `manifest.webmanifest` e a string de versão interna usada
    pelo script de teste (F12). Tudo foi atualizado para V606, **seguindo o
    mesmo padrão seguro de migração que a própria V605 já usava** (a chave
    de save antiga entra na lista `LEGACY_STORAGE_KEYS`, então o progresso de
    quem já jogou a V605 é migrado automaticamente para a chave nova, nada é
    apagado). O script `F12_TESTE_OTTHOS_...js` foi atualizado para verificar
    a versão nova, senão ele ia falhar sozinho contra este build.

11. **Relatórios de validação antigos** (`RELATORIO_VALIDACAO_V605.txt` e
    `VALIDACAO_AUTOMATIZADA_V605.json`) foram mantidos (não apago histórico),
    mas agora têm um aviso no topo deixando claro que eles validam só a V605
    e não cobrem nada da física de veículo — para não serem usados como
    "prova" de teste desta versão, como a revisão apontou corretamente.

### O que a revisão apontou e eu decidi **não** mudar, com justificativa

- A colisão do carro continua sendo um círculo simples contra retângulos, não
  uma caixa orientada (OBB) de verdade. Uma colisão 100% fiel ao formato
  exato da carroceria em todas as direções exigiria reescrever todo o sistema
  de colisão do jogo (que também é usado pelo personagem a pé, pelas casas,
  cercas etc.) — isso é maior do que "raso" e arriscaria quebrar colisões que
  já funcionam. O que fiz (raio maior + perda de velocidade ao bater) resolve
  o sintoma prático (carro atravessando parede) sem esse risco.
- Não renomeei o arquivo `F12_TESTE_OTTHOS_V605_JOGABILIDADE_COMERCIAL.js`
  (só o conteúdo por dentro) para não quebrar nenhuma instrução/atalho que
  você já tenha para rodá-lo.

### Ainda vale testar no celular

Continua tudo validado apenas de forma estática (sintaxe via esbuild, HTML
bem formado, chaves balanceadas, checagem cruzada de IDs) — não tenho
navegador neste ambiente. Recomendo testar especialmente: entrar/sair do
carro várias vezes seguidas, bater de propósito numa casa/cerca dirigindo, e
ligar/desligar o som das configurações enquanto dirige.

