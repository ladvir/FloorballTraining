# Tréninky - kompletní dokumentace

## Přehled

Trénink je hlavní entita aplikace. Skládá se z částí (TrainingPart), které obsahují skupiny (TrainingGroup), do kterých se přiřazují aktivity. Tréninky lze plánovat do kalendáře, generovat PDF a odesílat e-mailem.

---

## Datový model

### Trénink (Training)

| Vlastnost | Typ | Výchozí | Popis |
|-----------|-----|---------|-------|
| `Name` | string | povinný | Název tréninku (max 50 znaků) |
| `Description` | string | volitelný | Popis tréninku (max 1000 znaků) |
| `Duration` | int | 1 | Celková doba trvání (minuty, max 120) |
| `PersonsMin` | int | 1 | Minimální počet hráčů (max 50) |
| `PersonsMax` | int | 0 | Maximální počet hráčů (max 50) |
| `GoaliesMin` | int | 0 | Minimální počet brankářů |
| `GoaliesMax` | int | 0 | Maximální počet brankářů |
| `Intensity` | int | 0 | Intenzita (0=Nízká, 1=Střední, 2=Vysoká) |
| `Difficulty` | int | 0 | Obtížnost (0=Nízká, 1=Střední, 2=Vysoká) |
| `Environment` | enum | Anywhere | Prostředí (Anywhere=Kdekoliv, Indoor=Hala, Outdoor=Venku) |
| `CommentBefore` | string | volitelný | Komentář před zahájením tréninku |
| `CommentAfter` | string | volitelný | Komentář po ukončení tréninku |
| `IsDraft` | bool | true | Stav tréninku (koncept/kompletní) |
| `CreatedByUserId` | string | auto | ID uživatele, který trénink vytvořil |
| `TrainingGoal1Id` | int? | null | První cíl tréninku (vazba na Tag) |
| `TrainingGoal2Id` | int? | null | Druhý cíl tréninku |
| `TrainingGoal3Id` | int? | null | Třetí cíl tréninku |

### Vazby

| Vazba | Popis |
|-------|-------|
| `TrainingGoal1/2/3` | Až 3 cíle tréninku (entity Tag) |
| `TrainingAgeGroups` | Věkové skupiny cílené tréninkem |
| `TrainingParts` | Části tréninku (seřazeny podle Order) |
| `Appointments` | Naplánované události v kalendáři |

---

### Část tréninku (TrainingPart)

| Vlastnost | Typ | Výchozí | Popis |
|-----------|-----|---------|-------|
| `Name` | string | volitelný | Název části (max 50 znaků, např. "Rozcvička") |
| `Description` | string | volitelný | Popis části (max 1000 znaků) |
| `Order` | int | - | Pořadí v tréninku |
| `Duration` | int | - | Doba trvání části (minuty, max 40) |
| `TrainingGroups` | kolekce | - | Skupiny v rámci části |

---

### Skupina (TrainingGroup)

| Vlastnost | Typ | Výchozí | Popis |
|-----------|-----|---------|-------|
| `PersonsMin` | int | 1 | Min. počet hráčů ve skupině |
| `PersonsMax` | int | 30 | Max. počet hráčů ve skupině |
| `Activity` | Activity? | null | Přiřazená aktivita (volitelné) |
| `ActivityId` | int? | null | FK na aktivitu |

Skupiny umožňují rozdělit hráče v rámci jedné části do více paralelních aktivit (např. skupina A dělá jedno cvičení, skupina B jiné).

---

## Hierarchie

```
Trénink
├── Cíle tréninku (1-3 štítky)
├── Věkové skupiny
├── Část 1 (Rozcvička, 15 min)
│   ├── Skupina A → Aktivita "Rozběhání"
│   └── Skupina B → Aktivita "Strečink"
├── Část 2 (Hlavní, 30 min)
│   └── Skupina A → Aktivita "Přihrávky"
├── Část 3 (Hra, 20 min)
│   └── Skupina A → Aktivita "Zápas 5v5"
└── Část 4 (Závěr, 10 min)
    └── Skupina A → (prázdná)
```

---

## Stav tréninku (Draft systém)

### Životní cyklus

1. **Vytvoření** - `IsDraft = true` (vždy začíná jako koncept)
2. **Editace** - po uložení se automaticky validuje, `IsDraft` se nastaví podle výsledku
3. **Validace** - ruční spuštění přes tlačítko nebo automaticky při uložení
4. **Zobrazení** - žlutý = koncept, zelený = kompletní

### Validační pravidla (TrainingValidator)

#### Konfigurovatelné limity (výchozí hodnoty)

| Limit | Výchozí | Popis |
|-------|---------|-------|
| Max. doba trvání | 120 min | Celková délka tréninku |
| Max. délka názvu | 50 znaků | |
| Max. délka popisu | 1000 znaků | |
| Max. počet osob | 50 | |
| Max. délka části | 40 min | |
| Min. pokrytí cílem | 25% | Aktivity s cílovým štítkem musí pokrýt ≥25% doby |
| Min. pokrytí částmi | 95% | Součet částí musí pokrýt ≥95% celkové doby |

#### Pravidla

| Pole / Pravidlo | Popis |
|-----------------|-------|
| Name | Nesmí být prázdný, max 50 znaků |
| Description | Max 1000 znaků |
| Environment | Musí být validní enum |
| PersonsMin | 1-50, musí být ≤ PersonsMax |
| PersonsMax | 1-50 |
| Duration | 1-120 minut |
| GoaliesMin/Max | ≤ PersonsMax, Min ≤ Max |
| Cíle | Alespoň 1 cíl tréninku je povinný |
| Části | Alespoň 1 část tréninku je povinná |
| Pokrytí cílem | Pokud cíl1 existuje, aktivity s odpovídajícím štítkem musí pokrýt ≥25% doby |
| Součet částí | Součet dob částí ≤ celková doba tréninku |
| Min. pokrytí | Součet dob částí ≥ 95% celkové doby |
| Části | Každá část validována zvlášť (TrainingPartValidator) |

#### Validace části (TrainingPartValidator)

| Pravidlo | Popis |
|----------|-------|
| Name | Nesmí být prázdný, max 50 znaků |
| Description | Max 1000 znaků |
| Duration | 1 - min(délka_části, 40) minut |
| Součet osob skupin | ≤ PersonsMax tréninku |

---

## API endpointy

### Čtení

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| GET | `/trainings` | Seznam s filtrováním a stránkováním | Přihlášený |
| GET | `/trainings/all` | Všechny tréninky | Přihlášený |
| GET | `/trainings/{id}` | Detail tréninku | Přihlášený |

### Zápis

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| POST | `/trainings` | Vytvoření tréninku | Coach+ (ne User) |
| PUT | `/trainings/{id}` | Úprava tréninku | HeadCoach+ |
| DELETE | `/trainings/{id}` | Smazání tréninku | HeadCoach+ |

Poznámka: Při vytvoření se automaticky nastaví `IsDraft = true` a `CreatedByUserId`.

### Validace

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| POST | `/trainings/{id}/validate` | Validace jednoho tréninku | Přihlášený |
| POST | `/trainings/validate-all` | Validace všech tréninků | Přihlášený |

Query parametr `minPartsDurationPercent` (volitelný) přepíše výchozí 95%.

Odpověď validace:
```json
{ "isDraft": false, "errors": [] }
```

Hromadná validace:
```json
{ "total": 50, "validCount": 42, "draftCount": 8 }
```

### PDF

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| GET | `/trainings/{id}/pdf` | Stažení PDF tréninku | Přihlášený |

Query parametry (všechny bool, výchozí true):

| Parametr | Popis |
|----------|-------|
| `includeTrainingParameters` | Věkové kategorie, doba trvání, intenzita, obtížnost |
| `includeTrainingDetails` | Cíle, vybavení, prostředí |
| `includeTrainingDescription` | Popis tréninku |
| `includeComments` | Komentáře před/po tréninku |
| `includePartDescriptions` | Popisy částí |
| `includeActivityDescriptions` | Popisy aktivit |
| `includeImages` | Obrázky aktivit |

---

## Filtrování a vyhledávání

### Textové
- `Text` - hledá v názvu NEBO popisu
- `Name` - hledá pouze v názvu
- `Description` - hledá pouze v popisu

### Číselné
- `Duration`, `DurationMin`, `DurationMax` - doba trvání
- `Persons`, `PersonsMin`, `PersonsMax` - počet hráčů
- `Goalies`, `GoaliesMin`, `GoaliesMax` - počet brankářů
- `Intensity`, `IntensityMin`, `IntensityMax` - intenzita
- `Difficulty`, `DifficultyMin`, `DifficultyMax` - obtížnost

### Vztahové
- `Environment` - Anywhere / Indoor / Outdoor
- `TrainingGoalId` - ID jednoho cíle
- `TrainingGoalIds` - více ID cílů (logika OR)
- `EquipmentsIds` - ID vybavení
- `AgeGroupsIds` - ID věkových skupin

### Stránkování a řazení
- `PageIndex` (výchozí 1), `PageSize` (výchozí 60, max 50)
- `Sort`: `nameAsc`, `nameDesc`

---

## Frontend - stránka seznamu (TrainingsPage)

### Zobrazení
- **Mřížka (grid)** - karty s přehledem
- **Seznam (list)** - tabulkové zobrazení

### Karta tréninku zobrazuje
- Název a zkrácený popis
- Doba trvání, počet hráčů
- Intenzita, obtížnost
- Cíle tréninku
- Věkové skupiny
- Autor
- Stav (koncept/kompletní)

### Filtry na stránce
1. Textové vyhledávání (název, popis)
2. Rozsah doby trvání
3. Rozsah počtu hráčů
4. Intenzita / obtížnost
5. Věkové skupiny
6. Cíle tréninku
7. Vybavení

### Akce na kartě
- **Detail** - modal s kompletním přehledem (části, skupiny, aktivity, obrázky)
- **Editace** - přechod na formulář (autor/admin)
- **PDF** - stažení s volbami
- **Plánování** - otevře ScheduleTrainingModal
- **Validace** - zobrazí výsledek a chyby
- **Smazání** - s potvrzením

---

## Frontend - formulář (TrainingFormPage)

### Sekce formuláře

1. **Základní info**: Název, Popis, Doba trvání
2. **Hráči**: PersonsMin/Max, GoaliesMin/Max
3. **Parametry**: Intenzita, Obtížnost, Prostředí
4. **Cíle**: Výběr 1-3 cílů (štítky s příznakem isTrainingGoal)
5. **Věkové skupiny**: Multi-select
6. **Komentáře**: Před tréninkem, Po tréninku

### Správa částí tréninku
- **Přidání části** - tlačítko přidá novou část s jednou prázdnou skupinou
- **Odebrání části** - smazání s potvrzením
- **Přeřazení** - drag & drop pro změnu pořadí
- **Editace** - název, popis, doba trvání

### Správa skupin v části
- **Přidání skupiny** - rozdělení části na paralelní skupiny
- **Odebrání skupiny** - smazání skupiny
- **Výběr aktivity** - ActivityPicker:
  - Vyhledávání v existujících aktivitách
  - Rychlé vytvoření nové aktivity
  - Nakreslení nové aktivity (otevře DrawingComponent)
- **Auto-doplnění** - název části se automaticky doplní z názvu vybrané aktivity

### Funkce v režimu editace
- **Validace** - tlačítko s modalem zobrazujícím chyby
- **Plánování** - otevře ScheduleTrainingModal
- **PDF stažení** - s volbami
- **Stavový odznak** - koncept/kompletní

### Workflow vytvoření aktivity kreslením
1. V tréninkovém formuláři klikne na "Nakreslit aktivitu"
2. Otevře se fullscreen DrawingComponent
3. Po uložení kresby se vyzve k zadání názvu aktivity
4. Automaticky se vytvoří aktivita s kresbou jako obrázkem
5. Aktivita se přiřadí do vybrané skupiny

---

## Plánování tréninku (ScheduleTrainingModal)

### Záložka "Nová událost"
- Výběr data a času (začátek, konec se auto-doplní z doby tréninku)
- Výběr týmu (povinný)
- Výběr místa (volitelný)
- Opakování:
  - Frekvence: Jednorázově / Týdně / Měsíčně
  - Interval: 1-52 (např. každé 2 týdny)
  - Opakovat do: koncové datum

### Záložka "Existující událost"
- Seznam existujících událostí
- Výběr události pro přiřazení tréninku
- Upozornění pokud událost již má jiný trénink
- Vyžaduje potvrzení přepsání

---

## PDF generování (TrainingDocument)

### Struktura dokumentu (A4, okraje 8mm)

1. **Záhlaví** (zobrazí se jednou)
   - Název tréninku (zelený, tučný, 16pt)
   - QR kód odkazující na zdroj

2. **Parametry** (volitelné) - řádek 4 zaoblených boxů:
   - Věkové kategorie (ikona group.png)
   - Doba trvání (ikona sandglass.png)
   - Intenzita (ikona thermostat.png)
   - Obtížnost (ikona pulse.svg)

3. **Detaily** (volitelné) - řádek 3 zaoblených boxů:
   - Zaměření / cíle (ikona tags.png)
   - Vybavení (ikona equipment.png)
   - Prostředí (ikona location.png)

4. **Popis** (volitelný) - zaoblený box

5. **Komentář před zahájením** (volitelný)

6. **Části tréninku** - pro každou část:
   - Záhlaví: "{doba} min. - {název}" (modrý, tučný, 12pt)
   - Popis části (volitelný)
   - Skupiny (označeny "Skupina 1", "Skupina 2"... pokud jich je více):
     - Název aktivity (tučný)
     - Popis aktivity (volitelný)
     - Obrázky aktivity (volitelné, max šířka 16cm)

7. **Komentář po ukončení** (volitelný)

8. **Zápatí** - URL webu + číslo stránky

### Přednačítání obrázků
- Obrázky se načtou do cache před renderováním PDF
- Pořadí pokusů: soubor z disku → SVG z Preview → base64 z Preview → SVG z Data → base64 z Data
- SVG se rasterizuje do PNG přes SkiaSharp
- Výsledek se kóduje jako JPEG (90%)

---

## Use Cases (doménová logika)

| Use Case | Popis |
|----------|-------|
| `AddTrainingUseCase` | Vytvoření tréninku (vždy IsDraft=true, bez validace) |
| `EditTrainingUseCase` | Úprava tréninku (s automatickou validací, nastaví IsDraft) |
| `DeleteTrainingUseCase` | Smazání tréninku |
| `ViewTrainingByIdUseCase` | Načtení tréninku podle ID s plnými includes |
| `ViewTrainingsUseCase` | Seznam s filtrováním a stránkováním |
| `ViewTrainingsAllUseCase` | Všechny tréninky |
| `ValidateTrainingUseCase` | Validace + update IsDraft v DB |
| `ValidateAllTrainingsUseCase` | Hromadná validace, vrací statistiku |
| `CloneTrainingUseCase` | Klonování tréninku (hluboká kopie) |
| `CreateTrainingPdfUseCase` | Generování PDF |
| `SendTrainingViaEmailUseCase` | Odeslání PDF tréninků e-mailem |

---

## E-mail (SendTrainingViaEmailUseCase)

- Vstup: seznam ID tréninků + seznam e-mailových adres příjemců
- Pro každý trénink vygeneruje PDF
- Vytvoří e-mail s PDF jako přílohou
- Odešle přes IEmailSender

---

## Vazba na události (Appointments)

| Vlastnost události | Popis |
|--------------------|-------|
| `TrainingId` | FK na trénink (volitelný) |
| `Training` | Navigační vlastnost |
| `Start`, `End` | Kdy se trénink koná |
| `TeamId`, `Team` | Pro který tým |
| `LocationId`, `Location` | Kde (místo) |
| `OwnerUserId` | Kdo událost vytvořil |
| `RepeatingPattern` | Opakování (frekvence, interval, do kdy) |

---

## Intenzita a obtížnost

### Stupnice (společná pro oba)

| Hodnota | Český popis |
|---------|-------------|
| 0 | Nízká |
| 1 | Střední |
| 2 | Vysoká |

### Prostředí (Environment)

| Hodnota | Český popis |
|---------|-------------|
| 0 | Kdekoliv |
| 1 | Uvnitř (Hala) |
| 2 | Venku |

---

## Klíčové poznámky

1. **Automatická validace při editaci** - při uložení přes PUT se trénink automaticky validuje a nastaví `IsDraft`
2. **Cíle tréninku** - maximálně 3, musí být štítky s příznakem `isTrainingGoal`
3. **Pokrytí částmi** - součet dob částí musí být ≥95% celkové doby (konfigurovatelné per tým)
4. **Pokrytí cílem** - aktivity odpovídající cíli musí pokrýt ≥25% doby
5. **Prázdné skupiny** - skupina nemusí mít přiřazenou aktivitu
6. **Auto-vytvoření skupiny** - při přidání nové části se automaticky vytvoří jedna skupina
7. **Věkové skupiny** - pokud nejsou zadány, zobrazí se "Libovolný věk"
8. **CreatedByUserName** - není uložen v DB, plní se dynamicky z UserManager
9. **GoaliesMin/Max v TrainingGroupDto** - existují v DTO ale ne v entitě (pouze pro UI)
10. **Min. pokrytí částmi** - konfigurovatelné per tým přes `GetMinPartsDurationPercentAsync()`
