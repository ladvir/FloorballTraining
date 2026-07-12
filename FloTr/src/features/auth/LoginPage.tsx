import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from './authSchemas'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { authApi } from '../../api/auth.api'
import { apiClient } from '../../api/axios'
import { setAccessToken } from '../../api/token'
import { useAuthStore } from '../../store/authStore'
import type { AuthResponse } from '../../types/domain.types'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  // Seed the error from a ?error= OAuth callback redirect once, during render,
  // rather than via a setState-in-effect (which triggers cascading renders).
  const [serverError, setServerError] = useState<string | null>(() =>
    searchParams.get('error') ? t('auth.externalLoginFailed') : null
  )

  // Handle ?token= redirect from external OAuth callback
  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) return

    setAccessToken(token)
    apiClient
      .get<AuthResponse>('/auth/me')
      .then((r) => {
        setUser(r.data)
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        setServerError(t('auth.externalLoginFailed'))
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch available social providers
  const { data: providers } = useQuery({
    queryKey: ['auth-providers'],
    queryFn: () =>
      apiClient.get<{ google: boolean; microsoft: boolean }>('/auth/providers').then((r) => r.data),
    staleTime: Infinity,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    try {
      const response = await authApi.login(data)
      setUser(response)
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      navigate('/dashboard')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } }
      if (axiosErr.response?.status === 429) {
        setServerError(t('auth.tooManyAttempts'))
        return
      }
      const data = axiosErr.response?.data
      setServerError(typeof data === 'string' && data ? data : t('auth.invalidCredentials'))
    }
  }

  const showSocialLogin = providers?.google || providers?.microsoft

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-500">FloTr</h1>
          <p className="mt-1 text-sm text-gray-500">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">{t('auth.loginTitle')}</h2>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="vas@email.cz"
              error={errors.email?.message}
              {...register('email')}
            />
            <PasswordInput
              label={t('auth.password')}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              {t('auth.login')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            <Link to="/forgot-password" className="font-medium text-sky-500 hover:text-sky-600">
              {t('auth.forgotPassword')}
            </Link>
          </p>

          {/* Social login */}
          {showSocialLogin && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">{t('auth.orDivider')}</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <div className="space-y-2">
                {providers?.google && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/auth/external/google'
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t('auth.loginWithGoogle')}
                  </button>
                )}
                {providers?.microsoft && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/auth/external/microsoft'
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 21 21">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                    {t('auth.loginWithMicrosoft')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
