import { RouterProvider } from 'react-router-dom'
import {
  QueryClient,
  QueryClientProvider,
  type InvalidateQueryFilters,
  type InvalidateOptions,
  type QueryKey,
} from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

/**
 * Plain `invalidateQueries` defaults to `refetchType: 'active'`, which skips any
 * query whose observer isn't mounted at that exact instant — e.g. a list behind
 * a modal, or a calendar/dashboard view on another route. That's what made saves
 * from a dialog "not show up" until a full page reload, all across the app.
 * Force `'all'` here once, so every one of the ~40+ call sites gets it for free.
 */
class AppQueryClient extends QueryClient {
  invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: InvalidateQueryFilters<TTaggedQueryKey>,
    options?: InvalidateOptions
  ) {
    return super.invalidateQueries({ refetchType: 'all', ...filters }, options)
  }
}

const queryClient = new AppQueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton duration={4000} />
        <ConfirmDialog />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
