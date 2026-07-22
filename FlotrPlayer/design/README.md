# Flotr - Player — Design podklady (Etapa 4, issue #82)

UI/UX podklady vygenerované přes Higgsfield MCP (`https://mcp.higgsfield.ai/mcp`, model `nano_banana_pro`) podle zadání [Specifications/Hracska_karticka_prompt.md](../../Specifications/Hracska_karticka_prompt.md), sekce 18–19.

## Rozsah

První průchod (obrázky 01–05) vznikl přes Higgsfield MCP přímo v této konverzaci s budget stropem 10 kreditů (free plán, 2 kredity/obrázek → max 5). Druhý průchod (06–13) uživatel nabil kredity, ale MCP je nezačal reflektovat (viz historie konverzace — balance/transactions zůstaly 0 i po potvrzené platbě se shodným e-mailem), takže obrázky 06–13 byly vygenerovány **ručně na higgsfield.ai** podle stejných promptů/stylu a ručně vloženy do repa. Obojí dohromady pokrývá prakticky celý výčet ze sekce 19 — zbývá jen doladit sémantické chyby popsané níže při implementaci. Akceptační kritéria #82 lze nyní považovat za **z většiny splněná** (design pokrývá obě role i obě pozice), ale review chyb v barvách/hodnotách před zavřením issue je nutné.

## Vygenerované obrázky (`images/`)

| Soubor | Obsahuje |
|---|---|
| `01-design-system.png` | Barevná paleta, typografie, buttony, grade badge, ikony kategorií — referenční style guide |
| `02-player-home-card.png` | Domovská obrazovka účtu Hráč — vlastní hráčská kartička (EA FC / FUT styl) |
| `03-coach-roster.png` | Domovská obrazovka účtu Trenér — seznam hráčů (roster) s vyhledáváním a filtry |
| `04-skill-stats-radar.png` | Statistiky — radarový graf kategorií, nejlepší dovednosti, dovednosti k rozvoji |
| `05-coach-edit-mode.png` | Režim úprav trenéra — bottom sheet výběru známky 1–5 + uložení |
| `06-splash.png` | Splash screen — logo lockup, gradient glow, loading indikátor |
| `07-onboarding.png` | Onboarding — 3 slidy vedle sebe (rozvoj / statistiky / trenér), pagination dots, CTA "Začít" |
| `08-login.png` | Login screen — e-mail/heslo, gradient "Přihlásit se" button |
| `09-skill-detail.png` | Detail jedné dovednosti — grade badge, graf historie známek, cílová známka, doporučení trenéra, datum |
| `10-browse-mode.png` | Prohlížení cizí karty (účet Hráč) — banner "Režim prohlížení" + Předchozí/Další navigace |
| `11-player-comparison.png` | Porovnání dvou hráčů — overlay radar + tabulka rozdílů po dovednostech |
| `12-icon-set.png` | Samostatný icon set — všech 11 kategorií (6 Hráč v poli + 5 Brankář), Czech popisky |
| `13-goalkeeper-card.png` | Brankářská varianta hráčské kartičky (odlišný amber accent, maska v avataru) |

Styl: tmavý motiv, glassmorphism, gradienty modrá→fialová, zaoblené karty, jemné stíny — odpovídá zadání sekce 18 (aplikace je "dark-first", proto zde není samostatná light/dark dvojice; sekce 19's "Dark Mode varianta" je tímto naplněna tím, že celý design *je* tmavý).

## Design tokeny extrahované z `01-design-system.png` (pro `src/theme` v FlotrPlayer)

- **Base:** Dark Navy `#0B1120`
- **Accent:** Electric Blue (primární akcent, gradient buttony, aktivní nav)
- **Gradient:** Violet (druhý bod gradientu s Electric Blue)
- **Typografie:** Display Bold 48pt / Heading Bold 32pt / Body Regular 16pt / Caption Medium 12pt — condensed bold sans-serif (v kódu: systémový/Inter-like grotesk, ne nutně přesně tento font)
- **Grade škála 1–5** (sekce 9 specifikace, závazné pořadí barev, **1 = nejlepší**):
  1. zelená (výborná úroveň)
  2. žlutozelená (velmi dobrá úroveň)
  3. žlutá (dobrá úroveň)
  4. oranžová (slabší úroveň)
  5. červená (nedostatečná úroveň)
- **Komponenty:** Primary button (modro-fialový gradient), Outline button (modrý border), Ghost button (transparentní), kruhový Grade Badge (velké číslo na barevném glass kruhu se září)
- **Ikony kategorií:** hokejka+míček, terč, běžící postava, radar/kompas, štít, činka — flat line styl s gradient akcentem

## Důležité: sémantické chyby v mockupech — needit implementaci

Higgsfield generuje vizuální mockupy, ne datově přesné komponenty — u některých obrázků si model domyslel "vyšší číslo = lepší" (typické pro FIFA rating 0–99), což je **opak** skutečného pravidla ze sekce 9 (1 = nejlepší, 5 = nejhorší). Při implementaci se řiďte výhradně specifikací, ne barvami/čísly v těchto obrázcích:

- `02-player-home-card.png`: badge "92 OVERALL" a "AVG GRADE: 8.5" — ilustrační FIFA-styl rating, **nepoužívat**. Skutečná appka zobrazuje průměrnou známku v rozsahu 1–5 s barvou dle tabulky výše (např. reálná hodnota 1.8 = zelenožlutá, ne "8.5" v zeleném pilulkovém badge).
- `04-skill-stats-radar.png`: kategorie s hodnotou 3.9–4.2 jsou zde omylem v zelených kroužcích (mělo by být oranžové/červené, protože 4–5 = slabší/nedostatečné). Rovněž spodní nav ukazuje "Home / Statistics / Training / Profile" — **neodpovídá** sekci 14 (Hráč: Domů · Dovednosti · Statistiky · Profil). Radarový graf samotný (tvar, gradient výplň, legenda) je použitelný jako vizuální inspirace; popisky os a legenda barev ("1-Výborné...5-Nedostatečné") jsou správně.
- `03-coach-roster.png`: badge "4.5" v zeleném kroužku má stejný problém (4.5 by mělo být oranžovo-červené).
- `05-coach-edit-mode.png`: grade picker 1–5 je barevně **správně** (1 zelená → 5 červená) — použitelné 1:1 jako referenční vzor barevného kódování.
- `09-skill-detail.png`: grade badge "2" žlutozelená a "Cílová známka 1" zelená jsou **správně**; graf historie správně klesá (2 = lepší než 3.5) i s popisky dat. Spodní nav ale ukazuje "Domů / Trénink / Tým / Profil" — opět **neodpovídá** sekci 14 (Hráč: Domů · Dovednosti · Statistiky · Profil), řídit se textem specifikace.
- `10-browse-mode.png`: banner "Režim prohlížení" + klub/tým/pozice/role a Předchozí/Další navigace jsou přesně dle sekce 15 — použitelné 1:1. Ale "CELKOVÉ SKÓRE 88" je stejný FIFA-styl omyl, **nepoužívat** (nahradit průměrnou známkou 1–5 s barvou).
- `11-player-comparison.png`: layout (dvě hlavičky hráčů, overlay radar, tabulka srovnání) je použitelný jako kompoziční inspirace, ale **obsah je z velké části nepoužitelný placeholder** — anglické popisky, generické názvy dovedností ("Speed/Agility/Passing/Shooting/Defense" místo skutečných florbalových kategorií) a písmenkové odznaky "A"/"B" místo barevně kódovaných známek 1–5. Při implementaci nahradit reálnými kategoriemi a grade-badge komponentou ze sekce 9.
- `12-icon-set.png`: **plně použitelné** — správné české popisky pro všech 11 kategorií (6 Hráč v poli + 5 Brankář dle sekce 8), konzistentní styl.
- `13-goalkeeper-card.png`: odlišení pozice amber accentem a "GOALKEEPER" štítkem je dobrý vizuální nápad, ale opět FIFA-styl "92 OVR" a zelený "AVG GRADE 4.5 EXCELLENT" badge — **nepoužívat čísla ani "excellent" popisek**, 4.5 by dle sekce 9 mělo být oranžovo-červené se slovním hodnocením "Slabší"/"Nedostatečné". Text je navíc anglicky, implementace musí být česky.

Radarový graf navíc implementovat dle poznámky ve specifikaci (sekce 12): škála na ose je obrácená (`6 − známka`), skutečnou známku ukazovat v legendě/tooltipu — mockup toto nerozlišuje graficky, jde čistě o layout/styl inspiraci.

## Co chybí

Zbývá hlavně jemné doladění, ne chybějící obrazovky:
- Dokoncept "porovnání hráčů" (11) má nepoužitelný obsah (viz výše) — vizuálně ověřený layout, ale reálné popisky/komponenty je třeba nahradit při implementaci, ne generovat znovu.
- Žádná z 13 obrazovek nebyla zatím reálně porovnána s FlotrPlayer kódem/navigací (#81) — až se bude stavět skutečná IA, ověřit soulad s `App.tsx`/`src/features/*` strukturou.
