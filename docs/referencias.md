# Referências (tarefa 0.1)

Decisão: a referência principal e quase única é o **worawork** (https://worawork.vercel.app/).
O objetivo é algo "igual" a ele, mas com uma planta da minha vida: cômodos e objetos que contam quem eu sou.

## O que o worawork é por dentro

Levantado lendo o bundle JS do site (out/2026):

| Item | O que ele usa | O que isso significa para mim |
|---|---|---|
| Renderização | three.js (bundle Vite + React, provavelmente R3F) | É 3D de verdade. O "jeito 2D" vem do material e da câmera, não de sprites |
| Materiais | `MeshToonMaterial` + `MeshBasicMaterial` | Sombra em degraus e cores chapadas = visual de desenho. Bem mais fácil de produzir que realista |
| Física | Rapier | Mesmo plano da fase 2 (`@react-three/rapier` + ecctrl) |
| Modelos | 3 arquivos: `Models.glb` (cenário inteiro), `Player.glb`, `Duck.glb` | Cenário num arquivo só, personagem separado, easter egg separado |
| Destaque | Outline (postprocessing) | Contorno ao passar perto de algo interativo (tarefa 6.4) |
| Céu | Sky + Cloud (drei) | Exterior com céu e nuvens, não só um cômodo fechado |
| Mobile | Joystick virtual | Tarefa 7.3 |
| HUD | Ícones de som on/off, "?" de ajuda, marcadores sobre estações (`Marker`, `MailMarker`) | Tarefas 6.4 e 7.5 |
| Ajuda | Telas Move / Run / Interact / Zoom, com versão mobile de cada | Tarefa 7.5 |
| Projetos | Painel com galeria de ~5 imagens por projeto e setas | Tarefa 6.3 |
| Sons | Música, ambiente de dia, passos na grama e na madeira, porta abrindo, interruptor, sino de relógio, bocejo, "oi", pops, quack | Sons ligados a ações e objetos da casa, não só música (tarefa 7.2) |
| Easter egg | O pato | Preciso do meu (tarefa 6.6) |

## O que eu quero copiar

- **Estilo:** low poly com toon shading, cores chapadas, sensação de desenho.
- **Jogabilidade:** andar com um personagem, correr, zoom, chegar perto de um objeto e interagir.
- **Estações como objetos do cenário:** o projeto mora num objeto (monitor, estante, caixa de correio), não num menu.
- **Detalhes de vida:** sons de porta, interruptor, passos que mudam com o chão.
- **HUD mínimo:** só som, ajuda e marcadores flutuando.

## O que muda (o que é meu)

- **A planta:** cômodos e lugares da minha vida, em vez do cenário dele. Os cômodos e objetos saem da 0.2/0.3.
- **O personagem:** eu (fase 4).
- **O easter egg:** a definir (tarefa 6.6).

## Impacto no plano

- **Toon em vez de bake?** O worawork tira o visual do material toon, não de luz assada. Isso pode deixar a fase 5 mais leve: o bake (5.4 a 5.6) vira opcional. Decidir na 0.2 depois de testar os dois numa cena de teste (tarefa 1.4).
## O que os prints mostram (17/10)

- **Câmera:** vista de cima, inclinada uns 50–60°, ângulo fixo (não gira). Segue o personagem: quando ele anda, o cenário desliza no sentido oposto. Só tem zoom in/out. Os blocos das bordas mostram a face de dentro dos dois lados, então é câmera **perspectiva** com FOV baixo, não ortográfica.
- **Visual:** mais "Animal Crossing / diorama de massinha" do que toon chapado. Texturas pintadas (veio de madeira nos penhascos, telhas), sombras suaves e oclusão nos cantos. Provavelmente texturas pintadas + luz assada, com o toon só em partes. **Corrigindo minha nota acima:** o bake (fase 5) continua importante para chegar nesse visual.
- **Composição:** um terreno-ilha fechado por blocos de madeira, fundo marrom liso com vinheta. O mundo acaba nas bordas, não tem horizonte.
- **Cenário:** casa no centro sobre um platô, rio em volta com ponte, cachoeira, lago, mesa com livro e chá, caixa de correio, relógio, galpão de telhado vermelho, placa "WW's", postes de luz, maçãs, flores.
- **Interativos visíveis:** bola de praia empurrável (física), pato andando.
- **HUD:** só "?" no canto superior esquerdo e som no direito, botões redondos marrons.

### Interior da casa (print 3)

- **Entrar na casa troca de cena:** o exterior some e fica só a casa num fundo escuro com vinheta. Daí o som de porta abrindo.
- A casa é uma **caixa sem teto**, um cômodo único em planta aberta, vista de cima com a mesma câmera. Paredes baixas de madeira, vigas nos cantos.
- Ambientes divididos por móveis e piso, sem paredes internas: cozinha (pia, fogão, geladeira verde, balcão com 2 banquetas), quarto (cama, criados-mudos, despertador, tapete), sala (sofá, poltrona, mesa de centro com livro, rack com um Switch), canto do PC (monitor bege retrô, teclado, gaveteiro, estante).
- **Marcadores de interação:** ícones de pino discretos em cima de alguns móveis (sofá, banquinho), da mesma cor do móvel.
- Saída por um capacho verde na parte de baixo.
- Paleta quente: madeira, laranja e verde-oliva. Luz amarela de abajures.

### Mobile (print 4, iPhone 16, 393 × 852)

- **Câmera mais perto** que no desktop: a casa ocupa a largura toda e o personagem fica no centro.
- **Joystick** grande no canto inferior esquerdo; botões **A** (interagir, provavelmente) e **B** (correr, provavelmente) no inferior direito. Todos dourados, translúcidos e redondos.
- "?" e som continuam nos cantos de cima.
- Marcador de envelope flutuando sobre a caixa de correio.
- **Luz rosada de fim de tarde** no print: o worawork tem **ciclo de dia e noite com relógio próprio do jogo** (não usa a hora real do visitante). **Dormir na cama avança o tempo** (daí os sons de bocejo e de sino do relógio).
