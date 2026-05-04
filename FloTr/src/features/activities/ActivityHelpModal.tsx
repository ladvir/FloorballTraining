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

export function ActivityHelpModal({ open, onClose }: Props) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Nápověda — aktivity" maxWidth="2xl">
      <div className="space-y-1">
        <p className="mb-4 text-sm text-gray-600">
          Aktivita je samostatné cvičení (např. rozcvička, herní průpravná situace), které pak skládáš
          do tréninků. Vyplň ji co nejúplněji — kvalitní popis, štítky a obrázky pomohou tobě
          i ostatním trenérům aktivitu rychle najít a použít.
        </p>

        <Section title="Hlavička stránky">
          <ul className="ml-4 list-disc space-y-1">
            <li><strong>Šipka vlevo</strong> — návrat na seznam aktivit. Pokud máš neuložené změny, zeptáme se.</li>
            <li><Tag color="sky">Vyber pro trénink</Tag> — přidá aktivitu do panelu pro skládání tréninku (viditelný v sekci Tréninky).</li>
            <li><Tag color="sky">PDF</Tag> — stáhne aktivitu jako PDF s volbou rozsahu (popis, obrázky, štítky…).</li>
            <li>
              Stavový štítek <Tag color="green">Kompletní</Tag> nebo <Tag color="amber">Rozpracovaná</Tag> —
              klikem spustíš validaci. Otevře se okno se seznamem chybějících údajů.
            </li>
            <li><Tag>Nápověda</Tag> otevře toto okno.</li>
          </ul>
        </Section>

        <Section title="1. Základní údaje">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Název aktivity</strong> (povinný, max. 50 znaků) — krátký a výstižný (např. „Nahrávky ve dvojicích",
              „Rondo 4 vs 2"). Podle něj se aktivita hledá v knihovně.
            </li>
            <li>
              <strong>Popis</strong> (nepovinný, max. 1000 znaků) — průběh cvičení, klíčové body, varianty.
              Piš v krocích, čtenář by měl umět cvičení provést bez další pomoci.
            </li>
          </ul>
        </Section>

        <Section title="2. Délka a počet hráčů">
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Délka min. / max.</strong> (v minutách) — odhadovaný rozsah, jak dlouho cvičení trvá.
              Při skládání tréninku se používá pro výpočet celkové délky.
            </li>
            <li>
              <strong>Hráčů min. / max.</strong> — pro kolik hráčů je aktivita vhodná.
              Pomáhá při filtrování („dnes mám jen 8 hráčů, co můžu udělat?").
            </li>
            <li className="text-xs text-gray-500">
              Min. nesmí být větší než max. — formulář to nepustí dál.
            </li>
          </ul>
        </Section>

        <Section title="3. Štítky">
          <p>
            Štítky kategorizují aktivitu podle typu (např. <em>nahrávka</em>, <em>střelba</em>, <em>obrana</em>,
            <em> přesilovka</em>). Klikem na štítek ho přidáš/odebereš. Můžeš jich vybrat víc.
          </p>
          <p className="text-xs text-gray-500">
            Štítky spravuje admin v sekci Štítky. Pokud potřebný štítek chybí, požádej admina o jeho přidání.
          </p>
        </Section>

        <Section title="4. Věkové kategorie">
          <p>
            Vyber, pro které kategorie je aktivita vhodná (přípravka, mladší žáci, dorost…).
            Můžeš zaškrtnout víc kategorií najednou.
          </p>
          <p className="text-xs text-gray-500">
            Když nezvolíš nic, automaticky se uloží jako <strong>Kdokoliv</strong> — vhodné pro univerzální cvičení.
          </p>
        </Section>

        <Section title="5. Pomůcky">
          <ul className="ml-4 list-disc space-y-1">
            <li>Klik na pomůcku ji přidá/odebere ze seznamu potřebných.</li>
            <li>
              <strong>Přidat novou pomůcku</strong> — pokud potřebnou pomůcku v seznamu nevidíš, napiš její název
              do pole pod štítky a klikni <Tag color="sky">Přidat</Tag>. Pomůcka se uloží do globálního číselníku
              a hned se přiřadí k aktivitě.
            </li>
          </ul>
        </Section>

        <Section title="6. Obrázky">
          <p>Obrázky lze přidat až po <strong>prvním uložení</strong> aktivity (musí existovat ID).</p>
          <ul className="ml-4 list-disc space-y-1">
            <li><Tag color="sky">Nahrát</Tag> — vlož foto/diagram z disku. Velké obrázky se automaticky zmenší na max. 1200 px.</li>
            <li><Tag color="sky">Kreslit</Tag> — otevře editor pro nakreslení vlastního schématu (hřiště, hráči, šipky).</li>
            <li>
              U každého obrázku najdeš ikony:
              <ul className="ml-5 mt-1 list-disc space-y-0.5 text-gray-600">
                <li><strong>Hvězdička</strong> — označí obrázek jako <em>náhledový</em>. Ten se zobrazí v přehledu aktivit a v PDF.</li>
                <li><strong>Tužka</strong> (jen u kreseb) — otevře kresbu zpět v editoru pro úpravy.</li>
                <li><strong>Koš</strong> — smaže obrázek.</li>
              </ul>
            </li>
            <li>Klikem na náhled obrázek otevřeš ve full-screen lightboxu.</li>
          </ul>
        </Section>

        <Section title="Validace — Kompletní vs. Rozpracovaná">
          <p>
            Po uložení můžeš spustit validaci klikem na stavový štítek. Aktivita je <Tag color="green">Kompletní</Tag>,
            když má všechny povinné údaje:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-gray-600">
            <li>vyplněný název, popis a délku</li>
            <li>alespoň jeden štítek</li>
            <li>alespoň jeden obrázek (foto nebo kresba)</li>
            <li>alespoň jednu věkovou kategorii (nebo „Kdokoliv")</li>
          </ul>
          <p className="mt-1 text-xs text-gray-500">
            <Tag color="amber">Rozpracovaná</Tag> aktivita zůstane viditelná jen tobě — ostatní trenéři ji v knihovně
            uvidí až po dokončení.
          </p>
        </Section>

        <Section title="Sdílení a oprávnění">
          <ul className="ml-4 list-disc space-y-1">
            <li>Aktivitu může <strong>upravovat</strong> její autor a admin. Ostatní si ji mohou jen zobrazit a použít v tréninku.</li>
            <li>Po dokončení a validaci je aktivita dostupná všem trenérům v knihovně aktivit.</li>
            <li>Při úpravě je vidět autor v hlavičce — pokud něco nesedí, oslovte ho přímo.</li>
          </ul>
        </Section>

        <Section title="Tipy">
          <ul className="ml-4 list-disc space-y-1">
            <li>Změny se ukládají až po klikutí na <Tag color="sky">Uložit aktivitu</Tag>. Pokud zavřeš stránku, zeptáme se na neuložené změny.</li>
            <li>Štítky a věkové kategorie pomáhají najít aktivitu při skládání tréninku — neskimprej je.</li>
            <li>Kvalitní popis + diagram = aktivita, kterou kolegové reálně použijí. Bez popisu ji ostatní trenéři v knihovně přeskočí.</li>
            <li>Pro rychlou tvorbu několika podobných aktivit duplikuj existující ze seznamu aktivit (vpravo na kartě).</li>
          </ul>
        </Section>
      </div>
    </Modal>
  )
}
