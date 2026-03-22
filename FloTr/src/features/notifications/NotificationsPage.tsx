import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Bell, CheckCheck, UserPlus } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { notificationsApi, type NotificationDto } from '../../api/notifications.api'

const typeIcons: Record<string, typeof Bell> = {
  NewUserRegistered: UserPlus,
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationDto
  onMarkRead: () => void
}) {
  const Icon = typeIcons[notification.type] ?? Bell
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: cs,
  })

  return (
    <div
      onClick={() => { if (!notification.isRead) onMarkRead() }}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
        notification.isRead
          ? 'border-gray-100 bg-white'
          : 'border-sky-200 bg-sky-50 cursor-pointer hover:bg-sky-100'
      }`}
    >
      <div className={`mt-0.5 rounded-lg p-2 ${notification.isRead ? 'bg-gray-100 text-gray-400' : 'bg-sky-100 text-sky-600'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-sky-500 flex-shrink-0" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{notification.message}</p>
        <p className="mt-1 text-xs text-gray-400">{timeAgo}</p>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const hasUnread = notifications?.some((n) => !n.isRead)

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Upozornění"
        description="Přehled upozornění a oznámení"
        action={
          hasUnread ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Označit vše jako přečtené
            </Button>
          ) : undefined
        }
      />

      {!notifications?.length ? (
        <EmptyState
          title="Žádná upozornění"
          description="Zatím nemáte žádná upozornění."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={() => markReadMutation.mutate(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
