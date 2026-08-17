# Prompt pro vývoj mobilní aplikace: Hráčská karta dovedností (florbal)

Tento dokument je zadání pro AI vývojářský nástroj (např. Claude Code) nebo vývojový tým. Nahrazuje původní zadání včetně všech dodatků — je bezrozporný a připravený k přímému použití.

## 1. Cíl a kontext

Navrhni a vytvoř multiplatformní mobilní aplikaci (Android + iOS) v **React Native + TypeScript**, která hráčům, brankářům a trenérům florbalového klubu zobrazuje individuální hodnocení dovedností — ve stylu profesionální sběratelské kartičky (inspirace EA Sports FC / FIFA Ultimate Team). Aplikace má dva typy účtů s odlišnými oprávněními, **Hráč** a **Trenér** (podrobně sekce 5) — trenér navíc dovednosti hráčů svého týmu upravuje.

Aplikace je klientská nadstavba nad **již existujícím REST API backendem** (stejný backend, který používá webová aplikace FloorballTraining). Nevytváří se nový backend, pouze se konzumují existující endpointy. Aplikace vždy zobrazuje/nabízí k úpravě jen data, ke kterým má přihlášený uživatel podle backendu oprávnění.

UI je primárně v češtině (vícejazyčnost je součástí budoucího rozšíření — viz sekce 20).

> **Doporučení před startem implementace:** vyžádej si OpenAPI/Swagger specifikaci existujícího backendu (ASP.NET Core ji typicky generuje automaticky) nebo alespoň přesné názvy endpointů a tvar JSON odpovědí, včetně endpointů pro zápis (úprava známky). Zadání níže popisuje chování a datové nároky, ne přesný API kontrakt.

## 2. Technologický stack

- React Native, TypeScript (bez zbytečných `any`)
- Expo (pokud není konkrétní důvod pro bare workflow)
- React Navigation
- TanStack Query (React Query) pro server state, cache a refetch
- Axios jako HTTP klient
- JWT autentizace, token v Secure Storage (např. `expo-secure-store` / `react-native-keychain`)
- Zustand nebo Redux Toolkit pro globální klientský stav
- React Native Reanimated pro animace a přechody
- React Native SVG pro radarové grafy
- Victory Native XL (nebo obdobná moderní knihovna) pro grafy vývoje/trendů

## 3. Architektura

- Clean Architecture, feature-based struktura projektu (ne dělení podle typu souboru)
- Repository Pattern pro přístup k API — API volání izolovaná od UI
- Repository vrstva podporuje čtení i zápis (mutace) — úpravu známek dovedností provádí trenér, viz sekce 16
- Oddělené vrstvy: UI (obrazovky/komponenty) — business logika (hooks/služby) — data (repository/API klient)
- Modulární, plně typovaný, dobře okomentovaný kód připravený na dlouhodobý rozvoj

## 4. Autentizace

- Přihlášení uživatelským jménem a heslem přes existující REST API
- Po úspěšném přihlášení: JWT token se uloží do Secure Storage a automaticky posílá v hlavičce `Authorization` u každého požadavku
- Odpověď na přihlášení (nebo navazující dotaz na profil) obsahuje typ účtu (Hráč / Trenér), podle kterého aplikace přizpůsobí navigaci a oprávnění (viz sekce 5)
- Uživatel zůstává přihlášen do odhlášení nebo expirace tokenu
- Po expiraci/neplatnosti tokenu: automatické přesměrování na login se srozumitelnou hláškou

## 5. Role a oprávnění uživatelů

Aplikace rozlišuje dva nezávislé pojmy, které je potřeba nezaměňovat:

- **Typ účtu** — vlastnost přihlášeného uživatele, vrací ji backend při přihlášení/načtení profilu. Určuje oprávnění v aplikaci:
  - `Hráč` — vidí a upravuje pouze svá vlastní data (v tomto kontextu „upravuje" neplatí — hráč dovednosti pouze čte); ostatní hráče může pouze procházet v režimu Prohlížení (read-only, sekce 15)
  - `Trenér` — nemá vlastní hráčskou kartičku; spravuje hráče svého týmu/klubu, které mu backend zpřístupní, a smí u nich upravovat dovednosti (sekce 16)
- **Pozice hráče** — vlastnost každého hráčského profilu (Player entity), nezávislá na tom, kdo se na kartu dívá: `Hráč v poli` nebo `Brankář`. Určuje, jaké kategorie dovedností se na dané kartě zobrazují (sekce 8).

Příklad: trenér otevře kartičku brankáře — uvidí kategorie pro pozici Brankář a smí je upravovat, protože jeho typ účtu je Trenér.

**Oprávnění (kdo vidí/edituje koho) určuje výhradně backend** — aplikace zobrazí/nabídne k editaci jen hráče, které API vrátí jako dostupné pro daného trenéra. Frontend žádná oprávnění sám nevyhodnocuje ani necachuje jako zdroj pravdy.

## 6. Načtení dat po přihlášení

**Účet Hráč:**
1. Aplikace odešle identifikaci uživatele (uživatelské jméno / claim z JWT)
2. API vrátí ID hráče
3. Podle ID aplikace načte: jméno, fotografii, klub, tým, ročník, pozici, datum posledního hodnocení, seznam hodnocených dovedností s aktuální známkou a historii hodnocení (pokud ji API poskytuje)

**Účet Trenér:**
1. Aplikace načte profil trenéra (jméno, klub, tým/týmy)
2. Aplikace načte seznam hráčů, které má trenér oprávnění spravovat (roster)
3. Data konkrétního hráče (stejná struktura jako výše) se načtou až po jeho výběru ze seznamu

## 7. Domovská obrazovka

**Účet Hráč:** po přihlášení se zobrazí vlastní hráčská kartička: fotografie, jméno, klub, tým, ročník, pozice, celkové hodnocení (např. průměrná známka), datum posledního hodnocení.

**Účet Trenér:** po přihlášení se zobrazí seznam hráčů (roster) — shodná obrazovka jako seznam v sekci 15, včetně vyhledávání a filtrů. Trenér nemá vlastní hráčskou kartičku.

**Vizuální styl (obě varianty):** tmavé sportovní pozadí, barevné gradienty, zaoblené rohy, jemné mikroanimace, moderní typografie — vzhled profesionální sběratelské kartičky.

## 8. Pozice hráče a kategorie dovedností

Každý hráčský profil má pozici `Hráč v poli` nebo `Brankář` (sekce 5), podle které se zobrazí odpovídající kategorie dovedností — nezávisle na tom, jestli kartu prohlíží sám hráč, nebo ji spravuje trenér. Kategorie jsou pevná struktura UI (grupování + výběr ikony); **konkrétní dovednosti v každé kategorii se načítají dynamicky z API** — výčty níže jsou ilustrační příklady pro návrh obsahu a designu, ne pevný seznam.

### Hráč v poli — 6 kategorií

1. **Práce s míčkem** — vedení míčku, zpracování/první dotek, kontrola míčku, obcházení soupeře, změna směru
2. **Zakončení** — střelba, přesnost střely, zakončení z první, tečování/dorážka, zakončení pod tlakem
3. **Pohyb bez míčku** — náběhy, vytváření prostoru, uvolňování se pro přihrávku, změna tempa, načasování pohybu
4. **Pohyb na hřišti** — orientace, práce v prostoru, přechod útok/obrana, poziční hra, rozhodování
5. **Obranné činnosti** — odebírání míčku, presink, osobní obrana, souboje, blokování střel
6. **Kondice** — rychlost, akcelerace, vytrvalost, síla, obratnost, koordinace

### Brankář — 5 kategorií

1. **Postoj a pohyb** — základní postoj, přesuny, práce nohou, správné postavení vůči střele, reakce
2. **Zákroky** — chytání, vyrážení, zákroky na čáře, zákroky 1 na 1, zákroky na vysoké míče
3. **Rozehrávka** — výhoz/vyhození po zákroku, přihrávka, rozehrávka pod tlakem, založení útoku
4. **Komunikace a organizace obrany** — komunikace se spoluhráči, řízení obrany, organizace standardních situací, čtení hry
5. **Kondice** — rychlost, výbušnost, síla, koordinace, flexibilita

## 9. Hodnocení dovedností — systém známek

Jediný platný hodnoticí systém: každá dovednost má známku **1–5** (jako školní klasifikace).

| Známka | Slovní hodnocení | Barva |
|---|---|---|
| 1 | Výborná úroveň | zelená |
| 2 | Velmi dobrá úroveň | žlutozelená |
| 3 | Dobrá úroveň | žlutá |
| 4 | Slabší úroveň | oranžová |
| 5 | Nedostatečná úroveň | červená |

Barevné kódování se používá jednotně u odznaku známky, u čísla i u ikon/indikátorů v seznamech. Známku může měnit pouze účet typu **Trenér** (sekce 16); účet Hráč dovednosti pouze čte.

## 10. Karta dovednosti (seznam)

Každá dovednost = samostatná karta s: názvem dovednosti, výrazným barevným odznakem se známkou (velké číslo v kruhu/štítu — **ne** progress bar ani procenta) a krátkým popisem nebo doporučením trenéra.

V **režimu úprav** (jen účet Trenér, sekce 16) je odznak interaktivní — klepnutím se otevře výběr známky 1–5.

## 11. Detail dovednosti

Název, aktuální známka, slovní hodnocení, graf vývoje známky v čase (pokud API poskytuje historii), doporučení trenéra, cílová známka, datum posledního hodnocení.

Pole „doporučení trenéra" a „cílová známka" edituje výhradně účet Trenér (sekce 16); účet Hráč je má pouze ke čtení.

## 12. Statistiky

Platí pro aktuálně otevřenou hráčskou kartičku (vlastní u účtu Hráč, nebo vybraného hráče u účtu Trenér).

- průměrná známka ze všech dovedností
- průměrná známka po kategoriích
- nejlepší dovednosti (známka 1)
- dovednosti k rozvoji (známka 4–5)
- radarový graf kategorií
- trend vývoje jednotlivých kategorií v čase (pokud je historie dostupná)

> **Implementace radarového grafu:** škála je obrácená (1 = nejlepší, 5 = nejhorší). Na ose zobrazuj převrácenou hodnotu (`6 − známka`), aby větší plocha grafu odpovídala lepšímu výkonu; skutečnou známku ukazuj v legendě/tooltipu, aby graf nepůsobil zavádějícím dojmem.

## 13. Filtrování a vyhledávání

Filtr: všechny dovednosti / nejslabší (známka 4–5) / nejsilnější (známka 1) / podle kategorie. Vyhledávání podle názvu dovednosti funguje okamžitě (live search). Platí vždy v rámci aktuálně otevřené karty hráče.

## 14. Navigace

**Účet Hráč:** 🏠 Domů (moje karta) · 🎯 Dovednosti · 📊 Statistiky · 👤 Profil

**Účet Trenér:** 🏠 Hráči (roster) · 👤 Profil (účet trenéra). Dovednosti a Statistiky nejsou samostatné položky menu — jsou dostupné v kontextu právě otevřené hráčské karty (sekce 8 a 12).

## 15. Seznam a prohlížení hráčů klubu

Seznam hráčů klubu se používá ve dvou kontextech:

- **Účet Hráč** — volitelný **režim Prohlížení** (přepnutí z vlastního profilu), striktně **read-only**
- **Účet Trenér** — toto je rovnou domovská obrazovka (roster) a výchozí vstup pro úpravu dovedností hráčů, které trenér spravuje (sekce 16)

Společné chování:
- seznam všech hráčů, ke kterým má uživatel podle API oprávnění (u Hráče typicky stejný klub/kategorie, u Trenéra jeho tým/svěřenci)
- vyhledávání podle jména; filtry: tým, ročník, pozice, role
- výběr hráče otevře jeho kartičku ve stejném designu; u účtu Hráč nahoře zřetelně označeno „Režim prohlížení" + klub/tým/pozice/role
- navigace mezi kartičkami: swipe doleva/doprava nebo šipky Předchozí/Další, plynulé animované přechody, rychlý návrat do seznamu

Omezení pro účet Hráč: striktně read-only — bez úprav hodnocení, komentářů, osobních údajů, bez mazání či vytváření záznamů. Účet Trenér má u hráčů ve své správě navíc oprávnění podle sekce 16.

## 16. Úprava dovedností hráče (režim trenéra)

Dostupné pouze pro účet **Trenér**, a pouze u hráčů, které mu backend zpřístupní ke správě.

**Vstup do režimu úprav**
- na otevřené hráčské kartičce trenér přepne přepínačem/tlačítkem do **režimu úprav** (jasně vizuálně odlišen, např. změna barvy záhlaví nebo ikona tužky)
- mimo režim úprav je karta i pro trenéra pouze ke čtení (stejný vzhled jako u hráče)

**Co lze upravovat**
- známka dovednosti (1–5) — klepnutím na odznak dovednosti se otevře výběr známky (např. bottom sheet s pěti barevně odlišenými možnostmi)
- cílová známka (na detailu dovednosti)
- doporučení trenéra — krátký textový komentář k dovednosti (na detailu dovednosti)

Úpravu základních údajů hráče (jméno, fotografie, klub, tým, ročník, pozice) tato specifikace neřeší — předpokládá se správa jinde (existující administrace), pokud není zadáno jinak.

**Ukládání**
- lze upravit libovolný počet dovedností v rámci jedné návštěvy karty a uložit najednou tlačítkem **Uložit** (ne autosave po každém klepnutí) — snižuje riziko nechtěné změny
- při opuštění rozpracovaného režimu úprav s neuloženými změnami aplikace zobrazí potvrzovací dialog

**Historie a datum hodnocení**
- uložení nové známky vytvoří nový záznam v historii dané dovednosti (napájí graf vývoje ze sekce 11 a trend v sekci 12), nepřepisuje předchozí hodnoty
- „datum posledního hodnocení" na kartičce i u dovednosti se aktualizuje na datum uložení

**Oprávnění**
- backend je jediným zdrojem pravdy pro to, které hráče smí konkrétní trenér upravovat; pokud API úpravu odmítne, aplikace zobrazí srozumitelnou chybovou hlášku a změnu neuloží
- rozpracované úpravy se lokálně trvale neukládají (offline režim je mimo rozsah MVP — viz sekce 20)

## 17. Porovnání hráčů

- dostupné z režimu Prohlížení/seznamu: uživatel vybere dva hráče k porovnání (typicky sebe a jiného hráče, případně dva jiné, pokud to API umožní)
- zobrazení: kartičky vedle sebe + překrytý (overlay) radarový graf obou hráčů, barevně odlišené
- tabulka rozdílů po kategoriích/dovednostech s vyznačením, kdo je v čem lepší
- stejná oprávnění a read-only omezení jako v režimu Prohlížení (porovnání samo o sobě nic needituje)

## 18. Vizuální design

Inspirace: EA Sports FC, FIFA Ultimate Team, moderní sportovní aplikace.

Použij: tmavý motiv, klubové akcentní barvy, glassmorphism, jemné gradienty, mikroanimace, stíny, konzistentní ikony, plynulé přechody, responzivní layout pro různé velikosti telefonů.

## 19. UI/UX podklady — Higgsfield MCP

Pro návrh obrazovek, komponent a vizuálních podkladů použij Higgsfield MCP (`https://mcp.higgsfield.ai/mcp`) k vygenerování:

- design systém (barevná paleta, typografie, komponenty)
- hráčská kartička, splash screen, onboarding
- login, dashboard, seznam hráčů, detail hráče, statistiky
- radarové grafy, animace přechodů, ikony kategorií
- obrazovka/komponenta režimu úprav pro trenéra (výběr známky, uložení)
- Dark Mode varianta všech obrazovek

Styl: glassmorphism, jemné gradienty, kvalitní mikroanimace, plně připraveno k implementaci v React Native.

## 20. Budoucí rozšíření (mimo MVP)

Architektura má bez zásadního refaktoringu umožnit doplnit: push notifikace, tréninkové plány, videa k jednotlivým dovednostem, hromadné hodnocení všech hráčů týmu v rámci jedné tréninkové session, rozšířené porovnání napříč věkovými kategoriemi/celým klubem, ocenění a achievementy, týmové statistiky, offline režim s lokální cache, vícejazyčné prostředí (čeština, slovenština, angličtina).

## 21. Definition of Done

- [ ] Přihlášení + JWT + Secure Storage
- [ ] Rozlišení typu účtu (Hráč / Trenér) s odpovídající navigací a oprávněními
- [ ] Domovská obrazovka: vlastní kartička (účet Hráč) / seznam hráčů (účet Trenér)
- [ ] Všechny kategorie dovedností pro obě pozice hráče (Hráč v poli / Brankář), dovednosti načítané dynamicky z API
- [ ] Známkování 1–5 s jednotným barevným kódováním (bez progress baru/procent)
- [ ] Detail dovednosti s grafem vývoje
- [ ] Statistiky + radarový graf s ošetřenou invertovanou škálou
- [ ] Filtrování a živé vyhledávání
- [ ] Seznam a prohlížení hráčů klubu (read-only pro účet Hráč) + navigace mezi kartičkami
- [ ] Režim úprav pro Trenéra: změna známky, cílové známky a doporučení, hromadné uložení, promítnutí do historie
- [ ] Porovnání dvou hráčů
- [ ] Design systém a klíčové obrazovky vygenerované přes Higgsfield MCP (včetně obrazovky úprav)
- [ ] Architektura připravená na rozšíření z bodu 20
