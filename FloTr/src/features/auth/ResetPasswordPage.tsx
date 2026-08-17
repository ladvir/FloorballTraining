import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordFormData } from './authSchemas'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth.api'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) })

  const isValid = email && token

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null)
    try {
      await authApi.resetPassword(email, token, data.newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: unknown } } }
      const msg = axiosErr.response?.data?.message
      setServerError(typeof msg === 'string' ? msg : t('auth.invalidResetLink'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-500">{t('landing.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('landing.subtitle')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            {t('auth.resetPasswordTitle')}
          </h2>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {t('auth.passwordResetSuccess')}
              </div>
              <Link
                to="/login"
                className="block text-center text-sm font-medium text-sky-500 hover:text-sky-600"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : !isValid ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {t('auth.invalidResetLink')}
              </div>
              <Link
                to="/forgot-password"
                className="block text-center text-sm font-medium text-sky-500 hover:text-sky-600"
              >
                {t('auth.sendResetLink')}
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-gray-500">
                {t('auth.resetPasswordTitle')} <span className="font-medium">{email}</span>.
              </p>

              {serverError && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('auth.newPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('auth.minPasswordChars')}
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <Input
                  label={t('auth.confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('auth.repeatPassword')}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  {isSubmitting ? t('auth.resettingPassword') : t('auth.resetPassword')}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500">
                <Link to="/login" className="font-medium text-sky-500 hover:text-sky-600">
                  {t('auth.backToLogin')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
