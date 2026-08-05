import { z } from 'zod'

// Team settings schema, shared by the create page (TeamFormPage) and the edit-in-place modal
// (TeamSettingsModal). Kept in its own module so the component file stays component-only.
export const buildTeamSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().min(1, t('teams.nameRequired')),
    ageGroupId: z.coerce
      .number({ error: t('teams.ageGroupRequired') })
      .min(1, t('teams.ageGroupRequired')),
    clubId: z.coerce
      .number({ error: t('validation.clubRequired') })
      .min(1, t('validation.clubRequired')),
    seasonId: z.coerce.number().optional().or(z.literal('')),
    personsMin: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
    personsMax: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
    defaultTrainingDuration: z.coerce.number().min(1).max(240).optional().or(z.literal('')),
    maxTrainingDuration: z.coerce.number().min(1).max(240).optional().or(z.literal('')),
    maxTrainingPartDuration: z.coerce.number().min(1).max(120).optional().or(z.literal('')),
    minPartsDurationPercent: z.coerce.number().min(1).max(100).optional().or(z.literal('')),
    iCalUrl: z.string().url(t('validation.email')).optional().or(z.literal('')),
  })

export type TeamFormData = z.infer<ReturnType<typeof buildTeamSchema>>
