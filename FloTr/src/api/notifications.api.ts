import { apiClient } from './axios'

export interface NotificationDto {
  id: number
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export const notificationsApi = {
  getAll: () =>
    apiClient.get<NotificationDto[]>('/notifications').then((r) => r.data),
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markAsRead: (id: number) =>
    apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    apiClient.put('/notifications/read-all'),
}
