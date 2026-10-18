# Lista de geração dos modelos 3D

Tudo o que a casa dos sonhos precisa, e **como** cada coisa vai ser feita.
A ideia é assinar o Tripo Starter (R$ 25, um mês), gerar tudo em sequência e cancelar.

## Como gerar: imagem, não texto

**Regra geral: imagem → 3D.** Com texto a IA inventa a forma e cada objeto sai num estilo diferente.
Com imagem você controla o resultado e garante que tudo combina.

1. **Gerar a imagem de referência** de graça no Gemini ou no ChatGPT. Prompts prontos, item por item: [prompts-gemini.md](prompts-gemini.md).
   Uma foto real também serve, se estiver de frente e em fundo liso (como foi o saco).
2. **Subir no Tripo**: malha Ultra desligada, textura 2K, remover iluminação ligado, 25 mil polígonos, PBR, triângulos.
3. **Exportar em GLB** e salvar em `public/models/ai/<nome>.glb`. A "dieta" e o encaixe no site ficam comigo.

### Trecho de estilo (colar no fim de todo pedido de imagem)

Exterior (jardim, madeira, quente, parente do worawork):

```
, stylized 3D game asset, soft rounded shapes, clay-like smooth surfaces,
cozy warm colors, Animal Crossing style, single object, centered, front
three-quarter view, plain white background, no text, no logo
```

Interior (madeusdev: off-white, preto brilhante, detalhes azuis):

```
, stylized 3D game asset, soft rounded shapes, clean modern design, glossy
black and off-white materials with royal blue (#0A3FB8) accents, single object,
centered, front three-quarter view, plain white background, no text, no logo
```

### O que NÃO pedir para a IA

- **Texto e logos** (nome nas camisas, tela do PC): a IA borra letras. Gerar a peça lisa e aplicar o texto como textura no site.
- **Escudo do Corinthians**: não desenhamos escudo de clube. A camisa sai lisa e o escudo entra pela imagem que já existe no madeusdev (`corinthians_escudo.svg`).
- **Estrutura da casa, chão, paredes, bordas, caminho, linhas do campo**: precisam de medida exata em metros (planta). Faço no Blender com formas simples, ou em código.
- **Animais animados**: o rig automático funciona bem em humanos e mal em quadrúpedes. Para o dog, melhor um modelo pronto já animado.

## A lista

Legenda de prioridade: **1** = sem ele a estação não existe · **2** = deixa o cenário vivo · **3** = enfeite.

### Personagem

| # | Item | Como | Prior. | Notas |
|---|---|---|---|---|
| 1 | **Seu avatar** | Foto sua → imagem estilizada (Gemini) → Tripo com **Rig** | 1 | Foto de corpo inteiro, de frente, braços levemente abertos, roupa típica sua. Pedir ao Gemini "stylized 3D chibi figure of this person, A-pose". Gerar **privado**. Pode levar 2–3 tentativas: reservar créditos. Animações: Mixamo (Idle, Walk, Run, Punch, SitDown) |

### Interior

| # | Item | Como | Prior. | Notas |
|---|---|---|---|---|
| 2 | Saco de pancada | Foto real → Tripo | 1 | ✅ já testado. Gerar a versão final na cor escolhida |
| 3 | Suporte do saco (pedestal em "Γ") | Imagem → Tripo | 1 | A casa não tem teto: o saco precisa de suporte de chão ou de parede |
| 4 | Armário de vestiário | Imagem → Tripo | 1 | **Um** modelo, usado 3 vezes. Porta separada para animar abrindo (pedir "locker with door slightly open" ou abrir no Blender) |
| 5 | Camisa de futebol pendurada (lisa) | Imagem → Tripo | 1 | Sem nome e sem número: "MAGALU 7" etc. entram como textura no site |
| 6 | Mesa do escritório | Imagem → Tripo | 1 | Mesa moderna, tampo preto ou madeira clara |
| 7 | Setup do PC (monitor + teclado + gabinete) | Imagem → Tripo | 1 | Um modelo só com tudo junto. Tela preta lisa: o conteúdo entra no site |
| 8 | Cadeira do escritório | Imagem → Tripo | 2 | Cadeira gamer ou de escritório |
| 9 | Moldura com a camisa do Corinthians | Blender | 1 | Moldura simples + plano com listras; escudo pela imagem dele |
| 10 | Cama | Imagem → Tripo | 2 | |
| 11 | Banco do vestiário | Imagem → Tripo | 2 | |
| 12 | Halteres + suporte | Imagem → Tripo | 2 | Um modelo com o rack e os halteres |
| 13 | Luvas de boxe/muay thai penduradas | Imagem → Tripo | 3 | Podem ficar no suporte do saco |
| 14 | Tatame | Blender | 1 | Plano com textura de placas: não precisa de IA |
| 15 | Planta em vaso, luminária, tapete | Imagem → Tripo | 3 | Só se sobrar crédito; tapete pode ser plano com textura |

### Exterior

| # | Item | Como | Prior. | Notas |
|---|---|---|---|---|
| 16 | **Fachada da casa** | Imagem → Tripo | 1 | Casa térrea moderna e aconchegante, ~10 × 10 m, porta na frente. Só a parte de fora: entrar troca de cena |
| 17 | Caixa de correio | Imagem → Tripo | 1 | Estação de Contato |
| 18 | Golzinho | Imagem → Tripo | 2 | Um modelo, usado 2 vezes |
| 19 | Bola de futebol | Código | 2 | Esfera com textura de gomos; precisa de física, então fica simples |
| 20 | Casinha do dog | Imagem → Tripo | 2 | |
| 21 | **Doguinho** | Modelo pronto animado | 2 | Primeiro procurar no [Quaternius Ultimate Animated Animals](https://quaternius.com/packs/ultimateanimatedanimals.html) (CC0, acho que tem cachorro: confirmar). Só gerar por IA se não houver |
| 22 | Árvore (2 variações) | Imagem → Tripo | 2 | Copa arredondada, estilo worawork |
| 23 | Arbusto, flores, pedras | Imagem → Tripo | 3 | Um modelo de cada, repetidos pelo terreno |
| 24 | Poste de luz do jardim | Imagem → Tripo | 3 | |
| 25 | Portão / cerca | Imagem → Tripo | 3 | |
| 26 | Bordas de madeira, chão, caminho, campo | Blender | 1 | Medidas da planta (`planta.excalidraw`) |

## Conta de créditos (Tripo Starter: 750/mês)

Cada geração custou 45–55 créditos com malha Ultra e textura 4K. Com Ultra desligada e textura 2K deve ficar perto de 30
(confirmar na primeira geração do mês, olhando o número no botão "Gerar").

| Grupo | Gerações | Créditos (~30 cada) |
|---|---|---|
| Avatar (com tentativas) | 3 | 90 |
| Prioridade 1 por IA (itens 2–7, 16, 17) | 8 | 240 |
| Prioridade 2 por IA (8, 10, 11, 12, 18, 20, 22×2) | 8 | 240 |
| **Subtotal** | **19** | **570** |
| Folga para refazer + prioridade 3 | ~6 | ~180 |

Cabe em um mês, se gerar na ordem da prioridade e não refazer muito. As exportações (45/mês) sobram.

## Ordem sugerida

1. Antes de assinar: gerar **todas as imagens de referência** no Gemini (é de graça) e revisar se combinam entre si.
2. Assinar e gerar primeiro o **avatar** (o mais difícil) e a **prioridade 1**.
3. Mandar os GLB conforme forem saindo; eu encaixo e você vê no site antes de gastar mais.
4. Prioridade 2, depois 3, até acabar o crédito. Cancelar a assinatura.
