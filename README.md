# Baldur Initiative Bar v1.0.1

Barra de iniciativa para Owlbear Rodeo com visual inspirado em CRPGs no estilo Baldur's Gate.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

O Vercel deve usar:
- Build Command: `npm run build`
- Output Directory: `dist`

Depois do deploy, o manifesto fica em:
`https://SEU-PROJETO.vercel.app/manifest.json`

## Uso

1. Selecione um personagem no Owlbear.
2. Use **Add to Initiative** no menu de contexto.
3. Informe a iniciativa.
4. Os combatentes aparecem automaticamente em ordem decrescente.
5. Clique em um combatente para torná-lo o turno atual.
6. Use PREV/NEXT para avançar ou voltar.
7. Duplo clique no combatente para editar a iniciativa.

O estado da iniciativa e do turno é sincronizado pela sala.
