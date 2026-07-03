# BM Planning

Ferramenta open source de **Planning Poker** integrada nativamente ao [Businessmap](https://businessmap.io) via API REST v2.

## Funcionalidades

- Conexão client-side com Businessmap (API Key no `sessionStorage`)
- Filtro de tarefas por board, coluna, raia e tags
- Sessões de votação em tempo real (WebSocket)
- Consolidação de Story Points diretamente no cartão do Businessmap
- Self-hosting com back-end Go + Docker

## Stack

| Camada | Tecnologia |
|--------|------------|
| Back-end | Go (em desenvolvimento) |
| Front-end | React 19 · TypeScript · TailwindCSS 4 · Vite |
| Tempo real | WebSocket (primário) · SSE (fallback) |

## Início rápido (front-end)

```bash
cd web
npm install
npm run dev
```

Acesse `http://localhost:5173`.

### Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/setup` | Configuração + query de tarefas |
| `/room/:roomId` | Sala de votação |

## Estrutura

```text
bm-planning/
├── web/                    # Front-end React (esta fase)
│   └── src/
│       ├── components/     # Layout, Setup, Voting, Consensus
│       ├── context/        # Auth + Planning (Context API)
│       ├── mocks/          # Dados mockados para desenvolvimento
│       └── types/
├── cmd/server/             # Back-end Go (próxima fase)
└── internal/
```

## Identidade visual

Paleta `bm.*` inspirada no Businessmap (Slate/Blue). Configurada em `web/src/index.css` via Tailwind v4 `@theme`.

## Licença

MIT
