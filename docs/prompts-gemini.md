# Prompts para o Gemini (imagens de referência)

Cada item tem: **a imagem que você anexa** (o que procurar e como) e **o prompt completo** para colar.
Os prompts estão em inglês porque os geradores de imagem respondem melhor. Já incluem o estilo: é só colar.

## Como usar

1. No Gemini, use a criação de imagem (Nano Banana) e **anexe a imagem de referência** junto com o prompt.
2. **Âncora de estilo:** depois que a primeira imagem de cada grupo (interior / exterior) ficar boa, anexe ela também
   nos pedidos seguintes do mesmo grupo e acrescente no fim do prompt:
   `Match the art style, materials and lighting of the second attached image.`
   É o que faz a casa inteira parecer um conjunto só. Âncora do interior: [`refs/02-saco.jpg`](refs/02-saco.jpg).
   **Nunca use o avatar como âncora de objeto:** o Gemini redesenha o personagem e ignora o pedido.
   Se a âncora for parecida com o objeto (ex.: saco → suporte), acrescente `Do not include the <coisa da âncora>.`
3. Imagem saiu com texto, logo, sombra no chão ou mais de um objeto? Peça para refazer antes de levar ao Tripo.
4. As aprovadas ficam em [`docs/refs/`](refs/), com o número do item (ex.: `04-armario.jpg`). O número segue a [lista de geração](assets-ia.md).
   Fora do `public/`, então não vão para o site.

### Onde achar as referências

- **Google Imagens** com o termo sugerido + filtro *Ferramentas → Cor → Transparente* ou *branco* (ajuda a vir foto de produto em fundo liso).
- **Lojas** (Mercado Livre, Amazon, Decathlon): foto de produto já vem de frente e em fundo branco. É o melhor tipo de referência.
- **Pinterest**, para itens de estilo (árvores, fachada).
- Evite fotos com logo ou marca em destaque. Se tiver, o prompt já pede para remover.

---

## 1. Seu avatar (o mais importante)

**Roupa (decidido em 18/10):** a camisa listrada azul e preta estilo Inter, a mesma da hero do madeusdev.
Sem escudo e sem patrocinador (regra: não desenhamos escudo de clube) e com as costas lisas: o **"MADEUS 9"** entra
depois como textura, porque a IA erra letras. A câmera do jogo fica atrás do personagem, então as costas aparecem o tempo todo.

**Anexe:** uma foto sua **vestindo essa camisa**, de **corpo inteiro, de frente**, em pé, braços soltos ao lado do corpo,
boa luz, fundo liso (parede). Sem boné cobrindo o cabelo, sem mãos no bolso. Se tiver uma de costas, guarde para a vista de costas.

```
Using the attached photo of me as reference, create a stylized 3D character of this
person for a cozy video game. Chibi proportions: head about one third of the body
height. Keep my face and skin tone recognizable, with these exact details: dark brown
hair (not black), straight (not curly), short and full: the top is a short scissor cut
(not buzzed), medium-low volume, with a loose fringe swept forward and slightly to
one side in soft chunky clumps, the sides and back are covered with
short hair of the same color (not shaved), rounded following the head, and only a
very thin low taper at the very bottom, right above the ears and at the nape; no
pompadour, no quiff; ears visible;
green-brown (hazel) eyes; thin mustache and a small goatee only, no
beard on the cheeks or sides; glasses only if I have them in the photo.
Wearing a soccer jersey with vertical royal blue and black stripes
(no crest, no sponsor, no logo, plain back with no name and no number), black shorts or
the pants from the photo, and the sneakers from the photo, all simplified into clean
shapes.
Full body, standing in A-pose: arms straight and slightly away from the body (about
30 degrees down from horizontal), hands open with fingers together, legs straight and
slightly apart, facing the camera, neutral friendly expression.
Soft rounded shapes, clay-like smooth surfaces, clean simple textures, single
character, centered, plain white background, even soft studio lighting, no shadow on
the floor, no text, no logo.
```

> Se precisar ajustar, **não peça no mesmo chat da foto**: o Gemini edita a foto original em vez do avatar.
> Baixe o avatar, abra um chat novo, anexe só ele e comece com "This is a stylized 3D game character. Edit only this
> character image, keep everything else identical:" seguido dos ajustes.
> **Cabelo:** descreva em palavras, nunca anexe foto de corte de cabelo real. O Gemini copia a textura da foto
> (fios realistas) e o cabelo sai num estilo diferente do resto do avatar.
>
> Gere também uma **vista de costas** do personagem aprovado, num chat novo com só o avatar anexado:
>
> ```
> This is a stylized 3D game character. Create the back view of this exact same
> character, in the exact same art style: same proportions, same A-pose, same hair
> (dark brown, straight, short scissor cut, top in soft chunky clumps swept forward,
> sides and back covered with short hair rounded following the head, not shaved, only
> a very thin low taper at the very bottom of the nape),
> same jersey with vertical royal blue and black stripes, plain jersey back with no
> name and no number, same black shorts and white sneakers. Plain white background,
> even soft studio lighting, no shadow on the floor, no text.
> ```
>
> O Tripo usa as duas vistas (multiview).

---

## Interior (estilo madeusdev)

Do item 4 em diante, anexe sempre **duas imagens**: a referência do objeto e, como segunda, a âncora
[`refs/03-suporte-saco.jpg`](refs/03-suporte-saco.jpg). A última linha de cada prompt já pede para copiar o estilo dela.

### 2. Saco de pancada (versão final)

**Anexe:** a mesma foto do saco que você já usou (sem o logo).
Se mudar de ideia sobre a cor, troque `red` por `glossy black with a royal blue band`.

```
Create a stylized 3D game asset of the punching bag in the attached image: a red
heavy bag with black straps and a thin black band near the top, hanging from short
metal chains. Plain surface, remove any logo or text. Soft rounded shapes, clean
modern design, smooth slightly glossy material, single object, centered, front
three-quarter view, plain white background, even soft lighting, no shadow on the floor,
no text, no logo.
```

### 3. Suporte do saco (pedestal em "Γ")

**Anexe:** foto de produto. Buscar: **"suporte de chão para saco de pancada"** ou **"freestanding heavy bag stand"**.
Prefira o modelo em forma de "Γ" (uma haste vertical com braço no topo), não o de 4 pernas.

```
Create a stylized 3D game asset of a freestanding punching bag stand like the one in
the attached image: a sturdy vertical steel post on a wide flat base with a horizontal
arm at the top and a hook at the end, without the bag. Glossy black metal with small
royal blue (#0A3FB8) accents. Soft rounded shapes, clean modern design, single object,
centered, front three-quarter view, plain white background, even soft lighting, no
shadow on the floor, no text, no logo.
```

### 4. Armário de vestiário

**Anexe:** buscar **"armário vestiário aço 1 porta"** ou **"single steel gym locker"**. Um armário só, de frente.

```
Create a stylized 3D game asset of a single tall gym locker like the one in the
attached image, about 1.8 m tall, door closed, with ventilation slots near the top and
a simple handle. Off-white body with a glossy black door and a thin royal blue
(#0A3FB8) stripe. Soft rounded edges, clean modern design, single object, centered,
front three-quarter view, plain white background, even soft lighting, no shadow on the
floor, no text, no numbers, no logo.
Match the art style, materials and lighting of the second attached image. Only the
locker, do not include the stand.
```

### 5. Camisa de futebol pendurada (lisa)

**Anexe:** buscar **"camisa de futebol lisa no cabide"** ou **"blank soccer jersey on hanger back view"**. De costas, sem estampa.

```
Create a stylized 3D game asset of a blank soccer jersey hanging on a simple hanger,
seen from the back, like the attached image. Completely plain fabric with no name, no
number, no crest and no logo (those will be added later). White jersey with black
collar and sleeve cuffs. Soft rounded folds, clean simple shapes, single object,
centered, front view, plain white background, even soft lighting, no shadow, no text.
Match the art style, materials and lighting of the second attached image. Only the
jersey on the hanger, do not include the stand.
```

### 6. Mesa do escritório

**Anexe:** a foto da mesa industrial (tampo de madeira, estrutura preta com prateleiras na lateral).

```
Create a stylized 3D game asset of an industrial style desk like the one in the
attached image, about 1.4 m wide: a warm walnut brown wood top, a black metal frame
with a rectangular leg on the right, and on the left side a black metal frame with two
open wooden shelves below the top. Empty desk, nothing on top or on the shelves. Keep
the wood as a smooth warm brown with only a very subtle grain, no realistic texture.
Soft rounded edges, clean modern design, single object, centered, front three-quarter
view, plain white background, even soft lighting, no shadow on the floor, no text, no
logo.
Match the art style and lighting of the second attached image (only the style, keep
the wood and black metal colors of this desk). Only the desk, do not include the stand.
```

### 7. Setup do PC (monitor + teclado + gabinete)

**Anexe:** a foto do setup (dois monitores, um na vertical, gabinete de vidro com LED).

```
Create a stylized 3D game asset of the computer setup in the attached image, grouped
together as a single compact set with no desk and no wall: a horizontal monitor in the
middle with a slim light bar on top, a second monitor in vertical (portrait) position
on a black articulated arm on the left, a black keyboard with soft pink LED backlit keys and a mouse on a dark grey desk mat in front, and a black glass PC tower with soft white LED strips on the right.
All the items sit on one shared flat base level, close together. Both monitor screens
are plain solid black, no image. Glossy black materials. Soft rounded edges, clean
modern design, centered, front three-quarter view, plain white background, even soft
lighting, no shadow on the floor, no text, no logo.
Match the art style, materials and lighting of the second attached image. Only the
computer setup, do not include the stand.
```

### 8. Cadeira do escritório

**Anexe:** a foto da cadeira ergonômica de tela (malha), sem o logo.

```
Create a stylized 3D game asset of the ergonomic mesh office chair in the attached
image (not a gaming chair, no leather, no padding, no stitching): a separate curved
headrest, a two-part backrest with a thin black plastic frame filled with dark grey
mesh, a mesh seat, adjustable T-shaped armrests and a black five-star wheeled base.
Draw the mesh as solid dark grey panels with a subtle fine grid pattern, not see-through
holes. Keep the curved cut-out shapes of the frame like in the photo. Soft rounded
shapes, clean modern design, single object, centered, front three-quarter view, plain
white background, even soft lighting, no shadow on the floor, no text, no logo.
Match the art style, materials and lighting of the second attached image. Only the
chair, do not include the stand.
```

### 10. Cama

**Anexe:** a foto da cama de cabeceira estofada bege (a do quarto ensolarado).

```
Create a stylized 3D game asset of only the bed in the attached image, isolated: a
modern double bed with a low platform base and a tall upholstered beige headboard with
side wings, off-white sheets, four pillows and a warm beige throw blanket draped across
the foot, simplified into a few soft smooth folds (no fringe, no knit texture). Remove
the nightstands, lamp, vase, rug, wall and window. Soft rounded shapes, clean modern
design, cozy, single object, centered, front three-quarter view, plain white
background, even soft lighting, no shadow on the floor, no text, no logo.
Match the art style and lighting of the second attached image (only the style, keep
the beige and off-white colors of this bed). Only the bed, do not include the stand.
```

### 11. Banco do vestiário

**Anexe:** buscar **"banco de vestiário madeira"** ou **"locker room bench"**.

```
Create a stylized 3D game asset of a locker room bench like the one in the attached
image, about 1.5 m long, light wood slats on a glossy black metal frame. Soft rounded
edges, clean modern design, single object, centered, front three-quarter view, plain
white background, even soft lighting, no shadow on the floor, no text, no logo.
Match the art style, materials and lighting of the second attached image. Only the
bench, do not include the stand.
```

### 12. Halteres + suporte

**Anexe:** buscar **"suporte de halteres com halteres"** ou **"dumbbell rack"** (um rack pequeno, 2 andares).

```
Create a stylized 3D game asset of a small two-tier dumbbell rack holding six
dumbbells like the attached image. Glossy black frame, black dumbbells with royal blue
(#0A3FB8) handles. Soft rounded shapes, clean modern design, single object, centered,
front three-quarter view, plain white background, even soft lighting, no shadow on the
floor, no text, no numbers, no logo.
Match the art style, materials and lighting of the second attached image. Only the
dumbbell rack, do not include the stand.
```

---

## Exterior (estilo jardim, parente do worawork)

Referência de estilo útil para todo o exterior: um print do worawork (os que você já tirou) anexado como segunda imagem.

### 16. Fachada da casa

**Anexe:** buscar **"casa térrea moderna pequena fachada"** ou **"small modern cottage house"** no Pinterest.
Se quiser, anexe também o print do worawork como referência de estilo.

```
Create a stylized 3D game asset of a cozy small single-story modern house like the
attached image, square footprint (about 10 by 10 meters), white walls with warm wood
panels, a low gabled dark roof, a wooden front door centered on the front with two
small steps, two windows on each side of the door with warm light inside. Complete
house exterior, closed, no garden around it. Soft rounded shapes, clay-like smooth
surfaces, cozy warm colors, Animal Crossing style, single object, centered, front
three-quarter view, plain white background, even soft lighting, no shadow on the
floor, no text, no logo.
```

### 17. Caixa de correio

**Anexe:** buscar **"caixa de correio americana de poste madeira"** ou **"wooden post mailbox"**.

```
Create a stylized 3D game asset of a classic mailbox on a wooden post like the attached
image, rounded top, small red flag on the side, an envelope sticking slightly out of
the slot. Warm orange mailbox on a natural wood post. Soft rounded shapes, clay-like
smooth surfaces, cozy warm colors, Animal Crossing style, single object, centered,
front three-quarter view, plain white background, even soft lighting, no shadow on the
floor, no text, no logo.
```

### 18. Golzinho

**Anexe:** buscar **"mini gol futebol"** ou **"mini soccer goal"** (gol pequeno de quintal, com rede).

```
Create a stylized 3D game asset of a small backyard soccer goal like the attached
image, about 1.5 m wide and 1 m tall, white rounded posts and a soft white net. Soft
rounded shapes, clay-like smooth surfaces, cozy warm colors, Animal Crossing style,
single object, centered, front three-quarter view, plain white background, even soft
lighting, no shadow on the floor, no text, no logo.
```

### 20. Casinha do dog

**Anexe:** buscar **"casinha de cachorro de madeira telhado"** ou **"wooden dog house"**.

```
Create a stylized 3D game asset of a small wooden dog house like the attached image,
pitched red roof, arched entrance, a small food bowl in front. Warm natural wood. Soft
rounded shapes, clay-like smooth surfaces, cozy warm colors, Animal Crossing style,
single object, centered, front three-quarter view, plain white background, even soft
lighting, no shadow on the floor, no text, no logo.
```

### 22. Árvores (duas variações)

**Anexe:** um print do worawork mostrando as árvores (é a referência de estilo, não uma foto real).
Gere a primeira, depois peça a segunda variação com a primeira anexada.

```
Create a stylized 3D game asset of a single tree in the style of the trees in the
attached screenshot: short thick brown trunk and a soft rounded bubbly green canopy
made of a few round clusters. Soft rounded shapes, clay-like smooth surfaces, cozy warm
colors, Animal Crossing style, single object, centered, front three-quarter view,
plain white background, even soft lighting, no shadow on the floor, no text, no logo.
```

Segunda variação: `Same style as the attached tree, but taller and slimmer, with a darker green canopy.`

---

## Prioridade 3 (só se sobrar crédito)

Mesmo esquema; troque o objeto no começo do prompt de exterior ou interior:

- **13. Luvas penduradas**: `a pair of boxing gloves hanging by their laces`, interior, luvas vermelhas ou pretas.
- **15. Planta em vaso**: `a potted monstera plant in a white ceramic pot`, interior.
- **23. Arbusto / flores / pedras**: `a round green bush`, `a small cluster of white daisies`, `a group of three smooth grey rocks`, exterior.
- **24. Poste de luz**: `a small garden lamp post with a warm glowing lantern`, exterior.
- **25. Portão**: `a short white wooden garden gate with two posts`, exterior.
