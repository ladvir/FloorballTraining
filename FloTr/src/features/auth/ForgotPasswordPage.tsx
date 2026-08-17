import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth.api'

const schema = z.object({
  email: z.string().email('Zadejte platný email'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      setServerError(t('auth.forgotPasswordSubtitle'))
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
            {t('auth.forgotPasswordTitle')}
          </h2>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {t('auth.resetEmailSent')}
              </div>
              <Link
                to="/login"
                className="block text-center text-sm font-medium text-sky-500 hover:text-sky-600"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-gray-500">{t('auth.forgotPasswordSubtitle')}</p>

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
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  {isSubmitting ? t('auth.sending') : t('auth.sendResetLink')}
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
