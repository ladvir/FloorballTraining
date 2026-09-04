# Hlasatel (Announcer)

Přenos samostatné PWA `c:\Claude\hlasatel\` do FloTr. Nahrazuje živého hlasatele:
přečte hlášení lidským hlasem přes **Web Speech API** prohlížeče. Bez rolí –
dostupné každému přihlášenému uživateli.

- Menu: sekce _Moje_, hned pod _Jak získat XP_ (`/announcer`).
- **Dva enginy vedle sebe**, přepínač na stránce: `browser` (Web Speech, zdarma,
  offline) a `azure` (neurální hlasy přes proxy, viz níže).
- FE: [`FloTr/src/features/announcer/`](../FloTr/src/features/announcer/)
  - `announcerParse.ts` – tokenizér textu → fronta segmentů (`Segment[]`)
  - `announcerSsml.ts` – segmenty → SSML pro Azure engine
  - `useAnnouncer.ts` – oba enginy; `speak()` větví podle `engine`
  - `AnnouncerPage.tsx` – stránka ve stylu FloTr (+ `AzureTtsPanel`)
- BE: `AnnouncerLibraryController` + `AnnouncerLibraryItem` (per-user knihovna v DB,
  migrace `20260904081432_AddAnnouncerLibrary`); `AnnouncerTtsController` +
  `AnnouncerTtsCredential` + `AzureSpeechClient` (Azure proxy, migrace
  `20260904090409_AddAnnouncerTtsCredential`).

## Analýza původní aplikace

| Část                           | Původní (`hlasatel/`)                   | Ve FloTr                                                         |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| Engine                         | `speechSynthesis` (Web Speech API)      | zůstává + druhý engine Azure AI Speech (přepínač)                |
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

## Neurální hlas – Azure AI Speech (implementováno)

Druhý engine vedle Web Speech, přepíná se přepínačem nahoře na stránce. BYOK –
uživatel zadá **region + klíč** svého Azure Speech resource; klíč se ověří,
uloží šifrovaně (stejný `IAiCredentialProtector` jako AI klíče) a **nikdy
neopustí server** – prohlížeč posílá SSML na `/announcer/tts/speak` a dostane MP3.

**Backend**

- `AnnouncerTtsCredential { UserId, Region, EncryptedApiKey, KeyLast4, LastValidatedAt }`,
  unique index `UserId`, migrace `20260904090409_AddAnnouncerTtsCredential`.
- `AzureSpeechClient` – tenký wrapper: `GET {region}.tts.speech.microsoft.com/cognitiveservices/voices/list`
  (validace klíče + seznam hlasů), `POST …/cognitiveservices/v1` s SSML +
  `X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3` → MP3. Region je
  striktně validovaný (`^[a-z0-9]{3,30}$`), protože jde do hostname.
- `AnnouncerTtsController` `[Authorize]` `Route("announcer/tts")`:
  `GET status`, `PUT key {region,apiKey}` (ověří přes voices/list), `DELETE key`,
  `GET voices`, `POST speak {ssml}` – SSML se před odesláním ověří (`XDocument.Parse`,
  kořen `<speak>`, ≤12 000 znaků) a proxuje na Azure; vrací `File(mp3, "audio/mpeg")`.
- Klíč `IAzureSpeechClient` registrován v `AddAiServices`.
- Test `AnnouncerTtsTests` – no-key brány (409), validace regionu (400), SSML kořen
  (400), a přes stub `IHttpClientFactory` celý connect → status → voices → speak.

**Frontend**

- `announcerTtsApi` (status / saveKey / deleteKey / getVoices / speak→Blob).
- `announcerSsml.ts` `buildSsml()` – z parsovaných segmentů staví SSML: `*důraz*`
  → `<break/><prosody rate pitch><emphasis level="strong">…</emphasis></prosody><break/>`,
  `!nadšení!` → `<prosody>…!</prosody>`, `VELKÁ` → `<prosody>` per slovo, `//` →
  `<break>`. Tempo = vnější `<prosody rate>`, volitelně `<mstts:express-as style>`.
  Posuvníky Dynamika/Tempo škálují procenta a délky pauz — na Azuru je to **skutečná
  prozódie**, ne fake jako u Web Speech.
- `useAnnouncer` má `engine: 'browser' | 'azure'` (ukládá se). Pro `azure` `speak()`
  pošle SSML, přehraje výsledné MP3 přes `HTMLAudioElement` (+ `URL.createObjectURL`).
  `stop()` pauzuje audio i `speechSynthesis`. Karaoke zvýraznění po segmentech je
  jen pro browser engine (Azure nemá časování).
- `AzureTtsPanel` v `AnnouncerPage`: když není připojeno → formulář region + klíč
  („přihlášení") + odkaz do Azure portálu; když je → badge „Připojeno · region ·
  …klíč", „Odpojit", výběr hlasu (cs-CZ první, ♀/♂) a stylu (pokud hlas má `StyleList`).

**Proč Azure a ne ostatní:** cs-CZ neurální hlasy `cs-CZ-VlastaNeural` (Ž),
`cs-CZ-AntoninNeural` (M) + „multilingual" hlasy; SSML `<prosody>`/`<emphasis>`/
`<break>` respektované → dynamika je slyšet doslova; ~$16 / 1M znaků, free tier
500k znaků/měsíc. (Alternativy: ElevenLabs – nejpřirozenější, dražší; OpenAI
`gpt-4o-mini-tts` – `instructions` prompt; Google Chirp3-HD.)

**Fallback:** bez klíče / offline → engine „Hlas prohlížeče" funguje beze změny.
