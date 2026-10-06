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
- **Fragments de prompt** (`packages/catalog/prompts/fragments.json`, entrada `@cr/catalog/prompts`, només servidor): es
  copien literalment de `docs/ESPECIFICACIO_RENDER.md` i dels documents dels assistents amb `pnpm sync-fragments`; un test
  falla si no coincideixen. Les opcions de la interfície no porten text de prompt.
- **Motor de prompts** (`packages/prompt-engine`): mòdul pur i determinista. `buildRenderPrompt` compon el prompt en l'ordre
  del §5.2 i aplica les regles (exclusivitats, valors per defecte, «Màxima fidelitat», entorn sense geometria, text lliure
  netejat i limitat). `planRenderPasses` decideix si cal el procés de vegetació en dues passades. `buildCorrectionPrompt`
  limita una correcció al seu abast. Retorna `{ prompt, usedFragments, warnings, engineVersion, catalogVersion }`. Tests de
  regles i de snapshot.
- **Fluxos** (`apps/web/src/features/render`, `features/cad`): l'estat de cada flux és un reducer pur amb tests. Les tries es
  conserven a `sessionStorage` durant la sessió; les imatges i els fitxers encara no surten del navegador (es pujaran al
  servidor a la fase 3).
- **Web**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS 4 amb els tokens de marca a `apps/web/src/app/globals.css`.
- **Autenticació**: Auth.js v5 amb Microsoft Entra ID, sessions JWT de 8 h. El `proxy.ts` només fa una comprovació optimista del token;
  cada pàgina torna a validar l'usuari, el rol i si està actiu contra la base de dades (`src/lib/auth/session.ts`).
- **Rols**: `user` i `admin`. Els correus d'`ADMIN_EMAILS` sempre són admin; la resta conserva el rol desat a la base de dades.
- **Base de dades**: PostgreSQL 16 + Prisma 7 (driver adapter `pg`). Les migracions s'apliquen amb el servei `migrate` de docker compose.
- **Servei CAD**: FastAPI + ezdxf. A la fase 0 només exposa `/health`. Limitació coneguda: ezdxf no genera sòlids ACIS (`3DSOLID`).

## Generació de renders (fase 3)

```
Pujar (POST /api/uploads) ──► Asset (StorageProvider)          [validació real: PNG/JPEG, 60 MP]
GENERAR (POST /api/render/jobs) ──► RenderJob «queued» ──► pg-boss ──► worker (mateix procés, instrumentation.ts)
worker: anàlisi (VisionLLM) → prompt(s) (prompt-engine) → edició (ImageEditProvider, 1 o 2 passades)
        → mida original → protecció de logos → control de qualitat → Asset + RenderVersion (immutable)
Pantalla de resultat: consulta GET /api/render/projects/[id] cada 1,5 s mentre hi ha un treball actiu.
```

- **Estats**: `queued → processing → qc → ready`, o `failed` / `cancelled`. Un projecte només té un treball actiu.
  Els treballs fallits o cancel·lats es poden reintentar (idempotent: la clau de la cua inclou l'intent).
- **Versions**: cada treball acabat crea una versió immutable (V1, V2…). Les correccions parteixen de la versió
  seleccionada; «Tornar a l'original» crea una versió que apunta a la imatge original **sense cap crida d'IA**.
- **Correccions**: només canvia el que s'indica. Amb «Millorar només aquesta zona», a més de la màscara enviada al
  proveïdor, l'aplicació enganxa el resultat només dins la zona marcada (amb vora suavitzada).
- **Protecció de logos**: per a cada zona protegida (detectada o marcada per l'usuari) es compara el resultat amb
  l'original; si s'ha desviat, es restauren els píxels originals amb vora suavitzada. El resultat es veu al QC.
- **Control de qualitat**: combina comprovacions mesurades per l'aplicació (mida, proporcions, zones protegides) amb
  les del `VisionLLM`. Un element que no s'ha pogut verificar es mostra com a «No verificat», mai com a correcte.
- **Proveïdors**: `VISION_PROVIDER` i `IMAGE_PROVIDER`. Ara mateix només hi ha `mock`, que **no fa servir cap IA**:
  retorna la imatge original amb franges ben visibles, no detecta logos i deixa tot el QC com a «No verificat».
  La pantalla ho indica («Resultat de prova (mock)»).
- **Registres**: `AiCallLog` desa proveïdor, model, durada, tokens/cost i estat de cada crida, sense text de prompt.
  Els prompts complets i els fragments usats van a `AuditPrompt` (només per a administradors).

### Dades que surten cap als proveïdors d'IA

| Proveïdor | Què rep | Quan |
|---|---|---|
| `VisionLLM` (previst: Anthropic) | Imatge base; per al QC, imatge base i resultat | Anàlisi i control de qualitat |
| `ImageEditProvider` (previst: OpenAI o Gemini) | Imatge base o versió a corregir, prompt, referències, màscara | Generació i correccions |
| `mock` | Res: tot es fa al servidor | Proves |

No s'envia cap nom d'usuari, correu ni nom de projecte. Els fitxers dels clients no surten de l'emmagatzematge
propi excepte per a aquestes crides.

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
| 2 | `prompt-engine` + catàleg de render + snapshots | ✅ (textos pendents de revisió) |
| 3 | Pipeline de render (mock → real), màscares, logos, versions, comparador | ✅ amb `mock` · proveïdors reals pendents de les claus |
| 4 | Biblioteca de vegetació + selecció automàtica + QC vegetal | Pendent |
| 5 | `cad-schema`, extracció, ezdxf, validador, nota tècnica, visor 3D | Pendent |
| 6 | Correccions CAD, mode revisió, DWG condicionat | Pendent |
| 7 | Límits, costos, esborrat, logs, documentació, E2E | Pendent |
