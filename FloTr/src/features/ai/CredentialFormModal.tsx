import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { aiApi } from '../../api/index'
import type { AiCredentialDto } from '../../types/domain.types'
import { AI_PROVIDERS } from './aiProviders'
import { toast } from '../../utils/toast'

const buildSchema = (t: TFunction, isEdit: boolean) =>
  z.object({
    name: z.string().trim().min(1, t('ai.nameRequired')).max(100),
    provider: z.number().int().min(0).max(2),
    model: z.string().trim().max(100).optional(),
    apiKey: isEdit
      ? z.string().trim().max(500).optional()
      : z.string().trim().min(1, t('ai.apiKeyRequired')).max(500),
  })

type FormData = z.infer<ReturnType<typeof buildSchema>>

interface CredentialFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** null = create a new credential */
  credential: AiCredentialDto | null
}

export function CredentialFormModal({ isOpen, onClose, credential }: CredentialFormModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEdit = credential != null
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string | null } | null>(
    null
  )

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(buildSchema(t, isEdit)),
    defaultValues: { name: '', provider: 0, model: '', apiKey: '' },
  })

  useEffect(() => {
    if (!isOpen) return
    setTestResult(null)
    reset({
      name: credential?.name ?? '',
      provider: credential?.provider ?? 0,
      model: credential?.model ?? '',
      apiKey: '',
    })
  }, [isOpen, credential, reset])

  const provider = Number(watch('provider'))
  const providerInfo = AI_PROVIDERS.find((p) => p.value === provider)

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit
        ? aiApi.updateCredential(credential.id, {
            name: data.name,
            model: data.model || null,
            apiKey: data.apiKey || null,
          })
        : aiApi.createCredential({
            name: data.name,
            provider: data.provider,
            apiKey: data.apiKey!,
            model: data.model || null,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-credentials'] })
      toast.success(t('ai.saved'))
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? t('ai.saveFailed'))
    },
  })

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const typedKey = watch('apiKey')?.trim()
      const result = typedKey
        ? await aiApi.validateKey(provider, typedKey)
        : isEdit
          ? await aiApi.validateCredential(credential.id)
          : { ok: false, message: t('ai.apiKeyRequired') }
      setTestResult(result)
      if (!typedKey && isEdit) queryClient.invalidateQueries({ queryKey: ['ai-credentials'] })
    } catch {
      setTestResult({ ok: false, message: t('ai.testFailed') })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('ai.editCredential') : t('ai.addCredential')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4 p-1">
        <Input label={t('ai.name')} error={errors.name?.message} {...register('name')} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('ai.provider')}</label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50"
            disabled={isEdit}
            {...register('provider', { valueAsNumber: true })}
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label={t('ai.model')}
            list="ai-model-suggestions"
            placeholder={providerInfo?.suggestedModels[0]}
            error={errors.model?.message}
            {...register('model')}
          />
          <datalist id="ai-model-suggestions">
            {providerInfo?.suggestedModels.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-gray-500">{t('ai.modelHint')}</p>
        </div>

        <div>
          <Input
            label={t('ai.apiKey')}
            type="password"
            autoComplete="off"
            placeholder={isEdit ? t('ai.apiKeyKeepHint') : providerInfo?.keyPlaceholder}
            error={errors.apiKey?.message}
            {...register('apiKey')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('ai.apiKeyStorageHint')}</p>
        </div>

        {testResult && (
          <p className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.ok ? t('ai.testOk') : (testResult.message ?? t('ai.testFailed'))}
          </p>
        )}

        <div className="flex justify-between gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleTest} loading={testing}>
            {t('ai.test')}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('ai.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
              {t('ai.save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
