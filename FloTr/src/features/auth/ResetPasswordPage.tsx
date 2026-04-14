import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth.api'

const schema = z
  .object({
    newPassword: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
    confirmPassword: z.string().min(1, 'Potvrzení hesla je povinné'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Hesla se neshodují',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const isValid = email && token

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      await authApi.resetPassword(email, token, data.newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: unknown } } }
      const msg = axiosErr.response?.data?.message
      setServerError(typeof msg === 'string' ? msg : 'Reset hesla se nezdařil. Odkaz mohl vypršet.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-500">FloTr</h1>
          <p className="mt-1 text-sm text-gray-500">Florbalový tréninkový systém</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Nové heslo</h2>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                Heslo bylo úspěšně změněno. Nyní se můžete přihlásit.
              </div>
              <Link
                to="/login"
                className="block text-center text-sm font-medium text-sky-500 hover:text-sky-600"
              >
                Přejít na přihlášení
              </Link>
            </div>
          ) : !isValid ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                Neplatný odkaz pro reset hesla. Zkontrolujte email nebo požádejte o nový odkaz.
              </div>
              <Link
                to="/forgot-password"
                className="block text-center text-sm font-medium text-sky-500 hover:text-sky-600"
              >
                Požádat o nový odkaz
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-gray-500">
                Nastavte nové heslo pro účet <span className="font-medium">{email}</span>.
              </p>

              {serverError && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Nové heslo"
                  type="password"
                  placeholder="min. 6 znaků"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <Input
                  label="Potvrzení hesla"
                  type="password"
                  placeholder="zopakujte heslo"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Nastavit nové heslo
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500">
                <Link to="/login" className="font-medium text-sky-500 hover:text-sky-600">
                  Zpět na přihlášení
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
