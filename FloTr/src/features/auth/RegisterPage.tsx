import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  email: z.string().email('Zadejte platný email'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
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
      const response = await authApi.register(data)
      setUser(response)
      navigate('/')
    } catch (err: any) {
      const data = err.response?.data
      if (typeof data === 'string') {
        setServerError(data)
      } else if (Array.isArray(data)) {
        setServerError(data.join(', '))
      } else if (Array.isArray(data?.errors)) {
        setServerError(data.errors.join(', '))
      } else {
        setServerError('Registrace se nezdařila')
      }
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
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Registrace</h2>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Jméno" placeholder="Jan" {...register('firstName')} />
              <Input label="Příjmení" placeholder="Novák" {...register('lastName')} />
            </div>
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
              placeholder="min. 6 znaků"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Registrovat se
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Již máte účet?{' '}
            <Link to="/login" className="font-medium text-sky-500 hover:text-sky-600">
              Přihlásit se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
