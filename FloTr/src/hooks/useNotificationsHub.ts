import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getAccessToken } from '../api/token'

export function useNotificationsHub() {
  const queryClient = useQueryClient()
  // Depend on user.id only: reconnect on login/logout, NOT on every refreshUser() call.
  // accessTokenFactory always reads the latest in-memory token, so refreshed tokens are
  // picked up automatically on the next reconnect without tearing down the connection.
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    if (!userId || !getAccessToken()) return

    // Suppress all SignalR internal log output — the "stopped during negotiation" noise
    // comes from React StrictMode's double-mount and is handled by the `stopped` flag.
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/api/hubs/notifications', {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build()

    connectionRef.current = connection
    let stopped = false

    connection.on('notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    })

    connection.on('appointment.changed', () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    connection.on('rating.created', () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
      queryClient.invalidateQueries({ queryKey: ['kpi'] })
    })

    connection.on('lineup.shared', () => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] })
    })

    connection.start().catch(() => {
      // Ignore: either cleanup ran first (StrictMode / userId change) or server-side
      // 401 — withAutomaticReconnect will retry when the connection is re-established.
      if (!stopped) {
        // Real failure (not cleanup): schedule a retry after 5 s so the connection
        // eventually recovers if the API was briefly unavailable.
        setTimeout(() => {
          if (!stopped && connection.state === signalR.HubConnectionState.Disconnected) {
            connection.start().catch(() => {})
          }
        }, 5000)
      }
    })

    return () => {
      stopped = true
      connectionRef.current = null
      connection.stop().catch(() => {})
    }
  }, [userId, queryClient])
}
