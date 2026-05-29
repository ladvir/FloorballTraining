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

function Tag({
  children,
  color = 'gray',
}: {
  children: React.ReactNode
  color?: 'gray' | 'sky' | 'violet' | 'amber' | 'emerald' | 'red' | 'green'
}) {
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
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${palette[color]}`}
    >
      {children}
    </span>
  )
}

export function AppointmentsHelpModal({ open, onClose }: Props) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Nápověda — události" maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          Stránka <strong>Události</strong> je společný kalendář klubu. Plánují se sem tréninky,
          zápasy, soustředění a další akce. Události lze filtrovat podle sezóny a týmu, prohlížet
          jako seznam nebo v měsíčním kalendáři, a u tréninků/zápasů svázat s konkrétním tréninkem
          nebo sestavou.
        </p>

        <Section title="Hlavička stránky">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Přepínač pohledu</strong> — <Tag color="sky">Seznam</Tag> (řádky se třídí
              podle data) nebo
              <Tag color="sky">Kalendář</Tag> (měsíční mřížka). Pohled se pamatuje mezi návštěvami.
            </li>
            <li>
              <Tag color="sky">Nová událost</Tag> — otevře formulář pro vytvoření nové události.
            </li>
            <li>
              <Tag color="sky">Výkaz</Tag> (jen Coach+) — export práce trenéra (CSV/Excel) za
              zvolené období, hodí se pro reporting nebo vyúčtování.
            </li>
            <li>
              <Tag color="sky">Import iCal</Tag> (jen Admin) — naimportuj události z externího
              kalendáře (např. pravidelné tréninkové bloky exportované z Google Kalendáře).
            </li>
            <li>
              <Tag color="red">Smazat vše</Tag> (jen Admin) — destruktivní akce, smaže{' '}
              <em>všechny</em> události odpovídající aktuálním filtrům. Po potvrzení.
            </li>
            <li>
              <Tag>Nápověda</Tag> otevře toto okno.
            </li>
          </ul>
        </Section>

        <Section title="Filtry — Sezóna a Tým">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Sezóna</strong> — omezí zobrazení na události spadající do dané sezóny (datum
              začátku v rozsahu). Volba <em>Všechny sezóny</em> ukáže všechno.
            </li>
            <li>
              <strong>Tým</strong> — omezí na události konkrétního týmu. Hodí se, když máš v klubu
              víc týmů a chceš vidět jen „svůj" rozvrh.
            </li>
            <li className="text-xs text-gray-500">
              Vybraný tým a sezóna se ukládají v prohlížeči — když se vrátíš, máš stejné filtry.
            </li>
          </ul>
        </Section>

        <Section title="Typy událostí (barevné štítky)">
          <p>
            Každá událost má jeden z přednastavených typů, který určuje barvu štítku v přehledu:
          </p>
          <div className="flex flex-wrap gap-2">
            <Tag color="sky">Trénink</Tag>
            <Tag color="emerald">Soustředění</Tag>
            <Tag color="amber">Propagace</Tag>
            <Tag color="red">Zápas</Tag>
            <Tag>Ostatní</Tag>
            <Tag color="sky">Školení</Tag>
            <Tag color="emerald">Pořádání akce</Tag>
          </div>
          <p className="text-xs text-gray-500">
            Typ <strong>Trénink</strong> umožní svázat událost s konkrétním <em>tréninkem</em> z
            knihovny. Typ <strong>Zápas</strong> umožní vytvořit nebo přiřadit <em>sestavu</em>.
          </p>
        </Section>

        <Section title="Pohled Seznam">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Řádky lze třídit podle <strong>data</strong>, <strong>názvu</strong> nebo{' '}
              <strong>typu</strong> (klikem na hlavičku sloupce). Šipka ukazuje směr.
            </li>
            <li>Klikem na řádek otevřeš detail události v modálním okně.</li>
            <li>
              U opakujících se událostí je vidět ikona <strong>(↻ Repeat)</strong> — klikem na
              detail uvidíš celou sérii.
            </li>
            <li>
              Minulé události jsou ztlumeně vykreslené, abys vizuálně rozeznal, co teprve přijde.
            </li>
          </ul>
        </Section>

        <Section title="Pohled Kalendář">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Měsíční mřížka. Šipky vlevo/vpravo přepínají měsíce, tlačítko <Tag>Dnes</Tag> tě vrátí
              na aktuální měsíc.
            </li>
            <li>
              Události zobrazené v buňce dne lze rozkliknout — otevře se detail v modálním okně.
            </li>
            <li>
              Klikem na prázdný den se otevře formulář pro novou událost s předvyplněným datem.
            </li>
            <li>
              Pokud má den víc událostí, než se vejde, ukáže se odkaz <em>+N další</em>.
            </li>
          </ul>
        </Section>

        <Section title="Detail události — co všechno tam najdeš">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Základní údaje</strong> — název, typ, datum a čas, místo, popis.
            </li>
            <li>
              <strong>Tým</strong> — k jakému týmu událost patří (volitelné).
            </li>
            <li>
              <strong>Provázaný trénink</strong> — u typu Trénink můžeš událost svázat s konkrétním
              tréninkem z knihovny. Hráči pak v detailu uvidí program.
            </li>
            <li>
              <strong>Sestava</strong> — u typu Zápas můžeš vytvořit/zobrazit sestavu pro tento
              zápas. Detail nabídne tlačítko <Tag color="sky">Sestava</Tag> nebo{' '}
              <Tag color="sky">Vytvořit sestavu</Tag>.
            </li>
            <li>
              <strong>Hodnocení</strong> — hráči mohou událost ohodnotit (hvězdičky, komentář). V
              detailu se zobrazuje průměr a jednotlivé hlasy.
            </li>
            <li>
              <strong>Účast</strong> — kdo se zúčastnil / odhlásil / nereagoval. Hráči si zde značí
              omluvu.
            </li>
          </ul>
        </Section>

        <Section title="Vytvoření a úprava události">
          <p>
            Formulář otevřeš tlačítkem <Tag color="sky">Nová událost</Tag> nebo klikem na den v
            kalendáři. Klíčová pole:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Název</strong> — pokud nevyplníš, použije se typ + datum (např. „Zápas
              12.5.").
            </li>
            <li>
              <strong>Typ</strong> — určuje barvu, ikony a další propojení (sestava/trénink).
            </li>
            <li>
              <strong>Začátek a Konec</strong> — datum a čas. Konec musí být po začátku.
            </li>
            <li>
              <strong>Tým</strong> — k jakému týmu událost patří. Hráči daného týmu ji uvidí.
            </li>
            <li>
              <strong>Místo</strong> — vyber z číselníku, nebo zaškrtni <em>nové místo</em> a zadej
              název; vytvoří se v číselníku míst.
            </li>
            <li>
              <strong>Popis</strong> — volitelné rozšíření (poznámky, soupeř, pokyny).
            </li>
          </ul>
        </Section>

        <Section title="Opakující se události">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Ve formuláři přepneš <Tag color="sky">↻ Opakování</Tag> a zvolíš frekvenci:
              <em> Denně</em>, <em>Týdně</em>, <em>Měsíčně</em>, <em>Ročně</em> (s libovolným
              intervalem — např. <em>každé 2 týdny</em>).
            </li>
            <li>
              Zadáš <strong>datum konce opakování</strong>. Vytvoří se série jednotlivých událostí.
            </li>
            <li>
              Při úpravě/smazání jedné události se zeptáme, jestli má změna platit jen pro
              <em> tuto konkrétní událost</em>, nebo pro <em>celou sérii</em>.
            </li>
          </ul>
        </Section>

        <Section title="Sdílení a oprávnění">
          <ul className="ml-4 list-disc space-y-1">
            <li>Vidět události a hodnotit je mohou všichni přihlášení uživatelé klubu.</li>
            <li>
              <strong>Hráči</strong> vidí události svého týmu a v detailu označují účast / omluvu /
              hodnocení.
            </li>
            <li>
              <strong>Trenér</strong> (Coach) může vytvářet a upravovat události svého týmu,
              exportovat výkaz své práce.
            </li>
            <li>
              <strong>HeadCoach / ClubAdmin / Admin</strong> mají plný přístup pro všechny týmy.
            </li>
            <li>
              <strong>Admin</strong> může navíc importovat události z iCal a hromadně mazat.
            </li>
          </ul>
        </Section>

        <Section title="Tipy">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Pro opakující se tréninkové bloky (např. úterý + čtvrtek) vytvoř událost s opakováním
              Týdně — ušetří ti to spoustu klikání.
            </li>
            <li>
              Před zápasem rovnou v detailu vytvoř <strong>sestavu</strong> — bude logicky propojená
              a hráči ji uvidí na svém týmu.
            </li>
            <li>
              Pokud potřebuješ rychle vyplnit kalendář ze stávajícího Google/Outlook rozvrhu, použij{' '}
              <Tag color="sky">Import iCal</Tag>.
            </li>
            <li>
              Trenér si přes <Tag color="sky">Výkaz</Tag> stáhne přehled odpracovaných hodin pro
              kluby, kde je to vyžadováno.
            </li>
            <li>
              Filtry sezony a týmu zůstanou nastavené i po opuštění stránky — vrátíš se přesně tam,
              kde jsi byl.
            </li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
