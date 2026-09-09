import { apiClient } from './axios'

export const notificationsApi = {
  // Register this install's Expo push token so the backend can reach it (EventRsvpReminderJob et al.).
  registerDevice: (token: string) => apiClient.post('/notifications/register-device', { token }),
  // Called on logout so a shared device stops getting the previous user's pushes.
  unregisterDevice: (token: string) =>
    apiClient.delete('/notifications/unregister-device', { data: { token } }),
}
