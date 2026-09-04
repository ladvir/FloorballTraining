# Hlasatel (Announcer)

Přenos samostatné PWA `c:\Claude\hlasatel\` do FloTr. Nahrazuje živého hlasatele:
přečte hlášení lidským hlasem přes **Web Speech API** prohlížeče. Bez rolí –
dostupné každému přihlášenému uživateli.

- Menu: sekce _Moje_, hned pod _Jak získat XP_ (`/announcer`).
- FE: [`FloTr/src/features/announcer/`](../FloTr/src/features/announcer/)
  - `announcerParse.ts` – tokenizér textu → fronta segmentů (`Segment[]`)
  - `useAnnouncer.ts` – obálka nad `speechSynthesis` (hlasy, tempo, dynamika, karaoke index, workaroundy)
  - `AnnouncerPage.tsx` – stránka ve stylu FloTr
- BE: `AnnouncerLibraryController` + `AnnouncerLibraryItem` (per-user knihovna v DB,
  migrace `20260904081432_AddAnnouncerLibrary`).

## Analýza původní aplikace

| Část                           | Původní (`hlasatel/`)                   | Ve FloTr                                                         |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| Engine                         | `speechSynthesis` (Web Speech API)      | beze změny                                                       |
| Značky dynamiky                | `*důraz*`, `!nadšení!`, `VELKÁ` (3+)    | výrazně zesíleno (viz níže) + nově `//` pauza                    |
| Soupisky                       | 2× localStorage, `[DOMÁCÍ]` / `[HOSTÉ]` | beze změny (localStorage `flotr.announcer.roster.*`)             |
| Knihovna hlášení               | localStorage                            | **DB, per-user** (`/announcerlibrary`); jednorázová migrace z LS |
| Hlasy                          | jen české + 3 varianty                  | **všechny nainstalované**, české první, neurální („Natural") pak |
| PWA (`sw.js`, manifest, ikona) | vlastní                                 | zahozeno – FloTr má vlastní                                      |
| Design                         | tmavé jednoduché CSS                    | přepsáno na FloTr (`PageHeader`, `Card`, `Button`, Tailwind)     |

## Jak číst text lépe (implementováno)

1. **Watchdog `resume()`** – Chrome po ~15 s tiše zastaví syntézu a někdy nezavolá
   `onend`. `useAnnouncer` volá `synth.resume()` každých 8 s, dokud mluví.
2. **Dělení dlouhých úseků** – dělí na věty, a dál na klauzule (čárky/pomlčky) a
   slova nad ~200 znaků. Chrání soupisky a souvětí před oříznutím.
3. **Vynechané fráze** – dlouhá `!…!` / `*…*` fráze se posílala do enginu jako
   **jeden** utterance na extrémním `rate` → engine ji občas tiše zahodil
   (`onerror` → přeskočeno). Fix: značkované fráze se dělí po klauzulích stejně
   jako běžný text (`pushShaped`), takže žádný burst není dlouhý řetězec na
   extrémní rychlosti; navíc `onerror` teď **jednou zopakuje** utterance na
   bezpečném `rate` (1,3 / 0,8) místo tichého přeskočení, a strop `rate` je 2,0
   (reálné maximum Chromu).
4. **Explicitní pauza** – `//` (nebo `[pauza]` / `[pause]`) vloží 550 ms ticha.

### Skutečně znatelná dynamika

Web Speech `pitch` **spousta neuronových hlasů ignoruje** a `rate` ořezává do
úzkého pásma → jemné násobení pitch/rate bylo neslyšet. Dynamika je teď
slyšitelná **nezávisle na hlase**:

- **Velký kontrast `rate`** – důraz 0,6 vs. nadšení 1,45 vs. skandování 1,45
  (dřív 0,82 vs. 1,35), škálováno posuvníkem Dynamika, strop 2,0 / podlaha 0,5.
- **Ostrůvky ticha** – každá značka je z obou stran orámovaná skutečnou pauzou
  (`gapBeforeMs` / `gapAfterMs`). „Vše ztichne → pomalé slovo → ticho → tok
  pokračuje" = slyšitelný důraz.
- **Přetvarování textu** (`Segment.speak`) – důraz dostane koncovou `,` (engine
  sám zpomalí a zdůrazní), nadšení každý úsek `!`, skandování se rozseká na
  jednotlivá slova, každé `slovo!` s krátkou mezerou → úsečné „ská-!-lo-!-vá-!-ní".
- **Ztlumení pozadí** – běžný text ~0,78 hlasitosti, značky 1,0 → značky vyskočí
  (jen když v hlášení nějaké značky jsou).

### Co dělají posuvníky (bylo nejasné)

- **Tempo** (`0,7–1,4×`) = celková rychlost čtení, násobí `rate` **všech** segmentů.
- **Dynamika** (`intensity`, `1–3×`, default 1,8) = jak moc se značky liší od
  běžného textu – roztahuje odchylku `rate`/`pitch` od 1 **a** délku všech mezer.
  Na 1× čte skoro monotónně, na 3× přehnaně divadelně.
- Tlačítko **„Zkouška hlasu"** přečte pevnou větu se všemi značkami → slyšíš efekt
  posuvníků okamžitě, dá se A/B ladit.

## Podbarvení čteného textu

Náhled ve stylu karaoke pod polem: řetěz „chipů", tón podle značky (`plain`
šedý, `emphasis` sky+proložený, `excited` amber+kurzíva, `chant` violet+kapitálky,
`pause` `‖`). Právě čtený má `ring-2 ring-sky-500`; klik = čti **odsud**.

## Knihovna v DB

- Entita `AnnouncerLibraryItem { UserId, Name, Text, CreatedAt }`, config s indexem
  `(UserId, CreatedAt)`, migrace `AddAnnouncerLibrary` (žádné FK → prošla i na
  lokální DB s `flotr` schématem).
- `AnnouncerLibraryController` `[Authorize]`: `GET/POST /announcerlibrary`,
  `DELETE /announcerlibrary/{id}` – vše scoped na volajícího, žádné sdílení.
- FE: TanStack Query (`['announcer-library']`) + `announcerApi`. Při prvním načtení
  se stará localStorage knihovna jednorázově nahraje na server a smaže.
- Test: `AnnouncerLibraryTests` (create→list→delete, prázdné = 400, cizí id = 404,
  bez tokenu = 401).

## Odstranění diakritiky

Tlačítko v toolbaru: `text.normalize('NFD').replace(/\p{Diacritic}/gu, '')` na
výběr, jinak na celý text. Pro hlasy, které komolí háčky/čárky.

## Zajímavější hlasy (M/Ž) – jak to dělají tvůrci videí

Tvůrci videí **nepoužívají Web Speech**. Sáhnou po **cloudovém neurálním TTS**,
kde je na výběr desítky pojmenovaných hlasů (muž/žena, per-jazyk) a často styl/
emoce:

| Poskytovatel                       | Hlasy                               | Emoce / styl                          | Cena (orient.)       |
| ---------------------------------- | ----------------------------------- | ------------------------------------- | -------------------- |
| **ElevenLabs**                     | stovky, klonování vlastního hlasu   | „stability/style" + v2 tagy `[smích]` | ~$0,10–0,30 / 1k zn. |
| **OpenAI** `gpt-4o-mini-tts`       | ~11 (alloy, nova, shimmer, onyx, …) | volný `instructions` prompt           | ~$0,015 / 1k zn.     |
| **Google Cloud / Gemini TTS**      | Chirp3-HD, ~30 hlasů, cs-CZ         | omezené (prompt u Gemini)             | ~$0,016 / 1k zn.     |
| **Azure AI Speech** (cs-CZ Neural) | Vlasta, Antonín + „multilingual"    | SSML `<mstts:express-as>`             | ~$0,016 / 1k zn.     |
| **PlayHT**                         | stovky, klonování                   | emoce presety                         | předplatné           |

Pipeline u videí: text → (často LLM na doladění/SSML) → TTS API → MP3/WAV →
sestřih. Klíč je vždy na serveru, ne v prohlížeči.

**Cesta do FloTr** – FloTr už má **BYOK vrstvu** (`UserAiCredential`, šifrované
klíče přes DataProtection, provider-resolver, consent, usage log) pro OpenAI/
Gemini. Chybí jen:

1. `POST /ai/announcer/tts` – vezme text + `voice`, resolvne uživatelův OpenAI
   (nebo Gemini) klíč, zavolá `/v1/audio/speech`, streamuje MP3 zpět, zaloguje
   užití. Značky `*…*` / `!…!` / `VELKÁ` se přeloží na `instructions`
   („zdůrazni …, nadšeně …") nebo se rovnou pošle holý text a intonaci nechá na
   modelu.
2. FE: v `useAnnouncer` přepínač „Prémiový hlas (AI)" → místo `SpeechSynthesisUtterance`
   se přehraje `<audio src=blob>`; seznam hlasů z poskytovatele (M/Ž rozlišené).
3. Fallback: bez klíče / offline → současný Web Speech.

Odhad: ~1 controller + 1 provider-metoda + ~1 den FE. Placené za znak, takže
opt-in. **Doporučuju to jako samostatný PR** – je to hlavní páka na „lidský" zvuk,
ale potřebuje potvrdit poskytovatele a mít u účtu klíč.

Bez backendu jde zatím jen: nechat uživatele vybrat **kterýkoli** nainstalovaný
hlas (hotovo) – kdo má v OS „Microsoft … Online (Natural)" hlasy, uvidí je a jsou
o dost lepší než klasické SAPI.
