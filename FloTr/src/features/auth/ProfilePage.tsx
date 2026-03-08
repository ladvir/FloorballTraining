import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'

export function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div>
      <PageHeader title="Profil" />
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-xl font-semibold text-sky-600">
              {(user?.firstName ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Role</p>
              <div className="mt-1 flex gap-2">
                {user?.roles.map((role) => (
                  <Badge key={role} variant={role === 'Admin' ? 'info' : 'default'}>
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
