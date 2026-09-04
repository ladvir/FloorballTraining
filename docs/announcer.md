# Hlasatel (Announcer)

Přenos samostatné PWA `c:\Claude\hlasatel\` do FloTr. Nahrazuje živého hlasatele:
přečte hlášení lidským hlasem přes **Web Speech API** prohlížeče. Funguje offline,
bez backendu, bez rolí – dostupné každému přihlášenému uživateli.

- Menu: sekce _Moje_, hned pod _Jak získat XP_ (`/announcer`).
- Kód: [`FloTr/src/features/announcer/`](../FloTr/src/features/announcer/)
  - `announcerParse.ts` – tokenizér textu → fronta segmentů `{ text, kind, rate, pitch }`
  - `useAnnouncer.ts` – obálka nad `speechSynthesis` (hlasy, tempo, karaoke index, workaroundy)
  - `AnnouncerPage.tsx` – stránka ve stylu FloTr

## Analýza původní aplikace

| Část | Původní (`hlasatel/`) | Ve FloTr |
|---|---|---|
| Engine | `speechSynthesis` (Web Speech API) | beze změny |
| Značky dynamiky | `*důraz*`, `!nadšení!`, `VELKÁ` (3+) | beze změny + nově `//` pauza |
| Soupisky | 2× localStorage, `[DOMÁCÍ]` / `[HOSTÉ]` expanze | beze změny |
| Knihovna hlášení | localStorage | beze změny (klíče `flotr.announcer.*`) |
| Hlasy | jen české + 3 varianty (základ / vyšší / nižší) | beze změny |
| PWA (`sw.js`, manifest, ikona) | vlastní | zahozeno – FloTr má vlastní |
| Design | tmavé jednoduché CSS | přepsáno na FloTr (`PageHeader`, `Card`, `Button`, Tailwind, světlý motiv) |

## Jak číst text lépe (implementováno)

1. **Watchdog `resume()`** – Chrome po ~15 s tiše zastaví syntézu a někdy nezavolá
   `onend`. `useAnnouncer` volá `synth.resume()` každých 8 s, dokud mluví.
2. **Dělení dlouhých úseků** – `announcerParse` už dělilo na věty; nově dělí i
   běh bez interpunkce delší než 200 znaků (na čárky/pomlčky, pak na slova).
   Chrání soupisky a souvětí před oříznutím.
3. **Globální tempo** – posuvník 0,7–1,4× násobí rychlost všech segmentů, ukládá
   se. Marker-driven model zůstává; tohle je jen jedno „globální kolečko".
4. **Explicitní pauza** – `//` (nebo `[pauza]` / `[pause]`) vloží 550 ms ticha;
   užitečné mezi jmény v soupisce a před vyvrcholením hlášení.

## Podbarvení čteného textu (implementováno)

Pod textovým polem je **náhled ve stylu karaoke**: text se vykreslí jako řetěz
segmentů, každý s tónem podle dynamiky –

| kind | význam | třída |
|---|---|---|
| `plain` | běžný text | `text-gray-700` |
| `emphasis` (`*…*`) | pomalu, výš | `bg-sky-100 text-sky-800` |
| `excited` (`!…!`) | rychle, hodně vysoko | `bg-amber-100 text-amber-800` |
| `chant` (VELKÁ) | skandování | `bg-violet-100 text-violet-800` |
| `pause` (`//`) | ticho | `bg-gray-100 text-gray-400`, značka `‖` |

Právě čtený segment má `ring-2 ring-sky-500`. Klik na segment spustí čtení
**od tohoto místa** (`speak(text, fromIndex)`).

## AI moduly pro čtení textu (zatím neimplementováno)

FloTr má BYOK AI vrstvu (viz `project_sprint9_ai`), ale jen jako **úkolové
endpointy** (`/ai/training-draft/regenerate`, `/ai/activities/suggest`) – žádný
obecný text ani TTS kanál k frontendu. Dvě smysluplné cesty, obě = backend práce:

1. **AI „režisér" hlášení** (levnější, doporučeno první).
   Nový endpoint `POST /ai/announcer/markup`: vstup je holý text, výstup je týž
   text s doplněnými značkami `*…*` / `!…!` / VELKÁ, rozepsanými zkratkami
   (č. → číslo) a případně fonetickým přepisem cizích jmen. Reuse existující
   provider-resolver + consent. Čtení dál dělá Web Speech – zdarma, offline.
2. **Prémiové hlasy přes provider TTS** (OpenAI `gpt-4o-mini-tts`, Google, ElevenLabs).
   Nový audio-proxy endpoint, který streamuje MP3 (klíč zůstává na serveru),
   FloTr přehraje přes `<audio>`. Řeší nekvalitní/chybějící systémové hlasy, ale
   je to placené za znak a offline nefunguje → nechat jako opt-in „prémiový hlas".

Doporučení: udělat (1) jako malý PR (jeden endpoint + tlačítko „Ozdobit AI"),
(2) až bude poptávka po kvalitě hlasu.
