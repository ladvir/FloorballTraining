# Testování a kvalita API (Sprint 3)

Tento dokument vysvětluje, co se ve Sprintu 3 řešilo, jak spouštět testy a jak si ověřit
pokrytí kódu testy. Je psaný tak, aby mu rozuměl i člověk, který do kódu denně nekouká.

---

## 1. Co se řešilo a proč (lidsky)

| Oblast | Problém | Co se udělalo |
|--------|---------|---------------|
| **Rychlost API (N+1)** | Při výpisu tréninků se jméno autora dotahovalo z databáze **zvlášť pro každý řádek**. 50 tréninků = 50 dotazů navíc. | Nahrazeno **jedním dotazem** pro všechna jména najednou. Stejná chyba se našla a opravila i u aktivit a událostí. |
| **Dokumentace API (Swagger)** | Nebyl žádný přehled, co API umí. Frontend i externí lidé museli hádat. | Přidán **Swagger** na adrese `/swagger` — interaktivní seznam všech 123 endpointů. Jde se přihlásit tlačítkem *Authorize* (JWT token) a rovnou volat chráněné endpointy. Dostupné mimo produkci. |
| **Rychlost číselníků (cache)** | Štítky, vybavení, věkové skupiny a místa se tahají z DB při každém načtení stránky, i když se skoro nemění. | Přidána **paměťová cache** (15 min, nastavitelné v `appsettings.json`). Při změně (přidání/úpravě/smazání) se cache automaticky zneplatní, takže uživatel nikdy nevidí stará data. |
| **Backend testy** | Neexistoval jediný test. Každá změna mohla nepozorovaně něco rozbít. | Vznikly **dva testovací projekty**: rychlé jednotkové testy logiky + integrační testy, které spustí **celé API proti dočasné databázi** a ověří přihlášení, oprávnění a CRUD. |
| **Frontend testy** | Aplikace FloTr neměla testy. | Přidán **Vitest** + React Testing Library — testuje přihlašovací logiku, formulářová pravidla, role uživatele a klíčové komponenty. |
| **Automatická kontrola (CI)** | Testy by nikdo nespouštěl ručně. | Přidán **GitHub workflow `ci.yml`**, který při každém pull requestu sám sestaví projekt a spustí všechny testy. Když test spadne, je to hned vidět. |

> Pozn.: End-to-end testy (Playwright, klikání v reálném prohlížeči) byly vyhodnoceny jako
> nejnáročnější a **přesunuty do Sprintu 4**.

---

## 2. Jak spouštět testy

### Backend (.NET)

```powershell
# Všechny testy (jednotkové i integrační) najednou:
dotnet test FloorballTraining.sln

# Jen rychlé jednotkové testy (logika, bez databáze):
dotnet test Tests/FloorballTraining.UseCases.Tests

# Jen integrační testy (spustí celé API proti dočasné SQLite databázi):
dotnet test Tests/FloorballTraining.API.IntegrationTests
```

Integrační testy **nepotřebují** běžící SQL Server ani lokální databázi — používají
dočasnou databázi v paměti, která se po doběhnutí zahodí. Můžeš je tedy spustit kdykoli.

### Frontend (FloTr)

```powershell
cd FloTr

npm test            # spustí testy jednou (stejné jako v CI)
npm run test:watch  # testy běží průběžně a reagují na úpravy
```

### Swagger (ruční vyzkoušení API)

1. Spusť API (`dotnet run` ve `FloorballTraining.API`, prostředí Development).
2. Otevři `https://localhost:<port>/swagger`.
3. Vlevo nahoře **Authorize** → vlož JWT token z `/Auth/login` → můžeš volat i chráněné endpointy.

---

## 3. Jak si ověřit pokrytí testy (coverage)

Pokrytí říká, **kolik procent kódu testy skutečně projely**.

### Frontend

```powershell
cd FloTr
npm run test:coverage
```

Vypíše tabulku v konzoli (sloupce `% Stmts`, `% Branch`, …) a vygeneruje i HTML report
ve složce `FloTr/coverage/` — otevři `FloTr/coverage/index.html` v prohlížeči pro klikací přehled.

### Backend

```powershell
# Pokrytí se sbírá při běhu testů:
dotnet test FloorballTraining.sln --collect:"XPlat Code Coverage" --results-directory TestResults
```

Vytvoří soubor `coverage.cobertura.xml` ve složce `TestResults`. Pro čitelný report
použij ReportGenerator a **vyluč auto-generované EF migrace** (jinak číslo klesne na ~2 %,
protože migrace mají desetitisíce řádků, které se nikdy netestují):

```powershell
dotnet tool install -g dotnet-reportgenerator-globaltool   # stačí jednou
reportgenerator -reports:TestResults/**/coverage.cobertura.xml -targetdir:TestResults/report `
  -reporttypes:"Html;TextSummary" -classfilters:"-FloorballTraining.Plugins.EFCoreSqlServer.Migrations.*"
# výsledek: TestResults/report/index.html  (+ Summary.txt)
```

### Aktuální stav (Sprint 3)

- **Backend:** 31 testů (20 jednotkových + 11 integračních) — zelené.
- **Frontend:** 30 testů, pokrytí **81,9 %** sledovaných složek (`store`, `hooks`, `utils`, auth schémata).

**Backend pokrytí** (bez migrací, řádky) je zatím nízké — Sprint 3 zakládal infrastrukturu a cílil
na **klíčovou logiku**, ne na plošné procento (to bylo v AC #10 vědomě opuštěno). Cílené třídy jsou
ale pokryté dobře:

| Co | Pokrytí |
|----|---------|
| Celkem backend (bez migrací) | 15,7 % řádků |
| `ReferenceCache` + `CacheSettings` (cache) | 100 % |
| `AddTrainingUseCase` | 100 % |
| `TrainingValidator` / `ClubValidator` / `TrainingPartValidator` / `MemberValidator` | 72–74 % |
| `AuthController` (přihlášení) | 31 % |
| `Plugins.EFCoreSqlServer` (repozitáře, přes integ. testy) | 37 % |

Nízká čísla u netestovaných controllerů (0 %) jsou očekávaná — pokrytí se bude zvyšovat v dalších
sprintech, jak budou přibývat testy k jednotlivým funkcím.

---

## 4. Co dělat při psaní nového kódu

- Novou logiku doprovázej testem (jednotkový pro čistou logiku, integrační pro endpoint).
- Před pushnutím spusť `dotnet test FloorballTraining.sln` a ve `FloTr` `npm test`.
- **U každé hotové práce se ověřuje pokrytí testy** (viz bod 3) — je to standardní součást „hotovo".
- CI (`ci.yml`) tyto kontroly spustí i automaticky při pull requestu.
