# Colomer-Rifà Render AI · Modelatge 3D

Eina interna de Colomer-Rifà amb dos mòduls:

1. **Millora de renders amb IA**: es puja un render, es trien opcions visuals i es genera una versió fotorealista fidel al projecte.
2. **Modelatge 3D en DXF**: a partir de plànols o imatges es genera un DXF 3D editable per a Allplan i AutoCAD, organitzat per capes i colors.

> Estat: **fase 2** completada. Totes les pantalles funcionen amb els catàlegs com a dades i el motor de prompts ja construeix
> el prompt de cada render (textos pendents de revisió). La generació (IA i DXF) encara no està connectada i la interfície ho indica. Vegeu el pla a [`docs/arquitectura.md`](docs/arquitectura.md).

## Estructura

| Carpeta | Contingut |
|---|---|
| `apps/web` | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Auth.js + Prisma 7 |
| `services/cad` | Python 3.12 + FastAPI + ezdxf (+ shapely, trimesh) |
| `packages/catalog` | Catàleg d'opcions (JSON), lògica de selecció i fragments de prompt (només servidor) |
| `packages/prompt-engine` | Motor de prompts del render: pur, determinista i amb tests de snapshot |
| `docs/` | Documentació i especificacions. `docs/design-reference/` conté les 12 pantalles del disseny |

## Posada en marxa amb Docker

```bash
cp .env.example .env
# Edita .env: AUTH_SECRET (openssl rand -base64 32) i ADMIN_EMAILS
docker compose up --build
```

L'aplicació queda a <http://localhost:3000>. Sense Microsoft 365 configurat, en local es pot entrar amb
l'**accés de desenvolupament** (`APP_ENV=local` i `AUTH_DEV_LOGIN=true`) amb qualsevol adreça `@colomer-rifa.cat`.
Les adreces d'`ADMIN_EMAILS` entren com a administradors.

Si la construcció passa per un proxy corporatiu que intercepta TLS, vegeu [`docker/certs/README.md`](docker/certs/README.md).

## Desenvolupament

Requisits: Node 22, pnpm 10, Python 3.12 amb [uv](https://docs.astral.sh/uv/), PostgreSQL 16.

```bash
pnpm install
cp .env.example apps/web/.env          # i ajusta DATABASE_URL
pnpm --filter web exec prisma migrate dev
pnpm dev                               # http://localhost:3000

cd services/cad && uv sync && uv run uvicorn app.main:app --reload
```

### Comprovacions

```bash
pnpm lint && pnpm typecheck && pnpm test      # web: ESLint, TypeScript, Vitest
pnpm test:e2e                                 # web: Playwright (escriptori i mòbil) + axe (WCAG 2.1 AA)
cd services/cad && uv run ruff check . && uv run pytest
```

## Autenticació

Inici de sessió amb **Microsoft 365 (Entra ID)** i només per a adreces `@colomer-rifa.cat` (`ALLOWED_EMAIL_DOMAINS`).
Configuració del registre d'aplicació: [`docs/autenticacio-microsoft365.md`](docs/autenticacio-microsoft365.md).

## Textos dels prompts

Els textos que rep la IA són a `docs/ESPECIFICACIO_RENDER.md` (i als documents dels assistents). Després d'editar-los:

```bash
pnpm --filter @cr/catalog sync-fragments          # copia els textos al catàleg
pnpm --filter @cr/prompt-engine test -u           # actualitza els snapshots (revisa el diff!)
```

## Documentació

- [`docs/arquitectura.md`](docs/arquitectura.md): arquitectura, stack i fases
- [`docs/autenticacio-microsoft365.md`](docs/autenticacio-microsoft365.md): Entra ID
- [`docs/pendent-revisio.md`](docs/pendent-revisio.md): continguts i decisions pendents de revisar
