import z from 'zod'

import { DeepPartial } from '~/library/types'

import { iconDefaults, iconSchema } from '../common/icon'

export type SpaceEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string(),
  name: z.string().trim(),
  orderKey: z.string(),
  icon: iconSchema,
})

export const defaults: DeepPartial<SpaceEntry> = {
  name: '',
  icon: iconDefaults,
}
