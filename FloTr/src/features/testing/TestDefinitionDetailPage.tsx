import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2, ClipboardList } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { PageHeader } from '../../components/shared/PageHeader'
import { testDefinitionsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { TEST_TYPE_LABELS, TEST_CATEGORY_LABELS, GENDER_LABELS } from '../../types/domain.types'

export function TestDefinitionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin } = useAuthStore()

  const { data: test, isLoading } = useQuery({
    queryKey: ['testDefinition', id],
    queryFn: () => testDefinitionsApi.getById(Number(id)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => testDefinitionsApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testDefinitions'] })
      navigate('/testing')
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (!test) return <div className="text-sm text-gray-500">Test nenalezen.</div>

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={test.name}
        description={test.description ?? undefined}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/testing')}>
              <ArrowLeft className="h-4 w-4" /> Zpět
            </Button>
            <Link to={`/testing/${test.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" /> Upravit
              </Button>
            </Link>
            <Link to={`/testing/${test.id}/record`}>
              <Button size="sm">
                <ClipboardList className="h-4 w-4" /> Zadat výsledky
              </Button>
            </Link>
          </div>
        }
      />

      {/* Info */}
      <Card className="mb-4">
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <span className="text-xs text-gray-500">Typ</span>
              <p className="text-sm font-medium">{TEST_TYPE_LABELS[test.testType]}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Kategorie</span>
              <p className="text-sm font-medium">{TEST_CATEGORY_LABELS[test.category]}</p>
            </div>
            {test.unit && (
              <div>
                <span className="text-xs text-gray-500">Jednotka</span>
                <p className="text-sm font-medium">{test.unit}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500">Hodnocení</span>
              <p className="text-sm font-medium">{test.higherIsBetter ? 'Vyšší = lepší' : 'Nižší = lepší'}</p>
            </div>
          </div>
          {test.isTemplate && <Badge variant="info" className="mt-3">Šablona</Badge>}
        </CardContent>
      </Card>

      {/* Grade options */}
      {test.testType === 1 && test.gradeOptions.length > 0 && (
        <Card className="mb-4">
          <CardHeader><h2 className="text-sm font-semibold">Možnosti škály</h2></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {test.gradeOptions.map((g) => (
                <span key={g.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border border-gray-200"
                  style={g.colour ? { backgroundColor: g.colour + '20', borderColor: g.colour, color: g.colour } : undefined}
                >
                  {g.colour && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.colour }} />}
                  {g.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colour ranges */}
      {test.colourRanges.length > 0 && (
        <Card className="mb-4">
          <CardHeader><h2 className="text-sm font-semibold">Barevné rozsahy</h2></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4">Věk. kategorie</th>
                    <th className="pb-2 pr-4">Pohlaví</th>
                    <th className="pb-2 pr-4 text-green-600">Zelená</th>
                    <th className="pb-2 pr-4 text-yellow-600">Žlutá</th>
                    <th className="pb-2 text-red-600">Červená</th>
                  </tr>
                </thead>
                <tbody>
                  {test.colourRanges.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4">{r.ageGroupName ?? 'Všechny'}</td>
                      <td className="py-2 pr-4">{r.gender != null ? GENDER_LABELS[r.gender] : 'Všechna'}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-green-700">
                          {r.greenFrom} – {r.greenTo}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-yellow-700">
                          {r.yellowFrom} – {r.yellowTo}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-red-700">ostatní</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete */}
      {isAdmin && !test.isTemplate && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('Opravdu smazat tento test?')) deleteMutation.mutate()
            }}
            loading={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" /> Smazat test
          </Button>
        </div>
      )}
    </div>
  )
}
