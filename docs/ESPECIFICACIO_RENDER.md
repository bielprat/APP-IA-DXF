# Especificació del site de millora de renders

> **Estat: PENDENT_REVISIO.** Document redactat per l'equip de desenvolupament a partir del prompt del projecte, perquè
> l'empresa no en tenia cap versió prèvia. Tots els fragments són provisionals fins que Colomer-Rifà els revisi.
>
> **Font de veritat.** Els blocs `text` d'aquest document es copien literalment al catàleg (`packages/catalog`) amb
> `pnpm --filter @cr/catalog sync-fragments`. Un test falla si el catàleg i aquest document no coincideixen.
> Per canviar un text: edita'l aquí, executa la sincronització i revisa els snapshots del motor de prompts.
>
> **Idioma.** Les explicacions són en català; els fragments que rep el model d'imatge són en anglès, perquè els models
> d'edició d'imatge segueixen millor les instruccions en aquest idioma. L'usuari no veu mai aquests textos.

Format de cada fragment: un títol amb l'identificador entre accents greus i, a sota, un bloc `text`.

## 1. Prompt base corporatiu

S'afegeix sempre, en primer lloc.

### `base.corporatiu` · Prompt base

```text
You are editing an architectural render produced by Colomer-Rifà, an architecture and engineering firm. Improve the visual quality of the provided base image so it reads as a professional, photorealistic architectural photograph, while keeping the project exactly as designed. The base image is the single source of truth: preserve the building geometry and volumes, every window, door, pillar, canopy, access, roof and façade module, the urban layout (roads, kerbs, sidewalks, parking bays and plots), the camera position, focal length, perspective and framing, and every logo, sign and lettering. Logos and signage of Bonpreu, Esclat, Esclat Oil, Cupra and SEAT are untouchable: never redraw, restyle, move, resize, translate or regenerate them. Do not add, remove or move architectural elements, people, vehicles, text or watermarks unless explicitly requested below.
```

## 2. Tipologia del projecte

La detecta l'analitzador de visió (`VisionLLM`). Si no es pot detectar, s'usa `tipologia.altres`.

### `tipologia.comercial` · Comercial / supermercat

```text
Project type: retail building (supermarket or commercial unit). Favour a clean, welcoming and well-maintained commercial atmosphere, legible shopfronts and realistic car-park surfaces.
```

### `tipologia.industrial` · Industrial / logística

```text
Project type: industrial or logistics building. Favour a sober, functional atmosphere with crisp cladding panels, realistic loading areas and well-defined hard landscaping.
```

### `tipologia.residencial` · Residencial

```text
Project type: residential building. Favour a calm, liveable atmosphere with natural light, believable domestic details behind the glazing and soft landscaping.
```

### `tipologia.equipament` · Equipament públic

```text
Project type: public facility. Favour a civic, open and accessible atmosphere with durable materials and clear pedestrian spaces.
```

### `tipologia.oficines` · Oficines

```text
Project type: office building. Favour a contemporary, professional atmosphere with precise curtain walls and orderly exterior spaces.
```

### `tipologia.estacio-servei` · Estació de servei

```text
Project type: fuel or service station. Keep canopy, pumps, price totems and forecourt markings exactly as designed and render them with clean, realistic finishes.
```

### `tipologia.concessionari` · Concessionari de vehicles

```text
Project type: car dealership. Keep the brand portal, showroom glazing and display areas exactly as designed, with high-quality reflections and spotless surfaces.
```

### `tipologia.altres` · Altres / no detectada

```text
Project type: architectural project. Apply a neutral, professional architectural photography style.
```

## 3. Targetes «Què vols millorar?»

S'afegeix el fragment de cada targeta seleccionada.

### `millores.fotorealisme` · Fotorealisme general

```text
Improve overall photorealism: physically plausible light, soft and coherent shadows, ambient occlusion, accurate reflections and fine surface textures, as in a high-end architectural photograph.
```

### `millores.vegetacio` · Vegetació

```text
Improve the vegetation according to the vegetation instructions below.
```

### `millores.vidres` · Vidres

```text
Improve the glazing according to the glass instructions below.
```

### `millores.materials` · Materials

```text
Improve how the existing materials are rendered according to the material instructions below, without changing any material, colour or finish choice.
```

### `millores.illuminacio` · Il·luminació

```text
Adjust the lighting according to the lighting instructions below, keeping shadows consistent with a single sun or sky source.
```

### `millores.entorn` · Entorn

```text
Improve the surroundings according to the environment instructions below. The surroundings are context only and must never become more prominent than the project.
```

### `millores.interiors` · Interiors visibles

```text
Make the interiors visible through the glazing believable: subtle depth, soft interior lighting and plausible, uncluttered furnishing that matches the building use, without adding text, logos or people.
```

### `millores.resolucio` · Resolució i nitidesa

```text
Increase perceived resolution and sharpness: crisp edges, clean fine details and no noise, halos, oversharpening or compression artefacts.
```

## 4. Vegetació

### 4.1 Què vols millorar de la vegetació?

«Mantenir original» és exclusiva amb la resta d'opcions.

### `vegetacio.mantenir` · Mantenir original

```text
Keep the existing vegetation exactly as it is: same species, positions, sizes and density.
```

### `vegetacio.millorar-existent` · Millorar existent

```text
Make the existing vegetation photorealistic: natural foliage, realistic trunks and branches, varied leaf tones and natural light through the canopy, keeping every plant in its current position and size.
```

### `vegetacio.arbres` · Arbres

```text
Improve the existing trees: realistic trunks and branching, natural crown shapes and depth in the foliage, keeping their positions, heights and number.
```

### `vegetacio.arbustos` · Arbustos

```text
Improve the existing shrubs and planters: natural volume, varied leaves and clean planter edges, keeping their positions and footprint.
```

### `vegetacio.gespa` · Gespa

```text
Improve the existing lawns: natural, slightly irregular grass with subtle colour variation and no repetitive tiling pattern, keeping the lawn boundaries unchanged.
```

### `vegetacio.fons` · Vegetació de fons

```text
Improve the background vegetation so it adds depth: softer, less detailed and slightly hazier than the foreground, never competing with the building.
```

### 4.2 Estil de vegetació

Opció única. Els estils diferents de «Mantenir estil original» poden canviar espècies i, per tant, la composició.

### `vegetacio.estil-mediterrania` · Mediterrània

```text
Vegetation style: Mediterranean, using species such as olive trees, holm oaks, stone pines, lavender, rosemary and drought-tolerant grasses.
```

### `vegetacio.estil-urbana` · Urbana

```text
Vegetation style: urban, using street trees such as plane trees, hackberries and lindens in tree pits, with neat, low-maintenance planting.
```

### `vegetacio.estil-industrial` · Industrial

```text
Vegetation style: industrial, using sparse, robust and low-maintenance planting with gravel areas, hardy shrubs and a few well-spaced trees.
```

### `vegetacio.estil-residencial` · Residencial

```text
Vegetation style: residential, using gardens with mixed shrubs, flowering plants, hedges and well-kept lawns.
```

### `vegetacio.estil-natural` · Natural

```text
Vegetation style: natural, using native species of Central Catalonia (holm oaks, oaks, pines, boxwood) with a wild, unmanicured look.
```

### `vegetacio.estil-original` · Mantenir estil original

```text
Keep the current vegetation style and species.
```

### 4.3 Què vols copiar d'aquesta referència? (referència de vegetació)

### `vegetacio.copiar-qualitat` · Qualitat

```text
From the vegetation reference, take only the level of realism and detail of the plants.
```

### `vegetacio.copiar-fullatge` · Tipus de fullatge

```text
From the vegetation reference, take only the type of foliage (leaf shape and texture).
```

### `vegetacio.copiar-densitat` · Densitat

```text
From the vegetation reference, take only how dense the planting is, applied to the existing planted areas.
```

### `vegetacio.copiar-color` · Color

```text
From the vegetation reference, take only the colour palette of the plants.
```

### `vegetacio.copiar-naturalitat` · Naturalitat

```text
From the vegetation reference, take only how natural and irregular the plants look.
```

### `vegetacio.copiar-estil` · Estil general

```text
From the vegetation reference, take only the overall planting style, never its layout or composition.
```

## 5. Vidres

### `vidres.mantenir` · Mantenir originals

```text
Keep the glazing exactly as it is: same tint, transparency and reflections.
```

### `vidres.lleugerament-mes-foscos` · Lleugerament més foscos

```text
Make the glazing slightly darker with a subtle tint, keeping reflections and mullions intact.
```

### `vidres.mes-foscos` · Més foscos

```text
Make the glazing noticeably darker, as solar-control glass, keeping mullions and frames clearly visible.
```

### `vidres.mes-transparents` · Més transparents

```text
Make the glazing more transparent so the interior is partly visible, with soft and plausible interior light.
```

### `vidres.mes-reflectants` · Més reflectants

```text
Make the glazing more reflective, showing a coherent reflection of the sky and surroundings consistent with the camera position.
```

### `vidres.mes-neutre` · Vidre més neutre

```text
Make the glazing colour-neutral, removing any blue or green cast while keeping natural reflections.
```

## 6. Il·luminació

### `illuminacio.mantenir` · Mantenir original

```text
Keep the original lighting: same time of day, sun direction and shadow length.
```

### `illuminacio.mati` · Matí

```text
Lighting: clear morning, soft and slightly cool sunlight from a low angle with long, gentle shadows.
```

### `illuminacio.migdia` · Migdia

```text
Lighting: midday, bright and neutral sunlight from a high angle with short, crisp shadows.
```

### `illuminacio.16h` · 16:00 h

```text
Lighting: around 4 pm, warm but still bright sunlight from a medium-low angle with defined shadows.
```

### `illuminacio.hora-daurada` · Hora daurada

```text
Lighting: golden hour, warm low sunlight with long shadows and a soft glow on the façades.
```

### `illuminacio.capvespre` · Capvespre

```text
Lighting: dusk, the sun just below the horizon, warm sky gradient, interior and exterior lights starting to turn on.
```

### `illuminacio.hora-blava` · Hora blava

```text
Lighting: blue hour, deep blue sky, interior lights clearly on and warm, exterior lighting balanced with the sky.
```

### `illuminacio.nit` · Nit

```text
Lighting: night, dark sky, the building lit by its own interior and exterior lighting only, with realistic light falloff and no light pollution haze.
```

## 7. Materials

«Mantenir originals» és exclusiva. Cap opció pot canviar el material, el color o l'acabat triat al projecte.

### `materials.mantenir` · Mantenir originals

```text
Keep every material exactly as it is.
```

### `materials.mes-detall` · Més detall

```text
Add fine, realistic detail to the existing materials: joints, subtle imperfections and micro-texture at the correct scale.
```

### `materials.mes-rugositat` · Més rugositat

```text
Increase the surface roughness of the existing materials where appropriate, reducing a plastic or CGI look.
```

### `materials.menys-brillant` · Menys brillant

```text
Reduce excessive gloss and specular highlights on opaque materials, keeping glass and metal reflections natural.
```

### `materials.mes-natural` · Més natural

```text
Make the existing materials look more natural, with slight weathering and tonal variation consistent with a recently finished building.
```

### `materials.fusta` · Millorar fusta

```text
Improve the existing wood: realistic grain, natural tone variation and correct board or slat scale, without changing its colour or orientation.
```

### `materials.formigo` · Millorar formigó

```text
Improve the existing concrete: realistic formwork marks, tie holes where already present and subtle tonal variation, without changing its colour.
```

### `materials.metall` · Millorar metall

```text
Improve the existing metal: accurate panel joints, realistic reflections and a correct anodised or painted finish, without changing its colour.
```

### `materials.paviment` · Millorar paviment

```text
Improve the existing paving: realistic joints, texture and subtle wear, keeping its pattern, colours and layout.
```

## 8. Entorn

«Mantenir original» és exclusiva. **Cap opció pot modificar la geometria urbana** (vialitat, voreres, parcel·les ni
edificis): només en milloren l'aspecte.

### `entorn.mantenir` · Mantenir original

```text
Keep the surroundings exactly as they are.
```

### `entorn.paviment` · Millorar paviment

```text
Improve the texture of the existing exterior paving, keeping its layout and joints pattern.
```

### `entorn.voreres` · Millorar voreres

```text
Improve the texture of the existing sidewalks and kerbs, keeping their exact position and width.
```

### `entorn.asfalt` · Millorar asfalt

```text
Improve the existing asphalt with realistic texture and subtle wear, keeping all road markings and parking lines exactly where they are.
```

### `entorn.mobiliari` · Millorar mobiliari urbà existent

```text
Improve the existing street furniture (benches, bollards, lamp posts, bins) with realistic materials, without adding, removing or moving any piece.
```

### `entorn.edificis-fons` · Millorar edificis de fons

```text
Improve the realism of the existing background buildings, keeping their volumes and positions and keeping them visually secondary.
```

### `entorn.cel` · Millorar cel

```text
Replace a flat or artificial sky with a realistic sky that matches the chosen lighting, without changing the horizon line.
```

### `entorn.profunditat` · Millorar profunditat atmosfèrica

```text
Add subtle atmospheric perspective: distant elements slightly hazier and less saturated, improving depth.
```

## 9. Fidelitat

### `fidelitat.maxima` · Màxima fidelitat

```text
Fidelity level: maximum. Apply only the improvements listed above. If any improvement could alter architecture, logos, materials or composition, do not apply it. When in doubt, leave the original pixels untouched.
```

### `fidelitat.canvis-seleccionats` · Fidelitat + canvis seleccionats

```text
Fidelity level: high. Keep everything from the original except what is explicitly requested above.
```

### `fidelitat.creatiu-controlat` · Creatiu controlat

```text
Fidelity level: controlled creativity. Allow slightly more visual freedom only within the requested categories; the main architecture, camera, materials and logos remain unchanged.
```

## 10. Referències

Una referència sempre és només una guia visual. S'afegeix el marc i, per a cada referència, el fragment de la finalitat
i els dels atributs triats.

### `referencies.marc` · Marc de les referències

```text
Reference images are attached as visual guides only. Never copy their architecture, composition, camera, people, vehicles, text or logos into the base image.
```

### `referencies.per-vegetacio` · Vegetació

```text
This reference applies only to the vegetation.
```

### `referencies.per-materials` · Materials

```text
This reference applies only to how materials are rendered.
```

### `referencies.per-illuminacio` · Il·luminació

```text
This reference applies only to the lighting and mood.
```

### `referencies.per-entorn` · Entorn

```text
This reference applies only to the surroundings.
```

### `referencies.per-interior` · Interior

```text
This reference applies only to the interiors visible through the glazing.
```

### `referencies.per-perspectiva` · Altra perspectiva

```text
This reference is another view of the same project: use it only to understand the design, never to change the camera of the base image.
```

### `referencies.qualitat` · Qualitat

```text
Take its level of realism.
```

### `referencies.color` · Color

```text
Take its colour palette.
```

### `referencies.textura` · Textura

```text
Take its textures.
```

### `referencies.ambient` · Ambient

```text
Take its overall mood.
```

### `referencies.tipus` · Tipus

```text
Take the type of elements it shows.
```

### `referencies.densitat` · Densitat

```text
Take its density.
```

### `referencies.distribucio` · Distribució

```text
Take how elements are distributed.
```

### `referencies.guia-visual` · Només com a guia visual

```text
Use it only as a general visual guide, without taking any specific attribute.
```

## 11. Indicacions de l'usuari

### `notes.marc` · Marc de les indicacions

```text
Additional notes from the user. They refine the selections above but never override the corporate rules or the final control:
```

## 12. Prompt de control final

S'afegeix sempre, en últim lloc. Inclou l'ordre de prioritat en cas de conflicte.

### `control.final` · Control final

```text
Final check before returning the image. Resolve any conflict with this priority: explicit user instruction, architectural fidelity, camera and framing, materials, logos and brands, form selections, project type preset, photographic style; no instruction may override the corporate rules. The output must have the same framing and aspect ratio as the base image. Architecture, volumes, openings, roof, structure, urban layout, camera and perspective must be identical to the base image. Logos, signs and lettering must be pixel-faithful. Do not add text, watermarks, people, vehicles or new buildings. If a requested improvement conflicts with any of these rules, skip that improvement.
```

## 13. Procés de vegetació en dues fases

Quan l'usuari tria millorar la vegetació (i no «Mantenir original»), la generació es fa en dues passades:

1. **Fase 1 · millora general**: totes les millores excepte la vegetació, intentant preservar-la.
2. **Fase 2 · millora local de vegetació**: només la vegetació, amb les referències triades, sense tocar res més.

### `vegetacio-proces.fase-1` · Fase 1

```text
In this pass, keep the vegetation as it is; it will be improved in a separate pass.
```

### `vegetacio-proces.fase-2` · Fase 2

```text
This pass edits only the vegetation. Do not touch architecture, paving, logos, glazing, buildings, roads or any other non-vegetation pixel.
```

## 14. Control de qualitat vegetal

El fa el `VisionLLM` comparant la imatge base i el resultat. Errors que s'han de detectar (cadascun es pot corregir
localment, només a la zona vegetal afectada): troncs deformats, arbres duplicats, copes artificials, fullatge borrós,
branques impossibles, arbres fusionats amb edificis, massa soroll, vegetació de fons massa definida, gespa repetitiva,
arbres tallats i canvis de posició no autoritzats. El prompt d'anàlisi és a `docs/PROMPT_ASSISTENT_RENDERS.md`.

## 15. Correccions ràpides

Una correcció parteix de la darrera versió aprovada o seleccionada i **només modifica el que s'indica**.

### `correccio.abast` · Abast de la correcció

```text
This is a correction of an existing version. Change only what is listed below and leave every other pixel of the image unchanged.
```

### `correccions.vegetacio-poc-realista` · Vegetació poc realista

```text
Make the vegetation more realistic: natural foliage, real trunks and branching, no CGI look.
```

### `correccions.arbres-deformats` · Arbres deformats

```text
Fix deformed trees: coherent trunks, natural branching and realistic crowns, keeping their positions and sizes.
```

### `correccions.falta-nitidesa` · Falta nitidesa

```text
Increase sharpness and fine detail without halos, noise or oversharpening.
```

### `correccions.vidres-massa-clars` · Vidres massa clars

```text
Make the glazing slightly darker and more realistic.
```

### `correccions.vidres-massa-foscos` · Vidres massa foscos

```text
Make the glazing slightly lighter and more transparent, keeping natural reflections.
```

### `correccions.massa-llum` · Massa llum

```text
Reduce overall exposure and blown highlights, recovering detail in bright areas.
```

### `correccions.massa-fosc` · Massa fosc

```text
Increase overall exposure and lift shadows, recovering detail in dark areas without flattening contrast.
```

### `correccions.materials-poc-realistes` · Materials poc realistes

```text
Make the materials more realistic: correct texture scale, natural roughness and subtle imperfections, without changing them.
```

### `correccions.arquitectura-modificada` · S'ha modificat l'arquitectura

```text
Restore the architecture exactly as in the original base image: geometry, volumes, openings, roof and structure.
```

### `correccions.logo-modificat` · S'ha modificat un logo

```text
Restore every logo, sign and lettering exactly as in the original base image.
```

### `correccions.recuperar-perspectiva` · Recuperar perspectiva original

```text
Restore the original camera position, perspective and framing of the base image.
```

### `correccions.nomes-aquesta-zona` · Millorar només aquesta zona

```text
Apply the improvement only inside the marked area and keep everything outside it unchanged.
```

## 16. Constructor de prompt

Implementat a `packages/prompt-engine` (mòdul pur i determinista). Ordre de composició:

1. Prompt base corporatiu (sempre).
2. Tipologia del projecte.
3. Targetes de millora seleccionades.
4. Opcions específiques: vegetació, vidres, materials, entorn.
5. Il·luminació.
6. Fidelitat.
7. Referències (només els atributs triats).
8. Indicacions opcionals de l'usuari.
9. Prompt de control final (sempre).

Regles:

- «Mantenir original» exclou les altres accions de la mateixa categoria.
- Les opcions d'«Entorn» mai poden desbloquejar geometria urbana.
- Amb «Màxima fidelitat» es descarten les opcions que poden alterar geometria, logos, materials o composició
  (camp `alters` del catàleg) i es retorna un avís per a cadascuna.
- El text lliure de l'usuari es neteja, es limita a 1.000 caràcters i no pot anul·lar el prompt base ni el de control.
- El resultat és `{ prompt, usedFragments, warnings }` i es desa a la taula d'auditoria.
