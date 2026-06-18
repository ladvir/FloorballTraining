import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'

const features = [
  {
    icon: '🏒',
    title: 'Tréninky a aktivity',
    desc: 'Knihovna cvičení sdílená napříč klubem. Sestavte tréninkový plán za minuty.',
  },
  {
    icon: '✏️',
    title: 'Taktická tabule',
    desc: 'Kreslete rozestavení a pohyby hráčů přímo v aplikaci. Exportujte a sdílejte s týmem.',
  },
  {
    icon: '📊',
    title: 'Live statistiky',
    desc: 'Zapisujte události zápasu v reálném čase. Kompletní analýza po závěrečném hvizdu.',
  },
  {
    icon: '🧪',
    title: 'Fyzické testy',
    desc: 'Zaznamenávejte výkony a sledujte vývoj každého hráče v čase. Porovnejte testy napříč sezónami.',
  },
  {
    icon: '👥',
    title: 'Správa členů',
    desc: 'Kartotéka celého oddílu, import přes Excel, role a přístupová práva. Bez papírování.',
  },
  {
    icon: '📅',
    title: 'Termíny a turnaje',
    desc: 'Plánujte zápasy, tréninky i turnajový pavouk na jednom místě.',
  },
]

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-2xl font-bold tracking-tight text-sky-500">FloTr</span>
          <Link to="/login">
            <Button variant="primary" size="sm">
              Přihlásit se
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-slate-900 px-4 py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-400 ring-1 ring-sky-500/30">
            🏒 Platforma pro florbalové kluby
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Váš tým. Váš sport.
            <br />
            <span className="text-sky-400">Pod kontrolou.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl">
            FloTr propojuje trenéry, vedení a hráče v jedné platformě pro florbalové kluby.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/login">
              <Button size="lg" variant="primary">
                Přihlásit se
              </Button>
            </Link>
            <a
              href="#features"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 text-base font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Zjistit více
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-b border-gray-200 bg-white px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-10 text-center">
          {[
            { value: '6', label: 'modulů v jedné aplikaci' },
            { value: '∞', label: 'cvičení v knihovně' },
            { value: '100%', label: 'přizpůsobeno floorbalu' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-sky-500">{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="bg-[#f8fafc] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Co FloTr umí</h2>
            <p className="mt-3 text-gray-500">
              Vše, co potřebujete pro profesionální řízení florbalového klubu
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="transition-shadow hover:shadow-md">
                <CardContent className="py-6">
                  <div className="mb-3 text-3xl">{f.icon}</div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-sky-50 to-sky-100 px-4 py-20 text-center">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Připraveni začít?</h2>
          <p className="mb-8 text-lg text-gray-500">
            Přihlaste se a spravujte svůj florbalový klub efektivně.
          </p>
          <Link to="/login">
            <Button size="lg" variant="primary">
              Přihlásit se do FloTr
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row">
          <span>© 2025 FloTr</span>
          <Link to="/login" className="transition-colors hover:text-white">
            Přihlásit se
          </Link>
        </div>
      </footer>
    </div>
  )
}
