# Události (Appointments) - kompletní dokumentace

## Přehled

Události slouží k plánování tréninků, zápasů, soustředění a dalších akcí do kalendáře. Mohou být týmové (viditelné všem) nebo osobní (viditelné pouze vlastníkovi a adminovi). Podporují opakování, import z iCal kalendáře a export výkazu práce.

---

## Datový model

### Událost (Appointment)

| Vlastnost | Typ | Popis |
|-----------|-----|-------|
| `Name` | string? | Název události |
| `Description` | string? | Popis události |
| `Start` | DateTime | Začátek události |
| `End` | DateTime | Konec události |
| `AppointmentType` | enum | Typ události (viz níže) |
| `LocationId` | int | FK na místo (povinný) |
| `Location` | Place? | Navigace na místo |
| `TeamId` | int? | FK na tým (null = osobní událost) |
| `Team` | Team? | Navigace na tým |
| `OwnerUserId` | string? | ID uživatele, který událost vytvořil |
| `TrainingId` | int? | FK na trénink (volitelný) |
| `Training` | Training? | Navigace na trénink |
| `RepeatingPatternId` | int? | FK na vzor opakování |
| `RepeatingPattern` | RepeatingPattern? | Vzor opakování |
| `ParentAppointmentId` | int? | ID rodičovské události (pro opakované série) |
| `FutureAppointments` | List | Budoucí výskyty v sérii |
| `IsPast` | bool (computed) | true pokud Start < DateTime.UtcNow |

### Typ události (AppointmentType)

| Hodnota | Název | Český popis |
|---------|-------|-------------|
| 0 | Training | Trénink |
| 1 | Camp | Soustředění |
| 2 | Promotion | Pořádání |
| 3 | Match | Zápas |
| 4 | Other | Jiná |
| 5 | Course | Školení |
| 6 | EventOrganization | Pořádání akce |

---

## Opakování událostí

### Vzor opakování (RepeatingPattern)

| Vlastnost | Typ | Popis |
|-----------|-----|-------|
| `RepeatingFrequency` | enum | Frekvence opakování |
| `Interval` | int | Počet period mezi výskyty (např. každé 2 týdny) |
| `StartDate` | DateTime | Začátek vzoru |
| `EndDate` | DateTime? | Konec vzoru (volitelný) |
| `InitialAppointmentId` | int | ID původní události |

### Frekvence opakování (RepeatingFrequency)

| Hodnota | Název | Český popis |
|---------|-------|-------------|
| 0 | Once | Jednorázově |
| 1 | Daily | Denně |
| 2 | Weekly | Týdně |
| 3 | Monthly | Měsíčně |
| 4 | Yearly | Ročně |

### Architektura opakovaných událostí

```
Původní událost (ParentAppointment)
├── RepeatingPattern (frekvence, interval, do kdy)
├── Budoucí výskyt 1 (ParentAppointmentId → původní)
├── Budoucí výskyt 2 (ParentAppointmentId → původní)
└── Budoucí výskyt N ...
```

- Při vytvoření opakované události se vygenerují všechny budoucí výskyty jako samostatné záznamy v DB
- Každý výskyt má `ParentAppointmentId` odkazující na původní událost
- Generování: `AppointmentService.GenerateFutureAppointments()` - iteruje od začátku po EndDate, přidává interval dle frekvence

### Editace opakované události

Při editaci opakované události se uživateli zobrazí volba:
- **"Pouze tento výskyt"** - aktualizuje jen vybraný záznam (`updateWholeChain=false`)
- **"Tento a všechny budoucí"** - aktualizuje rodičovskou událost a přegeneruje budoucí (`updateWholeChain=true`)

### Smazání opakované události

Při smazání opakované události se zobrazí volba:
- **"Pouze tento výskyt"** - smaže jen vybraný záznam, budoucí zůstanou osiřelé (`alsoFutureAppointments=false`)
- **"Tento a všechny budoucí"** - smaže rodičovskou událost, všechny budoucí i RepeatingPattern (`alsoFutureAppointments=true`)

---

## Osobní vs. týmové události

| Vlastnost | Osobní událost | Týmová událost |
|-----------|---------------|----------------|
| `TeamId` | null | ID týmu |
| Viditelnost | Pouze vlastník + Admin | Všichni přihlášení |
| Vytvoření | Jakýkoliv přihlášený | Coach+ |
| Editace | Pouze vlastník nebo Admin | Coach+ |
| Smazání | Pouze vlastník nebo Admin | Coach+ |

---

## Validační pravidla (AppointmentValidator)

| Pole | Pravidlo | Chybová hláška |
|------|----------|----------------|
| Name | Nesmí být prázdný | "Zadej název události" |
| LocationId | Musí být > 0 | "Zadej místo" |
| Start/End | Start ≤ End | "Začátek události nemůže být později než její konec" |

---

## API endpointy

### Čtení

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| GET | `/appointments` | Seznam s filtrováním | Přihlášený (osobní filtr pro ne-adminy) |
| GET | `/appointments/{id}` | Detail události | Přihlášený (osobní pouze vlastník/admin) |

### Zápis

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| POST | `/appointments` | Vytvoření události | Osobní: přihlášený; Týmová: Coach+ |
| PUT | `/appointments` | Úprava události | Osobní: vlastník/admin; Týmová: Coach+ |
| DELETE | `/appointments` | Smazání události | Osobní: vlastník/admin; Týmová: Coach+ |

Query parametry pro PUT: `updateWholeChain` (bool)
Query parametry pro DELETE: `alsoFutureAppointments` (bool)

### Import / Export

| Metoda | Endpoint | Popis | Oprávnění |
|--------|----------|-------|-----------|
| POST | `/appointments/import-ical` | Import z iCal URL | Admin |
| GET | `/appointments/export` | Export výkazu práce (Excel) | Přihlášený (vlastní) / Admin (cizí) |
| DELETE | `/appointments/all` | Smazání všech událostí | Admin |

### Parametry export endpoint

| Parametr | Typ | Popis |
|----------|-----|-------|
| `year` | int | Rok |
| `month` | int | Měsíc |
| `userId` | string? | ID uživatele (jen admin může zadat cizí) |

---

## Filtrování a vyhledávání

### Parametry specifikace

| Parametr | Typ | Popis |
|----------|-----|-------|
| `PageIndex` | int (výchozí 1) | Stránka |
| `PageSize` | int (výchozí 50, max 500) | Počet na stránku |
| `Id` | int? | Konkrétní ID |
| `Name` | string? | Filtr podle názvu |
| `Start` | DateTime? | Od (inclusive) |
| `End` | DateTime? | Do (inclusive) |
| `TrainingId` | int? | Filtr podle tréninku |
| `Type` | AppointmentType? | Filtr podle typu |
| `PlaceId` | int? | Filtr podle místa |
| `PlaceName` | string? | Filtr podle názvu místa |
| `FutureOnly` | bool? | Pouze budoucí události |
| `Sort` | string | "startasc" (výchozí), "startdesc" |

---

## Frontend - stránka událostí (AppointmentsPage)

### Režimy zobrazení

#### Kalendář (výchozí)
- Měsíční pohled s navigací (předchozí/další měsíc)
- Max 3 události na den, zbytek "+N dalších"
- Události barevně odlišené podle typu
- Klik na den → vytvoření nové události
- Klik na událost → detail modal

#### Seznam
- Tabulkové zobrazení s řazením (datum, název, typ)
- Barevné odznaky typu
- Zobrazuje: čas, název, typ, místo, trénink, tým
- Vizuální indikátor pro opakované události
- Přepínač "Zobrazit minulé" (výchozí jen budoucí)

### Filtry
1. **Sezóna** - automaticky vybraná aktuální, lze změnit
2. **Tým** - filtr podle týmu, podpora osobních událostí
3. **Místo** - filtr podle lokace

### Admin funkce
- **Import iCal** - tlačítko otevře ICalImportModal
- **Smazat vše** - smaže všechny události (s potvrzením)

### Export
- **Výkaz práce** - tlačítko otevře ExportWorkTimeModal pro stažení Excelu

---

## Frontend - formulář události (AppointmentFormModal)

### Pole formuláře

| Pole | Typ | Povinné | Popis |
|------|-----|---------|-------|
| Název | text | ne | Název události |
| Popis | textarea | ne | Popis |
| Začátek | datetime-local | ano | Datum a čas začátku |
| Konec | datetime-local | ano | Datum a čas konce |
| Typ | dropdown | ano | Výběr z AppointmentType |
| Tým | dropdown | ne | Výběr týmu (null = osobní) |
| Místo | dropdown / text | ano | Výběr existujícího nebo vytvoření nového |
| Trénink | dropdown | ne | Viditelný jen pokud typ = Trénink |
| Opakování | sekce | ne | Frekvence, interval, do kdy |

### Vytvoření nového místa
- Přepínač "Zadat ručně" umožní vytvořit nové místo inline místo výběru existujícího

### Opakování
- Výběr frekvence (Jednorázově / Denně / Týdně / Měsíčně / Ročně)
- Pokud opakování: pole pro interval (1-52) a "Opakovat do" (datum)
- Náhledový text: "Každých N [dnů/týdnů/měsíců/let] do [datum]"

---

## Frontend - detail události (AppointmentDetailModal)

### Zobrazované informace
- Odznak typu události (barevně kódovaný)
- Datum a čas (plný formát s názvem dne)
- Místo (s ikonou mapového špendlíku)
- Info o opakování (frekvence, interval, koncové datum)
- Jméno vlastníka (u osobních událostí)
- Box s tréninkem (pokud je přiřazen):
  - Název tréninku
  - Cíle tréninku
  - Odkaz na detail tréninku
  - Odkaz na editaci tréninku (autor/admin)
- Popis (pokud vyplněn)

### Akce
- **Editovat** - otevře AppointmentFormModal
- **Smazat** - s potvrzením; u opakovaných zobrazí volbu (tento / tento a budoucí)

---

## Plánování tréninku (ScheduleTrainingModal)

Přístupný z formuláře/detailu tréninku. Slouží k vytvoření události přímo z tréninku.

### Záložka "Nová událost"

| Pole | Popis |
|------|-------|
| Tým | Povinný výběr |
| Místo | Volitelný výběr |
| Začátek | Povinný; konec se auto-doplní z doby tréninku |
| Opakování | Jednorázově / Týdně / Měsíčně |
| Interval | 1-52 |
| Opakovat do | Koncové datum pro opakování |

Automaticky nastaví `appointmentType = Training`, přiřadí trénink.

### Záložka "Existující událost"
- Dropdown budoucích událostí
- Zobrazuje tým a existující přiřazení tréninku
- Pokud událost již má jiný trénink → upozornění + checkbox "Přepsat"
- Po výběru přiřadí trénink k existující události

---

## Import z iCal (ICalImportService)

### Proces
1. Validace existence týmu a jeho iCal URL
2. Stažení iCal dat z URL (timeout 30s)
3. Parsování pomocí knihovny Ical.Net
4. Filtrování událostí od začátku aktuální sezóny (nebo dneška)
5. Pro každou událost:
   - Generování UID markeru `[ical:{uid}]` v popisu
   - Porovnání s existujícími událostmi (detekce duplikátů přes UID)
   - Duplikát → aktualizace existující události
   - Nová → vytvoření nové události
   - Automatické vytvoření místa pokud neexistuje
   - Automatické rozpoznání typu z názvu

### Rozpoznání typu podle názvu

| Klíčové slovo v názvu | Přiřazený typ |
|-----------------------|---------------|
| trénink, training | Training |
| zápas, match, utkání | Match |
| soustředění, camp, kemp | Camp |
| turnaj, tournament | Match |
| (ostatní) | Other |

### Výsledek importu
```json
{
  "imported": 15,
  "updated": 3,
  "skipped": 0,
  "errors": ["Chyba u události XY: ..."]
}
```

---

## Export výkazu práce (Excel)

### Přístup
- Všichni přihlášení mohou exportovat vlastní výkaz
- Admin může exportovat výkaz jakéhokoliv uživatele

### Modal (ExportWorkTimeModal)
1. Výběr sezóny (auto-vybraná aktuální)
2. Výběr měsíce v rámci sezóny
3. Výběr uživatele (jen admin, výchozí = aktuální)
4. Tlačítko stáhnout

### Struktura Excel souboru
- Jeden list na měsíc
- Záhlaví: název týmu, měsíc/rok, jméno trenéra
- Sloupce: Den, Pracoviště, Popis práce, Začátek, Konec, Hodiny, Hlavní organizátor, Organizátor
- Řádek na každý den s událostmi
- Souhrn:
  - Hodiny tréninků (součet dob pro typy Training + Match)
  - Zápasy mají fixní hodnotu 2,5 hodiny
  - Hodiny přípravy
  - Počet ostatních událostí
  - Hodiny pořádání akcí
  - Celkové hodiny za měsíc

### Název souboru
`vykaz-prace-{jméno-trenéra}-{rok}-{měsíc}.xlsx`

---

## Matice oprávnění

| Akce | Osobní | Týmová (User) | Týmová (Coach+) | Admin |
|------|--------|---------------|-----------------|-------|
| Zobrazení vlastních | ano | - | - | ano |
| Zobrazení cizích osobních | ne | - | - | ano |
| Zobrazení týmových | - | ano | ano | ano |
| Vytvoření osobní | ano | - | - | ano |
| Vytvoření týmové | - | ne | ano | ano |
| Editace vlastní | ano | - | - | ano |
| Editace cizí osobní | ne | - | - | ano |
| Editace týmové | - | ne | ano | ano |
| Smazání vlastní | ano | - | - | ano |
| Smazání cizí osobní | ne | - | - | ano |
| Smazání týmové | - | ne | ano | ano |
| Export vlastní | ano | ano | ano | ano |
| Export cizí | ne | ne | ne | ano |
| Import iCal | ne | ne | ne | ano |
| Smazání všeho | ne | ne | ne | ano |

---

## Vazba na dashboard

Dashboard zobrazuje nadcházející události uživatele jako widget/přehled. Obsahuje pole `appointments: AppointmentDto[]` s budoucími událostmi.
