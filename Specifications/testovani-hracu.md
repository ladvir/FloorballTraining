# Specifikace roz���en� aplikace Flotr

**Modul: Testov�n� hr��� (Player Testing Module)**

**C�l:** P�idat plnohodnotn� syst�m testov�n� hr��� pln� srovnateln� s modulem **Test Collection** v XPS Network (Sideline Sports).
Sou��st� je p�edp�ipraven� sada test� podle ofici�ln� �Testov� sestavy kondi�n� p�ipravenosti �esk� florbal 2021�.

---

## 1. P�edpoklady a integrace s existuj�c�m Flotrem

- Flotr ji� obsahuje: datab�zi hr��� , spr�vu t�m�, pl�nov�n� tr�nink�
- Nov� modul bude **pln� integrov�n**:
  - Testy spustiteln� z profilu hr��e, tr�ninkov� jednotky, denn�ho formul��e nebo dashboardu t�mu.
- Technologie: stejn� jako zbytek Flotru (web + mobiln� app iOS/Android).
- Datab�ze: centr�ln� (PostgreSQL / Firebase / Supabase � podle st�vaj�c� architektury).
- Role:
  - **Tren�r / Admin** � spr�va test�
  - **Hr��** � zad�v�n� p�es app
  - **Rodi� / Asistent** � pouze �ten�

---

## 2. Struktura dat (Test Collection)

- **Glob�ln� knihovna test�** � jedna pro cel� klub/organizaci (sd�len�).
- Ka�d� test obsahuje:
  - ID, n�zev, popis, kategorie (kondice / technika / flexibilita / readiness / brank��i)
  - **Typ testu**
  - Jednotka (s, cm, kg, %, po�et�)
  - **Colour ranges** (zelen� / �lut� / �erven�) � konfigurovateln� podle v�ku a pohlav�
  - Historie verz� (zm�na definice nezni�� historick� data)
- V�sledek testu:
  - Hr�� + Datum/�as + Hodnota + Pozn�mka + Tren�r (kdo zadal) + Fotka/video (voliteln�)

---

## 3. Typy test�


| Typ testu      | Popis                                        | P��klady ve florbalu                       | Konfigurace                        |
| -------------- | -------------------------------------------- | -------------------------------------------- | ---------------------------------- |
| **Number**     | ��seln� hodnota (�as, vzd�lenost, kg�) | Sprint 20 m, skok z m�sta, 1RM              | Jednotka, colour ranges, min/max   |
| **Grade**      | V�b�r z dropdownu / �k�ly                | Flexibilita (zkr�cen� / OK / hyper)        | Mo�nosti + barvy                  |
| **Combined**   | Agregace v�ce test� (v�en� pr�m�r)     | Readiness sk�re, celkov� kondi�n� sk�re | V�hy, vzorce, radar chart         |
| **Calculated** | Automatick� v�po�et z jin�ch test�      | Relativn� 1RM, BMI                          | Vzorec (a+b, Math.pow, Math.log�) |

---

## 4. P�edp�ipraven� sada test� �Florbal 2021�

Po instalaci modulu bude k dispozici **importovateln� �ablona**:

### Z�kladn� �daje

- V�k, Dr�en� hole (L/P), T�lesn� v��ka (cm), T�lesn� kompozice (v�ha, % tuku)

### Flexibilita (Grade)

- Hlubok� p�edklon
- V-test (vnit�n� strana stehen)
- Prota�en� p�edn� strany stehna (kvadriceps)

### Kondi�n� testy (Number + Calculated)

- Sprint 20 m (�as v s)
- Skok z m�sta sno�mo (cm)
- Illinois agility bez hole (�as v s)
- Vznos na hrazd� (po�et opakov�n�)
- Hlubok� zadn� d�ep 1RM (kg) � Calculated: Relativn� 1RM
- Bench press 1RM (kg) � Calculated: Relativn� 1RM
- Yo-Yo Intermittent Recovery Test Level 1 (metr�)

### Technick� / skill testy

- Manipulace s m��kem (osmi�ky za 45 s)
- P�ihr�vka z pohybu (po�et p�esn�ch)
- St�elba z pohybu (p�esnost)
- Illinois agility s hol� a m��kem
- Brank��sk� testy (4 specifick�)

### Combined testy (hotov� �ablony)

- Kondi�n� sk�re
- Readiness + testy
- Celkov� hr��sk� sk�re

V�echny testy obsahuj� **p�ednastaven� colour ranges** podle ofici�ln�ch norem �esk�ho florbalu (v�k/pohlav�).

---

## 5. Workflow

1. **Spr�va knihovny** (Admin/Tren�r)

   - Vytvo�it / duplikovat / upravit test
   - Import �ablony �Florbal 2021� jedn�m klikem
2. **Sb�r dat**

   - Manu�ln� z profilu hr��e - hr�� i tren�r
   - Hromadn� import CSV/Excel
3. **Anal�za a v�stupy**

   - Profil hr��e � grafy, trendy, radar chart
   - Team Monitoring dashboard
   - Porovn�n� hr��� / t�m�

---

## 6. UI/UX kl��ov� obrazovky

- Test Collection � tabulka + filtry
- Add Test Result � rychl� zad�n�
- Player Profile � Tests � �asov� osa + grafy
- Team Monitoring � heatmapa + colour ranges

---

## 7. Technick� po�adavky

- P�ipraven� API pro budouc� integrace (GPS, wearables)
