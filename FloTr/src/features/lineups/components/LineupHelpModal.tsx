import { Modal } from '../../../components/shared/Modal'

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

function Tag({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'sky' | 'violet' | 'amber' | 'emerald' }) {
  const palette = {
    gray: 'bg-gray-100 text-gray-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${palette[color]}`}>
      {children}
    </span>
  )
}

export function LineupHelpModal({ open, onClose }: Props) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Nápověda — sestavy" maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          Sestava popisuje, kdo z týmu se účastní zápasu a v jakých formacích. Stránka se skládá ze tří
          panelů: <strong>Nastavení</strong>, <strong>Soupiska</strong> a <strong>Hřiště s formacemi</strong>.
        </p>

        <Section title="Hlavička stránky">
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Název sestavy</strong> — klikni do něj a přepiš (např. „Jarní turnaj — finále").</li>
            <li><Tag color="sky">Uložit</Tag> uloží aktuální stav na server. Bez uložení změny zůstávají jen v prohlížeči.</li>
            <li><Tag>Nápověda</Tag> otevře toto okno.</li>
          </ul>
        </Section>

        <Section title="1. Panel Nastavení (vlevo)">
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Tým</strong> — kontextová informace, k jakému týmu sestava patří. Mění se jen vytvořením nové sestavy.</li>
            <li><strong>Šablona</strong> — definuje počet pozic a jejich rozmístění na hřišti. Vestavěné šablony:
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li>5+1 standard (2-1-2), 5+1 ofenzivní (1-2-2), 4+1, 3+1</li>
                <li>5+0 přesilovka — přesila bez brankáře</li>
                <li>6+0 power play — stažený brankář, formace 2-2-2</li>
              </ul>
              <p className="mt-1 text-xs text-gray-500">
                Změnou šablony se přepíší pozice ve <em>všech</em> formacích a obsazení slotů se vyresetuje.
              </p>
            </li>
            <li><strong>Počet formací</strong> (1–5) — kolik pětek/lajn budeš střídat. Přidání zachovává existující obsazení; odebrání odstraní formace s nejvyšším pořadím.</li>
            <li><strong>Vázat na zápas</strong> — propojí sestavu s konkrétní událostí typu Zápas. Z detailu zápasu pak povede odkaz přímo sem.</li>
            <li>
              <strong>Sdílet s hráči</strong> — když je zaškrtnuto, hráči daného týmu uvidí sestavu v režimu <em>jen pro čtení</em>
              (bez možnosti úpravy).
            </li>
          </ul>
        </Section>

        <Section title="2. Panel Soupiska (uprostřed)">
          <p>
            Soupiska je seznam hráčů, kteří jsou pro tento zápas k dispozici. Z ní pak hráče taháš na hřiště.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Kádr týmu</strong> (spodní sekce) — automaticky načtení hráči z týmu. Klikni na řádek pro
              přidání jednoho hráče, nebo „Přidat všechny" pro hromadné zařazení.
            </li>
            <li><Tag color="sky">Z klubu</Tag> — modal pro přidání hráčů z jiných týmů stejného klubu (např. host z B-týmu).</li>
            <li><Tag color="sky">Hráč navíc</Tag> — ručně zadané jméno hosta nebo náhradníka, který nemá záznam v systému.</li>
            <li>
              U každého hráče v soupisce:
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li><strong>Drag handle</strong> (⋮⋮) — stiskni a táhni hráče přímo na slot na hřišti.</li>
                <li><strong>Barevné tečky</strong> vpravo — ukazují, ve kterých formacích už je hráč nasazen (podle barev formací).</li>
                <li><strong>Oko / přeškrtnuté oko</strong> — označí hráče jako (ne)dostupného. Nedostupný se ze
                  soupisky neodebere, jen je vyřazen z poolu a automaticky uvolněn ze všech formací.</li>
                <li><strong>×</strong> — úplně odebere hráče ze sestavy. Pokud je nasazen, zeptáme se na potvrzení.</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="3. Panel Hřiště a formace (vpravo)">
          <p>
            Hořejší pruh: <strong>barevné chipy formací</strong> (Formace 1–5). Klikem přepneš zobrazení na vybranou
            formaci. Vpravo nahoře přepínač pohledu:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <Tag color="emerald">Hřiště</Tag> — výchozí pohled. Velké hřiště s aktivní formací, dole lavička s
              náhradníky a vstup pro popis formace (např. „útočná").
            </li>
            <li>
              <Tag color="emerald">Hřiště vedle sebe</Tag> — všechna hřiště zmenšená vedle sebe pro rychlé porovnání.
              Drag-and-drop funguje napříč všemi miniaturami i na sdílenou lavičku dole.
            </li>
            <li>
              <Tag color="emerald">Po pozicích</Tag> — tabulka, řádky = formace, sloupce = pozice
              (LK · C · PK · LO · PO · B). Umožňuje rychlé porovnání obsazení stejné pozice mezi formacemi.
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            Pozice mají zkratky: <strong>B</strong> = brankář, <strong>1</strong> pravý obránce, <strong>2</strong> levý obránce, <strong>3</strong> centr,
            <strong> 4</strong> levé křídlo, <strong>5</strong> pravé křídlo.
          </p>
        </Section>

        <Section title="Drag & Drop">
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Z lavičky/soupisky → na slot</strong>: hráč obsadí pozici. Pokud byl už v jiné pozici této formace, automaticky se z ní uvolní.</li>
            <li><strong>Mezi sloty stejné formace</strong>: prohození hráčů (swap).</li>
            <li><strong>Mezi sloty různých formací</strong>: hráč se přesune; výchozí slot zůstane volný.</li>
            <li><strong>Slot → lavička</strong>: hráč se uvolní z formace, vrátí se do poolu náhradníků.</li>
            <li>Při přetahování je u kurzoru <strong>barevná pilulka</strong> s jménem hráče v barvě cílové formace, ať vidíš, co a kam dáváš.</li>
            <li>Drag funguje i klávesnicí (Tab → Space → šipky → Space).</li>
          </ul>
        </Section>

        <Section title="Barvy formací">
          <p>Barvy jsou pevně přiřazené podle pořadí formace: </p>
          <div className="flex flex-wrap gap-2">
            <Tag color="sky">Formace 1 modrá</Tag>
            <Tag color="emerald">Formace 2 zelená</Tag>
            <Tag color="amber">Formace 3 oranžová</Tag>
            <Tag color="violet">Formace 4 fialová</Tag>
            <span className="inline-flex items-center rounded bg-pink-100 px-1.5 py-0.5 text-[11px] font-semibold text-pink-700">Formace 5 růžová</span>
          </div>
          <p>
            Barva pomáhá rychle rozlišit formace v náhledech a najít hráče podle nasazení (tečky u jména v soupisce).
          </p>
        </Section>

        <Section title="Sdílení a oprávnění">
          <ul className="ml-4 list-disc space-y-1">
            <li>Sestavu může <strong>vytvářet a upravovat</strong> trenér týmu (Coach), hlavní trenér (HeadCoach), klubový administrátor a admin.</li>
            <li>
              Sestava je <strong>soukromá</strong>, dokud ji v Nastavení nezaškrtneš jako sdílenou. Pak ji uvidí všichni hráči daného týmu v režimu jen pro čtení (bez tlačítek a drag &amp; drop).
            </li>
            <li>Z detailu zápasu typu <strong>Zápas</strong> nebo <strong>Trénink</strong> jde sestava vytvořit jedním klikem; je automaticky propojena se zápasem.</li>
          </ul>
        </Section>

        <Section title="Omezení a tipy">
          <ul className="ml-4 list-disc space-y-1">
            <li>Maximálně <strong>5 formací</strong> v jedné sestavě.</li>
            <li>Stejný hráč může být nasazen ve <strong>více formacích</strong> najednou — typické pro střídání mezi pětkami.</li>
            <li>V jedné formaci může být hráč jen na <strong>jedné pozici</strong> (na hřišti je jen jednou).</li>
            <li>Pozice „Centr" v některých šablonách (např. 6+0) je <strong>dvakrát</strong> — to je záměr, jde o dvě různé pozice ve hře.</li>
            <li>Označení hráče jako <strong>nedostupný</strong> jej automaticky uvolní ze všech slotů — užitečné, když se před zápasem dozvíš o omluvě.</li>
            <li>Změny se neukládají automaticky. <strong>Nezapomeň kliknout Uložit</strong>, jinak po refreshi přijdeš o změny.</li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
