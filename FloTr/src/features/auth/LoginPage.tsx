import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  email: z.string().email('Zadejte platný email'),
  password: z.string().min(1, 'Heslo je povinné'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const response = await authApi.login(data)
      setUser(response)
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      navigate('/')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown } }
      const msg = axiosErr.response?.data ?? 'Přihlášení se nezdařilo'
      setServerError(typeof msg === 'string' ? msg : 'Neplatné přihlašovací údaje')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sky-500">FloTr</h1>
          <p className="mt-1 text-sm text-gray-500">Florbalový tréninkový systém</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Přihlášení</h2>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="vas@email.cz"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Heslo"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Přihlásit se
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            <a href="/forgot-password" className="font-medium text-sky-500 hover:text-sky-600">
              Zapomněli jste heslo?
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
