import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { guardianRequestsApi } from '../../api/index'

const schema = z.object({
  email: z.string().email('Zadejte platný email'),
  code: z.string().min(1, 'Zadejte kód od trenéra'),
})

type FormData = z.infer<typeof schema>

/**
 * Public self-service page (#113): a parent identifies their child via the coach-issued
 * invite code and files a guardian link request. A coach approves it from the dashboard.
 */
export function GuardianLinkRequestPage() {
  const { t, i18n } = useTranslation()
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
      await guardianRequestsApi.create({
        email: data.email.trim(),
        code: data.code.trim(),
        language: i18n.language,
      })
      setSent(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setServerError(axiosErr.response?.data?.message ?? t('auth.guardianLinkRequestFailed'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-500">FloTr</h1>
          <p className="mt-1 text-sm text-gray-500">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            {t('auth.guardianLinkRequestTitle')}
          </h2>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {t('auth.guardianLinkRequestSent')}
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
              <p className="mb-6 text-sm text-gray-500">{t('auth.guardianLinkRequestSubtitle')}</p>

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
                <Input
                  label={t('auth.guardianLinkRequestCode')}
                  placeholder="a1b2c3d4..."
                  error={errors.code?.message}
                  {...register('code')}
                />
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  {t('auth.guardianLinkRequestSubmit')}
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
