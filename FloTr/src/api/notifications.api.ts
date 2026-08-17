import { apiClient } from './axios'

export interface NotificationDto {
  id: number
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface PushSubscriptionPayload {
  endpoint: string
  p256dh: string
  auth: string
}

export const notificationsApi = {
  getAll: () => apiClient.get<NotificationDto[]>('/notifications').then((r) => r.data),
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markAsRead: (id: number) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  getVapidPublicKey: () =>
    apiClient.get<{ publicKey: string }>('/notifications/vapid-public-key').then((r) => r.data),
  pushSubscribe: (sub: PushSubscriptionPayload) =>
    apiClient.post('/notifications/push-subscribe', sub),
  pushUnsubscribe: (endpoint: string) =>
    apiClient.delete('/notifications/push-unsubscribe', { data: { endpoint } }),
}
