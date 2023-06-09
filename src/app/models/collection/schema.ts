import z from 'zod'

import { DeepPartial } from '~/library/types'

import { authDefaults, authWithInheritedSchema } from '../common/auth'
import { iconDefaults, iconSchema } from '../common/icon'

export type CollectionEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().trim(),
  orderKey: z.string(),
  icon: iconSchema,
  auth: authWithInheritedSchema,
})

export const defaults: DeepPartial<CollectionEntry> = {
  name: '',
  orderKey: 'a0',
  auth: authDefaults,
  icon: iconDefaults,
}
