# Aktivity - kompletní dokumentace

## Přehled

Aktivita je základní stavební prvek tréninku. Představuje konkrétní cvičení, hru nebo drill, který lze zařadit do tréninku. Aktivity mohou být vytvářeny všemi přihlášenými uživateli, ale upravovat/mazat je smí pouze autor nebo Admin.

---

## Datový model

### Základní vlastnosti

| Vlastnost | Typ | Výchozí | Popis |
|-----------|-----|---------|-------|
| `Name` | string | povinný | Název aktivity (max 50 znaků) |
| `Description` | string | volitelný | Popis aktivity (max 1000 znaků) |
| `PersonsMin` | int | 1 | Minimální počet hráčů |
| `PersonsMax` | int | 30 | Maximální počet hráčů |
| `GoaliesMin` | int | 0 | Minimální počet brankářů |
| `GoaliesMax` | int | 0 | Maximální počet brankářů |
| `DurationMin` | int | 1 | Minimální doba trvání (minuty) |
| `DurationMax` | int | 60 | Maximální doba trvání (minuty) |
| `Intensity` | int | 1 | Intenzita (0=Nízká, 1=Střední, 2=Vysoká) |
| `Difficulty` | int | 1 | Obtížnost (0=Nízká, 1=Střední, 2=Vysoká) |
| `PlaceWidth` | int | 1 | Šířka hřiště |
| `PlaceLength` | int | 1 | Délka hřiště |
| `Environment` | enum | Anywhere | Prostředí (Anywhere=Kdekoliv, Indoor=Uvnitř, Outdoor=Venku) |
| `IsDraft` | bool | true | Stav aktivity (koncept/kompletní) |
| `CreatedByUserId` | string | auto | ID uživatele, který aktivitu vytvořil |

### Vazby (kolekce)

| Vazba | Popis |
|-------|-------|
| `ActivityTags` | Štítky přiřazené aktivitě |
| `ActivityEquipments` | Vybavení potřebné pro aktivitu |
| `ActivityMedium` | Obrázky, videa, URL |
| `ActivityAgeGroups` | Věkové skupiny, pro které je aktivita určena |
| `TrainingGroups` | Tréninkové skupiny, které tuto aktivitu používají |

---

## Stav aktivity (Draft systém)

### Životní cyklus

1. **Vytvoření** - aktivita se vytvoří s `IsDraft = true`
2. **Editace** - uživatel může ukládat bez validace
3. **Validace** - uživatel klikne na tlačítko Validovat:
   - Projde validací → `IsDraft = false` (kompletní)
   - Neprojde → `IsDraft = true` (zůstává koncept) + zobrazí se chyby
4. **Zobrazení** - žlutý indikátor = koncept, zelený = kompletní

### Validační pravidla (ActivityValidator)

| Pole | Pravidlo | Chybová hláška |
|------|----------|----------------|
| Name | Nesmí být prázdný | "Zadej název" |
| Name | Max 50 znaků | "Překročen limit 50 znaků" |
| Description | Max 1000 znaků | "Překročen limit 1000 znaků" |
| PersonsMin | 1-100 | "Počet osob min." |
| PersonsMin/Max | Min ≤ Max | "Počet osob min. nesmí být větší..." |
| GoaliesMin | ≤ PersonsMax | "Minimální počet brankářů přesahuje..." |
| GoaliesMax | ≤ PersonsMax | "Maximální počet brankářů překračuje..." |
| GoaliesMin/Max | Min ≤ Max | "Počet brankářů min. je větší..." |
| DurationMin/Max | Min ≤ Max | "Doba trvání min. nesmí být delší..." |

---

## Média a obrázky (ActivityMedia)

### Vlastnosti

| Vlastnost | Typ | Popis |
|-----------|-----|-------|
| `Name` | string | Název souboru (např. `foto.jpg` nebo `kresba.svg`) |
| `MediaType` | enum | Image (0), Video (1), URL (2) |
| `Path` | string | Cesta k souboru na serveru |
| `Data` | string | Base64 obrázek NEBO JSON stav kresby |
| `Preview` | string | SVG řetězec pro kresby, prázdný pro fotky |
| `IsThumbnail` | bool | Zda je tento obrázek náhledem aktivity |

### Typy obrázků

#### Nahraný obrázek (fotka)
- `Data` = data URI (`data:image/jpeg;base64,...`)
- `Preview` = prázdný
- Automaticky zmenšen na max 1200px, JPEG komprese 85%

#### Nakreslený obrázek (kresba)
- `Data` = JSON stav kresby (pro opětovnou editaci)
- `Preview` = SVG XML řetězec (pro zobrazení a PDF)
- `Name` = `kresba.svg`
- Lze znovu otevřít a editovat v kreslícím nástroji

### Správa obrázků (jen v režimu editace)
- **Nahrát** - tlačítko pro upload fotky
- **Nakreslit** - otevře fullscreen kreslící nástroj (DrawingComponent)
- **Náhled** - hvězdička nastaví obrázek jako thumbnail
- **Editovat** - tužka (pouze pro kresby) - znovu otevře kreslení
- **Smazat** - koš odstraní obrázek
- **Lightbox** - klik na obrázek zobrazí zvětšenou verzi
- První obrázek se automaticky nastaví jako thumbnail

---

## API endpointy

### Čtení

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| GET | `/activities` | Seznam s filtrováním a stránkováním | Přihlášený |
| GET | `/activities/all` | Všechny aktivity bez stránkování | Přihlášený |
| GET | `/activities/{id}` | Detail aktivity | Přihlášený |

### Zápis

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| POST | `/activities` | Vytvoření nové aktivity | Přihlášený (auto CreatedByUserId) |
| PUT | `/activities/{id}` | Úprava aktivity | Autor nebo Admin |
| DELETE | `/activities/delete/{id}` | Smazání aktivity | Autor nebo Admin |

### Validace

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| POST | `/activities/{id}/validate` | Validace jedné aktivity | Přihlášený |
| POST | `/activities/validate-all` | Validace všech aktivit | Přihlášený |

Odpověď validace:
```json
{ "isDraft": true, "errors": ["Zadej název", "..."] }
```

Hromadná validace:
```json
{ "total": 120, "validCount": 95, "draftCount": 25 }
```

### Obrázky

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| POST | `/activities/{id}/images` | Přidání obrázku | Přihlášený |
| PUT | `/activities/{id}/images/{imageId}` | Úprava obrázku | Přihlášený |
| DELETE | `/activities/{id}/images/{imageId}` | Smazání obrázku | Přihlášený |
| POST | `/activities/{id}/images/{imageId}/thumbnail` | Nastavení náhledu | Přihlášený |

### PDF

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| GET | `/activities/{id}/pdf` | Stažení PDF aktivity | Přihlášený |

Query parametry:
- `includeActivityDescriptions` (bool, výchozí true)
- `includeImages` (bool, výchozí true)

---

## Filtrování a vyhledávání

### Textové vyhledávání
- `Text` - hledá v názvu NEBO popisu
- `Name` - hledá pouze v názvu
- `Description` - hledá pouze v popisu

### Číselné filtry
- `PersonsMin`, `PersonsMax`, `Persons` - počet hráčů
- `GoaliesMin`, `GoaliesMax`, `Goalies` - počet brankářů
- `DurationMin`, `DurationMax` - doba trvání
- `IntensityMin`, `IntensityMax`, `Intensity` - intenzita
- `DifficultyMin`, `DifficultyMax`, `Difficulty` - obtížnost
- `PlaceWidth`, `PlaceLength`, `PlaceArea` (+ min/max varianty) - rozměry hřiště

### Vztahové filtry
- `Tag` - ID štítků oddělené středníkem
- `Equipment` - ID vybavení oddělené středníkem
- `AgeGroup` - ID věkových skupin oddělené středníkem
- `AgeGroupsIds` - pole ID věkových skupin

### Stránkování a řazení
- `PageIndex` (výchozí 1), `PageSize` (výchozí 150, max 1000)
- `Sort`: `nameAsc`, `nameDesc`

---

## Frontend - stránka seznamu (ActivitiesPage)

### Zobrazení
- **Mřížka (grid)** - karty s náhledem, názvem, popisem, dobou trvání, počtem osob, autorem
- **Seznam (list)** - tabulkové zobrazení

### Karta aktivity zobrazuje
- Náhled obrázku (thumbnail)
- Název a zkrácený popis
- Doba trvání (min-max)
- Počet hráčů (min-max)
- Jméno autora
- Stav (žlutý = koncept, zelený = kompletní)
- Akční tlačítka: Detail, Editace (autor/admin), PDF

### Filtry na stránce
1. Textové vyhledávání (název, popis, autor)
2. Výběr štítků (multiselect)
3. Výběr věkových skupin (multiselect)
4. Filtr autora (dropdown)
5. Filtr stavu (vše / koncept / kompletní)
6. Řazení (název A→Z/Z→A, doba trvání)

### Panel výběru aktivit pro trénink
- Spodní přilepený panel pro multi-výběr aktivit
- Drag & drop karet do panelu nebo klik na +
- Zobrazuje vybrané aktivity s odznaky doby trvání
- Tlačítko "Použít v tréninku" → přechod na vytvoření tréninku

### Detail modal
- Kompletní info o aktivitě
- Stav, popis, všechny vlastnosti, štítky, věkové skupiny, obrázky
- Zobrazuje validační chyby pokud je koncept

### Admin funkce
- Tlačítko "Zkontrolovat vše" (validateAll) → modal s přehledem počtů

---

## Frontend - formulář (ActivityFormPage)

### Sekce formuláře

1. **Základní info**: Název (povinný), Popis (volitelný)
2. **Doba trvání a osoby**: DurationMin/Max, PersonsMin/Max
3. **Štítky** - toggle tlačítka pro výběr (zobrazeny všechny)
4. **Věkové skupiny** - toggle tlačítka (auto-doplní "Kdokoliv" pokud nic nevybráno)
5. **Vybavení** - toggle tlačítka + možnost přidat nové inline

### Funkce v režimu editace
- **Správa obrázků** - nahrání, kreslení, thumbnail, editace, mazání
- **Validace** - tlačítko s modalem zobrazujícím chyby nebo úspěch
- **PDF stažení** - s volbami (popisy, obrázky)
- **Stavový odznak** - žlutý (Koncept) / zelený (Kompletní)

### Kontrola oprávnění
- Pokud uživatel není autor ani Admin → přesměrování

---

## PDF generování (ActivityDocument)

### Struktura dokumentu (A4, okraje 8mm)

1. **Záhlaví** - název aktivity (modrý, tučný, 16pt) + QR kód
2. **Řádek 1** - 5 zaoblených boxů:
   - Věkové kategorie (ikona group.png)
   - Doba trvání (ikona sandglass.png)
   - Počet osob + brankáři (ikona peoplecom.svg)
   - Intenzita (ikona thermostat.png)
   - Obtížnost (ikona pulse.svg)
3. **Řádek 2** - 2 zaoblené boxy:
   - Štítky (ikona tags.png)
   - Vybavení (ikona equipment.png)
4. **Popis** (volitelný) - zaoblený box s ikonou task.png
5. **Obrázky** (volitelné) - všechny obrázky, šířka 16cm
6. **Zápatí** - URL webu + číslo stránky

### Zpracování obrázků pro PDF
Pořadí pokusů o načtení:
1. Soubor z disku (Path)
2. SVG obsah z Preview pole
3. Base64 z Preview pole
4. SVG obsah z Data pole
5. Base64 z Data pole

SVG se rasterizuje do PNG přes SkiaSharp, výsledek se kóduje jako JPEG (90%).

---

## Aktivita v kontextu tréninku

- Každá `TrainingGroup` může mít přiřazenou jednu aktivitu
- Vlastnosti aktivity (doba trvání, osoby) se zobrazují v tréninku
- Obrázky aktivity se zobrazují v PDF tréninku
- Na stránce aktivit lze vybrat více aktivit a přenést je do nového tréninku
- Aktivita slouží jako šablona - přiřazení do tréninku je reference, ne kopie
