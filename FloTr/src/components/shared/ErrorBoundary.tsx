import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import i18n from '../../i18n/index'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: { componentStack: string }) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-red-100 bg-red-50 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <div>
          <p className="text-sm font-semibold text-red-700">
            {i18n.t('shared.errorBoundaryTitle')}
          </p>
          <p className="mt-1 text-xs text-red-500">
            {this.state.error?.message ?? i18n.t('shared.unexpectedError')}
          </p>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          {i18n.t('shared.errorBoundaryReload')}
        </button>
      </div>
    )
  }
}
