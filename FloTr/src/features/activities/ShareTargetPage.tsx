import { Navigate, useSearchParams } from 'react-router-dom'
import { cleanSharedUrl, extractSharedUrl, savePendingShare } from './sharedLink'

/**
 * Landing route of the PWA share target (`share_target.action` in vite.config.ts).
 * Public on purpose: it only stashes the shared link in sessionStorage and moves on, so a
 * share made while signed out survives the login page (LoginPage resumes it).
 */
export function ShareTargetPage() {
  const [params] = useSearchParams()
  const raw = extractSharedUrl(params)

  if (raw) {
    let url = raw
    try {
      url = cleanSharedUrl(raw)
    } catch {
      /* keep raw — ActivityFromLinkPage validates and reports it */
    }
    savePendingShare({ url, text: params.get('text') ?? params.get('title') ?? undefined })
  }

  // Without a link the target page simply offers the paste field.
  return <Navigate to="/activities/from-link" replace />
}
