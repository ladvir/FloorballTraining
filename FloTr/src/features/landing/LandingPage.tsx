import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'

const features = [
  {
    icon: '🏒',
    title: 'Tréninky a aktivity',
    desc: 'Knihovna cvičení sdílená napříč klubem. Vytvářejte, plánujte a sdílejte tréninky',
  },
  {
    icon: '✏️',
    title: 'Taktická tabule',
    desc: 'Kreslete rozestavení a pohyby hráčů přímo v aplikaci.',
  },
  {
    icon: '📊',
    title: 'Live statistiky',
    desc: 'Zapisujte události zápasu v reálném čase.',
  },
  {
    icon: '🧪',
    title: 'Fyzické testy',
    desc: 'Zaznamenávejte výkony a sledujte vývoj každého hráče v čase.',
  },
  {
    icon: '👥',
    title: 'Správa členů',
    desc: 'Kartotéka celého oddílu',
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
      {/* Hero */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            <span className="text-sky-400">Flo</span>rbalový{' '}
            <span className="text-sky-400">Tr</span>énink
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl">
            propojuje trenéry, vedení a hráče na jednom místě
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/login">
              <Button size="lg" variant="primary">
                Přihlásit se
              </Button>
            </Link>
            <a
              href="#features"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-sky-400 px-6 text-base font-medium text-sky-400 transition-colors hover:border-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Zjistit více
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#f8fafc] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Co FloTr umí</h2>
            <p className="mt-3 text-gray-500">Vše, co potřebujete pro řízení florbalového klubu</p>
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
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Připraveni začít?</h2>
          <p className="mb-8 text-lg text-gray-500">
            Přihlaste se a spravujte svůj florbalový klub efektivně.
          </p>
          <Link to="/login">
            <Button size="lg" variant="primary">
              Přihlásit se
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
