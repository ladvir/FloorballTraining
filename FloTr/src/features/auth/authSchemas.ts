import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Zadejte platný email'),
  password: z.string().min(1, 'Heslo je povinné'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
    confirmPassword: z.string().min(1, 'Potvrzení hesla je povinné'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Hesla se neshodují',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
