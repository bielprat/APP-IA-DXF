# Arquitectura

## Visió general

```
Navegador ──► apps/web (Next.js) ──► PostgreSQL (Prisma, pg-boss)
                    │
                    ├──► services/cad (FastAPI + ezdxf)   ← fase 5
                    ├──► VisionLLM (Anthropic)             ← fase 3
                    └──► ImageEditProvider (OpenAI/Gemini/mock) ← fase 3
```

- **Monorepo pnpm**: `apps/web`, `services/cad`, `packages/*`.
- **Catàleg** (`packages/catalog`): totes les opcions de la interfície són dades JSON (`render/`, `cad/`, `library/`, `projects/`)
  validades amb zod en carregar-se. Cada opció té un id estable `<categoria>.<slug>`, `exclusive`, `exclusiveWith`, `requires`,
  `unlocks`, `status` i, a partir de la fase 2, `promptFragment`. La lògica de selecció (exclusivitats, mínims, valors per
  defecte segons el mode CAD) és pura i té tests. `CATALOG_VERSION` es desarà amb cada treball.
- **Fluxos** (`apps/web/src/features/render`, `features/cad`): l'estat de cada flux és un reducer pur amb tests. Les tries es
  conserven a `sessionStorage` durant la sessió; les imatges i els fitxers encara no surten del navegador (es pujaran al
  servidor a la fase 3).
- **Web**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS 4 amb els tokens de marca a `apps/web/src/app/globals.css`.
- **Autenticació**: Auth.js v5 amb Microsoft Entra ID, sessions JWT de 8 h. El `proxy.ts` només fa una comprovació optimista del token;
  cada pàgina torna a validar l'usuari, el rol i si està actiu contra la base de dades (`src/lib/auth/session.ts`).
- **Rols**: `user` i `admin`. Els correus d'`ADMIN_EMAILS` sempre són admin; la resta conserva el rol desat a la base de dades.
- **Base de dades**: PostgreSQL 16 + Prisma 7 (driver adapter `pg`). Les migracions s'apliquen amb el servei `migrate` de docker compose.
- **Servei CAD**: FastAPI + ezdxf. A la fase 0 només exposa `/health`. Limitació coneguda: ezdxf no genera sòlids ACIS (`3DSOLID`).

## Decisions preses

| Decisió | Motiu |
|---|---|
| Microsoft 365 (Entra ID) com a únic proveïdor d'entrada | Petició de l'empresa; domini `@colomer-rifa.cat` |
| Accés de desenvolupament només amb `APP_ENV=local` | Permet provar en local i en E2E; la validació de l'entorn el rebutja fora de local |
| Fonts IBM Plex servides des de l'app (`@fontsource`) | No depèn de Google Fonts en temps d'execució ni de construcció |
| Llegir plànols DXF directament amb ezdxf (fase 5) | Cotes i geometria exactes; la IA només per a PDF i imatges. **Pendent de confirmar** |

## Fases

| Fase | Contingut | Estat |
|---|---|---|
| 0 | Monorepo, tokens, layout, autenticació amb rols, Docker, CI | ✅ |
| 1 | Totes les pantalles amb catàlegs com a dades, sense IA | ✅ |
| 2 | `prompt-engine` + catàleg de render + snapshots | Bloquejada per `docs/ESPECIFICACIO_RENDER.md` |
| 3 | Pipeline de render (mock → real), màscares, logos, versions, comparador | Pendent |
| 4 | Biblioteca de vegetació + selecció automàtica + QC vegetal | Pendent |
| 5 | `cad-schema`, extracció, ezdxf, validador, nota tècnica, visor 3D | Pendent |
| 6 | Correccions CAD, mode revisió, DWG condicionat | Pendent |
| 7 | Límits, costos, esborrat, logs, documentació, E2E | Pendent |
