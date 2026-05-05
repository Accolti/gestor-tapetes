# AGENTS.md

## Project Overview

- **gestor-tapetes** - carpet/rug management SaaS (quotes, clients, users, pricing simulator)
- **Client**: Vue 3 + Vite + TypeScript + Tailwind CSS 4 + Pinia (client/)
- **Server**: Express 5 + MySQL (mysql2) + JWT auth, single-file (server/index.js)
- Both run independently; client calls server API via VITE_API_URL

## Developer Commands

### Client (cd client)
| Task | Command |
|---|---|
| Dev server | npm run dev |
| Production build | npm run build |
| Type-check only | npm run type-check |
| Lint (oxlint + eslint) | npm run lint |
| Format | npm run format |

### Server (cd server)
| Task | Command |
|---|---|
| Dev (auto-restart) | npm run dev |
| Production | npm run start |

### Verification order (client)
npm run lint -> npm run type-check -> npm run build

## Architecture Notes

- **Router is client/src/router.js**, NOT client/src/router/index.ts. The .ts file is a dead stub with empty routes - do not edit it.
- Server is a single-file app (server/index.js, ~460 lines). All routes, DB logic, and upload handling are inline.
- No ORM - raw SQL queries against MySQL. DB views are used for product/pricing data (vw_filtro_produtos, vw_produto_completo_detalhado, vw_configuracao_completa_usuario).
- No test suite exists.
- No CI/CD, no pre-commit hooks, no migrations.
- Root package.json only holds Tailwind/PostCSS deps - not used for app commands.

## Environment and Setup

- Client env: client/.env - VITE_API_URL points to a LAN IP (currently 192.168.100.49:3000). Update if server address changes.
- Server env: server/.env - MySQL credentials + JWT_SECRET + PORT (default 3000). Server binds to 0.0.0.0.
- Node engine requirement: ^20.19.0 or >=22.12.0
- Server serves uploaded logos from server/uploads/ at /uploads.

## Conventions

- Client uses mixed .js and .ts source files (main entry + router are .js, stores/router stub are .ts).
- Imports use @/ alias mapped to client/src/ via Vite + tsconfig.
- Linter stack: oxlint (correctness errors) + eslint (Vue/TS rules) + prettier.
- Server uses CommonJS (require), client uses ESM (import).

## Views (client)

Home, Login, DefinirSenha, Clientes, Usuarios, Orcamento, Simulador, Configuracoes

## Server API Endpoints

/api/login, /api/usuarios, /api/usuarios/verificar-email, /api/clientes, /api/config/estados, /api/config-completa/:id_usuario, /api/config-empresa, /api/produtos-lista, /api/produto-detalhes/:id, /api/produto-preco-final, /api/produto-acessorios/:id, /health
