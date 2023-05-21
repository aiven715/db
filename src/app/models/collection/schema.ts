import { uuid } from '@automerge/automerge'
import z from 'zod'

export type CollectionEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string().default(() => uuid()),
  // createdAt: z.number().default(() => Date.now()),
  name: z.string(),
})
