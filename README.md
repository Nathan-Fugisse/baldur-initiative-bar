# Baldur Initiative Bar

Extensão independente para Owlbear Rodeo.

## Recursos
- Barra de iniciativa inspirada em interfaces de CRPG/Baldur's Gate.
- Ordem automática da maior iniciativa para a menor.
- Metadata sincronizado no Scene Item.
- Turno atual e rodada sincronizados no Room Metadata.
- Adicionar/remover pelo menu de contexto.
- Clique para selecionar o turno.
- Duplo clique para editar iniciativa.
- Botões anterior/próximo.
- Limpar iniciativa.

## Desenvolvimento

```bash
npm install
npm run dev
```

Depois use a URL do `manifest.json` no sistema de extensões do Owlbear.

Para produção:

```bash
npm run build
```

A pasta `dist/` deve ser hospedada em HTTPS e o manifest deve apontar para a versão publicada.
