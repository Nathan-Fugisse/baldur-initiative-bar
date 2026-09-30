# Baldur Initiative Bar v1.0.1

Extensão para Owlbear Rodeo focada em iniciativa, com interface inspirada em CRPGs/Baldur's Gate.

## O que esta versão inclui

- Ordem automática da maior para a menor iniciativa.
- Retratos dos personagens/token quando disponíveis.
- Valor de iniciativa visível.
- Destaque do personagem do turno atual.
- Botões de turno anterior e próximo turno.
- Contador de rodada.
- Adicionar/remover personagem da iniciativa pelo menu de contexto.
- Editar iniciativa com duplo clique no combatente.
- Estado sincronizado entre GM e jogadores usando metadados da sala.
- Ícone SVG desenhado integralmente por código.
- Configuração pronta para deploy na Vercel.
- `manifest.json` em `public/`, que o Vite publica como `/manifest.json`.

## Rodar localmente

```bash
npm install
npm run dev
```

Para testar o build:

```bash
npm run build
npm run preview
```

## Publicar na Vercel

1. Crie um repositório no GitHub.
2. Envie esta pasta para o repositório.
3. Na Vercel, importe o repositório.
4. A configuração já está no `vercel.json`.
5. A Vercel executará `npm install` e `npm run build`.
6. O resultado será publicado a partir de `dist/`.

Depois do deploy, o manifesto estará em:

`https://SEU-PROJETO.vercel.app/manifest.json`

Esse é o endereço que deve ser colocado no Owlbear Rodeo ao adicionar a extensão.
