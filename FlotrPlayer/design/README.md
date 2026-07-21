# Flotr - Player — Design podklady (Etapa 4, issue #82)

UI/UX podklady vygenerované přes Higgsfield MCP (`https://mcp.higgsfield.ai/mcp`, model `nano_banana_pro`) podle zadání [Specifications/Hracska_karticka_prompt.md](../../Specifications/Hracska_karticka_prompt.md), sekce 18–19.

## Rozsah tohoto průchodu (budget-limited)

Higgsfield účet měl v době generování jen **10 kreditů** (free plán), 1 obrázek = 2 kredity → max 5 obrázků. Se souhlasem uživatele byla vybrána **kurátorská pětice nejdůležitějších podkladů** místo plného výčtu ze sekce 19. Toto je první přejezd k ověření směru, ne kompletní pokrytí — akceptační kritéria #82 tak zůstávají jen **částečně splněná** (viz "Co chybí" níže). Issue by se nemělo zavírat.

## Vygenerované obrázky (`images/`)

| Soubor | Obsahuje |
|---|---|
| `01-design-system.png` | Barevná paleta, typografie, buttony, grade badge, ikony kategorií — referenční style guide |
| `02-player-home-card.png` | Domovská obrazovka účtu Hráč — vlastní hráčská kartička (EA FC / FUT styl) |
| `03-coach-roster.png` | Domovská obrazovka účtu Trenér — seznam hráčů (roster) s vyhledáváním a filtry |
| `04-skill-stats-radar.png` | Statistiky — radarový graf kategorií, nejlepší dovednosti, dovednosti k rozvoji |
| `05-coach-edit-mode.png` | Režim úprav trenéra — bottom sheet výběru známky 1–5 + uložení |

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

Radarový graf navíc implementovat dle poznámky ve specifikaci (sekce 12): škála na ose je obrácená (`6 − známka`), skutečnou známku ukazovat v legendě/tooltipu — mockup toto nerozlišuje graficky, jde čistě o layout/styl inspiraci.

## Co chybí (mimo rozsah tohoto budget-limited průchodu)

Ze sekce 19 nebylo (kvůli kreditům) vygenerováno:
- Splash screen, onboarding
- Login screen
- Detail dovednosti (samostatná obrazovka, ne jen karta ve statistikách)
- Prohlížení jiného hráče (banner "Režim prohlížení")
- Porovnání hráčů (overlay radar dvou hráčů)
- Samostatný list ikon kategorií jako plnohodnotný icon set (jen 6 ukázkových v design system sheetu)
- Brankářská varianta karty/kategorií (vygenerováno jen Field Player; Brankář se objevuje jen jako textový tag v rosteru)

Až budou k dispozici další Higgsfield kredity, doplnit tyto podklady stejným promptovacím stylem (dark glassmorphism, `nano_banana_pro`, 9:16, 2k) a zapsat je do této složky/tabulky výše.
