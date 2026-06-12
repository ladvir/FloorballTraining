import { describe, it, expect } from 'vitest'
import { loginSchema, resetPasswordSchema } from './authSchemas'

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'coach@flotr.cz', password: 'secret' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'email')).toBe(true)
    }
  })

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'coach@flotr.cz', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords of sufficient length', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'abcdef',
      confirmPassword: 'abcdef',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a password shorter than 6 characters', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'abc',
      confirmPassword: 'abc',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords and points at confirmPassword', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'abcdef',
      confirmPassword: 'ghijkl',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'confirmPassword')).toBe(true)
    }
  })
})
