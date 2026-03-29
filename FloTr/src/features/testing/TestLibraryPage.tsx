import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Plus, Download, Search, Beaker, Activity, Move3d, Brain, Shield, User } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { PageHeader } from '../../components/shared/PageHeader'
import { testDefinitionsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { TEST_TYPE_LABELS, TEST_CATEGORY_LABELS } from '../../types/domain.types'
import type { TestDefinitionDto } from '../../types/domain.types'

const categoryIcons: Record<number, typeof Activity> = {
  0: Activity,    // Conditioning
  1: Beaker,      // Technique
  2: Move3d,     // Flexibility
  3: Brain,       // Readiness
  4: Shield,      // Goalkeeper
  5: User,        // BasicInfo
}

const categoryBadgeVariant: Record<number, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  0: 'info', 1: 'success', 2: 'warning', 3: 'danger', 4: 'default', 5: 'default',
}

export function TestLibraryPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number>(-1)

  const clubId = user?.clubId

  const { data: tests, isLoading } = useQuery({
    queryKey: ['testDefinitions', clubId],
    queryFn: () => testDefinitionsApi.getAll({ clubId: clubId ?? undefined }),
  })

  const importMutation = useMutation({
    mutationFn: () => testDefinitionsApi.importTemplate(clubId!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['testDefinitions'] })
      alert(`Importováno: ${result.imported}, přeskočeno: ${result.skipped}`)
    },
  })

  const filtered = (tests ?? []).filter((t) => {
    if (categoryFilter >= 0 && t.category !== categoryFilter) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by category
  const grouped = filtered.reduce<Record<number, TestDefinitionDto[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Testování hráčů"
        description="Knihovna testů a správa výsledků"
        action={
          <div className="flex gap-2">
            {clubId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => importMutation.mutate()}
                loading={importMutation.isPending}
              >
                <Download className="h-4 w-4" />
                Importovat Florbal 2021
              </Button>
            )}
            <Link to="/testing/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nový test
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Hledat test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
        >
          <option value={-1}>Všechny kategorie</option>
          {Object.entries(TEST_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Žádné testy"
          description={tests?.length ? 'Žádné testy neodpovídají filtru.' : 'Začněte importem šablony nebo vytvořte vlastní test.'}
          action={
            clubId && !tests?.length ? (
              <Button variant="outline" onClick={() => importMutation.mutate()} loading={importMutation.isPending}>
                <Download className="h-4 w-4" />
                Importovat Florbal 2021
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([cat, catTests]) => {
              const Icon = categoryIcons[Number(cat)] ?? ClipboardCheck
              return (
                <div key={cat}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {TEST_CATEGORY_LABELS[Number(cat)]}
                    </h2>
                    <Badge size="sm">{catTests.length}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {catTests.map((test) => (
                      <TestCard key={test.id} test={test} />
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

function TestCard({ test }: { test: TestDefinitionDto }) {
  return (
    <Link to={`/testing/${test.id}`}>
      <Card className="hover:border-sky-200 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{test.name}</h3>
              {test.description && (
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{test.description}</p>
              )}
            </div>
            {test.isTemplate && <Badge size="sm" variant="info">Šablona</Badge>}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge size="sm" variant={categoryBadgeVariant[test.category]}>
              {TEST_TYPE_LABELS[test.testType]}
            </Badge>
            {test.unit && <span className="text-xs text-gray-400">{test.unit}</span>}
            {(test.resultCount ?? 0) > 0 && (
              <span className="text-xs text-gray-400 ml-auto">{test.resultCount} výsledků</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
