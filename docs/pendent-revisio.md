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

## Decisions de la fase 3 per validar

- **Proveïdors reals**: falta triar OpenAI o Gemini per a l'edició d'imatge i aportar les claus (també la d'Anthropic).
  Fins aleshores només funciona el proveïdor de proves (`mock`), clarament indicat a la pantalla.
- **Logos de Bonpreu, Esclat, Esclat Oil, Cupra i SEAT**: la detecció automàtica depèn del `VisionLLM` real. Mentrestant,
  només es protegeixen les zones que l'usuari marca a «Fidelitat i generar».
- **Límits provisionals**: 40 MB i 60 megapíxels per imatge; un sol treball actiu per projecte; sense reintents automàtics
  (l'usuari pot prémer «Reintentar»).
- **Llindar de restauració de logos**: es restaura si la diferència mitjana supera 4/255 per canal (vora suavitzada de 6 px).
- **Esborrat de projectes i pressupost diari**: previst a la fase 7.

## Decisions de la fase 2 per validar

- **Idioma dels fragments**: anglès (els models d'edició d'imatge el segueixen millor). Les explicacions són en català.
- **Opcions que «Màxima fidelitat» descarta** (camp `alters` del catàleg): «Interiors visibles», els estils de vegetació
  diferents de «Mantenir estil original», «Vidres més transparents», «Millorar edificis de fons» i els atributs de
  referència «Tipus» i «Distribució». L'usuari ho veu com a avís abans de generar.
- **Prioritat en cas de conflicte**: el prompt situa la «instrucció explícita de l'usuari» al capdamunt però també diu que
  el text lliure no pot anul·lar el prompt base ni el de control. S'ha resolt així: les indicacions de l'usuari manen
  sobre les tries del formulari, però les frases que intenten desactivar les regles s'eliminen i es mostra un avís.
- **Tipologies**: comercial, industrial, residencial, equipament, oficines, estació de servei, concessionari i altres.
- **Els prompts no surten mai del servidor**: les opcions de la interfície no porten el text; el motor s'executa al
  servidor i al navegador només hi arriben els avisos.

## Decisions de la fase 1 per validar

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
