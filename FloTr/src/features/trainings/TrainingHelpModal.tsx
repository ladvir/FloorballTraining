import { Modal } from '../../components/shared/Modal'

interface Props {
  open: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2 text-sm text-gray-700">{children}</div>
    </section>
  )
}

function Tag({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'sky' | 'violet' | 'amber' | 'emerald' | 'red' | 'green' }) {
  const palette = {
    gray: 'bg-gray-100 text-gray-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${palette[color]}`}>
      {children}
    </span>
  )
}

export function TrainingHelpModal({ open, onClose }: Props) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Nápověda — tréninky" maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          Trénink je posloupnost <strong>částí</strong> (např. rozcvička, hlavní část, hra), do kterých skládáš
          <strong> aktivity</strong> z knihovny. Cílem je pokrýt zvolené <strong>zaměření</strong> v zadané délce
          a věkové kategorii.
        </p>

        <Section title="Hlavička stránky">
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Šipka vlevo</strong> — návrat na seznam tréninků. Pokud máš neuložené změny, zeptáme se.</li>
            <li><Tag color="sky">Naplánovat</Tag> — přidá trénink do kalendáře jako událost (vybereš datum, čas, místo).</li>
            <li><Tag color="sky">PDF</Tag> — stáhne trénink jako PDF s volbou rozsahu (popis částí, obrázky aktivit…).</li>
            <li><Tag color="sky">Kopírovat</Tag> — vytvoří duplikát aktuálního tréninku, kterého pak můžeš upravit jako základ pro další.</li>
            <li>
              Stavový štítek <Tag color="green">Kompletní</Tag> nebo <Tag color="amber">Rozpracovaný</Tag> —
              klikem spustíš validaci. Otevře se okno se seznamem chybějících údajů.
            </li>
            <li><Tag>Nápověda</Tag> otevře toto okno.</li>
          </ul>
        </Section>

        <Section title="1. Základní údaje">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Název tréninku</strong> (povinný) — krátký a výstižný (např. „Vedení míčku — mladší žáci").
              Tlačítkem <Tag>Navrhnout název</Tag> vygenerujeme návrh ze zaměření a věkové kategorie.
            </li>
            <li>
              <strong>Celková délka (min)</strong> — kolik minut trénink reálně trvá. Je referenční hodnota,
              ke které se počítá pokrytí částí a zaměření.
            </li>
            <li className="text-xs text-gray-500">
              Věková kategorie, počet hráčů a prostředí se <em>automaticky odvodí</em> z aktivit zařazených
              do částí tréninku — tady je nezadáváš.
            </li>
          </ul>
        </Section>

        <Section title="2. Zaměření (max 3 štítky)">
          <p>
            Vybíráš až tři <em>cílové štítky</em> (např. <em>nahrávka</em>, <em>střelba</em>, <em>obrana</em>),
            kterým se má trénink věnovat. Vybrané štítky se zobrazují modře.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Procenta u štítku</strong> — kolik minut z aktivit má daný štítek (čím je % větší, tím
              víc se mu trénink reálně věnuje). Štítek s nejvyšším podílem je obtažen jako <em>dominantní</em>.
            </li>
            <li>
              <Tag color="sky">Automaticky dle aktivit</Tag> — zaškrtni, ať se zaměření aktualizuje samo podle
              přidaných aktivit. Užitečné, když ještě nevíš, jaké zaměření chceš.
            </li>
            <li>
              <Tag color="sky">Navrhnout</Tag> (čarodějná hůlka) — manuálně doplníme top 3 štítky podle aktivit.
              Návrhy se zobrazí přerušovanou čarou — klikem je potvrdíš.
            </li>
          </ul>
        </Section>

        <Section title="3. Části tréninku">
          <p>
            Trénink je rozdělený na <strong>části</strong>, každá má svůj název, délku a obsahuje jednu nebo více
            aktivit. Standardně má trénink 3 části: rozcvička / hlavní část / závěr — ale není to povinné.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li><Tag color="sky">Přidat část</Tag> přidá novou prázdnou část na konec.</li>
            <li>
              <strong>Drag handle</strong> (⋮⋮) na začátku části umožňuje přetáhnout část výše/níže — pořadí
              určuje průběh tréninku.
            </li>
            <li>
              U každé části vyplň:
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li><strong>Název</strong> (např. „Rozcvička", „Hra na branky").</li>
                <li><strong>Délka v min</strong> — součet všech částí by měl odpovídat celkové délce.</li>
                <li><strong>Aktivita</strong> — vyber ze seznamu (s vyhledáváním), nebo nech „— Bez aktivity —".</li>
              </ul>
            </li>
            <li>
              U vybrané aktivity najdeš ikony:
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li><strong>Oko</strong> — náhled detailu aktivity v modalu.</li>
                <li><strong>Tužka</strong> — rychlá úprava aktivity (otevře editor v okně, beze změny stránky tréninku).</li>
                <li><strong>SquarePen</strong> — přebere název aktivity jako název části.</li>
              </ul>
            </li>
            <li>
              <strong>Nakreslit aktivitu</strong> (ikona kreslení) — otevře full-screen editor, kde nakreslíš
              schéma. Pak ji pojmenuješ a uloží se jako nová aktivita rovnou do části.
            </li>
            <li><Tag>×</Tag> u části ji smaže (po potvrzení).</li>
          </ul>
        </Section>

        <Section title="Panel Vybrané aktivity">
          <p>
            Pokud sis označil aktivity v knihovně tlačítkem „Vyber pro trénink", zobrazí se nahoře nad částmi
            jako <strong>panel pro přetažení</strong>. Aktivity z něj přetáhni přímo na konkrétní část tréninku
            — automaticky se k ní přiřadí.
          </p>
        </Section>

        <Section title="Pokrytí zaměřením (progress bar)">
          <p>
            Když máš zvoleno zaměření a aktivity v částech, zobrazí se nad seznamem částí pruh, kolik minut
            (a procent) z tréninku je pokryto aktivitami se štítky zaměření.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Tenká svislá čára na pruhu označuje <strong>minimální pokrytí 25 %</strong>.</li>
            <li><Tag color="green">Zelená</Tag> = pokrytí splněno, <Tag color="amber">oranžová</Tag> = pod minimum.</li>
            <li>
              Pod pruhem se případně objeví <strong>varování o součtu částí</strong> — pokud části dohromady
              přesahují celkovou délku, nebo naopak nepokrývají alespoň minimum (% z celkové délky).
            </li>
          </ul>
        </Section>

        <Section title="Zobrazení obrázků v částech">
          <ul className="ml-4 list-disc space-y-1">
            <li><Tag color="sky">Zobraz obrázky</Tag> / <Tag>Skryj obrázky</Tag> — přepíná zobrazení miniatur aktivit u jednotlivých částí.</li>
            <li>
              <Tag>Zobraz vše</Tag> / <Tag>Zobraz výchozí</Tag> — když jsou obrázky vidět, přepneš mezi
              jen-náhledovou (hvězdičkou označenou) a všemi přidruženými obrázky aktivity.
            </li>
          </ul>
        </Section>

        <Section title="Validace — Kompletní vs. Rozpracovaný">
          <p>
            Klikem na stavový štítek v hlavičce spustíš validaci. Trénink je <Tag color="green">Kompletní</Tag>,
            když splňuje všechny podmínky:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-gray-600">
            <li>vyplněný název a celková délka</li>
            <li>alespoň jedno zaměření</li>
            <li>alespoň jedna část s aktivitou</li>
            <li>součet částí v rozumném rozsahu vůči celkové délce (min 50 %, max 100 %)</li>
            <li>pokrytí zaměřením alespoň 25 % z celkové délky</li>
          </ul>
        </Section>

        <Section title="Detekce duplicit">
          <p>
            Při vyplňování tréninku průběžně kontrolujeme, zda už <strong>podobný trénink neexistuje</strong>
            (podle aktivit a zaměření). Pokud ano, ukáže se nahoře banner se seznamem nejvíc podobných tréninků.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Klikem na položku v banneru otevřeš srovnání obou tréninků vedle sebe (TrainingCompareModal).</li>
            <li>Banner se dá zavřít — pak ti při příští změně už neporadí, dokud sám neuložíš.</li>
            <li>Při <strong>uložení velmi podobného tréninku</strong> se zeptáme, jestli to opravdu chceš (nebo upravit existující).</li>
          </ul>
        </Section>

        <Section title="Sdílení a oprávnění">
          <ul className="ml-4 list-disc space-y-1">
            <li>Trénink může <strong>upravovat</strong> jeho autor a admin. Ostatní si ho mohou zobrazit a použít.</li>
            <li><Tag color="sky">Kopírovat</Tag> umožní každému trenérovi udělat si vlastní variantu existujícího tréninku.</li>
            <li>Naplánovaný trénink (událost v kalendáři) je viditelný hráčům daného týmu.</li>
          </ul>
        </Section>

        <Section title="Tipy">
          <ul className="ml-4 list-disc space-y-1">
            <li>Začni nastavením délky a zaměření, pak přidávej části a aktivity — barevný progress bar ti řekne, kdy máš dost.</li>
            <li>Když vybereš aktivity v knihovně, otevři trénink a panel <em>Vybrané aktivity</em> ti je nabídne k přetažení do částí.</li>
            <li>Tlačítko <Tag>Navrhnout název</Tag> je rychlý start — vždy si ho můžeš ručně upravit.</li>
            <li>Při tvorbě více podobných tréninků (turnusů) použij <Tag color="sky">Kopírovat</Tag> a uprav jen drobnosti.</li>
            <li>Pokud chybí aktivita pro konkrétní moment, klikni <strong>Nakreslit aktivitu</strong> a vytvoř ji rovnou v části.</li>
            <li>Změny se ukládají až po klikutí na <Tag color="sky">Uložit trénink</Tag>. Při zavření stránky tě upozorníme.</li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
