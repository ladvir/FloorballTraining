# Přehled rolí a oprávnění

## Systém rolí v aplikaci

Aplikace má **dva nezávislé systémy rolí**, které se kombinují do jedné **efektivní role**:

### 1. Identity role (systémová, v ASP.NET Identity)
| Role | Hodnota |
|------|---------|
| **Admin** | Plný přístup ke správě systému |
| **User** | Základní přístup |

### 2. Klubové role (na entitě Member)
| Vlastnost | Význam |
|-----------|--------|
| `HasClubRoleMainCoach` | Hlavní trenér klubu |
| `HasClubRoleCoach` | Trenér klubu |
| `HasClubRoleManager` | Manažer klubu (zatím nepoužito v logice) |
| `HasClubRoleSecretary` | Sekretář klubu (zatím nepoužito v logice) |

### 3. Výpočet efektivní role (ClubRoleService)
| Podmínka | Efektivní role | Úroveň |
|----------|---------------|--------|
| Identity role = Admin | **Admin** | 3 |
| Member.HasClubRoleMainCoach = true | **HeadCoach** | 2 |
| Member.HasClubRoleCoach = true | **Coach** | 1 |
| Ostatní | **User** | 0 |

---

## Matice oprávnění podle funkcionality

### Autentizace a profil

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Registrace (bez přihlášení) | volně | volně | volně | volně |
| Přihlášení (bez přihlášení) | volně | volně | volně | volně |
| Zobrazení vlastního profilu | ano | ano | ano | ano |
| Úprava vlastního profilu | ano | ano | ano | ano |
| Úprava preferencí (výchozí klub/tým) | ano | ano | ano | ano |

### Správa uživatelů (/admin/users)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení seznamu uživatelů | ne | ne | ne | **ano** |
| Vytvoření uživatele | ne | ne | ne | **ano** |
| Zobrazení detailu uživatele | ne | ne | ne | **ano** |
| Změna Identity role uživatele | ne | ne | ne | **ano** |
| Přiřazení uživatele ke klubu | ne | ne | ne | **ano** |
| Smazání uživatele | ne | ne | ne | **ano** |

### Žádosti o role (/rolerequests)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení čekajících žádostí | ne | ne | **svůj klub** | **vše** |
| Schválení žádosti o Coach | ne | ne | **svůj klub** | **ano** |
| Schválení žádosti o HeadCoach | ne | ne | ne | **ano** |
| Zamítnutí žádosti | ne | ne | **svůj klub** | **ano** |

### Aktivity (/activities)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení seznamu aktivit | ano | ano | ano | ano |
| Zobrazení detailu aktivity | ano | ano | ano | ano |
| Vytvoření aktivity | ano | ano | ano | ano |
| Úprava aktivity | **vlastní** | **vlastní** | **vlastní** | **vše** |
| Smazání aktivity | **vlastní** | **vlastní** | **vlastní** | **vše** |
| Stažení PDF aktivity | ano | ano | ano | ano |
| Validace aktivity | ano | ano | ano | ano |
| Přidání/úprava/smazání obrázku | ano | ano | ano | ano |
| Nastavení náhledu (thumbnail) | ano | ano | ano | ano |

### Tréninky (/trainings)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení seznamu tréninků | ano | ano | ano | ano |
| Zobrazení detailu tréninku | ano | ano | ano | ano |
| Vytvoření tréninku | ne | **ano** | **ano** | **ano** |
| Úprava tréninku | ne | **vlastní** | **vlastní** | **vše** |
| Smazání tréninku | ne | **vlastní** | **vlastní** | **vše** |
| Stažení PDF tréninku | ano | ano | ano | ano |
| Přístup na formulář (/trainings/new, :id/edit) | ne | **ano** | **ano** | **ano** |

### Týmy (/teams)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení seznamu týmů | ano | ano | ano | ano |
| Zobrazení detailu týmu | ano | ano | ano | ano |
| Vytvoření týmu | ne | ne | **ano** | **ano** |
| Úprava týmu | ne | ne | **ano** | **ano** |
| Smazání týmu | ne | ne | **ano** | **ano** |
| Kopírování týmu do sezóny | ne | ne | **ano** | **ano** |
| Přidání člena do týmu | ne | ne | **ano** | **ano** |
| Odebrání člena z týmu | ne | ne | **ano** | **ano** |
| Import iCal kalendáře | ne | ne | **ano** | **ano** |
| Přístup na formulář (/teams/new, :id/edit) | ne | ne | **ano** | **ano** |

### Členové (/members)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení v navigaci | ne | ne | **ano** | **ano** |
| Zobrazení seznamu členů | ne | ne | **ano** | **ano** |
| Zobrazení detailu člena | ne | ne | **ano** | **ano** |
| Vytvoření člena | ne | ne | **ano** | **ano** |
| Úprava člena | ne | ne | **ano** | **ano** |
| Smazání člena | ne | ne | ne | **ano** |
| Import z Excelu | ne | ne | **ano** | **ano** |

### Události/Termíny (/appointments)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení týmových událostí | ano | ano | ano | ano |
| Zobrazení osobních událostí | **vlastní** | **vlastní** | **vlastní** | **vše** |
| Vytvoření týmové události | ne | **ano** | **ano** | **ano** |
| Vytvoření osobní události | ano | ano | ano | ano |
| Úprava události | **vlastní** | **vlastní** | **vlastní** | **vše** |
| Smazání události | **vlastní** | **vlastní** | **vlastní** | **vše** |
| Filtr statusu (viditelnost) | ne | ne | ne | **ano** |

### Kluby (/clubs)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Veřejný seznam klubů (registrace) | volně | volně | volně | volně |
| Zobrazení v navigaci | ne | ne | ne | **ano** |
| Zobrazení seznamu klubů | ne | ne | ne | **ano** |
| Zobrazení detailu klubu | ne | ne | ne | **ano** |
| Vytvoření klubu | ne | ne | ne | **ano** |
| Úprava klubu | ne | ne | ne | **ano** |
| Smazání klubu | ne | ne | ne | **ano** |

### Sezóny (/seasons)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení v navigaci | ne | ne | ne | **ano** |
| Zobrazení sezón (read) | ano | ano | ano | ano |
| Vytvoření sezóny | ne | ne | ne | **ano** |
| Úprava sezóny | ne | ne | ne | **ano** |
| Smazání sezóny | ne | ne | ne | **ano** |

### Místa, Vybavení, Štítky, Věkové skupiny

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení v navigaci | ne | ne | ne | **ano** |
| Zobrazení (read) | ano | ano | ano | ano |
| Vytvoření/Úprava/Smazání | ne | ne | ne | **ano** |

### Notifikace (/notifications)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení vlastních notifikací | ano | ano | ano | ano |
| Počet nepřečtených | ano | ano | ano | ano |
| Označení jako přečtené | ano | ano | ano | ano |

### Kreslení (/drawing)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Přístup ke kreslícímu nástroji | ano | ano | ano | ano |

### Dashboard (/)

| Funkcionalita | User | Coach | HeadCoach | Admin |
|---|:---:|:---:|:---:|:---:|
| Zobrazení dashboardu | ano | ano | ano | ano |
| Osobní události: viditelnost | **vlastní** | **vlastní** | **vlastní** | **vše** |

---

## Navigace (Sidebar) - viditelnost položek

| Položka menu | Min. role |
|---|---|
| Dashboard | User |
| Tréninky | User |
| Aktivity | User |
| Události | User |
| Týmy | User |
| Kreslení | User |
| Notifikace | User |
| **Členové** | **HeadCoach** |
| **Kluby** | **Admin** |
| **Vybavení** | **Admin** |
| **Místa** | **Admin** |
| **Sezóny** | **Admin** |
| **Štítky** | **Admin** |
| **Správa uživatelů** | **Admin** |

---

## Workflow žádosti o roli při registraci

1. Uživatel se registruje, vybere klub a volitelně požadovanou roli (Coach/HeadCoach)
2. Klub má nastaven `MaxRegistrationRole` - omezuje, jakou roli lze žádat
3. Vytvoří se `RoleRequest` se statusem `Pending`
4. Admin dostane notifikaci
5. Admin schvaluje jakoukoliv žádost; HeadCoach schvaluje pouze Coach žádosti ve svém klubu
6. Po schválení se nastaví `Member.HasClubRoleCoach` nebo `HasClubRoleMainCoach`

---

## Nepoužívané klubové role

Vlastnosti `HasClubRoleManager` a `HasClubRoleSecretary` na entitě Member existují, ale **nejsou aktuálně zapojeny** do výpočtu efektivní role ani do žádné autorizační logiky.
