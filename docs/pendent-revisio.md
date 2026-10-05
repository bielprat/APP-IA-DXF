# Pendent de revisió

Continguts i decisions que falten o que s'han redactat provisionalment. Les opcions de catàleg marcades
`"status": "PENDENT_REVISIO"` també es poden llistar amb `pendingReviewOptions()` de `@cr/catalog`.

## Documents que falten

L'empresa els facilitarà més endavant.

| Fitxer | Impacte |
|---|---|
| `docs/ESPECIFICACIO_RENDER.md` | **Bloqueja la fase 2**: font literal dels fragments de prompt (`promptFragment`) |
| `docs/PROMPT_ASSISTENT_RENDERS.md` | Rol de l'assistent de renders (fases 2–3) |
| `docs/PROMPT_ASSISTENT_CAD.md` | Regles del modelatge CAD (fases 5–6) |
| `docs/guia-millora-renders.md` | Opcional |
| `docs/regles-modelatge-cad-3d.md` | Opcional |

## Opcions de catàleg provisionals (`PENDENT_REVISIO`)

| Id | Text | Motiu |
|---|---|---|
| `biblioteca.clima-mediterrani` | Mediterrani | El prompt demana l'etiqueta «clima» però no en dona els valors |
| `biblioteca.clima-continental` | Continental | Ídem |
| `biblioteca.clima-muntanya` | Muntanya | Ídem |
| `projectes.aprovat` | Aprovat (filtre d'estat) | El disseny només mostra «En curs» i «Lliurat»; el flux té el botó «Aprovar» |

## Decisions de la fase 1 per validar

- **Fragments de prompt**: cap opció de render porta encara `promptFragment`. Es transcriuran literalment a la fase 2.
- **Categories sense pestanya de detalls**: «Fotorealisme general», «Interiors visibles» i «Resolució i nitidesa» no tenen
  opcions específiques ni al prompt ni al disseny, i per això no tenen pestanya a «Detalls». Cal confirmar si n'han de tenir.
- **Valors per defecte del modelatge CAD segons el mode**: en «Model precís des de plànols», alçades, gruixos, coberta i
  modulació de vidrieres prenen per defecte «Segons els plànols»; en «Model aproximat des d'imatges», «Estimar des de la imatge»
  (com al disseny). Així no s'estima res sense autorització explícita (§6.2).
- **Detalls exteriors i entorn**: si a «Què modelar?» es tria «Detalls exteriors», cal triar quins detalls (no hi ha valor per
  defecte). Si no, el valor és «Cap detall exterior». Si es tria «Topografia i urbanització», l'entorn passa a «Topografia».
- **Referències**: «Només com a guia visual» és exclusiva amb la resta d'atributs de «Què vols aprofitar?».
- **Colors de capes**: l'esquema «Escala de grisos» fa servir grisos derivats de la paleta. Els esquemes «Per tipus d'element» i
  «Per planta» encara no tenen colors definits; de moment es mostren els de sistema constructiu.
- **Capa dels detalls exteriors**: la taula §6.3 no té capa pròpia per a marquesines, rampes, baranes, etc.
- **Límits de pujada provisionals**: renders PNG/JPG fins a 40 MB i 10 imatges; fonts CAD fins a 100 MB i 20 fitxers.

## Decisions obertes

- Proveïdor d'imatge per defecte (OpenAI o Gemini) i claus d'API.
- Allotjament (servidor intern o núvol) → emmagatzematge local o S3.
- Pressupost diari per usuari.
- Lectura directa de DXF amb ezdxf en lloc de passar-los per la IA.
