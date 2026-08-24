# Epic: Video editor pro trenéry

> Sledováno v GitHub issues: [#133](https://github.com/ladvir/FloorballTraining/issues/133) (epic), milestone *Video editor pro trenéry*.

## Cíl

Nový nástroj pro trenéry — **video editor / video analýza**: vybrat video (už nahrané u Tréninku/Aktivity/Události v systému, nebo z lokálního zařízení), přehrát ho se zpomalením, ořezat na relevantní úsek, kreslit do něj barevné anotace (čáry, od ruky), anotace upravovat/mazat, a celou analýzu i s videem uložit pro pozdější prohlížení.

## Rozhodnutí (navrhovaná)

1. Nová entita `VideoAnnotation`, 1:1 navázaná na existující `Video` (FK `VideoId`) — **žádný nový typ vlastníka, žádná nová file-storage pipeline**. Využívá se hotová infrastruktura z předchozí Etapy s `Video` entitou (upload, disk storage `wwwroot/videos`, YouTube/Instagram odkazy).
2. Anotace = vektorové kreslení s časovou vazbou (`startMs`/`endMs` na časové ose videa), **ne úprava pixelů videa**. Znovupoužije se datový model i UI z existujícího kreslicího nástroje (`Line`, `FreehandLine`, barevná paleta, tloušťka, dash styl, výběr a mazání, undo/redo) — přidá se jen časový rozsah platnosti každé čáry.
3. Střih = **nedestruktivní** (`trimStartMs`/`trimEndMs` uložené u anotace). Zdrojový video soubor se nepřekóduje a needituje.

   **UPDATE:** "vypálení" anotací (#141) přece jen implementováno — trenér nemá čekat na server-side rendering, needituje se nic destruktivně: Hangfire job (infrastruktura už v řešení existuje) přes ffmpeg (Xabe.FFmpeg, auto-download binárky) vykreslí anotace jako SkiaSharp PNG overlaye a vypálí je do nového video souboru; výsledek se uloží jako běžný nový `Video` řádek pod stejným vlastníkem (Trénink/Aktivita/Událost) — originál i jeho `VideoAnnotation` zůstávají nedotčené a editovatelné dál přesně jako dřív.
4. Zpomalení přehrávání = nativní `<video>.playbackRate` (HTML5), žádná serverová logika.
5. Lokální video z zařízení: prohlížení a kreslení nad ním funguje čistě v prohlížeči (File API / blob URL), bez uploadu. Až chce trenér analýzu uložit, video se nahraje přes stávající upload endpoint (musí se přiřadit k Aktivitě/Tréninku/Události) a teprve pak se uloží `VideoAnnotation`.
6. Přístup k anotacím kopíruje oprávnění k danému Tréninku/Aktivitě/Události (Coach/HeadCoach přes `ClubRoleService`, ne Identity role).

## Současný stav (analýza)

- `Video` entita (`FloorballTraining.CoreBusiness/Video.cs`) už existuje, navázaná na Activity/Training/Appointment (přesně jeden vlastník), s `VideoType` (UploadedFile/YouTube/Instagram/OtherLink), `FilePath`, `ThumbnailUrl`.
- Storage (`VideoFileStorage`/`IVideoFileStorage`) ukládá na disk pod `wwwroot/videos/{ownerType}/{ownerId}/{guid}.{ext}`, max velikost `FileUpload:MaxVideoBytes` (200 MB výchozí), validace přípony/typu/signature.
- Upload/list/delete endpointy existují shodně na `ActivitiesController`, `TrainingsController`, `AppointmentsController` (`GET/POST {owner}/{id}/videos`, `POST .../videos/link`, `DELETE .../videos/{videoId}`).
- Přehrávání videa dnes existuje jen jako holý `<video>` tag (FlotrPlayer `VideoPlayer.tsx`, obdoba ve FloTr) — bez rychlosti, ořezu nebo kreslení.
- Kreslicí nástroj (`FloTr/src/components/ui/drawing/`) je hotový: nativní SVG, barevná paleta (8 barev), tloušťka, dash styl, výběr a mazání, undo/redo, diskrétní "frame strip" pro SMIL storyboard — ale bez kontinuální časové osy videa a bez vazby na `<video>` element.
- Neexistuje žádná entita ani endpoint pro ukládání anotací nad videem.

## Roadmapa

**Etapa 1 — Přehrávač a kreslení nad videem (bez ukládání):**
- [x] [#134](https://github.com/ladvir/FloorballTraining/issues/134) — web: stránka Video editoru — výběr videa (ze systému nebo lokální soubor) + přehrávač s rychlostí a scrubberem
- [x] [#135](https://github.com/ladvir/FloorballTraining/issues/135) — web: kreslicí overlay nad videem synchronizovaný s časem přehrávání
- [x] [#136](https://github.com/ladvir/FloorballTraining/issues/136) — web: editace a mazání anotací (výběr, přesun, smazání, undo/redo)

**Etapa 2 — Střih a uložení kompletní analýzy:**
- [x] [#137](https://github.com/ladvir/FloorballTraining/issues/137) — backend: entita `VideoAnnotation` + migrace + endpointy
- [x] [#138](https://github.com/ladvir/FloorballTraining/issues/138) — web: nedestruktivní ořez videa (trim in/out)
- [x] [#139](https://github.com/ladvir/FloorballTraining/issues/139) — web: uložení a znovuotevření uložené analýzy
- [x] [#140](https://github.com/ladvir/FloorballTraining/issues/140) — web: uložení analýzy k lokálnímu videu (napojení na upload flow)

**Etapa 3 — leštění:**
- [x] [#141](https://github.com/ladvir/FloorballTraining/issues/141) — export "vypáleného" videa s anotacemi jako samostatný soubor (Hangfire + ffmpeg + SkiaSharp, viz UPDATE výše)
- [x] [#142](https://github.com/ladvir/FloorballTraining/issues/142) — FlotrPlayer (mobil) — čtení uložené analýzy (read-only, expo-video + react-native-svg)
